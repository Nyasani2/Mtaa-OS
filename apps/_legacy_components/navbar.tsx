import React from 'react'
import { View, Text, Pressable } from 'react-native'
import { router } from 'expo-router'

type NavItem = {
  label: string
  route: string
  icon?: string
}

const items: NavItem[] = [
  { label: 'Home', route: '/(os)/launcher' },
  { label: 'Wallet', route: '/(os)/apps/wallet' },
  { label: 'Store', route: '/(os)/app-store' },
]

export default function Navbar() {
  return (
    <View className="flex-row justify-around items-center py-3 border-t border-zinc-800 bg-black">
      {items.map((item) => (
        <Pressable
          key={item.route}
          onPress={() => router.push(item.route as any)}
          className="items-center"
        >
          <Text className="text-xs text-zinc-300">
            {item.label}
          </Text>
        </Pressable>
      ))}
    </View>
  )
}
