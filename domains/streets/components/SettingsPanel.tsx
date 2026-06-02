import React from 'react';
import { View, Text, Pressable, Switch, StyleSheet, ScrollView } from 'react-native';
import { useSettings } from '../hooks/useSettings';

export function SettingsPanel() {
  const { privacy, notifications, content, updatePrivacy, updateNotifications, updateContent } = useSettings();

  const ToggleRow = ({ label, value, onToggle }: { label: string; value?: boolean; onToggle: (v: boolean) => void }) => (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Switch value={value || false} onValueChange={onToggle} />
    </View>
  );

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.section}>Privacy</Text>
      <ToggleRow label="Private Account" value={privacy?.isPrivate} onToggle={(v) => updatePrivacy.mutate({ isPrivate: v })} />
      <ToggleRow label="Show Activity Status" value={privacy?.showActivity} onToggle={(v) => updatePrivacy.mutate({ showActivity: v })} />
      <ToggleRow label="Allow Mentions" value={privacy?.allowMentions} onToggle={(v) => updatePrivacy.mutate({ allowMentions: v })} />

      <Text style={styles.section}>Notifications</Text>
      <ToggleRow label="Push Notifications" value={notifications?.pushEnabled} onToggle={(v) => updateNotifications.mutate({ pushEnabled: v })} />
      <ToggleRow label="Email Notifications" value={notifications?.emailEnabled} onToggle={(v) => updateNotifications.mutate({ emailEnabled: v })} />
      <ToggleRow label="Live Alerts" value={notifications?.liveAlerts} onToggle={(v) => updateNotifications.mutate({ liveAlerts: v })} />

      <Text style={styles.section}>Content</Text>
      <ToggleRow label="Autoplay Videos" value={content?.autoplay} onToggle={(v) => updateContent.mutate({ autoplay: v })} />
      <ToggleRow label="Show Mature Content" value={content?.showMature} onToggle={(v) => updateContent.mutate({ showMature: v })} />
      <ToggleRow label="Data Saver" value={content?.dataSaver} onToggle={(v) => updateContent.mutate({ dataSaver: v })} />

      <Pressable style={styles.dangerBtn}>
        <Text style={styles.dangerText}>🚫 Blocked Accounts</Text>
      </Pressable>
      <Pressable style={styles.dangerBtn}>
        <Text style={styles.dangerText}>🗑️ Clear Cache</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  section: { fontSize: 16, fontWeight: '700', padding: 16, paddingBottom: 8, backgroundColor: '#f5f5f5' },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  rowLabel: { fontSize: 14 },
  dangerBtn: { padding: 16, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  dangerText: { fontSize: 14, color: '#E91E63' },
});
