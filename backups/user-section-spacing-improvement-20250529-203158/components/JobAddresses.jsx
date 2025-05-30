import React, { useState, useEffect } from 'react'
import { timeTrackerAPI } from '../lib/supabase-real.js'
import { MapPin, Plus, Trash2, Search, AlertCircle } from 'lucide-react'

function JobAddresses({ user }) {
  const [addresses, setAddresses] = useState([])
  const [newAddress, setNewAddress] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)

  useEffect(() => {
    if (user && user.id) {
      loadAddresses()
    } else {
      setError('User information is missing. Please try signing out and back in.')
      setLoading(false)
    }
  }, [user?.id])

  const loadAddresses = async () => {
    try {
      setLoading(true)
      setError('')
      
      const response = await timeTrackerAPI.getJobAddresses(user.id)
      if (response.error) {
        setError('Failed to load job addresses: ' + response.error.message)
      } else {
        setAddresses(response.data || [])
      }
    } catch (err) {
      setError('Failed to load job addresses')
      console.error('Error loading addresses:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleAddAddress = async (e) => {
    e.preventDefault()
    const trimmedAddress = newAddress.trim()
    
    if (!trimmedAddress) {
      setError('Address cannot be empty')
      return
    }
    
    // Basic validation
    if (trimmedAddress.length < 3) {
      setError('Address is too short. Please enter a valid address.')
      return
    }
    
    // Check for duplicate addresses
    if (addresses.some(addr => addr.address.toLowerCase() === trimmedAddress.toLowerCase())) {
      setError('This address already exists in your list.')
      return
    }

    setAdding(true)
    setError('')
    setSuccess('')

    try {
      const response = await timeTrackerAPI.addJobAddress(user.id, trimmedAddress)
      if (response.error) {
        setError('Failed to add address: ' + response.error.message)
      } else {
        setNewAddress('')
        setSuccess('Address added successfully!')
        setTimeout(() => setSuccess(''), 3000)
        setShowAddForm(false)
        await loadAddresses()
      }
    } catch (err) {
      setError('Failed to add address')
      console.error('Error adding address:', err)
    } finally {
      setAdding(false)
    }
  }

  const handleDeleteAddress = async (addressId) => {
    if (!addressId) {
      setError('Invalid address ID')
      return
    }
    
    if (!window.confirm('Are you sure you want to delete this job address?')) {
      return
    }

    try {
      setError('')
      const response = await timeTrackerAPI.deleteJobAddress(user.id, addressId)
      if (response.error) {
        setError('Failed to delete address: ' + response.error.message)
      } else {
        setSuccess('Address deleted successfully!')
        setTimeout(() => setSuccess(''), 3000)
        await loadAddresses()
      }
    } catch (err) {
      setError('Failed to delete address')
      console.error('Error deleting address:', err)
    }
  }

  const filteredAddresses = addresses.filter(address =>
    address.address && address.address.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading job addresses...</p>
      </div>
    )
  }

  return (
    <div className="job-addresses-container">
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">
            <MapPin />
            Job Addresses
          </h2>
          <button
            onClick={() => {
              setShowAddForm(true);
              setNewAddress('');
              setError('');
            }}
            className="btn btn-primary"
            disabled={showAddForm}
          >
            <Plus size={16} />
            Add New Address
          </button>
        </div>
        <div className="card-content">
          {error && (
            <div className="error-message" style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <AlertCircle size={16} />
              {error}
            </div>
          )}
          
          {success && (
            <div className="success-message" style={{ marginBottom: '1rem' }}>
              {success}
            </div>
          )}

          {/* Add New Address Form */}
          {showAddForm && (
            <div className="add-address-form">
              <form onSubmit={handleAddAddress}>
                <div className="form-group">
                  <label className="form-label">
                    <MapPin size={16} />
                    New Job Address
                  </label>
                  <input
                    type="text"
                    value={newAddress}
                    onChange={(e) => {
                      setNewAddress(e.target.value)
                      // Clear error when user starts typing again
                      if (error) setError('')
                    }}
                    className="form-input"
                    placeholder="Enter job address..."
                    maxLength={100}
                    required
                    autoFocus
                  />
                </div>
                <div className="form-actions">
                  <button 
                    type="submit" 
                    className="btn btn-primary"
                    disabled={adding || !newAddress.trim() || newAddress.trim().length < 3}
                  >
                    {adding ? 'Adding...' : 'Add Address'}
                  </button>
                  <button 
                    type="button" 
                    onClick={() => {
                      setShowAddForm(false)
                      setNewAddress('')
                      setError('')
                    }}
                    className="btn btn-secondary"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {addresses.length > 0 && (
            <div className="search-section">
              <div className="form-group">
                <label className="form-label">
                  <Search size={16} />
                  Search Addresses
                </label>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="form-input"
                  placeholder="Search by address name..."
                />
              </div>
            </div>
          )}

          <div className="addresses-section">
            <div className="addresses-header">
              <h3>Your Job Addresses ({filteredAddresses.length})</h3>
            </div>
            
            {filteredAddresses.length === 0 ? (
              <div className="empty-state">
                {searchTerm ? (
                  <p>No addresses found matching "{searchTerm}"</p>
                ) : (
                  <p>No job addresses found. Add your first address above!</p>
                )}
              </div>
            ) : (
              <div className="addresses-list">
                {filteredAddresses.map((address) => (
                  <div key={address.id} className="address-item">
                    <div className="address-content">
                      <div className="address-text">
                        <MapPin size={16} className="address-icon" />
                        {address.address}
                      </div>
                      <div className="address-meta">
                        Added {new Date(address.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteAddress(address.id)}
                      className="btn btn-danger btn-sm"
                      title="Delete address"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        .job-addresses-container {
          max-width: 800px;
          margin: 0 auto;
        }

        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 1rem;
        }

        .add-address-form {
          background: var(--color-background-alt, #f9fafb);
          border: 1px solid var(--color-border, #e5e7eb);
          border-radius: var(--border-radius-md, 6px);
          padding: 1.5rem;
          margin-bottom: 2rem;
        }

        .form-label {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .form-actions {
          display: flex;
          gap: 0.75rem;
          margin-top: 1rem;
        }

        .input-group {
          display: flex;
          gap: 1rem;
          align-items: flex-end;
        }

        .input-group .form-group {
          flex: 1;
          margin-bottom: 0;
        }

        .addresses-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
        }

        .addresses-header h3 {
          margin: 0;
          color: var(--color-text-primary, #111827);
          font-size: 1.125rem;
          font-weight: 600;
        }

        .empty-state {
          text-align: center;
          padding: 2rem 1rem;
          color: var(--color-text-secondary, #374151);
        }

        .addresses-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .address-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1rem;
          background: var(--color-surface, #ffffff);
          border: 1px solid var(--color-border, #e5e7eb);
          border-radius: var(--border-radius-md, 6px);
          transition: all 0.2s ease;
        }

        .address-item:hover {
          border-color: var(--color-border-hover, #d1d5db);
          box-shadow: var(--shadow-sm, 0 1px 2px 0 rgba(0,0,0,0.05));
        }

        .address-content {
          flex: 1;
        }

        .address-name {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-weight: 500;
          color: var(--color-text-primary, #111827);
          margin-bottom: 0.25rem;
        }

        .address-icon {
          color: var(--color-accent, #F97316);
        }

        .address-meta {
          font-size: 0.875rem;
          color: var(--color-text-secondary, #374151);
        }

        @media (max-width: 640px) {
          .card-header {
            flex-direction: column;
            align-items: stretch;
          }
          
          .input-group {
            flex-direction: column;
          }
          
          .address-item {
            flex-direction: column;
            align-items: flex-start;
            gap: 1rem;
          }
          
          .address-item .btn {
            align-self: flex-end;
          }
        }
      `}</style>
    </div>
  )
}

export default JobAddresses 