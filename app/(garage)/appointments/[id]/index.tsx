import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Alert, RefreshControl
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { useGarage } from '@/lib/hooks/useGarage';
import { supabase } from '@/lib/supabase';
import {
  Wrench, Calendar, Clock, ChevronLeft, Car, Gauge, Fuel,
  Phone, User, FileText, DollarSign, CheckCircle, AlertTriangle,
  MapPin, Share2, Printer, ChevronRight
} from 'lucide-react-native';

const WORKFLOW_STAGES = [
  { key: 'vehicle_reception', label: 'Reception' },
  { key: 'diagnosis', label: 'Diagnosis' },
  { key: 'quote_sent', label: 'Quote Sent' },
  { key: 'approved', label: 'Approved' },
  { key: 'in_progress', label: 'In Progress' },
  { key: 'quality_check', label: 'QC' },
  { key: 'ready_for_pickup', label: 'Ready' },
  { key: 'completed', label: 'Completed' },
];

export default function AppointmentDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuthStore();
  const [settling, setSettling] = useState(false);

  const handleCollectPayment = async () => {
    if (!id) return;
    setSettling(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      const { data, error } = await supabase.functions.invoke('garage-settle', {
        body: { appointment_id: id },
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      if (error || data?.error) {
        Alert.alert('Payment Failed', data?.error || error?.message || 'Unknown error');
      } else {
        Alert.alert('Payment Collected', `Garage received KES ${data.myGarage_amount.toLocaleString()}`);
        fetchData();
      }
    } catch (e: any) {
      Alert.alert('Payment Failed', e?.message || 'Unknown error');
    } finally {
      setSettling(false);
    }
  };
  const { garage } = useGarage();

  const [appointment, setAppointment] = useState<any>(null);
  const [services, setServices] = useState<any[]>([]);
  const [parts, setParts] = useState<any[]>([]);
  const [invoice, setInvoice] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    if (!id) return;
    try {
      const { data: appt } = await supabase
        .from('garage_appointments')
        .select('*')
        .eq('id', id)
        .single();

      const { data: svcs } = await supabase
        .from('garage_services')
        .select('*')
        .eq('appointment_id', id);

      const { data: prts } = await supabase
        .from('garage_parts_used')
        .select('*')
        .eq('appointment_id', id);

      const { data: inv } = await supabase
        .from('garage_invoices')
        .select('*')
        .eq('appointment_id', id)
        .maybeSingle();

      setAppointment(appt);
      setServices(svcs || []);
      setParts(prts || []);
      setInvoice(inv);
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchData(); }, [id]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const handleAdvance = async (direction: 'next' | 'prev') => {
    if (!appointment) return;
    const stages = WORKFLOW_STAGES.map(s => s.key);
    const currentIdx = stages.indexOf(appointment.status);
    const nextIdx = direction === 'next'
      ? Math.min(currentIdx + 1, stages.length - 1)
      : Math.max(currentIdx - 1, 0);
    const nextStatus = stages[nextIdx];

    try {
      const { error } = await supabase
        .from('garage_appointments')
        .update({ status: nextStatus })
        .eq('id', appointment.id);
      if (error) throw error;
      setAppointment({ ...appointment, status: nextStatus });
      if (nextStatus === 'ready_for_pickup') {
        Alert.alert('Ready for Pickup', 'Customer has been notified.');
      }
    } catch (err: any) {
      Alert.alert('Error', err.message);
    }
  };

  const handleShare = async () => {
    if (!appointment) return;
    try {
      const { Share } = await import('react-native');
      const message = 'Work Order #' + appointment.id.slice(0, 8).toUpperCase() + '\n' +
        'Vehicle: ' + (appointment.vehicle_plate || 'N/A') + '\n' +
        'Status: ' + appointment.status + '\n' +
        'Service: ' + (appointment.service_type || 'N/A');
      await Share.share({ message, title: 'Work Order - ' + appointment.vehicle_plate });
    } catch (err: any) {
      Alert.alert('Error', err.message);
    }
  };

  const getStageIndex = (status: string) => WORKFLOW_STAGES.findIndex(s => s.key === status);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.isLoadingText}>Loading work order...</Text>
      </View>
    );
  }

  if (!appointment) {
    return (
      <View style={styles.center}>
        <AlertTriangle size={48} color="#ef4444" />
        <Text style={styles.emptyTitle}>Work Order Not Found</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const currentStageIdx = getStageIndex(appointment.status);
  const servicesTotal = services.reduce((sum, s) => sum + (s.cost || 0), 0);
  const partsTotal = parts.reduce((sum, p) => sum + ((p.quantity || 0) * (p.unit_cost || 0)), 0);
  const laborTotal = (appointment.labor_hours || 2) * (appointment.labor_rate || 1500);
  const subtotal = servicesTotal + partsTotal + laborTotal;
  const vat = subtotal * 0.16;
  const total = subtotal + vat;

  return (
    <ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.back} onPress={() => router.back()}>
          <ChevronLeft size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Work Order</Text>
        <TouchableOpacity style={styles.shareBtn} onPress={handleShare}>
          <Share2 size={20} color="#6b7280" />
        </TouchableOpacity>
      </View>

      {/* Status Badge */}
      <View style={styles.statusSection}>
        <StatusBadge status={appointment.status} />
        <Text style={styles.statusDate}>Created {new Date(appointment.created_at).toLocaleDateString()}</Text>
      </View>

      {/* Workflow */}
      <View style={styles.workflowSection}>
        <Text style={styles.sectionLabel}>Workflow</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.workflowRow}>
            {WORKFLOW_STAGES.map((stage, idx) => {
              const isActive = idx <= currentStageIdx;
              const isCurrent = idx === currentStageIdx;
              return (
                <View key={stage.key} style={styles.workflowStep}>
                  <View style={[styles.workflowDot, isActive && styles.workflowDotActive, isCurrent && styles.workflowDotCurrent]}>
                    <Text style={[styles.workflowDotText, isActive && styles.workflowDotTextActive]}>{idx + 1}</Text>
                  </View>
                  <Text style={[styles.workflowLabel, isActive && styles.workflowLabelActive]}>{stage.label}</Text>
                  {idx < WORKFLOW_STAGES.length - 1 && (
                    <View style={[styles.workflowLine, idx < currentStageIdx && styles.workflowLineActive]} />
                  )}
                </View>
              );
            })}
          </View>
        </ScrollView>
      </View>

      {/* Vehicle Info */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Vehicle</Text>
        <InfoRow icon={<Car size={16} color="#3b82f6" />} label="Plate" value={appointment.vehicle_plate || 'N/A'} />
        <InfoRow icon={<Gauge size={16} color="#6b7280" />} label="Mileage" value={`${appointment.mileage || 'N/A'} km`} />
        <InfoRow icon={<Fuel size={16} color="#6b7280" />} label="Fuel" value={`${appointment.fuel_level || 'N/A'}%`} />
      </View>

      {/* Customer */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Customer</Text>
        <InfoRow icon={<User size={16} color="#6b7280" />} label="Name" value={appointment.customer_name || 'N/A'} />
        <InfoRow icon={<Phone size={16} color="#6b7280" />} label="Phone" value={appointment.customer_phone || 'N/A'} />
      </View>

      {/* Service Notes */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Service Notes</Text>
        <Text style={styles.notesText}>{appointment.description || 'No notes added.'}</Text>
      </View>

      {/* Services */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Services ({services.length})</Text>
        {services.length === 0 ? (
          <Text style={styles.emptyText}>No services added</Text>
        ) : (
          services.map((s, i) => (
            <View key={i} style={styles.lineItem}>
              <Text style={styles.lineItemText}>{s.name}</Text>
              <Text style={styles.lineItemValue}>KES {s.cost?.toLocaleString()}</Text>
            </View>
          ))
        )}
      </View>

      {/* Parts */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Parts Used ({parts.length})</Text>
        {parts.length === 0 ? (
          <Text style={styles.emptyText}>No parts added</Text>
        ) : (
          parts.map((p, i) => (
            <View key={i} style={styles.lineItem}>
              <Text style={styles.lineItemText}>{p.name} x{p.quantity}</Text>
              <Text style={styles.lineItemValue}>KES {((p.quantity || 0) * (p.unit_cost || 0)).toLocaleString()}</Text>
            </View>
          ))
        )}
      </View>

      {/* Cost Summary */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Cost Summary</Text>
        <CostRow label="Services" value={servicesTotal} />
        <CostRow label="Parts" value={partsTotal} />
        <CostRow label={`Labor (${appointment.labor_hours || 2}h @ KES ${appointment.labor_rate || 1500}/h)`} value={laborTotal} />
        <View style={styles.divider} />
        <CostRow label="Subtotal" value={subtotal} bold />
        <CostRow label="VAT (16%)" value={vat} />
        <CostRow label="TOTAL" value={total} bold total />
      </View>

      {/* Payment Collection */}
      {appointment.payment_status !== 'paid' && ['ready_for_pickup', 'completed'].includes(appointment.status) && (
        <TouchableOpacity
          style={[styles.actionBtn, styles.actionPrimary, { marginHorizontal: 16, marginTop: 8 }]}
          onPress={handleCollectPayment}
          disabled={settling}
        >
          {settling ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.actionPrimaryText}>Collect Payment — KES {total.toLocaleString()}</Text>
          )}
        </TouchableOpacity>
      )}
      {appointment.payment_status === 'paid' && (
        <View style={[styles.invoiceCard, { marginHorizontal: 16 }]}>
          <FileText size={20} color="#22c55e" />
          <Text style={[styles.invoiceTitle, { color: '#22c55e' }]}>Payment Collected</Text>
        </View>
      )}

      {/* Invoice Link */}
      {invoice && (
        <TouchableOpacity style={styles.invoiceCard} onPress={() => router.push(`/(garage)/appointments` as any)}>
          <FileText size={20} color="#8b5cf6" />
          <View style={styles.invoiceInfo}>
            <Text style={styles.invoiceTitle}>Invoice Generated</Text>
            <Text style={styles.invoiceSubtitle}>#{invoice.id?.slice(0, 8).toUpperCase()} - KES {invoice.total?.toLocaleString()}</Text>
          </View>
          <ChevronRight size={18} color="#9ca3af" />
        </TouchableOpacity>
      )}

      {/* Actions */}
      <View style={styles.actions}>
        <TouchableOpacity style={[styles.actionBtn, styles.actionSecondary]} onPress={() => handleAdvance('prev')}>
          <ChevronLeft size={18} color="#6b7280" />
          <Text style={styles.actionSecondaryText}>Step Back</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionBtn, styles.actionPrimary]} onPress={() => handleAdvance('next')}>
          <Text style={styles.actionPrimaryText}>Advance Stage</Text>
          <ChevronRight size={18} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <View style={styles.infoRowLeft}>
        {icon}
        <Text style={styles.infoLabel}>{label}</Text>
      </View>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

function CostRow({ label, value, bold, total }: { label: string; value: number; bold?: boolean; total?: boolean }) {
  return (
    <View style={styles.costRow}>
      <Text style={[styles.costLabel, bold && styles.bold]}>{label}</Text>
      <Text style={[styles.costValue, bold && styles.bold, total && styles.totalValue]}>KES {value.toLocaleString()}</Text>
    </View>
  );
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { color: string; bg: string; label: string }> = {
    pending: { color: '#f59e0b', bg: '#fffbeb', label: 'Pending Approval' },
    in_progress: { color: '#3b82f6', bg: '#eff6ff', label: 'In Progress' },
    ready_for_pickup: { color: '#22c55e', bg: '#f0fdf4', label: 'Ready for Pickup' },
    completed: { color: '#6b7280', bg: '#f9fafb', label: 'Completed' },
    cancelled: { color: '#ef4444', bg: '#fef2f2', label: 'Cancelled' },
    vehicle_reception: { color: '#8b5cf6', bg: '#f5f3ff', label: 'Reception' },
    diagnosis: { color: '#8b5cf6', bg: '#f5f3ff', label: 'Diagnosis' },
    quote_sent: { color: '#f59e0b', bg: '#fffbeb', label: 'Quote Sent' },
    approved: { color: '#22c55e', bg: '#f0fdf4', label: 'Approved' },
    quality_check: { color: '#3b82f6', bg: '#eff6ff', label: 'Quality Check' },
  };
  const c = config[status] || { color: '#6b7280', bg: '#f9fafb', label: status };
  return (
    <View style={[styles.statusBadge, { backgroundColor: c.bg, borderColor: c.color + '30' }]}>
      <View style={[styles.statusDot, { backgroundColor: c.color }]} />
      <Text style={[styles.statusBadgeText, { color: c.color }]}>{c.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  loadingText: { marginTop: 12, color: '#6b7280', fontSize: 14 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: '#111827', marginTop: 16 },
  backBtn: { marginTop: 20, backgroundColor: '#3b82f6', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 10 },
  backBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, paddingTop: 60, backgroundColor: '#fff' },
  back: { width: 40, height: 40, borderRadius: 10, backgroundColor: '#f3f4f6', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },
  shareBtn: { width: 40, height: 40, borderRadius: 10, backgroundColor: '#f3f4f6', justifyContent: 'center', alignItems: 'center' },
  statusSection: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 12, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1 },
  statusDot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  statusBadgeText: { fontSize: 13, fontWeight: '600' },
  statusDate: { fontSize: 12, color: '#9ca3af' },
  workflowSection: { backgroundColor: '#fff', paddingVertical: 16, marginTop: 12 },
  sectionLabel: { fontSize: 14, fontWeight: '700', color: '#111827', marginBottom: 12, paddingHorizontal: 20 },
  workflowRow: { flexDirection: 'row', paddingHorizontal: 20 },
  workflowStep: { flexDirection: 'row', alignItems: 'center' },
  workflowDot: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#e5e7eb', justifyContent: 'center', alignItems: 'center' },
  workflowDotActive: { backgroundColor: '#3b82f6' },
  workflowDotCurrent: { backgroundColor: '#22c55e', borderWidth: 3, borderColor: '#bbf7d0' },
  workflowDotText: { fontSize: 12, fontWeight: '700', color: '#9ca3af' },
  workflowDotTextActive: { color: '#fff' },
  workflowLabel: { fontSize: 10, color: '#9ca3af', marginLeft: 6, marginRight: 4, width: 50 },
  workflowLabelActive: { color: '#3b82f6', fontWeight: '600' },
  workflowLine: { width: 20, height: 2, backgroundColor: '#e5e7eb', marginHorizontal: 4 },
  workflowLineActive: { backgroundColor: '#3b82f6' },
  card: { backgroundColor: '#fff', marginTop: 12, marginHorizontal: 16, padding: 16, borderRadius: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
  cardTitle: { fontSize: 14, fontWeight: '700', color: '#111827', marginBottom: 12 },
  infoRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  infoRowLeft: { flexDirection: 'row', alignItems: 'center' },
  infoLabel: { fontSize: 13, color: '#6b7280', marginLeft: 8 },
  infoValue: { fontSize: 13, fontWeight: '600', color: '#111827' },
  notesText: { fontSize: 14, color: '#374151', lineHeight: 20 },
  emptyText: { fontSize: 13, color: '#9ca3af', textAlign: 'center', paddingVertical: 12 },
  lineItem: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  lineItemText: { fontSize: 14, color: '#374151' },
  lineItemValue: { fontSize: 14, fontWeight: '600', color: '#111827' },
  costRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  costLabel: { fontSize: 13, color: '#6b7280' },
  costValue: { fontSize: 13, fontWeight: '600', color: '#111827' },
  bold: { fontWeight: '700' },
  totalValue: { fontSize: 16, fontWeight: '800', color: '#3b82f6' },
  divider: { height: 1, backgroundColor: '#e5e7eb', marginVertical: 10 },
  invoiceCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', marginTop: 12, marginHorizontal: 16, padding: 16, borderRadius: 16, borderLeftWidth: 4, borderLeftColor: '#8b5cf6', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
  invoiceInfo: { flex: 1, marginLeft: 12 },
  invoiceTitle: { fontSize: 14, fontWeight: '700', color: '#111827' },
  invoiceSubtitle: { fontSize: 12, color: '#6b7280', marginTop: 2 },
  actions: { flexDirection: 'row', gap: 12, padding: 16, marginTop: 12 },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 14, borderRadius: 12, gap: 8 },
  actionPrimary: { backgroundColor: '#3b82f6' },
  actionSecondary: { backgroundColor: '#f3f4f6' },
  actionPrimaryText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  actionSecondaryText: { color: '#6b7280', fontWeight: '600', fontSize: 14 },
});
