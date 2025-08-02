// api/upload-mobile.js - Handle real mobile uploads with images
import { addScan } from '../lib/supabase-storage.js';
import multiparty from 'multiparty';
import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
  cloud_name: 'dpezf22nd',
  api_key: '982718918645139',
  api_secret: 'WgxBPp-yrLV_H3_2lNZ2pFQrOHk'
});

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    console.log('📱 Real mobile upload with image received');
    
    // Parse multipart form data
    const form = new multiparty.Form();
    
    const parsePromise = new Promise((resolve, reject) => {
      const fields = {};
      const files = {};
      
      form.on('field', (name, value) => {
        fields[name] = value;
      });
      
      form.on('part', (part) => {
        if (part.filename) {
          const chunks = [];
          part.on('data', (chunk) => chunks.push(chunk));
          part.on('end', () => {
            files[part.name] = {
              buffer: Buffer.concat(chunks),
              filename: part.filename,
              mimetype: part.headers['content-type']
            };
          });
        }
      });
      
      form.on('close', () => resolve({ fields, files }));
      form.on('error', reject);
    });
    
    form.parse(req);
    const { fields, files } = await parsePromise;
    
    console.log('📋 Parsed fields:', fields);
    console.log('🖼️ Files received:', Object.keys(files));
    
    // Map disease names
    const diseaseNameMap = {
      'CCI_Caterpillars': 'Caterpillar Infestation',
      'CCI_Leaflets': 'Coconut Leaflet Disease', 
      'Healthy_Leaves': 'Healthy Coconut',
      'WCLWD_DryingofLeaflets': 'Leaf Drying Disease',
      'WCLWD_Flaccidity': 'Leaf Flaccidity',
      'WCLWD_Yellowing': 'Leaf Yellowing Disease'
    };
    
    // Extract scan data
    const diseaseDetected = fields.diseaseDetected || fields.disease_detected || 'Unknown';
    const confidence = parseFloat(fields.confidence || 0.0);
    const friendlyDiseaseName = diseaseNameMap[diseaseDetected] || diseaseDetected;
    
    let imageUrl = 'https://res.cloudinary.com/dpezf22nd/image/upload/v1/coconut-scans/mobile-default.jpg';
    
    // Upload image to Cloudinary if provided
    if (files.image && files.image.buffer) {
      console.log('⬆️ Uploading image to Cloudinary...');
      try {
        const uploadResult = await new Promise((resolve, reject) => {
          cloudinary.uploader.upload_stream(
            {
              resource_type: 'image',
              folder: 'coconut-scans',
              public_id: `mobile-scan-${Date.now()}`,
            },
            (error, result) => {
              if (error) reject(error);
              else resolve(result);
            }
          ).end(files.image.buffer);
        });
        
        imageUrl = uploadResult.secure_url;
        console.log('✅ Image uploaded successfully:', imageUrl);
      } catch (uploadError) {
        console.error('❌ Image upload failed:', uploadError);
        // Continue with default image
      }
    }
    
    const currentTime = new Date().toISOString();
    const scanData = {
      disease_detected: friendlyDiseaseName,
      confidence: Math.round(confidence * 100),
      severity_level: confidence > 0.8 ? 'high' : confidence > 0.5 ? 'medium' : 'low',
      image_url: imageUrl,
      status: 'REAL MOBILE UPLOAD',
      upload_time: currentTime,
      analysis_complete: true,
      mobile_disease_code: diseaseDetected,
      raw_mobile_data: fields
    };

    // Save to database
    console.log('💾 Saving scan to database...');
    const newScan = await addScan(scanData);
    console.log('✅ Mobile scan saved successfully:', newScan);

    return res.status(200).json({
      success: true,
      message: `Mobile scan successful: ${friendlyDiseaseName} detected!`,
      data: newScan,
      scan_id: newScan.id,
      timestamp: newScan.timestamp,
      image_url: imageUrl,
      ai_result: friendlyDiseaseName,
      confidence: `${Math.round(confidence * 100)}%`,
      mobile_detection: diseaseDetected
    });

  } catch (error) {
    console.error('❌ Mobile upload error:', error);
    return res.status(500).json({
      success: false,
      message: 'Mobile upload failed: ' + error.message,
      error_type: error.name,
      debug_info: {
        timestamp: new Date().toISOString(),
        error_message: error.message,
        stack: error.stack
      }
    });
  }
}
