import React from 'react'

/**
 * ErrorState component displays an error message with an optional retry button
 * @param {Object} props - Component props
 * @param {string} props.message - Error message to display
 * @param {string} props.details - Optional detailed error information
 * @param {Function} props.onRetry - Optional callback function for retry button
 */
const ErrorState = ({ message = "An error occurred", details = "", onRetry }) => {
  return (
    <div className="error-container">
      <div className="error-content">
        <div className="error-icon">⚠️</div>
        <div className="error-text">
          <h3>{message}</h3>
          {details && <p className="error-details">{details}</p>}
        </div>
        {onRetry && (
          <button onClick={onRetry} className="retry-button">
            Try Again
          </button>
        )}
      </div>
    </div>
  )
}

export default ErrorState 