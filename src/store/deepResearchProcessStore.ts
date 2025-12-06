import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { taskType } from "@/types";

export type processStatusType = "notCall" | "initial" | "processing" | "end";

export interface DeepResearchProcessState {
  isOpenProcessSider: boolean;
  status: processStatusType;
  simpleAnalysis: string;
  tasks: taskType[];
  report: string;
  setIsOpenProcessSider: (isOpenProcessSider: boolean) => void;
  setStatus: (status: processStatusType) => void;
  setSimpleAnalysis: (simpleAnalysis: string) => void;
  initialTasks: (tasks: taskType[]) => void;
  setTasks: (tasks: taskType[]) => void;
  updateTasks: (task: taskType) => void;
  updateReport: (report: string) => void;
}

const useDeepResearchProcessStore = create<DeepResearchProcessState>()(
  immer((set) => ({
    isOpenProcessSider: false,
    status: "notCall",
    simpleAnalysis: "",
    tasks: [],
    report: "",
    setIsOpenProcessSider: (isOpenProcessSider: boolean) =>
      set((state) => {
        state.isOpenProcessSider = isOpenProcessSider;
      }),
    setStatus: (status: processStatusType) =>
      set(() => ({
        status: status,
      })),
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
