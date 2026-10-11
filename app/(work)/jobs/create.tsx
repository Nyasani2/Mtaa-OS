// @ts-nocheck
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from "expo-router";
import { ArrowLeft, Briefcase, Zap, Wrench, MapPin, DollarSign } from "lucide-react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Colors } from "@/constants/Colors";
import { useAuthStore } from "@/lib/auth/store/auth.store";
import { createJob } from "@/lib/services/jobs-service";

const LISTING_TYPES = [
  { id: 'standard', label: 'Standard Job', icon: Briefcase },
  { id: 'freelance', label: 'Freelance', icon: Zap },
  { id: 'local', label: 'Local Trade', icon: Wrench },
];

export default function CreateJobScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [listingType, setListingType] = useState('standard');
  const [loading, setLoading] = useState(false);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [category, setCategory] = useState('');
  const [jobType, setJobType] = useState('full_time');
  const [salaryMin, setSalaryMin] = useState('');
  const [salaryMax, setSalaryMax] = useState('');
  const [rateType, setRateType] = useState('fixed');
  const [rate, setRate] = useState('');
  const [skills, setSkills] = useState('');

  const handlePost = async () => {
    if (!title.trim() || !description.trim()) {
      Alert.alert('Missing Info', 'Please provide a title and description.');
      return;
    }

    setLoading(true);
    try {
      let backendJobType = 'full_time';
      let backendCategory = 'standard';

      if (listingType === 'freelance') {
        backendJobType = 'contract';
        backendCategory = 'freelance';
      } else if (listingType === 'local') {
        backendJobType = 'contract';
        backendCategory = 'local_trade';
      } else {
        backendJobType = jobType;
        backendCategory = category || 'general';
      }

      const payload = {
        employer_id: user?.id,
        title: title.trim(),
        description: description.trim(),
        location: location.trim(),
        job_type: backendJobType,
        category: backendCategory,
        salary_min: salaryMin ? parseFloat(salaryMin) : undefined,
        salary_max: salaryMax ? parseFloat(salaryMax) : undefined,
        salary_currency: 'KES',
        status: 'active',
        requirements: skills.trim(),
      };

      const result = await createJob(payload);
      if (result) {
        Alert.alert('Success', 'Your listing is now live!', [{ text: 'OK', onPress: () => router.back() }]);
      } else {
        Alert.alert('Error', 'Failed to create listing. Please try again.');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
          <ArrowLeft size={20} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Listing</Text>
        <TouchableOpacity onPress={handlePost} disabled={loading} style={styles.postBtn}>
          <Text style={styles.postBtnText}>{loading ? 'Posting...' : 'Post'}</Text>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          <View style={styles.segmentContainer}>
            {LISTING_TYPES.map((type) => {
              const Icon = type.icon;
              const isActive = listingType === type.id;
              return (
                <TouchableOpacity key={type.id} style={[styles.segmentBtn, isActive && styles.segmentBtnActive]} onPress={() => setListingType(type.id)}>
                  <Icon size={14} color={isActive ? "#fff" : Colors.textSecondary} />
                  <Text style={[styles.segmentText, isActive && styles.segmentTextActive]}>{type.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Basic Information</Text>
            <TextInput style={styles.input} placeholder="Listing Title (e.g. Senior Plumber, React Dev)" placeholderTextColor={Colors.textSecondary} value={title} onChangeText={setTitle} />
            <TextInput style={[styles.input, styles.textArea]} placeholder="Description of the work..." placeholderTextColor={Colors.textSecondary} value={description} onChangeText={setDescription} multiline numberOfLines={4} />
            <View style={styles.inputWithIcon}>
              <MapPin size={18} color={Colors.textSecondary} />
              <TextInput style={styles.iconInput} placeholder="Location (e.g. Nairobi, Remote)" placeholderTextColor={Colors.textSecondary} value={location} onChangeText={setLocation} />
            </View>
          </View>

          {listingType === 'standard' && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Employment Details</Text>
              <View style={styles.chipRow}>
                {['full_time', 'part_time', 'contract', 'internship'].map((type) => (
                  <TouchableOpacity key={type} style={[styles.chip, jobType === type && styles.chipActive]} onPress={() => setJobType(type)}>
                    <Text style={[styles.chipText, jobType === type && styles.chipTextActive]}>{type.replace('_', ' ').toUpperCase()}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <View style={styles.inputRow}>
                <View style={styles.halfInput}>
                  <Text style={styles.label}>Min Salary (KES)</Text>
                  <TextInput style={styles.input} placeholder="0" keyboardType="numeric" value={salaryMin} onChangeText={setSalaryMin} placeholderTextColor={Colors.textSecondary} />
                </View>
                <View style={styles.halfInput}>
                  <Text style={styles.label}>Max Salary (KES)</Text>
                  <TextInput style={styles.input} placeholder="0" keyboardType="numeric" value={salaryMax} onChangeText={setSalaryMax} placeholderTextColor={Colors.textSecondary} />
                </View>
              </View>
            </View>
          )}

          {(listingType === 'freelance' || listingType === 'local') && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{listingType === 'local' ? 'Service Details' : 'Project Details'}</Text>
              <View style={styles.chipRow}>
                <TouchableOpacity style={[styles.chip, rateType === 'fixed' && styles.chipActive]} onPress={() => setRateType('fixed')}>
                  <Text style={[styles.chipText, rateType === 'fixed' && styles.chipTextActive]}>FIXED PRICE</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.chip, rateType === 'hourly' && styles.chipActive]} onPress={() => setRateType('hourly')}>
                  <Text style={[styles.chipText, rateType === 'hourly' && styles.chipTextActive]}>HOURLY RATE</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.inputWithIcon}>
                <DollarSign size={18} color={Colors.textSecondary} />
                <TextInput style={styles.iconInput} placeholder={`Enter ${rateType === 'fixed' ? 'total budget' : 'hourly rate'} in KES`} placeholderTextColor={Colors.textSecondary} keyboardType="numeric" value={rate} onChangeText={setRate} />
              </View>
              <TextInput style={[styles.input, styles.textArea]} placeholder={listingType === 'local' ? "Skills/Tools required (e.g. Wrench, Pipe fitting)" : "Skills required (e.g. React, Figma)"} placeholderTextColor={Colors.textSecondary} value={skills} onChangeText={setSkills} multiline numberOfLines={3} />
            </View>
          )}

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.border },
  iconBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.card, justifyContent: "center", alignItems: "center" },
  headerTitle: { fontSize: 16, fontWeight: "700", color: Colors.text },
  postBtn: { backgroundColor: Colors.primary, paddingHorizontal: 20, paddingVertical: 8, borderRadius: 20 },
  postBtnText: { color: "#fff", fontSize: 14, fontWeight: "700" },
  scrollContent: { padding: 16 },
  segmentContainer: { flexDirection: "row", backgroundColor: Colors.card, borderRadius: 12, padding: 4, marginBottom: 24, borderWidth: 1, borderColor: Colors.border },
  segmentBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 10, borderRadius: 8 },
  segmentBtnActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  segmentText: { fontSize: 12, color: Colors.textSecondary, fontWeight: "600" },
  segmentTextActive: { color: "#fff" },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 14, fontWeight: "700", color: Colors.textSecondary, marginBottom: 12, textTransform: "uppercase", letterSpacing: 0.5 },
  input: { backgroundColor: Colors.card, borderRadius: 12, padding: 14, fontSize: 15, color: Colors.text, borderWidth: 1, borderColor: Colors.border, marginBottom: 12 },
  textArea: { minHeight: 100, textAlignVertical: "top" },
  inputRow: { flexDirection: "row", gap: 12 },
  halfInput: { flex: 1 },
  label: { fontSize: 12, color: Colors.textSecondary, marginBottom: 6, fontWeight: "600" },
  inputWithIcon: { flexDirection: "row", alignItems: "center", backgroundColor: Colors.card, borderRadius: 12, paddingHorizontal: 14, borderWidth: 1, borderColor: Colors.border, marginBottom: 12 },
  iconInput: { flex: 1, paddingVertical: 14, fontSize: 15, color: Colors.text, marginLeft: 10 },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 12 },
  chip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border },
  chipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  chipText: { fontSize: 12, color: Colors.textSecondary, fontWeight: "600" },
  chipTextActive: { color: "#fff" },
});
