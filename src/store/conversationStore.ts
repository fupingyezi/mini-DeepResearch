import { create } from "zustand";
import type { ChatMessageType, ChatSessionType } from "@/types";
import { UUIDTypes } from "uuid";

export interface ConversationState {
  isLoading: boolean;
  shouldAutoScroll: boolean;
  chatSessions: ChatSessionType[];
  currentSession: UUIDTypes;
  currentMessages: ChatMessageType[];
  setIsLoading: (isLoading: boolean) => void;
  setShouldAutoScroll: (shouldAutoScroll: boolean) => void;
  intialChatSessions: (chatSessions: ChatSessionType[]) => void;
  updateChatSessions: (chatSession: ChatSessionType) => void;
  setCurrentSession: (sessionId: UUIDTypes) => void;
  setCurrentMessages: (chatMessages: ChatMessageType[]) => void;
  updateCurrentMessages: (
    ChatMessages: ChatMessageType | ChatMessageType[]
  ) => void;
}

const useConversationStore = create<ConversationState>((set) => ({
  isLoading: false,
  shouldAutoScroll: false,
  chatSessions: [],
  currentSession: "",
  currentMessages: [],
  setIsLoading: (isLoading) =>
    set(() => ({
      isLoading: isLoading,
    })),
  setShouldAutoScroll: (shouldAutoScroll) =>
    set(() => ({
      shouldAutoScroll: shouldAutoScroll,
    })),
  intialChatSessions: (chatSessions) =>
    set(() => ({
      chatSessions: chatSessions,
    })),
  updateChatSessions: (chatSession) =>
    set((state) => ({
      chatSessions: [chatSession, ...state.chatSessions],
    })),
  setCurrentSession: (sessionId) =>
    set(() => ({
      currentSession: sessionId,
    })),
  setCurrentMessages: (chatMessages) =>
    set(() => ({ currentMessages: chatMessages })),
  updateCurrentMessages: (chatMessages) =>
    set((state) => {
      if (Array.isArray(chatMessages)) {
        return {
          currentMessages: [...state.currentMessages, ...chatMessages],
        };
      } else {
        return {
          currentMessages: [...state.currentMessages, chatMessages],
        };
      }
    }),
}));

export default useConversationStore;
