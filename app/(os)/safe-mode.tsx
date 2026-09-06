// @ts-nocheck
import DomainHubScreen from '@/lib/hubs/DomainHubScreen';
export default function SafeModeScreen() {
  return <DomainHubScreen config={{
    title: 'Safe Mode', subtitle: 'Restricted access profile', icon: 'shield', color: '#64748b',
    tiles: [{ label: 'Child Profile', icon: 'child', route: '/(os)/studio/children-zone' }, { label: 'Focus Mode', icon: 'eye-off', route: '/(os)/safe-mode' }, { label: 'Exit Safe Mode', icon: 'log-out', route: '/(os)' }]
  }} />;
}
