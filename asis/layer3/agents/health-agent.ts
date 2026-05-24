/**
 * HealthAgent
 * Handles health appointments, provider search, symptom checking, record access
 * CRITICAL: All health data access requires explicit user consent
 * MTAA does NOT own health records — users do
 */

import { BaseAgent } from './base-agent';
import { AgentRequest, AgentResponse } from '../shared/types';
import { ASISEventBus } from '../core/event-bus';
import { ASISSecurityLayer } from '../security/security-layer';
import { HealthAction } from './types';

export class HealthAgent extends BaseAgent {
  readonly name = 'health_agent';
  readonly version = '1.0.0';
  readonly capabilities = [
    'book_appointment',
    'find_provider',
    'symptom_check',
    'access_records',
    'emergency',
    'health_tips',
    'medication_reminder',
  ];

  constructor(eventBus: ASISEventBus, security: ASISSecurityLayer) {
    super(eventBus, security);
  }

  protected _registerTools(): void {
    this._tools.set('find_provider', {
      name: 'find_provider',
      description: 'Find healthcare providers',
      parameters: [
        { name: 'specialty', type: 'string', description: 'Medical specialty', required: false },
        { name: 'location', type: 'string', description: 'Location', required: false },
        { name: 'availability', type: 'string', description: 'When needed', required: false },
      ],
      returns: { type: 'array', description: 'Provider list' },
      requiresAuth: false,
      riskLevel: 'low',
    });

    this._tools.set('book_appointment', {
      name: 'book_appointment',
      description: 'Book a medical appointment',
      parameters: [
        { name: 'providerId', type: 'string', description: 'Provider ID', required: true },
        { name: 'date', type: 'string', description: 'Preferred date', required: true },
        { name: 'time', type: 'string', description: 'Preferred time', required: true },
        { name: 'reason', type: 'string', description: 'Reason for visit', required: false },
      ],
      returns: { type: 'object', description: 'Appointment confirmation' },
      requiresAuth: true,
      riskLevel: 'low',
    });

    this._tools.set('access_records', {
      name: 'access_records',
      description: 'Access health records',
      parameters: [
        { name: 'recordType', type: 'string', description: 'Type of records', required: false },
        { name: 'dateRange', type: 'object', description: 'Date range', required: false },
      ],
      returns: { type: 'object', description: 'Health records' },
      requiresAuth: true,
      riskLevel: 'high',
    });

    this._tools.set('symptom_check', {
      name: 'symptom_check',
      description: 'Check symptoms (informational only)',
      parameters: [
        { name: 'symptoms', type: 'array', description: 'List of symptoms', required: true },
        { name: 'duration', type: 'string', description: 'How long', required: false },
        { name: 'severity', type: 'string', description: 'Severity level', required: false },
      ],
      returns: { type: 'object', description: 'Symptom information' },
      requiresAuth: false,
      riskLevel: 'medium',
    });
  }

  canHandle(intent: string, entities: string[]): boolean {
    return intent === 'health' || 
           entities.some((e) => ['appointment', 'doctor', 'hospital', 'symptom', 'record', 'clinic'].includes(e));
  }

  async process(request: AgentRequest): Promise<AgentResponse> {
    const startTime = Date.now();
    const validation = this._validateRequest(request);

    if (!validation.valid) {
      return this._createErrorResponse(validation.error || 'Invalid request');
    }

    this._state.status = 'processing';
    const { input, context } = request;

    try {
      const action = this._parseHealthAction(input);
      let response: AgentResponse;

      switch (action.type) {
        case 'book_appointment':
          response = await this._handleBookAppointment(action.params, context);
          break;
        case 'find_provider':
          response = await this._handleFindProvider(action.params, context);
          break;
        case 'symptom_check':
          response = await this._handleSymptomCheck(action.params, context);
          break;
        case 'access_records':
          response = await this._handleAccessRecords(action.params, context);
          break;
        case 'emergency':
          response = await this._handleEmergency(context);
          break;
        default:
          response = this._createHealthMenu();
      }

      this._updateMetrics(Date.now() - startTime);
      this._state.status = 'idle';
      return response;
    } catch (error) {
      this._state.status = 'error';
      return this._createErrorResponse(
        error instanceof Error ? error.message : 'Health operation failed'
      );
    }
  }

  private _parseHealthAction(input: string): HealthAction {
    const lower = input.toLowerCase();

    if (/book.*appointment|schedule.*doctor|see.*doctor/.test(lower)) {
      return { type: 'book_appointment', params: {}, requiresConsent: false };
    }
    if (/find.*doctor|find.*hospital|clinic.*near|provider/.test(lower)) {
      return { type: 'find_provider', params: {}, requiresConsent: false };
    }
    if (/symptom|feel.*sick|pain|fever|headache|nausea/.test(lower)) {
      return { type: 'symptom_check', params: { symptoms: this._extractSymptoms(input) }, requiresConsent: false };
    }
    if (/record|history|medical.*file|my.*health/.test(lower)) {
      return { type: 'access_records', params: {}, requiresConsent: true };
    }
    if (/emergency|urgent|ambulance|911|999/.test(lower)) {
      return { type: 'emergency', params: {}, requiresConsent: false };
    }

    return { type: 'find_provider', params: {}, requiresConsent: false };
  }

  private _extractSymptoms(input: string): string[] {
    const symptomList = ['fever', 'headache', 'nausea', 'cough', 'fatigue', 'pain', 'dizziness', 'rash'];
    return symptomList.filter((s) => input.toLowerCase().includes(s));
  }

  private async _handleBookAppointment(params: any, context: any): Promise<AgentResponse> {
    return this._createActionResponse(
      'Book a medical appointment:\n\nWhat type of doctor do you need?',
      [
        { label: '🩺 General Practitioner', type: 'button', payload: { specialty: 'general' } },
        { label: '👁️ Eye Specialist', type: 'button', payload: { specialty: 'ophthalmology' } },
        { label: '🦷 Dentist', type: 'button', payload: { specialty: 'dental' } },
        { label: '🧠 Mental Health', type: 'button', payload: { specialty: 'psychiatry' } },
        { label: '👶 Pediatrician', type: 'button', payload: { specialty: 'pediatrics' } },
        { label: '❤️ Cardiologist', type: 'button', payload: { specialty: 'cardiology' } },
      ],
      { type: 'appointment_specialty' }
    );
  }

  private async _handleFindProvider(params: any, context: any): Promise<AgentResponse> {
    const providers = [
      { id: '1', name: 'Dr. Sarah Kimani', specialty: 'General Practitioner', location: 'Nairobi', rating: 4.8, nextAvailable: 'Tomorrow 9:00 AM' },
      { id: '2', name: 'Dr. James Ochieng', specialty: 'Cardiologist', location: 'Nairobi', rating: 4.9, nextAvailable: 'Wed 2:00 PM' },
      { id: '3', name: 'Nairobi West Hospital', specialty: 'Multi-specialty', location: 'Westlands', rating: 4.5, nextAvailable: 'Today 4:00 PM' },
    ];

    let text = '**Healthcare Providers Near You**\n\n';
    providers.forEach((p, i) => {
      text += `${i + 1}. **${p.name}**\n`;
      text += `   ${p.specialty} | ⭐ ${p.rating} | 📍 ${p.location}\n`;
      text += `   Next available: ${p.nextAvailable}\n\n`;
    });

    return this._createActionResponse(
      text,
      providers.map((p) => ({
        label: `Book ${p.name}`,
        type: 'button',
        payload: { action: 'book', providerId: p.id },
      })),
      { type: 'provider_search_results', providers }
    );
  }

  private async _handleSymptomCheck(params: any, context: any): Promise<AgentResponse> {
    const symptoms = params.symptoms || ['unspecified'];

    return this._createTextResponse(
      `**Symptom Check** ⚠️\n\n` +
      `You mentioned: ${symptoms.join(', ')}\n\n` +
      `**Important:** I am an AI assistant, not a doctor. This is for informational purposes only.\n\n` +
      `**General advice:**\n` +
      `• Rest and stay hydrated\n` +
      `• Monitor your symptoms\n` +
      `• If symptoms worsen, see a doctor\n\n` +
      `**When to seek immediate care:**\n` +
      `• Difficulty breathing\n` +
      `• Chest pain\n` +
      `• Severe bleeding\n` +
      `• Loss of consciousness\n\n` +
      `Would you like me to find a doctor near you?`,
      { type: 'symptom_check', symptoms }
    );
  }

  private async _handleAccessRecords(params: any, context: any): Promise<AgentResponse> {
    // Health records require explicit consent
    return this._createConfirmationResponse(
      '**Access Health Records** 🔒\n\n' +
      'You are about to access your personal health records.\n\n' +
      'This requires biometric or PIN confirmation for your privacy.\n\n' +
      'Proceed?',
      { type: 'access_records', params },
      { type: 'records_consent' }
    );
  }

  private async _handleEmergency(context: any): Promise<AgentResponse> {
    return this._createActionResponse(
      '🚨 **EMERGENCY** 🚨\n\n' +
      'If this is a life-threatening emergency, call **999** immediately.\n\n' +
      '**Nearby Emergency Services:**',
      [
        { label: '📞 Call 999', type: 'open', payload: { action: 'call_emergency', number: '999' } },
        { label: '🏥 Nearest Hospital', type: 'navigate', payload: { action: 'nearest_hospital' } },
        { label: '🚑 Request Ambulance', type: 'navigate', payload: { action: 'ambulance' } },
        { label: '👤 Emergency Contacts', type: 'navigate', payload: { action: 'emergency_contacts' } },
      ],
      { type: 'emergency', priority: 'critical' }
    );
  }

  private _createHealthMenu(): AgentResponse {
    return this._createActionResponse(
      'Health Services — What do you need?',
      [
        { label: '📅 Book Appointment', type: 'navigate', payload: { action: 'book_appointment' } },
        { label: '🔍 Find Doctor', type: 'navigate', payload: { action: 'find_provider' } },
        { label: '🩺 Symptom Check', type: 'navigate', payload: { action: 'symptom_check' } },
        { label: '📋 My Records', type: 'navigate', payload: { action: 'access_records' } },
        { label: '💊 Medications', type: 'navigate', payload: { action: 'medications' } },
        { label: '🚨 Emergency', type: 'navigate', payload: { action: 'emergency' } },
      ],
      { type: 'health_menu' }
    );
  }
}
