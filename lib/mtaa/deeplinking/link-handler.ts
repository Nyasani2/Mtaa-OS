import { listKernelEntries } from "@/lib/kernel/registry/kernel-registry";

export function useLinkHandler() {
  const handleLink = (url: string) => {
    console.log("Handling deep link:", url);
    const entries = listKernelEntries();
    const target = entries.find((e) => url.includes(e.id));
    return { handled: true, target: target?.id };
  };

  return { handleLink };
}
