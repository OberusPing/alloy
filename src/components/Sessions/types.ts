export type Metric = {
  name: string;
  value: number;
};

export type WorkoutSet = {
  workoutName: string;
  sets: {
    targetMetrics: Metric[];
    metrics?: Metric[];
  }[];
};

export type WorkoutSetMetrics = {
  workoutName: string;
  sets: {
    metrics: Metric[];
  }[];
};

export type Session = {
  plannedDate: string;
  workouts: string; // JSON string of WorkoutSet[]
  completed: boolean;
  completedDate?: string;
  actualMetrics?: string; // JSON string of WorkoutSetMetrics[]
};

export type Workout = {
  workoutName: string;
  targetMetrics: Metric[];
} 