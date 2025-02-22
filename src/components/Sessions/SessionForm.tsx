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
  const [selectedWorkouts, setSelectedWorkouts] = useState<string[]>([]);
  const [workoutMetrics, setWorkoutMetrics] = useState<Record<string, Record<string, number>>>({});
  const [plannedDate, setPlannedDate] = useState(new Date().toISOString().split('T')[0]);
  
  const workouts = useTable('workouts') as Record<string, WorkoutData>;
  const store = useStore()!;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedWorkouts.length === 0) return;

    store.addRow('sessions', {
      plannedDate: plannedDate,
      workouts: JSON.stringify(
        selectedWorkouts.map(workoutId => ({
          workoutId, // Add this to track the original workout
          workoutName: workouts[workoutId].name,
          targetMetrics: workoutMetrics[workoutId] 
            ? Object.entries(workoutMetrics[workoutId]).map(([name, value]) => ({
                name,
                value: value.toString() // Convert number to string for consistent JSON handling
              }))
            : []
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

  const handleAddWorkout = (workoutId: string) => {
    if (!workoutId || selectedWorkouts.includes(workoutId)) return;
    setSelectedWorkouts(current => [...current, workoutId]);
  };

  const handleRemoveWorkout = (workoutId: string) => {
    setSelectedWorkouts(current => current.filter(id => id !== workoutId));
    setWorkoutMetrics(metrics => {
      const newMetrics = { ...metrics };
      delete newMetrics[workoutId];
      return newMetrics;
    });
  };

  const handleMetricChange = (workoutId: string, metricName: string, value: number) => {
    setWorkoutMetrics(current => ({
      ...current,
      [workoutId]: {
        ...current[workoutId],
        [metricName]: value
      }
    }));
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
              value={plannedDate}
              onChange={(e) => setPlannedDate(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="workout-select">Add Workout:</label>
            <div className="workout-select-group">
              <select
                id="workout-select"
                onChange={(e) => handleAddWorkout(e.target.value)}
                value=""
              >
                <option value="">Select a workout</option>
                {Object.entries(workouts)
                  .filter(([id]) => !selectedWorkouts.includes(id))
                  .map(([id, workout]) => (
                    <option key={id} value={id}>
                      {workout.name} ({workout.category})
                    </option>
                  ))}
              </select>
            </div>
          </div>

          {selectedWorkouts.map(workoutId => (
            <div key={workoutId} className="workout-section">
              <div className="workout-header">
                <h3>{workouts[workoutId].name}</h3>
                <button 
                  type="button" 
                  className="remove-workout"
                  onClick={() => handleRemoveWorkout(workoutId)}
                >
                  Remove
                </button>
              </div>
              <div className="metric-inputs">
                {JSON.parse(workouts[workoutId].recordMetrics).map((metric: string) => (
                  <div key={metric} className="form-group">
                    <label htmlFor={`${workoutId}-${metric}`}>{metric}:</label>
                    <input
                      type="number"
                      id={`${workoutId}-${metric}`}
                      value={workoutMetrics[workoutId]?.[metric] || ''}
                      onChange={(e) => handleMetricChange(
                        workoutId,
                        metric,
                        Number(e.target.value)
                      )}
                      required
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}

          <button type="submit" disabled={selectedWorkouts.length === 0}>
            Create Session
          </button>
        </form>
      </div>
    </div>
  );
};