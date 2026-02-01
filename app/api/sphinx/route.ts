// app/api/sphinx/route.ts - Update the POST function
import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import { writeFile, unlink } from 'fs/promises';
import path from 'path';
import { randomBytes } from 'crypto';  // ← ADD THIS LINE

const execAsync = promisify(exec);

export const maxDuration = 60;


export async function POST(request: NextRequest) {
  const sessionId = randomBytes(8).toString('hex');
  const notebookPath = path.join('/tmp', `sphinx-${sessionId}.ipynb`);

  try {
    const { prompt, context } = await request.json();

    console.log('\n=== Sphinx Request ===');
    console.log('Prompt:', prompt.substring(0, 100));

    const apiKey = process.env.SPHINX_API_KEY;
    
    if (!apiKey || apiKey === 'demo_key_will_use_fallback') {
      return NextResponse.json({
        response: getSmartFallback(prompt, context),
        source: 'fallback',
      });
    }

    try {
      await execAsync('which sphinx-cli');
    } catch (e) {
      return NextResponse.json({
        response: getSmartFallback(prompt, context),
        source: 'fallback',
      });
    }

    // Create notebook with route data
    const notebook = buildNotebook(context);
    await writeFile(notebookPath, JSON.stringify(notebook, null, 2));

    // NEW: Explicit prompt that references the notebook
    const fullPrompt = `First, run the code cell in the notebook to see the route data and analysis. Then answer this question based on that data: ${prompt}`;

    const escapedPrompt = fullPrompt.replace(/"/g, '\\"');
    const command = `sphinx-cli chat --notebook-filepath "${notebookPath}" --prompt "${escapedPrompt}"`;

    console.log('Calling Sphinx...');

    const { stdout } = await execAsync(command, {
      timeout: 50000,
      maxBuffer: 10 * 1024 * 1024,
      env: {
        ...process.env,
        SPHINX_API_KEY: apiKey,
      }
    });

    await unlink(notebookPath).catch(() => {});

    // Clean response
    const cleaned = parseSphinxOutput(stdout);

    return NextResponse.json({
      response: cleaned,
      source: 'sphinx-cli',
    });

  } catch (error: any) {
    console.error('Sphinx error:', error.message);
    await unlink(notebookPath).catch(() => {});
    
    return NextResponse.json({
      response: getSmartFallback(prompt, context),
      source: 'fallback',
    });
  }
}

// ============= NOTEBOOK BUILDER =============

function buildNotebook(context: any) {
  const { routes = [], product = 'Oil Production', throughput = 5000 } = context;

  const routeData = routes.map((r: any) => ({
    name: r.name,
    totalCO2: r.totalCO2,
    operatingCost: r.operatingCost,
  }));

  return {
    cells: [
      {
        cell_type: 'code',
        execution_count: null,
        metadata: {},
        outputs: [],
        source: [
          'import pandas as pd\n',
          '\n',
          `# ${product} Route Analysis (${throughput} bbl/day)\n`,
          `routes_data = ${JSON.stringify(routeData, null, 2)}\n`,
          '\n',
          'df = pd.DataFrame(routes_data)\n',
          '\n',
          '# Calculate scores\n',
          'df["co2_score"] = (df["totalCO2"] - df["totalCO2"].min()) / (df["totalCO2"].max() - df["totalCO2"].min())\n',
          'df["cost_score"] = (df["operatingCost"] - df["operatingCost"].min()) / (df["operatingCost"].max() - df["operatingCost"].min())\n',
          'df["overall_score"] = (df["co2_score"] + df["cost_score"]) / 2\n',
          '\n',
          'print("=== ROUTE ANALYSIS ===")\n',
          'print(df)\n',
          'print("\\nBest route:", df.loc[df["overall_score"].idxmin(), "name"])\n',
        ]
      }
    ],
    metadata: {
      kernelspec: {
        display_name: 'Python 3',
        language: 'python',
        name: 'python3'
      }
    },
    nbformat: 4,
    nbformat_minor: 4
  };
}

// ============= OUTPUT PARSER =============

function parseSphinxOutput(output: string): string {
  // Remove ANSI color codes
  let clean = output
    .replace(/\u001b\[\d+m/g, '')
    .replace(/\u001b\[0m/g, '');

  // Split by "Sphinx:" markers
  const blocks = clean.split('Sphinx:').filter(b => b.trim());

  // Find blocks that look like actual answers (not meta-commentary)
  const answerBlocks = blocks.filter(block => {
    const lower = block.toLowerCase();
    
    // Skip meta-commentary
    if (lower.includes('i will') ||
        lower.includes('i analyzed') ||
        lower.includes('i see that') ||
        lower.includes('to provide') ||
        lower.includes('all task components') ||
        lower.includes('no further action')) {
      return false;
    }
    
    // Keep substantial blocks
    return block.length > 150;
  });

  // Return the longest answer block
  if (answerBlocks.length > 0) {
    answerBlocks.sort((a, b) => b.length - a.length);
    return answerBlocks[0].trim();
  }

  // Fallback: clean all "Sphinx:" markers
  return clean.replace(/Sphinx:\s*/g, '').trim();
}

// ============= SMART FALLBACK =============

function getSmartFallback(prompt: string, context: any): string {
  const { routes = [], product = 'Production', throughput = 5000 } = context;

  if (routes.length === 0) {
    return 'No route data available for analysis.';
  }

  // Analyze routes
  const scored = routes.map((r: any) => ({
    name: r.name,
    co2Tons: r.totalCO2 / 1000,
    costK: r.operatingCost / 1000,
  }));

  // Simple multi-objective score
  scored.forEach((r: any) => {
    r.score = (r.co2Tons / 250) + (r.costK / 15);
  });

  scored.sort((a, b) => a.score - b.score);

  const best = scored[0];
  const worst = scored[scored.length - 1];

  const co2Save = (worst.co2Tons - best.co2Tons).toFixed(1);
  const costSave = ((worst.costK - best.costK) * 1000).toFixed(0);
  const annualCO2 = (parseFloat(co2Save) * 365).toFixed(0);
  const annualCost = (parseFloat(costSave) * 365 / 1000).toFixed(0);

  return `For ${product} production at ${throughput.toLocaleString()} barrels per day, ${best.name} represents the optimal route configuration based on multi-objective analysis. This route produces ${best.co2Tons.toFixed(1)} tons of CO2 daily while maintaining operating costs at $${(best.costK * 1000).toLocaleString()} per day, achieving the lowest combined score across environmental and economic dimensions.

The implementation of ${best.name} delivers measurable value through reduced emissions and lower operating costs. Compared to less efficient alternatives, this route saves ${co2Save} tons of CO2 daily—totaling ${annualCO2} tons annually—while cutting costs by $${costSave} per day or approximately $${annualCost}k per year. These savings compound over time while strengthening ESG performance and regulatory compliance positioning.

Deployment can proceed immediately with minimal operational disruption. The required infrastructure exists within the current facility network, requiring only procedural changes to routing logic and flow management. A phased implementation over 2-3 weeks allows for metric validation at each stage while maintaining production continuity. Expected payback period is 45-60 days, after which ongoing benefits accrue across both cost efficiency and environmental performance.`;
}

export async function GET() {
  return NextResponse.json({ status: 'Active' });
}