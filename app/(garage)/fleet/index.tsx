// @ts-nocheck
import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  Modal,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  Truck,
  Plus,
  Search,
  Calendar,
  Wrench,
  CheckCircle,
  AlertTriangle,
  Clock,
  User,
  Car,
  ChevronRight,
  ArrowLeft,
  Gauge,
  Fuel,
  MapPin,
  FileText,
  BarChart3,
  QrCode,
  Phone,
  Mail,
  Shield,
  TrendingUp,
  TrendingDown,
  X,
  Edit3,
  Trash2,
} from 'lucide-react-native';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { supabase } from '@/lib/supabase';

/* ─────────────────────────── Types ─────────────────────────── */

type ContractStatus = 'active' | 'suspended' | 'expired' | 'terminated';
type MaintenanceType = 'scheduled' | 'breakdown' | 'inspection' | 'roadworthy';
type MaintenanceStatus = 'pending' | 'in_progress' | 'completed' | 'overdue';

interface FleetContract {
  id: string;
  garage_id: string;
  fleet_owner_id: string;
  company_name: string;
  contact_person: string;
  contact_phone: string;
  contact_email: string | null;
  contract_start: string;
  contract_end: string;
  monthly_fee: number;
  payment_terms: string;
  status: ContractStatus;
  vehicle_count: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

interface FleetVehicle {
  id: string;
  contract_id: string;
  vehicle_id: string;
  driver_id: string | null;
  assigned_at: string;
  mileage_at_assignment: number | null;
  status: 'active' | 'maintenance' | 'retired';
  vehicle?: {
    make: string;
    model: string;
    year: number;
    plate_number: string;
    color: string;
  };
  driver?: {
    full_name: string;
    phone: string;
  };
}

interface MaintenanceRecord {
  id: string;
  contract_id: string;
  fleet_vehicle_id: string;
  maintenance_type: MaintenanceType;
  status: MaintenanceStatus;
  scheduled_date: string;
  completed_date: string | null;
  description: string;
  cost: number | null;
  mechanic_notes: string | null;
  vehicle?: {
    plate_number: string;
    make: string;
    model: string;
  };
}

/* ─────────────────────────── Status Config ─────────────────────────── */

const CONTRACT_STATUS: Record<ContractStatus, { color: string; label: string }> = {
  active: { color: '#22c55e', label: 'Active' },
  suspended: { color: '#f59e0b', label: 'Suspended' },
  expired: { color: '#ef4444', label: 'Expired' },
  terminated: { color: '#6b7280', label: 'Terminated' },
};

const MAINT_STATUS: Record<MaintenanceStatus, { color: string; label: string }> = {
  pending: { color: '#3b82f6', label: 'Pending' },
  in_progress: { color: '#f59e0b', label: 'In Progress' },
  completed: { color: '#22c55e', label: 'Completed' },
  overdue: { color: '#ef4444', label: 'Overdue' },
};

/* ─────────────────────────── Main Screen ─────────────────────────── */

export default function FleetScreen() {
  const router = useRouter();
  const { user } = useAuthStore();

  const [contracts, setContracts] = useState<FleetContract[]>([]);
  const [fleetVehicles, setFleetVehicles] = useState<FleetVehicle[]>([]);
  const [maintenanceRecords, setMaintenanceRecords] = useState<MaintenanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'contracts' | 'vehicles' | 'maintenance'>('contracts');
  const [searchQuery, setSearchQuery] = useState('');

  const [showContractModal, setShowContractModal] = useState(false);
  const [showVehicleModal, setShowVehicleModal] = useState(false);
  const [showMaintenanceModal, setShowMaintenanceModal] = useState(false);
  const [selectedContract, setSelectedContract] = useState<FleetContract | null>(null);

  /* ── Form States ── */
  const [contractForm, setContractForm] = useState({
    company_name: '',
    contact_person: '',
    contact_phone: '',
    contact_email: '',
    contract_start: '',
    contract_end: '',
    monthly_fee: '',
    payment_terms: 'Net 30',
    notes: '',
  });

  const [vehicleForm, setVehicleForm] = useState({
    plate_number: '',
    driver_phone: '',
    mileage: '',
  });

  const [maintenanceForm, setMaintenanceForm] = useState({
    fleet_vehicle_id: '',
    maintenance_type: 'scheduled' as MaintenanceType,
    scheduled_date: '',
    description: '',
    cost: '',
  });

  /* ── Load Data ── */
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const garageId = await getGarageId();
      if (!garageId) { setLoading(false); return; }

      const [contractsRes, vehiclesRes, maintenanceRes] = await Promise.all([
        supabase
          .from('garage_fleet_contracts')
          .select('*')
          .eq('garage_id', garageId)
          .order('created_at', { ascending: false }),
        supabase
          .from('garage_fleet_vehicles')
          .select(`
            *,
            vehicle:vehicle_id(make, model, year, plate_number, color),
            driver:driver_id(full_name, phone)
          `)
          .eq('garage_id', garageId)
          .order('assigned_at', { ascending: false }),
        supabase
          .from('garage_fleet_maintenance')
          .select(`
            *,
            vehicle:fleet_vehicle_id(vehicle:vehicle_id(plate_number, make, model))
          `)
          .eq('garage_id', garageId)
          .order('scheduled_date', { ascending: true }),
      ]);

      if (contractsRes.error) throw contractsRes.error;
      if (vehiclesRes.error) throw vehiclesRes.error;
      if (maintenanceRes.error) throw maintenanceRes.error;

      setContracts(contractsRes.data || []);
      setFleetVehicles(vehiclesRes.data || []);
      setMaintenanceRecords(maintenanceRes.data || []);
    } catch (err: any) {
      console.error('Fleet load error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const getGarageId = async (): Promise<string | null> => {
    const { data } = await supabase.from('garages').select('id').eq('owner_id', user?.id).single();
    return data?.id || null;
  };

  React.useEffect(() => { loadData(); }, [loadData]);

  /* ── Stats ── */
  const stats = useMemo(() => {
    const activeContracts = contracts.filter((c) => c.status === 'active');
    const totalVehicles = fleetVehicles.filter((v) => v.status === 'active').length;
    const overdueMaint = maintenanceRecords.filter((m) => m.status === 'overdue').length;
    const monthlyRevenue = activeContracts.reduce((sum, c) => sum + c.monthly_fee, 0);
    return { activeContracts: activeContracts.length, totalVehicles, overdueMaint, monthlyRevenue };
  }, [contracts, fleetVehicles, maintenanceRecords]);

  /* ── Handlers ── */
  const handleSaveContract = useCallback(async () => {
    if (!contractForm.company_name || !contractForm.contact_phone) {
      Alert.alert('Required', 'Company name and phone are required');
      return;
    }
    try {
      const garageId = await getGarageId();
      if (!garageId) return;
      const { error } = await supabase.from('garage_fleet_contracts').insert({
        garage_id: garageId,
        company_name: contractForm.company_name.trim(),
        contact_person: contractForm.contact_person.trim() || null,
        contact_phone: contractForm.contact_phone.trim(),
        contact_email: contractForm.contact_email || null,
        contract_start: contractForm.contract_start || null,
        contract_end: contractForm.contract_end || null,
        monthly_fee: parseFloat(contractForm.monthly_fee) || 0,
        payment_terms: contractForm.payment_terms,
        status: 'active',
        vehicle_count: 0,
        notes: contractForm.notes || null,
      });
      if (error) throw error;
      setShowContractModal(false);
      resetContractForm();
      loadData();
    } catch (err: any) { Alert.alert('Error', err.message); }
  }, [contractForm, loadData]);

  const handleAddFleetVehicle = useCallback(async () => {
    if (!selectedContract || !vehicleForm.plate_number) {
      Alert.alert('Required', 'Select a contract and enter a plate number');
      return;
    }
    try {
      // Look up vehicle by plate
      const { data: vehicleData } = await supabase
        .from('garage_fleet_vehicles')
        .select('id, owner_id')
        .eq('plate_number', vehicleForm.plate_number.trim().toUpperCase())
        .single();

      // Look up driver by phone
      let driverId = null;
      if (vehicleForm.driver_phone) {
        const { data: driverData } = await supabase
          .from('drivers')
          .select('user_id')
          .eq('phone', vehicleForm.driver_phone.trim())
          .single();
        driverId = driverData?.user_id || null;
      }

      const garageId = await getGarageId();
      const { error } = await supabase.from('garage_fleet_vehicles').insert({
        contract_id: selectedContract.id,
        garage_id: garageId,
        vehicle_id: vehicleData?.id || null,
        driver_id: driverId,
        mileage_at_assignment: vehicleForm.mileage ? parseInt(vehicleForm.mileage) : null,
        status: 'active',
      });
      if (error) throw error;

      // Update contract vehicle count
      await supabase.rpc('increment_fleet_vehicle_count', { contract_uuid: selectedContract.id });

      setShowVehicleModal(false);
      resetVehicleForm();
      loadData();
    } catch (err: any) { Alert.alert('Error', err.message); }
  }, [vehicleForm, selectedContract, loadData]);

  const handleAddMaintenance = useCallback(async () => {
    if (!maintenanceForm.fleet_vehicle_id || !maintenanceForm.scheduled_date) {
      Alert.alert('Required', 'Vehicle and scheduled date are required');
      return;
    }
    try {
      const garageId = await getGarageId();
      const { error } = await supabase.from('garage_fleet_maintenance').insert({
        garage_id: garageId,
        contract_id: selectedContract?.id || null,
        fleet_vehicle_id: maintenanceForm.fleet_vehicle_id,
        maintenance_type: maintenanceForm.maintenance_type,
        status: 'pending',
        scheduled_date: maintenanceForm.scheduled_date,
        description: maintenanceForm.description || '',
        cost: maintenanceForm.cost ? parseFloat(maintenanceForm.cost) : null,
      });
      if (error) throw error;
      setShowMaintenanceModal(false);
      resetMaintenanceForm();
      loadData();
    } catch (err: any) { Alert.alert('Error', err.message); }
  }, [maintenanceForm, selectedContract, loadData]);

  const handleUpdateMaintStatus = useCallback(async (id: string, status: MaintenanceStatus) => {
    try {
      const updates: any = { status };
      if (status === 'completed') updates.completed_date = new Date().toISOString();
      const { error } = await supabase.from('garage_fleet_maintenance').update(updates).eq('id', id);
      if (error) throw error;
      loadData();
    } catch (err: any) { Alert.alert('Error', err.message); }
  }, [loadData]);

  const resetContractForm = () =>
    setContractForm({ company_name: '', contact_person: '', contact_phone: '', contact_email: '', contract_start: '', contract_end: '', monthly_fee: '', payment_terms: 'Net 30', notes: '' });
  const resetVehicleForm = () => setVehicleForm({ plate_number: '', driver_phone: '', mileage: '' });
  const resetMaintenanceForm = () =>
    setMaintenanceForm({ fleet_vehicle_id: '', maintenance_type: 'scheduled', scheduled_date: '', description: '', cost: '' });

  /* ── Render ── */
  const renderContractCard = ({ item }: { item: FleetContract }) => {
    const status = CONTRACT_STATUS[item.status];
    const isExpiringSoon = item.contract_end && new Date(item.contract_end) < new Date(Date.now() + 30 * 86400000);
    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => { setSelectedContract(item); setActiveTab('vehicles'); }}
      >
        <View style={styles.cardHeader}>
          <View style={styles.cardTitleRow}>
            <Shield size={18} color="#3b82f6" />
            <Text style={styles.cardTitle} numberOfLines={1}>{item.company_name}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: status.color + '20' }]}>
            <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
          </View>
        </View>
        <View style={styles.cardBody}>
          <View style={styles.infoRow}><User size={14} color="#6b7280" /><Text style={styles.infoText}>{item.contact_person || '—'}</Text></View>
          <View style={styles.infoRow}><Phone size={14} color="#6b7280" /><Text style={styles.infoText}>{item.contact_phone}</Text></View>
          <View style={styles.infoRow}><Calendar size={14} color="#6b7280" /><Text style={styles.infoText}>{item.contract_start || '—'} → {item.contract_end || 'Ongoing'}</Text></View>
          <View style={styles.infoRow}><TrendingUp size={14} color="#6b7280" /><Text style={styles.infoText}>KES {item.monthly_fee.toLocaleString()}/mo · {item.vehicle_count} vehicles</Text></View>
        </View>
        {isExpiringSoon && item.status === 'active' && (
          <View style={styles.alertBanner}>
            <AlertTriangle size={14} color="#f59e0b" />
            <Text style={styles.alertText}>Expiring soon</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderVehicleCard = ({ item }: { item: FleetVehicle }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.cardTitleRow}>
          <Car size={18} color="#3b82f6" />
          <Text style={styles.cardTitle}>
            {item.vehicle ? `${item.vehicle.make} ${item.vehicle.model}` : 'Unknown Vehicle'}
          </Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: item.status === 'active' ? '#dcfce7' : '#fef3c7' }]}>
          <Text style={[styles.statusText, { color: item.status === 'active' ? '#16a34a' : '#d97706' }]}>{item.status}</Text>
        </View>
      </View>
      <View style={styles.cardBody}>
        <View style={styles.infoRow}><MapPin size={14} color="#6b7280" /><Text style={styles.infoText}>{item.vehicle?.plate_number || 'No plate'}</Text></View>
        <View style={styles.infoRow}><User size={14} color="#6b7280" /><Text style={styles.infoText}>{item.driver?.full_name || 'No driver assigned'}</Text></View>
        <View style={styles.infoRow}><Gauge size={14} color="#6b7280" /><Text style={styles.infoText}>Assigned: {new Date(item.assigned_at).toLocaleDateString()}</Text></View>
      </View>
    </View>
  );

  const renderMaintenanceCard = ({ item }: { item: MaintenanceRecord }) => {
    const status = MAINT_STATUS[item.status];
    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.cardTitleRow}>
            <Wrench size={18} color={status.color} />
            <Text style={styles.cardTitle}>{item.maintenance_type.replace('_', ' ').toUpperCase()}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: status.color + '20' }]}>
            <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
          </View>
        </View>
        <View style={styles.cardBody}>
          <View style={styles.infoRow}><Car size={14} color="#6b7280" /><Text style={styles.infoText}>{item.vehicle?.plate_number || '—'}</Text></View>
          <View style={styles.infoRow}><Calendar size={14} color="#6b7280" /><Text style={styles.infoText}>{new Date(item.scheduled_date).toLocaleDateString()}</Text></View>
          <View style={styles.infoRow}><FileText size={14} color="#6b7280" /><Text style={styles.infoText} numberOfLines={2}>{item.description}</Text></View>
          {item.cost && (
            <View style={styles.infoRow}><TrendingUp size={14} color="#6b7280" /><Text style={styles.infoText}>KES {item.cost.toLocaleString()}</Text></View>
          )}
        </View>
        {item.status === 'pending' && (
          <View style={styles.actionRow}>
            <TouchableOpacity style={[styles.actionBtnSmall, { backgroundColor: '#f3f4f6' }]} onPress={() => handleUpdateMaintStatus(item.id, 'in_progress')}>
              <Text style={styles.actionBtnSmallText}>Start</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionBtnSmall, { backgroundColor: '#dcfce7' }]} onPress={() => handleUpdateMaintStatus(item.id, 'completed')}>
              <Text style={[styles.actionBtnSmallText, { color: '#16a34a' }]}>Complete</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  if (loading && contracts.length === 0) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.isLoadingText}>Loading fleet data...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => router.back()}><ArrowLeft size={24} color="#1f2937" /></TouchableOpacity>
          <Text style={styles.headerTitle}>Fleet Management</Text>
          <TouchableOpacity onPress={() => {
            if (activeTab === 'contracts') setShowContractModal(true);
            else if (activeTab === 'vehicles') setShowVehicleModal(true);
            else setShowMaintenanceModal(true);
          }}>
            <View style={styles.addButton}><Plus size={20} color="#fff" /></View>
          </TouchableOpacity>
        </View>

        {/* Search */}
        <View style={styles.searchBox}>
          <Search size={18} color="#9ca3af" />
          <TextInput style={styles.searchInput} placeholder="Search..." placeholderTextColor="#9ca3af" value={searchQuery} onChangeText={setSearchQuery} />
          {searchQuery !== '' && <TouchableOpacity onPress={() => setSearchQuery('')}><X size={18} color="#9ca3af" /></TouchableOpacity>}
        </View>

        {/* Tabs */}
        <View style={styles.tabRow}>
          {(['contracts', 'vehicles', 'maintenance'] as const).map((tab) => (
            <TouchableOpacity key={tab} style={[styles.tab, activeTab === tab && styles.tabActive]} onPress={() => setActiveTab(tab)}>
              <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                {tab === 'contracts' ? 'Contracts' : tab === 'vehicles' ? 'Vehicles' : 'Maintenance'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        <View style={styles.statBox}><Shield size={20} color="#3b82f6" /><Text style={styles.statNumber}>{stats.activeContracts}</Text><Text style={styles.statLabel}>Active Contracts</Text></View>
        <View style={styles.statBox}><Truck size={20} color="#22c55e" /><Text style={styles.statNumber}>{stats.totalVehicles}</Text><Text style={styles.statLabel}>Fleet Vehicles</Text></View>
        <View style={styles.statBox}><AlertTriangle size={20} color="#ef4444" /><Text style={[styles.statNumber, { color: '#ef4444' }]}>{stats.overdueMaint}</Text><Text style={styles.statLabel}>Overdue</Text></View>
        <View style={styles.statBox}><TrendingUp size={20} color="#8b5cf6" /><Text style={styles.statNumber}>KES {stats.monthlyRevenue.toLocaleString()}</Text><Text style={styles.statLabel}>Monthly Revenue</Text></View>
      </View>

      {/* List */}
      <FlatList
        data={activeTab === 'contracts' ? contracts : activeTab === 'vehicles' ? fleetVehicles : maintenanceRecords}
        keyExtractor={(i) => i.id}
        renderItem={activeTab === 'contracts' ? renderContractCard : activeTab === 'vehicles' ? renderVehicleCard : renderMaintenanceCard}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadData(); }} tintColor="#3b82f6" />}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Truck size={48} color="#d1d5db" />
            <Text style={styles.emptyTitle}>
              {activeTab === 'contracts' ? 'No fleet contracts yet' : activeTab === 'vehicles' ? 'No fleet vehicles' : 'No maintenance records'}
            </Text>
            <TouchableOpacity style={styles.emptyButton} onPress={() => {
              if (activeTab === 'contracts') setShowContractModal(true);
              else if (activeTab === 'vehicles') setShowVehicleModal(true);
              else setShowMaintenanceModal(true);
            }}>
              <Plus size={16} color="#fff" />
              <Text style={styles.emptyButtonText}>Add {activeTab === 'contracts' ? 'Contract' : activeTab === 'vehicles' ? 'Vehicle' : 'Maintenance'}</Text>
            </TouchableOpacity>
          </View>
        }
      />

      {/* ── Add Contract Modal ── */}
      <Modal visible={showContractModal} animationType="slide" presentationStyle="pageSheet">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>New Fleet Contract</Text>
            <TouchableOpacity onPress={() => { setShowContractModal(false); resetContractForm(); }}><X size={24} color="#6b7280" /></TouchableOpacity>
          </View>
          <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
            <Text style={styles.sectionLabel}>Company Info</Text>
            <View style={styles.inputGroup}><Shield size={16} color="#6b7280" /><TextInput style={styles.input} placeholder="Company Name" value={contractForm.company_name} onChangeText={(t) => setContractForm((p) => ({ ...p, company_name: t }))} /></View>
            <View style={styles.inputGroup}><User size={16} color="#6b7280" /><TextInput style={styles.input} placeholder="Contact Person" value={contractForm.contact_person} onChangeText={(t) => setContractForm((p) => ({ ...p, contact_person: t }))} /></View>
            <View style={styles.inputGroup}><Phone size={16} color="#6b7280" /><TextInput style={styles.input} placeholder="Phone" keyboardType="phone-pad" value={contractForm.contact_phone} onChangeText={(t) => setContractForm((p) => ({ ...p, contact_phone: t }))} /></View>
            <View style={styles.inputGroup}><Mail size={16} color="#6b7280" /><TextInput style={styles.input} placeholder="Email" keyboardType="email-address" value={contractForm.contact_email} onChangeText={(t) => setContractForm((p) => ({ ...p, contact_email: t }))} /></View>

            <Text style={[styles.sectionLabel, { marginTop: 16 }]}>Contract Terms</Text>
            <View style={styles.rowInputs}>
              <View style={[styles.inputGroup, styles.halfInput]}><Calendar size={16} color="#6b7280" /><TextInput style={styles.input} placeholder="Start Date" value={contractForm.contract_start} onChangeText={(t) => setContractForm((p) => ({ ...p, contract_start: t }))} /></View>
              <View style={[styles.inputGroup, styles.halfInput]}><Calendar size={16} color="#6b7280" /><TextInput style={styles.input} placeholder="End Date" value={contractForm.contract_end} onChangeText={(t) => setContractForm((p) => ({ ...p, contract_end: t }))} /></View>
            </View>
            <View style={styles.rowInputs}>
              <View style={[styles.inputGroup, styles.halfInput]}><TrendingUp size={16} color="#6b7280" /><TextInput style={styles.input} placeholder="Monthly Fee (KES)" keyboardType="decimal-pad" value={contractForm.monthly_fee} onChangeText={(t) => setContractForm((p) => ({ ...p, monthly_fee: t }))} /></View>
              <View style={[styles.inputGroup, styles.halfInput]}><FileText size={16} color="#6b7280" /><TextInput style={styles.input} placeholder="Payment Terms" value={contractForm.payment_terms} onChangeText={(t) => setContractForm((p) => ({ ...p, payment_terms: t }))} /></View>
            </View>
            <View style={[styles.inputGroup, styles.textArea]}><FileText size={16} color="#6b7280" /><TextInput style={[styles.input, { height: 80 }]} placeholder="Notes" multiline textAlignVertical="top" value={contractForm.notes} onChangeText={(t) => setContractForm((p) => ({ ...p, notes: t }))} /></View>
          </ScrollView>
          <View style={styles.modalFooter}>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => { setShowContractModal(false); resetContractForm(); }}><Text style={styles.cancelBtnText}>Cancel</Text></TouchableOpacity>
            <TouchableOpacity style={styles.saveBtn} onPress={handleSaveContract}><Text style={styles.saveBtnText}>Create Contract</Text></TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ── Add Vehicle Modal ── */}
      <Modal visible={showVehicleModal} animationType="slide" presentationStyle="pageSheet">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Add Fleet Vehicle</Text>
            <TouchableOpacity onPress={() => { setShowVehicleModal(false); resetVehicleForm(); }}><X size={24} color="#6b7280" /></TouchableOpacity>
          </View>
          <ScrollView style={styles.modalBody}>
            <Text style={styles.sectionLabel}>Contract</Text>
            <View style={styles.contractPicker}>
              {contracts.filter((c: any) => c.status === 'active').map((c) => (
                <TouchableOpacity key={c.id} style={[styles.contractChip, selectedContract?.id === c.id && styles.contractChipActive]} onPress={() => setSelectedContract(c)}>
                  <Text style={selectedContract?.id === c.id ? styles.contractChipTextActive : styles.contractChipText}>{c.company_name}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={[styles.sectionLabel, { marginTop: 16 }]}>Vehicle</Text>
            <View style={styles.inputGroup}><Car size={16} color="#6b7280" /><TextInput style={styles.input} placeholder="License Plate" autoCapitalize="characters" value={vehicleForm.plate_number} onChangeText={(t) => setVehicleForm((p) => ({ ...p, plate_number: t }))} /></View>
            <View style={styles.inputGroup}><User size={16} color="#6b7280" /><TextInput style={styles.input} placeholder="Driver Phone (optional)" keyboardType="phone-pad" value={vehicleForm.driver_phone} onChangeText={(t) => setVehicleForm((p) => ({ ...p, driver_phone: t }))} /></View>
            <View style={styles.inputGroup}><Gauge size={16} color="#6b7280" /><TextInput style={styles.input} placeholder="Current Mileage" keyboardType="numeric" value={vehicleForm.mileage} onChangeText={(t) => setVehicleForm((p) => ({ ...p, mileage: t }))} /></View>
          </ScrollView>
          <View style={styles.modalFooter}>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => { setShowVehicleModal(false); resetVehicleForm(); }}><Text style={styles.cancelBtnText}>Cancel</Text></TouchableOpacity>
            <TouchableOpacity style={styles.saveBtn} onPress={handleAddFleetVehicle}><Text style={styles.saveBtnText}>Add Vehicle</Text></TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ── Add Maintenance Modal ── */}
      <Modal visible={showMaintenanceModal} animationType="slide" presentationStyle="pageSheet">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Schedule Maintenance</Text>
            <TouchableOpacity onPress={() => { setShowMaintenanceModal(false); resetMaintenanceForm(); }}><X size={24} color="#6b7280" /></TouchableOpacity>
          </View>
          <ScrollView style={styles.modalBody}>
            <Text style={styles.sectionLabel}>Vehicle</Text>
            <View style={styles.contractPicker}>
              {fleetVehicles.filter((v: any) => v.status === 'active').map((v) => (
                <TouchableOpacity key={v.id} style={[styles.contractChip, maintenanceForm.fleet_vehicle_id === v.id && styles.contractChipActive]} onPress={() => setMaintenanceForm((p) => ({ ...p, fleet_vehicle_id: v.id }))}>
                  <Text style={maintenanceForm.fleet_vehicle_id === v.id ? styles.contractChipTextActive : styles.contractChipText}>{v.vehicle?.plate_number || 'Unknown'}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={[styles.sectionLabel, { marginTop: 16 }]}>Details</Text>
            <View style={styles.inputGroup}><Wrench size={16} color="#6b7280" /><TextInput style={styles.input} placeholder="Type: scheduled, breakdown, inspection, roadworthy" value={maintenanceForm.maintenance_type} onChangeText={(t) => setMaintenanceForm((p) => ({ ...p, maintenance_type: t as MaintenanceType }))} /></View>
            <View style={styles.inputGroup}><Calendar size={16} color="#6b7280" /><TextInput style={styles.input} placeholder="Scheduled Date (YYYY-MM-DD)" value={maintenanceForm.scheduled_date} onChangeText={(t) => setMaintenanceForm((p) => ({ ...p, scheduled_date: t }))} /></View>
            <View style={styles.inputGroup}><TrendingUp size={16} color="#6b7280" /><TextInput style={styles.input} placeholder="Estimated Cost (KES)" keyboardType="decimal-pad" value={maintenanceForm.cost} onChangeText={(t) => setMaintenanceForm((p) => ({ ...p, cost: t }))} /></View>
            <View style={[styles.inputGroup, styles.textArea]}><FileText size={16} color="#6b7280" /><TextInput style={[styles.input, { height: 80 }]} placeholder="Description of work needed" multiline textAlignVertical="top" value={maintenanceForm.description} onChangeText={(t) => setMaintenanceForm((p) => ({ ...p, description: t }))} /></View>
          </ScrollView>
          <View style={styles.modalFooter}>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => { setShowMaintenanceModal(false); resetMaintenanceForm(); }}><Text style={styles.cancelBtnText}>Cancel</Text></TouchableOpacity>
            <TouchableOpacity style={styles.saveBtn} onPress={handleAddMaintenance}><Text style={styles.saveBtnText}>Schedule</Text></TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

/* ─────────────────────────── Styles ─────────────────────────── */

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f9fafb' },
  loadingText: { marginTop: 12, fontSize: 14, color: '#6b7280' },

  header: { backgroundColor: '#fff', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  headerTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#1f2937' },
  addButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#3b82f6', justifyContent: 'center', alignItems: 'center' },

  searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f3f4f6', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, marginBottom: 12 },
  searchInput: { flex: 1, marginLeft: 8, fontSize: 14, color: '#1f2937' },

  tabRow: { flexDirection: 'row', gap: 8 },
  tab: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#f3f4f6' },
  tabActive: { backgroundColor: '#3b82f6' },
  tabText: { fontSize: 13, fontWeight: '600', color: '#6b7280' },
  tabTextActive: { color: '#fff' },

  statsRow: { flexDirection: 'row', padding: 12, gap: 8 },
  statBox: { flex: 1, backgroundColor: '#fff', borderRadius: 12, padding: 12, alignItems: 'center', borderWidth: 1, borderColor: '#e5e7eb' },
  statNumber: { fontSize: 14, fontWeight: '700', color: '#1f2937', marginTop: 6 },
  statLabel: { fontSize: 10, color: '#6b7280', marginTop: 2 },

  listContent: { padding: 12, paddingBottom: 40 },

  card: { backgroundColor: '#fff', borderRadius: 14, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#e5e7eb' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 8 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: '#1f2937', marginLeft: 8, flex: 1 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  statusText: { fontSize: 11, fontWeight: '600' },
  cardBody: { gap: 6 },
  infoRow: { flexDirection: 'row', alignItems: 'center' },
  infoText: { fontSize: 13, color: '#4b5563', marginLeft: 8, flex: 1 },
  alertBanner: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fef3c7', padding: 8, borderRadius: 8, marginTop: 10 },
  alertText: { fontSize: 12, color: '#d97706', marginLeft: 6, fontWeight: '600' },

  actionRow: { flexDirection: 'row', gap: 8, marginTop: 10 },
  actionBtnSmall: { flex: 1, paddingVertical: 8, borderRadius: 8, alignItems: 'center' },
  actionBtnSmallText: { fontSize: 12, fontWeight: '600', color: '#374151' },

  emptyState: { alignItems: 'center', paddingVertical: 60 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#6b7280', marginTop: 16 },
  emptyButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#3b82f6', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 10, marginTop: 20 },
  emptyButtonText: { color: '#fff', fontWeight: '600', marginLeft: 8 },

  modalContainer: { flex: 1, backgroundColor: '#fff' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#1f2937' },
  modalBody: { flex: 1, padding: 16 },
  modalFooter: { flexDirection: 'row', padding: 16, gap: 12, borderTopWidth: 1, borderTopColor: '#e5e7eb' },

  sectionLabel: { fontSize: 13, fontWeight: '700', color: '#6b7280', textTransform: 'uppercase', marginBottom: 10, letterSpacing: 0.5 },
  inputGroup: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f9fafb', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 12, marginBottom: 10, borderWidth: 1, borderColor: '#e5e7eb' },
  input: { flex: 1, marginLeft: 10, fontSize: 14, color: '#1f2937' },
  rowInputs: { flexDirection: 'row', gap: 10 },
  halfInput: { flex: 1 },
  textArea: { alignItems: 'flex-start', paddingTop: 12 },

  contractPicker: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  contractChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: '#f3f4f6' },
  contractChipActive: { backgroundColor: '#3b82f6' },
  contractChipText: { fontSize: 13, color: '#6b7280', fontWeight: '500' },
  contractChipTextActive: { fontSize: 13, color: '#fff', fontWeight: '600' },

  cancelBtn: { flex: 1, paddingVertical: 14, borderRadius: 10, backgroundColor: '#f3f4f6', alignItems: 'center' },
  cancelBtnText: { color: '#374151', fontWeight: '600' },
  saveBtn: { flex: 2, paddingVertical: 14, borderRadius: 10, backgroundColor: '#3b82f6', alignItems: 'center' },
  saveBtnText: { color: '#fff', fontWeight: '700' },
});
