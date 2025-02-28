import React from 'react';
import { Metric, Session, Workout } from './types';

type SessionCardProps = {
  id: string;
  session: Session;
  isExpanded: boolean;
  onToggle: (id: string) => void;
  onComplete: (data: { id: string; workouts: Workout[] }) => void;
  onEdit: (id: string) => void;
  onDelete: (data: { id: string; workoutName: string }) => void;
};

const getWorkouts = (session: Session): Workout[] => {
  try {
    return JSON.parse(session.workouts);
  } catch (e) {
    console.error('Failed to parse workouts:', e);
    return [];
  }
};

const getTargetMetrics = (workout: Workout): Metric[] => {
  if (!workout.targetMetrics) return [];
  return Array.isArray(workout.targetMetrics) ? workout.targetMetrics : [];
};

const getActualMetrics = (session: Session): Metric[] => {
  if (!session.actualMetrics) return [];
  
  // If it's already an array, return it
  if (Array.isArray(session.actualMetrics)) return session.actualMetrics;
  
  try {
    // If it's a string, try to parse it
    let parsed = typeof session.actualMetrics === 'string' 
      ? JSON.parse(session.actualMetrics) 
      : session.actualMetrics;
    
    // Handle the case where it's an array of workouts with metrics
    if (Array.isArray(parsed)) {
      return parsed.flatMap(workout => {
        // Check if workout has metrics property and it's an array
        if (workout.metrics && Array.isArray(workout.metrics)) {
          return workout.metrics.map((metric: { name: string; value: any }) => ({
            name: metric.name,
            value: metric.value
          }));
        }
        return [];
      });
    }
    
    // Handle the case where it's a direct metrics array
    if (parsed.metrics && Array.isArray(parsed.metrics)) {
      return parsed.metrics;
    }
    
    return [];
  } catch (e) {
    console.error('Failed to parse actual metrics:', e);
    return [];
  }
};

export const SessionCard: React.FC<SessionCardProps> = ({
  id,
  session,
  isExpanded,
  onToggle,
  onComplete,
  onEdit,
  onDelete
}) => {
  return (
    <li 
      className={`session-item ${session.completed ? 'completed' : 'planned'} ${isExpanded ? 'expanded' : ''}`}
      onClick={() => onToggle(id)}
    >
      <div className="session-header">
        <div className="session-title">
          <span className={`status-icon ${session.completed ? 'completed' : 'planned'}`}>
            {session.completed ? '✓' : ' '}
          </span>
          <h3>{getWorkouts(session).map(w => w.workoutName).join(', ')}</h3>
        </div>
        <span className="planned-date">
          {new Date(session.plannedDate).toLocaleDateString()}
        </span>
        <span className="expand-icon">
          {isExpanded ? '▼' : '▶'}
        </span>
      </div>

      {isExpanded && (
        <div className="session-details">
          <div className="session-dates">
            {session.completed && session.completedDate && (
              <span className="completed-date">
                Completed: {new Date(session.completedDate).toLocaleDateString()}
              </span>
            )}
          </div>
          <div className="metrics-list">
            {getWorkouts(session).map((workout, workoutIndex) => {
              const metrics = getTargetMetrics(workout);
              const actualMetrics = getActualMetrics(session);
              
              return (
                <div key={workoutIndex} className="workout-metrics">
                  <h4>{workout.workoutName}</h4>
                  {metrics.map((metric) => {
                    // Find the matching actual metric more reliably
                    const actualMetric = session.completed 
                      ? actualMetrics.find(m => m.name === metric.name)
                      : null;
                    
                    return (
                      <div key={metric.name} className="metric-item">
                        <span className="metric-name">{metric.name}</span>
                        <div className="metric-values">
                          <span className="target-value">Target: {metric.value}</span>
                          {session.completed && (
                            <span className="actual-value">
                              Actual: {actualMetric?.value !== undefined ? actualMetric.value : 'N/A'}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
          <div className="session-actions" onClick={(e) => e.stopPropagation()}>
            {!session.completed && (
              <button
                className="action-button complete-button"
                onClick={() => onComplete({
                  id,
                  workouts: getWorkouts(session)
                })}
              >
                Complete
              </button>
            )}
            <button
              className="action-button edit-button"
              onClick={() => onEdit(id)}
            >
              Edit
            </button>
            <button
              className="action-button delete-button"
              onClick={() => onDelete({
                id,
                workoutName: getWorkouts(session).map(w => w.workoutName).join(', ')
              })}
            >
              Delete
            </button>
          </div>
        </div>
      )}
    </li>
  );
}; 