// Mobile upload endpoint - specifically for Android APK
import { addScan } from '../lib/supabase-storage.js';

export default async function handler(req, res) {
  // Enable CORS for mobile app
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      error: 'Only POST method allowed' 
    });
  }

  try {
    console.log('📱 Mobile APK upload received');
    console.log('📋 Request body:', JSON.stringify(req.body, null, 2));
    
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
    
    // Extract disease detection from mobile data
    let disease = 'Unknown';
    let confidence = 0;
    
    // Try multiple possible data formats
    if (mobileData.detectionResult?.primaryDisease) {
      disease = mobileData.detectionResult.primaryDisease;
      confidence = mobileData.detectionResult.confidence || 0;
    } else if (mobileData.diseaseDetected) {
      disease = mobileData.diseaseDetected;
      confidence = mobileData.confidence || 0;
    } else if (mobileData.primaryDisease) {
      disease = mobileData.primaryDisease;
      confidence = mobileData.confidence || 0;
    } else if (mobileData.disease) {
      disease = mobileData.disease;
      confidence = mobileData.confidence || 0;
    }
    
    const friendlyName = diseaseMap[disease] || disease;
    const confidencePercent = Math.round(confidence * 100);
    const deviceId = mobileData.device_id || mobileData.deviceId || `mobile_${Date.now()}`;
    
    console.log(`✅ Detected: ${disease} -> ${friendlyName} (${confidencePercent}%)`);
    
    // Create scan record
    const scanData = {
      disease_detected: friendlyName,
      confidence: confidencePercent,
      severity_level: confidence > 0.8 ? 'High' : confidence > 0.5 ? 'Medium' : 'Low',
      image_url: 'https://res.cloudinary.com/dggotlpbg/image/upload/v1/coconut-scans/mobile-upload.jpg',
      status: 'Mobile Upload',
      upload_time: new Date().toISOString(),
      mobile_device_id: deviceId,
      mobile_disease_code: disease,
      raw_mobile_data: mobileData
    };
    
    // Save to database
    console.log('💾 Saving to Supabase...');
    const newScan = await addScan(scanData);
    console.log('🎉 SUCCESS - Mobile scan saved:', newScan.id);
    
    return res.status(200).json({
      success: true,
      message: `SUCCESS: ${friendlyName} detected!`,
      data: newScan,
      scan_id: newScan.id,
      ai_result: friendlyName,
      confidence: `${confidencePercent}%`,
      mobile_detection: disease,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Mobile upload error:', error);
    return res.status(500).json({
      success: false,
      error: 'Upload failed',
      message: error.message,
      details: error.stack
    });
  }
}
