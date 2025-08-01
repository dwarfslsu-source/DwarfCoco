// 🆓 COMPLETELY FREE - NO DATABASE NEEDED!
// Local file storage for coconut disease scans
const fs = require('fs');
const path = require('path');
const cloudinary = require('cloudinary').v2;
const formidable = require('formidable');

// Configure Cloudinary (FREE: 25GB storage, 25GB bandwidth)
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Local file database (completely free - no external database needed!)
const DB_FILE = path.join('/tmp', 'coconut-scans.json');

function initDatabase() {
  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify([]));
  }
}

function readScans() {
  initDatabase();
  try {
    const data = fs.readFileSync(DB_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading database:', error);
    return [];
  }
}

function writeScans(scans) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(scans, null, 2));
    return true;
  } catch (error) {
    console.error('Error writing database:', error);
    return false;
  }
}

export default async function handler(req, res) {
  // Enable CORS for mobile app
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Parse multipart form data
    const form = new formidable.IncomingForm();
    
    const { fields, files } = await new Promise((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) reject(err);
        else resolve({ fields, files });
      });
    });

    console.log('📱 Received upload request');
    console.log('Fields:', Object.keys(fields));
    console.log('Files:', Object.keys(files));

    // Parse scan data from JSON
    let scanData = {};
    if (fields.scan_data) {
      try {
        scanData = JSON.parse(Array.isArray(fields.scan_data) ? fields.scan_data[0] : fields.scan_data);
        console.log('✅ Parsed scan data:', scanData);
      } catch (e) {
        console.error('❌ Error parsing scan data:', e);
        return res.status(400).json({ error: 'Invalid scan data format' });
      }
    }

    let imageUrl = null;

    // Upload image to Cloudinary if provided
    if (files.image) {
      console.log('📸 Uploading image to Cloudinary...');
      
      try {
        const imageFile = Array.isArray(files.image) ? files.image[0] : files.image;
        
        const uploadResult = await cloudinary.uploader.upload(
          imageFile.filepath,
          {
            folder: 'coconut-scans',
            public_id: `scan_${Date.now()}`,
            transformation: [
              { width: 800, height: 600, crop: 'limit' },
              { quality: 'auto:good' }
            ]
          }
        );
        
        imageUrl = uploadResult.secure_url;
        console.log('✅ Image uploaded successfully');
        
      } catch (uploadError) {
        console.error('❌ Image upload failed:', uploadError);
        // Continue without image if upload fails
      }
    }

    // Read existing scans
    const scans = readScans();
    
    // Create new scan record from the structured data
    const newScan = {
      id: scans.length + 1,
      timestamp: new Date().toISOString(),
      device_id: scanData.userId || `device_${Date.now()}`,
      disease_detected: scanData.detectionResult?.primaryDisease || 'unknown',
      confidence: parseFloat(scanData.detectionResult?.confidence || 0),
      severity_level: scanData.detectionResult?.severityLevel || 'Unknown',
      recommendation: scanData.detectionResult?.recommendation || '',
      image_url: imageUrl,
      location_latitude: scanData.locationInfo?.latitude || null,
      location_longitude: scanData.locationInfo?.longitude || null,
      app_version: scanData.deviceInfo?.appVersion || '1.0',
      model_version: scanData.deviceInfo?.modelVersion || '1.0',
      device_model: scanData.deviceInfo?.deviceModel || 'Unknown',
      android_version: scanData.deviceInfo?.androidVersion || 'Unknown',
      processing_time_ms: parseInt(scanData.detectionResult?.processingTimeMs || 0),
      all_predictions: JSON.stringify(scanData.detectionResult?.allPredictions || {}),
      notes: scanData.notes || '',
      image_name: scanData.imageName || 'unknown.jpg',
      image_size: parseInt(scanData.imageSize || 0)
    };
    
    // Add to scans array
    scans.push(newScan);
    
    // Write back to file
    const success = writeScans(scans);
    
    if (success) {
      console.log(`✅ New scan saved: ${newScan.disease_detected} (ID: ${newScan.id})`);
      
      res.status(201).json({ 
        success: true, 
        message: 'Scan uploaded successfully',
        scan_id: newScan.id,
        image_url: imageUrl,
        timestamp: newScan.timestamp
      });
    } else {
      res.status(500).json({ error: 'Failed to save scan' });
    }
    
  } catch (error) {
    console.error('❌ Upload error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
}
