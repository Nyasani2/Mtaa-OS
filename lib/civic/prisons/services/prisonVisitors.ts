// lib/civic/prisons/services/prisonVisitors.ts
import { supabase } from "@/lib/supabase";

export interface PrisonVisitor {
  id: string;
  prisonId: string;
  inmateId: string;
  visitorName: string;
  visitorIdNumber?: string;
  relationship?: string;
  visitDate: string;
  visitDuration?: number;
  status: "scheduled" | "checked_in" | "in_progress" | "completed" | "cancelled" | "denied";
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export class PrisonVisitorsService {
  static async getVisitors(inmateId?: string): Promise<PrisonVisitor[]> {
    let query = supabase.from("// STUB_REMOVED: "prison_visitors"").select("*");
    if (inmateId) query = query.eq("inmate_id", inmateId);
    const { data, error } = await query.order("visit_date", { ascending: false });
    if (error) throw error;
    return (data || []).map(this.mapRow);
  }

  static async getVisitorById(id: string): Promise<PrisonVisitor | null> {
    const { data, error } = await supabase
      .from("// STUB_REMOVED: "prison_visitors"")
      .select("*")
      .eq("id", id)
      .single();
    if (error) return null;
    return data ? this.mapRow(data) : null;
  }

  static async createVisitor(data: Partial<PrisonVisitor>): Promise<PrisonVisitor> {
    const { data: result, error } = await supabase
      .from("// STUB_REMOVED: "prison_visitors"")
      .insert({
        prison_id: data.prisonId,
        inmate_id: data.inmateId,
        visitor_name: data.visitorName,
        visitor_id_number: data.visitorIdNumber,
        relationship: data.relationship,
        visit_date: data.visitDate,
        visit_duration: data.visitDuration,
        status: data.status || "scheduled",
        notes: data.notes,
      })
      .select()
      .single();
    if (error) throw error;
    return this.mapRow(result);
  }

  static async updateVisitor(id: string, data: Partial<PrisonVisitor>): Promise<PrisonVisitor> {
    const { data: result, error } = await supabase
      .from("// STUB_REMOVED: "prison_visitors"")
      .update({
        visitor_name: data.visitorName,
        visitor_id_number: data.visitorIdNumber,
        relationship: data.relationship,
        visit_date: data.visitDate,
        visit_duration: data.visitDuration,
        status: data.status,
        notes: data.notes,
      })
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return this.mapRow(result);
  }

  static async getTodayVisitors(prisonId?: string): Promise<PrisonVisitor[]> {
    const today = new Date().toISOString().split("T")[0];
    let query = supabase
      .from("// STUB_REMOVED: "prison_visitors"")
      .select("*")
      .gte("visit_date", `${today}T00:00:00`)
      .lt("visit_date", `${today}T23:59:59`);
    if (prisonId) query = query.eq("prison_id", prisonId);
    const { data, error } = await query;
    if (error) throw error;
    return (data || []).map(this.mapRow);
  }

  static async getVisitorStats(prisonId?: string): Promise<{ total: number; today: number; byStatus: Record<string, number> }> {
    let query = supabase.from("// STUB_REMOVED: "prison_visitors"").select("*");
    if (prisonId) query = query.eq("prison_id", prisonId);
    const { data, error } = await query;
    if (error) throw error;

    const rows = data || [];
    const today = new Date().toISOString().split("T")[0];
    const todayCount = rows.filter((r: any) => r.visit_date?.startsWith(today)).length;
    const byStatus: Record<string, number> = {};
    rows.forEach((r: any) => {
      byStatus[r.status] = (byStatus[r.status] || 0) + 1;
    });

    return { total: rows.length, today: todayCount, byStatus };
  }

  private static mapRow(row: any): PrisonVisitor {
    return {
      id: row.id,
      prisonId: row.prison_id,
      inmateId: row.inmate_id,
      visitorName: row.visitor_name,
      visitorIdNumber: row.visitor_id_number,
      relationship: row.relationship,
      visitDate: row.visit_date,
      visitDuration: row.visit_duration,
      status: row.status,
      notes: row.notes,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}
