// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/lib/auth/store/auth.store';

const { width } = Dimensions.get('window');

interface TooltipProps {
  visible: boolean;
  title: string;
  message: string;
  onDismiss: () => void;
  onNext?: () => void;
}

export default function AsisTooltip({ visible, title, message, onDismiss, onNext }: TooltipProps) {
  if (!visible) return null;

  return (
    <Modal transparent animationType="fade" visible={visible}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={styles.header}>
            <View style={styles.asisIcon}>
              <Ionicons name="sparkles" size={20} color="#fff" />
            </View>
            <Text style={styles.title}>{title}</Text>
            <TouchableOpacity onPress={onDismiss} style={styles.closeBtn}>
              <Ionicons name="close" size={20} color="#94a3b8" />
            </TouchableOpacity>
          </View>
          <Text style={styles.message}>{message}</Text>
          <View style={styles.footer}>
            {onNext && (
              <TouchableOpacity onPress={onNext} style={styles.nextBtn}>
                <Text style={styles.nextText}>Next Tip</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity onPress={onDismiss} style={styles.dismissBtn}>
              <Text style={styles.dismissText}>Got it</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  card: { backgroundColor: '#1e293b', borderRadius: 16, padding: 20, width: '100%', maxWidth: 400, borderWidth: 1, borderColor: '#8b5cf6' },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  asisIcon: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#8b5cf6', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  title: { flex: 1, color: '#fff', fontSize: 16, fontWeight: '700' },
  closeBtn: { padding: 4 },
  message: { color: '#cbd5e1', fontSize: 14, lineHeight: 20, marginBottom: 20 },
  footer: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12 },
  nextBtn: { paddingHorizontal: 16, paddingVertical: 8, backgroundColor: '#334155', borderRadius: 8 },
  nextText: { color: '#fff', fontWeight: '600' },
  dismissBtn: { paddingHorizontal: 16, paddingVertical: 8, backgroundColor: '#8b5cf6', borderRadius: 8 },
  dismissText: { color: '#fff', fontWeight: '700' },
});
