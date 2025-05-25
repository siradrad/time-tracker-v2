# Supabase Setup Guide for Time Tracker V2

This guide will help you set up Supabase database backend for your Time Tracker V2 application.

## Prerequisites

- A Supabase account (sign up at [supabase.com](https://supabase.com))
- Time Tracker V2 application files
- Node.js environment with npm

## Step 1: Create Supabase Project

1. **Create New Project**
   - Go to [supabase.com/dashboard](https://supabase.com/dashboard)
   - Click "New Project"
   - Fill in project details:
     - Name: `time-tracker-v2`
     - Database Password: (choose a strong password)
     - Region: (choose closest to your users)

2. **Wait for Setup**
   - Project creation takes 2-3 minutes
   - You'll get a project dashboard when ready

## Step 2: Get Project Credentials

1. **Navigate to Project Settings**
   - Click on "Settings" (gear icon) in left sidebar
   - Go to "API" section

2. **Copy Credentials**
   - **Project URL**: Copy the URL (looks like `https://xxxxx.supabase.co`)
   - **Anon Public Key**: Copy the `anon` `public` key

## Step 3: Configure Environment Variables

1. **Create Environment File**
   ```bash
   cp .env.example .env
   ```

2. **Edit .env File**
   ```env
   # Replace with your actual Supabase credentials
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key-here
   VITE_DEV_MODE=true
   ```

## Step 4: Set Up Database Schema

1. **Open SQL Editor**
   - In your Supabase dashboard, click "SQL Editor" in left sidebar
   - Click "New Query"

2. **Run Database Schema**
   - Copy the entire contents of `database-schema.sql`
   - Paste into the SQL editor
   - Click "Run" to execute

   This will create:
   - Users table with authentication
   - Job addresses table
   - CSI tasks table
   - Time entries table
   - Row Level Security policies
   - Indexes for performance
   - Initial CSI tasks data

## Step 5: Switch to Database Mode

### Option A: Test Both Modes (Recommended)

1. **Keep Current localStorage Mode**
   - Your current app continues to work with localStorage
   - No data loss during transition

2. **Test Database Mode**
   ```javascript
   // In src/lib/supabase.js, temporarily change the import:
   
   // Comment out the localStorage version:
   // export { timeTrackerAPI } from './supabase.js'
   
   // Import the database version:
   export { timeTrackerAPI } from './supabase-real.js'
   ```

### Option B: Switch Permanently

1. **Backup Current Data (Optional)**
   - Export your localStorage data if needed
   - Use the "Clear All Data" function to reset

2. **Update Main Import**
   ```javascript
   // In src/lib/supabase.js, replace the entire file content with:
   export { timeTrackerAPI } from './supabase-real.js'
   ```

## Step 6: Initialize Data

1. **Start Your Application**
   ```bash
   npm run dev
   ```

2. **First Launch**
   - Database will automatically initialize with:
     - Team member accounts (Admin, Stacy, Jeremy, etc.)
     - Job addresses for all users
     - CSI tasks
   - Check browser console for success messages

## Step 7: Test Database Functionality

### Test Login
- Try logging in with: `Admin` / `admin123`
- Verify dashboard loads properly

### Test Data Creation
- Create a time entry
- Add a job address
- Add a CSI task (admin only)
- Verify data persists after browser refresh

### Test Multi-User
- Log out and log in as different user: `Stacy` / `stacy123`
- Verify user can only see their own data
- Admin should see all users' data

## Step 8: Configure Row Level Security (RLS)

The schema automatically sets up RLS policies, but you can verify:

1. **Check RLS Status**
   - Go to "Authentication" > "Policies" in Supabase dashboard
   - Verify policies exist for all tables

2. **Test Security**
   - Try accessing data as different users
   - Verify users can't see each other's data
   - Verify admin can see all data

## Troubleshooting

### Connection Issues
```bash
# Check environment variables are loaded
console.log(import.meta.env.VITE_SUPABASE_URL)
```

### RLS Policy Errors
- Ensure you're using the correct user ID format
- Check that policies match your authentication method

### Data Not Appearing
- Check browser console for errors
- Verify Supabase project is active
- Check API key permissions

### Password Hash Errors
- Ensure bcryptjs is installed: `npm install bcryptjs`
- Check that passwords are being hashed properly

## Migration from localStorage

If you want to migrate existing localStorage data:

1. **Export Current Data**
   ```javascript
   // Run in browser console while on localStorage version:
   const data = {
     users: JSON.parse(localStorage.getItem('timeTracker_users') || '{}'),
     // Export other data as needed
   }
   console.log(JSON.stringify(data, null, 2))
   ```

2. **Import to Database**
   - Create a migration script or manually recreate important data
   - Use the admin account to recreate users if needed

## Production Deployment

### Environment Variables for Production
```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
VITE_DEV_MODE=false
```

### Security Checklist
- [ ] RLS policies are enabled on all tables
- [ ] API keys are properly configured
- [ ] Environment variables are secure
- [ ] Database backups are configured
- [ ] SSL connections are enforced

## Features Enabled with Database

✅ **Multi-user Support**: Multiple people can use the app simultaneously  
✅ **Data Persistence**: Data survives browser clears and device changes  
✅ **Real-time Updates**: Live updates when data changes  
✅ **Scalability**: Handle growing data and user base  
✅ **Security**: Row-level security and proper authentication  
✅ **Backup & Recovery**: Automatic database backups  
✅ **Analytics**: Query data for reporting and insights  

## Support

If you encounter issues:
1. Check the browser console for error messages
2. Verify your Supabase project is active and credentials are correct
3. Review the RLS policies in your Supabase dashboard
4. Check the database schema was applied correctly

Your Time Tracker V2 is now ready for production use with a robust database backend! 🚀 