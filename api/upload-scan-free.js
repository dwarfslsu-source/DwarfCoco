// 🆓 COMPLETELY FREE LOCAL DATABASE VERSION
const fs = require('fs');
const path = require('path');
const cloudinary = require('cloudinary').v2;

// Configure Cloudinary (FREE: 25GB storage, 25GB bandwidth)
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Local file database (completely free)
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
  // Enable CORS
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
    const scanData = req.body;
    
    // Validate required fields
    if (!scanData.device_id || !scanData.disease_detected) {
      return res.status(400).json({ 
        error: 'Missing required fields: device_id, disease_detected' 
      });
    }

    let imageUrl = null;

    // Upload image to Cloudinary if provided
    if (scanData.image_base64) {
      console.log('📸 Uploading image to Cloudinary...');
      
      try {
        const uploadResult = await cloudinary.uploader.upload(
          `data:image/jpeg;base64,${scanData.image_base64}`,
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
    
    // Create new scan record
    const newScan = {
      id: scans.length + 1,
      device_id: scanData.device_id,
      timestamp: new Date().toISOString(),
      disease_detected: scanData.disease_detected,
      confidence: parseFloat(scanData.confidence) || 0,
      severity_level: scanData.severity_level || 'Unknown',
      recommendation: scanData.recommendation || '',
      image_url: imageUrl,
      location_latitude: parseFloat(scanData.location_latitude) || null,
      location_longitude: parseFloat(scanData.location_longitude) || null,
      app_version: scanData.app_version || '1.0',
      model_version: scanData.model_version || '1.0',
      processing_time_ms: parseInt(scanData.processing_time_ms) || 0,
      all_predictions: scanData.all_predictions || ''
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
        image_url: imageUrl
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
