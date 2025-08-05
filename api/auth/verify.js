export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        error: 'No token provided',
        success: false 
      });
    }

    const token = authHeader.substring(7);
    
    try {
      // Decode the simple token
      const decoded = Buffer.from(token, 'base64').toString();
      const [email, timestamp] = decoded.split(':');
      
      // Check if token is not too old (24 hours)
      const tokenAge = Date.now() - parseInt(timestamp);
      const maxAge = 24 * 60 * 60 * 1000; // 24 hours
      
      if (tokenAge > maxAge) {
        return res.status(401).json({ 
          error: 'Token expired',
          success: false 
        });
      }

      // Get user role
      const validUsers = [
        { email: 'admin@dwarfcoconut.com', role: 'admin' },
        { email: 'researcher@slsu.edu.ph', role: 'researcher' },
        { email: 'demo@coconut.ph', role: 'user' }
      ];

      const user = validUsers.find(u => u.email === email);
      
      if (!user) {
        return res.status(401).json({ 
          error: 'Invalid token',
          success: false 
        });
      }

      return res.status(200).json({
        success: true,
        user: {
          email: user.email,
          role: user.role
        }
      });

    } catch (decodeError) {
      return res.status(401).json({ 
        error: 'Invalid token format',
        success: false 
      });
    }

  } catch (error) {
    console.error('Verify token error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      success: false 
    });
  }
}
