import { useTaskManager } from "../task-manager";

export function useRecentsEngine() {
  const { switchTask } = useTaskManager();

  const openRecent = (taskId: string) => {
    switchTask(taskId);
  };

  return { openRecent };
}
