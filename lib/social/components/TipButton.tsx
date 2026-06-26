import React, { useState } from 'react';
import { TouchableOpacity, Text, StyleSheet, Modal, View, TextInput, Alert } from 'react-native';
import { useTip } from '../hooks/useTip';

interface TipButtonProps {
  targetProfileId: string;
}

export function TipButton({ targetProfileId }: TipButtonProps) {
  const [modalVisible, setModalVisible] = useState(false);
  const [amount, setAmount] = useState('');
  const [message, setMessage] = useState('');
  const { sendTip, loading, success, reset } = useTip(targetProfileId);

  const handleSend = async () => {
    const num = parseFloat(amount);
    if (!num || num <= 0) { Alert.alert('Invalid amount'); return; }
    try {
      await sendTip(num, 'USD', message);
      Alert.alert('Success', 'Tip sent!');
      setModalVisible(false);
      setAmount(''); setMessage('');
      reset();
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  return (
    <>
      <TouchableOpacity style={styles.button} onPress={() => setModalVisible(true)}>
        <Text style={styles.text}>💰 Tip</Text>
      </TouchableOpacity>
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.overlay}>
          <View style={styles.modal}>
            <Text style={styles.title}>Send Tip</Text>
            <TextInput placeholder="Amount (USD)" keyboardType="decimal-pad" value={amount} onChangeText={setAmount} style={styles.input} />
            <TextInput placeholder="Message (optional)" value={message} onChangeText={setMessage} style={styles.input} />
            <TouchableOpacity style={[styles.sendBtn, loading && { opacity: 0.5 }]} onPress={handleSend} disabled={loading}>
              <Text style={styles.sendText}>{loading ? 'Sending...' : 'Send Tip'}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setModalVisible(false)}><Text style={styles.cancel}>Cancel</Text></TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  button: { backgroundColor: '#F59E0B', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 8 },
  text: { color: '#fff', fontWeight: '600' },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modal: { backgroundColor: '#fff', padding: 24, borderRadius: 16, width: '85%' },
  title: { fontSize: 20, fontWeight: '700', marginBottom: 16 },
  input: { borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8, padding: 12, marginBottom: 12 },
  sendBtn: { backgroundColor: '#3B82F6', padding: 14, borderRadius: 8, alignItems: 'center' },
  sendText: { color: '#fff', fontWeight: '600' },
  cancel: { textAlign: 'center', marginTop: 12, color: '#6B7280' },
});
