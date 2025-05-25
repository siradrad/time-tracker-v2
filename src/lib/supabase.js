class LocalDBManager {
  constructor() {
    this.currentUser = null;
    this._loadCurrentUser();
    this._initializeDefaultUsers();
    this._initializeDefaultJobAddressesForTestUsers();
    this._initializeDefaultCSITasks();
  }

  _loadCurrentUser() {
    const storedUser = localStorage.getItem('timeTracker_currentUser');
    if (storedUser) {
      try {
        this.currentUser = JSON.parse(storedUser);
      } catch (e) {
        console.error("Error parsing current user from localStorage", e);
        localStorage.removeItem('timeTracker_currentUser');
      }
    }
  }

  _initializeDefaultUsers() {
    const users = this._getUsers();
    if (Object.keys(users).length === 0) {
      const defaultUsers = {
        'admin@timetracker.app': { id: 'admin_user', email: 'admin@timetracker.app', password: 'admin123', name: 'System Admin', role: 'admin', created_at: new Date().toISOString() },
        'stacy@timetracker.app': { id: 'stacy_id', email: 'stacy@timetracker.app', password: 'stacy123', name: 'Stacy', role: 'user', created_at: new Date().toISOString() },
        'jeremy@timetracker.app': { id: 'jeremy_id', email: 'jeremy@timetracker.app', password: 'jeremy123', name: 'Jeremy', role: 'user', created_at: new Date().toISOString() },
        'humberto@timetracker.app': { id: 'humberto_id', email: 'humberto@timetracker.app', password: 'humberto123', name: 'Humberto', role: 'user', created_at: new Date().toISOString() },
        'enrique@timetracker.app': { id: 'enrique_id', email: 'enrique@timetracker.app', password: 'enrique123', name: 'Enrique', role: 'user', created_at: new Date().toISOString() },
        'drew@timetracker.app': { id: 'drew_id', email: 'drew@timetracker.app', password: 'drew123', name: 'Drew', role: 'user', created_at: new Date().toISOString() },
        'enriquesr@timetracker.app': { id: 'enriquesr_id', email: 'enriquesr@timetracker.app', password: 'enriquesr123', name: 'Enrique Sr', role: 'user', created_at: new Date().toISOString() },
        'karen@timetracker.app': { id: 'karen_id', email: 'karen@timetracker.app', password: 'karen123', name: 'Karen', role: 'user', created_at: new Date().toISOString() },
        'anthony@timetracker.app': { id: 'anthony_id', email: 'anthony@timetracker.app', password: 'anthony123', name: 'Anthony', role: 'user', created_at: new Date().toISOString() },
        'angela@timetracker.app': { id: 'angela_id', email: 'angela@timetracker.app', password: 'angela123', name: 'Angela', role: 'user', created_at: new Date().toISOString() },
      };
      this._saveUsers(defaultUsers);
      console.log('✅ Default mock users created.');
    }
  }
  
  _initializeDefaultJobAddressesForTestUsers() {
    const testUserIds = [
      'admin_user', 
      'stacy_id', 
      'jeremy_id', 
      'humberto_id', 
      'enrique_id', 
      'drew_id', 
      'enriquesr_id', 
      'karen_id', 
      'anthony_id', 
      'angela_id'
    ];
    const defaultAddresses = [
      '1620 Spruce St',
      '1710 OOB, LLC',
      '4 Hayden Ln',
      '408 Kintner LLC',
      '4301 N Delaware OOB',
      '451 Perry Auger, LLC',
      '520 Kintner Road LLC',
      '730 Lonely Cottage, LLC',
      '7658 Easton Road, LLC',
      '804 N Broad St',
      'Amida Special Opportunity Fund',
      'Aquadilla, OOB',
      'CDD 2016 Irv Trust',
      'Daniel Cohen',
      'ECPM Admin',
      'Gimme Shelter',
      'Headquarters Rd',
      '15 Headquarters Rd',
      'Lot 126',
      'Matthew Chaikin',
      'Michael Axelrod and Affiliated Companies',
      'PP Loom, LLC',
      'Rafi Licht',
      '746 S 4th St',
      'Ruby Development',
      '24-30 Bank St'
    ];

    testUserIds.forEach(userId => {
      const key = `timeTracker_job_addresses_${userId}`;
      if (!localStorage.getItem(key)) {
        const userAddresses = defaultAddresses.map((address, index) => ({
          id: `${userId}_addr_${Date.now()}_${index}`,
          address,
          user_id: userId,
          created_at: new Date().toISOString()
        })).sort((a,b) => a.address.localeCompare(b.address));
        localStorage.setItem(key, JSON.stringify(userAddresses));
      }
    });
  }

  _getUsers() {
    try {
      return JSON.parse(localStorage.getItem('timeTracker_users') || '{}');
    } catch (e) { return {}; }
  }

  _saveUsers(users) {
    localStorage.setItem('timeTracker_users', JSON.stringify(users));
  }

  async signUp(email, password, name = 'New User') {
    // Simplified signUp for local mock, doesn't handle roles or advanced features
    const users = this._getUsers();
    if (users[email]) {
      return { data: null, error: { message: 'User already exists.' } };
    }
    const userId = `user_${Date.now()}`;
    const newUser = { id: userId, email, password, name, role: 'user', created_at: new Date().toISOString() };
    users[email] = newUser;
    this._saveUsers(users);
    return { data: { user: newUser }, error: null };
  }

  async signIn(email, password) {
    const users = this._getUsers();
    const user = users[email];
    if (user && user.password === password) {
      this.currentUser = user;
      localStorage.setItem('timeTracker_currentUser', JSON.stringify(user));
      return { data: { user }, error: null };
    }
    return { data: null, error: { message: 'Invalid login credentials.' } };
  }

  async signOut() {
    this.currentUser = null;
    localStorage.removeItem('timeTracker_currentUser');
    return { error: null };
  }

  async getCurrentUser() {
    return this.currentUser;
  }

  async getJobAddresses(userId) {
    if (!userId) return { data: [], error: { message: 'User ID is required.' } };
    const key = `timeTracker_job_addresses_${userId}`;
    try {
      const data = JSON.parse(localStorage.getItem(key) || '[]');
      return { data, error: null };
    } catch (e) { return { data: [], error: e }; }
  }

  async addJobAddress(userId, address) {
    if (!userId) return { data: null, error: { message: 'User ID is required.' } };
    const { data: addresses, error: getError } = await this.getJobAddresses(userId);
    if (getError) return { data: null, error: getError };
    
    const newAddress = { id: `addr_${Date.now()}`, address, user_id: userId, created_at: new Date().toISOString() };
    addresses.push(newAddress);
    addresses.sort((a, b) => a.address.localeCompare(b.address));
    localStorage.setItem(`timeTracker_job_addresses_${userId}`, JSON.stringify(addresses));
    return { data: [newAddress], error: null };
  }

  async deleteJobAddress(userId, addressId) {
    if (!userId) return { error: { message: 'User ID is required.' } };
    const { data: addresses, error: getError } = await this.getJobAddresses(userId);
    if (getError) return { error: getError };

    const filteredAddresses = addresses.filter(addr => addr.id !== addressId);
    localStorage.setItem(`timeTracker_job_addresses_${userId}`, JSON.stringify(filteredAddresses));
    return { error: null };
  }

  _getFullTimeEntries(userId) {
    if (!userId) return [];
    const key = `timeTracker_time_entries_${userId}`;
    try {
      return JSON.parse(localStorage.getItem(key) || '[]');
    } catch (e) { return []; }
  }

  async getTimeEntries(userId, limit = 50) {
    if (!userId) return { data: [], error: { message: 'User ID is required.' } };
    let allEntries = this._getFullTimeEntries(userId);
    allEntries.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    return { data: allEntries.slice(0, limit), error: null };
  }

  async addTimeEntry(userId, entry) {
    if (!userId) return { data: null, error: { message: 'User ID is required.' } };
    let allEntries = this._getFullTimeEntries(userId);
    const newEntry = {
      id: `entry_${Date.now()}`,
      user_id: userId,
      start_time: entry.startTime,
      end_time: entry.endTime,
      duration: entry.duration,
      csi_division: entry.task,
      job_address: entry.jobAddress,
      notes: entry.notes,
      date: entry.date,
      created_at: new Date().toISOString()
    };
    allEntries.unshift(newEntry); // Add to the beginning
    localStorage.setItem(`timeTracker_time_entries_${userId}`, JSON.stringify(allEntries));
    return { data: [newEntry], error: null };
  }

  async deleteTimeEntry(userId, entryId) {
    if (!userId) return { error: { message: 'User ID is required.' } };
    let allEntries = this._getFullTimeEntries(userId);
    const filteredEntries = allEntries.filter(e => e.id !== entryId);
    localStorage.setItem(`timeTracker_time_entries_${userId}`, JSON.stringify(filteredEntries));
    return { error: null };
  }

  async editTimeEntry(userId, entryId, updatedEntry) {
    if (!userId) return { error: { message: 'User ID is required.' } };
    let allEntries = this._getFullTimeEntries(userId);
    const entryIndex = allEntries.findIndex(e => e.id === entryId);
    
    if (entryIndex === -1) {
      return { error: { message: 'Time entry not found.' } };
    }

    // Update the entry while preserving id and created_at
    allEntries[entryIndex] = {
      ...allEntries[entryIndex],
      start_time: updatedEntry.startTime,
      end_time: updatedEntry.endTime,
      duration: updatedEntry.duration,
      csi_division: updatedEntry.task,
      job_address: updatedEntry.jobAddress,
      notes: updatedEntry.notes,
      date: updatedEntry.date,
      updated_at: new Date().toISOString()
    };

    localStorage.setItem(`timeTracker_time_entries_${userId}`, JSON.stringify(allEntries));
    return { data: [allEntries[entryIndex]], error: null };
  }

  async getAllTimeEntries(limit = 100) {
    const users = this._getUsers();
    const allEntries = [];
    
    for (const email in users) {
      const user = users[email];
      const userEntries = this._getFullTimeEntries(user.id);
      
      // Add user info to each entry
      userEntries.forEach(entry => {
        allEntries.push({
          ...entry,
          user_name: user.name,
          user_email: user.email,
          user_role: user.role
        });
      });
    }
    
    // Sort by created_at descending
    allEntries.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    
    return { data: allEntries.slice(0, limit), error: null };
  }

  async getUserStats(userId) {
    if (!userId) return { totalEntries: 0, totalHours: 0, totalAddresses: 0, divisionBreakdown: {}, lastEntry: null };
    const {data: entries} = await this.getTimeEntries(userId, Infinity); // Get all entries
    const {data: addresses} = await this.getJobAddresses(userId);
    
    const totalHours = entries.reduce((sum, entry) => sum + entry.duration, 0) / 3600;
    const divisionBreakdown = entries.reduce((acc, entry) => {
      acc[entry.csi_division] = (acc[entry.csi_division] || 0) + entry.duration;
      return acc;
    }, {});

    return {
      totalEntries: entries.length,
      totalHours,
      totalAddresses: addresses.length,
      divisionBreakdown,
      lastEntry: entries.length > 0 ? entries[0].created_at : null,
    };
  }

  async getAllUsersData() {
    const users = this._getUsers();
    const allData = {};
    for (const email in users) {
      const user = users[email];
      allData[user.email] = {
        user,
        stats: await this.getUserStats(user.id),
        jobAddresses: (await this.getJobAddresses(user.id)).data.length,
        timeEntries: (await this.getTimeEntries(user.id, Infinity)).data.length,
      };
    }
    return allData;
  }

  async clearAllData() {
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('timeTracker_')) {
        localStorage.removeItem(key);
      }
    });
    this.currentUser = null;
    this._initializeDefaultUsers();
    this._initializeDefaultJobAddressesForTestUsers();
    this._initializeDefaultCSITasks();
    console.log('All test data cleared and defaults re-initialized.');
    return { error: null };
  }

  _initializeDefaultCSITasks() {
    const defaultTasks = [
      'General Construction',
      'Site Preparation',
      'Concrete',
      'Masonry',
      'Metals',
      'Wood, Plastics, and Composites',
      'Thermal and Moisture Protection',
      'Openings',
      'Finishes',
      'Specialties',
      'Equipment',
      'Furnishings',
      'Special Construction',
      'Conveying Equipment',
      'Fire Suppression',
      'Plumbing',
      'HVAC',
      'Electrical',
      'Communications',
      'Electronic Safety and Security'
    ];

    const key = 'timeTracker_csi_tasks';
    if (!localStorage.getItem(key)) {
      const tasks = defaultTasks.map((name, index) => ({
        id: `csi_task_${Date.now()}_${index}`,
        name,
        created_at: new Date().toISOString()
      }));
      localStorage.setItem(key, JSON.stringify(tasks));
      console.log('✅ Default CSI tasks created.');
    }
  }

  async getCSITasks() {
    try {
      const tasks = JSON.parse(localStorage.getItem('timeTracker_csi_tasks') || '[]');
      
      // Calculate usage statistics for each task
      const users = this._getUsers();
      const tasksWithStats = tasks.map(task => {
        let usageCount = 0;
        let totalSeconds = 0;
        let uniqueUsers = new Set();

        // Check all users' time entries
        for (const email in users) {
          const user = users[email];
          const userEntries = this._getFullTimeEntries(user.id);
          
          userEntries.forEach(entry => {
            if (entry.csi_division === task.name) {
              usageCount++;
              totalSeconds += entry.duration;
              uniqueUsers.add(user.id);
            }
          });
        }

        return {
          ...task,
          usage_count: usageCount,
          total_hours: Math.round((totalSeconds / 3600) * 10) / 10,
          unique_users: uniqueUsers.size
        };
      });

      // Sort by name
      tasksWithStats.sort((a, b) => a.name.localeCompare(b.name));
      
      return { data: tasksWithStats, error: null };
    } catch (e) {
      return { data: [], error: e };
    }
  }

  async addCSITask(taskName) {
    try {
      const tasks = JSON.parse(localStorage.getItem('timeTracker_csi_tasks') || '[]');
      
      // Check if task already exists
      if (tasks.some(task => task.name.toLowerCase() === taskName.toLowerCase())) {
        return { data: null, error: { message: 'Task already exists.' } };
      }

      const newTask = {
        id: `csi_task_${Date.now()}`,
        name: taskName,
        created_at: new Date().toISOString()
      };

      tasks.push(newTask);
      localStorage.setItem('timeTracker_csi_tasks', JSON.stringify(tasks));
      
      return { data: [newTask], error: null };
    } catch (e) {
      return { data: null, error: e };
    }
  }

  async editCSITask(taskId, newName) {
    try {
      const tasks = JSON.parse(localStorage.getItem('timeTracker_csi_tasks') || '[]');
      const taskIndex = tasks.findIndex(task => task.id === taskId);
      
      if (taskIndex === -1) {
        return { error: { message: 'Task not found.' } };
      }

      // Check if new name already exists (excluding current task)
      if (tasks.some((task, index) => index !== taskIndex && task.name.toLowerCase() === newName.toLowerCase())) {
        return { error: { message: 'Task name already exists.' } };
      }

      const oldName = tasks[taskIndex].name;
      tasks[taskIndex] = {
        ...tasks[taskIndex],
        name: newName,
        updated_at: new Date().toISOString()
      };

      localStorage.setItem('timeTracker_csi_tasks', JSON.stringify(tasks));

      // Update all time entries that use this task name
      const users = this._getUsers();
      for (const email in users) {
        const user = users[email];
        const userEntries = this._getFullTimeEntries(user.id);
        let updated = false;

        userEntries.forEach(entry => {
          if (entry.csi_division === oldName) {
            entry.csi_division = newName;
            updated = true;
          }
        });

        if (updated) {
          localStorage.setItem(`timeTracker_time_entries_${user.id}`, JSON.stringify(userEntries));
        }
      }
      
      return { data: [tasks[taskIndex]], error: null };
    } catch (e) {
      return { error: e };
    }
  }

  async deleteCSITask(taskId) {
    try {
      const tasks = JSON.parse(localStorage.getItem('timeTracker_csi_tasks') || '[]');
      const filteredTasks = tasks.filter(task => task.id !== taskId);
      
      localStorage.setItem('timeTracker_csi_tasks', JSON.stringify(filteredTasks));
      
      return { error: null };
    } catch (e) {
      return { error: e };
    }
  }

  async getAvailableCSITasks() {
    try {
      const tasks = JSON.parse(localStorage.getItem('timeTracker_csi_tasks') || '[]');
      const taskNames = tasks.map(task => task.name).sort();
      return { data: taskNames, error: null };
    } catch (e) {
      return { data: [], error: e };
    }
  }
}

// Switch to real Supabase database mode
export { timeTrackerAPI } from './supabase-real.js'; 