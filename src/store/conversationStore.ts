import { create } from "zustand";
import type { ChatMessageType, ChatSessionType } from "@/types";
import { UUIDTypes } from "uuid";

export interface ConversationState {
  chatSessions: ChatSessionType[];
  currentSession: UUIDTypes;
  currentMessages: ChatMessageType[];
  intialChatSessions: (chatSessions: ChatSessionType[]) => void;
  updateChatSessions: (chatSession: ChatSessionType) => void;
  setCurrentSession: (sessionId: UUIDTypes) => void;
  setCurrentMessages: (chatMessages: ChatMessageType[]) => void;
  updateCurrentMessages: (
    ChatMessages: ChatMessageType | ChatMessageType[]
  ) => void;
}

const useConversationStore = create<ConversationState>((set) => ({
  chatSessions: [],
  currentSession: "",
  currentMessages: [],
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
