// lib/supabase-storage.js - Real database storage with Supabase
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL || 'https://zgxhrhraaldkysfsoypq.supabase.co'
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpneGhyaHJhYWxka3lzZnNveXBxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQzOTc4ODgsImV4cCI6MjA2OTk3Mzg4OH0.1Co8tzJMyBFo7PabvIA_FoL5viRystCr3SUFXm3CHXM'

const supabase = createClient(supabaseUrl, supabaseKey)

export async function getScans() {
  try {
    const { data, error } = await supabase
      .from('scans')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) {
      console.error('❌ Supabase error:', error)
      throw error
    }

    console.log('✅ Retrieved scans from database:', data.length)
    return data || []
  } catch (error) {
    console.error('❌ Database error:', error)
    return []
  }
}

export async function addScan(scanData) {
  try {
    const { data, error } = await supabase
      .from('scans')
      .insert([{
        disease_detected: scanData.disease_detected,
        confidence: scanData.confidence,
        severity_level: scanData.severity_level,
        image_url: scanData.image_url,
        status: scanData.status,
        upload_time: scanData.upload_time || new Date().toISOString()
      }])
      .select()
      .single()

    if (error) {
      console.error('❌ Insert error:', error)
      throw error
    }

    console.log('✅ Scan saved to database:', data)
    return data
  } catch (error) {
    console.error('❌ Database save error:', error)
    throw error
  }
}

export async function deleteScan(scanId) {
  try {
    const { data, error } = await supabase
      .from('scans')
      .delete()
      .eq('id', scanId)

    if (error) {
      console.error('❌ Delete error:', error)
      throw error
    }

    console.log('✅ Scan deleted from database:', scanId)
    return data
  } catch (error) {
    console.error('❌ Database delete error:', error)
    throw error
  }
}
