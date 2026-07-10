import { supabase } from '@/lib/supabase';

export const doctorService = {
  // ─── Dashboard ───
  async getStats(doctorId: string) {
    const { data: appointments } = await supabase
      .from('health_appointments')
      .select('id, status')
      .eq('doctor_id', doctorId)
      .gte('scheduled_at', new Date().toISOString().split('T')[0]);

    const { data: patients } = await supabase
      .from('health_patients')
      .select('id')
      .eq('primary_doctor_id', doctorId);

    const { data: orders } = await supabase
      .from('health_prescriptions')
      .select('id, status')
      .eq('doctor_id', doctorId);

    const { data: notes } = await supabase
      .from('health_records')
      .select('id, is_signed')
      .eq('doctor_id', doctorId);

    return {
      totalPatients: patients?.length || 0,
      todayAppointments: appointments?.filter((a: any) => a.status === 'scheduled').length || 0,
      pendingOrders: orders?.filter((o: any) => o.status === 'pending').length || 0,
      unsignedNotes: notes?.filter((n: any) => !n.is_signed).length || 0,
    };
  },

  async getTodayAppointments(doctorId: string) {
    const today = new Date().toISOString().split('T')[0];
    const { data, error } = await supabase
      .from('health_appointments')
      .select(`
        id, scheduled_at, status, type, reason,
        patient:patient_id (full_name, phone)
      `)
      .eq('doctor_id', doctorId)
      .gte('scheduled_at', today)
      .lt('scheduled_at', today + 'T23:59:59')
      .order('scheduled_at', { ascending: true });
    if (error) throw error;
    return data || [];
  },

  async getPendingOrders(doctorId: string) {
    const { data, error } = await supabase
      .from('health_prescriptions')
      .select(`
        id, type, status, created_at, details,
        patient:patient_id (full_name)
      `)
      .eq('doctor_id', doctorId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  // ─── Prescribe ───
  async getActivePatients() {
    const { data, error } = await supabase
      .from('health_patients')
      .select('id, full_name, phone, date_of_birth, gender')
      .eq('status', 'active')
      .order('full_name');
    if (error) throw error;
    return data || [];
  },

  async getPharmacyInventory() {
    const { data, error } = await supabase
      .from('health_pharmacy_inventory')
      .select('id, name, generic_name, stock_quantity, unit_price, dosage_form')
      .gt('stock_quantity', 0)
      .order('name');
    if (error) throw error;
    return data || [];
  },

  async createPrescription(data: any) {
    const { data: result, error } = await supabase
      .from('health_prescriptions')
      .insert({
        doctor_id: data.doctor_id,
        patient_id: data.patient_id,
        diagnosis: data.diagnosis,
        notes: data.notes,
        status: 'active',
      })
      .select()
      .single();
    if (error) throw error;

    // Insert prescription items
    if (data.medications?.length > 0) {
      const items = data.medications.map((m: any) => ({
        prescription_id: result.id,
        inventory_id: m.inventory_id,
        medication_name: m.name,
        dosage: m.dosage,
        frequency: m.frequency,
        duration: m.duration,
        route: m.route,
        instructions: m.instructions,
      }));
      await supabase.from('health_prescription_items').insert(items);
    }
    return result;
  },

  // ─── Orders ───
  async getOrders(doctorId: string) {
    const { data, error } = await supabase
      .from('health_prescriptions')
      .select(`
        id, type, status, details, created_at, completed_at,
        patient:patient_id (full_name)
      `)
      .eq('doctor_id', doctorId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async createOrder(data: any) {
    const { data: result, error } = await supabase
      .from('health_prescriptions')
      .insert({
        doctor_id: data.doctor_id,
        patient_id: data.patient_id,
        type: data.type,
        details: data.details,
        status: 'pending',
      })
      .select()
      .single();
    if (error) throw error;
    return result;
  },

  async cancelOrder(orderId: string) {
    const { error } = await supabase
      .from('health_prescriptions')
      .update({ status: 'cancelled', cancelled_at: new Date().toISOString() })
      .eq('id', orderId);
    if (error) throw error;
  },

  // ─── Follow-ups ───
  async getFollowUps(doctorId: string) {
    const { data, error } = await supabase
      .from('health_appointments')
      .select(`
        id, scheduled_date, type, notes, status, completed_at,
        patient:patient_id (full_name, phone)
      `)
      .eq('doctor_id', doctorId)
      .order('scheduled_date', { ascending: true });
    if (error) throw error;
    return data || [];
  },

  async createFollowUp(data: any) {
    const { data: result, error } = await supabase
      .from('health_appointments')
      .insert({
        doctor_id: data.doctor_id,
        patient_id: data.patient_id,
        scheduled_date: data.scheduled_date,
        type: data.type,
        notes: data.notes,
        status: 'scheduled',
      })
      .select()
      .single();
    if (error) throw error;
    return result;
  },

  async completeFollowUp(id: string) {
    const { error } = await supabase
      .from('health_appointments')
      .update({ status: 'completed', completed_at: new Date().toISOString() })
      .eq('id', id);
    if (error) throw error;
  },

  // ─── Lab Orders ───
  async getLabOrders(doctorId: string) {
    const { data, error } = await supabase
      .from('health_lab_orders')
      .select(`
        id, status, urgency, notes, created_at, completed_at,
        patient:patient_id (full_name),
        test:test_id (name, category)
      `)
      .eq('doctor_id', doctorId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async getLabTests() {
    const { data, error } = await supabase
      .from('health_lab_tests')
      .select('id, name, category, description, normal_range, price')
      .order('category');
    if (error) throw error;
    return data || [];
  },

  async createLabOrder(data: any) {
    const { data: result, error } = await supabase
      .from('health_lab_orders')
      .insert({
        doctor_id: data.doctor_id,
        patient_id: data.patient_id,
        test_id: data.test_id,
        urgency: data.urgency || 'routine',
        notes: data.notes,
        status: 'ordered',
      })
      .select()
      .single();
    if (error) throw error;
    return result;
  },

  // ─── Notes ───
  async getNotes(doctorId: string) {
    const { data, error } = await supabase
      .from('health_records')
      .select(`
        id, title, content, type, is_signed, signed_at, created_at,
        patient:patient_id (full_name)
      `)
      .eq('doctor_id', doctorId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data || []).map((n: any) => ({
      ...n,
      patient_name: n.patient?.full_name || 'Unknown',
    }));
  },

  async createNote(data: any) {
    const { data: result, error } = await supabase
      .from('health_records')
      .insert({
        doctor_id: data.doctor_id,
        patient_id: data.patient_id,
        title: data.title,
        content: data.content,
        type: data.type || 'progress',
        is_signed: false,
      })
      .select()
      .single();
    if (error) throw error;
    return result;
  },

  async signNote(noteId: string, doctorId: string) {
    const { error } = await supabase
      .from('health_records')
      .update({
        is_signed: true,
        signed_at: new Date().toISOString(),
        signed_by: doctorId,
      })
      .eq('id', noteId)
      .eq('is_signed', false);
    if (error) throw error;
  },
};
