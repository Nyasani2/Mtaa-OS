import { KernelRegistry } from "@/lib/kernel/registry/kernel-registry";

export function useLinkHandler() {
  const registry = KernelRegistry.getInstance();

  const handleLink = (url: string) => {
    console.log("Handling deep link:", url);
    return { handled: true };
  };

  return { handleLink };
}
