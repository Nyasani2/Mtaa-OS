import React, { createContext, useContext, useRef, useState } from "react";
import { Animated, View } from "react-native";

type LaunchPayload = { id: string; x: number; y: number };

type Ctx = {
  launch: (p: LaunchPayload) => void;
  launching: LaunchPayload | null;
};

const LaunchCtx = createContext<Ctx | null>(null);

export const useOSLaunch = () => {
  const ctx = useContext(LaunchCtx);
  if (!ctx) throw new Error("OSLaunch missing");
  return ctx;
};

export default function OSLaunchTransitionProvider({ children }: any) {
  const [launching, setLaunching] = useState<LaunchPayload | null>(null);
  const anim = useRef(new Animated.Value(0)).current;

  const launch = (p: LaunchPayload) => {
    setLaunching(p);
    anim.setValue(0);

    Animated.timing(anim, {
      toValue: 1,
      duration: 250,
      useNativeDriver: true,
    }).start(() => setLaunching(null));
  };

  return (
    <LaunchCtx.Provider value={{ launch, launching }}>
      {children}

      {launching && (
        <View
          pointerEvents="none"
          style={{
            position: "absolute",
            top: launching.y - 30,
            left: launching.x - 30,
            width: 60,
            height: 60,
            borderRadius: 16,
            backgroundColor: "#000",
          }}
        />
      )}
    </LaunchCtx.Provider>
  );
}
