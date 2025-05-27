import React from 'react'
import AdminStats from './AdminStats'
import UserList from './UserList'
import TimeEntriesList from './TimeEntriesList'
import { Plus } from 'lucide-react'

/**
 * AdminDashboard displays the admin view of the dashboard
 * @param {Object} props - Component props
 * @param {Object} props.user - Current user object
 * @param {Object} props.allUsersData - Data for all users
 * @param {Array} props.allTimeEntries - All time entries in the system
 * @param {Function} props.onShowAddUser - Callback to show add user dialog
 * @param {Function} props.onEditEntry - Callback for editing an entry
 * @param {Function} props.onDeleteEntry - Callback for deleting an entry
 * @param {Function} props.onAddEntry - Callback for adding a new entry
 */
const AdminDashboard = ({ 
  user,
  allUsersData,
  allTimeEntries = [],
  onShowAddUser,
  onEditEntry,
  onDeleteEntry,
  onAddEntry
}) => {
  return (
    <div className="admin-dashboard-container">
      <div className="dashboard-header">
        <h2>Admin Dashboard</h2>
        <div className="dashboard-actions">
          <button 
            onClick={onAddEntry} 
            className="add-entry-button"
          >
            <Plus size={16} />
            <span>Add Time Entry</span>
          </button>
        </div>
      </div>
      
      <div className="dashboard-content">
        {/* Admin summary statistics */}
        <section className="dashboard-section">
          <AdminStats 
            allTimeEntries={allTimeEntries} 
            allUsersData={allUsersData}
          />
        </section>
        
        {/* Users section */}
        <section className="dashboard-section">
          <UserList 
            allUsersData={allUsersData}
            onAddUser={onShowAddUser}
          />
        </section>
        
        {/* Time entries section */}
        <section className="dashboard-section">
          <TimeEntriesList 
            entries={allTimeEntries}
            onEdit={onEditEntry}
            onDelete={onDeleteEntry}
          />
        </section>
      </div>
    </div>
  )
}

export default AdminDashboard 