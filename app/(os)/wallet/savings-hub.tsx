// @ts-nocheck
import DomainHubScreen from '@/lib/hubs/DomainHubScreen';
export default function SavingsInvestmentsScreen() {
  return <DomainHubScreen config={{
    title: 'Savings & Investments', subtitle: 'Grow your wealth', icon: 'trending-up', color: '#6366f1',
    tiles: [
      { label: 'Fixed Deposit', icon: 'lock-closed', route: '/(os)/wallet/savings-loans' },
      { label: 'Money Market', icon: 'analytics', route: '/(os)/wallet/crypto' },
      { label: 'Auto-Save Rules', icon: 'settings', route: '/(os)/wallet/settings' }
    ]
  }} />;
}
