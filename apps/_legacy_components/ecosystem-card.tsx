import React from 'react';
import { View, Text } from 'react-native';

const colors: any = {
  blue: 'bg-blue-900/20 border-blue-500/20',
  green: 'bg-green-900/20 border-green-500/20',
  orange: 'bg-orange-900/20 border-orange-500/20',
  red: 'bg-red-900/20 border-red-500/20',
  purple: 'bg-purple-900/20 border-purple-500/20',
  cyan: 'bg-cyan-900/20 border-cyan-500/20',
  yellow: 'bg-yellow-900/20 border-yellow-500/20',
}

export default function EcosystemCard({
  icon,
  title,
  description,
  status,
  color,
}: any) {
  return (
    <View
      className={`rounded-3xl border p-5 ${
        colors[color] || 'bg-zinc-900 border-zinc-800'
      }`}
    >
      <View className="flex-row justify-between items-start mb-4">
        <Text className="text-4xl">{icon}</Text>

        <View className="px-2 py-1 border border-zinc-700 rounded-full">
          <Text className="text-[10px] text-zinc-300">
            {status}
          </Text>
        </View>
      </View>

      <Text className="text-lg font-semibold text-white mb-2">
        {title}
      </Text>

      <Text className="text-sm text-zinc-400">
        {description}
      </Text>

      <View className="mt-5 h-24 border border-dashed border-zinc-700 rounded-xl items-center justify-center">
        <Text className="text-xs text-zinc-500">
          Preview Space
        </Text>
      </View>
    </View>
  )
}
