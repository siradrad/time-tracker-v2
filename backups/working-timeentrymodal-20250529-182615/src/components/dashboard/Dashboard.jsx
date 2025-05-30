import React, { useState, useEffect } from 'react'
import { timeTrackerAPI } from '../../lib/supabase-real.js'
import AdminDashboard from './AdminDashboard/AdminDashboard'
import UserDashboard from './UserDashboard/UserDashboard'
import LoadingState from './Shared/LoadingState'
import ErrorState from './Shared/ErrorState'
import TimeEntryModal from '../TimeEntryModal.jsx'
import ReportingModal from './Reporting/ReportingModal'
import AddUser from '../AddUser.jsx'
import './dashboard.css'
import { BarChart3 } from 'lucide-react'

/**
 * Dashboard is the main component that displays either the admin or user dashboard
 * based on the user's role
 * @param {Object} props - Component props
 * @param {Object} props.user - Current user object
 */
const Dashboard = ({ user }) => {
  // State for all dashboard data
  const [stats, setStats] = useState(null)
  const [allUsersData, setAllUsersData] = useState(null)
  const [allTimeEntries, setAllTimeEntries] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [dropdownLoading, setDropdownLoading] = useState(false)
  
  // State for modals
  const [showAddUser, setShowAddUser] = useState(false)
  const [showTimeEntryModal, setShowTimeEntryModal] = useState(false)
  const [showReporting, setShowReporting] = useState(false)
  const [modalMode, setModalMode] = useState('add') // 'add' or 'edit'
  const [modalEntry, setModalEntry] = useState(null)
  
  // State for dropdown data
  const [allJobs, setAllJobs] = useState([])
  const [allTasks, setAllTasks] = useState([])
  
  // State for report options
  const [jobOptions, setJobOptions] = useState([])
  const [taskOptions, setTaskOptions] = useState([])
  const [workerOptions, setWorkerOptions] = useState([])
  
  // Timer tracking to prevent console errors
  const timers = React.useRef({})
  
  // Helper methods for timer management
  const startTimer = (name) => {
    const timerName = `${name}_${Date.now()}`
    timers.current[timerName] = Date.now()
    console.log(`🕒 Starting timer: ${name}`)
    return timerName
  }
  
  const endTimer = (timerName) => {
    if (!timerName || !timers.current[timerName]) {
      return
    }
    
    const elapsed = Date.now() - timers.current[timerName]
    console.log(`⏱️ ${timerName.split('_')[0]} completed in ${elapsed}ms`)
    delete timers.current[timerName]
  }

  // Load dashboard data on component mount and when user changes
  useEffect(() => {
    let isMounted = true
    
    const loadData = async () => {
      if (isMounted) {
        try {
          await loadDashboardData()
        } catch (error) {
          if (isMounted) {
            console.error('Error in loadData:', error);
          }
        }
      }
    }
    
    // Fetch dropdown data only for admin users and only once
    async function fetchDropdownData() {
      if (!isMounted || user.role !== 'admin') return
      
      try {
        setDropdownLoading(true)
        
        // Fetch jobs and tasks in parallel for better performance
        const [jobsRes, tasksRes] = await Promise.all([
          timeTrackerAPI.getAllJobAddresses(),
          timeTrackerAPI.getAvailableCSITasks()
        ])
        
        if (isMounted) {
          setAllJobs(jobsRes.data || [])
          setAllTasks(tasksRes.data || [])
        }
      } catch (error) {
        console.error('Error fetching dropdown data:', error)
        if (isMounted) setError('Failed to load dropdown data: ' + error.message)
      } finally {
        if (isMounted) setDropdownLoading(false)
      }
    }
    
    loadData()
    fetchDropdownData()
    
    return () => {
      isMounted = false
      // Clean up any remaining timers when component unmounts
      Object.keys(timers.current).forEach(key => {
        endTimer(key)
      })
    }
  }, [user.id, user.role])

  // Process report options when time entries change
  useEffect(() => {
    // Only process options when we have time entries and user is admin
    // Use a more efficient check to prevent unnecessary re-processing
    if (user.role === 'admin' && allTimeEntries.length > 0) {
      // Only process if we don't have options yet or if the data has significantly changed
      const shouldProcess = jobOptions.length === 0 || taskOptions.length === 0 || workerOptions.length === 0
      
      if (shouldProcess) {
        console.log(`🔄 Processing ${allTimeEntries.length} entries for dropdown options...`)
        const startTime = Date.now()
        
        // Jobs: aggregate from all time entries, but filter out break/travel types
        const EXCLUDE_JOBS = [
          'Break/Lunch', 'Break/Lunch Time', 'Travel', 'Travel Time'
        ]
        const uniqueJobs = Array.from(new Set(
          allTimeEntries
            .map(e => e.job_address)
            .filter(addr => addr && !EXCLUDE_JOBS.includes(addr))
        ))
        setJobOptions(uniqueJobs.map(addr => ({ value: addr, label: addr })))
        
        // Tasks: aggregate from all time entries
        const uniqueTasks = Array.from(new Set(allTimeEntries.map(e => e.csi_division).filter(Boolean)))
        setTaskOptions(uniqueTasks.map(task => ({ value: task, label: task })))
        
        // Workers: aggregate from all time entries
        const workerMap = {}
        allTimeEntries.forEach(e => {
          if (e.user_id && e.user_name) {
            workerMap[e.user_id] = e.user_name
          }
        })
        setWorkerOptions(Object.entries(workerMap).map(([id, name]) => ({ value: id, label: name })))
        
        const processTime = Date.now() - startTime
        console.log(`✅ Processed options in ${processTime}ms: ${uniqueJobs.length} jobs, ${uniqueTasks.length} tasks, ${Object.keys(workerMap).length} workers`)
      }
    }
  }, [user.role, allTimeEntries.length, jobOptions.length, taskOptions.length, workerOptions.length])

  // Load dashboard data based on user role
  const loadDashboardData = async (forceRefresh = false) => {
    let timerName = null
    try {
      timerName = startTimer('loadDashboardData')
      setLoading(true)
      setError('')

      if (user.role === 'admin') {
        // Admin view: Load all time entries and user data in parallel
        const [entriesResult, usersResult] = await Promise.all([
          timeTrackerAPI.getAllTimeEntries(200),
          timeTrackerAPI.getAllUsersData(forceRefresh)
        ])
        
        setAllTimeEntries(entriesResult.data || [])
        setAllUsersData(usersResult)
      } else {
        // Regular user view: Load personal stats
        const userStats = await timeTrackerAPI.getUserStats(user.id)
        setStats(userStats)
      }
      
      endTimer(timerName)
    } catch (err) {
      setError('Failed to load dashboard data')
      console.error('❌ Error loading dashboard:', err)
      if (timerName) {
        endTimer(timerName)
      }
    } finally {
      setLoading(false)
    }
  }

  // Handler for deleting time entries
  const handleDeleteEntry = async (entryUserId, entryId) => {
    if (!confirm('Are you sure you want to delete this time entry?')) return
    
    try {
      await timeTrackerAPI.deleteTimeEntry(entryUserId, entryId)
      setAllTimeEntries(prev => prev.filter(entry => entry.id !== entryId))
    } catch (err) {
      setError('Failed to delete time entry')
      console.error('Error deleting entry:', err)
    }
  }

  // Handler for adding a new user
  const handleUserAdded = (newUser) => {
    // Refresh dashboard data to show the new user
    loadDashboardData()
    setShowAddUser(false)
  }

  // Handler for adding a new time entry
  const handleAddEntry = async () => {
    setModalMode('add')
    setModalEntry(null)
    
    // Force refresh user data before opening modal to ensure we have latest data
    await loadDashboardData(true)
    
    setShowTimeEntryModal(true)
  }

  // Handler for editing a time entry
  const handleEditEntry = async (entry) => {
    setModalMode('edit')
    setModalEntry(entry)
    
    // Force refresh user data before opening modal to ensure we have latest data
    await loadDashboardData(true)
    
    setShowTimeEntryModal(true)
  }

  // Handler for saving a time entry (add or edit)
  const handleSaveTimeEntry = async (entryData) => {
    try {
      if (modalMode === 'add') {
        const res = await timeTrackerAPI.addTimeEntry(entryData.user_id, entryData)
        if (res.error) throw res.error
        setAllTimeEntries(prev => [res.data[0], ...prev])
      } else if (modalMode === 'edit' && modalEntry) {
        const originalUserId = modalEntry.user_id
        const newUserId = entryData.user_id
        
        // Check if user is being changed (admin only)
        if (user.role === 'admin' && originalUserId !== newUserId) {
          // User is being changed - delete old entry and create new one
          console.log(`🔄 Moving entry from user ${originalUserId} to user ${newUserId}`)
          
          // Delete the original entry
          const deleteRes = await timeTrackerAPI.deleteTimeEntry(originalUserId, modalEntry.id)
          if (deleteRes.error) throw deleteRes.error
          
          // Create new entry with the new user
          const createRes = await timeTrackerAPI.addTimeEntry(newUserId, entryData)
          if (createRes.error) throw createRes.error
          
          // Update the local state - remove old entry and add new one
          setAllTimeEntries(prev => {
            const filtered = prev.filter(entry => entry.id !== modalEntry.id)
            return [createRes.data[0], ...filtered]
          })
        } else {
          // Normal edit - same user
          const res = await timeTrackerAPI.editTimeEntry(originalUserId, modalEntry.id, entryData)
          if (res.error) throw res.error
          setAllTimeEntries(prev => prev.map(entry => entry.id === modalEntry.id ? { ...entry, ...entryData, updated_at: new Date().toISOString() } : entry))
        }
      }
      setShowTimeEntryModal(false)
      setModalEntry(null)
    } catch (err) {
      setError('Failed to save time entry: ' + (err.message || err))
      console.error('Error in handleSaveTimeEntry:', err)
    }
  }

  // Handler for running reports
  const handleRunReport = (reportConfig) => {
    try {
      let filtered = allTimeEntries
      
      if (reportConfig.startDate) filtered = filtered.filter(e => new Date(e.date) >= new Date(reportConfig.startDate))
      if (reportConfig.endDate) filtered = filtered.filter(e => new Date(e.date) <= new Date(reportConfig.endDate))
      if (reportConfig.jobs.length > 0) filtered = filtered.filter(e => reportConfig.jobs.includes(e.job_address))
      if (reportConfig.tasks.length > 0) filtered = filtered.filter(e => reportConfig.tasks.includes(e.csi_division))
      if (reportConfig.workers.length > 0) {
        filtered = filtered.filter(e => reportConfig.workers.includes(e.user_id))
      }

      // Use explicit "Select All" flags to determine aggregation
      // Only aggregate if "Select All" was explicitly clicked
      
      // Build grouping key based on explicit "Select All" selections
      const groupBy = []
      if (!reportConfig.selectAllJobs) groupBy.push('job_address')
      if (!reportConfig.selectAllTasks) groupBy.push('csi_division')
      if (!reportConfig.selectAllWorkers) groupBy.push('user_id')
      groupBy.push('date') // Always group by date for clarity

      let results = []
      let headers = ['Date']
      if (!reportConfig.selectAllJobs) headers.push('Job')
      if (!reportConfig.selectAllTasks) headers.push('Task')
      if (!reportConfig.selectAllWorkers) headers.push('Worker')
      headers.push('Hours')

      if (groupBy.length === 1 && groupBy[0] === 'date') {
        // All filters are 'all', aggregate everything
        const totalHours = filtered.reduce((sum, e) => sum + (e.duration / 3600), 0)
        results = [{ id: 1, date: 'All', hours: totalHours.toFixed(2) }]
      } else if (groupBy.length === 4) {
        // All are partial, show detailed (one row per entry)
        results = filtered.map((e, i) => ({
          id: e.id || i,
          date: e.date || new Date(e.created_at).toISOString().split('T')[0],
          job: e.job_address || 'N/A',
          task: e.csi_division || 'N/A',
          worker: e.user_name || 'Unknown',
          hours: (e.duration / 3600).toFixed(2)
        }))
      } else {
        // Group by the selected fields
        const groupMap = {}
        filtered.forEach(e => {
          const keyParts = []
          if (!reportConfig.selectAllJobs) keyParts.push(e.job_address || 'N/A')
          if (!reportConfig.selectAllTasks) keyParts.push(e.csi_division || 'N/A')
          if (!reportConfig.selectAllWorkers) keyParts.push(e.user_name || 'Unknown')
          keyParts.push(e.date || new Date(e.created_at).toISOString().split('T')[0])
          const key = keyParts.join('|')
          if (!groupMap[key]) {
            const row = { date: e.date || new Date(e.created_at).toISOString().split('T')[0] }
            if (!reportConfig.selectAllJobs) row.job = e.job_address || 'N/A'
            if (!reportConfig.selectAllTasks) row.task = e.csi_division || 'N/A'
            if (!reportConfig.selectAllWorkers) row.worker = e.user_name || 'Unknown'
            row.hours = 0
            groupMap[key] = row
          }
          groupMap[key].hours += (e.duration / 3600)
        })
        results = Object.values(groupMap).map((row, i) => ({ ...row, id: i, hours: row.hours.toFixed(2) }))
      }

      if (reportConfig.reportStyle === 'cards') {
        openCardReportTab(filtered, { 
          selectAllJobs: reportConfig.selectAllJobs, 
          selectAllTasks: reportConfig.selectAllTasks, 
          selectAllWorkers: reportConfig.selectAllWorkers 
        })
      } else {
        openTableReportTab(results, headers)
      }
    } catch (error) {
      console.error('Report generation error:', error)
      alert('Error generating report: ' + error.message)
    }
  }

  const openTableReportTab = (data, headers) => {
    const reportData = {
      results: data,
      headers: headers,
      style: 'table'
    }
    
    // Store data in sessionStorage instead of URL parameters
    const reportId = 'report_' + Date.now()
    sessionStorage.setItem(reportId, JSON.stringify(reportData))
    
    const url = `/report?id=${reportId}`
    window.open(url, '_blank')
  }

  const openCardReportTab = (filteredData, groupingFlags) => {
    // Group data by Date → Worker → Job → Tasks
    const groupedData = {}
    
    filteredData.forEach(entry => {
      const date = entry.date || new Date(entry.created_at).toISOString().split('T')[0]
      const worker = entry.user_name || 'Unknown'
      const job = entry.job_address || 'N/A'
      const task = entry.csi_division || 'N/A'
      const hours = entry.duration / 3600

      if (!groupedData[date]) groupedData[date] = {}
      if (!groupedData[date][worker]) groupedData[date][worker] = {}
      if (!groupedData[date][worker][job]) groupedData[date][worker][job] = {}
      if (!groupedData[date][worker][job][task]) groupedData[date][worker][job][task] = 0
      
      groupedData[date][worker][job][task] += hours
    })

    const reportData = {
      groupedData: groupedData,
      style: 'cards'
    }
    
    // Store data in sessionStorage instead of URL parameters
    const reportId = 'report_' + Date.now()
    sessionStorage.setItem(reportId, JSON.stringify(reportData))
    
    const url = `/report?id=${reportId}`
    window.open(url, '_blank')
  }

  // Show loading state if data is still loading
  if (loading) {
    return (
      <LoadingState 
        message="Loading Dashboard..."
        submessage={user.role === 'admin' 
          ? 'Fetching all users and time entries data...' 
          : `Loading ${user.username}'s personal dashboard...`
        }
        steps={[
          '📊 Gathering statistics',
          '👥 Processing user data',
          '⏱️ Optimizing performance'
        ]}
      />
    )
  }

  // Show error state if there was an error
  if (error) {
    return (
      <ErrorState 
        message={error}
        onRetry={() => loadDashboardData(true)}
      />
    )
  }

  // Render dashboards and modals
  return (
    <>
      {/* Admin Dashboard */}
      {user.role === 'admin' && (
        <AdminDashboard
          user={user}
          allUsersData={allUsersData}
          allTimeEntries={allTimeEntries}
          onShowAddUser={() => setShowAddUser(true)}
          onEditEntry={handleEditEntry}
          onDeleteEntry={handleDeleteEntry}
          onAddEntry={handleAddEntry}
          onShowReporting={() => setShowReporting(true)}
        />
      )}
      
      {/* Regular User Dashboard */}
      {user.role !== 'admin' && (
        <UserDashboard
          user={user}
          stats={stats}
          timeEntries={allTimeEntries}
          onEditEntry={handleEditEntry}
          onDeleteEntry={handleDeleteEntry}
        />
      )}
      
      {/* Modals */}
      {showAddUser && (
        <AddUser 
          onClose={() => setShowAddUser(false)}
          onUserAdded={handleUserAdded}
        />
      )}
      
      {showTimeEntryModal && (
        <TimeEntryModal
          isOpen={showTimeEntryModal}
          onClose={() => setShowTimeEntryModal(false)}
          onSave={handleSaveTimeEntry}
          entry={modalEntry}
          mode={modalMode}
          currentUser={user}
          jobs={allJobs.map(addr => ({ address: addr }))}
          tasks={allTasks}
          users={allUsersData ? Object.values(allUsersData).map(data => data.user) : []}
        />
      )}
      
      {/* Reporting Modal */}
      {showReporting && (
        <ReportingModal
          isOpen={showReporting}
          onClose={() => setShowReporting(false)}
          allTimeEntries={allTimeEntries}
          onRunReport={handleRunReport}
          jobOptions={jobOptions}
          taskOptions={taskOptions}
          workerOptions={workerOptions}
        />
      )}
    </>
  )
}

export default Dashboard 