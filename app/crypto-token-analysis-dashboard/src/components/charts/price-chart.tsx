'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchTokenPriceHistory } from '@/lib/api/tokenApi';
import { TokenPriceHistory } from '@/lib/types/token';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Brush,
} from 'recharts';

interface PriceChartProps {
  tokenAddress: string;
}

const timeRanges = [
  { label: '24h', value: '24h' },
  { label: '7d', value: '7d' },
  { label: '30d', value: '30d' },
  { label: '90d', value: '90d' },
  { label: '1y', value: '1y' },
];

export function PriceChart({ tokenAddress }: PriceChartProps) {
  const [timeRange, setTimeRange] = useState('24h');

  const { data: priceHistory, isLoading, error } = useQuery<TokenPriceHistory[]>({
    queryKey: ['tokenPriceHistory', tokenAddress, timeRange],
    queryFn: () => fetchTokenPriceHistory(tokenAddress, timeRange),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <Skeleton className="h-8 w-3/4" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-80 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full">
        <CardContent className="pt-6">
          <div className="text-center">
            <p className="text-danger">Fehler beim Laden der Preisdaten</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!priceHistory || priceHistory.length === 0) {
    return (
      <Card className="w-full">
        <CardContent className="pt-6">
          <div className="text-center">
            <p>Keine Preisdaten verfügbar</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const formatChartData = (data: TokenPriceHistory[]) => {
    return data.map((item) => ({
      timestamp: new Date(item.timestamp * 1000).toLocaleDateString(),
      price: item.price,
      volume: item.volume,
    }));
  };

  const chartData = formatChartData(priceHistory);

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Preisverlauf</CardTitle>
          <div className="flex space-x-2">
            {timeRanges.map((range) => (
              <Button
                key={range.value}
                variant={timeRange === range.value ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTimeRange(range.value)}
              >
                {range.label}
              </Button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{
                top: 5,
                right: 30,
                left: 20,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="timestamp" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="price"
                stroke="#00D4AA"
                activeDot={{ r: 8 }}
                name="Preis"
              />
              <Line
                type="monotone"
                dataKey="volume"
                stroke="#8884d8"
                name="Volumen"
                yAxisId="right"
              />
              <Brush dataKey="timestamp" height={30} stroke="#8884d8" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
