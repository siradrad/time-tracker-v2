import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { timeTrackerAPI } from './lib/supabase.js'

// Make API available globally for debugging
window.timeTrackerAPI = timeTrackerAPI

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
) 