import React, { useState, useEffect } from 'react'
import { BarChart3, X, FileText, Table, Calendar } from 'lucide-react'
import '../dashboard.css'

/**
 * ReportingModal component displays reporting options and filters
 * @param {Object} props - Component props
 * @param {boolean} props.isOpen - Whether the modal is open
 * @param {Function} props.onClose - Callback to close the modal
 * @param {Array} props.allTimeEntries - All time entries to report on
 * @param {Function} props.onRunReport - Callback to run the report
 * @param {Array} props.jobOptions - Available job options
 * @param {Array} props.taskOptions - Available task options
 * @param {Array} props.workerOptions - Available worker options
 */
const ReportingModal = ({ 
  isOpen, 
  onClose, 
  allTimeEntries = [], 
  onRunReport,
  jobOptions = [],
  taskOptions = [],
  workerOptions = []
}) => {
  console.log('ReportingModal rendered with props:', {
    isOpen,
    allTimeEntriesCount: allTimeEntries.length,
    jobOptionsCount: jobOptions.length,
    taskOptionsCount: taskOptions.length,
    workerOptionsCount: workerOptions.length,
    jobOptions,
    taskOptions,
    workerOptions
  })

  const [reportStartDate, setReportStartDate] = useState('')
  const [reportEndDate, setReportEndDate] = useState('')
  const [selectedJobs, setSelectedJobs] = useState([])
  const [selectedTasks, setSelectedTasks] = useState([])
  const [selectedWorkers, setSelectedWorkers] = useState([])
  const [selectAllJobs, setSelectAllJobs] = useState(false)
  const [selectAllTasks, setSelectAllTasks] = useState(false)
  const [selectAllWorkers, setSelectAllWorkers] = useState(false)
  const [reportStyle, setReportStyle] = useState('cards') // 'table' or 'cards'
  const [reportLoading, setReportLoading] = useState(false)

  // Process selections when "select all" checkboxes change
  useEffect(() => {
    if (selectAllJobs) {
      setSelectedJobs(jobOptions.map(option => option.value))
    } else if (selectedJobs.length === jobOptions.length) {
      setSelectedJobs([])
    }
  }, [selectAllJobs, jobOptions])

  useEffect(() => {
    if (selectAllTasks) {
      setSelectedTasks(taskOptions.map(option => option.value))
    } else if (selectedTasks.length === taskOptions.length) {
      setSelectedTasks([])
    }
  }, [selectAllTasks, taskOptions])

  useEffect(() => {
    if (selectAllWorkers) {
      setSelectedWorkers(workerOptions.map(option => option.value))
    } else if (selectedWorkers.length === workerOptions.length) {
      setSelectedWorkers([])
    }
  }, [selectAllWorkers, workerOptions])

  // Toggle job selection
  const toggleJob = (jobValue) => {
    setSelectedJobs(prev => {
      if (prev.includes(jobValue)) {
        const newSelection = prev.filter(j => j !== jobValue)
        setSelectAllJobs(newSelection.length === jobOptions.length)
        return newSelection
      } else {
        const newSelection = [...prev, jobValue]
        setSelectAllJobs(newSelection.length === jobOptions.length)
        return newSelection
      }
    })
  }

  // Toggle task selection
  const toggleTask = (taskValue) => {
    setSelectedTasks(prev => {
      if (prev.includes(taskValue)) {
        const newSelection = prev.filter(t => t !== taskValue)
        setSelectAllTasks(newSelection.length === taskOptions.length)
        return newSelection
      } else {
        const newSelection = [...prev, taskValue]
        setSelectAllTasks(newSelection.length === taskOptions.length)
        return newSelection
      }
    })
  }

  // Toggle worker selection
  const toggleWorker = (workerValue) => {
    setSelectedWorkers(prev => {
      if (prev.includes(workerValue)) {
        const newSelection = prev.filter(w => w !== workerValue)
        setSelectAllWorkers(newSelection.length === workerOptions.length)
        return newSelection
      } else {
        const newSelection = [...prev, workerValue]
        setSelectAllWorkers(newSelection.length === workerOptions.length)
        return newSelection
      }
    })
  }

  // Toggle "select all" for jobs
  const toggleAllJobs = () => {
    setSelectAllJobs(!selectAllJobs)
  }

  // Toggle "select all" for tasks
  const toggleAllTasks = () => {
    setSelectAllTasks(!selectAllTasks)
  }

  // Toggle "select all" for workers
  const toggleAllWorkers = () => {
    setSelectAllWorkers(!selectAllWorkers)
  }

  // Handle running the report
  const handleRunReport = () => {
    console.log('Run Report button clicked')
    console.log('Report configuration:', {
      startDate: reportStartDate,
      endDate: reportEndDate,
      jobs: selectedJobs,
      tasks: selectedTasks,
      workers: selectedWorkers,
      selectAllJobs,
      selectAllTasks,
      selectAllWorkers,
      reportStyle
    })
    
    setReportLoading(true)
    
    try {
      // Call the provided onRunReport callback with all the filter values
      onRunReport({
        startDate: reportStartDate,
        endDate: reportEndDate,
        jobs: selectedJobs,
        tasks: selectedTasks,
        workers: selectedWorkers,
        selectAllJobs,
        selectAllTasks, 
        selectAllWorkers,
        reportStyle
      })
      
      // Give a brief delay to ensure the report opens
      setTimeout(() => {
        setReportLoading(false)
        onClose() // Close the modal after running the report
      }, 500)
    } catch (error) {
      console.error('Error running report:', error)
      alert('Error generating report: ' + error.message)
      setReportLoading(false)
    }
  }

  if (!isOpen) return null

  // console.log('ReportingModal is OPEN and rendering') // Kept for debugging as per existing code

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="add-user-modal" /* Reuses styles from App.css for positioning */>
      <div className="modal-overlay" onClick={handleBackdropClick}></div> {/* Reuses styles from App.css for backdrop */}
      <div className="modal-content" style={{ maxWidth: '700px', maxHeight: '90vh', display: 'flex', flexDirection: 'column', padding: 0 /* Remove App.css default padding */ }}>
        
        <div className="reporting-header" style={{ padding: '1.5rem', borderBottom: '1px solid var(--color-border)', flexShrink: 0 }}>
          <h2 className="reporting-title" style={{ margin: 0, fontSize: '1.25rem', fontWeight: 600, display: 'flex', alignItems: 'center' }}>
            <BarChart3 size={20} style={{ marginRight: '0.5rem' }} />
            <span>Generate Report</span>
          </h2>
          <button onClick={onClose} className="btn btn-outline btn-sm" style={{ padding: '0.25rem 0.5rem' }}>
            <X size={18} />
          </button>
        </div>
        
        <div style={{ flexGrow: 1, overflowY: 'auto', padding: '1.5rem' }}>
          <div className="reporting-filters">
            {/* Date Range Filter */}
            <div className="filter-group">
              <label className="filter-label">Date Range</label>
              <div className="date-filter">
                <div className="date-input">
                  <input 
                    type="date" 
                    className="filter-input form-input" /* Added form-input for consistency */
                    value={reportStartDate}
                    onChange={(e) => setReportStartDate(e.target.value)}
                    placeholder="Start Date"
                  />
                </div>
                <div className="date-input">
                  <input 
                    type="date" 
                    className="filter-input form-input" /* Added form-input for consistency */
                    value={reportEndDate}
                    onChange={(e) => setReportEndDate(e.target.value)}
                    placeholder="End Date"
                  />
                </div>
              </div>
            </div>
            
            {/* Job Filter */}
            <div className="filter-group">
              <label className="filter-label">Job Locations</label>
              <div className="multiselect-container">
                <div className="option-item">
                  <input
                    type="checkbox"
                    className="option-checkbox"
                    checked={selectAllJobs}
                    onChange={toggleAllJobs}
                    id="all-jobs"
                  />
                  <label htmlFor="all-jobs">Select All</label>
                </div>
                <div className="option-list">
                  {jobOptions.map((job, index) => (
                    <div key={`job-${index}`} className="option-item">
                      <input
                        type="checkbox"
                        className="option-checkbox"
                        checked={selectedJobs.includes(job.value)}
                        onChange={() => toggleJob(job.value)}
                        id={`job-${index}`}
                      />
                      <label htmlFor={`job-${index}`}>{job.label}</label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            {/* Task Filter */}
            <div className="filter-group">
              <label className="filter-label">Tasks</label>
              <div className="multiselect-container">
                <div className="option-item">
                  <input
                    type="checkbox"
                    className="option-checkbox"
                    checked={selectAllTasks}
                    onChange={toggleAllTasks}
                    id="all-tasks"
                  />
                  <label htmlFor="all-tasks">Select All</label>
                </div>
                <div className="option-list">
                  {taskOptions.map((task, index) => (
                    <div key={`task-${index}`} className="option-item">
                      <input
                        type="checkbox"
                        className="option-checkbox"
                        checked={selectedTasks.includes(task.value)}
                        onChange={() => toggleTask(task.value)}
                        id={`task-${index}`}
                      />
                      <label htmlFor={`task-${index}`}>{task.label}</label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            {/* Worker Filter */}
            <div className="filter-group">
              <label className="filter-label">Workers</label>
              <div className="multiselect-container">
                <div className="option-item">
                  <input
                    type="checkbox"
                    className="option-checkbox"
                    checked={selectAllWorkers}
                    onChange={toggleAllWorkers}
                    id="all-workers"
                  />
                  <label htmlFor="all-workers">Select All</label>
                </div>
                <div className="option-list">
                  {workerOptions.map((worker, index) => (
                    <div key={`worker-${index}`} className="option-item">
                      <input
                        type="checkbox"
                        className="option-checkbox"
                        checked={selectedWorkers.includes(worker.value)}
                        onChange={() => toggleWorker(worker.value)}
                        id={`worker-${index}`}
                      />
                      <label htmlFor={`worker-${index}`}>{worker.label}</label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="reporting-actions" style={{ padding: '1.5rem', borderTop: '1px solid var(--color-border)', flexShrink: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div className="report-style-toggle">
            <div 
              className={`style-option ${reportStyle === 'cards' ? 'active' : ''}`}
              onClick={() => setReportStyle('cards')}
            >
              <FileText size={16} />
              <span>Card View</span>
            </div>
            <div 
              className={`style-option ${reportStyle === 'table' ? 'active' : ''}`}
              onClick={() => setReportStyle('table')}
            >
              <Table size={16} />
              <span>Table View</span>
            </div>
          </div>
          <button 
            className="btn btn-primary" /* Use standard button classes */
            onClick={handleRunReport}
            disabled={reportLoading}
          >
            {reportLoading ? 'Running...' : 'Run Report'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ReportingModal 