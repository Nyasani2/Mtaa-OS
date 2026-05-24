// ============================================================
// HEALTH + VOICE BRIDGE — Connects health module with ASIS voice/avatar
// Enables multimodal health interaction
// ASIS cannot view health data without explicit user consent
// ============================================================

import { HealthVault } from './health/health-vault';
import { ConsentManager } from './health/consent-manager';
import { HealthAuditLog } from './health/audit-log';
import { VoiceEngine } from './voice/voice-engine';
import { AvatarEngine } from './avatar/avatar-engine';
import { HealthRecord, HealthCategory } from './health/types';
import { VoiceConfig, AvatarConfig } from './voice/voice-types';

export interface HealthVoiceConfig {
  voice: VoiceConfig;
  avatar: AvatarConfig;
  requireConsentForVoice: boolean;
  healthCategoriesForVoice: HealthCategory[];
}

export class HealthVoiceBridge {
  private vault: HealthVault;
  private consent: ConsentManager;
  private audit: HealthAuditLog;
  private voice: VoiceEngine;
  private avatar: AvatarEngine;
  private config: HealthVoiceConfig;

  constructor(
    vault: HealthVault,
    consent: ConsentManager,
    audit: HealthAuditLog,
    voice: VoiceEngine,
    avatar: AvatarEngine,
    config: HealthVoiceConfig
  ) {
    this.vault = vault;
    this.consent = consent;
    this.audit = audit;
    this.voice = voice;
    this.avatar = avatar;
    this.config = config;
  }

  // User asks ASIS about their health via voice
  async handleHealthQuery(userId: string, query: string, sessionId: string): Promise<string> {
    // ASIS NEVER accesses health data without consent
    // Instead, ASIS guides the user to the right place

    this.avatar.setThinking(true);

    const response = this.generateGuidanceResponse(query);

    this.avatar.setThinking(false);
    await this.voice.speakResponse(sessionId, query, response);
    this.avatar.setExpression('helpful');

    await this.audit.log({
      userId,
      actorId: 'asis',
      actorType: 'asis',
      action: 'HEALTH_VOICE_QUERY',
      result: 'success',
      details: `Voice query: "${query.substring(0, 50)}..." — guidance provided, no data accessed`,
    });

    return response;
  }

  // User explicitly asks ASIS to read a specific record (with consent)
  async readRecordWithConsent(
    userId: string,
    recordId: string,
    pin: string,
    sessionId: string
  ): Promise<string> {
    // Request consent
    const token = await this.consent.requestAccess('asis', userId, ['medical_history'], 'read');

    try {
      const approved = await this.consent.approveConsent(userId, token.id, pin);
      if (!approved) throw new Error('Consent denied');

      const records = await this.vault.getRecords(userId);
      const record = records.find(r => r.id === recordId);

      if (!record) {
        await this.voice.speak(sessionId, 'I could not find that record in your health vault.');
        return 'Record not found';
      }

      // Read aloud
      this.avatar.setSpeaking(true);
      const summary = this.summarizeRecord(record);
      await this.voice.speak(sessionId, summary);
      this.avatar.setSpeaking(false);

      // Revoke immediately after read (single-use)
      await this.consent.revokeConsent(userId, token.id);

      await this.audit.log({
        userId,
        actorId: 'asis',
        actorType: 'asis',
        action: 'HEALTH_RECORD_READ_ALOUD',
        recordId,
        consentTokenId: token.id,
        result: 'success',
        details: 'Record read aloud with consent, then revoked',
      });

      return summary;
    } catch (err) {
      await this.voice.speak(sessionId, 'I cannot access your health data without your approval.');
      throw err;
    }
  }

  // Emergency voice activation
  async handleEmergencyVoice(userId: string, sessionId: string): Promise<string> {
    this.avatar.setExpression('alert');
    const message = 'Emergency mode activated. I can help you contact emergency services or your trusted contacts. Your critical health information is available for emergency responders.';
    await this.voice.speak(sessionId, message, 'alert');
    return message;
  }

  private generateGuidanceResponse(query: string): string {
    const lower = query.toLowerCase();

    if (lower.includes('appointment') || lower.includes('book') || lower.includes('schedule')) {
      return 'I can help you schedule an appointment. Would you like to see available providers near you?';
    }
    if (lower.includes('prescription') || lower.includes('medication') || lower.includes('medicine')) {
      return 'I can show you your prescription records. Please open your Health Vault and tap on Prescriptions.';
    }
    if (lower.includes('record') || lower.includes('history') || lower.includes('report')) {
      return 'Your health records are in your Health Vault. I can read them aloud if you give me permission. Would you like me to do that?';
    }
    if (lower.includes('qr') || lower.includes('doctor') || lower.includes('hospital')) {
      return 'To share your records with a doctor, generate a QR code from your Health Vault. The doctor scans it, and you approve the access.';
    }
    if (lower.includes('emergency') || lower.includes('help') || lower.includes('sos')) {
      return 'If this is a medical emergency, please call emergency services immediately. I can also activate emergency access to share your critical health data with responders.';
    }

    return 'I am here to help with your health coordination. I cannot diagnose or give medical advice, but I can help you access your records, find providers, or schedule appointments.';
  }

  private summarizeRecord(record: HealthRecord): string {
    return `Here is your ${record.category.replace('_', ' ')}: ${record.title}. Recorded on ${new Date(record.createdAt).toLocaleDateString()}.`;
  }
}
