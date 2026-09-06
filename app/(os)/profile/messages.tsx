// @ts-nocheck
import DomainHubScreen from '@/lib/hubs/DomainHubScreen';
export default function ProfileMessagesScreen() {
  return <DomainHubScreen config={{
    title: 'Profile Messages', subtitle: 'Direct message center', icon: 'chatbubble-ellipses', color: '#3b82f6',
    tiles: [{ label: 'Inbox', icon: 'mail', route: '/(communication)/messages' }, { label: 'Sent', icon: 'send', route: '/(communication)/messages' }, { label: 'Archived', icon: 'archive', route: '/(communication)/messages' }]
  }} />;
}
