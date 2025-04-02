import { useState } from 'react';
import { useStore, useTable } from 'tinybase/ui-react';
import './WorkoutForm.css';
import { ExerciseData, MethodData } from '../Sessions/types';

type WorkoutFormProps = {
  onClose: () => void;
};

export const WorkoutForm = ({ onClose }: WorkoutFormProps) => {
  const [selectedExerciseId, setSelectedExerciseId] = useState<string>('');
  const [selectedMethodId, setSelectedMethodId] = useState<string>('');
  const store = useStore()!;

  const exercises = useTable('exercises') as Record<string, ExerciseData>;
  const methods = useTable('methods') as Record<string, MethodData>;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedExerciseId || !selectedMethodId) {
      alert('Please select both an exercise and a method');
      return;
    }

    store.setRow('workouts', crypto.randomUUID(), {
      exerciseId: selectedExerciseId,
      methodId: selectedMethodId,
    });

    onClose();
  };

  return (
    <div className="workout-form-overlay">
      <div className="workout-form">
        <h2>Create New Workout</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="exercise">Exercise</label>
            <select
              id="exercise"
              value={selectedExerciseId}
              onChange={(e) => setSelectedExerciseId(e.target.value)}
              required
            >
              <option value="">Select an exercise</option>
              {Object.entries(exercises).map(([id, exercise]) => (
                <option key={id} value={id}>
                  {exercise.name} ({exercise.category})
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="method">Method</label>
            <select
              id="method"
              value={selectedMethodId}
              onChange={(e) => setSelectedMethodId(e.target.value)}
              required
            >
              <option value="">Select a method</option>
              {Object.entries(methods).map(([id, method]) => (
                <option key={id} value={id}>
                  {method.name}
                </option>
              ))}
            </select>
          </div>

          {selectedMethodId && (
            <div className="form-group">
              <label>Default Metrics by Set</label>
              <div className="default-metrics">
                {JSON.parse(methods[selectedMethodId].sets).map(
                  (set: { targetMetrics: Array<{ name: string, value: number }> }, setIndex: number) => (
                    <div key={setIndex} className="default-set">
                      <h5>Set {setIndex + 1}</h5>
                      {set.targetMetrics.map((metric) => (
                        <div key={metric.name} className="default-metric">
                          {metric.name}: {metric.value}
                        </div>
                      ))}
                    </div>
                  )
                )}
              </div>
            </div>
          )}

          <div className="form-actions">
            <button type="button" onClick={onClose} className="cancel-button">
              Cancel
            </button>
            <button type="submit" className="submit-button">
              Create Workout
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}; 