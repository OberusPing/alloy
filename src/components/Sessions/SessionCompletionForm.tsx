import { useState } from 'react';
import { useStore } from 'tinybase/ui-react';
import './SessionCompletionForm.css';

type SessionCompletionFormProps = {
  isOpen: boolean;
  onClose: () => void;
  session: {
    id: string;
    workouts: Array<{
      workoutName: string;
      targetMetrics: string;
    }>;
  };
};

export const SessionCompletionForm = ({ isOpen, onClose, session }: SessionCompletionFormProps) => {
  const [completedDate, setCompletedDate] = useState(new Date().toISOString().split('T')[0]);
  const [workoutMetrics, setWorkoutMetrics] = useState<Record<string, Record<string, number>>>({});
  const store = useStore()!;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    store.setRow('sessions', session.id, {
      ...store.getRow('sessions', session.id)!,
      completed: true,
      completedDate,
      actualMetrics: JSON.stringify(
        Object.entries(workoutMetrics).map(([workoutName, metrics]) => ({
          workoutName,
          metrics: Object.entries(metrics).map(([name, value]) => ({
            name,
            value
          }))
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

          {session.workouts.map((workout) => {
            const targetMetrics = JSON.parse(workout.targetMetrics);
            return (
              <div key={workout.workoutName} className="workout-section">
                <h3>{workout.workoutName}</h3>
                <div className="metric-inputs">
                  <h4>Actual Metrics</h4>
                  {targetMetrics.map((metric: { name: string, value: number }) => (
                    <div key={`${workout.workoutName}-${metric.name}`} className="form-group">
                      <label htmlFor={`actual-${workout.workoutName}-${metric.name}`}>
                        {metric.name}:
                        <span className="target-value">(Target: {metric.value})</span>
                      </label>
                      <input
                        type="number"
                        id={`actual-${workout.workoutName}-${metric.name}`}
                        value={workoutMetrics[workout.workoutName]?.[metric.name] || ''}
                        onChange={(e) => setWorkoutMetrics({
                          ...workoutMetrics,
                          [workout.workoutName]: {
                            ...workoutMetrics[workout.workoutName],
                            [metric.name]: Number(e.target.value)
                          }
                        })}
                        required
                      />
                    </div>
                  ))}
                </div>
              </div>
            );
          })}

          <button type="submit">Complete Session</button>
        </form>
      </div>
    </div>
  );
}; 