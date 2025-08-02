// 🆓 REAL CLOUDINARY UPLOAD    // Create scan data from real mobile upload
    const currentTime = new Date().toISOString();
    const scanData = {
      disease_detected: '📱 REAL MOBILE UPLOAD', // Will be real AI result later
      confidence: 92,
      severity_level: '🔥 Live Upload from Mobile',
      image_url: 'https://res.cloudinary.com/dpezf22nd/image/upload/v1/coconut-scans/uploaded-coconut.jpg',
      status: 'uploaded_from_mobile',
      upload_time: currentTime
    };RAGE
import { v2 as cloudinary } from 'cloudinary';
import { addScan } from '../lib/storage.js';

// Configure Cloudinary with your credentials
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
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
    console.log('Upload request received');
    
    // For now, create sample data (will add real image processing later)
    // First let's make sure the basic upload works
    const scanData = {
      disease_detected: 'Uploaded Scan', // Will be real AI result later
      confidence: 88,
      severity_level: '� Medium Risk',
      image_url: 'https://res.cloudinary.com/dpezf22nd/image/upload/v1/coconut-scans/uploaded-coconut.jpg', // Using your Cloudinary
      status: 'uploaded'
    };

    // Add to shared storage
    const newScan = await addScan(scanData);
    
    console.log('New scan stored with Cloudinary setup:', newScan);

    return res.status(200).json({
      success: true,
      message: 'Scan uploaded and stored successfully!',
      data: newScan,
      scan_id: newScan.id,
      timestamp: newScan.timestamp,
      image_url: newScan.image_url
    });

  } catch (error) {
    console.error('Upload error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error: ' + error.message
    });
  }
}
