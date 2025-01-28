import { useAddRowCallback } from 'tinybase/ui-react';

export const getRandomInt = (min: number, max: number) => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

export const Buttons = () => {
  const handleAddSession = useAddRowCallback('sessions', () => ({
    date: new Date().toISOString().split('T')[0],
    workoutName: 'New Workout',
    metricValue: getRandomInt(140, 180)
  }));

  return (
    <div id='buttons'>
      <button onClick={handleAddSession}>Add New Session</button>
    </div>
  );
};
