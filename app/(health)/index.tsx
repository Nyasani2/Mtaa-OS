import { View, Text, StyleSheet } from 'react-native';
import { HealthShell } from "@/lib/health/components/HealthShell";
import { DashboardStats } from "@/lib/health/components/DashboardStats";
import { useAuthStore } from "@/lib/stores/auth-store";

export default function HealthScreen() {
  const { user } = useAuthStore();
  return (
    <HealthShell userId={user?.id || 'anonymous'}>
      <DashboardStats userId={user?.id || 'anonymous'} role="patient" />
    </HealthShell>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#050816', padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', color: 'white', marginBottom: 16 },
});
