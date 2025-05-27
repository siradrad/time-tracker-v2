import React, { useState, useEffect } from 'react';
import { timeTrackerAPI } from '../lib/supabase-real.js';

export default function TimeEntryModal({
  isOpen,
  onClose,
  onSave,
  entry = {},
  users = [],
  jobs = [],
  tasks = [],
  mode = 'add',
  currentUser,
}) {
  const [userId, setUserId] = useState((entry && entry.user_id) || (users[0] && users[0].id) || '');
  const [date, setDate] = useState((entry && entry.date) || '');
  const [startTime, setStartTime] = useState((entry && entry.start_time) ? new Date(entry.start_time).toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }) : '');
  const [endTime, setEndTime] = useState((entry && entry.end_time) ? new Date(entry.end_time).toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }) : '');
  const [jobAddress, setJobAddress] = useState((entry && entry.job_address) || (jobs[0] && jobs[0].address) || '');
  const [task, setTask] = useState((entry && entry.csi_division) || tasks[0] || '');
  const [notes, setNotes] = useState((entry && entry.notes) || '');
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setUserId((entry && entry.user_id) || (users[0] && users[0].id) || '');
      setDate((entry && entry.date) || '');
      setStartTime((entry && entry.start_time) ? new Date(entry.start_time).toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }) : '');
      setEndTime((entry && entry.end_time) ? new Date(entry.end_time).toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }) : '');
      setJobAddress((entry && entry.job_address) || (jobs[0] && jobs[0].address) || '');
      setTask((entry && entry.csi_division) || tasks[0] || '');
      setNotes((entry && entry.notes) || '');
      setError('');
    }
  }, [isOpen, entry, users, jobs, tasks]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    const selectedUserId = userId || (entry && entry.user_id) || (users[0] && users[0].id) || '';
    if (!selectedUserId) return setError('User is required.');
    if (!date) return setError('Date is required.');
    if (!startTime) return setError('Start time is required.');
    if (!endTime) return setError('End time is required.');
    if (!jobAddress) return setError('Job address is required.');
    if (!task) return setError('Task is required.');
    // Calculate duration in seconds
    // Create dates in local time
    const start = new Date(`${date}T${startTime}:00`);
    const end = new Date(`${date}T${endTime}:00`);
    const duration = Math.floor((end - start) / 1000);
    if (isNaN(duration) || duration <= 0) return setError('End time must be after start time.');
    
    // Convert to ISO strings (JavaScript automatically handles UTC conversion)
    const startUTC = start.toISOString();
    const endUTC = end.toISOString();
    
    onSave({
      user_id: selectedUserId,
      date,
      startTime: startUTC,
      endTime: endUTC,
      duration,
      jobAddress,
      task,
      notes: notes.trim(),
    });
  };

  const handleBackgroundClick = (e) => {
    if (e.target.classList.contains('modal-backdrop')) {
      onClose();
    }
  };

  return (
    <div className="modal-backdrop" onClick={handleBackgroundClick} style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.3)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="modal" style={{ background: '#fff', borderRadius: 8, maxWidth: 400, width: '100%', boxShadow: '0 4px 24px rgba(0,0,0,0.12)', padding: 24, position: 'relative' }}>
        <h2 style={{ marginBottom: 16 }}>{mode === 'edit' ? 'Edit Time Entry' : 'Add Time Entry'}</h2>
        <form onSubmit={handleSubmit}>
          {users.length > 0 && currentUser?.role === 'admin' && (
            <div className="form-group">
              <label>User</label>
              <select value={userId} onChange={e => setUserId(e.target.value)} required className="form-select">
                <option value="">Select user...</option>
                {users.map(u => (
                  <option key={u.id} value={u.id}>{u.name || u.username}</option>
                ))}
              </select>
            </div>
          )}
          <div className="form-group">
            <label>Date</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)} required className="form-input" />
          </div>
          <div className="form-group">
            <label>Start Time</label>
            <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} required className="form-input" />
          </div>
          <div className="form-group">
            <label>End Time</label>
            <input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} required className="form-input" />
          </div>
          <div className="form-group">
            <label>Job Address</label>
            <select value={jobAddress} onChange={e => setJobAddress(e.target.value)} required className="form-select">
              <option value="">Select job address...</option>
              {jobs.map(j => (
                <option key={j.id || j.address} value={j.address}>{j.address}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Task</label>
            <select value={task} onChange={e => setTask(e.target.value)} required className="form-select">
              <option value="">Select task...</option>
              {tasks.map((t, index) => (
                <option key={`task-${index}-${t}`} value={t}>{t}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Notes</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} className="form-textarea" rows={2} placeholder="Optional" />
          </div>
          {error && <div style={{ color: 'red', marginBottom: 8 }}>{error}</div>}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary">Save</button>
          </div>
        </form>
      </div>
    </div>
  );
} 