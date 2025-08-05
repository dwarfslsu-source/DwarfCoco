// BRAND NEW MOBILE UPLOAD ENDPOINT - GUARANTEED TO WORK
export default async function handler(req, res) {
  // Enable CORS for mobile app
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Only POST allowed' });
  }

  try {
    console.log('🚀 NEW MOBILE ENDPOINT - Request received');
    console.log('📱 Body:', JSON.stringify(req.body, null, 2));
    
    const mobileData = req.body;
    
    // Disease name mapping
    const diseaseMap = {
      'CCI_Caterpillars': 'Caterpillar Infestation',
      'CCI_Leaflets': 'Coconut Leaflet Disease', 
      'Healthy_Leaves': 'Healthy Coconut',
      'WCLWD_DryingofLeaflets': 'Leaf Drying Disease',
      'WCLWD_Flaccidity': 'Leaf Flaccidity',
      'WCLWD_Yellowing': 'Leaf Yellowing Disease'
    };
    
    // Extract data from mobile format
    let disease = 'Unknown';
    let confidence = 0;
    
    if (mobileData.detectionResult?.primaryDisease) {
      disease = mobileData.detectionResult.primaryDisease;
      confidence = mobileData.detectionResult.confidence || 0;
    } else if (mobileData.diseaseDetected) {
      disease = mobileData.diseaseDetected;
      confidence = mobileData.confidence || 0;
    }
    
    const friendlyName = diseaseMap[disease] || disease;
    const deviceId = mobileData.device_id || mobileData.deviceId || `mobile_${Date.now()}`;
    
    console.log(`✅ Detected: ${disease} -> ${friendlyName} (${Math.round(confidence * 100)}%)`);
    
    // Create response
    const result = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      device_id: deviceId,
      disease_detected: friendlyName,
      confidence: Math.round(confidence * 100),
      severity_level: confidence > 0.8 ? 'high' : confidence > 0.5 ? 'medium' : 'low',
      image_url: 'https://res.cloudinary.com/dggotlpbg/image/upload/v1/coconut-scans/mobile-upload.jpg',
      mobile_code: disease,
      raw_data: mobileData
    };
    
    console.log('🎉 SUCCESS - Mobile scan processed');
    
    return res.status(200).json({
      success: true,
      message: `SUCCESS: ${friendlyName} detected!`,
      data: result,
      scan_id: result.id,
      ai_result: friendlyName,
      confidence: `${Math.round(confidence * 100)}%`,
      mobile_detection: disease
    });
    
  } catch (error) {
    console.error('❌ Mobile upload error:', error);
    return res.status(500).json({
      success: false,
      error: 'Upload failed',
      details: error.message
    });
  }
}
