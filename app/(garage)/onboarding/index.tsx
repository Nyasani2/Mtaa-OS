import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useGarage } from '@/lib/hooks/useGarage';
import { useAuthStore } from '@/lib/auth/store/auth.store';

const STEPS = ['Business Info', 'Garage Type', 'Services', 'Subscription'] as const;
type Step = typeof STEPS[number];

const GARAGE_TYPES = [
  { id: 'motorcycle', label: 'Motorcycle Garage', icon: '🏍️' },
  { id: 'taxi', label: 'Taxi Garage', icon: '🚕' },
  { id: 'pickup', label: 'Pickup Garage', icon: '🛻' },
  { id: 'van', label: 'Van Garage', icon: '🚐' },
  { id: 'bus', label: 'Bus Garage', icon: '🚌' },
  { id: 'truck', label: 'Truck Garage', icon: '🚛' },
  { id: 'agricultural', label: 'Agricultural Machinery', icon: '🚜' },
  { id: 'ev', label: 'EV Specialist', icon: '🔋' },
  { id: 'hybrid', label: 'Hybrid Specialist', icon: '⚡' },
  { id: 'heavy_equipment', label: 'Heavy Equipment', icon: '🏗️' },
];

const SERVICES = [
  { id: 'engine', label: 'Engine', icon: '🔧' },
  { id: 'transmission', label: 'Transmission', icon: '⚙️' },
  { id: 'suspension', label: 'Suspension', icon: '🛞' },
  { id: 'electrical', label: 'Electrical', icon: '⚡' },
  { id: 'hybrid', label: 'Hybrid Systems', icon: '🔌' },
  { id: 'ev', label: 'EV Systems', icon: '🔋' },
  { id: 'ac', label: 'Air Conditioning', icon: '❄️' },
  { id: 'tyres', label: 'Tyres', icon: '🛞' },
  { id: 'bodywork', label: 'Bodywork', icon: '🔨' },
  { id: 'painting', label: 'Painting', icon: '🎨' },
  { id: 'diagnostics', label: 'Diagnostics', icon: '🔍' },
  { id: 'obd_ii', label: 'OBD-II', icon: '🔌' },
  { id: 'adas_calibration', label: 'ADAS Calibration', icon: '📡' },
  { id: 'wheel_alignment', label: 'Wheel Alignment', icon: '📐' },
  { id: 'fleet_maintenance', label: 'Fleet Maintenance', icon: '🚗' },
  { id: 'insurance_assessment', label: 'Insurance Assessment', icon: '📋' },
  { id: 'roadworthy', label: 'Roadworthy Inspection', icon: '✅' },
  { id: 'pre_purchase', label: 'Pre-purchase Inspection', icon: '🔎' },
  { id: 'battery_testing', label: 'Battery Testing', icon: '🔋' },
  { id: 'emergency_repair', label: 'Emergency Repair', icon: '🚨' },
  { id: 'recovery', label: 'Recovery / Towing', icon: '🚑' },
  { id: 'car_wash', label: 'Car Wash', icon: '🧼' },
  { id: 'detailing', label: 'Detailing', icon: '✨' },
];

const SUBSCRIPTION_PLANS = [
  { id: 'free', name: 'Free', price: 0, period: '', description: 'Basic listing, walk-ins only', features: ['Basic profile', 'Walk-in customers', 'Standard support'], color: '#64748b' },
  { id: 'boda', name: 'Boda Garage', price: 5000, period: '/month', description: 'Motorcycle specialists', features: ['Motorcycle repairs', 'Appointment booking', 'Priority support', 'ASIS diagnostics'], color: '#f59e0b' },
  { id: 'taxi', name: 'Taxi Garage', price: 10000, period: '/month', description: 'Cars, SUVs, pickups, vans', features: ['All vehicle types', 'Fleet management', 'Insurance claims', 'Roadworthy certs'], color: '#3b82f6' },
  { id: 'truck', name: 'Truck Garage', price: 20000, period: '/month', description: 'Heavy trucks, trailers, equipment', features: ['Heavy vehicles', 'Fleet contracts', 'Mobile mechanic', '24/7 emergency'], color: '#8b5cf6' },
  { id: 'enterprise', name: 'Enterprise', price: 50000, period: '/month', description: 'Unlimited scale', features: ['Unlimited mechanics', 'Unlimited bays', 'White-label', 'API access', 'Dedicated support'], color: '#ef4444' },
];

export default function GarageOnboardingScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { createGarage, subscribe, isLoading, error, clearError } = useGarage();

  const [step, setStep] = useState(0);
  const [businessName, setBusinessName] = useState('');
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [kraPin, setKraPin] = useState('');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState('');
  const [addressLine1, setAddressLine1] = useState('');
  const [city, setCity] = useState('');
  const [county, setCounty] = useState('');
  const [numberOfBays, setNumberOfBays] = useState('1');
  const [yearsInOperation, setYearsInOperation] = useState('');
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [selectedPlan, setSelectedPlan] = useState('free');

  const toggleType = useCallback((id: string) => {
    setSelectedTypes(prev =>
      prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]
    );
  }, []);

  const toggleService = useCallback((id: string) => {
    setSelectedServices(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  }, []);

  const validateStep = useCallback(() => {
    if (step === 0) {
      if (!businessName.trim()) return 'Business name is required';
      if (!registrationNumber.trim()) return 'Registration number is required';
      if (!kraPin.trim()) return 'KRA PIN is required';
      if (!email.trim()) return 'Email is required';
      if (!phone.trim()) return 'Phone is required';
      if (!addressLine1.trim()) return 'Address is required';
      if (!city.trim()) return 'City is required';
      if (!county.trim()) return 'County is required';
    }
    if (step === 1 && selectedTypes.length === 0) {
      return 'Select at least one garage type';
    }
    if (step === 2 && selectedServices.length === 0) {
      return 'Select at least one service';
    }
    return null;
  }, [step, businessName, registrationNumber, kraPin, email, phone, addressLine1, city, county, selectedTypes, selectedServices]);

  const handleNext = useCallback(() => {
    const err = validateStep();
    if (err) {
      Alert.alert('Validation Error', err);
      return;
    }
    clearError();
    setStep(prev => Math.min(prev + 1, STEPS.length - 1));
  }, [validateStep, clearError]);

  const handleBack = useCallback(() => {
    clearError();
    setStep(prev => Math.max(prev - 1, 0));
  }, [clearError]);

  const handleSubmit = useCallback(async () => {
    const err = validateStep();
    if (err) {
      Alert.alert('Validation Error', err);
      return;
    }

    const operatingHours: Record<string, any> = {};
    ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].forEach(day => {
      operatingHours[day] = { open: '08:00', close: '18:00', closed: day === 'sunday' };
    });

    const garage = await createGarage({
      business_name: businessName.trim(),
      registration_number: registrationNumber.trim(),
      kra_pin: kraPin.trim(),
      email: email.trim(),
      phone: phone.trim(),
      address_line1: addressLine1.trim(),
      city: city.trim(),
      county: county.trim(),
      country: 'Kenya',
      number_of_bays: parseInt(numberOfBays) || 1,
      years_in_operation: parseInt(yearsInOperation) || 0,
      garage_types: selectedTypes,
      specializations: selectedServices,
      operating_hours: operatingHours,
      accepts_walk_ins: true,
      accepts_appointments: true,
      emergency_service: false,
      pickup_dropoff: false,
      mobile_mechanic: false,
      description: '',
    });

    if (garage && selectedPlan !== 'free') {
      await subscribe(garage.id, selectedPlan);
    }

    if (garage) {
      Alert.alert(
        'Application Submitted',
        'Your garage application has been submitted for review. You will be notified once approved.',
        [{ text: 'OK', onPress: () => router.replace('/garage') }]
      );
    }
  }, [businessName, registrationNumber, kraPin, email, phone, addressLine1, city, county, numberOfBays, yearsInOperation, selectedTypes, selectedServices, selectedPlan, createGarage, subscribe, router, validateStep]);

  const renderStepIndicator = () => (
    <View style={styles.stepIndicator}>
      {STEPS.map((s, i) => (
        <View key={s} style={styles.stepDotContainer}>
          <View style={[styles.stepDot, i === step && styles.stepDotActive, i < step && styles.stepDotComplete]}>
            {i < step ? (
              <Text style={styles.stepCheck}>✓</Text>
            ) : (
              <Text style={[styles.stepNumber, i === step && styles.stepNumberActive]}>{i + 1}</Text>
            )}
          </View>
          <Text style={[styles.stepLabel, i === step && styles.stepLabelActive]}>{s}</Text>
          {i < STEPS.length - 1 && <View style={[styles.stepLine, i < step && styles.stepLineComplete]} />}
        </View>
      ))}
    </View>
  );

  const renderBusinessInfo = () => (
    <View style={styles.formSection}>
      <Text style={styles.sectionTitle}>🏢 Business Information</Text>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Garage Name *</Text>
        <TextInput
          style={styles.input}
          value={businessName}
          onChangeText={setBusinessName}
          placeholder="e.g. Nairobi Auto Centre"
          placeholderTextColor="#475569"
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Business Registration Number *</Text>
        <TextInput
          style={styles.input}
          value={registrationNumber}
          onChangeText={setRegistrationNumber}
          placeholder="e.g. BN/2024/123456"
          placeholderTextColor="#475569"
          autoCapitalize="characters"
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>KRA PIN *</Text>
        <TextInput
          style={styles.input}
          value={kraPin}
          onChangeText={setKraPin}
          placeholder="e.g. A001234567B"
          placeholderTextColor="#475569"
          autoCapitalize="characters"
        />
      </View>

      <View style={styles.row}>
        <View style={[styles.inputGroup, styles.flex1]}>
          <Text style={styles.inputLabel}>Email *</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="garage@email.com"
            placeholderTextColor="#475569"
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>
        <View style={[styles.inputGroup, styles.flex1]}>
          <Text style={styles.inputLabel}>Phone *</Text>
          <TextInput
            style={styles.input}
            value={phone}
            onChangeText={setPhone}
            placeholder="+254 7XX XXX XXX"
            placeholderTextColor="#475569"
            keyboardType="phone-pad"
          />
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Address *</Text>
        <TextInput
          style={styles.input}
          value={addressLine1}
          onChangeText={setAddressLine1}
          placeholder="Street address"
          placeholderTextColor="#475569"
        />
      </View>

      <View style={styles.row}>
        <View style={[styles.inputGroup, styles.flex1]}>
          <Text style={styles.inputLabel}>City *</Text>
          <TextInput
            style={styles.input}
            value={city}
            onChangeText={setCity}
            placeholder="Nairobi"
            placeholderTextColor="#475569"
          />
        </View>
        <View style={[styles.inputGroup, styles.flex1]}>
          <Text style={styles.inputLabel}>County *</Text>
          <TextInput
            style={styles.input}
            value={county}
            onChangeText={setCounty}
            placeholder="Nairobi County"
            placeholderTextColor="#475569"
          />
        </View>
      </View>

      <View style={styles.row}>
        <View style={[styles.inputGroup, styles.flex1]}>
          <Text style={styles.inputLabel}>Number of Bays</Text>
          <TextInput
            style={styles.input}
            value={numberOfBays}
            onChangeText={setNumberOfBays}
            placeholder="1"
            placeholderTextColor="#475569"
            keyboardType="number-pad"
          />
        </View>
        <View style={[styles.inputGroup, styles.flex1]}>
          <Text style={styles.inputLabel}>Years in Operation</Text>
          <TextInput
            style={styles.input}
            value={yearsInOperation}
            onChangeText={setYearsInOperation}
            placeholder="e.g. 5"
            placeholderTextColor="#475569"
            keyboardType="number-pad"
          />
        </View>
      </View>
    </View>
  );

  const renderGarageType = () => (
    <View style={styles.formSection}>
      <Text style={styles.sectionTitle}>🔧 What vehicles do you service?</Text>
      <Text style={styles.sectionSubtitle}>Select all that apply. You can change this later.</Text>

      <View style={styles.grid}>
        {GARAGE_TYPES.map(type => (
          <TouchableOpacity
            key={type.id}
            style={[styles.gridItem, selectedTypes.includes(type.id) && styles.gridItemActive]}
            onPress={() => toggleType(type.id)}
          >
            <Text style={styles.gridIcon}>{type.icon}</Text>
            <Text style={[styles.gridLabel, selectedTypes.includes(type.id) && styles.gridLabelActive]}>
              {type.label}
            </Text>
            {selectedTypes.includes(type.id) && <View style={styles.checkBadge}><Text style={styles.checkText}>✓</Text></View>}
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderServices = () => (
    <View style={styles.formSection}>
      <Text style={styles.sectionTitle}>🛠️ What services do you offer?</Text>
      <Text style={styles.sectionSubtitle}>Select all services your garage provides.</Text>

      <View style={styles.grid}>
        {SERVICES.map(service => (
          <TouchableOpacity
            key={service.id}
            style={[styles.gridItem, selectedServices.includes(service.id) && styles.gridItemActive]}
            onPress={() => toggleService(service.id)}
          >
            <Text style={styles.gridIcon}>{service.icon}</Text>
            <Text style={[styles.gridLabel, selectedServices.includes(service.id) && styles.gridLabelActive]}>
              {service.label}
            </Text>
            {selectedServices.includes(service.id) && <View style={styles.checkBadge}><Text style={styles.checkText}>✓</Text></View>}
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderSubscription = () => (
    <View style={styles.formSection}>
      <Text style={styles.sectionTitle}>💳 Choose Your Plan</Text>
      <Text style={styles.sectionSubtitle}>Start free and upgrade anytime.</Text>

      {SUBSCRIPTION_PLANS.map(plan => (
        <TouchableOpacity
          key={plan.id}
          style={[styles.planCard, selectedPlan === plan.id && styles.planCardActive]}
          onPress={() => setSelectedPlan(plan.id)}
        >
          <View style={styles.planHeader}>
            <View style={[styles.planBadge, { backgroundColor: plan.color }]}>
              <Text style={styles.planBadgeText}>{plan.name}</Text>
            </View>
            <View style={styles.planPrice}>
              <Text style={styles.planPriceAmount}>KES {plan.price.toLocaleString()}</Text>
              <Text style={styles.planPricePeriod}>{plan.period}</Text>
            </View>
          </View>
          <Text style={styles.planDescription}>{plan.description}</Text>
          <View style={styles.planFeatures}>
            {plan.features.map((feature, i) => (
              <View key={i} style={styles.planFeature}>
                <Text style={styles.planFeatureCheck}>✓</Text>
                <Text style={styles.planFeatureText}>{feature}</Text>
              </View>
            ))}
          </View>
          {selectedPlan === plan.id && (
            <View style={[styles.planSelectedIndicator, { borderColor: plan.color }]}>
              <Text style={[styles.planSelectedText, { color: plan.color }]}>Selected</Text>
            </View>
          )}
        </TouchableOpacity>
      ))}
    </View>
  );

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>🔧 Become a Certified MTAA Garage</Text>
          <Text style={styles.headerSubtitle}>Join Kenya's trusted vehicle maintenance network</Text>
        </View>

        {renderStepIndicator()}

        {error && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>⚠️ {error}</Text>
          </View>
        )}

        {step === 0 && renderBusinessInfo()}
        {step === 1 && renderGarageType()}
        {step === 2 && renderServices()}
        {step === 3 && renderSubscription()}

        <View style={styles.buttonRow}>
          {step > 0 && (
            <TouchableOpacity style={styles.backButton} onPress={handleBack} disabled={isLoading}>
              <Text style={styles.backButtonText}>← Back</Text>
            </TouchableOpacity>
          )}

          {step < STEPS.length - 1 ? (
            <TouchableOpacity style={styles.nextButton} onPress={handleNext} disabled={isLoading}>
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.nextButtonText}>Next →</Text>
              )}
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.submitButton} onPress={handleSubmit} disabled={isLoading}>
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.submitButtonText}>Submit Application</Text>
              )}
            </TouchableOpacity>
          )}
        </View>

        <Text style={styles.footer}>
          By submitting, you agree to MTAA's Garage Terms of Service and Quality Standards.
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  scroll: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 40 },
  header: { marginBottom: 24, marginTop: 20 },
  headerTitle: { fontSize: 24, fontWeight: '800', color: '#fff', marginBottom: 6 },
  headerSubtitle: { fontSize: 14, color: '#94a3b8' },

  stepIndicator: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 28, paddingHorizontal: 8 },
  stepDotContainer: { alignItems: 'center', flex: 1 },
  stepDot: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#1e293b', borderWidth: 2, borderColor: '#334155', alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  stepDotActive: { borderColor: '#3b82f6', backgroundColor: '#1e3a5f' },
  stepDotComplete: { borderColor: '#22c55e', backgroundColor: '#14532d' },
  stepNumber: { color: '#94a3b8', fontSize: 13, fontWeight: '700' },
  stepNumberActive: { color: '#3b82f6' },
  stepCheck: { color: '#22c55e', fontSize: 14, fontWeight: '800' },
  stepLabel: { fontSize: 10, color: '#64748b', textAlign: 'center' },
  stepLabelActive: { color: '#3b82f6', fontWeight: '700' },
  stepLine: { position: 'absolute', top: 15, right: '-50%', width: '100%', height: 2, backgroundColor: '#334155', zIndex: -1 },
  stepLineComplete: { backgroundColor: '#22c55e' },

  errorBox: { backgroundColor: 'rgba(239,68,68,0.15)', borderRadius: 12, padding: 14, marginBottom: 16, borderLeftWidth: 3, borderLeftColor: '#ef4444' },
  errorText: { color: '#fca5a5', fontSize: 13 },

  formSection: { marginBottom: 20 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#e2e8f0', marginBottom: 4 },
  sectionSubtitle: { fontSize: 13, color: '#64748b', marginBottom: 16 },

  inputGroup: { marginBottom: 14 },
  inputLabel: { fontSize: 12, fontWeight: '600', color: '#94a3b8', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 },
  input: { backgroundColor: '#1e293b', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, color: '#fff', fontSize: 15, borderWidth: 1, borderColor: '#334155' },
  row: { flexDirection: 'row', gap: 12 },
  flex1: { flex: 1 },

  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  gridItem: { width: '48%', backgroundColor: '#1e293b', borderRadius: 12, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: '#334155', position: 'relative' },
  gridItemActive: { borderColor: '#3b82f6', backgroundColor: '#1e3a5f' },
  gridIcon: { fontSize: 28, marginBottom: 6 },
  gridLabel: { fontSize: 12, color: '#94a3b8', textAlign: 'center', fontWeight: '600' },
  gridLabelActive: { color: '#3b82f6' },
  checkBadge: { position: 'absolute', top: 8, right: 8, backgroundColor: '#3b82f6', borderRadius: 10, width: 20, height: 20, alignItems: 'center', justifyContent: 'center' },
  checkText: { color: '#fff', fontSize: 11, fontWeight: '800' },

  planCard: { backgroundColor: '#1e293b', borderRadius: 16, padding: 18, marginBottom: 14, borderWidth: 2, borderColor: '#334155' },
  planCardActive: { borderColor: '#3b82f6', backgroundColor: '#1e3a5f' },
  planHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  planBadge: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 8 },
  planBadgeText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  planPrice: { alignItems: 'flex-end' },
  planPriceAmount: { fontSize: 20, fontWeight: '800', color: '#fff' },
  planPricePeriod: { fontSize: 12, color: '#94a3b8' },
  planDescription: { fontSize: 13, color: '#94a3b8', marginBottom: 12 },
  planFeatures: { gap: 6 },
  planFeature: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  planFeatureCheck: { color: '#22c55e', fontSize: 12, fontWeight: '700' },
  planFeatureText: { color: '#cbd5e1', fontSize: 13 },
  planSelectedIndicator: { marginTop: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1, alignItems: 'center' },
  planSelectedText: { fontSize: 12, fontWeight: '700' },

  buttonRow: { flexDirection: 'row', gap: 12, marginTop: 8 },
  backButton: { flex: 1, backgroundColor: '#334155', borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  backButtonText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  nextButton: { flex: 2, backgroundColor: '#3b82f6', borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  nextButtonText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  submitButton: { flex: 2, backgroundColor: '#22c55e', borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  submitButtonText: { color: '#fff', fontSize: 15, fontWeight: '700' },

  footer: { fontSize: 11, color: '#475569', textAlign: 'center', marginTop: 20, lineHeight: 18 },
});
