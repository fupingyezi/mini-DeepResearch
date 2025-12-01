import z from "zod";
import { Annotation, StateGraph, START, END } from "@langchain/langgraph";
import { createAgent, tool } from "langchain";
import { ChatOpenAI } from "@langchain/openai";
import { TavilySearchAPIRetriever } from "@langchain/community/retrievers/tavily_search_api";
import { BaseMessage, HumanMessage, AIMessage } from "langchain";
import type { taskType } from "@/types";
import { getCheckpointer } from "@/lib";

import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const StateAnnotation = Annotation.Root({
  input: Annotation<string>(),
  messages: Annotation<BaseMessage[]>({
    reducer: (x, y) => x.concat(y),
  }),
  tasks: Annotation<taskType[]>({
    reducer: (old, update) => {
      const map = new Map((old || []).map((t) => [t.id, t]));
      for (const t of update || []) {
        map.set(t.id, { ...map.get(t.id), ...t });
      }
      return Array.from(map.values());
    },
  }),
  currentTaskIndex: Annotation<number>({
    value: (_, update) => update,
    default: () => 0,
  }),
  summary: Annotation<string>(),
});

export function supervisorAgent(state: typeof StateAnnotation.State): string {
  const { tasks, currentTaskIndex, summary } = state;

  if (!tasks || tasks.length === 0) {
    return "taskDecomposerAgent";
  }

  const allProcessed = tasks.every((t) => t.status === "processed");
  if (allProcessed) {
    if (!summary) {
      return "summaryAgent";
    }
    return "__end__";
  }

  const currentTask = tasks[currentTaskIndex];
  if (!currentTask) {
    return "__end__";
  }

  if (currentTask.status === "pending") {
    return currentTask.needSearch ? "searchAgent" : "infoHandleAgent";
  } else if (currentTask.status === "searched") {
    return "infoHandleAgent";
  } else if (currentTask.status === "processed") {
    return "advanceToNextTask";
  }

  return "__end__";
}

async function advanceToNextTask(state: typeof StateAnnotation.State) {
  return {
    currentTaskIndex: Math.min(state.currentTaskIndex + 1, state.tasks.length),
  };
}
async function taskDecomposerAgent(state: typeof StateAnnotation.State) {
  const model = new ChatOpenAI({
    model: "qwen-flash",
    apiKey: process.env.OPENAI_QWEN_API_KEY,
    configuration: {
      baseURL: process.env.OPENAI_QWEN_BASE_URL,
    },
    maxTokens: 2000,
    temperature: 0.3,
  });

  const systemPrompt = `你是一位科研项目规划专家，负责将用户的复杂研究主题转化为一份结构严谨、逻辑递进、可执行的**深度研究大纲**。

请遵循以下原则：
1. **分阶段设计**：从基础知识准备 → 核心理论理解 → 前沿/应用拓展，体现认知递进
2. **每个子任务必须是原子研究单元**：目标明确、可独立完成、产出可评估（如“掌握...”、“推导...”、“分析...”）
3. **判断是否需要外部信息**：仅当涉及最新进展、实验证据、权威数据或非公开教材内容时，才标记 needSearch=true
4. **避免重复或模糊表述**：如“了解相关背景”应具体为“梳理广义相对论的历史发展脉络”
5. **任务数量控制在 4~7 个**，覆盖完整研究链条

用户的研究主题是：「${state.input}」

请严格按照以下 JSON Schema 输出，不要包含任何额外文本、解释或 Markdown：

{
  "task": [
    {
      "id": "唯一ID（如 step_1）",
      "description": "具体、动词开头的研究任务描述（例如：'推导爱因斯坦场方程的真空解'）",
      "needSearch": true 或 false
    }
  ]
}`;

  const agent = createAgent({
    model: model,
    systemPrompt: systemPrompt,
  });

  const response = await agent.invoke({ messages: state.input });
  const lastMessage = response.messages[response.messages.length - 1];
  const content =
    typeof lastMessage.content === "string" ? lastMessage.content : "";

  function extractJsonFromMarkdown(content: string): any {
    const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/);
    if (jsonMatch?.[1]) {
      try {
        return JSON.parse(jsonMatch[1].trim());
      } catch (e) {
        console.error("JSON 解析失败（Markdown）:", e);
      }
    }
    try {
      return JSON.parse(content);
    } catch (e) {
      console.error("直接 JSON 解析失败:", e);
      return null;
    }
  }

  const parsedData = extractJsonFromMarkdown(content);
  if (parsedData?.task) {
    const tasks: taskType[] = parsedData.task.map(
      (t: { id: string; description: string; needSearch: boolean }) => ({
        ...t,
        status: "pending" as const,
      })
    );
    console.log("✅ 拆解出任务:", tasks);
    return {
      tasks,
      currentTaskIndex: 0, // 显式重置索引
    };
  } else {
    console.error("❌ 无法解析任务");
    return { tasks: [], currentTaskIndex: 0 };
  }
}

async function searchAgent(state: typeof StateAnnotation.State) {
  const { tasks, currentTaskIndex } = state;
  const currentTask = tasks[currentTaskIndex];

  if (
    !currentTask ||
    currentTask.status !== "pending" ||
    !currentTask.needSearch
  ) {
    console.warn("⚠️ searchAgent 被错误调用，跳过");
    return {};
  }

  const searchWebTool = tool(
    async (input) => {
      const retriever = new TavilySearchAPIRetriever({
        apiKey: process.env.TAVILY_API_KEY!,
      });
      const docs = await retriever.invoke(input.question);
      return docs
        .map(
          (doc, i) =>
            `结果 ${i + 1}:\n标题: ${doc.metadata.title}\n来源: ${
              doc.metadata.source
            }\n内容: ${doc.pageContent}\n---`
        )
        .join("\n");
    },
    {
      name: "search_web_tool",
      description: "执行网络搜索",
      schema: z.object({ question: z.string() }),
    }
  );

  const model = new ChatOpenAI({
    model: "qwen-flash",
    apiKey: process.env.OPENAI_QWEN_API_KEY,
    configuration: { baseURL: process.env.OPENAI_QWEN_BASE_URL },
    maxTokens: 2000,
    temperature: 0.3,
    timeout: 15000,
  });

  const agent = createAgent({
    model,
    tools: [searchWebTool],
    systemPrompt: `你是一个精准信息检索专家。根据任务描述生成一个简洁、明确的搜索问题，并使用 search_web_tool 获取信息。不要编造答案。`,
  });

  console.log(`🔍 正在搜索任务: ${currentTask.description}`);
  const response = await agent.invoke({
    messages: [{ role: "user", content: currentTask.description }],
  });

  const finalResult = response.messages[response.messages.length - 1]
    .content as string;
  console.log("✅ 搜索完成");

  return {
    tasks: [
      {
        ...currentTask,
        status: "searched" as const,
        searchResult: finalResult,
      },
    ],
  };
}

async function infoHandleAgent(state: typeof StateAnnotation.State) {
  const { tasks, currentTaskIndex, input } = state;
  const currentTask = tasks[currentTaskIndex];

  if (
    !currentTask ||
    (!(currentTask.status === "pending" && !currentTask.needSearch) &&
      currentTask.status !== "searched")
  ) {
    console.warn("⚠️ infoHandleAgent 被错误调用，跳过");
    return {};
  }

  const model = new ChatOpenAI({
    model: "qwen-flash",
    apiKey: process.env.OPENAI_QWEN_API_KEY,
    configuration: { baseURL: process.env.OPENAI_QWEN_BASE_URL },
    maxTokens: 2000,
    temperature: 0.3,
  });

  const context = currentTask.searchResult || "";
  const systemPrompt = `你是一个严谨的信息分析师。基于原始问题「${input}」和任务描述，对以下输入进行结构化处理：
- 若无需搜索：直接逻辑推导
- 若已搜索：结合 context 提取关键事实，注明来源
要求：禁止虚构；若无相关信息，说明“未找到”；输出简洁中文段落，无格式。`;

  const agent = createAgent({ model, systemPrompt });

  const userMessage = `任务: ${currentTask.description}\n上下文: ${context}`;
  const response = await agent.invoke({ messages: userMessage });
  const finalResult = response.messages[response.messages.length - 1]
    .content as string;

  console.log(`✅ 任务 "${currentTask.description}" 处理完成`);

  return {
    tasks: [
      {
        ...currentTask,
        status: "processed" as const,
        result: [finalResult],
      },
    ],
  };
}

async function summaryAgent(state: typeof StateAnnotation.State) {
  const allDone = state.tasks.every((t) => t.status === "processed");
  if (!allDone) return { summary: "" };

  const model = new ChatOpenAI({
    model: "qwen-flash",
    apiKey: process.env.OPENAI_QWEN_API_KEY,
    configuration: { baseURL: process.env.OPENAI_QWEN_BASE_URL },
    maxTokens: 2000,
    temperature: 0.3,
  });

  const systemPrompt = `你是高级研究报告撰写专家。原始问题：「${state.input}」
请将所有子任务结果整合成一份完整、连贯、有逻辑的最终回答。
要求：
1. 开篇直接回应核心问题
2. 按逻辑顺序组织（背景→发现→结论）
3. 所有结论必须有子任务支撑
4. 若某些任务无有效信息，说明“相关信息暂未获取”
5. 语言专业、简洁、口语化
仅输出正文，不要引导语。`;

  const agent = createAgent({ model, systemPrompt });

  const results = state.tasks
    .map((t) => t.result?.[0] || "")
    .filter(Boolean)
    .join("\n\n");
  const response = await agent.invoke({ messages: `汇总信息：${results}` });
  const summary = response.messages[response.messages.length - 1]
    .content as string;

  return { summary };
}

async function createDeepResearchWorkflow() {
  const checkpointer = await getCheckpointer();

  const workflow = new StateGraph(StateAnnotation)
    .addNode("supervisorAgent", () => ({}))
    .addNode("taskDecomposerAgent", taskDecomposerAgent)
    .addNode("searchAgent", searchAgent)
    .addNode("infoHandleAgent", infoHandleAgent)
    .addNode("summaryAgent", summaryAgent)
    .addNode("advanceToNextTask", advanceToNextTask) // 👈 新增节点

    .addEdge(START, "supervisorAgent")

    .addConditionalEdges("supervisorAgent", supervisorAgent, {
      taskDecomposerAgent: "taskDecomposerAgent",
      searchAgent: "searchAgent",
      infoHandleAgent: "infoHandleAgent",
      summaryAgent: "summaryAgent",
      advanceToNextTask: "advanceToNextTask",
      __end__: END,
    })

    .addEdge("taskDecomposerAgent", "supervisorAgent")
    .addEdge("searchAgent", "supervisorAgent")
    .addEdge("infoHandleAgent", "supervisorAgent")
    .addEdge("summaryAgent", "supervisorAgent")
    .addEdge("advanceToNextTask", "supervisorAgent")

    .compile({ checkpointer });

  return workflow;
}

export { createDeepResearchWorkflow };
