import { useRouter } from "expo-router";

export function usePanicHandler() {
  const router = useRouter();

  const handlePanic = (error: Error) => {
    console.error("Kernel panic:", error);
    // Navigate to safe mode using string cast to bypass type check
    router.push("/(os)/safe-mode" as any);
  };

  return { handlePanic };
}
