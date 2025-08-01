// api/upload-scan.js - Real Cloudinary Integration
import { v2 as cloudinary } from 'cloudinary';
import formidable from 'formidable';
import fs from 'fs';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const config = {
  api: {
    bodyParser: false,
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
    console.log('Upload request received');

    // Parse form data
    const form = formidable({
      uploadDir: '/tmp',
      keepExtensions: true,
      maxFileSize: 10 * 1024 * 1024, // 10MB
    });

    const [fields, files] = await form.parse(req);
    
    console.log('Form parsed successfully');
    console.log('Fields:', fields);
    console.log('Files:', Object.keys(files));

    // Get the uploaded image
    const imageFile = files.image?.[0];
    if (!imageFile) {
      return res.status(400).json({
        success: false,
        message: 'No image file uploaded'
      });
    }

    console.log('Image file found:', imageFile.originalFilename);

    // Upload to Cloudinary
    const uploadResult = await cloudinary.uploader.upload(imageFile.filepath, {
      folder: 'coconut-scans',
      public_id: `scan_${Date.now()}`,
      overwrite: true,
      resource_type: 'image'
    });

    console.log('Cloudinary upload successful:', uploadResult.secure_url);

    // Clean up temp file
    fs.unlinkSync(imageFile.filepath);

    // Parse scan data
    let scanData = {};
    try {
      scanData = JSON.parse(fields.scan_data?.[0] || '{}');
    } catch (e) {
      console.log('No scan data provided, using defaults');
    }

    // Create scan record
    const scan = {
      id: uploadResult.public_id,
      timestamp: new Date().toISOString(),
      image_url: uploadResult.secure_url,
      disease_detected: scanData.detectionResult?.primaryDisease || 'unknown',
      confidence: scanData.detectionResult?.confidence || 0,
      device_info: scanData.deviceInfo || {},
      location: scanData.locationInfo || null,
      ...scanData
    };

    // Save to data file (simple JSON storage)
    const dataFile = '/tmp/scans.json';
    let scans = [];
    
    try {
      if (fs.existsSync(dataFile)) {
        const data = fs.readFileSync(dataFile, 'utf8');
        scans = JSON.parse(data);
      }
    } catch (e) {
      console.log('Creating new scans file');
    }

    scans.unshift(scan); // Add new scan to beginning
    scans = scans.slice(0, 100); // Keep only latest 100 scans

    try {
      fs.writeFileSync(dataFile, JSON.stringify(scans, null, 2));
      console.log('Scan saved to data file');
    } catch (e) {
      console.log('Could not save to file, but upload successful');
    }

    return res.status(200).json({
      success: true,
      message: 'Scan uploaded successfully with image!',
      data: scan,
      scan_id: scan.id,
      image_url: scan.image_url,
      timestamp: scan.timestamp
    });

  } catch (error) {
    console.error('Upload error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error: ' + error.message
    });
  }
}
