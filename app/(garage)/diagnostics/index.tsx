// @ts-nocheck
import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useDiagnostics } from '@/lib/hooks/useDiagnostics';
import { useGarage } from '@/lib/hooks/useGarage';

const SEVERITY_COLORS = {
  critical: '#ef4444',
  warning: '#f59e0b',
  info: '#3b82f6',
};

const SYSTEM_ICONS: Record<string, string> = {
  engine: '🔧',
  transmission: '⚙️',
  abs: '🛑',
  airbag: '💥',
  emissions: '🌫️',
  hybrid: '🔋',
  ev: '⚡',
};

export default function DiagnosticsHubScreen() {
  const router = useRouter();
  const { myGarage, loadMyGarage } = useGarage();
  const {
    sessions,
    currentSession,
    isLoading,
    isScanning,
    isAnalyzing,
    error,
    obdProtocols,
    programmingCapabilities,
    createSession,
    loadSessions,
    loadSession,
    scanCodes,
    clearCodes,
    readLive,
    analyzeWithAsis,
    program,
    generateReport,
    shareWithCustomer,
    getCapabilities,
    clearError,
  } = useDiagnostics();

  const [vin, setVin] = useState('');
  const [licensePlate, setLicensePlate] = useState('');
  const [vehicleMake, setVehicleMake] = useState('');
  const [vehicleModel, setVehicleModel] = useState('');
  const [vehicleYear, setVehicleYear] = useState('');
  const [mileage, setMileage] = useState('');
  const [selectedProtocol, setSelectedProtocol] = useState('can_11bit_500k');
  const [activeTab, setActiveTab] = useState<'codes' | 'live' | 'asis' | 'program'>('codes');
  const [showNewSession, setShowNewSession] = useState(false);

  useEffect(() => {
    loadMyGarage().then(g => {
      if (g) loadSessions(g.id);
    });
  }, []);

  const handleCreateSession = useCallback(async () => {
    if (!myGarage) return;
    if (!vehicleMake || !vehicleModel) {
      Alert.alert('Required', 'Please enter vehicle make and model');
      return;
    }

    const session = await createSession({
      garage_id: myGarage.id,
      vehicle_make: vehicleMake,
      vehicle_model: vehicleModel,
      vehicle_year: parseInt(vehicleYear) || undefined,
      vin: vin || undefined,
      license_plate: licensePlate || undefined,
      mileage: parseFloat(mileage) || undefined,
      obd_protocol: selectedProtocol,
      fault_codes: [],
      live_data: {},
      freeze_frame: {},
      asis_analysis: {},
      programming_log: [],
      report_generated: false,
      shared_with_customer: false,
      metadata: {},
    });

    if (session) {
      setShowNewSession(false);
      setVin('');
      setLicensePlate('');
      setVehicleMake('');
      setVehicleModel('');
      setVehicleYear('');
      setMileage('');
    }
  }, [myGarage, vehicleMake, vehicleModel, vehicleYear, vin, licensePlate, mileage, selectedProtocol, createSession]);

  const handleScan = useCallback(async (sessionId: string) => {
    await scanCodes(sessionId);
  }, [scanCodes]);

  const handleReadLive = useCallback(async (sessionId: string) => {
    await readLive(sessionId);
  }, [readLive]);

  const handleAnalyze = useCallback(async (sessionId: string) => {
    await analyzeWithAsis(sessionId);
  }, [analyzeWithAsis]);

  const handleProgram = useCallback(async (sessionId: string, operation: any) => {
    const capabilities = getCapabilities(currentSession?.vehicle_make);
    if (!capabilities?.supported) {
      Alert.alert('Not Supported', capabilities?.message || 'Vehicle not in programming database');
      return;
    }
    await program(sessionId, operation);
    Alert.alert('Success', `${operation} completed successfully`);
  }, [program, getCapabilities, currentSession]);

  const handleGenerateReport = useCallback(async (sessionId: string) => {
    await generateReport(sessionId);
    Alert.alert('Report Generated', 'Diagnostic report has been saved and is ready to share.');
  }, [generateReport]);

  const handleShare = useCallback(async (sessionId: string) => {
    await shareWithCustomer(sessionId);
    Alert.alert('Shared', 'Diagnostic report has been shared with the customer.');
  }, [shareWithCustomer]);

  const capabilities = currentSession ? getCapabilities(currentSession.vehicle_make) : null;

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🔌 OBD-II Diagnostics</Text>
        <Text style={styles.headerSubtitle}>Connect, scan, analyze, program</Text>
      </View>

      {error && (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>⚠️ {error}</Text>
          <TouchableOpacity onPress={clearError}><Text style={styles.errorDismiss}>Dismiss</Text></TouchableOpacity>
        </View>
      )}

      {/* New Session Button */}
      {!showNewSession && (
        <TouchableOpacity style={styles.newSessionBtn} onPress={() => setShowNewSession(true)}>
          <Text style={styles.newSessionIcon}>➕</Text>
          <Text style={styles.newSessionText}>Start New Diagnostic Session</Text>
        </TouchableOpacity>
      )}

      {/* New Session Form */}
      {showNewSession && (
        <View style={styles.formCard}>
          <Text style={styles.formTitle}>🚗 Vehicle Information</Text>

          <View style={styles.row}>
            <View style={styles.flex1}>
              <Text style={styles.inputLabel}>Make *</Text>
              <TextInput style={styles.input} value={vehicleMake} onChangeText={setVehicleMake} placeholder="Toyota" placeholderTextColor="#475569" />
            </View>
            <View style={styles.flex1}>
              <Text style={styles.inputLabel}>Model *</Text>
              <TextInput style={styles.input} value={vehicleModel} onChangeText={setVehicleModel} placeholder="Corolla" placeholderTextColor="#475569" />
            </View>
          </View>

          <View style={styles.row}>
            <View style={styles.flex1}>
              <Text style={styles.inputLabel}>Year</Text>
              <TextInput style={styles.input} value={vehicleYear} onChangeText={setVehicleYear} placeholder="2020" placeholderTextColor="#475569" keyboardType="number-pad" />
            </View>
            <View style={styles.flex1}>
              <Text style={styles.inputLabel}>Mileage (km)</Text>
              <TextInput style={styles.input} value={mileage} onChangeText={setMileage} placeholder="50000" placeholderTextColor="#475569" keyboardType="number-pad" />
            </View>
          </View>

          <View style={styles.row}>
            <View style={styles.flex1}>
              <Text style={styles.inputLabel}>VIN</Text>
              <TextInput style={styles.input} value={vin} onChangeText={setVin} placeholder="JTDBU4EE3B9123456" placeholderTextColor="#475569" autoCapitalize="characters" />
            </View>
            <View style={styles.flex1}>
              <Text style={styles.inputLabel}>License Plate</Text>
              <TextInput style={styles.input} value={licensePlate} onChangeText={setLicensePlate} placeholder="KXX 123X" placeholderTextColor="#475569" autoCapitalize="characters" />
            </View>
          </View>

          <Text style={styles.inputLabel}>OBD Protocol</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.protocolRow}>
            {obdProtocols.map((p: any) => (
              <TouchableOpacity
                key={p.id}
                style={[styles.protocolChip, selectedProtocol === p.id && styles.protocolChipActive]}
                onPress={() => setSelectedProtocol(p.id)}
              >
                <Text style={[styles.protocolText, selectedProtocol === p.id && styles.protocolTextActive]}>{p.name}</Text>
                <Text style={styles.protocolSub}>{p.standard}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <View style={styles.formButtons}>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowNewSession(false)}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.createBtn} onPress={handleCreateSession} disabled={isLoading}>
              {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.createText}>Create Session</Text>}
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Session List */}
      {!currentSession && sessions.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📋 Recent Sessions</Text>
          {sessions.map((session: any) => (
            <TouchableOpacity
              key={session.id}
              style={styles.sessionCard}
              onPress={() => loadSession(session.id)}
            >
              <View style={styles.sessionHeader}>
                <Text style={styles.sessionVehicle}>{session.vehicle_make} {session.vehicle_model} {session.vehicle_year}</Text>
                <Text style={styles.sessionDate}>{new Date(session.created_at).toLocaleDateString()}</Text>
              </View>
              <Text style={styles.sessionMeta}>VIN: {session.vin || 'N/A'} · {session.obd_protocol}</Text>
              <View style={styles.sessionStats}>
                <Text style={styles.sessionStat}>🚨 {session.fault_codes?.length || 0} codes</Text>
                {session.asis_analysis?.severity_score > 0 && (
                  <Text style={[styles.sessionStat, { color: session.asis_analysis.severity_score > 7 ? '#ef4444' : '#f59e0b' }]}>
                    ⚠️ Severity: {session.asis_analysis.severity_score}/10
                  </Text>
                )}
                {session.report_generated && <Text style={styles.sessionStat}>📄 Report</Text>}
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Active Session Detail */}
      {currentSession && (
        <View style={styles.activeSession}>
          {/* Session Header */}
          <View style={styles.activeHeader}>
            <View>
              <Text style={styles.activeTitle}>{currentSession.vehicle_make} {currentSession.vehicle_model}</Text>
              <Text style={styles.activeMeta}>VIN: {currentSession.vin || 'N/A'} · {currentSession.obd_protocol}</Text>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={() => loadSession('')}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionRow}>
            <ActionBtn icon="🚨" label="Scan Codes" onPress={() => handleScan(currentSession.id)} loading={isScanning} />
            <ActionBtn icon="📊" label="Live Data" onPress={() => handleReadLive(currentSession.id)} loading={isLoading} />
            <ActionBtn icon="🤖" label="ASIS AI" onPress={() => handleAnalyze(currentSession.id)} loading={isAnalyzing} />
            <ActionBtn icon="📄" label="Report" onPress={() => handleGenerateReport(currentSession.id)} loading={isLoading} />
          </View>

          {/* Tabs */}
          <View style={styles.tabRow}>
            {(['codes', 'live', 'asis', 'program'] as const).map((tab: any) => (
              <TouchableOpacity
                key={tab}
                style={[styles.tab, activeTab === tab && styles.tabActive]}
                onPress={() => setActiveTab(tab)}
              >
                <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                  {tab === 'codes' ? '🚨 Fault Codes' : tab === 'live' ? '📊 Live Data' : tab === 'asis' ? '🤖 ASIS AI' : '💻 Programming'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Codes Tab */}
          {activeTab === 'codes' && (
            <View>
              {currentSession.fault_codes?.length === 0 ? (
                <View style={styles.emptyTab}>
                  <Text style={styles.emptyTabText}>
                    {isScanning ? 'Scanning...' : 'No fault codes. Tap Scan Codes to read DTCs.'}
                  </Text>
                  {isScanning && <ActivityIndicator color="#3b82f6" style={{ marginTop: 12 }} />}
                </View>
              ) : (
                <>
                  {currentSession.fault_codes.map((code: any, i: number) => (
                    <View key={i} style={[styles.codeCard, { borderLeftColor: SEVERITY_COLORS[code.severity] || '#64748b' }]}>
                      <View style={styles.codeHeader}>
                        <Text style={styles.codeId}>{code.code}</Text>
                        <View style={[styles.severityBadge, { backgroundColor: SEVERITY_COLORS[code.severity] + '30' }]}>
                          <Text style={[styles.severityText, { color: SEVERITY_COLORS[code.severity] }]}>{code.severity}</Text>
                        </View>
                      </View>
                      <Text style={styles.codeDescription}>{code.description}</Text>
                      <View style={styles.codeMeta}>
                        <Text style={styles.codeSystem}>{SYSTEM_ICONS[code.system] || '🔧'} {code.system}</Text>
                        {code.is_pending && <Text style={styles.codePending}>⏳ Pending</Text>}
                        {code.is_permanent && <Text style={styles.codePermanent}>🔒 Permanent</Text>}
                      </View>
                    </View>
                  ))}
                  <TouchableOpacity style={styles.clearBtn} onPress={() => clearCodes(currentSession.id)}>
                    <Text style={styles.clearText}>🗑️ Clear All Fault Codes</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          )}

          {/* Live Data Tab */}
          {activeTab === 'live' && (
            <View>
              {Object.keys(currentSession.live_data || {}).length === 0 ? (
                <View style={styles.emptyTab}>
                  <Text style={styles.emptyTabText}>
                    {isLoading ? 'Reading...' : 'No live data. Tap Live Data to read parameters.'}
                  </Text>
                  {isLoading && <ActivityIndicator color="#3b82f6" style={{ marginTop: 12 }} />}
                </View>
              ) : (
                Object.entries(currentSession.live_data).map(([key, value]) => (
                  <View key={key} style={styles.liveRow}>
                    <Text style={styles.liveLabel}>{formatParamName(key)}</Text>
                    <Text style={styles.liveValue}>{formatParamValue(key, value)}</Text>
                  </View>
                ))
              )}
            </View>
          )}

          {/* ASIS Tab */}
          {activeTab === 'asis' && (
            <View>
              {!currentSession.asis_analysis?.severity_score ? (
                <View style={styles.emptyTab}>
                  <Text style={styles.emptyTabText}>
                    {isAnalyzing ? 'ASIS is analyzing...' : 'Run ASIS AI analysis for intelligent diagnostics.'}
                  </Text>
                  {isAnalyzing && <ActivityIndicator color="#3b82f6" style={{ marginTop: 12 }} />}
                </View>
              ) : (
                <>
                  <View style={styles.asisScoreCard}>
                    <Text style={styles.asisScoreLabel}>Vehicle Health Score</Text>
                    <Text style={[styles.asisScoreValue, { color: getHealthColor(currentSession.asis_analysis.vehicle_health_score || 0) }]}>
                      {currentSession.asis_analysis.vehicle_health_score || 0}%
                    </Text>
                    <View style={styles.asisSeverityBar}>
                      <View style={[styles.asisSeverityFill, { width: `${(currentSession.asis_analysis.severity_score || 0) * 10}%`, backgroundColor: getSeverityColor(currentSession.asis_analysis.severity_score || 0) }]} />
                    </View>
                    <Text style={styles.asisSeverityLabel}>Severity: {currentSession.asis_analysis.severity_score}/10</Text>
                  </View>

                  {currentSession.asis_analysis.estimated_repair_cost > 0 && (
                    <View style={styles.asisCostCard}>
                      <Text style={styles.asisCostLabel}>Estimated Repair Cost</Text>
                      <Text style={styles.asisCostValue}>KES {currentSession.asis_analysis.estimated_repair_cost.toLocaleString()}</Text>
                    </View>
                  )}

                  {currentSession.asis_analysis.priority_actions?.length > 0 && (
                    <View style={styles.asisSection}>
                      <Text style={styles.asisSectionTitle}>🚨 Priority Actions</Text>
                      {currentSession.asis_analysis.priority_actions.map((action: string, i: number) => (
                        <Text key={i} style={styles.asisItem}>• {action}</Text>
                      ))}
                    </View>
                  )}

                  {currentSession.asis_analysis.recommendations?.length > 0 && (
                    <View style={styles.asisSection}>
                      <Text style={styles.asisSectionTitle}>💡 Recommendations</Text>
                      {currentSession.asis_analysis.recommendations.map((rec: string, i: number) => (
                        <Text key={i} style={styles.asisItem}>• {rec}</Text>
                      ))}
                    </View>
                  )}

                  {currentSession.asis_analysis.predicted_failures?.length > 0 && (
                    <View style={styles.asisSection}>
                      <Text style={styles.asisSectionTitle}>🔮 Predicted Failures</Text>
                      {currentSession.asis_analysis.predicted_failures.map((failure: string, i: number) => (
                        <Text key={i} style={styles.asisItemWarning}>⚠️ {failure}</Text>
                      ))}
                    </View>
                  )}

                  {currentSession.asis_analysis.maintenance_schedule?.length > 0 && (
                    <View style={styles.asisSection}>
                      <Text style={styles.asisSectionTitle}>📅 Maintenance Schedule</Text>
                      {currentSession.asis_analysis.maintenance_schedule.map((item: string, i: number) => (
                        <Text key={i} style={styles.asisItem}>• {item}</Text>
                      ))}
                    </View>
                  )}
                </>
              )}
            </View>
          )}

          {/* Programming Tab */}
          {activeTab === 'program' && (
            <View>
              {!capabilities?.supported ? (
                <View style={styles.emptyTab}>
                  <Text style={styles.emptyTabText}>{capabilities?.message || 'Enter vehicle make to see programming options.'}</Text>
                </View>
              ) : (
                <>
                  <View style={styles.capabilityCard}>
                    <Text style={styles.capabilityTitle}>💻 {currentSession.vehicle_make} Programming</Text>
                    <Text style={styles.capabilityNote}>{capabilities.special_notes}</Text>
                    <Text style={styles.capabilityProtocols}>Protocols: {capabilities.protocols.join(', ')}</Text>
                  </View>

                  {capabilities.operations.map((op: string) => (
                    <TouchableOpacity
                      key={op}
                      style={styles.programBtn}
                      onPress={() => {
                        Alert.alert(
                          'Confirm Programming',
                          `Run ${op.replace(/_/g, ' ')} on ${currentSession.vehicle_make} ${currentSession.vehicle_model}?`,
                          [
                            { text: 'Cancel', style: 'cancel' },
                            { text: 'Proceed', onPress: () => handleProgram(currentSession.id, op) },
                          ]
                        );
                      }}
                    >
                      <Text style={styles.programIcon}>🔧</Text>
                      <View style={styles.programInfo}>
                        <Text style={styles.programName}>{op.replace(/_/g, ' ').replace(/(^|\s)\w/g, l => l.toUpperCase())}</Text>
                        <Text style={styles.programDesc}>Requires {capabilities.protocols[0]} protocol</Text>
                      </View>
                      <Text style={styles.programArrow}>→</Text>
                    </TouchableOpacity>
                  ))}

                  {currentSession.programming_log?.length > 0 && (
                    <View style={styles.programLog}>
                      <Text style={styles.programLogTitle}>📋 Programming History</Text>
                      {currentSession.programming_log.map((log: any, i: number) => (
                        <View key={i} style={styles.programLogEntry}>
                          <Text style={styles.programLogOp}>{log.operation.replace(/_/g, ' ')}</Text>
                          <Text style={[styles.programLogStatus, { color: log.status === 'success' ? '#22c55e' : '#ef4444' }]}>
                            {log.status}
                          </Text>
                          <Text style={styles.programLogTime}>{new Date(log.timestamp).toLocaleTimeString()}</Text>
                        </View>
                      ))}
                    </View>
                  )}
                </>
              )}
            </View>
          )}

          {/* Share Report */}
          {currentSession.report_generated && (
            <TouchableOpacity style={styles.shareBtn} onPress={() => handleShare(currentSession.id)}>
              <Text style={styles.shareText}>📤 Share Report with Customer</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </ScrollView>
  );
}

function ActionBtn({ icon, label, onPress, loading }: { icon: string; label: string; onPress: () => void; loading?: boolean }) {
  return (
    <TouchableOpacity style={styles.actionBtn} onPress={onPress} disabled={loading}>
      {loading ? <ActivityIndicator color="#3b82f6" size="small" /> : <Text style={styles.actionBtnIcon}>{icon}</Text>}
      <Text style={styles.actionBtnLabel}>{loading ? '...' : label}</Text>
    </TouchableOpacity>
  );
}

function formatParamName(key: string): string {
  return key
    .replace(/_/g, ' ')
    .replace(/(^|\s)\w/g, l => l.toUpperCase())
    .replace(/Rpm/g, 'RPM')
    .replace(/Temp/g, 'Temperature')
    .replace(/Pos/g, 'Position')
    .replace(/Soc/g, 'State of Charge');
}

function formatParamValue(key: string, value: any): string {
  if (typeof value !== 'number') return String(value);
  if (key.includes('temp')) return `${value}°C`;
  if (key.includes('pressure')) return `${value} kPa`;
  if (key.includes('speed')) return `${value} km/h`;
  if (key.includes('rpm')) return `${Math.round(value)} RPM`;
  if (key.includes('voltage')) return `${value}V`;
  if (key.includes('pos') || key.includes('load') || key.includes('trim')) return `${value}%`;
  if (key.includes('distance')) return `${Math.round(value).toLocaleString()} km`;
  if (key.includes('soc')) return `${value}%`;
  return String(value);
}

function getHealthColor(score: number): string {
  if (score >= 80) return '#22c55e';
  if (score >= 50) return '#f59e0b';
  return '#ef4444';
}

function getSeverityColor(score: number): string {
  if (score <= 3) return '#22c55e';
  if (score <= 6) return '#f59e0b';
  return '#ef4444';
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  header: { padding: 20, paddingTop: 60 },
  headerTitle: { fontSize: 26, fontWeight: '800', color: '#fff' },
  headerSubtitle: { fontSize: 14, color: '#94a3b8', marginTop: 4 },

  errorBox: { backgroundColor: 'rgba(239,68,68,0.15)', borderRadius: 12, padding: 14, marginHorizontal: 16, marginBottom: 12, borderLeftWidth: 3, borderLeftColor: '#ef4444', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  errorText: { color: '#fca5a5', fontSize: 13, flex: 1 },
  errorDismiss: { color: '#3b82f6', fontSize: 12, fontWeight: '600' },

  newSessionBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1e3a5f', borderRadius: 14, padding: 16, marginHorizontal: 16, marginBottom: 16, borderWidth: 1, borderColor: '#3b82f6', borderStyle: 'dashed' },
  newSessionIcon: { fontSize: 20, marginRight: 12 },
  newSessionText: { color: '#3b82f6', fontSize: 15, fontWeight: '700' },

  formCard: { backgroundColor: '#1e293b', borderRadius: 16, padding: 18, marginHorizontal: 16, marginBottom: 16 },
  formTitle: { fontSize: 16, fontWeight: '700', color: '#e2e8f0', marginBottom: 14 },
  row: { flexDirection: 'row', gap: 12 },
  flex1: { flex: 1 },
  inputLabel: { fontSize: 11, fontWeight: '600', color: '#94a3b8', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 },
  input: { backgroundColor: '#0f172a', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, color: '#fff', fontSize: 14, borderWidth: 1, borderColor: '#334155', marginBottom: 12 },
  protocolRow: { flexDirection: 'row', marginBottom: 16 },
  protocolChip: { backgroundColor: '#0f172a', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, marginRight: 8, borderWidth: 1, borderColor: '#334155', minWidth: 120 },
  protocolChipActive: { borderColor: '#3b82f6', backgroundColor: '#1e3a5f' },
  protocolText: { color: '#94a3b8', fontSize: 12, fontWeight: '600' },
  protocolTextActive: { color: '#3b82f6' },
  protocolSub: { color: '#64748b', fontSize: 10, marginTop: 2 },
  formButtons: { flexDirection: 'row', gap: 12 },
  cancelBtn: { flex: 1, backgroundColor: '#334155', borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  cancelText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  createBtn: { flex: 2, backgroundColor: '#3b82f6', borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  createText: { color: '#fff', fontSize: 14, fontWeight: '700' },

  section: { paddingHorizontal: 16, marginBottom: 20 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#e2e8f0', marginBottom: 12 },

  sessionCard: { backgroundColor: '#1e293b', borderRadius: 12, padding: 14, marginBottom: 10 },
  sessionHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  sessionVehicle: { fontSize: 14, fontWeight: '700', color: '#fff' },
  sessionDate: { fontSize: 11, color: '#64748b' },
  sessionMeta: { fontSize: 12, color: '#94a3b8', marginBottom: 8 },
  sessionStats: { flexDirection: 'row', gap: 12 },
  sessionStat: { fontSize: 11, color: '#94a3b8' },

  activeSession: { marginHorizontal: 16 },
  activeHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  activeTitle: { fontSize: 18, fontWeight: '800', color: '#fff' },
  activeMeta: { fontSize: 12, color: '#94a3b8', marginTop: 2 },
  closeBtn: { backgroundColor: '#334155', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 },
  closeText: { color: '#fff', fontSize: 14, fontWeight: '700' },

  actionRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  actionBtn: { flex: 1, backgroundColor: '#1e293b', borderRadius: 12, paddingVertical: 12, alignItems: 'center', borderWidth: 1, borderColor: '#334155' },
  actionBtnIcon: { fontSize: 20, marginBottom: 4 },
  actionBtnLabel: { fontSize: 10, color: '#94a3b8', fontWeight: '600' },

  tabRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  tab: { flex: 1, backgroundColor: '#1e293b', borderRadius: 10, paddingVertical: 10, alignItems: 'center', borderWidth: 1, borderColor: '#334155' },
  tabActive: { backgroundColor: '#1e3a5f', borderColor: '#3b82f6' },
  tabText: { color: '#94a3b8', fontSize: 11, fontWeight: '600' },
  tabTextActive: { color: '#3b82f6' },

  emptyTab: { backgroundColor: '#1e293b', borderRadius: 12, padding: 30, alignItems: 'center' },
  emptyTabText: { color: '#64748b', fontSize: 13, textAlign: 'center' },

  codeCard: { backgroundColor: '#1e293b', borderRadius: 12, padding: 14, marginBottom: 10, borderLeftWidth: 3 },
  codeHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  codeId: { fontSize: 16, fontWeight: '800', color: '#fff', fontFamily: 'monospace' },
  severityBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  severityText: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase' },
  codeDescription: { fontSize: 13, color: '#cbd5e1', marginBottom: 8 },
  codeMeta: { flexDirection: 'row', gap: 12 },
  codeSystem: { fontSize: 11, color: '#94a3b8' },
  codePending: { fontSize: 11, color: '#f59e0b' },
  codePermanent: { fontSize: 11, color: '#ef4444' },
  clearBtn: { backgroundColor: 'rgba(239,68,68,0.15)', borderRadius: 10, padding: 12, alignItems: 'center', marginTop: 8, borderWidth: 1, borderColor: '#ef4444' },
  clearText: { color: '#fca5a5', fontSize: 13, fontWeight: '700' },

  liveRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#1e293b', borderRadius: 10, padding: 12, marginBottom: 8 },
  liveLabel: { fontSize: 13, color: '#94a3b8' },
  liveValue: { fontSize: 14, fontWeight: '700', color: '#fff', fontFamily: 'monospace' },

  asisScoreCard: { backgroundColor: '#1e293b', borderRadius: 16, padding: 20, alignItems: 'center', marginBottom: 14 },
  asisScoreLabel: { fontSize: 13, color: '#94a3b8', marginBottom: 8 },
  asisScoreValue: { fontSize: 48, fontWeight: '800' },
  asisSeverityBar: { width: '100%', height: 6, backgroundColor: '#334155', borderRadius: 3, marginTop: 12, overflow: 'hidden' },
  asisSeverityFill: { height: '100%', borderRadius: 3 },
  asisSeverityLabel: { fontSize: 12, color: '#94a3b8', marginTop: 8 },

  asisCostCard: { backgroundColor: '#1e293b', borderRadius: 12, padding: 16, marginBottom: 14, alignItems: 'center' },
  asisCostLabel: { fontSize: 12, color: '#94a3b8' },
  asisCostValue: { fontSize: 24, fontWeight: '800', color: '#f59e0b', marginTop: 4 },

  asisSection: { backgroundColor: '#1e293b', borderRadius: 12, padding: 14, marginBottom: 10 },
  asisSectionTitle: { fontSize: 14, fontWeight: '700', color: '#e2e8f0', marginBottom: 8 },
  asisItem: { fontSize: 13, color: '#cbd5e1', marginBottom: 6, lineHeight: 20 },
  asisItemWarning: { fontSize: 13, color: '#f59e0b', marginBottom: 6, lineHeight: 20 },

  capabilityCard: { backgroundColor: '#1e293b', borderRadius: 12, padding: 14, marginBottom: 14 },
  capabilityTitle: { fontSize: 15, fontWeight: '700', color: '#fff', marginBottom: 6 },
  capabilityNote: { fontSize: 12, color: '#94a3b8', marginBottom: 8, fontStyle: 'italic' },
  capabilityProtocols: { fontSize: 11, color: '#64748b' },

  programBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1e293b', borderRadius: 12, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: '#334155' },
  programIcon: { fontSize: 22, marginRight: 12 },
  programInfo: { flex: 1 },
  programName: { fontSize: 14, fontWeight: '700', color: '#fff' },
  programDesc: { fontSize: 11, color: '#64748b', marginTop: 2 },
  programArrow: { color: '#3b82f6', fontSize: 18, fontWeight: '700' },

  programLog: { backgroundColor: '#1e293b', borderRadius: 12, padding: 14, marginTop: 10 },
  programLogTitle: { fontSize: 14, fontWeight: '700', color: '#e2e8f0', marginBottom: 10 },
  programLogEntry: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#334155' },
  programLogOp: { fontSize: 12, color: '#cbd5e1', flex: 1 },
  programLogStatus: { fontSize: 11, fontWeight: '700', marginRight: 12 },
  programLogTime: { fontSize: 10, color: '#64748b' },

  shareBtn: { backgroundColor: '#1e3a5f', borderRadius: 12, padding: 14, alignItems: 'center', marginTop: 16, borderWidth: 1, borderColor: '#3b82f6' },
  shareText: { color: '#3b82f6', fontSize: 14, fontWeight: '700' },
});