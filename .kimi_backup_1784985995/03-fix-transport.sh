#!/bin/bash
# 03-fix-transport.sh — MTruck + MTaxi stubs
cd ~/MTAA_OS_V10
set -e

echo "=== FIX 3: MTRUCK + MTAXI ==="

# MTruck types
mkdir -p lib/mtruck
cat > lib/mtruck/types.ts << 'EOF'
export interface Truck {
  id: string; owner_id: string; plate_number: string; capacity: number;
  type: string; status: string; location?: string; created_at: string;
}
export interface Driver {
  id: string; user_id: string; license_number: string; rating: number;
  status: string; verified: boolean; created_at: string;
}
export interface Load {
  id: string; shipper_id: string; origin: string; destination: string;
  weight: number; status: string; price: number; created_at: string;
}
export interface Route {
  id: string; truck_id: string; origin: string; destination: string;
  distance: number; estimated_time: number; status: string;
}
export interface FleetAlert {
  id: string; fleet_id: string; type: string; message: string; severity: string; created_at: string;
}
export interface MaintenanceRecord {
  id: string; truck_id: string; type: string; cost: number; status: string; scheduled_date: string;
}
export interface FuelRecord {
  id: string; truck_id: string; liters: number; cost: number; station: string; created_at: string;
}
export interface DispatchOrder {
  id: string; load_id: string; truck_id: string; driver_id: string; status: string; created_at: string;
}
export interface TrackingEvent {
  id: string; truck_id: string; lat: number; lng: number; speed: number; recorded_at: string;
}
export interface FreightListing {
  id: string; shipper_id: string; title: string; description: string; budget: number; status: string;
}
export interface TruckDocument {
  id: string; truck_id: string; type: string; file_url: string; expiry_date: string;
}
export interface IncidentReport {
  id: string; truck_id: string; driver_id: string; type: string; description: string; created_at: string;
}
export interface FleetMessage {
  id: string; fleet_id: string; sender_id: string; content: string; created_at: string;
}
export interface Address {
  id: string; user_id: string; label: string; lat: number; lng: number; full_address: string;
}
EOF
echo "  ✓ lib/mtruck/types.ts"

# MTruck services
mkdir -p lib/mtruck/services
for svc in fleet-service tracking-service dispatch-service marketplace-service addressService inspectionService incidentService messageService locationService; do
  cat > lib/mtruck/services/${svc}.ts << SVC_EOF
import { supabase } from '@/lib/supabase';
import type { Truck, Driver, Load, Route } from '@/lib/mtruck/types';

export async function list() {
  const { data, error } = await supabase.from('mtruck_trucks').select('*').limit(50);
  if (error) throw error;
  return data || [];
}
export async function getById(id: string) {
  const { data, error } = await supabase.from('mtruck_trucks').select('*').eq('id', id).single();
  if (error) throw error;
  return data;
}
export async function create(payload: any) {
  const { data, error } = await supabase.from('mtruck_trucks').insert(payload).select().single();
  if (error) throw error;
  return data;
}
export async function update(id: string, payload: any) {
  const { data, error } = await supabase.from('mtruck_trucks').update(payload).eq('id', id).select().single();
  if (error) throw error;
  return data;
}
SVC_EOF
  echo "  ✓ lib/mtruck/services/${svc}.ts"
done

# MTruck hooks
mkdir -p lib/mtruck/hooks
for hook in use-document-store use-analytics-store use-driver-store use-marketplace-store use-fleet-store use-fuel-store use-route-store use-dispatch-store use-maintenance-store use-tracking-store; do
  cat > lib/mtruck/hooks/${hook}.ts << HOOK_EOF
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

export function ${hook.replace(/-/g, '')}(options?: any) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const { data: result, error: err } = await supabase.from('mtruck_trucks').select('*').limit(10);
      if (err) throw err;
      setData(result || []);
    } catch (e) {
      setError(e as Error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);
  return { data, loading, error, refetch: fetchData };
}
HOOK_EOF
  echo "  ✓ lib/mtruck/hooks/${hook}.ts"
done

# MTruck components
mkdir -p lib/mtruck/components
for comp in MaintenanceItem FleetAlertItem FuelStationCard DocumentCard LoadDetailCard TruckLocationCard LoadCard DriverCard RouteCard FreightListingCard ActiveLoadItem TruckCard; do
  cat > lib/mtruck/components/${comp}.tsx << COMP_EOF
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export const ${comp}: React.FC<any> = (props) => (
  <View style={styles.card}>
    <Text style={styles.title}>${comp}</Text>
    {props.children}
  </View>
);
export default ${comp};

const styles = StyleSheet.create({
  card: { padding: 12, borderRadius: 8, backgroundColor: '#f5f5f5', marginVertical: 4 },
  title: { fontSize: 14, fontWeight: '600' },
});
COMP_EOF
  echo "  ✓ lib/mtruck/components/${comp}.tsx"
done

# MTaxi components
mkdir -p lib/mtaxi/components
for comp in RideTracking DriverRequests DriverEarnings BodaRequest DriverRide RideHistory DriverHome RequestRide; do
  cat > lib/mtaxi/components/${comp}.tsx << COMP_EOF
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export const ${comp}: React.FC<any> = (props) => (
  <View style={styles.card}>
    <Text style={styles.title}>${comp}</Text>
    {props.children}
  </View>
);
export default ${comp};

const styles = StyleSheet.create({
  card: { padding: 12, borderRadius: 8, backgroundColor: '#f5f5f5', marginVertical: 4 },
  title: { fontSize: 14, fontWeight: '600' },
});
COMP_EOF
  echo "  ✓ lib/mtaxi/components/${comp}.tsx"
done

# MTaxi hooks
mkdir -p lib/mtaxi/hooks
for hook in useDriver useRides; do
  cat > lib/mtaxi/hooks/${hook}.ts << HOOK_EOF
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

export function ${hook}(options?: any) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const { data: result, error: err } = await supabase.from('mtaxi_rides').select('*').limit(10);
      if (err) throw err;
      setData(result || []);
    } catch (e) {
      setError(e as Error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);
  return { data, loading, error, refetch: fetchData };
}
HOOK_EOF
  echo "  ✓ lib/mtaxi/hooks/${hook}.ts"
done

# MTaxi services
mkdir -p lib/mtaxi/services
for svc in rideService driverService carpoolService inspectionService; do
  cat > lib/mtaxi/services/${svc}.ts << SVC_EOF
import { supabase } from '@/lib/supabase';

export async function list() {
  const { data, error } = await supabase.from('mtaxi_rides').select('*').limit(50);
  if (error) throw error;
  return data || [];
}
export async function getById(id: string) {
  const { data, error } = await supabase.from('mtaxi_rides').select('*').eq('id', id).single();
  if (error) throw error;
  return data;
}
export async function create(payload: any) {
  const { data, error } = await supabase.from('mtaxi_rides').insert(payload).select().single();
  if (error) throw error;
  return data;
}
SVC_EOF
  echo "  ✓ lib/mtaxi/services/${svc}.ts"
done

echo "=== TRANSPORT COMPLETE ==="
