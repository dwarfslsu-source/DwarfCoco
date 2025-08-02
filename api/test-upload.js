// api/test-upload.js - Simple JSON upload for testing
import { addScan } from '../lib/supabase-storage.js';
import { analyzeImage } from '../lib/disease-detection.js';

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS, GET');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Allow both GET and POST for debugging
  if (req.method !== 'POST' && req.method !== 'GET') {
    console.log(`❌ Method not allowed: ${req.method}`);
    return res.status(405).json({ success: false, message: `Method ${req.method} not allowed` });
  }

  // Handle GET request for testing
  if (req.method === 'GET') {
    return res.status(200).json({ 
      success: true, 
      message: 'Test upload endpoint is working! v2.0 - Mobile data extraction enabled',
      method: 'GET',
      timestamp: new Date().toISOString()
    });
  }

  try {
    console.log('📱 Mobile upload request received');
    console.log('📋 Request method:', req.method);
    console.log('📋 Request headers:', JSON.stringify(req.headers, null, 2));
    console.log('📋 Request body:', JSON.stringify(req.body, null, 2));
    
    // Use the ACTUAL data from the mobile app
    const currentTime = new Date().toISOString();
    
    // Get the real data from the mobile app request
    const mobileData = req.body;
    
    // Map the mobile disease names to user-friendly names
    const diseaseNameMap = {
      'CCI_Caterpillars': 'Caterpillar Infestation',
      'CCI_Leaflets': 'Coconut Leaflet Disease', 
      'Healthy_Leaves': 'Healthy Coconut',
      'WCLWD_DryingofLeaflets': 'Leaf Drying Disease',
      'WCLWD_Flaccidity': 'Leaf Flaccidity',
      'WCLWD_Yellowing': 'Leaf Yellowing Disease'
    };
    
    // Extract disease detection from various possible structures
    let diseaseDetected = 'Unknown';
    let confidence = 0.0;
    
    // Try different possible data structures
    if (mobileData.detectionResult?.primaryDisease) {
      diseaseDetected = mobileData.detectionResult.primaryDisease;
      confidence = mobileData.detectionResult.confidence || 0.0;
    } else if (mobileData.diseaseDetected) {
      diseaseDetected = mobileData.diseaseDetected;
      confidence = mobileData.confidence || 0.0;
    } else if (mobileData.disease_detected) {
      diseaseDetected = mobileData.disease_detected;
      confidence = mobileData.confidence || 0.0;
    }
    
    const friendlyDiseaseName = diseaseNameMap[diseaseDetected] || diseaseDetected;
    
    console.log(`🔬 Mobile detected: ${diseaseDetected} (${friendlyDiseaseName}) with ${Math.round(confidence * 100)}% confidence`);
    
    const scanData = {
      disease_detected: friendlyDiseaseName,
      confidence: Math.round(confidence * 100),
      severity_level: confidence > 0.8 ? 'high' : confidence > 0.5 ? 'medium' : 'low',
      image_url: 'https://res.cloudinary.com/dpezf22nd/image/upload/v1/coconut-scans/mobile-upload.jpg',
      status: 'REAL MOBILE UPLOAD',
      upload_time: currentTime,
      analysis_complete: true,
      mobile_disease_code: diseaseDetected,
      raw_mobile_data: mobileData
    };

    // Add to Supabase database
    console.log('💾 Saving to database...');
    const newScan = await addScan(scanData);
    console.log('✅ New scan stored successfully:', newScan);

    return res.status(200).json({
      success: true,
      message: `Mobile scan successful: ${friendlyDiseaseName} detected!`,
      data: newScan,
      scan_id: newScan.id,
      timestamp: newScan.timestamp,
      image_url: newScan.image_url,
      ai_result: friendlyDiseaseName,
      confidence: `${Math.round(confidence * 100)}%`,
      mobile_detection: diseaseDetected
    });

  } catch (error) {
    console.error('❌ Test upload error:', error);
    console.error('❌ Error stack:', error.stack);
    return res.status(500).json({
      success: false,
      message: 'Test upload failed: ' + error.message,
      error_type: error.name,
      debug_info: {
        timestamp: new Date().toISOString(),
        error_message: error.message,
        stack: error.stack
      }
    });
  }
}
