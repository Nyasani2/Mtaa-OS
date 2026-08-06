// lib/services/family-service.ts
// MTAA OS V10 — Family & Child Account Management
// Unified Auth: accepts userId from hook layer (useAuthStore)

import { supabase } from '@/lib/supabase';

export interface FamilyGroup {
  id: string; name: string | null; created_by: string; created_at: string;
}
export interface FamilyMember {
  id: string; family_id: string; user_id: string;
  role: 'parent' | 'guardian' | 'child' | 'dependent';
  is_primary: boolean; permissions: Record<string, any>; created_at: string;
}
export interface ChildSubAccount {
  id: string; family_id: string; parent_id: string; display_name: string;
  date_of_birth: string | null; avatar_url: string | null; pin_code: string | null;
  is_active: boolean; spending_limit: number | null;
  permissions: { can_post: boolean; can_comment: boolean; can_purchase: boolean; can_message: boolean; can_join_tribes: boolean; education_access: boolean; streets_access: boolean; studio_access: boolean; };
  created_at: string;
}
export interface CreateChildInput {
  display_name: string; date_of_birth?: string; pin_code?: string;
  spending_limit?: number; permissions?: Partial<ChildSubAccount['permissions']>;
}

export async function getFamilyGroups(userId: string): Promise<FamilyGroup[]> {
  const { data, error } = await supabase.from('family_groups').select('*').eq('created_by', userId).order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []) as FamilyGroup[];
}

export async function createFamilyGroup(userId: string, name?: string): Promise<FamilyGroup> {
  const { data, error } = await supabase.from('family_groups').insert({ created_by: userId, name: name || 'My Family' }).select().single();
  if (error) throw error;
  return data as FamilyGroup;
}

export async function deleteFamilyGroup(userId: string, groupId: string): Promise<void> {
  const { error } = await supabase.from('family_groups').delete().eq('id', groupId).eq('created_by', userId);
  if (error) throw error;
}

export async function getFamilyMembers(userId: string): Promise<any[]> {
  const { data, error } = await supabase.rpc('get_family_members', { p_user_id: userId });
  if (error) throw error;
  return data || [];
}

export async function addFamilyMember(userId: string, familyId: string, memberUserId: string, role: FamilyMember['role'] = 'child'): Promise<FamilyMember> {
  const { data, error } = await supabase.from('family_members').insert({ family_id: familyId, user_id: memberUserId, role, is_primary: role === 'parent' }).select().single();
  if (error) throw error;
  return data as FamilyMember;
}

export async function removeFamilyMember(userId: string, familyId: string, memberUserId: string): Promise<void> {
  const { error } = await supabase.from('family_members').delete().eq('family_id', familyId).eq('user_id', memberUserId);
  if (error) throw error;
}

export async function getChildSubAccounts(userId: string): Promise<ChildSubAccount[]> {
  const { data, error } = await supabase.rpc('get_child_sub_accounts', { p_parent_id: userId });
  if (error) throw error;
  return (data || []) as ChildSubAccount[];
}

export async function createChildSubAccount(userId: string, familyId: string, input: CreateChildInput): Promise<ChildSubAccount> {
  const { data, error } = await supabase.rpc('create_child_sub_account', {
    p_parent_id: userId, p_family_id: familyId, p_display_name: input.display_name,
    p_date_of_birth: input.date_of_birth || null, p_pin_code: input.pin_code || null,
    p_permissions: input.permissions ? JSON.stringify({ can_post: false, can_comment: false, can_purchase: false, can_message: false, can_join_tribes: false, education_access: true, streets_access: false, studio_access: false, ...input.permissions }) : null,
  });
  if (error) throw error;
  const { data: child, error: fetchError } = await supabase.from('child_sub_accounts').select('*').eq('id', data).single();
  if (fetchError) throw fetchError;
  return child as ChildSubAccount;
}

export async function updateChildSubAccount(userId: string, childId: string, updates: Partial<CreateChildInput>): Promise<ChildSubAccount> {
  const { data, error } = await supabase.from('child_sub_accounts').update({ ...updates, updated_at: new Date().toISOString() }).eq('id', childId).eq('parent_id', userId).select().single();
  if (error) throw error;
  return data as ChildSubAccount;
}

export async function deleteChildSubAccount(userId: string, childId: string): Promise<void> {
  const { error } = await supabase.from('child_sub_accounts').delete().eq('id', childId).eq('parent_id', userId);
  if (error) throw error;
}

export async function toggleChildActive(userId: string, childId: string, isActive: boolean): Promise<ChildSubAccount> {
  const { data, error } = await supabase.from('child_sub_accounts').update({ is_active: isActive, updated_at: new Date().toISOString() }).eq('id', childId).eq('parent_id', userId).select().single();
  if (error) throw error;
  return data as ChildSubAccount;
}

export async function loginChildWithPin(childId: string, pinCode: string): Promise<ChildSubAccount | null> {
  const { data, error } = await supabase.from('child_sub_accounts').select('*').eq('id', childId).eq('pin_code', pinCode).eq('is_active', true).single();
  if (error || !data) return null;
  return data as ChildSubAccount;
}

export function canChildPerform(child: ChildSubAccount, action: keyof ChildSubAccount['permissions']): boolean {
  return child.permissions?.[action] === true;
}

export async function getParentDashboardStats(userId: string): Promise<{ childrenCount: number; familyGroupsCount: number; pendingApprovals: number }> {
  const [{ count: children }, { count: groups }, { count: pending }] = await Promise.all([
    supabase.from('child_sub_accounts').select('*', { count: 'exact', head: true }).eq('parent_id', userId),
    supabase.from('family_groups').select('*', { count: 'exact', head: true }).eq('created_by', userId),
    supabase.from('child_sub_accounts').select('*', { count: 'exact', head: true }).eq('parent_id', userId).eq('is_active', false),
  ]);
  return { childrenCount: children || 0, familyGroupsCount: groups || 0, pendingApprovals: pending || 0 };
}
