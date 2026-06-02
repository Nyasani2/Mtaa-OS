import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface CallLog {
  id: string;
  number: string;
  name?: string;
  type: 'incoming' | 'outgoing' | 'missed';
  timestamp: string;
  duration?: string;
}

interface Props {
  log: CallLog;
  onPress: () => void;
  onLongPress: () => void;
}

const TYPE_ICONS = {
  incoming: 'arrow-down',
  outgoing: 'arrow-up',
  missed: 'close',
};

const TYPE_COLORS = {
  incoming: '#34C759',
  outgoing: '#007AFF',
  missed: '#FF3B30',
};

export function CallLogItem({ log, onPress, onLongPress }: Props) {
  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      onLongPress={onLongPress}
      activeOpacity={0.7}
    >
      <View style={styles.iconContainer}>
        <Ionicons
          name={TYPE_ICONS[log.type] as any}
          size={16}
          color={TYPE_COLORS[log.type]}
        />
      </View>
      <View style={styles.info}>
        <Text style={[styles.name, log.type === 'missed' && styles.missedName]}>
          {log.name || log.number}
        </Text>
        <Text style={styles.detail}>
          {log.type} · {log.timestamp}
        </Text>
      </View>
      <View style={styles.right}>
        {log.duration && <Text style={styles.duration}>{log.duration}</Text>}
        <TouchableOpacity style={styles.infoBtn}>
          <Ionicons name="information-circle-outline" size={22} color="#007AFF" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#E5E5EA' },
  iconContainer: { width: 28, justifyContent: 'center', alignItems: 'center' },
  info: { flex: 1, marginLeft: 12 },
  name: { fontSize: 16, color: '#000' },
  missedName: { color: '#FF3B30' },
  detail: { fontSize: 13, color: '#8E8E93', marginTop: 2 },
  right: { flexDirection: 'row', alignItems: 'center' },
  duration: { fontSize: 13, color: '#8E8E93', marginRight: 8 },
  infoBtn: { padding: 4 },
});
