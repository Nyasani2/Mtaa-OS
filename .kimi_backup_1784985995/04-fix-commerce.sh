#!/bin/bash
# 04-fix-commerce.sh — Jobs, Marketplace, Shop, Credit stubs
cd ~/MTAA_OS_V10
set -e

echo "=== FIX 4: COMMERCE ==="

# Jobs types
mkdir -p lib/jobs
cat > lib/jobs/types.ts << 'EOF'
export interface Job {
  id: string; employer_id: string; title: string; description: string;
  category: string; location: string; salary_min: number; salary_max: number;
  status: string; created_at: string;
}
export interface JobApplication {
  id: string; job_id: string; applicant_id: string; status: string; cover_letter?: string; created_at: string;
}
export interface JobPortfolio {
  id: string; user_id: string; title: string; description: string; skills: string[]; created_at: string;
}
export interface JobInterview {
  id: string; application_id: string; scheduled_at: string; status: string; type: string;
}
EOF
echo "  ✓ lib/jobs/types.ts"

# Jobs service
mkdir -p lib/jobs/services
cat > lib/jobs/services/jobs-service.ts << 'EOF'
import { supabase } from '@/lib/supabase';
import type { Job, JobApplication } from '@/lib/jobs/types';

export const jobsService = {
  async listJobs() {
    const { data, error } = await supabase.from('jobs_listings').select('*').limit(50);
    if (error) throw error;
    return data || [];
  },
  async getJob(id: string) {
    const { data, error } = await supabase.from('jobs_listings').select('*').eq('id', id).single();
    if (error) throw error;
    return data;
  },
  async apply(jobId: string, payload: any) {
    const { data, error } = await supabase.from('jobs_applications').insert({ job_id: jobId, ...payload }).select().single();
    if (error) throw error;
    return data;
  },
  async listApplications() {
    const { data, error } = await supabase.from('jobs_applications').select('*').limit(50);
    if (error) throw error;
    return data || [];
  },
};
EOF
echo "  ✓ lib/jobs/services/jobs-service.ts"

# Jobs hooks
mkdir -p lib/jobs/hooks
cat > lib/jobs/hooks/use-jobs-store.ts << 'EOF'
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { jobsService } from '@/lib/jobs/services/jobs-service';
import type { Job, JobApplication } from '@/lib/jobs/types';

export function useJobsStore() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    const data = await jobsService.listJobs();
    setJobs(data);
    setLoading(false);
  }, []);

  useEffect(() => { fetchJobs(); }, [fetchJobs]);
  return { jobs, applications, loading, fetchJobs };
}
EOF
echo "  ✓ lib/jobs/hooks/use-jobs-store.ts"

# Jobs components
mkdir -p lib/jobs/components
cat > lib/jobs/components/JobCard.tsx << 'EOF'
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import type { Job } from '@/lib/jobs/types';

export const JobCard: React.FC<{ job: Job; onPress?: () => void }> = ({ job, onPress }) => (
  <TouchableOpacity style={styles.card} onPress={onPress}>
    <Text style={styles.title}>{job.title}</Text>
    <Text style={styles.meta}>{job.location} • {job.category}</Text>
  </TouchableOpacity>
);
export default JobCard;

const styles = StyleSheet.create({
  card: { padding: 16, borderRadius: 12, backgroundColor: '#fff', marginVertical: 6, borderWidth: 1, borderColor: '#E1E3E5' },
  title: { fontSize: 16, fontWeight: '700' },
  meta: { fontSize: 13, color: '#687076', marginTop: 4 },
});
EOF
echo "  ✓ lib/jobs/components/JobCard.tsx"

cat > lib/jobs/components/ApplicationCard.tsx << 'EOF'
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { JobApplication } from '@/lib/jobs/types';

export const ApplicationCard: React.FC<{ application: JobApplication }> = ({ application }) => (
  <View style={styles.card}>
    <Text style={styles.status}>{application.status}</Text>
  </View>
);
export default ApplicationCard;

const styles = StyleSheet.create({
  card: { padding: 12, borderRadius: 8, backgroundColor: '#f5f5f5', marginVertical: 4 },
  status: { fontSize: 14, fontWeight: '600' },
});
EOF
echo "  ✓ lib/jobs/components/ApplicationCard.tsx"

# Marketplace types
mkdir -p lib/marketplace
cat > lib/marketplace/types.ts << 'EOF'
export interface MarketplaceListing {
  id: string; seller_id: string; title: string; description: string; price: number;
  category: string; status: string; images: string[]; created_at: string;
}
export interface MarketplaceOrder {
  id: string; buyer_id: string; seller_id: string; listing_id: string; status: string; total: number; created_at: string;
}
EOF
echo "  ✓ lib/marketplace/types.ts"

# Marketplace service
mkdir -p lib/marketplace/services
cat > lib/marketplace/services/marketplace-service.ts << 'EOF'
import { supabase } from '@/lib/supabase';
import type { MarketplaceListing, MarketplaceOrder } from '@/lib/marketplace/types';

export const marketplaceService = {
  async listListings() {
    const { data, error } = await supabase.from('marketplace_listings').select('*').limit(50);
    if (error) throw error;
    return data || [];
  },
  async getListing(id: string) {
    const { data, error } = await supabase.from('marketplace_listings').select('*').eq('id', id).single();
    if (error) throw error;
    return data;
  },
  async createOrder(payload: any) {
    const { data, error } = await supabase.from('marketplace_orders').insert(payload).select().single();
    if (error) throw error;
    return data;
  },
};
EOF
echo "  ✓ lib/marketplace/services/marketplace-service.ts"

# Marketplace hooks
mkdir -p lib/marketplace/hooks
cat > lib/marketplace/hooks/use-marketplace-store.ts << 'EOF'
import { useState, useEffect, useCallback } from 'react';
import { marketplaceService } from '@/lib/marketplace/services/marketplace-service';
import type { MarketplaceListing, MarketplaceOrder } from '@/lib/marketplace/types';

export function useMarketplaceStore() {
  const [listings, setListings] = useState<MarketplaceListing[]>([]);
  const [orders, setOrders] = useState<MarketplaceOrder[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchListings = useCallback(async () => {
    setLoading(true);
    const data = await marketplaceService.listListings();
    setListings(data);
    setLoading(false);
  }, []);

  useEffect(() => { fetchListings(); }, [fetchListings]);
  return { listings, orders, loading, fetchListings };
}
EOF
echo "  ✓ lib/marketplace/hooks/use-marketplace-store.ts"

# Marketplace components
mkdir -p lib/marketplace/components
cat > lib/marketplace/components/ListingCard.tsx << 'EOF'
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import type { MarketplaceListing } from '@/lib/marketplace/types';

export const ListingCard: React.FC<{ listing: MarketplaceListing; onPress?: () => void }> = ({ listing, onPress }) => (
  <TouchableOpacity style={styles.card} onPress={onPress}>
    <Text style={styles.title}>{listing.title}</Text>
    <Text style={styles.price}>KES {listing.price}</Text>
  </TouchableOpacity>
);
export default ListingCard;

const styles = StyleSheet.create({
  card: { padding: 16, borderRadius: 12, backgroundColor: '#fff', marginVertical: 6, borderWidth: 1, borderColor: '#E1E3E5' },
  title: { fontSize: 16, fontWeight: '700' },
  price: { fontSize: 15, color: '#0a7ea4', marginTop: 4, fontWeight: '600' },
});
EOF
echo "  ✓ lib/marketplace/components/ListingCard.tsx"

cat > lib/marketplace/components/OrderCard.tsx << 'EOF'
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { MarketplaceOrder } from '@/lib/marketplace/types';

export const OrderCard: React.FC<{ order: MarketplaceOrder }> = ({ order }) => (
  <View style={styles.card}>
    <Text style={styles.status}>Order: {order.status}</Text>
    <Text style={styles.total}>KES {order.total}</Text>
  </View>
);
export default OrderCard;

const styles = StyleSheet.create({
  card: { padding: 12, borderRadius: 8, backgroundColor: '#f5f5f5', marginVertical: 4 },
  status: { fontSize: 14, fontWeight: '600' },
  total: { fontSize: 13, color: '#0a7ea4', marginTop: 2 },
});
EOF
echo "  ✓ lib/marketplace/components/OrderCard.tsx"

# Shop service re-export
mkdir -p lib/shop/services
cat > lib/shop/services/shopService.ts << 'EOF'
// Re-export canonical shop service
export * from '@/lib/services/shop-service';
export { default } from '@/lib/services/shop-service';
EOF
echo "  ✓ lib/shop/services/shopService.ts"

mkdir -p lib/shop/hooks
cat > lib/shop/hooks/useShop.ts << 'EOF'
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

export function useShop() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.from('shop_items').select('*').limit(50);
    if (!error) setProducts(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);
  return { products, loading, fetchProducts };
}
EOF
echo "  ✓ lib/shop/hooks/useShop.ts"

# Credit types
mkdir -p lib/credit
cat > lib/credit/types.ts << 'EOF'
export interface Loan {
  id: string; user_id: string; amount: number; interest_rate: number; term_months: number;
  status: string; purpose: string; created_at: string;
}
export interface CreditScore {
  id: string; user_id: string; score: number; updated_at: string;
}
EOF
echo "  ✓ lib/credit/types.ts"

# Credit service
mkdir -p lib/credit/services
cat > lib/credit/services/credit-service.ts << 'EOF'
import { supabase } from '@/lib/supabase';
import type { Loan, CreditScore } from '@/lib/credit/types';

export const creditService = {
  async listLoans() {
    const { data, error } = await supabase.from('credit_loans').select('*').limit(50);
    if (error) throw error;
    return data || [];
  },
  async applyForLoan(payload: any) {
    const { data, error } = await supabase.from('credit_loans').insert(payload).select().single();
    if (error) throw error;
    return data;
  },
  async getCreditScore(userId: string) {
    const { data, error } = await supabase.from('credit_scores').select('*').eq('user_id', userId).single();
    if (error) throw error;
    return data;
  },
};
EOF
echo "  ✓ lib/credit/services/credit-service.ts"

# Credit hooks
mkdir -p lib/credit/hooks
cat > lib/credit/hooks/use-credit-store.ts << 'EOF'
import { useState, useEffect, useCallback } from 'react';
import { creditService } from '@/lib/credit/services/credit-service';
import type { Loan, CreditScore } from '@/lib/credit/types';

export function useCreditStore() {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchLoans = useCallback(async () => {
    setLoading(true);
    const data = await creditService.listLoans();
    setLoans(data);
    setLoading(false);
  }, []);

  useEffect(() => { fetchLoans(); }, [fetchLoans]);
  return { loans, loading, fetchLoans };
}
EOF
echo "  ✓ lib/credit/hooks/use-credit-store.ts"

# Credit components
mkdir -p lib/credit/components
cat > lib/credit/components/LoanCard.tsx << 'EOF'
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { Loan } from '@/lib/credit/types';

export const LoanCard: React.FC<{ loan: Loan }> = ({ loan }) => (
  <View style={styles.card}>
    <Text style={styles.amount}>KES {loan.amount}</Text>
    <Text style={styles.meta}>{loan.term_months} months • {loan.interest_rate}%</Text>
  </View>
);
export default LoanCard;

const styles = StyleSheet.create({
  card: { padding: 12, borderRadius: 8, backgroundColor: '#f5f5f5', marginVertical: 4 },
  amount: { fontSize: 16, fontWeight: '700', color: '#0a7ea4' },
  meta: { fontSize: 13, color: '#687076', marginTop: 2 },
});
EOF
echo "  ✓ lib/credit/components/LoanCard.tsx"

echo "=== COMMERCE COMPLETE ==="
