import { useState, useEffect } from 'react';
import { useStore, useTable } from 'tinybase/ui-react';
import './SessionEditForm.css';
import { Row, Cell } from 'tinybase';

type WorkoutData = {
  name: string;
  category: string;
  recordMetrics: string;
};

interface SessionWorkout {
  workoutName: string;
  targetMetrics: Array<{ name: string; value: number }>;
}

interface Session extends Row {
  plannedDate: Cell;
  workouts: Cell; // JSON string of SessionWorkout[]
  completed: Cell;
  completedDate: Cell;
  actualMetrics: Cell;
}

type SessionEditFormProps = {
  isOpen: boolean;
  onClose: () => void;
  sessionId: string;
};

export const SessionEditForm = ({ isOpen, onClose, sessionId }: SessionEditFormProps) => {
  const store = useStore()!;
  const workouts = useTable('workouts') as Record<string, WorkoutData>;

  const [plannedDate, setPlannedDate] = useState<string>('');
  const [selectedWorkouts, setSelectedWorkouts] = useState<string[]>([]);
  const [workoutTargetMetrics, setWorkoutTargetMetrics] = useState<Record<string, Record<string, number>>>({});
  const [completed, setCompleted] = useState<boolean>(false);
  const [completedDate, setCompletedDate] = useState<string>('');
  const [workoutActualMetrics, setWorkoutActualMetrics] = useState<Record<string, Record<string, number>>>({});

  useEffect(() => {
    if (isOpen) {
      const session = store.getRow('sessions', sessionId) as Session;
      if (session) {
        setPlannedDate(String(session.plannedDate));
        setCompleted(Boolean(session.completed));
        setCompletedDate(session.completedDate ? String(session.completedDate) : '');
        
        const sessionWorkouts = JSON.parse(String(session.workouts));
        const workoutIds = sessionWorkouts.map((sw: SessionWorkout) => 
          Object.entries(workouts).find(([_, w]) => w.name === sw.workoutName)?.[0]
        ).filter(Boolean);
        
        setSelectedWorkouts(workoutIds);

        // Set target metrics for each workout
        const targetMetricsMap: Record<string, Record<string, number>> = {};
        sessionWorkouts.forEach((sw: SessionWorkout) => {
          const metrics = Array.isArray(sw.targetMetrics) ? sw.targetMetrics : [];
          targetMetricsMap[sw.workoutName] = metrics.reduce(
            (acc: Record<string, number>, curr: { name: string; value: number }) => {
              acc[curr.name] = curr.value;
              return acc;
            },
            {}
          );
        });
        setWorkoutTargetMetrics(targetMetricsMap);

        if (session.actualMetrics) {
          const parsedActualMetrics = JSON.parse(String(session.actualMetrics));
          const actualMetricsMap: Record<string, Record<string, number>> = {};
          parsedActualMetrics.forEach((wm: { workoutName: string, metrics: Array<{ name: string, value: number }> }) => {
            actualMetricsMap[wm.workoutName] = wm.metrics.reduce(
              (acc: Record<string, number>, curr: { name: string; value: number }) => {
                acc[curr.name] = curr.value;
                return acc;
              },
              {}
            );
          });
          setWorkoutActualMetrics(actualMetricsMap);
        }
      }
    }
  }, [isOpen, sessionId, store, workouts]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const sessionWorkouts = selectedWorkouts.map(workoutId => {
      const workout = workouts[workoutId];
      return {
        workoutName: workout.name,
        targetMetrics: JSON.stringify(
          Object.entries(workoutTargetMetrics[workout.name] || {}).map(([name, value]) => ({
            name,
            value
          }))
        )
      };
    });

    const updatedSession: Record<string, Cell> = {
      plannedDate: plannedDate as Cell,
      workouts: JSON.stringify(sessionWorkouts) as Cell,
      completed: completed as Cell,
    };

    if (completed) {
      updatedSession.completedDate = completedDate as Cell;
      updatedSession.actualMetrics = JSON.stringify(
        Object.entries(workoutActualMetrics).map(([workoutName, metrics]) => ({
          workoutName,
          metrics: Object.entries(metrics).map(([name, value]) => ({
            name,
            value
          }))
        }))
      ) as Cell;
    }

    store.setRow('sessions', sessionId, updatedSession);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <button className="close-button" onClick={onClose}>×</button>
        <h2>Edit Session</h2>
        <form onSubmit={handleSubmit} className="edit-form">
          <div className="form-group">
            <label htmlFor="plannedDate">Planned Date:</label>
            <input
              type="date"
              id="plannedDate"
              value={plannedDate}
              onChange={(e) => setPlannedDate(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>Workouts:</label>
            <div className="workout-selector">
              {Object.entries(workouts).map(([id, workout]) => (
                <label key={id} className="workout-checkbox">
                  <input
                    type="checkbox"
                    checked={selectedWorkouts.includes(id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedWorkouts([...selectedWorkouts, id]);
                        // Initialize target metrics for the newly added workout
                        const metrics = JSON.parse(workout.recordMetrics);
                        setWorkoutTargetMetrics(prev => ({
                          ...prev,
                          [workout.name]: metrics.reduce((acc: Record<string, number>, metric: string) => {
                            acc[metric] = 0;
                            return acc;
                          }, {})
                        }));
                      } else {
                        setSelectedWorkouts(selectedWorkouts.filter(w => w !== id));
                        // Remove target metrics for the removed workout
                        const newTargetMetrics = { ...workoutTargetMetrics };
                        delete newTargetMetrics[workout.name];
                        setWorkoutTargetMetrics(newTargetMetrics);
                      }
                    }}
                  />
                  {workout.name} ({workout.category})
                </label>
              ))}
            </div>
          </div>

          {selectedWorkouts.length > 0 && (
            <div className="metric-inputs">
              <h3>Target Metrics</h3>
              {selectedWorkouts.map((workoutId) => {
                const workout = workouts[workoutId];
                const metrics = JSON.parse(workout.recordMetrics);
                return (
                  <div key={workout.name} className="workout-section">
                    <h4>{workout.name}</h4>
                    {metrics.map((metricName: string) => (
                      <div key={`${workout.name}-${metricName}`} className="form-group">
                        <label htmlFor={`target-${workout.name}-${metricName}`}>{metricName}:</label>
                        <input
                          type="number"
                          id={`target-${workout.name}-${metricName}`}
                          value={workoutTargetMetrics[workout.name]?.[metricName] || ''}
                          onChange={(e) => setWorkoutTargetMetrics({
                            ...workoutTargetMetrics,
                            [workout.name]: {
                              ...workoutTargetMetrics[workout.name],
                              [metricName]: Number(e.target.value)
                            }
                          })}
                          required
                        />
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          )}

          <div className="form-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={completed}
                onChange={(e) => setCompleted(e.target.checked)}
              />
              Completed
            </label>
          </div>

          {completed && (
            <>
              <div className="form-group">
                <label htmlFor="completedDate">Completion Date:</label>
                <input
                  type="date"
                  id="completedDate"
                  value={completedDate}
                  onChange={(e) => setCompletedDate(e.target.value)}
                  required
                />
              </div>

              <div className="metric-inputs">
                <h3>Actual Metrics</h3>
                {selectedWorkouts.map((workoutId) => {
                  const workout = workouts[workoutId];
                  const metrics = JSON.parse(workout.recordMetrics);
                  return (
                    <div key={workout.name} className="workout-section">
                      <h4>{workout.name}</h4>
                      {metrics.map((metricName: string) => (
                        <div key={`${workout.name}-${metricName}`} className="form-group">
                          <label htmlFor={`actual-${workout.name}-${metricName}`}>
                            {metricName}:
                            <span className="target-value">
                              (Target: {workoutTargetMetrics[workout.name]?.[metricName]})
                            </span>
                          </label>
                          <input
                            type="number"
                            id={`actual-${workout.name}-${metricName}`}
                            value={workoutActualMetrics[workout.name]?.[metricName] || ''}
                            onChange={(e) => setWorkoutActualMetrics({
                              ...workoutActualMetrics,
                              [workout.name]: {
                                ...workoutActualMetrics[workout.name],
                                [metricName]: Number(e.target.value)
                              }
                            })}
                            required
                          />
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            </>
          )}

          <div className="form-actions">
            <button type="submit" className="primary">Save Changes</button>
            <button type="button" onClick={onClose} className="secondary">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}; 