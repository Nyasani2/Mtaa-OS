import { useEffect, useState } from "react";

export function useKernelState() {
  const [phase, setPhase] = useState("booting");
  const [healthScore, setHealthScore] = useState(72);

  useEffect(() => {
    const t = setTimeout(() => {
      setPhase("running");
      setHealthScore(88);
    }, 500);

    return () => clearTimeout(t);
  }, []);

  return {
    phase,
    healthScore,
  };
}
