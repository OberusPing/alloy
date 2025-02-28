export type Session = {
  plannedDate: string;
  workouts: string; // JSON string
  completed: boolean;
  completedDate?: string;
  actualMetrics?: string;
};

export type Metric = {
  name: string;
  value: number;
};

export type Workout ={
  workoutName: string;
  targetMetrics: Metric[];
} 