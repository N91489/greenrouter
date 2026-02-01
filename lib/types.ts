// lib/types.ts
export interface Facility {
  id: string;
  name: string;
  type: 'wellhead' | 'separator' | 'gosp' | 'distillator' | 'pump' | 'export';
  co2Factor: number; // kg CO2 per barrel
  energyConsumption: number; // kWh per barrel
  capacity: number; // barrels per day
  position: { x: number; y: number };
  equipment?: {
    manufacturer?: string;
    model?: string;
    yearInstalled?: number;
  };
}

export interface Connection {
  id: string;
  from: string;
  to: string;
  distance: number; // km
  pipelineCO2: number; // kg CO2 per barrel per km
  pipelineSize?: number; // inches
}

export interface Route {
  id: string;
  name: string;
  path: string[]; // facility IDs
  totalCO2: number; // kg per day
  totalEnergy: number; // kWh per day
  totalDistance: number; // km
  throughput: number; // barrels per day
  operatingCost: number; // USD per day
}

export interface PerformanceMetrics {
  timestamp: Date;
  facilityId: string;
  co2Emissions: number;      // kg/bbl
  energyConsumption: number;  // kWh/bbl
  throughput: number;         // bbl/day
  temperature: number;        // °C
  pressure: number;           // bar
  vibration: number;          // mm/s
  efficiency: number;         // 0-1
}

export interface Anomaly {
  id: string;
  timestamp: Date;
  facilityId: string;
  facilityName: string;
  type: 'co2_spike' | 'efficiency_drop' | 'equipment_degradation' | 'energy_surge' | 'pressure_anomaly' | 'vibration_alert';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  currentValue: number;
  expectedValue: number;
  deviation: number; // percentage
  aiAnalysis?: string; // Sphinx AI root cause analysis
}

export interface MaintenanceAlert {
  id: string;
  facilityId: string;
  facilityName: string;
  equipmentType: string;
  priority: 'routine' | 'scheduled' | 'urgent' | 'emergency';
  predictedFailureDate: Date;
  daysUntilFailure: number;
  confidence: number; // 0-1
  estimatedDowntime: number; // hours
  estimatedCost: number; // USD
  recommendedAction: string;
  impactOnRoutes: string[];
  aiRecommendation?: string; // Sphinx AI maintenance recommendation
}

export interface SphinxMessage {
  role: 'user' | 'assistant';
  content: string;
}
