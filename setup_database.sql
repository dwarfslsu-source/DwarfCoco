-- 🌴 Dwarf Coconut Disease Detector Database Setup
-- Created: 2025-08-05
-- Description: Creates the scans table for storing coconut disease detection results

-- Create the scans table
CREATE TABLE IF NOT EXISTS public.scans (
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

-- Create an index on created_at for faster queries (most recent first)
CREATE INDEX IF NOT EXISTS idx_scans_created_at ON public.scans(created_at DESC);

-- Create an index on disease_detected for faster filtering
CREATE INDEX IF NOT EXISTS idx_scans_disease ON public.scans(disease_detected);

-- Create a function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create a trigger to automatically update updated_at when a row is modified
CREATE TRIGGER update_scans_updated_at 
    BEFORE UPDATE ON public.scans 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS) - recommended for Supabase
ALTER TABLE public.scans ENABLE ROW LEVEL SECURITY;

-- Create a policy to allow all operations (you can restrict this later)
CREATE POLICY "Allow all operations on scans" ON public.scans
    FOR ALL USING (true);

-- Insert some sample data for testing (optional)
INSERT INTO public.scans (disease_detected, confidence, severity_level, image_url, status) VALUES
    ('Healthy Coconut', 95, 'Low', 'https://res.cloudinary.com/dgot1pbg/image/upload/v1/coconut-scans/healthy-sample.jpg', 'completed'),
    ('Bud Rot Disease', 87, 'High', 'https://res.cloudinary.com/dgot1pbg/image/upload/v1/coconut-scans/diseased-sample.jpg', 'completed'),
    ('Yellowing Disease', 78, 'Medium', 'https://res.cloudinary.com/dgot1pbg/image/upload/v1/coconut-scans/yellow-sample.jpg', 'completed')
ON CONFLICT DO NOTHING;

-- Verify the table was created successfully
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'scans' 
ORDER BY ordinal_position;
