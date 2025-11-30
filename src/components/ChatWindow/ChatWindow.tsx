"use client";

import {
  ChatLayoutProps,
  ChatWindowProps,
  ChatMessageType,
  ChatSessionType,
} from "@/types";
import React, { useState, useCallback, useEffect } from "react";
import ChatMessage from "./ChatMessage";
import ChatInput from "./ChatInput";
import { useConversationStore } from "@/store";
import { v4 as uuidv4 } from "uuid";
import apiClient from "@/utils/request/api";

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
  const {
    setCurrentSession,
    currentSession,
    chatSessions,
    currentMessages,
    updateChatSessions,
    updateCurrentMessages,
  } = useConversationStore();
  const [isLoading, setIsLoading] = useState(false);
  const [shouldAutoScroll, setShouldAutoScroll] = useState<boolean>(true);
  const [messages, setMessages] = useState<ChatMessageType[]>([]);

  const handleChangeScroll = useCallback((shouldAutoScroll: boolean) => {
    setShouldAutoScroll(shouldAutoScroll);
  }, []);

  useEffect(() => {
    console.log("Loading messages for session:", currentSession);
    setMessages(currentMessages);
  }, [currentMessages, currentSession]);

  const sendMessage = async (inputValue: string) => {
    if (inputValue === "") return;
    // console.log("currentSession", currentSession);

    let sessionId = currentSession;
    // 没有对话，创建新对话
    if (!currentSession) {
      sessionId = uuidv4();
      const now = new Date().toISOString();
      const chat_session: ChatSessionType = {
        id: sessionId,
        seq_id: chatSessions.length + 1,
        title: inputValue.slice(0, 15),
        created_at: Date.now(),
        updated_at: Date.now(),
      };

      try {
        const res = await apiClient.post("/conversations/create_session", {
          chat_session: chat_session,
        });
        // console.log("Session created:", res);
        if (res.success) {
          updateChatSessions(chat_session);
          setCurrentSession(chat_session.id);
        }
      } catch (error) {
        console.error("Failed to create session:", error);
        return;
      }
    }

    // 当前对话里对话
    setIsLoading(true);
    const newUserMessage: ChatMessageType = {
      id: messages.length + 1,
      sessionId: sessionId!,
      role: "user",
      content: inputValue,
    };

    const assistantMessageId = newUserMessage.id + 1;
    let accumulatedContent = "";

    const initialUpdateMessages = [
      ...messages,
      newUserMessage,
      {
        id: assistantMessageId,
        sessionId: sessionId!,
        role: "assistant",
        content: "",
      },
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

      // 流式处理
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

      // 更新store
      const finalAssistantMessage: ChatMessageType = {
        id: assistantMessageId,
        sessionId: sessionId!,
        role: "assistant",
        content: accumulatedContent,
      };
      updateCurrentMessages([newUserMessage, finalAssistantMessage]);
    } catch (error) {
      console.error("Error sending message:", error);

      const updateMessages = initialUpdateMessages.map((msg) =>
        msg.id === assistantMessageId
          ? { ...msg, content: "出错了，哎嘿。" }
          : msg
      );
      setMessages(JSON.parse(JSON.stringify(updateMessages)));

      const errorAssistantMessage: ChatMessageType = {
        id: assistantMessageId,
        sessionId: sessionId!,
        role: "assistant",
        content: "出错了，哎嘿。",
      };
      updateCurrentMessages([newUserMessage, errorAssistantMessage]);
    } finally {
      setIsLoading(false);
      const new_Messages = [
        newUserMessage,
        {
          id: assistantMessageId,
          sessionId: sessionId!,
          role: "assistant",
          content: accumulatedContent || "出错了，哎嘿。",
        },
      ];
      try {
        const response = await apiClient.post(
          "/conversations/update_messages",
          { chat_messages: new_Messages }
        );
        // console.log("update_messages:", response);
      } catch (error) {
        console.log("error:", error);
        console.error("Failed to save messages:", error);
      }
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
