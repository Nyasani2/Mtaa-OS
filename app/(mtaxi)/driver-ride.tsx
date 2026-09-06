// @ts-nocheck
import DomainHubScreen from '@/lib/hubs/DomainHubScreen';
export default function DriverRideHubScreen() {
  return <DomainHubScreen config={{
    title: 'Driver Ride Hub', subtitle: 'Manage your taxi rides', icon: 'car', color: '#0ea5e9',
    tiles: [{ label: 'Active Rides', icon: 'navigate', route: '/(mtaxi)/tracking' }, { label: 'Schedule', icon: 'calendar', route: '/(mtaxi)/schedule' }, { label: 'Earnings', icon: 'cash', route: '/(os)/wallet/transfer' }]
  }} />;
}
