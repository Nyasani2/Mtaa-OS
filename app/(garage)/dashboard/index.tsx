// @ts-nocheck
import DomainHubScreen from '@/lib/hubs/DomainHubScreen';
export default function GarageDashboardScreen() {
  return <DomainHubScreen config={{
    title: 'Garage Dashboard', subtitle: 'Manage your auto repair shop', icon: 'construct', color: '#f59e0b',
    tiles: [{ label: 'Appointments', icon: 'calendar', route: '/(garage)/appointments' }, { label: 'Inventory', icon: 'cube', route: '/(garage)/inventory' }, { label: 'Fleet', icon: 'car', route: '/(garage)/fleet' }]
  }} />;
}
