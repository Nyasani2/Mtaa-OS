// @ts-nocheck
import { supabase } from '@/lib/supabase';

export interface Payslip {
  id: string;
  teacher_id: string;
  institution_id: string;
  month: string;
  basic_salary: number;
  house_allowance: number;
  transport_allowance: number;
  hardship_allowance: number;
  other_allowances: number;
  gross_pay: number;
  nhif_deduction: number;
  nssf_deduction: number;
  paye_tax: number;
  loan_deduction: number;
  other_deductions: number;
  net_pay: number;
  status: string;
  paid_at: string | null;
  paid_via: string;
  created_at: string;
  updated_at: string;
}

export interface PayslipWithTeacher extends Payslip {
  teacher?: {
    id: string;
    user_id: string;
    full_name: string;
    profile?: {
      full_name: string;
      avatar_url: string;
    } | null;
  } | null;
}

export async function getPayrolls(filters?: {
  institution_id?: string;
  teacher_id?: string;
  status?: string;
  month?: string;
  limit?: number;
  offset?: number;
}) {
  try {
    let query = supabase
      .from('education_payroll')
      .select('*')
      .order('created_at', { ascending: false });

    if (filters?.institution_id) query = query.eq('institution_id', filters.institution_id);
    if (filters?.teacher_id) query = query.eq('teacher_id', filters.teacher_id);
    if (filters?.status) query = query.eq('status', filters.status);
    if (filters?.month) query = query.eq('month', filters.month);
    if (filters?.limit) query = query.limit(filters.limit);
    if (filters?.offset) query = query.range(filters.offset, filters.offset + (filters.limit || 20) - 1);

    const { data: payrolls, error } = await query;
    if (error) throw error;
    if (!payrolls?.length) return { data: [] as PayslipWithTeacher[], error: null };

    // Fetch teachers
    const teacherIds = payrolls.map((p: any) => p.teacher_id).filter(Boolean);
    let teachers: any[] = [];
    if (teacherIds.length > 0) {
      const { data: tData } = await supabase
        .from('education_teachers')
        .select('id, user_id, full_name')
        .in('id', teacherIds);
      teachers = tData || [];
    }

    // Fetch teacher profiles
    const teacherUserIds = teachers.map((t: any) => t.user_id).filter(Boolean);
    let teacherProfiles: any[] = [];
    if (teacherUserIds.length > 0) {
      const { data: tpData } = await supabase
        .from('user_profiles')
        .select('user_id, full_name, avatar_url')
        .in('user_id', teacherUserIds);
      teacherProfiles = tpData || [];
    }

    const merged = payrolls.map((payslip: any) => {
      const teacher = teachers.find((t: any) => t.id === payslip.teacher_id);
      const profile = teacherProfiles.find((p: any) => p.user_id === teacher?.user_id);
      return {
        ...payslip,
        teacher: teacher ? { ...teacher, profile: profile || null } : null,
      };
    });

    return { data: merged as PayslipWithTeacher[], error: null };
  } catch (error: any) {
    console.error('getPayrolls error:', error);
    return { data: [], error };
  }
}

export async function getPayslipById(id: string) {
  try {
    const { data: payslip, error } = await supabase
      .from('education_payroll')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;

    let teacher = null;
    if (payslip?.teacher_id) {
      const { data: tData } = await supabase
        .from('education_teachers')
        .select('id, user_id, full_name')
        .eq('id', payslip.teacher_id)
        .single();
      if (tData?.user_id) {
        const { data: pData } = await supabase
          .from('user_profiles')
          .select('user_id, full_name, avatar_url')
          .eq('user_id', tData.user_id)
          .single();
        teacher = { ...tData, profile: pData || null };
      }
    }

    return { data: { ...payslip, teacher } as PayslipWithTeacher, error: null };
  } catch (error: any) {
    console.error('getPayslipById error:', error);
    return { data: null, error };
  }
}

export async function createPayslip(payslip: Partial<Payslip>) {
  try {
    const gross = (payslip.basic_salary || 0) + (payslip.house_allowance || 0) +
                  (payslip.transport_allowance || 0) + (payslip.hardship_allowance || 0) +
                  (payslip.other_allowances || 0);
    const deductions = (payslip.nhif_deduction || 0) + (payslip.nssf_deduction || 0) +
                       (payslip.paye_tax || 0) + (payslip.loan_deduction || 0) +
                       (payslip.other_deductions || 0);
    const netPay = gross - deductions;

    const { data, error } = await supabase
      .from('education_payroll')
      .insert([{
        ...payslip,
        gross_pay: gross,
        net_pay: netPay,
      }])
      .select()
      .single();
    if (error) throw error;
    return { data: data as Payslip, error: null };
  } catch (error: any) {
    console.error('createPayslip error:', error);
    return { data: null, error };
  }
}

export async function updatePayslip(id: string, updates: Partial<Payslip>) {
  try {
    const { data, error } = await supabase
      .from('education_payroll')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return { data: data as Payslip, error: null };
  } catch (error: any) {
    console.error('updatePayslip error:', error);
    return { data: null, error };
  }
}

export async function markPayslipAsPaid(id: string, paidVia: string) {
  try {
    const { data, error } = await supabase
      .from('education_payroll')
      .update({
        status: 'paid',
        paid_at: new Date().toISOString(),
        paid_via: paidVia,
      })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return { data: data as Payslip, error: null };
  } catch (error: any) {
    console.error('markPayslipAsPaid error:', error);
    return { data: null, error };
  }
}
