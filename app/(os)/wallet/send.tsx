import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { PaymentAuth } from '@/components/wallet/PaymentAuth';
import { supabase } from '@/lib/supabase/client';
import { Ionicons } from '@expo/vector-icons';

export default function SendScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const user = useAuthStore((s) => s.user);

  const [recipientId, setRecipientId] = useState<string>(params.recipientId as string || '');
  const [recipientName, setRecipientName] = useState<string>(params.recipientName as string || '');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(false);
  const [fetchingRecipient, setFetchingRecipient] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [transferResult, setTransferResult] = useState<{ success: boolean; message: string } | null>(null);

  const numericAmount = parseFloat(amount) || 0;
  const fee = numericAmount * 0.01; // 1% fee
  const total = numericAmount + fee;

  useEffect(() => {
    fetchBalance();
    if (params.recipientId && !params.recipientName) {
      fetchRecipientName(params.recipientId as string);
    }
  }, []);

  const fetchBalance = async () => {
    if (!user?.id) return;
    const { data } = await supabase
      .from('wallet_accounts')
      .select('balance, available_balance')
      .eq('user_id', user.id)
      .eq('is_default', true)
      .single();
    if (data) setBalance(data.available_balance || data.balance || 0);
  };

  const fetchRecipientName = async (id: string) => {
    setFetchingRecipient(true);
    const { data } = await supabase
      .from('user_profiles')
      .select('display_name, username')
      .eq('user_id', id)
      .single();
    if (data) {
      setRecipientName(data.display_name || data.username || 'Unknown');
    }
    setFetchingRecipient(false);
  };

  const handleConfirm = () => {
    if (!recipientId || numericAmount <= 0) {
      Alert.alert('Error', 'Please enter a valid recipient and amount');
      return;
    }
    if (total > balance) {
      Alert.alert('Insufficient Balance', `Your available balance is ${balance.toFixed(2)}`);
      return;
    }
    setShowAuth(true);
  };

  const handleAuthSuccess = async () => {
    setShowAuth(false);
    setLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const response = await fetch(
        `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/wallet-transfer`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            recipient_id: recipientId,
            amount: numericAmount,
            currency: 'KES',
            description: note || 'MTAA Transfer',
            metadata: {
              recipient_name: recipientName,
              fee,
              auth_method: useAuthStore.getState().biometricEnabled ? 'biometric' : 'pin',
            },
          }),
        }
      );

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Transfer failed');

      setTransferResult({ success: true, message: `Sent ${currency} ${numericAmount.toFixed(2)} to ${recipientName}` });
      fetchBalance();
    } catch (err: any) {
      setTransferResult({ success: false, message: err.message || 'Transfer failed' });
    } finally {
      setLoading(false);
    }
  };

  const handleAuthCancel = () => {
    setShowAuth(false);
  };

  const currency = 'KSh';

  if (transferResult) {
    return (
      <View style={styles.resultContainer}>
        <View style={[styles.resultCard, transferResult.success ? styles.successCard : styles.errorCard]}>
          <Ionicons
            name={transferResult.success ? 'checkmark-circle' : 'close-circle'}
            size={64}
            color={transferResult.success ? '#22c55e' : '#ef4444'}
          />
          <Text style={styles.resultTitle}>
            {transferResult.success ? 'Payment Sent' : 'Payment Failed'}
          </Text>
          <Text style={styles.resultMessage}>{transferResult.message}</Text>
        </View>
        <TouchableOpacity style={styles.doneButton} onPress={() => router.back()}>
          <Text style={styles.doneText}>Done</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text style={styles.title}>Send Money</Text>
          <Text style={styles.subtitle}>Available: {currency} {balance.toFixed(2)}</Text>
        </View>

        <View style={styles.form}>
          {/* Recipient */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Recipient</Text>
            <View style={styles.recipientBox}>
              {fetchingRecipient ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <>
                  <Ionicons name="person-circle" size={28} color="#3b82f6" />
                  <Text style={styles.recipientText}>
                    {recipientName || recipientId.substring(0, 8) + '...'}
                  </Text>
                </>
              )}
            </View>
          </View>

          {/* Amount */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Amount</Text>
            <View style={styles.amountInputBox}>
              <Text style={styles.currencySymbol}>{currency}</Text>
              <TextInput
                style={styles.amountInput}
                keyboardType="decimal-pad"
                placeholder="0.00"
                placeholderTextColor="rgba(255,255,255,0.3)"
                value={amount}
                onChangeText={setAmount}
                maxLength={10}
              />
            </View>
          </View>

          {/* Note */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Note (optional)</Text>
            <TextInput
              style={styles.noteInput}
              placeholder="What's this for?"
              placeholderTextColor="rgba(255,255,255,0.3)"
              value={note}
              onChangeText={setNote}
              maxLength={100}
            />
          </View>

          {/* Summary */}
          {numericAmount > 0 && (
            <View style={styles.summary}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Amount</Text>
                <Text style={styles.summaryValue}>{currency} {numericAmount.toFixed(2)}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Fee (1%)</Text>
                <Text style={styles.summaryValue}>{currency} {fee.toFixed(2)}</Text>
              </View>
              <View style={[styles.summaryRow, styles.totalRow]}>
                <Text style={styles.totalLabel}>Total</Text>
                <Text style={styles.totalValue}>{currency} {total.toFixed(2)}</Text>
              </View>
            </View>
          )}

          <TouchableOpacity
            style={[
              styles.confirmButton,
              (!recipientId || numericAmount <= 0 || total > balance) && styles.confirmButtonDisabled,
            ]}
            onPress={handleConfirm}
            disabled={!recipientId || numericAmount <= 0 || total > balance || loading}
          >
            {loading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.confirmText}>Confirm & Authorize</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>

      {showAuth && (
        <PaymentAuth
          amount={total}
          currency={currency}
          recipientName={recipientName || 'Recipient'}
          onSuccess={handleAuthSuccess}
          onCancel={handleAuthCancel}
        />
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0f',
  },
  scroll: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.5)',
  },
  form: {
    gap: 20,
  },
  inputGroup: {
    gap: 8,
  },
  inputLabel: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.5)',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  recipientBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  recipientText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  amountInputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  currencySymbol: {
    fontSize: 20,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.5)',
    marginRight: 8,
  },
  amountInput: {
    flex: 1,
    fontSize: 28,
    fontWeight: '700',
    color: '#ffffff',
  },
  noteInput: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    color: '#ffffff',
    fontSize: 15,
  },
  summary: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  summaryLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.5)',
  },
  summaryValue: {
    fontSize: 14,
    color: '#ffffff',
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
    marginTop: 8,
    paddingTop: 12,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
  },
  totalValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#3b82f6',
  },
  confirmButton: {
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: '#2563eb',
    alignItems: 'center',
    marginTop: 8,
  },
  confirmButtonDisabled: {
    backgroundColor: 'rgba(37,99,235,0.3)',
  },
  confirmText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  resultContainer: {
    flex: 1,
    backgroundColor: '#0a0a0f',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  resultCard: {
    alignItems: 'center',
    padding: 32,
    borderRadius: 16,
    width: '100%',
    borderWidth: 1,
  },
  successCard: {
    backgroundColor: 'rgba(34,197,94,0.08)',
    borderColor: 'rgba(34,197,94,0.2)',
  },
  errorCard: {
    backgroundColor: 'rgba(239,68,68,0.08)',
    borderColor: 'rgba(239,68,68,0.2)',
  },
  resultTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff',
    marginTop: 16,
    marginBottom: 8,
  },
  resultMessage: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
  },
  doneButton: {
    marginTop: 24,
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  doneText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '600',
  },
});
