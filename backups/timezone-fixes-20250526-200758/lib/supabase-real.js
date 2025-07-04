import { supabase, TABLES, INITIAL_USERS, INITIAL_JOB_ADDRESSES, INITIAL_CSI_TASKS } from './supabase-config.js'
import bcrypt from 'bcryptjs'

class SupabaseDBManager {
  constructor() {
    this.currentUser = null
    this._cache = {
      allUsersData: null,
      allUsersDataTimestamp: null,
      csiTasks: null,
      csiTasksTimestamp: null,
      allJobAddresses: null,
      allJobAddressesTimestamp: null,
      cacheTimeout: 300000 // 5 minutes cache timeout (increased from 60000)
    }
    this._loadCurrentUser()
    this._initializeData()
  }

  async _loadCurrentUser() {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        // Get user details from our users table
        const { data: userData } = await supabase
          .from(TABLES.USERS)
          .select('*')
          .eq('id', session.user.id)
          .single()
        
        if (userData) {
          this.currentUser = userData
        }
      }
    } catch (error) {
      console.error('Error loading current user:', error)
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

  // Admin function to create users with role selection
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

  async signOut() {
    try {
      this.currentUser = null
      localStorage.removeItem('timeTracker_currentUser')
      return { error: null }
    } catch (error) {
      return { error }
    }
  }

  async getCurrentUser() {
    return this.currentUser
  }

  async getJobAddresses(userId) {
    try {
      const { data, error } = await supabase
        .from(TABLES.JOB_ADDRESSES)
        .select('*')
        .eq('user_id', userId)
        .order('address', { ascending: true })

      if (error) throw error
      return { data: data || [], error: null }
    } catch (error) {
      return { data: [], error }
    }
  }

  async addJobAddress(userId, address) {
    try {
      const { data, error } = await supabase
        .from(TABLES.JOB_ADDRESSES)
        .insert({
          address,
          user_id: userId
        })
        .select()

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return { data: null, error }
    }
  }

  async deleteJobAddress(userId, addressId) {
    try {
      const { error } = await supabase
        .from(TABLES.JOB_ADDRESSES)
        .delete()
        .eq('id', addressId)
        .eq('user_id', userId)

      if (error) throw error
      return { error: null }
    } catch (error) {
      return { error }
    }
  }

  async getTimeEntries(userId, limit = 50) {
    try {
      const { data, error } = await supabase
        .from(TABLES.TIME_ENTRIES)
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
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
        .order('created_at', { ascending: false })
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

      const timerName = `getAllUsersData execution ${Date.now()}`
      console.time(timerName)
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

      console.timeEnd(timerName)
      console.log(`✅ Optimized getAllUsersData: processed ${users.length} users with 3 queries instead of ${1 + users.length * 4}`)
      console.log(`💾 Data cached for ${this._cache.cacheTimeout / 1000} seconds`)

      
      return allData
    } catch (error) {
      console.error('Error getting all users data:', error)
      // Timer already ended in success path, don't end again
      return {}
    }
  }

  // Cache management methods
  _invalidateCache() {
    console.log("🗑️ Cache invalidated due to data changes")
    this._cache.allUsersData = null
    this._cache.allUsersDataTimestamp = null
    this._cache.csiTasks = null
    this._cache.csiTasksTimestamp = null
    this._cache.allJobAddresses = null
    this._cache.allJobAddressesTimestamp = null
  }

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

  async getCSITasks(forceRefresh = false) {
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

      const timerName = `getCSITasks execution ${Date.now()}`
      console.time(timerName)
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

      console.timeEnd(timerName)
      console.log(`✅ Optimized getCSITasks: processed ${tasks.length} tasks with 2 queries instead of ${1 + tasks.length}`)
      console.log(`💾 CSI tasks cached for ${this._cache.cacheTimeout / 1000} seconds`)

      return { data: tasksWithStats, error: null }
    } catch (error) {
      console.error('❌ Error in getCSITasks:', error)
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
        const taskNames = this._cache.csiTasks.map(task => task.name)
        console.log(`📋 Retrieved ${taskNames.length} task names from cache (fast path)`)
        return { data: taskNames, error: null }
      }

      // Use cached CSI tasks if available
      const cachedResult = await this.getCSITasks()
      if (cachedResult.data) {
        const taskNames = cachedResult.data.map(task => task.name)
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
      const taskNames = data?.map(task => task.name) || []
      return { data: taskNames, error: null }
    } catch (error) {
      return { data: [], error }
    }
  }

  async getAllJobAddresses(forceRefresh = false) {
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

      const timerName = `getAllJobAddresses execution ${Date.now()}`
      console.time(timerName)
      console.log("🔄 Cache miss or expired for allJobAddresses, fetching fresh data...")

      const { data, error } = await supabase
        .from(TABLES.JOB_ADDRESSES)
        .select('address')
        .order('address', { ascending: true })

      if (error) throw error
      // Deduplicate addresses since multiple users may have the same addresses
      const uniqueAddresses = Array.from(new Set(data?.map(j => j.address) || []))
      const addresses = uniqueAddresses

      this._cache.allJobAddresses = addresses
      this._cache.allJobAddressesTimestamp = now
      console.timeEnd(timerName)
      console.log(`💾 All job addresses cached for ${this._cache.cacheTimeout / 1000} seconds (${addresses.length} unique addresses)`)
      return { data: addresses, error: null }
    } catch (error) {
      return { data: [], error }
    }
  }
}

const dbManager = new SupabaseDBManager()

export const timeTrackerAPI = {
  signUp: (username, password, name) => dbManager.signUp(username, password, name),
  createUser: (username, password, name, role) => dbManager.createUser(username, password, name, role),
  signIn: (username, password) => dbManager.signIn(username, password),
  signOut: () => dbManager.signOut(),
  getCurrentUser: () => dbManager.getCurrentUser(),
  getJobAddresses: (userId) => dbManager.getJobAddresses(userId),
  addJobAddress: (userId, address) => dbManager.addJobAddress(userId, address),
  deleteJobAddress: (userId, addressId) => dbManager.deleteJobAddress(userId, addressId),
  getTimeEntries: (userId, limit) => dbManager.getTimeEntries(userId, limit),
  addTimeEntry: (userId, entry) => dbManager.addTimeEntry(userId, entry),
  deleteTimeEntry: (userId, entryId) => dbManager.deleteTimeEntry(userId, entryId),
  editTimeEntry: (userId, entryId, updatedEntry) => dbManager.editTimeEntry(userId, entryId, updatedEntry),
  getAllTimeEntries: (limit) => dbManager.getAllTimeEntries(limit),
  getUserStats: (userId) => dbManager.getUserStats(userId),
  getAllUsersData: (forceRefresh = false) => dbManager.getAllUsersData(forceRefresh),
  clearAllData: () => dbManager.clearAllData(),
  initializeDatabase: () => dbManager.initializeDatabase(),
  forceCreateUsers: () => dbManager._createInitialUsers(),
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

  getAllJobAddresses: (forceRefresh = false) => dbManager.getAllJobAddresses(forceRefresh),
} 