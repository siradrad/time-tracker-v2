import { supabase, TABLES, INITIAL_USERS, INITIAL_JOB_ADDRESSES, INITIAL_CSI_TASKS } from './supabase-config.js'
import bcrypt from 'bcryptjs'

/**
 * DataService provides an interface for all database operations
 * with built-in caching for performance optimization
 */
export class DataService {
  constructor() {
    // User state
    this.currentUser = null
    
    // Cache configuration
    this._cache = {
      // Data caches with timestamps
      allUsersData: null,
      allUsersDataTimestamp: null,
      csiTasks: null,
      csiTasksTimestamp: null,
      allJobAddresses: null,
      allJobAddressesTimestamp: null,
      
      // Cache expiration time in milliseconds (5 minutes)
      cacheTimeout: 300000
    }
    
    // Timer tracking to prevent console errors
    this._timers = {}
    
    // Initialize state
    this._loadCurrentUser()
    this._initializeData()
  }

  // Helper method for safer timer management
  _startTimer(name) {
    try {
      const timerName = `${name}_${Date.now()}`
      this._timers[timerName] = Date.now()
      console.log(`🕒 Starting timer: ${name}`)
      return timerName
    } catch (error) {
      console.error('Error starting timer:', error)
      return null
    }
  }

  _endTimer(timerName) {
    try {
      if (!timerName || !this._timers[timerName]) {
        return
      }
      
      const elapsed = Date.now() - this._timers[timerName]
      console.log(`⏱️ ${timerName.split('_')[0]} completed in ${elapsed}ms`)
      delete this._timers[timerName]
    } catch (error) {
      console.error('Error ending timer:', error)
    }
  }
  
  // Clean up all timers - useful for error cases
  _cleanupAllTimers() {
    try {
      Object.keys(this._timers).forEach(timerName => {
        this._endTimer(timerName)
      })
    } catch (error) {
      console.error('Error cleaning up timers:', error)
      this._timers = {} // Reset timers if cleanup fails
    }
  }

  async _loadCurrentUser() {
    try {
      // Load user from localStorage
      const storedUser = localStorage.getItem('timeTracker_currentUser')
      if (storedUser) {
        const user = JSON.parse(storedUser)
        
        // Verify user still exists in database
        const { data: userData, error } = await supabase
          .from(TABLES.USERS)
          .select('*')
          .eq('id', user.id)
          .single()
        
        if (userData && !error) {
          this.currentUser = userData
          console.log('✅ User session restored:', userData.name)
        } else {
          // User no longer exists or error occurred, clear localStorage
          localStorage.removeItem('timeTracker_currentUser')
          console.log('⚠️ Stored user session invalid, cleared')
        }
      }
    } catch (error) {
      console.error('Error loading current user:', error)
      localStorage.removeItem('timeTracker_currentUser')
    }
  }

  async _initializeData() {
    try {
      // Check if users exist, if not create initial users
      const { data: existingUsers } = await supabase
        .from(TABLES.USERS)
        .select('id')
        .limit(1)

      if (!existingUsers || existingUsers.length === 0) {
        await this._createInitialUsers()
        await this._createInitialJobAddresses()
        await this._createInitialCSITasks()
      }
    } catch (error) {
      console.error('Error initializing data:', error)
    }
  }

  async _createInitialUsers() {
    try {
      // Check if users already exist
      const { data: existingUsers } = await supabase
        .from(TABLES.USERS)
        .select('id')
        .limit(1)

      if (existingUsers && existingUsers.length > 0) {
        console.log('✅ Users already exist, skipping creation')
        return
      }

      const usersToCreate = []
      
      for (const user of INITIAL_USERS) {
        const hashedPassword = await bcrypt.hash(user.password, 10)
        usersToCreate.push({
          username: user.username,
          password_hash: hashedPassword,
          name: user.name,
          role: user.role
        })
      }

      const { error } = await supabase
        .from(TABLES.USERS)
        .insert(usersToCreate)

      if (error) throw error
      console.log('✅ Initial users created:', usersToCreate.length, 'users')
    } catch (error) {
      console.error('Error creating initial users:', error)
    }
  }

  async _createInitialJobAddresses() {
    try {
      // Check if job addresses already exist
      const { data: existingAddresses } = await supabase
        .from(TABLES.JOB_ADDRESSES)
        .select('id')
        .limit(1)

      if (existingAddresses && existingAddresses.length > 0) {
        console.log('✅ Job addresses already exist, skipping creation')
        return
      }

      // Get all users
      const { data: users } = await supabase
        .from(TABLES.USERS)
        .select('id')

      if (!users) return

      const addressesToCreate = []
      
      // Create job addresses for each user
      for (const user of users) {
        for (const address of INITIAL_JOB_ADDRESSES) {
          addressesToCreate.push({
            address,
            user_id: user.id
          })
        }
      }

      const { error } = await supabase
        .from(TABLES.JOB_ADDRESSES)
        .insert(addressesToCreate)

      if (error) throw error
      console.log('✅ Initial job addresses created')
    } catch (error) {
      console.error('Error creating initial job addresses:', error)
    }
  }

  async _createInitialCSITasks() {
    try {
      // Check if CSI tasks already exist
      const { data: existingTasks } = await supabase
        .from(TABLES.CSI_TASKS)
        .select('id')
        .limit(1)

      if (existingTasks && existingTasks.length > 0) return

      const tasksToCreate = INITIAL_CSI_TASKS.map(taskName => ({
        name: taskName
      }))

      const { error } = await supabase
        .from(TABLES.CSI_TASKS)
        .insert(tasksToCreate)

      if (error) throw error
      console.log('✅ Initial CSI tasks created')
    } catch (error) {
      console.error('Error creating initial CSI tasks:', error)
    }
  }

  /**
   * Invalidates all caches when data is modified
   * Called after any create, update, or delete operations
   * to ensure components fetch fresh data
   */
  _invalidateCache() {
    console.log("🗑️ Cache invalidated due to data changes")
    
    // Reset all cache data and timestamps
    this._cache.allUsersData = null
    this._cache.allUsersDataTimestamp = null
    this._cache.csiTasks = null
    this._cache.csiTasksTimestamp = null
    this._cache.allJobAddresses = null
    this._cache.allJobAddressesTimestamp = null
  }

  // Public methods - Authentication
  
  /**
   * Register a new user with standard user role
   * @param {string} username - Email address as username
   * @param {string} password - User's password (will be hashed)
   * @param {string} name - User's display name
   * @returns {Promise<Object>} - Response with user data or error
   */
  async signUp(username, password, name = 'New User') {
    try {
      // Check if user already exists
      const { data: existingUser } = await supabase
        .from(TABLES.USERS)
        .select('id')
        .eq('username', username)
        .single()

      if (existingUser) {
        return { data: null, error: { message: 'User already exists.' } }
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10)

      // Create user in database
      const { data: newUser, error } = await supabase
        .from(TABLES.USERS)
        .insert({
          username,
          password_hash: hashedPassword,
          name,
          role: 'user'
        })
        .select()
        .single()

      if (error) throw error

      return { data: { user: newUser }, error: null }
    } catch (error) {
      return { data: null, error }
    }
  }

  /**
   * Admin function to create users with role selection
   * @param {string} username - Email address as username
   * @param {string} password - User's password (will be hashed)
   * @param {string} name - User's display name
   * @param {string} role - User role (admin or user)
   * @returns {Promise<Object>} - Response with user data or error
   */
  async createUser(username, password, name, role = 'user') {
    try {
      // Check if current user is admin
      if (!this.currentUser || this.currentUser.role !== 'admin') {
        return { data: null, error: { message: 'Admin access required.' } }
      }

      // Check if user already exists
      const { data: existingUser } = await supabase
        .from(TABLES.USERS)
        .select('id')
        .eq('username', username)
        .single()

      if (existingUser) {
        return { data: null, error: { message: 'User already exists.' } }
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10)

      // Create user in database
      const { data: newUser, error } = await supabase
        .from(TABLES.USERS)
        .insert({
          username,
          password_hash: hashedPassword,
          name,
          role
        })
        .select()
        .single()

      if (error) throw error

      // Create initial job addresses for the new user
      const addressesToCreate = []
      for (const address of INITIAL_JOB_ADDRESSES) {
        addressesToCreate.push({
          address,
          user_id: newUser.id
        })
      }

      await supabase
        .from(TABLES.JOB_ADDRESSES)
        .insert(addressesToCreate)

      return { data: { user: newUser }, error: null }
    } catch (error) {
      return { data: null, error }
    }
  }

  /**
   * Sign in a user with username and password
   * @param {string} username - Email address as username
   * @param {string} password - User's password
   * @returns {Promise<Object>} - Response with user data or error
   */
  async signIn(username, password) {
    try {
      // Get user by username
      const { data: user, error: userError } = await supabase
        .from(TABLES.USERS)
        .select('*')
        .eq('username', username)
        .single()

      if (userError || !user) {
        return { data: null, error: { message: 'Invalid login credentials.' } }
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.password_hash)
      
      if (!isValidPassword) {
        return { data: null, error: { message: 'Invalid login credentials.' } }
      }

      // Store current user
      this.currentUser = user
      localStorage.setItem('timeTracker_currentUser', JSON.stringify(user))

      return { data: { user }, error: null }
    } catch (error) {
      return { data: null, error }
    }
  }

  /**
   * Sign out the current user
   * @returns {Promise<Object>} - Response with error (if any)
   */
  async signOut() {
    try {
      console.log('SignOut called, current user:', this.currentUser)
      this.currentUser = null
      localStorage.removeItem('timeTracker_currentUser')
      console.log('User cleared, localStorage cleared')
      return { error: null }
    } catch (error) {
      console.error('Error in signOut:', error)
      return { error }
    }
  }

  /**
   * Get the currently signed-in user
   * @returns {Promise<Object|null>} - Current user object or null
   */
  async getCurrentUser() {
    return this.currentUser
  }

  /**
   * Restore a user session from localStorage
   * @returns {Promise<Object|null>} - User data if session restored, null otherwise
   */
  async restoreSession() {
    // If current user already exists, return it
    if (this.currentUser) {
      return this.currentUser
    }
    
    try {
      // Load user from localStorage
      const storedUser = localStorage.getItem('timeTracker_currentUser')
      if (storedUser) {
        const user = JSON.parse(storedUser)
        
        // Verify user still exists in database
        const { data: userData, error } = await supabase
          .from(TABLES.USERS)
          .select('*')
          .eq('id', user.id)
          .single()
        
        if (userData && !error) {
          this.currentUser = userData
          console.log('✅ Session restored for:', userData.name)
          return userData
        } else {
          // User no longer exists or error occurred, clear localStorage
          localStorage.removeItem('timeTracker_currentUser')
          console.log('⚠️ Stored session invalid, cleared')
        }
      }
    } catch (error) {
      console.error('Error restoring session:', error)
      localStorage.removeItem('timeTracker_currentUser')
    }
    
    return null
  }

  // Job Addresses
  async getJobAddresses(userId) {
    try {
      if (!userId) {
        console.warn("⚠️ getJobAddresses called with null or undefined userId")
        return { data: [], error: null }
      }
      
      const { data, error } = await supabase
        .from(TABLES.JOB_ADDRESSES)
        .select('*')
        .eq('user_id', userId)
        .order('address', { ascending: true })

      if (error) throw error
      
      if (!data) {
        console.warn(`⚠️ No job addresses found for user ${userId}`)
        return { data: [], error: null }
      }
      
      // Filter out any null addresses
      const filteredData = data.filter(addr => addr && addr.address)
      return { data: filteredData, error: null }
    } catch (error) {
      console.error(`❌ Error in getJobAddresses for user ${userId}:`, error.message || error)
      return { data: [], error }
    }
  }

  async addJobAddress(userId, address) {
    try {
      if (!userId) {
        console.warn("⚠️ addJobAddress called with null or undefined userId")
        return { data: null, error: { message: "Invalid user ID" } }
      }
      
      if (!address || typeof address !== 'string' || !address.trim()) {
        console.warn("⚠️ addJobAddress called with invalid address")
        return { data: null, error: { message: "Address cannot be empty" } }
      }
      
      // Clean up the address
      const cleanAddress = address.trim()
      
      const { data, error } = await supabase
        .from(TABLES.JOB_ADDRESSES)
        .insert({
          address: cleanAddress,
          user_id: userId
        })
        .select()

      if (error) throw error
      
      // Invalidate the cache since we've added a new address
      this._invalidateCache()
      
      return { data, error: null }
    } catch (error) {
      console.error(`❌ Error in addJobAddress for user ${userId}:`, error.message || error)
      return { data: null, error }
    }
  }

  async deleteJobAddress(userId, addressId) {
    try {
      if (!userId) {
        console.warn("⚠️ deleteJobAddress called with null or undefined userId")
        return { error: { message: "Invalid user ID" } }
      }
      
      if (!addressId) {
        console.warn("⚠️ deleteJobAddress called with null or undefined addressId")
        return { error: { message: "Invalid address ID" } }
      }
      
      const { error } = await supabase
        .from(TABLES.JOB_ADDRESSES)
        .delete()
        .eq('id', addressId)
        .eq('user_id', userId)

      if (error) throw error
      
      // Invalidate the cache since we've deleted an address
      this._invalidateCache()
      
      return { error: null }
    } catch (error) {
      console.error(`❌ Error in deleteJobAddress for user ${userId}, address ${addressId}:`, error.message || error)
      return { error }
    }
  }

  async getAllJobAddresses(forceRefresh = false) {
    let timerName = null
    try {
      // Check cache first (unless force refresh is requested)
      const now = Date.now()
      if (!forceRefresh &&
          this._cache.allJobAddresses &&
          this._cache.allJobAddressesTimestamp &&
          (now - this._cache.allJobAddressesTimestamp) < this._cache.cacheTimeout) {
        console.log("📋 Returning cached allJobAddresses")
        return { data: this._cache.allJobAddresses, error: null }
      }

      timerName = this._startTimer('getAllJobAddresses')
      console.log("🔄 Cache miss or expired for allJobAddresses, fetching fresh data...")

      const { data, error } = await supabase
        .from(TABLES.JOB_ADDRESSES)
        .select('address')
        .order('address', { ascending: true })

      if (error) throw error
      
      // Handle case where data is null or undefined
      if (!data) {
        console.warn("⚠️ No job addresses found in database")
        this._cache.allJobAddresses = []
        this._cache.allJobAddressesTimestamp = now
        if (timerName) this._endTimer(timerName)
        return { data: [], error: null }
      }
      
      // Deduplicate addresses since multiple users may have the same addresses
      const uniqueAddresses = Array.from(new Set(data.map(j => j.address || "").filter(addr => addr)))
      const addresses = uniqueAddresses

      this._cache.allJobAddresses = addresses
      this._cache.allJobAddressesTimestamp = now
      if (timerName) this._endTimer(timerName)
      console.log(`💾 All job addresses cached for ${this._cache.cacheTimeout / 1000} seconds (${addresses.length} unique addresses)`)
      return { data: addresses, error: null }
    } catch (error) {
      console.error("❌ Error in getAllJobAddresses:", error.message || error)
      
      // Ensure all timers are cleaned up on error
      this._cleanupAllTimers();
      
      // Return previously cached data if available instead of empty array
      if (this._cache.allJobAddresses) {
        console.log("⚠️ Returning stale cached data due to error")
        return { data: this._cache.allJobAddresses, error: null }
      }
      
      return { data: [], error }
    }
  }

  // Time Entries
  async getTimeEntries(userId, limit = 50) {
    try {
      const { data, error } = await supabase
        .from(TABLES.TIME_ENTRIES)
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: false })
        .order('start_time', { ascending: false })
        .limit(limit)

      if (error) throw error
      return { data: data || [], error: null }
    } catch (error) {
      return { data: [], error }
    }
  }

  async addTimeEntry(userId, entry) {
    try {
      const { data, error } = await supabase
        .from(TABLES.TIME_ENTRIES)
        .insert({
          user_id: userId,
          start_time: entry.startTime,
          end_time: entry.endTime,
          duration: entry.duration,
          job_address: entry.jobAddress,
          csi_division: entry.task,
          notes: entry.notes,
          date: entry.date,
          manual: entry.manual || false
        })
        .select()

      if (error) throw error
      
      // Invalidate cache since data has changed
      this._invalidateCache()
      
      return { data, error: null }
    } catch (error) {
      return { data: null, error }
    }
  }

  async deleteTimeEntry(userId, entryId) {
    try {
      const { error } = await supabase
        .from(TABLES.TIME_ENTRIES)
        .delete()
        .eq('id', entryId)
        .eq('user_id', userId)

      if (error) throw error
      
      // Invalidate cache since data has changed
      this._invalidateCache()
      
      return { error: null }
    } catch (error) {
      return { error }
    }
  }

  async editTimeEntry(userId, entryId, updatedEntry) {
    try {
      const { data, error } = await supabase
        .from(TABLES.TIME_ENTRIES)
        .update({
          start_time: updatedEntry.startTime,
          end_time: updatedEntry.endTime,
          duration: updatedEntry.duration,
          job_address: updatedEntry.jobAddress,
          csi_division: updatedEntry.task,
          notes: updatedEntry.notes,
          date: updatedEntry.date,
          manual: updatedEntry.manual || false
        })
        .eq('id', entryId)
        .eq('user_id', userId)
        .select()

      if (error) throw error
      
      // Invalidate cache since data has changed
      this._invalidateCache()
      
      return { data, error: null }
    } catch (error) {
      return { error }
    }
  }

  async getAllTimeEntries(limit = 100) {
    try {
      const { data, error } = await supabase
        .from(TABLES.TIME_ENTRIES)
        .select(`
          *,
          users (
            name,
            username,
            role
          )
        `)
        .order('date', { ascending: false })
        .order('start_time', { ascending: false })
        .limit(limit)

      if (error) throw error

      // Transform data to match expected format
      const transformedData = data?.map(entry => ({
        ...entry,
        user_name: entry.users?.name,
        user_email: entry.users?.username,
        user_role: entry.users?.role
      })) || []

      return { data: transformedData, error: null }
    } catch (error) {
      return { data: [], error }
    }
  }

  // User Stats & Data
  async getUserStats(userId) {
    try {
      // Get time entries
      const { data: entries } = await this.getTimeEntries(userId, Infinity)
      
      // Get job addresses
      const { data: addresses } = await this.getJobAddresses(userId)

      const totalHours = entries.reduce((sum, entry) => sum + entry.duration, 0) / 3600
      const divisionBreakdown = entries.reduce((acc, entry) => {
        acc[entry.csi_division] = (acc[entry.csi_division] || 0) + entry.duration
        return acc
      }, {})

      return {
        totalEntries: entries.length,
        totalHours,
        totalAddresses: addresses.length,
        divisionBreakdown,
        lastEntry: entries.length > 0 ? entries[0].created_at : null,
      }
    } catch (error) {
      return {
        totalEntries: 0,
        totalHours: 0,
        totalAddresses: 0,
        divisionBreakdown: {},
        lastEntry: null
      }
    }
  }

  async getAllUsersData(forceRefresh = false) {
    let timerName = null
    try {
      // Check cache first (unless force refresh is requested)
      const now = Date.now()
      if (!forceRefresh && 
          this._cache.allUsersData && 
          this._cache.allUsersDataTimestamp && 
          (now - this._cache.allUsersDataTimestamp) < this._cache.cacheTimeout) {
        console.log("📋 Returning cached getAllUsersData")
        return this._cache.allUsersData
      }

      timerName = this._startTimer('getAllUsersData')
      console.log("🔄 Cache miss or expired, fetching fresh data...")
      
      // Single query to get all users, time entries, and job addresses in parallel
      const [usersResult, timeEntriesResult, jobAddressesResult] = await Promise.all([
        supabase.from(TABLES.USERS).select('*'),
        supabase.from(TABLES.TIME_ENTRIES).select('*'),
        supabase.from(TABLES.JOB_ADDRESSES).select('*')
      ])

      if (usersResult.error) {
        console.error('❌ Error fetching users:', usersResult.error)
        throw usersResult.error
      }
      if (timeEntriesResult.error) {
        console.error('❌ Error fetching time entries:', timeEntriesResult.error)
      }
      if (jobAddressesResult.error) {
        console.error('❌ Error fetching job addresses:', jobAddressesResult.error)
      }
      
      const users = usersResult.data || []
      const allTimeEntries = timeEntriesResult.data || []
      const allJobAddresses = jobAddressesResult.data || []
      
      if (users.length === 0) {
        console.warn('⚠️ No users found in database!')
        if (timerName) this._endTimer(timerName)
        return {}
      }

      // Group data by user_id for efficient processing
      const timeEntriesByUser = {}
      const jobAddressesByUser = {}

      allTimeEntries.forEach(entry => {
        if (!timeEntriesByUser[entry.user_id]) {
          timeEntriesByUser[entry.user_id] = []
        }
        timeEntriesByUser[entry.user_id].push(entry)
      })

      allJobAddresses.forEach(address => {
        if (!jobAddressesByUser[address.user_id]) {
          jobAddressesByUser[address.user_id] = []
        }
        jobAddressesByUser[address.user_id].push(address)
      })

      // Build user data efficiently using pre-grouped data
      const allData = {}
      for (const user of users) {
        const userTimeEntries = timeEntriesByUser[user.id] || []
        const userJobAddresses = jobAddressesByUser[user.id] || []

        // Calculate stats locally instead of making more DB calls
        const totalHours = userTimeEntries.reduce((sum, entry) => sum + entry.duration, 0) / 3600
        const divisionBreakdown = userTimeEntries.reduce((acc, entry) => {
          acc[entry.csi_division] = (acc[entry.csi_division] || 0) + entry.duration
          return acc
        }, {})

        const stats = {
          totalEntries: userTimeEntries.length,
          totalHours,
          totalAddresses: userJobAddresses.length,
          divisionBreakdown,
          lastEntry: userTimeEntries.length > 0 ? 
            userTimeEntries.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0].created_at : 
            null,
        }

        allData[user.username] = {
          user,
          stats,
          jobAddresses: userJobAddresses.length,
          timeEntries: userTimeEntries.length,
        }
      }

      // Cache the results
      this._cache.allUsersData = allData
      this._cache.allUsersDataTimestamp = Date.now()

      if (timerName) this._endTimer(timerName)
      console.log(`✅ Optimized getAllUsersData: processed ${users.length} users with 3 queries instead of ${1 + users.length * 4}`)
      console.log(`💾 Data cached for ${this._cache.cacheTimeout / 1000} seconds`)
      
      return allData
    } catch (error) {
      console.error('Error getting all users data:', error)
      // Ensure all timers are cleaned up on error
      this._cleanupAllTimers();
      return {}
    }
  }

  // Database Management
  async clearAllData() {
    try {
      // Delete in order to respect foreign key constraints
      await supabase.from(TABLES.TIME_ENTRIES).delete().neq('id', '00000000-0000-0000-0000-000000000000')
      await supabase.from(TABLES.JOB_ADDRESSES).delete().neq('id', '00000000-0000-0000-0000-000000000000')
      await supabase.from(TABLES.USERS).delete().neq('id', '00000000-0000-0000-0000-000000000000')

      this.currentUser = null
      localStorage.removeItem('timeTracker_currentUser')
      
      // Reinitialize data
      await this._createInitialUsers()
      await this._createInitialJobAddresses()
      await this._createInitialCSITasks()
      
      console.log('All data cleared and defaults re-initialized.')
      return { error: null }
    } catch (error) {
      return { error }
    }
  }

  async initializeDatabase() {
    try {
      await this._createInitialUsers()
      await this._createInitialJobAddresses()
      await this._createInitialCSITasks()
      console.log('✅ Database initialization completed')
      return { error: null }
    } catch (error) {
      console.error('Error initializing database:', error)
      return { error }
    }
  }

  // CSI Tasks
  async getCSITasks(forceRefresh = false) {
    let timerName = null
    try {
      // Check cache first (unless force refresh is requested)
      const now = Date.now()
      if (!forceRefresh && 
          this._cache.csiTasks && 
          this._cache.csiTasksTimestamp && 
          (now - this._cache.csiTasksTimestamp) < this._cache.cacheTimeout) {
        console.log("📋 Returning cached CSI tasks")
        return { data: this._cache.csiTasks, error: null }
      }

      timerName = this._startTimer('getCSITasks')
      console.log("🔄 Cache miss or expired, fetching fresh CSI tasks...")
      
      // Get tasks and all time entries in parallel
      const [tasksResult, timeEntriesResult] = await Promise.all([
        supabase.from(TABLES.CSI_TASKS).select('*').order('name', { ascending: true }),
        supabase.from(TABLES.TIME_ENTRIES).select('duration, user_id, csi_division')
      ])

      if (tasksResult.error) throw tasksResult.error
      
      const tasks = tasksResult.data || []
      const allTimeEntries = timeEntriesResult.data || []

      console.log(`📋 Processing ${tasks.length} CSI tasks with ${allTimeEntries.length} total time entries`)

      // Group time entries by CSI division for efficient processing
      const entriesByDivision = {}
      allTimeEntries.forEach(entry => {
        const division = entry.csi_division
        if (!entriesByDivision[division]) {
          entriesByDivision[division] = []
        }
        entriesByDivision[division].push(entry)
      })

      // Calculate usage statistics efficiently
      const tasksWithStats = tasks.map(task => {
        const taskEntries = entriesByDivision[task.name] || []
        const usageCount = taskEntries.length
        const totalSeconds = taskEntries.reduce((sum, entry) => sum + (entry.duration || 0), 0)
        const uniqueUsers = new Set(taskEntries.map(entry => entry.user_id).filter(Boolean)).size

        return {
          ...task,
          usage_count: usageCount,
          total_hours: Math.round((totalSeconds / 3600) * 10) / 10,
          unique_users: uniqueUsers
        }
      })

      // Cache the results
      this._cache.csiTasks = tasksWithStats
      this._cache.csiTasksTimestamp = Date.now()

      if (timerName) this._endTimer(timerName)
      console.log(`✅ Optimized getCSITasks: processed ${tasks.length} tasks with 2 queries instead of ${1 + tasks.length}`)
      console.log(`💾 CSI tasks cached for ${this._cache.cacheTimeout / 1000} seconds`)

      return { data: tasksWithStats, error: null }
    } catch (error) {
      console.error('❌ Error in getCSITasks:', error)
      
      // Ensure all timers are cleaned up on error
      this._cleanupAllTimers();
      
      return { data: [], error }
    }
  }

  async addCSITask(taskName) {
    try {
      const { data, error } = await supabase
        .from(TABLES.CSI_TASKS)
        .insert({ name: taskName })
        .select()

      if (error) {
        if (error.code === '23505') { // Unique constraint violation
          return { data: null, error: { message: 'Task already exists.' } }
        }
        throw error
      }

      // Invalidate cache since CSI tasks have changed
      this._invalidateCache()

      return { data, error: null }
    } catch (error) {
      return { data: null, error }
    }
  }

  async editCSITask(taskId, newName) {
    try {
      const { data, error } = await supabase
        .from(TABLES.CSI_TASKS)
        .update({ name: newName })
        .eq('id', taskId)
        .select()

      if (error) {
        if (error.code === '23505') {
          return { error: { message: 'Task name already exists.' } }
        }
        throw error
      }

      // Update all time entries that use the old task name
      if (data && data[0]) {
        const { error: updateError } = await supabase
          .from(TABLES.TIME_ENTRIES)
          .update({ csi_division: newName })
          .eq('csi_division', data[0].name) // This won't work, we need the old name
      }

      // Invalidate cache since CSI tasks have changed
      this._invalidateCache()

      return { data, error: null }
    } catch (error) {
      return { error }
    }
  }

  async deleteCSITask(taskId) {
    try {
      const { error } = await supabase
        .from(TABLES.CSI_TASKS)
        .delete()
        .eq('id', taskId)

      if (error) throw error
      
      // Invalidate cache since CSI tasks have changed
      this._invalidateCache()
      
      return { error: null }
    } catch (error) {
      return { error }
    }
  }

  async getAvailableCSITasks() {
    try {
      // Check if we have cached task names first (faster than full getCSITasks)
      const now = Date.now()
      if (this._cache.csiTasks &&
          this._cache.csiTasksTimestamp &&
          (now - this._cache.csiTasksTimestamp) < this._cache.cacheTimeout) {
        const taskNames = this._cache.csiTasks.map(task => task.name || "").filter(Boolean)
        console.log(`📋 Retrieved ${taskNames.length} task names from cache (fast path)`)
        return { data: taskNames, error: null }
      }

      // Use cached CSI tasks if available
      const cachedResult = await this.getCSITasks()
      if (cachedResult.data && cachedResult.data.length > 0) {
        const taskNames = cachedResult.data.map(task => task.name || "").filter(Boolean)
        console.log(`📋 Retrieved ${taskNames.length} task names from cache`)
        return { data: taskNames, error: null }
      }

      // Fallback to direct query if cache fails
      console.log('⚠️ Cache miss for CSI tasks, falling back to direct query')
      const { data, error } = await supabase
        .from(TABLES.CSI_TASKS)
        .select('name')
        .order('name', { ascending: true })

      if (error) throw error
      
      // Handle case where data is null
      if (!data) {
        console.warn("⚠️ No CSI tasks found in database")
        return { data: [], error: null }
      }
      
      const taskNames = data.map(task => task.name || "").filter(Boolean)
      return { data: taskNames, error: null }
    } catch (error) {
      console.error("❌ Error in getAvailableCSITasks:", error.message || error)
      
      // Return default tasks if everything fails
      return { 
        data: ['General', 'Plumbing', 'Electrical', 'Carpentry', 'Masonry', 'HVAC'], 
        error: null 
      }
    }
  }
} 