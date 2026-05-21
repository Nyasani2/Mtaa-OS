import { supabase } from '../../shared/lib/supabase'
import { PoliceOfficer } from '../types/police.types'

export const officerService = {
  async getOfficers(stationId?: string): Promise<PoliceOfficer[]> {
    let query = supabase
      .from('police_officers')
      .select(`
        *,
        profiles:profile_id(full_name, phone, email, avatar_url)
      `)
      .eq('is_active', true)
      .order('rank', { ascending: true })

    if (stationId) {
      query = query.eq('station_id', stationId)
    }

    const { data, error } = await query
    if (error) throw error

    return (data || []).map((o: any) => ({
      ...o,
      full_name: o.profiles?.full_name,
      phone: o.profiles?.phone,
      email: o.profiles?.email,
      avatar_url: o.profiles?.avatar_url,
    }))
  },

  async getOfficerById(id: string): Promise<PoliceOfficer | null> {
    const { data, error } = await supabase
      .from('police_officers')
      .select(`
        *,
        profiles:profile_id(full_name, phone, email, avatar_url)
      `)
      .eq('id', id)
      .single()

    if (error) throw error
    if (!data) return null

    return {
      ...data,
      full_name: data.profiles?.full_name,
      phone: data.profiles?.phone,
      email: data.profiles?.email,
      avatar_url: data.profiles?.avatar_url,
    }
  },

  async getOfficersByDutyStatus(stationId: string, status: string): Promise<PoliceOfficer[]> {
    const { data, error } = await supabase
      .from('police_officers')
      .select(`
        *,
        profiles:profile_id(full_name, phone, email, avatar_url)
      `)
      .eq('station_id', stationId)
      .eq('duty_status', status)
      .eq('is_active', true)

    if (error) throw error

    return (data || []).map((o: any) => ({
      ...o,
      full_name: o.profiles?.full_name,
      phone: o.profiles?.phone,
      email: o.profiles?.email,
      avatar_url: o.profiles?.avatar_url,
    }))
  },

  async updateDutyStatus(officerId: string, status: string): Promise<void> {
    const { error } = await supabase
      .from('police_officers')
      .update({ duty_status: status, updated_at: new Date().toISOString() })
      .eq('id', officerId)

    if (error) throw error
  },

  async getOfficerStats(stationId: string): Promise<{
    total: number
    on_duty: number
    on_patrol: number
    off_duty: number
    on_leave: number
  }> {
    const { data, error } = await supabase
      .from('police_officers')
      .select('duty_status')
      .eq('station_id', stationId)

    if (error) throw error

    const stats = { total: 0, on_duty: 0, on_patrol: 0, off_duty: 0, on_leave: 0 }
    data?.forEach((o: any) => {
      stats.total++
      if (o.duty_status === 'on_duty') stats.on_duty++
      if (o.duty_status === 'on_patrol') stats.on_patrol++
      if (o.duty_status === 'off_duty') stats.off_duty++
      if (o.duty_status === 'on_leave') stats.on_leave++
    })

    return stats
  }
}
