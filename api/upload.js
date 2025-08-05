// Consolidated upload API - handles all upload scenarios
export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { type, ...data } = req.body;

    switch (type) {
      case 'mobile':
        return handleMobileUpload(req, res, data);
      case 'simple':
        return handleSimpleUpload(req, res, data);
      case 'free':
        return handleFreeUpload(req, res, data);
      case 'test':
        return handleTestUpload(req, res, data);
      default:
        return handleDefaultUpload(req, res, data);
    }
  } catch (error) {
    console.error('Upload error:', error);
    return res.status(500).json({ 
      error: 'Upload failed',
      message: error.message 
    });
  }
}

async function handleMobileUpload(req, res, data) {
  // Mobile upload logic here
  return res.status(200).json({
    success: true,
    type: 'mobile',
    message: 'Mobile upload successful'
  });
}

async function handleSimpleUpload(req, res, data) {
  // Simple upload logic here
  return res.status(200).json({
    success: true,
    type: 'simple',
    message: 'Simple upload successful'
  });
}

async function handleFreeUpload(req, res, data) {
  // Free upload logic here
  return res.status(200).json({
    success: true,
    type: 'free',
    message: 'Free upload successful'
  });
}

async function handleTestUpload(req, res, data) {
  // Test upload logic here
  return res.status(200).json({
    success: true,
    type: 'test',
    message: 'Test upload successful'
  });
}

async function handleDefaultUpload(req, res, data) {
  // Default upload logic here
  return res.status(200).json({
    success: true,
    type: 'default',
    message: 'Default upload successful'
  });
}
