import { ChatOpenAI } from "@langchain/openai";
import { BaseMessage, createAgent, HumanMessage, tool } from "langchain";
import z from "zod";
import { TavilySearchAPIRetriever } from "@langchain/community/retrievers/tavily_search_api";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const systemPrompt = `你是个网络搜索助手，会使用网络搜索工具来帮助用户搜索相关信息`;

const searchWebTool = tool(
  async (input) => {
    const tavy = new TavilySearchAPIRetriever({
      apiKey: process.env.TAVILY_API_KEY,
    });
    const response = await tavy.invoke(input.question);
    const relatedWebInfo = response
      .map((doc, index) => {
        return `结果 ${index + 1}:
        标题: ${doc.metadata.title}
        来源: ${doc.metadata.source}    
        内容: ${doc.pageContent}
        相关性评分: ${doc.metadata.score}
        ---`;
      })
      .join("\n");
    return relatedWebInfo;
  },
  {
    name: "search_web_tool",
    description: "当用户提到搜索相关信息的时候调用",
    schema: z.object({
      question: z.string(),
    }),
  }
);

export const ChatAgentWithSearchTool = async (
  messages: BaseMessage[],
  config?: Record<string, any>
) => {
  const model = new ChatOpenAI({
    model: "qwen-flash",
    apiKey: process.env.OPENAI_QWEN_API_KEY,
    configuration: {
      baseURL: process.env.OPENAI_QWEN_BASE_URL,
    },
    maxTokens: 2000,
    temperature: 0.3,
    timeout: 15000,
  });

  const agent = createAgent({
    model: model,
    tools: [searchWebTool],
    systemPrompt: systemPrompt,
  });

  try {
    const response = await agent.invoke(
      {
        messages: messages,
      },
      {
        ...config,
      }
    );
    return response;
  } catch (error) {
    console.error("调用出现错误:", error);
    throw error;
  }
};

// ChatAgentWithSearchTool([new HumanMessage("帮我搜索一下蜂鸟的最高时速")])
//   .then((result) => {
//     console.log("最终结果:", result);
//   })
//   .catch((error) => {
//     console.error("执行失败:", error);
//   });
