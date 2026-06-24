import React, { useState, useCallback, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, Image,
  ActivityIndicator, Alert, ScrollView,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';

const TIP_AMOUNTS = [1, 5, 10, 20, 50, 100];

export default function TipScreen() {
  const router = useRouter();
  const { recipientId, postId } = useLocalSearchParams<{ recipientId: string; postId?: string }>();
  const [recipient, setRecipient] = useState<any>(null);
  const [amount, setAmount] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [balance, setBalance] = useState(0);

  const loadRecipient = useCallback(async () => {
    if (!recipientId) return;
    const { data } = await supabase
      .from('user_profiles')
      .select('id, display_name, avatar_url')
      .eq('id', recipientId)
      .single();
    setRecipient(data);
  }, [recipientId]);

  const loadBalance = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase
      .from('wallet_balances')
      .select('balance')
      .eq('user_id', user.id)
      .single();
    setBalance(data?.balance || 0);
  }, []);

  useEffect(() => {
    loadRecipient();
    loadBalance();
  }, [loadRecipient, loadBalance]);

  const handleTip = async () => {
    const tipAmount = parseFloat(amount);
    if (!tipAmount || tipAmount <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid tip amount.');
      return;
    }
    if (tipAmount > balance) {
      Alert.alert('Insufficient Balance', `Your balance is $${balance.toFixed(2)}. Please add funds.`);
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      if (user.id === recipientId) throw new Error('Cannot tip yourself');

      const { error: txError } = await supabase.from('wallet_transactions').insert({
        sender_id: user.id,
        recipient_id: recipientId,
        amount: tipAmount,
        currency: 'USD',
        type: 'tip',
        status: 'completed',
        description: message.trim() || 'Tip via Streets',
        reference_type: postId ? 'streets_post' : null,
        reference_id: postId || null,
      });

      if (txError) throw txError;

      const { error: tipError } = await supabase.from('streets_tips').insert({
        sender_id: user.id,
        recipient_id: recipientId,
        post_id: postId || null,
        amount: tipAmount,
        message: message.trim() || null,
      });

      if (tipError) throw tipError;

      // Send notification
      await supabase.from('streets_notifications').insert({
        recipient_id: recipientId,
        type: 'tip',
        actor_id: user.id,
        post_id: postId || null,
        content: `$${tipAmount.toFixed(2)}`,
      });

      Alert.alert('Tip Sent!', `You sent $${tipAmount.toFixed(2)} to ${recipient?.display_name || 'creator'}.`);
      router.back();
    } catch (e) {
      Alert.alert('Tip Failed', String(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#000' }}>
      <View style={{ paddingTop: 50, paddingHorizontal: 20 }}>
        <TouchableOpacity onPress={() => router.back()} style={{ marginBottom: 20 }}>
          <Ionicons name="arrow-back" size={28} color="#fff" />
        </TouchableOpacity>

        <Text style={{ color: '#fff', fontSize: 24, fontWeight: '700', marginBottom: 24 }}>Send Tip</Text>

        {/* Recipient */}
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 24 }}>
          {recipient?.avatar_url ? (
            <Image source={{ uri: recipient.avatar_url }} style={{ width: 56, height: 56, borderRadius: 28 }} />
          ) : (
            <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: '#333', justifyContent: 'center', alignItems: 'center' }}>
              <Ionicons name="person" size={28} color="#fff" />
            </View>
          )}
          <View style={{ marginLeft: 12 }}>
            <Text style={{ color: '#fff', fontSize: 18, fontWeight: '600' }}>{recipient?.display_name || 'Creator'}</Text>
            <Text style={{ color: '#888', fontSize: 13 }}>@{recipient?.display_name?.toLowerCase().replace(/\s/g, '') || 'creator'}</Text>
          </View>
        </View>

        {/* Balance */}
        <View style={{ backgroundColor: '#1a1a1a', borderRadius: 12, padding: 16, marginBottom: 24 }}>
          <Text style={{ color: '#888', fontSize: 13 }}>Your Balance</Text>
          <Text style={{ color: '#00ff88', fontSize: 28, fontWeight: '700', marginTop: 4 }}>${balance.toFixed(2)}</Text>
        </View>

        {/* Amount Presets */}
        <Text style={{ color: '#888', fontSize: 14, marginBottom: 12 }}>Choose Amount</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 }}>
          {TIP_AMOUNTS.map(amt => (
            <TouchableOpacity
              key={amt}
              onPress={() => setAmount(String(amt))}
              style={{
                backgroundColor: amount === String(amt) ? '#00d4ff' : '#1a1a1a',
                borderRadius: 12,
                paddingHorizontal: 20,
                paddingVertical: 12,
                minWidth: 80,
                alignItems: 'center',
              }}
            >
              <Text style={{ color: amount === String(amt) ? '#000' : '#fff', fontSize: 16, fontWeight: '600' }}>${amt}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Custom Amount */}
        <Text style={{ color: '#888', fontSize: 14, marginBottom: 8 }}>Or enter custom amount</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#1a1a1a', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, marginBottom: 16 }}>
          <Text style={{ color: '#fff', fontSize: 20, marginRight: 8 }}>$</Text>
          <TextInput
            value={amount}
            onChangeText={setAmount}
            placeholder="0.00"
            placeholderTextColor="#666"
            keyboardType="decimal-pad"
            style={{ flex: 1, color: '#fff', fontSize: 20 }}
          />
        </View>

        {/* Message */}
        <Text style={{ color: '#888', fontSize: 14, marginBottom: 8 }}>Message (optional)</Text>
        <TextInput
          value={message}
          onChangeText={setMessage}
          placeholder="Say something nice..."
          placeholderTextColor="#666"
          multiline
          numberOfLines={3}
          style={{
            color: '#fff',
            fontSize: 14,
            backgroundColor: '#1a1a1a',
            borderRadius: 12,
            padding: 12,
            minHeight: 80,
            textAlignVertical: 'top',
            marginBottom: 24,
          }}
        />

        {/* Send Button */}
        <TouchableOpacity
          onPress={handleTip}
          disabled={loading || !amount || parseFloat(amount) <= 0}
          style={{
            backgroundColor: amount && parseFloat(amount) > 0 ? '#00d4ff' : '#333',
            borderRadius: 24,
            paddingVertical: 16,
            alignItems: 'center',
          }}
        >
          {loading ? (
            <ActivityIndicator color="#000" />
          ) : (
            <Text style={{ color: amount && parseFloat(amount) > 0 ? '#000' : '#666', fontWeight: '700', fontSize: 16 }}>
              Send ${amount || '0.00'} Tip
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
