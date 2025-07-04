import React, { useState, useEffect } from 'react'
import { timeTrackerAPI } from '../lib/supabase-real.js'
import { formatDateShort } from '../lib/dateUtils.js'
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
  const [modalUsers, setModalUsers] = useState([]);

  useEffect(() => {
    loadEntries()
    loadDropdownData()

    const loadUsersForModal = async () => {
      if (user.role === 'admin') {
        try {
          const allUsersData = await timeTrackerAPI.getAllUsersData(true);
          const usersArray = Object.values(allUsersData || {})
            .map(userData => userData.user)
            .filter(Boolean);
          setModalUsers(usersArray);
        } catch (error) {
          console.error("Error fetching all users for modal in TimeEntries:", error);
          setModalUsers([user]); // Fallback for admin: current admin only
        }
      } else {
        setModalUsers([user]); // For regular users: current user only
      }
    };
    loadUsersForModal();
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
      const originalUserId = editingEntry.user_id
      const newUserId = updatedEntry.user_id
      
      // Check if user is being changed (admin only)
      if (user.role === 'admin' && originalUserId !== newUserId) {
        // User is being changed - delete old entry and create new one
        console.log(`🔄 Moving entry from user ${originalUserId} to user ${newUserId}`)
        
        // Delete the original entry
        const deleteRes = await timeTrackerAPI.deleteTimeEntry(originalUserId, editingEntry.id)
        if (deleteRes.error) throw deleteRes.error
        
        // Create new entry with the new user
        const createRes = await timeTrackerAPI.addTimeEntry(newUserId, { 
          ...updatedEntry, 
          manual: editingEntry.manual || false 
        })
        if (createRes.error) throw createRes.error
        
        setSuccess('Time entry moved to new user!')
      } else {
        // Normal edit - same user
        const entryUserId = user.role === 'admin' ? originalUserId : user.id
        const res = await timeTrackerAPI.editTimeEntry(entryUserId, editingEntry.id, { 
          ...updatedEntry, 
          manual: editingEntry.manual || false 
        })
        if (res.error) throw res.error
        
        setSuccess('Time entry updated!')
      }
      
      setShowTimeEntryModal(false)
      setEditingEntry(null)
      setTimeout(() => setSuccess(''), 3000)
      await loadEntries()
    } catch (err) {
      setError('Failed to update time entry: ' + (err.message || err))
      console.error('Error in handleSaveEdit:', err)
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
      <style dangerouslySetInnerHTML={{__html: `
        .time-entries-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 2rem;
        }

        .entries-summary {
          display: flex;
          gap: 1.5rem;
          align-items: center;
          margin-left: auto;
          font-size: 0.875rem;
        }

        .total-entries {
          color: var(--color-text-secondary);
          padding: 0.5rem 1rem;
          background: var(--color-background-alt);
          border-radius: 2rem;
          font-weight: 500;
        }

        .total-hours {
          color: var(--color-accent);
          font-weight: 600;
          padding: 0.5rem 1rem;
          background: var(--color-accent-soft);
          border-radius: 2rem;
        }

        .empty-state {
          text-align: center;
          padding: 4rem 2rem;
          color: var(--color-text-secondary);
        }

        .empty-icon {
          color: var(--color-text-tertiary);
          margin-bottom: 1.5rem;
        }

        .empty-title {
          font-size: 1.25rem;
          font-weight: 600;
          color: var(--color-text-primary);
          margin-bottom: 0.5rem;
        }

        .empty-message {
          font-size: 0.875rem;
          color: var(--color-text-secondary);
          max-width: 400px;
          margin: 0 auto;
          line-height: 1.5;
        }

        .entries-list {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }

        .entry-item {
          background: var(--color-surface);
          border: 2px solid var(--color-border);
          border-radius: 12px;
          padding: 1.5rem;
          transition: all 0.2s ease;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
        }

        .entry-item:hover {
          border-color: var(--color-accent);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
          transform: translateY(-2px);
        }

        .entry-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 1rem;
          flex-wrap: wrap;
          gap: 1rem;
        }

        .entry-time {
          display: flex;
          align-items: center;
          gap: 1.5rem;
          flex-wrap: wrap;
        }

        .entry-date,
        .entry-duration {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.875rem;
          color: var(--color-text-secondary);
          font-weight: 500;
        }

        .entry-date svg,
        .entry-duration svg {
          color: var(--color-text-tertiary);
          flex-shrink: 0;
        }

        .manual-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.25rem;
          padding: 0.25rem 0.75rem;
          background: #fee2e2;
          color: #b91c1c;
          border-radius: 2rem;
          font-size: 0.75rem;
          font-weight: 500;
          white-space: nowrap;
        }

        .entry-actions {
          display: flex;
          gap: 0.5rem;
        }

        .entry-user-info {
          margin-bottom: 1rem;
          padding-bottom: 1rem;
          border-bottom: 1px solid var(--color-border);
        }

        .user-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 1rem;
          background: var(--color-accent-soft);
          color: var(--color-accent);
          border-radius: 8px;
          font-size: 0.875rem;
          font-weight: 500;
        }

        .entry-details {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .entry-time-range {
          font-size: 0.875rem;
          color: var(--color-text-tertiary);
          font-weight: 500;
          padding: 0.5rem 1rem;
          background: var(--color-background-alt);
          border-radius: 8px;
          display: inline-block;
          margin-bottom: 0.5rem;
        }

        .entry-detail {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .entry-address,
        .entry-task,
        .entry-notes {
          display: flex;
          align-items: flex-start;
          gap: 0.75rem;
          font-size: 0.875rem;
          color: var(--color-text-primary);
          line-height: 1.5;
        }

        .entry-address svg,
        .entry-task svg,
        .entry-notes svg {
          flex-shrink: 0;
          margin-top: 0.125rem;
          color: var(--color-text-tertiary);
        }

        .entry-address {
          font-weight: 500;
        }

        .entry-task {
          color: var(--color-text-secondary);
        }

        .entry-notes {
          color: var(--color-text-secondary);
          font-style: italic;
          background: var(--color-background-alt);
          padding: 0.75rem 1rem;
          border-radius: 8px;
          margin-top: 0.5rem;
        }

        .entry-notes svg {
          color: var(--color-text-tertiary);
        }

        @media (max-width: 768px) {
          .time-entries-container {
            padding: 1rem;
          }

          .entry-item {
            padding: 1.25rem;
          }

          .entry-header {
            flex-direction: column;
            gap: 0.75rem;
          }

          .entry-time {
            flex-direction: column;
            align-items: flex-start;
            gap: 0.5rem;
          }

          .entry-actions {
            align-self: flex-end;
          }

          .entries-summary {
            flex-direction: column;
            gap: 0.5rem;
            margin-top: 1rem;
          }
        }
      `}} />
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
                        {formatDateShort(entry.date || entry.created_at)}
                      </div>
                      <div className="entry-duration">
                        <Clock size={16} />
                        {formatDuration(entry.duration)}
                      </div>
                      {entry.manual && (
                        <span className="manual-badge">
                          <BadgeAlert size={14} /> Manual
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
          users={modalUsers}
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