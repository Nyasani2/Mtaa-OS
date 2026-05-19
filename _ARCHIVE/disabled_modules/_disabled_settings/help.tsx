import { useState } from 'react';
import { 
  View, Text, TouchableOpacity, StyleSheet, ScrollView, 
  TextInput, FlatList 
} from 'react-native';
import { router } from 'expo-router';

interface FaqItem {
  id: string;
  question: string;
  answer: string;
  category: string;
}

const faqs: FaqItem[] = [
  {
    id: '1',
    question: 'How do I send money?',
    category: 'Wallet',
  },
  {
    id: '2',
    question: 'What is GoFund?',
    answer: 'GoFund is MTAA\'s micro-credit system. Based on your transaction history and reputation, you may qualify for instant credit.',
    category: 'Credit',
  },
  {
    id: '3',
    question: 'How do I verify my identity?',
    answer: 'Go to Settings → KYC / Identity and complete the verification levels. Higher levels unlock more features.',
    category: 'Identity',
  },
  {
    id: '4',
    question: 'How do tribes work?',
    answer: 'Tribes are community groups. You can join existing tribes or create your own. Each tribe has its own governance, marketplace, and treasury.',
    category: 'Tribes',
  },
  {
    id: '5',
    question: 'Is my money safe?',
    category: 'Security',
  },
  {
    id: '6',
    question: 'How do I earn reputation?',
    answer: 'Complete transactions, verify your identity, participate in tribes, and maintain a positive track record. Higher reputation unlocks better rates.',
    category: 'Reputation',
  },
  {
    id: '7',
    question: 'What are rails?',
    answer: 'Rails are payment channels — M-Pesa, bank transfer, crypto, card. MTAA automatically routes to the fastest, cheapest rail.',
    category: 'Payments',
  },
  {
    id: '8',
    question: 'How do I contact support?',
    answer: 'Go to Settings → Support or email support@mtaa-afriq.com. Live chat is available for verified users.',
    category: 'Support',
  },
];

export default function HelpScreen() {
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);

  const filtered = faqs.filter(f => 
    f.question.toLowerCase().includes(search.toLowerCase()) ||
    f.answer.toLowerCase().includes(search.toLowerCase()) ||
    f.category.toLowerCase().includes(search.toLowerCase())
  );

  const renderItem = ({ item }: { item: FaqItem }) => (
    <TouchableOpacity 
      style={styles.faqCard}
      onPress={() => setExpanded(expanded === item.id ? null : item.id)}
    >
      <View style={styles.faqHeader}>
        <Text style={styles.faqCategory}>{item.category}</Text>
        <Text style={styles.expandIcon}>{expanded === item.id ? '−' : '+'}</Text>
      </View>
      <Text style={styles.faqQuestion}>{item.question}</Text>
      {expanded === item.id && (
        <Text style={styles.faqAnswer}>{item.answer}</Text>
      )}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Help Center</Text>
      
      <TextInput
        style={styles.searchInput}
        placeholder="Search help articles..."
        placeholderTextColor="#888"
        value={search}
        onChange={setSearch}
      />

      <FlatList
        data={filtered}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No results found</Text>
            <Text style={styles.emptySub}>Try a different search term</Text>
          </View>
        }
      />

      <TouchableOpacity style={styles.supportBtn} onPress={() => router.push('/(os)/settings/support')}>
        <Text style={styles.supportBtnText}>💬 Contact Support</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Text style={styles.backText}>← Back</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  title: { fontSize: 28, fontWeight: 'bold', color: '#fff', padding: 16, paddingTop: 48 },
  searchInput: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 12,
    color: '#fff',
    fontSize: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#333',
  },
  list: { paddingHorizontal: 16, paddingBottom: 160 },
  faqCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  faqHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  faqCategory: { color: '#6366f1', fontSize: 11, fontWeight: '600', textTransform: 'uppercase' },
  expandIcon: { color: '#888', fontSize: 18 },
  faqQuestion: { color: '#fff', fontSize: 15, fontWeight: '500' },
  faqAnswer: { color: '#aaa', fontSize: 14, marginTop: 8, lineHeight: 20 },
  empty: { alignItems: 'center', marginTop: 60 },
  emptyText: { color: '#666', fontSize: 16 },
  emptySub: { color: '#444', fontSize: 12, marginTop: 8 },
  supportBtn: {
    position: 'absolute',
    bottom: 60,
    left: 16,
    right: 16,
    backgroundColor: '#6366f1',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  supportBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  backButton: { position: 'absolute', bottom: 16, left: 16, right: 16, alignItems: 'center' },
  backText: { color: '#6366f1', fontSize: 14 },
});
