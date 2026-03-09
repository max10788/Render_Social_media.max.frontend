/**
 * MarkovSimulationPanel.js
 *
 * Renders the full Markov Chain Monte Carlo simulation visualization.
 * Adapts to the actual backend response shape from POST /markov/l2-simulate:
 *   data.initial_price         — starting price
 *   data.transition_matrix     — { labels: [...], values: [[...], ...] }
 *   data.simulation            — { mean_final_price, std_final_price, percentiles,
 *                                   mean_bounces, mean_breakthroughs, bounce_rate,
 *                                   price_distribution, pct_paths_above_initial,
 *                                   n_paths, n_steps }
 *   data.price_fan             — { p5: [...], p25: [...], p50: [...], p75: [...], p95: [...] }
 *   data.active_walls          — [...] (optional)
 *   data.n_snapshots_used      — int
 *   data.token / data.network  — strings
 */
import React, { useEffect, useRef, useMemo } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  BarChart,
  Bar,
  Area,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  CartesianGrid,
} from 'recharts';
import * as d3 from 'd3';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const TOOLTIP_STYLE = {
  background: '#2a2a3d',
  border: '1px solid #444',
  color: '#fff',
  fontSize: 12,
};

const STATE_LABELS = ['FREE', 'WALL_BID', 'WALL_ASK', 'BETWEEN', 'THROUGH'];

// ---------------------------------------------------------------------------
// Helper: build 50-bin histogram from an array of floats
// ---------------------------------------------------------------------------

function buildHistogram(values, numBins = 50) {
  if (!values || values.length === 0) return [];
  const minVal = Math.min(...values);
  const maxVal = Math.max(...values);
  if (minVal === maxVal) {
    return [{ binCenter: minVal, count: values.length }];
  }
  const binWidth = (maxVal - minVal) / numBins;
  const bins = Array.from({ length: numBins }, (_, i) => ({
    binCenter: minVal + (i + 0.5) * binWidth,
    count: 0,
  }));
  values.forEach((v) => {
    const idx = Math.min(Math.floor((v - minVal) / binWidth), numBins - 1);
    bins[idx].count += 1;
  });
  return bins;
}

// ---------------------------------------------------------------------------
// Sub-component: Price Fan Chart
// ---------------------------------------------------------------------------

function FanChart({ priceFan, initialPrice, nPaths, nSteps }) {
  const yDomain = useMemo(() => {
    const p5vals  = (priceFan.p5  || []).filter(v => v != null);
    const p95vals = (priceFan.p95 || []).filter(v => v != null);
    if (p5vals.length === 0 || p95vals.length === 0) return ['auto', 'auto'];
    const lo = Math.min(...p5vals);
    const hi = Math.max(...p95vals);
    const pad = (hi - lo) * 0.05 || hi * 0.01;
    return [lo - pad, hi + pad];
  }, [priceFan]);

  const fanData = useMemo(() => {
    const len = priceFan.p50 ? priceFan.p50.length : 0;
    return Array.from({ length: len }, (_, i) => ({
      step: i,
      p95: priceFan.p95 ? priceFan.p95[i] : null,
      p75: priceFan.p75 ? priceFan.p75[i] : null,
      p50: priceFan.p50 ? priceFan.p50[i] : null,
      p25: priceFan.p25 ? priceFan.p25[i] : null,
      p5:  priceFan.p5  ? priceFan.p5[i]  : null,
    }));
  }, [priceFan]);

  return (
    <div className="markov-chart-card">
      <div className="markov-chart-title">
        Simulation Paths — Fan Chart ({nPaths} paths, {nSteps} steps)
      </div>
      <ResponsiveContainer width="100%" height={350}>
        <ComposedChart data={fanData} margin={{ top: 10, right: 20, bottom: 30, left: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#2a2a3d" />
          <XAxis
            dataKey="step"
            label={{ value: 'Simulation Step', position: 'insideBottom', offset: -10, fill: '#aaa', fontSize: 11 }}
            tick={{ fill: '#aaa', fontSize: 11 }}
          />
          <YAxis
            domain={yDomain}
            tickFormatter={(v) => `$${Number(v).toFixed(2)}`}
            label={{ value: '$price', angle: -90, position: 'insideLeft', fill: '#aaa', fontSize: 11 }}
            tick={{ fill: '#aaa', fontSize: 11 }}
          />
          <Tooltip
            contentStyle={TOOLTIP_STYLE}
            formatter={(value, name) => [`$${Number(value).toFixed(4)}`, name]}
          />
          {/* Outer band: 5–95% */}
          <Area
            type="monotone"
            dataKey="p95"
            fill="rgba(46,204,113,0.10)"
            stroke="none"
            legendType="none"
            name="95th pct"
          />
          {/* Inner band: 25–75% */}
          <Area
            type="monotone"
            dataKey="p75"
            fill="rgba(46,204,113,0.25)"
            stroke="none"
            legendType="none"
            name="75th pct"
          />
          {/* Mask below 25th pct */}
          <Area
            type="monotone"
            dataKey="p25"
            fill="#1e1e2f"
            fillOpacity={1}
            stroke="none"
            legendType="none"
            name="25th pct"
          />
          {/* Median line */}
          <Line
            type="monotone"
            dataKey="p50"
            stroke="#2ecc71"
            strokeWidth={2}
            dot={false}
            name="Median"
          />
          {initialPrice != null && (
            <ReferenceLine
              y={initialPrice}
              stroke="orange"
              strokeDasharray="4 4"
              label={{ value: 'Start Price', fill: 'orange', fontSize: 11 }}
            />
          )}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-component: Transition Matrix (D3 heatmap)
// ---------------------------------------------------------------------------

function TransitionMatrix({ tmValues, labels }) {
  const svgRef = useRef(null);

  useEffect(() => {
    if (!svgRef.current || !tmValues || tmValues.length === 0) return;

    const container = svgRef.current;
    d3.select(container).selectAll('*').remove();

    const containerWidth = container.clientWidth || 480;
    const margin = { top: 50, right: 40, bottom: 80, left: 100 };
    const n = tmValues.length;
    const availableWidth = containerWidth - margin.left - margin.right;
    const cellSize = Math.min(Math.floor(availableWidth / n), 70);
    const totalWidth = margin.left + n * cellSize + margin.right;
    const totalHeight = margin.top + n * cellSize + margin.bottom;

    const stateLabels = labels && labels.length === n ? labels : STATE_LABELS.slice(0, n);
    const colorScale = d3.scaleSequential(d3.interpolateBlues).domain([0, 1]);

    const svg = d3
      .select(container)
      .append('svg')
      .attr('width', '100%')
      .attr('height', totalHeight)
      .attr('viewBox', `0 0 ${totalWidth} ${totalHeight}`);

    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    // Draw cells
    tmValues.forEach((row, i) => {
      row.forEach((val, j) => {
        g.append('rect')
          .attr('x', j * cellSize)
          .attr('y', i * cellSize)
          .attr('width', cellSize)
          .attr('height', cellSize)
          .attr('fill', colorScale(val))
          .attr('stroke', '#2a2a3d')
          .attr('stroke-width', 1);

        g.append('text')
          .attr('x', j * cellSize + cellSize / 2)
          .attr('y', i * cellSize + cellSize / 2)
          .attr('text-anchor', 'middle')
          .attr('dominant-baseline', 'middle')
          .attr('fill', val > 0.55 ? 'white' : '#1a1a2e')
          .attr('font-size', Math.min(11, cellSize * 0.28))
          .text(val.toFixed(2));
      });
    });

    // X-axis labels (column headers — below matrix)
    stateLabels.forEach((label, j) => {
      g.append('text')
        .attr('x', j * cellSize + cellSize / 2)
        .attr('y', n * cellSize + 16)
        .attr('text-anchor', 'end')
        .attr('fill', '#aaa')
        .attr('font-size', 10)
        .attr('transform', `rotate(-40, ${j * cellSize + cellSize / 2}, ${n * cellSize + 16})`)
        .text(label);
    });

    // Y-axis labels (row headers — left)
    stateLabels.forEach((label, i) => {
      g.append('text')
        .attr('x', -8)
        .attr('y', i * cellSize + cellSize / 2)
        .attr('text-anchor', 'end')
        .attr('dominant-baseline', 'middle')
        .attr('fill', '#aaa')
        .attr('font-size', 10)
        .text(label);
    });

    // Column header label
    svg
      .append('text')
      .attr('x', margin.left + (n * cellSize) / 2)
      .attr('y', margin.top - 20)
      .attr('text-anchor', 'middle')
      .attr('fill', '#e0e0e0')
      .attr('font-size', 12)
      .attr('font-weight', 600)
      .text('Transition Matrix (Row = From-State, Column = To-State)');
  }, [tmValues, labels]);

  return (
    <div className="markov-chart-card">
      <div ref={svgRef} style={{ width: '100%' }} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-component: End Price Histogram
// ---------------------------------------------------------------------------

function EndPriceHistogram({ finalPrices, initialPrice, meanFinal, priceDistribution }) {
  const histData = useMemo(() => buildHistogram(finalPrices, 50), [finalPrices]);

  const directionColors = {
    bullish: '#2ecc71',
    bearish: '#e74c3c',
    neutral: '#f39c12',
  };
  const dirColor = directionColors[priceDistribution] || '#f39c12';

  return (
    <div className="markov-chart-card">
      <div className="markov-chart-title">
        End Price Distribution —{' '}
        <span style={{ color: dirColor, textTransform: 'uppercase' }}>
          {priceDistribution || 'N/A'}
        </span>
      </div>
      <ResponsiveContainer width="100%" height={320}>
        <BarChart data={histData} margin={{ top: 10, right: 20, bottom: 30, left: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#2a2a3d" />
          <XAxis
            dataKey="binCenter"
            tickFormatter={(v) => `$${v.toFixed(2)}`}
            tick={{ fill: '#aaa', fontSize: 10 }}
            label={{ value: 'End Price ($)', position: 'insideBottom', offset: -10, fill: '#aaa', fontSize: 11 }}
          />
          <YAxis
            label={{ value: 'Frequency', angle: -90, position: 'insideLeft', fill: '#aaa', fontSize: 11 }}
            tick={{ fill: '#aaa', fontSize: 11 }}
          />
          <Tooltip
            contentStyle={TOOLTIP_STYLE}
            formatter={(value, name) => [value, 'Count']}
            labelFormatter={(label) => `$${Number(label).toFixed(4)}`}
          />
          <Bar dataKey="count" fill="#2ecc71" opacity={0.8} name="Count" />
          {initialPrice != null && (
            <ReferenceLine
              x={initialPrice}
              stroke="orange"
              strokeDasharray="4 4"
              label={{ value: 'Start', fill: 'orange', fontSize: 11 }}
            />
          )}
          {meanFinal != null && (
            <ReferenceLine
              x={meanFinal}
              stroke="white"
              strokeWidth={1.5}
              label={{ value: 'Mean', fill: 'white', fontSize: 11 }}
            />
          )}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-component: Metrics Table
// ---------------------------------------------------------------------------

function MetricsTable({ data }) {
  const sim = data.simulation || {};
  const pcts = sim.percentiles || {};
  const priceDir = (sim.price_distribution || 'neutral').toLowerCase();

  const dirBadgeStyle = {
    bullish: {
      background: 'rgba(46,204,113,0.2)',
      color: '#2ecc71',
      border: '1px solid #2ecc71',
      padding: '2px 8px',
      borderRadius: 3,
      display: 'inline-block',
    },
    bearish: {
      background: 'rgba(231,76,60,0.2)',
      color: '#e74c3c',
      border: '1px solid #e74c3c',
      padding: '2px 8px',
      borderRadius: 3,
      display: 'inline-block',
    },
    neutral: {
      background: 'rgba(243,156,18,0.2)',
      color: '#f39c12',
      border: '1px solid #f39c12',
      padding: '2px 8px',
      borderRadius: 3,
      display: 'inline-block',
    },
  };
  const badgeStyle = dirBadgeStyle[priceDir] || dirBadgeStyle.neutral;

  const rows = [
    ['Start Price', data.initial_price != null ? `$${Number(data.initial_price).toFixed(4)}` : '—'],
    ['Mean End Price', sim.mean_final_price != null ? `$${Number(sim.mean_final_price).toFixed(4)}` : '—'],
    ['Std. Dev. End Price', sim.std_final_price != null ? `$${Number(sim.std_final_price).toFixed(4)}` : '—'],
    [
      '5th / 95th Percentile',
      pcts.p5 != null && pcts.p95 != null
        ? `$${Number(pcts.p5).toFixed(4)} / $${Number(pcts.p95).toFixed(4)}`
        : '—',
    ],
    [
      'Paths Above Start',
      sim.pct_paths_above_initial != null
        ? `${(Number(sim.pct_paths_above_initial) * 100).toFixed(1)}%`
        : '—',
    ],
    [
      'Price Direction',
      <span style={badgeStyle}>{priceDir.toUpperCase()}</span>,
    ],
    ['Avg. Wall Bounces/Path', sim.mean_bounces != null ? Number(sim.mean_bounces).toFixed(2) : '—'],
    ['Avg. Breakthroughs/Path', sim.mean_breakthroughs != null ? Number(sim.mean_breakthroughs).toFixed(2) : '—'],
    ['Bounce Rate', sim.bounce_rate != null ? Number(sim.bounce_rate).toFixed(4) : '—'],
    ['Simulation Paths', sim.n_paths != null ? sim.n_paths : '—'],
    ['Simulation Steps', sim.n_steps != null ? sim.n_steps : '—'],
    ['Token', data.token || '—'],
    ['Network', data.network || '—'],
    ['Snapshots Used', data.n_snapshots_used != null ? data.n_snapshots_used : '—'],
  ];

  const headerStyle = {
    background: '#2a2a3d',
    color: '#ffffff',
    fontWeight: 'bold',
    padding: '8px 12px',
    textAlign: 'left',
  };
  const cellStyle = {
    color: '#cccccc',
    padding: '8px 12px',
    textAlign: 'left',
    borderBottom: '1px solid #333',
  };

  return (
    <div className="markov-metrics-section">
      <div style={{ color: '#2ecc71', fontSize: 14, fontWeight: 600, marginBottom: 12 }}>
        Simulation Metrics
      </div>
      <table className="markov-metrics-table" style={{ width: '100%', maxWidth: 700, borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={headerStyle}>Metric</th>
            <th style={headerStyle}>Value</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(([metric, value], idx) => (
            <tr
              key={metric}
              style={{ background: idx % 2 === 0 ? '#1e1e2f' : '#242438' }}
            >
              <td style={cellStyle}>{metric}</td>
              <td style={cellStyle}>{value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

const MarkovSimulationPanel = ({ data, token, network }) => {
  const sim = data?.simulation || {};
  const priceDir = (sim.price_distribution || 'neutral').toLowerCase();
  const priceDistColor = { bullish: '#2ecc71', bearish: '#e74c3c', neutral: '#f39c12' };

  // transition_matrix from backend: { labels: [...], values: [[...], ...] }
  const tmData = data?.transition_matrix || {};
  const tmValues = tmData.values || [];
  const tmLabels = tmData.labels || STATE_LABELS;

  // price_fan from backend: { p5: [...], p25: [...], p50: [...], p75: [...], p95: [...] }
  const priceFan = data?.price_fan || {};

  // For the end-price histogram we reconstruct synthetic final prices from the percentile
  // data (backend does not return raw path endpoints). We generate a synthetic distribution
  // that matches the reported percentiles using linear interpolation between bands.
  const syntheticFinalPrices = useMemo(() => {
    const p5  = sim.percentiles?.p5;
    const p25 = sim.percentiles?.p25;
    const p50 = sim.percentiles?.p50;
    const p75 = sim.percentiles?.p75;
    const p95 = sim.percentiles?.p95;
    const nPaths = sim.n_paths || 300;

    if (p5 == null || p50 == null || p95 == null) return [];

    // Distribute nPaths samples proportionally across the percentile bands
    const counts = {
      below5:   Math.round(nPaths * 0.05),
      p5_p25:   Math.round(nPaths * 0.20),
      p25_p75:  Math.round(nPaths * 0.50),
      p75_p95:  Math.round(nPaths * 0.20),
      above95:  Math.round(nPaths * 0.05),
    };

    const lerp = (a, b, n) =>
      Array.from({ length: n }, (_, i) => a + (b - a) * (i / Math.max(n - 1, 1)));

    const low = p5 - (p95 - p5) * 0.05;
    const high = p95 + (p95 - p5) * 0.05;

    return [
      ...lerp(low,  p5,  counts.below5),
      ...lerp(p5,   p25 ?? p50, counts.p5_p25),
      ...lerp(p25 ?? p50, p75 ?? p50, counts.p25_p75),
      ...lerp(p75 ?? p50, p95, counts.p75_p95),
      ...lerp(p95, high, counts.above95),
    ];
  }, [sim]);

  if (!data) return null;

  return (
    <div className="markov-panel">
      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ color: '#2ecc71', fontSize: 18, fontWeight: 'bold', marginBottom: 4 }}>
          Markov Chain Simulation
        </div>
        <div style={{ color: '#aaa', fontSize: 13 }}>
          {token} on {network} — {data.n_snapshots_used || 0} snapshots collected
        </div>
      </div>

      {/* ROW 1: Fan Chart + Transition Matrix */}
      <div className="markov-chart-row">
        <div style={{ flex: '1 1 550px' }}>
          <FanChart
            priceFan={priceFan}
            initialPrice={data.initial_price}
            nPaths={sim.n_paths || 0}
            nSteps={sim.n_steps || 0}
          />
        </div>
        <div style={{ flex: '1 1 450px' }}>
          <TransitionMatrix tmValues={tmValues} labels={tmLabels} />
        </div>
      </div>

      {/* ROW 2: End Price Histogram */}
      <div className="markov-chart-row" style={{ marginTop: 20 }}>
        <div style={{ flex: '1 1 600px' }}>
          <EndPriceHistogram
            finalPrices={syntheticFinalPrices}
            initialPrice={data.initial_price}
            meanFinal={sim.mean_final_price}
            priceDistribution={priceDir}
          />
        </div>

        {/* Active Walls summary card */}
        {data.active_walls && data.active_walls.length > 0 && (
          <div style={{ flex: '1 1 400px' }}>
            <div className="markov-chart-card">
              <div className="markov-chart-title">Active Liquidity Walls</div>
              <div style={{ overflowY: 'auto', maxHeight: 300 }}>
                {data.active_walls.map((wall, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      padding: '6px 0',
                      borderBottom: '1px solid #2a2a3d',
                      fontSize: 12,
                      color: '#ccc',
                    }}
                  >
                    <span style={{ color: wall.side === 'bid' ? '#2ecc71' : '#e74c3c' }}>
                      {wall.side?.toUpperCase() || 'WALL'}
                    </span>
                    <span>${Number(wall.price_level).toFixed(4)}</span>
                    <span style={{ color: '#aaa' }}>
                      w={Number(wall.proximity_weight || 0).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ROW 3: Metrics Table */}
      <div style={{ marginTop: 20 }}>
        <MetricsTable data={data} />
      </div>
    </div>
  );
};

export default MarkovSimulationPanel;
