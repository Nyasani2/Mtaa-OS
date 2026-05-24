import { useRouter } from "expo-router";

export function useTaskManager() {
  const router = useRouter();

  const switchTask = (taskId: string) => {
    console.log("Switching to task:", taskId);
  };

  const goHome = () => {
    router.push("/(os)/home" as any);
  };

  return { switchTask, goHome };
}
