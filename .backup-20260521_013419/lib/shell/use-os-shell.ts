import { useEffect, useState } from "react";
import { osShell, ShellState } from "./os-shell";

/**
 * 🧠 REACTIVE OS SHELL HOOK
 * Bridges kernel → UI
 */

export const useOSShell = () => {
  const [state, setState] = useState<ShellState>("booting");

  useEffect(() => {
    const unsub = osShell.subscribe(setState);

    osShell.init();

    return () => unsub();
  }, []);

  return {
    state,
    isBooting: state === "booting",
    isLocked: state === "locked",
    isUnlocked: state === "unlocked",
  };
};
