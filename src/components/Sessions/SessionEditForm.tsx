import { useState, useEffect } from 'react';
import { useStore, useTable } from 'tinybase/ui-react';
import './SessionEditForm.css';

type WorkoutData = {
  name: string;
  category: string;
  recordMetrics: string;
};

type SessionEditFormProps = {
  isOpen: boolean;
  onClose: () => void;
  sessionId: string;
};

export const SessionEditForm = ({ isOpen, onClose, sessionId }: SessionEditFormProps) => {
  const store = useStore()!;
  const workouts = useTable('workouts') as Record<string, WorkoutData>;
  const session = store.getRow('sessions', sessionId);

  const [plannedDate, setPlannedDate] = useState(session?.plannedDate || '');
  const [selectedWorkout, setSelectedWorkout] = useState('');
  const [targetMetrics, setTargetMetrics] = useState<Record<string, number>>({});
  const [completed, setCompleted] = useState(session?.completed || false);
  const [completedDate, setCompletedDate] = useState(session?.completedDate || '');
  const [actualMetrics, setActualMetrics] = useState<Record<string, number>>({});

  useEffect(() => {
    if (session) {
      // Find workout ID by name
      const workoutId = Object.entries(workouts).find(
        ([_, workout]) => workout.name === session.workoutName
      )?.[0] || '';
      
      setSelectedWorkout(workoutId);
      setPlannedDate(session.plannedDate);
      setCompleted(session.completed);
      setCompletedDate(session.completedDate || '');
      
      // Parse target metrics
      const parsedTargetMetrics = JSON.parse(session.targetMetrics);
      const targetMetricsObj = parsedTargetMetrics.reduce(
        (acc: Record<string, number>, curr: { name: string; value: number }) => {
          acc[curr.name] = curr.value;
          return acc;
        },
        {}
      );
      setTargetMetrics(targetMetricsObj);

      // Parse actual metrics if they exist
      if (session.actualMetrics) {
        const parsedActualMetrics = JSON.parse(session.actualMetrics);
        const actualMetricsObj = parsedActualMetrics.reduce(
          (acc: Record<string, number>, curr: { name: string; value: number }) => {
            acc[curr.name] = curr.value;
            return acc;
          },
          {}
        );
        setActualMetrics(actualMetricsObj);
      }
    }
  }, [session, workouts]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const updatedSession = {
      plannedDate,
      workoutName: workouts[selectedWorkout].name,
      completed,
      targetMetrics: JSON.stringify(
        Object.entries(targetMetrics).map(([name, value]) => ({
          name,
          value
        }))
      )
    };

    if (completed) {
      updatedSession.completedDate = completedDate;
      updatedSession.actualMetrics = JSON.stringify(
        Object.entries(actualMetrics).map(([name, value]) => ({
          name,
          value
        }))
      );
    }

    store.setRow('sessions', sessionId, updatedSession);
    onClose();
  };

  if (!isOpen || !session) return null;

  const selectedWorkoutMetrics = selectedWorkout 
    ? JSON.parse(workouts[selectedWorkout].recordMetrics) 
    : [];

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
            <label htmlFor="workout">Workout:</label>
            <select
              id="workout"
              value={selectedWorkout}
              onChange={(e) => setSelectedWorkout(e.target.value)}
              required
            >
              <option value="">Select a workout</option>
              {Object.entries(workouts).map(([id, workout]) => (
                <option key={id} value={id}>
                  {workout.name} ({workout.category})
                </option>
              ))}
            </select>
          </div>

          {selectedWorkoutMetrics.length > 0 && (
            <div className="metric-inputs">
              <h3>Target Metrics</h3>
              {selectedWorkoutMetrics.map((metric: string) => (
                <div key={metric} className="form-group">
                  <label htmlFor={`target-${metric}`}>{metric}:</label>
                  <input
                    type="number"
                    id={`target-${metric}`}
                    value={targetMetrics[metric] || ''}
                    onChange={(e) => setTargetMetrics({
                      ...targetMetrics,
                      [metric]: Number(e.target.value)
                    })}
                    required
                  />
                </div>
              ))}
            </div>
          )}

          <div className="form-group">
            <label>
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
                {selectedWorkoutMetrics.map((metric: string) => (
                  <div key={metric} className="form-group">
                    <label htmlFor={`actual-${metric}`}>
                      {metric}:
                      <span className="target-value">
                        (Target: {targetMetrics[metric]})
                      </span>
                    </label>
                    <input
                      type="number"
                      id={`actual-${metric}`}
                      value={actualMetrics[metric] || ''}
                      onChange={(e) => setActualMetrics({
                        ...actualMetrics,
                        [metric]: Number(e.target.value)
                      })}
                      required
                    />
                  </div>
                ))}
              </div>
            </>
          )}

          <button type="submit">Save Changes</button>
        </form>
      </div>
    </div>
  );
}; 