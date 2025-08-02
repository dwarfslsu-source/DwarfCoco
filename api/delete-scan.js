import { deleteScan } from '../lib/supabase-storage.js';

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'DELETE') {
    return res.status(405).json({ 
      error: 'Method not allowed',
      message: 'Only DELETE requests are allowed'
    });
  }

  try {
    const { id } = req.query;

    if (!id) {
      return res.status(400).json({
        error: 'Missing scan ID',
        message: 'Scan ID is required for deletion'
      });
    }

    console.log(`🗑️ Attempting to delete scan with ID: ${id}`);

    // Delete the scan from database
    await deleteScan(id);

    console.log(`✅ Successfully deleted scan with ID: ${id}`);

    return res.status(200).json({
      success: true,
      message: 'Scan deleted successfully',
      id: id
    });

  } catch (error) {
    console.error('Unexpected error during deletion:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: 'An unexpected error occurred while deleting the scan',
      details: error.message
    });
  }
}
