import { supabase } from '@/lib/supabase';

export async function stkPush(phone: string, amount: number) {
  // placeholder for Safaricom Daraja API
  const response = await fetch('https://api.safaricom.co.ke/stkpush', {
    method: 'POST',
    body: JSON.stringify({ phone, amount })
  });

  return response.json();
}
