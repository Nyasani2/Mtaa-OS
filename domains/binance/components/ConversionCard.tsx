
import { View, Text, TouchableOpacity } from 'react-native';
import { ArrowRightLeft, CheckCircle, XCircle, Clock } from 'lucide-react-native';

interface Props {
  conversion: any;
  onPress?: () => void;
}

export default function ConversionCard({ conversion, onPress }: Props) {
  const statusConfig = {
    pending: { color: '#f59e0b', icon: Clock, label: 'Pending' },
    rate_locked: { color: '#3b82f6', icon: Clock, label: 'Rate Locked' },
    processing: { color: '#8b5cf6', icon: ArrowRightLeft, label: 'Processing' },
    completed: { color: '#10b981', icon: CheckCircle, label: 'Completed' },
    failed: { color: '#ef4444', icon: XCircle, label: 'Failed' },
    cancelled: { color: '#64748b', icon: XCircle, label: 'Cancelled' },
  }[conversion.status] || { color: '#94a3b8', icon: Clock, label: conversion.status };

  const StatusIcon = statusConfig.icon;

  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        backgroundColor: '#1e293b',
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
      }}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <View>
          <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700' }}>
            {conversion.from_amount?.toLocaleString()} {conversion.from_currency}
          </Text>
          <Text style={{ color: '#94a3b8', fontSize: 12, marginTop: 2 }}>
            → {conversion.to_amount?.toFixed(2)} {conversion.to_currency}
          </Text>
        </View>
        <View style={{
          backgroundColor: statusConfig.color + '20',
          paddingHorizontal: 8,
          paddingVertical: 4,
          borderRadius: 8,
          flexDirection: 'row',
          alignItems: 'center',
        }}>
          <StatusIcon size={14} color={statusConfig.color} />
          <Text style={{ color: statusConfig.color, fontSize: 10, fontWeight: '600', marginLeft: 4, textTransform: 'uppercase' }}>
            {statusConfig.label}
          </Text>
        </View>
      </View>

      <View style={{ flexDirection: 'row', marginTop: 12, gap: 16 }}>
        <View>
          <Text style={{ color: '#64748b', fontSize: 10 }}>Rate</Text>
          <Text style={{ color: '#94a3b8', fontSize: 12 }}>
            1 {conversion.to_currency} = {conversion.exchange_rate?.toFixed(2)} {conversion.from_currency}
          </Text>
        </View>
        <View>
          <Text style={{ color: '#64748b', fontSize: 10 }}>Fees</Text>
          <Text style={{ color: '#94a3b8', fontSize: 12 }}>
            {conversion.total_fees?.toFixed(2)} {conversion.to_currency}
          </Text>
        </View>
      </View>

      {conversion.blockchain_tx_hash && (
        <Text style={{ color: '#3b82f6', fontSize: 11, marginTop: 8 }}>
          TX: {conversion.blockchain_tx_hash.slice(0, 20)}...
        </Text>
      )}
    </TouchableOpacity>
  );
}
