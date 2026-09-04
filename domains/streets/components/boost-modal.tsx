import React, { useState, useCallback } from 'react';
import { View, Text, Modal, TouchableOpacity, TextInput, StyleSheet, useWindowDimensions, Platform, ActivityIndicator, ScrollView } from 'react-native';
import { X, ChevronRight, AlertTriangle, CheckCircle, Users } from 'lucide-react-native';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { supabase } from '@/lib/supabase';

const KENYA_COUNTIES = [
  'Nairobi','Mombasa','Kisumu','Nakuru','Eldoret','Kiambu','Machakos','Kajiado',
  'Kilifi','Kwale','Lamu','Tana River','Garissa','Wajir','Mandera',
  'Marsabit','Isiolo','Meru','Tharaka-Nithi','Embu','Kitui','Makueni','Nyandarua',
  'Nyeri','Kirinyaga',"Murang'a",'Turkana','West Pokot','Samburu','Trans Nzoia',
  'Uasin Gishu','Elgeyo-Marakwet','Nandi','Baringo','Laikipia','Narok',
  'Kericho','Bomet','Kakamega','Vihiga','Bungoma','Busia','Siaya','Homa Bay',
  'Migori','Kisii','Nyamira','Nairobi City'
];

const BUDGETS = [100, 500, 1000, 5000];
const DURATIONS = [3, 7, 14, 30];

interface BoostModalProps {
  visible: boolean;
  post: any;
  onClose: () => void;
}

export default function BoostModal({ visible, post, onClose }: BoostModalProps) {
  const { user } = useAuthStore();
  const { width } = useWindowDimensions();
  const isWeb = Platform.OS === 'web';
  const modalW = isWeb ? Math.min(width * 0.9, 480) : width - 32;

  const [step, setStep] = useState<'config'|'pin'|'result'>('config');
  const [budget, setBudget] = useState(100);
  const [duration, setDuration] = useState(7);
  const [region, setRegion] = useState('Nairobi');
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const estimatedReach = Math.round(budget * 15);

  const reset = useCallback(() => {
    setStep('config'); setBudget(100); setDuration(7); setRegion('Nairobi');
    setPin(''); setError(''); setSuccess(false); setLoading(false);
  }, []);

  const handleClose = useCallback(() => { reset(); onClose(); }, [reset, onClose]);

  const handlePay = async () => {
    if (pin.length < 4) { setError('Enter a valid 4-digit PIN'); return; }
    setLoading(true); setError('');
    try {
      const { data: account } = await supabase
        .from('wallet_accounts').select('id, balance')
        .eq('user_id', user?.id).eq('status', 'active')
        .order('is_default', { ascending: false }).limit(1).single();
      if (!account) { setError('No active wallet found.'); setLoading(false); return; }
      if (account.balance < budget) { setError(`Insufficient balance. You have KES ${account.balance}, need KES ${budget}.`); setLoading(false); return; }

      const { data: ok, error: rpcErr } = await supabase.rpc('streets_boost_deduct', {
        p_user_id: user?.id, p_amount: budget,
        p_description: `Boost post ${post?.id?.slice(0,8)} — ${duration}d — ${region}`,
        p_reference_id: post?.id,
      });
      if (rpcErr || !ok) { setError('Wallet deduction failed. Run SQL upgrade first.'); setLoading(false); return; }

      await supabase.from('streets_adverts').insert({
        post_id: post?.id, user_id: user?.id, budget, duration_days: duration,
        target_audience: region, status: 'active', spent: 0, impressions: 0, clicks: 0,
      });
      setSuccess(true); setStep('result');
    } catch (e: any) { setError(e?.message || 'Payment failed.'); }
    finally { setLoading(false); }
  };

  return (
    <Modal visible={visible && !!post} transparent animationType="slide" onRequestClose={handleClose}>
      <View style={styles.overlay}>
        <View style={[styles.modal, { width: modalW }]}>
          <View style={styles.header}>
            <Text style={styles.title}>{step==='config'?'Boost Post':step==='pin'?'Confirm Payment':'Boost Active!'}</Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeBtn}><X size={22} color="#fff"/></TouchableOpacity>
          </View>
          {error!=='' && <View style={styles.errorBanner}><AlertTriangle size={16} color="#ff2d55"/><Text style={styles.errorText}>{error}</Text></View>}
          {step==='config' && (
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.label}>Budget (KES)</Text>
              <View style={styles.chipRow}>{BUDGETS.map((b: any) =><TouchableOpacity key={b} style={[styles.chip,budget===b&&styles.chipActive]} onPress={()=>setBudget(b)}><Text style={[styles.chipText,budget===b&&styles.chipTextActive]}>KES {b}</Text></TouchableOpacity>)}</View>
              <Text style={styles.label}>Duration</Text>
              <View style={styles.chipRow}>{DURATIONS.map((d: any) =><TouchableOpacity key={d} style={[styles.chip,duration===d&&styles.chipActive]} onPress={()=>setDuration(d)}><Text style={[styles.chipText,duration===d&&styles.chipTextActive]}>{d} days</Text></TouchableOpacity>)}</View>
              <Text style={styles.label}>Target Region</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{marginTop:8}}>
                {KENYA_COUNTIES.map((c: any) =><TouchableOpacity key={c} style={[styles.chip,region===c&&styles.chipActive]} onPress={()=>setRegion(c)}><Text style={[styles.chipText,region===c&&styles.chipTextActive]}>{c}</Text></TouchableOpacity>)}
              </ScrollView>
              <View style={styles.estimateBox}><Users size={18} color="#3897f0"/><Text style={styles.estimateText}>Estimated reach: <Text style={styles.estimateBold}>{estimatedReach.toLocaleString()}</Text> people</Text></View>
              <TouchableOpacity style={styles.continueBtn} onPress={()=>setStep('pin')}><Text style={styles.continueText}>Continue — KES {budget}</Text><ChevronRight size={18} color="#fff"/></TouchableOpacity>
            </ScrollView>
          )}
          {step==='pin' && (
            <View style={{alignItems:'center',paddingVertical:20}}>
              <Text style={{color:'#fff',fontSize:16,fontWeight:'700'}}>Enter Wallet PIN</Text>
              <Text style={{color:'#888',fontSize:14,marginBottom:20}}>KES {budget} will be deducted</Text>
              <TextInput style={styles.pinInput} keyboardType="number-pad" maxLength={6} secureTextEntry placeholder="••••" placeholderTextColor="#555" value={pin} onChangeText={setPin}/>
              <TouchableOpacity style={styles.continueBtn} onPress={handlePay} disabled={loading}>
                {loading?<ActivityIndicator color="#fff"/>:<Text style={styles.continueText}>Confirm & Pay</Text>}
              </TouchableOpacity>
            </View>
          )}
          {step==='result' && success && (
            <View style={{alignItems:'center',paddingVertical:30}}>
              <CheckCircle size={56} color="#00c853"/>
              <Text style={{color:'#fff',fontSize:20,fontWeight:'800',marginTop:16}}>Boost is Live!</Text>
              <Text style={{color:'#aaa',fontSize:14,textAlign:'center',marginTop:8,paddingHorizontal:20}}>Your post will reach ~{estimatedReach.toLocaleString()} people in {region} over {duration} days.</Text>
              <TouchableOpacity style={[styles.continueBtn,{marginTop:24}]} onPress={handleClose}><Text style={styles.continueText}>Done</Text></TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay:{flex:1,backgroundColor:'rgba(0,0,0,0.85)',justifyContent:'center',alignItems:'center'},
  modal:{backgroundColor:'#111',borderRadius:16,padding:20,maxHeight:'85%'},
  header:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',marginBottom:16},
  title:{color:'#fff',fontSize:18,fontWeight:'700'},
  closeBtn:{width:36,height:36,borderRadius:18,backgroundColor:'#222',justifyContent:'center',alignItems:'center'},
  errorBanner:{flexDirection:'row',alignItems:'center',gap:8,backgroundColor:'rgba(255,45,85,0.1)',borderRadius:8,padding:12,marginBottom:12},
  errorText:{color:'#ff2d55',fontSize:13,flex:1},
  label:{color:'#888',fontSize:13,fontWeight:'600',marginTop:16,marginBottom:8},
  chipRow:{flexDirection:'row',flexWrap:'wrap',gap:8},
  chip:{backgroundColor:'#222',borderRadius:20,paddingVertical:8,paddingHorizontal:16},
  chipActive:{backgroundColor:'#ff2d55'},
  chipText:{color:'#fff',fontSize:13,fontWeight:'600'},
  chipTextActive:{color:'#fff'},
  estimateBox:{flexDirection:'row',alignItems:'center',gap:8,backgroundColor:'#1a1a2e',borderRadius:10,padding:14,marginTop:20},
  estimateText:{color:'#aaa',fontSize:14},
  estimateBold:{color:'#fff',fontWeight:'700'},
  continueBtn:{flexDirection:'row',alignItems:'center',justifyContent:'center',gap:8,backgroundColor:'#ff2d55',borderRadius:10,paddingVertical:14,marginTop:20},
  continueText:{color:'#fff',fontSize:15,fontWeight:'700'},
  pinInput:{width:'80%',height:56,backgroundColor:'#222',borderRadius:12,color:'#fff',fontSize:24,textAlign:'center',letterSpacing:12,marginBottom:20},
});
