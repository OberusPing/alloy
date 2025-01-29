import { useState, useEffect } from 'react';
import { useStore, useTable } from 'tinybase/ui-react';
import './SessionEditForm.css';
import { Row, Cell } from 'tinybase';

type WorkoutData = {
  name: string;
  category: string;
  recordMetrics: string;
};

interface Session extends Row {
  plannedDate: Cell;
  workoutName: Cell;
  completed: Cell;
  completedDate: Cell;
  targetMetrics: Cell;
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
  const [selectedWorkout, setSelectedWorkout] = useState<string>('');
  const [targetMetrics, setTargetMetrics] = useState<Record<string, number>>({});
  const [completed, setCompleted] = useState<boolean>(false);
  const [completedDate, setCompletedDate] = useState<string>('');
  const [actualMetrics, setActualMetrics] = useState<Record<string, number>>({});

  useEffect(() => {
    if (isOpen) {
      const session = store.getRow('sessions', sessionId) as Session;
      if (session) {
        const workoutId = Object.entries(workouts).find(
          ([_, workout]) => workout.name === String(session.workoutName)
        )?.[0] || '';
        
        setSelectedWorkout(workoutId);
        setPlannedDate(String(session.plannedDate));
        setCompleted(Boolean(session.completed));
        setCompletedDate(session.completedDate ? String(session.completedDate) : '');
        
        // Parse target metrics
        const parsedTargetMetrics = JSON.parse(String(session.targetMetrics));
        setTargetMetrics(parsedTargetMetrics.reduce(
          (acc: Record<string, number>, curr: { name: string; value: number }) => {
            acc[curr.name] = curr.value;
            return acc;
          },
          {}
        ));

        if (session.actualMetrics) {
          const parsedActualMetrics = JSON.parse(String(session.actualMetrics));
          setActualMetrics(parsedActualMetrics.reduce(
            (acc: Record<string, number>, curr: { name: string; value: number }) => {
              acc[curr.name] = curr.value;
              return acc;
            },
            {}
          ));
        }
      }
    }
  }, [isOpen, sessionId, store, workouts]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const updatedSession: Record<string, Cell> = {
      plannedDate: plannedDate as Cell,
      workoutName: workouts[selectedWorkout].name as Cell,
      completed: completed as Cell,
      targetMetrics: JSON.stringify(
        Object.entries(targetMetrics).map(([name, value]) => ({
          name,
          value
        }))
      ) as Cell
    };

    if (completed) {
      updatedSession.completedDate = completedDate as Cell;
      updatedSession.actualMetrics = JSON.stringify(
        Object.entries(actualMetrics).map(([name, value]) => ({
          name,
          value
        }))
      ) as Cell;
    }

    store.setRow('sessions', sessionId, updatedSession);
    onClose();
  };

  if (!isOpen) return null;

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