// @ts-nocheck
// app/(os)/reader.tsx — MTAA OS Document Reader
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES } from '@/constants/theme';

const DOCUMENTS = [
  { id: '1', title: 'MTAA Terms of Service', type: 'pdf', size: '245 KB', date: '2026-01-15' },
  { id: '2', title: 'Privacy Policy', type: 'pdf', size: '128 KB', date: '2026-01-15' },
  { id: '3', title: 'Wallet User Guide', type: 'pdf', size: '1.2 MB', date: '2026-03-20' },
  { id: '4', title: 'KYC Requirements', type: 'doc', size: '89 KB', date: '2026-02-10' },
  { id: '5', title: 'Transaction Limits', type: 'pdf', size: '56 KB', date: '2026-04-05' },
];

export default function ReaderScreen() {
  const router = useRouter();
  const [selectedDoc, setSelectedDoc] = useState<string | null>(null);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={COLORS?.text || '#1a1a1a'} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Reader</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: SIZES?.md || 16 }}>
        <Text style={styles.sectionTitle}>Documents</Text>
        {DOCUMENTS.map((doc: any) => (
          <TouchableOpacity
            key={doc.id}
            style={[styles.docCard, selectedDoc === doc.id && styles.docCardActive]}
            onPress={() => setSelectedDoc(doc.id)}
          >
            <Ionicons
              name={doc.type === 'pdf' ? "document-text" : "document"}
              size={32}
              color={COLORS?.primary || '#0A4DA6'}
            />
            <View style={styles.docInfo}>
              <Text style={styles.docTitle}>{doc.title}</Text>
              <Text style={styles.docMeta}>
                {doc.type.toUpperCase()} • {doc.size} • {doc.date}
              </Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={20}
              color={COLORS?.textLight || '#888888'}
            />
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS?.background || '#f8f6f1',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SIZES?.md || 16,
    paddingTop: SIZES?.xl || 24,
    paddingBottom: SIZES?.md || 16,
  },
  backBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
  },
  headerTitle: {
    fontWeight: '700',
    fontSize: 18,
    color: COLORS?.text || '#1a1a1a',
  },
  sectionTitle: {
    fontWeight: '700',
    fontSize: 16,
    color: COLORS?.text || '#1a1a1a',
    marginBottom: SIZES?.md || 16,
  },
  docCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS?.white || '#ffffff',
    borderRadius: SIZES?.md || 16,
    padding: SIZES?.md || 16,
    marginBottom: SIZES?.sm || 8,
  },
  docCardActive: {
    borderWidth: 2,
    borderColor: COLORS?.primary || '#0A4DA6',
  },
  docInfo: {
    flex: 1,
    marginLeft: SIZES?.md || 16,
  },
  docTitle: {
    fontWeight: '500',
    fontSize: 15,
    color: COLORS?.text || '#1a1a1a',
  },
  docMeta: {
    fontWeight: '400',
    fontSize: 12,
    color: COLORS?.textLight || '#888888',
    marginTop: 2,
  },
});
