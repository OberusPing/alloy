import { useTable, useStore } from 'tinybase/ui-react';
import { useState } from 'react';
import './SessionForm.css';  // We'll create this next

type WorkoutData = {
  name: string;
  category: string;
  recordMetrics: string; // JSON string of metrics
};

type SessionFormProps = {
  isOpen: boolean;
  onClose: () => void;
};

export const SessionForm = ({ isOpen, onClose }: SessionFormProps) => {
  const [selectedWorkout, setSelectedWorkout] = useState('');
  const [metricValues, setMetricValues] = useState<Record<string, number>>({});
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  
  const workouts = useTable('workouts') as Record<string, WorkoutData>;
  const store = useStore()!;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWorkout) return;

    // Add the new session directly using the store
    store.addRow('sessions', {
      date: date,
      workoutName: workouts[selectedWorkout].name,
      completed: false,
      targetMetrics: JSON.stringify(
        Object.entries(metricValues).map(([name, value]) => ({
          name,
          value
        }))
      )
    });

    // Reset form and close
    setSelectedWorkout('');
    setMetricValues({});
    setDate(new Date().toISOString().split('T')[0]);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <button className="close-button" onClick={onClose}>×</button>
        <h2>Create New Session</h2>
        <form onSubmit={handleSubmit} className="session-form">
          <div className="form-group">
            <label htmlFor="date">Date:</label>
            <input
              type="date"
              id="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
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

          {selectedWorkout && (
            <div className="metric-inputs">
              <h3>Target Metrics</h3>
              {JSON.parse(workouts[selectedWorkout].recordMetrics).map((metric: string) => (
                <div key={metric} className="form-group">
                  <label htmlFor={metric}>{metric}:</label>
                  <input
                    type="number"
                    id={metric}
                    value={metricValues[metric] || ''}
                    onChange={(e) => setMetricValues({
                      ...metricValues,
                      [metric]: Number(e.target.value)
                    })}
                    required
                  />
                </div>
              ))}
            </div>
          )}

          <button type="submit" disabled={!selectedWorkout}>
            Create Session
          </button>
        </form>
      </div>
    </div>
  );
};