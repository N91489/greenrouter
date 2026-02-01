// lib/test-optimizer.ts
import { RouteOptimizer } from './routeOptimizer';
import { facilities, connections } from './mockData';

console.log('\n🧪 Testing Multi-Objective Route Optimizer\n');
console.log('=' .repeat(60));

const optimizer = new RouteOptimizer(facilities, connections);

// Test 1: Find all routes with balanced weights
console.log('\n📊 TEST 1: Balanced Multi-Objective Optimization');
console.log('-'.repeat(60));

const balancedRoutes = optimizer.findOptimalRoutes(
  'wh-1', 
  'exp-1',
  { co2: 0.4, cost: 0.35, energy: 0.25 }, // Balanced weights
  5000 // throughput
);

console.log(`Found ${balancedRoutes.length} routes\n`);

balancedRoutes.forEach((scored, idx) => {
  const route = scored.route;
  console.log(`Route ${idx + 1}: ${route.name}`);
  console.log(`  Path: ${route.path.join(' → ')}`);
  console.log(`  CO2: ${(route.totalCO2 / 1000).toFixed(2)} tons/day (score: ${scored.co2Score.toFixed(3)})`);
  console.log(`  Cost: $${route.operatingCost.toLocaleString()}/day (score: ${scored.costScore.toFixed(3)})`);
  console.log(`  Energy: ${(route.totalEnergy / 1000).toFixed(2)} MWh/day (score: ${scored.energyScore.toFixed(3)})`);
  console.log(`  Distance: ${route.totalDistance.toFixed(1)} km`);
  console.log(`  Overall Score: ${scored.totalScore.toFixed(3)} ${scored.isParetoOptimal ? '⭐ PARETO OPTIMAL' : ''}`);
  console.log('');
});

// Test 2: CO2 optimization only
console.log('\n🌍 TEST 2: CO2 Optimization (100% weight on emissions)');
console.log('-'.repeat(60));

const co2Routes = optimizer.getRoutesByOptimization('wh-1', 'exp-1', 'co2', 5000);
const bestCO2 = co2Routes[0].route;

console.log(`Best CO2 Route: ${bestCO2.name}`);
console.log(`  CO2: ${(bestCO2.totalCO2 / 1000).toFixed(2)} tons/day`);
console.log(`  Cost: $${bestCO2.operatingCost.toLocaleString()}/day`);
console.log(`  Energy: ${(bestCO2.totalEnergy / 1000).toFixed(2)} MWh/day`);

// Test 3: Cost optimization only
console.log('\n💰 TEST 3: Cost Optimization (100% weight on cost)');
console.log('-'.repeat(60));

const costRoutes = optimizer.getRoutesByOptimization('wh-1', 'exp-1', 'cost', 5000);
const bestCost = costRoutes[0].route;

console.log(`Best Cost Route: ${bestCost.name}`);
console.log(`  Cost: $${bestCost.operatingCost.toLocaleString()}/day`);
console.log(`  CO2: ${(bestCost.totalCO2 / 1000).toFixed(2)} tons/day`);
console.log(`  Energy: ${(bestCost.totalEnergy / 1000).toFixed(2)} MWh/day`);

// Test 4: Energy optimization only
console.log('\n⚡ TEST 4: Energy Optimization (100% weight on energy)');
console.log('-'.repeat(60));

const energyRoutes = optimizer.getRoutesByOptimization('wh-1', 'exp-1', 'energy', 5000);
const bestEnergy = energyRoutes[0].route;

console.log(`Best Energy Route: ${bestEnergy.name}`);
console.log(`  Energy: ${(bestEnergy.totalEnergy / 1000).toFixed(2)} MWh/day`);
console.log(`  CO2: ${(bestEnergy.totalCO2 / 1000).toFixed(2)} tons/day`);
console.log(`  Cost: $${bestEnergy.operatingCost.toLocaleString()}/day`);

// Test 5: Pareto-optimal solutions
console.log('\n⭐ TEST 5: Pareto-Optimal Routes');
console.log('-'.repeat(60));

const paretoRoutes = optimizer.getParetoOptimalRoutes('wh-1', 'exp-1', 5000);

console.log(`Found ${paretoRoutes.length} Pareto-optimal routes:\n`);

paretoRoutes.forEach((scored, idx) => {
  const route = scored.route;
  console.log(`${idx + 1}. ${route.name}`);
  console.log(`   CO2: ${(route.totalCO2 / 1000).toFixed(2)}t | Cost: $${(route.operatingCost / 1000).toFixed(1)}k | Energy: ${(route.totalEnergy / 1000).toFixed(1)} MWh`);
});

// Test 6: Savings calculation
console.log('\n💡 TEST 6: Savings Analysis');
console.log('-'.repeat(60));

const allRoutes = balancedRoutes.map(r => r.route);
const optimalRoute = allRoutes[0];
const savings = optimizer.calculateSavings(optimalRoute, allRoutes);

console.log(`Comparing optimal route vs worst route:\n`);
console.log(`  CO2 Saved: ${savings.co2Saved.toFixed(2)} tons/day (${savings.percentCO2Reduction}% reduction)`);
console.log(`  Annual CO2 Saved: ${savings.annualCO2Saved.toFixed(0)} tons/year`);
console.log(`  Energy Saved: ${savings.energySaved.toFixed(2)} MWh/day (${savings.percentEnergyReduction}% reduction)`);
console.log(`  Annual Energy Saved: ${savings.annualEnergySaved.toFixed(0)} MWh/year`);
console.log(`  Cost Saved: $${savings.costSaved.toLocaleString()}/day`);
console.log(`  Annual Cost Saved: $${savings.annualCostSaved.toLocaleString()}/year`);

// Test 7: Different throughput scenarios
console.log('\n📈 TEST 7: Throughput Scenario Analysis');
console.log('-'.repeat(60));

const throughputs = [3000, 5000, 7000];

throughputs.forEach(throughput => {
  const routes = optimizer.findOptimalRoutes(
    'wh-1',
    'exp-1', 
    { co2: 0.4, cost: 0.35, energy: 0.25 },
    throughput
  );
  const optimal = routes[0].route;
  
  console.log(`\nThroughput: ${throughput} bbl/day`);
  console.log(`  CO2: ${(optimal.totalCO2 / 1000).toFixed(2)} tons/day`);
  console.log(`  Cost: $${optimal.operatingCost.toLocaleString()}/day`);
  console.log(`  Energy: ${(optimal.totalEnergy / 1000).toFixed(2)} MWh/day`);
  console.log(`  Unit CO2: ${(optimal.totalCO2 / throughput).toFixed(3)} kg/bbl`);
  console.log(`  Unit Cost: $${(optimal.operatingCost / throughput).toFixed(2)}/bbl`);
});

// Test 8: A* Algorithm (if you want to test it)
console.log('\n🔍 TEST 8: A* Algorithm Test');
console.log('-'.repeat(60));

const astarRoutes = optimizer.findOptimalRoutesAStar(
  'wh-1',
  'exp-1',
  { co2: 0.4, cost: 0.35, energy: 0.25 },
  5000
);

console.log(`A* found ${astarRoutes.length} routes`);
if (astarRoutes.length > 0) {
  const bestAStar = astarRoutes[0];
  console.log(`\nBest A* Route: ${bestAStar.name}`);
  console.log(`  CO2: ${(bestAStar.totalCO2 / 1000).toFixed(2)} tons/day`);
  console.log(`  Cost: $${bestAStar.operatingCost.toLocaleString()}/day`);
  console.log(`  Path: ${bestAStar.path.join(' → ')}`);
}

console.log('\n' + '='.repeat(60));
console.log('✅ All tests complete!\n');

// Export results for verification
export const testResults = {
  balancedRoutes,
  co2Routes,
  costRoutes,
  energyRoutes,
  paretoRoutes,
  savings,
};