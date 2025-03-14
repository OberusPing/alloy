import { StrictMode, useEffect } from 'react';
import { createStore } from 'tinybase';
import { Provider, useCreateStore } from 'tinybase/ui-react';
import { Inspector } from 'tinybase/ui-react-inspector';
import { createLocalPersister } from 'tinybase/persisters/persister-browser';
import { SessionsView } from './components/Sessions/SessionsView';
import { Sidebar } from './components/Sidebar/Sidebar';
import { WorkoutsView } from './components/Workouts/WorkoutsView';
import './App.css';
import './styles/common.css';
import { AnalyticsView } from './components/Analytics/AnalyticsView';

const SAMPLE_DATA = {
  sessions: {
    '1': {
      plannedDate: '2025-01-01',
      workouts: JSON.stringify([{
        workoutName: 'Norwegian 4x4',
        sets: [
          {
            targetMetrics: [
              { name: 'Average Heart Rate', value: 165 },
              { name: 'Max Heart Rate', value: 182 },
              { name: 'Duration', value: 45 }
            ]
          },
          {
            targetMetrics: [
              { name: 'Average Heart Rate', value: 170 },
              { name: 'Max Heart Rate', value: 185 },
              { name: 'Duration', value: 45 }
            ]
          }
        ]
      }]),
      completed: true,
      completedDate: '2025-01-01',
      actualMetrics: JSON.stringify([{
        workoutName: 'Norwegian 4x4',
        sets: [
          {
            metrics: [
              { name: 'Average Heart Rate', value: 168 },
              { name: 'Max Heart Rate', value: 185 },
              { name: 'Duration', value: 43 }
            ]
          },
          {
            metrics: [
              { name: 'Average Heart Rate', value: 172 },
              { name: 'Max Heart Rate', value: 187 },
              { name: 'Duration', value: 44 }
            ]
          }
        ]
      }])
    },
    '2': {
      plannedDate: '2025-01-05',
      workouts: JSON.stringify([{
        workoutName: 'Zone 2 Base',
        sets: [
          {
            targetMetrics: [
              { name: 'Average Heart Rate', value: 145 },
              { name: 'Max Heart Rate', value: 155 },
              { name: 'Duration', value: 60 }
            ]
          },
          {
            targetMetrics: [
              { name: 'Average Heart Rate', value: 145 },
              { name: 'Max Heart Rate', value: 155 },
              { name: 'Duration', value: 60 }
            ]
          }
        ]
      }]),
      completed: true,
      completedDate: '2025-01-05',
      actualMetrics: JSON.stringify([{
        workoutName: 'Zone 2 Base',
        sets: [
          {
            metrics: [
              { name: 'Average Heart Rate', value: 142 },
              { name: 'Max Heart Rate', value: 152 },
              { name: 'Duration', value: 62 }
            ]
          },
          {
            metrics: [
              { name: 'Average Heart Rate', value: 143 },
              { name: 'Max Heart Rate', value: 153 },
              { name: 'Duration', value: 63 }
            ]
          }
        ]
      }])
    },
    '3': {
      plannedDate: '2025-01-08',
      workouts: JSON.stringify([
        {
          workoutName: 'Threshold Intervals',
          sets: [
            {
              targetMetrics: [
                { name: 'Average Heart Rate', value: 172 },
                { name: 'Max Heart Rate', value: 188 },
                { name: 'Duration', value: 30 }
              ]
            },
            {
              targetMetrics: [
                { name: 'Average Heart Rate', value: 175 },
                { name: 'Max Heart Rate', value: 190 },
                { name: 'Duration', value: 30 }
              ]
            }
          ]
        },
        {
          workoutName: 'Zone 2 Base',
          sets: [
            {
              targetMetrics: [
                { name: 'Average Heart Rate', value: 145 },
                { name: 'Max Heart Rate', value: 155 },
                { name: 'Duration', value: 30 }
              ]
            }
          ]
        }
      ]),
      completed: true,
      completedDate: '2025-01-08',
      actualMetrics: JSON.stringify([
        {
          workoutName: 'Threshold Intervals',
          sets: [
            {
              metrics: [
                { name: 'Average Heart Rate', value: 175 },
                { name: 'Max Heart Rate', value: 189 },
                { name: 'Duration', value: 29 }
              ]
            },
            {
              metrics: [
                { name: 'Average Heart Rate', value: 177 },
                { name: 'Max Heart Rate', value: 191 },
                { name: 'Duration', value: 31 }
              ]
            }
          ]
        },
        {
          workoutName: 'Zone 2 Base',
          sets: [
            {
              metrics: [
                { name: 'Average Heart Rate', value: 144 },
                { name: 'Max Heart Rate', value: 154 },
                { name: 'Duration', value: 32 }
              ]
            }
          ]
        }
      ])
    },
    '4': {
      plannedDate: '2025-01-12',
      workouts: JSON.stringify([{
        workoutName: 'Norwegian 4x4',
        sets: [
          {
            targetMetrics: [
              { name: 'Average Heart Rate', value: 165 },
              { name: 'Max Heart Rate', value: 182 },
              { name: 'Duration', value: 45 }
            ]
          },
          {
            targetMetrics: [
              { name: 'Average Heart Rate', value: 170 },
              { name: 'Max Heart Rate', value: 185 },
              { name: 'Duration', value: 45 }
            ]
          }
        ]
      }]),
      completed: true,
      completedDate: '2025-01-12',
      actualMetrics: JSON.stringify([{
        workoutName: 'Norwegian 4x4',
        sets: [
          {
            metrics: [
              { name: 'Average Heart Rate', value: 171 },
              { name: 'Max Heart Rate', value: 187 },
              { name: 'Duration', value: 46 }
            ]
          },
          {
            metrics: [
              { name: 'Average Heart Rate', value: 173 },
              { name: 'Max Heart Rate', value: 189 },
              { name: 'Duration', value: 45 }
            ]
          }
        ]
      }])
    },
    '5': {
      plannedDate: '2025-01-15',
      workouts: JSON.stringify([{
        workoutName: 'Zone 2 Base',
        sets: [
          {
            targetMetrics: [
              { name: 'Average Heart Rate', value: 145 },
              { name: 'Max Heart Rate', value: 155 },
              { name: 'Duration', value: 60 }
            ]
          },
          {
            targetMetrics: [
              { name: 'Average Heart Rate', value: 145 },
              { name: 'Max Heart Rate', value: 155 },
              { name: 'Duration', value: 60 }
            ]
          }
        ]
      }]),
      completed: true,
      completedDate: '2025-01-15',
      actualMetrics: JSON.stringify([{
        workoutName: 'Zone 2 Base',
        sets: [
          {
            metrics: [
              { name: 'Average Heart Rate', value: 144 },
              { name: 'Max Heart Rate', value: 154 },
              { name: 'Duration', value: 58 }
            ]
          },
          {
            metrics: [
              { name: 'Average Heart Rate', value: 145 },
              { name: 'Max Heart Rate', value: 155 },
              { name: 'Duration', value: 60 }
            ]
          }
        ]
      }])
    },
    '6': {
      plannedDate: '2025-01-18',
      workouts: JSON.stringify([{
        workoutName: 'Threshold Intervals',
        sets: [
          {
            targetMetrics: [
              { name: 'Average Heart Rate', value: 172 },
              { name: 'Max Heart Rate', value: 188 },
              { name: 'Duration', value: 30 }
            ]
          },
          {
            targetMetrics: [
              { name: 'Average Heart Rate', value: 175 },
              { name: 'Max Heart Rate', value: 190 },
              { name: 'Duration', value: 30 }
            ]
          }
        ]
      }]),
      completed: true,
      completedDate: '2025-01-18',
      actualMetrics: JSON.stringify([{
        workoutName: 'Threshold Intervals',
        sets: [
          {
            metrics: [
              { name: 'Average Heart Rate', value: 173 },
              { name: 'Max Heart Rate', value: 190 },
              { name: 'Duration', value: 31 }
            ]
          },
          {
            metrics: [
              { name: 'Average Heart Rate', value: 176 },
              { name: 'Max Heart Rate', value: 192 },
              { name: 'Duration', value: 31 }
            ]
          }
        ]
      }])
    },
    '7': {
      plannedDate: '2025-01-29',
      workouts: JSON.stringify([{
        workoutName: 'Norwegian 4x4',
        sets: [
          {
            targetMetrics: [
              { name: 'Average Heart Rate', value: 165 },
              { name: 'Max Heart Rate', value: 182 },
              { name: 'Duration', value: 45 }
            ]
          },
          {
            targetMetrics: [
              { name: 'Average Heart Rate', value: 170 },
              { name: 'Max Heart Rate', value: 185 },
              { name: 'Duration', value: 45 }
            ]
          }
        ]
      }]),
      completed: false
    }
  },
  workouts: {
    '1': {
      name: 'Norwegian 4x4',
      category: 'Aerobic Endurance',
      recordMetrics: JSON.stringify(['Average Heart Rate', 'Max Heart Rate', 'Duration'])
    },
    '2': {
      name: 'Threshold Intervals',
      category: 'Lactate Threshold',
      recordMetrics: JSON.stringify(['Average Heart Rate', 'Max Heart Rate', 'Duration'])
    },
    '3': {
      name: 'Zone 2 Base',
      category: 'Base Endurance',
      recordMetrics: JSON.stringify(['Average Heart Rate', 'Max Heart Rate', 'Duration'])
    }
  }
};

export const App = () => {
  const store = useCreateStore(() => {
    return createStore()
      .setTable('sessions', SAMPLE_DATA.sessions)
      .setTable('workouts', SAMPLE_DATA.workouts);
  });

  useEffect(() => {
    const setupPersistence = async () => {
      const persister = createLocalPersister(store, 'fitness-tracker');
      await persister.startAutoLoad();
      await persister.startAutoSave();
    };
    setupPersistence();
  }, [store]);

  // Function to reset store to initial sample data
  const resetStore = async () => {
    try {
      // Create a new persister
      const persister = createLocalPersister(store, 'fitness-tracker');

      // Stop any existing persistence
      await persister.stopAutoSave();
      await persister.stopAutoLoad();

      // Clear localStorage directly
      localStorage.removeItem('fitness-tracker');

      // Clear store tables
      store.delTable('sessions');
      store.delTable('workouts');

      // Set fresh data
      store.setTable('sessions', SAMPLE_DATA.sessions);
      store.setTable('workouts', SAMPLE_DATA.workouts);

      // Log the current state to verify
      console.log('Store after reset:', {
        sessions: store.getTable('sessions'),
        workouts: store.getTable('workouts')
      });

      // Save the fresh data to localStorage
      await persister.save();

      // Restart persistence
      await persister.startAutoLoad();
      await persister.startAutoSave();

      console.log('Reset completed successfully');
    } catch (error) {
      console.error('Error during reset:', error);
    }
  };

  // Expose resetStore to window for development
  useEffect(() => {
    (window as any).resetStore = resetStore;
  }, []);

  const sidebarItems = [
    {
      id: 'sessions',
      label: 'Sessions',
      component: <SessionsView />
    },
    {
      id: 'workouts',
      label: 'Workouts',
      component: <WorkoutsView />
    },
    {
      id: 'analytics',
      label: 'Analytics',
      component: <AnalyticsView />
    }
  ];

  return (
    <StrictMode>
      <Provider store={store}>
        <Sidebar items={sidebarItems} />
        <Inspector />
      </Provider>
    </StrictMode>
  );
};
