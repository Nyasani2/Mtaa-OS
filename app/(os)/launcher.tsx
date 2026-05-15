import { FlatList, Pressable, Text, View } from 'react-native'
import { router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'

import { appRegistry } from './app-runtime/registry'

export default function Launcher() {
  return (
    <FlatList
      data={appRegistry.filter(app => app.installed)}
      numColumns={4}
      keyExtractor={item => item.id}
      contentContainerStyle={{
        padding: 20,
      }}
      renderItem={({ item }) => (
        <Pressable
          onPress={() => router.push(item.route as any)}
          style={{
            width: '25%',
            alignItems: 'center',
            marginBottom: 28,
          }}
        >
          <View
            style={{
              width: 72,
              height: 72,
              borderRadius: 24,
              backgroundColor: '#121225',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 8,
            }}
          >
            <Ionicons
              name={item.icon as any}
              size={30}
              color="white"
            />
          </View>

          <Text
            style={{
              color: 'white',
              fontSize: 12,
            }}
          >
            {item.name}
          </Text>
        </Pressable>
      )}
    />
  )
}
