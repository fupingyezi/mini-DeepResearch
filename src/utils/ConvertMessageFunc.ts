import { AIMessage, HumanMessage, type BaseMessage } from "langchain";
import { ChatMessageType } from "@/types";

const ConvertRawMessagesToLangChainMessage = (message: ChatMessageType) => {
  if (message.role === "assistant") {
    return new AIMessage(message.content);
  } else {
    return new HumanMessage(message.content);
  }
};

const ConvertLangChainMessageToRoleMessage = (message: BaseMessage) => {
  if (message._getType() === "ai") {
    return { role: "assistant", content: message.content };
  } else if (message._getType() === "human") {
    return { role: "user", content: message.content };
  }
};

export {
  ConvertLangChainMessageToRoleMessage,
  ConvertRawMessagesToLangChainMessage,
};
