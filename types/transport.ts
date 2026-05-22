export interface InspectionRecord {
  id: string;
  vehicleId: string;
  inspectorId: string;
  inspectionDate: string;
  type: string;
  status: string;
  findings?: string;
  nextDueDate?: string;
  createdAt?: string;
}

export interface Vehicle {
  id: string;
  plateNumber: string;
  type: string;
  model: string;
  year: number;
  status: string;
  ownerId?: string;
  capacity?: number;
  inspections?: InspectionRecord[];
}

export interface TransportState {
  inspections: InspectionRecord[];
  vehicles: Vehicle[];
  loading: boolean;
  error: string | null;
}
