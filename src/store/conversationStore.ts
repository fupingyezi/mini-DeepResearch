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
  addChatSession: (chatSession: ChatSessionType) => void;
  updateChatSession: (
    chatSession: ChatSessionType | null,
    op: "edit" | "delete"
  ) => void;
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
  addChatSession: (chatSession) =>
    set((state) => ({
      chatSessions: [chatSession, ...state.chatSessions],
    })),
  updateChatSession: (chatSession, op) =>
    set((state) => {
      if (!chatSession) return {};
      if (op === "edit") {
        const otherSessions = state.chatSessions.filter(
          (session) => session.id !== chatSession.id
        );
        return {
          chatSessions: [chatSession, ...otherSessions],
        };
      } else if (op === "delete") {
        const filteredSessions = state.chatSessions.filter(
          (session) => session.id !== chatSession.id
        );

        // 如果当前会话被删除，重置
        let newCurrentSession = state.currentSession;
        let newCurrentMessages: ChatMessageType[] = state.currentMessages;

        if (state.currentSession === chatSession.id) {
          newCurrentSession = "";
          newCurrentMessages = [];
        }

        return {
          chatSessions: filteredSessions,
          currentSession: newCurrentSession,
          currentMessages: newCurrentMessages,
        };
      }
      return {};
    }),
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
