// api/upload-scan-free.js - Backward compatibility for Android APK
// Handles Android uploads directly (same logic as upload-consolidated.js)
import { addScan } from '../lib/supabase-storage.js';
import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

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
    console.log('📱 Android upload via upload-scan-free (compatibility)');
    
    // Disease name mapping
    const diseaseNameMap = {
      'CCI_Caterpillars': 'Caterpillar Infestation',
      'CCI_Leaflets': 'Coconut Leaflet Disease', 
      'Healthy_Leaves': 'Healthy Coconut',
      'WCLWD_DryingofLeaflets': 'Leaf Drying Disease',
      'WCLWD_Flaccidity': 'Leaf Flaccidity',
      'WCLWD_Yellowing': 'Leaf Yellowing Disease'
    };

    // Parse JSON request body
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });

    await new Promise(resolve => {
      req.on('end', resolve);
    });

    let scanData;
    try {
      scanData = JSON.parse(body);
    } catch (e) {
      return res.status(400).json({ success: false, message: 'Invalid JSON' });
    }

    console.log('📋 Android data received:', Object.keys(scanData));

    // Extract disease detection data
    const diseaseDetected = scanData.diseaseDetected || 
                           scanData.disease_detected || 
                           scanData.detectionResult?.primaryDisease || 
                           'Unknown';
    
    const confidence = parseFloat(scanData.confidence || 
                                scanData.detectionResult?.confidence || 
                                0.0);
    
    const friendlyDiseaseName = diseaseNameMap[diseaseDetected] || diseaseDetected;

    // Handle base64 image
    let imageUrl = 'https://res.cloudinary.com/dggotlpbg/image/upload/v1/coconut-scans/mobile-default.jpg';
    
    const imageBase64 = scanData.imageBase64 || 
                       scanData.image_base64 || 
                       scanData.detectionResult?.imageBase64 || 
                       '';

    if (imageBase64 && imageBase64.length > 0) {
      console.log('🖼️ Uploading Android base64 image...');
      try {
        const uploadResult = await cloudinary.uploader.upload(
          `data:image/jpeg;base64,${imageBase64}`,
          {
            folder: 'coconut-scans',
            public_id: `android-scan-${Date.now()}`,
            resource_type: 'image'
          }
        );
        imageUrl = uploadResult.secure_url;
        console.log('✅ Android image uploaded:', imageUrl);
      } catch (uploadError) {
        console.error('❌ Android image upload failed:', uploadError);
      }
    }

    // Prepare upload data
    const currentTime = new Date().toISOString();
    const uploadData = {
      disease_detected: friendlyDiseaseName,
      confidence: Math.round(confidence * 100),
      severity_level: confidence > 0.8 ? 'high' : confidence > 0.5 ? 'medium' : 'low',
      image_url: imageUrl,
      status: 'ANDROID UPLOAD',
      upload_time: currentTime,
      analysis_complete: true,
      mobile_disease_code: diseaseDetected,
      raw_data: scanData
    };

    // Save to database
    console.log('💾 Saving Android scan...');
    const newScan = await addScan(uploadData);
    console.log('✅ Android scan saved:', newScan.id);

    return res.status(200).json({
      success: true,
      message: `Android upload successful: ${friendlyDiseaseName} detected!`,
      data: newScan,
      scan_id: newScan.id,
      timestamp: newScan.timestamp,
      image_url: imageUrl,
      ai_result: friendlyDiseaseName,
      confidence: `${Math.round(confidence * 100)}%`,
      upload_type: 'android'
    });

  } catch (error) {
    console.error('❌ Android upload error:', error);
    return res.status(500).json({
      success: false,
      message: 'Android upload failed: ' + error.message,
      error_type: error.name,
      timestamp: new Date().toISOString()
    });
  }
}
