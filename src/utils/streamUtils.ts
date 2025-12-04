import type { taskType } from "@/types";

export function handleStateUpdate(prevState: any, currentState: any) {
  const delta: Record<string, any> = {};

  if (
    currentState.tasks?.length &&
    (!prevState?.tasks || prevState.tasks.length === 0)
  ) {
    delta.type = "tasks_initial";
    delta.payload = currentState.tasks;
  } else if (currentState.tasks?.length && prevState?.tasks?.length) {
    const updatedTask = currentState.tasks.find(
      (task: taskType) =>
        task.status !==
        prevState.tasks.find((pretask: taskType) => pretask.id === task.id)
          ?.status
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

export function hanldeUpStore(data: any) {
  if (!data.type || !data.payload) return;
  if (data.type === "tasks_initial") {
    
  }
  else if (data.type == "task_update") {

  }
  else {
    
  }
}
