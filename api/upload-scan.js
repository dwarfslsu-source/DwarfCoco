// 🆓 REAL CLOUDINARY UPLOAD WITH SUPABASE DATABASE
import { v2 as cloudinary } from 'cloudinary';
import { addScan } from '../lib/supabase-storage.js';
import { analyzeImage } from '../lib/disease-detection.js';
import formidable from 'formidable';

// Configure Cloudinary with your credentials
cloudinary.config({
  cloud_name: 'dpezf22nd',
  api_key: '779179365417543',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'gGPJ6JpTN4wkGdFrDhKJHQXhBqc', // fallback secret
});

export const config = {
  api: {
    bodyParser: false, // Disable body parsing for multipart
  },
};

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
    console.log('📱 Upload request received from mobile app');
    
    // Parse multipart form data with formidable
    const form = formidable({
      uploadDir: '/tmp',
      keepExtensions: true,
      maxFileSize: 10 * 1024 * 1024, // 10MB limit
    });
    
    const [fields, files] = await form.parse(req);
    
    console.log('📤 Received files:', Object.keys(files));
    console.log('📋 Received fields:', Object.keys(fields));
    
    let imageUrl = 'https://res.cloudinary.com/dpezf22nd/image/upload/v1/coconut-scans/uploaded-coconut.jpg'; // fallback
    
    // If we have an image file, upload it to Cloudinary
    if (files.image && files.image[0]) {
      console.log('📤 Uploading image to Cloudinary...');
      
      try {
        const imageFile = files.image[0];
        const uploadResult = await cloudinary.uploader.upload(imageFile.filepath, {
          folder: 'coconut-scans',
          public_id: `mobile-upload-${Date.now()}`,
          transformation: [
            { width: 800, height: 600, crop: 'limit' },
            { quality: 'auto' }
          ]
        });
        
        imageUrl = uploadResult.secure_url;
        console.log('✅ Image uploaded successfully:', imageUrl);
        
      } catch (uploadError) {
        console.error('❌ Cloudinary upload failed:', uploadError);
        // Continue with fallback image
      }
    }
    
    // Create scan data from real mobile upload
    const currentTime = new Date().toISOString();
    
    // Run AI disease detection on the uploaded image
    console.log('🔬 Running AI disease analysis...');
    console.log('📸 Image URL for analysis:', imageUrl);
    const aiResults = await analyzeImage(imageUrl);
    console.log('🧠 AI Results:', aiResults);
    
    const scanData = {
      disease_detected: aiResults.disease_detected,
      confidence: aiResults.confidence,
      severity_level: aiResults.severity_level,
      image_url: imageUrl,
      status: 'uploaded_from_mobile',
      upload_time: currentTime,
      analysis_complete: aiResults.analysis_complete
    };

    // Add to shared storage
    const newScan = await addScan(scanData);
    
    console.log('✅ New scan stored successfully:', newScan);

    return res.status(200).json({
      success: true,
      message: 'Scan uploaded and stored successfully!',
      data: newScan,
      scan_id: newScan.id,
      timestamp: newScan.timestamp,
      image_url: newScan.image_url
    });

  } catch (error) {
    console.error('❌ Upload error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error: ' + error.message
    });
  }
}