/**
 * ASIS Layer 5 — Onboarding Flow UI
 * Conversational, progressive disclosure, accessible
 * NOT overwhelming fintech wizard
 */

import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, TextInput } from 'react-native';
import { OnboardingStep } from '../types';
import { WalletAssistant } from '../wallet-assistant';

interface OnboardingFlowProps {
  steps: OnboardingStep[];
  assistant: WalletAssistant;
  onComplete: () => void;
  onStepComplete: (stepId: string) => void;
}

export const OnboardingFlow: React.FC<OnboardingFlowProps> = ({
  steps,
  assistant,
  onComplete,
  onStepComplete,
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());
  const [pin, setPin] = useState('');
  const [name, setName] = useState('');

  const step = steps[currentStep];
  const progress = ((completedSteps.size / steps.length) * 100).toFixed(0);

  const handleNext = useCallback(() => {
    if (step) {
      setCompletedSteps(prev => new Set([...prev, step.id]));
      onStepComplete(step.id);
    }

    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      onComplete();
    }
  }, [currentStep, step, onStepComplete, onComplete]);

  const handleSkip = useCallback(() => {
    if (step?.skippable) {
      if (currentStep < steps.length - 1) {
        setCurrentStep(prev => prev + 1);
      } else {
        onComplete();
      }
    }
  }, [currentStep, step, onComplete]);

  const renderStepContent = () => {
    switch (step?.action) {
      case 'setup_pin':
        return (
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Choose 4 digits</Text>
            <TextInput
              style={styles.pinInput}
              value={pin}
              onChangeText={setPin}
              keyboardType="number-pad"
              maxLength={4}
              secureTextEntry
              placeholder="••••"
            />
            <Text style={styles.hint}>Don't use your birthday</Text>
          </View>
        );

      case 'setup_profile':
        return (
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Your name</Text>
            <TextInput
              style={styles.textInput}
              value={name}
              onChangeText={setName}
              placeholder="e.g. John Kamau"
              autoCapitalize="words"
            />
          </View>
        );

      case 'claim_funds':
        return (
          <View style={styles.claimPreview}>
            <Text style={styles.claimAmount}>
              {step.context?.senderName} sent you{' '}
              <Text style={styles.amountHighlight}>
                KSh{(step.context?.claimAmount as number)?.toLocaleString()}
              </Text>
            </Text>
            <Text style={styles.claimHint}>Tap below to add it to your wallet</Text>
          </View>
        );

      default:
        return null;
    }
  };

  if (!step) return null;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${progress}%` }]} />
      </View>

      <Text style={styles.progressText}>Step {currentStep + 1} of {steps.length}</Text>

      <View style={styles.stepCard}>
        <Text style={styles.stepTitle}>{step.title}</Text>
        <Text style={styles.stepDescription}>{step.description}</Text>

        {renderStepContent()}

        <TouchableOpacity
          style={[styles.button, styles.primaryButton]}
          onPress={handleNext}
        >
          <Text style={styles.primaryButtonText}>
            {currentStep === steps.length - 1 ? 'Finish' : 'Continue'}
          </Text>
        </TouchableOpacity>

        {step.skippable && (
          <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
            <Text style={styles.skipText}>Skip for now</Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  content: {
    padding: 20,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    marginBottom: 12,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#059669',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 20,
  },
  stepCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  stepTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },
  stepDescription: {
    fontSize: 15,
    color: '#4B5563',
    lineHeight: 22,
    marginBottom: 24,
  },
  inputContainer: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  pinInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    padding: 16,
    fontSize: 24,
    textAlign: 'center',
    letterSpacing: 8,
    color: '#111827',
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#111827',
  },
  hint: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 8,
  },
  claimPreview: {
    backgroundColor: '#ECFDF5',
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
    alignItems: 'center',
  },
  claimAmount: {
    fontSize: 16,
    color: '#065F46',
    textAlign: 'center',
  },
  amountHighlight: {
    fontWeight: '700',
  },
  claimHint: {
    fontSize: 13,
    color: '#059669',
    marginTop: 8,
  },
  button: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: '#059669',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  skipButton: {
    marginTop: 12,
    alignItems: 'center',
    paddingVertical: 8,
  },
  skipText: {
    color: '#6B7280',
    fontSize: 14,
  },
});
