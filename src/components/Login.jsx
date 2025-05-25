import React, { useState, useEffect } from 'react'
import { timeTrackerAPI } from '../lib/supabase.js'
import { Clock, User, Lock, Mail, UserPlus, LogIn } from 'lucide-react'

function Login({ onLogin }) {
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [lastUser, setLastUser] = useState(null)

  const testAccounts = [
    { email: 'admin@timetracker.app', password: 'admin123', name: 'System Admin', role: 'admin' },
    { email: 'stacy@timetracker.app', password: 'stacy123', name: 'Stacy', role: 'user' },
    { email: 'jeremy@timetracker.app', password: 'jeremy123', name: 'Jeremy', role: 'user' }
  ]

  useEffect(() => {
    // Check for last logged-in user
    const lastUserEmail = localStorage.getItem('lastUserEmail')
    console.log('lastUserEmail from localStorage:', lastUserEmail)
    if (lastUserEmail) {
      const user = testAccounts.find(acc => acc.email === lastUserEmail)
      console.log('lastUser found:', user)
      if (user) setLastUser(user)
    }
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    console.log('handleSubmit called with:', { email, password, name, isSignUp })

    try {
      let response
      if (isSignUp) {
        response = await timeTrackerAPI.signUp(email, password, name)
      } else {
        response = await timeTrackerAPI.signIn(email, password)
      }
      console.log('Login response:', response)
      console.log('Login response data:', response.data)

      if (response.error) {
        setError(response.error.message)
      } else {
        const userEmail = response.data.user?.email || response.data.email || ''
        localStorage.setItem('lastUserEmail', userEmail)
        console.log('Set lastUserEmail in localStorage:', userEmail)
        onLogin(response.data.user || response.data)
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.')
      console.error('Auth error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleTestLogin = async (testEmail, testPassword) => {
    setLoading(true)
    setError('')
    console.log('handleTestLogin called with:', { testEmail, testPassword })

    try {
      const response = await timeTrackerAPI.signIn(testEmail, testPassword)
      console.log('Test login response:', response)
      console.log('Test login response data:', response.data)
      if (response.error) {
        setError(response.error.message)
      } else {
        const userEmail = response.data.user?.email || response.data.email || ''
        localStorage.setItem('lastUserEmail', userEmail)
        console.log('Set lastUserEmail in localStorage:', userEmail)
        onLogin(response.data.user || response.data)
      }
    } catch (err) {
      setError('Failed to login with test account')
      console.error('Test login error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleQuickLogin = () => {
    if (lastUser) {
      handleTestLogin(lastUser.email, lastUser.password)
    }
  }

  return (
    <div className="login-container">
      <div className="login-content">
        <div className="login-header">
          <div className="login-logo">
            <Clock size={48} className="logo-icon" />
            <h1>Time Tracker V2</h1>
          </div>
          <p className="login-subtitle">
            Track your time efficiently with our improved local storage system
          </p>
        </div>

        <div className="login-form-container">
          <form onSubmit={handleSubmit} className="login-form">
            <div className="form-toggle">
              <button
                type="button"
                onClick={() => setIsSignUp(false)}
                className={`toggle-btn ${!isSignUp ? 'active' : ''}`}
              >
                <LogIn size={16} />
                Sign In
              </button>
              <button
                type="button"
                onClick={() => setIsSignUp(true)}
                className={`toggle-btn ${isSignUp ? 'active' : ''}`}
              >
                <UserPlus size={16} />
                Sign Up
              </button>
            </div>

            {error && (
              <div className="error-message">
                {error}
              </div>
            )}

            {isSignUp && (
              <div className="form-group">
                <label htmlFor="name" className="form-label">
                  <User size={16} />
                  Full Name
                </label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="form-input"
                  placeholder="Enter your full name"
                  required
                />
              </div>
            )}

            <div className="form-group">
              <label htmlFor="email" className="form-label">
                <Mail size={16} />
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="form-input"
                placeholder="Enter your email"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="password" className="form-label">
                <Lock size={16} />
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="form-input"
                placeholder="Enter your password"
                required
              />
            </div>

            <button 
              type="submit" 
              className="btn btn-primary login-submit"
              disabled={loading}
            >
              {loading ? 'Please wait...' : (isSignUp ? 'Create Account' : 'Sign In')}
            </button>
          </form>

          {/* Quick Login for last user */}
          {lastUser ? (
            <div className="quick-login">
              <button
                onClick={handleQuickLogin}
                className="btn btn-primary"
                disabled={loading}
                style={{ width: '100%', marginTop: '1rem' }}
              >
                Quick Login as {lastUser.name}
              </button>
            </div>
          ) : (
            <div className="test-accounts">
              <h3>Test Accounts</h3>
              <p className="test-accounts-note">
                Click any test account below to login instantly
              </p>
              <div className="test-accounts-grid">
                {testAccounts.map((account) => (
                  <button
                    key={account.email}
                    onClick={() => handleTestLogin(account.email, account.password)}
                    className="test-account-card"
                    disabled={loading}
                  >
                    <div className="test-account-role">
                      {account.role === 'admin' ? '👑' : '👤'} {account.role}
                    </div>
                    <div className="test-account-name">{account.name}</div>
                    <div className="test-account-email">{account.email}</div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .login-container {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background-color: var(--color-background-alt, #f9fafb);
          padding: 2rem;
        }

        .login-content {
          width: 100%;
          max-width: 500px;
          background: var(--color-surface, #ffffff);
          border-radius: var(--border-radius-lg, 8px);
          box-shadow: var(--shadow-md, 0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -2px rgba(0,0,0,0.1));
          overflow: hidden;
        }

        .login-header {
          background-color: var(--color-accent, #3b82f6);
          color: var(--color-text-on-accent, #ffffff);
          padding: 2rem;
          text-align: center;
        }

        .login-logo {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1rem;
          margin-bottom: 1rem;
        }

        .logo-icon {
          animation: rotate 20s linear infinite;
        }

        .login-logo h1 {
          margin: 0;
          font-size: 2rem;
          font-weight: 700;
        }

        .login-subtitle {
          margin: 0;
          opacity: 0.85;
          font-size: 1rem;
        }

        .login-form-container {
          padding: 2.5rem; /* Increased padding */
        }

        .form-toggle {
          display: flex;
          background: var(--color-background-alt, #f9fafb);
          border-radius: var(--border-radius-md, 6px);
          padding: 4px;
          margin-bottom: 2rem;
        }

        .toggle-btn {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          padding: 0.75rem;
          background: none;
          border: none;
          border-radius: var(--border-radius-sm, 4px);
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
          color: var(--color-text-secondary, #374151);
        }

        .toggle-btn.active {
          background: var(--color-surface, #ffffff);
          color: var(--color-accent, #3b82f6);
          box-shadow: var(--shadow-sm, 0 1px 2px 0 rgba(0,0,0,0.05));
        }

        .form-group {
          margin-bottom: 1.5rem;
        }

        .form-label {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 0.5rem;
          font-weight: 500;
          color: var(--color-text-secondary, #374151);
        }

        .login-submit {
          width: 100%;
          padding: 0.875rem;
          font-size: 1rem;
          font-weight: 600;
        }

        .test-accounts {
          margin-top: 2rem;
          padding-top: 2rem;
          border-top: 1px solid var(--color-border, #e5e7eb);
        }

        .test-accounts h3 {
          margin: 0 0 0.5rem 0;
          color: var(--color-text-primary, #111827);
          font-size: 1.125rem;
        }

        .test-accounts-note {
          margin: 0 0 1rem 0;
          color: var(--color-text-secondary, #374151);
          font-size: 0.875rem;
        }

        .test-accounts-grid {
          display: grid;
          gap: 0.75rem;
        }

        .test-account-card {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          padding: 1rem;
          background: var(--color-background-alt, #f9fafb);
          border: 1px solid var(--color-border, #e5e7eb);
          border-radius: var(--border-radius-md, 6px);
          cursor: pointer;
          transition: all 0.2s ease;
          text-align: left;
        }

        .test-account-card:hover {
          background: var(--color-accent-soft-hover, #dbeafe);
          border-color: var(--color-accent, #3b82f6);
          transform: translateY(-1px);
        }

        .test-account-card:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }

        .test-account-role {
          font-size: 0.75rem;
          font-weight: 600;
          color: var(--color-accent, #3b82f6);
          text-transform: uppercase;
          margin-bottom: 0.25rem;
        }

        .test-account-name {
          font-weight: 600;
          color: var(--color-text-primary, #111827);
          margin-bottom: 0.25rem;
        }

        .test-account-email {
          font-size: 0.875rem;
          color: var(--color-text-secondary, #374151);
        }

        @keyframes rotate {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        @media (max-width: 640px) {
          .login-container {
            padding: 1rem;
          }
          
          .login-header {
            padding: 1.5rem;
          }
          
          .login-form-container {
            padding: 1.5rem;
          }
        }
      `}</style>
    </div>
  )
}

export default Login 