// @ts-nocheck
import React, { useState } from 'react';
import { Alert, View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/lib/auth/useAuth';
import { Ionicons } from '@expo/vector-icons';
import { walletService } from '@/lib/services/wallet-service';

export default function TransferScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [amount, setAmount] = useState('');
  const [recipient, setRecipient] = useState('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [pin, setPin] = useState('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [recipientType, setRecipientType] = useState<'wallet' | 'phone' | 'till'>('wallet');

  const handleTransferRequest = () => {
    if (!amount || parseFloat(amount) <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }
    if (!recipient) {
      Alert.alert('Error', 'Please enter recipient details');
      return;
    }
    if (!user) {
      Alert.alert('Error', 'Please sign in first');
      return;
    }
    setShowConfirmModal(true);
  };

  const executeTransfer = async () => {
    if (pin.length < 4) {
      Alert.alert('Invalid PIN', 'Please enter your transaction PIN.');
      return;
    }

    setLoading(true);
    try {
      const result = await walletService.execute({
        action: 'transfer',
        amount: parseFloat(amount),
        currency: 'KES',
        recipientId: recipient,
        recipientType: recipientType,
        description: note || 'Wallet transfer',
        senderAccountId: user.id,
        pin: pin, // 🔐 M-Pesa style PIN verification
      });

      if (result.success) {
        setShowConfirmModal(false);
        setPin('');
        Alert.alert(
          'Transfer Successful',
          `KSh ${amount} sent to ${recipient}.`,
          [{ text: 'OK', onPress: () => router.back() }]
        );
      } else {
        Alert.alert('Failed', result.message || 'Transfer failed. Please try again.');
        setPin('');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Something went wrong');
      setPin('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title}>Transfer</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Recipient Type */}
      <View style={styles.methodRow}>
        {(['wallet', 'phone', 'till'] as const).map((t) => (
          <TouchableOpacity
            key={t}
            style={[styles.methodBtn, recipientType === t && styles.methodBtnActive]}
            onPress={() => setRecipientType(t)}
          >
            <Ionicons
              name={t === 'wallet' ? 'wallet' : t === 'phone' ? 'call' : 'cash'}
              size={20}
              color={recipientType === t ? '#fff' : '#9ca3af'}
            />
            <Text style={[styles.methodText, recipientType === t && styles.methodTextActive]}>
              {t === 'wallet' ? 'Wallet ID' : t === 'phone' ? 'Phone' : 'Till'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Recipient {recipientType === 'wallet' ? 'Wallet ID' : recipientType === 'phone' ? 'Phone Number' : 'Till Number'}</Text>
        <TextInput
          style={styles.input}
          placeholder={recipientType === 'wallet' ? 'Enter wallet ID' : recipientType === 'phone' ? '2547XXXXXXXX' : 'Enter till number'}
          placeholderTextColor="#6b7280"
          value={recipient}
          onChangeText={setRecipient}
        />
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Amount (KSh)</Text>
        <TextInput
          style={styles.amountInput}
          placeholder="0.00"
          placeholderTextColor="#6b7280"
          keyboardType="decimal-pad"
          value={amount}
          onChangeText={setAmount}
        />
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Note (Optional)</Text>
        <TextInput
          style={styles.input}
          placeholder="What's this for?"
          placeholderTextColor="#6b7280"
          value={note}
          onChangeText={setNote}
        />
      </View>

      <TouchableOpacity
        style={[styles.confirmBtn, loading && styles.confirmBtnDisabled]}
        onPress={handleTransferRequest}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.confirmText}>Send KSh {amount || '0'}</Text>
        )}
      </TouchableOpacity>

      {/* M-Pesa Style Confirmation Modal */}
      <Modal
        visible={showConfirmModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowConfirmModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Confirm Transfer</Text>
            
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>To:</Text>
              <Text style={styles.detailValue}>{recipientType === 'wallet' ? 'Wallet' : recipientType === 'phone' ? 'Phone' : 'Till'}: {recipient}</Text>
            </View>
            
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Amount:</Text>
              <Text style={styles.detailValueAmount}>KSh {amount}</Text>
            </View>
            
            {note && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Note:</Text>
                <Text style={styles.detailValue}>{note}</Text>
              </View>
            )}

            <View style={styles.pinContainer}>
              <Text style={styles.pinLabel}>Enter Transaction PIN</Text>
              <TextInput
                style={styles.pinInput}
                placeholder="****"
                placeholderTextColor="#6b7280"
                keyboardType="numeric"
                secureTextEntry={true}
                maxLength={6}
                value={pin}
                onChangeText={setPin}
                autoFocus
              />
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalBtnCancel]}
                onPress={() => {
                  setShowConfirmModal(false);
                  setPin('');
                }}
              >
                <Text style={styles.modalBtnTextCancel}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalBtnConfirm, loading && styles.modalBtnDisabled]}
                onPress={executeTransfer}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.modalBtnTextConfirm}>Confirm & Send</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f1a' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, paddingTop: 50 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
  methodRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 12, marginBottom: 16 },
  methodBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 12, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  methodBtnActive: { backgroundColor: '#10b981', borderColor: '#10b981' },
  methodText: { color: '#9ca3af', fontSize: 14, fontWeight: '600' },
  methodTextActive: { color: '#fff' },
  card: { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 16, padding: 20, marginHorizontal: 16, marginBottom: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  label: { fontSize: 14, color: '#9ca3af', marginBottom: 8 },
  amountInput: { fontSize: 40, fontWeight: 'bold', color: '#fff', paddingVertical: 8 },
  input: { fontSize: 18, color: '#fff', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.1)' },
  confirmBtn: { backgroundColor: '#10b981', marginHorizontal: 16, padding: 18, borderRadius: 16, alignItems: 'center', marginTop: 8 },
  confirmBtnDisabled: { opacity: 0.6 },
  confirmText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#1f2937', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#fff', marginBottom: 20, textAlign: 'center' },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  detailLabel: { fontSize: 14, color: '#9ca3af' },
  detailValue: { fontSize: 14, color: '#fff', fontWeight: '600' },
  detailValueAmount: { fontSize: 24, color: '#10b981', fontWeight: 'bold' },
  pinContainer: { marginTop: 24, marginBottom: 24 },
  pinLabel: { fontSize: 14, color: '#9ca3af', marginBottom: 8, textAlign: 'center' },
  pinInput: { backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 12, padding: 16, fontSize: 24, color: '#fff', textAlign: 'center', letterSpacing: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  modalActions: { flexDirection: 'row', gap: 12 },
  modalBtn: { flex: 1, padding: 16, borderRadius: 12, alignItems: 'center' },
  modalBtnCancel: { backgroundColor: 'rgba(255,255,255,0.1)' },
  modalBtnConfirm: { backgroundColor: '#10b981' },
  modalBtnDisabled: { opacity: 0.6 },
  modalBtnTextCancel: { color: '#fff', fontSize: 16, fontWeight: '600' },
  modalBtnTextConfirm: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});

