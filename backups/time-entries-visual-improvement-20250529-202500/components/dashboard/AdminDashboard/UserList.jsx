import React from 'react'
import { Users, UserPlus } from 'lucide-react'
import UserCard from './UserCard'
import DashboardCard from '../Shared/DashboardCard'

/**
 * UserList displays a grid of user cards for the admin dashboard
 * @param {Object} props - Component props
 * @param {Object} props.allUsersData - Data for all users
 * @param {Function} props.onAddUser - Callback for add user action
 */
const UserList = ({ allUsersData, onAddUser }) => {
  if (!allUsersData || Object.keys(allUsersData).length === 0) {
    return (
      <DashboardCard
        title="Users"
        icon={<Users />}
        onAction={onAddUser}
        actionLabel="Add User"
        className="users-container empty-users"
      >
        <div className="no-users-message">
          <p>No users found. Add a new user to get started.</p>
        </div>
      </DashboardCard>
    )
  }
  
  return (
    <div className="users-section">
      <div className="section-header">
        <h2 className="section-title">
          <Users size={20} />
          <span>Users ({Object.keys(allUsersData).length})</span>
        </h2>
        {onAddUser && (
          <button 
            onClick={onAddUser} 
            className="add-user-button"
          >
            <UserPlus size={16} />
            <span>Add User</span>
          </button>
        )}
      </div>
      
      <div className="users-grid">
        {Object.entries(allUsersData).map(([email, userData]) => (
          <UserCard 
            key={email} 
            userEmail={email}
            userData={userData} 
          />
        ))}
      </div>
    </div>
  )
}

export default UserList 