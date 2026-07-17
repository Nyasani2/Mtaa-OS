import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput,
  ActivityIndicator, Alert, Platform
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { supabase } from '@/lib/supabase';
import * as DocumentPicker from 'expo-document-picker';
import DateTimePicker from '@react-native-community/datetimepicker';

const DOC_TYPES = [
  { type: 'id', label: 'National ID' },
  { type: 'passport', label: 'Passport' },
  { type: 'license', label: 'Driving License' },
  { type: 'certificate', label: 'Certificate' },
  { type: 'contract', label: 'Contract' },
  { type: 'land', label: 'Land Document' },
  { type: 'business', label: 'Business License' },
  { type: 'insurance', label: 'Insurance' },
  { type: 'resume', label: 'Resume/CV' },
  { type: 'portfolio', label: 'Portfolio' },
  { type: 'other', label: 'Other' },
];

export default function DocumentUploadScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [name, setName] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [documentNumber, setDocumentNumber] = useState('');
  const [issuingAuthority, setIssuingAuthority] = useState('');
  const [notes, setNotes] = useState('');
  const [expiryDate, setExpiryDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedFile, setSelectedFile] = useState<any>(null);
  const [uploading, setUploading] = useState(false);
  const [isPublic, setIsPublic] = useState(false);

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
        copyToCacheDirectory: true,
      });

      if (result.canceled) return;
      setSelectedFile(result.assets[0]);
    } catch (err) {
      Alert.alert('Error', 'Failed to pick document');
    }
  };

  const onDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) setExpiryDate(selectedDate);
  };

  const validate = () => {
    if (!name.trim()) return 'Document name is required';
    if (!selectedType) return 'Document type is required';
    if (!selectedFile) return 'Please select a file to upload';
    return null;
  };

  const uploadDocument = async () => {
    const error = validate();
    if (error) { Alert.alert('Validation', error); return; }
    if (!user?.id) return;

    setUploading(true);
    try {
      // 1. Upload file to Supabase Storage
      const fileExt = selectedFile.name.split('.').pop() || 'pdf';
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      const filePath = `documents/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(fileName, {
          uri: selectedFile.uri,
          type: selectedFile.mimeType || 'application/octet-stream',
          name: selectedFile.name,
        } as any, {
          contentType: selectedFile.mimeType || 'application/octet-stream',
          upsert: false,
        });

      if (uploadError) throw uploadError;

      // 2. Get public URL
      const { data: urlData } = supabase.storage.from('documents').getPublicUrl(fileName);
      const fileUrl = urlData.publicUrl;

      // 3. Insert into documents table
      const { error: dbError } = await supabase.from('documents').insert({
        user_id: user.id,
        name: name.trim(),
        type: selectedType,
        file_url: fileUrl,
        file_size: selectedFile.size,
        mime_type: selectedFile.mimeType,
        document_number: documentNumber.trim() || null,
        issuing_authority: issuingAuthority.trim() || null,
        notes: notes.trim() || null,
        expiry_date: expiryDate ? expiryDate.toISOString().split('T')[0] : null,
        is_public: isPublic,
      });

      if (dbError) throw dbError;

      Alert.alert('Success', 'Document uploaded successfully', [
        { text: 'Done', onPress: () => router.back() }
      ]);
    } catch (err: any) {
      console.error('Upload error:', err);
      Alert.alert('Upload Failed', err.message || 'Failed to upload document');
    } finally {
      setUploading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Upload Document</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* File Picker */}
        <TouchableOpacity style={styles.filePicker} onPress={pickDocument}>
          {selectedFile ? (
            <View style={styles.fileSelected}>
              <Ionicons name="document-text" size={32} color="#00d4ff" />
              <Text style={styles.fileName}>{selectedFile.name}</Text>
              <Text style={styles.fileSize}>{formatFileSize(selectedFile.size)}</Text>
              <Text style={styles.fileChange}>Tap to change</Text>
            </View>
          ) : (
            <View style={styles.filePlaceholder}>
              <Ionicons name="cloud-upload-outline" size={40} color="#444" />
              <Text style={styles.filePlaceholderText}>Tap to select a file</Text>
              <Text style={styles.fileSubText}>PDF, Images, Word docs</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Document Name */}
        <Text style={styles.label}>Document Name *</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. National ID Card"
          placeholderTextColor="#555"
          value={name}
          onChangeText={setName}
        />

        {/* Document Type */}
        <Text style={styles.label}>Document Type *</Text>
        <View style={styles.typeGrid}>
          {DOC_TYPES.map(dt => (
            <TouchableOpacity
              key={dt.type}
              style={[styles.typeBtn, selectedType === dt.type && styles.typeBtnActive]}
              onPress={() => setSelectedType(dt.type)}
            >
              <Text style={[styles.typeBtnText, selectedType === dt.type && styles.typeBtnTextActive]}>
                {dt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Document Number */}
        <Text style={styles.label}>Document Number (optional)</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. 12345678"
          placeholderTextColor="#555"
          value={documentNumber}
          onChangeText={setDocumentNumber}
        />

        {/* Issuing Authority */}
        <Text style={styles.label}>Issuing Authority (optional)</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. Government of Kenya"
          placeholderTextColor="#555"
          value={issuingAuthority}
          onChangeText={setIssuingAuthority}
        />

        {/* Expiry Date */}
        <Text style={styles.label}>Expiry Date (optional)</Text>
        <TouchableOpacity style={styles.datePicker} onPress={() => setShowDatePicker(true)}>
          <Ionicons name="calendar-outline" size={18} color="#666" />
          <Text style={styles.dateText}>
            {expiryDate ? expiryDate.toLocaleDateString() : 'Select expiry date'}
          </Text>
        </TouchableOpacity>
        {showDatePicker && (
          <DateTimePicker
            value={expiryDate || new Date()}
            mode="date"
            display="default"
            minimumDate={new Date()}
            onChange={onDateChange}
          />
        )}

        {/* Notes */}
        <Text style={styles.label}>Notes (optional)</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Additional notes about this document..."
          placeholderTextColor="#555"
          multiline
          numberOfLines={3}
          value={notes}
          onChangeText={setNotes}
        />

        {/* Public toggle */}
        <TouchableOpacity style={styles.toggleRow} onPress={() => setIsPublic(!isPublic)}>
          <Ionicons name={isPublic ? "checkbox" : "square-outline"} size={22} color={isPublic ? '#00d4ff' : '#666'} />
          <Text style={styles.toggleText}>Make this document public on my profile</Text>
        </TouchableOpacity>

        {/* Upload Button */}
        <TouchableOpacity
          style={[styles.uploadBtn, (!name || !selectedType || !selectedFile || uploading) && styles.uploadBtnDisabled]}
          onPress={uploadDocument}
          disabled={!name || !selectedType || !selectedFile || uploading}
        >
          {uploading ? (
            <ActivityIndicator color="#000" />
          ) : (
            <Text style={styles.uploadBtnText}>Upload Document</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 50, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#1a1a1a' },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '700' },
  content: { padding: 16 },
  filePicker: { backgroundColor: '#111', borderRadius: 12, borderWidth: 2, borderColor: '#1a1a1a', borderStyle: 'dashed', padding: 24, alignItems: 'center', marginBottom: 20 },
  filePlaceholder: { alignItems: 'center' },
  filePlaceholderText: { color: '#888', fontSize: 14, marginTop: 8 },
  fileSubText: { color: '#555', fontSize: 12, marginTop: 4 },
  fileSelected: { alignItems: 'center' },
  fileName: { color: '#fff', fontSize: 14, fontWeight: '600', marginTop: 8, textAlign: 'center' },
  fileSize: { color: '#888', fontSize: 12, marginTop: 2 },
  fileChange: { color: '#00d4ff', fontSize: 12, marginTop: 6 },
  label: { color: '#888', fontSize: 12, fontWeight: '600', marginBottom: 6, marginTop: 14, textTransform: 'uppercase', letterSpacing: 0.5 },
  input: { backgroundColor: '#111', borderRadius: 10, padding: 14, color: '#fff', fontSize: 14, borderWidth: 1, borderColor: '#1a1a1a' },
  textArea: { minHeight: 80, textAlignVertical: 'top' },
  typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  typeBtn: { backgroundColor: '#111', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1, borderColor: '#1a1a1a' },
  typeBtnActive: { backgroundColor: '#00d4ff22', borderColor: '#00d4ff' },
  typeBtnText: { color: '#888', fontSize: 12 },
  typeBtnTextActive: { color: '#00d4ff', fontWeight: '600' },
  datePicker: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#111', borderRadius: 10, padding: 14, borderWidth: 1, borderColor: '#1a1a1a' },
  dateText: { color: '#fff', fontSize: 14, marginLeft: 10 },
  toggleRow: { flexDirection: 'row', alignItems: 'center', marginTop: 16 },
  toggleText: { color: '#ccc', fontSize: 13, marginLeft: 10 },
  uploadBtn: { backgroundColor: '#00d4ff', borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 24, marginBottom: 40 },
  uploadBtnDisabled: { backgroundColor: '#1a1a1a' },
  uploadBtnText: { color: '#000', fontSize: 16, fontWeight: '700' },
});
