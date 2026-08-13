import React, { useState } from 'react';
import { View, Text, Modal, TouchableOpacity, TextInput, StyleSheet, useWindowDimensions, Platform } from 'react-native';
import { X, Flag, AlertTriangle, CheckCircle } from 'lucide-react-native';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { supabase } from '@/lib/supabase';

const REASONS = [
  'Spam or misleading','Nudity or sexual content','Hate speech or symbols',
  'Harassment or bullying','Scam or fraud','Violence or dangerous acts',
  'Self-harm or suicide','False information',
];

interface ReportModalProps { visible: boolean; post: any; onClose: () => void; }

export default function ReportModal({ visible, post, onClose }: ReportModalProps) {
  const { user } = useAuthStore();
  const { width } = useWindowDimensions();
  const modalW = Platform.OS === 'web' ? Math.min(width * 0.9, 420) : width - 32;
  const [reason, setReason] = useState('');
  const [details, setDetails] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!reason) { setError('Select a reason'); return; }
    setError('');
    const { error: dbErr } = await supabase.from('streets_reports').insert({
      post_id: post?.id, reporter_id: user?.id, reason, details: details || null, status: 'pending',
    });
    if (dbErr) { setError(dbErr.message); return; }
    setSubmitted(true);
    setTimeout(() => { setSubmitted(false); setReason(''); setDetails(''); onClose(); }, 2000);
  };

  return (
    <Modal visible={visible && !!post} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.modal, { width: modalW }]}>
          <View style={styles.header}>
            <Text style={styles.title}>Report Post</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}><X size={20} color="#fff"/></TouchableOpacity>
          </View>
          {error!=='' && <View style={styles.errorBanner}><AlertTriangle size={14} color="#ff2d55"/><Text style={styles.errorText}>{error}</Text></View>}
          {submitted ? (
            <View style={styles.success}><CheckCircle size={48} color="#00c853"/><Text style={styles.successTitle}>Report Submitted</Text><Text style={styles.successSub}>Thank you. Our team will review this post.</Text></View>
          ) : (
            <>
              <Text style={styles.label}>Why are you reporting this?</Text>
              {REASONS.map((r: any) => (
                <TouchableOpacity key={r} style={[styles.reasonRow, reason===r&&styles.reasonActive]} onPress={()=>setReason(r)}>
                  <View style={[styles.radio, reason===r&&styles.radioActive]}>{reason===r&&<View style={styles.radioDot}/>}</View>
                  <Text style={styles.reasonText}>{r}</Text>
                </TouchableOpacity>
              ))}
              <Text style={styles.label}>Additional details (optional)</Text>
              <TextInput style={styles.detailsInput} multiline numberOfLines={3} placeholder="Describe the issue..." placeholderTextColor="#555" value={details} onChangeText={setDetails}/>
              <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit}><Flag size={16} color="#fff"/><Text style={styles.submitText}>Submit Report</Text></TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay:{flex:1,backgroundColor:'rgba(0,0,0,0.85)',justifyContent:'center',alignItems:'center'},
  modal:{backgroundColor:'#111',borderRadius:16,padding:20,maxHeight:'80%'},
  header:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',marginBottom:16},
  title:{color:'#fff',fontSize:18,fontWeight:'700'},
  closeBtn:{width:32,height:32,borderRadius:16,backgroundColor:'#222',justifyContent:'center',alignItems:'center'},
  errorBanner:{flexDirection:'row',alignItems:'center',gap:8,backgroundColor:'rgba(255,45,85,0.1)',borderRadius:8,padding:10,marginBottom:12},
  errorText:{color:'#ff2d55',fontSize:12,flex:1},
  label:{color:'#888',fontSize:13,fontWeight:'600',marginTop:12,marginBottom:8},
  reasonRow:{flexDirection:'row',alignItems:'center',gap:10,paddingVertical:10,borderRadius:8,paddingHorizontal:8},
  reasonActive:{backgroundColor:'rgba(255,45,85,0.08)'},
  radio:{width:18,height:18,borderRadius:9,borderWidth:2,borderColor:'#555',justifyContent:'center',alignItems:'center'},
  radioActive:{borderColor:'#ff2d55'},
  radioDot:{width:8,height:8,borderRadius:4,backgroundColor:'#ff2d55'},
  reasonText:{color:'#fff',fontSize:14},
  detailsInput:{backgroundColor:'#222',borderRadius:10,color:'#fff',fontSize:14,padding:12,minHeight:80,textAlignVertical:'top'},
  submitBtn:{flexDirection:'row',alignItems:'center',justifyContent:'center',gap:8,backgroundColor:'#ff2d55',borderRadius:10,paddingVertical:14,marginTop:16},
  submitText:{color:'#fff',fontSize:15,fontWeight:'700'},
  success:{alignItems:'center',paddingVertical:30},
  successTitle:{color:'#fff',fontSize:18,fontWeight:'800',marginTop:12},
  successSub:{color:'#888',fontSize:13,marginTop:6},
});
