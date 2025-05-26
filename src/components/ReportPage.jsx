import React, { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Download, Calendar, User, Building2, Wrench, Clock, BarChart3, FileText, Loader2, AlertCircle } from 'lucide-react'
import './ReportPage.css'

function ReportPage() {
  const [searchParams] = useSearchParams()
  const [reportData, setReportData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get report data from sessionStorage using the ID from URL params
    const reportId = searchParams.get('id')
    
    if (reportId) {
      try {
        const storedData = sessionStorage.getItem(reportId)
        if (storedData) {
          const data = JSON.parse(storedData)
          setReportData(data)
          // Clean up the sessionStorage after loading
          sessionStorage.removeItem(reportId)
        } else {
          console.error('No report data found for ID:', reportId)
        }
      } catch (error) {
        console.error('Error parsing report data:', error)
      }
    } else {
      // Fallback: try to get data from URL params (legacy support)
      const dataParam = searchParams.get('data')
      const styleParam = searchParams.get('style')
      
      if (dataParam) {
        try {
          const data = JSON.parse(decodeURIComponent(dataParam))
          setReportData({ ...data, style: styleParam || 'cards' })
        } catch (error) {
          console.error('Error parsing report data from URL:', error)
        }
      }
    }
    setLoading(false)
  }, [searchParams])

  const downloadCSV = () => {
    if (!reportData) return

    const csvRows = [['Date', 'Worker', 'Job', 'Task', 'Hours']]
    
    if (reportData.style === 'cards') {
      // Generate CSV from grouped data
      Object.entries(reportData.groupedData).forEach(([date, workers]) => {
        Object.entries(workers).forEach(([worker, jobs]) => {
          Object.entries(jobs).forEach(([job, tasks]) => {
            Object.entries(tasks).forEach(([task, hours]) => {
              csvRows.push([date, worker, job, task, hours.toFixed(2)])
            })
          })
        })
      })
    } else {
      // Generate CSV from flat data
      reportData.results.forEach(row => {
        csvRows.push([
          row.date || 'N/A',
          row.worker || 'N/A', 
          row.job || 'N/A',
          row.task || 'N/A',
          row.hours || '0'
        ])
      })
    }

    const csvContent = csvRows.map(row => row.join(',')).join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'time-report.csv'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <div className="report-loading">
        <div className="loading-container">
          <Loader2 className="spinner" size={48} />
          <h2>Loading Report</h2>
          <p>Preparing your time tracking data...</p>
        </div>
      </div>
    )
  }

  if (!reportData) {
    return (
      <div className="report-error">
        <div className="error-container">
          <AlertCircle size={64} className="error-icon" />
          <h2>No Report Data Found</h2>
          <p>Unable to load report data. Please try generating the report again.</p>
          <button onClick={() => window.close()} className="btn-secondary">
            Close Window
          </button>
        </div>
      </div>
    )
  }

  if (reportData.style === 'cards') {
    return (
      <div className="report-page">
        <div className="report-header">
          <div className="header-content">
            <div className="header-title">
              <BarChart3 size={32} className="header-icon" />
              <div>
                <h1>Time Report</h1>
                <p className="header-subtitle">Grouped by Date → Worker → Job → Task</p>
              </div>
            </div>
            <button onClick={downloadCSV} className="download-btn">
              <Download size={20} />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        <div className="report-content">
          {Object.entries(reportData.groupedData)
            .sort(([a], [b]) => new Date(b).getTime() - new Date(a).getTime())
            .map(([date, workers]) => {
              const dateTotal = Object.values(workers).reduce((sum, jobs) => 
                sum + Object.values(jobs).reduce((jobSum, tasks) => 
                  jobSum + Object.values(tasks).reduce((taskSum, hours) => taskSum + hours, 0), 0), 0)
              
              return (
                <div key={date} className="date-section">
                  <div className="date-header">
                    <div className="date-info">
                      <Calendar size={24} />
                      <div>
                        <h2>{new Date(date).toLocaleDateString('en-US', { 
                          weekday: 'long', 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })}</h2>
                        <p className="date-subtitle">{Object.keys(workers).length} worker{Object.keys(workers).length > 1 ? 's' : ''}</p>
                      </div>
                    </div>
                    <div className="date-total">
                      <Clock size={20} />
                      <span>{dateTotal.toFixed(2)}h</span>
                    </div>
                  </div>
                  
                  <div className="workers-grid">
                    {Object.entries(workers)
                      .sort(([a], [b]) => a.localeCompare(b))
                      .map(([worker, jobs]) => {
                        const workerTotal = Object.values(jobs).reduce((sum, tasks) => 
                          sum + Object.values(tasks).reduce((taskSum, hours) => taskSum + hours, 0), 0)
                        
                        return (
                          <div key={worker} className="worker-card">
                            <div className="worker-header">
                              <div className="worker-info">
                                <User size={20} />
                                <h3>{worker}</h3>
                              </div>
                              <div className="worker-total">
                                <Clock size={16} />
                                <span>{workerTotal.toFixed(2)}h</span>
                              </div>
                            </div>
                            
                            <div className="jobs-list">
                              {Object.entries(jobs)
                                .sort(([a], [b]) => a.localeCompare(b))
                                .map(([job, tasks]) => {
                                  const jobTotal = Object.values(tasks).reduce((sum, hours) => sum + hours, 0)
                                  const taskCount = Object.keys(tasks).length
                                  
                                  return (
                                    <div key={job} className="job-section">
                                      <div className="job-header">
                                        <div className="job-info">
                                          <Building2 size={18} />
                                          <h4>{job}</h4>
                                        </div>
                                        <div className="job-meta">
                                          <div className="job-total">
                                            <Clock size={14} />
                                            <span>{jobTotal.toFixed(2)}h</span>
                                          </div>
                                          <div className="task-count">
                                            <Wrench size={14} />
                                            <span>{taskCount}</span>
                                          </div>
                                        </div>
                                      </div>
                                      
                                      <div className="tasks-list">
                                        {Object.entries(tasks)
                                          .sort(([a], [b]) => a.localeCompare(b))
                                          .map(([task, hours]) => {
                                            const percentage = ((hours / jobTotal) * 100).toFixed(1)
                                            return (
                                              <div key={task} className="task-item">
                                                <div className="task-info">
                                                  <Wrench size={16} />
                                                  <span className="task-name">{task}</span>
                                                </div>
                                                <div className="task-progress-container">
                                                  <div className="task-bar">
                                                    <div className="task-progress" style={{ width: `${percentage}%` }}></div>
                                                  </div>
                                                  <div className="task-stats">
                                                    <span className="task-hours">{hours.toFixed(2)}h</span>
                                                    <span className="task-percentage">{percentage}%</span>
                                                  </div>
                                                </div>
                                              </div>
                                            )
                                          })}
                                      </div>
                                    </div>
                                  )
                                })}
                            </div>
                          </div>
                        )
                      })}
                  </div>
                </div>
              )
            })}
        </div>
      </div>
    )
  }

  // Table view
  return (
    <div className="report-page">
      <div className="report-header">
        <div className="header-content">
          <div className="header-title">
            <FileText size={32} className="header-icon" />
            <div>
              <h1>Time Report</h1>
              <p className="header-subtitle">Detailed table view of all entries</p>
            </div>
          </div>
          <button onClick={downloadCSV} className="download-btn">
            <Download size={20} />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      <div className="report-content">
        <div className="table-container">
          <div className="table-wrapper">
            <table className="report-table">
              <thead>
                <tr>
                  {reportData.headers.map(header => (
                    <th key={header}>
                      <div className="header-cell">
                        {header === 'Date' && <Calendar size={16} />}
                        {header === 'Worker' && <User size={16} />}
                        {header === 'Job' && <Building2 size={16} />}
                        {header === 'Task' && <Wrench size={16} />}
                        {header === 'Hours' && <Clock size={16} />}
                        <span>{header}</span>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {reportData.results.map((row, index) => (
                  <tr key={index}>
                    {reportData.headers.map(header => {
                      const headerToProperty = {
                        'Date': 'date',
                        'Job': 'job',
                        'Task': 'task', 
                        'Worker': 'worker',
                        'Hours': 'hours'
                      }
                      const value = row[headerToProperty[header]] || 'N/A'
                      return (
                        <td key={header}>
                          {header === 'Hours' && value !== 'N/A' ? `${value}h` : value}
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ReportPage 