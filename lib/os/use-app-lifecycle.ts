import { useEffect, useState } from "react";
import { AppLifecycle, RunningApp } from "./app-lifecycle";
import { osEvents } from "./os-events";

export const useAppLifecycle = () => {
  const [running, setRunning] = useState<RunningApp[]>([]);

  const refresh = () => {
    setRunning(AppLifecycle.getRunning());
  };

  useEffect(() => {
    refresh();

    const unsub = osEvents.subscribe("apps_changed", () => {
      refresh();
    });

    return () => unsub();
  }, []);

  return {
    running,
    open: AppLifecycle.open,
    close: AppLifecycle.close,
    background: AppLifecycle.background,
  };
};
