import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zgxhrhraaldkysfsoypq.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpneGhyaHJhYWxka3lzZnNveXBxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ1Nzg4NDMsImV4cCI6MjA1MDE1NDg0M30.CTx_lGJ2SdpJtHWqKt_9R2YvCaSwZLTHQBdLz_0lYMk';

const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ 
        error: 'Username and password are required',
        success: false 
      });
    }

    // Valid credentials (case sensitive)
    const VALID_USERNAME = 'SLSUTAYABAS';
    const VALID_PASSWORD = 'slsutayabas';

    // Check credentials (case sensitive)
    if (username !== VALID_USERNAME || password !== VALID_PASSWORD) {
      return res.status(401).json({ 
        error: 'Invalid username or password',
        success: false 
      });
    }

    const user = {
      username: VALID_USERNAME,
      role: 'admin'
    };

    // Create a simple session token (in production, use JWT)
    const sessionToken = Buffer.from(`${user.username}:${Date.now()}`).toString('base64');

    // Log the login attempt
    try {
      await supabase
        .from('user_sessions')
        .insert([
          {
            username: user.username,
            role: user.role,
            session_token: sessionToken,
            login_time: new Date().toISOString(),
            ip_address: req.headers['x-forwarded-for'] || req.connection.remoteAddress
          }
        ]);
    } catch (logError) {
      console.log('Session logging failed:', logError);
      // Continue even if logging fails
    }

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      user: {
        username: user.username,
        role: user.role
      },
      token: sessionToken
    });

  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      success: false 
    });
  }
}
