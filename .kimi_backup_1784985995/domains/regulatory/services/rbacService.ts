/**
 * MTAA Regulatory — RBAC Service
 * Financial admin role management
 */

import { supabase } from '@/lib/supabase'

export interface FinancialRole {
  id: string
  name: string
  description: string
  permissions: string[]
  jurisdiction: string
  is_system_role: boolean
  created_at: string
}

export interface RoleAssignment {
  id: string
  user_id: string
  role_id: string
  assigned_by: string | null
  assigned_at: string
  expires_at: string | null
  is_active: boolean
}

export interface UserWithRoles {
  user_id: string
  roles: FinancialRole[]
  permissions: string[]
}

class RBACService {
  private static instance: RBACService

  static getInstance(): RBACService {
    if (!RBACService.instance) RBACService.instance = new RBACService()
    return RBACService.instance
  }

  async getRoles(): Promise<{ data: FinancialRole[]; error?: string }> {
    const { data, error } = await supabase.from('financial_roles').select('*').order('name', { ascending: true })
    if (error) return { data: [], error: error.message }
    return { data: (data || []) as FinancialRole[] }
  }

  async getUserRoles(userId: string): Promise<UserWithRoles> {
    const { data, error } = await supabase.from('financial_role_assignments').select(`
      role_id, is_active, financial_roles:role_id (id, name, description, permissions, jurisdiction)
    `).eq('user_id', userId).eq('is_active', true)
    if (error) return { user_id: userId, roles: [], permissions: [] }
    const roles: FinancialRole[] = []
    const permissions = new Set<string>()
    for (const row of (data || [])) {
      const role = row.financial_roles as any
      if (role) {
        roles.push(role)
        for (const perm of (role.permissions || [])) permissions.add(perm)
      }
    }
    return { user_id: userId, roles, permissions: Array.from(permissions) }
  }

  async hasPermission(userId: string, permission: string): Promise<boolean> {
    const userRoles = await this.getUserRoles(userId)
    return userRoles.permissions.includes(permission)
  }

  async hasAnyPermission(userId: string, permissions: string[]): Promise<boolean> {
    const userRoles = await this.getUserRoles(userId)
    return permissions.some(p => userRoles.permissions.includes(p))
  }

  async assignRole(userId: string, roleId: string, assignedBy: string, expiresAt?: string): Promise<{ success: boolean; error?: string }> {
    const { error } = await supabase.from('financial_role_assignments').insert({
      user_id: userId, role_id: roleId, assigned_by: assignedBy, expires_at: expiresAt, is_active: true,
    })
    if (error) return { success: false, error: error.message }
    return { success: true }
  }

  async revokeRole(assignmentId: string): Promise<{ success: boolean; error?: string }> {
    const { error } = await supabase.from('financial_role_assignments').update({ is_active: false }).eq('id', assignmentId)
    if (error) return { success: false, error: error.message }
    return { success: true }
  }
}

export const rbacService = RBACService.getInstance()
