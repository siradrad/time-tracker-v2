import React from 'react'

/**
 * DashboardCard component provides consistent card styling for dashboard items
 * @param {Object} props - Component props
 * @param {ReactNode} props.children - Card content
 * @param {string} props.title - Optional card title
 * @param {string} props.className - Optional additional CSS classes
 * @param {string} props.icon - Optional icon component/element
 * @param {Function} props.onAction - Optional callback for action button
 * @param {string} props.actionLabel - Label for action button
 */
const DashboardCard = ({ 
  children, 
  title, 
  className = "", 
  icon, 
  onAction, 
  actionLabel = "Action" 
}) => {
  return (
    <div className={`dashboard-card ${className}`}>
      {(title || icon || onAction) && (
        <div className="dashboard-card-header">
          {icon && <div className="dashboard-card-icon">{icon}</div>}
          {title && <h3 className="dashboard-card-title">{title}</h3>}
          <div className="dashboard-card-header-space"></div>
          {onAction && (
            <button 
              onClick={onAction} 
              className="dashboard-card-action"
            >
              {actionLabel}
            </button>
          )}
        </div>
      )}
      <div className="dashboard-card-content">
        {children}
      </div>
    </div>
  )
}

export default DashboardCard 