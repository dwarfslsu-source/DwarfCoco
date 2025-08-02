// lib/supabase-storage.js - Real database storage with Supabase
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://scsmgevpunmeaebetwrr.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNjc21nZXZwdW5tZWFlYmV0d3JyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQxMDIyOTUsImV4cCI6MjA2OTY3ODI5NX0.KmhtMT9J3sblHlIGJ3gXSrob5grCcT8NCzeBUupKfcQ'

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
