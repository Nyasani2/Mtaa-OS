// @ts-nocheck
import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ActivityIndicator, 
  Alert,
  ScrollView,
  RefreshControl 
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAttendance } from '@/lib/health/hooks/useAttendance';
import { supabase } from '@/lib/supabase';

export default function AttendanceScreen() {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  
  // Hardcoded facility location (replace with dynamic data from your facility)
  // Example: Nairobi Hospital coordinates
  const FACILITY_LAT = -1.2921;
  const FACILITY_LNG = 36.8219;
  const FACILITY_ID = 'your-facility-id-here'; // Replace with actual facility ID
  
  const { 
    currentStatus, 
    loading, 
    error, 
    clockIn, 
    clockOut,
    todayRecord 
  } = useAttendance(FACILITY_ID, FACILITY_LAT, FACILITY_LNG, 150);

  const handleClockAction = async () => {
    if (currentStatus === 'clocked_in') {
      const result = await clockOut();
      if (result?.success) {
        Alert.alert('Success', result.message);
      }
    } else {
      const result = await clockIn();
      if (result?.success) {
        Alert.alert('Success', result.message);
      }
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setRefreshing(false);
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const formatDuration = (start: string, end: string | null) => {
    if (!end) return 'Still working';
    const diff = new Date(end).getTime() - new Date(start).getTime();
    const hours = Math.floor(diff / 3600000);
    const minutes = Math.floor((diff % 3600000) / 60000);
    return `${hours}h ${minutes}m`;
  };

  if (loading && currentStatus === 'loading') {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>Loading attendance status...</Text>
      </View>
    );
  }

  const isClockedIn = currentStatus === 'clocked_in';

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Attendance</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Status Card */}
      <View style={[styles.statusCard, isClockedIn ? styles.clockedIn : styles.clockedOut]}>
        <Ionicons 
          name={isClockedIn ? 'checkmark-circle' : 'log-out'} 
          size={64} 
          color="#fff" 
        />
        <Text style={styles.statusText}>
          {isClockedIn ? 'Clocked In' : 'Clocked Out'}
        </Text>
        <Text style={styles.statusSubtext}>
          {isClockedIn 
            ? `Since ${todayRecord ? formatTime(todayRecord.clock_in_time) : '...'}`
            : 'Tap button to clock in'
          }
        </Text>
      </View>

      {/* Error Message */}
      {error && (
        <View style={styles.errorCard}>
          <Ionicons name="alert-circle" size={20} color="#ef4444" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {/* Clock Action Button */}
      <TouchableOpacity 
        style={[styles.actionButton, isClockedIn ? styles.clockOutBtn : styles.clockInBtn]}
        onPress={handleClockAction}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <>
            <Ionicons 
              name={isClockedIn ? 'log-out-outline' : 'log-in-outline'} 
              size={28} 
              color="#fff" 
            />
            <Text style={styles.actionButtonText}>
              {isClockedIn ? 'Clock Out' : 'Clock In'}
            </Text>
          </>
        )}
      </TouchableOpacity>

      {/* Today's Record */}
      {todayRecord && (
        <View style={styles.recordCard}>
          <Text style={styles.recordTitle}>Today's Attendance</Text>
          
          <View style={styles.recordRow}>
            <View style={styles.recordItem}>
              <Ionicons name="time" size={20} color="#3b82f6" />
              <Text style={styles.recordLabel}>Clock In</Text>
              <Text style={styles.recordValue}>{formatTime(todayRecord.clock_in_time)}</Text>
            </View>
            
            <View style={styles.recordItem}>
              <Ionicons name="time" size={20} color="#10b981" />
              <Text style={styles.recordLabel}>Clock Out</Text>
              <Text style={styles.recordValue}>
                {todayRecord.clock_out_time ? formatTime(todayRecord.clock_out_time) : '-'}
              </Text>
            </View>
          </View>

          <View style={styles.durationCard}>
            <Ionicons name="hourglass" size={20} color="#f59e0b" />
            <Text style={styles.durationText}>
              Duration: {formatDuration(todayRecord.clock_in_time, todayRecord.clock_out_time)}
            </Text>
          </View>
        </View>
      )}

      {/* Info Card */}
      <View style={styles.infoCard}>
        <Ionicons name="information-circle" size={20} color="#3b82f6" />
        <Text style={styles.infoText}>
          You must be within 150 meters of the facility to clock in or out.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0f172a',
  },
  loadingText: {
    color: '#94a3b8',
    marginTop: 16,
    fontSize: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingTop: 50,
    backgroundColor: '#1e293b',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  statusCard: {
    margin: 16,
    padding: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clockedIn: {
    backgroundColor: '#10b981',
  },
  clockedOut: {
    backgroundColor: '#64748b',
  },
  statusText: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
    marginTop: 16,
  },
  statusSubtext: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    marginTop: 8,
  },
  errorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#fee2e2',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  errorText: {
    flex: 1,
    color: '#dc2626',
    marginLeft: 8,
    fontSize: 14,
  },
  actionButton: {
    margin: 16,
    padding: 20,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  clockInBtn: {
    backgroundColor: '#3b82f6',
  },
  clockOutBtn: {
    backgroundColor: '#ef4444',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  recordCard: {
    margin: 16,
    padding: 20,
    backgroundColor: '#1e293b',
    borderRadius: 12,
  },
  recordTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  recordRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  recordItem: {
    alignItems: 'center',
  },
  recordLabel: {
    color: '#94a3b8',
    fontSize: 12,
    marginTop: 4,
  },
  recordValue: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 4,
  },
  durationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    padding: 12,
    backgroundColor: '#0f172a',
    borderRadius: 8,
  },
  durationText: {
    color: '#fff',
    fontSize: 14,
    marginLeft: 8,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    margin: 16,
    padding: 12,
    backgroundColor: 'rgba(59,130,246,0.1)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(59,130,246,0.2)',
  },
  infoText: {
    flex: 1,
    color: '#94a3b8',
    marginLeft: 8,
    fontSize: 13,
    lineHeight: 18,
  },
});
