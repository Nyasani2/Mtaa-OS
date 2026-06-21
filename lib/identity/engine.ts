// MTAA Identity Engine — Core Engine
// Reads from all identity-related tables, returns unified identity object
// No direct DB calls from components — everything goes through here

import { supabase } from '@/lib/supabase';
import {
  MTAAIdentity, MTAAWallet, MTAAProfessional, MTAABusiness,
  MTAAFamily, MTAACreator, MTAAReputation, MTAADocument,
  MTAAAsset, MTAAQRIdentity, IdentityEngineState,
} from './types';

const DEFAULT_IDENTITY: MTAAIdentity = {
  user_id: '',
  email: '',
  phone: '',
  username: '',
  full_name: '',
  avatar_url: '',
  cover_url: '',
  bio: '',
  country: '',
  county: '',
  town: '',
  date_joined: '',
  verification_status: 'unverified',
  isLoading: true,
};

const DEFAULT_WALLET: MTAAWallet = {
  balance: 0,
  currency: 'KES',
  escrow_balance: 0,
  savings_balance: 0,
  credit_score: 0,
  pending_in: 0,
  pending_out: 0,
  last_transaction: undefined,
  isLoading: true,
};

const DEFAULT_PROFESSIONAL: MTAAProfessional = {
  has_profile: false,
  headline: '',
  summary: '',
  skills: [],
  experience: [],
  education: [],
  certificates: [],
  portfolio: [],
  references: [],
  availability: 'available',
  expected_salary: 0,
  salary_currency: 'KES',
  isLoading: true,
};

const DEFAULT_BUSINESS: MTAABusiness = {
  has_profile: false,
  business_name: '',
  description: '',
  category: '',
  logo_url: '',
  products_count: 0,
  services_count: 0,
  employees_count: 0,
  branches_count: 0,
  revenue_stats: undefined,
  orders_count: 0,
  rating: 0,
  isLoading: true,
};

const DEFAULT_FAMILY: MTAAFamily = {
  is_parent: false,
  children: [],
  isLoading: true,
};

const DEFAULT_CREATOR: MTAACreator = {
  has_profile: false,
  followers_count: 0,
  following_count: 0,
  posts_count: 0,
  videos_count: 0,
  articles_count: 0,
  total_views: 0,
  total_earnings: 0,
  tips_received: 0,
  subscriptions_count: 0,
  isLoading: true,
};

const DEFAULT_REPUTATION: MTAAReputation = {
  overall_rating: 0,
  total_reviews: 0,
  breakdown: [],
  isLoading: true,
};

const DEFAULT_QR: MTAAQRIdentity = {
  qr_data: '',
  qr_url: '',
  actions: [
    { type: 'profile', label: 'View Profile', enabled: true },
    { type: 'pay', label: 'Send Money', enabled: true },
    { type: 'hire', label: 'Hire Me', enabled: false },
    { type: 'message', label: 'Message', enabled: true },
    { type: 'follow', label: 'Follow', enabled: true },
    { type: 'business', label: 'My Business', enabled: false },
    { type: 'cv', label: 'View CV', enabled: false },
  ],
};

export const DEFAULT_STATE: IdentityEngineState = {
  identity: DEFAULT_IDENTITY,
  wallet: DEFAULT_WALLET,
  professional: DEFAULT_PROFESSIONAL,
  business: DEFAULT_BUSINESS,
  family: DEFAULT_FAMILY,
  creator: DEFAULT_CREATOR,
  reputation: DEFAULT_REPUTATION,
  documents: [],
  assets: [],
  qr: DEFAULT_QR,
  isLoading: true,
  error: null,
};

// ─── Core fetch function ──────────────────────────────────────────

export async function fetchIdentityEngine(userId: string): Promise<IdentityEngineState> {
  if (!userId) return { ...DEFAULT_STATE, isLoading: false };

  const state: IdentityEngineState = {
    ...DEFAULT_STATE,
    isLoading: true,
    error: null,
  };

  try {
    // 1. Core Identity + Profile
    const { data: profile, error: profileErr } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (profile && !profileErr) {
      state.identity = {
        user_id: userId,
        email: profile.email || '',
        phone: profile.phone || '',
        username: profile.username || '',
        full_name: profile.full_name || '',
        avatar_url: profile.avatar_url || '',
        cover_url: profile.cover_url || '',
        bio: profile.bio || '',
        country: profile.country || '',
        county: profile.county || '',
        town: profile.town || '',
        date_joined: profile.created_at || new Date().toISOString(),
        verification_status: profile.verification_status || 'unverified',
        isLoading: false,
      };
    }

    // 2. Wallet
    const { data: wallet, error: walletErr } = await supabase
      .from('wallets')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (wallet && !walletErr) {
      state.wallet = {
        balance: wallet.balance || 0,
        currency: wallet.currency || 'KES',
        escrow_balance: wallet.escrow_balance || 0,
        savings_balance: wallet.savings_balance || 0,
        credit_score: wallet.credit_score || 0,
        pending_in: wallet.pending_in || 0,
        pending_out: wallet.pending_out || 0,
        last_transaction: wallet.last_transaction,
        isLoading: false,
      };
    }

    // 3. Professional Profile
    const { data: prof, error: profErr } = await supabase
      .from('professional_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (prof && !profErr) {
      state.professional = {
        has_profile: true,
        headline: prof.headline || '',
        summary: prof.summary || '',
        skills: prof.skills || [],
        experience: prof.experience || [],
        education: prof.education || [],
        certificates: prof.certificates || [],
        portfolio: prof.portfolio || [],
        references: prof.references || [],
        availability: prof.availability || 'available',
        expected_salary: prof.expected_salary || 0,
        salary_currency: prof.salary_currency || 'KES',
        isLoading: false,
      };
    } else {
      state.professional = { ...DEFAULT_PROFESSIONAL, isLoading: false };
    }

    // 4. Business Profile
    const { data: biz, error: bizErr } = await supabase
      .from('business_profiles')
      .select('*')
      .eq('owner_id', userId)
      .single();

    if (biz && !bizErr) {
      state.business = {
        has_profile: true,
        business_name: biz.business_name || '',
        description: biz.description || '',
        category: biz.category || '',
        logo_url: biz.logo_url || '',
        products_count: biz.products_count || 0,
        services_count: biz.services_count || 0,
        employees_count: biz.employees_count || 0,
        branches_count: biz.branches_count || 0,
        revenue_stats: biz.revenue_stats,
        orders_count: biz.orders_count || 0,
        rating: biz.rating || 0,
        isLoading: false,
      };
    } else {
      state.business = { ...DEFAULT_BUSINESS, isLoading: false };
    }

    // 5. Family
    const { data: children, error: familyErr } = await supabase
      .from('family_profiles')
      .select('*')
      .eq('parent_id', userId);

    if (children && !familyErr) {
      state.family = {
        is_parent: children.length > 0,
        children: children.map((c: any) => ({
          id: c.child_id,
          name: c.child_name || '',
          avatar_url: c.avatar_url,
          date_of_birth: c.date_of_birth,
          school: c.school,
          grade: c.grade,
          medical_notes: c.medical_notes,
          transport_allowed: c.transport_allowed || false,
          allowance_balance: c.allowance_balance || 0,
          education_progress: c.education_progress,
        })),
        isLoading: false,
      };
    } else {
      state.family = { ...DEFAULT_FAMILY, isLoading: false };
    }

    // 6. Creator
    const { data: creator, error: creatorErr } = await supabase
      .from('creator_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (creator && !creatorErr) {
      state.creator = {
        has_profile: true,
        followers_count: creator.followers_count || 0,
        following_count: creator.following_count || 0,
        posts_count: creator.posts_count || 0,
        videos_count: creator.videos_count || 0,
        articles_count: creator.articles_count || 0,
        total_views: creator.total_views || 0,
        total_earnings: creator.total_earnings || 0,
        tips_received: creator.tips_received || 0,
        subscriptions_count: creator.subscriptions_count || 0,
        isLoading: false,
      };
    } else {
      state.creator = { ...DEFAULT_CREATOR, isLoading: false };
    }

    // 7. Reputation
    const { data: ratings, error: repErr } = await supabase
      .from('reputation_scores')
      .select('*')
      .eq('user_id', userId);

    if (ratings && !repErr && ratings.length > 0) {
      const total = ratings.reduce((sum: number, r: any) => sum + (r.rating * r.count), 0);
      const count = ratings.reduce((sum: number, r: any) => sum + r.count, 0);
      state.reputation = {
        overall_rating: count > 0 ? total / count : 0,
        total_reviews: count,
        breakdown: ratings.map((r: any) => ({
          app: r.app,
          rating: r.rating,
          count: r.count,
          label: r.label || r.app,
        })),
        isLoading: false,
      };
    } else {
      state.reputation = { ...DEFAULT_REPUTATION, isLoading: false };
    }

    // 8. Documents
    const { data: docs, error: docErr } = await supabase
      .from('documents')
      .select('*')
      .eq('user_id', userId)
      .order('uploaded_at', { ascending: false });

    if (docs && !docErr) {
      state.documents = docs.map((d: any) => ({
        id: d.id,
        type: d.type,
        name: d.name,
        url: d.url,
        verified: d.verified || false,
        uploaded_at: d.uploaded_at,
        expires_at: d.expires_at,
      }));
    }

    // 9. Assets
    const { data: assets, error: assetErr } = await supabase
      .from('assets')
      .select('*')
      .eq('owner_id', userId);

    if (assets && !assetErr) {
      state.assets = assets.map((a: any) => ({
        id: a.id,
        type: a.type,
        name: a.name,
        description: a.description,
        value: a.value,
        currency: a.currency,
        details: a.details || {},
        documents: a.documents || [],
      }));
    }

    // 10. QR Identity
    state.qr = {
      qr_data: `mtaa://user/${state.identity.username || state.identity.user_id}`,
      qr_url: `https://mtaa.afriq/qr/${state.identity.username || state.identity.user_id}`,
      actions: [
        { type: 'profile', label: 'View Profile', enabled: true },
        { type: 'pay', label: 'Send Money', enabled: true },
        { type: 'hire', label: 'Hire Me', enabled: state.professional.has_profile },
        { type: 'message', label: 'Message', enabled: true },
        { type: 'follow', label: 'Follow', enabled: true },
        { type: 'business', label: 'My Business', enabled: state.business.has_profile },
        { type: 'cv', label: 'View CV', enabled: state.professional.has_profile },
      ],
    };

    state.isLoading = false;
    return state;

  } catch (err: any) {
    state.isLoading = false;
    state.error = err.message || 'Failed to load identity';
    return state;
  }
}

// ─── Update functions ─────────────────────────────────────────────

export async function updateIdentityCore(userId: string, data: Partial<MTAAIdentity>) {
  const { error } = await supabase
    .from('profiles')
    .update({
      full_name: data.full_name,
      username: data.username,
      bio: data.bio,
      phone: data.phone,
      country: data.country,
      county: data.county,
      town: data.town,
      avatar_url: data.avatar_url,
      cover_url: data.cover_url,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId);
  return { error };
}

export async function updateProfessionalProfile(userId: string, data: Partial<MTAAProfessional>) {
  const { error } = await supabase
    .from('professional_profiles')
    .upsert({
      user_id: userId,
      headline: data.headline,
      summary: data.summary,
      skills: data.skills,
      experience: data.experience,
      education: data.education,
      certificates: data.certificates,
      portfolio: data.portfolio,
      references: data.references,
      availability: data.availability,
      expected_salary: data.expected_salary,
      salary_currency: data.salary_currency,
      updated_at: new Date().toISOString(),
    });
  return { error };
}

export async function updateBusinessProfile(userId: string, data: Partial<MTAABusiness>) {
  const { error } = await supabase
    .from('business_profiles')
    .upsert({
      owner_id: userId,
      business_name: data.business_name,
      description: data.description,
      category: data.category,
      logo_url: data.logo_url,
      updated_at: new Date().toISOString(),
    });
  return { error };
}
