export interface Shipment {
  id: string;
  origin: string;
  destination: string;
  status: 'pending' | 'in_transit' | 'delivered';
  cargoType: string;
  weight: number;
}

export interface HaulRequest {
  id: string;
  shipperId: string;
  driverId?: string;
  shipment: Shipment;
  fare: number;
}

export type TruckType = 'pickup' | 'lorry' | 'trailer' | 'tanker';
