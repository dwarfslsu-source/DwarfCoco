// api/test-upload.js - Simple JSON upload for testing
import { addScan } from '../lib/supabase-storage.js';
import { analyzeImage } from '../lib/disease-detection.js';

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
    console.log('🧪 Test upload request received');
    console.log('📋 Request body keys:', Object.keys(req.body || {}));
    
    // Simple test without image upload - just create a scan with AI detection
    const currentTime = new Date().toISOString();
    
    // Use a sample image URL for testing
    const testImageUrl = 'https://res.cloudinary.com/dpezf22nd/image/upload/v1/coconut-scans/test-coconut.jpg';
    
    console.log('🔬 Running AI disease analysis...');
    const aiResults = await analyzeImage(testImageUrl);
    console.log('🧠 AI Results:', aiResults);
    
    const scanData = {
      disease_detected: aiResults.disease_detected,
      confidence: aiResults.confidence,
      severity_level: aiResults.severity_level,
      image_url: testImageUrl,
      status: 'test_upload_from_mobile',
      upload_time: currentTime,
      analysis_complete: aiResults.analysis_complete
    };

    // Add to Supabase database
    console.log('💾 Saving to database...');
    const newScan = await addScan(scanData);
    console.log('✅ New scan stored successfully:', newScan);

    return res.status(200).json({
      success: true,
      message: 'Test upload successful with AI detection!',
      data: newScan,
      scan_id: newScan.id,
      timestamp: newScan.timestamp,
      image_url: newScan.image_url,
      ai_result: aiResults.disease_detected
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
