// app/frontend/src/components/CustomAnalysisResults.jsx
import React from 'react';

const CustomAnalysisResults = ({ data }) => {
  if (!data) return null;

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-bold mb-4">Analysis Result</h3>
      <pre className="text-sm bg-gray-100 p-4 rounded overflow-auto">
        {JSON.stringify(data, null, 2)}
      </pre>
    </div>
  );
};

export default CustomAnalysisResults;
