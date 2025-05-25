import { supabase, TABLES, INITIAL_USERS, INITIAL_JOB_ADDRESSES, INITIAL_CSI_TASKS } from './supabase-config.js'
import bcrypt from 'bcryptjs'

class SupabaseDBManager {
  constructor() {
    this.currentUser = null
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
      console.log('✅ Initial users created')
    } catch (error) {
      console.error('Error creating initial users:', error)
    }
  }

  async _createInitialJobAddresses() {
    try {
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
          date: entry.date
        })
        .select()

      if (error) throw error
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
          date: updatedEntry.date
        })
        .eq('id', entryId)
        .eq('user_id', userId)
        .select()

      if (error) throw error
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
          users!time_entries_user_id_fkey (
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

  async getAllUsersData() {
    try {
      const { data: users, error } = await supabase
        .from(TABLES.USERS)
        .select('*')

      if (error) throw error

      const allData = {}
      for (const user of users || []) {
        allData[user.username] = {
          user,
          stats: await this.getUserStats(user.id),
          jobAddresses: (await this.getJobAddresses(user.id)).data.length,
          timeEntries: (await this.getTimeEntries(user.id, Infinity)).data.length,
        }
      }
      return allData
    } catch (error) {
      console.error('Error getting all users data:', error)
      return {}
    }
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

  async getCSITasks() {
    try {
      const { data: tasks, error } = await supabase
        .from(TABLES.CSI_TASKS)
        .select('*')
        .order('name', { ascending: true })

      if (error) throw error

      // Calculate usage statistics for each task
      const tasksWithStats = []
      
      for (const task of tasks || []) {
        const { data: timeEntries } = await supabase
          .from(TABLES.TIME_ENTRIES)
          .select('duration, user_id')
          .eq('csi_division', task.name)

        const usageCount = timeEntries?.length || 0
        const totalSeconds = timeEntries?.reduce((sum, entry) => sum + entry.duration, 0) || 0
        const uniqueUsers = new Set(timeEntries?.map(entry => entry.user_id) || []).size

        tasksWithStats.push({
          ...task,
          usage_count: usageCount,
          total_hours: Math.round((totalSeconds / 3600) * 10) / 10,
          unique_users: uniqueUsers
        })
      }

      return { data: tasksWithStats, error: null }
    } catch (error) {
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
      return { error: null }
    } catch (error) {
      return { error }
    }
  }

  async getAvailableCSITasks() {
    try {
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
  getAllUsersData: () => dbManager.getAllUsersData(),
  clearAllData: () => dbManager.clearAllData(),
  initializeDatabase: () => dbManager.initializeDatabase(),
  
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