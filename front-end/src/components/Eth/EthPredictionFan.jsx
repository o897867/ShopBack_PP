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

const EthPredictionFan = ({ currentPrice, predictions }) => {
  if (!currentPrice || !predictions?.horizons) {
    return (
      <div style={{ 
        height: 400, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        color: '#999'
      }}>
        No prediction data available
      </div>
    );
  }

  // Prepare data for the fan chart
  const fanData = [
    {
      minutes: 0,
      price: currentPrice,
      pi68_lower: currentPrice,
      pi68_upper: currentPrice,
      pi95_lower: currentPrice,
      pi95_upper: currentPrice
    }
  ];

  // Add prediction points
  const horizons = [3, 6, 9, 15, 30, 60];
  horizons.forEach(horizon => {
    const key = `${horizon}m`;
    if (predictions.horizons[key]) {
      const pred = predictions.horizons[key];
      fanData.push({
        minutes: horizon,
        price: pred.y_hat,
        pi68_lower: pred.pi68[0],
        pi68_upper: pred.pi68[1],
        pi95_lower: pred.pi95[0],
        pi95_upper: pred.pi95[1]
      });
    }
  });

  const formatPrice = (value) => `$${value.toFixed(2)}`;

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload || !payload.length) return null;

    const data = payload[0].payload;
    const priceChange = ((data.price - currentPrice) / currentPrice) * 100;
    
    return (
      <div style={{
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        padding: '12px',
        border: '1px solid #ccc',
        borderRadius: '4px',
        fontSize: '12px'
      }}>
        <p style={{ margin: '0 0 8px 0', fontWeight: 'bold' }}>
          {label === 0 ? 'Current' : `+${label} minutes`}
        </p>
        <p style={{ margin: '4px 0', color: '#2196f3' }}>
          Price: {formatPrice(data.price)}
        </p>
        {label !== 0 && (
          <p style={{ 
            margin: '4px 0', 
            color: priceChange >= 0 ? '#4caf50' : '#f44336' 
          }}>
            Change: {priceChange >= 0 ? '+' : ''}{priceChange.toFixed(2)}%
          </p>
        )}
        <p style={{ margin: '4px 0', color: '#ff9800' }}>
          68% CI: {formatPrice(data.pi68_lower)} - {formatPrice(data.pi68_upper)}
        </p>
        <p style={{ margin: '4px 0', color: '#999' }}>
          95% CI: {formatPrice(data.pi95_lower)} - {formatPrice(data.pi95_upper)}
        </p>
      </div>
    );
  };

  // Calculate Y-axis domain to show full confidence intervals
  const allValues = fanData.flatMap(d => [
    d.pi95_lower,
    d.pi95_upper,
    d.price
  ]);
  const minValue = Math.min(...allValues) * 0.998;
  const maxValue = Math.max(...allValues) * 1.002;

  return (
    <ResponsiveContainer width="100%" height={400}>
      <ComposedChart 
        data={fanData} 
        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
      >
        <defs>
          <linearGradient id="confidence95" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#e3f2fd" stopOpacity={0.8}/>
            <stop offset="95%" stopColor="#e3f2fd" stopOpacity={0.2}/>
          </linearGradient>
          <linearGradient id="confidence68" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#bbdefb" stopOpacity={0.8}/>
            <stop offset="95%" stopColor="#bbdefb" stopOpacity={0.3}/>
          </linearGradient>
        </defs>
        
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        
        <XAxis 
          dataKey="minutes"
          label={{ value: 'Minutes Ahead', position: 'insideBottom', offset: -5 }}
          tick={{ fontSize: 11 }}
          ticks={[0, 3, 6, 9, 15, 30, 60]}
        />
        
        <YAxis 
          domain={[minValue, maxValue]}
          tickFormatter={formatPrice}
          tick={{ fontSize: 11 }}
          label={{ 
            value: 'ETH Price (USD)', 
            angle: -90, 
            position: 'insideLeft',
            style: { textAnchor: 'middle' }
          }}
        />
        
        <Tooltip content={<CustomTooltip />} />
        
        <Legend 
          wrapperStyle={{ fontSize: '12px' }}
          iconType="line"
        />

        {/* 95% Confidence Interval */}
        <Area
          type="monotone"
          dataKey="pi95_upper"
          stackId="1"
          stroke="none"
          fill="url(#confidence95)"
          name="95% CI"
        />
        <Area
          type="monotone"
          dataKey="pi95_lower"
          stackId="2"
          stroke="none"
          fill="#fff"
        />

        {/* 68% Confidence Interval */}
        <Area
          type="monotone"
          dataKey="pi68_upper"
          stackId="3"
          stroke="none"
          fill="url(#confidence68)"
          name="68% CI"
        />
        <Area
          type="monotone"
          dataKey="pi68_lower"
          stackId="4"
          stroke="none"
          fill="#fff"
        />

        {/* Predicted price line */}
        <Line
          type="monotone"
          dataKey="price"
          stroke="#2196f3"
          strokeWidth={3}
          dot={{ r: 5, fill: '#2196f3' }}
          name="Kalman Prediction"
        />

        {/* Current price reference line */}
        <Line
          type="monotone"
          dataKey={() => currentPrice}
          stroke="#666"
          strokeWidth={1}
          strokeDasharray="10 5"
          dot={false}
          name="Current Price"
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
};

export default EthPredictionFan;