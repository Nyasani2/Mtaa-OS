import React, { useEffect, useRef } from "react";
import { Stack, View, PanResponder } from "react-native";

import OSLaunchTransitionProvider from "./_layout/OSLaunchTransition";
import { walletCoreEngine } from "@/lib/hookup/wallet-bridge/walletCoreEngine";
import { gestureEngine } from "@/lib/shell/gestures/gesture-engine";

export default function OSLayout() {
  useEffect(() => {
    walletCoreEngine?.start?.();

    return () => {
      walletCoreEngine?.stop?.();
    };
  }, []);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: (_, g) => gestureEngine?.onTouchStart?.(g.y0),
      onPanResponderRelease: (_, g) => gestureEngine?.onTouchEnd?.(g.moveY),
    })
  ).current;

  return (
    <View style={{ flex: 1 }} {...panResponder.panHandlers}>
      <OSLaunchTransitionProvider>
        <Stack screenOptions={{ headerShown: false }} />
      </OSLaunchTransitionProvider>
    </View>
  );
}
