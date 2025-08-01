// api/test-scans.js - Simple test version of scans API
export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Simple test data
    const testScans = [
      {
        id: 1,
        timestamp: new Date().toISOString(),
        disease_detected: 'Healthy',
        confidence: 95,
        severity_level: '🟢 Low Risk',
        recommendation: 'Tree looks good!',
        image_url: '',
        device_model: 'Test Device',
        location: 'Test Location'
      }
    ];

    return res.status(200).json({
      success: true,
      scans: testScans,
      total: testScans.length
    });

  } catch (error) {
    console.error('Test scans API error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
}
