// @ts-nocheck
import React, { useState, useCallback, useEffect } from 'react';
import { Alert, View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Alert, useAuth } from '@/lib/auth/useAuth';
import { Alert, useWalletStore } from 'app/(os)/wallet/hooks';
import { Alert, getWalletTransactions } from '@/lib/services/wallet-service';
import { supabase } from '@/lib/supabase';

const CLAIM_TYPES = [
  { id: 'missing_funds', label: 'Missing Funds', icon: 'cash-outline', desc: 'Money did not arrive in my wallet' },
  { id: 'failed_transaction', label: 'Failed Transaction', icon: 'close-circle-outline', desc: 'Transaction failed but money was deducted' },
  { id: 'wrong_amount', label: 'Wrong Amount', icon: 'swap-horizontal-outline', desc: 'Wrong amount was sent or received' },
  { id: 'unauthorized', label: 'Unauthorized Transaction', icon: 'shield-alert-outline', desc: 'I did not authorize this transaction' },
  { id: 'other', label: 'Other Issue', icon: 'help-circle-outline', desc: 'Something else went wrong' },
];

const PRIORITY_LEVELS = [
  { id: 'low', label: 'Low', color: '#22c55e' },
  { id: 'medium', label: 'Medium', color: '#f59e0b' },
  { id: 'high', label: 'High', color: '#ef4444' },
  { id: 'urgent', label: 'Urgent', color: '#dc2626' },
];

export default function ClaimScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { accounts, activeAccountId } = useWalletStore();

  const activeAccount = accounts.find(a => a.id === activeAccountId) || accounts[0];

  const [claimType, setClaimType] = useState('');
  const [priority, setPriority] = useState('medium');
  const [amount, setAmount] = useState('');
  const [transactionId, setTransactionId] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [recentTxs, setRecentTxs] = useState<any[]>([]);
  const [txLoading, setTxLoading] = useState(false);
  const [showSupportChat, setShowSupportChat] = useState(false);
  const [chatMessage, setChatMessage] = useState('');
  const [chatHistory, setChatHistory] = useState<{role: string; text: string; time: string}[]>([]);

  useEffect(() => {
    if (!user?.id) return;
    setTxLoading(true);
    getWalletTransactions(user.id).then((txs) => {
      setRecentTxs(txs.slice(0, 10));
      setTxLoading(false);
    });
  }, [user?.id]);

  const handleSubmitClaim = useCallback(async () => {
    if (!claimType) {
      Alert.alert('Select Type', 'Please select a claim type');
      return;
    }
    if (!description.trim() || description.trim().length < 10) {
      Alert.alert('Describe Issue', 'Please provide a detailed description (min 10 characters)');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('support_tickets')
        .insert({
          user_id: user?.id,
          type: 'wallet_claim',
          category: claimType,
          priority,
          subject: `Wallet Claim: ${CLAIM_TYPES.find(c => c.id === claimType)?.label}`,
          description: description.trim(),
          amount: amount ? parseFloat(amount) : null,
          transaction_id: transactionId || null,
          wallet_id: activeAccount?.id,
          status: 'open',
          metadata: {
            wallet_currency: activeAccount?.currency,
            claim_type: claimType,
          },
        })
        .select()
        .single();

      if (error) throw error;

      setLoading(false);
      Alert.alert(
        'Claim Submitted',
        `Your claim #${data.id.slice(0, 8).toUpperCase()} has been submitted. Our support team will review it within 24 hours.`,
        [
          { text: 'Contact Agent', onPress: () => setShowSupportChat(true) },
          { text: 'Done', onPress: () => router.back() },
        ]
      );
    } catch (err: any) {
      setLoading(false);
      Alert.alert('Submission Failed', err.message || 'Could not submit claim');
    }
  }, [claimType, priority, amount, transactionId, description, user, activeAccount, router]);

  const handleContactSupport = useCallback(() => {
    setShowSupportChat(true);
    setChatHistory([
      {
        role: 'agent',
        text: `Hello ${user?.user_metadata?.display_name || 'there'}! I'm your MTAA Wallet Support Agent. How can I help you with your claim today?`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  }, [user]);

  const handleSendChatMessage = useCallback(() => {
    if (!chatMessage.trim()) return;
    const msg = chatMessage.trim();
    setChatMessage('');

    setChatHistory(prev => [
      ...prev,
      { role: 'user', text: msg, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) },
    ]);

    setTimeout(() => {
      setChatHistory(prev => [
        ...prev,
        {
          role: 'agent',
          text: "Thank you for reaching out. I've noted your concern and will escalate this to our resolution team. You'll receive an update within 2-4 hours. Is there anything else I can help with?",
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    }, 1500);
  }, [chatMessage]);

  const selectTransaction = useCallback((tx: any) => {
    setTransactionId(tx.id);
    setAmount(tx.amount?.toString() || '');
    setDescription(`Issue with transaction ${tx.reference || tx.id?.slice(0, 8)}: `);
  }, []);

  if (showSupportChat) {
    return (
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <View style={{ flex: 1 }}>
          <View style={styles.chatHeader}>
            <TouchableOpacity onPress={() => setShowSupportChat(false)} style={styles.backBtn}>
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
            <View style={styles.chatAvatar}>
              <Ionicons name="headset" size={20} color="#fff" />
            </View>
            <View>
              <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600' }}>Support Agent</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
                <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#22c55e', marginRight: 6 }} />
                <Text style={{ color: '#22c55e', fontSize: 12 }}>Online</Text>
              </View>
            </View>
          </View>

          <ScrollView style={{ flex: 1, paddingHorizontal: 16 }} contentContainerStyle={{ paddingVertical: 16 }}>
            {chatHistory.map((msg, idx) => (
              <View key={idx} style={[styles.chatBubble, msg.role === 'user' ? styles.chatBubbleUser : styles.chatBubbleAgent]}>
                <Text style={{ color: '#fff', fontSize: 14, lineHeight: 20 }}>{msg.text}</Text>
                <Text style={[styles.chatTime, msg.role === 'user' ? { alignSelf: 'flex-end' } : { alignSelf: 'flex-start' }]}>{msg.time}</Text>
              </View>
            ))}
          </ScrollView>

          <View style={styles.chatInputRow}>
            <TextInput
              value={chatMessage}
              onChangeText={setChatMessage}
              placeholder="Type a message..."
              placeholderTextColor="#6b7280"
              multiline
              style={styles.chatInput}
            />
            <TouchableOpacity onPress={handleSendChatMessage} disabled={!chatMessage.trim()} style={[styles.chatSendBtn, !chatMessage.trim() && { backgroundColor: '#333' }]}>
              <Ionicons name="send" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.title}>File a Claim</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Claim Types */}
        <View style={styles.card}>
          <Text style={styles.label}>Claim Type</Text>
          {CLAIM_TYPES.map((type) => (
            <TouchableOpacity
              key={type.id}
              onPress={() => setClaimType(type.id)}
              style={[styles.typeRow, claimType === type.id && styles.typeRowActive]}
            >
              <Ionicons name={type.icon as any} size={22} color={claimType === type.id ? '#10b981' : '#9ca3af'} />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={{ color: '#fff', fontSize: 15, fontWeight: '600' }}>{type.label}</Text>
                <Text style={{ color: '#9ca3af', fontSize: 12, marginTop: 2 }}>{type.desc}</Text>
              </View>
              <View style={[styles.radio, claimType === type.id && styles.radioActive]}>
                {claimType === type.id && <Ionicons name="checkmark" size={12} color="#fff" />}
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Priority */}
        <View style={styles.card}>
          <Text style={styles.label}>Priority</Text>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            {PRIORITY_LEVELS.map((level) => (
              <TouchableOpacity
                key={level.id}
                onPress={() => setPriority(level.id)}
                style={[styles.priorityBtn, priority === level.id && { borderColor: level.color, backgroundColor: level.color + '20' }]}
              >
                <View style={[styles.priorityDot, { backgroundColor: level.color }]} />
                <Text style={{ color: '#fff', fontSize: 12, fontWeight: '600' }}>{level.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Amount */}
        <View style={styles.card}>
          <Text style={styles.label}>Amount Involved (Optional)</Text>
          <View style={styles.amountRow}>
            <Text style={styles.currency}>KSh</Text>
            <TextInput
              value={amount}
              onChangeText={setAmount}
              placeholder="0.00"
              placeholderTextColor="#6b7280"
              keyboardType="decimal-pad"
              style={styles.amountInput}
            />
          </View>
        </View>

        {/* Recent Transactions */}
        <View style={styles.card}>
          <Text style={styles.label}>Link Transaction (Optional)</Text>
          {txLoading ? <ActivityIndicator color="#10b981" /> : recentTxs.length === 0 ? (
            <Text style={{ color: '#6b7280', fontStyle: 'italic' }}>No recent transactions</Text>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {recentTxs.map((tx) => (
                <TouchableOpacity
                  key={tx.id}
                  onPress={() => selectTransaction(tx)}
                  style={[styles.txChip, transactionId === tx.id && styles.txChipActive]}
                >
                  <Text style={{ color: '#fff', fontSize: 12, fontWeight: '600' }} numberOfLines={1}>{tx.description || 'Transaction'}</Text>
                  <Text style={{ color: tx.type === 'credit' || tx.type === 'deposit' ? '#22c55e' : '#ef4444', fontSize: 13, fontWeight: '700', marginTop: 4 }}>
                    {tx.type === 'credit' || tx.type === 'deposit' ? '+' : '-'}{tx.amount?.toLocaleString()} {tx.currency || 'KES'}
                  </Text>
                  <Text style={{ color: '#6b7280', fontSize: 10, marginTop: 4 }}>{new Date(tx.created_at || tx.timestamp).toLocaleDateString()}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>

        {/* Description */}
        <View style={styles.card}>
          <Text style={styles.label}>Description</Text>
          <TextInput
            value={description}
            onChangeText={setDescription}
            placeholder="Describe what happened in detail..."
            placeholderTextColor="#6b7280"
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            style={[styles.input, { minHeight: 100 }]}
          />
        </View>

        <TouchableOpacity onPress={handleSubmitClaim} disabled={loading} style={styles.confirmBtn}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.confirmText}>Submit Claim</Text>}
        </TouchableOpacity>

        <TouchableOpacity onPress={handleContactSupport} style={styles.secondaryBtn}>
          <Ionicons name="chatbubbles-outline" size={20} color="#6366f1" />
          <Text style={styles.secondaryBtnText}>Chat with Support Agent</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f1a' },
  scroll: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, paddingTop: 50 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
  card: { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 16, padding: 20, marginHorizontal: 16, marginBottom: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  label: { fontSize: 14, color: '#9ca3af', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 },
  typeRow: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 12, marginBottom: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  typeRowActive: { backgroundColor: 'rgba(16,185,129,0.1)', borderColor: '#10b981' },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: '#4b5563', alignItems: 'center', justifyContent: 'center' },
  radioActive: { borderColor: '#10b981', backgroundColor: '#10b981' },
  priorityBtn: { flex: 1, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12, paddingVertical: 12, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  priorityDot: { width: 8, height: 8, borderRadius: 4, marginBottom: 6 },
  amountRow: { flexDirection: 'row', alignItems: 'center' },
  currency: { color: '#fff', fontSize: 18, fontWeight: '700', marginRight: 8 },
  amountInput: { flex: 1, color: '#fff', fontSize: 20, fontWeight: '700' },
  txChip: { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: 12, marginRight: 10, minWidth: 160, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  txChipActive: { borderColor: '#6366f1', backgroundColor: 'rgba(99,102,241,0.1)' },
  input: { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: 14, color: '#fff', fontSize: 15, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  confirmBtn: { backgroundColor: '#10b981', marginHorizontal: 16, padding: 18, borderRadius: 16, alignItems: 'center', marginBottom: 12 },
  confirmText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  secondaryBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 16, paddingVertical: 16, marginHorizontal: 16, marginBottom: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  secondaryBtnText: { color: '#fff', marginLeft: 10, fontWeight: '600', fontSize: 15 },
  chatHeader: { flexDirection: 'row', alignItems: 'center', padding: 16, paddingTop: 50, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.1)' },
  chatAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#6366f1', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  chatBubble: { maxWidth: '80%', marginBottom: 12, borderRadius: 16, padding: 14 },
  chatBubbleUser: { alignSelf: 'flex-end', backgroundColor: '#6366f1', borderBottomRightRadius: 4 },
  chatBubbleAgent: { alignSelf: 'flex-start', backgroundColor: 'rgba(255,255,255,0.1)', borderBottomLeftRadius: 4 },
  chatTime: { color: '#9ca3af', fontSize: 11, marginTop: 4 },
  chatInputRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.1)', paddingBottom: 24 },
  chatInput: { flex: 1, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, color: '#fff', fontSize: 15, maxHeight: 100, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  chatSendBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#6366f1', alignItems: 'center', justifyContent: 'center', marginLeft: 10 },
});

