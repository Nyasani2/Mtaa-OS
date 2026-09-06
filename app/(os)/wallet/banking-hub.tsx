// @ts-nocheck
import DomainHubScreen from '@/lib/hubs/DomainHubScreen';
export default function BankingHubScreen() {
  return <DomainHubScreen config={{
    title: 'Banking Hub', subtitle: 'Manage bank accounts & transfers', icon: 'business', color: '#0ea5e9',
    tiles: [{ label: 'Linked Banks', icon: 'card', route: '/(os)/wallet/banks' }, { label: 'Transfers', icon: 'swap-horizontal', route: '/(os)/wallet/transfer' }, { label: 'Daraja/M-Pesa', icon: 'phone-portrait', route: '/(os)/wallet/daraja' }]
  }} />;
}
