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

export const App = () => {
  const store = useCreateStore(() => {
    return createStore()
      .setTable('sessions', {
        '1': {
          plannedDate: '2025-01-01',
          workouts: JSON.stringify([{
            workoutName: 'Norwegian 4x4',
            targetMetrics: JSON.stringify([
              { name: 'Average Heart Rate', value: 165 },
              { name: 'Max Heart Rate', value: 182 },
              { name: 'Duration', value: 45 }
            ])
          }]),
          completed: true,
          completedDate: '2025-01-01',
          actualMetrics: JSON.stringify([
            { name: 'Average Heart Rate', value: 168 },
            { name: 'Max Heart Rate', value: 185 },
            { name: 'Duration', value: 43 }
          ])
        },
        '2': {
          plannedDate: '2025-01-05',
          workouts: JSON.stringify([{
            workoutName: 'Zone 2 Base',
            targetMetrics: JSON.stringify([
              { name: 'Average Heart Rate', value: 145 },
              { name: 'Max Heart Rate', value: 155 },
              { name: 'Duration', value: 120 }
            ])
          }]),
          completed: true,
          completedDate: '2025-01-05',
          actualMetrics: JSON.stringify([
            { name: 'Average Heart Rate', value: 142 },
            { name: 'Max Heart Rate', value: 152 },
            { name: 'Duration', value: 125 }
          ])
        },
        '3': {
          plannedDate: '2025-01-08',
          workouts: JSON.stringify([
            {
              workoutName: 'Threshold Intervals',
              targetMetrics: JSON.stringify([
                { name: 'Average Heart Rate', value: 172 },
                { name: 'Max Heart Rate', value: 188 },
                { name: 'Duration', value: 30 }
              ])
            },
            {
              workoutName: 'Zone 2 Base',
              targetMetrics: JSON.stringify([
                { name: 'Average Heart Rate', value: 145 },
                { name: 'Max Heart Rate', value: 155 },
                { name: 'Duration', value: 30 }
              ])
            }
          ]),
          completed: true,
          completedDate: '2025-01-08',
          actualMetrics: JSON.stringify([
            { name: 'Average Heart Rate', value: 175 },
            { name: 'Max Heart Rate', value: 189 },
            { name: 'Duration', value: 58 }
          ])
        },
        '4': {
          plannedDate: '2025-01-12',
          workouts: JSON.stringify([{
            workoutName: 'Norwegian 4x4',
            targetMetrics: JSON.stringify([
              { name: 'Average Heart Rate', value: 165 },
              { name: 'Max Heart Rate', value: 182 },
              { name: 'Duration', value: 45 }
            ])
          }]),
          completed: true,
          completedDate: '2025-01-12',
          actualMetrics: JSON.stringify([
            { name: 'Average Heart Rate', value: 171 },
            { name: 'Max Heart Rate', value: 187 },
            { name: 'Duration', value: 46 }
          ])
        },
        '5': {
          plannedDate: '2025-01-15',
          workouts: JSON.stringify([{
            workoutName: 'Zone 2 Base',
            targetMetrics: JSON.stringify([
              { name: 'Average Heart Rate', value: 145 },
              { name: 'Max Heart Rate', value: 155 },
              { name: 'Duration', value: 120 }
            ])
          }]),
          completed: true,
          completedDate: '2025-01-15',
          actualMetrics: JSON.stringify([
            { name: 'Average Heart Rate', value: 144 },
            { name: 'Max Heart Rate', value: 154 },
            { name: 'Duration', value: 118 }
          ])
        },
        '6': {
          plannedDate: '2025-01-18',
          workouts: JSON.stringify([{
            workoutName: 'Threshold Intervals',
            targetMetrics: JSON.stringify([
              { name: 'Average Heart Rate', value: 172 },
              { name: 'Max Heart Rate', value: 188 },
              { name: 'Duration', value: 60 }
            ])
          }]),
          completed: true,
          completedDate: '2025-01-18',
          actualMetrics: JSON.stringify([
            { name: 'Average Heart Rate', value: 173 },
            { name: 'Max Heart Rate', value: 190 },
            { name: 'Duration', value: 62 }
          ])
        },
        '7': {
          plannedDate: '2025-01-29',
          workouts: JSON.stringify([{
            workoutName: 'Norwegian 4x4',
            targetMetrics: JSON.stringify([
              { name: 'Average Heart Rate', value: 165 },
              { name: 'Max Heart Rate', value: 182 },
              { name: 'Duration', value: 45 }
            ])
          }]),
          completed: false
        }
      }).setTable('workouts', {
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
      });
  });

  useEffect(() => {
    const setupPersistence = async () => {
      const persister = createLocalPersister(store, 'fitness-tracker');
      await persister.startAutoLoad();
      await persister.startAutoSave();
    };
    setupPersistence();
  }, [store]);

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
