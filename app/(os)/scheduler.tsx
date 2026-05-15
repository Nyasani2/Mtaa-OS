/**
 * MTAA AFRIQ — Scheduler Admin Screen
 * Job queue monitor, manual execution, cron management
 * Route: /(os)/scheduler or /(hookup-admin)/scheduler
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Modal,
  TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  Clock,
  Play,
  Pause,
  Trash2,
  RotateCcw,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Calendar,
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  Zap,
  Activity,
  Timer,
  Filter,
  Plus,
  X,
  Terminal,
} from 'lucide-react-native-native';
import { useScheduler } from '@/hooks/use-scheduler';
import { ScheduledJob, JobStatus, JobLog } from '../../kernel/scheduler-engine';
import { Colors } from '../../constants/Colors';

const STATUS_COLORS: Record<JobStatus, string> = {
  pending: Colors.warning,
  running: Colors.info,
  completed: Colors.success,
  failed: Colors.error,
  cancelled: Colors.textSecondary,
  retrying: Colors.accent,
};

const STATUS_ICONS: Record<JobStatus, React.ReactNode> = {
  pending: <Clock size={16} color={Colors.warning} />,
  running: <Activity size={16} color={Colors.info} />,
  completed: <CheckCircle size={16} color={Colors.success} />,
  failed: <XCircle size={16} color={Colors.error} />,
  cancelled: <X size={16} color={Colors.textSecondary} />,
  retrying: <RotateCcw size={16} color={Colors.accent} />,
};

const CRON_PRESETS = [
  { label: 'Every minute', value: '* * * * *' },
  { label: 'Every 5 minutes', value: '*/5 * * * *' },
  { label: 'Every 15 minutes', value: '*/15 * * * *' },
  { label: 'Every hour', value: '0 * * * *' },
  { label: 'Every 6 hours', value: '0 */6 * * *' },
  { label: 'Daily (midnight)', value: '0 0 * * *' },
  { label: 'Daily (9 AM)', value: '0 9 * * *' },
  { label: 'Weekly (Sunday)', value: '0 0 * * 0' },
  { label: 'Monthly (1st)', value: '0 0 1 * *' },
];

const BUILT_IN_HANDLERS = [
  { name: 'Process Notification Queue', value: 'process_notification_queue' },
  { name: 'Cleanup Old Notifications', value: 'cleanup_old_notifications' },
  { name: 'Escrow Auto-Release', value: 'escrow_auto_release' },
  { name: 'Billing Cycle', value: 'billing_cycle' },
  { name: 'Generate Reports', value: 'generate_reports' },
  { name: 'Audit Log Cleanup', value: 'audit_log_cleanup' },
  { name: 'KYC Reminder', value: 'kyc_reminder' },
  { name: 'Contract Expiry Check', value: 'contract_expiry_check' },
  { name: 'Subscription Renewal', value: 'subscription_renewal' },
];

export default function SchedulerAdminScreen() {
  const router = useRouter();
  const {
    jobs,
    logs,
    queues,
    loading,
    error,
    cancelJob,
    deleteJob,
    runJobNow,
    refresh,
    getJobLogs,
    filterByStatus,
    pendingCount,
    runningCount,
    failedCount,
    completedToday,
  } = useScheduler();

  const [selectedJob, setSelectedJob] = useState<ScheduledJob | null>(null);
  const [showLogs, setShowLogs] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [activeFilter, setActiveFilter] = useState<JobStatus | 'all'>('all');
  const [expandedJob, setExpandedJob] = useState<string | null>(null);

  // Create form state
  const [newJobName, setNewJobName] = useState('');
  const [newJobHandler, setNewJobHandler] = useState('');
  const [newJobCron, setNewJobCron] = useState('');
  const [newJobType, setNewJobType] = useState<'once' | 'recurring'>('recurring');
  const [newJobPriority, setNewJobPriority] = useState('normal');

  const renderStats = () => (
    <View style={styles.statsRow}>
      <View style={[styles.statCard, { backgroundColor: `${Colors.warning}15` }]}>
        <Text style={[styles.statNumber, { color: Colors.warning }]}>{pendingCount}</Text>
        <Text style={styles.statLabel}>Pending</Text>
      </View>
      <View style={[styles.statCard, { backgroundColor: `${Colors.info}15` }]}>
        <Text style={[styles.statNumber, { color: Colors.info }]}>{runningCount}</Text>
        <Text style={styles.statLabel}>Running</Text>
      </View>
      <View style={[styles.statCard, { backgroundColor: `${Colors.error}15` }]}>
        <Text style={[styles.statNumber, { color: Colors.error }]}>{failedCount}</Text>
        <Text style={styles.statLabel}>Failed</Text>
      </View>
      <View style={[styles.statCard, { backgroundColor: `${Colors.success}15` }]}>
        <Text style={[styles.statNumber, { color: Colors.success }]}>{completedToday}</Text>
        <Text style={styles.statLabel}>Done Today</Text>
      </View>
    </View>
  );

  const renderFilters = () => (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
      {(['all', 'pending', 'running', 'completed', 'failed', 'retrying', 'cancelled'] as const).map((status) => (
        <TouchableOpacity
          key={status}
          style={[styles.filterChip, activeFilter === status && styles.filterChipActive]}
          onPress={() => {
            setActiveFilter(status);
            filterByStatus(status);
          }}
        >
          <Text style={[styles.filterChipText, activeFilter === status && styles.filterChipTextActive]}>
            {status === 'all' ? 'All' : status.charAt(0).toUpperCase() + status.slice(1)}
          </Text>
          {status !== 'all' && (
            <View style={[styles.filterBadge, { backgroundColor: STATUS_COLORS[status as JobStatus] }]}>
              <Text style={styles.filterBadgeText}>
                {jobs.filter(j => j.status === status).length}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  const renderJobItem = ({ item }: { item: ScheduledJob }) => {
    const isExpanded = expandedJob === item.id;
    const statusColor = STATUS_COLORS[item.status];
    const statusIcon = STATUS_ICONS[item.status];

    return (
      <View style={styles.jobCard}>
        <TouchableOpacity style={styles.jobHeader} onPress={() => setExpandedJob(isExpanded ? null : item.id)}>
          <View style={styles.jobLeft}>
            <View style={[styles.statusIcon, { backgroundColor: `${statusColor}15` }]}>
              {statusIcon}
            </View>
            <View style={styles.jobInfo}>
              <Text style={styles.jobName} numberOfLines={1}>{item.name}</Text>
              <Text style={styles.jobMeta}>
                {item.handler} · {item.priority} · {formatTime(item.created_at)}
              </Text>
            </View>
          </View>
          <View style={styles.jobRight}>
            <View style={[styles.statusBadge, { backgroundColor: `${statusColor}20` }]}>
              <Text style={[styles.statusText, { color: statusColor }]}>{item.status}</Text>
            </View>
            {isExpanded ? <ChevronUp size={18} color={Colors.textSecondary} /> : <ChevronDown size={18} color={Colors.textSecondary} />}
          </View>
        </TouchableOpacity>

        {isExpanded && (
          <View style={styles.jobDetails}>
            <View style={styles.detailGrid}>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Handler</Text>
                <Text style={styles.detailValue}>{item.handler}</Text>
              </View>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Priority</Text>
                <Text style={styles.detailValue}>{item.priority}</Text>
              </View>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Retries</Text>
                <Text style={styles.detailValue}>{item.retry_count}/{item.max_retries}</Text>
              </View>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Timeout</Text>
                <Text style={styles.detailValue}>{item.timeout_seconds}s</Text>
              </View>
            </View>

            {item.cron_expression && (
              <View style={styles.detailRow}>
                <Timer size={14} color={Colors.textSecondary} />
                <Text style={styles.detailRowText}>Cron: {item.cron_expression}</Text>
              </View>
            )}
            {item.execute_at && (
              <View style={styles.detailRow}>
                <Calendar size={14} color={Colors.textSecondary} />
                <Text style={styles.detailRowText}>Execute: {new Date(item.execute_at).toLocaleString()}</Text>
              </View>
            )}
            {item.next_run_at && (
              <View style={styles.detailRow}>
                <Zap size={14} color={Colors.textSecondary} />
                <Text style={styles.detailRowText}>Next run: {new Date(item.next_run_at).toLocaleString()}</Text>
              </View>
            )}
            {item.error_message && (
              <View style={styles.errorBox}>
                <AlertTriangle size={14} color={Colors.error} />
                <Text style={styles.errorText}>{item.error_message}</Text>
              </View>
            )}

            {/* Actions */}
            <View style={styles.jobActions}>
              {item.status === 'pending' && (
                <TouchableOpacity style={[styles.actionBtn, { backgroundColor: `${Colors.success}15` }]} onPress={() => runJobNow(item.id)}>
                  <Play size={16} color={Colors.success} />
                  <Text style={[styles.actionText, { color: Colors.success }]}>Run Now</Text>
                </TouchableOpacity>
              )}
              {(item.status === 'pending' || item.status === 'retrying') && (
                <TouchableOpacity style={[styles.actionBtn, { backgroundColor: `${Colors.warning}15` }]} onPress={() => cancelJob(item.id)}>
                  <Pause size={16} color={Colors.warning} />
                  <Text style={[styles.actionText, { color: Colors.warning }]}>Cancel</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity style={[styles.actionBtn, { backgroundColor: `${Colors.info}15` }]} onPress={async () => {
                await getJobLogs(item.id);
                setSelectedJob(item);
                setShowLogs(true);
              }}>
                <Terminal size={16} color={Colors.info} />
                <Text style={[styles.actionText, { color: Colors.info }]}>Logs</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.actionBtn, { backgroundColor: `${Colors.error}15` }]} onPress={() => deleteJob(item.id)}>
                <Trash2 size={16} color={Colors.error} />
                <Text style={[styles.actionText, { color: Colors.error }]}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    );
  };

  const renderCreateModal = () => (
    <Modal visible={showCreateModal} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Schedule New Job</Text>
            <TouchableOpacity onPress={() => setShowCreateModal(false)}>
              <X size={24} color={Colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Job Type */}
            <View style={styles.formRow}>
              <TouchableOpacity
                style={[styles.typeBtn, newJobType === 'once' && styles.typeBtnActive]}
                onPress={() => setNewJobType('once')}
              >
                <Text style={[styles.typeBtnText, newJobType === 'once' && styles.typeBtnTextActive]}>One-Time</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.typeBtn, newJobType === 'recurring' && styles.typeBtnActive]}
                onPress={() => setNewJobType('recurring')}
              >
                <Text style={[styles.typeBtnText, newJobType === 'recurring' && styles.typeBtnTextActive]}>Recurring</Text>
              </TouchableOpacity>
            </View>

            {/* Name */}
            <Text style={styles.formLabel}>Job Name</Text>
            <TextInput
              style={styles.formInput}
              value={newJobName}
              onChange={setNewJobName}
              placeholder="e.g. Daily Report Generation"
              placeholderTextColor={Colors.textSecondary}
            />

            {/* Handler */}
            <Text style={styles.formLabel}>Handler</Text>
            <View style={styles.handlerList}>
              {BUILT_IN_HANDLERS.map((h) => (
                <TouchableOpacity
                  key={h.value}
                  style={[styles.handlerChip, newJobHandler === h.value && styles.handlerChipActive]}
                  onPress={() => setNewJobHandler(h.value)}
                >
                  <Text style={[styles.handlerChipText, newJobHandler === h.value && styles.handlerChipTextActive]}>
                    {h.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Cron (recurring only) */}
            {newJobType === 'recurring' && (
              <>
                <Text style={styles.formLabel}>Schedule (Cron)</Text>
                <View style={styles.cronList}>
                  {CRON_PRESETS.map((c) => (
                    <TouchableOpacity
                      key={c.value}
                      style={[styles.cronChip, newJobCron === c.value && styles.cronChipActive]}
                      onPress={() => setNewJobCron(c.value)}
                    >
                      <Text style={[styles.cronChipText, newJobCron === c.value && styles.cronChipTextActive]}>
                        {c.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <TextInput
                  style={styles.formInput}
                  value={newJobCron}
                  onChange={setNewJobCron}
                  placeholder="* * * * *"
                  placeholderTextColor={Colors.textSecondary}
                />
              </>
            )}

            {/* Priority */}
            <Text style={styles.formLabel}>Priority</Text>
            <View style={styles.priorityRow}>
              {(['low', 'normal', 'high', 'critical'] as const).map((p) => (
                <TouchableOpacity
                  key={p}
                  style={[styles.priorityChip, newJobPriority === p && styles.priorityChipActive]}
                  onPress={() => setNewJobPriority(p)}
                >
                  <Text style={[styles.priorityChipText, newJobPriority === p && styles.priorityChipTextActive]}>
                    {p.charAt(0).toUpperCase() + p.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              style={[styles.createBtn, (!newJobName || !newJobHandler) && styles.createBtnDisabled]}
              disabled={!newJobName || !newJobHandler}
              onPress={() => {
                // Would call scheduleOnce or scheduleRecurring
                setShowCreateModal(false);
              }}
            >
              <Plus size={18} color="#fff" />
              <Text style={styles.createBtnText}>Schedule Job</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  const renderLogsModal = () => (
    <Modal visible={showLogs} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Job Logs: {selectedJob?.name}</Text>
            <TouchableOpacity onPress={() => setShowLogs(false)}>
              <X size={24} color={Colors.text} />
            </TouchableOpacity>
          </View>
          <FlatList
            data={logs}
            keyExtractor={item => item.id}
            renderItem={({ item }) => (
              <View style={styles.logItem}>
                <View style={styles.logHeader}>
                  <View style={[styles.logStatus, { backgroundColor: item.status === 'completed' ? `${Colors.success}20` : `${Colors.error}20` }]}>
                    <Text style={[styles.logStatusText, { color: item.status === 'completed' ? Colors.success : Colors.error }]}>
                      {item.status}
                    </Text>
                  </View>
                  <Text style={styles.logTime}>{formatTime(item.executed_at)}</Text>
                </View>
                {item.duration_ms && (
                  <Text style={styles.logDuration}>Duration: {item.duration_ms}ms</Text>
                )}
                {item.error && (
                  <Text style={styles.logError}>{item.error}</Text>
                )}
              </View>
            )}
            ListEmptyComponent={
              <View style={styles.emptyLogs}>
                <Terminal size={48} color={Colors.textSecondary} opacity={0.3} />
                <Text style={styles.emptyLogsText}>No logs yet</Text>
              </View>
            }
          />
        </View>
      </View>
    </Modal>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ChevronLeft size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Scheduler</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => setShowCreateModal(true)}>
          <Plus size={24} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {renderStats()}
        {renderFilters()}

        {/* Queue Status */}
        {queues.length > 0 && (
          <View style={styles.queueCard}>
            <Text style={styles.queueTitle}>Queue Status</Text>
            {queues.map(q => (
              <View key={q.id} style={styles.queueRow}>
                <Text style={styles.queueName}>{q.name}</Text>
                <View style={styles.queueStats}>
                  <Text style={styles.queueStat}>{q.current_running}/{q.max_concurrent} running</Text>
                  <Text style={styles.queueStat}>{q.total_processed} processed</Text>
                  <Text style={[styles.queueStat, { color: Colors.error }]}>{q.total_failed} failed</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Jobs List */}
        <Text style={styles.sectionTitle}>Scheduled Jobs</Text>
        {jobs.map(job => (
          <View key={job.id}>
            {renderJobItem({ item: job })}
          </View>
        ))}

        {jobs.length === 0 && !loading && (
          <View style={styles.emptyState}>
            <Clock size={64} color={Colors.textSecondary} opacity={0.3} />
            <Text style={styles.emptyTitle}>No jobs scheduled</Text>
            <Text style={styles.emptySubtitle}>Tap + to create your first scheduled job</Text>
          </View>
        )}
      </ScrollView>

      {renderCreateModal()}
      {renderLogsModal()}
    </View>
  );
}

function formatTime(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 12, paddingBottom: 12, backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.border },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 20, fontWeight: '700', color: Colors.text },
  addBtn: { padding: 4 },
  scrollContent: { padding: 16, paddingBottom: 40 },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  statCard: { flex: 1, borderRadius: 12, padding: 14, alignItems: 'center' },
  statNumber: { fontSize: 24, fontWeight: '800' },
  statLabel: { fontSize: 12, color: Colors.textSecondary, marginTop: 4, fontWeight: '600' },
  filterScroll: { marginBottom: 16 },
  filterChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: Colors.surface, marginRight: 8, borderWidth: 1, borderColor: Colors.border },
  filterChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  filterChipText: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary },
  filterChipTextActive: { color: '#fff' },
  filterBadge: { borderRadius: 10, minWidth: 18, height: 18, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 5 },
  filterBadgeText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  queueCard: { backgroundColor: Colors.surface, borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: Colors.border },
  queueTitle: { fontSize: 16, fontWeight: '700', color: Colors.text, marginBottom: 12 },
  queueRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: Colors.border },
  queueName: { fontSize: 14, fontWeight: '600', color: Colors.text },
  queueStats: { flexDirection: 'row', gap: 12 },
  queueStat: { fontSize: 12, color: Colors.textSecondary, fontWeight: '500' },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: Colors.text, marginBottom: 12, marginTop: 8 },
  jobCard: { backgroundColor: Colors.surface, borderRadius: 16, marginBottom: 10, borderWidth: 1, borderColor: Colors.border, overflow: 'hidden' },
  jobHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 14 },
  jobLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  statusIcon: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  jobInfo: { flex: 1 },
  jobName: { fontSize: 15, fontWeight: '600', color: Colors.text },
  jobMeta: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  jobRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  statusText: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },
  jobDetails: { paddingHorizontal: 14, paddingBottom: 14, borderTopWidth: 1, borderTopColor: Colors.border },
  detailGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 12, marginBottom: 8 },
  detailItem: { flex: 1, minWidth: '45%' },
  detailLabel: { fontSize: 11, color: Colors.textSecondary, fontWeight: '600', textTransform: 'uppercase', marginBottom: 2 },
  detailValue: { fontSize: 14, color: Colors.text, fontWeight: '500' },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 },
  detailRowText: { fontSize: 13, color: Colors.textSecondary },
  errorBox: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, backgroundColor: `${Colors.error}08`, padding: 10, borderRadius: 8, marginTop: 10, borderWidth: 1, borderColor: `${Colors.error}20` },
  errorText: { fontSize: 12, color: Colors.error, flex: 1, lineHeight: 18 },
  jobActions: { flexDirection: 'row', gap: 8, marginTop: 14 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  actionText: { fontSize: 13, fontWeight: '600' },
  emptyState: { alignItems: 'center', paddingVertical: 60, gap: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: Colors.textSecondary },
  emptySubtitle: { fontSize: 14, color: Colors.textSecondary },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: Colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, maxHeight: '90%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: '700', color: Colors.text },
  formRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  typeBtn: { flex: 1, paddingVertical: 12, borderRadius: 10, backgroundColor: Colors.background, alignItems: 'center', borderWidth: 1, borderColor: Colors.border },
  typeBtnActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  typeBtnText: { fontSize: 14, fontWeight: '600', color: Colors.textSecondary },
  typeBtnTextActive: { color: '#fff' },
  formLabel: { fontSize: 14, fontWeight: '600', color: Colors.text, marginBottom: 8, marginTop: 12 },
  formInput: { backgroundColor: Colors.background, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 16, color: Colors.text, borderWidth: 1, borderColor: Colors.border },
  handlerList: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  handlerChip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, backgroundColor: Colors.background, borderWidth: 1, borderColor: Colors.border },
  handlerChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  handlerChipText: { fontSize: 12, color: Colors.textSecondary },
  handlerChipTextActive: { color: '#fff', fontWeight: '600' },
  cronList: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  cronChip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, backgroundColor: Colors.background, borderWidth: 1, borderColor: Colors.border },
  cronChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  cronChipText: { fontSize: 12, color: Colors.textSecondary },
  cronChipTextActive: { color: '#fff', fontWeight: '600' },
  priorityRow: { flexDirection: 'row', gap: 8 },
  priorityChip: { flex: 1, paddingVertical: 10, borderRadius: 8, backgroundColor: Colors.background, alignItems: 'center', borderWidth: 1, borderColor: Colors.border },
  priorityChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  priorityChipText: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary },
  priorityChipTextActive: { color: '#fff' },
  createBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: Colors.primary, borderRadius: 12, paddingVertical: 14, marginTop: 20 },
  createBtnDisabled: { backgroundColor: Colors.border },
  createBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  logItem: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.border },
  logHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  logStatus: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  logStatusText: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },
  logTime: { fontSize: 12, color: Colors.textSecondary },
  logDuration: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  logError: { fontSize: 12, color: Colors.error, marginTop: 4 },
  emptyLogs: { alignItems: 'center', paddingVertical: 40 },
  emptyLogsText: { fontSize: 16, color: Colors.textSecondary, marginTop: 12 },
});
