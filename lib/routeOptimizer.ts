// lib/routeOptimizer.ts
import { Facility, Connection, Route } from './types';

export interface OptimizationWeights {
  co2: number;
  cost: number;
  energy: number;
}

export interface RouteScore {
  route: Route;
  co2Score: number;
  costScore: number;
  energyScore: number;
  totalScore: number;
  isParetoOptimal: boolean;
}

export class RouteOptimizer {
  private facilities: Map<string, Facility>;
  private connections: Map<string, Connection[]>;
  private allConnections: Connection[];

  constructor(facilities: Facility[], connections: Connection[]) {
    this.facilities = new Map(facilities.map(f => [f.id, f]));
    this.connections = new Map();
    this.allConnections = connections;
    
    connections.forEach(conn => {
      if (!this.connections.has(conn.from)) {
        this.connections.set(conn.from, []);
      }
      this.connections.get(conn.from)!.push(conn);
    });
  }

  findOptimalRoutes(
    startId: string,
    endId: string,
    weights: OptimizationWeights = { co2: 0.5, cost: 0.3, energy: 0.2 },
    throughput: number = 5000
  ): RouteScore[] {
    const totalWeight = weights.co2 + weights.cost + weights.energy;
    const normalizedWeights = {
      co2: weights.co2 / totalWeight,
      cost: weights.cost / totalWeight,
      energy: weights.energy / totalWeight,
    };

    const allRoutes = this.findAllRoutes(startId, endId, throughput);
    if (allRoutes.length === 0) return [];

    const co2Values = allRoutes.map(r => r.totalCO2);
    const costValues = allRoutes.map(r => r.operatingCost);
    const energyValues = allRoutes.map(r => r.totalEnergy);

    const minCO2 = Math.min(...co2Values);
    const maxCO2 = Math.max(...co2Values);
    const minCost = Math.min(...costValues);
    const maxCost = Math.max(...costValues);
    const minEnergy = Math.min(...energyValues);
    const maxEnergy = Math.max(...energyValues);

    const scoredRoutes: RouteScore[] = allRoutes.map(route => {
      // INVERTED: Lower actual values = Higher scores (1.0 = best, 0.0 = worst)
      const co2Score = 1 - this.normalize(route.totalCO2, minCO2, maxCO2);
      const costScore = 1 - this.normalize(route.operatingCost, minCost, maxCost);
      const energyScore = 1 - this.normalize(route.totalEnergy, minEnergy, maxEnergy);

      // Higher total score is now better
      const totalScore = 
        (co2Score * normalizedWeights.co2) +
        (costScore * normalizedWeights.cost) +
        (energyScore * normalizedWeights.energy);

      return {
        route,
        co2Score,
        costScore,
        energyScore,
        totalScore,
        isParetoOptimal: false,
      };
    });

    this.markParetoOptimal(scoredRoutes);

    // Sort DESCENDING - highest score first
    return scoredRoutes.sort((a, b) => b.totalScore - a.totalScore);
  }

  findOptimalRoutesAStar(
    startId: string,
    endId: string,
    weights: OptimizationWeights = { co2: 0.5, cost: 0.3, energy: 0.2 },
    throughput: number = 5000
  ): Route[] {
    interface Node {
      id: string;
      path: string[];
      gScore: number;
      hScore: number;
      fScore: number;
      totalCO2: number;
      totalEnergy: number;
      totalCost: number;
      totalDistance: number;
    }

    const openSet: Node[] = [];
    const closedSet = new Set<string>();
    const bestRoutes: Route[] = [];

    const totalWeight = weights.co2 + weights.cost + weights.energy;
    const w = {
      co2: weights.co2 / totalWeight,
      cost: weights.cost / totalWeight,
      energy: weights.energy / totalWeight,
    };

    openSet.push({
      id: startId,
      path: [],
      gScore: 0,
      hScore: this.calculateHeuristic(startId, endId, w),
      fScore: this.calculateHeuristic(startId, endId, w),
      totalCO2: 0,
      totalEnergy: 0,
      totalCost: 0,
      totalDistance: 0,
    });

    while (openSet.length > 0) {
      openSet.sort((a, b) => a.fScore - b.fScore);
      const current = openSet.shift()!;

      if (current.id === endId) {
        const operatingCost = this.calculateOperatingCost(
          current.totalCO2 / throughput,
          current.totalEnergy / throughput
        );

        bestRoutes.push({
          id: `route-${bestRoutes.length + 1}`,
          name: `Route ${bestRoutes.length + 1}`,
          path: [...current.path, current.id],
          totalCO2: current.totalCO2,
          totalEnergy: current.totalEnergy,
          totalDistance: current.totalDistance,
          throughput,
          operatingCost: current.totalCost,
        });

        if (bestRoutes.length >= 5) break;
        continue;
      }

      closedSet.add(current.id);

      const neighbors = this.connections.get(current.id) || [];
      
      for (const conn of neighbors) {
        if (closedSet.has(conn.to)) continue;

        const facility = this.facilities.get(conn.to)!;
        
        const edgeCO2 = (facility.co2Factor + conn.pipelineCO2 * conn.distance) * throughput;
        const edgeEnergy = facility.energyConsumption * throughput;
        const edgeCost = this.calculateOperatingCost(
          facility.co2Factor + conn.pipelineCO2 * conn.distance,
          facility.energyConsumption
        ) * throughput;

        const normalizedEdgeCO2 = edgeCO2 / (throughput * 100);
        const normalizedEdgeEnergy = edgeEnergy / (throughput * 20);
        const normalizedEdgeCost = edgeCost / (throughput * 5);

        const edgeScore = 
          (normalizedEdgeCO2 * w.co2) +
          (normalizedEdgeCost * w.cost) +
          (normalizedEdgeEnergy * w.energy);

        const newGScore = current.gScore + edgeScore;
        const newHScore = this.calculateHeuristic(conn.to, endId, w);
        const newFScore = newGScore + newHScore;

        const existingNode = openSet.find(n => n.id === conn.to);
        
        if (!existingNode || newGScore < existingNode.gScore) {
          const newNode: Node = {
            id: conn.to,
            path: [...current.path, current.id],
            gScore: newGScore,
            hScore: newHScore,
            fScore: newFScore,
            totalCO2: current.totalCO2 + edgeCO2,
            totalEnergy: current.totalEnergy + edgeEnergy,
            totalCost: current.totalCost + edgeCost,
            totalDistance: current.totalDistance + conn.distance,
          };

          if (existingNode) {
            Object.assign(existingNode, newNode);
          } else {
            openSet.push(newNode);
          }
        }
      }
    }

    return bestRoutes;
  }

  private calculateHeuristic(
    currentId: string,
    goalId: string,
    weights: OptimizationWeights
  ): number {
    const current = this.facilities.get(currentId);
    const goal = this.facilities.get(goalId);
    
    if (!current || !goal) return 0;

    const avgCO2 = 15;
    const avgEnergy = 4;
    const avgCost = 3;

    const facilitiesRemaining = Math.abs(goal.position.x - current.position.x) / 200;

    return (
      (avgCO2 * facilitiesRemaining * weights.co2) +
      (avgCost * facilitiesRemaining * weights.cost) +
      (avgEnergy * facilitiesRemaining * weights.energy)
    );
  }

  private findAllRoutes(startId: string, endId: string, throughput: number = 5000): Route[] {
    const routes: Route[] = [];
    const visited = new Set<string>();

    const dfs = (
      currentId: string,
      path: string[],
      totalCO2: number,
      totalEnergy: number,
      totalDistance: number
    ) => {
      if (currentId === endId) {
        const operatingCost = this.calculateOperatingCost(totalCO2, totalEnergy) * throughput;
        routes.push({
          id: `route-${routes.length + 1}`,
          name: `Route ${routes.length + 1}`,
          path: [...path, currentId],
          totalCO2: totalCO2 * throughput,
          totalEnergy: totalEnergy * throughput,
          totalDistance,
          throughput,
          operatingCost,
        });
        return;
      }

      visited.add(currentId);
      const nextConnections = this.connections.get(currentId) || [];

      for (const conn of nextConnections) {
        if (!visited.has(conn.to)) {
          const facility = this.facilities.get(conn.to)!;
          
          const facilityCO2 = facility.co2Factor;
          const pipelineCO2 = conn.pipelineCO2 * conn.distance;
          const energy = facility.energyConsumption;

          dfs(
            conn.to,
            [...path, currentId],
            totalCO2 + facilityCO2 + pipelineCO2,
            totalEnergy + energy,
            totalDistance + conn.distance
          );
        }
      }

      visited.delete(currentId);
    };

    dfs(startId, [], 0, 0, 0);
    return routes;
  }

  private normalize(value: number, min: number, max: number): number {
    if (max === min) return 0;
    return (value - min) / (max - min);
  }

  private markParetoOptimal(scoredRoutes: RouteScore[]): void {
    for (let i = 0; i < scoredRoutes.length; i++) {
      let isPareto = true;
      
      for (let j = 0; j < scoredRoutes.length; j++) {
        if (i === j) continue;
        
        // NOW: Higher scores are better
        const isBetterCO2 = scoredRoutes[j].co2Score > scoredRoutes[i].co2Score;
        const isBetterCost = scoredRoutes[j].costScore > scoredRoutes[i].costScore;
        const isBetterEnergy = scoredRoutes[j].energyScore > scoredRoutes[i].energyScore;
        
        if ((isBetterCO2 || scoredRoutes[j].co2Score === scoredRoutes[i].co2Score) &&
            (isBetterCost || scoredRoutes[j].costScore === scoredRoutes[i].costScore) &&
            (isBetterEnergy || scoredRoutes[j].energyScore === scoredRoutes[i].energyScore) &&
            (isBetterCO2 || isBetterCost || isBetterEnergy)) {
          isPareto = false;
          break;
        }
      }
      
      scoredRoutes[i].isParetoOptimal = isPareto;
    }
  }

  getRoutesByOptimization(
    startId: string,
    endId: string,
    criteria: 'co2' | 'cost' | 'energy' | 'balanced',
    throughput?: number
  ): RouteScore[] {
    let weights: OptimizationWeights;

    switch (criteria) {
      case 'co2':
        weights = { co2: 1.0, cost: 0.0, energy: 0.0 };
        break;
      case 'cost':
        weights = { co2: 0.0, cost: 1.0, energy: 0.0 };
        break;
      case 'energy':
        weights = { co2: 0.0, cost: 0.0, energy: 1.0 };
        break;
      case 'balanced':
      default:
        weights = { co2: 0.4, cost: 0.35, energy: 0.25 };
        break;
    }

    return this.findOptimalRoutes(startId, endId, weights, throughput);
  }

  getParetoOptimalRoutes(
    startId: string,
    endId: string,
    throughput?: number
  ): RouteScore[] {
    const weights = { co2: 0.33, cost: 0.33, energy: 0.34 };
    const allRoutes = this.findOptimalRoutes(startId, endId, weights, throughput);
    return allRoutes.filter(r => r.isParetoOptimal);
  }

  private calculateOperatingCost(co2PerBarrel: number, energyPerBarrel: number): number {
    const carbonPrice = 25;
    const electricityPrice = 0.12;
    const co2Cost = (co2PerBarrel / 1000) * carbonPrice;
    const energyCost = energyPerBarrel * electricityPrice;
    return co2Cost + energyCost;
  }

  calculateSavings(route: Route, allRoutes: Route[]) {
    const worstRoute = allRoutes[allRoutes.length - 1];
    
    return {
      co2Saved: (worstRoute.totalCO2 - route.totalCO2) / 1000,
      energySaved: (worstRoute.totalEnergy - route.totalEnergy) / 1000,
      costSaved: worstRoute.operatingCost - route.operatingCost,
      percentCO2Reduction: ((worstRoute.totalCO2 - route.totalCO2) / worstRoute.totalCO2 * 100).toFixed(1),
      percentEnergyReduction: ((worstRoute.totalEnergy - route.totalEnergy) / worstRoute.totalEnergy * 100).toFixed(1),
      annualCO2Saved: ((worstRoute.totalCO2 - route.totalCO2) / 1000) * 365,
      annualEnergySaved: ((worstRoute.totalEnergy - route.totalEnergy) / 1000) * 365,
      annualCostSaved: (worstRoute.operatingCost - route.operatingCost) * 365,
    };
  }
}