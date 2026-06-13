import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const STEPS = [
  { id: 1, title: 'Apply', icon: 'document-text', desc: 'Submit your driver application' },
  { id: 2, title: 'Upload Documents', icon: 'cloud-upload', desc: 'License, PSV, insurance, logbook' },
  { id: 3, title: 'Vehicle Inspection', icon: 'car', desc: 'Schedule at MTAA-certified center' },
  { id: 4, title: 'Background Check', icon: 'shield-checkmark', desc: 'Criminal & driving history verify' },
  { id: 5, title: 'Training', icon: 'school', desc: 'Safety & defensive driving course' },
  { id: 6, title: 'Approval', icon: 'checkmark-circle', desc: 'Admin review (2-3 business days)' },
  { id: 7, title: 'Go Live', icon: 'radio', desc: 'Activate and start earning' },
];

export default function MTaxiDriverOnboardingScreen() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [form, setForm] = useState({ fullName: '', phone: '', email: '', idNumber: '', vehicleReg: '' });

  const renderStep = (step: typeof STEPS[0]) => {
    const isActive = step.id === currentStep;
    const isComplete = step.id < currentStep;
    const isPending = step.id > currentStep;

    return (
      <TouchableOpacity
        key={step.id}
        style={[styles.stepCard, isActive && styles.stepActive, isComplete && styles.stepComplete]}
        onPress={() => !isPending && setCurrentStep(step.id)}
        disabled={isPending}
      >
        <View style={[styles.stepIcon, isComplete && { backgroundColor: '#10B981' }, isActive && { backgroundColor: '#3B82F6' }]}>
          <Ionicons
            name={isComplete ? 'checkmark' : step.icon as any}
            size={20}
            color="#fff"
          />
        </View>
        <View style={styles.stepInfo}>
          <Text style={[styles.stepTitle, isPending && { color: '#6b7280' }]}>
            {step.id}. {step.title}
          </Text>
          <Text style={[styles.stepDesc, isPending && { color: '#4b5563' }]}>{step.desc}</Text>
        </View>
        {isActive && <Ionicons name="chevron-forward" size={20} color="#3B82F6" />}
      </TouchableOpacity>
    );
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <View style={styles.formContainer}>
            <Text style={styles.formTitle}>Step 1: Driver Application</Text>
            <TextInput style={styles.input} placeholder="Full Name" placeholderTextColor="#6b7280" value={form.fullName} onChangeText={t => setForm({...form, fullName: t})} />
            <TextInput style={styles.input} placeholder="Phone Number" placeholderTextColor="#6b7280" keyboardType="phone-pad" value={form.phone} onChangeText={t => setForm({...form, phone: t})} />
            <TextInput style={styles.input} placeholder="Email" placeholderTextColor="#6b7280" keyboardType="email-address" value={form.email} onChangeText={t => setForm({...form, email: t})} />
            <TextInput style={styles.input} placeholder="National ID Number" placeholderTextColor="#6b7280" value={form.idNumber} onChangeText={t => setForm({...form, idNumber: t})} />
            <TextInput style={styles.input} placeholder="Vehicle Registration" placeholderTextColor="#6b7280" value={form.vehicleReg} onChangeText={t => setForm({...form, vehicleReg: t})} />
            <TouchableOpacity style={styles.actionBtn} onPress={() => setCurrentStep(2)}>
              <Text style={styles.actionBtnText}>Submit Application →</Text>
            </TouchableOpacity>
          </View>
        );
      case 2:
        return (
          <View style={styles.formContainer}>
            <Text style={styles.formTitle}>Step 2: Upload Documents</Text>
            {["Driver's License (front 'Driver's License (front & back)' back)", 'PSV Badge', 'Vehicle Insurance Certificate', 'Vehicle Logbook', 'National ID (front & back)'].map((doc, i) => (
              <TouchableOpacity key={i} style={styles.uploadRow}>
                <Ionicons name="document-attach-outline" size={24} color="#3B82F6" />
                <Text style={styles.uploadText}>{doc}</Text>
                <Ionicons name="add-circle" size={24} color="#10B981" />
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={styles.actionBtn} onPress={() => setCurrentStep(3)}>
              <Text style={styles.actionBtnText}>Continue to Inspection →</Text>
            </TouchableOpacity>
          </View>
        );
      case 3:
        return (
          <View style={styles.formContainer}>
            <Text style={styles.formTitle}>Step 3: Vehicle Inspection</Text>
            <Text style={styles.infoText}>Schedule your inspection at an MTAA-certified center:</Text>
            {['Nairobi CBD - Haile Selassie Ave', 'Mombasa - Moi Ave', 'Kisumu - Oginga Odinga St'].map((center, i) => (
              <TouchableOpacity key={i} style={styles.centerCard}>
                <Ionicons name="location" size={20} color="#EF4444" />
                <Text style={styles.centerText}>{center}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={styles.actionBtn} onPress={() => Alert.alert('Inspection Scheduled', 'Your inspection is scheduled for tomorrow at 10:00 AM')}>
              <Text style={styles.actionBtnText}>Schedule Inspection</Text>
            </TouchableOpacity>
          </View>
        );
      case 4:
        return (
          <View style={styles.formContainer}>
            <Text style={styles.formTitle}>Step 4: Background Check</Text>
            <Text style={styles.infoText}>We verify your criminal record and driving history. This takes 1-2 business days.</Text>
            <View style={styles.statusBox}>
              <Ionicons name="time-outline" size={28} color="#F59E0B" />
              <Text style={styles.statusText}>Background check in progress...</Text>
            </View>
          </View>
        );
      case 5:
        return (
          <View style={styles.formContainer}>
            <Text style={styles.formTitle}>Step 5: Driver Training</Text>
            <Text style={styles.infoText}>Complete your safety training modules:</Text>
            {['Module 1: Road Safety Basics', 'Module 2: Passenger Safety', 'Module 3: Emergency Procedures', 'Module 4: Defensive Driving'].map((mod, i) => (
              <TouchableOpacity key={i} style={styles.moduleCard}>
                <Ionicons name="play-circle" size={24} color="#3B82F6" />
                <Text style={styles.moduleText}>{mod}</Text>
                <Text style={styles.moduleDuration}>15 min</Text>
              </TouchableOpacity>
            ))}
          </View>
        );
      case 6:
        return (
          <View style={styles.formContainer}>
            <Text style={styles.formTitle}>Step 6: Admin Approval</Text>
            <Text style={styles.infoText}>Your application is under review. Estimated time: 2-3 business days.</Text>
            <View style={styles.statusBox}>
              <Ionicons name="hourglass-outline" size={28} color="#3B82F6" />
              <Text style={styles.statusText}>Pending admin review</Text>
            </View>
          </View>
        );
      case 7:
        return (
          <View style={styles.formContainer}>
            <Text style={styles.formTitle}>Step 7: Go Live!</Text>
            <Text style={styles.infoText}>Congratulations! Your driver account is approved and ready.</Text>
            <View style={[styles.statusBox, { backgroundColor: '#064e3b' }]}>
              <Ionicons name="checkmark-circle" size={28} color="#10B981" />
              <Text style={[styles.statusText, { color: '#10B981' }]}>✓ Approved — Ready to drive</Text>
            </View>
            <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#10B981' }]} onPress={() => router.push('/(mtaxi)/driver')}>
              <Text style={styles.actionBtnText}>Open Driver Dashboard →</Text>
            </TouchableOpacity>
          </View>
        );
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>MTaxi Driver Onboarding</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${(currentStep / 7) * 100}%` }]} />
        </View>
        <Text style={styles.progressText}>Step {currentStep} of 7</Text>

        <View style={styles.stepsList}>
          {STEPS.map(renderStep)}
        </View>

        {renderStepContent()}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f0f' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '700' },
  progressBar: { height: 4, backgroundColor: '#1a1a1a', marginHorizontal: 16, borderRadius: 2, marginTop: 8 },
  progressFill: { height: '100%', backgroundColor: '#3B82F6', borderRadius: 2 },
  progressText: { color: '#9ca3af', fontSize: 12, marginHorizontal: 16, marginTop: 6, marginBottom: 12 },
  stepsList: { paddingHorizontal: 16, gap: 8 },
  stepCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1a1a1a', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#2a2a2a' },
  stepActive: { borderColor: '#3B82F6', backgroundColor: '#1e3a5f' },
  stepComplete: { borderColor: '#10B981', backgroundColor: '#064e3b' },
  stepIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#374151', alignItems: 'center', justifyContent: 'center' },
  stepInfo: { flex: 1, marginLeft: 12 },
  stepTitle: { color: '#fff', fontSize: 15, fontWeight: '600' },
  stepDesc: { color: '#9ca3af', fontSize: 12, marginTop: 2 },
  formContainer: { margin: 16, padding: 16, backgroundColor: '#1a1a1a', borderRadius: 16, borderWidth: 1, borderColor: '#2a2a2a' },
  formTitle: { color: '#fff', fontSize: 18, fontWeight: '700', marginBottom: 16 },
  input: { backgroundColor: '#0f0f0f', borderRadius: 10, padding: 14, color: '#fff', fontSize: 15, marginBottom: 12, borderWidth: 1, borderColor: '#2a2a2a' },
  actionBtn: { backgroundColor: '#3B82F6', borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 8 },
  actionBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  uploadRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#0f0f0f', borderRadius: 10, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: '#2a2a2a' },
  uploadText: { flex: 1, color: '#fff', marginLeft: 12, fontSize: 14 },
  infoText: { color: '#9ca3af', fontSize: 14, marginBottom: 16, lineHeight: 20 },
  centerCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#0f0f0f', borderRadius: 10, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: '#2a2a2a' },
  centerText: { color: '#fff', marginLeft: 12, fontSize: 14 },
  statusBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1e3a5f', borderRadius: 12, padding: 16, gap: 12 },
  statusText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  moduleCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#0f0f0f', borderRadius: 10, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: '#2a2a2a' },
  moduleText: { flex: 1, color: '#fff', marginLeft: 12, fontSize: 14 },
  moduleDuration: { color: '#9ca3af', fontSize: 12 },
});
