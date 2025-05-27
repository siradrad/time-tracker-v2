import React, { useState, useEffect } from 'react'
import { timeTrackerAPI } from '../../lib/supabase-real.js'
import AdminDashboard from './AdminDashboard/AdminDashboard'
import UserDashboard from './UserDashboard/UserDashboard'
import LoadingState from './Shared/LoadingState'
import ErrorState from './Shared/ErrorState'
import TimeEntryModal from '../TimeEntryModal.jsx'
import AddUser from '../AddUser.jsx'

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
  const [modalMode, setModalMode] = useState('add') // 'add' or 'edit'
  const [modalEntry, setModalEntry] = useState(null)
  
  // State for dropdown data
  const [allJobs, setAllJobs] = useState([])
  const [allTasks, setAllTasks] = useState([])

  // Load dashboard data on component mount and when user changes
  useEffect(() => {
    let isMounted = true
    
    const loadData = async () => {
      if (isMounted) {
        await loadDashboardData()
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
    }
  }, [user.id, user.role])

  // Load dashboard data based on user role
  const loadDashboardData = async (forceRefresh = false) => {
    let timerName = null
    try {
      timerName = `Dashboard loadDashboardData execution ${Date.now()}`
      console.time(timerName)
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
      
      console.timeEnd(timerName)
    } catch (err) {
      setError('Failed to load dashboard data')
      console.error('❌ Error loading dashboard:', err)
      // End the timer if it was started
      if (timerName) {
        console.timeEnd(timerName)
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
          allJobs={allJobs}
          allTasks={allTasks}
          allUsersData={allUsersData}
        />
      )}
    </>
  )
}

export default Dashboard 