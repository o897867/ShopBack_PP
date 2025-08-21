import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  ComposedChart
} from 'recharts';

const EthPriceChart = ({ candles, predictions, showConfidenceBands }) => {
  // Prepare chart data
  const chartData = candles.map((candle, index) => {
    const timestamp = new Date(candle.timestamp * 1000);
    return {
      time: timestamp.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit' 
      }),
      timestamp: candle.timestamp,
      close: candle.close,
      high: candle.high,
      low: candle.low,
      volume: candle.volume
    };
  });

  // Add predictions to the last data point
  if (predictions && chartData.length > 0) {
    const lastPoint = chartData[chartData.length - 1];
    
    // Add next candle prediction
    if (predictions.next_candle) {
      lastPoint.predicted = predictions.next_candle.y_hat;
      lastPoint.pi68_lower = predictions.next_candle.pi68[0];
      lastPoint.pi68_upper = predictions.next_candle.pi68[1];
    }
  }

  const formatPrice = (value) => `$${value.toFixed(2)}`;
  
  const formatVolume = (value) => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(2)}M`;
    } else if (value >= 1000) {
      return `${(value / 1000).toFixed(2)}K`;
    }
    return value.toFixed(2);
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload || !payload.length) return null;

    const data = payload[0].payload;
    
    return (
      <div style={{
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        padding: '12px',
        border: '1px solid #ccc',
        borderRadius: '4px',
        fontSize: '12px'
      }}>
        <p style={{ margin: '0 0 8px 0', fontWeight: 'bold' }}>{label}</p>
        <p style={{ margin: '4px 0', color: '#2196f3' }}>
          Close: {formatPrice(data.close)}
        </p>
        {data.high && (
          <p style={{ margin: '4px 0', color: '#4caf50' }}>
            High: {formatPrice(data.high)}
          </p>
        )}
        {data.low && (
          <p style={{ margin: '4px 0', color: '#f44336' }}>
            Low: {formatPrice(data.low)}
          </p>
        )}
        {data.volume && (
          <p style={{ margin: '4px 0', color: '#666' }}>
            Volume: {formatVolume(data.volume)}
          </p>
        )}
        {data.predicted && (
          <p style={{ margin: '4px 0', color: '#ff9800' }}>
            Predicted: {formatPrice(data.predicted)}
          </p>
        )}
      </div>
    );
  };

  return (
    <ResponsiveContainer width="100%" height={400}>
      <ComposedChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        <defs>
          <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#2196f3" stopOpacity={0.8}/>
            <stop offset="95%" stopColor="#2196f3" stopOpacity={0.1}/>
          </linearGradient>
          <linearGradient id="colorConfidence" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#ff9800" stopOpacity={0.3}/>
            <stop offset="95%" stopColor="#ff9800" stopOpacity={0.05}/>
          </linearGradient>
        </defs>
        
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        
        <XAxis 
          dataKey="time" 
          tick={{ fontSize: 11 }}
          interval="preserveStartEnd"
        />
        
        <YAxis 
          domain={['dataMin - 10', 'dataMax + 10']}
          tickFormatter={formatPrice}
          tick={{ fontSize: 11 }}
        />
        
        <Tooltip content={<CustomTooltip />} />
        
        <Legend 
          wrapperStyle={{ fontSize: '12px' }}
          iconType="line"
        />

        {/* Confidence bands */}
        {showConfidenceBands && (
          <Area
            type="monotone"
            dataKey="pi68_upper"
            stackId="1"
            stroke="none"
            fill="url(#colorConfidence)"
            name="68% CI Upper"
            connectNulls
          />
        )}
        
        {showConfidenceBands && (
          <Area
            type="monotone"
            dataKey="pi68_lower"
            stackId="2"
            stroke="none"
            fill="url(#colorConfidence)"
            name="68% CI Lower"
            connectNulls
          />
        )}

        {/* High/Low range */}
        <Area
          type="monotone"
          dataKey="high"
          stackId="3"
          stroke="none"
          fill="#e8f5e9"
          opacity={0.3}
          name="High"
        />
        
        <Area
          type="monotone"
          dataKey="low"
          stackId="4"
          stroke="none"
          fill="#ffebee"
          opacity={0.3}
          name="Low"
        />

        {/* Main price line */}
        <Line
          type="monotone"
          dataKey="close"
          stroke="#2196f3"
          strokeWidth={2}
          dot={false}
          name="Close Price"
          animationDuration={300}
        />

        {/* Predicted price */}
        <Line
          type="monotone"
          dataKey="predicted"
          stroke="#ff9800"
          strokeWidth={2}
          strokeDasharray="5 5"
          dot={{ r: 4, fill: '#ff9800' }}
          name="Kalman Prediction"
          connectNulls
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
};

export default EthPriceChart;