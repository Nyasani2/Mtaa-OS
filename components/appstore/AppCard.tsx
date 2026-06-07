import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { AppItem } from '@/hooks/useAppStore';

interface AppCardProps {
  app: AppItem;
  isInstalled: boolean;
  isInstalling: boolean;
  onInstall: (appId: string) => void;
  onOpen: (route: string) => void;
  onPress: (appId: string) => void;
  variant?: 'compact' | 'full' | 'horizontal';
}

export function AppCard({ app, isInstalled, isInstalling, onInstall, onOpen, onPress, variant = 'compact' }: AppCardProps) {
  const renderStars = (rating: number) => {
    const fullStars = Math.floor(rating);
    const hasHalf = rating % 1 >= 0.5;
    const stars = [];
    for (let i = 0; i < 5; i++) {
      if (i < fullStars) stars.push('★');
      else if (i === fullStars && hasHalf) stars.push('½');
      else stars.push('☆');
    }
    return stars.join('');
  };

  if (variant === 'horizontal') {
    return (
      <TouchableOpacity style={styles.horizontalCard} onPress={() => onPress(app.id)} activeOpacity={0.7}>
        <View style={[styles.iconContainer, { backgroundColor: getIconBg(app.category) }]}>
          <Feather name={app.icon} size={28} color="#fff" />
        </View>
        <View style={styles.horizontalInfo}>
          <Text style={styles.name} numberOfLines={1}>{app.name}</Text>
          <Text style={styles.category}>{app.category}</Text>
          <Text style={styles.ratingText}>{renderStars(app.rating)} {app.rating}</Text>
        </View>
        <View style={styles.actionContainer}>
          {isInstalling ? (
            <ActivityIndicator size="small" color="#4ECDC4" />
          ) : isInstalled ? (
            <TouchableOpacity style={styles.openButtonSmall} onPress={() => onOpen(app.route)}>
              <Text style={styles.openButtonText}>Open</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.getButtonSmall} onPress={() => onInstall(app.id)}>
              <Text style={styles.getButtonText}>Get</Text>
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>
    );
  }

  if (variant === 'full') {
    return (
      <TouchableOpacity style={styles.fullCard} onPress={() => onPress(app.id)} activeOpacity={0.7}>
        <View style={styles.fullHeader}>
          <View style={[styles.iconContainerLarge, { backgroundColor: getIconBg(app.category) }]}>
            <Feather name={app.icon} size={40} color="#fff" />
          </View>
          <View style={styles.fullInfo}>
            <Text style={styles.fullName}>{app.name}</Text>
            <Text style={styles.fullTagline}>{app.tagline}</Text>
            <View style={styles.fullMeta}>
              <Text style={styles.ratingText}>{renderStars(app.rating)} {app.rating}</Text>
              <Text style={styles.dot}>·</Text>
              <Text style={styles.metaText}>{app.installCount}</Text>
              <Text style={styles.dot}>·</Text>
              <Text style={styles.metaText}>{app.size}</Text>
            </View>
          </View>
        </View>
        {app.ranking && (
          <View style={styles.rankingBadge}>
            <Feather name="award" size={14} color="#FFD700" />
            <Text style={styles.rankingText}>#{app.ranking.rank} in {app.ranking.category}</Text>
          </View>
        )}
        <View style={styles.tagsRow}>
          {app.tags.map(tag => (
            <View key={tag} style={styles.tagPill}>
              <Text style={styles.tagText}>{tag}</Text>
            </View>
          ))}
        </View>
        <View style={styles.fullActions}>
          {isInstalling ? (
            <View style={styles.installingButton}>
              <ActivityIndicator size="small" color="#fff" />
              <Text style={styles.installingText}>Installing...</Text>
            </View>
          ) : isInstalled ? (
            <TouchableOpacity style={styles.openButtonFull} onPress={() => onOpen(app.route)}>
              <Text style={styles.openButtonFullText}>Open</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.getButtonFull} onPress={() => onInstall(app.id)}>
              <Text style={styles.getButtonFullText}>Get</Text>
            </TouchableOpacity>
          )}
          {app.sponsored && (
            <View style={styles.sponsoredBadge}>
              <Text style={styles.sponsoredText}>Sponsored</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  }

  // Compact (default)
  return (
    <TouchableOpacity style={styles.compactCard} onPress={() => onPress(app.id)} activeOpacity={0.7}>
      <View style={[styles.iconContainer, { backgroundColor: getIconBg(app.category) }]}>
        <Feather name={app.icon} size={32} color="#fff" />
      </View>
      <Text style={styles.name} numberOfLines={1}>{app.name}</Text>
      <Text style={styles.category}>{app.category}</Text>
      <View style={styles.compactActions}>
        {isInstalling ? (
          <ActivityIndicator size="small" color="#4ECDC4" />
        ) : isInstalled ? (
          <TouchableOpacity style={styles.openButtonSmall} onPress={() => onOpen(app.route)}>
            <Text style={styles.openButtonText}>Open</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.getButtonSmall} onPress={() => onInstall(app.id)}>
            <Text style={styles.getButtonText}>Get</Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
}

function getIconBg(category: string): string {
  const map: Record<string, string> = {
    social: '#FF6B6B',
    finance: '#4ECDC4',
    transport: '#45B7D1',
    health: '#96CEB4',
    education: '#FFEAA7',
    shopping: '#DDA0DD',
    productivity: '#98D8C8',
    entertainment: '#F7DC6F',
    civic: '#BB8FCE',
    communication: '#85C1E9',
  };
  return map[category] || '#4ECDC4';
}

const styles = StyleSheet.create({
  compactCard: {
    width: 110,
    alignItems: 'center',
    marginRight: 16,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  name: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
    width: '100%',
  },
  category: {
    color: '#888',
    fontSize: 11,
    marginTop: 2,
    textTransform: 'capitalize',
  },
  compactActions: {
    marginTop: 8,
  },
  getButtonSmall: {
    backgroundColor: '#2A2A2A',
    paddingHorizontal: 20,
    paddingVertical: 6,
    borderRadius: 20,
    minWidth: 70,
    alignItems: 'center',
  },
  getButtonText: {
    color: '#4ECDC4',
    fontSize: 13,
    fontWeight: '600',
  },
  openButtonSmall: {
    backgroundColor: '#2A2A2A',
    paddingHorizontal: 20,
    paddingVertical: 6,
    borderRadius: 20,
    minWidth: 70,
    alignItems: 'center',
  },
  openButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  horizontalCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#1C1C1C',
    borderRadius: 12,
    marginBottom: 8,
  },
  horizontalInfo: {
    flex: 1,
    marginLeft: 12,
  },
  actionContainer: {
    marginLeft: 12,
  },
  ratingText: {
    color: '#FFD700',
    fontSize: 12,
    marginTop: 2,
  },
  dot: {
    color: '#666',
    fontSize: 12,
    marginHorizontal: 4,
  },
  metaText: {
    color: '#888',
    fontSize: 12,
  },
  fullCard: {
    backgroundColor: '#1C1C1C',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  fullHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainerLarge: {
    width: 80,
    height: 80,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullInfo: {
    flex: 1,
    marginLeft: 16,
  },
  fullName: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
  },
  fullTagline: {
    color: '#aaa',
    fontSize: 14,
    marginTop: 2,
  },
  fullMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  rankingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,215,0,0.15)',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginTop: 10,
  },
  rankingText: {
    color: '#FFD700',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 6,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 10,
    gap: 6,
  },
  tagPill: {
    backgroundColor: '#2A2A2A',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  tagText: {
    color: '#aaa',
    fontSize: 11,
  },
  fullActions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 14,
    gap: 10,
  },
  getButtonFull: {
    backgroundColor: '#4ECDC4',
    paddingHorizontal: 40,
    paddingVertical: 12,
    borderRadius: 24,
    flex: 1,
    alignItems: 'center',
  },
  getButtonFullText: {
    color: '#121212',
    fontSize: 16,
    fontWeight: '700',
  },
  openButtonFull: {
    backgroundColor: '#2A2A2A',
    paddingHorizontal: 40,
    paddingVertical: 12,
    borderRadius: 24,
    flex: 1,
    alignItems: 'center',
  },
  openButtonFullText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  installingButton: {
    backgroundColor: '#333',
    paddingHorizontal: 40,
    paddingVertical: 12,
    borderRadius: 24,
    flex: 1,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  installingText: {
    color: '#aaa',
    fontSize: 16,
    fontWeight: '600',
  },
  sponsoredBadge: {
    backgroundColor: 'rgba(78,205,196,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  sponsoredText: {
    color: '#4ECDC4',
    fontSize: 11,
    fontWeight: '600',
  },
});

