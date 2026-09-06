// @ts-nocheck
import DomainHubScreen from '@/lib/hubs/DomainHubScreen';
export default function PartnerEcosystemScreen() {
  return <DomainHubScreen config={{
    title: 'Partner Ecosystem', subtitle: 'Business integrations', icon: 'people', color: '#8b5cf6',
    tiles: [{ label: 'Business Wallet', icon: 'briefcase', route: '/(os)/wallet/business' }, { label: 'Agent Network', icon: 'map', route: '/(os)/wallet/agent' }, { label: 'Tax Hub', icon: 'calculator', route: '/(os)/wallet/tax-hub' }]
  }} />;
}
