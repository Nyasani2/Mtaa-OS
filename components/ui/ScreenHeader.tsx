import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { FontAwesome5 } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  rightAction?: { icon: string; onPress: () => void; label?: string };
  onBack?: () => void;
  transparent?: boolean;
}

export const ScreenHeader: React.FC<ScreenHeaderProps> = ({
  title, subtitle, showBack = false, rightAction, onBack, transparent = false,
}) => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const handleBack = () => { if (onBack) onBack(); else router.back(); };

  return (
    <View style={[styles.container, transparent && styles.transparent, { paddingTop: insets.top + 8 }]}>
      <View style={styles.content}>
        <View style={styles.left}>
          {showBack && (
            <TouchableOpacity style={styles.backBtn} onPress={handleBack}>
              <FontAwesome5 name="arrow-left" size={18} color="#334155" />
            </TouchableOpacity>
          )}
          <View>
            <Text style={styles.title}>{title}</Text>
            {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
          </View>
        </View>
        {rightAction && (
          <TouchableOpacity style={styles.rightBtn} onPress={rightAction.onPress}>
            <FontAwesome5 name={rightAction.icon} size={18} color="#1E40AF" />
            {rightAction.label && <Text style={styles.rightLabel}>{rightAction.label}</Text>}
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E2E8F0', paddingHorizontal: 16, paddingBottom: 12 },
  transparent: { backgroundColor: 'transparent', borderBottomWidth: 0 },
  content: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  left: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  backBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 20, fontWeight: '800', color: '#0F172A' },
  subtitle: { fontSize: 12, color: '#94A3B8', marginTop: 2 },
  rightBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, backgroundColor: '#EFF6FF' },
  rightLabel: { fontSize: 13, fontWeight: '600', color: '#1E40AF' },
});
