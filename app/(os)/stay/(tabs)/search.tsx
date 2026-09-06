// @ts-nocheck
import DomainHubScreen from '@/lib/hubs/DomainHubScreen';
export default function StaySearchScreen() {
  return <DomainHubScreen config={{
    title: 'Stay Search', subtitle: 'Find accommodations', icon: 'search', color: '#0ea5e9',
    tiles: [{ label: 'Nearby Stays', icon: 'location', route: '/(os)/stay' }, { label: 'My Bookings', icon: 'calendar', route: '/(os)/stay/payment' }, { label: 'Host Dashboard', icon: 'home', route: '/(os)/stay' }]
  }} />;
}
