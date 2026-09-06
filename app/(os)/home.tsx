// @ts-nocheck
import DomainHubScreen from '@/lib/hubs/DomainHubScreen';
export default function HomeDashboardScreen() {
  return <DomainHubScreen config={{
    title: 'Home Dashboard', subtitle: 'Your central command', icon: 'home', color: '#0f172a',
    tiles: [{ label: 'Health', icon: 'medical', route: '/(os)/health' }, { label: 'Wallet', icon: 'wallet', route: '/(os)/wallet' }, { label: 'Commerce', icon: 'storefront', route: '/(commerce)' }, { label: 'Messages', icon: 'chatbubbles', route: '/(communication)/messages' }]
  }} />;
}
