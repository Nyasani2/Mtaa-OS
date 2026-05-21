import { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Alert, TextInput
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';

export default function GiftScreen() {
  const { postId, userId } = useLocalSearchParams<{ postId?: string; userId?: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const [amount, setAmount] = useState(100);
  const [customAmount, setCustomAmount] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const presetAmounts = [50, 100, 200, 500, 1000, 5000];

  const handleSendGift = async () => {
    if (!user) {
      Alert.alert('Sign In', 'Please sign in to send gifts');
      return;
    }

    const finalAmount = customAmount ? parseInt(customAmount) : amount;
    if (!finalAmount || finalAmount < 10) {
      Alert.alert('Invalid Amount', 'Minimum gift amount is KES 10');
      return;
    }

    setLoading(true);
    try {
      // Check wallet balance
      const { data: wallet } = await supabase
        .from('wallets')
        .select('balance')
        .eq('user_id', user.id)
        .single();

      if (!wallet || wallet.balance < finalAmount) {
        Alert.alert('Insufficient Balance', 'Please top up your wallet');
        router.push('/wallet/topup');
        return;
      }

      // Get recipient (content owner)
      let recipientId = userId;
      if (!recipientId && postId) {
        const { data: content } = await supabase
          .from('street_content')
          .select('user_id')
          .eq('id', postId)
          .single();
        recipientId = content?.user_id;
      }

      if (!recipientId) {
        Alert.alert('Error', 'Could not determine recipient');
        return;
      }

      // Deduct from sender wallet
      await supabase.rpc('deduct_wallet_balance', {
        p_user_id: user.id,
        p_amount: finalAmount,
      });

      // Add to recipient wallet
      await supabase.rpc('add_wallet_balance', {
        p_user_id: recipientId,
        p_amount: finalAmount,
      });

      // Record gift
      await supabase.from('street_gifts').insert({
        sender_id: user.id,
        recipient_id: recipientId,
        content_id: postId || null,
        amount: finalAmount,
        currency: 'KES',
        gift_type: 'creator_tip',
      });

      // Update content gifts count
      if (postId) {
        await supabase.rpc('increment_gift_count', { content_id: postId });
      }

      // Create notification
      await supabase.from('street_notifications').insert({
        recipient_id: recipientId,
        type: 'gift',
        title: 'New Gift!',
        body: `${user.user_metadata?.display_name || 'Someone'} sent you KES ${finalAmount}`,
        sender_id: user.id,
        sender_name: user.user_metadata?.display_name || 'User',
        content_id: postId || null,
        amount: finalAmount,
      });

      Alert.alert('Sent!', `You sent KES ${finalAmount}`, [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to send gift');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="close" size={24} color="#f8fafc" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Send Gift</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.content}>
        <Text style={styles.label}>Select Amount</Text>
        <View style={styles.amountGrid}>
          {presetAmounts.map((amt) => (
            <TouchableOpacity
              key={amt}
              style={[styles.amountBtn, amount === amt && !customAmount && styles.amountBtnActive]}
              onPress={() => { setAmount(amt); setCustomAmount(''); }}
            >
              <Text style={[styles.amountText, amount === amt && !customAmount && styles.amountTextActive]}>
                KES {amt}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Custom Amount</Text>
        <TextInput
          style={styles.customInput}
          placeholder="Enter amount"
          placeholderTextColor="#475569"
          keyboardType="numeric"
          value={customAmount}
          onChangeText={setCustomAmount}
        />

        <Text style={styles.label}>Message (optional)</Text>
        <TextInput
          style={styles.messageInput}
          placeholder="Add a nice message..."
          placeholderTextColor="#475569"
          value={message}
          onChangeText={setMessage}
          multiline
          maxLength={200}
        />

        <TouchableOpacity
          style={[styles.sendBtn, loading && styles.sendBtnDisabled]}
          onPress={handleSendGift}
          disabled={loading}
        >
          <Ionicons name="gift-outline" size={20} color="#fff" />
          <Text style={styles.sendBtnText}>
            {loading ? 'Sending...' : `Send KES ${customAmount || amount}`}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 12,
  },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#f8fafc' },
  content: { padding: 16 },
  label: { fontSize: 14, fontWeight: '600', color: '#94a3b8', marginBottom: 10, marginTop: 16 },
  amountGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  amountBtn: {
    width: '30%',
    backgroundColor: '#1e293b',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  amountBtnActive: { backgroundColor: '#3b82f6', borderColor: '#3b82f6' },
  amountText: { fontSize: 15, fontWeight: '700', color: '#f8fafc' },
  amountTextActive: { color: '#fff' },
  customInput: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: '#f8fafc',
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  messageInput: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: '#f8fafc',
    fontSize: 15,
    minHeight: 80,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: '#334155',
  },
  sendBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f59e0b',
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 24,
    gap: 8,
  },
  sendBtnDisabled: { opacity: 0.6 },
  sendBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },
});
