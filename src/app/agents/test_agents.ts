import z from "zod";
import { createAgent, tool } from "langchain";
import { ChatOpenAI } from "@langchain/openai";
import dotenv from "dotenv";

// 加载 .env.local 文件
dotenv.config({ path: ".env.local" });

const getWeather = tool(
  async ({ city }) => {
    return `The weather in ${city} is always sunny!`;
  },
  {
    name: "getWeather",
    description: "Get weather for a given city.",
    schema: z.object({
      city: z.string(),
    }),
  }
);

const model = new ChatOpenAI({
  model: "qwen-plus",
  apiKey: process.env.OPENAI_QWEN_API_KEY,
  configuration: {
    baseURL: process.env.OPENAI_QWEN_BASE_URL,
  },
  maxTokens: 2000,
  temperature: 0.3,
  streaming: true,
});

const agent = createAgent({
  model: model,
  tools: [getWeather],
});

async function testAgent() {
  for await (const chunk of await agent.stream(
    { messages: [{ role: "user", content: "what is the weather in sf" }] },
    { streamMode: "values" }
  )) {
    const [step, content] = Object.entries(chunk)[0];
    console.log(`step: ${step}`);
    console.log(`content: ${JSON.stringify(content, null, 2)}`);
  }
  // const response = await agent.invoke({ messages: "武汉天气怎么样" });
  // console.log(response);
}

testAgent();
