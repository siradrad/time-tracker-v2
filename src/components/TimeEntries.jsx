import React, { useState, useEffect } from 'react'
import { timeTrackerAPI } from '../lib/supabase.js'
import { List, Clock, MapPin, Briefcase, FileText, Trash2, Calendar } from 'lucide-react'

function TimeEntries({ user }) {
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    loadEntries()
  }, [user.id])

  const loadEntries = async () => {
    try {
      setLoading(true)
      let response
      
      if (user.role === 'admin') {
        // Admin users see all time entries from all users
        response = await timeTrackerAPI.getAllTimeEntries(200)
      } else {
        // Regular users see only their own entries
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
        // Admin can delete any entry - find the entry to get the user_id
        const entry = entries.find(e => e.id === entryId)
        if (!entry) {
          setError('Entry not found')
          return
        }
        response = await timeTrackerAPI.deleteTimeEntry(entry.user_id, entryId)
      } else {
        // Regular users can only delete their own entries
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
                  : 'Start tracking your time to see entries here!'
                }
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
                    </div>
                    <div className="entry-actions">
                      <button
                        onClick={() => handleDeleteEntry(entry.id)}
                        className="btn btn-danger btn-sm"
                        title="Delete entry"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                  
                  {/* Show user info for admin */}
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

      <style jsx>{`
        .time-entries-container {
          max-width: 1000px;
          margin: 0 auto;
        }

        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 1rem;
        }

        .entries-summary {
          display: flex;
          gap: 1.5rem;
          font-size: 0.875rem;
          color: var(--color-text-secondary, #374151);
        }

        .total-entries {
          font-weight: 500;
        }

        .total-hours {
          font-weight: 600;
          color: var(--color-accent, #3b82f6);
        }

        .empty-state {
          text-align: center;
          padding: 4rem 2rem;
          color: var(--color-text-secondary, #374151);
        }

        .empty-icon {
          color: var(--color-text-tertiary, #9ca3af);
          margin-bottom: 1rem;
        }

        .empty-title {
          font-size: 1.25rem;
          font-weight: 600;
          margin-bottom: 0.5rem;
        }

        .empty-message {
          font-size: 0.875rem;
        }

        .entries-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .entry-item {
          background: var(--color-surface, #ffffff);
          border: 1px solid var(--color-border, #e5e7eb);
          border-radius: var(--border-radius-md, 6px);
          padding: 1.25rem;
          transition: all 0.2s ease;
          position: relative;
        }

        .entry-item:hover {
          border-color: var(--color-border-hover, #d1d5db);
          box-shadow: var(--shadow-sm, 0 1px 2px 0 rgba(0,0,0,0.05));
        }

        .entry-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.75rem;
        }

        .entry-time {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .entry-date {
          color: var(--color-text-secondary, #374151);
        }

        .entry-duration {
          color: var(--color-accent, #3b82f6);
          font-weight: 600;
        }

        .entry-actions {
          display: flex;
          gap: 0.5rem;
        }

        .entry-user-info {
          margin-bottom: 0.75rem;
          padding: 0.5rem;
          background: var(--color-accent-soft, #eff6ff);
          border-radius: var(--border-radius-sm, 4px);
          border-left: 3px solid var(--color-accent, #3b82f6);
        }

        .user-badge {
          font-size: 0.875rem;
          color: var(--color-accent, #3b82f6);
          font-weight: 500;
        }

        .entry-time-range {
          font-size: 0.875rem;
          color: var(--color-text-tertiary, #9ca3af);
          margin-bottom: 0.75rem;
          font-family: 'Monaco', 'Menlo', monospace;
        }

        .entry-details {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .entry-detail {
          display: flex;
          align-items: flex-start;
          gap: 0.5rem;
          font-size: 0.875rem;
        }

        .entry-address {
          color: var(--color-text-secondary, #374151);
        }
        .entry-address > svg {
          color: var(--color-success, #10b981);
        }

        .entry-task {
          color: var(--color-text-secondary, #374151);
        }

        .entry-notes {
          color: var(--color-text-tertiary, #9ca3af);
        }

        .entry-notes span {
          font-style: italic;
        }

        .entry-actions {
          position: absolute;
          top: 1rem;
          right: 1rem;
        }

        .btn-sm {
          padding: 0.5rem;
          font-size: 0.75rem;
        }

        @media (max-width: 768px) {
          .card-header {
            flex-direction: column;
            align-items: flex-start;
          }
          
          .entries-summary {
            order: -1;
            width: 100%;
          }
          
          .entry-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 0.5rem;
          }
          
          .entry-item {
            padding: 1rem;
            padding-right: 3rem;
          }
          
          .entry-actions {
            top: 0.75rem;
            right: 0.75rem;
          }
        }
      `}</style>
    </div>
  )
}

export default TimeEntries 