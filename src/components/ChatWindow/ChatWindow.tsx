"use client";

import { ChatLayoutProps, ChatWindowProps } from "@/types";
import React, { useCallback } from "react";
import ChatMessage from "./ChatMessage";
import ChatInput from "./ChatInput";
import {
  useConversationStore,
  useDeepResearchProcessStore,
  useChatSelectStore,
} from "@/store";
import { chatWithChatAssistant, chatWithDeepResearch } from "@/utils/chat";

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
  const conversationStore = useConversationStore();
  const deepResearchStore = useDeepResearchProcessStore();
  const { selectedAgent } = useChatSelectStore();

  const { isLoading, shouldAutoScroll, currentMessages, setShouldAutoScroll } =
    conversationStore;

  const handleChangeScroll = useCallback(
    (shouldAutoScroll: boolean) => {
      setShouldAutoScroll(shouldAutoScroll);
    },
    [setShouldAutoScroll]
  );

  const handleSendMessage = useCallback(
    async (inputValue: string) => {
      if (selectedAgent === "chat") {
        await chatWithChatAssistant({
          inputValue,
          ...conversationStore,
        });
      } else if (selectedAgent === "search") {
      } else if (selectedAgent === "deepResearch") {
        await chatWithDeepResearch({
          inputValue,
          ...conversationStore,
          ...deepResearchStore,
        });
      }
    },
    [conversationStore, deepResearchStore]
  );

  return (
    <ChatLayout
      content={
        <ChatMessage
          messages={currentMessages}
          emptyStateComponent={emptyStateComponent}
          shouldAutoScroll={shouldAutoScroll}
          setShouldAutoScroll={handleChangeScroll}
          className={className}
        />
      }
      footer={
        <ChatInput
          placeholder={placeholder}
          onSend={handleSendMessage}
          disabled={isLoading}
        />
      }
    />
  );
};

export default ChatWindow;
