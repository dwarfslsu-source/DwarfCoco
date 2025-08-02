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
      
      let scanArray = [];
      if (data && data.scans && Array.isArray(data.scans)) {
        scanArray = data.scans;
      } else if (Array.isArray(data)) {
        scanArray = data;
      }
      
      setScans(scanArray);
      calculateStats(scanArray);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching scans:', error);
      setScans([]);
      setLoading(false);
    }
  };

  const calculateStats = (scanData) => {
    if (!Array.isArray(scanData)) {
      setStats({ total: 0, healthy: 0, diseased: 0, critical: 0 });
      return;
    }
    
    const total = scanData.length;
    const healthy = scanData.filter(s => 
      (s.disease_detected || '').toLowerCase().includes('healthy')
    ).length;
    const critical = scanData.filter(s => 
      (s.severity_level || '').toLowerCase().includes('high') ||
      (s.severity_level || '').toLowerCase().includes('critical')
    ).length;
    const diseased = total - healthy;

    setStats({ total, healthy, diseased, critical });
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
  };

  const getSeverityColor = (severity) => {
    if (!severity) return '#6B7280';
    const level = severity.toLowerCase();
    if (level.includes('low') || level.includes('healthy')) return '#10B981';
    if (level.includes('medium')) return '#F59E0B';
    if (level.includes('high')) return '#EF4444';
    if (level.includes('critical')) return '#DC2626';
    return '#6B7280';
  };

  const deleteScan = async (scanId) => {
    if (!confirm('Are you sure you want to delete this scan? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/delete-scan?id=${scanId}`, {
        method: 'DELETE',
      });

      let result;
      try {
        result = await response.json();
      } catch (jsonError) {
        console.error('Failed to parse JSON response:', jsonError);
        result = { message: 'Invalid response from server' };
      }

      if (response.ok) {
        // Remove the deleted scan from state
        setScans(prevScans => prevScans.filter(scan => scan.id !== scanId));
        
        // Recalculate stats
        const updatedScans = scans.filter(scan => scan.id !== scanId);
        calculateStats(updatedScans);
        
        alert('✅ Scan deleted successfully!');
      } else {
        console.error('Delete failed with status:', response.status, result);
        throw new Error(result.message || `Delete failed (${response.status})`);
      }
    } catch (error) {
      console.error('Error deleting scan:', error);
      alert(`❌ Failed to delete scan: ${error.message}`);
    }
  };

  const clearAllScans = async () => {
    if (!confirm(`Are you sure you want to delete ALL ${scans.length} scans? This action cannot be undone and will free up storage space.`)) {
      return;
    }

    const confirmAgain = confirm('⚠️ FINAL WARNING: This will permanently delete all scan data. Continue?');
    if (!confirmAgain) return;

    try {
      let successCount = 0;
      let errorCount = 0;

      // Delete all scans one by one
      for (const scan of scans) {
        try {
          const response = await fetch(`/api/delete-scan?id=${scan.id}`, {
            method: 'DELETE',
          });
          
          if (response.ok) {
            successCount++;
          } else {
            errorCount++;
          }
        } catch (error) {
          errorCount++;
        }
      }

      // Clear the scans from state
      setScans([]);
      setStats({ total: 0, healthy: 0, diseased: 0, critical: 0 });

      if (errorCount === 0) {
        alert(`✅ Successfully deleted all ${successCount} scans! Storage space freed up.`);
      } else {
        alert(`⚠️ Deleted ${successCount} scans. ${errorCount} scans could not be deleted.`);
      }
    } catch (error) {
      console.error('Error clearing all scans:', error);
      alert('❌ Failed to clear all scans. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading dashboard...</p>
        
        <style jsx>{`
          .loading-container {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
          }
          .loading-spinner {
            width: 40px;
            height: 40px;
            border: 4px solid rgba(255,255,255,0.3);
            border-top: 4px solid white;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin-bottom: 16px;
          }
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Dwarf Coconut Disease Detector</title>
        <meta name="description" content="AI-powered dwarf coconut disease detection dashboard" />
        <link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🥥</text></svg>" />
      </Head>

      <div className="dashboard">
        {/* Header */}
        <header className="header">
          <div className="header-content">
            <h1>🌴 Dwarf Coconut Disease Detector</h1>
            <p>AI-Powered Disease Detection Dashboard</p>
          </div>
        </header>

        {/* Stats Grid */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-number">{stats.total}</div>
            <div className="stat-label">Total Scans</div>
          </div>
          <div className="stat-card healthy">
            <div className="stat-number">{stats.healthy}</div>
            <div className="stat-label">Healthy Trees</div>
          </div>
          <div className="stat-card diseased">
            <div className="stat-number">{stats.diseased}</div>
            <div className="stat-label">Diseased Trees</div>
          </div>
          <div className="stat-card critical">
            <div className="stat-number">{stats.critical}</div>
            <div className="stat-label">Critical Cases</div>
          </div>
        </div>

        {/* Recent Scans */}
        <div className="scans-section">
          <div className="scans-header">
            <h2>Recent Disease Scans</h2>
            {scans.length > 0 && (
              <button 
                className="clear-all-btn"
                onClick={() => clearAllScans()}
                title="Delete all scans"
              >
                🗑️ Clear All ({scans.length})
              </button>
            )}
          </div>
          {scans.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📱</div>
              <h3>No scans yet</h3>
              <p>Upload photos from your mobile app to see results here</p>
            </div>
          ) : (
            <div className="scans-grid">
              {scans.slice(0, 12).map((scan, index) => (
                <div key={scan.id || index} className="scan-card">
                  <div className="scan-image">
                    <img 
                      src={scan.image_url || '/api/placeholder/150/150'} 
                      alt="Coconut scan"
                      onError={(e) => {
                        e.target.src = '/api/placeholder/150/150';
                      }}
                    />
                    <button 
                      className="delete-btn"
                      onClick={() => deleteScan(scan.id)}
                      title="Delete scan"
                    >
                      🗑️
                    </button>
                  </div>
                  <div className="scan-content">
                    <div className="scan-disease">
                      {scan.disease_detected || 'Unknown'}
                    </div>
                    <div className="scan-confidence">
                      {scan.confidence}% confidence
                    </div>
                    <div 
                      className="scan-severity"
                      style={{ color: getSeverityColor(scan.severity_level) }}
                    >
                      {scan.severity_level || 'Unknown severity'}
                    </div>
                    <div className="scan-date">
                      {formatDate(scan.timestamp || scan.created_at)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <style jsx>{`
          .dashboard {
            min-height: 100vh;
            background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            color: #1f2937;
          }

          .header {
            background: white;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
            margin-bottom: 2rem;
          }

          .header-content {
            max-width: 1200px;
            margin: 0 auto;
            padding: 2rem 1rem;
            text-align: center;
          }

          .header h1 {
            margin: 0;
            font-size: 2.5rem;
            font-weight: 600;
            background: linear-gradient(135deg, #10b981, #059669);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
          }

          .header p {
            margin: 0.5rem 0 0 0;
            color: #6b7280;
            font-size: 1.1rem;
          }

          .stats-grid {
            max-width: 1200px;
            margin: 0 auto 3rem auto;
            padding: 0 1rem;
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 1.5rem;
          }

          .stat-card {
            background: white;
            padding: 2rem;
            border-radius: 16px;
            text-align: center;
            box-shadow: 0 4px 6px rgba(0,0,0,0.05);
            border: 1px solid #f3f4f6;
            transition: transform 0.2s ease, box-shadow 0.2s ease;
          }

          .stat-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 25px rgba(0,0,0,0.1);
          }

          .stat-number {
            font-size: 3rem;
            font-weight: 700;
            color: #374151;
            line-height: 1;
          }

          .stat-label {
            font-size: 0.9rem;
            color: #6b7280;
            margin-top: 0.5rem;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }

          .stat-card.healthy .stat-number { color: #10b981; }
          .stat-card.diseased .stat-number { color: #f59e0b; }
          .stat-card.critical .stat-number { color: #ef4444; }

          .scans-section {
            max-width: 1200px;
            margin: 0 auto;
            padding: 0 1rem 3rem 1rem;
          }

          .scans-section h2 {
            font-size: 1.8rem;
            font-weight: 600;
            margin-bottom: 2rem;
            color: #374151;
            text-align: center;
          }

          .scans-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 2rem;
            flex-wrap: wrap;
            gap: 1rem;
          }

          .scans-header h2 {
            margin: 0;
            text-align: left;
          }

          .clear-all-btn {
            background: linear-gradient(135deg, #ef4444, #dc2626);
            color: white;
            border: none;
            padding: 0.75rem 1.5rem;
            border-radius: 8px;
            font-size: 0.9rem;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.3s ease;
            box-shadow: 0 2px 4px rgba(239, 68, 68, 0.2);
          }

          .clear-all-btn:hover {
            background: linear-gradient(135deg, #dc2626, #b91c1c);
            transform: translateY(-1px);
            box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
          }

          .clear-all-btn:active {
            transform: translateY(0);
          }

          .empty-state {
            text-align: center;
            padding: 4rem 2rem;
            background: white;
            border-radius: 16px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.05);
          }

          .empty-icon {
            font-size: 4rem;
            margin-bottom: 1rem;
          }

          .empty-state h3 {
            margin: 0 0 0.5rem 0;
            color: #374151;
            font-weight: 600;
          }

          .empty-state p {
            color: #6b7280;
            margin: 0;
          }

          .scans-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
            gap: 1.5rem;
          }

          .scan-card {
            background: white;
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 4px 6px rgba(0,0,0,0.05);
            border: 1px solid #f3f4f6;
            transition: transform 0.2s ease, box-shadow 0.2s ease;
          }

          .scan-card:hover {
            transform: translateY(-4px);
            box-shadow: 0 12px 30px rgba(0,0,0,0.1);
          }

          .scan-image {
            position: relative;
            height: 200px;
            overflow: hidden;
            background: #f9fafb;
          }

          .scan-image img {
            width: 100%;
            height: 100%;
            object-fit: cover;
            transition: transform 0.3s ease;
          }

          .delete-btn {
            position: absolute;
            top: 8px;
            right: 8px;
            background: rgba(239, 68, 68, 0.9);
            border: none;
            border-radius: 50%;
            width: 32px;
            height: 32px;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 14px;
            color: white;
            opacity: 0;
            transform: scale(0.8);
            transition: all 0.3s ease;
            backdrop-filter: blur(4px);
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
          }

          .delete-btn:hover {
            background: rgba(220, 38, 38, 0.95);
            transform: scale(1);
            box-shadow: 0 4px 12px rgba(220, 38, 38, 0.3);
          }

          .scan-card:hover .delete-btn {
            opacity: 1;
            transform: scale(1);
          }

          .scan-card:hover .scan-image img {
            transform: scale(1.05);
          }

          .scan-content {
            padding: 1.5rem;
          }

          .scan-disease {
            font-size: 1.1rem;
            font-weight: 600;
            color: #374151;
            margin-bottom: 0.5rem;
          }

          .scan-confidence {
            font-size: 0.9rem;
            color: #6b7280;
            margin-bottom: 0.5rem;
          }

          .scan-severity {
            font-size: 0.85rem;
            font-weight: 500;
            margin-bottom: 0.5rem;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }

          .scan-date {
            font-size: 0.8rem;
            color: #9ca3af;
          }

          @media (max-width: 768px) {
            .header-content {
              padding: 1.5rem 1rem;
            }
            
            .header h1 {
              font-size: 2rem;
            }
            
            .stats-grid {
              grid-template-columns: repeat(2, 1fr);
              gap: 1rem;
              margin-bottom: 2rem;
            }
            
            .stat-card {
              padding: 1.5rem 1rem;
            }
            
            .stat-number {
              font-size: 2.5rem;
            }
            
            .scans-grid {
              grid-template-columns: 1fr;
              gap: 1rem;
            }
          }
        `}</style>
      </div>
    </>
  );
}
