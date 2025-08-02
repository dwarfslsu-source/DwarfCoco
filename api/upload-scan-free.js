// 🆓 COMPLETELY FREE LOCAL DATABASE VERSION
const fs = require('fs');
const path = require('path');
const cloudinary = require('cloudinary').v2;

// Use the same storage as scans.js for consistency
// Import will be handled dynamically

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

function getRecommendation(disease) {
  const recommendations = {
    'CCI_Caterpillars': 'Remove affected leaves and apply organic pesticide',
    'CCI_Leaflets': 'Improve drainage and apply fungicide treatment', 
    'Healthy_Leaves': 'Continue current care routine',
    'WCLWD_DryingofLeaflets': 'Increase watering and check for pests',
    'WCLWD_Flaccidity': 'Check soil moisture and nutrient levels',
    'WCLWD_Yellowing': 'Apply nitrogen-rich fertilizer and improve soil drainage'
  };
  return recommendations[disease] || 'Consult agricultural expert for proper treatment';
}

module.exports = async function handler(req, res) {
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
    console.log('📱 Mobile upload request received');
    console.log('📋 Request method:', req.method);
    console.log('📋 Request headers:', JSON.stringify(req.headers, null, 2));
    console.log('📋 Request body:', JSON.stringify(req.body, null, 2));
    
    // Use the ACTUAL data from the mobile app
    const currentTime = new Date().toISOString();
    
    // Get the real data from the mobile app request
    const mobileData = req.body;
    
    // Map the mobile disease names to user-friendly names
    const diseaseNameMap = {
      'CCI_Caterpillars': 'Caterpillar Infestation',
      'CCI_Leaflets': 'Coconut Leaflet Disease', 
      'Healthy_Leaves': 'Healthy Coconut',
      'WCLWD_DryingofLeaflets': 'Leaf Drying Disease',
      'WCLWD_Flaccidity': 'Leaf Flaccidity',
      'WCLWD_Yellowing': 'Leaf Yellowing Disease'
    };
    
    // Extract disease detection from various possible structures
    let diseaseDetected = 'Unknown';
    let confidence = 0.0;
    let deviceId = mobileData.device_id || mobileData.deviceId || 'mobile_device_' + Date.now();
    
    // Try different possible data structures from mobile app
    if (mobileData.detectionResult?.primaryDisease) {
      diseaseDetected = mobileData.detectionResult.primaryDisease;
      confidence = mobileData.detectionResult.confidence || 0.0;
    } else if (mobileData.diseaseDetected) {
      diseaseDetected = mobileData.diseaseDetected;
      confidence = mobileData.confidence || 0.0;
    } else if (mobileData.disease_detected) {
      diseaseDetected = mobileData.disease_detected;
      confidence = mobileData.confidence || 0.0;
    }
    
    const friendlyDiseaseName = diseaseNameMap[diseaseDetected] || diseaseDetected;
    
    console.log(`🔬 Mobile detected: ${diseaseDetected} (${friendlyDiseaseName}) with ${Math.round(confidence * 100)}% confidence`);
    
    const scanData = mobileData;
    
    // Validate required fields (now we have disease detection from mobile)
    if (!deviceId || !diseaseDetected) {
      return res.status(400).json({ 
        error: 'Missing required fields: device_id, disease_detected',
        received_data: {
          device_id: deviceId,
          disease_detected: diseaseDetected,
          original_body: mobileData
        }
      });
    }

    let imageUrl = null;

    // Upload image to Cloudinary if provided (handle both field names)
    const imageBase64 = scanData.image_base64 || scanData.imageBase64;
    if (imageBase64) {
      console.log('📸 Uploading image to Cloudinary...');
      
      try {
        const uploadResult = await cloudinary.uploader.upload(
          `data:image/jpeg;base64,${imageBase64}`,
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
    // const scans = readScans();
    
    // Create new scan record for Supabase
    const newScan = {
      device_id: deviceId,
      timestamp: new Date().toISOString(),
      disease_detected: friendlyDiseaseName,
      confidence: Math.round(confidence * 100),
      severity_level: confidence > 0.8 ? 'high' : confidence > 0.5 ? 'medium' : 'low',
      recommendation: getRecommendation(diseaseDetected),
      image_url: imageUrl || 'https://res.cloudinary.com/dpezf22nd/image/upload/v1/coconut-scans/mobile-upload.jpg',
      location_latitude: parseFloat(scanData.location_latitude) || null,
      location_longitude: parseFloat(scanData.location_longitude) || null,
      app_version: scanData.app_version || '1.0',
      model_version: scanData.model_version || '1.0',
      processing_time_ms: parseInt(scanData.processing_time_ms) || 0,
      all_predictions: scanData.all_predictions || '',
      mobile_disease_code: diseaseDetected,
      raw_mobile_data: JSON.stringify(mobileData)
    };
    
    // Save to the same storage system as scans.js
    try {
      // Dynamic import for ES modules
      const { addScan } = await import('../lib/supabase-storage.js');
      const savedScan = await addScan(newScan);
      
      if (savedScan) {
        console.log(`✅ New scan saved to Supabase: ${friendlyDiseaseName} (${diseaseDetected}) (ID: ${savedScan.id})`);
        
        res.status(201).json({ 
          success: true, 
          message: `Mobile scan successful: ${friendlyDiseaseName} detected!`,
          scan_id: savedScan.id,
          image_url: imageUrl || newScan.image_url,
          ai_result: friendlyDiseaseName,
          confidence: `${Math.round(confidence * 100)}%`,
          mobile_detection: diseaseDetected,
          data: savedScan
        });
      } else {
        res.status(500).json({ error: 'Failed to save scan to database' });
      }
    } catch (dbError) {
      console.error('❌ Database error, falling back to local storage:', dbError);
      
      // Fallback to local file storage if database fails
      const scans = readScans();
      newScan.id = scans.length + 1;
      scans.push(newScan);
      const success = writeScans(scans);
      
      if (success) {
        console.log(`✅ New scan saved locally: ${friendlyDiseaseName} (${diseaseDetected}) (ID: ${newScan.id})`);
        
        res.status(201).json({ 
          success: true, 
          message: `Mobile scan successful: ${friendlyDiseaseName} detected!`,
          scan_id: newScan.id,
          image_url: imageUrl || newScan.image_url,
          ai_result: friendlyDiseaseName,
          confidence: `${Math.round(confidence * 100)}%`,
          mobile_detection: diseaseDetected,
          data: newScan
        });
      } else {
        res.status(500).json({ error: 'Failed to save scan' });
      }
    }
    
  } catch (error) {
    console.error('❌ Upload error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
}
