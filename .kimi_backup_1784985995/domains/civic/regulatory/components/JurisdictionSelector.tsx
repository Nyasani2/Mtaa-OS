import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Flag } from 'lucide-react-native';
import { Colors } from '@/constants/Colors';
import { JURISDICTIONS } from '@/domains/civic/regulatory/config/jurisdictions';

interface Props {
  selected: string;
  onSelect: (code: string) => void;
}

export function JurisdictionSelector({ selected, onSelect }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>Jurisdiction</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.row}>
          {Object.values(JURISDICTIONS).map((j) => (
            <TouchableOpacity
              key={j.code}
              style={[styles.chip, selected === j.code && styles.chipActive]}
              onPress={() => onSelect(j.code)}
            >
              <Text style={styles.flag}>{j.flag}</Text>
              <Text style={[styles.chipText, selected === j.code && styles.chipTextActive]}>
                {j.code}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 20, marginTop: 12 },
  label: { fontSize: 12, fontWeight: '600', color: Colors.gray[500], marginBottom: 8, textTransform: 'uppercase' },
  row: { flexDirection: 'row', gap: 8, paddingRight: 20 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.gray[100],
    borderWidth: 1,
    borderColor: Colors.gray[200],
  },
  chipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  flag: { fontSize: 16 },
  chipText: { fontSize: 13, fontWeight: '600', color: Colors.gray[600] },
  chipTextActive: { color: Colors.white },
});
