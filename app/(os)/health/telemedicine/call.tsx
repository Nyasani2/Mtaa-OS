// @ts-nocheck
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { telemedicineService } from '@/lib/health/services/telemedicine-service';

// WEBRTC_MEDIA: plug react-native-webrtc here on the next native build cycle.
// Until then, consultation runs over Supabase Realtime (presence + chat + signaling).

export default function TelemedicineCallScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const params = useLocalSearchParams();
  const [status, setStatus] = useState('connecting');
  const [peer, setPeer] = useState(null);
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState('');
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [peerMuted, setPeerMuted] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const sessionRef = useRef(null);
  const channelRef = useRef(null);

  useEffect(() => {
    if (status !== 'connected') return;
    const t = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [status]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const session = await telemedicineService.startOrJoin({
          sessionId: params.sessionId, appointmentId: params.appointmentId,
          userId: user?.id, role: params.role || 'patient',
        });
        if (cancelled) return;
        sessionRef.current = session;
        channelRef.current = telemedicineService.joinChannel(session.id, user?.id, {
          onPresence: (peers) => {
            const other = peers.find((p) => p.userId !== user?.id);
            if (other) { setPeer(other); setStatus('connected'); }
            else setStatus('waiting');
          },
          onMessage: (msg) => setMessages((m) => [...m, msg]),
          onControl: (evt) => { if (evt?.type === 'mic') setPeerMuted(evt.on === false); },
        });
      } catch {
        if (!cancelled) setStatus('ended');
      }
    })();
    return () => { cancelled = true; try { channelRef.current?.unsubscribe(); } catch {} };
  }, []);

  const fmt = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  const send = async () => {
    if (!draft.trim() || !channelRef.current) return;
    const payload = { from: user?.id, text: draft.trim(), at: Date.now() };
    setMessages((m) => [...m, payload]);
    setDraft('');
    await telemedicineService.sendChat(channelRef.current, payload);
  };

  const toggleMic = async () => {
    const next = !micOn; setMicOn(next);
    await telemedicineService.sendControl(channelRef.current, { type: 'mic', on: next });
  };

  const endCall = async () => {
    await telemedicineService.endSession(sessionRef.current?.id, seconds);
    setStatus('ended');
    router.back();
  };

  return (
    <View style={s.container}>
      <View style={s.header}>
        <Text style={s.title}>{params.role === 'doctor' ? 'Patient' : 'Doctor'} Consultation</Text>
        <Text style={s.timer}>{status === 'connected' ? fmt(seconds) : '—'}</Text>
      </View>

      <View style={s.videoArea}>
        {status === 'connecting' && <ActivityIndicator size="large" color="#0ea5e9" />}
        {status === 'waiting' && (
          <>
            <Ionicons name="videocam-outline" size={64} color="#94a3b8" />
            <Text style={s.waitingText}>Waiting for the other party to join…</Text>
          </>
        )}
        {status === 'connected' && (
          <>
            <View style={s.avatar}><Ionicons name="person" size={56} color="#fff" /></View>
            <Text style={s.peerText}>{peerMuted ? '🔇 ' : ''}Connected — live consultation in progress</Text>
          </>
        )}
      </View>

      <View style={s.chatBox}>
        <ScrollView style={{ flex: 1 }}>
          {messages.map((m, i) => (
            <Text key={i} style={[s.msg, m.from === user?.id && s.msgMine]}>
              {m.from === user?.id ? 'You' : 'They'}: {m.text}
            </Text>
          ))}
        </ScrollView>
        <View style={s.chatRow}>
          <TextInput style={s.chatInput} value={draft} onChangeText={setDraft} placeholder="Message…" onSubmitEditing={send} />
          <TouchableOpacity style={s.sendBtn} onPress={send}><Ionicons name="send" size={18} color="#fff" /></TouchableOpacity>
        </View>
      </View>

      <View style={s.controls}>
        <TouchableOpacity style={[s.ctrlBtn, !micOn && s.ctrlOff]} onPress={toggleMic}>
          <Ionicons name={micOn ? 'mic' : 'mic-off'} size={22} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity style={[s.ctrlBtn, !camOn && s.ctrlOff]} onPress={() => setCamOn(!camOn)}>
          <Ionicons name={camOn ? 'videocam' : 'videocam-off'} size={22} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity style={s.endBtn} onPress={endCall}>
          <Ionicons name="call" size={24} color="#fff" style={{ transform: [{ rotate: '135deg' }] }} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, paddingTop: 48 },
  title: { color: '#f8fafc', fontSize: 18, fontWeight: '700' },
  timer: { color: '#0ea5e9', fontSize: 18, fontWeight: '700', fontVariant: ['tabular-nums'] },
  videoArea: { height: 260, backgroundColor: '#1e293b', margin: 16, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  waitingText: { color: '#94a3b8', marginTop: 12 },
  avatar: { width: 96, height: 96, borderRadius: 48, backgroundColor: '#0ea5e9', justifyContent: 'center', alignItems: 'center' },
  peerText: { color: '#e2e8f0', marginTop: 12 },
  chatBox: { flex: 1, marginHorizontal: 16, backgroundColor: '#1e293b', borderRadius: 12, padding: 12 },
  msg: { color: '#cbd5e1', marginBottom: 6 },
  msgMine: { color: '#7dd3fc' },
  chatRow: { flexDirection: 'row', marginTop: 8 },
  chatInput: { flex: 1, backgroundColor: '#0f172a', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, color: '#f8fafc' },
  sendBtn: { marginLeft: 8, backgroundColor: '#0ea5e9', borderRadius: 8, paddingHorizontal: 14, justifyContent: 'center' },
  controls: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 20, padding: 20, paddingBottom: 32 },
  ctrlBtn: { width: 52, height: 52, borderRadius: 26, backgroundColor: '#334155', justifyContent: 'center', alignItems: 'center' },
  ctrlOff: { backgroundColor: '#ef4444' },
  endBtn: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#ef4444', justifyContent: 'center', alignItems: 'center' },
});
