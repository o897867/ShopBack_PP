import React from 'react';

const PerformanceCard = ({ performanceData, translate }) => {
  if (!performanceData) return null;

  const { scraping_performance, data_scale, alert_latency } = performanceData;

  return (
    <div style={{
      background: 'white',
      padding: '25px',
      borderRadius: '8px',
      marginBottom: '30px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
    }}>
      <h2 style={{
        fontSize: '1.5em',
        marginBottom: '20px',
        color: '#333',
        borderBottom: '2px solid #007bff',
        paddingBottom: '10px'
      }}>
        {translate('performance.title')}
      </h2>

      {/* 抓取性能 */}
      <div style={{ marginBottom: '25px' }}>
        <h3 style={{ 
          fontSize: '1.2em', 
          marginBottom: '15px', 
          color: '#555',
          display: 'flex',
          alignItems: 'center'
        }}>
          {translate('performance.scraping')}
        </h3>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '15px',
          padding: '15px',
          background: '#f8f9fa',
          borderRadius: '6px'
        }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ color: '#666', fontSize: '0.9em', marginBottom: '5px' }}>
              {translate('performance.concurrency')}
            </span>
            <span style={{ fontSize: '1.3em', fontWeight: 'bold', color: '#007bff' }}>
              {scraping_performance?.concurrency || 0}
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ color: '#666', fontSize: '0.9em', marginBottom: '5px' }}>
              {translate('performance.requestsPerMinute')}
            </span>
            <span style={{ fontSize: '1.3em', fontWeight: 'bold', color: '#28a745' }}>
              {scraping_performance?.requests_per_minute || 0}
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ color: '#666', fontSize: '0.9em', marginBottom: '5px' }}>
              {translate('performance.avgResponseTime')}
            </span>
            <span style={{ fontSize: '1.3em', fontWeight: 'bold', color: '#ffc107' }}>
              {scraping_performance?.avg_response_time || 0}s
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ color: '#666', fontSize: '0.9em', marginBottom: '5px' }}>
              {translate('performance.successRate')}
            </span>
            <span style={{ 
              fontSize: '1.3em', 
              fontWeight: 'bold', 
              color: scraping_performance?.success_rate > 90 ? '#28a745' : 
                     scraping_performance?.success_rate > 70 ? '#ffc107' : '#dc3545'
            }}>
              {scraping_performance?.success_rate || 0}%
            </span>
          </div>
        </div>
      </div>

      {/* 数据规模 */}
      <div style={{ marginBottom: '25px' }}>
        <h3 style={{ 
          fontSize: '1.2em', 
          marginBottom: '15px', 
          color: '#555',
          display: 'flex',
          alignItems: 'center'
        }}>
          {translate('performance.dataScale')}
        </h3>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '15px',
          padding: '15px',
          background: '#f0f8ff',
          borderRadius: '6px'
        }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ color: '#666', fontSize: '0.9em', marginBottom: '5px' }}>
              {translate('performance.totalStores')}
            </span>
            <span style={{ fontSize: '1.3em', fontWeight: 'bold', color: '#6c757d' }}>
              {data_scale?.total_stores?.toLocaleString() || 0}
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ color: '#666', fontSize: '0.9em', marginBottom: '5px' }}>
              {translate('performance.totalRecords')}
            </span>
            <span style={{ fontSize: '1.3em', fontWeight: 'bold', color: '#6c757d' }}>
              {data_scale?.total_records?.toLocaleString() || 0}
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ color: '#666', fontSize: '0.9em', marginBottom: '5px' }}>
              {translate('performance.dailyNewRecords')}
            </span>
            <span style={{ fontSize: '1.3em', fontWeight: 'bold', color: '#17a2b8' }}>
              {data_scale?.daily_new_records?.toLocaleString() || 0}
            </span>
          </div>
        </div>
      </div>

      {/* 告警时效 */}
      <div>
        <h3 style={{ 
          fontSize: '1.2em', 
          marginBottom: '15px', 
          color: '#555',
          display: 'flex',
          alignItems: 'center'
        }}>
          {translate('performance.alertLatency')}
        </h3>
        <div style={{
          padding: '15px',
          background: '#fff3cd',
          borderRadius: '6px',
          borderLeft: '4px solid #ffc107'
        }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px' }}>
            <span style={{ color: '#666', fontSize: '0.9em' }}>
              {translate('performance.p95Latency')}:
            </span>
            <span style={{ fontSize: '1.3em', fontWeight: 'bold', color: '#856404' }}>
              {alert_latency?.p95_minutes || 0} {translate('performance.minutes')}
            </span>
            <span style={{ color: '#999', fontSize: '0.85em' }}>
              ({translate('performance.latencyDesc')})
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PerformanceCard;