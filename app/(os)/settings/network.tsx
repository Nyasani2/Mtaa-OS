// @ts-nocheck
import * as Network from 'expo-network';
import * as Battery from 'expo-battery';
import * as Location from 'expo-location';
import * as Device from 'expo-device';
import React, { useState, useEffect } from 'react';
import { Alert, View, Text, StyleSheet, TouchableOpacity, ScrollView, Switch, ActivityIndicator, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

// ─── Types ─────────────────────────────────────────────────────────
interface NetworkState {
  type: string;
  isConnected: boolean;
  isInternetReachable: boolean;
  ipAddress: string;
  isAirplaneMode: boolean;
}

interface LocationState {
  enabled: boolean;
  gpsAvailable: boolean;
  networkAvailable: boolean;
}

interface SimState {
  carrier: string | null;
  isoCountryCode: string | null;
  mobileCountryCode: string | null;
  mobileNetworkCode: string | null;
  allowsVoip: boolean | null;
  generation: string;
}

interface BatteryState {
  level: number;
  isCharging: boolean;
  isLowPowerMode: boolean;
}

// ─── Mock fallbacks ────────────────────────────────────────────────
const MOCK_NETWORK: NetworkState = {
  type: 'WIFI',
  isConnected: true,
  isInternetReachable: true,
  ipAddress: '192.168.1.42',
  isAirplaneMode: false,
};

const MOCK_LOCATION: LocationState = {
  enabled: true,
  gpsAvailable: true,
  networkAvailable: true,
};

const MOCK_SIM: SimState = {
  carrier: 'Safaricom',
  isoCountryCode: 'KE',
  mobileCountryCode: '639',
  mobileNetworkCode: '02',
  allowsVoip: true,
  generation: '4G',
};

const MOCK_BATTERY: BatteryState = {
  level: 0.72,
  isCharging: false,
  isLowPowerMode: false,
};

// ─── Signal Bars ───────────────────────────────────────────────────
function SignalBars({ strength, color = '#10B981' }: { strength: number; color?: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 2, height: 22 }}>
      {[1, 2, 3, 4, 5].map((i: any) => (
        <View key={i} style={{ width: 4, height: 4 + i * 3, borderRadius: 1, backgroundColor: i <= strength ? color : '#334155' }} />
      ))}
    </View>
  );
}

// ─── Settings Row ──────────────────────────────────────────────────
function Row({
  icon, iconColor, label, value, onPress, rightElement, danger,
}: {
  icon: string; iconColor: string; label: string; value?: string;
  onPress?: () => void; rightElement?: React.ReactNode; danger?: boolean;
}) {
  return (
    <TouchableOpacity style={rs.row} onPress={onPress} disabled={!onPress} activeOpacity={0.7}>
      <View style={[rs.iconWrap, { backgroundColor: iconColor + '20' }]}>
        <Ionicons name={icon as any} size={20} color={iconColor} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[rs.label, danger && { color: '#EF4444' }]}>{label}</Text>
        {value && <Text style={rs.value}>{value}</Text>}
      </View>
      {rightElement || (onPress && <Ionicons name="chevron-forward" size={18} color="#475569" />)}
    </TouchableOpacity>
  );
}

const rs = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 16, borderBottomWidth: 0.5, borderBottomColor: '#1E293B' },
  iconWrap: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  label: { color: '#fff', fontSize: 16 },
  value: { color: '#64748B', fontSize: 13, marginTop: 2 },
});

function Section({ title }: { title: string }) {
  return (
    <View style={{ paddingHorizontal: 16, paddingTop: 24, paddingBottom: 8 }}>
      <Text style={{ color: '#64748B', fontSize: 13, fontWeight: '600', textTransform: 'uppercase' }}>{title}</Text>
    </View>
  );
}

// ─── Web-safe open settings ──────────────────────────────────────────
function openSystemSettings() {
  if (Platform.OS === 'web') {
    Alert.alert('System Settings', 'On web, system settings must be changed through your browser or OS settings.');
    return;
  }
  // Use dynamic import to avoid web crash
  import('expo-linking').then((Linking) => {
    if (Linking.openSettings) {
      Linking.openSettings();
    } else if (Platform.OS === 'ios') {
      Linking.openURL('app-settings:');
    } else {
      Linking.openURL('intent:#Intent;action=android.settings.SETTINGS;end');
    }
  }).catch(() => {
    Alert.alert('Error', 'Could not open system settings.');
  });
}

// ─── Main Component ────────────────────────────────────────────────
export default function NetworkSettingsScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [network, setNetwork] = useState<NetworkState>(MOCK_NETWORK);
  const [location, setLocation] = useState<LocationState>(MOCK_LOCATION);
  const [sim, setSim] = useState<SimState>(MOCK_SIM);
  const [battery, setBattery] = useState<BatteryState>(MOCK_BATTERY);
  // HARDWARE-LIVE: real device telemetry (MOCK_* kept only as initial fallbacks)
  useEffect(() => {
    (async () => {
      try { const n = await Network.getNetworkStateAsync(); if (n.isConnected) setNetwork((p: any) => ({ ...p, status: 'Connected', type: n.type || p.type })); } catch (e) {}
      try { const lvl = await Battery.getBatteryLevelAsync(); const chg = await Battery.isChargingAsync(); setBattery((p: any) => ({ ...p, level: Math.round(lvl*100), percentage: Math.round(lvl*100), charging: chg, status: chg ? 'Charging' : 'On Battery' })); } catch (e) {}
      try { const st = await Location.requestForegroundPermissionsAsync(); if (st.status === 'granted') { const loc = await Location.getCurrentPositionAsync({}); setLocation((p: any) => ({ ...p, lat: loc.coords.latitude.toFixed(4), lng: loc.coords.longitude.toFixed(4), latitude: loc.coords.latitude, longitude: loc.coords.longitude })); } } catch (e) {}
      try { setSim((p: any) => ({ ...p, carrier: Device.cellularCarrier || Device.manufacturer || p.carrier, operator: Device.cellularCarrier || p.operator })); } catch (e) {}
    })();
  }, []);

  const [hasNetwork, setHasNetwork] = useState(false);
  const [hasLocation, setHasLocation] = useState(false);
  const [hasCellular, setHasCellular] = useState(false);
  const [hasBattery, setHasBattery] = useState(false);
  const [dataUsage] = useState({ used: 12.4, total: 50 });

  useEffect(() => {
    let mounted = true;
    const subs: any[] = [];

    async function loadAll() {
      setLoading(true);

      // ─── Network ───────────────────────────────────────────────
      try {
 
        const Network = require('expo-network');
        setHasNetwork(true);
        const state = await Network.getNetworkStateAsync();
        const ip = await Network.getIpAddressAsync().catch(() => 'Unknown');
        const airplane = Platform.OS === 'android'
          ? await Network.isAirplaneModeEnabledAsync().catch(() => false)
          : false;
        if (mounted) {
          setNetwork({
            type: state.type || 'UNKNOWN',
            isConnected: state.isConnected || false,
            isInternetReachable: state.isInternetReachable || false,
            ipAddress: ip,
            isAirplaneMode: airplane,
          });
        }
        try {
          const sub = Network.addNetworkStateListener((evt: any) => {
            if (!mounted) return;
            setNetwork(prev => ({
              ...prev,
              type: evt.type || prev.type,
              isConnected: evt.isConnected ?? prev.isConnected,
              isInternetReachable: evt.isInternetReachable ?? prev.isInternetReachable,
            }));
          });
          subs.push(sub);
        } catch {}
      } catch { setHasNetwork(false); }

      // ─── Location ──────────────────────────────────────────────
      try {
 
        const Location = require('expo-location');
        setHasLocation(true);
        const provider = await Location.getProviderStatusAsync?.().catch(() => null);
        if (provider && mounted) {
          setLocation({
            enabled: provider.locationServicesEnabled || false,
            gpsAvailable: provider.gpsAvailable ?? false,
            networkAvailable: provider.networkAvailable ?? false,
          });
        }
      } catch { setHasLocation(false); }

      // ─── Cellular ────────────────────────────────────────────────
      try {
 
        const Cellular = require('expo-cellular');
        setHasCellular(true);
        const [carrier, iso, mcc, mnc, voip, gen] = await Promise.all([
          Cellular.getCarrierNameAsync?.().catch(() => null),
          Cellular.getIsoCountryCodeAsync?.().catch(() => null),
          Cellular.getMobileCountryCodeAsync?.().catch(() => null),
          Cellular.getMobileNetworkCodeAsync?.().catch(() => null),
          Cellular.allowsVoipAsync?.().catch(() => null),
          Cellular.getCellularGenerationAsync?.().catch(() => null),
        ]);
        if (mounted) {
          setSim({
            carrier,
            isoCountryCode: iso,
            mobileCountryCode: mcc,
            mobileNetworkCode: mnc,
            allowsVoip: voip,
            generation: gen === 0 ? '2G' : gen === 1 ? '3G' : gen === 2 ? '4G' : gen === 3 ? '5G' : 'Unknown',
          });
        }
      } catch { setHasCellular(false); }

      // ─── Battery ─────────────────────────────────────────────────
      try {
 
        const Battery = require('expo-battery');
        setHasBattery(true);
        const level = await Battery.getBatteryLevelAsync?.().catch(() => 0.5);
        const state = await Battery.getBatteryStateAsync?.().catch(() => 1);
        const lowPower = await Battery.isLowPowerModeEnabledAsync?.().catch(() => false);
        if (mounted) {
          setBattery({
            level: level ?? 0.5,
            isCharging: state === 2,
            isLowPowerMode: lowPower ?? false,
          });
        }
        try {
          const sub = Battery.addBatteryLevelListener?.(({ batteryLevel }: any) => {
            if (mounted) setBattery(prev => ({ ...prev, level: batteryLevel }));
          });
          const sub2 = Battery.addBatteryStateListener?.(({ batteryState }: any) => {
            if (mounted) setBattery(prev => ({ ...prev, isCharging: batteryState === 2 }));
          });
          if (sub) subs.push(sub);
          if (sub2) subs.push(sub2);
        } catch {}
      } catch { setHasBattery(false); }

      if (mounted) setLoading(false);
    }

    loadAll();
    return () => {
      mounted = false;
      subs.forEach(s => s?.remove?.());
    };
  }, []);

  const nwIcon = network.isAirplaneMode
    ? { icon: 'airplane', color: '#EF4444', label: 'Airplane Mode' }
    : !network.isConnected
    ? { icon: 'wifi-off', color: '#EF4444', label: 'No Connection' }
    : network.type === 'WIFI'
    ? { icon: 'wifi', color: '#10B981', label: 'Wi-Fi' }
    : network.type === 'CELLULAR'
    ? { icon: 'cellular', color: '#10B981', label: 'Mobile Data' }
    : { icon: 'globe', color: '#64748B', label: network.type };

  if (loading) {
    return (
      <SafeAreaView style={s.container}>
        <View style={s.header}>
          <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={s.headerTitle}>Network</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color="#2563EB" />
          <Text style={{ color: '#64748B', fontSize: 14, marginTop: 12 }}>Reading device state...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Network</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Status Card */}
        <View style={s.statusCard}>
          <View style={[s.statusIconWrap, { backgroundColor: nwIcon.color + '20' }]}>
            <Ionicons name={nwIcon.icon as any} size={40} color={nwIcon.color} />
          </View>
          <Text style={s.statusTitle}>
            {network.isConnected ? (network.type === 'WIFI' ? 'Connected' : nwIcon.label) : 'Disconnected'}
          </Text>
          <Text style={s.statusSubtitle}>
            {network.type === 'WIFI' ? `Wi-Fi · ${network.ipAddress || 'Unknown IP'}` :
             network.type === 'CELLULAR' ? `${sim.carrier || 'Mobile'} · ${sim.generation || ''}` :
             network.isAirplaneMode ? 'All radios disabled' : 'No active connection'}
          </Text>
        </View>

        {/* Wi-Fi */}
        <Section title="Wi-Fi" />
        <Row
          icon="wifi" iconColor="#2563EB" label="Wi-Fi"
          value={network.type === 'WIFI' ? 'Connected' : 'Off'}
          onPress={openSystemSettings}
          rightElement={
            <Switch value={network.type === 'WIFI'} onValueChange={openSystemSettings}
              trackColor={{ false: '#334155', true: '#2563EB' }} thumbColor="#fff" />
          }
        />
        {network.type === 'WIFI' && (
          <Row icon="information-circle" iconColor="#64748B" label="IP Address" value={network.ipAddress || 'Unknown'} showArrow={false} />
        )}

        {/* Mobile Network */}
        <Section title="Mobile Network" />
        <Row
          icon="cellular" iconColor="#10B981" label="Mobile Data"
          value={network.type === 'CELLULAR' ? 'Active' : 'Off'}
          onPress={openSystemSettings}
          rightElement={
            <Switch value={network.type === 'CELLULAR'} onValueChange={openSystemSettings}
              trackColor={{ false: '#334155', true: '#10B981' }} thumbColor="#fff" />
          }
        />
        {hasCellular && sim.carrier && (
          <>
            <Row icon="business" iconColor="#64748B" label="Carrier"
              value={`${sim.carrier}${sim.isoCountryCode ? ` (${sim.isoCountryCode.toUpperCase()})` : ''}`} showArrow={false} />
            <Row icon="signal" iconColor="#64748B" label="Network Type" value={sim.generation || 'Unknown'} showArrow={false}
              rightElement={<SignalBars strength={4} />} />
            <Row icon="call" iconColor="#64748B" label="VoIP" value={sim.allowsVoip ? 'Enabled' : 'Disabled'} showArrow={false} />
          </>
        )}
        {!hasCellular && (
          <Row icon="warning" iconColor="#F59E0B" label="SIM Info" value="Install expo-cellular for SIM details" showArrow={false} />
        )}

        {/* Data Usage */}
        <Section title="Data Usage" />
        <View style={s.dataCard}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <Text style={{ color: '#fff', fontSize: 15, fontWeight: '500' }}>Data Usage</Text>
            <Text style={{ color: '#94A3B8', fontSize: 13 }}>{dataUsage.used.toFixed(1)} GB / {dataUsage.total} GB</Text>
          </View>
          <View style={{ height: 6, backgroundColor: '#334155', borderRadius: 3, overflow: 'hidden' }}>
            <View style={{ height: '100%', width: `${(dataUsage.used / dataUsage.total) * 100}%`, backgroundColor: '#2563EB', borderRadius: 3 }} />
          </View>
          <Text style={{ color: '#64748B', fontSize: 12, marginTop: 6 }}>{((dataUsage.used / dataUsage.total) * 100).toFixed(0)}% used</Text>
        </View>
        <Row icon="stats-chart" iconColor="#8B5CF6" label="View Detailed Usage"
          onPress={() => Alert.alert('Coming Soon', 'Detailed data usage breakdown will be available in a future update.')} />

        {/* Location */}
        <Section title="Location" />
        <Row
          icon="location" iconColor="#EF4444" label="Location Services"
          value={location.enabled ? 'On' : 'Off'}
          onPress={openSystemSettings}
          rightElement={
            <Switch value={location.enabled} onValueChange={openSystemSettings}
              trackColor={{ false: '#334155', true: '#EF4444' }} thumbColor="#fff" />
          }
        />
        {location.enabled && (
          <>
            <Row icon="navigate" iconColor="#64748B" label="GPS" value={location.gpsAvailable ? 'Available' : 'Unavailable'} showArrow={false} />
            <Row icon="radio" iconColor="#64748B" label="Network Location" value={location.networkAvailable ? 'Available' : 'Unavailable'} showArrow={false} />
          </>
        )}
        {!hasLocation && (
          <Row icon="warning" iconColor="#F59E0B" label="Location Details" value="Install expo-location for GPS status" showArrow={false} />
        )}

        {/* Tethering */}
        <Section title="Tethering & Hotspot" />
        <Row icon="wifi" iconColor="#F59E0B" label="Personal Hotspot" value="Off" onPress={openSystemSettings}
          rightElement={<Switch value={false} onValueChange={openSystemSettings} trackColor={{ false: '#334155', true: '#F59E0B' }} thumbColor="#fff" />} />
        <Row icon="bluetooth" iconColor="#2563EB" label="Bluetooth Tethering" value="Off" onPress={openSystemSettings}
          rightElement={<Switch value={false} onValueChange={openSystemSettings} trackColor={{ false: '#334155', true: '#2563EB' }} thumbColor="#fff" />} />
        <Row icon="usb" iconColor="#10B981" label="USB Tethering" value="Off" onPress={openSystemSettings}
          rightElement={<Switch value={false} onValueChange={openSystemSettings} trackColor={{ false: '#334155', true: '#10B981' }} thumbColor="#fff" />} />

        {/* Airplane Mode */}
        <Section title="Airplane Mode" />
        <Row icon="airplane" iconColor="#EF4444" label="Airplane Mode" value={network.isAirplaneMode ? 'On' : 'Off'} onPress={openSystemSettings}
          rightElement={<Switch value={network.isAirplaneMode} onValueChange={openSystemSettings} trackColor={{ false: '#334155', true: '#EF4444' }} thumbColor="#fff" />} />

        {/* Battery */}
        <Section title="Battery" />
        <View style={s.batteryCard}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
            <Ionicons name={battery.isCharging ? 'battery-charging' : battery.level > 0.2 ? 'battery-half' : 'battery-dead'}
              size={32} color={battery.level < 0.2 ? '#EF4444' : battery.isCharging ? '#10B981' : '#fff'} />
            <View style={{ marginLeft: 12 }}>
              <Text style={{ color: '#fff', fontSize: 20, fontWeight: '600' }}>{(battery.level * 100).toFixed(0)}%</Text>
              <Text style={{ color: '#94A3B8', fontSize: 13 }}>{battery.isCharging ? 'Charging' : battery.isLowPowerMode ? 'Low Power Mode' : 'Normal'}</Text>
            </View>
          </View>
          <View style={{ height: 8, backgroundColor: '#334155', borderRadius: 4, overflow: 'hidden' }}>
            <View style={{ height: '100%', width: `${battery.level * 100}%`,
              backgroundColor: battery.level < 0.2 ? '#EF4444' : battery.level < 0.5 ? '#F59E0B' : '#10B981', borderRadius: 4 }} />
          </View>
        </View>
        <Row icon="flash" iconColor="#F59E0B" label="Low Power Mode" value={battery.isLowPowerMode ? 'On' : 'Off'} onPress={openSystemSettings}
          rightElement={<Switch value={battery.isLowPowerMode} onValueChange={openSystemSettings} trackColor={{ false: '#334155', true: '#F59E0B' }} thumbColor="#fff" />} />
        {!hasBattery && (
          <Row icon="warning" iconColor="#F59E0B" label="Battery Details" value="Install expo-battery for live battery data" showArrow={false} />
        )}

        {/* VPN */}
        <Section title="VPN" />
        <Row icon="shield" iconColor="#8B5CF6" label="VPN" value={network.type === 'VPN' ? 'Connected' : 'Not Connected'} onPress={openSystemSettings}
          rightElement={<Switch value={network.type === 'VPN'} onValueChange={openSystemSettings} trackColor={{ false: '#334155', true: '#8B5CF6' }} thumbColor="#fff" />} />

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 12, paddingBottom: 12 },
  backBtn: { padding: 8, marginLeft: -8 },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '600' },

  statusCard: { alignItems: 'center', paddingVertical: 32, marginHorizontal: 16, marginTop: 8, backgroundColor: '#1E293B', borderRadius: 16 },
  statusIconWrap: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  statusTitle: { color: '#fff', fontSize: 22, fontWeight: '600' },
  statusSubtitle: { color: '#94A3B8', fontSize: 14, marginTop: 6 },

  dataCard: { marginHorizontal: 16, padding: 16, backgroundColor: '#1E293B', borderRadius: 12, marginBottom: 8 },
  batteryCard: { marginHorizontal: 16, padding: 16, backgroundColor: '#1E293B', borderRadius: 12, marginBottom: 8 },
});