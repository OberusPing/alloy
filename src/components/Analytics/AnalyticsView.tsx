import { useTable, useStore } from 'tinybase/ui-react';
import { useMemo, useState } from 'react';
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

const CHART_COLORS = {
  blue: 'rgb(75, 192, 192)',
  red: 'rgb(255, 99, 132)',
  green: 'rgb(54, 162, 235)'
};

export const AnalyticsView = () => {
  const store = useStore()!;
  const sessions = useTable('sessions') as Record<string, Session>;
  const workouts = useTable('workouts') as Record<string, { name: string; category: string; recordMetrics: string }>;

  const [selectedMetric, setSelectedMetric] = useState<string>('');
  const [selectedWorkout, setSelectedWorkout] = useState<string>('');
  const [dateRange, setDateRange] = useState<'week' | 'month' | 'year'>('month');

  const getDateBoundaries = () => {
    const now = new Date();
    const startDate = new Date();

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
    }

    return { startDate, endDate: now };
  };

  const getAvailableMetrics = () => {
    const metrics = new Set<string>();
    Object.values(workouts).forEach(workout => {
      const recordMetrics = JSON.parse(workout.recordMetrics);
      recordMetrics.forEach((metric: string) => metrics.add(metric));
    });
    return Array.from(metrics);
  };

  const getAvailableWorkouts = () => {
    return Object.values(workouts).map(workout => workout.name);
  };

  const prepareChartData = (): ChartData => {
    const { startDate, endDate } = getDateBoundaries();
    const completedSessions = Object.entries(sessions).filter(([_, session]) =>
      session.completed &&
      new Date(session.completedDate) >= startDate &&
      new Date(session.completedDate) <= endDate
    );

    const labels = completedSessions.map(([_, session]) =>
      new Date(session.completedDate).toLocaleDateString()
    );

    const datasets = [];

    if (selectedMetric && selectedWorkout) {
      // Filter sessions for selected workout
      const filteredSessions = completedSessions.filter(([_, session]) =>
        (session as Session).workoutName === selectedWorkout
      );

      const data = filteredSessions.map(([_, session]) => {
        const metrics = JSON.parse((session as Session).actualMetrics as string);
        const workoutMetrics = metrics.find((w: any) => w.workoutName === selectedWorkout);
        if (!workoutMetrics) return 0;

        // Calculate average across all sets
        const allSetValues = workoutMetrics.sets.map((set: any) => {
          const metric = set.metrics.find((m: MetricData) => m.name === selectedMetric);
          return metric?.value || 0;
        });

        return allSetValues.length > 0
          ? allSetValues.reduce((a: number, b: number) => a + b, 0) / allSetValues.length
          : 0;
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
    <div className="analytics-view">
      <div className="analytics-controls">
        <div className="control-group">
          <label htmlFor="metric-select">Metric:</label>
          <select
            id="metric-select"
            value={selectedMetric}
            onChange={(e) => setSelectedMetric(e.target.value)}
          >
            <option value="">Select a metric</option>
            {getAvailableMetrics().map(metric => (
              <option key={metric} value={metric}>{metric}</option>
            ))}
          </select>
        </div>

        <div className="control-group">
          <label htmlFor="workout-select">Workout:</label>
          <select
            id="workout-select"
            value={selectedWorkout}
            onChange={(e) => setSelectedWorkout(e.target.value)}
          >
            <option value="">Select a workout</option>
            {getAvailableWorkouts().map(workout => (
              <option key={workout} value={workout}>{workout}</option>
            ))}
          </select>
        </div>

        <div className="control-group">
          <label htmlFor="date-range">Date Range:</label>
          <select
            id="date-range"
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value as 'week' | 'month' | 'year')}
          >
            <option value="week">Last Week</option>
            <option value="month">Last Month</option>
            <option value="year">Last Year</option>
          </select>
        </div>
      </div>

      <div className="chart-container">
        {selectedMetric && selectedWorkout ? (
          <Line options={chartOptions} data={chartData} />
        ) : (
          <div className="no-data-message">
            Select a metric and workout to view analytics
          </div>
        )}
      </div>
    </div>
  );
}; 