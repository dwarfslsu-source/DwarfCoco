// 🆓 COMPLETELY FREE LOCAL DATABASE VERSION
const fs = require('fs');
const path = require('path');

// Local file database
const DB_FILE = path.join('/tmp', 'coconut-scans.json');

function readScans() {
  try {
    if (!fs.existsSync(DB_FILE)) {
      return [];
    }
    const data = fs.readFileSync(DB_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading database:', error);
    return [];
  }
}

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const scans = readScans();
    
    // Sort by timestamp (newest first)
    const sortedScans = scans.sort((a, b) => 
      new Date(b.timestamp) - new Date(a.timestamp)
    );
    
    console.log(`📊 Retrieved ${sortedScans.length} scans for dashboard`);
    
    res.status(200).json(sortedScans);
    
  } catch (error) {
    console.error('❌ Error retrieving scans:', error);
    res.status(500).json({ 
      error: 'Failed to retrieve scans',
      details: error.message 
    });
  }
}
