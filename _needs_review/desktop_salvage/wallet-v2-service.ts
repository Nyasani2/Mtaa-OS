import { supabase } from '@/lib/kernel/supabase';

// ============================================
// Partner Ecosystem Services
// ============================================

export async function submitPartnerApplication(data: {
  partner_category: string;
  partner_type: string;
  organization_name: string;
  registration_number?: string;
  country: string;
  city?: string;
  contact_name?: string;
  contact_email: string;
  contact_phone: string;
  website?: string;
  services_offered?: string[];
  description?: string;
  estimated_premium_min?: number;
  estimated_premium_max?: number;
  target_market?: string;
  jurisdiction?: string;
  department?: string;
  authorization_level?: number;
  submitted_by: string;
}) {
  const { data: result, error } = await supabase
    .from('wallet_partner_applications')
    .insert(data)
    .select()
    .single();

  if (error) throw error;
  return result;
}

export async function getPartnerApplications(submittedBy: string) {
  const { data, error } = await supabase
    .from('wallet_partner_applications')
    .select('*')
    .eq('submitted_by', submittedBy)
    .order('submitted_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function getApprovedPartners(category?: string) {
  let query = supabase
    .from('wallet_partner_applications')
    .select('*')
    .eq('status', 'approved');

  if (category) {
    query = query.eq('partner_category', category);
  }

  const { data, error } = await query.order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

// ============================================
// GoFund Services
// ============================================

export async function createGoFundCampaign(data: {
  title: string;
  description: string;
  target_amount: number;
  currency?: string;
  category: string;
  end_date: string;
  creator_id: string;
  creator_name: string;
}) {
  const { data: result, error } = await supabase
    .from('wallet_gofund_campaigns')
    .insert({ ...data, currency: data.currency || 'KES', raised_amount: 0, status: 'active' })
    .select()
    .single();

  if (error) throw error;
  return result;
}

export async function getActiveCampaigns(search?: string) {
  let query = supabase
    .from('wallet_gofund_campaigns')
    .select('*')
    .eq('status', 'active')
    .order('created_at', { ascending: false });

  if (search) {
    query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function getMyCampaigns(creatorId: string) {
  const { data, error } = await supabase
    .from('wallet_gofund_campaigns')
    .select('*')
    .eq('creator_id', creatorId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function getSupportedCampaigns(contributorId: string) {
  const { data: contributions, error: contribError } = await supabase
    .from('wallet_gofund_contributions')
    .select('campaign_id')
    .eq('contributor_id', contributorId);

  if (contribError) throw contribError;
  if (!contributions || contributions.length === 0) return [];

  const campaignIds = [...new Set(contributions.map((c: any) => c.campaign_id))];
  const { data, error } = await supabase
    .from('wallet_gofund_campaigns')
    .select('*')
    .in('id', campaignIds);

  if (error) throw error;
  return data || [];
}

export async function contributeToCampaign(data: {
  campaign_id: string;
  contributor_id: string;
  contributor_name: string;
  amount: number;
  currency?: string;
}) {
  const { data: result, error } = await supabase
    .from('wallet_gofund_contributions')
    .insert({ ...data, currency: data.currency || 'KES', is_anonymous: false, payment_status: 'completed' })
    .select()
    .single();

  if (error) throw error;

  // Update campaign raised amount
  await supabase.rpc('increment_gofund_raised', {
    campaign_id: data.campaign_id,
    amount: data.amount,
  });

  return result;
}

export async function getCampaignContributions(campaignId: string) {
  const { data, error } = await supabase
    .from('wallet_gofund_contributions')
    .select('*')
    .eq('campaign_id', campaignId)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) throw error;
  return data || [];
}

export async function getCampaignUpdates(campaignId: string) {
  const { data, error } = await supabase
    .from('wallet_gofund_updates')
    .select('*')
    .eq('campaign_id', campaignId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

// ============================================
// Savings Services
// ============================================

export async function createSavingsGoal(data: {
  name: string;
  description?: string;
  target_amount: number;
  currency?: string;
  goal_type: 'personal' | 'group';
  end_date: string;
  created_by: string;
}) {
  const { data: result, error } = await supabase
    .from('wallet_savings_goals')
    .insert({
      ...data,
      currency: data.currency || 'KES',
      current_amount: 0,
      status: 'active',
    })
    .select()
    .single();

  if (error) throw error;

  // If group goal, add creator as admin
  if (data.goal_type === 'group') {
    await supabase.from('wallet_savings_members').insert({
      goal_id: result.id,
      user_id: data.created_by,
      member_name: 'Admin',
      role: 'admin',
    });
  }

  return result;
}

export async function getMySavingsGoals(userId: string) {
  const { data, error } = await supabase
    .from('wallet_savings_goals')
    .select('*')
    .eq('created_by', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function contributeToSavings(data: {
  goal_id: string;
  contributor_id: string;
  contributor_name: string;
  amount: number;
  currency?: string;
}) {
  const { data: result, error } = await supabase
    .from('wallet_savings_contributions')
    .insert({ ...data, currency: data.currency || 'KES' })
    .select()
    .single();

  if (error) throw error;
  return result;
}

export async function getGoalContributions(goalId: string) {
  const { data, error } = await supabase
    .from('wallet_savings_contributions')
    .select('*')
    .eq('goal_id', goalId)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) throw error;
  return data || [];
}

export async function getGoalMembers(goalId: string) {
  const { data, error } = await supabase
    .from('wallet_savings_members')
    .select('*')
    .eq('goal_id', goalId)
    .order('joined_at', { ascending: true });

  if (error) throw error;
  return data || [];
}

// ============================================
// SACCO Services
// ============================================

export async function createSACCO(data: {
  name: string;
  registration_number?: string;
  country: string;
  city?: string;
  contact_email: string;
  contact_phone?: string;
  description?: string;
  interest_rate?: number;
  created_by: string;
}) {
  const { data: result, error } = await supabase
    .from('wallet_sacco_directory')
    .insert({
      ...data,
      status: 'pending',
      member_count: 1,
      total_contributions: 0,
    })
    .select()
    .single();

  if (error) throw error;

  // Add creator as admin member
  await supabase.from('wallet_sacco_memberships').insert({
    sacco_id: result.id,
    user_id: data.created_by,
    member_number: `SAC-${Date.now().toString(36).toUpperCase()}`,
    role: 'admin',
    total_contributed: 0,
  });

  return result;
}

export async function getApprovedSACCOs(search?: string) {
  let query = supabase
    .from('wallet_sacco_directory')
    .select('*')
    .eq('status', 'approved')
    .order('created_at', { ascending: false });

  if (search) {
    query = query.or(`name.ilike.%${search}%,city.ilike.%${search}%`);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function joinSACCO(saccoId: string, userId: string, userName: string) {
  // Check if already member
  const { data: existing } = await supabase
    .from('wallet_sacco_memberships')
    .select('id')
    .eq('sacco_id', saccoId)
    .eq('user_id', userId)
    .single();

  if (existing) {
    throw new Error('Already a member of this SACCO');
  }

  const memberNumber = `SAC-${Date.now().toString(36).toUpperCase()}`;

  const { data: result, error } = await supabase
    .from('wallet_sacco_memberships')
    .insert({
      sacco_id: saccoId,
      user_id: userId,
      member_number: memberNumber,
      role: 'member',
      total_contributed: 0,
    })
    .select()
    .single();

  if (error) throw error;

  // Update member count
  await supabase.rpc('increment_sacco_members', { sacco_id: saccoId });

  return { ...result, member_number: memberNumber };
}

export async function getMySACCOMemberships(userId: string) {
  const { data, error } = await supabase
    .from('wallet_sacco_memberships')
    .select(`
      *,
      sacco:wallet_sacco_directory(*)
    `)
    .eq('user_id', userId)
    .order('joined_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function contributeToSACCO(data: {
  sacco_id: string;
  contributor_id: string;
  contributor_name: string;
  amount: number;
  currency?: string;
}) {
  const { data: result, error } = await supabase
    .from('wallet_sacco_contributions')
    .insert({ ...data, currency: data.currency || 'KES' })
    .select()
    .single();

  if (error) throw error;
  return result;
}

export async function getSACCOContributions(saccoId: string) {
  const { data, error } = await supabase
    .from('wallet_sacco_contributions')
    .select('*')
    .eq('sacco_id', saccoId)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) throw error;
  return data || [];
}
