import React from 'react'
import { Clock, MapPin, List, BarChart3 } from 'lucide-react'
import { formatHours, getTopDivisions, formatDivisionTime } from '../utils'
import DashboardCard from '../Shared/DashboardCard'
import StatItem from '../Shared/StatItem'

/**
 * UserStats displays personal statistics for a regular user
 * @param {Object} props - Component props
 * @param {Object} props.stats - User statistics object
 */
const UserStats = ({ stats }) => {
  // Handle empty stats case
  if (!stats) return null
  
  // Get top 5 divisions by time spent
  const topDivisions = getTopDivisions(stats.divisionBreakdown || {})
  
  return (
    <div className="user-stats">
      {/* Summary statistics */}
      <div className="stats-summary">
        <StatItem 
          icon={<Clock />} 
          label="Total Hours"
          value={formatHours(stats.totalHours)}
        />
        <StatItem 
          icon={<List />} 
          label="Entries"
          value={stats.totalEntries}
        />
        <StatItem 
          icon={<MapPin />} 
          label="Job Locations"
          value={stats.totalAddresses}
        />
      </div>
      
      {/* Task breakdown */}
      {topDivisions.length > 0 && (
        <DashboardCard 
          title="Task Breakdown" 
          icon={<BarChart3 />}
          className="task-breakdown-card"
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
  )
}

export default UserStats 