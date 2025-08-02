// api/upload-simple.js - Simplified upload without formidable
import { v2 as cloudinary } from 'cloudinary';
import { addScan } from '../lib/supabase-storage.js';
import { analyzeImage } from '../lib/disease-detection.js';

// Configure Cloudinary
cloudinary.config({
  cloud_name: 'dpezf22nd',
  api_key: '779179365417543',
  api_secret: 'YOUR_SECRET_KEY' // You'll need to set this
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
    console.log('📱 Simple upload request received');
    console.log('🔍 Content-Type:', req.headers['content-type']);
    
    // For now, let's just create a successful upload without processing the image
    const currentTime = new Date().toISOString();
    
    // Run AI disease detection
    console.log('🔬 Running AI disease analysis...');
    const aiResults = await analyzeImage('test-url');
    
    const scanData = {
      disease_detected: aiResults.disease_detected,
      confidence: aiResults.confidence,
      severity_level: aiResults.severity_level,
      image_url: 'https://res.cloudinary.com/dpezf22nd/image/upload/v1/coconut-scans/mobile-test.jpg',
      status: 'uploaded_from_mobile_simple',
      upload_time: currentTime,
      analysis_complete: aiResults.analysis_complete
    };

    // Add to database
    const newScan = await addScan(scanData);
    
    console.log('✅ Simple upload completed:', newScan);

    return res.status(200).json({
      success: true,
      message: 'Upload successful!',
      data: newScan,
      scan_id: newScan.id,
      timestamp: newScan.timestamp,
      image_url: newScan.image_url
    });

  } catch (error) {
    console.error('❌ Simple upload error:', error);
    return res.status(500).json({
      success: false,
      message: 'Upload failed: ' + error.message,
      timestamp: new Date().toISOString()
    });
  }
}
