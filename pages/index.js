import { useState, useEffect } from 'react';
import Head from 'next/head';

export default function Dashboard() {
  const [scans, setScans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    healthy: 0,
    diseased: 0,
    critical: 0
  });

  useEffect(() => {
    fetchScans();
  }, []);

  const fetchScans = async () => {
    try {
      const response = await fetch('/api/scans');
      const data = await response.json();
      
      // Handle the API response structure
      const scanArray = data.scans || data || [];
      setScans(scanArray);
      calculateStats(scanArray);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching scans:', error);
      setLoading(false);
    }
  };

  const calculateStats = (scanData) => {
    const total = scanData.length;
    const healthy = scanData.filter(s => 
      (s.disease_detected || '').toLowerCase().includes('healthy')
    ).length;
    const critical = scanData.filter(s => 
      (s.severity_level || '').includes('Critical') || (s.severity_level || '').includes('🔴')
    ).length;
    const diseased = total - healthy;

    setStats({ total, healthy, diseased, critical });
  };

  const getSeverityColor = (severity) => {
    if (!severity) return '#757575';
    if (severity.includes('🟢')) return '#4CAF50';
    if (severity.includes('🟡')) return '#FF9800';
    if (severity.includes('🟠')) return '#FF5722';
    if (severity.includes('🔴')) return '#F44336';
    return '#757575';
  };

  const getDiseaseEmoji = (disease) => {
    if (!disease) return '🥥';
    
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
          <div style={{ fontSize: '3em', marginBottom: '20px' }}>🌴</div>
          <div style={{ fontSize: '1.2em' }}>Loading Coconut Disease Dashboard...</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', margin: 0, padding: '20px', backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
      <Head>
        <title>🥥 Coconut Disease Dashboard</title>
        <meta name="description" content="Monitor coconut tree health with AI-powered disease detection" />
        <link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🥥</text></svg>" />
      </Head>

      {/* Header */}
      <div style={{ 
        backgroundColor: '#2E7D32', 
        color: 'white', 
        padding: '30px', 
        borderRadius: '15px',
        marginBottom: '30px',
        textAlign: 'center',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
      }}>
        <h1 style={{ margin: 0, fontSize: '2.5em', fontWeight: 'bold' }}>🥥 Coconut Disease Dashboard</h1>
        <p style={{ margin: '10px 0 0 0', fontSize: '1.2em', opacity: 0.9 }}>AI-Powered Coconut Tree Health Monitoring System</p>
        <p style={{ margin: '5px 0 0 0', fontSize: '0.9em', opacity: 0.7 }}>100% Free • No Database Required • Real-time Updates</p>
      </div>

      {/* Statistics Cards */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '20px',
        marginBottom: '30px'
      }}>
        <div style={{ 
          backgroundColor: 'white', 
          padding: '25px', 
          borderRadius: '15px',
          textAlign: 'center',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          border: '2px solid #e0e0e0'
        }}>
          <div style={{ fontSize: '2.5em', marginBottom: '10px' }}>📊</div>
          <div style={{ fontSize: '2.5em', fontWeight: 'bold', color: '#2E7D32', marginBottom: '5px' }}>{stats.total}</div>
          <div style={{ color: '#666', fontSize: '1.1em' }}>Total Scans</div>
        </div>
        
        <div style={{ 
          backgroundColor: 'white', 
          padding: '25px', 
          borderRadius: '15px',
          textAlign: 'center',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          border: '2px solid #4CAF50'
        }}>
          <div style={{ fontSize: '2.5em', marginBottom: '10px' }}>✅</div>
          <div style={{ fontSize: '2.5em', fontWeight: 'bold', color: '#4CAF50', marginBottom: '5px' }}>{stats.healthy}</div>
          <div style={{ color: '#666', fontSize: '1.1em' }}>Healthy Trees</div>
        </div>
        
        <div style={{ 
          backgroundColor: 'white', 
          padding: '25px', 
          borderRadius: '15px',
          textAlign: 'center',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          border: '2px solid #FF9800'
        }}>
          <div style={{ fontSize: '2.5em', marginBottom: '10px' }}>🦠</div>
          <div style={{ fontSize: '2.5em', fontWeight: 'bold', color: '#FF9800', marginBottom: '5px' }}>{stats.diseased}</div>
          <div style={{ color: '#666', fontSize: '1.1em' }}>Diseased Trees</div>
        </div>
        
        <div style={{ 
          backgroundColor: 'white', 
          padding: '25px', 
          borderRadius: '15px',
          textAlign: 'center',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          border: '2px solid #F44336'
        }}>
          <div style={{ fontSize: '2.5em', marginBottom: '10px' }}>🚨</div>
          <div style={{ fontSize: '2.5em', fontWeight: 'bold', color: '#F44336', marginBottom: '5px' }}>{stats.critical}</div>
          <div style={{ color: '#666', fontSize: '1.1em' }}>Critical Cases</div>
        </div>
      </div>

      {/* Scans List */}
      <div style={{ 
        backgroundColor: 'white', 
        borderRadius: '15px',
        padding: '30px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
      }}>
        <h2 style={{ marginTop: 0, color: '#2E7D32', fontSize: '1.8em', marginBottom: '20px' }}>🔬 Recent Disease Scans</h2>
        
        {scans.length === 0 ? (
          <div style={{ 
            textAlign: 'center', 
            padding: '80px 20px', 
            color: '#666',
            backgroundColor: '#f9f9f9',
            borderRadius: '10px',
            border: '2px dashed #ddd'
          }}>
            <div style={{ fontSize: '4em', marginBottom: '20px' }}>📱</div>
            <div style={{ fontSize: '1.3em', fontWeight: 'bold', marginBottom: '10px' }}>No scans yet!</div>
            <div style={{ fontSize: '1em', marginBottom: '20px' }}>Use the mobile app to start detecting coconut diseases.</div>
            <div style={{ 
              backgroundColor: '#2E7D32', 
              color: 'white', 
              padding: '12px 24px', 
              borderRadius: '8px', 
              display: 'inline-block',
              fontSize: '0.9em'
            }}>
              📲 Download the Android app to begin scanning
            </div>
          </div>
        ) : (
          <div style={{ 
            display: 'grid', 
            gap: '20px'
          }}>
            {scans.map((scan, index) => (
              <div key={scan.id} style={{ 
                border: '1px solid #e0e0e0',
                borderRadius: '12px',
                padding: '25px',
                backgroundColor: '#fafafa',
                transition: 'transform 0.2s, box-shadow 0.2s',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 6px 20px rgba(0,0,0,0.15)';
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = 'none';
              }}>
                <div style={{ 
                  display: 'grid',
                  gridTemplateColumns: 'auto 1fr auto',
                  gap: '25px',
                  alignItems: 'center'
                }}>
                  {/* Image */}
                  <div style={{ width: '120px', height: '120px' }}>
                    {scan.image_url ? (
                      <img 
                        src={scan.image_url} 
                        alt="Coconut leaf scan"
                        style={{ 
                          width: '100%', 
                          height: '100%', 
                          objectFit: 'cover',
                          borderRadius: '10px',
                          border: '2px solid #e0e0e0'
                        }}
                      />
                    ) : (
                      <div style={{ 
                        width: '100%', 
                        height: '100%', 
                        backgroundColor: '#e8f5e8',
                        borderRadius: '10px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '3em',
                        border: '2px solid #4CAF50'
                      }}>
                        🥥
                      </div>
                    )}
                  </div>

                  {/* Details */}
                  <div>
                    <div style={{ 
                      fontSize: '1.4em', 
                      fontWeight: 'bold',
                      marginBottom: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px'
                    }}>
                      <span>{getDiseaseEmoji(scan.disease_detected || 'unknown')}</span>
                      <span>{(scan.disease_detected || 'Unknown').replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</span>
                    </div>
                    <div style={{ color: '#666', marginBottom: '8px', fontSize: '0.95em' }}>
                      📅 {new Date(scan.timestamp || Date.now()).toLocaleString()}
                    </div>
                    <div style={{ color: '#666', marginBottom: '8px', fontSize: '0.95em' }}>
                      🎯 Confidence: <strong>{Math.round(scan.confidence || 0)}%</strong>
                    </div>
                    <div style={{ 
                      color: getSeverityColor(scan.severity_level || '🟢 Low Risk'),
                      fontWeight: 'bold',
                      fontSize: '1em'
                    }}>
                      {scan.severity_level || '🟢 Low Risk'}
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ textAlign: 'right' }}>
                    <button style={{
                      backgroundColor: '#2E7D32',
                      color: 'white',
                      border: 'none',
                      padding: '12px 18px',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      marginBottom: '12px',
                      display: 'block',
                      width: '140px',
                      fontSize: '0.9em',
                      fontWeight: 'bold'
                    }}>
                      📋 View Details
                    </button>
                    <div style={{ fontSize: '0.85em', color: '#999' }}>
                      Scan #{scan.id}
                    </div>
                    <div style={{ fontSize: '0.85em', color: '#999', marginTop: '4px' }}>
                      Device: {scan.device_id.substring(0, 8)}...
                    </div>
                  </div>
                </div>

                {/* Recommendation */}
                {scan.recommendation && (
                  <div style={{ 
                    marginTop: '20px',
                    padding: '18px',
                    backgroundColor: '#e8f5e8',
                    borderRadius: '10px',
                    borderLeft: '4px solid #4CAF50'
                  }}>
                    <div style={{ fontWeight: 'bold', marginBottom: '8px', color: '#2E7D32' }}>
                      💡 AI Recommendation:
                    </div>
                    <div style={{ color: '#333', lineHeight: '1.5' }}>
                      {scan.recommendation}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

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
        <div style={{ fontSize: '1.5em', marginBottom: '10px' }}>🌱</div>
        <p style={{ margin: '0 0 8px 0', fontWeight: 'bold' }}>Powered by AI • Helping farmers protect coconut trees worldwide</p>
        <p style={{ margin: '0 0 8px 0' }}>📱 Download the mobile app to start scanning • 🌐 Access anywhere, anytime</p>
        <p style={{ margin: 0, fontSize: '0.8em', opacity: 0.7 }}>
          100% Free Service • No Database Required • Powered by Vercel + Cloudinary
        </p>
      </div>
    </div>
  );
}
