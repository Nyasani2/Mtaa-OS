import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Interest } from '@/hooks/useAppStore';

interface InterestPickerProps {
  interests: Interest[];
  onToggle: (id: string) => void;
  onComplete: () => void;
}

export function InterestPicker({ interests, onToggle, onComplete }: InterestPickerProps) {
  const selectedCount = interests.filter(i => i.selected).length;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>What are you interested in?</Text>
        <Text style={styles.subtitle}>Pick at least 3 to personalize your AppStore</Text>
      </View>

      <ScrollView contentContainerStyle={styles.chipsContainer} showsVerticalScrollIndicator={false}>
        {interests.map(interest => (
          <TouchableOpacity
            key={interest.id}
            style={[styles.chip, interest.selected && styles.chipSelected]}
            onPress={() => onToggle(interest.id)}
            activeOpacity={0.7}
          >
            <Text style={[styles.chipText, interest.selected && styles.chipTextSelected]}>
              {interest.label}
            </Text>
            {interest.selected && (
              <Feather name="check" size={14} color="#121212" style={styles.checkIcon} />
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={styles.footer}>
        <Text style={styles.countText}>{selectedCount} selected</Text>
        <TouchableOpacity
          style={[styles.continueButton, selectedCount < 3 && styles.continueButtonDisabled]}
          onPress={onComplete}
          disabled={selectedCount < 3}
          activeOpacity={0.8}
        >
          <Text style={styles.continueButtonText}>Continue</Text>
          <Feather name="arrow-right" size={18} color="#121212" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
    paddingTop: 60,
  },
  header: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  title: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '800',
    lineHeight: 36,
  },
  subtitle: {
    color: '#888',
    fontSize: 16,
    marginTop: 8,
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    paddingBottom: 20,
    gap: 10,
  },
  chip: {
    backgroundColor: '#1C1C1C',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#333',
    flexDirection: 'row',
    alignItems: 'center',
  },
  chipSelected: {
    backgroundColor: '#4ECDC4',
    borderColor: '#4ECDC4',
  },
  chipText: {
    color: '#ccc',
    fontSize: 15,
    fontWeight: '600',
  },
  chipTextSelected: {
    color: '#121212',
    fontWeight: '700',
  },
  checkIcon: {
    marginLeft: 6,
  },
  footer: {
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: '#222',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  countText: {
    color: '#888',
    fontSize: 14,
  },
  continueButton: {
    backgroundColor: '#4ECDC4',
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 28,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  continueButtonDisabled: {
    backgroundColor: '#333',
  },
  continueButtonText: {
    color: '#121212',
    fontSize: 16,
    fontWeight: '700',
  },
});
