import React from 'react';
import PropTypes from 'prop-types';
import './ActivityChart.css';

const ActivityChart = ({ data }) => {
  // Simple placeholder chart - in a real app, you would use a charting library
  const maxValue = Math.max(...data.map(item => item.value), 1);
  
  return (
    <div className="activity-chart">
      <h3 className="chart-title">Aktivitätsverlauf</h3>
      <div className="chart-container">
        <div className="chart-bars">
          {data.map((item, index) => (
            <div 
              key={index} 
              className="chart-bar"
              style={{ height: `${(item.value / maxValue) * 100}%` }}
              title={`${item.label}: ${item.value}`}
            ></div>
          ))}
        </div>
      </div>
    </div>
  );
};

ActivityChart.propTypes = {
  data: PropTypes.arrayOf(PropTypes.shape({
    label: PropTypes.string.isRequired,
    value: PropTypes.number.isRequired
  })).isRequired
};

export default ActivityChart;
