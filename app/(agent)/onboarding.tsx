import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity,
  ActivityIndicator, Alert, Switch,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/lib/auth/useAuth';
import { supabase } from '@/lib/supabase';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const STEPS = ['Personal Info', 'Business Details', 'Services', 'Review'];

export default function AgentOnboarding() {
  const router = useRouter();
  const { user } = useAuth();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);

  const [fullName, setFullName] = useState('');
  const [idNumber, setIdNumber] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [city, setCity] = useState('');
  const [area, setArea] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [businessReg, setBusinessReg] = useState('');
  const [kraPin, setKraPin] = useState('');
  const [address, setAddress] = useState('');
  const [hasPhysicalShop, setHasPhysicalShop] = useState(false);
  const [shopName, setShopName] = useState('');
  const [services, setServices] = useState<string[]>([]);
  const [dailyFloat, setDailyFloat] = useState('');
  const [hasTillNumber, setHasTillNumber] = useState(false);
  const [tillNumber, setTillNumber] = useState('');
  const [hasPaybill, setHasPaybill] = useState(false);
  const [paybillNumber, setPaybillNumber] = useState('');
  const [referralCode, setReferralCode] = useState('');

  const serviceOptions = [
    'Cash Deposit', 'Cash Withdrawal', 'Money Transfer', 'Bill Payment',
    'Airtime Purchase', 'Bank Transfer', 'Loan Disbursement', 'SACCO Deposit',
    'School Fees Payment', 'Utility Payment',
  ];

  const validateStep = () => {
    switch (step) {
      case 0:
        if (!fullName.trim()) return 'Full name is required';
        if (!idNumber.trim()) return 'National ID number is required';
        if (!phone.trim()) return 'Phone number is required';
        if (!city.trim()) return 'City is required';
        break;
      case 1:
        if (!businessName.trim()) return 'Business name is required';
        if (!businessReg.trim()) return 'Business registration is required';
        if (!kraPin.trim()) return 'KRA PIN is required';
        if (!address.trim()) return 'Business address is required';
        break;
      case 2:
        if (services.length === 0) return 'Select at least one service';
        if (!dailyFloat.trim()) return 'Daily float amount is required';
        break;
    }
    return null;
  };

  const toggleService = (svc: string) => {
    setServices(prev => prev.includes(svc) ? prev.filter(s => s !== svc) : [...prev, svc]);
  };

  const handleNext = () => {
    const error = validateStep();
    if (error) { Alert.alert('Validation Error', error); return; }
    if (step < STEPS.length - 1) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 0) setStep(step - 1);
    else router.back();
  };

  const handleSubmit = async () => {
    const error = validateStep();
    if (error) { Alert.alert('Validation Error', error); return; }
    if (!user) { Alert.alert('Error', 'You must be logged in'); return; }

    setLoading(true);
    try {
      const { error: insertError } = await supabase
        .from('agent_applications')
        .insert({
          user_id: user.id,
          full_name: fullName.trim(),
          id_number: idNumber.trim(),
          phone: phone.trim(),
          email: email.trim(),
          city: city.trim(),
          operating_area: area.trim(),
          business_name: businessName.trim(),
          business_reg: businessReg.trim(),
          kra_pin: kraPin.trim(),
          address: address.trim(),
          has_physical_shop: hasPhysicalShop,
          shop_name: shopName.trim(),
          services: services,
          daily_float: parseFloat(dailyFloat) || 0,
          has_till_number: hasTillNumber,
          till_number: tillNumber.trim(),
          has_paybill: hasPaybill,
          paybill_number: paybillNumber.trim(),
          referral_code: referralCode.trim(),
          status: 'pending_verification',
          total_transactions: 0,
          total_commission: 0,
          rating: 0,
          is_active: false,
          created_at: new Date().toISOString(),
        });

      if (insertError) throw insertError;

      Alert.alert(
        'Application Submitted',
        'Your agent application is pending verification. Our team will review your details and contact you within 3 business days.',
        [{ text: 'OK', onPress: () => router.replace('/(agent)') }]
      );
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to submit application');
    } finally {
      setLoading(false);
    }
  };

  const renderStepIndicator = () => (
    <View style={styles.stepIndicator}>
      {STEPS.map((s, i) => (
        <View key={s} style={styles.stepRow}>
          <View style={[styles.stepDot, i <= step && styles.stepDotActive]}>
            <Text style={[styles.stepNumber, i <= step && styles.stepNumberActive]}>{i + 1}</Text>
          </View>
          {i < STEPS.length - 1 && <View style={[styles.stepLine, i < step && styles.stepLineActive]} />}
          <Text style={[styles.stepLabel, i <= step && styles.stepLabelActive]}>{s}</Text>
        </View>
      ))}
    </View>
  );

  const renderStepContent = () => {
    switch (step) {
      case 0:
        return (
          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>Personal Information</Text>
            <Input label="Full Name *" value={fullName} onChangeText={setFullName} icon="account" />
            <Input label="National ID Number *" value={idNumber} onChangeText={setIdNumber} icon="card-account-details" />
            <Input label="Phone Number *" value={phone} onChangeText={setPhone} icon="phone" keyboardType="phone-pad" />
            <Input label="Email" value={email} onChangeText={setEmail} icon="email" keyboardType="email-address" />
            <Input label="City *" value={city} onChangeText={setCity} icon="city" />
            <Input label="Operating Area / Estate" value={area} onChangeText={setArea} icon="map-marker" placeholder="e.g. CBD, Kibera, Eastleigh" />
          </View>
        );
      case 1:
        return (
          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>Business Details</Text>
            <Input label="Business Name *" value={businessName} onChangeText={setBusinessName} icon="store" />
            <Input label="Business Registration No. *" value={businessReg} onChangeText={setBusinessReg} icon="file-document" />
            <Input label="KRA PIN *" value={kraPin} onChangeText={setKraPin} icon="identifier" />
            <Input label="Business Address *" value={address} onChangeText={setAddress} icon="map-marker" />
            <View style={styles.toggleRow}>
              <Text style={styles.toggleLabel}>I have a physical shop</Text>
              <Switch value={hasPhysicalShop} onValueChange={setHasPhysicalShop} trackColor={{ false: '#E5E7EB', true: '#2563EB' }} />
            </View>
            {hasPhysicalShop && (
              <Input label="Shop Name" value={shopName} onChangeText={setShopName} icon="storefront" />
            )}
          </View>
        );
      case 2:
        return (
          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>Services & Float</Text>
            <Text style={styles.label}>Services You Will Offer *</Text>
            <View style={styles.chipContainer}>
              {serviceOptions.map(svc => (
                <TouchableOpacity key={svc} style={[styles.chip, services.includes(svc) && styles.chipActive]} onPress={() => toggleService(svc)}>
                  <Text style={[styles.chipText, services.includes(svc) && styles.chipTextActive]}>{svc}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Input label="Daily Float Amount (KES) *" value={dailyFloat} onChangeText={setDailyFloat} icon="cash" keyboardType="decimal-pad" placeholder="e.g. 50000" />
            <View style={styles.toggleRow}>
              <Text style={styles.toggleLabel}>I have an M-Pesa Till Number</Text>
              <Switch value={hasTillNumber} onValueChange={setHasTillNumber} trackColor={{ false: '#E5E7EB', true: '#2563EB' }} />
            </View>
            {hasTillNumber && (
              <Input label="Till Number" value={tillNumber} onChangeText={setTillNumber} icon="numeric" keyboardType="number-pad" />
            )}
            <View style={styles.toggleRow}>
              <Text style={styles.toggleLabel}>I have an M-Pesa Paybill</Text>
              <Switch value={hasPaybill} onValueChange={setHasPaybill} trackColor={{ false: '#E5E7EB', true: '#2563EB' }} />
            </View>
            {hasPaybill && (
              <Input label="Paybill Number" value={paybillNumber} onChangeText={setPaybillNumber} icon="numeric" keyboardType="number-pad" />
            )}
            <Input label="Referral Code (optional)" value={referralCode} onChangeText={setReferralCode} icon="ticket-percent" placeholder="If someone referred you" />
            <View style={styles.infoBox}>
              <MaterialCommunityIcons name="information" size={20} color="#2563EB" />
              <Text style={styles.infoText}>
                Agents earn commission on every transaction. Daily float must be maintained at all times. Minimum float: KES 10,000.
              </Text>
            </View>
          </View>
        );
      case 3:
        return (
          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>Review Your Application</Text>
            <ReviewRow label="Name" value={fullName} />
            <ReviewRow label="ID" value={idNumber} />
            <ReviewRow label="Phone" value={phone} />
            <ReviewRow label="City" value={city} />
            <ReviewRow label="Business" value={businessName} />
            <ReviewRow label="Registration" value={businessReg} />
            <ReviewRow label="KRA PIN" value={kraPin} />
            <ReviewRow label="Address" value={address} />
            <ReviewRow label="Shop" value={hasPhysicalShop ? shopName || 'Yes' : 'No'} />
            <ReviewRow label="Services" value={services.join(', ')} />
            <ReviewRow label="Daily Float" value={`KES ${dailyFloat}`} />
            <ReviewRow label="Till" value={hasTillNumber ? tillNumber : 'No'} />
            <ReviewRow label="Paybill" value={hasPaybill ? paybillNumber : 'No'} />
            <ReviewRow label="Referral" value={referralCode} />
            <View style={styles.infoBox}>
              <MaterialCommunityIcons name="check-circle" size={20} color="#10B981" />
              <Text style={styles.infoText}>By submitting, you confirm all information is accurate and agree to MTAA Agent terms.</Text>
            </View>
          </View>
        );
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Apply to be an Agent</Text>
        <View style={{ width: 40 }} />
      </View>
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {renderStepIndicator()}
        {renderStepContent()}
        <View style={{ height: 40 }} />
      </ScrollView>
      <View style={styles.footer}>
        {step > 0 && (
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>
        )}
        {step < STEPS.length - 1 ? (
          <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
            <Text style={styles.nextButtonText}>Next</Text>
            <MaterialCommunityIcons name="arrow-right" size={18} color="#FFF" />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={[styles.nextButton, loading && styles.nextButtonDisabled]} onPress={handleSubmit} disabled={loading}>
            {loading ? <ActivityIndicator color="#FFF" /> : (
              <><Text style={styles.nextButtonText}>Submit Application</Text><MaterialCommunityIcons name="send" size={18} color="#FFF" /></>
            )}
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

function Input({ label, value, onChangeText, icon, keyboardType = 'default', placeholder }: any) {
  return (
    <View style={styles.inputGroup}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputWrapper}>
        <MaterialCommunityIcons name={icon} size={18} color="#9CA3AF" style={styles.inputIcon} />
        <TextInput style={styles.input} value={value} onChangeText={onChangeText} keyboardType={keyboardType} placeholder={placeholder} placeholderTextColor="#9CA3AF" />
      </View>
    </View>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  if (!value) return null;
  return (
    <View style={styles.reviewRow}>
      <Text style={styles.reviewLabel}>{label}</Text>
      <Text style={styles.reviewValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 50, paddingBottom: 12, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  backBtn: { padding: 8 },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#1F2937' },
  scroll: { flex: 1, paddingHorizontal: 16 },
  stepIndicator: { flexDirection: 'row', justifyContent: 'center', alignItems: 'flex-start', paddingVertical: 20 },
  stepRow: { alignItems: 'center', marginHorizontal: 4 },
  stepDot: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#E5E7EB', alignItems: 'center', justifyContent: 'center' },
  stepDotActive: { backgroundColor: '#2563EB' },
  stepNumber: { fontSize: 13, fontWeight: '700', color: '#9CA3AF' },
  stepNumberActive: { color: '#FFF' },
  stepLine: { width: 24, height: 2, backgroundColor: '#E5E7EB', marginVertical: 6 },
  stepLineActive: { backgroundColor: '#2563EB' },
  stepLabel: { fontSize: 10, color: '#9CA3AF', marginTop: 4, maxWidth: 60, textAlign: 'center' },
  stepLabelActive: { color: '#2563EB', fontWeight: '600' },
  formSection: { marginTop: 8 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#1F2937', marginBottom: 16 },
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 6 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB', paddingHorizontal: 12 },
  inputIcon: { marginRight: 8 },
  input: { flex: 1, height: 48, fontSize: 15, color: '#1F2937' },
  chipContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: '#F3F4F6', borderWidth: 1, borderColor: '#E5E7EB' },
  chipActive: { backgroundColor: '#DBEAFE', borderColor: '#2563EB' },
  chipText: { fontSize: 13, color: '#6B7280' },
  chipTextActive: { color: '#2563EB', fontWeight: '600' },
  toggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  toggleLabel: { fontSize: 14, color: '#374151', fontWeight: '500' },
  infoBox: { flexDirection: 'row', backgroundColor: '#EFF6FF', borderRadius: 12, padding: 14, gap: 10, marginTop: 8 },
  infoText: { flex: 1, fontSize: 13, color: '#1E40AF', lineHeight: 18 },
  reviewRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  reviewLabel: { fontSize: 13, color: '#6B7280', fontWeight: '500' },
  reviewValue: { fontSize: 13, color: '#1F2937', fontWeight: '600', flex: 1, textAlign: 'right', marginLeft: 12 },
  footer: { flexDirection: 'row', padding: 16, gap: 12, backgroundColor: '#FFF', borderTopWidth: 1, borderTopColor: '#E5E7EB' },
  backButton: { flex: 1, height: 50, borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB', alignItems: 'center', justifyContent: 'center' },
  backButtonText: { fontSize: 15, fontWeight: '600', color: '#6B7280' },
  nextButton: { flex: 2, height: 50, borderRadius: 12, backgroundColor: '#2563EB', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  nextButtonDisabled: { backgroundColor: '#93C5FD' },
  nextButtonText: { fontSize: 15, fontWeight: '700', color: '#FFF' },
});
