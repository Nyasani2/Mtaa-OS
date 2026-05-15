import { View, Text, FlatList, TouchableOpacity } from 'react-native'

const APPS = [
  { id: 'streets', name: 'Streets', status: 'installed' },
  { id: 'mtruck', name: 'MTruck', status: 'installable' },
  { id: 'tribes', name: 'Tribes', status: 'installed' },
]

export default function AppStore() {
  return (
    <View style={{ flex: 1, backgroundColor: '#000', padding: 20 }}>
      <Text style={{ color: 'white', fontSize: 24, marginBottom: 20 }}>
        App Store
      </Text>

      <FlatList
        data={APPS}
        keyExtractor={(i) => i.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={{
              padding: 16,
              backgroundColor: '#111',
              marginBottom: 10,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: '#222'
            }}
          >
            <Text style={{ color: 'white', fontSize: 16 }}>
              {item.name}
            </Text>

            <Text style={{ color: '#888', marginTop: 4 }}>
              {item.status}
            </Text>
          </TouchableOpacity>
        )}
      />
    </View>
  )
}
