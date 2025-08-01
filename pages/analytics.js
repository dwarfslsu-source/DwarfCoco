import { useState, useEffect } from 'react';
import Head from 'next/head';

export default function Analytics() {
  const [scans, setScans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState({
    diseaseDistribution: {},
    severityDistribution: {},
    confidenceStats: {},
    timelineData: [],
    totalScans: 0
  });

  useEffect(() => {
    fetchScans();
  }, []);

  const fetchScans = async () => {
    try {
      const response = await fetch('/api/scans');
      const data = await response.json();
      setScans(data);
      calculateAnalytics(data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching scans:', error);
      setLoading(false);
    }
  };

  const calculateAnalytics = (scanData) => {
    // Disease distribution
    const diseaseDistribution = {};
    scanData.forEach(scan => {
      const disease = scan.disease_detected;
      diseaseDistribution[disease] = (diseaseDistribution[disease] || 0) + 1;
    });

    // Severity distribution
    const severityDistribution = {};
    scanData.forEach(scan => {
      const severity = scan.severity_level;
      severityDistribution[severity] = (severityDistribution[severity] || 0) + 1;
    });

    // Confidence statistics
    const confidences = scanData.map(scan => scan.confidence);
    const confidenceStats = {
      average: confidences.length > 0 ? (confidences.reduce((a, b) => a + b, 0) / confidences.length) : 0,
      min: confidences.length > 0 ? Math.min(...confidences) : 0,
      max: confidences.length > 0 ? Math.max(...confidences) : 0
    };

    // Timeline data (last 7 days)
    const timelineData = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const scansOnDate = scanData.filter(scan => 
        scan.timestamp.split('T')[0] === dateStr
      ).length;
      
      timelineData.push({
        date: date.toLocaleDateString(),
        scans: scansOnDate
      });
    }

    setAnalytics({
      diseaseDistribution,
      severityDistribution,
      confidenceStats,
      timelineData,
      totalScans: scanData.length
    });
  };

  const getDiseaseEmoji = (disease) => {
    const diseaseMap = {
      'healthy': '✅',
      'leaf_spot': '🟤',
      'bud_rot': '🔴',
      'lethal_yellowing': '🟡',
      'cci_caterpillars': '🐛',
      'wclwd': '🟠'
    };
    
    const diseaseKey = disease.toLowerCase().replace(/[^a-z]/g, '_');
    return diseaseMap[diseaseKey] || '🥥';
  };

  const getSeverityColor = (severity) => {
    if (severity.includes('🟢')) return '#4CAF50';
    if (severity.includes('🟡')) return '#FF9800';
    if (severity.includes('🟠')) return '#FF5722';
    if (severity.includes('🔴')) return '#F44336';
    return '#757575';
  };

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        fontFamily: 'Arial, sans-serif',
        backgroundColor: '#f5f5f5'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '3em', marginBottom: '20px' }}>📊</div>
          <div style={{ fontSize: '1.2em' }}>Loading Analytics Dashboard...</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', margin: 0, padding: '20px', backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
      <Head>
        <title>📊 Coconut Disease Analytics</title>
        <meta name="description" content="Advanced analytics for coconut disease detection patterns" />
        <link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>📊</text></svg>" />
      </Head>

      {/* Header */}
      <div style={{ 
        backgroundColor: '#FF6F00', 
        color: 'white', 
        padding: '30px', 
        borderRadius: '15px',
        marginBottom: '30px',
        textAlign: 'center',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
      }}>
        <h1 style={{ margin: 0, fontSize: '2.5em', fontWeight: 'bold' }}>📊 Analytics Dashboard</h1>
        <p style={{ margin: '10px 0 0 0', fontSize: '1.2em', opacity: 0.9 }}>Advanced Coconut Disease Detection Insights</p>
        <div style={{ marginTop: '15px' }}>
          <a href="/" style={{ 
            color: 'white', 
            textDecoration: 'none', 
            backgroundColor: 'rgba(255,255,255,0.2)', 
            padding: '8px 16px', 
            borderRadius: '6px',
            fontSize: '0.9em'
          }}>
            ← Back to Dashboard
          </a>
        </div>
      </div>

      {analytics.totalScans === 0 ? (
        <div style={{ 
          textAlign: 'center', 
          padding: '80px 20px', 
          color: '#666',
          backgroundColor: 'white',
          borderRadius: '15px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
        }}>
          <div style={{ fontSize: '4em', marginBottom: '20px' }}>📈</div>
          <div style={{ fontSize: '1.3em', fontWeight: 'bold', marginBottom: '10px' }}>No data for analytics yet!</div>
          <div style={{ fontSize: '1em' }}>Start scanning coconuts to see analytics here.</div>
        </div>
      ) : (
        <>
          {/* Key Metrics */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '20px',
            marginBottom: '30px'
          }}>
            <div style={{ 
              backgroundColor: 'white', 
              padding: '25px', 
              borderRadius: '15px',
              textAlign: 'center',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
            }}>
              <div style={{ fontSize: '2em', marginBottom: '10px' }}>📊</div>
              <div style={{ fontSize: '2em', fontWeight: 'bold', color: '#2E7D32' }}>{analytics.totalScans}</div>
              <div style={{ color: '#666' }}>Total Scans</div>
            </div>
            
            <div style={{ 
              backgroundColor: 'white', 
              padding: '25px', 
              borderRadius: '15px',
              textAlign: 'center',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
            }}>
              <div style={{ fontSize: '2em', marginBottom: '10px' }}>🎯</div>
              <div style={{ fontSize: '2em', fontWeight: 'bold', color: '#FF6F00' }}>
                {Math.round(analytics.confidenceStats.average * 100)}%
              </div>
              <div style={{ color: '#666' }}>Avg Confidence</div>
            </div>
            
            <div style={{ 
              backgroundColor: 'white', 
              padding: '25px', 
              borderRadius: '15px',
              textAlign: 'center',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
            }}>
              <div style={{ fontSize: '2em', marginBottom: '10px' }}>🦠</div>
              <div style={{ fontSize: '2em', fontWeight: 'bold', color: '#F44336' }}>
                {Object.keys(analytics.diseaseDistribution).length}
              </div>
              <div style={{ color: '#666' }}>Disease Types</div>
            </div>
          </div>

          {/* Disease Distribution */}
          <div style={{ 
            backgroundColor: 'white', 
            borderRadius: '15px',
            padding: '30px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            marginBottom: '30px'
          }}>
            <h2 style={{ marginTop: 0, color: '#2E7D32', fontSize: '1.8em', marginBottom: '25px' }}>
              🦠 Disease Distribution
            </h2>
            
            <div style={{ display: 'grid', gap: '15px' }}>
              {Object.entries(analytics.diseaseDistribution).map(([disease, count]) => {
                const percentage = Math.round((count / analytics.totalScans) * 100);
                return (
                  <div key={disease} style={{ 
                    padding: '20px',
                    backgroundColor: '#f8f9fa',
                    borderRadius: '10px',
                    border: '1px solid #e9ecef'
                  }}>
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      marginBottom: '10px'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontSize: '1.5em' }}>{getDiseaseEmoji(disease)}</span>
                        <span style={{ fontWeight: 'bold', fontSize: '1.1em' }}>
                          {disease.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </span>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '1.2em', fontWeight: 'bold', color: '#2E7D32' }}>
                          {count} scans
                        </div>
                        <div style={{ fontSize: '0.9em', color: '#666' }}>
                          {percentage}%
                        </div>
                      </div>
                    </div>
                    
                    {/* Progress bar */}
                    <div style={{ 
                      width: '100%', 
                      height: '8px', 
                      backgroundColor: '#e0e0e0', 
                      borderRadius: '4px',
                      overflow: 'hidden'
                    }}>
                      <div style={{ 
                        width: `${percentage}%`, 
                        height: '100%', 
                        backgroundColor: '#4CAF50',
                        transition: 'width 0.3s ease'
                      }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Severity Distribution */}
          <div style={{ 
            backgroundColor: 'white', 
            borderRadius: '15px',
            padding: '30px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            marginBottom: '30px'
          }}>
            <h2 style={{ marginTop: 0, color: '#FF6F00', fontSize: '1.8em', marginBottom: '25px' }}>
              ⚠️ Severity Distribution
            </h2>
            
            <div style={{ display: 'grid', gap: '15px' }}>
              {Object.entries(analytics.severityDistribution).map(([severity, count]) => {
                const percentage = Math.round((count / analytics.totalScans) * 100);
                return (
                  <div key={severity} style={{ 
                    padding: '20px',
                    backgroundColor: '#f8f9fa',
                    borderRadius: '10px',
                    border: '1px solid #e9ecef'
                  }}>
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      marginBottom: '10px'
                    }}>
                      <div style={{ 
                        fontWeight: 'bold', 
                        fontSize: '1.1em',
                        color: getSeverityColor(severity)
                      }}>
                        {severity}
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '1.2em', fontWeight: 'bold', color: getSeverityColor(severity) }}>
                          {count} cases
                        </div>
                        <div style={{ fontSize: '0.9em', color: '#666' }}>
                          {percentage}%
                        </div>
                      </div>
                    </div>
                    
                    {/* Progress bar */}
                    <div style={{ 
                      width: '100%', 
                      height: '8px', 
                      backgroundColor: '#e0e0e0', 
                      borderRadius: '4px',
                      overflow: 'hidden'
                    }}>
                      <div style={{ 
                        width: `${percentage}%`, 
                        height: '100%', 
                        backgroundColor: getSeverityColor(severity),
                        transition: 'width 0.3s ease'
                      }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Timeline Chart */}
          <div style={{ 
            backgroundColor: 'white', 
            borderRadius: '15px',
            padding: '30px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
          }}>
            <h2 style={{ marginTop: 0, color: '#1976D2', fontSize: '1.8em', marginBottom: '25px' }}>
              📈 Scan Activity (Last 7 Days)
            </h2>
            
            <div style={{ display: 'flex', alignItems: 'end', gap: '15px', height: '200px' }}>
              {analytics.timelineData.map((day, index) => {
                const maxScans = Math.max(...analytics.timelineData.map(d => d.scans));
                const height = maxScans > 0 ? (day.scans / maxScans) * 150 : 0;
                
                return (
                  <div key={index} style={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    alignItems: 'center',
                    flex: 1
                  }}>
                    <div style={{ 
                      backgroundColor: '#1976D2',
                      width: '40px',
                      height: `${height}px`,
                      borderRadius: '4px 4px 0 0',
                      marginBottom: '10px',
                      minHeight: '5px',
                      transition: 'height 0.3s ease'
                    }} />
                    <div style={{ 
                      fontSize: '1.2em', 
                      fontWeight: 'bold', 
                      color: '#1976D2',
                      marginBottom: '5px'
                    }}>
                      {day.scans}
                    </div>
                    <div style={{ 
                      fontSize: '0.8em', 
                      color: '#666',
                      textAlign: 'center',
                      lineHeight: '1.2'
                    }}>
                      {day.date}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}

      {/* Footer */}
      <div style={{ 
        textAlign: 'center', 
        marginTop: '40px',
        color: '#666',
        fontSize: '0.9em',
        padding: '20px',
        backgroundColor: 'white',
        borderRadius: '12px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        <p style={{ margin: 0 }}>
          📊 Advanced Analytics • Real-time Disease Monitoring • AI-Powered Insights
        </p>
      </div>
    </div>
  );
}
