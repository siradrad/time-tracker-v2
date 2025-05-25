// Example Enhanced Component for Time Tracker V2
import React from 'react';
import { Play, Pause, Square, Clock } from 'lucide-react';

// Enhanced Timer Component Example
function EnhancedTimerComponent({ 
  isRunning, 
  isPaused, 
  currentTime, 
  onStart, 
  onPause, 
  onStop 
}) {
  const formatTime = (milliseconds) => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="enhanced-timer-container">
      {/* Circular Progress Timer */}
      <div className="timer-circle-container">
        <div className="timer-circle">
          <svg className="timer-progress" width="200" height="200">
            <circle
              cx="100"
              cy="100"
              r="85"
              stroke="#e2e8f0"
              strokeWidth="8"
              fill="none"
            />
            <circle
              cx="100"
              cy="100"
              r="85"
              stroke="url(#gradient)"
              strokeWidth="8"
              fill="none"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 85}`}
              strokeDashoffset={isRunning ? "0" : `${2 * Math.PI * 85}`}
              className={isRunning ? "rotating" : ""}
            />
            <defs>
              <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#667eea" />
                <stop offset="100%" stopColor="#764ba2" />
              </linearGradient>
            </defs>
          </svg>
          
          <div className="timer-display-center">
            <div className="time-text-large">
              {formatTime(currentTime)}
            </div>
            <div className="timer-status-badge">
              {isRunning ? (
                <span className="status-running">
                  <div className="pulse-dot"></div>
                  Recording
                </span>
              ) : isPaused ? (
                <span className="status-paused">
                  ⏸ Paused
                </span>
              ) : (
                <span className="status-stopped">
                  ⏹ Ready
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Control Buttons */}
      <div className="timer-controls-enhanced">
        {!isRunning && !isPaused && (
          <button 
            onClick={onStart}
            className="btn-control btn-start"
          >
            <Play size={20} />
            <span>Start Timer</span>
            <div className="btn-glow"></div>
          </button>
        )}
        
        {isRunning && (
          <button 
            onClick={onPause}
            className="btn-control btn-pause"
          >
            <Pause size={20} />
            <span>Pause</span>
          </button>
        )}
        
        {isPaused && (
          <button 
            onClick={onStart}
            className="btn-control btn-resume"
          >
            <Play size={20} />
            <span>Resume</span>
          </button>
        )}
        
        {(isRunning || isPaused) && (
          <button 
            onClick={onStop}
            className="btn-control btn-stop"
          >
            <Square size={20} />
            <span>Stop & Save</span>
          </button>
        )}
      </div>

      {/* Inline CSS for this component */}
      <style jsx>{`
        .enhanced-timer-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 2rem;
          padding: 2rem;
          background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
          border-radius: 24px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
        }

        .timer-circle-container {
          position: relative;
        }

        .timer-circle {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .timer-progress circle.rotating {
          animation: rotate 60s linear infinite;
        }

        @keyframes rotate {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .timer-display-center {
          position: absolute;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.5rem;
        }

        .time-text-large {
          font-size: 2rem;
          font-weight: 800;
          background: linear-gradient(135deg, #667eea, #764ba2);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          font-family: 'Monaco', monospace;
          letter-spacing: -0.02em;
        }

        .timer-status-badge {
          padding: 4px 12px;
          border-radius: 16px;
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .status-running {
          background: rgba(16, 185, 129, 0.1);
          color: #059669;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .pulse-dot {
          width: 6px;
          height: 6px;
          background: #10b981;
          border-radius: 50%;
          animation: pulse 1.5s ease-in-out infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.2); }
        }

        .timer-controls-enhanced {
          display: flex;
          gap: 1rem;
          flex-wrap: wrap;
          justify-content: center;
        }

        .btn-control {
          position: relative;
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 24px;
          border: none;
          border-radius: 12px;
          font-weight: 600;
          font-size: 0.95rem;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          overflow: hidden;
          min-width: 140px;
          justify-content: center;
        }

        .btn-start {
          background: linear-gradient(135deg, #10b981, #059669);
          color: white;
          box-shadow: 0 4px 14px rgba(16, 185, 129, 0.3);
        }

        .btn-pause {
          background: linear-gradient(135deg, #f59e0b, #d97706);
          color: white;
          box-shadow: 0 4px 14px rgba(245, 158, 11, 0.3);
        }

        .btn-resume {
          background: linear-gradient(135deg, #667eea, #764ba2);
          color: white;
          box-shadow: 0 4px 14px rgba(102, 126, 234, 0.3);
        }

        .btn-stop {
          background: linear-gradient(135deg, #ef4444, #dc2626);
          color: white;
          box-shadow: 0 4px 14px rgba(239, 68, 68, 0.3);
        }

        .btn-control:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.2);
        }

        .btn-control:active {
          transform: translateY(0);
        }

        .btn-glow {
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
          transition: left 0.6s;
        }

        .btn-start:hover .btn-glow {
          left: 100%;
        }

        @media (max-width: 640px) {
          .timer-circle-container svg {
            width: 150px;
            height: 150px;
          }
          
          .time-text-large {
            font-size: 1.5rem;
          }
          
          .timer-controls-enhanced {
            flex-direction: column;
            width: 100%;
          }
          
          .btn-control {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
}

export default EnhancedTimerComponent; 