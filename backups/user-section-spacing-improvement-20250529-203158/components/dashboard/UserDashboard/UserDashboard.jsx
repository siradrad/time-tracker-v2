import React from 'react'
import UserStats from './UserStats'
import RecentActivity from './RecentActivity'

/**
 * UserDashboard displays personal dashboard for regular users
 * @param {Object} props - Component props
 * @param {Object} props.user - Current user object
 * @param {Object} props.stats - User statistics
 * @param {Array} props.timeEntries - User's time entries
 * @param {Function} props.onEditEntry - Callback for editing an entry
 * @param {Function} props.onDeleteEntry - Callback for deleting an entry
 */
const UserDashboard = ({ 
  user, 
  stats, 
  timeEntries = [], 
  onEditEntry, 
  onDeleteEntry 
}) => {
  return (
    <div className="user-dashboard-container">
      <div className="dashboard-header">
        <h2>Welcome, {user.name || user.username}!</h2>
        <p className="dashboard-subtitle">Here's your activity summary</p>
      </div>
      
      <div className="dashboard-content">
        {/* User stats section */}
        <section className="dashboard-section">
          <UserStats stats={stats} />
        </section>
        
        {/* Recent activity section */}
        <section className="dashboard-section">
          <RecentActivity 
            entries={timeEntries} 
            onEdit={onEditEntry}
            onDelete={onDeleteEntry}
            limit={5}
          />
        </section>
      </div>
    </div>
  )
}

export default UserDashboard 