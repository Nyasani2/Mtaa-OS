// @ts-nocheck
import DomainHubScreen from '@/lib/hubs/DomainHubScreen';
export default function InsuranceHubScreen() {
  return <DomainHubScreen config={{
    title: 'Insurance Hub', subtitle: 'Policies & claims', icon: 'shield-checkmark', color: '#3b82f6',
    tiles: [{ label: 'My Policies', icon: 'document-text', route: '/(os)/health/insurance' }, { label: 'File a Claim', icon: 'alert-circle', route: '/(os)/health/insurance/claims/new' }, { label: 'Health Records', icon: 'medical', route: '/(os)/health' }]
  }} />;
}
