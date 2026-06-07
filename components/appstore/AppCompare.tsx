import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { AppItem } from '@/hooks/useAppStore';

interface AppCompareProps {
  apps: AppItem[];
  visible: boolean;
  onClose: () => void;
}

export function AppCompare({ apps, visible, onClose }: AppCompareProps) {
  if (!visible || apps.length < 2) return null;

  const [app1, app2] = apps.slice(0, 2);

  const compareRows = [
    { label: 'Rating', app1: `${app1.rating}★`, app2: `${app2.rating}★`, winner: app1.rating > app2.rating ? 1 : app2.rating > app1.rating ? 2 : 0 },
    { label: 'Reviews', app1: app1.reviewCount.toLocaleString(), app2: app2.reviewCount.toLocaleString(), winner: app1.reviewCount > app2.reviewCount ? 1 : app2.reviewCount > app1.reviewCount ? 2 : 0 },
    { label: 'Size', app1: app1.size, app2: app2.size, winner: 0 },
    { label: 'Version', app1: app1.version, app2: app2.version, winner: 0 },
    { label: 'Downloads', app1: app1.installCount, app2: app2.installCount, winner: 0 },
    { label: 'Category', app1: app1.category, app2: app2.category, winner: 0 },
  ];

  const featureCompare = () => {
    const allFeatures = Array.from(new Set([...app1.features, ...app2.features]));
    return allFeatures.slice(0, 6).map(feature => ({
      feature,
      app1Has: app1.features.includes(feature),
      app2Has: app2.features.includes(feature),
    }));
  };

  return (
    <View style={styles.overlay}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose}>
            <Feather name="arrow-left" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Compare Apps</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          {/* App Headers */}
          <View style={styles.appHeaders}>
            <View style={styles.appHeader}>
              <View style={[styles.appIcon, { backgroundColor: getIconBg(app1.category) }]}>
                <Feather name={app1.icon} size={28} color="#fff" />
              </View>
              <Text style={styles.appName} numberOfLines={1}>{app1.name}</Text>
              <Text style={styles.appTagline} numberOfLines={1}>{app1.tagline}</Text>
            </View>
            <View style={styles.vsBadge}>
              <Text style={styles.vsText}>VS</Text>
            </View>
            <View style={styles.appHeader}>
              <View style={[styles.appIcon, { backgroundColor: getIconBg(app2.category) }]}>
                <Feather name={app2.icon} size={28} color="#fff" />
              </View>
              <Text style={styles.appName} numberOfLines={1}>{app2.name}</Text>
              <Text style={styles.appTagline} numberOfLines={1}>{app2.tagline}</Text>
            </View>
          </View>

          {/* Comparison Table */}
          <View style={styles.tableCard}>
            {compareRows.map((row, idx) => (
              <View key={row.label} style={[styles.tableRow, idx < compareRows.length - 1 && styles.tableRowBorder]}>
                <Text style={styles.tableLabel}>{row.label}</Text>
                <View style={styles.tableValues}>
                  <Text style={[styles.tableValue, row.winner === 1 && styles.winnerValue]}>{row.app1}</Text>
                  <Text style={[styles.tableValue, row.winner === 2 && styles.winnerValue]}>{row.app2}</Text>
                </View>
                {row.winner > 0 && (
                  <View style={[styles.winnerBadge, { alignSelf: row.winner === 1 ? 'flex-start' : 'flex-end' }]}>
                    <Feather name="check-circle" size={12} color="#4ECDC4" />
                  </View>
                )}
              </View>
            ))}
          </View>

          {/* Features Comparison */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Features</Text>
            <View style={styles.featuresCard}>
              <View style={styles.featuresHeader}>
                <Text style={styles.featuresHeaderText} numberOfLines={1}>{app1.name}</Text>
                <Text style={styles.featuresHeaderText} numberOfLines={1}>{app2.name}</Text>
              </View>
              {featureCompare().map((f, idx) => (
                <View key={idx} style={[styles.featureRow, idx < featureCompare().length - 1 && styles.featureRowBorder]}>
                  <View style={styles.featureCheck}>
                    {f.app1Has ? (
                      <Feather name="check-circle" size={16} color="#4ECDC4" />
                    ) : (
                      <Feather name="x-circle" size={16} color="#FF6B6B" />
                    )}
                  </View>
                  <Text style={styles.featureName}>{f.feature}</Text>
                  <View style={styles.featureCheck}>
                    {f.app2Has ? (
                      <Feather name="check-circle" size={16} color="#4ECDC4" />
                    ) : (
                      <Feather name="x-circle" size={16} color="#FF6B6B" />
                    )}
                  </View>
                </View>
              ))}
            </View>
          </View>

          {/* Verdict */}
          <View style={styles.section}>
            <View style={styles.verdictCard}>
              <Feather name="award" size={20} color="#FFD700" />
              <Text style={styles.verdictText}>
                {app1.rating > app2.rating
                  ? `${app1.name} has a higher user rating (${app1.rating}★ vs ${app2.rating}★).`
                  : app2.rating > app1.rating
                  ? `${app2.name} has a higher user rating (${app2.rating}★ vs ${app1.rating}★).`
                  : 'Both apps have the same rating. Choose based on features.'}
              </Text>
            </View>
          </View>

          <View style={styles.bottomSpacer} />
        </ScrollView>
      </View>
    </View>
  );
}

function getIconBg(category: string): string {
  const map: Record<string, string> = {
    social: '#FF6B6B', finance: '#4ECDC4', transport: '#45B7D1',
    health: '#96CEB4', education: '#FFEAA7', shopping: '#DDA0DD',
    productivity: '#98D8C8', entertainment: '#F7DC6F', civic: '#BB8FCE',
    communication: '#85C1E9',
  };
  return map[category] || '#4ECDC4';
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
  appHeaders: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  appHeader: {
    alignItems: 'center',
    flex: 1,
  },
  appIcon: {
    width: 64,
    height: 64,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  appName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  appTagline: {
    color: '#888',
    fontSize: 12,
    marginTop: 2,
    textAlign: 'center',
  },
  vsBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2A2A2A',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 10,
  },
  vsText: {
    color: '#FFD700',
    fontSize: 12,
    fontWeight: '800',
  },
  tableCard: {
    backgroundColor: '#1C1C1C',
    borderRadius: 16,
    marginHorizontal: 16,
    overflow: 'hidden',
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  tableRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A2A',
  },
  tableLabel: {
    color: '#888',
    fontSize: 14,
    fontWeight: '500',
    width: 80,
  },
  tableValues: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  tableValue: {
    color: '#ccc',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    flex: 1,
  },
  winnerValue: {
    color: '#4ECDC4',
    fontWeight: '700',
  },
  winnerBadge: {
    position: 'absolute',
    right: 16,
    top: 14,
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  featuresCard: {
    backgroundColor: '#1C1C1C',
    borderRadius: 16,
    overflow: 'hidden',
  },
  featuresHeader: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A2A',
    backgroundColor: '#222',
  },
  featuresHeaderText: {
    flex: 1,
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  featureRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A2A',
  },
  featureCheck: {
    width: 40,
    alignItems: 'center',
  },
  featureName: {
    flex: 1,
    color: '#ccc',
    fontSize: 14,
    textAlign: 'center',
  },
  verdictCard: {
    backgroundColor: 'rgba(255,215,0,0.08)',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,215,0,0.15)',
  },
  verdictText: {
    flex: 1,
    color: '#FFD700',
    fontSize: 14,
    lineHeight: 22,
    fontWeight: '600',
  },
  bottomSpacer: {
    height: 40,
  },
});

