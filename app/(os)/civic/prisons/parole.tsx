import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { PrisonNav } from '../../../../../lib/civic/prisons/components/PrisonNav';
import { ParoleReviewsList } from '../../../../../lib/civic/prisons/components/ParoleReviewsList';
import { ParoleReviewForm } from '../../../../../lib/civic/prisons/components/ParoleReviewForm';
import { useParole } from '../../../../../lib/civic/prisons/hooks/useParole';

export default function PrisonParole() {
  const { reviews, isLoading } = useParole();
  const [showForm, setShowForm] = React.useState(false);

  return (
    <View style={styles.container}>
      <PrisonNav />

      <View style={styles.header}>
        <Text style={styles.title}>Parole Reviews</Text>
        <TouchableOpacity style={styles.newBtn} onPress={() => setShowForm(true)}>
          <FontAwesome5 name="plus" size={14} color="#FFFFFF" />
          <Text style={styles.newBtnText}>New Review</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {showForm && (
          <View style={styles.formContainer}>
            <ParoleReviewForm onClose={() => setShowForm(false)} />
          </View>
        )}
        <ParoleReviewsList reviews={reviews || []} isLoading={isLoading} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  title: { fontSize: 20, fontWeight: '700', color: '#0F172A' },
  newBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0891B2',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  newBtnText: { color: '#FFFFFF', fontSize: 13, fontWeight: '600' },
  content: { padding: 16 },
  formContainer: { marginBottom: 16 },
});
