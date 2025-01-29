import { useState, useMemo } from 'react';
import { useStore } from 'tinybase/ui-react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import './AnalyticsView.css';
import { Row } from 'tinybase';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface Session extends Row {
  completed: boolean;
  completedDate: string;
  workoutName: string;
  actualMetrics: string;
}

interface Workout extends Row {
  name: string;
  recordMetrics: string;
}

type MetricData = {
  name: string;
  value: number;
};

type ChartData = {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    borderColor: string;
    backgroundColor: string;
  }[];
};

type DateRange = 'week' | 'month' | 'year' | 'all';

const CHART_COLORS = {
  red: 'rgb(255, 99, 132)',
  blue: 'rgb(54, 162, 235)',
  green: 'rgb(75, 192, 192)',
  purple: 'rgb(153, 102, 255)',
};

export const AnalyticsView = () => {
  const store = useStore()!;
  const [selectedMetric, setSelectedMetric] = useState<string>('Average Heart Rate');
  const [selectedWorkout, setSelectedWorkout] = useState<string>('all');
  const [dateRange, setDateRange] = useState<DateRange>('month');

  // Get all completed sessions
  const sessions = store.getTable('sessions');
  const workouts = store.getTable('workouts');
  
  // Get unique metrics from workouts
  const allMetrics = new Set<string>();
  Object.values(workouts).forEach(workout => {
    const metrics = JSON.parse(workout.recordMetrics as string);
    metrics.forEach((metric: string) => allMetrics.add(metric));
  });

  // Get date range boundaries
  const getDateBoundaries = () => {
    const now = new Date();
    const endDate = now;
    let startDate = new Date();

    switch (dateRange) {
      case 'week':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(now.getMonth() - 1);
        break;
      case 'year':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      case 'all':
        startDate = new Date(0); // Beginning of time
        break;
    }
    return { startDate, endDate };
  };

  // Prepare chart data with date filtering
  const prepareChartData = (): ChartData => {
    const { startDate, endDate } = getDateBoundaries();

    const completedSessions = Object.entries(sessions)
      .filter(([_, session]) => (session as Session).completed)
      .filter(([_, session]) => {
        const sessionDate = new Date((session as Session).completedDate);
        return sessionDate >= startDate && sessionDate <= endDate;
      })
      .sort((a, b) => new Date((a[1] as Session).completedDate).getTime() - new Date((b[1] as Session).completedDate).getTime());

    const datasets = [];
    const labels = completedSessions.map(([_, session]) => (session as Session).completedDate);

    if (selectedWorkout === 'all') {
      // Group by workout name
      const workoutGroups = completedSessions.reduce((acc, [_, session]) => {
        const workoutName = (session as Session).workoutName;
        if (!acc[workoutName]) acc[workoutName] = [];
        acc[workoutName].push(session);
        return acc;
      }, {} as Record<string, any[]>);

      // Create dataset for each workout
      Object.entries(workoutGroups).forEach(([workoutName, sessions], index) => {
        const data = sessions.map(session => {
          const metrics = JSON.parse((session as Session).actualMetrics as string) as MetricData[];
          return metrics.find(m => m.name === selectedMetric)?.value || 0;
        });

        datasets.push({
          label: workoutName,
          data,
          borderColor: Object.values(CHART_COLORS)[index % Object.keys(CHART_COLORS).length],
          backgroundColor: 'transparent',
        });
      });
    } else {
      // Filter sessions for selected workout
      const filteredSessions = completedSessions.filter(([_, session]) => 
        (session as Session).workoutName === selectedWorkout
      );

      const data = filteredSessions.map(([_, session]) => {
        const metrics = JSON.parse((session as Session).actualMetrics as string) as MetricData[];
        return metrics.find(m => m.name === selectedMetric)?.value || 0;
      });

      datasets.push({
        label: selectedWorkout,
        data,
        borderColor: CHART_COLORS.blue,
        backgroundColor: 'transparent',
      });
    }

    return { labels, datasets };
  };

  const chartOptions = {
    responsive: true,
    animation: {
      duration: 0 // Set duration to 0 to disable animation
    },
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: `${selectedMetric} Over Time`,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  // Cache the chart data
  const chartData = useMemo(() => prepareChartData(), [
    sessions,
    selectedMetric,
    selectedWorkout,
    dateRange
  ]);

  return (
    <div className="analytics-view view-container">
      <div className="analytics-header view-header">
        <h2>Analytics</h2>
        <div className="analytics-controls">
          <select 
            value={dateRange} 
            onChange={(e) => setDateRange(e.target.value as DateRange)}
            className="date-range-select"
          >
            <option value="week">Past Week</option>
            <option value="month">Past Month</option>
            <option value="year">Past Year</option>
            <option value="all">All Time</option>
          </select>
          <select 
            value={selectedMetric} 
            onChange={(e) => setSelectedMetric(e.target.value)}
            className="metric-select"
          >
            {Array.from(allMetrics).map(metric => (
              <option key={metric} value={metric}>{metric}</option>
            ))}
          </select>
          <select
            value={selectedWorkout}
            onChange={(e) => setSelectedWorkout(e.target.value)}
            className="workout-select"
          >
            <option value="all">All Workouts</option>
            {Object.values(workouts).map(workout => (
              <option key={(workout as Workout).name} value={(workout as Workout).name}>
                {(workout as Workout).name}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="chart-container">
        <Line options={chartOptions} data={chartData} redraw={false} />
      </div>
    </div>
  );
}; 