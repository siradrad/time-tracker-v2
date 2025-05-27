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
    
    // Initialize state
    this._loadCurrentUser()
    this._initializeData()
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

  // More methods to be added in subsequent edits
} 