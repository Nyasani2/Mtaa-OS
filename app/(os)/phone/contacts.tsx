// @ts-nocheck
import { View, Text, StyleSheet, FlatList, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { usePhoneStore } from '@/hooks/usePhoneStore';

export default function ContactsScreen() {
  const router = useRouter();
  const { contacts } = usePhoneStore();

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Contacts</Text>
      <FlatList
        data={contacts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Pressable
            style={styles.contactRow}
            onPress={() => router.push(`/phone/call?number=${encodeURIComponent(item.phone)}` as any)}
          >
            <Text style={styles.name}>{item.name}</Text>
            <Text style={styles.phone}>{item.phone}</Text>
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#000' },
  header: { fontSize: 24, fontWeight: 'bold', color: '#fff', marginBottom: 16 },
  contactRow: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#222' },
  name: { color: '#fff', fontSize: 16 },
  phone: { color: '#888', fontSize: 12, marginTop: 2 },
});
