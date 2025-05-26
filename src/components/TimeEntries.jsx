import React, { useState, useEffect } from 'react'
import { timeTrackerAPI } from '../lib/supabase-real.js'
import TimeEntryModal from './TimeEntryModal.jsx'
import { List, Clock, MapPin, Briefcase, FileText, Trash2, Calendar, Edit, Plus, BadgeAlert } from 'lucide-react'

function TimeEntries({ user }) {
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showTimeEntryModal, setShowTimeEntryModal] = useState(false)
  const [editingEntry, setEditingEntry] = useState(null)
  const [allJobs, setAllJobs] = useState([])
  const [allTasks, setAllTasks] = useState([])

  useEffect(() => {
    loadEntries()
    loadDropdownData()
  }, [user.id])

  const loadDropdownData = async () => {
    try {
      const [jobsRes, tasksRes] = await Promise.all([
        timeTrackerAPI.getAllJobAddresses(),
        timeTrackerAPI.getAvailableCSITasks()
      ])
      setAllJobs(jobsRes.data || [])
      setAllTasks(tasksRes.data || [])
    } catch (err) {
      console.error('Error loading dropdown data:', err)
    }
  }

  const loadEntries = async () => {
    try {
      setLoading(true)
      let response
      if (user.role === 'admin') {
        response = await timeTrackerAPI.getAllTimeEntries(200)
      } else {
        response = await timeTrackerAPI.getTimeEntries(user.id, 100)
      }
      if (response.error) {
        setError('Failed to load time entries: ' + response.error.message)
      } else {
        setEntries(response.data || [])
      }
    } catch (err) {
      setError('Failed to load time entries')
      console.error('Error loading entries:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteEntry = async (entryId) => {
    if (!window.confirm('Are you sure you want to delete this time entry?')) {
      return
    }
    try {
      let response
      if (user.role === 'admin') {
        const entry = entries.find(e => e.id === entryId)
        if (!entry) {
          setError('Entry not found')
          return
        }
        response = await timeTrackerAPI.deleteTimeEntry(entry.user_id, entryId)
      } else {
        response = await timeTrackerAPI.deleteTimeEntry(user.id, entryId)
      }
      if (response.error) {
        setError('Failed to delete entry: ' + response.error.message)
      } else {
        setSuccess('Time entry deleted successfully!')
        setTimeout(() => setSuccess(''), 3000)
        await loadEntries()
      }
    } catch (err) {
      setError('Failed to delete entry')
      console.error('Error deleting entry:', err)
    }
  }

  const handleAddEntry = () => {
    setShowTimeEntryModal(true)
  }

  const handleEditEntry = (entry) => {
    setEditingEntry(entry)
    setShowTimeEntryModal(true)
  }

  const handleSaveEdit = async (updatedEntry) => {
    try {
      const entryUserId = user.role === 'admin' ? editingEntry.user_id : user.id
      const res = await timeTrackerAPI.editTimeEntry(entryUserId, editingEntry.id, { ...updatedEntry, manual: editingEntry.manual || false })
      if (res.error) throw res.error
      setShowTimeEntryModal(false)
      setEditingEntry(null)
      setSuccess('Time entry updated!')
      setTimeout(() => setSuccess(''), 3000)
      await loadEntries()
    } catch (err) {
      setError('Failed to update time entry: ' + (err.message || err))
    }
  }

  const handleSaveTimeEntry = async (entryData) => {
    try {
      const res = await timeTrackerAPI.addTimeEntry(user.id, { ...entryData, manual: true })
      if (res.error) throw res.error
      setShowTimeEntryModal(false)
      setSuccess('Time entry added!')
      setTimeout(() => setSuccess(''), 3000)
      await loadEntries()
    } catch (err) {
      setError('Failed to add time entry: ' + (err.message || err))
    }
  }

  const formatDuration = (seconds) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const remainingSeconds = seconds % 60
    if (hours > 0) {
      return `${hours}h ${minutes}m ${remainingSeconds}s`
    } else if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`
    } else {
      return `${remainingSeconds}s`
    }
  }

  const formatTime = (timeString) => {
    return new Date(timeString).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    })
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString([], {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const getTotalHours = () => {
    const totalSeconds = entries.reduce((sum, entry) => sum + entry.duration, 0)
    return (totalSeconds / 3600).toFixed(2)
  }

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading time entries...</p>
      </div>
    )
  }

  return (
    <div className="time-entries-container">
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">
            <List />
            {user.role === 'admin' ? 'All Time Entries' : 'Time Entries'}
          </h2>
          {user.role !== 'admin' && (
            <button className="btn btn-primary" onClick={handleAddEntry} style={{ marginLeft: 'auto' }}>
              <Plus size={16} /> Add Time Entry
            </button>
          )}
          {entries.length > 0 && (
            <div className="entries-summary">
              <span className="total-entries">{entries.length} entries</span>
              <span className="total-hours">{getTotalHours()} hours total</span>
            </div>
          )}
        </div>
        <div className="card-content">
          {error && (
            <div className="error-message" style={{ marginBottom: '1rem' }}>
              {error}
            </div>
          )}
          {success && (
            <div className="success-message" style={{ marginBottom: '1rem' }}>
              {success}
            </div>
          )}
          {entries.length === 0 ? (
            <div className="empty-state">
              <Clock size={48} className="empty-icon" />
              <h3 className="empty-title">No Time Entries Yet</h3>
              <p className="empty-message">
                {user.role === 'admin' 
                  ? 'No users have created any time entries yet.' 
                  : 'Start tracking your time to see entries here!'}
              </p>
            </div>
          ) : (
            <div className="entries-list">
              {entries.map((entry) => (
                <div key={entry.id} className="entry-item">
                  <div className="entry-header">
                    <div className="entry-time">
                      <div className="entry-date">
                        <Calendar size={16} />
                        {formatDate(entry.created_at)}
                      </div>
                      <div className="entry-duration">
                        <Clock size={16} />
                        {formatDuration(entry.duration)}
                      </div>
                      {entry.manual && (
                        <span className="manual-badge" style={{ color: '#b91c1c', background: '#fee2e2', borderRadius: 6, padding: '2px 8px', fontSize: 12, marginLeft: 8, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          <BadgeAlert size={14} style={{ marginRight: 2 }} /> Manual
                        </span>
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
                        onClick={() => handleDeleteEntry(entry.id)}
                        className="btn btn-danger btn-sm"
                        title="Delete entry"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                  {user.role === 'admin' && entry.user_name && (
                    <div className="entry-user-info">
                      <div className="user-badge">
                        👤 {entry.user_name} ({entry.user_email})
                      </div>
                    </div>
                  )}
                  <div className="entry-details">
                    <div className="entry-time-range">
                      {formatTime(entry.start_time)} - {formatTime(entry.end_time)}
                    </div>
                    <div className="entry-detail">
                      <div className="entry-address">
                        <MapPin size={14} />
                        <span>{entry.job_address}</span>
                      </div>
                      <div className="entry-task">
                        <Briefcase size={14} />
                        <span>{entry.csi_division}</span>
                      </div>
                      {entry.notes && (
                        <div className="entry-notes">
                          <FileText size={14} />
                          <span>{entry.notes}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      {showTimeEntryModal && (
        <TimeEntryModal
          isOpen={showTimeEntryModal}
          onClose={() => { setShowTimeEntryModal(false); setEditingEntry(null); }}
          onSave={editingEntry ? handleSaveEdit : handleSaveTimeEntry}
          entry={editingEntry || {}}
          users={[user]}
          jobs={allJobs.map(address => ({ address, id: address }))}
          tasks={allTasks}
          mode={editingEntry ? 'edit' : 'add'}
          currentUser={user}
        />
      )}
    </div>
  )
}

export default TimeEntries 