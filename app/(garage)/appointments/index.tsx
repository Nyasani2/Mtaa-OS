import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Image,
  Alert,
  Modal,
  TextInput,
  FlatList,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  Wrench,
  Plus,
  ChevronRight,
  Search,
  Calendar,
  Clock,
  User,
  Car,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Camera,
  FileText,
  Signature,
  CreditCard,
  Star,
  MoreVertical,
  Filter,
  ArrowLeft,
  Phone,
  Mail,
  MapPin,
  Fuel,
  Gauge,
  ClipboardList,
  Settings,
  Timer,
  Package,
  PenTool,
} from 'lucide-react-native';
import { useAppointments } from '@/lib/hooks/useAppointments';
import { useGarage } from '@/lib/hooks/useGarage';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { supabase } from '@/lib/supabase';

/* ─────────────────────────── Types ─────────────────────────── */

type AppointmentStatus =
  | 'pending'
  | 'diagnosing'
  | 'awaiting_approval'
  | 'approved'
  | 'in_progress'
  | 'quality_check'
  | 'ready_for_pickup'
  | 'completed'
  | 'cancelled';

interface Appointment {
  id: string;
  garage_id: string;
  vehicle_id: string | null;
  customer_id: string | null;
  mechanic_id: string | null;
  status: AppointmentStatus;
  service_type: string;
  description: string | null;
  estimated_cost: number | null;
  final_cost: number | null;
  mileage_in: number | null;
  mileage_out: number | null;
  fuel_level_in: number | null;
  fuel_level_out: number | null;
  customer_approved: boolean;
  customer_signature_url: string | null;
  mechanic_notes: string | null;
  customer_notes: string | null;
  scheduled_date: string | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  vehicle?: {
    make: string;
    model: string;
    year: number;
    plate_number: string;
    color: string;
  };
  customer?: {
    full_name: string;
    phone: string;
    email: string;
  };
  mechanic?: {
    full_name: string;
    specialization: string;
  };
}

/* ─────────────────────────── Status Config ─────────────────────────── */

const STATUS_CONFIG: Record<AppointmentStatus, { label: string; color: string; icon: any }> = {
  pending: { label: 'Pending', color: '#f59e0b', icon: Clock },
  diagnosing: { label: 'Diagnosing', color: '#3b82f6', icon: Settings },
  awaiting_approval: { label: 'Awaiting Approval', color: '#f97316', icon: AlertTriangle },
  approved: { label: 'Approved', color: '#22c55e', icon: CheckCircle },
  in_progress: { label: 'In Progress', color: '#8b5cf6', icon: Wrench },
  quality_check: { label: 'Quality Check', color: '#06b6d4', icon: ClipboardList },
  ready_for_pickup: { label: 'Ready for Pickup', color: '#10b981', icon: CheckCircle },
  completed: { label: 'Completed', color: '#16a34a', icon: CheckCircle },
  cancelled: { label: 'Cancelled', color: '#ef4444', icon: XCircle },
};

const WORKFLOW_STAGES: AppointmentStatus[] = [
  'pending',
  'diagnosing',
  'awaiting_approval',
  'approved',
  'in_progress',
  'quality_check',
  'ready_for_pickup',
  'completed',
];

/* ─────────────────────────── Main Screen ─────────────────────────── */

export default function AppointmentsScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { garage } = useGarage();
  const {
    appointments,
    loading,
    error,
    loadAppointments,
    createAppointment,
    updateStatus,
    refresh,
  } = useAppointments();

  const [activeTab, setActiveTab] = useState<'active' | 'completed' | 'all'>('active');
  const [searchQuery, setSearchQuery] = useState('');
  const [showNewModal, setShowNewModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [signaturePaths, setSignaturePaths] = useState<string[]>([]);

  /* ── New Appointment Form ── */
  const [newForm, setNewForm] = useState({
    vehiclePlate: '',
    customerPhone: '',
    serviceType: '',
    description: '',
    mileage: '',
    fuelLevel: '50',
    scheduledDate: '',
  });

  /* ── Filter Logic ── */
  const filteredAppointments = appointments.filter((apt) => {
    const matchesTab =
      activeTab === 'all'
        ? true
        : activeTab === 'active'
        ? !['completed', 'cancelled'].includes(apt.status)
        : apt.status === 'completed';

    const matchesSearch =
      !searchQuery ||
      apt.service_type?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      apt.vehicle?.plate_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      apt.customer?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      apt.vehicle?.make?.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesTab && matchesSearch;
  });

  /* ── Handlers ── */
  const handleCreate = useCallback(async () => {
    if (!garage?.id) {
      Alert.alert('Error', 'You must be a registered garage to create appointments.');
      return;
    }
    if (!newForm.vehiclePlate || !newForm.serviceType) {
      Alert.alert('Required', 'Vehicle plate and service type are required.');
      return;
    }

    try {
      // Look up vehicle by plate
      const { data: vehicleData } = await supabase
        .from('vehicles')
        .select('id, owner_id')
        .eq('plate_number', newForm.vehiclePlate.trim().toUpperCase())
        .single();

      await createAppointment({
        garage_id: garage.id,
        vehicle_id: vehicleData?.id || null,
        customer_id: vehicleData?.owner_id || null,
        service_type: newForm.serviceType,
        description: newForm.description || null,
        mileage_in: newForm.mileage ? parseInt(newForm.mileage) : null,
        fuel_level_in: parseInt(newForm.fuelLevel) || 50,
        scheduled_date: newForm.scheduledDate || null,
        status: 'pending',
      });

      setShowNewModal(false);
      setNewForm({
        vehiclePlate: '',
        customerPhone: '',
        serviceType: '',
        description: '',
        mileage: '',
        fuelLevel: '50',
        scheduledDate: '',
      });
      loadAppointments();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to create appointment');
    }
  }, [newForm, garage, createAppointment, loadAppointments]);

  const handleStatusAdvance = useCallback(
    async (apt: Appointment) => {
      const currentIndex = WORKFLOW_STAGES.indexOf(apt.status);
      if (currentIndex < WORKFLOW_STAGES.length - 1) {
        const nextStatus = WORKFLOW_STAGES[currentIndex + 1];
        try {
          await updateStatus(apt.id, nextStatus);
          loadAppointments();
        } catch (err: any) {
          Alert.alert('Error', err.message);
        }
      }
    },
    [updateStatus, loadAppointments]
  );

  const handleStatusBack = useCallback(
    async (apt: Appointment) => {
      const currentIndex = WORKFLOW_STAGES.indexOf(apt.status);
      if (currentIndex > 0) {
        const prevStatus = WORKFLOW_STAGES[currentIndex - 1];
        try {
          await updateStatus(apt.id, prevStatus);
          loadAppointments();
        } catch (err: any) {
          Alert.alert('Error', err.message);
        }
      }
    },
    [updateStatus, loadAppointments]
  );

  const openDetail = useCallback((apt: Appointment) => {
    setSelectedAppointment(apt);
    setShowDetailModal(true);
  }, []);

  /* ── Render Helpers ── */
  const renderStatusBadge = (status: AppointmentStatus) => {
    const config = STATUS_CONFIG[status];
    const Icon = config.icon;
    return (
      <View style={[styles.statusBadge, { backgroundColor: config.color + '20' }]}>
        <Icon size={12} color={config.color} />
        <Text style={[styles.statusText, { color: config.color }]}>{config.label}</Text>
      </View>
    );
  };

  const renderAppointmentCard = ({ item }: { item: Appointment }) => (
    <TouchableOpacity style={styles.card} onPress={() => openDetail(item)}>
      <View style={styles.cardHeader}>
        <View style={styles.cardTitleRow}>
          <Car size={18} color="#3b82f6" />
          <Text style={styles.cardTitle}>
            {item.vehicle
              ? `${item.vehicle.make} ${item.vehicle.model} (${item.vehicle.year})`
              : 'Unknown Vehicle'}
          </Text>
        </View>
        {renderStatusBadge(item.status)}
      </View>

      <View style={styles.cardBody}>
        <View style={styles.infoRow}>
          <MapPin size={14} color="#6b7280" />
          <Text style={styles.infoText}>
            {item.vehicle?.plate_number || 'No plate'}
          </Text>
        </View>
        <View style={styles.infoRow}>
          <User size={14} color="#6b7280" />
          <Text style={styles.infoText}>
            {item.customer?.full_name || 'Walk-in customer'}
          </Text>
        </View>
        <View style={styles.infoRow}>
          <Wrench size={14} color="#6b7280" />
          <Text style={styles.infoText}>{item.service_type}</Text>
        </View>
        {item.estimated_cost && (
          <View style={styles.infoRow}>
            <CreditCard size={14} color="#6b7280" />
            <Text style={styles.infoText}>
              Est: KES {item.estimated_cost.toLocaleString()}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.cardFooter}>
        <Text style={styles.cardDate}>
          {item.scheduled_date
            ? new Date(item.scheduled_date).toLocaleDateString()
            : new Date(item.created_at).toLocaleDateString()}
        </Text>
        <ChevronRight size={16} color="#9ca3af" />
      </View>
    </TouchableOpacity>
  );

  /* ── Loading / Empty ── */
  if (loading && appointments.length === 0) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>Loading appointments...</Text>
      </View>
    );
  }

  /* ── Main Render ── */
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => router.back()}>
            <ArrowLeft size={24} color="#1f2937" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Work Orders</Text>
          <TouchableOpacity onPress={() => setShowNewModal(true)}>
            <View style={styles.addButton}>
              <Plus size={20} color="#fff" />
            </View>
          </TouchableOpacity>
        </View>

        {/* Search */}
        <View style={styles.searchBox}>
          <Search size={18} color="#9ca3af" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by plate, name, or service..."
            placeholderTextColor="#9ca3af"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Tabs */}
        <View style={styles.tabRow}>
          {(['active', 'completed', 'all'] as const).map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, activeTab === tab && styles.tabActive]}
              onPress={() => setActiveTab(tab)}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === tab && styles.tabTextActive,
                ]}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Stats Row */}
      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <Text style={styles.statNumber}>
            {appointments.filter((a) => a.status === 'pending').length}
          </Text>
          <Text style={styles.statLabel}>Pending</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statNumber}>
            {appointments.filter((a) => a.status === 'in_progress').length}
          </Text>
          <Text style={styles.statLabel}>In Progress</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statNumber}>
            {appointments.filter((a) => a.status === 'ready_for_pickup').length}
          </Text>
          <Text style={styles.statLabel}>Ready</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statNumber}>
            {appointments.filter((a) => a.status === 'completed').length}
          </Text>
          <Text style={styles.statLabel}>Today</Text>
        </View>
      </View>

      {/* List */}
      <FlatList
        data={filteredAppointments}
        keyExtractor={(item) => item.id}
        renderItem={renderAppointmentCard}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={refresh} tintColor="#3b82f6" />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <ClipboardList size={48} color="#d1d5db" />
            <Text style={styles.emptyTitle}>No appointments found</Text>
            <Text style={styles.emptySubtitle}>
              {activeTab === 'active'
                ? 'All caught up! Create a new work order to get started.'
                : 'No completed appointments yet.'}
            </Text>
            <TouchableOpacity
              style={styles.emptyButton}
              onPress={() => setShowNewModal(true)}
            >
              <Plus size={16} color="#fff" />
              <Text style={styles.emptyButtonText}>New Work Order</Text>
            </TouchableOpacity>
          </View>
        }
      />

      {/* ── New Appointment Modal ── */}
      <Modal
        visible={showNewModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowNewModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalContainer}
        >
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>New Work Order</Text>
            <TouchableOpacity onPress={() => setShowNewModal(false)}>
              <XCircle size={24} color="#6b7280" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
            <Text style={styles.sectionLabel}>Vehicle Information</Text>
            <View style={styles.inputGroup}>
              <Car size={16} color="#6b7280" />
              <TextInput
                style={styles.input}
                placeholder="License Plate (e.g., KCY 123A)"
                placeholderTextColor="#9ca3af"
                autoCapitalize="characters"
                value={newForm.vehiclePlate}
                onChangeText={(t) => setNewForm((p) => ({ ...p, vehiclePlate: t }))}
              />
            </View>

            <View style={styles.inputGroup}>
              <Gauge size={16} color="#6b7280" />
              <TextInput
                style={styles.input}
                placeholder="Current Mileage (km)"
                placeholderTextColor="#9ca3af"
                keyboardType="numeric"
                value={newForm.mileage}
                onChangeText={(t) => setNewForm((p) => ({ ...p, mileage: t }))}
              />
            </View>

            <View style={styles.inputGroup}>
              <Fuel size={16} color="#6b7280" />
              <Text style={styles.inputLabel}>Fuel Level: {newForm.fuelLevel}%</Text>
              <View style={styles.sliderRow}>
                <TouchableOpacity
                  style={styles.sliderBtn}
                  onPress={() =>
                    setNewForm((p) => ({
                      ...p,
                      fuelLevel: Math.max(0, parseInt(p.fuelLevel) - 10).toString(),
                    }))
                  }
                >
                  <Text style={styles.sliderBtnText}>-</Text>
                </TouchableOpacity>
                <View style={[styles.fuelBar, { width: `${parseInt(newForm.fuelLevel)}%` }]} />
                <TouchableOpacity
                  style={styles.sliderBtn}
                  onPress={() =>
                    setNewForm((p) => ({
                      ...p,
                      fuelLevel: Math.min(100, parseInt(p.fuelLevel) + 10).toString(),
                    }))
                  }
                >
                  <Text style={styles.sliderBtnText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>

            <Text style={[styles.sectionLabel, { marginTop: 20 }]}>Service Details</Text>
            <View style={styles.inputGroup}>
              <Wrench size={16} color="#6b7280" />
              <TextInput
                style={styles.input}
                placeholder="Service Type (e.g., Oil Change, Brake Repair)"
                placeholderTextColor="#9ca3af"
                value={newForm.serviceType}
                onChangeText={(t) => setNewForm((p) => ({ ...p, serviceType: t }))}
              />
            </View>

            <View style={[styles.inputGroup, styles.textAreaGroup]}>
              <FileText size={16} color="#6b7280" />
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Describe the issue or requested service..."
                placeholderTextColor="#9ca3af"
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                value={newForm.description}
                onChangeText={(t) => setNewForm((p) => ({ ...p, description: t }))}
              />
            </View>

            <View style={styles.inputGroup}>
              <Calendar size={16} color="#6b7280" />
              <TextInput
                style={styles.input}
                placeholder="Scheduled Date (YYYY-MM-DD)"
                placeholderTextColor="#9ca3af"
                value={newForm.scheduledDate}
                onChangeText={(t) => setNewForm((p) => ({ ...p, scheduledDate: t }))}
              />
            </View>

            {/* Photo capture placeholder */}
            <TouchableOpacity style={styles.photoButton}>
              <Camera size={20} color="#3b82f6" />
              <Text style={styles.photoButtonText}>Take Before Photos</Text>
            </TouchableOpacity>
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowNewModal(false)}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveBtn} onPress={handleCreate}>
              <Text style={styles.saveBtnText}>Create Work Order</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ── Detail Modal ── */}
      {selectedAppointment && (
        <Modal
          visible={showDetailModal}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setShowDetailModal(false)}
        >
          <ScrollView style={styles.detailContainer}>
            {/* Detail Header */}
            <View style={styles.detailHeader}>
              <TouchableOpacity onPress={() => setShowDetailModal(false)}>
                <ArrowLeft size={24} color="#1f2937" />
              </TouchableOpacity>
              <Text style={styles.detailTitle}>Work Order #{selectedAppointment.id.slice(-6).toUpperCase()}</Text>
              <View style={{ width: 24 }} />
            </View>

            {/* Workflow Stage Indicator */}
            <View style={styles.workflowContainer}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {WORKFLOW_STAGES.map((stage, idx) => {
                  const isActive = stage === selectedAppointment.status;
                  const isPast = WORKFLOW_STAGES.indexOf(selectedAppointment.status) > idx;
                  const StageIcon = STATUS_CONFIG[stage].icon;
                  return (
                    <View key={stage} style={styles.workflowStep}>
                      <View
                        style={[
                          styles.workflowDot,
                          isActive && { backgroundColor: STATUS_CONFIG[stage].color },
                          isPast && { backgroundColor: '#22c55e' },
                        ]}
                      >
                        <StageIcon
                          size={14}
                          color={isActive || isPast ? '#fff' : '#9ca3af'}
                        />
                      </View>
                      <Text
                        style={[
                          styles.workflowLabel,
                          isActive && { color: STATUS_CONFIG[stage].color, fontWeight: '700' },
                          isPast && { color: '#22c55e' },
                        ]}
                      >
                        {STATUS_CONFIG[stage].label}
                      </Text>
                    </View>
                  );
                })}
              </ScrollView>
            </View>

            {/* Vehicle Info Card */}
            <View style={styles.detailCard}>
              <Text style={styles.detailSectionTitle}>Vehicle</Text>
              <View style={styles.detailRow}>
                <Car size={18} color="#3b82f6" />
                <Text style={styles.detailValue}>
                  {selectedAppointment.vehicle
                    ? `${selectedAppointment.vehicle.make} ${selectedAppointment.vehicle.model} ${selectedAppointment.vehicle.year}`
                    : 'Not registered'}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <MapPin size={18} color="#6b7280" />
                <Text style={styles.detailValue}>
                  {selectedAppointment.vehicle?.plate_number || 'No plate'}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Gauge size={18} color="#6b7280" />
                <Text style={styles.detailValue}>
                  In: {selectedAppointment.mileage_in?.toLocaleString() || '—'} km
                  {selectedAppointment.mileage_out
                    ? `  → Out: ${selectedAppointment.mileage_out.toLocaleString()} km`
                    : ''}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Fuel size={18} color="#6b7280" />
                <Text style={styles.detailValue}>
                  In: {selectedAppointment.fuel_level_in || '—'}%
                  {selectedAppointment.fuel_level_out
                    ? `  → Out: ${selectedAppointment.fuel_level_out}%`
                    : ''}
                </Text>
              </View>
            </View>

            {/* Customer Info */}
            <View style={styles.detailCard}>
              <Text style={styles.detailSectionTitle}>Customer</Text>
              <View style={styles.detailRow}>
                <User size={18} color="#6b7280" />
                <Text style={styles.detailValue}>
                  {selectedAppointment.customer?.full_name || 'Walk-in'}
                </Text>
              </View>
              {selectedAppointment.customer?.phone && (
                <View style={styles.detailRow}>
                  <Phone size={18} color="#6b7280" />
                  <Text style={styles.detailValue}>
                    {selectedAppointment.customer.phone}
                  </Text>
                </View>
              )}
            </View>

            {/* Service Info */}
            <View style={styles.detailCard}>
              <Text style={styles.detailSectionTitle}>Service</Text>
              <View style={styles.detailRow}>
                <Wrench size={18} color="#6b7280" />
                <Text style={styles.detailValue}>{selectedAppointment.service_type}</Text>
              </View>
              {selectedAppointment.description && (
                <View style={styles.detailRow}>
                  <FileText size={18} color="#6b7280" />
                  <Text style={styles.detailValue}>{selectedAppointment.description}</Text>
                </View>
              )}
              {selectedAppointment.mechanic_notes && (
                <View style={[styles.detailRow, { marginTop: 8 }]}>
                  <PenTool size={18} color="#6b7280" />
                  <Text style={[styles.detailValue, { fontStyle: 'italic' }]}>
                    Mechanic: {selectedAppointment.mechanic_notes}
                  </Text>
                </View>
              )}
            </View>

            {/* Cost */}
            <View style={styles.detailCard}>
              <Text style={styles.detailSectionTitle}>Cost</Text>
              <View style={styles.costRow}>
                <Text style={styles.costLabel}>Estimated</Text>
                <Text style={styles.costValue}>
                  KES {selectedAppointment.estimated_cost?.toLocaleString() || '—'}
                </Text>
              </View>
              <View style={styles.costRow}>
                <Text style={styles.costLabel}>Final</Text>
                <Text style={[styles.costValue, { color: '#16a34a', fontWeight: '700' }]}>
                  KES {selectedAppointment.final_cost?.toLocaleString() || 'Pending'}
                </Text>
              </View>
            </View>

            {/* Photos Grid Placeholder */}
            <View style={styles.detailCard}>
              <Text style={styles.detailSectionTitle}>Photos</Text>
              <View style={styles.photoGrid}>
                <TouchableOpacity style={styles.photoPlaceholder}>
                  <Camera size={24} color="#9ca3af" />
                  <Text style={styles.photoPlaceholderText}>Before</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.photoPlaceholder}>
                  <Camera size={24} color="#9ca3af" />
                  <Text style={styles.photoPlaceholderText}>During</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.photoPlaceholder}>
                  <Camera size={24} color="#9ca3af" />
                  <Text style={styles.photoPlaceholderText}>After</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Action Buttons */}
            <View style={styles.actionButtons}>
              {selectedAppointment.status !== 'completed' &&
                selectedAppointment.status !== 'cancelled' && (
                  <>
                    <TouchableOpacity
                      style={[styles.actionBtn, { backgroundColor: '#f3f4f6' }]}
                      onPress={() => handleStatusBack(selectedAppointment)}
                    >
                      <ArrowLeft size={18} color="#374151" />
                      <Text style={[styles.actionBtnText, { color: '#374151' }]}>
                        Step Back
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.actionBtn, { backgroundColor: '#3b82f6' }]}
                      onPress={() => handleStatusAdvance(selectedAppointment)}
                    >
                      <CheckCircle size={18} color="#fff" />
                      <Text style={[styles.actionBtnText, { color: '#fff' }]}>
                        {selectedAppointment.status === 'ready_for_pickup'
                          ? 'Mark Completed'
                          : 'Advance Stage'}
                      </Text>
                    </TouchableOpacity>
                  </>
                )}

              {selectedAppointment.status === 'ready_for_pickup' && (
                <TouchableOpacity
                  style={[styles.actionBtn, { backgroundColor: '#10b981' }]}
                  onPress={() => setShowSignatureModal(true)}
                >
                  <Signature size={18} color="#fff" />
                  <Text style={[styles.actionBtnText, { color: '#fff' }]}>
                    Customer Signature
                  </Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: '#f59e0b' }]}
                onPress={() => Alert.alert('Invoice', 'Generate invoice from services + parts + labor')}
              >
                <FileText size={18} color="#fff" />
                <Text style={[styles.actionBtnText, { color: '#fff' }]}>
                  Generate Invoice
                </Text>
              </TouchableOpacity>
            </View>

            <View style={{ height: 40 }} />
          </ScrollView>
        </Modal>
      )}
    </View>
  );
}

/* ─────────────────────────── Styles ─────────────────────────── */

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f9fafb' },
  loadingText: { marginTop: 12, fontSize: 14, color: '#6b7280' },

  /* Header */
  header: { backgroundColor: '#fff', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  headerTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#1f2937' },
  addButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#3b82f6', justifyContent: 'center', alignItems: 'center' },

  /* Search */
  searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f3f4f6', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, marginBottom: 12 },
  searchInput: { flex: 1, marginLeft: 8, fontSize: 14, color: '#1f2937' },

  /* Tabs */
  tabRow: { flexDirection: 'row', gap: 8 },
  tab: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#f3f4f6' },
  tabActive: { backgroundColor: '#3b82f6' },
  tabText: { fontSize: 13, fontWeight: '600', color: '#6b7280' },
  tabTextActive: { color: '#fff' },

  /* Stats */
  statsRow: { flexDirection: 'row', padding: 12, gap: 8 },
  statBox: { flex: 1, backgroundColor: '#fff', borderRadius: 12, padding: 12, alignItems: 'center', borderWidth: 1, borderColor: '#e5e7eb' },
  statNumber: { fontSize: 20, fontWeight: '700', color: '#1f2937' },
  statLabel: { fontSize: 11, color: '#6b7280', marginTop: 4 },

  /* List */
  listContent: { padding: 12, paddingBottom: 40 },

  /* Card */
  card: { backgroundColor: '#fff', borderRadius: 14, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#e5e7eb' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 8 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: '#1f2937', marginLeft: 8, flex: 1 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  statusText: { fontSize: 11, fontWeight: '600', marginLeft: 4 },
  cardBody: { gap: 6 },
  infoRow: { flexDirection: 'row', alignItems: 'center' },
  infoText: { fontSize: 13, color: '#4b5563', marginLeft: 8 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#f3f4f6' },
  cardDate: { fontSize: 12, color: '#9ca3af' },

  /* Empty */
  emptyState: { alignItems: 'center', paddingVertical: 60 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#6b7280', marginTop: 16 },
  emptySubtitle: { fontSize: 13, color: '#9ca3af', marginTop: 6, textAlign: 'center', paddingHorizontal: 40 },
  emptyButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#3b82f6', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 10, marginTop: 20 },
  emptyButtonText: { color: '#fff', fontWeight: '600', marginLeft: 8 },

  /* Modal */
  modalContainer: { flex: 1, backgroundColor: '#fff' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#1f2937' },
  modalBody: { flex: 1, padding: 16 },
  modalFooter: { flexDirection: 'row', padding: 16, gap: 12, borderTopWidth: 1, borderTopColor: '#e5e7eb' },

  sectionLabel: { fontSize: 13, fontWeight: '700', color: '#6b7280', textTransform: 'uppercase', marginBottom: 10, letterSpacing: 0.5 },
  inputGroup: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f9fafb', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 12, marginBottom: 10, borderWidth: 1, borderColor: '#e5e7eb' },
  textAreaGroup: { alignItems: 'flex-start', paddingTop: 12 },
  input: { flex: 1, marginLeft: 10, fontSize: 14, color: '#1f2937' },
  textArea: { height: 80, textAlignVertical: 'top' },
  inputLabel: { fontSize: 13, color: '#4b5563', marginLeft: 10, flex: 1 },
  sliderRow: { flexDirection: 'row', alignItems: 'center', marginLeft: 10, flex: 1 },
  sliderBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#e5e7eb', justifyContent: 'center', alignItems: 'center' },
  sliderBtnText: { fontSize: 18, fontWeight: '700', color: '#374151' },
  fuelBar: { height: 8, backgroundColor: '#22c55e', borderRadius: 4, marginHorizontal: 8, flex: 1 },

  photoButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 16, borderWidth: 2, borderColor: '#dbeafe', borderStyle: 'dashed', borderRadius: 12, marginTop: 10 },
  photoButtonText: { marginLeft: 8, color: '#3b82f6', fontWeight: '600' },

  cancelBtn: { flex: 1, paddingVertical: 14, borderRadius: 10, backgroundColor: '#f3f4f6', alignItems: 'center' },
  cancelBtnText: { color: '#374151', fontWeight: '600' },
  saveBtn: { flex: 2, paddingVertical: 14, borderRadius: 10, backgroundColor: '#3b82f6', alignItems: 'center' },
  saveBtnText: { color: '#fff', fontWeight: '700' },

  /* Detail */
  detailContainer: { flex: 1, backgroundColor: '#f9fafb' },
  detailHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  detailTitle: { fontSize: 16, fontWeight: '700', color: '#1f2937' },

  workflowContainer: { backgroundColor: '#fff', paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  workflowStep: { alignItems: 'center', marginHorizontal: 8, width: 70 },
  workflowDot: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#e5e7eb', justifyContent: 'center', alignItems: 'center', marginBottom: 6 },
  workflowLabel: { fontSize: 10, color: '#9ca3af', textAlign: 'center' },

  detailCard: { backgroundColor: '#fff', margin: 12, marginTop: 0, padding: 16, borderRadius: 14, borderWidth: 1, borderColor: '#e5e7eb' },
  detailSectionTitle: { fontSize: 13, fontWeight: '700', color: '#6b7280', textTransform: 'uppercase', marginBottom: 12, letterSpacing: 0.5 },
  detailRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  detailValue: { fontSize: 14, color: '#374151', marginLeft: 10, flex: 1 },

  costRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  costLabel: { fontSize: 14, color: '#6b7280' },
  costValue: { fontSize: 14, fontWeight: '600', color: '#1f2937' },

  photoGrid: { flexDirection: 'row', gap: 10 },
  photoPlaceholder: { flex: 1, aspectRatio: 1, backgroundColor: '#f3f4f6', borderRadius: 10, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#e5e7eb', borderStyle: 'dashed' },
  photoPlaceholderText: { fontSize: 11, color: '#9ca3af', marginTop: 4 },

  actionButtons: { padding: 12, gap: 10 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, borderRadius: 12, gap: 8 },
  actionBtnText: { fontSize: 14, fontWeight: '700' },
});
