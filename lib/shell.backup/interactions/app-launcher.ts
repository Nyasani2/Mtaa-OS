import { useRouter } from "expo-router";

export function useAppLauncher() {
  const router = useRouter();

  const launchApp = (appId: string) => {
    // Launch app by ID
    console.log("Launching app:", appId);
  };

  const goHome = () => {
    router.push("/(os)/home" as any);
  };

  return { launchApp, goHome };
}
