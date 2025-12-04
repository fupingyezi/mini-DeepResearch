import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { taskType } from "@/types";

export interface DeepResearchProcessState {
  tasks: taskType[];
  report: string;
  initialTasks: (tasks: taskType[]) => void;
  updateTasks: (task: taskType) => void;
  updateReport: (report: string) => void;
}

const useDeepResearchProcessStore = create<DeepResearchProcessState>()(
  immer((set) => ({
    tasks: [],
    report: "",
    initialTasks: (tasks: taskType[]) =>
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
