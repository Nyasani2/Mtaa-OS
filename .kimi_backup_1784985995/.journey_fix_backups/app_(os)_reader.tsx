// app/(os)/reader/index.tsx — MTAA OS Document Reader
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SIZES } from '@/constants/theme';

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
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Reader</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: SIZES.md }}>
        <Text style={styles.sectionTitle}>Documents</Text>
        {DOCUMENTS.map(doc => (
          <TouchableOpacity
            key={doc.id}
            style={[styles.docCard, selectedDoc === doc.id && styles.docCardActive]}
            onPress={() => setSelectedDoc(doc.id)}
          >
            <Ionicons name={doc.type === 'pdf' ? "document-text" : "document"} size={32} color={COLORS.primary} />
            <View style={styles.docInfo}>
              <Text style={styles.docTitle}>{doc.title}</Text>
              <Text style={styles.docMeta}>{doc.type.toUpperCase()} • {doc.size} • {doc.date}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={COLORS.textSecondary} />
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: SIZES.md, paddingTop: SIZES.xl, paddingBottom: SIZES.md },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  headerTitle: { fontFamily: FONTS.bold, fontSize: 18, color: COLORS.text },
  sectionTitle: { fontFamily: FONTS.bold, fontSize: 16, color: COLORS.text, marginBottom: SIZES.md },
  docCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surface, borderRadius: SIZES.md, padding: SIZES.md, marginBottom: SIZES.sm },
  docCardActive: { borderWidth: 2, borderColor: COLORS.primary },
  docInfo: { flex: 1, marginLeft: SIZES.md },
  docTitle: { fontFamily: FONTS.medium, fontSize: 15, color: COLORS.text },
  docMeta: { fontFamily: FONTS.regular, fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
});
