// api/scans.js - Return stored scan data for dashboard
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
    // Sample scan data with real Cloudinary images
    const sampleScans = [
      {
        id: 1,
        timestamp: new Date().toISOString(),
        disease_detected: 'Bud Rot',
        confidence: 85,
        severity_level: '🔴 Critical Risk',
        recommendation: 'Apply fungicide immediately and improve drainage',
        image_url: 'https://res.cloudinary.com/dpezf22nd/image/upload/v1/coconut-scans/bud-rot-sample.jpg',
        device_model: 'Samsung Galaxy',
        location: 'Farm A - Section 1'
      },
      {
        id: 2,
        timestamp: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
        disease_detected: 'Leaf Spot',
        confidence: 78,
        severity_level: '🟡 Medium Risk',
        recommendation: 'Remove affected leaves and apply copper-based fungicide',
        image_url: 'https://res.cloudinary.com/dpezf22nd/image/upload/v1/coconut-scans/leaf-spot-sample.jpg',
        device_model: 'Android Device',
        location: 'Farm B - Section 2'
      },
      {
        id: 3,
        timestamp: new Date(Date.now() - 7200000).toISOString(), // 2 hours ago
        disease_detected: 'Healthy',
        confidence: 95,
        severity_level: '🟢 Low Risk',
        recommendation: 'Tree looks healthy! Continue regular care and monitoring',
        image_url: 'https://res.cloudinary.com/dpezf22nd/image/upload/v1/coconut-scans/healthy-sample.jpg',
        device_model: 'iPhone',
        location: 'Farm C - Section 3'
      }
    ];

    console.log('Returning scan data for dashboard');
    
    return res.status(200).json({
      success: true,
      scans: sampleScans,
      total: sampleScans.length
    });

  } catch (error) {
    console.error('Scans API error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
}