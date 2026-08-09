import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, Image, StyleSheet, TouchableOpacity, Share,
  ActivityIndicator, Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/hooks/useTheme';
import { supabase } from '@/lib/supabase';
import * as Print from 'expo-print';

const { width } = Dimensions.get('window');

interface StudentData {
  id: string;
  full_name: string;
  admission_number: string;
  current_level: string;
  class_name: string;
  institution_name: string;
  institution_logo?: string;
  photo_url?: string;
  date_of_birth: string;
  parent_name: string;
  parent_phone: string;
  valid_until: string;
}

export default function StudentIdentityCard() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();
  const { colors } = useTheme();

  const [student, setStudent] = useState<StudentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [qrValue, setQrValue] = useState('');

  const fetchStudent = useCallback(async () => {
    try {
      const userId = user?.id;
      if (!userId) { setLoading(false); return; }

      const { data: record } = await supabase
        .from('education_students')
        .select(`
          id, full_name, admission_number, current_level, date_of_birth, photo_url,
          institution:institution_id(id, name, logo_url),
          class:class_id(name),
          parent:parent_guardian_id(full_name, phone)
        `)
        .eq('user_id', userId)
        .eq('enrollment_status', 'active')
        .single();

      if (!record) { setLoading(false); return; }

      const data: StudentData = {
        id: record.id,
        full_name: record.full_name,
        admission_number: record.admission_number || 'N/A',
        current_level: record.current_level || 'N/A',
        class_name: record.class?.name || 'N/A',
        institution_name: record.institution?.name || 'School',
        institution_logo: record.institution?.logo_url,
        photo_url: record.photo_url,
        date_of_birth: record.date_of_birth,
        parent_name: record.parent?.full_name || 'N/A',
        parent_phone: record.parent?.phone || 'N/A',
        valid_until: new Date(Date.now() + 365 * 86400000).toISOString().split('T')[0],
      };

      setStudent(data);
      setQrValue(JSON.stringify({
        student_id: data.id,
        admission: data.admission_number,
        name: data.full_name,
        institution: data.institution_name,
        valid_until: data.valid_until,
      }));
    } catch (e) {
      console.error('Identity card error:', e);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => { fetchStudent(); }, [fetchStudent]);

  const handleShare = async () => {
    if (!student) return;
    await Share.share({
      message: `${student.full_name} - ${student.institution_name} - Admission: ${student.admission_number}`,
    });
  };

  const handlePrint = async () => {
    if (!student) return;
    const html = `
      <html><body style="font-family:sans-serif;text-align:center;padding:40px;">
        <h2>${student.institution_name}</h2>
        <h3>Student ID Card</h3>
        <p><strong>Name:</strong> ${student.full_name}</p>
        <p><strong>Admission:</strong> ${student.admission_number}</p>
        <p><strong>Class:</strong> ${student.class_name}</p>
        <p><strong>Valid Until:</strong> ${student.valid_until}</p>
      </body></html>
    `;
    await Print.printAsync({ html });
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!student) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top, justifyContent: 'center', alignItems: 'center' }]}>
        <Ionicons name="id-card-outline" size={48} color={colors.textSecondary} />
        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No student record found</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>My ID Card</Text>
        <TouchableOpacity onPress={handleShare} style={styles.shareBtn}>
          <Ionicons name="share-outline" size={22} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* ID Card */}
      <View style={[styles.cardContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
        {/* Card Header */}
        <View style={[styles.cardHeader, { backgroundColor: colors.primary }]}>
          {student.institution_logo ? (
            <Image source={{ uri: student.institution_logo }} style={styles.schoolLogo} />
          ) : (
            <Ionicons name="school" size={28} color="#fff" />
          )}
          <Text style={styles.schoolName}>{student.institution_name}</Text>
          <Text style={styles.cardType}>STUDENT ID</Text>
        </View>

        {/* Card Body */}
        <View style={styles.cardBody}>
          <View style={styles.photoSection}>
            {student.photo_url ? (
              <Image source={{ uri: student.photo_url }} style={styles.photo} />
            ) : (
              <View style={[styles.photoPlaceholder, { backgroundColor: colors.primary + '20' }]}>
                <Text style={[styles.photoInitial, { color: colors.primary }]}>{student.full_name.charAt(0)}</Text>
              </View>
            )}
            <View style={styles.qrSection}>
              {qrValue ? (
                <QRCode value={qrValue} size={80} backgroundColor="transparent" color={colors.text} />
              ) : (
                <ActivityIndicator size="small" color={colors.primary} />
              )}
            </View>
          </View>

          <View style={styles.infoSection}>
            <Text style={[styles.infoName, { color: colors.text }]}>{student.full_name}</Text>
            <Text style={[styles.infoAdmission, { color: colors.textSecondary }]}>Admission: {student.admission_number}</Text>

            <View style={styles.infoGrid}>
              <View style={styles.infoItem}>
                <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Class</Text>
                <Text style={[styles.infoValue, { color: colors.text }]}>{student.class_name}</Text>
              </View>
              <View style={styles.infoItem}>
                <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Level</Text>
                <Text style={[styles.infoValue, { color: colors.text }]}>{student.current_level}</Text>
              </View>
              <View style={styles.infoItem}>
                <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Valid Until</Text>
                <Text style={[styles.infoValue, { color: colors.text }]}>{student.valid_until}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Card Footer */}
        <View style={[styles.cardFooter, { borderTopColor: colors.border }]}>
          <Ionicons name="shield-checkmark" size={16} color="#22c55e" />
          <Text style={[styles.verifiedText, { color: '#22c55e' }]}>Verified Student · MTAA Education</Text>
        </View>
      </View>

      {/* Actions */}
      <View style={styles.actionsRow}>
        <TouchableOpacity style={[styles.actionBtn, { backgroundColor: colors.primary }]} onPress={handlePrint}>
          <Ionicons name="print-outline" size={20} color="#fff" />
          <Text style={styles.actionText}>Print Card</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionBtn, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }]} onPress={handleShare}>
          <Ionicons name="share-outline" size={20} color={colors.primary} />
          <Text style={[styles.actionText, { color: colors.primary }]}>Share</Text>
        </TouchableOpacity>
      </View>

      {/* Instructions */}
      <View style={[styles.instructions, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.instructionsTitle, { color: colors.text }]}>How to use your ID</Text>
        <View style={styles.instructionItem}>
          <Ionicons name="scan-outline" size={18} color={colors.primary} />
          <Text style={[styles.instructionText, { color: colors.textSecondary }]}>
            Show this QR code at school gates, library, and cafeteria
          </Text>
        </View>
        <View style={styles.instructionItem}>
          <Ionicons name="bus-outline" size={18} color={colors.primary} />
          <Text style={[styles.instructionText, { color: colors.textSecondary }]}>
            Scan when boarding the school bus
          </Text>
        </View>
        <View style={styles.instructionItem}>
          <Ionicons name="shield-checkmark-outline" size={18} color={colors.primary} />
          <Text style={[styles.instructionText, { color: colors.textSecondary }]}>
            Present for attendance verification and exams
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 },
  backBtn: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 17, fontWeight: '700' },
  shareBtn: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  cardContainer: { marginHorizontal: 16, marginTop: 12, borderRadius: 20, borderWidth: 1, overflow: 'hidden' },
  cardHeader: { alignItems: 'center', paddingVertical: 16 },
  schoolLogo: { width: 40, height: 40, borderRadius: 20, marginBottom: 6 },
  schoolName: { color: '#fff', fontSize: 16, fontWeight: '700' },
  cardType: { color: '#fff', fontSize: 11, fontWeight: '600', marginTop: 2, opacity: 0.8 },
  cardBody: { padding: 16 },
  photoSection: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  photo: { width: 80, height: 80, borderRadius: 12 },
  photoPlaceholder: { width: 80, height: 80, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  photoInitial: { fontSize: 32, fontWeight: '800' },
  qrSection: { flex: 1, alignItems: 'flex-end' },
  infoSection: {},
  infoName: { fontSize: 20, fontWeight: '800' },
  infoAdmission: { fontSize: 13, marginTop: 2 },
  infoGrid: { flexDirection: 'row', marginTop: 14, gap: 16 },
  infoItem: { flex: 1 },
  infoLabel: { fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5 },
  infoValue: { fontSize: 14, fontWeight: '700', marginTop: 2 },
  cardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderTopWidth: 1, gap: 6 },
  verifiedText: { fontSize: 11, fontWeight: '600' },
  actionsRow: { flexDirection: 'row', gap: 12, marginHorizontal: 16, marginTop: 16 },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 14 },
  actionText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  instructions: { marginHorizontal: 16, marginTop: 16, borderRadius: 16, padding: 16, borderWidth: 1 },
  instructionsTitle: { fontSize: 15, fontWeight: '700', marginBottom: 12 },
  instructionItem: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 10 },
  instructionText: { flex: 1, fontSize: 13, lineHeight: 18 },
  emptyText: { marginTop: 12, fontSize: 14 },
});
