import { useState } from 'react';
import { useStore, useTable } from 'tinybase/ui-react';
import './SessionCompletionForm.css';
import { WorkoutSet } from './types';

type SessionCompletionFormProps = {
  isOpen: boolean;
  onClose: () => void;
  session: {
    id: string;
    workouts: WorkoutSet[];
  };
};

type WorkoutMetricsState = {
  [workoutId: string]: {
    sets: Array<{
      [metricName: string]: number;
    }>;
  };
};

export const SessionCompletionForm = ({ isOpen, onClose, session }: SessionCompletionFormProps) => {
  const [completedDate, setCompletedDate] = useState(new Date().toISOString().split('T')[0]);
  const [workoutMetrics, setWorkoutMetrics] = useState<WorkoutMetricsState>({});
  const store = useStore()!;
  const workoutsTable = useTable('workouts') as Record<string, { exerciseId: string; methodId: string }>;
  const exercisesTable = useTable('exercises') as Record<string, { name: string; category: string }>;
  const methodsTable = useTable('methods') as Record<string, { name: string; description: string }>;

  const getWorkoutName = (workout: WorkoutSet) => {
    const workoutData = workoutsTable[workout.workoutId];
    const exercise = exercisesTable[workoutData.exerciseId];
    const method = methodsTable[workoutData.methodId];
    return `${exercise.name} - ${method.name}`;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    store.setRow('sessions', session.id, {
      ...store.getRow('sessions', session.id)!,
      completed: true,
      completedDate,
      actualMetrics: JSON.stringify(
        session.workouts.map(workout => ({
          workoutId: workout.workoutId,
          sets: workoutMetrics[workout.workoutId]?.sets.map(set => ({
            metrics: Object.entries(set).map(([name, value]) => ({
              name,
              value
            }))
          })) || []
        }))
      )
    });

    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <button className="close-button" onClick={onClose}>×</button>
        <h2>Complete Session</h2>
        <form onSubmit={handleSubmit} className="completion-form">
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

          {session.workouts.map((workout) => (
            <div key={workout.workoutId} className="workout-section">
              <h3>{getWorkoutName(workout)}</h3>
              {workout.sets.map((set, setIndex) => (
                <div key={setIndex} className="set-section">
                  <h4>Set {setIndex + 1}</h4>
                  <div className="metric-inputs">
                    {set.targetMetrics.map((metric) => (
                      <div key={`${workout.workoutId}-${setIndex}-${metric.name}`} className="form-group">
                        <label htmlFor={`actual-${workout.workoutId}-${setIndex}-${metric.name}`}>
                          {metric.name}:
                          <span className="target-value">(Target: {metric.value})</span>
                        </label>
                        <input
                          type="number"
                          id={`actual-${workout.workoutId}-${setIndex}-${metric.name}`}
                          value={workoutMetrics[workout.workoutId]?.sets[setIndex]?.[metric.name] || ''}
                          onChange={(e) => {
                            const newValue = Number(e.target.value);
                            setWorkoutMetrics(current => ({
                              ...current,
                              [workout.workoutId]: {
                                sets: current[workout.workoutId]?.sets.map((s, i) =>
                                  i === setIndex
                                    ? { ...s, [metric.name]: newValue }
                                    : s
                                ) || Array(workout.sets.length).fill({})
                              }
                            }));
                          }}
                          required
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ))}

          <button type="submit">Complete Session</button>
        </form>
      </div>
    </div>
  );
}; 