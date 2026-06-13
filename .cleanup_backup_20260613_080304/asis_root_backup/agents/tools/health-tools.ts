/**
 * HealthTools
 * Tool definitions for health appointments, providers, and records
 * CRITICAL: All health data access requires explicit consent
 */

import { ToolDefinition, ToolResult } from '../types';
import { ASISEventBus } from '../../core/event-bus';

export class HealthTools {
  private _eventBus: ASISEventBus;

  constructor(eventBus: ASISEventBus) {
    this._eventBus = eventBus;
  }

  getDefinitions(): ToolDefinition[] {
    return [
      {
        name: 'health_find_provider',
        description: 'Find healthcare providers',
        parameters: [
          { name: 'specialty', type: 'string', required: false, description: 'Medical specialty' },
          { name: 'location', type: 'string', required: false, description: 'Location' },
          { name: 'availability', type: 'string', required: false, description: 'When needed' },
          { name: 'language', type: 'string', required: false, description: 'Preferred language' },
        ],
        returns: { type: 'array', description: 'Provider list' },
        requiresAuth: false,
        riskLevel: 'low',
      },
      {
        name: 'health_book_appointment',
        description: 'Book a medical appointment',
        parameters: [
          { name: 'providerId', type: 'string', required: true, description: 'Provider ID' },
          { name: 'date', type: 'string', required: true, description: 'Preferred date (YYYY-MM-DD)' },
          { name: 'time', type: 'string', required: true, description: 'Preferred time (HH:MM)' },
          { name: 'reason', type: 'string', required: false, description: 'Reason for visit' },
          { name: 'isVirtual', type: 'boolean', required: false, default: false, description: 'Telemedicine' },
        ],
        returns: { type: 'object', description: 'Appointment confirmation' },
        requiresAuth: true,
        riskLevel: 'low',
      },
      {
        name: 'health_access_records',
        description: 'Access personal health records',
        parameters: [
          { name: 'recordType', type: 'string', required: false, description: 'Filter by type' },
          { name: 'dateFrom', type: 'string', required: false, description: 'Start date' },
          { name: 'dateTo', type: 'string', required: false, description: 'End date' },
        ],
        returns: { type: 'object', description: 'Health records' },
        requiresAuth: true,
        riskLevel: 'high',
      },
      {
        name: 'health_share_records',
        description: 'Share health records with provider',
        parameters: [
          { name: 'providerId', type: 'string', required: true, description: 'Provider to share with' },
          { name: 'recordIds', type: 'array', required: true, description: 'Records to share' },
          { name: 'expiryDays', type: 'number', required: false, default: 7, description: 'Share expiry' },
        ],
        returns: { type: 'object', description: 'Share confirmation' },
        requiresAuth: true,
        riskLevel: 'high',
      },
      {
        name: 'health_symptom_info',
        description: 'Get informational content about symptoms',
        parameters: [
          { name: 'symptoms', type: 'array', required: true, description: 'List of symptoms' },
          { name: 'duration', type: 'string', required: false, description: 'How long' },
          { name: 'severity', type: 'string', required: false, description: 'mild, moderate, severe' },
        ],
        returns: { type: 'object', description: 'Informational content' },
        requiresAuth: false,
        riskLevel: 'medium',
      },
    ];
  }

  async execute(toolName: string, params: Record<string, any>, userContext: any): Promise<ToolResult> {
    const startTime = Date.now();

    try {
      let result: any;

      switch (toolName) {
        case 'health_find_provider':
          result = await this._findProvider(params);
          break;
        case 'health_book_appointment':
          result = await this._bookAppointment(params, userContext);
          break;
        case 'health_access_records':
          result = await this._accessRecords(params, userContext);
          break;
        case 'health_share_records':
          result = await this._shareRecords(params, userContext);
          break;
        case 'health_symptom_info':
          result = await this._symptomInfo(params);
          break;
        default:
          return {
            success: false,
            error: `Unknown tool: ${toolName}`,
            executionTime: Date.now() - startTime,
          };
      }

      return {
        success: true,
        data: result,
        executionTime: Date.now() - startTime,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Tool execution failed',
        executionTime: Date.now() - startTime,
      };
    }
  }

  private async _findProvider(params: any): Promise<any> {
    const providers = [
      {
        id: 'prov_1',
        name: 'Dr. Sarah Kimani',
        specialty: 'General Practitioner',
        location: 'Nairobi, Westlands',
        hospital: 'Nairobi West Hospital',
        rating: 4.8,
        reviews: 124,
        languages: ['English', 'Swahili'],
        nextAvailable: 'Tomorrow 9:00 AM',
        consultationFee: 2000,
        isVirtualAvailable: true,
      },
      {
        id: 'prov_2',
        name: 'Dr. James Ochieng',
        specialty: 'Cardiologist',
        location: 'Nairobi, Upper Hill',
        hospital: 'Kenyatta National Hospital',
        rating: 4.9,
        reviews: 89,
        languages: ['English', 'Swahili', 'Luo'],
        nextAvailable: 'Wed 2:00 PM',
        consultationFee: 3500,
        isVirtualAvailable: true,
      },
      {
        id: 'prov_3',
        name: 'Nairobi West Hospital',
        specialty: 'Multi-specialty',
        location: 'Westlands, Nairobi',
        hospital: 'Nairobi West Hospital',
        rating: 4.5,
        reviews: 342,
        languages: ['English', 'Swahili'],
        nextAvailable: 'Today 4:00 PM',
        consultationFee: 1500,
        isVirtualAvailable: false,
      },
    ];

    return {
      providers,
      total: providers.length,
      filters: {
        specialty: params.specialty,
        location: params.location,
      },
    };
  }

  private async _bookAppointment(params: any, userContext: any): Promise<any> {
    const appointmentId = `apt_${Date.now()}`;

    this._eventBus.emit('health:appointment:booked', {
      appointmentId,
      userId: userContext.id,
      providerId: params.providerId,
      date: params.date,
      time: params.time,
    });

    return {
      appointmentId,
      providerId: params.providerId,
      date: params.date,
      time: params.time,
      status: 'confirmed',
      isVirtual: params.isVirtual || false,
      meetingLink: params.isVirtual ? `https://mtaa.health/tele/${appointmentId}` : null,
      reminderSet: true,
      canReschedule: true,
      canCancel: true,
    };
  }

  private async _accessRecords(params: any, userContext: any): Promise<any> {
    // CRITICAL: This would require biometric/PIN confirmation in production
    this._eventBus.emit('health:records:accessed', {
      userId: userContext.id,
      recordType: params.recordType,
      timestamp: Date.now(),
    });

    return {
      records: [
        {
          id: 'rec_1',
          type: 'consultation',
          date: '2026-04-15',
          provider: 'Dr. Sarah Kimani',
          diagnosis: 'Upper respiratory infection',
          prescription: 'Amoxicillin 500mg, 3x daily for 7 days',
          notes: 'Patient responding well to treatment',
        },
        {
          id: 'rec_2',
          type: 'lab',
          date: '2026-03-20',
          provider: 'Nairobi West Hospital',
          test: 'Complete Blood Count',
          results: 'All values within normal range',
          notes: 'Annual checkup',
        },
      ],
      accessLog: [
        { accessedBy: 'user', timestamp: Date.now(), action: 'view' },
      ],
    };
  }

  private async _shareRecords(params: any, userContext: any): Promise<any> {
    const shareId = `share_${Date.now()}`;

    this._eventBus.emit('health:records:shared', {
      shareId,
      userId: userContext.id,
      providerId: params.providerId,
      recordIds: params.recordIds,
      expiryDays: params.expiryDays,
    });

    return {
      shareId,
      providerId: params.providerId,
      recordIds: params.recordIds,
      status: 'active',
      sharedAt: Date.now(),
      expiresAt: Date.now() + (params.expiryDays || 7) * 86400000,
      canRevoke: true,
    };
  }

  private async _symptomInfo(params: any): Promise<any> {
    const symptoms = params.symptoms || [];

    return {
      symptoms,
      disclaimer: 'This is informational only and not a medical diagnosis. Please consult a healthcare professional.',
      generalAdvice: [
        'Rest and stay hydrated',
        'Monitor your symptoms',
        'Seek medical attention if symptoms worsen',
      ],
      whenToSeekCare: [
        'Difficulty breathing',
        'Chest pain',
        'Severe or worsening symptoms',
        'Symptoms lasting more than 3 days',
      ],
      relatedProviders: [
        { specialty: 'General Practitioner', urgency: 'within 24 hours' },
      ],
    };
  }
}