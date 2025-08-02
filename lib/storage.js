// lib/storage.js - Simple file-based storage for Vercel
import { promises as fs } from 'fs';
import path from 'path';

const STORAGE_FILE = '/tmp/scans.json';

export async function getScans() {
  try {
    const data = await fs.readFile(STORAGE_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    // File doesn't exist yet, return sample data
    return [
      {
        id: 1,
        timestamp: new Date().toISOString(),
        disease_detected: 'Healthy',
        confidence: 95,
        severity_level: '🟢 Low Risk',
        image_url: 'https://res.cloudinary.com/dpezf22nd/image/upload/v1/coconut-scans/healthy-sample.jpg'
      }
    ];
  }
}

export async function addScan(scanData) {
  try {
    const scans = await getScans();
    const newScan = {
      id: Date.now(), // Use timestamp as ID
      timestamp: new Date().toISOString(),
      ...scanData
    };
    
    scans.unshift(newScan); // Add to beginning
    
    // Keep only latest 50 scans
    if (scans.length > 50) {
      scans.splice(50);
    }
    
    await fs.writeFile(STORAGE_FILE, JSON.stringify(scans, null, 2));
    return newScan;
  } catch (error) {
    console.error('Storage error:', error);
    throw error;
  }
}
