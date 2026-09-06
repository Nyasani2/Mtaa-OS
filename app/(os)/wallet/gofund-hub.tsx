// @ts-nocheck
import DomainHubScreen from '@/lib/hubs/DomainHubScreen';
export default function GofundCrowdfundingScreen() {
  return <DomainHubScreen config={{
    title: 'Gofund & Crowdfunding', subtitle: 'Community fundraising', icon: 'heart', color: '#ec4899',
    tiles: [
      { label: 'Start a Campaign', icon: 'add-circle', route: '/(os)/wallet/claim' },
      { label: 'Browse Campaigns', icon: 'search', route: '/(os)/wallet/rewards' },
      { label: 'My Donations', icon: 'gift', route: '/(os)/wallet/savings-hub' }
    ]
  }} />;
}
