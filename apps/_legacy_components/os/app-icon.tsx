import { View, Text, StyleSheet } from 'react-native';

const ICONS: Record<string, string> = {
  wallet: 'W',
  shield: 'S',
  command: 'C',
  store: 'A',
  settings: '⚙',
};

export function AppIcon({ name, color, size = 56 }: { name: string; color: string; size?: number }) {
  return (
    <View style={[styles.container, { backgroundColor: color, width: size, height: size, borderRadius: size * 0.22 }]}>
      <Text style={[styles.text, { fontSize: size * 0.4 }]}>
        {ICONS[name] || name[0]?.toUpperCase()}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center' },
  text: { color: '#fff', fontWeight: 'bold' },
});
