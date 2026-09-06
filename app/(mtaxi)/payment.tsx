// @ts-nocheck
import DomainHubScreen from '@/lib/hubs/DomainHubScreen';
export default function RidePaymentsScreen() {
  return <DomainHubScreen config={{
    title: 'Ride Payments', subtitle: 'Process ride transactions', icon: 'cash', color: '#10b981',
    tiles: [{ label: 'Cash Payment', icon: 'cash-outline', route: '/(mtaxi)/payment' }, { label: 'Mobile Money', icon: 'phone-portrait', route: '/(os)/wallet/daraja' }, { label: 'Card Payment', icon: 'card', route: '/(os)/wallet/banks' }]
  }} />;
}
