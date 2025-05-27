import React, { useState } from 'react'
import { Calendar, Clock, ChevronDown, ChevronRight, Edit, Trash2 } from 'lucide-react'
import { formatDateSimple } from '../../../lib/dateUtils.js'
import { formatDuration, groupEntriesByHierarchy, calculateGroupStats, formatHours, getMonthName, getBiweeklyLabel } from '../utils'
import DashboardCard from '../Shared/DashboardCard'

/**
 * TimeEntriesList displays time entries in a hierarchical structure
 * @param {Object} props - Component props
 * @param {Array} props.entries - Time entries to display
 * @param {Function} props.onEdit - Callback for edit action
 * @param {Function} props.onDelete - Callback for delete action
 */
const TimeEntriesList = ({ entries = [], onEdit, onDelete }) => {
  const [expandedSections, setExpandedSections] = useState({
    years: {},
    months: {},
    biweeks: {}
  })
  
  // Group entries by year, month, and biweekly period
  const groupedEntries = groupEntriesByHierarchy(entries)
  
  // Toggle expansion of a section
  const toggleSection = (type, key) => {
    setExpandedSections(prev => ({
      ...prev,
      [type]: {
        ...prev[type],
        [key]: !prev[type][key]
      }
    }))
  }
  
  return (
    <DashboardCard 
      title="Time Entries"
      icon={<Calendar />}
      className="time-entries-list-card"
    >
      {Object.keys(groupedEntries).length === 0 ? (
        <div className="no-entries">
          <p>No time entries found.</p>
        </div>
      ) : (
        <div className="hierarchical-entries">
          {Object.entries(groupedEntries)
            .sort(([yearA], [yearB]) => Number(yearB) - Number(yearA))
            .map(([year, months]) => (
              <div key={year} className="year-group">
                {/* Year header */}
                <div 
                  className="group-header year-header" 
                  onClick={() => toggleSection('years', year)}
                >
                  <div className="header-icon">
                    {expandedSections.years[year] ? 
                      <ChevronDown size={18} /> : 
                      <ChevronRight size={18} />
                    }
                  </div>
                  <div className="header-title">{year}</div>
                  <div className="header-stats">
                    {formatStats(calculateGroupStats(
                      Object.values(months).flatMap(monthData => 
                        Object.values(monthData).flat()
                      )
                    ))}
                  </div>
                </div>
                
                {/* Month groups */}
                {expandedSections.years[year] && (
                  <div className="month-groups">
                    {Object.entries(months)
                      .sort(([monthA], [monthB]) => Number(monthB) - Number(monthA))
                      .map(([month, biweeks]) => (
                        <div key={`${year}-${month}`} className="month-group">
                          {/* Month header */}
                          <div 
                            className="group-header month-header" 
                            onClick={() => toggleSection('months', `${year}-${month}`)}
                          >
                            <div className="header-icon">
                              {expandedSections.months[`${year}-${month}`] ? 
                                <ChevronDown size={16} /> : 
                                <ChevronRight size={16} />
                              }
                            </div>
                            <div className="header-title">{getMonthName(Number(month))}</div>
                            <div className="header-stats">
                              {formatStats(calculateGroupStats(
                                Object.values(biweeks).flat()
                              ))}
                            </div>
                          </div>
                          
                          {/* Biweekly groups */}
                          {expandedSections.months[`${year}-${month}`] && (
                            <div className="biweek-groups">
                              {Object.entries(biweeks)
                                .sort(([biweekA], [biweekB]) => biweekA.localeCompare(biweekB))
                                .map(([biweek, biweekEntries]) => (
                                  <div key={`${year}-${month}-${biweek}`} className="biweek-group">
                                    {/* Biweek header */}
                                    <div 
                                      className="group-header biweek-header" 
                                      onClick={() => toggleSection('biweeks', `${year}-${month}-${biweek}`)}
                                    >
                                      <div className="header-icon">
                                        {expandedSections.biweeks[`${year}-${month}-${biweek}`] ? 
                                          <ChevronDown size={14} /> : 
                                          <ChevronRight size={14} />
                                        }
                                      </div>
                                      <div className="header-title">{getBiweeklyLabel(biweek)}</div>
                                      <div className="header-stats">
                                        {formatStats(calculateGroupStats(biweekEntries))}
                                      </div>
                                    </div>
                                    
                                    {/* Individual entries */}
                                    {expandedSections.biweeks[`${year}-${month}-${biweek}`] && (
                                      <div className="entries-list">
                                        {biweekEntries
                                          .sort((a, b) => new Date(b.date || b.created_at) - new Date(a.date || a.created_at))
                                          .map(entry => (
                                            <EntryItem 
                                              key={entry.id} 
                                              entry={entry} 
                                              onEdit={onEdit}
                                              onDelete={onDelete}
                                            />
                                          ))
                                        }
                                      </div>
                                    )}
                                  </div>
                                ))
                              }
                            </div>
                          )}
                        </div>
                      ))
                    }
                  </div>
                )}
              </div>
            ))
          }
        </div>
      )}
    </DashboardCard>
  )
}

// Helper to format stats in a consistent way
const formatStats = ({ totalEntries, totalHours, uniqueUsers }) => (
  <>
    <span className="stat-entry">{totalEntries} entries</span>
    <span className="stat-hours">{formatHours(totalHours)}h</span>
    {uniqueUsers > 0 && <span className="stat-users">{uniqueUsers} users</span>}
  </>
)

// Individual entry item component
const EntryItem = ({ entry, onEdit, onDelete }) => (
  <div className="entry-item">
    <div className="entry-details">
      <div className="entry-user">{entry.user_name || 'Unknown User'}</div>
      <div className="entry-date-time">
        <Calendar size={12} />
        <span>{formatDateSimple(entry.date || entry.created_at)}</span>
        <Clock size={12} />
        <span>{formatDuration(entry.duration)}</span>
      </div>
      <div className="entry-job">{entry.job_address}</div>
      <div className="entry-task">{entry.csi_division}</div>
      {entry.notes && <div className="entry-notes">{entry.notes}</div>}
    </div>
    
    <div className="entry-actions">
      {onEdit && (
        <button 
          onClick={() => onEdit(entry)} 
          className="action-button edit-button"
        >
          <Edit size={14} />
        </button>
      )}
      {onDelete && (
        <button 
          onClick={() => onDelete(entry.user_id, entry.id)} 
          className="action-button delete-button"
        >
          <Trash2 size={14} />
        </button>
      )}
    </div>
  </div>
)

export default TimeEntriesList 