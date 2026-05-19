import { useEffect } from "react";
import { authKernel } from "./auth-kernel";

/**
 * 🧠 OS BOOT HOOK
 * runs once when app loads
 */
export const useAuthBoot = () => {
  useEffect(() => {
    authKernel.boot();
  }, []);
};
