// @ts-nocheck
import DomainHubScreen from '@/lib/hubs/DomainHubScreen';
export default function StreetChatScreen() {
  return <DomainHubScreen config={{
    title: 'Street Chat', subtitle: 'Community messaging', icon: 'chatbubble', color: '#10b981',
    tiles: [{ label: 'Messages', icon: 'chatbubbles', route: '/(communication)/messages' }, { label: 'User Profile', icon: 'person', route: '/(os)/profile' }, { label: 'Report User', icon: 'flag', route: '/(os)/settings/blocked' }]
  }} />;
}
