import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { taskType } from "@/types";

export interface DeepResearchProcessState {
  simpleAnalysis: string;
  tasks: taskType[];
  report: string;
  setSimpleAnalysis: (simpleAnalysis: string) => void;
  initialTasks: (tasks: taskType[]) => void;
  setTasks: (tasks: taskType[]) => void;
  updateTasks: (task: taskType) => void;
  updateReport: (report: string) => void;
}

const useDeepResearchProcessStore = create<DeepResearchProcessState>()(
  immer((set) => ({
    simpleAnalysis: "",
    tasks: [],
    report: "",
    setSimpleAnalysis: (simpleAnalysis: string) =>
      set((state) => {
        state.simpleAnalysis = simpleAnalysis;
      }),
    initialTasks: (tasks: taskType[]) =>
      set((state) => {
        state.tasks = tasks;
      }),
    setTasks: (tasks: taskType[]) =>
      set((state) => {
        state.tasks = tasks;
      }),
    updateTasks: (task: taskType) =>
      set((state) => {
        const index = state.tasks.findIndex((t) => t.id === task.id);
        if (index !== -1) {
          state.tasks[index] = task;
        }
      }),
    updateReport: (report: string) =>
      set((state) => {
        state.report = report;
      }),
  }))
);

export default useDeepResearchProcessStore;
