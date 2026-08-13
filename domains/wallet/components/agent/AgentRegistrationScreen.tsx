import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { useAgent } from '../../hooks/useAgent';
import { AgentOnboardingForm } from '../../types/agent';

const AGENT_TYPES = [
  { key: 'kiosk', label: 'Kiosk', icon: '🏪', desc: 'Fixed shop or desk location' },
  { key: 'mobile', label: 'Mobile', icon: '🛵', desc: 'Moving agent (bike, walking)' },
  { key: 'stationary', label: 'Stationary', icon: '🏢', desc: 'Permanent business premises' },
];

export default function AgentRegistrationScreen() {
  const { agent, onboard, activate, loading } = useAgent();
  const [step, setStep] = useState<'type' | 'form' | 'review' | 'pay' | 'done'>('type');
  const [form, setForm] = useState<AgentOnboardingForm>({
    agentType: 'kiosk', businessName: '', idNumber: '', kraPin: '', businessAddress: '', pin: '',
  });
  const [pin, setPin] = useState('');

  if (loading) return <ActivityIndicator size="large" style={{ marginTop: 100 }} />;

  // Already active agent
  if (agent?.status === 'active') {
    return (
      <View style={{ padding: 20, alignItems: 'center' }}>
        <Text style={{ fontSize: 48 }}>✅</Text>
        <Text style={{ fontSize: 20, fontWeight: 'bold', marginTop: 10 }}>Agent Active</Text>
        <Text style={{ fontSize: 16, color: '#666', marginTop: 5 }}>{agent.business_name}</Text>
        <Text style={{ fontSize: 14, color: '#888', marginTop: 5 }}>Type: {agent.agent_type}</Text>
        <Text style={{ fontSize: 14, color: '#888' }}>Float: KES {agent.float_balance?.toLocaleString()}</Text>
      </View>
    );
  }

  // Pending approval
  if (agent?.status === 'pending_approval') {
    return (
      <View style={{ padding: 20, alignItems: 'center' }}>
        <Text style={{ fontSize: 48 }}>⏳</Text>
        <Text style={{ fontSize: 20, fontWeight: 'bold', marginTop: 10 }}>Pending Approval</Text>
        <Text style={{ fontSize: 14, color: '#666', marginTop: 10, textAlign: 'center' }}>
          Your {agent.agent_type} application for {agent.business_name} is under review.
        </Text>
      </View>
    );
  }

  // Approved — needs activation payment
  if (agent?.status === 'approved') {
    return (
      <View style={{ padding: 20 }}>
        <Text style={{ fontSize: 20, fontWeight: 'bold' }}>Activate Agent Account</Text>
        <Text style={{ fontSize: 14, color: '#666', marginTop: 10 }}>
          Pay KES 100,000 activation float from your wallet
        </Text>
        <TextInput
          placeholder="Enter PIN"
          secureTextEntry
          keyboardType="number-pad"
          maxLength={4}
          value={pin}
          onChangeText={setPin}
          style={{ borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, marginTop: 20, fontSize: 16 }}
        />
        <TouchableOpacity
          onPress={async () => {
            if (pin.length !== 4) { Alert.alert('Error', 'Enter 4-digit PIN'); return; }
            const res = await activate(pin);
            if (res.success) Alert.alert('Success', 'Agent activated!');
            else Alert.alert('Error', res.error || 'Activation failed');
          }}
          style={{ backgroundColor: '#007AFF', padding: 16, borderRadius: 8, marginTop: 20, alignItems: 'center' }}
        >
          <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>Pay KES 100,000 & Activate</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // STEP 1: Select Type
  if (step === 'type') {
    return (
      <ScrollView style={{ flex: 1, padding: 20 }}>
        <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 5 }}>Become an Agent</Text>
        <Text style={{ fontSize: 14, color: '#666', marginBottom: 20 }}>Select your agent type</Text>
        {AGENT_TYPES.map((t) => (
          <TouchableOpacity
            key={t.key}
            onPress={() => { setForm(f => ({ ...f, agentType: t.key as any })); setStep('form'); }}
            style={{
              flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 12,
              backgroundColor: '#f8f9fa', marginBottom: 12, borderWidth: 1, borderColor: '#e9ecef',
            }}
          >
            <Text style={{ fontSize: 32, marginRight: 16 }}>{t.icon}</Text>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 16, fontWeight: '600' }}>{t.label}</Text>
              <Text style={{ fontSize: 13, color: '#888', marginTop: 2 }}>{t.desc}</Text>
            </View>
            <Text style={{ fontSize: 20, color: '#007AFF' }}>›</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    );
  }

  // STEP 2: Form
  if (step === 'form') {
    return (
      <ScrollView style={{ flex: 1, padding: 20 }}>
        <Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 5 }}>
          {AGENT_TYPES.find((t: any) => t.key === form.agentType)?.label} Registration
        </Text>
        <Text style={{ fontSize: 13, color: '#888', marginBottom: 20 }}>KES 100,000 float required</Text>

        {[
          { key: 'businessName', label: 'Business Name', placeholder: 'e.g. Kevins Agent' },
          { key: 'idNumber', label: 'ID Number', placeholder: 'National ID' },
          { key: 'kraPin', label: 'KRA PIN', placeholder: 'A123456789B' },
          { key: 'businessAddress', label: 'Business Address', placeholder: 'Nairobi CBD, Moi Ave' },
          { key: 'pin', label: 'Your Wallet PIN', placeholder: '4-digit PIN', secure: true, num: true },
        ].map((field) => (
          <View key={field.key} style={{ marginBottom: 16 }}>
            <Text style={{ fontSize: 14, fontWeight: '500', marginBottom: 6, color: '#333' }}>{field.label}</Text>
            <TextInput
              placeholder={field.placeholder}
              secureTextEntry={field.secure}
              keyboardType={field.num ? 'number-pad' : 'default'}
              maxLength={field.num ? 4 : undefined}
              value={(form as any)[field.key]}
              onChangeText={(text) => setForm(f => ({ ...f, [field.key]: text }))}
              style={{
                borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, fontSize: 15,
                backgroundColor: '#fff',
              }}
            />
          </View>
        ))}

        <TouchableOpacity
          onPress={async () => {
            if (!form.businessName || !form.idNumber || !form.kraPin || !form.pin) {
              Alert.alert('Error', 'Fill all required fields'); return;
            }
            if (form.pin.length !== 4) { Alert.alert('Error', 'PIN must be 4 digits'); return; }
            const res = await onboard(form);
            if (res.success) {
              Alert.alert('Success', 'Application submitted for approval');
              setStep('done');
            } else {
              Alert.alert('Error', res.error || 'Failed');
            }
          }}
          style={{ backgroundColor: '#007AFF', padding: 16, borderRadius: 8, alignItems: 'center', marginTop: 10 }}
        >
          <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>Submit Application</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  return null;
}
