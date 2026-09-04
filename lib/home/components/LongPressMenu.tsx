import React from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useHomeStore, AppLayoutItem } from '../store/home.store';
import { useRouter } from 'expo-router';

interface MenuAction {
  icon: string;
  label: string;
  action: () => void;
  danger?: boolean;
}

export default function LongPressMenu() {
  const router = useRouter();
  const { showMenu, setShowMenu, selectedApp, setSelectedApp, isEditMode, setEditMode, moveAppToFolder, layouts, folders } = useHomeStore();

  if (!selectedApp) return null;

  const isMTAAApp = !selectedApp.appRoute.startsWith('/(system)') &&
    !selectedApp.appRoute.startsWith('/(utility)') &&
    !selectedApp.appRoute.startsWith('/(productivity)');

  const baseActions: MenuAction[] = [
    {
      icon: 'open-outline',
      label: 'Open',
      action: () => {
        setShowMenu(false);
        setSelectedApp(null);
        router.push(selectedApp.appRoute as any);
      },
    },
    {
      icon: 'pin-outline',
      label: selectedApp.isPinned ? 'Unpin' : 'Pin to Dock',
      action: () => {
        // Toggle pin
        setShowMenu(false);
      },
    },
    {
      icon: 'move-outline',
      label: 'Move',
      action: () => {
        setShowMenu(false);
        setEditMode(true);
      },
    },
    {
      icon: 'folder-open-outline',
      label: 'Add to Folder',
      action: () => {
        setShowMenu(false);
        // Show folder picker
      },
    },
    {
      icon: 'eye-off-outline',
      label: 'Hide',
      action: () => {
        setShowMenu(false);
        // Hide app
      },
    },
    {
      icon: 'information-circle-outline',
      label: 'App Details',
      action: () => {
        setShowMenu(false);
        router.push(`/appstore/${selectedApp.appId}` as any);
      },
    },
    {
      icon: 'bug-outline',
      label: 'Report Issue',
      action: () => {
        setShowMenu(false);
        // Open bug report
      },
    },
  ];

  const mtaaActions: MenuAction[] = isMTAAApp ? [
    {
      icon: 'cloud-download-outline',
      label: 'Check Updates',
      action: () => {
        setShowMenu(false);
        // Check app store for updates
      },
    },
    {
      icon: 'bar-chart-outline',
      label: 'Analytics',
      action: () => {
        setShowMenu(false);
        // Show app analytics
      },
    },
    {
      icon: 'shield-outline',
      label: 'Permissions',
      action: () => {
        setShowMenu(false);
        // Show permissions
      },
    },
    {
      icon: 'code-slash-outline',
      label: 'Developer Info',
      action: () => {
        setShowMenu(false);
        // Show dev info
      },
    },
  ] : [];

  const allActions = [...baseActions, ...mtaaActions];

  return (
    <Modal visible={showMenu} transparent animationType="fade" onRequestClose={() => setShowMenu(false)}>
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={() => setShowMenu(false)}>
        <View style={styles.menuContainer}>
          {/* App Header */}
          <View style={styles.appHeader}>
            <View style={[styles.appIconPreview, { backgroundColor: '#333' }]}>
              <Ionicons name={selectedApp.appIcon as any} size={28} color="#fff" />
            </View>
            <View>
              <Text style={styles.appName}>{selectedApp.appName}</Text>
              <Text style={styles.appRoute}>{selectedApp.appRoute}</Text>
            </View>
          </View>

          {/* Actions */}
          <View style={styles.actionsList}>
            {allActions.map((action, i) => (
              <TouchableOpacity
                key={i}
                style={styles.actionRow}
                onPress={action.action}
              >
                <Ionicons name={action.icon as any} size={20} color={action.danger ? '#f44' : '#ccc'} />
                <Text style={[styles.actionLabel, action.danger && { color: '#f44' }]}>{action.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  menuContainer: {
    backgroundColor: '#1a1a1a',
    borderRadius: 20,
    width: 280,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 20,
  },
  appHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
    gap: 12,
  },
  appIconPreview: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  appName: { color: '#fff', fontSize: 16, fontWeight: '600' },
  appRoute: { color: '#666', fontSize: 11, marginTop: 2 },
  actionsList: { paddingVertical: 8 },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 14,
  },
  actionLabel: { color: '#ccc', fontSize: 14 },
});
