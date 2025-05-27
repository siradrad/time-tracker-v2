/**
 * Dashboard utility functions for time entry formatting, grouping, and calculations
 */

/**
 * Formats hours to 2 decimal places
 * @param {number} hours - Hours to format
 * @returns {string} Formatted hours
 */
export const formatHours = (hours) => {
  if (isNaN(hours) || !isFinite(hours)) return "0.00";
  return hours.toFixed(2);
}

/**
 * Formats duration in seconds to hours and minutes
 * @param {number} seconds - Duration in seconds
 * @returns {string} Formatted duration
 */
export const formatDuration = (seconds) => {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  return `${hours}h ${minutes}m`
}

/**
 * Formats division time in seconds to hours
 * @param {number} seconds - Duration in seconds
 * @returns {string} Formatted division time
 */
export const formatDivisionTime = (seconds) => {
  const hours = (seconds / 3600).toFixed(1)
  return `${hours}h`
}

/**
 * Gets top divisions by time spent
 * @param {Object} divisionBreakdown - Object with division times
 * @param {number} limit - Maximum number of divisions to return
 * @returns {Array} Top divisions with times
 */
export const getTopDivisions = (divisionBreakdown, limit = 5) => {
  return Object.entries(divisionBreakdown)
    .sort(([,a], [,b]) => b - a)
    .slice(0, limit)
}

/**
 * Gets the biweekly period from a date
 * @param {Date} date - Date to check
 * @returns {string} Period identifier ('first-half' or 'second-half')
 */
export const getBiweeklyPeriod = (date) => {
  const day = date.getDate()
  return day <= 15 ? 'first-half' : 'second-half'
}

/**
 * Gets a human-readable label for a biweekly period
 * @param {string} period - Period identifier
 * @returns {string} Human-readable label
 */
export const getBiweeklyLabel = (period) => {
  return period === 'first-half' ? '1st - 15th' : '16th - End'
}

/**
 * Gets the month name from its index
 * @param {number} monthIndex - Month index (0-11)
 * @returns {string} Month name
 */
export const getMonthName = (monthIndex) => {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]
  return months[monthIndex]
}

/**
 * Groups time entries hierarchically by year, month, and biweekly period
 * @param {Array} entries - Time entries to group
 * @returns {Object} Hierarchically grouped entries
 */
export const groupEntriesByHierarchy = (entries) => {
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

/**
 * Calculates statistics for a group of entries
 * @param {Array} entries - Time entries
 * @returns {Object} Group statistics
 */
export const calculateGroupStats = (entries) => {
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