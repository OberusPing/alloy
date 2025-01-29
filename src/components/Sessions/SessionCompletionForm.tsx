import { useState } from 'react';
import { useStore } from 'tinybase/ui-react';
import './SessionCompletionForm.css';

type SessionCompletionFormProps = {
  isOpen: boolean;
  onClose: () => void;
  session: {
    id: string;
    workoutName: string;
    targetMetrics: string;
  };
};

export const SessionCompletionForm = ({ isOpen, onClose, session }: SessionCompletionFormProps) => {
  const [completedDate, setCompletedDate] = useState(new Date().toISOString().split('T')[0]);
  const [metricValues, setMetricValues] = useState<Record<string, number>>({});
  const store = useStore()!;

  const targetMetrics = JSON.parse(session.targetMetrics);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    store.setRow('sessions', session.id, {
      ...store.getRow('sessions', session.id)!,
      completed: true,
      completedDate,
      actualMetrics: JSON.stringify(
        targetMetrics.map((metric: { name: string }) => ({
          name: metric.name,
          value: metricValues[metric.name] || 0
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
        <h2>Complete Session: {session.workoutName}</h2>
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

          <div className="metric-inputs">
            <h3>Actual Metrics</h3>
            {targetMetrics.map((metric: { name: string, value: number }) => (
              <div key={metric.name} className="form-group">
                <label htmlFor={`actual-${metric.name}`}>
                  {metric.name}:
                  <span className="target-value">(Target: {metric.value})</span>
                </label>
                <input
                  type="number"
                  id={`actual-${metric.name}`}
                  value={metricValues[metric.name] || ''}
                  onChange={(e) => setMetricValues({
                    ...metricValues,
                    [metric.name]: Number(e.target.value)
                  })}
                  required
                />
              </div>
            ))}
          </div>

          <button type="submit">Complete Session</button>
        </form>
      </div>
    </div>
  );
}; 