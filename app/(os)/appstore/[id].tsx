// @ts-nocheck
import DomainHubScreen from '@/lib/hubs/DomainHubScreen';
export default function AppDetailsScreen() {
  return <DomainHubScreen config={{
    title: 'App Details', subtitle: 'View and install applications', icon: 'download', color: '#6366f1',
    tiles: [{ label: 'Install App', icon: 'download', route: '/(os)/appstore' }, { label: 'Reviews', icon: 'star', route: '/(os)/appstore' }, { label: 'Developer Info', icon: 'person', route: '/(os)/appstore' }]
  }} />;
}
