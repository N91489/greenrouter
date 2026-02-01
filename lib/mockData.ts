// lib/mockData.ts
import { Facility, Connection } from './types';

export const facilities: Facility[] = [
  // Wellheads
  {
    id: 'wh-1',
    name: 'Wellhead Alpha',
    type: 'wellhead',
    co2Factor: 2.5,
    energyConsumption: 0.5,
    capacity: 10000,
    position: { x: 100, y: 300 },
    equipment: {
      manufacturer: 'Cameron',
      yearInstalled: 2020,
    },
  },
  {
    id: 'wh-2',
    name: 'Wellhead Beta',
    type: 'wellhead',
    co2Factor: 2.8,
    energyConsumption: 0.6,
    capacity: 8000,
    position: { x: 100, y: 400 },
  },

  // Separators
  {
    id: 'sep-1',
    name: 'Moisture Separator MS-01',
    type: 'separator',
    co2Factor: 7.2,
    energyConsumption: 2.1,
    capacity: 15000,
    position: { x: 300, y: 250 },
    equipment: {
      manufacturer: 'Schlumberger',
      model: 'TS-3000',
      yearInstalled: 2018,
    },
  },
  {
    id: 'sep-2',
    name: 'Moisture Separator MS-02',
    type: 'separator',
    co2Factor: 8.5,
    energyConsumption: 2.3,
    capacity: 12000,
    position: { x: 300, y: 380 },
  },

  // GOSP Stations
  {
    id: 'gosp-1',
    name: 'GOSP Station 1',
    type: 'gosp',
    co2Factor: 18.5,
    energyConsumption: 4.2,
    capacity: 20000,
    position: { x: 500, y: 220 },
  },
  {
    id: 'gosp-2',
    name: 'GOSP Station 2',
    type: 'gosp',
    co2Factor: 22.3,
    energyConsumption: 5.1,
    capacity: 25000,
    position: { x: 500, y: 380 },
  },

  // Distillator
  {
    id: 'dist-1',
    name: 'Fractional Distillator FD-01',
    type: 'distillator',
    co2Factor: 15.8,
    energyConsumption: 6.5,
    capacity: 18000,
    position: { x: 700, y: 300 },
  },

  // Pumping Station
  {
    id: 'pump-1',
    name: 'Pumping Station PS-01',
    type: 'pump',
    co2Factor: 5.2,
    energyConsumption: 1.8,
    capacity: 30000,
    position: { x: 900, y: 300 },
  },

  // Export Terminal
  {
    id: 'exp-1',
    name: 'Export Terminal',
    type: 'export',
    co2Factor: 3.5,
    energyConsumption: 1.2,
    capacity: 50000,
    position: { x: 1100, y: 300 },
  },
];

export const connections: Connection[] = [
  // Wellheads to Separators
  { id: 'c1', from: 'wh-1', to: 'sep-1', distance: 5.2, pipelineCO2: 0.3 },
  { id: 'c2', from: 'wh-1', to: 'sep-2', distance: 6.8, pipelineCO2: 0.3 },
  { id: 'c3', from: 'wh-2', to: 'sep-2', distance: 4.5, pipelineCO2: 0.3 },
  
  // Separators to GOSP
  { id: 'c4', from: 'sep-1', to: 'gosp-1', distance: 8.5, pipelineCO2: 0.3 },
  { id: 'c5', from: 'sep-1', to: 'gosp-2', distance: 12.3, pipelineCO2: 0.3 },
  { id: 'c6', from: 'sep-2', to: 'gosp-2', distance: 7.2, pipelineCO2: 0.3 },
  { id: 'c7', from: 'sep-2', to: 'gosp-1', distance: 11.5, pipelineCO2: 0.3 },
  
  // GOSP to Distillator
  { id: 'c8', from: 'gosp-1', to: 'dist-1', distance: 10.5, pipelineCO2: 0.3 },
  { id: 'c9', from: 'gosp-2', to: 'dist-1', distance: 9.8, pipelineCO2: 0.3 },
  
  // Distillator to Pump
  { id: 'c10', from: 'dist-1', to: 'pump-1', distance: 15.2, pipelineCO2: 0.3 },
  
  // Pump to Export
  { id: 'c11', from: 'pump-1', to: 'exp-1', distance: 20.5, pipelineCO2: 0.3 },
];

export const metadata = {
  source: "EPA GHG Reporting + Industry Averages",
  lastUpdated: "2024-11-15",
  region: "North American Operations",
  confidence: "High (±10%)",
  throughput: 5000, // barrels per day
};