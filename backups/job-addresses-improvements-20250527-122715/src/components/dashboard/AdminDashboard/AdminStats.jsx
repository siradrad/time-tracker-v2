import React from 'react'
import { Users, Clock, List, Calendar, BarChart3 } from 'lucide-react'
import { formatHours, getTopDivisions, formatDivisionTime } from '../utils'
import DashboardCard from '../Shared/DashboardCard'
import StatItem from '../Shared/StatItem'

/**
 * AdminStats displays overall statistics for the admin dashboard
 * @param {Object} props - Component props
 * @param {Array} props.allTimeEntries - All time entries in the system
 * @param {Object} props.allUsersData - Data for all users
 */
const AdminStats = ({ allTimeEntries = [], allUsersData = {} }) => {
  // Count active users in the last 30 days
  const countActiveUsers = () => {
    if (!allUsersData) return 0
    
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    
    return Object.values(allUsersData).filter(userData => {
      if (!userData.stats.lastEntry) return false
      const lastActivity = new Date(userData.stats.lastEntry)
      return lastActivity >= thirtyDaysAgo
    }).length
  }
  
  // Calculate total hours across all users
  const calculateTotalHours = () => {
    if (!allUsersData) return 0
    
    return Object.values(allUsersData).reduce(
      (total, userData) => total + userData.stats.totalHours, 
      0
    )
  }
  
  // Count total entries
  const totalEntries = allTimeEntries.length
  
  // Count total users
  const totalUsers = Object.keys(allUsersData).length
  
  // Count active users
  const activeUsers = countActiveUsers()
  
  // Calculate total hours
  const totalHours = calculateTotalHours()
  
  // Generate division breakdown across all entries
  const generateDivisionBreakdown = () => {
    const breakdown = {}
    
    allTimeEntries.forEach(entry => {
      if (entry.csi_division) {
        if (!breakdown[entry.csi_division]) {
          breakdown[entry.csi_division] = 0
        }
        breakdown[entry.csi_division] += entry.duration || 0
      }
    })
    
    return breakdown
  }
  
  const divisionBreakdown = generateDivisionBreakdown()
  const topDivisions = getTopDivisions(divisionBreakdown)
  
  return (
    <div className="admin-stats">
      {/* Summary statistics */}
      <div className="stats-cards">
        <DashboardCard className="summary-stats-card">
          <div className="stats-grid">
            <StatItem 
              icon={<Users />} 
              label="Users"
              value={`${activeUsers}/${totalUsers}`}
              className="users-stat"
            />
            <StatItem 
              icon={<Clock />} 
              label="Total Hours"
              value={formatHours(totalHours)}
              className="hours-stat"
            />
            <StatItem 
              icon={<List />} 
              label="Entries"
              value={totalEntries}
              className="entries-stat"
            />
            <StatItem 
              icon={<Calendar />} 
              label="Today"
              value={new Date().toLocaleDateString()}
              className="date-stat"
            />
          </div>
        </DashboardCard>
        
        {/* Task breakdown */}
        {topDivisions.length > 0 && (
          <DashboardCard 
            title="Top Tasks" 
            icon={<BarChart3 />}
            className="top-tasks-card"
          >
            <div className="division-list">
              {topDivisions.map(([division, seconds], index) => (
                <div key={index} className="division-item">
                  <div className="division-name">{division}</div>
                  <div className="division-bar-container">
                    <div 
                      className="division-bar" 
                      style={{ 
                        width: `${(seconds / topDivisions[0][1]) * 100}%` 
                      }}
                    ></div>
                  </div>
                  <div className="division-time">
                    {formatDivisionTime(seconds)}
                  </div>
                </div>
              ))}
            </div>
          </DashboardCard>
        )}
      </div>
    </div>
  )
}

export default AdminStats 