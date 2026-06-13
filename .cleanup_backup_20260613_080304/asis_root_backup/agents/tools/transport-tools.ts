/**
 * TransportTools
 * Tool definitions for MTaxi, MTruck, and delivery operations
 */

import { ToolDefinition, ToolResult } from '../types';
import { ASISEventBus } from '../../core/event-bus';

export class TransportTools {
  private _eventBus: ASISEventBus;

  constructor(eventBus: ASISEventBus) {
    this._eventBus = eventBus;
  }

  getDefinitions(): ToolDefinition[] {
    return [
      {
        name: 'transport_book_ride',
        description: 'Book a taxi or truck ride',
        parameters: [
          { name: 'vehicleType', type: 'string', required: true, description: 'taxi, truck, or delivery' },
          { name: 'pickupLat', type: 'number', required: true, description: 'Pickup latitude' },
          { name: 'pickupLng', type: 'number', required: true, description: 'Pickup longitude' },
          { name: 'destLat', type: 'number', required: true, description: 'Destination latitude' },
          { name: 'destLng', type: 'number', required: true, description: 'Destination longitude' },
          { name: 'scheduledTime', type: 'number', required: false, description: 'Scheduled pickup timestamp' },
        ],
        returns: { type: 'object', description: 'Booking confirmation with driver info' },
        requiresAuth: true,
        riskLevel: 'medium',
      },
      {
        name: 'transport_track_ride',
        description: 'Get current ride status and location',
        parameters: [
          { name: 'rideId', type: 'string', required: true, description: 'Ride ID' },
        ],
        returns: { type: 'object', description: 'Ride status, driver location, ETA' },
        requiresAuth: true,
        riskLevel: 'low',
      },
      {
        name: 'transport_cancel_ride',
        description: 'Cancel an active or pending ride',
        parameters: [
          { name: 'rideId', type: 'string', required: true, description: 'Ride ID' },
          { name: 'reason', type: 'string', required: false, description: 'Cancellation reason' },
        ],
        returns: { type: 'object', description: 'Cancellation result' },
        requiresAuth: true,
        riskLevel: 'low',
      },
      {
        name: 'transport_estimate_fare',
        description: 'Get fare estimate before booking',
        parameters: [
          { name: 'pickupLat', type: 'number', required: true, description: 'Pickup latitude' },
          { name: 'pickupLng', type: 'number', required: true, description: 'Pickup longitude' },
          { name: 'destLat', type: 'number', required: true, description: 'Destination latitude' },
          { name: 'destLng', type: 'number', required: true, description: 'Destination longitude' },
          { name: 'vehicleType', type: 'string', required: false, default: 'taxi', description: 'Vehicle type' },
        ],
        returns: { type: 'object', description: 'Fare range and ETA' },
        requiresAuth: false,
        riskLevel: 'low',
      },
      {
        name: 'transport_rate_driver',
        description: 'Rate a completed ride',
        parameters: [
          { name: 'rideId', type: 'string', required: true, description: 'Ride ID' },
          { name: 'rating', type: 'number', required: true, description: 'Rating 1-5' },
          { name: 'feedback', type: 'string', required: false, description: 'Optional feedback' },
        ],
        returns: { type: 'object', description: 'Rating confirmation' },
        requiresAuth: true,
        riskLevel: 'low',
      },
    ];
  }

  async execute(toolName: string, params: Record<string, any>, userContext: any): Promise<ToolResult> {
    const startTime = Date.now();

    try {
      let result: any;

      switch (toolName) {
        case 'transport_book_ride':
          result = await this._bookRide(params, userContext);
          break;
        case 'transport_track_ride':
          result = await this._trackRide(params, userContext);
          break;
        case 'transport_cancel_ride':
          result = await this._cancelRide(params, userContext);
          break;
        case 'transport_estimate_fare':
          result = await this._estimateFare(params);
          break;
        case 'transport_rate_driver':
          result = await this._rateDriver(params, userContext);
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

  private async _bookRide(params: any, userContext: any): Promise<any> {
    const rideId = `ride_${Date.now()}`;

    this._eventBus.emit('transport:ride:booked', {
      rideId,
      userId: userContext.id,
      vehicleType: params.vehicleType,
      pickup: { lat: params.pickupLat, lng: params.pickupLng },
      destination: { lat: params.destLat, lng: params.destLng },
    });

    return {
      rideId,
      status: 'searching_driver',
      estimatedFare: { min: 350, max: 450, currency: 'KES' },
      estimatedArrival: '3 min',
      driver: null,
    };
  }

  private async _trackRide(params: any, userContext: any): Promise<any> {
    return {
      rideId: params.rideId,
      status: 'driver_arriving',
      driver: {
        name: 'James K.',
        rating: 4.8,
        vehicle: 'White Toyota Corolla',
        plate: 'KCY 123A',
        phone: '+254712345678',
      },
      location: { lat: -1.2921, lng: 36.8219 },
      eta: '2 min',
      destination: { lat: -1.2865, lng: 36.8172 },
    };
  }

  private async _cancelRide(params: any, userContext: any): Promise<any> {
    this._eventBus.emit('transport:ride:cancelled', {
      rideId: params.rideId,
      userId: userContext.id,
      reason: params.reason,
    });

    return {
      rideId: params.rideId,
      status: 'cancelled',
      cancellationFee: 0,
      refundAmount: 0,
    };
  }

  private async _estimateFare(params: any): Promise<any> {
    const distance = this._calculateDistance(
      params.pickupLat, params.pickupLng,
      params.destLat, params.destLng
    );

    const baseFare = params.vehicleType === 'truck' ? 500 : 100;
    const perKm = params.vehicleType === 'truck' ? 80 : 35;
    const estimated = baseFare + (distance * perKm);

    return {
      distance: Math.round(distance * 10) / 10,
      duration: Math.round(distance * 3), // ~3 min per km
      fare: {
        min: Math.round(estimated * 0.9),
        max: Math.round(estimated * 1.2),
        currency: 'KES',
      },
      vehicleType: params.vehicleType,
    };
  }

  private async _rateDriver(params: any, userContext: any): Promise<any> {
    return {
      rideId: params.rideId,
      rating: params.rating,
      feedback: params.feedback,
      status: 'rated',
      driverAverage: 4.8,
    };
  }

  private _calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }
}