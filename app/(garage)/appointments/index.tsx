import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal,
  TextInput, ActivityIndicator, RefreshControl, Alert, Image,
  KeyboardAvoidingView, Platform
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { useGarage } from '@/lib/hooks/useGarage';
import { useAppointments } from '@/lib/hooks/useAppointments';
import { supabase } from '@/lib/supabase';
import {
  Wrench, Calendar, Clock, ChevronRight, Plus, X, Camera,
  Car,
  CheckCircle, AlertCircle, DollarSign, FileText, Star,
  Phone, Mail, MapPin, User, Gauge, Fuel, Image as ImageIcon,
  ChevronLeft, ChevronRight as ChevronRightIcon, Printer, Share2
} from 'lucide-react-native';

const WORKFLOW_STAGES = [
  { key: 'vehicle_reception', label: 'Reception', icon: 'Car' },
  { key: 'diagnosis', label: 'Diagnosis', icon: 'Search' },
  { key: 'quote_sent', label: 'Quote Sent', icon: 'FileText' },
  { key: 'approved', label: 'Approved', icon: 'CheckCircle' },
  { key: 'in_progress', label: 'In Progress', icon: 'Wrench' },
  { key: 'quality_check', label: 'QC', icon: 'Shield' },
  { key: 'ready_for_pickup', label: 'Ready', icon: 'CheckCircle' },
  { key: 'completed', label: 'Completed', icon: 'Star' },
];

export default function AppointmentsScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { garage } = useGarage();
  const {
    appointments, stats, loading, refreshAppointments,
    createAppointment, updateAppointment, addService, addPart
  } = useAppointments();

  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('active');
  const [searchQuery, setSearchQuery] = useState('');
  const [showNewModal, setShowNewModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [selectedAppt, setSelectedAppt] = useState<any>(null);
  const [invoiceData, setInvoiceData] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);

  const [newForm, setNewForm] = useState({
    vehicle_plate: '', customer_name: '', customer_phone: '',
    service_type: '', description: '', mileage: '', fuel_level: '50',
    scheduled_date: new Date().toISOString().split('T')[0],
  });

  const [serviceForm, setServiceForm] = useState({ name: '', cost: '' });
  const [partForm, setPartForm] = useState({ name: '', quantity: '1', unit_cost: '' });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refreshAppointments?.();
    setRefreshing(false);
  }, [refreshAppointments]);

  useEffect(() => { refreshAppointments?.(); }, []);

  const filtered = appointments.filter(a => {
    const matchesFilter = filter === 'all' ? true :
      filter === 'active' ? ['pending', 'in_progress', 'ready_for_pickup'].includes(a.status) :
      a.status === 'completed';
    const matchesSearch = !searchQuery ||
      (a.vehicle_plate || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (a.customer_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (a.service_type || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const handleCreate = async () => {
    if (!garage) { Alert.alert('Error', 'You must be a registered garage.'); return; }
    if (!newForm.vehicle_plate || !newForm.service_type) {
      Alert.alert('Required', 'Vehicle plate and service type are required.'); return;
    }
    try {
      await createAppointment({ ...newForm, garage_id: garage.id });
      setShowNewModal(false);
      setNewForm({ vehicle_plate: '', customer_name: '', customer_phone: '', service_type: '', description: '', mileage: '', fuel_level: '50', scheduled_date: new Date().toISOString().split('T')[0] });
      refreshAppointments?.();
    } catch (err: any) { Alert.alert('Error', err.message || 'Failed to create appointment'); }
  };

  const handleAdvance = async (appt: any, direction: 'next' | 'prev') => {
    const stages = WORKFLOW_STAGES.map(s => s.key);
    const currentIdx = stages.indexOf(appt.status);
    const nextIdx = direction === 'next' ? Math.min(currentIdx + 1, stages.length - 1) : Math.max(currentIdx - 1, 0);
    const nextStatus = stages[nextIdx];
    try {
      await updateAppointment(appt.id, { status: nextStatus });
      if (nextStatus === 'ready_for_pickup') {
        Alert.alert('Ready for Pickup', 'Customer has been notified.');
      }
      refreshAppointments?.();
      if (selectedAppt?.id === appt.id) setSelectedAppt({ ...appt, status: nextStatus });
    } catch (err: any) { Alert.alert('Error', err.message); }
  };

  const handleAddService = async () => {
    if (!serviceForm.name || !serviceForm.cost) return;
    try {
      await addService(selectedAppt.id, { name: serviceForm.name, cost: parseFloat(serviceForm.cost) });
      setServiceForm({ name: '', cost: '' });
      refreshAppointments?.();
    } catch (err: any) { Alert.alert('Error', err.message); }
  };

  const handleAddPart = async () => {
    if (!partForm.name || !partForm.unit_cost) return;
    try {
      await addPart(selectedAppt.id, {
        name: partForm.name,
        quantity: parseInt(partForm.quantity) || 1,
        unit_cost: parseFloat(partForm.unit_cost)
      });
      setPartForm({ name: '', quantity: '1', unit_cost: '' });
      refreshAppointments?.();
    } catch (err: any) { Alert.alert('Error', err.message); }
  };

  // REAL INVOICE GENERATION
  const handleGenerateInvoice = async (appt: any) => {
    try {
      const { data: services } = await supabase
        .from('garage_services')
        .select('*')
        .eq('appointment_id', appt.id);
      const { data: parts } = await supabase
        .from('// STUB_REMOVED: "garage_parts_used"')
        .select('*')
        .eq('appointment_id', appt.id);

      const servicesTotal = (services || []).reduce((sum: number, s: any) => sum + (s.cost || 0), 0);
      const partsTotal = (parts || []).reduce((sum: number, p: any) => sum + ((p.quantity || 0) * (p.unit_cost || 0)), 0);
      const laborHours = appt.labor_hours || 2;
      const laborRate = appt.labor_rate || 1500;
      const laborTotal = laborHours * laborRate;
      const subtotal = servicesTotal + partsTotal + laborTotal;
      const vat = subtotal * 0.16;
      const total = subtotal + vat;

      const invoice = {
        appointment_id: appt.id,
        garage_id: appt.garage_id,
        customer_name: appt.customer_name,
        customer_phone: appt.customer_phone,
        vehicle_plate: appt.vehicle_plate,
        services: services || [],
        parts: parts || [],
        labor_hours: laborHours,
        labor_rate: laborRate,
        labor_total: laborTotal,
        services_total: servicesTotal,
        parts_total: partsTotal,
        subtotal,
        vat,
        total,
        status: 'draft',
        created_at: new Date().toISOString(),
      };

      const { data: savedInvoice, error } = await supabase
        .from('garage_invoices')
        .insert([invoice])
        .select()
        .single();

      if (error) throw error;

      setInvoiceData({ ...invoice, id: savedInvoice.id });
      setShowInvoiceModal(true);

      await supabase
        .from('garage_appointments')
        .update({ invoice_id: savedInvoice.id })
        .eq('id', appt.id);

      refreshAppointments?.();
    } catch (err: any) {
      Alert.alert('Invoice Error', err.message || 'Failed to generate invoice');
    }
  };

  const handleShareInvoice = async () => {
    if (!invoiceData) return;
    try {
      const { Share } = await import('react-native');
      const message = 'INVOICE #' + invoiceData.id.slice(0, 8).toUpperCase() + '\n\n' +
        'Garage: ' + (garage?.name || '') + '\n' +
        'Customer: ' + invoiceData.customer_name + '\n' +
        'Vehicle: ' + invoiceData.vehicle_plate + '\n\n' +
        'Services: KES ' + invoiceData.services_total.toLocaleString() + '\n' +
        'Parts: KES ' + invoiceData.parts_total.toLocaleString() + '\n' +
        'Labor (' + invoiceData.labor_hours + 'h @ KES ' + invoiceData.labor_rate + '/h): KES ' + invoiceData.labor_total.toLocaleString() + '\n' +
        'Subtotal: KES ' + invoiceData.subtotal.toLocaleString() + '\n' +
        'VAT (16%): KES ' + invoiceData.vat.toLocaleString() + '\n' +
        'TOTAL: KES ' + invoiceData.total.toLocaleString();
      await Share.share({ message, title: 'Invoice - ' + invoiceData.vehicle_plate });
    } catch (err: any) {
      Alert.alert('Error', err.message);
    }
  };

  const getStageIndex = (status: string) => WORKFLOW_STAGES.findIndex(s => s.key === status);

  if (loading && !refreshing) {
    return <View style={styles.center}><ActivityIndicator size="large" color="#3b82f6" /></View>;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Work Orders</Text>
        <View style={styles.filterRow}>
          {(['active', 'all', 'completed'] as const).map(f => (
            <TouchableOpacity key={f} style={[styles.filterBtn, filter === f && styles.filterBtnActive]} onPress={() => setFilter(f)}>
              <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
                {f === 'active' ? 'Active' : f === 'all' ? 'All' : 'Completed'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={styles.searchBox}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search by plate, name, or service..."
            placeholderTextColor="#9ca3af"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      <View style={styles.statsRow}>
        <StatPill label="Pending" value={stats?.pending || 0} color="#f59e0b" />
        <StatPill label="In Progress" value={stats?.inProgress || 0} color="#3b82f6" />
        <StatPill label="Ready" value={stats?.ready || 0} color="#22c55e" />
        <StatPill label="Today" value={stats?.today || 0} color="#8b5cf6" />
      </View>

      <ScrollView style={styles.list} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
        {filtered.length === 0 ? (
          <View style={styles.empty}>
            <FileText size={40} color="#d1d5db" />
            <Text style={styles.emptyText}>No work orders found</Text>
          </View>
        ) : (
          filtered.map(appt => (
            <TouchableOpacity key={appt.id} style={styles.card} onPress={() => { setSelectedAppt(appt); setShowDetailModal(true); }}>
              <View style={styles.cardTop}>
                <View style={styles.cardLeft}>
                  <View style={[styles.cardIcon, { backgroundColor: getStatusColor(appt.status) + '15' }]}>
                    <CarIcon status={appt.status} />
                  </View>
                  <View>
                    <Text style={styles.plate}>{appt.vehicle_plate || 'Unknown'}</Text>
                    <Text style={styles.service}>{appt.service_type}</Text>
                    <Text style={styles.customer}>{appt.customer_name || 'No name'} - {appt.customer_phone || 'No phone'}</Text>
                  </View>
                </View>
                <StatusBadge status={appt.status} />
              </View>
              <View style={styles.cardBottom}>
                <Text style={styles.date}><Calendar size={12} color="#9ca3af" /> {formatDate(appt.scheduled_date)}</Text>
                <Text style={styles.mileage}><Gauge size={12} color="#9ca3af" /> {appt.mileage || '-'} km</Text>
                <ChevronRight size={16} color="#d1d5db" />
              </View>
            </TouchableOpacity>
          ))
        )}
        <View style={{ height: 100 }} />
      </ScrollView>

      <TouchableOpacity style={styles.fab} onPress={() => setShowNewModal(true)}>
        <Plus size={24} color="#fff" />
      </TouchableOpacity>

      {/* New Work Order Modal */}
      <Modal visible={showNewModal} animationType="slide" transparent>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>New Work Order</Text>
              <TouchableOpacity onPress={() => setShowNewModal(false)}><X size={24} color="#6b7280" /></TouchableOpacity>
            </View>
            <ScrollView style={styles.modalBody}>
              <InputGroup icon={<Car size={16} color="#6b7280" />}>
                <TextInput style={styles.input} placeholder="License Plate" autoCapitalize="characters" value={newForm.vehicle_plate} onChangeText={t => setNewForm(p => ({ ...p, vehicle_plate: t }))} />
              </InputGroup>
              <InputGroup icon={<User size={16} color="#6b7280" />}>
                <TextInput style={styles.input} placeholder="Customer Name" value={newForm.customer_name} onChangeText={t => setNewForm(p => ({ ...p, customer_name: t }))} />
              </InputGroup>
              <InputGroup icon={<Phone size={16} color="#6b7280" />}>
                <TextInput style={styles.input} placeholder="Customer Phone" keyboardType="phone-pad" value={newForm.customer_phone} onChangeText={t => setNewForm(p => ({ ...p, customer_phone: t }))} />
              </InputGroup>
              <InputGroup icon={<Wrench size={16} color="#6b7280" />}>
                <TextInput style={styles.input} placeholder="Service Type (e.g., Oil Change, Brake Repair)" value={newForm.service_type} onChangeText={t => setNewForm(p => ({ ...p, service_type: t }))} />
              </InputGroup>
              <InputGroup icon={<FileText size={16} color="#6b7280" />}>
                <TextInput style={[styles.input, styles.textArea]} placeholder="Description of issue..." multiline textAlignVertical="top" value={newForm.description} onChangeText={t => setNewForm(p => ({ ...p, description: t }))} />
              </InputGroup>
              <View style={styles.rowInputs}>
                <InputGroup icon={<Gauge size={16} color="#6b7280" />} style={styles.half}>
                  <TextInput style={styles.input} placeholder="Mileage" keyboardType="numeric" value={newForm.mileage} onChangeText={t => setNewForm(p => ({ ...p, mileage: t }))} />
                </InputGroup>
                <InputGroup icon={<Fuel size={16} color="#6b7280" />} style={styles.half}>
                  <TextInput style={styles.input} placeholder="Fuel %" keyboardType="numeric" value={newForm.fuel_level} onChangeText={t => setNewForm(p => ({ ...p, fuel_level: t }))} />
                </InputGroup>
              </View>
              <InputGroup icon={<Calendar size={16} color="#6b7280" />}>
                <TextInput style={styles.input} placeholder="Scheduled Date (YYYY-MM-DD)" value={newForm.scheduled_date} onChangeText={t => setNewForm(p => ({ ...p, scheduled_date: t }))} />
              </InputGroup>
              <TouchableOpacity style={styles.submitBtn} onPress={handleCreate}>
                <Text style={styles.submitText}>Create Work Order</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Detail Modal */}
      <Modal visible={showDetailModal} animationType="slide">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <View style={styles.detailHeader}>
            <TouchableOpacity onPress={() => setShowDetailModal(false)}>
              <ChevronLeft size={24} color="#111827" />
            </TouchableOpacity>
            <Text style={styles.detailTitle}>Work Order Details</Text>
            <View style={{ width: 24 }} />
          </View>
          {selectedAppt && (
            <ScrollView style={styles.detailBody}>
              <View style={styles.workflowContainer}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={styles.workflowRow}>
                    {WORKFLOW_STAGES.map((stage, idx) => {
                      const currentIdx = getStageIndex(selectedAppt.status);
                      const isActive = idx <= currentIdx;
                      const isCurrent = idx === currentIdx;
                      return (
                        <View key={stage.key} style={styles.workflowStep}>
                          <View style={[styles.workflowDot, isActive && styles.workflowDotActive, isCurrent && styles.workflowDotCurrent]}>
                            <Text style={[styles.workflowDotText, isActive && styles.workflowDotTextActive]}>{idx + 1}</Text>
                          </View>
                          <Text style={[styles.workflowLabel, isActive && styles.workflowLabelActive]}>{stage.label}</Text>
                          {idx < WORKFLOW_STAGES.length - 1 && (
                            <View style={[styles.workflowLine, idx < currentIdx && styles.workflowLineActive]} />
                          )}
                        </View>
                      );
                    })}
                  </View>
                </ScrollView>
              </View>

              <View style={styles.detailSection}>
                <Text style={styles.detailSectionTitle}>Vehicle Information</Text>
                <InfoRow label="Plate" value={selectedAppt.vehicle_plate || '-'} />
                <InfoRow label="Mileage" value={`${selectedAppt.mileage || '-'} km`} />
                <InfoRow label="Fuel Level" value={`${selectedAppt.fuel_level || '-'}%`} />
              </View>

              <View style={styles.detailSection}>
                <Text style={styles.detailSectionTitle}>Customer</Text>
                <InfoRow label="Name" value={selectedAppt.customer_name || '-'} />
                <InfoRow label="Phone" value={selectedAppt.customer_phone || '-'} />
              </View>

              <View style={styles.detailSection}>
                <Text style={styles.detailSectionTitle}>Service Notes</Text>
                <Text style={styles.notesText}>{selectedAppt.description || 'No notes added.'}</Text>
              </View>

              <View style={styles.detailSection}>
                <Text style={styles.detailSectionTitle}>Services</Text>
                <View style={styles.addRow}>
                  <TextInput style={[styles.input, { flex: 2 }]} placeholder="Service name" value={serviceForm.name} onChangeText={t => setServiceForm(p => ({ ...p, name: t }))} />
                  <TextInput style={[styles.input, { flex: 1 }]} placeholder="Cost" keyboardType="decimal-pad" value={serviceForm.cost} onChangeText={t => setServiceForm(p => ({ ...p, cost: t }))} />
                  <TouchableOpacity style={styles.addBtn} onPress={handleAddService}><Plus size={18} color="#fff" /></TouchableOpacity>
                </View>
                {selectedAppt.services?.map((s: any, i: number) => (
                  <View key={i} style={styles.listItem}>
                    <Text style={styles.listItemText}>{s.name}</Text>
                    <Text style={styles.listItemValue}>KES {s.cost?.toLocaleString()}</Text>
                  </View>
                )) || <Text style={styles.emptyList}>No services added</Text>}
              </View>

              <View style={styles.detailSection}>
                <Text style={styles.detailSectionTitle}>Parts Used</Text>
                <View style={styles.addRow}>
                  <TextInput style={[styles.input, { flex: 2 }]} placeholder="Part name" value={partForm.name} onChangeText={t => setPartForm(p => ({ ...p, name: t }))} />
                  <TextInput style={[styles.input, { flex: 0.7 }]} placeholder="Qty" keyboardType="numeric" value={partForm.quantity} onChangeText={t => setPartForm(p => ({ ...p, quantity: t }))} />
                  <TextInput style={[styles.input, { flex: 1 }]} placeholder="Cost" keyboardType="decimal-pad" value={partForm.unit_cost} onChangeText={t => setPartForm(p => ({ ...p, unit_cost: t }))} />
                  <TouchableOpacity style={styles.addBtn} onPress={handleAddPart}><Plus size={18} color="#fff" /></TouchableOpacity>
                </View>
                {selectedAppt.parts?.map((p: any, i: number) => (
                  <View key={i} style={styles.listItem}>
                    <Text style={styles.listItemText}>{p.name} x{p.quantity}</Text>
                    <Text style={styles.listItemValue}>KES {((p.quantity || 0) * (p.unit_cost || 0)).toLocaleString()}</Text>
                  </View>
                )) || <Text style={styles.emptyList}>No parts added</Text>}
              </View>

              <View style={styles.detailSection}>
                <Text style={styles.detailSectionTitle}>Cost Summary</Text>
                <CostRow label="Services" value={selectedAppt.services_total || 0} />
                <CostRow label="Parts" value={selectedAppt.parts_total || 0} />
                <CostRow label="Labor" value={(selectedAppt.labor_hours || 2) * (selectedAppt.labor_rate || 1500)} />
                <View style={styles.costDivider} />
                <CostRow label="Subtotal" value={selectedAppt.subtotal || 0} bold />
                <CostRow label="VAT (16%)" value={selectedAppt.vat || 0} />
                <CostRow label="TOTAL" value={selectedAppt.total || 0} bold total />
              </View>

              <View style={styles.detailSection}>
                <Text style={styles.detailSectionTitle}>Photos</Text>
                <View style={styles.photoGrid}>
                  {(selectedAppt.photos || []).map((photo: string, i: number) => (
                    <Image key={i} source={{ uri: photo }} style={styles.photoThumb} />
                  ))}
                  <TouchableOpacity style={styles.photoAdd}>
                    <Camera size={20} color="#9ca3af" />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.detailActions}>
                <TouchableOpacity style={[styles.actionBtn, styles.actionBtnSecondary]} onPress={() => handleAdvance(selectedAppt, 'prev')}>
                  <ChevronLeft size={18} color="#6b7280" />
                  <Text style={styles.actionBtnSecondaryText}>Step Back</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.actionBtn, styles.actionBtnPrimary]} onPress={() => handleAdvance(selectedAppt, 'next')}>
                  <Text style={styles.actionBtnPrimaryText}>Advance Stage</Text>
                  <ChevronRightIcon size={18} color="#fff" />
                </TouchableOpacity>
              </View>
              <TouchableOpacity style={styles.invoiceBtn} onPress={() => handleGenerateInvoice(selectedAppt)}>
                <FileText size={18} color="#fff" />
                <Text style={styles.invoiceBtnText}>Generate Invoice</Text>
              </TouchableOpacity>
              <View style={{ height: 40 }} />
            </ScrollView>
          )}
        </KeyboardAvoidingView>
      </Modal>

      {/* Invoice Modal */}
      <Modal visible={showInvoiceModal} animationType="slide" transparent>
        <View style={styles.invoiceOverlay}>
          <View style={styles.invoiceContent}>
            <View style={styles.invoiceHeader}>
              <Text style={styles.invoiceTitle}>INVOICE</Text>
              <TouchableOpacity onPress={() => setShowInvoiceModal(false)}><X size={24} color="#6b7280" /></TouchableOpacity>
            </View>
            {invoiceData && (
              <ScrollView style={styles.invoiceBody}>
                <View style={styles.invoiceMeta}>
                  <Text style={styles.invoiceId}>#{invoiceData.id?.slice(0, 8).toUpperCase()}</Text>
                  <Text style={styles.invoiceDate}>{new Date(invoiceData.created_at).toLocaleDateString()}</Text>
                </View>
                <View style={styles.invoiceSection}>
                  <Text style={styles.invoiceSectionTitle}>BILL TO</Text>
                  <Text style={styles.invoiceText}>{invoiceData.customer_name}</Text>
                  <Text style={styles.invoiceText}>{invoiceData.customer_phone}</Text>
                  <Text style={styles.invoiceText}>{invoiceData.vehicle_plate}</Text>
                </View>
                <View style={styles.invoiceSection}>
                  <Text style={styles.invoiceSectionTitle}>SERVICES</Text>
                  {invoiceData.services.map((s: any, i: number) => (
                    <View key={i} style={styles.invoiceLine}>
                      <Text style={styles.invoiceLineText}>{s.name}</Text>
                      <Text style={styles.invoiceLineValue}>KES {s.cost?.toLocaleString()}</Text>
                    </View>
                  ))}
                </View>
                <View style={styles.invoiceSection}>
                  <Text style={styles.invoiceSectionTitle}>PARTS</Text>
                  {invoiceData.parts.map((p: any, i: number) => (
                    <View key={i} style={styles.invoiceLine}>
                      <Text style={styles.invoiceLineText}>{p.name} x{p.quantity}</Text>
                      <Text style={styles.invoiceLineValue}>KES {((p.quantity || 0) * (p.unit_cost || 0)).toLocaleString()}</Text>
                    </View>
                  ))}
                </View>
                <View style={styles.invoiceSection}>
                  <Text style={styles.invoiceSectionTitle}>LABOR</Text>
                  <View style={styles.invoiceLine}>
                    <Text style={styles.invoiceLineText}>{invoiceData.labor_hours} hours @ KES {invoiceData.labor_rate}/hr</Text>
                    <Text style={styles.invoiceLineValue}>KES {invoiceData.labor_total?.toLocaleString()}</Text>
                  </View>
                </View>
                <View style={styles.invoiceDivider} />
                <View style={styles.invoiceLine}>
                  <Text style={styles.invoiceLineText}>Subtotal</Text>
                  <Text style={styles.invoiceLineValue}>KES {invoiceData.subtotal?.toLocaleString()}</Text>
                </View>
                <View style={styles.invoiceLine}>
                  <Text style={styles.invoiceLineText}>VAT (16%)</Text>
                  <Text style={styles.invoiceLineValue}>KES {invoiceData.vat?.toLocaleString()}</Text>
                </View>
                <View style={[styles.invoiceLine, styles.invoiceTotal]}>
                  <Text style={styles.invoiceTotalLabel}>TOTAL</Text>
                  <Text style={styles.invoiceTotalValue}>KES {invoiceData.total?.toLocaleString()}</Text>
                </View>
                <View style={styles.invoiceActions}>
                  <TouchableOpacity style={[styles.invoiceActionBtn, { backgroundColor: '#3b82f6' }]} onPress={handleShareInvoice}>
                    <Share2 size={18} color="#fff" />
                    <Text style={styles.invoiceActionText}>Share</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.invoiceActionBtn, { backgroundColor: '#22c55e' }]} onPress={() => Alert.alert('Print', 'Connect to printer to print invoice.')}>
                    <Printer size={18} color="#fff" />
                    <Text style={styles.invoiceActionText}>Print</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

function InputGroup({ children, icon, style }: any) {
  return (
    <View style={[styles.inputGroup, style]}>
      {icon}
      {children}
    </View>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

function CostRow({ label, value, bold, total }: { label: string; value: number; bold?: boolean; total?: boolean }) {
  return (
    <View style={styles.costRow}>
      <Text style={[styles.costLabel, bold && styles.bold, total && styles.totalLabel]}>{label}</Text>
      <Text style={[styles.costValue, bold && styles.bold, total && styles.totalValue]}>KES {value.toLocaleString()}</Text>
    </View>
  );
}

function StatPill({ label, value, color }: any) {
  return (
    <View style={styles.statPill}>
      <Text style={[styles.statPillValue, { color }]}>{value}</Text>
      <Text style={styles.statPillLabel}>{label}</Text>
    </View>
  );
}

function CarIcon({ status }: { status: string }) {
  const colors: Record<string, string> = {
    pending: '#f59e0b', in_progress: '#3b82f6', ready_for_pickup: '#22c55e',
    completed: '#6b7280', cancelled: '#ef4444',
  };
  return <Car size={18} color={colors[status] || '#6b7280'} />;
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { color: string; label: string }> = {
    pending: { color: '#f59e0b', label: 'Pending' },
    in_progress: { color: '#3b82f6', label: 'In Progress' },
    ready_for_pickup: { color: '#22c55e', label: 'Ready' },
    completed: { color: '#6b7280', label: 'Completed' },
    cancelled: { color: '#ef4444', label: 'Cancelled' },
  };
  const c = config[status] || { color: '#6b7280', label: status };
  return (
    <View style={[styles.statusBadge, { backgroundColor: c.color + '15' }]}>
      <Text style={[styles.statusText, { color: c.color }]}>{c.label}</Text>
    </View>
  );
}

function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    pending: '#f59e0b', in_progress: '#3b82f6', ready_for_pickup: '#22c55e',
    completed: '#6b7280', cancelled: '#ef4444',
  };
  return colors[status] || '#6b7280';
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { backgroundColor: '#fff', padding: 20, paddingTop: 60, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
  headerTitle: { fontSize: 24, fontWeight: '800', color: '#111827', marginBottom: 16 },
  filterRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  filterBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#f3f4f6' },
  filterBtnActive: { backgroundColor: '#3b82f6' },
  filterText: { fontSize: 13, fontWeight: '600', color: '#6b7280' },
  filterTextActive: { color: '#fff' },
  searchBox: { backgroundColor: '#f3f4f6', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10 },
  searchInput: { fontSize: 14, color: '#111827' },
  statsRow: { flexDirection: 'row', padding: 16, gap: 8 },
  statPill: { flex: 1, backgroundColor: '#fff', borderRadius: 12, padding: 12, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
  statPillValue: { fontSize: 20, fontWeight: '800' },
  statPillLabel: { fontSize: 11, color: '#6b7280', marginTop: 2 },
  list: { flex: 1, padding: 16 },
  empty: { alignItems: 'center', padding: 40 },
  emptyText: { fontSize: 14, color: '#9ca3af', marginTop: 12 },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  cardLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  cardIcon: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  plate: { fontSize: 15, fontWeight: '700', color: '#111827' },
  service: { fontSize: 13, color: '#6b7280', marginTop: 2 },
  customer: { fontSize: 12, color: '#9ca3af', marginTop: 2 },
  cardBottom: { flexDirection: 'row', alignItems: 'center', marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#f3f4f6' },
  date: { fontSize: 12, color: '#9ca3af', marginRight: 16 },
  mileage: { fontSize: 12, color: '#9ca3af', flex: 1 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  statusText: { fontSize: 11, fontWeight: '600' },
  fab: { position: 'absolute', right: 20, bottom: 20, width: 56, height: 56, borderRadius: 28, backgroundColor: '#3b82f6', justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 5 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '90%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },
  modalBody: { padding: 20 },
  inputGroup: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f3f4f6', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, marginBottom: 12 },
  input: { flex: 1, fontSize: 14, color: '#111827', marginLeft: 10 },
  textArea: { height: 80, textAlignVertical: 'top' },
  rowInputs: { flexDirection: 'row', gap: 10 },
  half: { flex: 1 },
  submitBtn: { backgroundColor: '#3b82f6', borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 8 },
  submitText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  detailHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, paddingTop: 60, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  detailTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },
  detailBody: { flex: 1, backgroundColor: '#f9fafb' },
  workflowContainer: { backgroundColor: '#fff', paddingVertical: 16 },
  workflowRow: { flexDirection: 'row', paddingHorizontal: 16 },
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
  detailSection: { backgroundColor: '#fff', marginTop: 12, padding: 16, borderRadius: 16 },
  detailSectionTitle: { fontSize: 14, fontWeight: '700', color: '#111827', marginBottom: 10 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  infoLabel: { fontSize: 13, color: '#6b7280' },
  infoValue: { fontSize: 13, fontWeight: '600', color: '#111827' },
  notesText: { fontSize: 14, color: '#374151', lineHeight: 20 },
  addRow: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  addBtn: { width: 40, height: 40, borderRadius: 10, backgroundColor: '#3b82f6', justifyContent: 'center', alignItems: 'center' },
  listItem: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  listItemText: { fontSize: 14, color: '#374151' },
  listItemValue: { fontSize: 14, fontWeight: '600', color: '#111827' },
  emptyList: { fontSize: 13, color: '#9ca3af', textAlign: 'center', paddingVertical: 16 },
  costRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  costLabel: { fontSize: 13, color: '#6b7280' },
  costValue: { fontSize: 13, fontWeight: '600', color: '#111827' },
  bold: { fontWeight: '700' },
  totalLabel: { fontSize: 15, color: '#111827' },
  totalValue: { fontSize: 15, fontWeight: '800', color: '#3b82f6' },
  costDivider: { height: 1, backgroundColor: '#e5e7eb', marginVertical: 8 },
  photoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  photoThumb: { width: 80, height: 80, borderRadius: 10 },
  photoAdd: { width: 80, height: 80, borderRadius: 10, backgroundColor: '#f3f4f6', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#e5e7eb', borderStyle: 'dashed' },
  detailActions: { flexDirection: 'row', gap: 12, padding: 16 },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 14, borderRadius: 12, gap: 8 },
  actionBtnPrimary: { backgroundColor: '#3b82f6' },
  actionBtnSecondary: { backgroundColor: '#f3f4f6' },
  actionBtnPrimaryText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  actionBtnSecondaryText: { color: '#6b7280', fontWeight: '600', fontSize: 14 },
  invoiceBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#8b5cf6', marginHorizontal: 16, padding: 14, borderRadius: 12, gap: 8 },
  invoiceBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  invoiceOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', padding: 20 },
  invoiceContent: { backgroundColor: '#fff', borderRadius: 20, maxHeight: '85%', overflow: 'hidden' },
  invoiceHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  invoiceTitle: { fontSize: 20, fontWeight: '800', color: '#111827' },
  invoiceBody: { padding: 20 },
  invoiceMeta: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  invoiceId: { fontSize: 14, fontWeight: '700', color: '#3b82f6' },
  invoiceDate: { fontSize: 13, color: '#9ca3af' },
  invoiceSection: { marginBottom: 16 },
  invoiceSectionTitle: { fontSize: 11, fontWeight: '700', color: '#9ca3af', letterSpacing: 1, marginBottom: 8 },
  invoiceText: { fontSize: 14, color: '#374151', marginBottom: 2 },
  invoiceLine: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  invoiceLineText: { fontSize: 14, color: '#374151' },
  invoiceLineValue: { fontSize: 14, fontWeight: '600', color: '#111827' },
  invoiceDivider: { height: 1, backgroundColor: '#e5e7eb', marginVertical: 12 },
  invoiceTotal: { paddingTop: 8, borderTopWidth: 2, borderTopColor: '#e5e7eb', marginTop: 8 },
  invoiceTotalLabel: { fontSize: 16, fontWeight: '800', color: '#111827' },
  invoiceTotalValue: { fontSize: 18, fontWeight: '800', color: '#3b82f6' },
  invoiceActions: { flexDirection: 'row', gap: 12, marginTop: 20 },
  invoiceActionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 14, borderRadius: 12, gap: 8 },
  invoiceActionText: { color: '#fff', fontWeight: '700', fontSize: 14 },
});
