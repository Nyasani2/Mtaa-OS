"use client";

import { useEffect, useState } from "react";

export function BootGate({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const init = async () => {
      // Boot sequence
      await new Promise((r) => setTimeout(r, 100));
      setReady(true);
    };
    init();
    return () => { setReady(false); };
  }, []);

  if (!ready) return null;
  return <>{children}</>;
}
