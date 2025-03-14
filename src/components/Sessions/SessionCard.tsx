import React from 'react';
import { Metric, Session, WorkoutSet } from './types';

type SessionCardProps = {
  id: string;
  session: Session;
  isExpanded: boolean;
  onToggle: (id: string) => void;
  onComplete: (data: { id: string; workouts: WorkoutSet[] }) => void;
  onEdit: (id: string) => void;
  onDelete: (data: { id: string; workoutName: string }) => void;
};

const getWorkouts = (session: Session): WorkoutSet[] => {
  if (!session.workouts) return [];
  try {
    return JSON.parse(session.workouts);
  } catch (e) {
    console.error('Failed to parse workouts:', e);
    return [];
  }
};

const getActualMetrics = (session: Session): WorkoutSet[] => {
  if (!session.actualMetrics) return [];
  try {
    return JSON.parse(session.actualMetrics);
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
  const workouts = getWorkouts(session);
  const actualMetrics = getActualMetrics(session);

  return (
    <div className={`session-item ${isExpanded ? 'expanded' : ''}`}>
      <div className="session-header" onClick={() => onToggle(id)}>
        <div className="session-date">
          {new Date(session.plannedDate).toLocaleDateString()}
        </div>
        <div className="session-workouts">
          {workouts.map((workout, index) => (
            <span key={index} className="workout-name">
              {workout.workoutName}
              {index < workouts.length - 1 && ', '}
            </span>
          ))}
        </div>
        <div className="session-status">
          {session.completed ? 'Completed' : 'Planned'}
        </div>
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
            {workouts.map((workout, workoutIndex) => {
              const actualWorkout = actualMetrics.find(w => w.workoutName === workout.workoutName);
              return (
                <div key={workoutIndex} className="workout-metrics">
                  <h4>{workout.workoutName}</h4>
                  {workout.sets.map((set, setIndex) => {
                    const actualSet = actualWorkout?.sets[setIndex];
                    return (
                      <div key={setIndex} className="set-metrics">
                        <h5>Set {setIndex + 1}</h5>
                        {set.targetMetrics.map((metric) => {
                          const actualMetric = session.completed && actualSet
                            ? actualSet.metrics.find((m: Metric) => m.name === metric.name)
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
              );
            })}
          </div>
          <div className="session-actions">
            {!session.completed && (
              <button
                className="action-button complete-button"
                onClick={() => onComplete({ id, workouts })}
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
              onClick={() => onDelete({ id, workoutName: workouts[0].workoutName })}
            >
              Delete
            </button>
          </div>
        </div>
      )}
    </div>
  );
}; 