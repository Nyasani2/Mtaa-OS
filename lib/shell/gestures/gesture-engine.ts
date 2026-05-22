import { useTaskManager } from "@/lib/shell/multitasking/task-manager";

export function useGestureEngine() {
  const { switchTask, goHome } = useTaskManager();

  const handleSwipeUp = () => {
    goHome();
  };

  const handleSwipeLeft = (taskId: string) => {
    switchTask(taskId);
  };

  return { handleSwipeUp, handleSwipeLeft };
}
