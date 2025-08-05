-- 🌴 COMPLETE Dwarf Coconut Disease Detector Database Setup
-- Includes: Authentication + Scan Data Storage

-- ============================================================================
-- 1. AUTHENTICATION TABLES
-- ============================================================================

-- Create users table for login credentials
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(100),
  email VARCHAR(100),
  role VARCHAR(20) DEFAULT 'admin',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login TIMESTAMP WITH TIME ZONE
);

-- Create login_sessions table for tracking sessions
CREATE TABLE IF NOT EXISTS login_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  session_token VARCHAR(255) NOT NULL,
  ip_address INET,
  user_agent TEXT,
  login_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  logout_time TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '30 days')
);

-- ============================================================================
-- 2. SCAN DATA TABLES
-- ============================================================================

-- Create the scans table for storing coconut disease detection results
CREATE TABLE IF NOT EXISTS scans (
    -- Primary key with auto-increment
    id BIGSERIAL PRIMARY KEY,
    
    -- Disease detection information
    disease_detected TEXT NOT NULL,
    confidence INTEGER NOT NULL CHECK (confidence >= 0 AND confidence <= 100),
    severity_level TEXT,
    
    -- Image storage
    image_url TEXT,
    
    -- Status and metadata
    status TEXT DEFAULT 'completed',
    upload_time TIMESTAMPTZ,
    
    -- Timestamps (automatically managed)
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 3. INSERT ADMIN USER
-- ============================================================================

-- Insert your admin credentials (password: slsutayabas)
INSERT INTO users (username, password_hash, full_name, email, role) 
VALUES (
  'SLSUTAYABAS', 
  'slsutayabas', -- Plain text password for simple authentication
  'SLSU Tayabas Admin',
  'admin@slsutayabas.edu.ph',
  'admin'
) ON CONFLICT (username) DO NOTHING;

-- ============================================================================
-- 4. INSERT SAMPLE SCAN DATA
-- ============================================================================

-- Insert some sample scan data for testing
INSERT INTO scans (disease_detected, confidence, severity_level, image_url, status) VALUES
    ('Healthy Coconut', 95, 'Low', 'https://res.cloudinary.com/dgot1pbg/image/upload/v1/coconut-scans/healthy-sample.jpg', 'completed'),
    ('Bud Rot Disease', 87, 'High', 'https://res.cloudinary.com/dgot1pbg/image/upload/v1/coconut-scans/diseased-sample.jpg', 'completed'),
    ('Yellowing Disease', 78, 'Medium', 'https://res.cloudinary.com/dgot1pbg/image/upload/v1/coconut-scans/yellow-sample.jpg', 'completed'),
    ('Healthy Palm', 92, 'Low', 'https://res.cloudinary.com/dgot1pbg/image/upload/v1/coconut-scans/healthy2-sample.jpg', 'completed'),
    ('Leaf Spot Disease', 83, 'Medium', 'https://res.cloudinary.com/dgot1pbg/image/upload/v1/coconut-scans/spot-sample.jpg', 'completed')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 5. CREATE INDEXES FOR PERFORMANCE
-- ============================================================================

-- Authentication indexes
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON login_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON login_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_sessions_active ON login_sessions(is_active);

-- Scan data indexes
CREATE INDEX IF NOT EXISTS idx_scans_created_at ON scans(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_scans_disease ON scans(disease_detected);

-- ============================================================================
-- 6. CREATE FUNCTIONS AND TRIGGERS
-- ============================================================================

-- Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers to automatically update updated_at (drop if exists first)
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
DROP TRIGGER IF EXISTS update_scans_updated_at ON scans;

CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_scans_updated_at 
    BEFORE UPDATE ON scans 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 7. ENABLE ROW LEVEL SECURITY
-- ============================================================================

-- Enable Row Level Security (RLS) for better security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE login_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE scans ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 8. CREATE SECURITY POLICIES
-- ============================================================================

-- Create policies for admin access (drop if exists first)
DROP POLICY IF EXISTS "Enable all operations for authenticated admin users" ON users;
DROP POLICY IF EXISTS "Enable all operations for authenticated admin users" ON login_sessions;
DROP POLICY IF EXISTS "Allow all operations on scans" ON scans;

CREATE POLICY "Enable all operations for authenticated admin users" ON users
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Enable all operations for authenticated admin users" ON login_sessions
  FOR ALL USING (auth.role() = 'authenticated');

-- Create policy to allow all operations on scans (for public access via API)
CREATE POLICY "Allow all operations on scans" ON scans
    FOR ALL USING (true);
