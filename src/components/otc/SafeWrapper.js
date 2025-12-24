// src/components/OTC/SafeWrapper.jsx
// Super einfacher Wrapper - Copy-Paste in JEDEN Component!

import React from 'react';
import { AlertCircle } from 'lucide-react';

/**
 * EINFACHSTE LÖSUNG - Wrap jeden Component damit!
 * 
 * Usage in JEDEM OTC Component:
 * 
 * // AM ANFANG DES COMPONENTS:
 * import SafeWrapper from '../SafeWrapper';
 * 
 * const YourComponent = ({ data, ...props }) => {
 *   return (
 *     <SafeWrapper data={data} requiredFields={['nodes', 'edges']}>
 *       {(safeData) => (
 *         // Dein normaler Component Code hier
 *         <div>
 *           {safeData.nodes.map(...)}
 *         </div>
 *       )}
 *     </SafeWrapper>
 *   );
 * };
 */
const SafeWrapper = ({ 
  data, 
  children, 
  requiredFields = [],
  emptyMessage = 'No data available',
  className = ''
}) => {
  // Check if data exists
  if (!data) {
    return (
      <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className}`}>
        <div className="h-64 flex items-center justify-center p-6">
          <div className="text-center text-gray-500">
            <AlertCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium text-gray-700">{emptyMessage}</p>
            <p className="text-sm mt-2 text-gray-400">Data will appear here once loaded</p>
          </div>
        </div>
      </div>
    );
  }

  // Check required fields
  for (const field of requiredFields) {
    if (Array.isArray(data[field])) {
      if (!data[field] || data[field].length === 0) {
        return (
          <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className}`}>
            <div className="h-64 flex items-center justify-center p-6">
              <div className="text-center text-gray-500">
                <AlertCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium text-gray-700">{emptyMessage}</p>
                <p className="text-sm mt-2 text-gray-400">No {field} available</p>
              </div>
            </div>
          </div>
        );
      }
    } else {
      if (!data[field]) {
        return (
          <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className}`}>
            <div className="h-64 flex items-center justify-center p-6">
              <div className="text-center text-gray-500">
                <AlertCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium text-gray-700">{emptyMessage}</p>
                <p className="text-sm mt-2 text-gray-400">Missing {field}</p>
              </div>
            </div>
          </div>
        );
      }
    }
  }

  // Data is safe, render children with data
  return children(data);
};

export default SafeWrapper;

/**
 * ALTERNATIVE: Inline Safety Check
 * 
 * Füge diese Funktion am Anfang JEDES Components ein:
 */
export const checkSafeData = (data, requiredFields = []) => {
  if (!data) return false;
  
  for (const field of requiredFields) {
    if (Array.isArray(data[field])) {
      if (!data[field] || data[field].length === 0) return false;
    } else {
      if (!data[field]) return false;
    }
  }
  
  return true;
};

/**
 * SIMPLEST USAGE - Copy-Paste in jeden Component:
 * 
 * const NetworkGraph = ({ data }) => {
 *   // ✅ ADD THIS CHECK AT THE START
 *   if (!data || !data.nodes || data.nodes.length === 0) {
 *     return (
 *       <div className="bg-white rounded-lg shadow-sm border border-gray-200">
 *         <div className="h-64 flex items-center justify-center p-6 text-center text-gray-500">
 *           <div>
 *             <p className="text-lg font-medium">No network data</p>
 *             <p className="text-sm mt-2">Data will appear here once loaded</p>
 *           </div>
 *         </div>
 *       </div>
 *     );
 *   }
 *   
 *   // Rest of your component...
 * }
 */
