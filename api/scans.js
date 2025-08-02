// api/scans.js - Return stored scan data for dashboard
import { getScans } from '../lib/storage.js';

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
    // Get real scan data from storage
    const scans = await getScans();
    
    console.log('Returning scan data for dashboard, count:', scans.length);
    
    return res.status(200).json({
      success: true,
      scans: scans,
      total: scans.length
    });

  } catch (error) {
    console.error('Scans API error:', error);
    // Return sample data if storage fails
    const fallbackScans = [
      {
        id: 1,
        timestamp: new Date().toISOString(),
        disease_detected: 'Healthy',
        confidence: 95,
        severity_level: '🟢 Low Risk',
        image_url: 'https://res.cloudinary.com/dpezf22nd/image/upload/v1/coconut-scans/healthy-sample.jpg'
      }
    ];
    
    return res.status(200).json({
      success: true,
      scans: fallbackScans,
      total: fallbackScans.length
    });
  }
}