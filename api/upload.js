// Consolidated upload API - handles all upload scenarios
import { addScan } from '../lib/supabase-storage.js';

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('📱 Mobile upload received:', JSON.stringify(req.body, null, 2));
    
    // Handle direct mobile upload (most common case)
    return handleMobileUpload(req, res, req.body);
  } catch (error) {
    console.error('Upload error:', error);
    return res.status(500).json({ 
      success: false,
      error: 'Upload failed',
      message: error.message 
    });
  }
}

async function handleMobileUpload(req, res, data) {
  try {
    // Disease name mapping for mobile app
    const diseaseNameMap = {
      'CCI_Caterpillars': 'Caterpillar Infestation',
      'CCI_Leaflets': 'Coconut Leaflet Disease', 
      'Healthy_Leaves': 'Healthy Coconut',
      'WCLWD_DryingofLeaflets': 'Leaf Drying Disease',
      'WCLWD_Flaccidity': 'Leaf Flaccidity',
      'WCLWD_Yellowing': 'Leaf Yellowing Disease'
    };
    
    // Extract data from various possible mobile formats
    let diseaseDetected = 'Unknown';
    let confidence = 0.0;
    let deviceId = 'mobile_device';
    
    // Try different possible data structures from mobile app
    if (data.detectionResult?.primaryDisease) {
      diseaseDetected = data.detectionResult.primaryDisease;
      confidence = data.detectionResult.confidence || 0.0;
    } else if (data.diseaseDetected) {
      diseaseDetected = data.diseaseDetected;
      confidence = data.confidence || 0.0;
    } else if (data.disease_detected) {
      diseaseDetected = data.disease_detected;
      confidence = data.confidence || 0.0;
    } else if (data.primaryDisease) {
      diseaseDetected = data.primaryDisease;
      confidence = data.confidence || 0.0;
    }
    
    // Get device info
    if (data.device_id || data.deviceId) {
      deviceId = data.device_id || data.deviceId;
    }
    
    const friendlyDiseaseName = diseaseNameMap[diseaseDetected] || diseaseDetected;
    const confidencePercent = Math.round(confidence * 100);
    
    console.log(`🔬 Mobile detected: ${diseaseDetected} -> ${friendlyDiseaseName} (${confidencePercent}%)`);
    
    const scanData = {
      disease_detected: friendlyDiseaseName,
      confidence: confidencePercent,
      severity_level: confidence > 0.8 ? 'High' : confidence > 0.5 ? 'Medium' : 'Low',
      image_url: 'https://res.cloudinary.com/dggotlpbg/image/upload/v1/coconut-scans/mobile-upload.jpg',
      status: 'Mobile Upload',
      upload_time: new Date().toISOString(),
      mobile_device_id: deviceId,
      mobile_disease_code: diseaseDetected,
      raw_mobile_data: data
    };

    // Save to Supabase database
    console.log('💾 Saving to database...');
    const newScan = await addScan(scanData);
    console.log('✅ Mobile scan saved successfully:', newScan);

    return res.status(200).json({
      success: true,
      message: `SUCCESS: ${friendlyDiseaseName} detected!`,
      data: newScan,
      scan_id: newScan.id,
      ai_result: friendlyDiseaseName,
      confidence: `${confidencePercent}%`,
      mobile_detection: diseaseDetected,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Mobile upload error:', error);
    return res.status(500).json({
      success: false,
      error: 'Mobile upload failed',
      message: error.message,
      debug_info: {
        timestamp: new Date().toISOString(),
        error_type: error.name
      }
    });
  }
}
