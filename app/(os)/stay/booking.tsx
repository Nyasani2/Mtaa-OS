import { Alert, useState } from 'react';
// @ts-nocheck
import React, { useEffect, useState } from 'react';
import { Alert, View, Text, ScrollView, TextInput, TouchableOpacity, Image } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { supabase } from '@/lib/supabase';

export default function BookingScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { user } = useAuthStore();
  const [listing, setListing] = useState(null);
  const [checkIn, setCheckIn] = useState(() => new Date(Date.now() + 86400000).toISOString().slice(0, 10));
  const [nights, setNights] = useState(1);
  const [guests, setGuests] = useState(1);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);

  useEffect(() => { (async () => {
    const { data } = await supabase.from('properties').select('*').eq('id', id).single();
    setListing(data);
  })(); }, [id]);

  if (!listing) return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><Text>Loading…</Text></View>;

  const nightly = Number(listing.price_per_night || 0);
  const subtotal = nightly * nights;
  const cleaning = Number(listing.cleaning_fee || 0);
  const base = subtotal + cleaning;
  const guestFee = Math.round(base * 0.03);
  const hostGross = Math.round(base * 0.97);
  const hostNet = hostGross; // WHT computed at confirm time with country lookup
  const checkOut = new Date(new Date(checkIn).getTime() + nights * 86400000).toISOString().slice(0, 10);

  const confirm = async () => {
    setErr(null);
    if (!user?.id) { setErr('Sign in first'); return; }
    setBusy(true);
    try {
      const { data: w } = await supabase.from('wallet_accounts').select('balance').eq('user_id', user.id).maybeSingle();
      const bal = Number(w?.balance || 0);
      if (bal < guestTotal) { setErr('❌ Insufficient wallet balance (KES ' + bal + '). Top up first.'); setBusy(false); return; }
      const ref = 'stay-' + Date.now();
      const { error: de } = await supabase.rpc('wallet_debit', { _user_id: user.id, _amount: guestTotal, _reference: 'Stay booking: ' + listing.title });
      if (de) throw new Error(de.message);
      const { data: wht } = await supabase.from('withholding_tax_rates').select('rate_percent, tax_authority').eq('country_code', listing.country || 'KE').maybeSingle();
      const whtRate = Number(wht?.rate_percent || 0) / 100;
      const whtAmt = Math.round(hostGross * whtRate);
      const hostPayout = hostGross - whtAmt;
      try { await supabase.rpc('mtaa_credit_wallet', { p_user_id: listing.owner_id, p_amount: hostPayout, p_description: 'Stay booking payout (net of WHT)', p_reference: ref, p_topup_method: 'booking' }); } catch {}
      if (whtAmt > 0) {
        await supabase.from('government_tax_wallets').update({ balance: supabase.raw('balance + ' + whtAmt), total_withheld: supabase.raw('total_withheld + ' + whtAmt), updated_at: new Date().toISOString() }).eq('country_code', listing.country || 'KE').catch(() => {});
      }
      const { error: be } = await supabase.from('property_bookings').insert({
        property_id: listing.id, guest_id: user.id, host_id: listing.owner_id,
        check_in_date: new Date(checkIn).toISOString(), check_out_date: new Date(checkOut).toISOString(),
        guest_count: guests, nightly_rate: nightly, nights_count: nights,
        subtotal: subtotal, cleaning_fee: cleaning, service_fee: guestFee, discount_amount: 0,
        total_amount: guestTotal, currency: listing.currency || 'KES',
        payment_status: 'fully_paid', booking_status: 'confirmed',
      }).select().single();
      if (be) throw new Error(be.message);
      Alert.alert('✅ Booked!', 'You paid: KES ' + guestTotal.toLocaleString() + '\n\nHost net: KES ' + hostPayout.toLocaleString() + '\nWHT to ' + (wht?.tax_authority || 'govt') + ': KES ' + whtAmt + ' (' + Math.round(whtRate*100) + '%)');
      router.replace('/stay/bookings');
    } catch (e) { setErr(String(e?.message || e)); }
    setBusy(false);
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#f8f6f1' }} contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
      <TouchableOpacity onPress={() => router.back()}><Text style={{ color: '#1a5c4b', fontWeight: '700', marginBottom: 12 }}>← Back</Text></TouchableOpacity>
      {listing.cover_image ? <Image source={{ uri: listing.cover_image }} style={{ width: '100%', height: 180, borderRadius: 14, marginBottom: 12 }} /> : null}
      <Text style={{ fontSize: 20, fontWeight: '800' }}>{listing.title}</Text>
      <Text style={{ color: '#6b7280', marginBottom: 16 }}>{listing.town}, {listing.country} · KES {nightly.toLocaleString()}/night</Text>

      <Text style={{ fontWeight: '700', marginBottom: 6 }}>Check-in (YYYY-MM-DD)</Text>
      <TextInput value={checkIn} onChangeText={setCheckIn} style={{ backgroundColor: '#fff', borderRadius: 10, padding: 12, marginBottom: 12 }} />

      <View style={{ flexDirection: 'row', marginBottom: 12 }}>
        <View style={{ flex: 1, backgroundColor: '#fff', borderRadius: 10, padding: 12, marginRight: 6 }}>
          <Text style={{ color: '#6b7280', fontSize: 12 }}>Nights</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <TouchableOpacity onPress={() => setNights(n => Math.max(1, n - 1))}><Text style={{ fontSize: 20, fontWeight: '800' }}>−</Text></TouchableOpacity>
            <Text style={{ fontSize: 16, fontWeight: '800' }}>{nights}</Text>
            <TouchableOpacity onPress={() => setNights(n => Math.min(30, n + 1))}><Text style={{ fontSize: 20, fontWeight: '800' }}>+</Text></TouchableOpacity>
          </View>
        </View>
        <View style={{ flex: 1, backgroundColor: '#fff', borderRadius: 10, padding: 12, marginLeft: 6 }}>
          <Text style={{ color: '#6b7280', fontSize: 12 }}>Guests</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <TouchableOpacity onPress={() => setGuests(g => Math.max(1, g - 1))}><Text style={{ fontSize: 20, fontWeight: '800' }}>−</Text></TouchableOpacity>
            <Text style={{ fontSize: 16, fontWeight: '800' }}>{guests}</Text>
            <TouchableOpacity onPress={() => setGuests(g => Math.min(16, g + 1))}><Text style={{ fontSize: 20, fontWeight: '800' }}>+</Text></TouchableOpacity>
          </View>
        </View>
      </View>

      <View style={{ backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 12 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}><Text>KES {nightly.toLocaleString()} × {nights} nights</Text><Text>KES {subtotal.toLocaleString()}</Text></View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}><Text>Cleaning fee</Text><Text>KES {cleaning.toLocaleString()}</Text></View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}><Text>Guest service fee (3%)</Text><Text>KES {guestFee.toLocaleString()}</Text></View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: '#e5e0d5', paddingTop: 8 }}>
          <Text style={{ fontWeight: '800' }}>Total (you pay)</Text><Text style={{ fontWeight: '800', color: '#1a5c4b' }}>KES {guestTotal.toLocaleString()}</Text>
        </View>
        <Text style={{ color: '#6b7280', fontSize: 12, marginTop: 8 }}>Check-out {checkOut} · Host receives KES {hostNet.toLocaleString()} (3% platform commission)</Text>
      </View>

      {err ? <Text style={{ color: '#c92a2a', fontWeight: '700', marginBottom: 10 }}>{err}</Text> : null}
      <TouchableOpacity onPress={confirm} disabled={busy} style={{ backgroundColor: '#1a5c4b', borderRadius: 12, paddingVertical: 16, alignItems: 'center', opacity: busy ? 0.6 : 1 }}>
        <Text style={{ color: '#fff', fontSize: 16, fontWeight: '800' }}>{busy ? 'Booking…' : 'Confirm & Pay from Wallet'}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
