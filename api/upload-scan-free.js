// api/upload-scan-free.js - Simple upload without images using Supabase
// Updated: 2025-08-02 - Fresh deployment trigger v2
import { addScan } from '../lib/supabase-storage.js';

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    console.log('📱 Simple mobile upload received');
    console.log('📋 Request body:', JSON.stringify(req.body, null, 2));
    
    const scanData = req.body;
    
    // Map disease names to user-friendly versions
    const diseaseNameMap = {
      'CCI_Caterpillars': 'Caterpillar Infestation',
      'CCI_Leaflets': 'Coconut Leaflet Disease', 
      'Healthy_Leaves': 'Healthy Coconut',
      'WCLWD_DryingofLeaflets': 'Leaf Drying Disease',
      'WCLWD_Flaccidity': 'Leaf Flaccidity',
      'WCLWD_Yellowing': 'Leaf Yellowing Disease'
    };
    
    // Extract data from various possible field names
    const diseaseDetected = scanData.diseaseDetected || scanData.disease_detected || scanData.detectionResult?.primaryDisease || 'Unknown';
    const confidence = parseFloat(scanData.confidence || scanData.detectionResult?.confidence || 0.0);
    const friendlyDiseaseName = diseaseNameMap[diseaseDetected] || diseaseDetected;
    
    const currentTime = new Date().toISOString();
    const uploadData = {
      disease_detected: friendlyDiseaseName,
      confidence: Math.round(confidence * 100),
      severity_level: confidence > 0.8 ? 'high' : confidence > 0.5 ? 'medium' : 'low',
      image_url: 'https://res.cloudinary.com/dpezf22nd/image/upload/v1/coconut-scans/mobile-default.jpg',
      status: 'MOBILE UPLOAD (NO IMAGE)',
      upload_time: currentTime,
      analysis_complete: true,
      mobile_disease_code: diseaseDetected,
      raw_mobile_data: scanData
    };

    // Save to Supabase database
    console.log('💾 Saving scan to Supabase...');
    const newScan = await addScan(uploadData);
    console.log('✅ Mobile scan saved successfully:', newScan);

    return res.status(200).json({
      success: true,
      message: `Mobile scan successful: ${friendlyDiseaseName} detected!`,
      data: newScan,
      scan_id: newScan.id,
      timestamp: newScan.timestamp,
      ai_result: friendlyDiseaseName,
      confidence: `${Math.round(confidence * 100)}%`,
      mobile_detection: diseaseDetected
    });

  } catch (error) {
    console.error('❌ Mobile upload error:', error);
    return res.status(500).json({
      success: false,
      message: 'Mobile upload failed: ' + error.message,
      error_type: error.name,
      debug_info: {
        timestamp: new Date().toISOString(),
        error_message: error.message
      }
    });
  }
}
