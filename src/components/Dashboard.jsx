import React, { useState, useEffect } from 'react'
import { timeTrackerAPI } from '../lib/supabase-real.js'
import { formatDateSimple } from '../lib/dateUtils.js'
import AddUser from './AddUser.jsx'
import TimeEntryModal from './TimeEntryModal.jsx'
import { BarChart3, Clock, MapPin, List, Calendar, Briefcase, Users, Edit, Trash2, Plus, User, ChevronDown, ChevronRight, UserPlus } from 'lucide-react'

function Dashboard({ user }) {
  const [stats, setStats] = useState(null)
  const [allUsersData, setAllUsersData] = useState(null)
  const [allTimeEntries, setAllTimeEntries] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editingEntry, setEditingEntry] = useState(null)
  const [showAddUser, setShowAddUser] = useState(false)
  const [showReporting, setShowReporting] = useState(false)
  const [expandedSections, setExpandedSections] = useState({
    years: {},
    months: {},
    biweeks: {}
  })
  const [reportStartDate, setReportStartDate] = useState('')
  const [reportEndDate, setReportEndDate] = useState('')
  const [reportJob, setReportJob] = useState('')
  const [reportTask, setReportTask] = useState('')
  const [reportWorker, setReportWorker] = useState('')
  const [reportResults, setReportResults] = useState([])
  const [reportHeaders, setReportHeaders] = useState([])
  const [reportLoading, setReportLoading] = useState(false)
  const [jobOptions, setJobOptions] = useState([])
  const [taskOptions, setTaskOptions] = useState([])
  const [workerOptions, setWorkerOptions] = useState([])
  const [selectedJobs, setSelectedJobs] = useState([])
  const [selectedTasks, setSelectedTasks] = useState([])
  const [selectedWorkers, setSelectedWorkers] = useState([])
  const [selectAllJobs, setSelectAllJobs] = useState(false)
  const [selectAllTasks, setSelectAllTasks] = useState(false)
  const [selectAllWorkers, setSelectAllWorkers] = useState(false)
  const [reportStyle, setReportStyle] = useState('cards') // 'table' or 'cards'
  const [showTimeEntryModal, setShowTimeEntryModal] = useState(false)
  const [modalMode, setModalMode] = useState('add') // 'add' or 'edit'
  const [modalEntry, setModalEntry] = useState(null)
  const [allJobs, setAllJobs] = useState([])
  const [allTasks, setAllTasks] = useState([])
  const [dropdownLoading, setDropdownLoading] = useState(false)

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
        const startTime = Date.now()
        
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

  const handleUserAdded = (newUser) => {
    // Refresh dashboard data to show the new user
    loadDashboardData()
    setShowAddUser(false)
  }

  const handleAddEntry = async () => {
    setModalMode('add')
    setModalEntry(null)
    
    // Force refresh user data before opening modal to ensure we have latest data
    await loadDashboardData(true)
    
    setShowTimeEntryModal(true)
  }

  const handleEditEntry = async (entry) => {
    setModalMode('edit')
    setModalEntry(entry)
    
    // Force refresh user data before opening modal to ensure we have latest data
    await loadDashboardData(true)
    
    setShowTimeEntryModal(true)
  }

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

  // Helper functions for grouping entries
  const getBiweeklyPeriod = (date) => {
    const day = date.getDate()
    return day <= 15 ? 'first-half' : 'second-half'
  }

  const getBiweeklyLabel = (period) => {
    return period === 'first-half' ? '1st - 15th' : '16th - End'
  }

  const groupEntriesByHierarchy = (entries) => {
    const grouped = {}
    
    // Optimized grouping with reduced object property access
    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i]
      const date = new Date(entry.date || entry.created_at)
      const year = date.getFullYear()
      const month = date.getMonth()
      const biweek = getBiweeklyPeriod(date)
      
      // Use nested object creation with default values for better performance
      if (!grouped[year]) grouped[year] = {}
      if (!grouped[year][month]) grouped[year][month] = {}
      if (!grouped[year][month][biweek]) grouped[year][month][biweek] = []
      
      grouped[year][month][biweek].push(entry)
    }
    
    return grouped
  }

  const getMonthName = (monthIndex) => {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ]
    return months[monthIndex]
  }



  const calculateGroupStats = (entries) => {
    if (!entries || entries.length === 0) {
      return { totalEntries: 0, totalHours: 0, uniqueUsers: 0 }
    }
    
    const totalEntries = entries.length
    let totalSeconds = 0
    const userIds = new Set()
    
    // Single pass through entries for better performance
    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i]
      totalSeconds += entry.duration || 0
      if (entry.user_id) {
        userIds.add(entry.user_id)
      }
    }
    
    const totalHours = totalSeconds / 3600
    const uniqueUsers = userIds.size
    
    return { totalEntries, totalHours, uniqueUsers }
  }

  const toggleSection = (type, key) => {
    setExpandedSections(prev => ({
      ...prev,
      [type]: {
        ...prev[type],
        [key]: !prev[type][key]
      }
    }))
  }

  const formatHours = (hours) => {
    if (isNaN(hours) || !isFinite(hours)) return "0.00";
    return hours.toFixed(2);
  }

  const formatDuration = (seconds) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    return `${hours}h ${minutes}m`
  }

  const formatDivisionTime = (seconds) => {
    const hours = (seconds / 3600).toFixed(1)
    return `${hours}h`
  }

  const getTopDivisions = (divisionBreakdown) => {
    return Object.entries(divisionBreakdown)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
  }

  const handleRunReport = () => {
    setReportLoading(true)
    setTimeout(() => {
      try {
      let filtered = allTimeEntries
      
      if (reportStartDate) filtered = filtered.filter(e => new Date(e.date) >= new Date(reportStartDate))
      if (reportEndDate) filtered = filtered.filter(e => new Date(e.date) <= new Date(reportEndDate))
      if (selectedJobs.length > 0) filtered = filtered.filter(e => selectedJobs.includes(e.job_address))
      if (selectedTasks.length > 0) filtered = filtered.filter(e => selectedTasks.includes(e.csi_division))
      if (selectedWorkers.length > 0) {
        filtered = filtered.filter(e => selectedWorkers.includes(e.user_id))
      }

      // Use explicit "Select All" flags to determine aggregation
      // Only aggregate if "Select All" was explicitly clicked
      
      // Build grouping key based on explicit "Select All" selections
      const groupBy = []
      if (!selectAllJobs) groupBy.push('job_address')
      if (!selectAllTasks) groupBy.push('csi_division')
      if (!selectAllWorkers) groupBy.push('user_id')
      groupBy.push('date') // Always group by date for clarity

              let results = []
        let headers = ['Date']
        if (!selectAllJobs) headers.push('Job')
        if (!selectAllTasks) headers.push('Task')
        if (!selectAllWorkers) headers.push('Worker')
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
          if (!selectAllJobs) keyParts.push(e.job_address || 'N/A')
          if (!selectAllTasks) keyParts.push(e.csi_division || 'N/A')
          if (!selectAllWorkers) keyParts.push(e.user_name || 'Unknown')
          keyParts.push(e.date || new Date(e.created_at).toISOString().split('T')[0])
          const key = keyParts.join('|')
          if (!groupMap[key]) {
            const row = { date: e.date || new Date(e.created_at).toISOString().split('T')[0] }
            if (!selectAllJobs) row.job = e.job_address || 'N/A'
            if (!selectAllTasks) row.task = e.csi_division || 'N/A'
            if (!selectAllWorkers) row.worker = e.user_name || 'Unknown'
            row.hours = 0
            groupMap[key] = row
          }
          groupMap[key].hours += (e.duration / 3600)
        })
        results = Object.values(groupMap).map((row, i) => ({ ...row, id: i, hours: row.hours.toFixed(2) }))
      }
        setReportResults(results)
        setReportHeaders(headers) // Update state variable
        setReportLoading(false)
        
        if (reportStyle === 'cards') {
          openCardReportTab(filtered, { selectAllJobs, selectAllTasks, selectAllWorkers })
        } else {
          openTableReportTab(results, headers)
        }
      } catch (error) {
        console.error('Report generation error:', error)
        setReportLoading(false)
        alert('Error generating report: ' + error.message)
      }
    }, 500)
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

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-content">
          <div className="spinner"></div>
          <div className="loading-text">
            <h3>Loading Dashboard...</h3>
            <p>
              {user.role === 'admin' 
                ? 'Fetching all users and time entries data...' 
                : `Loading ${user.username}'s personal dashboard...`}
            </p>
            <div className="loading-steps">
              <div className="loading-step">📊 Gathering statistics</div>
              <div className="loading-step">👥 Processing user data</div>
              <div className="loading-step">⏱️ Optimizing performance</div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="error-container">
        <p className="error-message">{error}</p>
        <button onClick={loadDashboardData} className="btn btn-primary">
          Try Again
        </button>
      </div>
    )
  }

  // Admin Dashboard View
  if (user.role === 'admin') {
    const groupedEntries = groupEntriesByHierarchy(allTimeEntries)
    const years = Object.keys(groupedEntries).sort((a, b) => b - a) // Most recent first

    return (
      <div className="dashboard-container">
        <div className="dashboard-header">
          <div className="dashboard-title-section">
            <h2 className="dashboard-title">
              <Users />
              Admin Dashboard
            </h2>
            <p className="dashboard-subtitle">
              Manage all users and time entries
            </p>
          </div>
          <div className="dashboard-actions">
            <button 
              onClick={() => loadDashboardData(true)}
              className="btn btn-outline"
              disabled={loading}
              title="Refresh dashboard data"
            >
              <BarChart3 size={16} />
              {loading ? 'Loading...' : 'Refresh'}
            </button>

            <button 
              onClick={() => setShowAddUser(true)}
              className="btn btn-primary"
              style={{ marginLeft: '0.5rem' }}
            >
              <UserPlus size={16} />
              Add New User
            </button>
            <button
              onClick={() => setShowReporting(true)}
              className="btn btn-secondary"
              style={{ marginLeft: '0.5rem' }}
            >
              <BarChart3 size={16} />
              Reporting
            </button>
            <button
              onClick={handleAddEntry}
              className="btn btn-primary"
              style={{ marginLeft: '0.5rem' }}
            >
              <Plus size={16} />
              Add Time Entry
            </button>
          </div>
        </div>

        {/* Reporting Modal */}
        {showReporting && (
          <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
            <div className="modal card-modern slide-in" style={{ background: '#fff', borderRadius: 16, padding: 40, minWidth: 520, boxShadow: '0 2px 16px rgba(0,0,0,0.15)' }}>
              <style>{`
                .card-modern { background: #fff; border-radius: 16px; box-shadow: 0 8px 32px rgba(0,0,0,0.1); }
                .btn-enhanced { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border: none; border-radius: 12px; padding: 14px 32px; color: white; font-weight: 600; font-size: 1.1rem; cursor: pointer; transition: all 0.3s cubic-bezier(0.4,0,0.2,1); box-shadow: 0 4px 14px rgba(102,126,234,0.3), 0 2px 4px rgba(0,0,0,0.1); }
                .btn-enhanced:hover { transform: translateY(-2px); box-shadow: 0 8px 25px rgba(102,126,234,0.4), 0 4px 8px rgba(0,0,0,0.15); }
                .form-input-enhanced { width: 100%; padding: 14px 16px; border: 2px solid #e2e8f0; border-radius: 12px; font-size: 1.05rem; transition: all 0.3s ease; background: rgba(255,255,255,0.8); margin-bottom: 0.5rem; }
                .form-input-enhanced:focus { outline: none; border-color: #667eea; background: #fff; box-shadow: 0 0 0 3px rgba(102,126,234,0.1), 0 2px 8px rgba(0,0,0,0.05); transform: translateY(-1px); }
                .multi-select-group {
                  display: flex;
                  flex-direction: column;
                  gap: 0.5rem;
                  background: #f8fafc;
                  border-radius: 8px;
                  padding: 0.5rem 0.75rem;
                  border: 1px solid #e5e7eb;
                  max-height: 180px;
                  overflow-y: auto;
                  font-size: 15px;
                }
                .scroll-box {
                  min-height: 40px;
                  max-height: 180px;
                  overflow-y: auto;
                }
              `}</style>
              <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 12, fontSize: 28 }}><BarChart3 size={28} /> Reporting</h3>
                <button onClick={() => setShowReporting(false)} className="btn btn-outline" style={{ fontSize: 22, lineHeight: 1, borderRadius: 12 }}>&times;</button>
              </div>
              <div className="modal-content">
                <div style={{ marginBottom: 16, color: '#64748b', fontSize: 15, fontStyle: 'italic' }}>
                  Only jobs, tasks, and workers with at least one time record are available for selection.
                </div>
                <div style={{ marginBottom: 24 }}>
                  <label style={{ fontWeight: 600, fontSize: 16, marginBottom: 8, display: 'block' }}>Report Style</label>
                  <select 
                    className="form-input-enhanced" 
                    value={reportStyle} 
                    onChange={e => setReportStyle(e.target.value)}
                    style={{ width: 200 }}
                  >
                    <option value="cards">📋 Cards (Grouped)</option>
                    <option value="table">📊 Table (Flat)</option>
                  </select>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32, marginBottom: 32 }}>
                  <div>
                    <label style={{ fontWeight: 600, fontSize: 16 }}>Date Start</label><br />
                    <input type="date" className="form-input-enhanced" style={{ fontSize: 16, minWidth: 160 }} value={reportStartDate} onChange={e => setReportStartDate(e.target.value)} />
                  </div>
                  <div>
                    <label style={{ fontWeight: 600, fontSize: 16 }}>Date End</label><br />
                    <input type="date" className="form-input-enhanced" style={{ fontSize: 16, minWidth: 160 }} value={reportEndDate} onChange={e => setReportEndDate(e.target.value)} />
                  </div>
                  <div style={{ gridColumn: '1 / span 2', marginTop: 16 }}>
                    <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
                      <div style={{ flex: 1, minWidth: 180 }}>
                        <div style={{ fontWeight: 700, marginBottom: 4 }}>Job</div>
                        <div className="multi-select-group scroll-box">
                          <label style={{ fontWeight: 500 }}>
                            <input type="checkbox" checked={selectAllJobs} onChange={e => {
                              setSelectAllJobs(e.target.checked)
                              setSelectedJobs(e.target.checked ? jobOptions.map(o => o.value) : [])
                            }} /> Select All
                          </label>
                          {jobOptions.map(opt => (
                            <label key={opt.value}>
                              <input type="checkbox" value={opt.value} checked={selectedJobs.includes(opt.value)} onChange={e => {
                                if (e.target.checked) {
                                  setSelectedJobs(prev => [...prev, opt.value])
                                } else {
                                  setSelectedJobs(prev => prev.filter(v => v !== opt.value))
                                  setSelectAllJobs(false) // Uncheck "Select All" if individual item is deselected
                                }
                              }} />
                              {opt.label}
                            </label>
                          ))}
                        </div>
                      </div>
                      <div style={{ flex: 1, minWidth: 180 }}>
                        <div style={{ fontWeight: 700, marginBottom: 4 }}>Task</div>
                        <div className="multi-select-group scroll-box">
                          <label style={{ fontWeight: 500 }}>
                            <input type="checkbox" checked={selectAllTasks} onChange={e => {
                              setSelectAllTasks(e.target.checked)
                              setSelectedTasks(e.target.checked ? taskOptions.map(o => o.value) : [])
                            }} /> Select All
                          </label>
                          {taskOptions.map(opt => (
                            <label key={opt.value}>
                              <input type="checkbox" value={opt.value} checked={selectedTasks.includes(opt.value)} onChange={e => {
                                if (e.target.checked) {
                                  setSelectedTasks(prev => [...prev, opt.value])
                                } else {
                                  setSelectedTasks(prev => prev.filter(v => v !== opt.value))
                                  setSelectAllTasks(false) // Uncheck "Select All" if individual item is deselected
                                }
                              }} />
                              {opt.label}
                            </label>
                          ))}
                        </div>
                      </div>
                      <div style={{ flex: 1, minWidth: 180 }}>
                        <div style={{ fontWeight: 700, marginBottom: 4 }}>Worker</div>
                        <div className="multi-select-group scroll-box">
                          <label style={{ fontWeight: 500 }}>
                            <input type="checkbox" checked={selectAllWorkers} onChange={e => {
                              setSelectAllWorkers(e.target.checked)
                              setSelectedWorkers(e.target.checked ? workerOptions.map(o => o.value) : [])
                            }} /> Select All
                          </label>
                          {workerOptions.map(opt => (
                            <label key={opt.value}>
                              <input type="checkbox" value={opt.value} checked={selectedWorkers.includes(opt.value)} onChange={e => {
                                if (e.target.checked) {
                                  setSelectedWorkers(prev => [...prev, opt.value])
                                } else {
                                  setSelectedWorkers(prev => prev.filter(v => v !== opt.value))
                                  setSelectAllWorkers(false) // Uncheck "Select All" if individual item is deselected
                                }
                              }} />
                              {opt.label}
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <button className="btn-enhanced" onClick={handleRunReport} disabled={reportLoading} style={{ marginBottom: 24, fontSize: 18, padding: '14px 32px' }}>
                  {reportLoading ? 'Loading...' : 'Run Report'}
                </button>
                <div>
                  {reportResults.length > 0 ? (
                    <div className="card-modern" style={{ marginTop: 24, padding: 24 }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 17 }}>
                        <thead>
                          <tr>
                            {reportHeaders.map(header => (
                              <th key={header}>{header}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {reportResults.map(row => (
                            <tr key={row.id}>
                              {reportHeaders.map(header => (
                                <td key={header}>{row[header]}</td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p style={{ marginTop: 18, fontSize: 16 }}>No results yet. Run a report above.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Admin Stats Overview */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">
              <Users />
            </div>
            <div className="stat-content">
              <div className="stat-value">{Object.keys(allUsersData || {}).length}</div>
              <div className="stat-label">Total Users</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">
              <List />
            </div>
            <div className="stat-content">
              <div className="stat-value">{allTimeEntries.length}</div>
              <div className="stat-label">Total Entries</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">
              <Clock />
            </div>
            <div className="stat-content">
              <div className="stat-value">
                {formatHours(allTimeEntries.reduce((sum, entry) => sum + (entry.duration / 3600), 0))}
              </div>
              <div className="stat-label">Total Hours</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">
              <Calendar />
            </div>
            <div className="stat-content">
              <div className="stat-value">
                {allTimeEntries.length > 0 ? new Date(allTimeEntries[0].created_at).toLocaleDateString() : 'Never'}
              </div>
              <div className="stat-label">Latest Entry</div>
            </div>
          </div>
        </div>

        {/* Hierarchical Time Entries */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">
              <List />
              All Time Entries
            </h3>
          </div>
          <div className="card-content">
            {allTimeEntries.length === 0 ? (
              <div className="empty-state">
                <List size={48} className="empty-icon" />
                <h3>No time entries found</h3>
                <p>No users have created any time entries yet.</p>
              </div>
            ) : (
              <div className="hierarchical-entries">
                {years.map(year => {
                  // Properly flatten year entries: go through months, then biweeks, then entries
                  const yearEntries = Object.values(groupedEntries[year])
                    .map(month => Object.values(month))
                    .flat(2)
                  const yearStats = calculateGroupStats(yearEntries)
                  const yearKey = `year-${year}`
                  const isYearExpanded = expandedSections.years[yearKey]

                  return (
                    <div key={year} className="year-section">
                      <div 
                        className="year-header section-header"
                        onClick={() => toggleSection('years', yearKey)}
                      >
                        <div className="section-toggle">
                          {isYearExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                        </div>
                        <div className="section-title">
                          <h3>{year}</h3>
                          <div className="section-stats">
                            <span>{yearStats.totalEntries} entries</span>
                            <span>{formatHours(yearStats.totalHours)}h</span>
                            <span>{yearStats.uniqueUsers} users</span>
                          </div>
                        </div>
                      </div>

                      {isYearExpanded && (
                        <div className="year-content">
                          {Object.keys(groupedEntries[year])
                            .sort((a, b) => b - a) // Most recent month first
                            .map(month => {
                              const monthEntries = Object.values(groupedEntries[year][month]).flat()
                              const monthStats = calculateGroupStats(monthEntries)
                              const monthKey = `month-${year}-${month}`
                              const isMonthExpanded = expandedSections.months[monthKey]

                              return (
                                <div key={month} className="month-section">
                                  <div 
                                    className="month-header section-header"
                                    onClick={() => toggleSection('months', monthKey)}
                                  >
                                    <div className="section-toggle">
                                      {isMonthExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                                    </div>
                                    <div className="section-title">
                                      <h4>{getMonthName(parseInt(month))}</h4>
                                      <div className="section-stats">
                                        <span>{monthStats.totalEntries} entries</span>
                                        <span>{formatHours(monthStats.totalHours)}h</span>
                                        <span>{monthStats.uniqueUsers} users</span>
                                      </div>
                                    </div>
                                  </div>

                                  {isMonthExpanded && (
                                    <div className="month-content">
                                      {Object.keys(groupedEntries[year][month])
                                        .sort((a, b) => a === 'first-half' ? -1 : 1) // First half before second half
                                        .map(biweek => {
                                          const biweekEntries = groupedEntries[year][month][biweek]
                                          const biweekStats = calculateGroupStats(biweekEntries)
                                          const biweekKey = `biweek-${year}-${month}-${biweek}`
                                          const isBiweekExpanded = expandedSections.biweeks[biweekKey]

                                          return (
                                            <div key={biweek} className="biweek-section">
                                              <div 
                                                className="biweek-header section-header"
                                                onClick={() => toggleSection('biweeks', biweekKey)}
                                              >
                                                <div className="section-toggle">
                                                  {isBiweekExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                                                </div>
                                                <div className="section-title">
                                                  <h5>{getBiweeklyLabel(biweek)}</h5>
                                                  <div className="section-stats">
                                                    <span>{biweekStats.totalEntries} entries</span>
                                                    <span>{formatHours(biweekStats.totalHours)}h</span>
                                                    <span>{biweekStats.uniqueUsers} users</span>
                                                  </div>
                                                </div>
                                              </div>

                                              {isBiweekExpanded && (
                                                <div className="biweek-content">
                                                  <div className="entries-table">
                                                    {biweekEntries
                                                      .sort((a, b) => {
                                                        // Sort by date first, then by start time for chronological order
                                                        const dateA = new Date(a.date || a.created_at);
                                                        const dateB = new Date(b.date || b.created_at);
                                                        if (dateA.getTime() !== dateB.getTime()) {
                                                          return dateB.getTime() - dateA.getTime(); // Most recent date first
                                                        }
                                                        // If same date, sort by start time (most recent first)
                                                        const timeA = new Date(a.start_time);
                                                        const timeB = new Date(b.start_time);
                                                        return timeB.getTime() - timeA.getTime();
                                                      })
                                                      .map((entry) => (
                                                      <div key={entry.id} className={`entry-row ${entry.manual ? 'manual-entry' : ''}`}>
                                                        <div className="entry-user">
                                                          <User size={16} />
                                                          <div>
                                                            <div className="user-name">{entry.user_name}</div>
                                                            <div className="user-email">{entry.user_email}</div>
                                                          </div>
                                                        </div>
                                                        
                                                        <div className="entry-details">
                                                          <div className="entry-date">
                                                            {formatDateSimple(entry.date)}
                                                          </div>
                                                          <div className="entry-time-range">
                                                            {new Date(entry.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })} - {new Date(entry.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}
                                                          </div>
                                                          <div className="entry-duration">
                                                            {formatDuration(entry.duration)}
                                                          </div>
                                                        </div>

                                                        <div className="entry-info">
                                                          <div className="entry-address">
                                                            <MapPin size={14} />
                                                            {entry.job_address}
                                                          </div>
                                                          <div className="entry-task">
                                                            <Briefcase size={14} />
                                                            {entry.csi_division}
                                                          </div>
                                                          {entry.notes && (
                                                            <div className="entry-notes">
                                                              {entry.notes}
                                                            </div>
                                                          )}
                                                        </div>

                                                        <div className="entry-actions">
                                                          <button 
                                                            onClick={() => handleEditEntry(entry)}
                                                            className="btn btn-secondary btn-sm"
                                                            title="Edit entry"
                                                          >
                                                            <Edit size={14} />
                                                          </button>
                                                          <button 
                                                            onClick={() => handleDeleteEntry(entry.user_id, entry.id)}
                                                            className="btn btn-danger btn-sm"
                                                            title="Delete entry"
                                                          >
                                                            <Trash2 size={14} />
                                                          </button>
                                                          {entry.manual && (
                                                            <span className="manual-badge" style={{ color: '#b91c1c', background: '#fee2e2', borderRadius: 6, padding: '2px 8px', fontSize: 12, marginLeft: 8, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                                              <Edit size={14} style={{ marginRight: 2 }} /> Manual
                                                            </span>
                                                          )}
                                                        </div>
                                                      </div>
                                                    ))}
                                                  </div>
                                                </div>
                                              )}
                                            </div>
                                          )
                                        })}
                                    </div>
                                  )}
                                </div>
                              )
                            })}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Users Overview */}
        {allUsersData && (
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">
                <Users />
                Users Overview
              </h3>
            </div>
            <div className="card-content">
              <div className="users-grid">
                {Object.entries(allUsersData).map(([userKey, userData]) => (
                  <div key={userKey} className="user-card">
                    <div className="user-header">
                      <div className="user-info">
                        <div className="user-name">{userData.user.name}</div>
                        <div className="user-email">{userData.user.username}</div>
                        <div className="user-role">
                          {userData.user.role === 'admin' ? '👑' : '👤'} {userData.user.role}
                        </div>
                      </div>
                    </div>
                    <div className="user-stats">
                      <div className="user-stat">
                        <Clock size={14} />
                        <span>{formatHours(userData.stats.totalHours)}h</span>
                      </div>
                      <div className="user-stat">
                        <List size={14} />
                        <span>{userData.stats.totalEntries} entries</span>
                      </div>
                      <div className="user-stat">
                        <MapPin size={14} />
                        <span>{userData.stats.totalAddresses} addresses</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Add User Modal */}
        {showAddUser && (
          <AddUser 
            onUserAdded={handleUserAdded}
            onClose={() => setShowAddUser(false)}
          />
        )}

        {/* Render TimeEntryModal */}
        {showTimeEntryModal && (() => {
          // Extract users from allUsersData structure: { username: { user: {...}, stats: {...} } }
          let usersArr = []
          if (allUsersData && typeof allUsersData === 'object') {
            usersArr = Object.values(allUsersData).map(userData => userData.user).filter(Boolean)
          }
          
          // Fallback: ensure current admin user is always available
          if (!usersArr.length || !usersArr.some(u => u.id === user.id)) {
            const currentUserObj = {
              id: user.id,
              name: user.name || user.username || 'Admin',
              username: user.username || user.email,
              role: user.role
            }
            usersArr = usersArr.length > 0 ? [...usersArr, currentUserObj] : [currentUserObj]
          }
          
          // Use allJobs and allTasks directly
          const jobsArr = allJobs.map(address => ({ address, id: address }))
          const tasksArr = allTasks

          return (
            <TimeEntryModal
              isOpen={showTimeEntryModal}
              onClose={() => { setShowTimeEntryModal(false); setModalEntry(null); }}
              onSave={handleSaveTimeEntry}
              entry={modalEntry}
              users={usersArr}
              jobs={jobsArr}
              tasks={tasksArr}
              mode={modalMode}
              currentUser={user}
            />
          )
        })()}
      </div>
    )
  }

  // Regular User Dashboard View
  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <div className="dashboard-title-section">
          <h2 className="dashboard-title">
            <BarChart3 />
            Dashboard
          </h2>
          <p className="dashboard-subtitle">
            Overview of your time tracking activity
          </p>
        </div>
        <div className="dashboard-actions">
          <button 
            onClick={loadDashboardData}
            className="btn btn-outline"
            disabled={loading}
            title="Refresh dashboard data"
          >
            <BarChart3 size={16} />
            {loading ? 'Loading...' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* User Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">
            <Clock />
          </div>
          <div className="stat-content">
            <div className="stat-value">{formatHours(stats.totalHours)}</div>
            <div className="stat-label">Total Hours</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <List />
          </div>
          <div className="stat-content">
            <div className="stat-value">{stats.totalEntries}</div>
            <div className="stat-label">Time Entries</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <MapPin />
          </div>
          <div className="stat-content">
            <div className="stat-value">{stats.totalAddresses}</div>
            <div className="stat-label">Job Addresses</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <Calendar />
          </div>
          <div className="stat-content">
            <div className="stat-value">
              {stats.lastEntry ? new Date(stats.lastEntry).toLocaleDateString() : 'Never'}
            </div>
            <div className="stat-label">Last Entry</div>
          </div>
        </div>
      </div>

      {/* Division Breakdown */}
      {Object.keys(stats.divisionBreakdown).length > 0 && (
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">
              <Briefcase />
              Top CSI Divisions
            </h3>
          </div>
          <div className="card-content">
            <div className="divisions-list">
              {getTopDivisions(stats.divisionBreakdown).map(([division, seconds]) => (
                <div key={division} className="division-item">
                  <div className="division-info">
                    <div className="division-name">{division}</div>
                    <div className="division-time">{formatDivisionTime(seconds)}</div>
                  </div>
                  <div className="division-bar">
                    <div 
                      className="division-progress"
                      style={{ 
                        width: `${(seconds / Math.max(...Object.values(stats.divisionBreakdown))) * 100}%` 
                      }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Dashboard

// CSS Styles
const styles = `
.dashboard-container {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  gap: 1rem;
}

.dashboard-title-section {
  flex: 1;
}

.dashboard-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0 0 0.5rem 0;
  font-size: 2rem;
  font-weight: 600;
  color: var(--color-text-primary, #111827);
}

.dashboard-subtitle {
  margin: 0;
  color: var(--color-text-secondary, #374151);
  font-size: 1rem;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
}

.stat-card {
  background: var(--color-surface, #ffffff);
  border-radius: var(--border-radius-lg, 8px);
  padding: 1.5rem;
  border: 1px solid var(--color-border, #e5e7eb);
  display: flex;
  align-items: center;
  gap: 1rem;
  transition: all 0.2s ease;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md, 0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -2px rgba(0,0,0,0.1));
}

.stat-icon {
  background-color: var(--color-accent-soft, #eff6ff);
  color: var(--color-accent, #3b82f6);
  padding: 1rem;
  border-radius: var(--border-radius-md, 6px);
  display: flex;
  align-items: center;
  justify-content: center;
}

.stat-content {
  flex: 1;
}

.stat-value {
  font-size: 2rem;
  font-weight: 700;
  color: var(--color-text-primary, #111827);
  line-height: 1;
}

.stat-label {
  font-size: 0.875rem;
  color: var(--color-text-secondary, #374151);
  margin-top: var(--spacing-unit, 0.25rem);
}

/* Hierarchical Entries Styles */
.hierarchical-entries {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.section-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem;
  background: var(--color-surface, #ffffff);
  border: 1px solid var(--color-border, #e5e7eb);
  border-radius: var(--border-radius-md, 6px);
  cursor: pointer;
  transition: all 0.2s ease;
  user-select: none;
}

.section-header:hover {
  background: var(--color-background-alt, #f9fafb);
  border-color: var(--color-border-hover, #d1d5db);
}

.section-toggle {
  color: var(--color-text-secondary, #374151);
  transition: color 0.2s ease;
}

.section-header:hover .section-toggle {
  color: var(--color-accent, #3b82f6);
}

.section-title {
  flex: 1;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.section-title h3, .section-title h4, .section-title h5 {
  margin: 0;
  font-weight: 600;
  color: var(--color-text-primary, #111827);
}

.section-title h3 {
  font-size: 1.5rem;
}

.section-title h4 {
  font-size: 1.25rem;
}

.section-title h5 {
  font-size: 1.125rem;
}

.section-stats {
  display: flex;
  gap: 1rem;
  font-size: 0.875rem;
  color: var(--color-text-secondary, #374151);
}

.section-stats span {
  padding: 0.25rem 0.5rem;
  background: var(--color-accent-soft, #eff6ff);
  color: var(--color-accent, #3b82f6);
  border-radius: var(--border-radius-sm, 4px);
  font-weight: 500;
}

/* Year Section */
.year-section {
  border: 2px solid var(--color-border, #e5e7eb);
  border-radius: var(--border-radius-lg, 8px);
  overflow: hidden;
}

.year-header {
  background: var(--color-accent-soft, #eff6ff);
  border: none;
  border-radius: 0;
}

.year-content {
  padding: 1rem;
  background: var(--color-surface, #ffffff);
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

/* Month Section */
.month-section {
  border: 1px solid var(--color-border, #e5e7eb);
  border-radius: var(--border-radius-md, 6px);
  margin-left: 1rem;
  overflow: hidden;
}

.month-header {
  background: var(--color-background-alt, #f9fafb);
  border: none;
  border-radius: 0;
}

.month-content {
  padding: 0.75rem;
  background: var(--color-surface, #ffffff);
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

/* Biweek Section */
.biweek-section {
  border: 1px solid var(--color-border, #e5e7eb);
  border-radius: var(--border-radius-md, 6px);
  margin-left: 1rem;
  overflow: hidden;
}

.biweek-header {
  background: var(--color-background, #fafbfc);
  border: none;
  border-radius: 0;
  padding: 0.75rem;
}

.biweek-content {
  padding: 0.5rem;
  background: var(--color-surface, #ffffff);
}

.entries-table {
  display: flex;
  flex-direction: column;
  gap: 0rem;
  padding: 0.5rem 0;
}

.entry-row {
  display: grid;
  grid-template-columns: 200px 1fr 1fr auto;
  gap: 1rem;
  padding: 1.25rem;
  margin-bottom: 0.75rem;
  background: var(--color-surface, #ffffff);
  border: 2px solid var(--color-border, #e5e7eb);
  border-radius: var(--border-radius-lg, 12px);
  align-items: start;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
  position: relative;
  overflow: hidden;
}

.entry-row::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, var(--color-accent, #3b82f6), var(--color-success, #10b981));
  opacity: 0;
  transition: opacity 0.3s ease;
}

.entry-row:hover {
  border-color: var(--color-accent, #3b82f6);
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  transform: translateY(-1px);
}

.entry-row:hover::before {
  opacity: 1;
}

.entry-row.manual-entry {
  border-color: var(--color-warning, #f59e0b);
  background: linear-gradient(135deg, rgba(245, 158, 11, 0.02), rgba(255, 255, 255, 1));
}

.entry-row.manual-entry::before {
  background: linear-gradient(90deg, var(--color-warning, #f59e0b), var(--color-accent, #3b82f6));
  opacity: 0.7;
}

.entry-row.manual-entry:hover {
  border-color: var(--color-warning, #f59e0b);
  box-shadow: 0 4px 6px -1px rgba(245, 158, 11, 0.2), 0 2px 4px -1px rgba(245, 158, 11, 0.1);
}

.entry-user {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem;
  background: var(--color-background-alt, #f9fafb);
  border-radius: var(--border-radius-md, 8px);
  border: 1px solid var(--color-border, #e5e7eb);
}

.entry-user .user-name {
  font-weight: 600;
  color: var(--color-text-primary, #111827);
  font-size: 0.875rem;
}

.entry-user .user-email {
  font-size: 0.75rem;
  color: var(--color-text-secondary, #374151);
}

.entry-details {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 0.5rem;
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.05), rgba(16, 185, 129, 0.05));
  border-radius: var(--border-radius-md, 8px);
  border-left: 3px solid var(--color-accent, #3b82f6);
}

.entry-date {
  font-weight: 500;
  color: var(--color-text-primary, #111827);
  font-size: 0.875rem;
}

.entry-time-range {
  font-size: 0.75rem;
  color: var(--color-text-tertiary, #9ca3af);
  font-family: 'Monaco', 'Menlo', monospace;
}

.entry-duration {
  font-size: 0.875rem;
  color: var(--color-accent, #3b82f6);
  font-weight: 600;
}

.entry-info {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 0.5rem;
  background: rgba(255, 255, 255, 0.7);
  border-radius: var(--border-radius-md, 8px);
  border: 1px solid rgba(229, 231, 235, 0.5);
}

.entry-address, .entry-task {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: var(--color-text-secondary, #374151);
}

.entry-address svg {
  color: var(--color-success, #10b981);
}

.entry-task svg {
  color: var(--color-accent, #3b82f6);
}

.entry-notes {
  font-size: 0.75rem;
  color: var(--color-text-tertiary, #9ca3af);
  font-style: italic;
}

.entry-actions {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  align-items: stretch;
  padding: 0.5rem;
  background: var(--color-background-alt, #f9fafb);
  border-radius: var(--border-radius-md, 8px);
  border: 1px solid var(--color-border, #e5e7eb);
}

.btn-sm {
  padding: 0.5rem;
  font-size: 0.75rem;
  min-width: auto;
}

.divisions-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.division-item {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.division-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.division-name {
  font-size: 0.875rem;
  color: var(--color-text-secondary, #374151);
  font-weight: 500;
}

.division-time {
  font-size: 0.875rem;
  color: var(--color-accent, #3b82f6);
  font-weight: 600;
}

.division-bar {
  background: var(--color-background-alt, #f9fafb);
  height: 6px;
  border-radius: var(--border-radius-sm, 4px);
  overflow: hidden;
}

.division-progress {
  background: var(--color-accent, #3b82f6);
  height: 100%;
  border-radius: var(--border-radius-sm, 4px);
  transition: width 0.3s ease;
}

.users-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1rem;
}

.user-card {
  background: var(--color-surface, #ffffff);
  border: 1px solid var(--color-border, #e5e7eb);
  border-radius: var(--border-radius-md, 6px);
  padding: 1rem;
  transition: all 0.2s ease;
}

.user-card:hover {
  border-color: var(--color-border-hover, #d1d5db);
  box-shadow: var(--shadow-sm, 0 1px 2px 0 rgba(0,0,0,0.05));
}

.user-header {
  margin-bottom: 1rem;
}

.user-name {
  font-weight: 600;
  color: var(--color-text-primary, #111827);
}

.user-email {
  font-size: 0.875rem;
  color: var(--color-text-secondary, #374151);
}

.user-role {
  font-size: 0.75rem;
  color: var(--color-accent, #3b82f6);
  font-weight: 500;
  text-transform: uppercase;
  margin-top: 0.25rem;
}

.user-stats {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
}

.user-stat {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.875rem;
  color: var(--color-text-secondary, #374151);
}

.empty-state {
  text-align: center;
  padding: 3rem 1rem;
  color: var(--color-text-secondary, #374151);
}

.empty-icon {
  color: var(--color-text-tertiary, #9ca3af);
  margin-bottom: 1rem;
}

.error-container {
  text-align: center;
  padding: 3rem;
}

.loading-container {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  padding: 2rem;
}

.loading-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2rem;
  text-align: center;
  max-width: 400px;
}

.spinner {
  width: 48px;
  height: 48px;
  border: 4px solid var(--color-background-alt, #f3f4f6);
  border-top: 4px solid var(--color-accent, #3b82f6);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.loading-text h3 {
  margin: 0 0 0.5rem 0;
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--color-text-primary, #111827);
}

.loading-text p {
  margin: 0 0 1rem 0;
  color: var(--color-text-secondary, #6b7280);
  font-size: 1rem;
}

.loading-steps {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: var(--color-text-tertiary, #9ca3af);
}

.loading-step {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.25rem;
  animation: pulse 2s ease-in-out infinite;
}

.loading-step:nth-child(1) { animation-delay: 0s; }
.loading-step:nth-child(2) { animation-delay: 0.5s; }
.loading-step:nth-child(3) { animation-delay: 1s; }

@keyframes pulse {
  0%, 100% { opacity: 0.5; }
  50% { opacity: 1; }
}

@media (max-width: 768px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }
  
  .dashboard-title {
    font-size: 1.5rem;
  }
  
  .stat-card {
    padding: 1rem;
  }
  
  .stat-value {
    font-size: 1.5rem;
  }
  
  .users-grid {
    grid-template-columns: 1fr;
  }
  
  .entry-row {
    grid-template-columns: 1fr;
    gap: 0.75rem;
  }
  
  .division-info {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.25rem;
  }

  .section-stats {
    flex-direction: column;
    gap: 0.5rem;
    align-items: flex-start;
  }

  .section-title {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }

  /* Reduce indentation on mobile */
  .month-section {
    margin-left: 0.5rem;
  }

  .biweek-section {
    margin-left: 0.5rem;
  }
}
`

// Inject styles
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style')
  styleSheet.textContent = styles
  document.head.appendChild(styleSheet)
} 