import { useState } from 'react';
import { useStore, useTable } from 'tinybase/ui-react';
import './SessionForm.css';
import { WorkoutData, ExerciseData, MethodData, WorkoutMetricsState, Metric } from './types';

type SessionFormProps = {
  isOpen: boolean;
  onClose: () => void;
};

export const SessionForm = ({ isOpen, onClose }: SessionFormProps) => {
  const [selectedWorkouts, setSelectedWorkouts] = useState<string[]>([]);
  const [workoutMetrics, setWorkoutMetrics] = useState<WorkoutMetricsState>({});
  const [plannedDate, setPlannedDate] = useState(new Date().toISOString().split('T')[0]);

  const workouts = useTable('workouts') as Record<string, WorkoutData>;
  const exercises = useTable('exercises') as Record<string, ExerciseData>;
  const methods = useTable('methods') as Record<string, MethodData>;
  const store = useStore()!;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedWorkouts.length === 0) return;

    store.addRow('sessions', {
      plannedDate: plannedDate,
      workouts: JSON.stringify(
        selectedWorkouts.map(workoutId => ({
          workoutId,
          sets: workoutMetrics[workoutId]?.sets.map(set => ({
            targetMetrics: Object.entries(set).map(([name, value]) => ({
              name,
              value
            }))
          })) || []
        }))
      ),
      completed: false
    });

    // Reset form and close
    setSelectedWorkouts([]);
    setWorkoutMetrics({});
    setPlannedDate(new Date().toISOString().split('T')[0]);
    onClose();
  };

  const getDefaultMetricsForSet = (method: MethodData, setIndex: number, totalSets: number) => {
    // Parse the sets from the method
    const methodSets = JSON.parse(method.sets);

    // If there's a matching set in the method, use it
    if (methodSets.length > setIndex) {
      return methodSets[setIndex].targetMetrics;
    }

    // Otherwise, use the last set as a template
    const lastSet = methodSets[methodSets.length - 1];
    return lastSet.targetMetrics;
  };

  const handleAddWorkout = (workoutId: string) => {
    if (!workoutId || selectedWorkouts.includes(workoutId)) return;

    const workout = workouts[workoutId];
    const method = methods[workout.methodId];
    const defaultMetrics = getDefaultMetricsForSet(method, 0, 1);

    // Convert default metrics to the format expected by the form
    const defaultSet = defaultMetrics.reduce((acc: { [key: string]: number }, metric: { name: string, value: number }) => {
      acc[metric.name] = metric.value;
      return acc;
    }, {});

    setSelectedWorkouts(current => [...current, workoutId]);
    // Initialize with one set using default metrics
    setWorkoutMetrics(current => ({
      ...current,
      [workoutId]: {
        sets: [defaultSet]
      }
    }));
  };

  const handleRemoveWorkout = (workoutId: string) => {
    setSelectedWorkouts(current => current.filter(id => id !== workoutId));
    setWorkoutMetrics(metrics => {
      const newMetrics = { ...metrics };
      delete newMetrics[workoutId];
      return newMetrics;
    });
  };

  const handleAddSet = (workoutId: string) => {
    const workout = workouts[workoutId];
    const method = methods[workout.methodId];
    const currentSets = workoutMetrics[workoutId]?.sets || [];
    const defaultMetrics = getDefaultMetricsForSet(method, currentSets.length, currentSets.length + 1);

    // Convert default metrics to the format expected by the form
    const defaultSet = defaultMetrics.reduce((acc: { [key: string]: number }, metric: { name: string, value: number }) => {
      acc[metric.name] = metric.value;
      return acc;
    }, {});

    setWorkoutMetrics(current => ({
      ...current,
      [workoutId]: {
        sets: [...currentSets, defaultSet]
      }
    }));
  };

  const handleRemoveSet = (workoutId: string, setIndex: number) => {
    setWorkoutMetrics(current => ({
      ...current,
      [workoutId]: {
        sets: current[workoutId].sets.filter((_, index) => index !== setIndex)
      }
    }));
  };

  const handleMetricChange = (
    workoutId: string,
    setIndex: number,
    metric: string,
    value: number
  ) => {
    setWorkoutMetrics(current => ({
      ...current,
      [workoutId]: {
        sets: current[workoutId].sets.map((set, index) => {
          if (index === setIndex) {
            return { ...set, [metric]: value };
          }
          return set;
        })
      }
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <button className="close-button" onClick={onClose}>×</button>
        <form onSubmit={handleSubmit} className="session-form">
          <div className="form-group">
            <label htmlFor="plannedDate">Planned Date</label>
            <input
              type="date"
              id="plannedDate"
              value={plannedDate}
              onChange={(e) => setPlannedDate(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>Workouts</label>
            <select
              value=""
              onChange={(e) => handleAddWorkout(e.target.value)}
            >
              <option value="">Select a workout</option>
              {Object.entries(workouts).map(([id, workout]) => {
                const exercise = exercises[workout.exerciseId];
                const method = methods[workout.methodId];
                return (
                  <option key={id} value={id}>
                    {exercise.name} - {method.name}
                  </option>
                );
              })}
            </select>
          </div>

          {selectedWorkouts.map(workoutId => {
            const workout = workouts[workoutId];
            const exercise = exercises[workout.exerciseId];
            const method = methods[workout.methodId];

            return (
              <div key={workoutId} className="workout-section">
                <div className="workout-header">
                  <h3>{exercise.name} - {method.name}</h3>
                  <button
                    type="button"
                    className="remove-workout"
                    onClick={() => handleRemoveWorkout(workoutId)}
                  >
                    Remove
                  </button>
                </div>
                <p className="method-description">{method.description}</p>
                <div className="default-metrics">
                  <h4>Default Metrics by Set</h4>
                  {JSON.parse(method.sets).map((set: { targetMetrics: Metric[] }, setIndex: number) => (
                    <div key={setIndex} className="default-set">
                      <h5>Set {setIndex + 1}</h5>
                      {set.targetMetrics.map((metric: Metric) => (
                        <div key={metric.name} className="default-metric">
                          {metric.name}: {metric.value}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
                {workoutMetrics[workoutId]?.sets.map((set, setIndex) => (
                  <div key={setIndex} className="set-section">
                    <div className="set-header">
                      <h4>Set {setIndex + 1}</h4>
                      {setIndex > 0 && (
                        <button
                          type="button"
                          className="remove-set"
                          onClick={() => handleRemoveSet(workoutId, setIndex)}
                        >
                          Remove Set
                        </button>
                      )}
                    </div>
                    <div className="metric-inputs">
                      {(() => {
                        const method = methods[workout.methodId];
                        const methodSets = JSON.parse(method.sets);
                        // Extract unique metric names from the first set (all sets should have same metrics)
                        const metricNames = methodSets[0].targetMetrics.map((m: { name: string }) => m.name);

                        return metricNames.map((metric: string) => (
                          <div key={metric} className="form-group">
                            <label htmlFor={`${workoutId}-${setIndex}-${metric}`}>{metric}:</label>
                            <input
                              type="number"
                              id={`${workoutId}-${setIndex}-${metric}`}
                              value={set[metric] || ''}
                              onChange={(e) => handleMetricChange(
                                workoutId,
                                setIndex,
                                metric,
                                Number(e.target.value)
                              )}
                              required
                            />
                          </div>
                        ));
                      })()}
                    </div>
                  </div>
                ))}
                <button
                  type="button"
                  className="add-set"
                  onClick={() => handleAddSet(workoutId)}
                >
                  Add Set
                </button>
              </div>
            );
          })}

          <div className="form-actions">
            <button type="button" onClick={onClose} className="cancel-button">
              Cancel
            </button>
            <button
              type="submit"
              className="submit-button"
              disabled={selectedWorkouts.length === 0}
            >
              Create Session
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};