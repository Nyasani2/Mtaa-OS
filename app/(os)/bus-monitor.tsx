/**
 * MTAA AFRIQ — Messaging Bus Monitor (STABLE BUILD VERSION)
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  Wifi,
  WifiOff,
  ChevronLeft,
  CheckCircle,
} from 'lucide-react-native';

import { useMessagingBus } from '@/hooks/use-messaging-bus';
import { Colors } from '@/constants/Colors';

export default function BusMonitorScreen() {
  const router = useRouter();
  const bus = useMessagingBus('bus-monitor');

  const [expanded, setExpanded] = useState(null);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <ChevronLeft size={22} color={Colors.text} />
        </TouchableOpacity>

        <Text style={styles.title}>Bus Monitor</Text>

        {bus.isConnected ? (
          <Wifi size={18} color={Colors.success} />
        ) : (
          <WifiOff size={18} color={Colors.error} />
        )}
      </View>

      {/* Messages */}
      <ScrollView>
        {bus.messages.map(msg => (
          <TouchableOpacity
            key={msg.id}
            style={styles.card}
            onPress={() =>
              setExpanded(expanded === msg.id ? null : msg.id)
            }
          >
            <Text style={styles.msg}>
              {msg.channel} • {msg.topic}
            </Text>

            {expanded === msg.id && (
              <Text style={styles.payload}>
                {JSON.stringify(msg.payload)}
              </Text>
            )}

            <TouchableOpacity
              onPress={() => bus.acknowledge(msg.id, 'bus')}
            >
              <CheckCircle size={16} color={Colors.success} />
            </TouchableOpacity>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 12,
  },
  title: { fontSize: 18, fontWeight: '700' },
  card: {
    margin: 8,
    padding: 12,
    backgroundColor: Colors.surface,
    borderRadius: 12,
  },
  msg: { fontWeight: '600' },
  payload: { marginTop: 6, fontSize: 12 },
});
