import type { taskType } from "@/types";

export function extractDelta(prevState: any, currentState: any) {
  const delta: Record<string, any> = {};

  if (
    currentState.tasks?.length &&
    (!prevState?.tasks || prevState.tasks.length === 0)
  ) {
    delta.type = "tasks";
    delta.payload = currentState.tasks;
  } else if (currentState.tasks?.length && prevState?.tasks?.length) {
    const updatedTask = currentState.tasks.find(
      (t: taskType) =>
        t.status !==
        prevState.tasks.find((pt: taskType) => pt.id === t.id)?.status
    );
    if (updatedTask) {
      delta.type = "task_update";
      delta.payload = updatedTask;
    }
  }

  if (currentState.summary && !prevState?.summary) {
    delta.type = "summary";
    delta.payload = currentState.summary;
  }

  return Object.keys(delta).length ? delta : null;
}
