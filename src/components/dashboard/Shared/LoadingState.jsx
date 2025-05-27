import React from 'react'

/**
 * LoadingState component displays a loading spinner with customizable text
 * @param {Object} props - Component props
 * @param {string} props.message - Primary loading message
 * @param {string} props.submessage - Secondary loading message
 * @param {Array<string>} props.steps - Optional array of loading steps to display
 */
const LoadingState = ({ message = "Loading...", submessage = "", steps = [] }) => {
  return (
    <div className="loading-container">
      <div className="loading-content">
        <div className="spinner"></div>
        <div className="loading-text">
          <h3>{message}</h3>
          {submessage && <p>{submessage}</p>}
          
          {steps.length > 0 && (
            <div className="loading-steps">
              {steps.map((step, index) => (
                <div key={index} className="loading-step">{step}</div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default LoadingState 