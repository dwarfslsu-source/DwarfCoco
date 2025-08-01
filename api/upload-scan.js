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

// Local file database (completely free - no DATABASE_URL needed!)
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
    res.status(200).end();
    return;
  }

  if (req.method === 'POST') {
    try {
      const { 
        id, 
        timestamp, 
        disease_detected, 
        confidence, 
        all_predictions, 
        severity_level, 
        recommendation,
        device_info,
        location,
        user_notes,
        image_data // Base64 image data
      } = req.body;

      // Upload image to Cloudinary (FREE)
      let imageUrl = '';
      if (image_data) {
        const uploadResponse = await cloudinary.uploader.upload(image_data, {
          folder: 'coconut-scans',
          public_id: id,
          format: 'jpg',
          quality: 'auto:low' // Optimize for free tier
        });
        imageUrl = uploadResponse.secure_url;
      }

      // Save to database
      const connection = await createConnection();
      
      const insertQuery = `
        INSERT INTO coconut_scans (
          id, timestamp, disease_detected, confidence, image_url, 
          all_predictions, severity_level, recommendation, device_info, 
          location, user_notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      await connection.execute(insertQuery, [
        id,
        timestamp,
        disease_detected,
        confidence,
        imageUrl,
        JSON.stringify(all_predictions),
        severity_level,
        recommendation,
        JSON.stringify(device_info),
        JSON.stringify(location),
        user_notes
      ]);

      await connection.end();

      res.status(200).json({
        success: true,
        message: 'Scan uploaded successfully!',
        scan_id: id,
        image_url: imageUrl,
        dashboard_url: 'https://coconut-dashboard.vercel.app'
      });

    } catch (error) {
      console.error('Upload error:', error);
      res.status(500).json({
        success: false,
        message: 'Upload failed: ' + error.message
      });
    }
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
}
