import React from 'react'

/**
 * StatItem component displays a single statistic with an icon and label
 * @param {Object} props - Component props
 * @param {ReactNode} props.icon - Icon component/element
 * @param {string} props.label - Label for the statistic
 * @param {string|number} props.value - The statistic value
 * @param {string} props.className - Optional additional CSS classes
 */
const StatItem = ({ icon, label, value, className = "" }) => {
  return (
    <div className={`stat-item ${className}`}>
      <div className="stat-item-icon">
        {icon}
      </div>
      <div className="stat-item-content">
        <div className="stat-item-value">{value}</div>
        <div className="stat-item-label">{label}</div>
      </div>
    </div>
  )
}

export default StatItem 