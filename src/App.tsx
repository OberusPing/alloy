import { StrictMode } from 'react';
import { createStore } from 'tinybase';
import { Provider, useCreateStore } from 'tinybase/ui-react';
import {
  SortedTableInHtmlTable,
} from 'tinybase/ui-react-dom';
import { Inspector } from 'tinybase/ui-react-inspector';
import { SessionForm } from './components/SessionForm';
import { useState } from 'react';

export const App = () => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const store = useCreateStore(() => {
    return createStore()
      .setTable('sessions', {
        '1': {
          date: '2024-03-20',
          workoutName: 'Norwegian 4x4',
          completed: false,
          targetMetrics: JSON.stringify([
            { name: 'Average Heart Rate', value: 165 },
            { name: 'Max Heart Rate', value: 182 },
            { name: 'Duration', value: 45 }
          ])
        },
        '2': {
          date: '2024-03-18',
          workoutName: 'Threshold Intervals',
          completed: true,
          targetMetrics: JSON.stringify([
            { name: 'Average Heart Rate', value: 172 },
            { name: 'Max Heart Rate', value: 188 },
            { name: 'Duration', value: 60 }
          ])
        },
        '3': {
          date: '2024-03-15',
          workoutName: 'Zone 2 Base',
          completed: true,
          targetMetrics: JSON.stringify([
            { name: 'Average Heart Rate', value: 145 },
            { name: 'Max Heart Rate', value: 155 },
            { name: 'Duration', value: 120 }
          ])
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

  return (
    <StrictMode>
      <Provider store={store}>
        <header>
          <h1>
            <img src='/favicon.svg' />
            Alloy
          </h1>
        </header>
        <div className="sortedTable-container">
          <div className="table-header">
            <h2>Sessions Table</h2>
            <button onClick={() => setIsFormOpen(true)}>Create New Session</button>
          </div>
          <SortedTableInHtmlTable
            tableId='sessions'
            cellId='date'
            limit={5}
            sortOnClick={true}
            className='sortedTable'
            paginator={true}
          />
        </div>
        <SessionForm isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} />
        <Inspector />
      </Provider>
    </StrictMode>
  );
};
