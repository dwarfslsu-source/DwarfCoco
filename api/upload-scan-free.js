// api/upload-scan-free.js - Upload with image support using Supabase and Cloudinary
// Updated: 2025-08-02 - Added base64 image upload support v3
import { addScan } from '../lib/supabase-storage.js';
import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
  cloud_name: 'dpezf22nd',
  api_key: '982718918645139',
  api_secret: 'WgxBPp-yrLV_H3_2lNZ2pFQrOHk'
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
    console.log('📱 Mobile upload received (with image support)');
    console.log('📋 Request body keys:', Object.keys(req.body));
    console.log('📋 Has imageBase64?', !!req.body.imageBase64);
    console.log('📋 ImageBase64 length:', req.body.imageBase64 ? req.body.imageBase64.length : 0);
    
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
    const diseaseDetected = scanData.diseaseDetected || 
                           scanData.disease_detected || 
                           scanData.detectionResult?.primaryDisease || 
                           'Unknown';
    const confidence = parseFloat(scanData.confidence || 
                                scanData.detectionResult?.confidence || 
                                0.0);
    const friendlyDiseaseName = diseaseNameMap[diseaseDetected] || diseaseDetected;
    
    // Handle image upload if base64 image is provided
    let imageUrl = 'https://res.cloudinary.com/dpezf22nd/image/upload/v1/coconut-scans/mobile-default.jpg';
    
    // Check multiple possible locations for imageBase64
    const imageBase64 = scanData.imageBase64 || 
                       scanData.image_base64 || 
                       scanData.detectionResult?.imageBase64 || 
                       '';
    
    console.log('🔍 Found imageBase64:', imageBase64.substring(0, 50) + '...');
    
    if (imageBase64 && imageBase64.length > 0) {
      console.log('🖼️ Base64 image found, uploading to Cloudinary...');
      try {
        const uploadResult = await cloudinary.uploader.upload(
          `data:image/jpeg;base64,${imageBase64}`,
          {
            folder: 'coconut-scans',
            public_id: `mobile-scan-${Date.now()}`,
            resource_type: 'image'
          }
        );
        imageUrl = uploadResult.secure_url;
        console.log('✅ Image uploaded successfully:', imageUrl);
      } catch (uploadError) {
        console.error('❌ Image upload failed:', uploadError);
        // Continue with default image
      }
    } else {
      console.log('📄 No image provided, using default');
    }
    
    const currentTime = new Date().toISOString();
    const uploadData = {
      disease_detected: friendlyDiseaseName,
      confidence: Math.round(confidence * 100),
      severity_level: confidence > 0.8 ? 'high' : confidence > 0.5 ? 'medium' : 'low',
      image_url: imageUrl,
      status: imageUrl.includes('mobile-default') ? 'MOBILE UPLOAD (NO IMAGE)' : 'MOBILE UPLOAD WITH IMAGE',
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
      image_url: imageUrl,
      ai_result: friendlyDiseaseName,
      confidence: `${Math.round(confidence * 100)}%`,
      mobile_detection: diseaseDetected,
      has_image: !imageUrl.includes('mobile-default')
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
