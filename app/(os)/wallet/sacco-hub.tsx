// @ts-nocheck
import DomainHubScreen from '@/lib/hubs/DomainHubScreen';
export default function Sacco&ChamasScreen() {
  return <DomainHubScreen config={{
    title: 'Sacco & Chamas', subtitle: 'Group savings & loans', icon: 'people-circle', color: '#10b981',
    tiles: [{ label: 'My Groups', icon: 'people', route: '/(os)/wallet/group-savings' }, { label: 'Apply for Loan', icon: 'cash', route: '/(os)/wallet/savings-loans' }, { label: 'Dividends', icon: 'pie-chart', route: '/(os)/wallet/rewards' }]
  }} />;
}
