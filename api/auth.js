// Consolidated auth API - handles login, logout, verify with Supabase
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client with better error handling
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('🔧 Environment check:', {
  hasUrl: !!supabaseUrl,
  hasKey: !!supabaseServiceKey,
  url: supabaseUrl ? supabaseUrl.substring(0, 30) + '...' : 'missing'
});

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
}

const supabase = supabaseUrl && supabaseServiceKey 
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null;

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Debug environment variables
  console.log('Environment check:', {
    hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    method: req.method,
    action: req.query.action
  });

  // Check if environment variables are missing
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('Missing environment variables!');
    return res.status(500).json({ 
      error: 'Server configuration error',
      message: 'Environment variables not configured'
    });
  }

  const { action } = req.query;

  try {
    switch (action) {
      case 'login':
        return handleLogin(req, res);
      case 'logout':
        return handleLogout(req, res);
      case 'verify':
        return handleVerify(req, res);
      default:
        return res.status(400).json({ error: 'Invalid action' });
    }
  } catch (error) {
    console.error('Auth error:', error);
    return res.status(500).json({ 
      error: 'Authentication failed',
      message: error.message 
    });
  }
}

async function handleLogin(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { username, password } = req.body;

  try {
    // Query user from Supabase
    const { data: users, error } = await supabase
      .from('users')
      .select('*')
      .eq('username', username)
      .eq('password_hash', password) // Using plain text password
      .eq('is_active', true)
      .single();

    if (error || !users) {
      console.log('Login failed:', error);
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials. Please check your username and password.'
      });
    }

    // Generate session token
    const sessionToken = 'auth_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    
    // Get client IP and user agent
    const clientIP = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'];

    // Create session record
    const { error: sessionError } = await supabase
      .from('login_sessions')
      .insert({
        user_id: users.id,
        session_token: sessionToken,
        ip_address: clientIP,
        user_agent: userAgent,
        login_time: new Date().toISOString(),
        is_active: true,
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days
      });

    // Update last login time
    await supabase
      .from('users')
      .update({ last_login: new Date().toISOString() })
      .eq('id', users.id);

    if (sessionError) {
      console.error('Session creation error:', sessionError);
    }

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      token: sessionToken,
      user: {
        id: users.id,
        username: users.username,
        full_name: users.full_name,
        email: users.email,
        role: users.role,
        loginTime: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Database error:', error);
    return res.status(500).json({
      success: false,
      message: 'Database connection error'
    });
  }
}

async function handleLogout(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { token } = req.body;

  try {
    if (token) {
      // Mark session as inactive
      await supabase
        .from('login_sessions')
        .update({ 
          is_active: false,
          logout_time: new Date().toISOString()
        })
        .eq('session_token', token);
    }

    return res.status(200).json({
      success: true,
      message: 'Logout successful'
    });
  } catch (error) {
    console.error('Logout error:', error);
    return res.status(200).json({
      success: true,
      message: 'Logout successful'
    });
  }
}

async function handleVerify(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { token } = req.body;

  try {
    if (!token || !token.startsWith('auth_')) {
      return res.status(401).json({
        success: false,
        valid: false,
        message: 'Invalid token'
      });
    }

    // Check if session exists and is active
    const { data: session, error } = await supabase
      .from('login_sessions')
      .select(`
        *,
        users (
          id,
          username,
          full_name,
          email,
          role
        )
      `)
      .eq('session_token', token)
      .eq('is_active', true)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (error || !session) {
      return res.status(401).json({
        success: false,
        valid: false,
        message: 'Invalid or expired token'
      });
    }

    return res.status(200).json({
      success: true,
      valid: true,
      message: 'Token is valid',
      user: session.users
    });

  } catch (error) {
    console.error('Verification error:', error);
    return res.status(401).json({
      success: false,
      valid: false,
      message: 'Token verification failed'
    });
  }
}
