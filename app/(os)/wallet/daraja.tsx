// @ts-nocheck
import DomainHubScreen from '@/lib/hubs/DomainHubScreen';
export default function DarajaMPesaScreen() {
  return <DomainHubScreen config={{
    title: 'Daraja & M-Pesa', subtitle: 'Mobile money integration', icon: 'phone-portrait', color: '#22c55e',
    tiles: [
      { label: 'Pay Bill', icon: 'receipt', route: '/(os)/wallet/qr-pay' },
      { label: 'Till Number', icon: 'storefront', route: '/(os)/wallet/qr-scan' },
      { label: 'Transaction History', icon: 'time', route: '/(os)/wallet/transfer' }
    ]
  }} />;
}
