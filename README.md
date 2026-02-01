# GreenRouter

> **Winner - MIT Energy & Climate Hackathon 2025**  
> **Team: What the Flux**  
> AI-powered route optimization for sustainable oil & gas production

[![Next.js](https://img.shields.io/badge/Next.js-15-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)](https://www.typescriptlang.org/)
[![Sphinx AI](https://img.shields.io/badge/Sphinx-AI-orange)](https://sphinx.com/)

## 🎥 Demo & Presentation

**📹 Demo Video:** [Watch on YouTube](https://youtu.be/WL0Uh5xrCmQ) 

**📊 Presentation:** [View Slides](https://docs.google.com/presentation/d/1ZhUBegPgRYmCTuIOsvmqs5vXpdFocw2Y2hqL6uxfqcA/edit?usp=sharing) 

---

## What It Does

GreenRouter optimizes oil production routes across **three objectives simultaneously**:
- 🌱 **CO2 Emissions** - Minimize environmental impact
- 💰 **Operating Costs** - Maximize economic efficiency  
- ⚡ **Energy Consumption** - Optimize resource utilization

**Key Features:**
- Multi-objective route optimization with Pareto optimality
- Sphinx AI integration for natural language recommendations (powered by Anthropic's Claude)
- Real-time anomaly detection with AI-powered root cause analysis
- Interactive network visualization
- Handles 4,500-6,000 bbl/day throughput

---

## Quick Start
```bash
# Clone and install
git clone https://github.com/N91489/greenrouter.git
cd greenrouter
npm install

# Set up environment
touch .env.local
# Add your Sphinx API key to .env.local

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

**Environment Variables:**
```bash
SPHINX_API_KEY=your_key_here  # Get from https://sphinx.com/dashboard
```

**Note:** App works without Sphinx API key using intelligent fallback analysis.

---

## How It Works

### 1. Multi-Objective Route Optimization

**Algorithm Flow:**
```
1. Find all feasible paths from warehouse to export terminal
2. For each route, calculate:
   - Total CO2 emissions (tons/day)
   - Operating costs ($/day)
   - Energy consumption (MWh/day)
3. Normalize metrics to 0-1 scale (min-max normalization)
4. Apply weighted scoring:
   Score = (w_co2 × CO2_norm) + (w_cost × Cost_norm) + (w_energy × Energy_norm)
5. Sort routes by total score (lower is better)
6. Identify Pareto-optimal solutions
```

**Pareto Optimality:** A route is Pareto optimal if no other route is better in ALL objectives simultaneously.

**Example:**
- Route 1: 214.8 tons CO2/day, $12,500/day → Score: 0.364
- Route 2: 232.1 tons CO2/day, $11,800/day → Score: 0.204 ✓ Better
- Savings: $700/day, 17.3 tons CO2/day

### 2. Sphinx AI Integration

**How Sphinx Works:**

```
User clicks "Get Analysis"
    ↓
Server creates Jupyter notebook with route data:
  - Import pandas
  - Create DataFrame with routes
  - Calculate normalized scores
    ↓
Execute Sphinx CLI:
  sphinx-cli chat --notebook-filepath /tmp/notebook.ipynb
    ↓
Sphinx analyzes the notebook:
  - Reads DataFrame
  - Understands metrics
  - Generates 3-paragraph recommendation
    ↓
Parse output and return to user
```

**Dynamic Notebook Example:**
```python
import pandas as pd

routes_data = [
  {"name": "Route 1", "totalCO2": 214.8, "operatingCost": 12500},
  {"name": "Route 2", "totalCO2": 232.1, "operatingCost": 11800}
]

df = pd.DataFrame(routes_data)
df["co2_score"] = (df["totalCO2"] - df["totalCO2"].min()) / ...
df["overall_score"] = (df["co2_score"] + df["cost_score"]) / 2
print(df)
```

**Fallback System:** If Sphinx unavailable (no API key, timeout, error):
- Uses same multi-objective scoring
- Calculates savings vs worst route
- Generates structured 3-paragraph recommendation
- Provides implementation timeline

### 3. Real-Time Anomaly Detection

**Statistical Method:** Z-score analysis
```
For each metric (CO2, energy, throughput, etc.):
  z_score = (current_value - baseline_mean) / baseline_std_dev
  
  if |z_score| > 3.0:
    → Anomaly detected (3-sigma rule)
    → Only 0.3% of normal values fall outside ±3σ
```

**Severity Classification:**
```
deviation = |current - baseline| / baseline

if deviation > 30% → CRITICAL
if deviation > 20% → HIGH
if deviation > 10% → MEDIUM
if deviation > 5%  → LOW
```

**AI-Powered Root Cause Analysis:**
- Examines facility age, type, and historical patterns
- Provides immediate actions (1-4 hour timeline)
- Recommends long-term prevention strategies
- Quantifies production impact if unaddressed

**Monitoring:** Polls every 15 seconds, 20% chance of demo anomaly per facility.

---

## Project Structure
```
greenrouter/
├── app/
│   ├── api/
│   │   ├── sphinx/
│   │   │   └── route.ts           # Sphinx AI integration
│   │   └── monitoring/
│   │       └── route.ts           # Anomaly detection API
│   ├── globals.css                # Tailwind styles
│   ├── layout.tsx                 # Root layout
│   └── page.tsx                   # Main dashboard (1300 lines)
├── lib/
│   ├── routeOptimizer.ts          # Multi-objective optimization
│   ├── anomalyDetection.ts        # Real-time monitoring & Z-score
│   ├── mockData.ts                # Facility network (10 facilities, 15 connections)
│   └── types.ts                   # TypeScript definitions
├── public/
│   └── icon.png                   # App logo
├── notebooks/
│   └── sphinx.ipynb               # Sphinx notebook template
└── scripts/
    └── test-sphinx.sh             # Test Sphinx integration
```

**Key Files:**

- `routeOptimizer.ts`: Implements Dijkstra-based path finding with weighted multi-objective scoring
- `anomalyDetection.ts`: Z-score analysis, baseline tracking, predictive maintenance
- `sphinx/route.ts`: Notebook generation, CLI execution, output parsing, fallback logic
- `page.tsx`: React dashboard with state management, polling, SVG visualization

---

## Tech Stack

**Frontend:**
- Next.js 15 (App Router)
- React 18 with TypeScript
- Tailwind CSS for styling
- Lucide React for icons
- SVG for network visualization

**Backend:**
- Next.js API Routes (serverless functions)
- Python 3.11+ with pandas
- Sphinx CLI 
- Jupyter notebooks for AI context

**Key Algorithms:**
- Modified Dijkstra for path finding
- Min-max normalization for metrics
- Z-score for anomaly detection
- Pareto optimality filtering

---

## API Endpoints

### POST `/api/sphinx`
Generate AI-powered route recommendations.

**Request:**
```json
{
  "prompt": "Which route should I implement?",
  "context": {
    "routes": [
      {"name": "Route 1", "totalCO2": 214.8, "operatingCost": 12500}
    ],
    "product": "Heavy Crude",
    "throughput": 5000
  }
}
```

**Response:**
```json
{
  "response": "For Heavy Crude production at 5,000 barrels per day...",
  "source": "sphinx-cli"  // or "fallback"
}
```

### GET `/api/monitoring?action=current`
Fetch current anomalies and maintenance alerts.

**Response:**
```json
{
  "timestamp": "2024-01-31T15:30:00Z",
  "anomalies": [
    {
      "id": "anom-123",
      "facilityId": "ref-1",
      "facilityName": "Refinery 1",
      "type": "CO2 Emissions Spike",
      "severity": "high",
      "deviation": 0.25
    }
  ],
  "maintenanceAlerts": [...],
  "facilitiesMonitored": 10
}
```

### POST `/api/monitoring`
Analyze specific anomaly with AI.

**Request:**
```json
{
  "action": "analyze-anomaly",
  "anomalyId": "anom-123",
  "facilityId": "ref-1"
}
```

---

## Products & Optimization Priorities

The dashboard supports 4 crude oil types with different optimization priorities:

| Product | Throughput | CO2 Weight | Cost Weight | Energy Weight | Priority |
|---------|-----------|------------|-------------|---------------|----------|
| Heavy Crude | 5,000 bbl/day | 0.3 | 0.5 | 0.2 | Cost Optimization |
| Brent Blend | 6,000 bbl/day | 0.5 | 0.3 | 0.2 | CO2 Reduction |
| Arabian Heavy | 4,500 bbl/day | 0.4 | 0.35 | 0.25 | Balanced |
| Arab Super Light | 5,500 bbl/day | 0.25 | 0.25 | 0.5 | Energy Efficiency |

---

## Deployment

### Vercel (Recommended)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod

# Set environment variable
vercel env add SPHINX_API_KEY
# Paste your API key when prompted
```

### Docker
```bash
# Build image
docker build -t greenrouter .

# Run container
docker run -p 3000:3000 \
  -e SPHINX_API_KEY=your_key \
  greenrouter
```

---

## Testing Sphinx Integration
```bash
# Test Sphinx CLI directly
./scripts/test-sphinx.sh

# Manual test
cat > /tmp/test.ipynb << EOF
{
  "cells": [{
    "cell_type": "code",
    "source": ["import pandas as pd\nprint('Hello Sphinx')"]
  }],
  "metadata": {"kernelspec": {"name": "python3"}},
  "nbformat": 4
}
EOF

sphinx-cli chat --notebook-filepath /tmp/test.ipynb --prompt "What does this notebook do?"
```

---

## Sample Output

**Route Comparison:**
```
Route 1: CO2: 214.8 tons/day | Cost: $12,500/day | Energy: 180 MWh/day
Route 2: CO2: 232.1 tons/day | Cost: $11,800/day | Energy: 165 MWh/day
Route 3: CO2: 198.5 tons/day | Cost: $13,200/day | Energy: 195 MWh/day

Optimal: Route 1 (lowest weighted score)
Savings vs Current: $700/day, 17.3 tons CO2/day
Annual Impact: $255k saved, 6,315 tons CO2 reduced
```

---

## Key Achievements

- **Finalist** - MIT Energy & Climate Hackathon 2025 (Team: What the Flux)
- **Sphinx AI Sponsor Prize** - Best use of Sphinx
- **Production-Ready** - Handles real-world throughput scenarios
- **Multi-Objective Optimization** - Pareto optimality across 3 objectives
- **AI-Powered** - Natural language recommendations and anomaly analysis

---

## Acknowledgments

- **MIT Energy & Climate Hackathon** - Competition platform
- **Sphinx AI** - Hackathon sponsor 

---

## License

MIT License - See LICENSE file for details

---

**Built with ❤️ for sustainable energy optimization 🌍**
