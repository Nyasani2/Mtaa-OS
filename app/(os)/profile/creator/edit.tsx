// @ts-nocheck
import DomainHubScreen from '@/lib/hubs/DomainHubScreen';
export default function EditCreatorProfileScreen() {
  return <DomainHubScreen config={{
    title: 'Edit Creator Profile', subtitle: 'Update your studio details', icon: 'create', color: '#ec4899',
    tiles: [{ label: 'Profile Info', icon: 'person', route: '/(os)/profile' }, { label: 'Studio Settings', icon: 'settings', route: '/(os)/studio' }, { label: 'Monetization', icon: 'cash', route: '/(os)/studio/revenue-sharing' }]
  }} />;
}
