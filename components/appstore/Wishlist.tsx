import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAppStore } from '@/hooks/useAppStore';
import { AppCard } from './AppCard';

interface WishlistProps {
  visible: boolean;
  onClose: () => void;
}

export function Wishlist({ visible, onClose }: WishlistProps) {
  const router = useRouter();
  const { apps, isInstalled, isInstalling, installApp } = useAppStore();

  // Mock wishlist — in real app, this comes from user state
  const wishlistIds = ['mtaxi', 'shop', 'edu', 'market'];
  const wishlistApps = apps.filter(a => wishlistIds.includes(a.id));

  const handleInstall = (appId: string) => installApp(appId);
  const handleOpen = (route: string) => router.push(route);
  const handleAppPress = (appId: string) => {
    onClose();
    router.push(`/(os)/appstore/${appId}`);
  };

  if (!visible) return null;

  return (
    <View style={styles.overlay}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose}>
            <Feather name="arrow-left" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Wishlist</Text>
          <TouchableOpacity>
            <Feather name="more-vertical" size={22} color="#fff" />
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Wishlist Count */}
          <View style={styles.countCard}>
            <Feather name="heart" size={24} color="#FF6B6B" />
            <View style={styles.countInfo}>
              <Text style={styles.countNumber}>{wishlistApps.length}</Text>
              <Text style={styles.countLabel}>apps saved</Text>
            </View>
            <TouchableOpacity style={styles.shareButton}>
              <Feather name="share-2" size={16} color="#fff" />
              <Text style={styles.shareText}>Share</Text>
            </TouchableOpacity>
          </View>

          {/* Apps */}
          <View style={styles.section}>
            {wishlistApps.map(app => (
              <View key={app.id} style={styles.wishlistRow}>
                <AppCard
                  app={app}
                  isInstalled={isInstalled(app.id)}
                  isInstalling={isInstalling(app.id)}
                  onInstall={handleInstall}
                  onOpen={handleOpen}
                  onPress={handleAppPress}
                  variant="horizontal"
                />
                <TouchableOpacity style={styles.removeButton}>
                  <Feather name="x" size={16} color="#FF6B6B" />
                </TouchableOpacity>
              </View>
            ))}
          </View>

          {wishlistApps.length === 0 && (
            <View style={styles.emptyState}>
              <Feather name="heart" size={48} color="#333" />
              <Text style={styles.emptyTitle}>Your wishlist is empty</Text>
              <Text style={styles.emptySub}>Tap the heart icon on any app to save it here</Text>
              <TouchableOpacity style={styles.browseButton} onPress={onClose}>
                <Text style={styles.browseText}>Browse Apps</Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.bottomSpacer} />
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#121212',
    zIndex: 200,
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1C1C1C',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  countCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1C1C1C',
    margin: 16,
    padding: 16,
    borderRadius: 16,
  },
  countInfo: {
    flex: 1,
    marginLeft: 14,
  },
  countNumber: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '800',
  },
  countLabel: {
    color: '#888',
    fontSize: 13,
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2A2A2A',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  shareText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  section: {
    paddingHorizontal: 16,
  },
  wishlistRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  removeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,107,107,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 100,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
    marginTop: 16,
  },
  emptySub: {
    color: '#888',
    fontSize: 14,
    marginTop: 6,
    textAlign: 'center',
  },
  browseButton: {
    backgroundColor: '#4ECDC4',
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 24,
    marginTop: 24,
  },
  browseText: {
    color: '#121212',
    fontSize: 15,
    fontWeight: '700',
  },
  bottomSpacer: {
    height: 40,
  },
});

