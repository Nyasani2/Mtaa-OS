// @ts-nocheck
import DomainHubScreen from '@/lib/hubs/DomainHubScreen';
export default function QRPaymentsScreen() {
  return <DomainHubScreen config={{
    title: 'QR Payments', subtitle: 'Scan and pay instantly', icon: 'qr-code', color: '#0f172a',
    tiles: [{ label: 'Scan QR', icon: 'scan', route: '/(os)/wallet/qr-scan' }, { label: 'My QR Code', icon: 'qr-code', route: '/(os)/wallet/qr' }, { label: 'Payment History', icon: 'time', route: '/(os)/wallet/transfer' }]
  }} />;
}
