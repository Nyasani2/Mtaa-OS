/**
 * ASIS Layer 5 — Claim Preview Card UI
 * Shows sender, amount, expiration, claim CTA
 * Trustworthy, calm, premium feel
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { ClaimLink } from '../types';

interface ClaimPreviewCardProps {
  claim: ClaimLink;
  onClaim: () => void;
  onDismiss?: () => void;
}

export const ClaimPreviewCard: React.FC<ClaimPreviewCardProps> = ({ claim, onClaim, onDismiss }) => {
  const timeLeft = Math.max(0, claim.expiresAt.getTime() - Date.now());
  const hoursLeft = Math.floor(timeLeft / 3600000);
  const isExpiringSoon = hoursLeft < 24;

  const formatMoney = (amount: number, currency: string) => {
    const symbols: Record<string, string> = {
      KES: 'KSh', UGX: 'USh', TZS: 'TSh', RWF: 'RF', NGN: '₦',
      GHS: 'GH₵', ZAR: 'R', USD: '$', EUR: '€', GBP: '£',
    };
    return `${symbols[currency] || currency}${amount.toLocaleString()}`;
  };

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.senderLabel}>From</Text>
        <Text style={styles.senderName}>{claim.senderName}</Text>
      </View>

      <View style={styles.amountContainer}>
        <Text style={styles.amount}>{formatMoney(claim.amount, claim.currency)}</Text>
        <Text style={styles.amountLabel}>is waiting for you</Text>
      </View>

      <View style={styles.details}>
        <Text style={[styles.expiry, isExpiringSoon && styles.expirySoon]}>
          {isExpiringSoon ? `⏰ Expires in ${hoursLeft} hours` : `Valid for ${hoursLeft} hours`}
        </Text>
        <Text style={styles.securityNote}>
          🔒 Secured by MTAA. Only you can claim this.
        </Text>
      </View>

      <TouchableOpacity style={styles.claimButton} onPress={onClaim}>
        <Text style={styles.claimButtonText}>Claim Money</Text>
      </TouchableOpacity>

      {onDismiss && (
        <TouchableOpacity style={styles.dismissButton} onPress={onDismiss}>
          <Text style={styles.dismissText}>I'll claim later</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    margin: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  header: {
    marginBottom: 16,
  },
  senderLabel: {
    fontSize: 12,
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  senderName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginTop: 4,
  },
  amountContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  amount: {
    fontSize: 36,
    fontWeight: '700',
    color: '#059669',
  },
  amountLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  details: {
    marginBottom: 20,
  },
  expiry: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
  },
  expirySoon: {
    color: '#DC2626',
    fontWeight: '500',
  },
  securityNote: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 8,
  },
  claimButton: {
    backgroundColor: '#059669',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  claimButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  dismissButton: {
    marginTop: 12,
    alignItems: 'center',
    paddingVertical: 8,
  },
  dismissText: {
    color: '#6B7280',
    fontSize: 14,
  },
});