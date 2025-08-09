// components/charts/transaction-radar-chart.tsx
'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { useQuery } from '@tanstack/react-query';
import { fetchTransactionGraph } from '@/lib/api/transactionApi';
import { TransactionGraphResponse } from '@/lib/types/transaction';
import { WalletTypeEnum } from '@/lib/types/wallet';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { RefreshCw, ZoomIn, ZoomOut, Info } from 'lucide-react';

interface TransactionRadarChartProps {
  tokenAddress: string;
  chain: string;
}

const WALLET_TYPE_COLORS: Record<string, string> = {
  [WalletTypeEnum.DEV_WALLET]: '#FF6B6B',     // Rot
  [WalletTypeEnum.LIQUIDITY_WALLET]: '#4ECDC4', // Türkis
  [WalletTypeEnum.WHALE_WALLET]: '#45B7D1',   // Blau
  [WalletTypeEnum.DEX_CONTRACT]: '#FFD166',   // Gelb
  [WalletTypeEnum.BURN_WALLET]: '#9B5DE5',    // Lila
  [WalletTypeEnum.CEX_WALLET]: '#00BBF9',     // Hellblau
  [WalletTypeEnum.SNIPER_WALLET]: '#F15BB5',  // Pink
  [WalletTypeEnum.RUGPULL_SUSPECT]: '#EF476F', // Hellrot
  [WalletTypeEnum.UNKNOWN]: '#ADB5BD'        // Grau
};

const WALLET_TYPE_LABELS: Record<string, string> = {
  [WalletTypeEnum.DEV_WALLET]: 'Dev Wallet',
  [WalletTypeEnum.LIQUIDITY_WALLET]: 'Liquidity',
  [WalletTypeEnum.WHALE_WALLET]: 'Whale',
  [WalletTypeEnum.DEX_CONTRACT]: 'DEX',
  [WalletTypeEnum.BURN_WALLET]: 'Burn',
  [WalletTypeEnum.CEX_WALLET]: 'CEX',
  [WalletTypeEnum.SNIPER_WALLET]: 'Sniper',
  [WalletTypeEnum.RUGPULL_SUSPECT]: 'Suspect',
  [WalletTypeEnum.UNKNOWN]: 'Unknown'
};

export function TransactionRadarChart({ tokenAddress, chain }: TransactionRadarChartProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [selectedNode, setSelectedNode] = useState<any>(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [depth, setDepth] = useState(2);
  const [limit, setLimit] = useState(50);
  
  const { data: graphData, isLoading, error, refetch } = useQuery<TransactionGraphResponse>({
    queryKey: ['transactionGraph', tokenAddress, chain, depth, limit],
    queryFn: () => fetchTransactionGraph(tokenAddress, chain, depth, limit),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Transformiere die Graph-Daten in das für die Radar-Visualisierung benötigte Format
  const transformData = (data: TransactionGraphResponse) => {
    if (!data.nodes || !data.edges) return [];
    
    // Berechne das maximale Datum für die Normalisierung
    const maxTimestamp = Math.max(...data.nodes.map(node => 
      node.timestamp ? new Date(node.timestamp).getTime() : Date.now()
    ));
    
    const minTimestamp = Math.min(...data.nodes.map(node => 
      node.timestamp ? new Date(node.timestamp).getTime() : Date.now() - (30 * 24 * 60 * 60 * 1000)
    ));
    
    return data.nodes.map((node, index) => {
      // Bestimme den Wallet-Typ
      const walletType = node.type || WalletTypeEnum.UNKNOWN;
      
      // Berechne die Entfernung vom Zentrum basierend auf dem Zeitstempel
      const nodeTimestamp = node.timestamp ? new Date(node.timestamp).getTime() : Date.now();
      const timeRangeMs = maxTimestamp - minTimestamp;
      const timePosition = timeRangeMs > 0 ? (maxTimestamp - nodeTimestamp) / timeRangeMs : 0.5;
      const distance = 50 + timePosition * 150; // 50-200px vom Zentrum
      
      // Berechne den Winkel für die Position im Kreis
      const angle = (index / data.nodes.length) * 2 * Math.PI;
      
      // Bestimme die Transaktionsrichtung basierend auf den Kanten
      const transactionType = data.edges.find(edge => 
        edge.from === node.id || edge.to === node.id
      )?.value > 0 ? 'buy' : 'sell';
      
      return {
        id: node.id,
        address: node.id,
        type: walletType,
        balance: node.balance || 0,
        percentage: node.percentage || 0,
        riskScore: node.risk_score || 0,
        timestamp: nodeTimestamp,
        transactionType,
        distance,
        angle
      };
    });
  };

  useEffect(() => {
    if (!graphData || !svgRef.current) return;
    
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove(); // Clear previous content
    
    const width = 600;
    const height = 600;
    const centerX = width / 2;
    const centerY = height / 2;
    
    const walletNodes = transformData(graphData);
    
    // Erstelle die Hauptgruppe
    const g = svg.append("g")
      .attr("transform", `translate(${centerX}, ${centerY}) scale(${zoomLevel})`);
    
    // Zeichne die Zeitringe
    const timeRings = [50, 100, 150, 200];
    timeRings.forEach(radius => {
      g.append("circle")
        .attr("r", radius)
        .attr("fill", "none")
        .attr("stroke", "#E5E7EB")
        .attr("stroke-width", 1)
        .attr("stroke-dasharray", "5,5");
    });
    
    // Zeichne die Sektoren für verschiedene Wallet-Typen
    const walletTypes = Object.keys(WALLET_TYPE_COLORS);
    const sectorAngle = (2 * Math.PI) / walletTypes.length;
    
    walletTypes.forEach((type, i) => {
      const startAngle = i * sectorAngle;
      const endAngle = (i + 1) * sectorAngle;
      
      const arc = d3.arc()
        .innerRadius(50)
        .outerRadius(200)
        .startAngle(startAngle)
        .endAngle(endAngle);
      
      g.append("path")
        .attr("d", arc as any)
        .attr("fill", WALLET_TYPE_COLORS[type])
        .attr("fill-opacity", 0.1)
        .attr("stroke", WALLET_TYPE_COLORS[type])
        .attr("stroke-width", 1);
      
      // Füge Label für den Sektor hinzu
      const labelAngle = startAngle + sectorAngle / 2;
      const labelRadius = 220;
      const labelX = Math.cos(labelAngle) * labelRadius;
      const labelY = Math.sin(labelAngle) * labelRadius;
      
      g.append("text")
        .attr("x", labelX)
        .attr("y", labelY)
        .attr("text-anchor", "middle")
        .attr("dominant-baseline", "middle")
        .attr("font-size", "12px")
        .attr("fill", WALLET_TYPE_COLORS[type])
        .text(WALLET_TYPE_LABELS[type]);
    });
    
    // Zeichne den Token in der Mitte
    g.append("circle")
      .attr("r", 40)
      .attr("fill", "#00D4AA")
      .attr("stroke", "#fff")
      .attr("stroke-width", 3);
    
    g.append("text")
      .attr("text-anchor", "middle")
      .attr("dominant-baseline", "middle")
      .attr("font-size", "14px")
      .attr("fill", "white")
      .attr("font-weight", "bold")
      .text("TOKEN");
    
    // Zeichne die Wallet-Nodes
    const nodes = g.selectAll(".wallet-node")
      .data(walletNodes)
      .enter()
      .append("g")
      .attr("class", "wallet-node")
      .attr("transform", d => {
        const x = Math.cos(d.angle) * d.distance;
        const y = Math.sin(d.angle) * d.distance;
        return `translate(${x}, ${y})`;
      })
      .style("cursor", "pointer")
      .on("click", (event, d) => {
        setSelectedNode(d);
      })
      .on("mouseover", function(event, d) {
        d3.select(this).select("circle")
          .transition()
          .duration(200)
          .attr("r", 12);
        
        // Zeige Tooltip
        const tooltip = d3.select("body").append("div")
          .attr("class", "tooltip")
          .style("position", "absolute")
          .style("padding", "8px")
          .style("background", "rgba(0, 0, 0, 0.8)")
          .style("border-radius", "4px")
          .style("color", "white")
          .style("font-size", "12px")
          .style("pointer-events", "none")
          .style("opacity", 0);
        
        tooltip.transition()
          .duration(200)
          .style("opacity", 1);
        
        tooltip.html(`
          <div><strong>${WALLET_TYPE_LABELS[d.type]}</strong></div>
          <div>${d.address.substring(0, 6)}...${d.address.substring(d.address.length - 4)}</div>
          <div>Balance: ${d.balance.toFixed(2)}</div>
          <div>Risk Score: ${d.riskScore.toFixed(1)}</div>
        `)
          .style("left", (event.pageX + 10) + "px")
          .style("top", (event.pageY - 10) + "px");
      })
      .on("mouseout", function(event, d) {
        d3.select(this).select("circle")
          .transition()
          .duration(200)
          .attr("r", 8);
        
        d3.selectAll(".tooltip").remove();
      });
    
    // Füge Kreise für die Nodes hinzu
    nodes.append("circle")
      .attr("r", 8)
      .attr("fill", d => WALLET_TYPE_COLORS[d.type])
      .attr("stroke", d => d.transactionType === 'buy' ? '#10B981' : '#EF4444')
      .attr("stroke-width", 2);
    
    // Füge Verbindungslinien zum Zentrum hinzu
    g.selectAll(".connection-line")
      .data(walletNodes)
      .enter()
      .append("line")
      .attr("class", "connection-line")
      .attr("x1", 0)
      .attr("y1", 0)
      .attr("x2", d => Math.cos(d.angle) * d.distance)
      .attr("y2", d => Math.sin(d.angle) * d.distance)
      .attr("stroke", d => d.transactionType === 'buy' ? '#10B981' : '#EF4444')
      .attr("stroke-width", 1)
      .attr("stroke-opacity", 0.3);
    
    // Zoom-Funktionalität
    const zoom = d3.zoom()
      .scaleExtent([0.5, 3])
      .on("zoom", (event) => {
        g.attr("transform", `translate(${centerX}, ${centerY}) scale(${event.transform.k})`);
        setZoomLevel(event.transform.k);
      });
    
    svg.call(zoom as any);
    
  }, [graphData, zoomLevel]);

  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 0.2, 3));
  };

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 0.2, 0.5));
  };

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <Skeleton className="h-8 w-3/4" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-96 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full">
        <CardContent className="pt-6">
          <div className="text-center">
            <p className="text-danger">Fehler beim Laden der Transaktionsdaten</p>
            <Button variant="outline" className="mt-4" onClick={() => refetch()}>
              Erneut versuchen
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Transaktions-Radar</CardTitle>
          <div className="flex space-x-2">
            <div className="flex items-center space-x-1">
              <span className="text-sm">Tiefe:</span>
              <select 
                value={depth} 
                onChange={(e) => setDepth(Number(e.target.value))}
                className="border rounded px-2 py-1 text-sm"
              >
                <option value={1}>1</option>
                <option value={2}>2</option>
                <option value={3}>3</option>
                <option value={4}>4</option>
                <option value={5}>5</option>
              </select>
            </div>
            <div className="flex items-center space-x-1">
              <span className="text-sm">Limit:</span>
              <select 
                value={limit} 
                onChange={(e) => setLimit(Number(e.target.value))}
                className="border rounded px-2 py-1 text-sm"
              >
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
                <option value={200}>200</option>
              </select>
            </div>
            <Button variant="outline" size="icon" onClick={handleZoomIn}>
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={handleZoomOut}>
              <ZoomOut className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="flex-1">
            <div className="bg-neutral-50 dark:bg-neutral-800 rounded-lg p-4 flex justify-center">
              <svg
                ref={svgRef}
                width={600}
                height={600}
                className="overflow-visible"
              />
            </div>
          </div>
          
          <div className="lg:w-80">
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium mb-2">Wallet-Typen</h3>
                <div className="space-y-2">
                  {Object.entries(WALLET_TYPE_LABELS).map(([type, label]) => (
                    <div key={type} className="flex items-center">
                      <div
                        className="w-4 h-4 rounded-full mr-2"
                        style={{ backgroundColor: WALLET_TYPE_COLORS[type] }}
                      />
                      <span className="text-sm">{label}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              <div>
                <h3 className="text-sm font-medium mb-2">Transaktionsrichtung</h3>
                <div className="space-y-2">
                  <div className="flex items-center">
                    <div className="w-4 h-4 rounded-full mr-2 bg-success" />
                    <span className="text-sm">Kauf</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-4 h-4 rounded-full mr-2 bg-danger" />
                    <span className="text-sm">Verkauf</span>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="text-sm font-medium mb-2">Zeitringe</h3>
                <div className="space-y-2 text-sm text-neutral-600 dark:text-neutral-400">
                  <div>Innerer Ring: Frühe Transaktionen</div>
                  <div>Äußerer Ring: Späte Transaktionen</div>
                </div>
              </div>
              
              {selectedNode && (
                <div className="border border-neutral-200 dark:border-neutral-700 rounded-lg p-4">
                  <h3 className="font-medium mb-2">Wallet-Details</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-neutral-500 dark:text-neutral-400">Typ:</span>
                      <Badge style={{ backgroundColor: WALLET_TYPE_COLORS[selectedNode.type] }}>
                        {WALLET_TYPE_LABELS[selectedNode.type]}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-500 dark:text-neutral-400">Adresse:</span>
                      <span className="font-mono">
                        {selectedNode.address.substring(0, 6)}...{selectedNode.address.substring(selectedNode.address.length - 4)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-500 dark:text-neutral-400">Balance:</span>
                      <span>{selectedNode.balance.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-500 dark:text-neutral-400">Risiko-Score:</span>
                      <span>{selectedNode.riskScore.toFixed(1)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-500 dark:text-neutral-400">Transaktion:</span>
                      <Badge variant={selectedNode.transactionType === 'buy' ? 'default' : 'destructive'}>
                        {selectedNode.transactionType === 'buy' ? 'Kauf' : 'Verkauf'}
                      </Badge>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
