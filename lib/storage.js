// lib/storage.js - In-memory storage for Vercel (persistent during session)
let scansMemory = [
  {
    id: 1,
    timestamp: new Date().toISOString(),
    disease_detected: 'Healthy (Sample)',
    confidence: 95,
    severity_level: '🟢 Low Risk',
    image_url: 'https://res.cloudinary.com/dggotlpbg/image/upload/v1/coconut-scans/healthy-sample.jpg'
  }
];

export async function getScans() {
  console.log('📊 Getting scans, total count:', scansMemory.length);
  return [...scansMemory]; // Return copy to prevent external modification
}

export async function addScan(scanData) {
  const newScan = {
    id: Date.now(), // Use timestamp as ID
    timestamp: new Date().toISOString(),
    ...scanData
  };
  
  scansMemory.unshift(newScan); // Add to beginning
  
  // Keep only latest 50 scans
  if (scansMemory.length > 50) {
    scansMemory.splice(50);
  }
  
  console.log('✅ Scan added to memory! Total scans:', scansMemory.length);
  console.log('📱 New scan data:', newScan);
  return newScan;
}
