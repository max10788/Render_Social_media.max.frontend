/**
 * OrderbookHeatmapChart.js - Chart rendering logic for Orderbook Heatmap
 * Contains the D3.js-based multi-layout bookmap rendering
 */
import * as d3 from 'd3';
import { calculateLayoutConfig, bookmapColorScale } from './OrderbookHeatmapUtils';

/**
 * Render the multi-layout bookmap
 * @param {Object} params - Rendering parameters
 */
export const renderMultiLayoutBookmap = ({
  heatmapRef,
  tooltipRef,
  heatmapBuffer,
  currentPrice,
  priceHistory,
  dimensions,
  timeWindowSeconds,
  priceZoom,
  timeOffset,
  showMinimap,
  layoutMode,
  priceRangePercent,
  isDragging,
  mode,
  markovOverlay = null,
}) => {
  if (!heatmapRef.current || heatmapBuffer.length === 0) return;

  console.log(`Rendering multi-layout: ${layoutMode}`);

  d3.select(heatmapRef.current).selectAll('*').remove();

  const firstSnapshot = heatmapBuffer[0];
  const exchanges = firstSnapshot?.exchanges || [];

  // Calculate layout
  const layoutConfig = calculateLayoutConfig(exchanges, layoutMode);

  // Dimensions
  const margin = { top: 40, right: 120, bottom: 120, left: 100 };
  const containerWidth = dimensions.width - margin.left - margin.right;

  // Calculate heatmap dimensions based on layout
  const heatmapWidth = Math.floor(containerWidth / layoutConfig.cols);
  const heatmapHeight = layoutConfig.type === 'grid' ? 400 : 300;
  const heatmapSpacing = 20;
  const volumeHeight = 80;
  const minimapHeight = showMinimap ? 60 : 0;

  const totalWidth = (heatmapWidth * layoutConfig.cols) + (heatmapSpacing * (layoutConfig.cols - 1));
  const totalHeight = (heatmapHeight * layoutConfig.rows) + (heatmapSpacing * (layoutConfig.rows - 1)) + volumeHeight + minimapHeight;

  if (containerWidth <= 0 || totalHeight <= 0) return;

  const svg = d3
    .select(heatmapRef.current)
    .append('svg')
    .attr('width', dimensions.width)
    .attr('height', totalHeight + margin.top + margin.bottom)
    .style('background', '#050510')
    .style('cursor', isDragging ? 'grabbing' : 'grab');

  const defs = svg.append('defs');

  // Price levels
  const allPrices = new Set();
  heatmapBuffer.forEach((snapshot) => {
    if (snapshot.prices) {
      snapshot.prices.forEach((price) => allPrices.add(price));
    }
  });

  let sortedPrices = Array.from(allPrices).sort((a, b) => b - a);

  const MIN_PRICE_LEVELS = 50;
  if (sortedPrices.length < MIN_PRICE_LEVELS && sortedPrices.length > 0) {
    const minPrice = Math.min(...sortedPrices);
    const maxPrice = Math.max(...sortedPrices);
    const step = (maxPrice - minPrice) / (MIN_PRICE_LEVELS - 1);
    for (let i = 0; i < MIN_PRICE_LEVELS; i++) {
      const price = minPrice + (i * step);
      allPrices.add(Math.round(price * 100) / 100);
    }
    sortedPrices = Array.from(allPrices).sort((a, b) => b - a);
  }

  if (sortedPrices.length === 0) return;

  // Time & Price ranges
  const timeRange = heatmapBuffer.map((snap) => new Date(snap.timestamp));
  const maxTime = d3.max(timeRange);
  const timeWindowMs = timeWindowSeconds * 1000;
  const displayMaxTime = new Date(maxTime.getTime() - timeOffset);
  const displayMinTime = new Date(displayMaxTime.getTime() - timeWindowMs);

  // Future projection window: 38% extra so fan shares the same time axis as the heatmap
  const futureMs = markovOverlay?.price_fan ? Math.round(timeWindowMs * 38 / 62) : 0;

  // Use constant percentage range to prevent auto-zoom
  let displayMinPrice, displayMaxPrice;
  if (currentPrice) {
    const fixedRange = currentPrice * (priceRangePercent / 100) / priceZoom;
    displayMinPrice = currentPrice - fixedRange;
    displayMaxPrice = currentPrice + fixedRange;
  } else {
    const minPrice = d3.min(sortedPrices);
    const maxPrice = d3.max(sortedPrices);
    const priceRange = maxPrice - minPrice;
    const pricePadding = priceRange * 0.05 / priceZoom;
    displayMinPrice = minPrice - pricePadding;
    displayMaxPrice = maxPrice + pricePadding;
  }

  // Expand Y-axis to fully contain Markov fan (p5–p95) when overlay is active
  if (markovOverlay?.price_fan) {
    const p5arr  = markovOverlay.price_fan.p5  || [];
    const p95arr = markovOverlay.price_fan.p95 || [];
    const fanMin = Math.min(...p5arr.filter(v => v != null));
    const fanMax = Math.max(...p95arr.filter(v => v != null));
    if (!isNaN(fanMin) && isFinite(fanMin)) displayMinPrice = Math.min(displayMinPrice, fanMin);
    if (!isNaN(fanMax) && isFinite(fanMax)) displayMaxPrice = Math.max(displayMaxPrice, fanMax);
  }

  // Cell dimensions
  const minCellWidth = 10;
  const cellWidth = Math.max(heatmapWidth / 120, minCellWidth);
  const cellHeight = Math.max(heatmapHeight / sortedPrices.length, 3);

  // Color scale
  const maxLiquidity = d3.max(
    heatmapBuffer.flatMap((snap) =>
      snap.exchanges.flatMap((ex, i) => snap.matrix[i] || [])
    )
  ) || 1;

  // Tooltip
  let tooltip = d3.select('body').select('.heatmap-tooltip');
  if (tooltip.empty()) {
    tooltip = d3.select('body').append('div').attr('class', 'heatmap-tooltip').style('opacity', 0);
  }
  tooltipRef.current = tooltip;

  // Render each heatmap based on layout
  layoutConfig.heatmaps.forEach((heatmapConfig, heatmapIdx) => {
    const xOffset = heatmapConfig.col * (heatmapWidth + heatmapSpacing);
    const yOffset = heatmapConfig.row * (heatmapHeight + heatmapSpacing);

    // Adjust width for grid items
    const actualWidth = heatmapConfig.width === 1
      ? containerWidth
      : Math.floor(heatmapWidth * heatmapConfig.width) - heatmapSpacing / 2;

    const heatmapGroup = svg
      .append('g')
      .attr('transform', `translate(${margin.left + xOffset}, ${margin.top + yOffset})`);

    // Title
    heatmapGroup
      .append('text')
      .attr('x', actualWidth / 2)
      .attr('y', -15)
      .attr('text-anchor', 'middle')
      .style('fill', heatmapConfig.isCombined ? '#7e58f5' : '#64748b')
      .style('font-size', heatmapConfig.isCombined ? '15px' : '13px')
      .style('font-weight', heatmapConfig.isCombined ? '700' : '600')
      .text(heatmapConfig.name);

    // Scales — extend time domain to include Markov future zone so both share one axis
    const domainMaxTime = futureMs > 0
      ? new Date(Math.max(displayMaxTime.getTime(), maxTime.getTime() + futureMs))
      : displayMaxTime;
    const xScale = d3.scaleTime().domain([displayMinTime, domainMaxTime]).range([0, actualWidth]);
    const yScale = d3.scaleLinear().domain([displayMinPrice, displayMaxPrice]).range([heatmapHeight, 0]);

    // Grid lines
    const gridTicks = xScale.ticks(8);
    gridTicks.forEach(tick => {
      heatmapGroup.append('line')
        .attr('x1', xScale(tick)).attr('x2', xScale(tick))
        .attr('y1', 0).attr('y2', heatmapHeight)
        .style('stroke', '#1e293b').style('stroke-width', 1)
        .style('stroke-dasharray', '2,4').style('opacity', 0.2);
    });

    // Draw heatmap cells
    heatmapBuffer.forEach((snapshot) => {
      const time = new Date(snapshot.timestamp);
      if (time < displayMinTime || time > displayMaxTime) return;

      const x = xScale(time) - cellWidth / 2;
      const priceToIndex = new Map();
      snapshot.prices.forEach((price, idx) => priceToIndex.set(price, idx));

      sortedPrices.forEach((price) => {
        if (price < displayMinPrice || price > displayMaxPrice) return;
        const priceIdx = priceToIndex.get(price);
        if (priceIdx === undefined) return;

        let totalLiquidity = 0;
        const liquidityBreakdown = {};

        if (heatmapConfig.isCombined) {
          snapshot.exchanges.forEach((exchange, exIdx) => {
            const matrix = snapshot.matrix[exIdx] || [];
            const exchangeLiquidity = matrix[priceIdx] || 0;
            totalLiquidity += exchangeLiquidity;
            if (exchangeLiquidity > 0) liquidityBreakdown[exchange] = exchangeLiquidity;
          });
        } else {
          const exchangeName = heatmapConfig.exchanges[0];
          const exIdx = snapshot.exchanges.indexOf(exchangeName);
          if (exIdx !== -1) {
            const matrix = snapshot.matrix[exIdx] || [];
            totalLiquidity = matrix[priceIdx] || 0;
            liquidityBreakdown[exchangeName] = totalLiquidity;
          }
        }

        const y = yScale(price) - cellHeight / 2;
        if (x < -cellWidth || x > actualWidth + cellWidth || y < -cellHeight || y > heatmapHeight + cellHeight) return;

        heatmapGroup.append('rect')
          .attr('x', x).attr('y', y)
          .attr('width', cellWidth + 1).attr('height', cellHeight + 1)
          .style('fill', bookmapColorScale(totalLiquidity, maxLiquidity))
          .style('stroke', totalLiquidity > 0 ? '#1e293b' : 'none')
          .style('stroke-width', 0.5).style('opacity', 1)
          .on('mouseover', function (event) {
            d3.select(this).style('stroke', '#7e58f5').style('stroke-width', 2);
            const breakdownHtml = Object.entries(liquidityBreakdown)
              .map(([exchange, liq]) => {
                const percentage = heatmapConfig.isCombined && totalLiquidity > 0
                  ? ` (${((liq / totalLiquidity) * 100).toFixed(1)}%)`
                  : '';
                return `<span style="color: #64748b;">${exchange}:</span> ${liq.toFixed(2)}${percentage}`;
              }).join('<br/>');

            const title = heatmapConfig.isCombined ? 'Combined Liquidity' : heatmapConfig.exchanges[0].toUpperCase();
            tooltip.style('opacity', 0.95).html(`
              <strong style="color: #7e58f5;">${title}</strong><br/>
              <div style="border-bottom: 1px solid #334155; margin: 4px 0;"></div>
              Time: ${time.toLocaleTimeString()}<br/>
              Price: $${price.toLocaleString()}<br/>
              <strong>Total: ${totalLiquidity.toFixed(2)} ${mode === 'dex' ? 'Tokens' : 'BTC'}</strong>
              ${heatmapConfig.isCombined && Object.keys(liquidityBreakdown).length > 1 ? `
              <div style="border-bottom: 1px solid #334155; margin: 4px 0;"></div>
              <div style="font-size: 11px;">${breakdownHtml}</div>` : ''}
            `).style('left', (event.pageX + 10) + 'px').style('top', (event.pageY - 28) + 'px');
          })
          .on('mousemove', function(event) {
            tooltip.style('left', (event.pageX + 10) + 'px').style('top', (event.pageY - 28) + 'px');
          })
          .on('mouseout', function () {
            d3.select(this).style('stroke', totalLiquidity > 0 ? '#1e293b' : 'none').style('stroke-width', 0.5);
            tooltip.style('opacity', 0);
          });
      });
    });

    // Price line (only on combined)
    if (heatmapConfig.isCombined && priceHistory && priceHistory.length > 2) {
      const visiblePriceHistory = priceHistory.filter(point => {
        const time = new Date(point.timestamp);
        return time >= displayMinTime && time <= displayMaxTime;
      });

      if (visiblePriceHistory.length > 1) {
        const priceLineGradient = defs.append('linearGradient')
          .attr('id', `price-line-gradient-${heatmapIdx}`)
          .attr('x1', '0%').attr('y1', '0%').attr('x2', '0%').attr('y2', '100%');
        priceLineGradient.append('stop').attr('offset', '0%').attr('stop-color', '#22c55e').attr('stop-opacity', 0.8);
        priceLineGradient.append('stop').attr('offset', '100%').attr('stop-color', '#0ea5e9').attr('stop-opacity', 0.3);

        const areaGradient = defs.append('linearGradient')
          .attr('id', `price-area-gradient-${heatmapIdx}`)
          .attr('x1', '0%').attr('y1', '0%').attr('x2', '0%').attr('y2', '100%');
        areaGradient.append('stop').attr('offset', '0%').attr('stop-color', '#22c55e').attr('stop-opacity', 0.3);
        areaGradient.append('stop').attr('offset', '100%').attr('stop-color', '#0ea5e9').attr('stop-opacity', 0.05);

        const line = d3.line()
          .x(d => xScale(new Date(d.timestamp)))
          .y(d => {
            const price = d.price;
            return yScale(price < displayMinPrice || price > displayMaxPrice
              ? Math.max(displayMinPrice, Math.min(displayMaxPrice, price))
              : price);
          })
          .curve(d3.curveMonotoneX);

        const area = d3.area()
          .x(d => xScale(new Date(d.timestamp)))
          .y0(heatmapHeight)
          .y1(d => {
            const price = d.price;
            return yScale(price < displayMinPrice || price > displayMaxPrice
              ? Math.max(displayMinPrice, Math.min(displayMaxPrice, price))
              : price);
          })
          .curve(d3.curveMonotoneX);

        heatmapGroup.append('path').datum(visiblePriceHistory).attr('d', area)
          .style('fill', `url(#price-area-gradient-${heatmapIdx})`).style('opacity', 0.6);
        heatmapGroup.append('path').datum(visiblePriceHistory).attr('d', line)
          .style('fill', 'none').style('stroke', '#22c55e').style('stroke-width', 6)
          .style('opacity', 0.3).style('filter', 'blur(4px)');
        heatmapGroup.append('path').datum(visiblePriceHistory).attr('d', line)
          .style('fill', 'none').style('stroke', `url(#price-line-gradient-${heatmapIdx})`)
          .style('stroke-width', 2.5).style('opacity', 0.9);

        visiblePriceHistory.forEach((point, idx) => {
          if (idx % 5 === 0 || idx === visiblePriceHistory.length - 1) {
            const time = new Date(point.timestamp);
            const price = point.price;
            if (price >= displayMinPrice && price <= displayMaxPrice) {
              heatmapGroup.append('circle')
                .attr('cx', xScale(time)).attr('cy', yScale(price)).attr('r', 3)
                .style('fill', '#22c55e').style('stroke', '#050510')
                .style('stroke-width', 1.5).style('opacity', 0.8);
            }
          }
        });
      }
    }

    // Current price line (on combined)
    if (heatmapConfig.isCombined && currentPrice && currentPrice >= displayMinPrice && currentPrice <= displayMaxPrice) {
      const priceY = yScale(currentPrice);

      const glowLine = heatmapGroup.append('line')
        .attr('x1', 0).attr('x2', actualWidth).attr('y1', priceY).attr('y2', priceY)
        .style('stroke', '#fbbf24').style('stroke-width', 8)
        .style('opacity', 0.2).style('filter', 'blur(6px)');

      function pulse() {
        glowLine.transition().duration(1200).ease(d3.easeSinInOut).style('opacity', 0.05)
          .transition().duration(1200).style('opacity', 0.2).on('end', pulse);
      }
      pulse();

      const currentPriceGradient = defs.append('linearGradient')
        .attr('id', `current-price-gradient-${heatmapIdx}`)
        .attr('x1', '0%').attr('x2', '100%');
      currentPriceGradient.append('stop').attr('offset', '0%').attr('stop-color', '#fbbf24').attr('stop-opacity', 0.3);
      currentPriceGradient.append('stop').attr('offset', '50%').attr('stop-color', '#fbbf24').attr('stop-opacity', 1);
      currentPriceGradient.append('stop').attr('offset', '100%').attr('stop-color', '#f97316').attr('stop-opacity', 0.3);

      heatmapGroup.append('line')
        .attr('x1', 0).attr('x2', actualWidth).attr('y1', priceY).attr('y2', priceY)
        .style('stroke', `url(#current-price-gradient-${heatmapIdx})`)
        .style('stroke-width', 2.5).style('opacity', 0.9);

      const labelGroup = heatmapGroup.append('g');
      const priceText = `$${currentPrice.toFixed(2)}`;
      const text = labelGroup.append('text')
        .attr('x', actualWidth + 12).attr('y', priceY + 5)
        .style('font-size', '13px').style('font-weight', '700')
        .style('fill', '#ffffff').text(priceText);

      const bbox = text.node().getBBox();
      labelGroup.insert('rect', 'text')
        .attr('x', bbox.x - 6).attr('y', bbox.y - 3)
        .attr('width', bbox.width + 12).attr('height', bbox.height + 6).attr('rx', 6)
        .style('fill', '#fbbf24').style('stroke', '#f97316').style('stroke-width', 2)
        .style('filter', 'drop-shadow(0 0 8px rgba(251, 191, 36, 0.5))');
    }

    // Draw Markov Overlay — Fan Chart (Simulation Paths)
    if (markovOverlay && markovOverlay.price_fan) {
      const fanVals = markovOverlay.price_fan;
      const p5arr  = fanVals.p5  || [];
      const p25arr = fanVals.p25 || [];
      const p50arr = fanVals.p50 || [];
      const p75arr = fanVals.p75 || [];
      const p95arr = fanVals.p95 || [];
      const nSteps = p50arr.length;

      if (nSteps > 1) {
        // Build step-by-step fan data, clamping to visible price range
        const clamp = v => v != null ? Math.max(displayMinPrice, Math.min(displayMaxPrice, v)) : null;
        const fanData = Array.from({ length: nSteps }, (_, i) => ({
          step: i,
          p5:  p5arr[i]  != null ? p5arr[i]  : null,
          p25: p25arr[i] != null ? p25arr[i] : null,
          p50: p50arr[i] != null ? p50arr[i] : null,
          p75: p75arr[i] != null ? p75arr[i] : null,
          p95: p95arr[i] != null ? p95arr[i] : null,
        })).filter(d => d.p50 != null);

        // Guard: draw overlay as long as the fan overlaps the visible price window at all.
        // Using the full p5–p95 extent so zooming in doesn't hide the overlay prematurely.
        const fanMin = Math.min(...p5arr.filter(v => v != null));
        const fanMax = Math.max(...p95arr.filter(v => v != null));
        const fanOverlapsView = !isNaN(fanMin) && !isNaN(fanMax)
          && fanMax > displayMinPrice && fanMin < displayMaxPrice;
        if (fanOverlapsView) {
          const overlayG = heatmapGroup.append('g').attr('class', 'markov-overlay');

          // Fan anchored to "now" on the shared time axis — moves with scroll
          const nowX = Math.max(0, Math.min(actualWidth, xScale(maxTime)));
          const fanStartX = nowX;
          const fanPixelWidth = actualWidth - nowX;
          const xFn = i => fanStartX + (i / Math.max(nSteps - 1, 1)) * fanPixelWidth;

          // D3 area / line generators
          const outerArea = d3.area()
            .x(d => xFn(d.step))
            .y0(d => yScale(clamp(d.p5  ?? d.p50)))
            .y1(d => yScale(clamp(d.p95 ?? d.p50)))
            .curve(d3.curveMonotoneX);

          const innerArea = d3.area()
            .x(d => xFn(d.step))
            .y0(d => yScale(clamp(d.p25 ?? d.p50)))
            .y1(d => yScale(clamp(d.p75 ?? d.p50)))
            .curve(d3.curveMonotoneX);

          const medianLine = d3.line()
            .x(d => xFn(d.step))
            .y(d => yScale(clamp(d.p50)))
            .curve(d3.curveMonotoneX);

          const iqrBoundLine = side => d3.line()
            .x(d => xFn(d.step))
            .y(d => yScale(clamp(side === 'p25' ? (d.p25 ?? d.p50) : (d.p75 ?? d.p50))))
            .curve(d3.curveMonotoneX);

          // ── Shaded future zone background ────────────────────────────────
          if (fanPixelWidth > 0) {
            overlayG.append('rect')
              .attr('x', fanStartX).attr('y', 0)
              .attr('width', fanPixelWidth).attr('height', heatmapHeight)
              .attr('fill', 'rgba(14, 25, 50, 0.45)')
              .attr('pointer-events', 'none');
          }

          // ── "NOW" separator — bright vertical line ────────────────────────
          overlayG.append('line')
            .attr('x1', fanStartX).attr('x2', fanStartX)
            .attr('y1', 0).attr('y2', heatmapHeight)
            .attr('stroke', 'rgba(255,255,255,0.60)')
            .attr('stroke-width', 1.5)
            .attr('stroke-dasharray', '4 3')
            .attr('pointer-events', 'none');
          overlayG.append('text')
            .attr('x', fanStartX + 5).attr('y', 14)
            .attr('fill', 'rgba(255,255,255,0.70)').attr('font-size', 9).attr('font-weight', '600')
            .attr('pointer-events', 'none')
            .text('NOW →');

          // ── Outer band 5–95%: blue (uncertainty range) ───────────────────
          overlayG.append('path')
            .datum(fanData)
            .attr('d', outerArea)
            .attr('fill', 'rgba(59, 130, 246, 0.18)')
            .attr('pointer-events', 'none')
            .attr('class', 'markov-band-outer');

          // ── Inner band 25–75%: amber (interquartile / high-confidence) ────
          overlayG.append('path')
            .datum(fanData)
            .attr('d', innerArea)
            .attr('fill', 'rgba(251, 191, 36, 0.28)')
            .attr('pointer-events', 'none')
            .attr('class', 'markov-band-inner');

          // ── IQR boundary lines (p25 / p75) dashed amber ──────────────────
          ['p25', 'p75'].forEach(side => {
            overlayG.append('path')
              .datum(fanData)
              .attr('d', iqrBoundLine(side)(fanData))
              .attr('fill', 'none')
              .attr('stroke', 'rgba(251, 191, 36, 0.70)')
              .attr('stroke-width', 1)
              .attr('stroke-dasharray', '3 3')
              .attr('pointer-events', 'none');
          });

          // ── Median glow + line: bright cyan ──────────────────────────────
          overlayG.append('path')
            .datum(fanData)
            .attr('d', medianLine(fanData))
            .attr('fill', 'none')
            .attr('stroke', '#00e5ff')
            .attr('stroke-width', 5)
            .attr('opacity', 0.18)
            .style('filter', 'blur(3px)')
            .attr('pointer-events', 'none');
          overlayG.append('path')
            .datum(fanData)
            .attr('d', medianLine(fanData))
            .attr('fill', 'none')
            .attr('stroke', '#00e5ff')
            .attr('stroke-width', 1.8)
            .attr('opacity', 0.95)
            .attr('pointer-events', 'none')
            .attr('class', 'markov-median');

          // ── Initial price reference ───────────────────────────────────────
          const initP = markovOverlay.initial_price;
          if (initP != null && initP >= displayMinPrice && initP <= displayMaxPrice) {
            const initY = yScale(initP);
            overlayG.append('line')
              .attr('x1', fanStartX).attr('x2', actualWidth)
              .attr('y1', initY).attr('y2', initY)
              .attr('stroke', '#f97316').attr('stroke-width', 1.2)
              .attr('stroke-dasharray', '5 4').attr('opacity', 0.85)
              .attr('pointer-events', 'none');
            overlayG.append('text')
              .attr('x', fanStartX + 5).attr('y', initY - 4)
              .attr('fill', '#f97316').attr('font-size', 9).attr('font-weight', '600')
              .attr('opacity', 0.90)
              .attr('pointer-events', 'none')
              .text('entry');
          }

          // ── Right-edge percentile labels ─────────────────────────────────
          const last = fanData[fanData.length - 1];
          [
            { val: last.p95, label: '95%', color: '#60a5fa' },
            { val: last.p75, label: '75%', color: '#fbbf24' },
            { val: last.p50, label: '50%', color: '#00e5ff' },
            { val: last.p25, label: '25%', color: '#fbbf24' },
            { val: last.p5,  label: '5%',  color: '#60a5fa' },
          ].forEach(({ val, label, color }) => {
            if (val == null || val <= displayMinPrice || val >= displayMaxPrice) return;
            overlayG.append('text')
              .attr('x', actualWidth - 3).attr('y', yScale(val) - 3)
              .attr('text-anchor', 'end').attr('fill', color)
              .attr('font-size', 8).attr('font-weight', '600').attr('opacity', 0.9)
              .attr('pointer-events', 'none')
              .text(`${label} $${val.toFixed(4)}`);
          });

          // ── Active wall markers: thicker, more opaque ────────────────────
          (markovOverlay.active_walls || []).forEach(wall => {
            const wy = yScale(wall.price);
            if (wy < 0 || wy > heatmapHeight) return;
            const wallColor   = wall.side === 'bid' ? '#38bdf8' : '#f87171';
            const wallOpacity = Math.min(0.95, 0.55 + (wall.proximity_weight || 0) * 0.4);
            overlayG.append('line')
              .attr('x1', 0).attr('x2', actualWidth)
              .attr('y1', wy).attr('y2', wy)
              .attr('stroke', wallColor).attr('stroke-width', 1.5)
              .attr('stroke-dasharray', '4 3').attr('opacity', wallOpacity)
              .attr('pointer-events', 'none')
              .attr('class', 'markov-wall');
            overlayG.append('text')
              .attr('x', 5).attr('y', wy - 3)
              .attr('fill', wallColor).attr('font-size', 9).attr('font-weight', '600')
              .attr('opacity', wallOpacity).attr('pointer-events', 'none')
              .text(`${wall.side.toUpperCase()} $${wall.price.toFixed(4)}`);
          });

          // ── MARKOV LIVE badge ─────────────────────────────────────────────
          overlayG.append('rect')
            .attr('x', fanStartX + 5).attr('y', 20)
            .attr('width', 88).attr('height', 15).attr('rx', 3)
            .attr('fill', 'rgba(0, 229, 255, 0.12)')
            .attr('stroke', '#00e5ff').attr('stroke-width', 0.8)
            .attr('pointer-events', 'none');
          overlayG.append('text')
            .attr('x', fanStartX + 49).attr('y', 30)
            .attr('text-anchor', 'middle')
            .attr('fill', '#00e5ff').attr('font-size', 9).attr('font-weight', 'bold')
            .attr('pointer-events', 'none')
            .text('MARKOV LIVE');
        }
      }
    }

    // Y-axis
    const yAxis = d3.axisLeft(yScale).ticks(8).tickFormat((d) => {
      const abs = Math.abs(d);
      if (abs < 0.001)  return `$${d.toFixed(5)}`;
      if (abs < 0.01)   return `$${d.toFixed(4)}`;
      if (abs < 1)      return `$${d.toFixed(3)}`;
      if (abs < 1000)   return `$${d.toFixed(2)}`;
      return `$${Math.round(d).toLocaleString()}`;
    });
    heatmapGroup.append('g').call(yAxis).selectAll('text')
      .style('fill', '#64748b').style('font-size', '10px');
    heatmapGroup.selectAll('.domain, .tick line').style('stroke', '#334155');

    // X-axis (only on bottom row)
    if (heatmapConfig.row === layoutConfig.rows - 1) {
      const xAxis = d3.axisBottom(xScale).ticks(8).tickFormat(d3.timeFormat('%H:%M:%S'));
      svg.append('g')
        .attr('transform', `translate(${margin.left + xOffset}, ${margin.top + yOffset + heatmapHeight})`)
        .call(xAxis).selectAll('text')
        .style('fill', '#64748b').style('font-size', '10px')
        .attr('transform', 'rotate(-45)').style('text-anchor', 'end');
      svg.selectAll('.domain, .tick line').style('stroke', '#334155');
    }
  });

  console.log(`Multi-layout render complete: ${layoutConfig.heatmaps.length} heatmaps in ${layoutMode} mode`);
};

export default {
  renderMultiLayoutBookmap,
};
