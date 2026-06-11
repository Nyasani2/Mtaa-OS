import { useLocalSearchParams } from 'expo-router';
import ShopDashboard from '@/domains/shop/components/ShopDashboard';

export default function ShopDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <ShopDashboard shopId={id} />;
}
