# 🔐 Supabase Authentication Setup Guide

## 📋 Prerequisites
1. Create a Supabase account at https://supabase.com
2. Create a new project in Supabase

## 🛠️ Setup Steps

### 1. **Get Supabase Credentials**
1. Go to your Supabase project dashboard
2. Navigate to **Settings > API**
3. Copy the following values:
   - **Project URL** (e.g., `https://your-project-ref.supabase.co`)
   - **Anon public key** (starts with `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`)
   - **Service role key** (starts with `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`)

### 2. **Configure Environment Variables**
1. Open `.env.local` file in your project root
2. Replace the placeholder values:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 3. **Run SQL Setup**
1. In Supabase dashboard, go to **SQL Editor**
2. Copy and paste the entire content of `supabase_setup.sql`
3. Click **Run** to create tables and insert your admin user

### 4. **Test the Setup**
1. Start your development server: `npm run dev`
2. Go to `/login`
3. Use credentials:
   - **Username**: `SLSUTAYABAS`
   - **Password**: `slsutayabas`

## 🗃️ Database Structure

### Users Table
- Stores admin credentials (`SLSUTAYABAS/slsutayabas`)
- Tracks login history and last login times
- Manages user roles and permissions

### Login Sessions Table  
- Tracks active sessions with unique tokens
- Stores session tokens with 30-day expiration
- Logs IP addresses and user agents for security
- Handles proper logout with session deactivation

### Scans Table ⭐
- **Stores all coconut disease scan results**
- Fields: `disease_detected`, `confidence`, `severity_level`, `image_url`
- Auto-timestamps for creation and updates
- Indexed for fast retrieval and filtering
- **Already connected to your dashboard!**

## 🔒 Security Features

✅ **Session Management**: Proper session tracking with expiration
✅ **IP Logging**: Track login attempts and locations
✅ **User Agent Tracking**: Monitor device/browser information
✅ **Automatic Cleanup**: Sessions expire after 30 days
✅ **Case-Sensitive Authentication**: Exact credential matching
✅ **Database Logging**: All login activities recorded

## 🚀 Features

- **Real-time session validation**
- **Proper logout handling**
- **Session expiration management**
- **IP and device tracking**
- **Audit trail for security**

## 🛡️ Production Notes

1. **Environment Variables**: Never commit `.env.local` to version control
2. **Service Role Key**: Keep this secret and secure
3. **Database Policies**: RLS (Row Level Security) is enabled
4. **Session Expiration**: Sessions automatically expire after 30 days

## 📊 Monitoring

You can monitor all activities in Supabase:
1. Go to **Table Editor**
2. View `login_sessions` table for authentication logs
3. Check `users` table for user information and last login times
4. **View `scans` table for all coconut disease detection results**
5. **Monitor scan uploads and deletions in real-time**

## 🎯 What's Already Working

✅ **Authentication**: Login with `SLSUTAYABAS/slsutayabas`
✅ **Scan Storage**: All scans saved to Supabase database
✅ **Dashboard**: Real-time data from database
✅ **Delete Function**: Remove scans from database
✅ **Mobile Upload**: Android app saves to database
✅ **Session Tracking**: All logins monitored
