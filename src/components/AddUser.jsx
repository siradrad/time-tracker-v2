import React, { useState } from 'react'
import { timeTrackerAPI } from '../lib/supabase.js'
import { UserPlus, User, Lock, Mail, Shield, X } from 'lucide-react'

function AddUser({ onUserAdded, onClose }) {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    name: '',
    role: 'user'
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    // Basic validation
    if (!formData.username || !formData.password || !formData.name) {
      setError('All fields are required')
      setLoading(false)
      return
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters')
      setLoading(false)
      return
    }

    try {
      const response = await timeTrackerAPI.createUser(
        formData.username,
        formData.password,
        formData.name,
        formData.role
      )

      if (response.error) {
        setError(response.error.message)
      } else {
        setSuccess('User created successfully!')
        setFormData({
          username: '',
          password: '',
          name: '',
          role: 'user'
        })
        setTimeout(() => {
          onUserAdded && onUserAdded(response.data.user)
          onClose && onClose()
        }, 1500)
      }
    } catch (err) {
      setError('Failed to create user')
      console.error('Error creating user:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  return (
    <div className="add-user-modal">
      <div className="modal-overlay" onClick={onClose}></div>
      <div className="modal-content">
        <div className="modal-header">
          <h3>
            <UserPlus size={20} />
            Add New User
          </h3>
          <button 
            onClick={onClose}
            className="btn btn-outline btn-sm"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="add-user-form">
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          {success && (
            <div className="success-message">
              {success}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="name">Full Name</label>
            <div className="input-group">
              <User size={16} />
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Enter full name"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="username">Email/Username</label>
            <div className="input-group">
              <Mail size={16} />
              <input
                type="email"
                id="username"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                placeholder="Enter email address"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <div className="input-group">
              <Lock size={16} />
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="Enter password (min 6 characters)"
                minLength={6}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="role">Role</label>
            <div className="input-group">
              <Shield size={16} />
              <select
                id="role"
                name="role"
                value={formData.role}
                onChange={handleInputChange}
              >
                <option value="user">👤 Regular User</option>
                <option value="admin">👑 Administrator</option>
              </select>
            </div>
          </div>

          <div className="form-actions">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-outline"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? 'Creating...' : 'Create User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default AddUser 