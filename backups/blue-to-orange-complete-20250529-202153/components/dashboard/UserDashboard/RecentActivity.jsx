import React from 'react'
import { Calendar, Clock, MapPin, Edit, Trash2 } from 'lucide-react'
import { formatDateSimple } from '../../../lib/dateUtils.js'
import { formatDuration } from '../utils'
import DashboardCard from '../Shared/DashboardCard'

/**
 * RecentActivity displays recent time entries for a user
 * @param {Object} props - Component props
 * @param {Array} props.entries - Time entries to display
 * @param {Function} props.onEdit - Callback for edit action
 * @param {Function} props.onDelete - Callback for delete action
 * @param {number} props.limit - Maximum entries to show
 */
const RecentActivity = ({ entries = [], onEdit, onDelete, limit = 5 }) => {
  // Only show the most recent entries up to the limit
  const recentEntries = entries.slice(0, limit)
  
  return (
    <DashboardCard 
      title="Recent Activity" 
      icon={<Clock />}
      className="recent-activity-card"
    >
      {recentEntries.length === 0 ? (
        <div className="no-entries">
          <p>No recent time entries found.</p>
        </div>
      ) : (
        <div className="entry-list">
          {recentEntries.map(entry => (
            <div key={entry.id} className="time-entry-item">
              <div className="entry-header">
                <div className="entry-date">
                  <Calendar size={14} />
                  <span>{formatDateSimple(entry.date || entry.created_at)}</span>
                </div>
                <div className="entry-duration">
                  <Clock size={14} />
                  <span>{formatDuration(entry.duration)}</span>
                </div>
              </div>
              
              <div className="entry-location">
                <MapPin size={14} />
                <span>{entry.job_address}</span>
              </div>
              
              <div className="entry-task">
                <span className="task-label">{entry.csi_division}</span>
                {entry.notes && <p className="entry-notes">{entry.notes}</p>}
              </div>
              
              <div className="entry-actions">
                {onEdit && (
                  <button 
                    onClick={() => onEdit(entry)} 
                    className="action-button edit-button"
                  >
                    <Edit size={16} />
                  </button>
                )}
                {onDelete && (
                  <button 
                    onClick={() => onDelete(entry.user_id, entry.id)} 
                    className="action-button delete-button"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </DashboardCard>
  )
}

export default RecentActivity 