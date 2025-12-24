// src/components/OTC/EmptyState.jsx

import React from 'react';
import { AlertCircle, Database, Network, TrendingUp, Clock } from 'lucide-react';
import { Card, CardContent } from '../ui/card';

/**
 * Reusable Empty State Component for OTC Dashboard
 * 
 * Usage:
 *   <EmptyState />
 *   <EmptyState message="No transactions found" />
 *   <EmptyState type="network" message="No network data" />
 */
const EmptyState = ({ 
  type = 'default',
  message = 'No data available',
  subtitle = 'Data will appear here once loaded',
  height = 'h-64'
}) => {
  // Icon mapping
  const icons = {
    default: AlertCircle,
    network: Network,
    chart: TrendingUp,
    time: Clock,
    database: Database
  };

  const Icon = icons[type] || icons.default;

  return (
    <Card className="w-full">
      <CardContent className={`${height} flex items-center justify-center`}>
        <div className="text-center text-gray-500">
          <Icon className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p className="text-lg font-medium">{message}</p>
          {subtitle && (
            <p className="text-sm mt-2 text-gray-400">{subtitle}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default EmptyState;
