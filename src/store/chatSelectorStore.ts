import { create } from "zustand";

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
