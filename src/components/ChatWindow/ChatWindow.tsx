"use client";

import { ChatLayoutProps, ChatWindowProps, ChatMessageType } from "@/types";
import React, { useState, useCallback } from "react";
import ChatMessage from "./ChatMessage";
import ChatInput from "./ChatInput";

const ChatLayout: React.FC<ChatLayoutProps> = ({ content, footer }) => {
  return (
    <div className="h-screen flex-1 flex flex-col pb-8">
      <div className="flex-1 overflow-y-auto scrollbar-hide p-4">{content}</div>
      <div className="shrink-0 bg-white">{footer}</div>
    </div>
  );
};

const ChatWindow: React.FC<ChatWindowProps> = ({
  emptyStateComponent,
  placeholder,
  className,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [shouldAutoScroll, setShouldAutoScroll] = useState<boolean>(true);
  const [messages, setMessages] = useState<ChatMessageType[]>([]);

  const handleChangeScroll = useCallback((shouldAutoScroll: boolean) => {
    setShouldAutoScroll(shouldAutoScroll);
  }, []);

  const sendMessage = async (inputValue: string) => {
    if (inputValue === "") return;

    setIsLoading(true);
    const newUserMessage: ChatMessageType = {
      role: "user",
      content: inputValue,
    };

    const assistantMessageId = `msg-${Date.now()}`;

    const initialUpdateMessages = [
      ...messages,
      newUserMessage,
      { role: "assistant", content: "", id: assistantMessageId },
    ];
    setMessages(JSON.parse(JSON.stringify(initialUpdateMessages)));
    setShouldAutoScroll(true);

    try {
      const response = await fetch("/api/chat/basic_agents", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [...messages, newUserMessage],
          stream: true,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("Response body is not readable");
      }

      let accumulatedContent = "";

      while (true) {
        const { done, value } = await reader.read();

        if (done) break;

        const chunk = new TextDecoder().decode(value);
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));

              if (data.type === "content" && data.content) {
                accumulatedContent += data.content;
                const updateMessages = initialUpdateMessages.map((msg) =>
                  msg.id === assistantMessageId
                    ? { ...msg, content: accumulatedContent }
                    : msg
                );
                setMessages(JSON.parse(JSON.stringify(updateMessages)));
              }

              if (data.type === "done") {
                console.log("done");
                break;
              }

              if (data.type === "error") {
                console.error("error:", data.content);
                break;
              }
            } catch (parseError) {
              console.error("解析JSON错误:", parseError);
            }
          }
        }
      }

      reader.releaseLock();
    } catch (error) {
      console.error("Error sending message:", error);

      const updateMessages = initialUpdateMessages.map((msg) =>
        msg.id === assistantMessageId
          ? { ...msg, content: "出错了，哎嘿。" }
          : msg
      );
      setMessages(JSON.parse(JSON.stringify(updateMessages)));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ChatLayout
      content={
        <ChatMessage
          messages={messages}
          emptyStateComponent={emptyStateComponent}
          shouldAutoScroll={shouldAutoScroll}
          setShouldAutoScroll={handleChangeScroll}
          className={className}
        />
      }
      footer={
        <ChatInput
          placeholder={placeholder}
          onSend={sendMessage}
          disabled={isLoading}
        />
      }
    />
  );
};

export default ChatWindow;
