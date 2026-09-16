/**
 * MTAA Health - Idempotent Seed Script
 * Run:  npx tsx scripts/seed-database.ts        (or: node --loader tsx ...)
 * Needs: .env with SUPABASE_SERVICE_ROLE_KEY + EXPO_PUBLIC_SUPABASE_URL
 */
import { config } from 'dotenv';
config();
import { createClient } from '@supabase/supabase-js';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
if (!url || !key) { console.error('Missing EXPO_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env'); process.exit(1); }
const db = createClient(url, key);

async function upsert(table: string, rows: any[], onConflict: string) {
  const { data, error } = await db.from(table).upsert(rows, { onConflict, ignoreDuplicates: true }).select();
  if (error) console.error(`[seed:${table}]`, error.message);
  else console.log(`[seed:${table}]`, data?.length ?? 0, 'rows ok');
  return data;
}

async function main() {
  console.log('🌱 Seeding MTAA Health (idempotent)...');

  await upsert('health_roles', [
    { name: 'doctor',      description: 'Diagnose, prescribe, review history', permissions: ['patients.read','patients.write','rx.write','lab.order'] },
    { name: 'nurse',       description: 'Record vitals, administer medication', permissions: ['patients.read','vitals.write'] },
    { name: 'lab_technician', description: 'Process lab tests, upload results', permissions: ['lab.read','lab.write'] },
    { name: 'pharmacist',  description: 'Dispense medication, manage inventory', permissions: ['rx.read','pharmacy.write'] },
    { name: 'receptionist',description: 'Patient check-in, appointments', permissions: ['appt.write','patients.read'] },
    { name: 'accountant',  description: 'Billing, payments, insurance claims', permissions: ['billing.read','billing.write'] },
    { name: 'admin',       description: 'Staff management, operations', permissions: ['all'] },
  ], 'name');

  const facilities = await upsert('health_facilities', [
    { name: 'MTAA Demo Hospital', type: 'hospital', city: 'Nairobi', county: 'Nairobi', license_number: 'KMPDB-DEMO-001', is_active: true },
  ], 'license_number');

  const facId = facilities?.[0]?.id;
  if (facId) {
    await upsert('health_patients', [
      { first_name: 'John', last_name: 'Doe', date_of_birth: '1990-01-01', gender: 'male', phone: '+254700000001', facility_hint: facId },
    ], 'phone');
  }

  console.log('✅ Seed complete');
}
main().catch(e => { console.error(e); process.exit(1); });
