import { DataService } from './dataService.js'
import { supabase, TABLES } from './supabase-config.js'

// Create a single instance of the DataService
const dbManager = new DataService()

/**
 * Public API for Time Tracker application
 * Acts as a facade to the DataService
 */
export const timeTrackerAPI = {
  // Authentication
  signUp: (username, password, name) => dbManager.signUp(username, password, name),
  createUser: (username, password, name, role) => dbManager.createUser(username, password, name, role),
  signIn: (username, password) => dbManager.signIn(username, password),
  signOut: () => dbManager.signOut(),
  getCurrentUser: () => dbManager.getCurrentUser(),
  restoreSession: () => dbManager.restoreSession(),
  
  // Job Addresses
  getJobAddresses: (userId) => dbManager.getJobAddresses(userId),
  addJobAddress: (userId, address) => dbManager.addJobAddress(userId, address),
  deleteJobAddress: (userId, addressId) => dbManager.deleteJobAddress(userId, addressId),
  getAllJobAddresses: (forceRefresh = false) => dbManager.getAllJobAddresses(forceRefresh),
  
  // Time Entries
  getTimeEntries: (userId, limit) => dbManager.getTimeEntries(userId, limit),
  addTimeEntry: (userId, entry) => dbManager.addTimeEntry(userId, entry),
  deleteTimeEntry: (userId, entryId) => dbManager.deleteTimeEntry(userId, entryId),
  editTimeEntry: (userId, entryId, updatedEntry) => dbManager.editTimeEntry(userId, entryId, updatedEntry),
  getAllTimeEntries: (limit) => dbManager.getAllTimeEntries(limit),
  
  // User & Data Management
  getUserStats: (userId) => dbManager.getUserStats(userId),
  getAllUsersData: (forceRefresh = false) => dbManager.getAllUsersData(forceRefresh),
  clearAllData: () => dbManager.clearAllData(),
  initializeDatabase: () => dbManager.initializeDatabase(),
  forceCreateUsers: () => dbManager._createInitialUsers(),
  
  // Database Status
  checkDatabaseStatus: async () => {
    try {
      const { data: users, error } = await supabase.from(TABLES.USERS).select('id, username, name, role')
      return { users, error }
    } catch (error) {
      console.error('❌ Database check error:', error)
      return { users: [], error }
    }
  },
  
  // CSI Tasks Management
  getCSITasks: () => dbManager.getCSITasks(),
  addCSITask: (taskName) => dbManager.addCSITask(taskName),
  editCSITask: (taskId, newName) => dbManager.editCSITask(taskId, newName),
  deleteCSITask: (taskId) => dbManager.deleteCSITask(taskId),
  getAvailableCSITasks: () => dbManager.getAvailableCSITasks(),

  // Real-time subscriptions
  subscribeToTimeEntries: (userId, callback) => {
    const subscription = supabase
      .channel('time_entries_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: TABLES.TIME_ENTRIES, filter: `user_id=eq.${userId}` }, 
        callback
      )
      .subscribe()

    return { unsubscribe: () => subscription.unsubscribe() }
  },

  subscribeToJobAddresses: (userId, callback) => {
    const subscription = supabase
      .channel('job_addresses_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: TABLES.JOB_ADDRESSES, filter: `user_id=eq.${userId}` }, 
        callback
      )
      .subscribe()

    return { unsubscribe: () => subscription.unsubscribe() }
  },
} 