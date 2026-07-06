import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';

interface PaginatedListProps {
  page: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
  onNext: () => void;
  onPrev: () => void;
  isLoading?: boolean;
  children: React.ReactNode;
}

export function PaginatedList({
  page,
  totalPages,
  hasNext,
  hasPrev,
  onNext,
  onPrev,
  isLoading,
  children,
}: PaginatedListProps) {
  return (
    <View style={styles.container}>
      {children}
      <View style={styles.pagination}>
        <TouchableOpacity
          onPress={onPrev}
          disabled={!hasPrev || isLoading}
          style={[styles.button, (!hasPrev || isLoading) && styles.disabled]}
        >
          <Text style={styles.buttonText}>← Prev</Text>
        </TouchableOpacity>
        <Text style={styles.pageInfo}>
          {isLoading ? <ActivityIndicator size="small" color="#fff" /> : `Page ${page} of ${totalPages}`}
        </Text>
        <TouchableOpacity
          onPress={onNext}
          disabled={!hasNext || isLoading}
          style={[styles.button, (!hasNext || isLoading) && styles.disabled]}
        >
          <Text style={styles.buttonText}>Next →</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  button: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  disabled: { backgroundColor: '#444', opacity: 0.5 },
  buttonText: { color: '#fff', fontWeight: '600' },
  pageInfo: { color: '#fff', fontSize: 14 },
});
