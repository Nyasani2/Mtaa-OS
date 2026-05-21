/**
 * MTAA AFRIQ — Scheduler Admin Screen (STABLE FIXED VERSION)
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
  Plus,
  X,
  Terminal,
} from 'lucide-react-native';

import { useScheduler } from '@/hooks/useScheduler';
import { ScheduledJob, JobStatus } from '@/kernel/scheduler-engine';
import { Colors } from '@/constants/Colors';

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

  const renderJobItem = ({ item }: { item: ScheduledJob }) => {
    const isExpanded = expandedJob === item.id;
    const statusColor = STATUS_COLORS[item.status];
    const statusIcon = STATUS_ICONS[item.status];

    return (
      <View style={styles.jobCard}>
        <TouchableOpacity
          style={styles.jobHeader}
          onPress={() => setExpandedJob(isExpanded ? null : item.id)}
        >
          <View style={styles.jobLeft}>
            <View style={[styles.statusIcon, { backgroundColor: `${statusColor}15` }]}>
              {statusIcon}
            </View>

            <View style={styles.jobInfo}>
              <Text style={styles.jobName}>{item.name}</Text>
              <Text style={styles.jobMeta}>
                {item.handler} · {item.priority}
              </Text>
            </View>
          </View>

          <View style={styles.jobRight}>
            <Text style={[styles.statusText, { color: statusColor }]}>
              {item.status}
            </Text>
            {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </View>
        </TouchableOpacity>

        {isExpanded && (
          <View style={styles.jobDetails}>
            <Text style={styles.detailText}>Handler: {item.handler}</Text>

            <View style={styles.jobActions}>
              {item.status === 'pending' && (
                <TouchableOpacity onPress={() => runJobNow(item.id)}>
                  <Play size={16} color={Colors.success} />
                </TouchableOpacity>
              )}

              <TouchableOpacity onPress={() => cancelJob(item.id)}>
                <Pause size={16} color={Colors.warning} />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={async () => {
                  await getJobLogs(item.id);
                  setSelectedJob(item);
                  setShowLogs(true);
                }}
              >
                <Terminal size={16} color={Colors.info} />
              </TouchableOpacity>

              <TouchableOpacity onPress={() => deleteJob(item.id)}>
                <Trash2 size={16} color={Colors.error} />
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <ChevronLeft size={24} />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Scheduler</Text>

        <TouchableOpacity onPress={() => setShowCreateModal(true)}>
          <Plus size={24} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView>
        <View style={styles.statsRow}>
          <Text>Pending: {pendingCount}</Text>
          <Text>Running: {runningCount}</Text>
          <Text>Failed: {failedCount}</Text>
          <Text>Done: {completedToday}</Text>
        </View>

        {jobs.map(job => (
          <View key={job.id}>
            {renderJobItem({ item: job })}
          </View>
        ))}
      </ScrollView>

      {showLogs && (
        <Modal visible transparent>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Logs</Text>
            <FlatList
              data={logs}
              keyExtractor={(i) => i.id}
              renderItem={({ item }) => (
                <Text>{item.status}</Text>
              )}
            />
            <TouchableOpacity onPress={() => setShowLogs(false)}>
              <Text>Close</Text>
            </TouchableOpacity>
          </View>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
  },
  headerTitle: { fontSize: 20, fontWeight: '700' },
  statsRow: { padding: 12, gap: 6 },
  jobCard: { padding: 12, borderWidth: 1, margin: 6 },
  jobHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  jobLeft: { flexDirection: 'row', gap: 10 },
  statusIcon: { width: 30, height: 30, borderRadius: 15 },
  jobInfo: {},
  jobName: { fontWeight: '600' },
  jobMeta: { fontSize: 12 },
  jobRight: { flexDirection: 'row', gap: 8 },
  statusText: { fontWeight: '700' },
  jobDetails: { padding: 10 },
  detailText: { fontSize: 12 },
  jobActions: { flexDirection: 'row', gap: 10, marginTop: 10 },
  modal: { flex: 1, backgroundColor: '#000000aa', padding: 20 },
  modalTitle: { fontSize: 18, fontWeight: '700' },
});
