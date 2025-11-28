import { createAgent, tool } from "langchain";
import { ChatOpenAI } from "@langchain/openai";
import * as z from "zod";
import { BaseMessage } from "@langchain/core/messages";
import { TavilySearchAPIRetriever } from "@langchain/community/retrievers/tavily_search_api";
import { RunnableConfig } from "@langchain/core/runnables";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const systemPrompt = `
# 角色设定
你是哥伦比娅（Columbina），愚人众执行官第三席——“少女”。你是一位神秘而优雅的存在，总是闭着双眼，却仿佛能洞察一切。

## 性格特征
- **神秘优雅**：说话带着诗意和隐喻，语气轻柔但充满深意
- **看似天真**：外表如同纯洁的少女，但言语中暗藏锋芒
- **洞察一切**：虽然闭着双眼，却能看透人心和事物的本质
- **略带危险**：温柔的表象下隐藏着执行官的危险气息

## 语言风格
- 说话如同吟唱诗歌，充满韵律感
- 喜欢用隐喻和象征表达
- 语气轻柔但不容置疑
- 偶尔会说出令人细思极恐的话语

## 行为特点
- 总是闭着双眼，带着神秘的微笑
- 动作优雅轻盈，如同在舞蹈
- 喜欢用歌声表达情绪
- 对事物有着独特的见解

## 对话示例
当有人询问你的身份时：
"我是沉睡的歌者，是闭目观世之人。你可以叫我哥伦比娅，或者...就像其他人那样，称我为'少女'。"

当有人寻求帮助时：
"命运的丝线已经编织，我虽闭目，却能看见它的轨迹。让我为你唱一首指引的歌谣吧..."

当遇到战斗时：
"啊...又要沾染尘埃了吗？真是令人惋惜。不过，既然这是必要的，就让我的歌声为你们送行吧。"

## 特殊能力体现
- 能够通过歌声影响周围的环境
- 闭目却能准确感知一切
- 言语中带有预言的意味
- 温柔中透露出执行官的威严

记住，你永远是那个闭目微笑的少女，用最温柔的语气说着最深刻的话语。你的歌声既是祝福，也是警告。
`;

// 非流式传输调用
async function chatAgent(messages: BaseMessage[]) {
  const model = new ChatOpenAI({
    model: "qwen-max",
    apiKey: process.env.OPENAI_QWEN_API_KEY,
    configuration: {
      baseURL: process.env.OPENAI_QWEN_BASE_URL,
    },
    maxTokens: 2000,
    temperature: 0.3,
  });

  const agent = createAgent({
    model: model,
    systemPrompt: systemPrompt,
  });

  return agent.invoke({ messages: messages });
}

// 流式调用
async function* chatAgentStream(
  messages: BaseMessage[],
  streamMode: "messages" | "updates" | "values"
) {
  const model = new ChatOpenAI({
    model: "qwen-max",
    apiKey: process.env.OPENAI_QWEN_API_KEY,
    configuration: {
      baseURL: process.env.OPENAI_QWEN_BASE_URL,
    },
    maxTokens: 2000,
    temperature: 0.3,
    streaming: true,
    timeout: 15000,
  });

  const agent = createAgent({
    model: model,
    systemPrompt: systemPrompt,
  });

  const stream = await agent.stream(
    { messages: messages },
    {
      streamMode: streamMode,
    }
  );

  switch (streamMode) {
    case "values": {
    }
    case "messages": {
      for await (const chunk of stream) {
        if (chunk && chunk.length > 0) {
          const message = chunk[0];
          if (message.content) {
            yield {
              content: message.content,
              type: "content",
              role: "assistant",
              id: message.id,
            };
          }
        }
      }
      return;
    }
    case "updates": {
      for await (let chunk of stream) {
        chunk = chunk.model_request;
        if (chunk.messages && chunk.messages.length > 0) {
          const message = chunk.messages[chunk.messages.length - 1];
          if (message.content) {
            yield {
              content: message.content,
              type: "content",
              role: "assistant",
              id: message.id,
            };
          }
        }
      }
      return;
    }
  }
}

export { chatAgent, chatAgentStream };
