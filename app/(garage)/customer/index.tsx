// @ts-nocheck
import React, { useState, useCallback, useMemo } from 'react';
import { Alert, View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl, TextInput, Modal, FlatList, KeyboardAvoidingView, Platform, Linking } from 'react-native';
import { useRouter } from 'expo-router';
import { Alert,
  User,
  Car,
  Wrench,
  Star,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Clock,
  CheckCircle,
  AlertTriangle,
  CreditCard,
  FileText,
  MessageSquare,
  ArrowLeft,
  Search,
  X,
  ThumbsUp,
  ThumbsDown,
  Send,
  QrCode,
  Shield,
  TrendingUp,
  Package,
  ChevronRight,
  Receipt,
} from 'lucide-react-native';
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

interface CustomerAppointment {
  id: string;
  garage_id: string;
  vehicle_id: string | null;
  customer_id: string;
  status: AppointmentStatus;
  service_type: string;
  description: string | null;
  estimated_cost: number | null;
  final_cost: number | null;
  mileage_in: number | null;
  mileage_out: number | null;
  customer_approved: boolean;
  customer_notes: string | null;
  scheduled_date: string | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
  garage?: {
    name: string;
    address: string;
    phone: string;
    rating: number;
  };
  vehicle?: {
    make: string;
    model: string;
    year: number;
    plate_number: string;
  };
}

interface GarageReview {
  id: string;
  garage_id: string;
  customer_id: string;
  rating: number;
  title: string | null;
  comment: string | null;
  service_type: string | null;
  would_recommend: boolean | null;
  garage_response: string | null;
  created_at: string;
  garage?: {
    name: string;
    address: string;
  };
}

interface VehicleHistory {
  id: string;
  appointment_id: string;
  service_type: string;
  garage_name: string;
  cost: number;
  date: string;
  mileage: number | null;
}

/* ─────────────────────────── Status Config ─────────────────────────── */

const STATUS_CONFIG: Record<AppointmentStatus, { label: string; color: string }> = {
  pending: { label: 'Pending', color: '#f59e0b' },
  diagnosing: { label: 'Diagnosing', color: '#3b82f6' },
  awaiting_approval: { label: 'Awaiting Your Approval', color: '#f97316' },
  approved: { label: 'Approved', color: '#22c55e' },
  in_progress: { label: 'In Progress', color: '#8b5cf6' },
  quality_check: { label: 'Quality Check', color: '#06b6d4' },
  ready_for_pickup: { label: 'Ready for Pickup', color: '#10b981' },
  completed: { label: 'Completed', color: '#16a34a' },
  cancelled: { label: 'Cancelled', color: '#ef4444' },
};

/* ─────────────────────────── Main Screen ─────────────────────────── */

export default function CustomerPortalScreen() {
  const router = useRouter();
  const { user } = useAuthStore();

  const [appointments, setAppointments] = useState<CustomerAppointment[]>([]);
  const [reviews, setReviews] = useState<GarageReview[]>([]);
  const [vehicleHistory, setVehicleHistory] = useState<VehicleHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'appointments' | 'history' | 'reviews'>('appointments');
  const [searchQuery, setSearchQuery] = useState('');

  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<CustomerAppointment | null>(null);

  /* ── Review Form ── */
  const [reviewForm, setReviewForm] = useState({
    rating: 5,
    title: '',
    comment: '',
    wouldRecommend: true,
  });

  /* ── Load Data ── */
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      if (!user?.id) { setLoading(false); return; }

      const [apptsRes, reviewsRes] = await Promise.all([
        supabase
          .from('garage_appointments')
          .select(`
            *,
            garage:garage_id(name, address, phone, rating),
            vehicle:vehicle_id(make, model, year, plate_number)
          `)
          .eq('customer_id', user.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('garage_reviews')
          .select(`
            *,
            garage:garage_id(name, address)
          `)
          .eq('customer_id', user.id)
          .order('created_at', { ascending: false }),
      ]);

      if (apptsRes.error) throw apptsRes.error;
      if (reviewsRes.error) throw reviewsRes.error;

      setAppointments(apptsRes.data || []);
      setReviews(reviewsRes.data || []);

      // Build vehicle history from completed appointments
      const history: VehicleHistory[] = (apptsRes.data || [])
        .filter((a: any) => a.status === 'completed' && a.final_cost)
        .map((a: any) => ({
          id: a.id,
          appointment_id: a.id,
          service_type: a.service_type,
          garage_name: a.myGarage?.name || 'Unknown',
          cost: a.final_cost,
          date: a.completed_at || a.created_at,
          mileage: a.mileage_out || a.mileage_in,
        }));
      setVehicleHistory(history);
    } catch (err: any) {
      console.error('Customer portal load error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  React.useEffect(() => { loadData(); }, [loadData]);

  /* ── Stats ── */
  const stats = useMemo(() => {
    const active = appointments.filter((a) => !['completed', 'cancelled'].includes(a.status));
    const completed = appointments.filter((a) => a.status === 'completed');
    const totalSpent = completed.reduce((sum, a) => sum + (a.final_cost || 0), 0);
    const avgRating = reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0;
    return { activeCount: active.length, completedCount: completed.length, totalSpent, avgRating };
  }, [appointments, reviews]);

  /* ── Handlers ── */
  const handleApproveService = useCallback(async (approved: boolean) => {
    if (!selectedAppointment) return;
    try {
      const { error } = await supabase
        .from('garage_appointments')
        .update({ customer_approved: approved, status: approved ? 'approved' : 'awaiting_approval' })
        .eq('id', selectedAppointment.id);
      if (error) throw error;
      setShowApprovalModal(false);
      setSelectedAppointment(null);
      loadData();
    } catch (err: any) { Alert.alert('Error', err.message); }
  }, [selectedAppointment, loadData]);

  const handleSubmitReview = useCallback(async () => {
    if (!selectedAppointment || !reviewForm.rating) {
      Alert.alert('Required', 'Please provide a rating');
      return;
    }
    try {
      const { error } = await supabase.from('garage_reviews').insert({
        garage_id: selectedAppointment.myGarage_id,
        customer_id: user?.id,
        rating: reviewForm.rating,
        title: reviewForm.title || null,
        comment: reviewForm.comment || null,
        service_type: selectedAppointment.service_type,
        would_recommend: reviewForm.wouldRecommend,
      });
      if (error) throw error;

      // Update garage rating
      await supabase.rpc('recalculate_garage_rating', { garage_uuid: selectedAppointment.myGarage_id });

      setShowReviewModal(false);
      setSelectedAppointment(null);
      setReviewForm({ rating: 5, title: '', comment: '', wouldRecommend: true });
      loadData();
    } catch (err: any) { Alert.alert('Error', err.message); }
  }, [reviewForm, selectedAppointment, user, loadData]);

  const handleCallGarage = useCallback((phone: string) => {
    Linking.openURL(`tel:${phone}`);
  }, []);

  /* ── Render ── */
  const renderStars = (rating: number, size: number = 16, interactive: boolean = false, onPress?: (r: number) => void) => (
    <View style={{ flexDirection: 'row', gap: 4 }}>
      {[1, 2, 3, 4, 5].map((star) => (
        <TouchableOpacity key={star} disabled={!interactive} onPress={() => onPress?.(star)}>
          <Star
            size={size}
            color={star <= rating ? '#f59e0b' : '#d1d5db'}
            fill={star <= rating ? '#f59e0b' : 'transparent'}
          />
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderAppointmentCard = ({ item }: { item: CustomerAppointment }) => {
    const status = STATUS_CONFIG[item.status];
    const needsApproval = item.status === 'awaiting_approval';
    const canReview = item.status === 'completed' && !reviews.find((r) => r.myGarage_id === item.myGarage_id);

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.cardTitleRow}>
            <Car size={18} color="#3b82f6" />
            <Text style={styles.cardTitle} numberOfLines={1}>
              {item.vehicle
                ? `${item.vehicle.make} ${item.vehicle.model}`
                : item.service_type}
            </Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: status.color + '20' }]}>
            <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
          </View>
        </View>

        <View style={styles.cardBody}>
          <View style={styles.infoRow}>
            <Shield size={14} color="#6b7280" />
            <Text style={styles.infoText}>{item.myGarage?.name || 'Unknown Garage'}</Text>
          </View>
          <View style={styles.infoRow}>
            <MapPin size={14} color="#6b7280" />
            <Text style={styles.infoText}>{item.myGarage?.address || '—'}</Text>
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
                {item.final_cost ? ` → Final: KES ${item.final_cost.toLocaleString()}` : ''}
              </Text>
            </View>
          )}
          {item.mileage_in && (
            <View style={styles.infoRow}>
              <TrendingUp size={14} color="#6b7280" />
              <Text style={styles.infoText}>Mileage: {item.mileage_in.toLocaleString()} km</Text>
            </View>
          )}
        </View>

        {/* Action Buttons */}
        <View style={styles.actionRow}>
          {needsApproval && (
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: '#fef3c7' }]}
              onPress={() => { setSelectedAppointment(item); setShowApprovalModal(true); }}
            >
              <AlertTriangle size={16} color="#d97706" />
              <Text style={[styles.actionBtnText, { color: '#d97706' }]}>Review Quote</Text>
            </TouchableOpacity>
          )}

          {item.status === 'ready_for_pickup' && (
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: '#dcfce7' }]}
              onPress={() => handleCallGarage(item.myGarage?.phone || '')}
            >
              <Phone size={16} color="#16a34a" />
              <Text style={[styles.actionBtnText, { color: '#16a34a' }]}>Call Garage</Text>
            </TouchableOpacity>
          )}

          {canReview && (
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: '#eff6ff' }]}
              onPress={() => { setSelectedAppointment(item); setShowReviewModal(true); }}
            >
              <Star size={16} color="#3b82f6" />
              <Text style={[styles.actionBtnText, { color: '#3b82f6' }]}>Rate Service</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  const renderHistoryCard = ({ item }: { item: VehicleHistory }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.cardTitleRow}>
          <Receipt size={18} color="#3b82f6" />
          <Text style={styles.cardTitle}>{item.service_type}</Text>
        </View>
        <Text style={styles.historyCost}>KES {item.cost.toLocaleString()}</Text>
      </View>
      <View style={styles.cardBody}>
        <View style={styles.infoRow}>
          <Shield size={14} color="#6b7280" />
          <Text style={styles.infoText}>{item.myGarage_name}</Text>
        </View>
        <View style={styles.infoRow}>
          <Calendar size={14} color="#6b7280" />
          <Text style={styles.infoText}>{new Date(item.date).toLocaleDateString()}</Text>
        </View>
        {item.mileage && (
          <View style={styles.infoRow}>
            <TrendingUp size={14} color="#6b7280" />
            <Text style={styles.infoText}>{item.mileage.toLocaleString()} km</Text>
          </View>
        )}
      </View>
    </View>
  );

  const renderReviewCard = ({ item }: { item: GarageReview }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.cardTitleRow}>
          <Star size={18} color="#f59e0b" fill="#f59e0b" />
          <Text style={styles.cardTitle}>{item.myGarage?.name || 'Unknown Garage'}</Text>
        </View>
        {renderStars(item.rating, 14)}
      </View>
      <View style={styles.cardBody}>
        {item.title && <Text style={styles.reviewTitle}>{item.title}</Text>}
        {item.comment && <Text style={styles.reviewComment}>{item.comment}</Text>}
        <View style={styles.reviewMeta}>
          <Text style={styles.reviewDate}>{new Date(item.created_at).toLocaleDateString()}</Text>
          {item.would_recommend !== null && (
            <View style={styles.recommendBadge}>
              {item.would_recommend ? (
                <><ThumbsUp size={12} color="#22c55e" /><Text style={[styles.recommendText, { color: '#22c55e' }]}>Recommend</Text></>
              ) : (
                <><ThumbsDown size={12} color="#ef4444" /><Text style={[styles.recommendText, { color: '#ef4444' }]}>Not Recommend</Text></>
              )}
            </View>
          )}
        </View>
        {item.myGarage_response && (
          <View style={styles.myGarageResponse}>
            <Text style={styles.myGarageResponseLabel}>Garage Response:</Text>
            <Text style={styles.myGarageResponseText}>{item.myGarage_response}</Text>
          </View>
        )}
      </View>
    </View>
  );

  if (loading && appointments.length === 0) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.isLoadingText}>Loading your garage portal...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => router.back()}><ArrowLeft size={24} color="#1f2937" /></TouchableOpacity>
          <Text style={styles.headerTitle}>My Garage</Text>
          <View style={{ width: 24 }} />
        </View>

        {/* Search */}
        <View style={styles.searchBox}>
          <Search size={18} color="#9ca3af" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search appointments, garages..."
            placeholderTextColor="#9ca3af"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery !== '' && <TouchableOpacity onPress={() => setSearchQuery('')}><X size={18} color="#9ca3af" /></TouchableOpacity>}
        </View>

        {/* Tabs */}
        <View style={styles.tabRow}>
          {(['appointments', 'history', 'reviews'] as const).map((tab) => (
            <TouchableOpacity key={tab} style={[styles.tab, activeTab === tab && styles.tabActive]} onPress={() => setActiveTab(tab)}>
              <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                {tab === 'appointments' ? 'Active' : tab === 'history' ? 'History' : 'Reviews'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <Clock size={20} color="#3b82f6" />
          <Text style={styles.statNumber}>{stats.activeCount}</Text>
          <Text style={styles.statLabel}>Active Jobs</Text>
        </View>
        <View style={styles.statBox}>
          <CheckCircle size={20} color="#22c55e" />
          <Text style={styles.statNumber}>{stats.completedCount}</Text>
          <Text style={styles.statLabel}>Completed</Text>
        </View>
        <View style={styles.statBox}>
          <CreditCard size={20} color="#8b5cf6" />
          <Text style={styles.statNumber}>KES {stats.totalSpent.toLocaleString()}</Text>
          <Text style={styles.statLabel}>Total Spent</Text>
        </View>
        <View style={styles.statBox}>
          <Star size={20} color="#f59e0b" />
          <Text style={styles.statNumber}>{stats.avgRating.toFixed(1)}</Text>
          <Text style={styles.statLabel}>Your Avg</Text>
        </View>
      </View>

      {/* List */}
      <FlatList
        data={activeTab === 'appointments' ? appointments : activeTab === 'history' ? vehicleHistory : reviews}
        keyExtractor={(i) => i.id}
        renderItem={activeTab === 'appointments' ? renderAppointmentCard : activeTab === 'history' ? renderHistoryCard : renderReviewCard}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadData(); }} tintColor="#3b82f6" />}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            {activeTab === 'appointments' && <><Car size={48} color="#d1d5db" /><Text style={styles.emptyTitle}>No active appointments</Text><Text style={styles.emptySubtitle}>Your repair jobs will appear here.</Text></>}
            {activeTab === 'history' && <><Receipt size={48} color="#d1d5db" /><Text style={styles.emptyTitle}>No service history</Text><Text style={styles.emptySubtitle}>Completed repairs and costs will show here.</Text></>}
            {activeTab === 'reviews' && <><Star size={48} color="#d1d5db" /><Text style={styles.emptyTitle}>No reviews yet</Text><Text style={styles.emptySubtitle}>Rate garages after completed services.</Text></>}
          </View>
        }
      />

      {/* ── Approval Modal ── */}
      <Modal visible={showApprovalModal} animationType="slide" transparent presentationStyle="overFullScreen">
        <View style={styles.overlay}>
          <View style={styles.approvalModal}>
            <Text style={styles.approvalTitle}>Service Quote Approval</Text>
            <Text style={styles.approvalSubtitle}>
              {selectedAppointment?.myGarage?.name} has quoted KES {selectedAppointment?.estimated_cost?.toLocaleString()} for {selectedAppointment?.service_type}.
            </Text>
            {selectedAppointment?.description && (
              <View style={styles.quoteBox}>
                <Text style={styles.quoteLabel}>Description:</Text>
                <Text style={styles.quoteText}>{selectedAppointment.description}</Text>
              </View>
            )}
            <View style={styles.approvalButtons}>
              <TouchableOpacity style={[styles.approvalBtn, { backgroundColor: '#fef2f2' }]} onPress={() => handleApproveService(false)}>
                <X size={18} color="#ef4444" />
                <Text style={[styles.approvalBtnText, { color: '#ef4444' }]}>Decline</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.approvalBtn, { backgroundColor: '#dcfce7' }]} onPress={() => handleApproveService(true)}>
                <CheckCircle size={18} color="#22c55e" />
                <Text style={[styles.approvalBtnText, { color: '#16a34a' }]}>Approve</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Review Modal ── */}
      <Modal visible={showReviewModal} animationType="slide" presentationStyle="pageSheet">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Rate Your Experience</Text>
            <TouchableOpacity onPress={() => { setShowReviewModal(false); setReviewForm({ rating: 5, title: '', comment: '', wouldRecommend: true }); }}>
              <X size={24} color="#6b7280" />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.modalBody}>
            <Text style={styles.sectionLabel}>How was your service at {selectedAppointment?.myGarage?.name}?</Text>
            <View style={styles.ratingRow}>
              {renderStars(reviewForm.rating, 32, true, (r) => setReviewForm((p) => ({ ...p, rating: r })))}
              <Text style={styles.ratingLabel}>{reviewForm.rating}/5</Text>
            </View>

            <View style={styles.inputGroup}>
              <FileText size={16} color="#6b7280" />
              <TextInput style={styles.input} placeholder="Review Title (optional)" value={reviewForm.title} onChangeText={(t) => setReviewForm((p) => ({ ...p, title: t }))} />
            </View>

            <View style={[styles.inputGroup, styles.textArea]}>
              <MessageSquare size={16} color="#6b7280" />
              <TextInput style={[styles.input, { height: 100 }]} placeholder="Tell others about your experience..." multiline textAlignVertical="top" value={reviewForm.comment} onChangeText={(t) => setReviewForm((p) => ({ ...p, comment: t }))} />
            </View>

            <Text style={[styles.sectionLabel, { marginTop: 16 }]}>Would you recommend this garage?</Text>
            <View style={styles.recommendRow}>
              <TouchableOpacity style={[styles.recommendBtn, reviewForm.wouldRecommend && styles.recommendBtnActive]} onPress={() => setReviewForm((p) => ({ ...p, wouldRecommend: true }))}>
                <ThumbsUp size={20} color={reviewForm.wouldRecommend ? '#fff' : '#6b7280'} />
                <Text style={[styles.recommendBtnText, reviewForm.wouldRecommend && { color: '#fff' }]}>Yes</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.recommendBtn, !reviewForm.wouldRecommend && styles.recommendBtnActiveNo]} onPress={() => setReviewForm((p) => ({ ...p, wouldRecommend: false }))}>
                <ThumbsDown size={20} color={!reviewForm.wouldRecommend ? '#fff' : '#6b7280'} />
                <Text style={[styles.recommendBtnText, !reviewForm.wouldRecommend && { color: '#fff' }]}>No</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
          <View style={styles.modalFooter}>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => { setShowReviewModal(false); setReviewForm({ rating: 5, title: '', comment: '', wouldRecommend: true }); }}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveBtn} onPress={handleSubmitReview}>
              <Text style={styles.saveBtnText}>Submit Review</Text>
            </TouchableOpacity>
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
  historyCost: { fontSize: 15, fontWeight: '700', color: '#16a34a' },

  actionRow: { flexDirection: 'row', gap: 8, marginTop: 10 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, gap: 6 },
  actionBtnText: { fontSize: 12, fontWeight: '600' },

  emptyState: { alignItems: 'center', paddingVertical: 60 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#6b7280', marginTop: 16 },
  emptySubtitle: { fontSize: 13, color: '#9ca3af', marginTop: 6, textAlign: 'center', paddingHorizontal: 40 },

  /* Review Card */
  reviewTitle: { fontSize: 14, fontWeight: '700', color: '#1f2937', marginBottom: 4 },
  reviewComment: { fontSize: 13, color: '#4b5563', lineHeight: 20 },
  reviewMeta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 },
  reviewDate: { fontSize: 12, color: '#9ca3af' },
  recommendBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  recommendText: { fontSize: 12, fontWeight: '600' },
  garageResponse: { backgroundColor: '#f3f4f6', padding: 10, borderRadius: 8, marginTop: 10 },
  garageResponseLabel: { fontSize: 12, fontWeight: '700', color: '#6b7280', marginBottom: 4 },
  garageResponseText: { fontSize: 13, color: '#4b5563' },

  /* Approval Modal */
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  approvalModal: { backgroundColor: '#fff', borderRadius: 20, padding: 24, width: '100%', maxWidth: 400 },
  approvalTitle: { fontSize: 18, fontWeight: '700', color: '#1f2937', marginBottom: 8 },
  approvalSubtitle: { fontSize: 14, color: '#6b7280', marginBottom: 16, lineHeight: 20 },
  quoteBox: { backgroundColor: '#f9fafb', padding: 12, borderRadius: 10, marginBottom: 16 },
  quoteLabel: { fontSize: 12, fontWeight: '700', color: '#6b7280', marginBottom: 4 },
  quoteText: { fontSize: 13, color: '#374151' },
  approvalButtons: { flexDirection: 'row', gap: 12 },
  approvalBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, borderRadius: 10, gap: 8 },
  approvalBtnText: { fontSize: 14, fontWeight: '700' },

  /* Review Modal */
  modalContainer: { flex: 1, backgroundColor: '#fff' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#1f2937' },
  modalBody: { flex: 1, padding: 16 },
  modalFooter: { flexDirection: 'row', padding: 16, gap: 12, borderTopWidth: 1, borderTopColor: '#e5e7eb' },

  sectionLabel: { fontSize: 13, fontWeight: '700', color: '#6b7280', textTransform: 'uppercase', marginBottom: 10, letterSpacing: 0.5 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20 },
  ratingLabel: { fontSize: 18, fontWeight: '700', color: '#f59e0b' },

  inputGroup: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f9fafb', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 12, marginBottom: 10, borderWidth: 1, borderColor: '#e5e7eb' },
  input: { flex: 1, marginLeft: 10, fontSize: 14, color: '#1f2937' },
  textArea: { alignItems: 'flex-start', paddingTop: 12 },

  recommendRow: { flexDirection: 'row', gap: 12 },
  recommendBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, borderRadius: 10, backgroundColor: '#f3f4f6', gap: 8 },
  recommendBtnActive: { backgroundColor: '#22c55e' },
  recommendBtnActiveNo: { backgroundColor: '#ef4444' },
  recommendBtnText: { fontSize: 14, fontWeight: '700', color: '#6b7280' },

  cancelBtn: { flex: 1, paddingVertical: 14, borderRadius: 10, backgroundColor: '#f3f4f6', alignItems: 'center' },
  cancelBtnText: { color: '#374151', fontWeight: '600' },
  saveBtn: { flex: 2, paddingVertical: 14, borderRadius: 10, backgroundColor: '#3b82f6', alignItems: 'center' },
  saveBtnText: { color: '#fff', fontWeight: '700' },
});
