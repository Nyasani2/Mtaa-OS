// @ts-nocheck
import React, { useEffect, useState, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { supabase } from '@/lib/supabase';
import { CameraView, useCameraPermissions } from 'expo-camera';

const TZ_COUNTRY = { 'Africa/Nairobi':'KE','Africa/Dar_es_Salaam':'TZ','Africa/Kampala':'UG','Africa/Lagos':'NG','Africa/Johannesburg':'ZA','Africa/Kigali':'RW','Africa/Addis_Ababa':'ET','Africa/Accra':'GH','Europe/London':'GB','America/New_York':'US','Asia/Kolkata':'IN' };

export default function SellPOSScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { user } = useAuthStore();
  const [mode, setMode] = useState('sell');
  const [code, setCode] = useState('');
  const [lines, setLines] = useState([]);
  const [taxes, setTaxes] = useState([]);
  const [country, setCountry] = useState('KE');
  const [msg, setMsg] = useState(null);
  const [busy, setBusy] = useState(false);
  const [newProd, setNewProd] = useState(null);
  const [npName, setNpName] = useState('');
  const [npPrice, setNpPrice] = useState('');
  const [npStock, setNpStock] = useState('1');
  const ref = useRef(null);
  const [scanning, setScanning] = useState(false);
  const [perm, requestPerm] = useCameraPermissions();
  const lastScan = useRef(0);
  const [taxOn, setTaxOn] = useState(true);
  const zxingRef = useRef(null);

  useEffect(() => { (async () => {
    const { data } = await supabase.from('tax_settings').select('*').eq('is_active', true).order('country_name');
    setTaxes(data || []);
    let cc = null;
    try { const { data: prof } = await supabase.from('user_profiles').select('country').eq('user_id', user?.id).maybeSingle(); cc = prof?.country; } catch {}
    if (!cc) { try { cc = TZ_COUNTRY[Intl.DateTimeFormat().resolvedOptions().timeZone]; } catch {} }
    if (cc && (data || []).some(t => t.country_code === cc)) setCountry(cc);
  })(); }, []);

  const tax = taxes.find(t => t.country_code === country) || taxes.find(t => t.country_code === 'DEFAULT') || { rate_percent: 0, tax_name: 'VAT' };
  const rate = Number(tax.rate_percent || 0);
  const subtotal = lines.reduce((s, l) => s + Number(l.price) * l.qty, 0);
  const taxAmt = taxOn ? Math.round(subtotal * rate / (100 + rate)) : 0;
  const sellerNet = subtotal - taxAmt;

  const onScan = (e) => {
    const now = Date.now();
    if (now - lastScan.current < 1500) return;
    lastScan.current = now;
    if (e?.data) lookup(e.data);
  };

  const startCamera = async () => {
    const ok = await requestPerm();
    if (ok?.granted) setScanning(true);
    else setMsg('Camera permission denied');
  };

  const stopWebScanner = () => {
    try { zxingRef.current?.stop(); } catch {}
    zxingRef.current = null;
    const el = document.getElementById('pos-scan-overlay'); if (el) el.remove();
    setScanning(false);
  };

  const startWebScanner = async () => {
    setScanning(true);
    const wrap = document.createElement('div');
    wrap.id = 'pos-scan-overlay';
    wrap.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.9);z-index:9999;display:flex;align-items:center;justify-content:center;flex-direction:column;';
    const vid = document.createElement('video');
    vid.setAttribute('playsinline', 'true'); vid.setAttribute('autoplay', 'true'); vid.muted = true;
    vid.style.cssText = 'width:92%;max-width:640px;border-radius:12px;';
    const laser = document.createElement('div');
    laser.style.cssText = 'position:fixed;top:50%;left:8%;right:8%;height:2px;background:#00ff00;pointer-events:none;';
    const btn = document.createElement('button');
    btn.textContent = '✖ Close Camera';
    btn.style.cssText = 'margin-top:14px;padding:12px 28px;border:none;border-radius:10px;background:#c92a2a;color:#fff;font-weight:700;font-size:15px;';
    btn.onclick = stopWebScanner;
    wrap.appendChild(vid); wrap.appendChild(laser); wrap.appendChild(btn);
    document.body.appendChild(wrap);
    try {
      const { BrowserMultiFormatReader } = await import('@zxing/browser');
      const reader = new BrowserMultiFormatReader();
      zxingRef.current = await reader.decodeFromVideoDevice(undefined, vid, (result) => { if (result) onScan({ data: result.getText() }); });
    } catch (e) { alert('Scanner error: ' + (e?.message || e)); stopWebScanner(); }
  };

  const lookup = async (raw) => {
    const q = (raw || code).trim(); setCode('');
    if (!q) return;
    const { data } = await supabase.from('products').select('*').eq('shop_id', id).or(`barcode.eq.${q},sku.eq.${q}`).limit(1);
    if (!data?.length) {
      if (mode === 'stock') { setNewProd({ barcode: q }); setNpName(''); setNpPrice(''); setNpStock('1'); }
      else setMsg('Not found: ' + q + ' (switch to STOCK to add it)');
      return;
    }
    const p = data[0];
    if (mode === 'stock') {
      const add = typeof window !== 'undefined' ? parseInt(window.prompt('Stock for ' + p.name + ' — add how many?', '10'), 10) : 10;
      const n = isNaN(add) ? 0 : add;
      await supabase.from('products').update({ stock_quantity: (Number(p.stock_quantity) || 0) + n }).eq('id', p.id);
      setMsg('✅ +' + n + ' → ' + p.name + ' stock now ' + ((Number(p.stock_quantity) || 0) + n));
    } else {
      setLines(prev => {
        const ex = prev.find(l => l.id === p.id);
        if (ex) return prev.map(l => l.id === p.id ? { ...l, qty: l.qty + 1 } : l);
        return [...prev, { id: p.id, name: p.name, price: Number(p.selling_price) || 0, stock: Number(p.stock_quantity) || 0, qty: 1 }];
      });
      setMsg(null);
    }
    ref.current?.focus();
  };

  const saveNewProduct = async () => {
    if (!npName.trim() || !npPrice) { setMsg('Name + price required'); return; }
    const { error } = await supabase.from('products').insert({
      shop_id: id, name: npName.trim(), selling_price: Number(npPrice), cost_price: 0,
      stock_quantity: Number(npStock) || 0, sku: newProd.barcode || ('SKU-' + Date.now()),
      barcode: newProd.barcode || null, is_active: true, images: [],
    });
    if (error) { setMsg('Create failed: ' + error.message); return; }
    setMsg('✅ ' + npName + ' stocked with barcode ' + newProd.barcode);
    setNewProd(null);
  };

  const checkout = async () => {
    if (!lines.length || busy) return;
    setBusy(true);
    try {
      for (const l of lines) {
        if ((l.stock || 0) < l.qty) throw new Error(l.name + ': only ' + l.stock + ' in stock');
      }
      for (const l of lines) {
        await supabase.from('products').update({ stock_quantity: (l.stock || 0) - l.qty }).eq('id', l.id);
      }
      try { await supabase.rpc('mtaa_credit_wallet', { p_user_id: user.id, p_amount: sellerNet, p_description: 'POS sale', p_reference: 'pos-' + Date.now(), p_topup_method: 'pos' }); } catch {}
      if (taxAmt > 0) {
        await supabase.from('tax_payments').insert({ shop_id: id, seller_id: user.id, country_code: country, tax_name: tax.tax_name, rate_percent: rate, taxable_amount: subtotal, tax_amount: taxAmt, reference: 'pos-' + Date.now() });
      }
      Alert.alert('Sale complete ✅', 'Collected: KES ' + subtotal.toLocaleString() + '\n' + tax.tax_name + ' (' + country + ' ' + rate + '%) auto-deducted: KES ' + taxAmt.toLocaleString() + '\nYou received: KES ' + sellerNet.toLocaleString() + '\nStock updated.');
      setLines([]);
    } catch (e) { Alert.alert('Sale failed', String(e?.message || e)); }
    setBusy(false);
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#f4f5f7' }} contentContainerStyle={{ padding: 16 }}>
      <TouchableOpacity onPress={() => router.back()}><Text style={{ color: '#007AFF', fontWeight: '700', marginBottom: 10 }}>← Back</Text></TouchableOpacity>
      <Text style={{ fontSize: 22, fontWeight: '800', marginBottom: 12 }}>POS — Scan to Sell / Stock</Text>

      <View style={{ flexDirection: 'row', marginBottom: 12 }}>
        <TouchableOpacity onPress={() => setMode('sell')} style={{ flex: 1, paddingVertical: 12, borderRadius: 10, marginRight: 6, backgroundColor: mode === 'sell' ? '#007AFF' : '#ddd', alignItems: 'center' }}>
          <Text style={{ color: '#fff', fontWeight: '700' }}>🛒 SELL</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setMode('stock')} style={{ flex: 1, paddingVertical: 12, borderRadius: 10, backgroundColor: mode === 'stock' ? '#00a651' : '#ddd', alignItems: 'center' }}>
          <Text style={{ color: '#fff', fontWeight: '700' }}>📦 STOCK</Text>
        </TouchableOpacity>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
        {taxes.map(t => (
          <TouchableOpacity key={t.country_code} onPress={() => setCountry(t.country_code)} style={{ paddingHorizontal: 12, paddingVertical: 8, borderRadius: 16, marginRight: 6, backgroundColor: country === t.country_code ? '#333' : '#e6e6e6' }}>
            <Text style={{ color: country === t.country_code ? '#fff' : '#333', fontWeight: '600' }}>{t.country_code} · {t.rate_percent}%</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <TextInput ref={ref} autoFocus value={code} onChangeText={setCode} onSubmitEditing={() => lookup()} placeholder={mode === 'sell' ? 'Scan / type barcode → Enter to sell' : 'Scan / type barcode → Enter to stock'} style={{ backgroundColor: '#fff', borderRadius: 12, padding: 14, fontSize: 16, marginBottom: 12 }} />
      <TouchableOpacity onPress={() => { if (typeof document !== 'undefined') { startWebScanner(); } else if (scanning) { setScanning(false); } else { startCamera(); } }} style={{ backgroundColor: scanning ? '#c92a2a' : '#333', borderRadius: 12, paddingVertical: 12, alignItems: 'center', marginBottom: 10 }}>
        <Text style={{ color: '#fff', fontWeight: '700' }}>{scanning ? '✖ Close Camera' : '📷 Scan with Camera'}</Text>
      </TouchableOpacity>
      {scanning && perm?.granted ? (
        <View style={{ height: 240, borderRadius: 12, overflow: 'hidden', marginBottom: 10 }}>
          <CameraView style={{ flex: 1 }} facing="back" onBarcodeScanned={onScan} />
          <View style={{ position: 'absolute', top: '45%', left: '10%', right: '10%', height: 2, backgroundColor: '#00ff00' }} />
        </View>
      ) : null}
      {msg ? <Text style={{ color: '#b45309', marginBottom: 10 }}>{msg}</Text> : null}

      {newProd ? (
        <View style={{ backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 12 }}>
          <Text style={{ fontWeight: '700', marginBottom: 8 }}>New product (barcode {newProd.barcode})</Text>
          <TextInput value={npName} onChangeText={setNpName} placeholder="Name" style={{ backgroundColor: '#f2f2f2', borderRadius: 8, padding: 10, marginBottom: 8 }} />
          <TextInput value={npPrice} onChangeText={setNpPrice} placeholder="Price (KES)" keyboardType="numeric" style={{ backgroundColor: '#f2f2f2', borderRadius: 8, padding: 10, marginBottom: 8 }} />
          <TextInput value={npStock} onChangeText={setNpStock} placeholder="Initial stock" keyboardType="numeric" style={{ backgroundColor: '#f2f2f2', borderRadius: 8, padding: 10, marginBottom: 8 }} />
          <View style={{ flexDirection: 'row' }}>
            <TouchableOpacity onPress={saveNewProduct} style={{ flex: 1, backgroundColor: '#00a651', borderRadius: 8, paddingVertical: 10, alignItems: 'center', marginRight: 6 }}><Text style={{ color: '#fff', fontWeight: '700' }}>Save</Text></TouchableOpacity>
            <TouchableOpacity onPress={() => setNewProd(null)} style={{ flex: 1, backgroundColor: '#ccc', borderRadius: 8, paddingVertical: 10, alignItems: 'center' }}><Text style={{ fontWeight: '700' }}>Cancel</Text></TouchableOpacity>
          </View>
        </View>
      ) : null}

      {lines.map(l => (
        <View key={l.id} style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 10, padding: 12, marginBottom: 8 }}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontWeight: '700' }}>{l.name}</Text>
            <Text style={{ color: '#666' }}>KES {l.price.toLocaleString()} · stock {l.stock}</Text>
          </View>
          <TouchableOpacity onPress={() => setLines(p => p.map(x => x.id === l.id ? { ...x, qty: Math.max(1, x.qty - 1) } : x))} style={{ paddingHorizontal: 10 }}><Text style={{ fontSize: 18, fontWeight: '800' }}>−</Text></TouchableOpacity>
          <Text style={{ fontWeight: '800', marginHorizontal: 6 }}>{l.qty}</Text>
          <TouchableOpacity onPress={() => setLines(p => p.map(x => x.id === l.id ? { ...x, qty: x.qty + 1 } : x))} style={{ paddingHorizontal: 10 }}><Text style={{ fontSize: 18, fontWeight: '800' }}>+</Text></TouchableOpacity>
        </View>
      ))}

      <TouchableOpacity onPress={() => setTaxOn(v => !v)} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 8 }}>
        <Text style={{ fontWeight: '700' }}>🧾 Auto-deduct tax ({country} {rate}%) — {taxOn ? 'ON' : 'OFF'}</Text>
        <View style={{ width: 46, height: 26, borderRadius: 13, backgroundColor: taxOn ? '#00a651' : '#ccc', justifyContent: 'center', padding: 3 }}>
          <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: '#fff', alignSelf: taxOn ? 'flex-end' : 'flex-start' }} />
        </View>
      </TouchableOpacity>
      <View style={{ backgroundColor: '#fff', borderRadius: 12, padding: 14, marginTop: 8 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}><Text>Subtotal</Text><Text style={{ fontWeight: '700' }}>KES {subtotal.toLocaleString()}</Text></View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}><Text>{tax.tax_name} ({country} {rate}%) auto-deduct</Text><Text style={{ fontWeight: '700', color: '#b45309' }}>− KES {taxAmt.toLocaleString()}</Text></View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 }}><Text style={{ fontWeight: '800' }}>You receive</Text><Text style={{ fontWeight: '800', color: '#00a651' }}>KES {sellerNet.toLocaleString()}</Text></View>
      </View>

      <TouchableOpacity onPress={checkout} disabled={busy || !lines.length} style={{ backgroundColor: '#007AFF', borderRadius: 12, paddingVertical: 16, alignItems: 'center', marginTop: 12, opacity: lines.length ? 1 : 0.5 }}>
        <Text style={{ color: '#fff', fontSize: 16, fontWeight: '800' }}>{busy ? 'Processing…' : '✅ Complete Sale'}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
