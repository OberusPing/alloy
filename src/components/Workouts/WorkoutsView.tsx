import { useTable } from 'tinybase/ui-react';
import { useState } from 'react';
import './WorkoutsView.css';

type WorkoutData = {
  name: string;
  category: string;
  recordMetrics: string;
};

export const WorkoutsView = () => {
  const workouts = useTable('workouts') as Record<string, WorkoutData>;
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const categories = Array.from(
    new Set(Object.values(workouts).map(workout => workout.category))
  );

  const filteredWorkouts = Object.entries(workouts)
    .filter(([_, workout]) => 
      selectedCategory === 'all' || workout.category === selectedCategory
    )
    .sort(([_, a], [__, b]) => a.name.localeCompare(b.name));

  return (
    <div className="workouts-view">
      <div className="workouts-view-header">
        <h2>Workouts</h2>
        <div className="filter-controls">
          <select 
            value={selectedCategory} 
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="category-filter"
          >
            <option value="all">All Categories</option>
            {categories.map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
        </div>
      </div>

      {filteredWorkouts.length === 0 ? (
        <p className="no-workouts">No workouts found</p>
      ) : (
        <ul className="workouts-list">
          {filteredWorkouts.map(([id, workout]) => {
            const metrics = JSON.parse(workout.recordMetrics);
            return (
              <li key={id} className="workout-item">
                <div className="workout-header">
                  <h3>{workout.name}</h3>
                  <span className="category-tag">{workout.category}</span>
                </div>
                <div className="metrics-list">
                  <h4>Recorded Metrics:</h4>
                  <div className="metric-tags">
                    {metrics.map((metric: string) => (
                      <span key={metric} className="metric-tag">
                        {metric}
                      </span>
                    ))}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}; 