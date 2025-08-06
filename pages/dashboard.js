import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';

export default function Dashboard() {
  const [scans, setScans] = useState([]);
  const [filteredScans, setFilteredScans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedScan, setSelectedScan] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [user, setUser] = useState(null);
  const [activeFilter, setActiveFilter] = useState('all');
  const [stats, setStats] = useState({
    total: 0,
    healthy: 0,
    diseased: 0,
    critical: 0
  });
  const router = useRouter();

  useEffect(() => {
    // Check authentication
    const authToken = localStorage.getItem('authToken');
    const userData = localStorage.getItem('user');
    
    if (!authToken || !userData) {
      router.push('/login');
      return;
    }
    
    try {
      setUser(JSON.parse(userData));
      fetchScans();
    } catch (error) {
      console.error('Error parsing user data:', error);
      router.push('/login');
    }
  }, [router]);

  const handleLogout = async () => {
    const token = localStorage.getItem('authToken');
    
    try {
      // Call logout API to mark session as inactive
      await fetch('/api/auth?action=logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
      });
    } catch (error) {
      console.error('Logout API error:', error);
    }
    
    // Clear local storage and redirect
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    router.push('/login');
  };

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
      setFilteredScans(scanArray);
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
    const diseased = scanData.filter(s => 
      !(s.disease_detected || '').toLowerCase().includes('healthy') &&
      (s.disease_detected || '').toLowerCase() !== ''
    ).length;
    const critical = scanData.filter(s => 
      (s.severity_level || '').toLowerCase().includes('high') ||
      (s.severity_level || '').toLowerCase().includes('critical')
    ).length;

    setStats({ total, healthy, diseased, critical });
  };

  const filterScans = (filterType) => {
    setActiveFilter(filterType);
    
    let filtered = [];
    switch (filterType) {
      case 'healthy':
        filtered = scans.filter(s => 
          (s.disease_detected || '').toLowerCase().includes('healthy')
        );
        break;
      case 'diseased':
        filtered = scans.filter(s => 
          !(s.disease_detected || '').toLowerCase().includes('healthy') &&
          (s.disease_detected || '').toLowerCase() !== ''
        );
        break;
      case 'critical':
        filtered = scans.filter(s => 
          (s.severity_level || '').toLowerCase().includes('high') ||
          (s.severity_level || '').toLowerCase().includes('critical')
        );
        break;
      case 'all':
      default:
        filtered = scans;
        break;
    }
    
    setFilteredScans(filtered);
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

  const openScanDetails = (scan) => {
    setSelectedScan(scan);
    setShowModal(true);
  };

  const closeScanDetails = () => {
    setSelectedScan(null);
    setShowModal(false);
  };

  const deleteScan = async (scanId) => {
    if (!confirm('Are you sure you want to delete this scan? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin?action=delete&id=${scanId}`, {
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
        const remainingScans = scans.filter(scan => scan.id !== scanId);
        setScans(remainingScans);
        setFilteredScans(prev => prev.filter(scan => scan.id !== scanId));
        calculateStats(remainingScans);
        
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
          const response = await fetch(`/api/admin?action=delete&id=${scan.id}`, {
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
      setFilteredScans([]);
      setActiveFilter('all');
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
            background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 50%, #1a1a1a 100%);
            color: white;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
          }
          .loading-spinner {
            width: 40px;
            height: 40px;
            border: 4px solid rgba(255,255,255,0.3);
            border-top: 4px solid #2196F3;
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
        <title>Dashboard - Dwarf Coconut Disease Detector</title>
        <meta name="description" content="AI-powered dwarf coconut disease detection dashboard" />
        <link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🥥</text></svg>" />
      </Head>

      <div className="dashboard">
        {/* Header */}
        <header className="header">
          <div className="header-content">
            <div className="header-main">
              <h1>🌴 Dwarf Coconut Disease Detector</h1>
              <p>AI-Powered Disease Detection Dashboard</p>
            </div>
            <div className="header-actions">
              <div className="user-info">
                <span className="welcome-text">👤 Welcome, {user?.username}</span>
                <button className="logout-btn" onClick={handleLogout}>
                  🚪 Logout
                </button>
              </div>
              <a 
                href="https://download1336.mediafire.com/bmye5p223csgMH4mDVFxB4ffq_Zy04I13e9K3_3Hew3kNiqluMaIooXTwSIZFzbGwH27B79puSKxufnHUjUlNS-xyWBe-0Rd8axMbeHgTQhzpdE414Gm9OW9io-bWfTAwFlu4j0tn4okyB-K79RTXZ452B0uL1iDj4XCb5-I_vdq/3isrxlr6a3egcno/DwarfCoconut-Loading-Fixed.apk"
                target="_blank"
                rel="noopener noreferrer"
                className="download-btn"
              >
                📱 Download Android App
              </a>
            </div>
          </div>
        </header>

        {/* Stats Grid */}
        <div className="stats-grid">
          <div className={`stat-card ${activeFilter === 'all' ? 'active' : ''}`} onClick={() => filterScans('all')}>
            <div className="stat-number">{stats.total}</div>
            <div className="stat-label">Total Scans</div>
          </div>
          <div className={`stat-card healthy ${activeFilter === 'healthy' ? 'active' : ''}`} onClick={() => filterScans('healthy')}>
            <div className="stat-number">{stats.healthy}</div>
            <div className="stat-label">Healthy Trees</div>
          </div>
          <div className={`stat-card diseased ${activeFilter === 'diseased' ? 'active' : ''}`} onClick={() => filterScans('diseased')}>
            <div className="stat-number">{stats.diseased}</div>
            <div className="stat-label">Diseased Trees</div>
          </div>
          <div className={`stat-card critical ${activeFilter === 'critical' ? 'active' : ''}`} onClick={() => filterScans('critical')}>
            <div className="stat-number">{stats.critical}</div>
            <div className="stat-label">Critical Cases</div>
          </div>
        </div>

        {/* Recent Scans */}
        <div className="scans-section">
          <div className="scans-header">
            <h2>Recent Disease Scans {activeFilter !== 'all' ? `(${activeFilter})` : ''}</h2>
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
          {filteredScans.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📱</div>
              <h3>{activeFilter === 'all' ? 'No scans yet' : `No ${activeFilter} scans found`}</h3>
              <p>{activeFilter === 'all' ? 'Upload photos from your mobile app to see results here' : `No scans match the ${activeFilter} filter`}</p>
            </div>
          ) : (
            <div className="scans-grid">
              {filteredScans.slice(0, 12).map((scan, index) => (
                <div key={scan.id || index} className="scan-card" onClick={() => openScanDetails(scan)}>
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
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteScan(scan.id);
                      }}
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
                    <div className="click-hint">
                      👆 Click for details
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Detailed Scan Modal */}
        {showModal && selectedScan && (
          <div className="modal-overlay" onClick={closeScanDetails}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>🌴 Scan Details</h2>
                <button className="modal-close" onClick={closeScanDetails}>✕</button>
              </div>
              
              <div className="modal-body">
                <div className="modal-image-section">
                  <img 
                    src={selectedScan.image_url || '/api/placeholder/300/300'} 
                    alt="Detailed coconut scan"
                    onError={(e) => {
                      e.target.src = '/api/placeholder/300/300';
                    }}
                  />
                </div>
                
                <div className="modal-details-section">
                  <div className="detail-row">
                    <span className="detail-label">🦠 Disease Detected:</span>
                    <span className="detail-value">{selectedScan.disease_detected || 'Unknown'}</span>
                  </div>
                  
                  <div className="detail-row">
                    <span className="detail-label">📊 Confidence Level:</span>
                    <span className="detail-value confidence-bar">
                      <div className="confidence-percentage">{selectedScan.confidence}%</div>
                      <div className="confidence-progress">
                        <div 
                          className="confidence-fill" 
                          style={{ width: `${selectedScan.confidence}%` }}
                        ></div>
                      </div>
                    </span>
                  </div>
                  
                  <div className="detail-row">
                    <span className="detail-label">⚠️ Severity Level:</span>
                    <span 
                      className="detail-value severity-badge"
                      style={{ 
                        backgroundColor: getSeverityColor(selectedScan.severity_level),
                        color: 'white'
                      }}
                    >
                      {selectedScan.severity_level || 'Unknown severity'}
                    </span>
                  </div>
                  
                  <div className="detail-row">
                    <span className="detail-label">📅 Scan Date:</span>
                    <span className="detail-value">{formatDate(selectedScan.timestamp || selectedScan.created_at)}</span>
                  </div>
                  
                  <div className="detail-row">
                    <span className="detail-label">🔬 Analysis ID:</span>
                    <span className="detail-value analysis-id">{selectedScan.id || 'N/A'}</span>
                  </div>
                  
                  {selectedScan.recommendations && (
                    <div className="detail-row recommendations">
                      <span className="detail-label">💡 Recommendations:</span>
                      <span className="detail-value">{selectedScan.recommendations}</span>
                    </div>
                  )}
                  
                  {selectedScan.treatment && (
                    <div className="detail-row treatment">
                      <span className="detail-label">🏥 Treatment:</span>
                      <span className="detail-value">{selectedScan.treatment}</span>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="modal-footer">
                <button className="modal-btn secondary" onClick={closeScanDetails}>
                  Close
                </button>
                <button 
                  className="modal-btn danger" 
                  onClick={() => {
                    deleteScan(selectedScan.id);
                    closeScanDetails();
                  }}
                >
                  🗑️ Delete Scan
                </button>
              </div>
            </div>
          </div>
        )}

        <style jsx>{`
          .dashboard {
            min-height: 100vh;
            background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 50%, #1a1a1a 100%);
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            color: #ffffff;
          }

          .header {
            background: linear-gradient(135deg, #2d2d2d 0%, #1f1f1f 100%);
            box-shadow: 0 4px 20px rgba(0,0,0,0.3);
            margin-bottom: 2rem;
            border-bottom: 1px solid #404040;
          }

          .header-content {
            max-width: 1200px;
            margin: 0 auto;
            padding: 2rem 1rem;
            display: flex;
            justify-content: space-between;
            align-items: center;
            flex-wrap: wrap;
            gap: 1rem;
          }

          .header-main {
            text-align: center;
            flex: 1;
          }

          .header-actions {
            display: flex;
            align-items: center;
            gap: 1rem;
            flex-wrap: wrap;
          }

          .user-info {
            display: flex;
            align-items: center;
            gap: 1rem;
            flex-wrap: wrap;
          }

          .welcome-text {
            color: #b0b0b0;
            font-size: 0.9rem;
            white-space: nowrap;
          }

          .logout-btn {
            background: linear-gradient(135deg, #F44336, #D32F2F);
            color: white;
            border: none;
            padding: 0.5rem 1rem;
            border-radius: 8px;
            font-size: 0.8rem;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.3s ease;
            white-space: nowrap;
          }

          .logout-btn:hover {
            background: linear-gradient(135deg, #D32F2F, #B71C1C);
            transform: translateY(-1px);
          }

          .download-btn {
            background: linear-gradient(135deg, #2196F3, #1976D2);
            color: white;
            padding: 12px 24px;
            border-radius: 12px;
            text-decoration: none;
            font-weight: 600;
            font-size: 0.9rem;
            transition: all 0.3s ease;
            box-shadow: 0 4px 15px rgba(33, 150, 243, 0.3);
            display: inline-flex;
            align-items: center;
            gap: 8px;
            border: 1px solid rgba(33, 150, 243, 0.3);
            white-space: nowrap;
          }

          .download-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 25px rgba(33, 150, 243, 0.4);
            background: linear-gradient(135deg, #1976D2, #1565C0);
            border-color: rgba(33, 150, 243, 0.5);
          }

          @media (max-width: 768px) {
            .header-content {
              flex-direction: column;
              text-align: center;
            }
            
            .header-main {
              order: 1;
            }
            
            .header-actions {
              order: 2;
              width: 100%;
              justify-content: center;
            }

            .user-info {
              flex-direction: column;
              gap: 0.5rem;
            }
          }

          .header h1 {
            margin: 0;
            font-size: 2.5rem;
            font-weight: 600;
            background: linear-gradient(135deg, #4CAF50, #66BB6A);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
          }

          .header p {
            margin: 0.5rem 0 0 0;
            color: #b0b0b0;
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
            background: linear-gradient(135deg, #2d2d2d 0%, #3a3a3a 100%);
            padding: 2rem;
            border-radius: 16px;
            text-align: center;
            box-shadow: 0 8px 32px rgba(0,0,0,0.3);
            border: 1px solid #404040;
            transition: transform 0.2s ease, box-shadow 0.2s ease;
            cursor: pointer;
          }

          .stat-card:hover {
            transform: translateY(-4px);
            box-shadow: 0 12px 40px rgba(0,0,0,0.4);
            border-color: #505050;
          }

          .stat-card.active {
            transform: translateY(-4px);
            box-shadow: 0 12px 40px rgba(76, 175, 80, 0.3);
            border-color: #4CAF50;
            background: linear-gradient(135deg, #2d2d2d 0%, #3a3a3a 100%);
          }

          .stat-card.active.healthy {
            border-color: #4CAF50;
            box-shadow: 0 12px 40px rgba(76, 175, 80, 0.3);
          }

          .stat-card.active.diseased {
            border-color: #FF9800;
            box-shadow: 0 12px 40px rgba(255, 152, 0, 0.3);
          }

          .stat-card.active.critical {
            border-color: #F44336;
            box-shadow: 0 12px 40px rgba(244, 67, 54, 0.3);
          }

          .stat-number {
            font-size: 3rem;
            font-weight: 700;
            color: #ffffff;
            line-height: 1;
          }

          .stat-label {
            font-size: 0.9rem;
            color: #b0b0b0;
            margin-top: 0.5rem;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }

          .stat-card.healthy .stat-number { color: #4CAF50; }
          .stat-card.diseased .stat-number { color: #FF9800; }
          .stat-card.critical .stat-number { color: #F44336; }

          .scans-section {
            max-width: 1200px;
            margin: 0 auto;
            padding: 0 1rem 3rem 1rem;
          }

          .scans-section h2 {
            font-size: 1.8rem;
            font-weight: 600;
            margin-bottom: 2rem;
            color: #ffffff;
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
            background: linear-gradient(135deg, #F44336, #D32F2F);
            color: white;
            border: none;
            padding: 0.75rem 1.5rem;
            border-radius: 12px;
            font-size: 0.9rem;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.3s ease;
            box-shadow: 0 4px 15px rgba(244, 67, 54, 0.3);
            border: 1px solid rgba(244, 67, 54, 0.3);
          }

          .clear-all-btn:hover {
            background: linear-gradient(135deg, #D32F2F, #B71C1C);
            transform: translateY(-2px);
            box-shadow: 0 8px 25px rgba(244, 67, 54, 0.4);
            border-color: rgba(244, 67, 54, 0.5);
          }

          .clear-all-btn:active {
            transform: translateY(0);
          }

          .empty-state {
            text-align: center;
            padding: 4rem 2rem;
            background: linear-gradient(135deg, #2d2d2d 0%, #3a3a3a 100%);
            border-radius: 16px;
            box-shadow: 0 8px 32px rgba(0,0,0,0.3);
            border: 1px solid #404040;
          }

          .empty-icon {
            font-size: 4rem;
            margin-bottom: 1rem;
          }

          .empty-state h3 {
            margin: 0 0 0.5rem 0;
            color: #ffffff;
            font-weight: 600;
          }

          .empty-state p {
            color: #b0b0b0;
            margin: 0;
          }

          .scans-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
            gap: 1.5rem;
          }

          .scan-card {
            background: linear-gradient(135deg, #2d2d2d 0%, #3a3a3a 100%);
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 8px 32px rgba(0,0,0,0.3);
            border: 1px solid #404040;
            transition: transform 0.2s ease, box-shadow 0.2s ease;
          }

          .scan-card:hover {
            transform: translateY(-6px);
            box-shadow: 0 16px 48px rgba(0,0,0,0.4);
            border-color: #505050;
          }

          .scan-image {
            position: relative;
            height: 200px;
            overflow: hidden;
            background: #1a1a1a;
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
            background: rgba(244, 67, 54, 0.9);
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
            backdrop-filter: blur(8px);
            box-shadow: 0 4px 12px rgba(244, 67, 54, 0.3);
          }

          .delete-btn:hover {
            background: rgba(211, 47, 47, 0.95);
            transform: scale(1.1);
            box-shadow: 0 6px 20px rgba(244, 67, 54, 0.4);
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
            color: #ffffff;
            margin-bottom: 0.5rem;
          }

          .scan-confidence {
            font-size: 0.9rem;
            color: #b0b0b0;
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
            color: #808080;
          }

          .click-hint {
            font-size: 0.7rem;
            color: #2196F3;
            margin-top: 0.5rem;
            opacity: 0.8;
            text-align: center;
            font-style: italic;
          }

          .scan-card {
            cursor: pointer;
          }

          /* Modal Styles */
          .modal-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.9);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000;
            padding: 1rem;
            backdrop-filter: blur(8px);
          }

          .modal-content {
            background: linear-gradient(135deg, #2d2d2d 0%, #3a3a3a 100%);
            border-radius: 20px;
            max-width: 800px;
            width: 100%;
            max-height: 90vh;
            overflow-y: auto;
            box-shadow: 0 25px 60px rgba(0, 0, 0, 0.6);
            border: 1px solid #404040;
          }

          .modal-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 1.5rem 2rem;
            border-bottom: 1px solid #404040;
          }

          .modal-header h2 {
            margin: 0;
            font-size: 1.5rem;
            color: #ffffff;
          }

          .modal-close {
            background: none;
            border: none;
            font-size: 1.5rem;
            cursor: pointer;
            color: #b0b0b0;
            padding: 0;
            width: 32px;
            height: 32px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 50%;
            transition: all 0.2s ease;
          }

          .modal-close:hover {
            background: #404040;
            color: #ffffff;
          }

          .modal-body {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 2rem;
            padding: 2rem;
          }

          .modal-image-section img {
            width: 100%;
            height: auto;
            border-radius: 12px;
            box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
          }

          .modal-details-section {
            display: flex;
            flex-direction: column;
            gap: 1.5rem;
          }

          .detail-row {
            display: flex;
            flex-direction: column;
            gap: 0.5rem;
          }

          .detail-label {
            font-weight: 600;
            color: #ffffff;
            font-size: 0.9rem;
          }

          .detail-value {
            color: #b0b0b0;
            font-size: 1rem;
          }

          .confidence-bar {
            display: flex;
            flex-direction: column;
            gap: 0.5rem;
          }

          .confidence-percentage {
            font-weight: 600;
            color: #ffffff;
            font-size: 1.1rem;
          }

          .confidence-progress {
            width: 100%;
            height: 8px;
            background: #404040;
            border-radius: 4px;
            overflow: hidden;
          }

          .confidence-fill {
            height: 100%;
            background: linear-gradient(90deg, #4CAF50, #66BB6A);
            transition: width 0.3s ease;
          }

          .severity-badge {
            padding: 0.5rem 1rem;
            border-radius: 20px;
            font-weight: 600;
            font-size: 0.9rem;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            display: inline-block;
            width: fit-content;
          }

          .analysis-id {
            font-family: 'Courier New', monospace;
            background: #404040;
            padding: 0.5rem;
            border-radius: 6px;
            font-size: 0.9rem;
            color: #ffffff;
          }

          .recommendations, .treatment {
            border-top: 1px solid #404040;
            padding-top: 1rem;
          }

          .recommendations .detail-value,
          .treatment .detail-value {
            color: #ffffff;
            line-height: 1.6;
          }

          .modal-footer {
            display: flex;
            justify-content: flex-end;
            gap: 1rem;
            padding: 1.5rem 2rem;
            border-top: 1px solid #404040;
            background: linear-gradient(135deg, #1f1f1f 0%, #2d2d2d 100%);
          }

          .modal-btn {
            padding: 0.75rem 1.5rem;
            border-radius: 12px;
            font-weight: 600;
            font-size: 0.9rem;
            cursor: pointer;
            transition: all 0.2s ease;
            border: none;
          }

          .modal-btn.secondary {
            background: #404040;
            color: #ffffff;
            border: 1px solid #505050;
          }

          .modal-btn.secondary:hover {
            background: #505050;
            border-color: #606060;
          }

          .modal-btn.danger {
            background: #F44336;
            color: white;
          }

          .modal-btn.danger:hover {
            background: #D32F2F;
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

            .modal-content {
              margin: 1rem;
              max-height: 95vh;
            }

            .modal-body {
              grid-template-columns: 1fr;
              gap: 1.5rem;
              padding: 1.5rem;
            }

            .modal-header {
              padding: 1rem 1.5rem;
            }

            .modal-footer {
              padding: 1rem 1.5rem;
              flex-direction: column;
            }

            .modal-btn {
              width: 100%;
            }
          }
        `}</style>
      </div>
    </>
  );
}
