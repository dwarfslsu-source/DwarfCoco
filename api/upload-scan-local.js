// 🆓 COMPLETELY FREE - LOCAL DATABASE VERSION
// No external database needed - works offline!

const fs = require('fs');
const path = require('path');

// Simple JSON file database (completely free)
const DB_FILE = path.join('/tmp', 'scans.json');

// Initialize database file if it doesn't exist
function initDatabase() {
  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify([]));
  }
}

// Read all scans
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

// Write scans
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
    if (!scanData.device_id || !scanData.disease_detected || !scanData.confidence) {
      return res.status(400).json({ 
        error: 'Missing required fields: device_id, disease_detected, confidence' 
      });
    }

    // Read existing scans
    const scans = readScans();
    
    // Add new scan with ID
    const newScan = {
      id: scans.length + 1,
      timestamp: new Date().toISOString(),
      ...scanData
    };
    
    scans.push(newScan);
    
    // Write back to file
    const success = writeScans(scans);
    
    if (success) {
      console.log('✅ New scan saved:', newScan.id);
      res.status(201).json({ 
        success: true, 
        message: 'Scan uploaded successfully',
        scan_id: newScan.id 
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
