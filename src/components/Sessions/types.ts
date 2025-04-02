export type Metric = {
  name: string;
  value: number;
};

export type WorkoutSet = {
  workoutId: string;
  sets: {
    targetMetrics: Metric[];
  }[];
};

export type WorkoutSetMetrics = {
  workoutId: string;
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

export type WorkoutData = {
  exerciseId: string;
  methodId: string;
};

export type ExerciseData = {
  name: string;
  category: string;
};

export type MethodData = {
  name: string;
  description: string;
  sets: string; // JSON string of sets with targetMetrics
  metricProgression: string; // JSON string of progression rules
};

export type WorkoutMetricsState = {
  [key: string]: {
    sets: Array<{
      [key: string]: number;
    }>;
  };
}; 