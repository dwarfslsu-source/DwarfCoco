// 🆓 Health check endpoint - completely free
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
    const healthStatus = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: '🥥 Coconut Disease Detection API',
      version: '1.0.0',
      database: 'Local files (free)',
      storage: 'Cloudinary (free)',
      hosting: 'Vercel (free)',
      total_cost: '$0/month',
      features: [
        '📱 Mobile app integration',
        '🌐 Web dashboard',
        '🤖 AI disease detection',
        '📊 Analytics and charts',
        '☁️ Cloud image storage',
        '💾 Local file database'
      ]
    };

    res.status(200).json(healthStatus);
    
  } catch (error) {
    console.error('❌ Health check error:', error);
    res.status(500).json({ 
      status: 'error',
      error: error.message 
    });
  }
}
