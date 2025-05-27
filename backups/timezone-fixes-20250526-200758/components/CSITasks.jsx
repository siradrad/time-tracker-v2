import React, { useState, useEffect } from 'react'
import { timeTrackerAPI } from '../lib/supabase-real.js'
import { Briefcase, Plus, Edit, Trash2, BarChart3, Users, Clock } from 'lucide-react'

function CSITasks({ user }) {
  const [csiTasks, setCsiTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingTask, setEditingTask] = useState(null)
  const [newTaskName, setNewTaskName] = useState('')

  useEffect(() => {
    if (user.role === 'admin') {
      loadCSITasks()
    }
  }, [user])

  const loadCSITasks = async () => {
    try {
      setLoading(true)
      setError('')
      
      const response = await timeTrackerAPI.getCSITasks()
      if (response.error) {
        setError('Failed to load CSI tasks: ' + response.error.message)
      } else {
        setCsiTasks(response.data || [])
      }
    } catch (err) {
      setError('Failed to load CSI tasks')
      console.error('Error loading CSI tasks:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleAddTask = async (e) => {
    e.preventDefault()
    if (!newTaskName.trim()) return

    try {
      const response = await timeTrackerAPI.addCSITask(newTaskName.trim())
      if (response.error) {
        setError('Failed to add CSI task: ' + response.error.message)
      } else {
        setSuccess('CSI task added successfully!')
        setTimeout(() => setSuccess(''), 3000)
        setNewTaskName('')
        setShowAddForm(false)
        await loadCSITasks()
      }
    } catch (err) {
      setError('Failed to add CSI task')
      console.error('Error adding CSI task:', err)
    }
  }

  const handleEditTask = async (taskId, newName) => {
    if (!newName.trim()) return

    try {
      const response = await timeTrackerAPI.editCSITask(taskId, newName.trim())
      if (response.error) {
        setError('Failed to update CSI task: ' + response.error.message)
      } else {
        setSuccess('CSI task updated successfully!')
        setTimeout(() => setSuccess(''), 3000)
        setEditingTask(null)
        await loadCSITasks()
      }
    } catch (err) {
      setError('Failed to update CSI task')
      console.error('Error updating CSI task:', err)
    }
  }

  const handleDeleteTask = async (taskId, taskName) => {
    const task = csiTasks.find(t => t.id === taskId)
    const warningMessage = task && task.usage_count > 0 
      ? `Are you sure you want to delete "${taskName}"? This task is used in ${task.usage_count} time entries. Deleting it will not affect existing entries, but users won't be able to select it for new entries.`
      : `Are you sure you want to delete "${taskName}"?`

    if (!confirm(warningMessage)) return

    try {
      const response = await timeTrackerAPI.deleteCSITask(taskId)
      if (response.error) {
        setError('Failed to delete CSI task: ' + response.error.message)
      } else {
        setSuccess('CSI task deleted successfully!')
        setTimeout(() => setSuccess(''), 3000)
        await loadCSITasks()
      }
    } catch (err) {
      setError('Failed to delete CSI task')
      console.error('Error deleting CSI task:', err)
    }
  }

  const handleEditSubmit = (e, taskId) => {
    e.preventDefault()
    const formData = new FormData(e.target)
    const newName = formData.get('taskName')
    handleEditTask(taskId, newName)
  }

  if (user.role !== 'admin') {
    return (
      <div className="error-container">
        <p className="error-message">Access denied. Admin privileges required.</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading CSI tasks...</p>
      </div>
    )
  }

  return (
    <div className="csi-tasks-container">
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">
            <Briefcase />
            CSI Division Tasks Management
          </h2>
          <button
            onClick={() => setShowAddForm(true)}
            className="btn btn-primary"
          >
            <Plus size={16} />
            Add New Task
          </button>
        </div>

        <div className="card-content">
          {error && (
            <div className="error-message" style={{ marginBottom: '1rem' }}>
              {error}
            </div>
          )}
          
          {success && (
            <div className="success-message" style={{ marginBottom: '1rem' }}>
              {success}
            </div>
          )}

          {/* Add New Task Form */}
          {showAddForm && (
            <div className="add-task-form">
              <form onSubmit={handleAddTask}>
                <div className="form-group">
                  <label htmlFor="newTask" className="form-label">
                    <Briefcase size={16} />
                    CSI Division Task Name
                  </label>
                  <input
                    id="newTask"
                    type="text"
                    value={newTaskName}
                    onChange={(e) => setNewTaskName(e.target.value)}
                    className="form-input"
                    placeholder="Enter CSI division task name"
                    required
                  />
                </div>
                <div className="form-actions">
                  <button type="submit" className="btn btn-primary">
                    Add Task
                  </button>
                  <button 
                    type="button" 
                    onClick={() => {
                      setShowAddForm(false)
                      setNewTaskName('')
                    }}
                    className="btn btn-secondary"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* CSI Tasks List */}
          {csiTasks.length === 0 ? (
            <div className="empty-state">
              <Briefcase size={48} className="empty-icon" />
              <h3 className="empty-title">No CSI Tasks Found</h3>
              <p className="empty-message">
                No CSI division tasks have been created yet. Add your first task to get started.
              </p>
            </div>
          ) : (
            <div className="tasks-list">
              {csiTasks.map((task) => (
                <div key={task.id} className="task-item">
                  {editingTask === task.id ? (
                    <form onSubmit={(e) => handleEditSubmit(e, task.id)} className="edit-form">
                      <div className="edit-input-group">
                        <input
                          name="taskName"
                          type="text"
                          defaultValue={task.name}
                          className="form-input"
                          required
                          autoFocus
                        />
                        <div className="edit-actions">
                          <button type="submit" className="btn btn-primary btn-sm">
                            Save
                          </button>
                          <button 
                            type="button" 
                            onClick={() => setEditingTask(null)}
                            className="btn btn-secondary btn-sm"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    </form>
                  ) : (
                    <>
                      <div className="task-content">
                        <div className="task-info">
                          <div className="task-name">
                            <Briefcase size={16} className="task-icon" />
                            {task.name}
                          </div>
                          <div className="task-stats">
                            <div className="stat-item">
                              <Clock size={14} />
                              <span>{task.usage_count || 0} entries</span>
                            </div>
                            <div className="stat-item">
                              <BarChart3 size={14} />
                              <span>{task.total_hours || 0}h total</span>
                            </div>
                            <div className="stat-item">
                              <Users size={14} />
                              <span>{task.unique_users || 0} users</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="task-actions">
                        <button
                          onClick={() => setEditingTask(task.id)}
                          className="btn btn-secondary btn-sm"
                          title="Edit task"
                        >
                          <Edit size={14} />
                        </button>
                        <button
                          onClick={() => handleDeleteTask(task.id, task.name)}
                          className="btn btn-danger btn-sm"
                          title="Delete task"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .csi-tasks-container {
          max-width: 1000px;
          margin: 0 auto;
        }

        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 1rem;
        }

        .add-task-form {
          background: var(--color-background-alt, #f9fafb);
          border: 1px solid var(--color-border, #e5e7eb);
          border-radius: var(--border-radius-md, 6px);
          padding: 1.5rem;
          margin-bottom: 2rem;
        }

        .form-actions {
          display: flex;
          gap: 0.75rem;
          margin-top: 1rem;
        }

        .empty-state {
          text-align: center;
          padding: 4rem 2rem;
          color: var(--color-text-secondary, #374151);
        }

        .empty-icon {
          color: var(--color-text-tertiary, #9ca3af);
          margin-bottom: 1rem;
        }

        .empty-title {
          font-size: 1.25rem;
          font-weight: 600;
          margin-bottom: 0.5rem;
        }

        .empty-message {
          font-size: 0.875rem;
        }

        .tasks-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .task-item {
          background: var(--color-surface, #ffffff);
          border: 1px solid var(--color-border, #e5e7eb);
          border-radius: var(--border-radius-md, 6px);
          padding: 1.25rem;
          transition: all 0.2s ease;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .task-item:hover {
          border-color: var(--color-border-hover, #d1d5db);
          box-shadow: var(--shadow-sm, 0 1px 2px 0 rgba(0,0,0,0.05));
        }

        .task-content {
          flex: 1;
        }

        .task-info {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .task-name {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 1rem;
          font-weight: 600;
          color: var(--color-text-primary, #111827);
        }

        .task-icon {
          color: var(--color-accent, #3b82f6);
        }

        .task-stats {
          display: flex;
          gap: 1.5rem;
          flex-wrap: wrap;
        }

        .stat-item {
          display: flex;
          align-items: center;
          gap: 0.25rem;
          font-size: 0.875rem;
          color: var(--color-text-secondary, #374151);
        }

        .stat-item svg {
          color: var(--color-text-tertiary, #9ca3af);
        }

        .task-actions {
          display: flex;
          gap: 0.5rem;
          align-items: center;
        }

        .edit-form {
          width: 100%;
        }

        .edit-input-group {
          display: flex;
          gap: 0.75rem;
          align-items: center;
        }

        .edit-input-group .form-input {
          flex: 1;
          margin-bottom: 0;
        }

        .edit-actions {
          display: flex;
          gap: 0.5rem;
        }

        .btn-sm {
          padding: 0.5rem;
          font-size: 0.75rem;
          min-width: auto;
        }

        .error-container {
          text-align: center;
          padding: 3rem;
        }

        .loading-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 3rem;
          gap: 1rem;
        }

        @media (max-width: 768px) {
          .card-header {
            flex-direction: column;
            align-items: stretch;
          }
          
          .task-item {
            flex-direction: column;
            align-items: stretch;
            gap: 1rem;
          }
          
          .task-actions {
            justify-content: flex-end;
          }
          
          .task-stats {
            gap: 1rem;
          }
          
          .edit-input-group {
            flex-direction: column;
            align-items: stretch;
          }
        }
      `}</style>
    </div>
  )
}

export default CSITasks 