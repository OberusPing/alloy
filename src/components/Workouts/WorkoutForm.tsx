import { useState } from 'react';
import { useStore } from 'tinybase/ui-react';
import './WorkoutForm.css';

type WorkoutFormProps = {
  onClose: () => void;
};

export const WorkoutForm = ({ onClose }: WorkoutFormProps) => {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [metrics, setMetrics] = useState<string[]>(['']);
  const store = useStore()!;

  const handleAddMetric = () => {
    setMetrics([...metrics, '']);
  };

  const handleMetricChange = (index: number, value: string) => {
    const newMetrics = [...metrics];
    newMetrics[index] = value;
    setMetrics(newMetrics);
  };

  const handleRemoveMetric = (index: number) => {
    const newMetrics = metrics.filter((_, i) => i !== index);
    setMetrics(newMetrics);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Filter out empty metrics
    const filteredMetrics = metrics.filter(metric => metric.trim() !== '');
    
    store.setRow('workouts', crypto.randomUUID(), {
      name,
      category,
      recordMetrics: JSON.stringify(filteredMetrics),
    });
    
    onClose();
  };

  return (
    <div className="workout-form-overlay">
      <div className="workout-form">
        <h2>Create New Workout</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="name">Workout Name</label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="category">Category</label>
            <input
              type="text"
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>Record Metrics</label>
            {metrics.map((metric, index) => (
              <div key={index} className="metric-input">
                <input
                  type="text"
                  value={metric}
                  onChange={(e) => handleMetricChange(index, e.target.value)}
                  placeholder="Enter metric (e.g., 'Weight', 'Reps')"
                />
                <button
                  type="button"
                  onClick={() => handleRemoveMetric(index)}
                  className="remove-metric"
                >
                  ✕
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={handleAddMetric}
              className="add-metric"
            >
              Add Metric
            </button>
          </div>

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