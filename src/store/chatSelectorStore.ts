import { create } from "zustand";

type agentMode = "chat" | "search" | "deepResearch";

export interface ChatSelectState {
  selectedAgent: string;
  setSelectedAgent: (selectedAgent: string) => void;
}

const useChatSelectStore = create<ChatSelectState>((set) => ({
  selectedAgent: "deepResearch",
  setSelectedAgent: (selectedAgent: string) =>
    set(() => ({
      selectedAgent: selectedAgent,
    })),
}));

export default useChatSelectStore;
