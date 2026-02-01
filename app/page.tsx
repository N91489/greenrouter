// app/page.tsx
"use client";

import { useState, useEffect } from "react";
import { RouteOptimizer, RouteScore } from "@/lib/routeOptimizer";
import { facilities, connections } from "@/lib/mockData";
import { Route } from "@/lib/types";
import { Sparkles, Loader2, Activity, CheckCircle } from "lucide-react";
import Image from "next/image";

const PRODUCTS = [
  {
    name: "Heavy Crude",
    weights: { co2: 0.3, cost: 0.5, energy: 0.2 },
    throughput: 5000,
    currentRouteIdx: 2,
  },
  {
    name: "Brent Blend",
    weights: { co2: 0.5, cost: 0.3, energy: 0.2 },
    throughput: 6000,
    currentRouteIdx: 1,
  },
  {
    name: "Arabian Heavy",
    weights: { co2: 0.4, cost: 0.35, energy: 0.25 },
    throughput: 4500,
    currentRouteIdx: 3,
  },
  {
    name: "Arab Super Light",
    weights: { co2: 0.25, cost: 0.25, energy: 0.5 },
    throughput: 5500,
    currentRouteIdx: 2,
  },
];

export default function Home() {
  const [selectedProduct, setSelectedProduct] = useState(0);
  const [routes, setRoutes] = useState<RouteScore[]>([]);
  const [selectedRouteIdx, setSelectedRouteIdx] = useState(0);
  const [sphinxRecommendation, setSphinxRecommendation] = useState("");
  const [anomalies, setAnomalies] = useState<any[]>([]);
  const [loadingSphinx, setLoadingSphinx] = useState(false);
  const [anomalyAnalysis, setAnomalyAnalysis] = useState("");
  const [analyzingAnomaly, setAnalyzingAnomaly] = useState(false);
  const [selectedAnomalyId, setSelectedAnomalyId] = useState("");

  const optimizer = new RouteOptimizer(facilities, connections);
  const currentProduct = PRODUCTS[selectedProduct];

  useEffect(() => {
    calculateRoutes();
    fetchAnomalies();
    const interval = setInterval(fetchAnomalies, 15000);
    return () => clearInterval(interval);
  }, [selectedProduct]);

  const calculateRoutes = () => {
    const allRoutes = optimizer.findOptimalRoutes(
      "wh-1",
      "exp-1",
      currentProduct.weights,
      currentProduct.throughput
    );
    setRoutes(allRoutes);
    setSelectedRouteIdx(0);
  };

  const fetchAnomalies = async () => {
    try {
      const response = await fetch("/api/monitoring?action=current");
      const data = await response.json();
      setAnomalies(data.anomalies || []);
    } catch (error) {
      console.error("Error fetching anomalies:", error);
    }
  };

  const getSphinxRecommendation = async () => {
    if (!routes[selectedRouteIdx]) return;
    setLoadingSphinx(true);
    try {
      const routesForSphinx = routes.map((r, idx) => ({
        name: `Route ${idx + 1}`,
        totalCO2: r.route.totalCO2,
        operatingCost: r.route.operatingCost,
      }));
      const response = await fetch("/api/sphinx", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: `Which route should I implement for ${currentProduct.name} production? Analyze the routes and provide a recommendation in 3 paragraphs covering: 1) which route is best and why, 2) the benefits and savings, 3) implementation approach.`,
          context: {
            routes: routesForSphinx,
            product: currentProduct.name,
            throughput: currentProduct.throughput,
          },
        }),
      });
      const data = await response.json();
      setSphinxRecommendation(data.response);
    } catch (error) {
      console.error("Error:", error);
      setSphinxRecommendation("Error getting recommendation");
    } finally {
      setLoadingSphinx(false);
    }
  };

  const analyzeAnomaly = async (anomaly: any) => {
    setSelectedAnomalyId(anomaly.id);
    setAnalyzingAnomaly(true);
    setAnomalyAnalysis("");

    try {
      const response = await fetch("/api/monitoring", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          anomalyId: anomaly.id,
          facilityId: anomaly.facilityId,
          action: "analyze-anomaly",
        }),
      });
      const data = await response.json();
      setAnomalyAnalysis(data.aiAnalysis || "No analysis available");
    } catch (error) {
      console.error("Error:", error);
      setAnomalyAnalysis("Error getting analysis");
    } finally {
      setAnalyzingAnomaly(false);
    }
  };

  const selectedRoute = routes[selectedRouteIdx]?.route;
  const overallScore = routes[selectedRouteIdx]?.totalScore || 0;
  const isCurrentRoute = selectedRouteIdx === currentProduct.currentRouteIdx;

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6">
      <div className="max-w-[1800px] mx-auto">
        <div className="mb-8">
          <h1 className="text-5xl font-bold text-white mb-3 flex items-center gap-4">
            <Image
              src="/icon.png"
              alt="GreenRouter Logo"
              width={120}
              height={120}
              className="rounded-xl"
            />
            GreenRouter
            <span className="text-base bg-gradient-to-r from-purple-500 to-pink-500 px-4 py-2 rounded-full flex items-center gap-2">
              <Sparkles className="w-5 h-5" />
              AI-Powered
            </span>
          </h1>
          <p className="text-slate-400 text-lg">
            Multi-Objective Route Optimization for Oil & Gas Production
          </p>
        </div>

        <div className="grid grid-cols-12 gap-6">
          {/* LEFT SIDEBAR */}
          <div className="col-span-3 space-y-4">
            <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-xl p-4">
              <h3 className="text-sm font-semibold text-slate-400 mb-3">
                PRODUCT TYPE
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {PRODUCTS.map((product, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedProduct(idx)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                      selectedProduct === idx
                        ? "bg-blue-500 text-white shadow-lg shadow-blue-500/50"
                        : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                    }`}
                  >
                    {product.name}
                  </button>
                ))}
              </div>
              <div className="mt-4 text-xs text-slate-400 space-y-1">
                <div>
                  Throughput:{" "}
                  <span className="text-white font-semibold">
                    {currentProduct.throughput.toLocaleString()} bbl/day
                  </span>
                </div>
                <div>
                  Priority:{" "}
                  <span className="text-white font-semibold">
                    {currentProduct.weights.co2 > 0.4
                      ? "CO2 Reduction"
                      : currentProduct.weights.cost > 0.4
                      ? "Cost Optimization"
                      : currentProduct.weights.energy > 0.4
                      ? "Energy Efficiency"
                      : "Balanced"}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-xl p-4">
              <h3 className="text-sm font-semibold text-slate-400 mb-3">
                ROUTE OPTIONS
              </h3>
              <div className="space-y-2">
                {routes.map((route, idx) => {
                  const isCurrent = idx === currentProduct.currentRouteIdx;
                  const isOptimal = idx === 0;
                  return (
                    <button
                      key={idx}
                      onClick={() => setSelectedRouteIdx(idx)}
                      className={`w-full px-4 py-3 rounded-lg text-left transition-all ${
                        selectedRouteIdx === idx
                          ? "bg-blue-500 text-white shadow-lg shadow-blue-500/50"
                          : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium">Route {idx + 1}</span>
                        <div className="flex gap-1">
                          {isCurrent && (
                            <span className="text-xs bg-orange-500 px-2 py-0.5 rounded flex items-center gap-1">
                              <CheckCircle className="w-3 h-3" />
                              CURRENT
                            </span>
                          )}
                          {isOptimal && (
                            <span className="text-xs bg-green-500 px-2 py-0.5 rounded">
                              OPTIMAL
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-xs mt-1 opacity-75">
                        Score: {route.totalScore.toFixed(3)}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-xl p-4">
              <h3 className="text-sm font-semibold text-slate-400 mb-3">
                PROCESSING PATH
              </h3>
              {selectedRoute && (
                <div className="space-y-2 text-sm">
                  {selectedRoute.path.map((facilityId, idx) => {
                    const facility = facilities.find(
                      (f) => f.id === facilityId
                    );
                    return (
                      <div
                        key={idx}
                        className="flex items-center gap-2 text-slate-300"
                      >
                        <div className="w-6 h-6 rounded-full bg-blue-500/20 border border-blue-500 flex items-center justify-center text-xs font-semibold">
                          {idx + 1}
                        </div>
                        <div className="flex-1">
                          <div className="font-medium">
                            {facility?.name || facilityId}
                          </div>
                          <div className="text-xs text-slate-500">
                            {facility?.type}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* CENTER CONTENT */}
          <div className="col-span-6 space-y-4">
            <div
              className={`backdrop-blur border rounded-xl p-6 text-center ${
                isCurrentRoute
                  ? "bg-gradient-to-br from-orange-500/20 to-red-500/20 border-orange-500/30"
                  : "bg-gradient-to-br from-blue-500/20 to-purple-500/20 border-blue-500/30"
              }`}
            >
              <div className="flex items-center justify-center gap-2 mb-2">
                <h2 className="text-slate-400 text-sm font-semibold">
                  OVERALL SCORE
                </h2>
                {isCurrentRoute && (
                  <span className="text-xs bg-orange-500 text-white px-2 py-1 rounded flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" />
                    CURRENT ROUTE
                  </span>
                )}
              </div>
              <div className="text-6xl font-bold text-white mb-2">
                {(overallScore * 100).toFixed(1)}
              </div>
              <div className="text-slate-400 text-sm">
                {routes[selectedRouteIdx]?.isParetoOptimal
                  ? "⭐ Pareto Optimal Solution"
                  : isCurrentRoute
                  ? "🔄 Currently In Production"
                  : "Feasible Alternative"}
              </div>
            </div>

            <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">
                NETWORK MAP
              </h3>
              <div
                className="relative bg-slate-900/50 rounded-lg p-4"
                style={{ height: "400px" }}
              >
                <svg
                  width="100%"
                  height="100%"
                  viewBox="0 0 1200 450"
                  preserveAspectRatio="xMidYMid meet"
                >
                  {connections.map((conn, idx) => {
                    const fromFacility = facilities.find(
                      (f) => f.id === conn.from
                    );
                    const toFacility = facilities.find((f) => f.id === conn.to);
                    if (!fromFacility || !toFacility) return null;
                    const isInRoute =
                      selectedRoute?.path.includes(conn.from) &&
                      selectedRoute?.path.includes(conn.to);
                    return (
                      <line
                        key={idx}
                        x1={fromFacility.position.x}
                        y1={fromFacility.position.y}
                        x2={toFacility.position.x}
                        y2={toFacility.position.y}
                        stroke={isInRoute ? "#3b82f6" : "#475569"}
                        strokeWidth={isInRoute ? "4" : "2"}
                        strokeDasharray={isInRoute ? "" : "5,5"}
                        opacity={isInRoute ? 1 : 0.3}
                      />
                    );
                  })}
                  {facilities.map((facility, idx) => {
                    const isInRoute = selectedRoute?.path.includes(facility.id);
                    return (
                      <g key={idx}>
                        <circle
                          cx={facility.position.x}
                          cy={facility.position.y}
                          r={isInRoute ? "20" : "12"}
                          fill={isInRoute ? "#3b82f6" : "#475569"}
                          stroke={isInRoute ? "#60a5fa" : "#64748b"}
                          strokeWidth="3"
                        />
                        {isInRoute && (
                          <>
                            <text
                              x={facility.position.x}
                              y={facility.position.y + 35}
                              textAnchor="middle"
                              fill="#cbd5e1"
                              fontSize="14"
                              fontWeight="600"
                            >
                              {facility.name.split(" ")[0]}
                            </text>
                            <text
                              x={facility.position.x}
                              y={facility.position.y + 50}
                              textAnchor="middle"
                              fill="#94a3b8"
                              fontSize="11"
                            >
                              {facility.type}
                            </text>
                          </>
                        )}
                      </g>
                    );
                  })}
                </svg>
              </div>
            </div>

            <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-purple-400" />
                  Sphinx AI Recommendation
                </h3>
                <button
                  onClick={getSphinxRecommendation}
                  disabled={loadingSphinx}
                  className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2"
                >
                  {loadingSphinx ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Get Analysis
                    </>
                  )}
                </button>
              </div>
              <div className="bg-slate-900/50 rounded-lg p-4 min-h-[200px] max-h-[500px] overflow-y-auto">
                {sphinxRecommendation ? (
                  <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">
                    {sphinxRecommendation}
                  </p>
                ) : (
                  <div className="text-center py-12">
                    <Sparkles className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                    <p className="text-slate-500 text-sm">
                      Click "Get Analysis" to receive AI-powered recommendations
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* RIGHT SIDEBAR */}
          <div className="col-span-3 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <MetricCard
                title="CO₂"
                value={
                  selectedRoute
                    ? `${(selectedRoute.totalCO2 / 1000).toFixed(1)}`
                    : "0"
                }
                unit="tons/day"
                icon="🌍"
                color="green"
              />
              <MetricCard
                title="Savings"
                value={
                  selectedRoute && routes[currentProduct.currentRouteIdx]
                    ? `$${(
                        (routes[currentProduct.currentRouteIdx].route
                          .operatingCost -
                          selectedRoute.operatingCost) /
                        1000
                      ).toFixed(1)}k`
                    : "0"
                }
                unit="/day"
                icon="💰"
                color="blue"
              />
              <MetricCard
                title="COST"
                value={
                  selectedRoute
                    ? `$${(selectedRoute.operatingCost / 1000).toFixed(1)}k`
                    : "0"
                }
                unit="/day"
                icon="💵"
                color="orange"
              />
              <MetricCard
                title="Energy"
                value={
                  selectedRoute
                    ? `${(selectedRoute.totalEnergy / 1000).toFixed(1)}`
                    : "0"
                }
                unit="MWh/day"
                icon="⚡"
                color="yellow"
              />
            </div>

            <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Activity className="w-5 h-5 text-red-400" />
                  Anomaly Detection
                </h3>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-xs text-slate-400">Live</span>
                </div>
              </div>

              <div className="space-y-3 max-h-[400px] overflow-y-auto mb-4">
                {anomalies.length === 0 ? (
                  <div className="text-center py-8">
                    <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
                    <p className="text-slate-400 text-sm font-semibold">
                      All Systems Nominal
                    </p>
                    <p className="text-slate-500 text-xs mt-1">
                      No anomalies detected
                    </p>
                  </div>
                ) : (
                  anomalies.slice(0, 3).map((anomaly) => (
                    <div
                      key={anomaly.id}
                      className={`rounded-lg p-3 border-2 ${getSeverityColor(
                        anomaly.severity
                      )} ${
                        selectedAnomalyId === anomaly.id
                          ? "ring-2 ring-purple-500"
                          : ""
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h4 className="font-semibold text-white text-xs">
                            {anomaly.facilityName}
                          </h4>
                          <p className="text-xs opacity-90 mt-1">
                            {anomaly.description}
                          </p>
                        </div>
                        <span className="text-xs font-bold px-2 py-0.5 rounded uppercase">
                          {anomaly.severity}
                        </span>
                      </div>
                      <div className="text-xs mt-2">
                        <span className="opacity-75">Deviation:</span>
                        <span className="ml-2 font-semibold text-red-400">
                          {Math.abs(anomaly.deviation).toFixed(1)}%
                        </span>
                      </div>
                      <button
                        onClick={() => analyzeAnomaly(anomaly)}
                        disabled={analyzingAnomaly}
                        className="w-full mt-2 bg-purple-500 hover:bg-purple-600 disabled:bg-purple-500/50 text-white px-2 py-1.5 rounded text-xs font-semibold transition-all flex items-center justify-center gap-2"
                      >
                        <Sparkles className="w-3 h-3" />
                        Analyze
                      </button>
                    </div>
                  ))
                )}
              </div>

              {/* Analysis Display Area */}
              <div className="bg-slate-900/80 backdrop-blur border border-purple-500/30 rounded-lg p-4 min-h-[150px] max-h-[300px] overflow-y-auto">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="w-4 h-4 text-purple-400" />
                  <span className="text-sm font-semibold text-purple-400">
                    Sphinx AI Analysis
                  </span>
                </div>
                {analyzingAnomaly ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 text-purple-400 animate-spin" />
                    <span className="ml-3 text-slate-400 text-sm">
                      Analyzing anomaly...
                    </span>
                  </div>
                ) : anomalyAnalysis ? (
                  <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap">
                    {anomalyAnalysis}
                  </p>
                ) : (
                  <p className="text-slate-500 text-xs text-center py-8">
                    Click "Analyze" on an anomaly to get AI insights
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

function MetricCard({ title, value, unit, icon, color }: any) {
  const colorClasses = {
    green: "from-green-500/20 to-emerald-500/20 border-green-500/30",
    blue: "from-blue-500/20 to-cyan-500/20 border-blue-500/30",
    orange: "from-orange-500/20 to-red-500/20 border-orange-500/30",
    yellow: "from-yellow-500/20 to-amber-500/20 border-yellow-500/30",
  };
  return (
    <div
      className={`bg-gradient-to-br ${
        colorClasses[color as keyof typeof colorClasses]
      } backdrop-blur border rounded-xl p-4`}
    >
      <div className="text-2xl mb-2">{icon}</div>
      <div className="text-slate-400 text-xs font-semibold mb-1">{title}</div>
      <div className="text-2xl font-bold text-white">{value}</div>
      <div className="text-slate-500 text-xs mt-1">{unit}</div>
    </div>
  );
}

function getSeverityColor(severity: string) {
  const colors = {
    low: "bg-blue-500/20 border-blue-500 text-blue-300",
    medium: "bg-yellow-500/20 border-yellow-500 text-yellow-300",
    high: "bg-orange-500/20 border-orange-500 text-orange-300",
    critical: "bg-red-500/20 border-red-500 text-red-300",
  };
  return colors[severity as keyof typeof colors] || colors.medium;
}
