import { useState, useEffect } from 'react';
import { useStore, useTable } from 'tinybase/ui-react';
import './SessionEditForm.css';
import { Row, Cell } from 'tinybase';
import { WorkoutSet } from './types';

type WorkoutData = {
  name: string;
  category: string;
  recordMetrics: string; // JSON string of metrics
};

type SessionEditFormProps = {
  isOpen: boolean;
  onClose: () => void;
  sessionId: string;
};

type WorkoutMetricsState = {
  [workoutName: string]: {
    sets: Array<{
      [metricName: string]: number;
    }>;
  };
};

export const SessionEditForm = ({ isOpen, onClose, sessionId }: SessionEditFormProps) => {
  const store = useStore()!;
  const workouts = useTable('workouts') as Record<string, WorkoutData>;

  const [plannedDate, setPlannedDate] = useState<string>('');
  const [selectedWorkouts, setSelectedWorkouts] = useState<string[]>([]);
  const [workoutTargetMetrics, setWorkoutTargetMetrics] = useState<WorkoutMetricsState>({});
  const [completed, setCompleted] = useState<boolean>(false);
  const [completedDate, setCompletedDate] = useState<string>('');
  const [workoutActualMetrics, setWorkoutActualMetrics] = useState<WorkoutMetricsState>({});

  useEffect(() => {
    if (isOpen) {
      const session = store.getRow('sessions', sessionId);
      if (session) {
        setPlannedDate(String(session.plannedDate));
        setCompleted(Boolean(session.completed));
        setCompletedDate(session.completedDate ? String(session.completedDate) : '');

        const sessionWorkouts = JSON.parse(String(session.workouts)) as WorkoutSet[];
        const workoutIds = sessionWorkouts
          .map(sw => Object.entries(workouts).find(([_, w]) => w.name === sw.workoutName)?.[0])
          .filter((id): id is string => id !== undefined);

        setSelectedWorkouts(workoutIds);

        // Set target metrics for each workout
        const targetMetricsMap: WorkoutMetricsState = {};
        sessionWorkouts.forEach(sw => {
          targetMetricsMap[sw.workoutName] = {
            sets: sw.sets.map(set => ({
              ...set.targetMetrics.reduce((acc, curr) => {
                acc[curr.name] = curr.value;
                return acc;
              }, {} as Record<string, number>)
            }))
          };
        });
        setWorkoutTargetMetrics(targetMetricsMap);

        if (session.actualMetrics) {
          const parsedActualMetrics = JSON.parse(String(session.actualMetrics));
          const actualMetricsMap: WorkoutMetricsState = {};
          parsedActualMetrics.forEach((wm: { workoutName: string, sets: Array<{ metrics: Array<{ name: string, value: number }> }> }) => {
            actualMetricsMap[wm.workoutName] = {
              sets: wm.sets.map(set => ({
                ...set.metrics.reduce((acc, curr) => {
                  acc[curr.name] = curr.value;
                  return acc;
                }, {} as Record<string, number>)
              }))
            };
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
        sets: workoutTargetMetrics[workout.name]?.sets.map(set => ({
          targetMetrics: Object.entries(set).map(([name, value]) => ({
            name,
            value
          }))
        })) || []
      };
    });

    const updatedSession: Record<string, any> = {
      plannedDate: plannedDate,
      workouts: JSON.stringify(sessionWorkouts),
      completed: completed,
    };

    if (completed) {
      updatedSession.completedDate = completedDate;
      updatedSession.actualMetrics = JSON.stringify(
        Object.entries(workoutActualMetrics).map(([workoutName, data]) => ({
          workoutName,
          sets: data.sets.map(set => ({
            metrics: Object.entries(set).map(([name, value]) => ({
              name,
              value
            }))
          }))
        }))
      );
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
            <div className="workout-checkboxes">
              {Object.entries(workouts).map(([id, workout]) => (
                <label key={id} className="checkbox-label">
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
                          [workout.name]: {
                            sets: [metrics.reduce((acc: Record<string, number>, metric: string) => {
                              acc[metric] = 0;
                              return acc;
                            }, {})]
                          }
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
                    {workoutTargetMetrics[workout.name]?.sets.map((set, setIndex) => (
                      <div key={setIndex} className="set-section">
                        <h5>Set {setIndex + 1}</h5>
                        {metrics.map((metricName: string) => (
                          <div key={`${workout.name}-${setIndex}-${metricName}`} className="form-group">
                            <label htmlFor={`target-${workout.name}-${setIndex}-${metricName}`}>{metricName}:</label>
                            <input
                              type="number"
                              id={`target-${workout.name}-${setIndex}-${metricName}`}
                              value={set[metricName] || ''}
                              onChange={(e) => {
                                const newValue = Number(e.target.value);
                                setWorkoutTargetMetrics(current => ({
                                  ...current,
                                  [workout.name]: {
                                    sets: current[workout.name].sets.map((s, i) =>
                                      i === setIndex
                                        ? { ...s, [metricName]: newValue }
                                        : s
                                    )
                                  }
                                }));
                              }}
                              required
                            />
                          </div>
                        ))}
                      </div>
                    ))}
                    <button
                      type="button"
                      className="add-set"
                      onClick={() => {
                        const metrics = JSON.parse(workout.recordMetrics);
                        setWorkoutTargetMetrics(current => ({
                          ...current,
                          [workout.name]: {
                            sets: [
                              ...(current[workout.name]?.sets || []),
                              metrics.reduce((acc: Record<string, number>, metric: string) => {
                                acc[metric] = 0;
                                return acc;
                              }, {})
                            ]
                          }
                        }));
                      }}
                    >
                      Add Set
                    </button>
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
                      {workoutTargetMetrics[workout.name]?.sets.map((set, setIndex) => (
                        <div key={setIndex} className="set-section">
                          <h5>Set {setIndex + 1}</h5>
                          {metrics.map((metricName: string) => (
                            <div key={`${workout.name}-${setIndex}-${metricName}`} className="form-group">
                              <label htmlFor={`actual-${workout.name}-${setIndex}-${metricName}`}>{metricName}:</label>
                              <input
                                type="number"
                                id={`actual-${workout.name}-${setIndex}-${metricName}`}
                                value={workoutActualMetrics[workout.name]?.sets[setIndex]?.[metricName] || ''}
                                onChange={(e) => {
                                  const newValue = Number(e.target.value);
                                  setWorkoutActualMetrics(current => ({
                                    ...current,
                                    [workout.name]: {
                                      sets: (current[workout.name]?.sets || []).map((s, i) =>
                                        i === setIndex
                                          ? { ...s, [metricName]: newValue }
                                          : s
                                      )
                                    }
                                  }));
                                }}
                                required
                              />
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            </>
          )}

          <button type="submit">Save Changes</button>
        </form>
      </div>
    </div>
  );
}; 