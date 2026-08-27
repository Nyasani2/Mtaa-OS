// app/(mtruck)/settlement.tsx
//
// Freight job settlement screen — closes the confirmed gap where a
// completed mtruck haul had no way to actually pay the driver.
// Calls the mtruck-settle edge function (supabase/functions/mtruck-settle),
// which credits the driver's real wallet and MTAA's platform revenue
// wallet via the audited mtaa_add_wallet_transaction RPC.
import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MapPin, Package, DollarSign, CheckCircle } from 'lucide-react-native';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { supabase } from '@/lib/supabase';

interface JobDetail {
  id: string;
  shipper_id: string;
  assigned_driver_id: string | null;
  status: string;
  cargo_type: string;
  final_rate: number | null;
  quoted_rate: number | null;
  currency: string | null;
  origin: any;
  destination: any;
}

export default function SettlementScreen() {
  const router = useRouter();
  const { jobId } = useLocalSearchParams<{ jobId: string }>();
  const { user } = useAuthStore();

  const [job, setJob] = useState<JobDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [settling, setSettling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);

  useEffect(() => {
    if (!jobId) return;
    (async () => {
      setLoading(true);
      const { data, error: fetchErr } = await supabase
        .from('mtruck_jobs')
        .select('id, shipper_id, assigned_driver_id, status, cargo_type, final_rate, quoted_rate, currency, origin, destination')
        .eq('id', jobId)
        .single();
      if (fetchErr) {
        setError(fetchErr.message);
      } else {
        setJob(data as JobDetail);
      }
      setLoading(false);
    })();
  }, [jobId]);

  const rate = job?.final_rate ?? job?.quoted_rate ?? 0;
  const isShipper = user?.id === job?.shipper_id;
  const isDriver = user?.id === job?.assigned_driver_id;
  const canSettle = job?.status === 'delivered' && (isShipper || isDriver);
  const alreadySettled = job?.status === 'completed';

  const handleSettle = async () => {
    if (!jobId) return;
    setSettling(true);
    setError(null);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      const { data, error: fnError } = await supabase.functions.invoke('mtruck-settle', {
        body: { job_id: jobId },
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      if (fnError) {
        setError(fnError.message || 'Settlement failed');
      } else if (data?.error) {
        setError(data.error);
      } else {
        setResult(data);
        Alert.alert('Settlement Complete', `Driver paid ${data.driver_amount} ${job?.currency || 'KES'}`);
      }
    } catch (e: any) {
      setError(e?.message || 'Settlement failed');
    } finally {
      setSettling(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#4f46e5" />
      </View>
    );
  }

  if (!job) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{error || 'Job not found'}</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Freight Settlement</Text>
      <Text style={styles.jobId}>Job #{job.id.slice(0, 8)}</Text>

      <View style={styles.card}>
        <View style={styles.row}>
          <Package size={18} color="#4f46e5" />
          <Text style={styles.rowText}>{job.cargo_type || 'Cargo'}</Text>
        </View>
        <View style={styles.row}>
          <MapPin size={18} color="#4f46e5" />
          <Text style={styles.rowText} numberOfLines={2}>
            {job.origin?.address || 'Origin'} → {job.destination?.address || 'Destination'}
          </Text>
        </View>
        <View style={styles.row}>
          <DollarSign size={18} color="#4f46e5" />
          <Text style={styles.rowText}>{rate.toLocaleString()} {job.currency || 'KES'}</Text>
        </View>
        <View style={[styles.badge, statusStyle(job.status)]}>
          <Text style={styles.badgeText}>{job.status}</Text>
        </View>
      </View>

      {alreadySettled ? (
        <View style={styles.settledBox}>
          <CheckCircle size={20} color="#16a34a" />
          <Text style={styles.settledText}>This job has already been settled.</Text>
        </View>
      ) : !canSettle ? (
        <Text style={styles.noticeText}>
          {job.status !== 'delivered'
            ? `Job must be marked 'delivered' before settlement (currently '${job.status}').`
            : 'Only the shipper or assigned driver can settle this job.'}
        </Text>
      ) : (
        <Pressable
          style={[styles.settleButton, settling && styles.settleButtonDisabled]}
          onPress={handleSettle}
          disabled={settling}
        >
          {settling ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.settleButtonText}>Release Payment to Driver</Text>
          )}
        </Pressable>
      )}

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      {result ? (
        <View style={styles.resultBox}>
          <Text style={styles.resultTitle}>Payment Released</Text>
          <Text style={styles.resultLine}>Driver received: {result.driver_amount} {job.currency || 'KES'}</Text>
          <Text style={styles.resultLine}>Platform fee: {result.platform_fee} {job.currency || 'KES'}</Text>
          <Pressable onPress={() => router.back()} style={styles.doneButton}>
            <Text style={styles.doneButtonText}>Done</Text>
          </Pressable>
        </View>
      ) : null}
    </ScrollView>
  );
}

function statusStyle(status: string) {
  switch (status) {
    case 'completed': return { backgroundColor: '#dcfce7' };
    case 'delivered': return { backgroundColor: '#dbeafe' };
    case 'disputed': return { backgroundColor: '#fee2e2' };
    default: return { backgroundColor: '#f3f4f6' };
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  content: { padding: 20 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f9fafb' },
  title: { fontSize: 22, fontWeight: '700', color: '#111827' },
  jobId: { fontSize: 14, color: '#6b7280', marginTop: 4, marginBottom: 16 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, gap: 12 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  rowText: { fontSize: 15, color: '#374151', flexShrink: 1 },
  badge: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, marginTop: 4 },
  badgeText: { fontSize: 12, fontWeight: '600', color: '#374151', textTransform: 'capitalize' },
  settleButton: { backgroundColor: '#4f46e5', borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 20 },
  settleButtonDisabled: { opacity: 0.6 },
  settleButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  noticeText: { marginTop: 20, fontSize: 14, color: '#6b7280', textAlign: 'center' },
  errorText: { marginTop: 16, fontSize: 14, color: '#dc2626', textAlign: 'center' },
  settledBox: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 20, padding: 14, backgroundColor: '#dcfce7', borderRadius: 12 },
  settledText: { color: '#166534', fontSize: 14, fontWeight: '500' },
  resultBox: { marginTop: 20, padding: 16, backgroundColor: '#fff', borderRadius: 12, gap: 6 },
  resultTitle: { fontSize: 16, fontWeight: '700', color: '#16a34a' },
  resultLine: { fontSize: 14, color: '#374151' },
  doneButton: { marginTop: 12, backgroundColor: '#f3f4f6', borderRadius: 10, padding: 12, alignItems: 'center' },
  doneButtonText: { fontSize: 14, fontWeight: '600', color: '#374151' },
});
