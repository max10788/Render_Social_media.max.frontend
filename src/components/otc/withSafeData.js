// src/components/OTC/withSafeData.jsx
// HOC für sicheres Data Handling - Pure React + Tailwind

import React from 'react';
import EmptyState from './EmptyState';

/**
 * HOC: Wraps OTC components with safe data handling
 * 
 * Usage:
 *   export default withSafeData(NetworkGraph, {
 *     requiredFields: ['nodes', 'edges'],
 *     emptyMessage: 'No network data',
 *     type: 'network'
 *   });
 */
export const withSafeData = (Component, options = {}) => {
  const {
    requiredFields = ['data'],
    emptyMessage = 'No data available',
    emptyType = 'default',
    height = 'h-64'
  } = options;

  return function SafeDataWrapper(props) {
    const { data, ...otherProps } = props;

    // Check if data exists
    if (!data) {
      return (
        <EmptyState 
          type={emptyType}
          message={emptyMessage}
          height={height}
        />
      );
    }

    // Check required fields
    const missingFields = requiredFields.filter(field => {
      if (Array.isArray(data[field])) {
        return data[field].length === 0;
      }
      return !data[field];
    });

    if (missingFields.length > 0) {
      return (
        <EmptyState 
          type={emptyType}
          message={emptyMessage}
          subtitle="Waiting for data to load..."
          height={height}
        />
      );
    }

    // Data is valid, render component
    return <Component data={data} {...otherProps} />;
  };
};

/**
 * Universal safety check utility
 * Use inside components for inline safety checks
 */
export const isSafeData = (data, requiredFields = []) => {
  if (!data) return false;
  
  for (const field of requiredFields) {
    if (Array.isArray(data[field])) {
      if (data[field].length === 0) return false;
    } else {
      if (!data[field]) return false;
    }
  }
  
  return true;
};

/**
 * Safe array operations
 */
export const safeArray = (arr, defaultValue = []) => {
  return Array.isArray(arr) ? arr : defaultValue;
};

export const safeMax = (arr, defaultValue = 1) => {
  if (!Array.isArray(arr) || arr.length === 0) return defaultValue;
  const numbers = arr.filter(n => typeof n === 'number' && !isNaN(n));
  return numbers.length > 0 ? Math.max(...numbers) : defaultValue;
};

export const safeLength = (value, defaultValue = 0) => {
  if (typeof value === 'number' && !isNaN(value)) return value;
  if (Array.isArray(value)) return value.length;
  if (typeof value === 'object' && value !== null) return Object.keys(value).length;
  return defaultValue;
};

export default withSafeData;
