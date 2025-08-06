// api/admin.js - Consolidated admin operations
// Handles: delete scans, health checks, system info
// Replaces: delete-scan.js, health.js
import { createClient } from '@supabase/supabase-js';
import { deleteScan } from '../lib/supabase-storage.js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { action, id } = req.query;

  try {
    switch (action) {
      case 'health':
        if (req.method !== 'GET') {
          return res.status(405).json({ success: false, message: 'Method not allowed' });
        }

        const { data: healthData, error: healthError } = await supabase
          .from('scans')
          .select('id')
          .limit(1);

        if (healthError) {
          return res.status(500).json({
            success: false,
            status: 'unhealthy',
            error: healthError.message,
            timestamp: new Date().toISOString()
          });
        }

        return res.status(200).json({
          success: true,
          status: 'healthy',
          database: 'connected',
          timestamp: new Date().toISOString(),
          version: '1.0.0'
        });

      case 'delete':
        if (req.method !== 'DELETE') {
          return res.status(405).json({ success: false, message: 'Method not allowed' });
        }

        if (!id) {
          return res.status(400).json({ success: false, message: 'Scan ID required' });
        }

        console.log('🗑️ Deleting scan:', id);

        // Delete the scan from database using lib function
        await deleteScan(id);

        console.log('✅ Scan deleted successfully');
        return res.status(200).json({
          success: true,
          message: 'Scan deleted successfully',
          id: id
        });

      case 'stats':
        if (req.method !== 'GET') {
          return res.status(405).json({ success: false, message: 'Method not allowed' });
        }

        const { data: statsData, error: statsError } = await supabase
          .from('scans')
          .select('disease_detected, confidence, upload_time, status');

        if (statsError) {
          return res.status(500).json({
            success: false,
            error: statsError.message
          });
        }

        const stats = {
          total_scans: statsData.length,
          healthy_scans: statsData.filter(s => s.disease_detected === 'Healthy Coconut').length,
          diseased_scans: statsData.filter(s => s.disease_detected !== 'Healthy Coconut').length,
          high_confidence: statsData.filter(s => s.confidence > 80).length,
          web_uploads: statsData.filter(s => s.status?.includes('WEB')).length,
          mobile_uploads: statsData.filter(s => s.status?.includes('MOBILE')).length,
          recent_scans: statsData.filter(s => {
            const scanDate = new Date(s.upload_time);
            const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
            return scanDate > oneDayAgo;
          }).length
        };

        return res.status(200).json({
          success: true,
          stats,
          timestamp: new Date().toISOString()
        });

      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid action. Use: health, delete, or stats'
        });
    }

  } catch (error) {
    console.error(' Admin operation error:', error);
    return res.status(500).json({
      success: false,
      message: 'Admin operation failed',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}
