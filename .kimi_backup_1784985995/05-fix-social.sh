#!/bin/bash
# 05-fix-social.sh — Tribes, Property, Wallet, Regulatory stubs
cd ~/MTAA_OS_V10
set -e

echo "=== FIX 5: SOCIAL + PROPERTY + WALLET + REGULATORY ==="

# Tribes types
mkdir -p lib/tribes
cat > lib/tribes/types.ts << 'EOF'
export interface Tribe {
  id: string; name: string; description: string; creator_id: string;
  category: string; member_count: number; is_private: boolean; created_at: string;
}
export interface TribePost {
  id: string; tribe_id: string; author_id: string; content: string;
  media_urls: string[]; likes_count: number; comments_count: number; created_at: string;
}
EOF
echo "  ✓ lib/tribes/types.ts"

# Tribes hooks
mkdir -p lib/tribes/hooks
cat > lib/tribes/hooks/useTribes.ts << 'EOF'
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { Tribe, TribePost } from '@/lib/tribes/types';

export function useTribes() {
  const [tribes, setTribes] = useState<Tribe[]>([]);
  const [posts, setPosts] = useState<TribePost[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchTribes = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.from('tribes').select('*').limit(50);
    if (!error) setTribes(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchTribes(); }, [fetchTribes]);
  return { tribes, posts, loading, fetchTribes };
}
EOF
echo "  ✓ lib/tribes/hooks/useTribes.ts"

# Property hooks
mkdir -p lib/domains/property/hooks
cat > lib/domains/property/hooks/useProperty.ts << 'EOF'
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

export function useProperty() {
  const [properties, setProperties] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchProperties = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.from('properties').select('*').limit(50);
    if (!error) setProperties(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchProperties(); }, [fetchProperties]);
  return { properties, bookings, loading, fetchProperties };
}
EOF
echo "  ✓ lib/domains/property/hooks/useProperty.ts"

# Property components barrel
mkdir -p lib/domains/property/components
cat > lib/domains/property/components/index.ts << 'EOF'
export { default as PropertyCard } from './PropertyCard';
export { default as BookingCard } from './BookingCard';
EOF

for comp in PropertyCard BookingCard; do
  cat > lib/domains/property/components/${comp}.tsx << COMP_EOF
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
export const ${comp}: React.FC<any> = (props) => (
  <View style={styles.card}><Text style={styles.title}>${comp}</Text></View>
);
export default ${comp};
const styles = StyleSheet.create({
  card: { padding: 12, borderRadius: 8, backgroundColor: '#f5f5f5', marginVertical: 4 },
  title: { fontSize: 14, fontWeight: '600' },
});
COMP_EOF
  echo "  ✓ lib/domains/property/components/${comp}.tsx"
done

# Wallet hooks barrel
mkdir -p lib/domains/wallet/hooks
cat > lib/domains/wallet/hooks/index.ts << 'EOF'
export function useWallet() {
  return { balance: 0, transactions: [], loading: false };
}
export function useWalletTransfer() {
  return { transfer: async () => {}, loading: false };
}
export function useWalletDeposit() {
  return { deposit: async () => {}, loading: false };
}
EOF
echo "  ✓ lib/domains/wallet/hooks/index.ts"

# Regulatory components barrel
mkdir -p lib/domains/regulatory/components
cat > lib/domains/regulatory/components/index.ts << 'EOF'
export { default as RegulatoryShell } from './RegulatoryShell';
export { default as BusinessLicenseCard } from './BusinessLicenseCard';
EOF

for comp in RegulatoryShell BusinessLicenseCard; do
  cat > lib/domains/regulatory/components/${comp}.tsx << COMP_EOF
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
export const ${comp}: React.FC<any> = (props) => (
  <View style={styles.card}><Text style={styles.title}>${comp}</Text></View>
);
export default ${comp};
const styles = StyleSheet.create({
  card: { padding: 12, borderRadius: 8, backgroundColor: '#f5f5f5', marginVertical: 4 },
  title: { fontSize: 14, fontWeight: '600' },
});
COMP_EOF
  echo "  ✓ lib/domains/regulatory/components/${comp}.tsx"
done

echo "=== SOCIAL/PROPERTY/WALLET/REGULATORY COMPLETE ==="
