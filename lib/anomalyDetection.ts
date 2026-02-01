// lib/anomalyDetection.ts
import { Facility, PerformanceMetrics, Anomaly, MaintenanceAlert } from './types';

export class AnomalyDetector {
  private historicalData: Map<string, PerformanceMetrics[]>;
  private baselineMetrics: Map<string, PerformanceMetrics>;

  constructor() {
    this.historicalData = new Map();
    this.baselineMetrics = new Map();
  }

  setBaseline(facilityId: string, metrics: PerformanceMetrics) {
    this.baselineMetrics.set(facilityId, metrics);
  }

  getBaseline(facilityId: string): PerformanceMetrics | undefined {
    return this.baselineMetrics.get(facilityId);
  }

  addDataPoint(metrics: PerformanceMetrics) {
    if (!this.historicalData.has(metrics.facilityId)) {
      this.historicalData.set(metrics.facilityId, []);
    }
    this.historicalData.get(metrics.facilityId)!.push(metrics);

    // Keep only last 100 data points
    const history = this.historicalData.get(metrics.facilityId)!;
    if (history.length > 100) {
      history.shift();
    }
  }

  detectAnomalies(currentMetrics: PerformanceMetrics, facility: Facility): Anomaly[] {
    const anomalies: Anomaly[] = [];
    const baseline = this.baselineMetrics.get(currentMetrics.facilityId);

    if (!baseline) return anomalies;

    // 1. CO2 Spike Detection
    const co2Deviation = this.calculateDeviation(currentMetrics.co2Emissions, baseline.co2Emissions);
    if (Math.abs(co2Deviation) > 15) {
      anomalies.push({
        id: `anom-${Date.now()}-co2-${currentMetrics.facilityId}`,
        timestamp: currentMetrics.timestamp,
        facilityId: currentMetrics.facilityId,
        facilityName: facility.name,
        type: 'co2_spike',
        severity: Math.abs(co2Deviation) > 30 ? 'critical' : Math.abs(co2Deviation) > 20 ? 'high' : 'medium',
        description: `CO2 emissions ${co2Deviation > 0 ? 'increased' : 'decreased'} by ${Math.abs(co2Deviation).toFixed(1)}%`,
        currentValue: currentMetrics.co2Emissions,
        expectedValue: baseline.co2Emissions,
        deviation: co2Deviation,
      });
    }

    // 2. Efficiency Drop Detection
    const efficiencyDrop = this.calculateDeviation(currentMetrics.efficiency, baseline.efficiency);
    if (efficiencyDrop < -10) {
      anomalies.push({
        id: `anom-${Date.now()}-eff-${currentMetrics.facilityId}`,
        timestamp: currentMetrics.timestamp,
        facilityId: currentMetrics.facilityId,
        facilityName: facility.name,
        type: 'efficiency_drop',
        severity: efficiencyDrop < -20 ? 'high' : 'medium',
        description: `Processing efficiency dropped by ${Math.abs(efficiencyDrop).toFixed(1)}%`,
        currentValue: currentMetrics.efficiency,
        expectedValue: baseline.efficiency,
        deviation: efficiencyDrop,
      });
    }

    // 3. Energy Surge Detection
    const energyDeviation = this.calculateDeviation(currentMetrics.energyConsumption, baseline.energyConsumption);
    if (energyDeviation > 12) {
      anomalies.push({
        id: `anom-${Date.now()}-energy-${currentMetrics.facilityId}`,
        timestamp: currentMetrics.timestamp,
        facilityId: currentMetrics.facilityId,
        facilityName: facility.name,
        type: 'energy_surge',
        severity: energyDeviation > 25 ? 'high' : 'medium',
        description: `Energy consumption increased by ${energyDeviation.toFixed(1)}%`,
        currentValue: currentMetrics.energyConsumption,
        expectedValue: baseline.energyConsumption,
        deviation: energyDeviation,
      });
    }

    // 4. Vibration Alert
    if (currentMetrics.vibration > 7.5) {
      anomalies.push({
        id: `anom-${Date.now()}-vib-${currentMetrics.facilityId}`,
        timestamp: currentMetrics.timestamp,
        facilityId: currentMetrics.facilityId,
        facilityName: facility.name,
        type: 'vibration_alert',
        severity: currentMetrics.vibration > 15 ? 'critical' : currentMetrics.vibration > 10 ? 'high' : 'medium',
        description: `Abnormal vibration detected: ${currentMetrics.vibration.toFixed(2)} mm/s`,
        currentValue: currentMetrics.vibration,
        expectedValue: 4.5,
        deviation: ((currentMetrics.vibration - 4.5) / 4.5) * 100,
      });
    }

    // 5. Pressure Anomaly
    const pressureDeviation = this.calculateDeviation(currentMetrics.pressure, baseline.pressure);
    if (Math.abs(pressureDeviation) > 10) {
      anomalies.push({
        id: `anom-${Date.now()}-press-${currentMetrics.facilityId}`,
        timestamp: currentMetrics.timestamp,
        facilityId: currentMetrics.facilityId,
        facilityName: facility.name,
        type: 'pressure_anomaly',
        severity: Math.abs(pressureDeviation) > 20 ? 'high' : 'medium',
        description: `Pressure ${pressureDeviation > 0 ? 'increase' : 'decrease'} of ${Math.abs(pressureDeviation).toFixed(1)}%`,
        currentValue: currentMetrics.pressure,
        expectedValue: baseline.pressure,
        deviation: pressureDeviation,
      });
    }

    return anomalies;
  }

  predictMaintenance(facility: Facility, metrics: PerformanceMetrics): MaintenanceAlert | null {
    const history = this.historicalData.get(facility.id) || [];
    
    if (history.length < 10) return null;

    const equipmentAge = this.calculateEquipmentAge(facility);
    const healthScore = this.calculateHealthScore(metrics, history);
    const failureProbability = this.weibullFailureProbability(equipmentAge);

    if (failureProbability > 0.3 || healthScore < 0.6) {
      const daysUntilFailure = this.estimateDaysUntilFailure(failureProbability, healthScore);
      
      let priority: MaintenanceAlert['priority'];
      if (daysUntilFailure < 7) priority = 'emergency';
      else if (daysUntilFailure < 30) priority = 'urgent';
      else if (daysUntilFailure < 90) priority = 'scheduled';
      else priority = 'routine';

      return {
        id: `maint-${Date.now()}-${facility.id}`,
        facilityId: facility.id,
        facilityName: facility.name,
        equipmentType: facility.type,
        priority,
        predictedFailureDate: new Date(Date.now() + daysUntilFailure * 24 * 60 * 60 * 1000),
        daysUntilFailure,
        confidence: this.calculateConfidence(history.length, healthScore),
        estimatedDowntime: this.estimateDowntime(facility.type),
        estimatedCost: this.estimateCost(facility.type, priority),
        recommendedAction: this.getMaintenanceAction(facility.type, priority),
        impactOnRoutes: ['Route 1', 'Route 2'],
      };
    }

    return null;
  }

  private calculateDeviation(current: number, baseline: number): number {
    if (baseline === 0) return 0;
    return ((current - baseline) / baseline) * 100;
  }

  private calculateEquipmentAge(facility: Facility): number {
    const installYear = facility.equipment?.yearInstalled || 2015;
    return new Date().getFullYear() - installYear;
  }

  private calculateHealthScore(current: PerformanceMetrics, history: PerformanceMetrics[]): number {
    const efficiencyScore = current.efficiency;
    const vibrationScore = Math.max(0, 1 - (current.vibration / 20));
    const temperatureScore = Math.max(0, 1 - (Math.abs(current.temperature - 75) / 50));

    return (efficiencyScore * 0.5) + (vibrationScore * 0.3) + (temperatureScore * 0.2);
  }

  private weibullFailureProbability(age: number): number {
    const lambda = 15;
    const beta = 2.5;
    return 1 - Math.exp(-Math.pow(age / lambda, beta));
  }

  private estimateDaysUntilFailure(probability: number, healthScore: number): number {
    const baseDays = 365;
    const adjustedDays = baseDays * (1 - probability) * healthScore;
    return Math.max(1, Math.round(adjustedDays));
  }

  private calculateConfidence(dataPoints: number, healthScore: number): number {
    const dataConfidence = Math.min(dataPoints / 100, 1);
    return (dataConfidence * 0.6 + healthScore * 0.4);
  }

  private estimateDowntime(facilityType: string): number {
    const downtimeMap: Record<string, number> = {
      wellhead: 8, 
      separator: 16, 
      gosp: 24,
      distillator: 48, 
      pump: 12, 
      export: 4,
    };
    return downtimeMap[facilityType] || 12;
  }

  private estimateCost(facilityType: string, priority: string): number {
    const baseCosts: Record<string, number> = {
      wellhead: 15000, 
      separator: 45000, 
      gosp: 120000,
      distillator: 95000, 
      pump: 35000, 
      export: 25000,
    };
    const priorityMultipliers = { 
      routine: 1.0, 
      scheduled: 1.2, 
      urgent: 1.8, 
      emergency: 2.5 
    };
    const baseCost = baseCosts[facilityType] || 50000;
    const multiplier = priorityMultipliers[priority as keyof typeof priorityMultipliers] || 1.0;
    return baseCost * multiplier;
  }

  private getMaintenanceAction(facilityType: string, priority: string): string {
    const actions: Record<string, Record<string, string>> = {
      gosp: {
        routine: 'Scheduled inspection and filter replacement',
        scheduled: 'Compressor overhaul and seal replacement',
        urgent: 'Emergency shutdown for critical component repair',
        emergency: 'Immediate equipment replacement required',
      },
      distillator: {
        routine: 'Column cleaning and tray inspection',
        scheduled: 'Reboiler tube bundle replacement',
        urgent: 'Emergency leak repair and pressure testing',
        emergency: 'Critical safety system failure - immediate shutdown',
      },
      pump: {
        routine: 'Bearing lubrication and alignment check',
        scheduled: 'Impeller replacement and motor service',
        urgent: 'Seal failure repair',
        emergency: 'Catastrophic pump failure - immediate replacement',
      },
    };
    return actions[facilityType]?.[priority] || 'Comprehensive equipment inspection';
  }
}

// ============= UTILITY FUNCTIONS (EXPORTS) =============

export function generateSimulatedMetrics(
  facility: Facility, 
  baseline: PerformanceMetrics
): PerformanceMetrics {
  const noise = (Math.random() - 0.5) * 0.15; // ±7.5% noise

  return {
    timestamp: new Date(),
    facilityId: facility.id,
    co2Emissions: baseline.co2Emissions * (1 + noise),
    energyConsumption: baseline.energyConsumption * (1 + noise * 0.8),
    throughput: baseline.throughput * (1 + noise * 0.5),
    temperature: baseline.temperature + (Math.random() - 0.5) * 10,
    pressure: baseline.pressure * (1 + noise * 0.6),
    vibration: baseline.vibration + (Math.random() - 0.5) * 2,
    efficiency: Math.max(0.7, Math.min(1.0, baseline.efficiency * (1 + noise * 0.3))),
  };
}

export function injectAnomaly(
  metrics: PerformanceMetrics, 
  anomalyType: Anomaly['type']
): PerformanceMetrics {
  const injected = { ...metrics };

  switch (anomalyType) {
    case 'co2_spike':
      injected.co2Emissions *= 1.35; // 35% increase
      break;
    case 'efficiency_drop':
      injected.efficiency *= 0.75; // 25% drop
      break;
    case 'energy_surge':
      injected.energyConsumption *= 1.28; // 28% increase
      break;
    case 'vibration_alert':
      injected.vibration = 12.5; // Critical vibration
      break;
    case 'pressure_anomaly':
      injected.pressure *= 0.8; // 20% drop
      break;
    case 'equipment_degradation':
      injected.efficiency *= 0.85;
      injected.vibration *= 1.3;
      break;
  }

  return injected;
}