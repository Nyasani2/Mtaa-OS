import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { Text } from 'react-native';

interface BorderNavProps {
  alertCount: number;
}

const navItems = [
  { href: '/(os)/civic/border/dashboard', label: 'Dashboard', icon: '📊' },
  { href: '/(os)/civic/border/cargo', label: 'Cargo', icon: '📦' },
  { href: '/(os)/civic/border/inspection', label: 'Inspect', icon: '🔍' },
  { href: '/(os)/civic/border/transit', label: 'Transit', icon: '🛤️' },
  { href: '/(os)/civic/border/operations', label: 'Ops', icon: '👮' },
];

export function BorderNav({ alertCount }: BorderNavProps) {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <View style={styles.navContainer}>
      {navItems.map(item => {
        const isActive = pathname?.startsWith(item.href);
        return (
          <TouchableOpacity
            key={item.href}
            style={[styles.navItem, isActive && styles.navItemActive]}
            onPress={() => router.push(item.href)}
          >
            <Text style={styles.navIcon}>{item.icon}</Text>
            <Text style={[styles.navLabel, isActive && styles.navLabelActive]}>{item.label}</Text>
            {item.href.includes('dashboard') && alertCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{alertCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  navContainer: {
    flexDirection: 'row',
    backgroundColor: '#1e293b',
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  navItem: { flex: 1, alignItems: 'center', paddingVertical: 6, borderRadius: 6 },
  navItemActive: { backgroundColor: '#0f172a' },
  navIcon: { fontSize: 18, marginBottom: 2 },
  navLabel: { color: '#94a3b8', fontSize: 10 },
  navLabelActive: { color: '#10b981', fontWeight: '700' },
  badge: { position: 'absolute', top: 2, right: 8, backgroundColor: '#ef4444', borderRadius: 8, minWidth: 16, height: 16, justifyContent: 'center', alignItems: 'center' },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: '700' },
});
