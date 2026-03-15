
export interface QualityStandard {
  id: string;
  name: string;
  description: string;
  criteria: {
    id: string;
    label: string;
    passed: boolean;
  }[];
  lastAuditDate: number;
  status: 'certified' | 'pending' | 'failed';
}

export interface GrantApplication {
  id: string;
  objectId: string;
  type: 'renovation' | 'equipment' | 'training';
  amount: number;
  status: 'draft' | 'submitted' | 'approved' | 'paid' | 'rejected';
  submissionDate: number;
  description: string;
}

export interface FleetVehicle {
  id: string;
  vin: string;
  model: string;
  licensePlate: string;
  status: 'available' | 'rented' | 'maintenance';
  dailyRent: number;
  lastServiceDate: number;
  insuranceExpiry: number;
  assignedDriverId?: string;
}

export interface TrafficSource {
  id: string;
  name: 'Yandex' | 'Ozon' | 'Avito' | 'Direct';
  commissionRate: number;
  totalBookings: number;
  totalRevenue: number;
}

export interface InspectorReport {
  id: string;
  objectId: string;
  inspectorId: string;
  timestamp: number;
  status: 'legal' | 'shadow' | 'warning';
  notes: string;
  photos: string[];
}

export interface Impression {
  id: string;
  placeId: string;
  placeName: string;
  category: string; // e.g., 'cycling', 'museum', 'restaurant', 'scooter'
  rating: number;
  comment: string;
  photos: string[];
  video?: string;
  timestamp: number;
  yandexSynced?: boolean;
}

export interface QuestCategory {
  id: string;
  name: string;
  icon: string;
  count: number;
  total: number;
  discovered: boolean;
}

export interface VisitedPlace {
  id: string;
  name: string;
  lat: number;
  lng: number;
  category: string;
  visitDate: number;
}
