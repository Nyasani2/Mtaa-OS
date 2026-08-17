// app/(os)/wallet/cards/index.tsx — MTAA Wallet Cards Hub
import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { useWalletStore } from '@/domains/wallet/hooks/useWallet';

interface Card {
  id: string;
  name: string;
  last4: string;
  expiry: string;
  type: 'visa' | 'mastercard' | 'mpesa' | 'bank';
  isDefault: boolean;
}

export default function WalletCardsScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { balance, currency } = useWalletStore();
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading cards — replace with actual API call
    const timer = setTimeout(() => {
      setCards([
        {
          id: '1',
          name: 'M-Pesa',
          last4: '2547',
          expiry: 'N/A',
          type: 'mpesa',
          isDefault: true,
        },
      ]);
      setLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  const getCardIcon = (type: string) => {
    switch (type) {
      case 'visa': return 'card';
      case 'mastercard': return 'card';
      case 'mpesa': return 'phone-portrait';
      case 'bank': return 'business';
      default: return 'card';
    }
  };

  const getCardColor = (type: string) => {
    switch (type) {
      case 'visa': return '#1a1f71';
      case 'mastercard': return '#eb001b';
      case 'mpesa': return '#00a650';
      case 'bank': return '#6366f1';
      default: return '#6b7280';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Cards & Payment Methods</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Balance Card */}
      <View style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>Available Balance</Text>
        <Text style={styles.balanceAmount}>
          {currency} {balance.toLocaleString('en-KE', { minimumFractionDigits: 2 })}
        </Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#6366f1" />
            <Text style={styles.loadingText}>Loading payment methods...</Text>
          </View>
        ) : cards.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="card-outline" size={64} color="#6b7280" />
            <Text style={styles.emptyTitle}>No Payment Methods</Text>
            <Text style={styles.emptyText}>
              Add a card, M-Pesa, or bank account to make payments.
            </Text>
            <TouchableOpacity style={styles.addButton}>
              <Ionicons name="add-circle" size={20} color="#fff" />
              <Text style={styles.addButtonText}>Add Payment Method</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <Text style={styles.sectionTitle}>Your Cards</Text>
            {cards.map((card) => (
              <View key={card.id} style={[styles.cardItem, { borderLeftColor: getCardColor(card.type) }]}>
                <View style={[styles.cardIcon, { backgroundColor: getCardColor(card.type) + '20' }]}>
                  <Ionicons name={getCardIcon(card.type)} size={24} color={getCardColor(card.type)} />
                </View>
                <View style={styles.cardInfo}>
                  <Text style={styles.cardName}>{card.name}</Text>
                  <Text style={styles.cardDetail}>•••• {card.last4}</Text>
                  {card.isDefault && (
                    <View style={styles.defaultBadge}>
                      <Text style={styles.defaultText}>Default</Text>
                    </View>
                  )}
                </View>
                <TouchableOpacity>
                  <Ionicons name="ellipsis-vertical" size={20} color="#6b7280" />
                </TouchableOpacity>
              </View>
            ))}

            <TouchableOpacity style={styles.addNewButton}>
              <Ionicons name="add" size={24} color="#6366f1" />
              <Text style={styles.addNewText}>Add New Payment Method</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  placeholder: {
    width: 40,
  },
  balanceCard: {
    marginHorizontal: 16,
    marginBottom: 20,
    padding: 20,
    backgroundColor: '#1e293b',
    borderRadius: 16,
    alignItems: 'center',
  },
  balanceLabel: {
    fontSize: 14,
    color: '#94a3b8',
    marginBottom: 8,
  },
  balanceAmount: {
    fontSize: 32,
    fontWeight: '800',
    color: '#fff',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 12,
    color: '#94a3b8',
    fontSize: 14,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    marginTop: 16,
  },
  emptyText: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
    marginTop: 8,
    marginHorizontal: 32,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#6366f1',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 24,
    gap: 8,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 12,
  },
  cardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
  },
  cardIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardInfo: {
    flex: 1,
    marginLeft: 12,
  },
  cardName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  cardDetail: {
    fontSize: 13,
    color: '#94a3b8',
    marginTop: 2,
  },
  defaultBadge: {
    backgroundColor: '#10b98120',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  defaultText: {
    fontSize: 11,
    color: '#10b981',
    fontWeight: '600',
  },
  addNewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1e293b',
    borderRadius: 12,
    paddingVertical: 16,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#6366f1',
    borderStyle: 'dashed',
    gap: 8,
  },
  addNewText: {
    color: '#6366f1',
    fontWeight: '600',
    fontSize: 14,
  },
});

