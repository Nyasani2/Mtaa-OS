import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const docs = [
  { id: 1, name: 'ID Card.pdf', size: '2.4 MB', type: 'pdf', date: 'Today' },
  { id: 2, name: 'Passport.jpg', size: '1.8 MB', type: 'image', date: 'Yesterday' },
  { id: 3, name: 'Contract.docx', size: '450 KB', type: 'doc', date: '2 days ago' },
  { id: 4, name: 'Receipt_001.pdf', size: '120 KB', type: 'pdf', date: 'Last week' },
];

const iconMap = { pdf: 'document-text', image: 'image', doc: 'reader' };
const colorMap = { pdf: '#EF4444', image: '#10B981', doc: '#3B82F6' };

export function DocumentsShell() {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Documents</Text>
        <TouchableOpacity style={styles.uploadBtn}>
          <Ionicons name="cloud-upload" size={20} color="white" />
        </TouchableOpacity>
      </View>
      <View style={styles.stats}>
        <View style={styles.statBox}>
          <Text style={styles.statNum}>{docs.length}</Text>
          <Text style={styles.statLabel}>Files</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statNum}>4.8 MB</Text>
          <Text style={styles.statLabel}>Used</Text>
        </View>
      </View>
      <FlatList
        data={docs}
        keyExtractor={d => d.id.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.docRow}>
            <View style={[styles.iconBox, { backgroundColor: colorMap[item.type as keyof typeof colorMap] + '20' }]}>
              <Ionicons name={iconMap[item.type as keyof typeof iconMap] as any} size={22} color={colorMap[item.type as keyof typeof colorMap]} />
            </View>
            <View style={styles.docInfo}>
              <Text style={styles.docName}>{item.name}</Text>
              <Text style={styles.docMeta}>{item.size} • {item.date}</Text>
            </View>
            <Ionicons name="ellipsis-vertical" size={16} color="#64748B" />
          </TouchableOpacity>
        )}
        contentContainerStyle={{ padding: 16 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#050816' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: 60 },
  title: { fontSize: 32, fontWeight: 'bold', color: 'white' },
  uploadBtn: { backgroundColor: '#6366F1', padding: 10, borderRadius: 12 },
  stats: { flexDirection: 'row', paddingHorizontal: 16, gap: 12 },
  statBox: { flex: 1, backgroundColor: '#1E293B', borderRadius: 12, padding: 14, alignItems: 'center' },
  statNum: { color: 'white', fontSize: 18, fontWeight: 'bold' },
  statLabel: { color: '#94A3B8', fontSize: 12, marginTop: 2 },
  docRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1E293B', padding: 14, borderRadius: 12, marginBottom: 8 },
  iconBox: { width: 40, height: 40, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  docInfo: { flex: 1, marginLeft: 12 },
  docName: { color: 'white', fontSize: 14 },
  docMeta: { color: '#64748B', fontSize: 12, marginTop: 2 },
});
