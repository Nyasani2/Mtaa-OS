// ============================================================================
// MTAA Profile OS — Business Service Layer
// CRUD for businesses, branches, staff, profile-business junction
// ============================================================================

import { supabase } from '@/lib/supabase';
import type {
  Business, BusinessBranch, BusinessStaff, ProfileBusiness,
  BusinessType, BusinessStatus, StaffRole, StaffStatus
} from '../types';
import { profileService } from './profile-service';

// ════════════════════════════════════════════════════════════════════════════
// BUSINESS SERVICE
// ════════════════════════════════════════════════════════════════════════════

export const businessService = {
  /** Get all businesses for current user */
  async getMyBusinesses(): Promise<Business[]> {
    const profile = await profileService.getMyProfile();
    if (!profile) return [];

    const { data, error } = await supabase
      .from('profile_businesses')
      .select('business_id')
      .eq('profile_id', profile.id)
      .eq('is_active', true);

    if (error) throw error;
    if (!data || data.length === 0) return [];

    const businessIds = data.map(d => d.business_id);

    const { data: businesses, error: bizError } = await supabase
      .from('businesses')
      .select('*')
      .in('id', businessIds)
      .order('created_at', { ascending: false });

    if (bizError) throw bizError;
    return (businesses || []) as Business[];
  },

  /** Get business by ID */
  async getBusinessById(businessId: string): Promise<Business | null> {
    const { data, error } = await supabase
      .from('businesses')
      .select('*')
      .eq('id', businessId)
      .maybeSingle();

    if (error) return null;
    return data as Business;
  },

  /** Create a new business */
  async createBusiness(business: Partial<Business>): Promise<Business> {
    const profile = await profileService.getMyProfile();
    if (!profile) throw new Error('Profile not found');

    // Insert business
    const { data: newBusiness, error } = await supabase
      .from('businesses')
      .insert({
        ...business,
        owner_id: profile.user_id,
        status: 'draft',
      })
      .select()
      .maybeSingle();

    if (error) throw error;

    // Link business to profile
    const { error: linkError } = await supabase
      .from('profile_businesses')
      .insert({
        profile_id: profile.id,
        business_id: newBusiness.id,
        role: 'owner',
        is_primary_owner: true,
        is_active: true,
      });

    if (linkError) throw linkError;

    // Add business role to profile
    await supabase
      .from('profile_roles')
      .upsert({
        profile_id: profile.id,
        role_type: 'business',
        is_active: true,
      });

    return newBusiness as Business;
  },

  /** Update business */
  async updateBusiness(businessId: string, updates: Partial<Business>): Promise<Business> {
    const { data, error } = await supabase
      .from('businesses')
      .update(updates)
      .eq('id', businessId)
      .select()
      .maybeSingle();

    if (error) throw error;
    return data as Business;
  },

  /** Submit business for review (change status from draft to pending) */
  async submitForReview(businessId: string): Promise<Business> {
    return this.updateBusiness(businessId, { status: 'pending' });
  },

  /** Activate business (admin action, but owner can also activate after setup) */
  async activateBusiness(businessId: string): Promise<Business> {
    return this.updateBusiness(businessId, { status: 'active' });
  },

  /** Search businesses by type and location */
  async searchBusinesses(
    type?: BusinessType,
    city?: string,
    status: BusinessStatus = 'active',
    limit: number = 20
  ): Promise<Business[]> {
    let query = supabase
      .from('businesses')
      .select('*')
      .eq('status', status)
      .limit(limit);

    if (type) query = query.eq('business_type', type);
    if (city) query = query.ilike('city', `%${city}%`);

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []) as Business[];
  },

  /** Get business statistics */
  async getBusinessStats(businessId: string): Promise<{
    staffCount: number;
    branchCount: number;
    reviewCount: number;
    averageRating: number;
  }> {
    const { data: staff } = await supabase
      .from('business_staff')
      .select('id', { count: 'exact' })
      .eq('business_id', businessId)
      .eq('status', 'active');

    const { data: branches } = await supabase
      .from('business_branches')
      .select('id', { count: 'exact' })
      .eq('business_id', businessId);

    const business = await this.getBusinessById(businessId);

    return {
      staffCount: staff?.length || 0,
      branchCount: branches?.length || 0,
      reviewCount: business?.review_count || 0,
      averageRating: business?.average_rating || 0,
    };
  },
};

// ════════════════════════════════════════════════════════════════════════════
// BUSINESS BRANCH SERVICE
// ════════════════════════════════════════════════════════════════════════════

export const businessBranchService = {
  /** Get branches for a business */
  async getBranches(businessId: string): Promise<BusinessBranch[]> {
    const { data, error } = await supabase
      .from('business_branches')
      .select('*')
      .eq('business_id', businessId)
      .eq('is_active', true)
      .order('is_main_branch', { ascending: false });

    if (error) throw error;
    return (data || []) as BusinessBranch[];
  },

  /** Get main branch */
  async getMainBranch(businessId: string): Promise<BusinessBranch | null> {
    const { data, error } = await supabase
      .from('business_branches')
      .select('*')
      .eq('business_id', businessId)
      .eq('is_main_branch', true)
      .maybeSingle();

    if (error) return null;
    return data as BusinessBranch;
  },

  /** Create branch */
  async createBranch(branch: Partial<BusinessBranch>): Promise<BusinessBranch> {
    const { data, error } = await supabase
      .from('business_branches')
      .insert(branch)
      .select()
      .maybeSingle();

    if (error) throw error;
    return data as BusinessBranch;
  },

  /** Update branch */
  async updateBranch(branchId: string, updates: Partial<BusinessBranch>): Promise<BusinessBranch> {
    const { data, error } = await supabase
      .from('business_branches')
      .update(updates)
      .eq('id', branchId)
      .select()
      .maybeSingle();

    if (error) throw error;
    return data as BusinessBranch;
  },

  /** Delete branch (soft delete via is_active) */
  async deleteBranch(branchId: string): Promise<void> {
    const { error } = await supabase
      .from('business_branches')
      .update({ is_active: false })
      .eq('id', branchId);

    if (error) throw error;
  },
};

// ════════════════════════════════════════════════════════════════════════════
// BUSINESS STAFF SERVICE
// ════════════════════════════════════════════════════════════════════════════

export const businessStaffService = {
  /** Get staff for a business */
  async getStaff(businessId: string): Promise<BusinessStaff[]> {
    const { data, error } = await supabase
      .from('business_staff')
      .select('*')
      .eq('business_id', businessId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []) as BusinessStaff[];
  },

  /** Invite staff member */
  async inviteStaff(
    businessId: string,
    profileId: string,
    role: StaffRole,
    branchId?: string
  ): Promise<BusinessStaff> {
    const myProfile = await profileService.getMyProfile();
    if (!myProfile) throw new Error('Profile not found');

    const { data, error } = await supabase
      .from('business_staff')
      .insert({
        business_id: businessId,
        branch_id: branchId || null,
        profile_id: profileId,
        role,
        status: 'active',
        invited_by: myProfile.id,
        invited_at: new Date().toISOString(),
      })
      .select()
      .maybeSingle();

    if (error) throw error;
    return data as BusinessStaff;
  },

  /** Update staff role/status */
  async updateStaff(staffId: string, updates: Partial<BusinessStaff>): Promise<BusinessStaff> {
    const { data, error } = await supabase
      .from('business_staff')
      .update(updates)
      .eq('id', staffId)
      .select()
      .maybeSingle();

    if (error) throw error;
    return data as BusinessStaff;
  },

  /** Remove staff */
  async removeStaff(staffId: string): Promise<void> {
    const { error } = await supabase
      .from('business_staff')
      .update({ status: 'terminated', end_date: new Date().toISOString() })
      .eq('id', staffId);

    if (error) throw error;
  },
};

// ════════════════════════════════════════════════════════════════════════════
// PROFILE-BUSINESS JUNCTION SERVICE
// ════════════════════════════════════════════════════════════════════════════

export const profileBusinessService = {
  /** Get all businesses a profile is associated with */
  async getProfileBusinesses(profileId: string): Promise<ProfileBusiness[]> {
    const { data, error } = await supabase
      .from('profile_businesses')
      .select('*')
      .eq('profile_id', profileId)
      .eq('is_active', true);

    if (error) throw error;
    return (data || []) as ProfileBusiness[];
  },

  /** Check if profile owns a business */
  async isBusinessOwner(profileId: string, businessId: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('profile_businesses')
      .select('id')
      .eq('profile_id', profileId)
      .eq('business_id', businessId)
      .eq('role', 'owner')
      .eq('is_active', true)
      .maybeSingle();

    if (error || !data) return false;
    return true;
  },
};
