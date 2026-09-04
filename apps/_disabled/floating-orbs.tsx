import React from "react";
import { View } from "react-native";

export default function FloatingOrbs() {
  return (
    <View className="absolute inset-0 opacity-30">
      <View className="w-32 h-32 rounded-full bg-blue-500/20 absolute top-10 left-10" />
      <View className="w-40 h-40 rounded-full bg-purple-500/20 absolute bottom-20 right-10" />
      <View className="w-24 h-24 rounded-full bg-cyan-500/20 absolute top-1/2 left-1/3" />
    </View>
  )
}
