import { useTable } from 'tinybase/ui-react';
import { useState } from 'react';
import { WorkoutForm } from './WorkoutForm';
import './WorkoutsView.css';
import { WorkoutData, ExerciseData, MethodData } from '../Sessions/types';

export const WorkoutsView = () => {
  const workouts = useTable('workouts') as Record<string, WorkoutData>;
  const exercises = useTable('exercises') as Record<string, ExerciseData>;
  const methods = useTable('methods') as Record<string, MethodData>;
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showWorkoutForm, setShowWorkoutForm] = useState(false);
  const [expandedWorkouts, setExpandedWorkouts] = useState<Record<string, boolean>>({});

  const toggleWorkoutExpansion = (id: string) => {
    setExpandedWorkouts(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const categories = Array.from(
    new Set(Object.values(exercises).map(exercise => exercise.category))
  );

  const filteredWorkouts = Object.entries(workouts)
    .filter(([_, workout]) => {
      const exercise = exercises[workout.exerciseId];
      return selectedCategory === 'all' || exercise.category === selectedCategory;
    })
    .sort(([_, a], [__, b]) => {
      const exerciseA = exercises[a.exerciseId];
      const exerciseB = exercises[b.exerciseId];
      return exerciseA.name.localeCompare(exerciseB.name);
    });

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
          <button
            className="new-workout-button"
            onClick={() => setShowWorkoutForm(true)}
          >
            New Workout
          </button>
        </div>
      </div>

      {showWorkoutForm && (
        <WorkoutForm onClose={() => setShowWorkoutForm(false)} />
      )}

      {filteredWorkouts.length === 0 ? (
        <p className="no-workouts">No workouts found</p>
      ) : (
        <ul className="workouts-list">
          {filteredWorkouts.map(([id, workout]) => {
            const exercise = exercises[workout.exerciseId];
            const method = methods[workout.methodId];
            const methodSets = JSON.parse(method.sets);
            const defaultMetrics = methodSets[0].targetMetrics;
            const isExpanded = expandedWorkouts[id] || false;

            return (
              <li key={id} className="workout-item" onClick={() => toggleWorkoutExpansion(id)}>
                <div className="workout-header">
                  <div className="workout-title">
                    <h3>{exercise.name}</h3>
                    <span className="method-name">{method.name}</span>
                  </div>
                  <span className="category-tag">{exercise.category}</span>
                </div>
                <p className="method-description">{method.description}</p>

                {!isExpanded ? (
                  <div className="metrics-section">
                    <h4>Target Metrics (Set 1)</h4>
                    <div className="metric-tags">
                      {defaultMetrics.map((metric: { name: string, value: number }) => (
                        <span key={metric.name} className="metric-tag">
                          {metric.name}: {metric.value}
                        </span>
                      ))}
                    </div>
                    <div className="show-more">Click to see all sets ▼</div>
                  </div>
                ) : (
                  <div className="metrics-section expanded">
                    <h4>Target Metrics (All Sets)</h4>
                    {methodSets.map((set: { targetMetrics: Array<{ name: string, value: number }> }, setIndex: number) => (
                      <div key={setIndex} className="set-metrics">
                        <h5>Set {setIndex + 1}</h5>
                        <div className="metric-tags">
                          {set.targetMetrics.map((metric) => (
                            <span key={metric.name} className="metric-tag">
                              {metric.name}: {metric.value}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                    <div className="show-less">Click to hide ▲</div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}; 