// @ts-nocheck
import DomainHubScreen from '@/lib/hubs/DomainHubScreen';
export default function RewardsLoyaltyScreen() {
  return <DomainHubScreen config={{
    title: 'Rewards & Loyalty', subtitle: 'Earn points & cashback', icon: 'gift', color: '#f59e0b',
    tiles: [
      { label: 'My Points', icon: 'star', route: '/(os)/wallet/rewards' },
      { label: 'Redeem Rewards', icon: 'swap-horizontal', route: '/(os)/wallet/claim' },
      { label: 'Partner Offers', icon: 'pricetag', route: '/(os)/wallet/partner-ecosystem' }
    ]
  }} />;
}
