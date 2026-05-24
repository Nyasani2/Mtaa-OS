/**
 * TransportAgent
 * Handles MTaxi, MTruck, and delivery bookings
 * Integrates with transport service for real-time availability and tracking
 */

import { BaseAgent } from './base-agent';
import { AgentRequest, AgentResponse } from '../shared/types';
import { ASISEventBus } from '../core/event-bus';
import { ASISSecurityLayer } from '../security/security-layer';
import { TransportAction, BookingIntent } from './types';

export class TransportAgent extends BaseAgent {
  readonly name = 'transport_agent';
  readonly version = '1.0.0';
  readonly capabilities = [
    'book_taxi',
    'book_truck',
    'track_ride',
    'cancel_ride',
    'rate_driver',
    'estimate_fare',
    'find_nearby_drivers',
    'schedule_ride',
  ];

  constructor(eventBus: ASISEventBus, security: ASISSecurityLayer) {
    super(eventBus, security);
  }

  protected _registerTools(): void {
    this._tools.set('book_ride', {
      name: 'book_ride',
      description: 'Book a taxi or truck ride',
      parameters: [
        { name: 'vehicleType', type: 'string', description: 'taxi, truck, or delivery', required: true },
        { name: 'pickup', type: 'object', description: 'Pickup location', required: true },
        { name: 'destination', type: 'object', description: 'Destination', required: true },
        { name: 'scheduledTime', type: 'number', description: 'Scheduled pickup time', required: false },
      ],
      returns: { type: 'object', description: 'Booking confirmation' },
      requiresAuth: true,
      riskLevel: 'medium',
    });

    this._tools.set('track_ride', {
      name: 'track_ride',
      description: 'Track current ride',
      parameters: [
        { name: 'rideId', type: 'string', description: 'Ride ID', required: true },
      ],
      returns: { type: 'object', description: 'Ride status and location' },
      requiresAuth: true,
      riskLevel: 'low',
    });

    this._tools.set('cancel_ride', {
      name: 'cancel_ride',
      description: 'Cancel a booked ride',
      parameters: [
        { name: 'rideId', type: 'string', description: 'Ride ID', required: true },
        { name: 'reason', type: 'string', description: 'Cancellation reason', required: false },
      ],
      returns: { type: 'object', description: 'Cancellation result' },
      requiresAuth: true,
      riskLevel: 'low',
    });

    this._tools.set('estimate_fare', {
      name: 'estimate_fare',
      description: 'Get fare estimate',
      parameters: [
        { name: 'pickup', type: 'object', description: 'Pickup location', required: true },
        { name: 'destination', type: 'object', description: 'Destination', required: true },
        { name: 'vehicleType', type: 'string', description: 'Vehicle type', required: false, default: 'taxi' },
      ],
      returns: { type: 'object', description: 'Fare estimate' },
      requiresAuth: false,
      riskLevel: 'low',
    });
  }

  canHandle(intent: string, entities: string[]): boolean {
    return intent === 'transport' || 
           entities.some((e) => ['taxi', 'truck', 'ride', 'delivery', 'driver', 'fare'].includes(e));
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
      const action = this._parseTransportAction(input);
      let response: AgentResponse;

      switch (action.type) {
        case 'book_taxi':
          response = await this._handleBookTaxi(action.params, context);
          break;
        case 'book_truck':
          response = await this._handleBookTruck(action.params, context);
          break;
        case 'track_ride':
          response = await this._handleTrackRide(action.params, context);
          break;
        case 'cancel_ride':
          response = await this._handleCancelRide(action.params, context);
          break;
        case 'estimate_fare':
          response = await this._handleEstimateFare(action.params, context);
          break;
        default:
          response = this._createTransportMenu();
      }

      this._updateMetrics(Date.now() - startTime);
      this._state.status = 'idle';
      return response;
    } catch (error) {
      this._state.status = 'error';
      return this._createErrorResponse(
        error instanceof Error ? error.message : 'Transport operation failed'
      );
    }
  }

  private _parseTransportAction(input: string): TransportAction {
    const lower = input.toLowerCase();

    if (/book.*taxi|taxi.*to|ride.*to|get.*ride/.test(lower)) {
      return { type: 'book_taxi', params: this._extractLocations(input) };
    }
    if (/book.*truck|truck.*delivery|deliver.*to|move.*to/.test(lower)) {
      return { type: 'book_truck', params: this._extractLocations(input) };
    }
    if (/track|where.*driver|where.*ride|status/.test(lower)) {
      return { type: 'track_ride', params: {} };
    }
    if (/cancel|stop.*ride|abort/.test(lower)) {
      return { type: 'cancel_ride', params: {} };
    }
    if (/how much|cost|price|fare|estimate/.test(lower)) {
      return { type: 'estimate_fare', params: this._extractLocations(input) };
    }

    return { type: 'book_taxi', params: {} };
  }

  private _extractLocations(input: string): any {
    // Simple location extraction — would use NLP in production
    const toMatch = input.match(/to\s+(.+?)(?:\s|$)/i);
    const fromMatch = input.match(/from\s+(.+?)(?:\s+to|\s|$)/i);

    return {
      pickup: fromMatch ? fromMatch[1].trim() : undefined,
      destination: toMatch ? toMatch[1].trim() : undefined,
    };
  }

  private async _handleBookTaxi(params: any, context: any): Promise<AgentResponse> {
    if (!params.destination) {
      return this._createActionResponse(
        'Where would you like to go?',
        [
          { label: 'Enter destination', type: 'open', payload: { action: 'enter_destination' } },
          { label: 'Choose on map', type: 'open', payload: { action: 'open_map' } },
        ],
        { type: 'taxi_destination_prompt' }
      );
    }

    // Simulated booking flow
    return this._createConfirmationResponse(
      `**Confirm Taxi Booking**\n\n` +
      `To: ${params.destination}\n` +
      `From: ${params.pickup || 'Current location'}\n` +
      `Estimated fare: KSh 350 - 450\n` +
      `ETA: 3 minutes\n\n` +
      `Confirm to book?`,
      {
        type: 'book_taxi',
        params,
      },
      { type: 'taxi_confirmation' }
    );
  }

  private async _handleBookTruck(params: any, context: any): Promise<AgentResponse> {
    return this._createActionResponse(
      'MTruck Delivery Booking\n\nWhat are you moving?',
      [
        { label: '📦 Small package', type: 'button', payload: { cargoType: 'small' } },
        { label: '📺 Electronics', type: 'button', payload: { cargoType: 'electronics' } },
        { label: '🪑 Furniture', type: 'button', payload: { cargoType: 'furniture' } },
        { label: '🏗️ Construction', type: 'button', payload: { cargoType: 'construction' } },
        { label: '🌾 Agriculture', type: 'button', payload: { cargoType: 'agriculture' } },
      ],
      { type: 'truck_cargo_prompt' }
    );
  }

  private async _handleTrackRide(params: any, context: any): Promise<AgentResponse> {
    // Simulated tracking
    return this._createTextResponse(
      `**Your Ride Status**\n\n` +
      `Driver: James K. (4.8⭐)\n` +
      `Vehicle: KCY 123A (White Toyota)\n` +
      `Status: **Arriving in 2 min**\n` +
      `Location: 0.3 km away\n\n` +
      `📍 [View on map]`,
      { type: 'ride_tracking', rideId: 'ride_123' }
    );
  }

  private async _handleCancelRide(params: any, context: any): Promise<AgentResponse> {
    return this._createConfirmationResponse(
      'Cancel your current ride?\n\nA cancellation fee of KSh 50 may apply.',
      { type: 'cancel_ride', params },
      { type: 'cancel_confirmation' }
    );
  }

  private async _handleEstimateFare(params: any, context: any): Promise<AgentResponse> {
    if (!params.destination) {
      return this._createTextResponse(
        'Tell me where you are going and I will estimate the fare.\n\nExample: "How much to Westlands?"',
        { type: 'fare_prompt' }
      );
    }

    return this._createTextResponse(
      `**Fare Estimate**\n\n` +
      `To: ${params.destination}\n` +
      `From: ${params.pickup || 'Current location'}\n\n` +
      `🚕 **Taxi**: KSh 350 - 450\n` +
      `🛵 **Boda**: KSh 150 - 200\n` +
      `🚐 **Premium**: KSh 500 - 650\n\n` +
      `Prices may vary based on traffic and demand.`,
      { type: 'fare_estimate' }
    );
  }

  private _createTransportMenu(): AgentResponse {
    return this._createActionResponse(
      'What do you need?',
      [
        { label: '🚕 Book Taxi', type: 'navigate', payload: { action: 'book_taxi' } },
        { label: '🚛 Book Truck', type: 'navigate', payload: { action: 'book_truck' } },
        { label: '📍 Track Ride', type: 'navigate', payload: { action: 'track_ride' } },
        { label: '💰 Fare Estimate', type: 'navigate', payload: { action: 'estimate_fare' } },
        { label: '📋 Ride History', type: 'navigate', payload: { action: 'ride_history' } },
      ],
      { type: 'transport_menu' }
    );
  }
}
