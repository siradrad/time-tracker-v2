import React, { useState, useEffect, useCallback } from 'react'
import { timeTrackerAPI } from '../lib/supabase-real.js'
import { Play, Pause, Square, Clock, MapPin, Briefcase, FileText, Save, Car, Coffee } from 'lucide-react'

function TimeTracker({ user }) {
  const [isRunning, setIsRunning] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [startTime, setStartTime] = useState(null)
  const [pausedTime, setPausedTime] = useState(0) // Total paused duration
  const [currentTime, setCurrentTime] = useState(0)
  
  // Quick action timers
  const [travelTimer, setTravelTimer] = useState({
    isRunning: false,
    isPaused: false,
    startTime: null,
    pausedTime: 0,
    currentTime: 0
  })
  
  const [breakTimer, setBreakTimer] = useState({
    isRunning: false,
    isPaused: false,
    startTime: null,
    pausedTime: 0,
    currentTime: 0
  })
  
  const [selectedJobAddress, setSelectedJobAddress] = useState('')
  const [selectedTask, setSelectedTask] = useState('')
  const [notes, setNotes] = useState('')
  const [jobAddresses, setJobAddresses] = useState([])
  const [csiTasks, setCsiTasks] = useState([])
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  // Load job addresses and CSI tasks on component mount
  useEffect(() => {
    loadJobAddresses()
    loadCSITasks()
  }, [user.id])

  // Main timer effect
  useEffect(() => {
    let interval = null
    
    if (isRunning && !isPaused && startTime) {
      interval = setInterval(() => {
        setCurrentTime(Date.now() - startTime - pausedTime)
      }, 100)
    }
    
    return () => {
      if (interval) {
        clearInterval(interval)
      }
    }
  }, [isRunning, isPaused, startTime, pausedTime])

  // Travel timer effect
  useEffect(() => {
    let interval = null
    
    if (travelTimer.isRunning && !travelTimer.isPaused && travelTimer.startTime) {
      interval = setInterval(() => {
        setTravelTimer(prev => ({
          ...prev,
          currentTime: Date.now() - prev.startTime - prev.pausedTime
        }))
      }, 100)
    }
    
    return () => {
      if (interval) {
        clearInterval(interval)
      }
    }
  }, [travelTimer.isRunning, travelTimer.isPaused, travelTimer.startTime, travelTimer.pausedTime])

  // Break timer effect
  useEffect(() => {
    let interval = null
    
    if (breakTimer.isRunning && !breakTimer.isPaused && breakTimer.startTime) {
      interval = setInterval(() => {
        setBreakTimer(prev => ({
          ...prev,
          currentTime: Date.now() - prev.startTime - prev.pausedTime
        }))
      }, 100)
    }
    
    return () => {
      if (interval) {
        clearInterval(interval)
      }
    }
  }, [breakTimer.isRunning, breakTimer.isPaused, breakTimer.startTime, breakTimer.pausedTime])

  const loadJobAddresses = useCallback(async () => {
    try {
      const response = await timeTrackerAPI.getJobAddresses(user.id)
      if (response.error) {
        console.error('Error loading job addresses:', response.error)
      } else {
        setJobAddresses(response.data || [])
      }
    } catch (err) {
      console.error('Error loading job addresses:', err)
    }
  }, [user.id])

  const loadCSITasks = useCallback(async () => {
    try {
      const response = await timeTrackerAPI.getAvailableCSITasks()
      if (response.error) {
        console.error('Error loading CSI tasks:', response.error)
      } else {
        setCsiTasks(response.data || [])
      }
    } catch (err) {
      console.error('Error loading CSI tasks:', err)
    }
  }, [])

  const formatTime = (milliseconds) => {
    const totalSeconds = Math.floor(milliseconds / 1000)
    const hours = Math.floor(totalSeconds / 3600)
    const minutes = Math.floor((totalSeconds % 3600) / 60)
    const seconds = totalSeconds % 60
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  }

  const handleStart = () => {
    if (!selectedJobAddress || !selectedTask) {
      setError('Please select both a job address and task before starting the timer.')
      return
    }
    
    setError('')
    const now = Date.now()
    
    if (isPaused) {
      // Resume from pause
      setPausedTime(prev => prev + (now - startTime))
      setIsPaused(false)
      setIsRunning(true)
      setStartTime(now)
    } else {
      // Fresh start
      setStartTime(now)
      setPausedTime(0)
      setCurrentTime(0)
      setIsRunning(true)
      setIsPaused(false)
    }
  }

  const handlePause = () => {
    if (isRunning) {
      setIsPaused(true)
      setIsRunning(false)
    }
  }

  const handleStop = async () => {
    if (!startTime) return
    
    const endTime = Date.now()
    const totalDuration = Math.floor((endTime - startTime - pausedTime) / 1000) // Duration in seconds
    
    if (totalDuration < 1) {
      setError('Timer must run for at least 1 second to save an entry.')
      handleReset()
      return
    }

    setSaving(true)
    setError('')

    try {
      const timeEntry = {
        startTime: new Date(startTime).toISOString(),
        endTime: new Date(endTime).toISOString(),
        duration: totalDuration,
        jobAddress: selectedJobAddress,
        task: selectedTask,
        notes: notes.trim(),
        date: new Date().toISOString().split('T')[0] // YYYY-MM-DD format
      }

      const response = await timeTrackerAPI.addTimeEntry(user.id, timeEntry)
      
      if (response.error) {
        setError('Failed to save time entry: ' + response.error.message)
      } else {
        // Reset the timer
        handleReset()
        // Clear notes but keep job address and task for convenience
        setNotes('')
      }
    } catch (err) {
      setError('Failed to save time entry. Please try again.')
      console.error('Error saving time entry:', err)
    } finally {
      setSaving(false)
    }
  }

  const handleReset = () => {
    setIsRunning(false)
    setIsPaused(false)
    setStartTime(null)
    setPausedTime(0)
    setCurrentTime(0)
  }

  // Quick action handlers
  const handleTravelStart = () => {
    setError('')
    const now = Date.now()
    
    // Pause break timer if it's running
    if (breakTimer.isRunning) {
      handleBreakPause()
    }
    
    if (travelTimer.isPaused) {
      setTravelTimer(prev => ({
        ...prev,
        pausedTime: prev.pausedTime + (now - prev.startTime),
        isPaused: false,
        isRunning: true,
        startTime: now
      }))
    } else {
      setTravelTimer({
        startTime: now,
        pausedTime: 0,
        currentTime: 0,
        isRunning: true,
        isPaused: false
      })
    }
  }

  const handleTravelPause = () => {
    setTravelTimer(prev => ({
      ...prev,
      isPaused: true,
      isRunning: false
    }))
  }

  const handleTravelStop = async () => {
    if (!travelTimer.startTime) return
    
    const endTime = Date.now()
    const totalDuration = Math.floor((endTime - travelTimer.startTime - travelTimer.pausedTime) / 1000)
    
    if (totalDuration < 1) {
      setError('Timer must run for at least 1 second to save an entry.')
      handleTravelReset()
      return
    }

    setSaving(true)
    setError('')

    try {
      const timeEntry = {
        startTime: new Date(travelTimer.startTime).toISOString(),
        endTime: new Date(endTime).toISOString(),
        duration: totalDuration,
        jobAddress: 'Travel',
        task: 'Travel Time',
        notes: 'Travel time entry',
        date: new Date().toISOString().split('T')[0]
      }

      const response = await timeTrackerAPI.addTimeEntry(user.id, timeEntry)
      
      if (response.error) {
        setError('Failed to save travel entry: ' + response.error.message)
      } else {
        handleTravelReset()
      }
    } catch (err) {
      setError('Failed to save travel entry. Please try again.')
      console.error('Error saving travel entry:', err)
    } finally {
      setSaving(false)
    }
  }

  const handleTravelReset = () => {
    setTravelTimer({
      isRunning: false,
      isPaused: false,
      startTime: null,
      pausedTime: 0,
      currentTime: 0
    })
  }

  const handleBreakStart = () => {
    setError('')
    const now = Date.now()
    
    // Pause travel timer if it's running
    if (travelTimer.isRunning) {
      handleTravelPause()
    }
    
    if (breakTimer.isPaused) {
      setBreakTimer(prev => ({
        ...prev,
        pausedTime: prev.pausedTime + (now - prev.startTime),
        isPaused: false,
        isRunning: true,
        startTime: now
      }))
    } else {
      setBreakTimer({
        startTime: now,
        pausedTime: 0,
        currentTime: 0,
        isRunning: true,
        isPaused: false
      })
    }
  }

  const handleBreakPause = () => {
    setBreakTimer(prev => ({
      ...prev,
      isPaused: true,
      isRunning: false
    }))
  }

  const handleBreakStop = async () => {
    if (!breakTimer.startTime) return
    
    const endTime = Date.now()
    const totalDuration = Math.floor((endTime - breakTimer.startTime - breakTimer.pausedTime) / 1000)
    
    if (totalDuration < 1) {
      setError('Timer must run for at least 1 second to save an entry.')
      handleBreakReset()
      return
    }

    setSaving(true)
    setError('')

    try {
      const timeEntry = {
        startTime: new Date(breakTimer.startTime).toISOString(),
        endTime: new Date(endTime).toISOString(),
        duration: totalDuration,
        jobAddress: 'Break/Lunch',
        task: 'Break/Lunch Time',
        notes: 'Break/lunch time entry',
        date: new Date().toISOString().split('T')[0]
      }

      const response = await timeTrackerAPI.addTimeEntry(user.id, timeEntry)
      
      if (response.error) {
        setError('Failed to save break entry: ' + response.error.message)
      } else {
        handleBreakReset()
      }
    } catch (err) {
      setError('Failed to save break entry. Please try again.')
      console.error('Error saving break entry:', err)
    } finally {
      setSaving(false)
    }
  }

  const handleBreakReset = () => {
    setBreakTimer({
      isRunning: false,
      isPaused: false,
      startTime: null,
      pausedTime: 0,
      currentTime: 0
    })
  }

  // Check if any quick action timer is active
  const isQuickActionActive = () => {
    return (travelTimer.isRunning || travelTimer.isPaused || breakTimer.isRunning || breakTimer.isPaused)
  }

  return (
    <div className="time-tracker-container">
      <div className="timer-card card">
        <div className="card-header">
          <h2 className="card-title">
            <Clock size={24} />
            Payroll Optimizer
          </h2>
        </div>
        <div className="card-content">
          {error && (
            <div className="error-message" style={{ marginBottom: '1rem' }}>
              {error}
            </div>
          )}

          <div className="timer-display">
            <div className="time-text">
              {formatTime(currentTime)}
            </div>
            <div className="timer-status">
              {isQuickActionActive() ? (
                <span className="status-disabled">⏸ Paused for {travelTimer.isRunning || travelTimer.isPaused ? 'Travel' : 'Break/Lunch'}</span>
              ) : isRunning ? (
                <span className="status-running">● Recording</span>
              ) : isPaused ? (
                <span className="status-paused">⏸ Paused</span>
              ) : (
                <span className="status-stopped">⏹ Stopped</span>
              )}
            </div>
          </div>

          <div className="timer-controls">
            {!isRunning && !isPaused && !isQuickActionActive() && (
              <button 
                onClick={handleStart} 
                className="btn btn-success timer-btn"
                disabled={saving}
              >
                <Play size={20} />
                Start Timer
              </button>
            )}
            
            {isRunning && !isQuickActionActive() && (
              <button 
                onClick={handlePause} 
                className="btn btn-secondary timer-btn"
              >
                <Pause size={20} />
                Pause
              </button>
            )}
            
            {isPaused && !isQuickActionActive() && (
              <button 
                onClick={handleStart} 
                className="btn btn-success timer-btn"
              >
                <Play size={20} />
                Resume
              </button>
            )}
            
            {(isRunning || isPaused) && !isQuickActionActive() && (
              <button 
                onClick={handleStop} 
                className="btn btn-primary timer-btn"
                disabled={saving}
              >
                <Save size={20} />
                {saving ? 'Saving...' : 'Stop & Save'}
              </button>
            )}

            {(isRunning || isPaused) && !isQuickActionActive() && (
              <button 
                onClick={handleReset} 
                className="btn btn-danger timer-btn"
              >
                <Square size={20} />
                Reset
              </button>
            )}

            {isQuickActionActive() && (
              <div className="timer-disabled-message">
                <p>Main timer is paused while {travelTimer.isRunning || travelTimer.isPaused ? 'Travel' : 'Break/Lunch'} timer is active.</p>
                <p>Stop and save the {travelTimer.isRunning || travelTimer.isPaused ? 'Travel' : 'Break/Lunch'} timer to resume work tracking.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Action Timers */}
      <div className="quick-actions-grid">
        {/* Travel Timer */}
        <div className="quick-timer-card card">
          <div className="card-header">
            <h3 className="card-title">
              <Car />
              Travel Timer
            </h3>
          </div>
          <div className="card-content">
            <div className="quick-timer-display">
              <div className="quick-time-text">
                {formatTime(travelTimer.currentTime)}
              </div>
              <div className="quick-timer-status">
                {travelTimer.isRunning ? (
                  <span className="status-running">● Recording Travel</span>
                ) : travelTimer.isPaused ? (
                  <span className="status-paused">⏸ Paused</span>
                ) : isRunning ? (
                  <span className="status-disabled">⏸ Disabled (Work Active)</span>
                ) : breakTimer.isRunning || breakTimer.isPaused ? (
                  <span className="status-disabled">⏸ Disabled (Break Active)</span>
                ) : (
                  <span className="status-stopped">⏹ Stopped</span>
                )}
              </div>
            </div>
            
            <div className="quick-timer-controls">
              {!travelTimer.isRunning && !travelTimer.isPaused && !isRunning && !breakTimer.isRunning && !breakTimer.isPaused && (
                <button 
                  onClick={handleTravelStart} 
                  className="btn btn-success quick-btn"
                  disabled={saving}
                >
                  <Play size={16} />
                  Start Travel
                </button>
              )}
              
              {travelTimer.isRunning && (
                <button 
                  onClick={handleTravelPause} 
                  className="btn btn-secondary quick-btn"
                >
                  <Pause size={16} />
                  Pause
                </button>
              )}
              
              {travelTimer.isPaused && !isRunning && !breakTimer.isRunning && !breakTimer.isPaused && (
                <button 
                  onClick={handleTravelStart} 
                  className="btn btn-success quick-btn"
                >
                  <Play size={16} />
                  Resume
                </button>
              )}
              
              {(travelTimer.isRunning || travelTimer.isPaused) && (
                <>
                  <button 
                    onClick={handleTravelStop} 
                    className="btn btn-primary quick-btn"
                    disabled={saving}
                  >
                    <Save size={16} />
                    {saving ? 'Saving...' : 'Stop & Save'}
                  </button>
                  
                  <button 
                    onClick={handleTravelReset} 
                    className="btn btn-danger quick-btn"
                  >
                    <Square size={16} />
                    Reset
                  </button>
                </>
              )}

              {isRunning ? (
                <div className="timer-disabled-message">
                  <p>Travel timer disabled while work timer is active.</p>
                </div>
              ) : breakTimer.isRunning || breakTimer.isPaused ? (
                <div className="timer-disabled-message">
                  <p>Travel timer disabled while Break/Lunch is active.</p>
                </div>
              ) : null}
            </div>
          </div>
        </div>

        {/* Break/Lunch Timer */}
        <div className="quick-timer-card card">
          <div className="card-header">
            <h3 className="card-title">
              <Coffee />
              Break/Lunch Timer
            </h3>
          </div>
          <div className="card-content">
            <div className="quick-timer-display">
              <div className="quick-time-text">
                {formatTime(breakTimer.currentTime)}
              </div>
              <div className="quick-timer-status">
                {breakTimer.isRunning ? (
                  <span className="status-running">● Recording Break</span>
                ) : breakTimer.isPaused ? (
                  <span className="status-paused">⏸ Paused</span>
                ) : isRunning ? (
                  <span className="status-disabled">⏸ Disabled (Work Active)</span>
                ) : travelTimer.isRunning || travelTimer.isPaused ? (
                  <span className="status-disabled">⏸ Disabled (Travel Active)</span>
                ) : (
                  <span className="status-stopped">⏹ Stopped</span>
                )}
              </div>
            </div>
            
            <div className="quick-timer-controls">
              {!breakTimer.isRunning && !breakTimer.isPaused && !isRunning && !travelTimer.isRunning && !travelTimer.isPaused && (
                <button 
                  onClick={handleBreakStart} 
                  className="btn btn-success quick-btn"
                  disabled={saving}
                >
                  <Play size={16} />
                  Start Break
                </button>
              )}
              
              {breakTimer.isRunning && (
                <button 
                  onClick={handleBreakPause} 
                  className="btn btn-secondary quick-btn"
                >
                  <Pause size={16} />
                  Pause
                </button>
              )}
              
              {breakTimer.isPaused && !isRunning && !travelTimer.isRunning && !travelTimer.isPaused && (
                <button 
                  onClick={handleBreakStart} 
                  className="btn btn-success quick-btn"
                >
                  <Play size={16} />
                  Resume
                </button>
              )}
              
              {(breakTimer.isRunning || breakTimer.isPaused) && (
                <>
                  <button 
                    onClick={handleBreakStop} 
                    className="btn btn-primary quick-btn"
                    disabled={saving}
                  >
                    <Save size={16} />
                    {saving ? 'Saving...' : 'Stop & Save'}
                  </button>
                  
                  <button 
                    onClick={handleBreakReset} 
                    className="btn btn-danger quick-btn"
                  >
                    <Square size={16} />
                    Reset
                  </button>
                </>
              )}

              {isRunning ? (
                <div className="timer-disabled-message">
                  <p>Break/Lunch timer disabled while work timer is active.</p>
                </div>
              ) : travelTimer.isRunning || travelTimer.isPaused ? (
                <div className="timer-disabled-message">
                  <p>Break/Lunch timer disabled while Travel is active.</p>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      <div className="timer-form card">
        <div className="card-header">
          <h3 className="card-title">
            <Briefcase />
            Time Entry Details
          </h3>
        </div>
        <div className="card-content">
          <div className="form-group">
            <label className="form-label">
              <MapPin size={16} />
              Job Address
            </label>
            <select
              value={selectedJobAddress}
              onChange={(e) => setSelectedJobAddress(e.target.value)}
              className="form-select"
              required
            >
              <option value="">Select a job address...</option>
              {jobAddresses.map((address) => (
                <option key={address.id} value={address.address}>
                  {address.address}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">
              <Briefcase size={16} />
              CSI Division / Task
            </label>
            <select
              value={selectedTask}
              onChange={(e) => setSelectedTask(e.target.value)}
              className="form-select"
              required
            >
              <option value="">Select a CSI division...</option>
              {csiTasks.map((task) => (
                <option key={task} value={task}>
                  {task}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">
              <FileText size={16} />
              Notes (Optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="form-textarea"
              placeholder="Add notes about this time entry..."
              rows={3}
            />
          </div>
        </div>
      </div>

      <style jsx>{`
        .time-tracker-container {
          display: grid;
          gap: 2rem;
          max-width: 800px;
          margin: 0 auto;
        }

        .timer-display {
          text-align: center;
          margin-bottom: 2rem;
          padding: 2rem;
          background: var(--color-surface, #ffffff);
          border-radius: var(--border-radius-lg, 8px);
          border: 1px solid var(--color-border, #e5e7eb);
        }

        .time-text {
          font-size: 4rem;
          font-weight: 700;
          font-family: 'Monaco', 'Menlo', monospace;
          color: var(--color-text-primary, #111827);
          margin-bottom: 0.5rem;
          letter-spacing: 0.1em;
        }

        .status-text {
          font-size: 1.125rem;
          font-weight: 500;
        }

        .status-running {
          color: var(--color-success, #10b981);
        }

        .status-paused {
          color: var(--color-warning, #f59e0b);
        }

        .status-stopped {
          color: var(--color-text-secondary, #374151);
        }

        .status-disabled {
          color: var(--color-warning, #f59e0b);
          font-style: italic;
        }

        .timer-controls {
          display: flex;
          justify-content: center;
          gap: 1rem;
          flex-wrap: wrap;
        }

        .timer-btn {
          min-width: 140px;
          padding: 0.875rem 1.5rem;
          font-size: 1rem;
          font-weight: 600;
        }

        /* Quick Action Timers */
        .quick-actions-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.5rem;
        }

        .quick-timer-card {
          background: var(--color-surface, #ffffff);
          border: 1px solid var(--color-border, #e5e7eb);
          border-radius: var(--border-radius-md, 6px);
          overflow: hidden;
        }

        .quick-timer-display {
          text-align: center;
          padding: 1.5rem 1rem;
          background: var(--color-background-alt, #f9fafb);
          border-bottom: 1px solid var(--color-border, #e5e7eb);
        }

        .quick-time-text {
          font-size: 2rem;
          font-weight: 700;
          font-family: 'Monaco', 'Menlo', monospace;
          color: var(--color-text-primary, #111827);
          margin-bottom: 0.5rem;
          letter-spacing: 0.05em;
        }

        .quick-timer-status {
          font-size: 0.875rem;
          font-weight: 500;
        }

        .quick-timer-controls {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          padding: 1rem;
        }

        .quick-btn {
          width: 100%;
          padding: 0.75rem 1rem;
          font-size: 0.875rem;
          font-weight: 600;
          min-width: auto;
        }

        .timer-disabled-message {
          text-align: center;
          padding: 1rem;
          background: var(--color-warning-soft, #fef3c7);
          border: 1px solid var(--color-warning, #f59e0b);
          border-radius: var(--border-radius-md, 6px);
          margin-top: 1rem;
        }

        .timer-disabled-message p {
          margin: 0;
          font-size: 0.875rem;
          color: var(--color-warning-dark, #92400e);
        }

        .timer-disabled-message p:first-child {
          font-weight: 600;
          margin-bottom: 0.5rem;
        }

        @media (max-width: 640px) {
          .time-text {
            font-size: 2.5rem;
          }
          
          .timer-controls {
            flex-direction: column;
            align-items: center;
          }
          
          .timer-btn {
            width: 100%;
            max-width: 200px;
          }

          .quick-actions-grid {
            grid-template-columns: 1fr;
            gap: 1rem;
          }

          .quick-time-text {
            font-size: 1.75rem;
          }
        }
      `}</style>
    </div>
  )
}

export default TimeTracker 