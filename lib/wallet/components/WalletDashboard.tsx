import { useWalletStore } from '@/hooks/useWalletStore';

export default function WalletDashboard() {
  const { balance, currency, transactions } = useWalletStore();
  return null;
}
