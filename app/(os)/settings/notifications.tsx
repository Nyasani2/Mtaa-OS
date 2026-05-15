/**
 * MTAA AFRIQ — Notifications Settings (Kernel Safe)
 * NO relative imports allowed
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Switch,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  StyleSheet
} from 'react-native';

import { useAuth } from '@/lib/stores/auth-store';

export default function NotificationsSettings() {
  const { user } = useAuth();

  const [loading, setLoading] = useState(false);
  const [pushEnabled, setPushEnabled] = useState(true);
  const [emailEnabled, setEmailEnabled] = useState(false);

  useEffect(() => {
    // TODO: later load from Supabase settings table
    if (user) {
      setLoading(false);
    }
  }, [user]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
        <Text>Loading notifications...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Notifications</Text>

      <View style={styles.row}>
        <Text>Push Notifications</Text>
        <Switch value={pushEnabled} onValueChange={setPushEnabled} />
      </View>

      <View style={styles.row}>
        <Text>Email Notifications</Text>
        <Switch value={emailEnabled} onValueChange={setEmailEnabled} />
      </View>

      <Text style={styles.note}>
        User: {user?.id || 'Not logged in'}
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20 },
  title: { fontSize: 22, fontWeight: '700', marginBottom: 20 },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderColor: '#eee'
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },
  note: {
    marginTop: 20,
    color: '#666'
  }
});
