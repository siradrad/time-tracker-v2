import React, { useState, useEffect } from 'react'
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom'
import { timeTrackerAPI } from './lib/supabase-real.js'
import Login from './components/Login.jsx'
import TimeTracker from './components/TimeTracker.jsx'
import JobAddresses from './components/JobAddresses.jsx'
import TimeEntries from './components/TimeEntries.jsx'
import Dashboard from './components/dashboard/Dashboard.jsx'
import CSITasks from './components/CSITasks.jsx'
import ReportPage from './components/ReportPage.jsx'
import { Clock, MapPin, List, BarChart3, LogOut, Settings, Briefcase, ChevronDown, Menu } from 'lucide-react'
import './App.css'

function App() {
  const [user, setUser] = useState(null)
  const [currentView, setCurrentView] = useState('timer')
  const [loading, setLoading] = useState(true)
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()

  // Check if this is a report page
  const isReportPage = location.pathname === '/report'

  // Set up global promise rejection handler
  useEffect(() => {
    const handleUnhandledRejection = (event) => {
      console.warn('Unhandled promise rejection:', event.reason);
      // Prevent the default browser handling (which would show the error in console)
      event.preventDefault();
    };

    // Add the event listener
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    // Clean up
    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  useEffect(() => {
    checkUser()
    
    // Simplified pull-to-refresh prevention for mobile
    let touchStartY = 0
    
    const handleTouchStart = (e) => {
      // Store initial touch position
      touchStartY = e.touches[0].clientY
    }
    
    const handleTouchMove = (e) => {
      // Skip if touching interactive elements (buttons, inputs, etc.)
      if (e.target.closest('button, a, input, select, textarea, .nav-list')) {
        return
      }
      
      // Simple pull-to-refresh prevention
      if (window.scrollY === 0 && e.touches[0].clientY > touchStartY + 5) {
        e.preventDefault()
      }
    }
    
    // Add event listeners
    document.addEventListener('touchstart', handleTouchStart, { passive: true })
    document.addEventListener('touchmove', handleTouchMove, { passive: false })
    
    // Cleanup
    return () => {
      document.removeEventListener('touchstart', handleTouchStart)
      document.removeEventListener('touchmove', handleTouchMove)
    }
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

  // Close mobile navigation when a view is selected
  useEffect(() => {
    setMobileNavOpen(false)
  }, [currentView])

  const checkUser = async () => {
    try {
      if (typeof timeTrackerAPI.restoreSession === 'function') {
        const currentUser = await timeTrackerAPI.restoreSession()
        setUser(currentUser)
      } else {
        console.error('restoreSession is not a function:', typeof timeTrackerAPI.restoreSession)
        console.error('timeTrackerAPI:', timeTrackerAPI)
      }
    } catch (error) {
      console.error('Error checking user:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSignOut = async () => {
    console.log('Sign out button clicked!')
    try {
      const result = await timeTrackerAPI.signOut()
      console.log('Sign out result:', result)
      
      if (result && result.error) {
        console.error('Sign out error:', result.error)
        alert('Error signing out: ' + (result.error.message || 'Unknown error'))
      } else {
        setUser(null)
        setCurrentView('timer')
        console.log('Sign out successful')
        // Force a page reload to ensure complete logout
        window.location.reload()
      }
    } catch (error) {
      console.error('Error signing out:', error)
      alert('Error signing out: ' + error.message)
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
        <p>Loading Payroll Optimizer...</p>
      </div>
    )
  }

  if (!user) {
    return <Login onLogin={setUser} />
  }

  // Different navigation items based on user role
  const getNavigationItems = () => {
    const baseItems = [
      { id: 'entries', label: 'Time Entries', mobileLabel: 'Entries', icon: List },
      { id: 'dashboard', label: 'Dashboard', mobileLabel: 'Dashboard', icon: BarChart3 },
      { id: 'addresses', label: 'Job Addresses', mobileLabel: 'Jobs', icon: MapPin },
    ]

    if (user.role === 'admin') {
      // Admin users don't get the timer - they manage data
      return [
        ...baseItems,
        { id: 'csi-tasks', label: 'CSI Tasks', mobileLabel: 'Tasks', icon: Briefcase }
      ]
    } else {
      // Regular users get the timer first
      return [
        { id: 'timer', label: 'Timer', mobileLabel: 'Timer', icon: Clock },
        ...baseItems
      ]
    }
  }

  const navigationItems = getNavigationItems()

  const renderCurrentView = () => {
    console.log('renderCurrentView called with:', currentView, 'user role:', user.role)
    switch (currentView) {
      case 'timer':
        // Only show timer for non-admin users
        return user.role !== 'admin' ? <TimeTracker user={user} /> : <Dashboard user={user} />
      case 'addresses':
        console.log('Rendering JobAddresses component')
        return <JobAddresses user={user} />
      case 'entries':
        return <TimeEntries user={user} />
      case 'dashboard':
        return <Dashboard user={user} />
      case 'csi-tasks':
        return <CSITasks user={user} />
      default:
        console.log('Hit default case in renderCurrentView')
        return user.role === 'admin' ? <Dashboard user={user} /> : <TimeTracker user={user} />
    }
  }

  // Get the current active view name
  const getCurrentViewName = () => {
    const currentItem = navigationItems.find(item => item.id === currentView)
    return currentItem ? currentItem.label : 'Dashboard'
  }

  return (
    <Routes>
      <Route path="/report" element={<ReportPage />} />
      <Route path="*" element={
        <div className="app">
          <header className="app-header">
            <div className="header-content">
              <div className="header-left">
                <h1 className="app-title">
                  <Clock className="title-icon" />
                  Payroll Optimizer
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
                    <span>Clear Data</span>
                  </button>
                )}
                <button 
                  onClick={handleSignOut} 
                  className="btn btn-outline"
                >
                  <LogOut size={16} />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          </header>

          <div className="app-body">
            <nav className="sidebar">
              {/* Mobile Navigation Toggle Button */}
              <button 
                className={`mobile-nav-toggle ${mobileNavOpen ? 'open' : ''}`}
                onClick={() => setMobileNavOpen(!mobileNavOpen)}
              >
                <div className="toggle-content">
                  <Menu size={20} />
                  <span>{getCurrentViewName()}</span>
                </div>
                <ChevronDown size={20} />
              </button>

              {/* Navigation List */}
              <ul className={`nav-list ${mobileNavOpen ? 'open' : ''}`}>
                {navigationItems.map((item) => {
                  const Icon = item.icon
                  
                  return (
                    <li key={item.id}>
                      <button
                        onClick={() => {
                          console.log('Nav button clicked:', item.id, 'label:', item.label);
                          setCurrentView(item.id)
                        }}
                        className={`nav-button ${currentView === item.id ? 'active' : ''}`}
                        data-nav-id={item.id}
                      >
                        <Icon size={20} />
                        <span className="desktop-label">{item.label}</span>
                        <span className="mobile-label">{item.mobileLabel}</span>
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