// Test file to verify Supabase connection
// Use this to test database mode without affecting your localStorage setup

import { timeTrackerAPI } from './supabase-real.js'

// Test function you can run in browser console
export const testSupabaseConnection = async () => {
  console.log('🔄 Testing Supabase connection...')
  
  try {
    // Test getting CSI tasks (should work if database is set up)
    const tasks = await timeTrackerAPI.getAvailableCSITasks()
    
    if (tasks.error) {
      console.error('❌ Supabase connection failed:', tasks.error)
      return false
    }
    
    console.log('✅ Supabase connection successful!')
    console.log('📋 Available CSI tasks:', tasks.data?.length || 0)
    
    return true
  } catch (error) {
    console.error('❌ Supabase connection error:', error)
    return false
  }
}

// Add to window for easy testing
if (typeof window !== 'undefined') {
  window.testSupabaseConnection = testSupabaseConnection
} 