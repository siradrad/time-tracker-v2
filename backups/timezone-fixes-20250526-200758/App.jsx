import React, { useState, useEffect } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import { timeTrackerAPI } from './lib/supabase-real.js'
import Login from './components/Login.jsx'
import TimeTracker from './components/TimeTracker.jsx'
import JobAddresses from './components/JobAddresses.jsx'
import TimeEntries from './components/TimeEntries.jsx'
import Dashboard from './components/Dashboard.jsx'
import CSITasks from './components/CSITasks.jsx'
import ReportPage from './components/ReportPage.jsx'
import { Clock, MapPin, List, BarChart3, LogOut, Settings, Briefcase } from 'lucide-react'
import './App.css'

function App() {
  const [user, setUser] = useState(null)
  const [currentView, setCurrentView] = useState('timer')
  const [loading, setLoading] = useState(true)
  const location = useLocation()

  // Check if this is a report page
  const isReportPage = location.pathname === '/report'

  useEffect(() => {
    checkUser()
  }, [])

  useEffect(() => {
    // Set default view based on user role
    if (user) {
      if (user.role === 'admin') {
        setCurrentView('dashboard')
      } else {
        setCurrentView('timer')
      }
    }
  }, [user])

  const checkUser = async () => {
    try {
      const currentUser = await timeTrackerAPI.getCurrentUser()
      setUser(currentUser)
    } catch (error) {
      console.error('Error checking user:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSignOut = async () => {
    try {
      await timeTrackerAPI.signOut()
      setUser(null)
      setCurrentView('timer')
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  const clearAllData = async () => {
    if (window.confirm('Are you sure you want to clear all data? This action cannot be undone.')) {
      try {
        await timeTrackerAPI.clearAllData()
        setUser(null)
        setCurrentView('timer')
        alert('All data cleared successfully.')
      } catch (error) {
        console.error('Error clearing data:', error)
      }
    }
  }

  // If this is a report page, render it directly without authentication
  if (isReportPage) {
    return (
      <Routes>
        <Route path="/report" element={<ReportPage />} />
      </Routes>
    )
  }

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading Time Tracker...</p>
      </div>
    )
  }

  if (!user) {
    return <Login onLogin={setUser} />
  }

  // Different navigation items based on user role
  const getNavigationItems = () => {
    const baseItems = [
      { id: 'entries', label: 'Time Entries', icon: List },
      { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
      { id: 'addresses', label: 'Job Addresses', icon: MapPin },
    ]

    if (user.role === 'admin') {
      // Admin users don't get the timer - they manage data
      return [
        ...baseItems,
        { id: 'csi-tasks', label: 'CSI Tasks', icon: Briefcase }
      ]
    } else {
      // Regular users get the timer first
      return [
        { id: 'timer', label: 'Timer', icon: Clock },
        ...baseItems
      ]
    }
  }

  const navigationItems = getNavigationItems()

  const renderCurrentView = () => {
    switch (currentView) {
      case 'timer':
        // Only show timer for non-admin users
        return user.role !== 'admin' ? <TimeTracker user={user} /> : <Dashboard user={user} />
      case 'addresses':
        return <JobAddresses user={user} />
      case 'entries':
        return <TimeEntries user={user} />
      case 'dashboard':
        return <Dashboard user={user} />
      case 'csi-tasks':
        return <CSITasks user={user} />
      default:
        return user.role === 'admin' ? <Dashboard user={user} /> : <TimeTracker user={user} />
    }
  }

  return (
    <Routes>
      <Route path="/report" element={<ReportPage />} />
      <Route path="/*" element={
        <div className="app">
          <header className="app-header">
            <div className="header-content">
              <div className="header-left">
                <h1 className="app-title">
                  <Clock className="title-icon" />
                  Time Tracker V2
                </h1>
                <span className="user-info">Welcome, {user.name}!</span>
              </div>
              <div className="header-right">
                {user.role === 'admin' && (
                  <button 
                    onClick={clearAllData}
                    className="btn btn-outline"
                    title="Clear all data (Admin only)"
                  >
                    <Settings size={16} />
                    Clear Data
                  </button>
                )}
                <button onClick={handleSignOut} className="btn btn-outline">
                  <LogOut size={16} />
                  Sign Out
                </button>
              </div>
            </div>
          </header>

          <div className="app-body">
            <nav className="sidebar">
              <ul className="nav-list">
                {navigationItems.map((item) => {
                  const Icon = item.icon
                  return (
                    <li key={item.id}>
                      <button
                        onClick={() => {
                          console.log('Nav button clicked:', item.id);
                          setCurrentView(item.id)
                        }}
                        className={`nav-button ${currentView === item.id ? 'active' : ''}`}
                      >
                        <Icon size={20} />
                        <span>{item.label}</span>
                      </button>
                    </li>
                  )
                })}
              </ul>
            </nav>

            <main className="main-content">
              {renderCurrentView()}
            </main>
          </div>
        </div>
      } />
    </Routes>
  )
}

export default App 