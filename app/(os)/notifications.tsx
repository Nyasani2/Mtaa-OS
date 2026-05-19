import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';

import {
  Bell,
  CheckCheck,
  Trash2,
  Search,
  X,
  Wifi,
  WifiOff,
  Car,
  CreditCard,
} from 'lucide-react-native';

import { useNotification } from '@/lib/kernel/notification-engine';
import { useAuthStore } from '@/lib/stores/auth-store';
import { Colors } from '@/constants/Colors';

export default function NotificationInboxScreen() {
  const router = useRouter();
  const { user } = useAuthstore();
  const n = useNotification(user?.id);

  const [search, setSearch] = useState('');

const filtered = (n?.notifications ?? []).filter(i =>
    i.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <View style={{ flex: 1 }}>
      <View style={{ padding: 12 }}>
        <Text style={{ fontSize: 20, fontWeight: '700' }}>
          Notifications
        </Text>

        <TextInput
          placeholder="Search..."
          value={search}
          onChangeText={setSearch}
          style={{
            backgroundColor: '#eee',
            padding: 10,
            borderRadius: 8,
            marginTop: 10,
          }}
        />
      </View>


      <FlatList
data={filtered ?? []}
keyExtractor={(i) => i?.id?.toString() ?? Math.random().toString()}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={{
              padding: 12,
              margin: 6,
              backgroundColor: '#fff',
              borderRadius: 10,
            }}
          >
            <Text style={{ fontWeight: '600' }}>
              {item.title}
            </Text>
            <Text>{item.body}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}
