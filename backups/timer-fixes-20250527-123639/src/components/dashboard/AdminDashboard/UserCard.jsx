import React from 'react'
import { User, Clock, List, MapPin } from 'lucide-react'
import { formatHours } from '../utils'
import DashboardCard from '../Shared/DashboardCard'

/**
 * UserCard displays a summary of user activity for the admin dashboard
 * @param {Object} props - Component props
 * @param {Object} props.userData - User data including stats
 * @param {string} props.userEmail - User's email (used as key)
 */
const UserCard = ({ userData, userEmail }) => {
  const { user, stats, jobAddresses, timeEntries } = userData
  
  // Calculate how recent the user's activity is
  const getActivityStatus = (lastEntry) => {
    if (!lastEntry) return { label: 'No activity', className: 'status-inactive' }
    
    const lastDate = new Date(lastEntry)
    const now = new Date()
    const daysDiff = Math.floor((now - lastDate) / (1000 * 60 * 60 * 24))
    
    if (daysDiff === 0) return { label: 'Today', className: 'status-active' }
    if (daysDiff === 1) return { label: 'Yesterday', className: 'status-recent' }
    if (daysDiff <= 7) return { label: `${daysDiff} days ago`, className: 'status-recent' }
    if (daysDiff <= 30) return { label: `${Math.floor(daysDiff / 7)} weeks ago`, className: 'status-inactive' }
    return { label: `${Math.floor(daysDiff / 30)} months ago`, className: 'status-inactive' }
  }
  
  const activityStatus = getActivityStatus(stats.lastEntry)
  
  return (
    <DashboardCard className="user-card">
      <div className="user-card-header">
        <div className="user-avatar">
          <User size={24} />
        </div>
        <div className="user-info">
          <h3 className="user-name">{user.name || userEmail}</h3>
          <div className="user-email">{userEmail}</div>
          <div className={`user-status ${activityStatus.className}`}>
            {activityStatus.label}
          </div>
        </div>
      </div>
      
      <div className="user-stats-grid">
        <div className="stat-box">
          <Clock size={16} />
          <div className="stat-value">{formatHours(stats.totalHours)}</div>
          <div className="stat-label">Hours</div>
        </div>
        
        <div className="stat-box">
          <List size={16} />
          <div className="stat-value">{timeEntries}</div>
          <div className="stat-label">Entries</div>
        </div>
        
        <div className="stat-box">
          <MapPin size={16} />
          <div className="stat-value">{jobAddresses}</div>
          <div className="stat-label">Jobs</div>
        </div>
      </div>
      
      {user.role === 'admin' && (
        <div className="admin-badge">Admin</div>
      )}
    </DashboardCard>
  )
}

export default UserCard 