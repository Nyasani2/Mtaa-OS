// @ts-nocheck
import DomainHubScreen from '@/lib/hubs/DomainHubScreen';
export default function LowStockAlertsScreen() {
  return <DomainHubScreen config={{
    title: 'Low Stock Alerts', subtitle: 'Items needing reorder', icon: 'alert-circle', color: '#ef4444',
    tiles: [{ label: 'View Inventory', icon: 'cube', route: '/(os)/restaurant/inventory' }, { label: 'Create Order', icon: 'cart', route: '/(os)/restaurant/inventory' }, { label: 'Suppliers', icon: 'people', route: '/(os)/restaurant/inventory' }]
  }} />;
}
