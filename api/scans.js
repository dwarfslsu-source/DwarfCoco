// api/scans.js - Return uploaded scan data from Supabase database
import { getScans } from '../lib/supabase-storage.js';

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
    // Get scans from Supabase database
    const scans = await getScans();
    
    console.log('✅ Retrieved', scans.length, 'scans from database');
    
    return res.status(200).json({
      success: true,
      scans: scans,
      total: scans.length
    });

  } catch (error) {
    console.error('❌ Scans API error:', error);
    // Return sample data if database fails
    const fallbackScans = [
      {
        id: 1,
        timestamp: new Date().toISOString(),
        disease_detected: 'Database Connection Issue',
        confidence: 0,
        severity_level: '⚠️ Fallback Data',
        image_url: 'https://res.cloudinary.com/dggotlpbg/image/upload/v1/coconut-scans/healthy-sample.jpg'
      }
    ];
    
    return res.status(500).json({
      success: false,
      scans: fallbackScans,
      total: fallbackScans.length,
      message: 'Database error: ' + error.message
    });
  }
}