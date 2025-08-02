import { supabase } from '../../lib/supabase-storage';

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

    // First, get the scan details to check if it has an image to delete
    const { data: scan, error: fetchError } = await supabase
      .from('coconut_scans')
      .select('image_url')
      .eq('id', id)
      .single();

    if (fetchError) {
      console.error('Error fetching scan:', fetchError);
      return res.status(404).json({
        error: 'Scan not found',
        message: 'Could not find scan with the provided ID'
      });
    }

    // Delete the scan from database
    const { error: deleteError } = await supabase
      .from('coconut_scans')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('Error deleting scan:', deleteError);
      return res.status(500).json({
        error: 'Delete failed',
        message: 'Failed to delete scan from database',
        details: deleteError.message
      });
    }

    console.log(`✅ Successfully deleted scan with ID: ${id}`);

    // Note: We're not deleting from Cloudinary here to avoid API complexity
    // Images will remain in Cloudinary but won't be accessible from the app
    // This saves on storage management complexity while still cleaning up the database

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
