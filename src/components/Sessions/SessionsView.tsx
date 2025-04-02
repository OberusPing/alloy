import { useTable, useStore } from 'tinybase/ui-react';
import { useState } from 'react';
import './SessionsView.css';
import { SessionCompletionForm } from './SessionCompletionForm';
import { SessionEditForm } from './SessionEditForm';
import { ConfirmDialog } from '../ConfirmDialog/ConfirmDialog';
import { SessionForm } from './SessionForm';
import { SessionCard } from './SessionCard';
import { Session, WorkoutSet } from './types';

type TimeFrame = 'day' | 'week' | 'month' | 'all';
type StatusFilter = 'all' | 'planned' | 'completed';

const getWorkouts = (session: Session): WorkoutSet[] => {
  try {
    return JSON.parse(session.workouts);
  } catch (e) {
    console.error('Failed to parse workouts:', e);
    return [];
  }
};

export const SessionsView = () => {
  const [timeFrame, setTimeFrame] = useState<TimeFrame>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('planned');
  const [selectedWorkout, setSelectedWorkout] = useState<string>('all');
  const [showSessionForm, setShowSessionForm] = useState<boolean>(false);
  const sessions = useTable('sessions') as Record<string, Session>;
  const workouts = useTable('workouts') as Record<string, { name: string }>;
  const workoutsTable = useTable('workouts') as Record<string, { exerciseId: string; methodId: string }>;
  const exercisesTable = useTable('exercises') as Record<string, { name: string; category: string }>;
  const methodsTable = useTable('methods') as Record<string, { name: string; description: string }>;
  const [completingSession, setCompletingSession] = useState<{
    id: string;
    workouts: WorkoutSet[];
  } | null>(null);
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [deletingSession, setDeletingSession] = useState<{
    id: string;
    workoutName: string;
  } | null>(null);
  const store = useStore()!;
  const [expandedSessions, setExpandedSessions] = useState<Set<string>>(new Set());

  // Get unique workout names from the workouts table
  const workoutNames = Array.from(
    new Set(Object.values(workouts).map(workout => workout.name))
  );

  const getEndDate = (startDate: Date, timeFrame: TimeFrame): Date => {
    if (timeFrame === 'all') return new Date('2099-12-31');

    const endDate = new Date(startDate);
    switch (timeFrame) {
      case 'day':
        endDate.setDate(startDate.getDate() + 1);
        break;
      case 'week':
        endDate.setDate(startDate.getDate() + 7);
        break;
      case 'month':
        endDate.setMonth(startDate.getMonth() + 1);
        break;
    }
    return endDate;
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const endDate = getEndDate(today, timeFrame);

  const filteredSessions = Object.entries(sessions)
    .filter(([_, session]: [string, Session]) => {
      const sessionDate = new Date(session.plannedDate);
      const workouts = getWorkouts(session);

      // Status filter
      if (statusFilter !== 'all') {
        if (statusFilter === 'planned' && session.completed) return false;
        if (statusFilter === 'completed' && !session.completed) return false;
      }

      // Workout filter
      if (selectedWorkout !== 'all' &&
        !workouts.some(w => {
          const workoutData = workoutsTable[w.workoutId];
          const exercise = exercisesTable[workoutData.exerciseId];
          const method = methodsTable[workoutData.methodId];
          const workoutName = `${exercise.name} - ${method.name}`;
          return workoutName === selectedWorkout;
        })) {
        return false;
      }

      // Time frame filter
      if (timeFrame !== 'all') {
        return sessionDate >= today && sessionDate <= endDate;
      }

      return true;
    })
    .sort(([_, a]: [string, Session], [__, b]: [string, Session]) =>
      new Date(a.plannedDate).getTime() - new Date(b.plannedDate).getTime()
    );

  const handleDeleteSession = (): void => {
    if (deletingSession) {
      store.delRow('sessions', deletingSession.id);
      setDeletingSession(null);
    }
  };

  const toggleSession = (sessionId: string): void => {
    setExpandedSessions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sessionId)) {
        newSet.delete(sessionId);
      } else {
        newSet.add(sessionId);
      }
      return newSet;
    });
  };

  return (
    <div className="sessions-view">
      <div className="sessions-view-header">
        <h2>Sessions</h2>
        <div className="filter-controls">
          <select
            value={selectedWorkout}
            onChange={(e) => setSelectedWorkout(e.target.value)}
          >
            <option value="all">All Workouts</option>
            {workoutNames.map(name => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
          >
            <option value="all">All Status</option>
            <option value="planned">Planned</option>
            <option value="completed">Completed</option>
          </select>
          <select
            value={timeFrame}
            onChange={(e) => setTimeFrame(e.target.value as TimeFrame)}
          >
            <option value="day">Next 24 Hours</option>
            <option value="week">Next Week</option>
            <option value="month">Next Month</option>
            <option value="all">All Time</option>
          </select>
          <button
            className="new-session-button"
            onClick={() => setShowSessionForm(true)}
          >
            New Session
          </button>
        </div>
      </div>

      {showSessionForm && (
        <SessionForm isOpen={showSessionForm} onClose={() => setShowSessionForm(false)} />
      )}

      {filteredSessions.length === 0 ? (
        <p className="no-sessions">No sessions match the current filters</p>
      ) : (
        <ul className="sessions-list">
          {filteredSessions.map(([id, session]) => (
            <SessionCard
              key={id}
              id={id}
              session={session}
              isExpanded={expandedSessions.has(id)}
              onToggle={toggleSession}
              onComplete={setCompletingSession}
              onEdit={setEditingSessionId}
              onDelete={setDeletingSession}
            />
          ))}
        </ul>
      )}

      {completingSession && (
        <SessionCompletionForm
          isOpen={!!completingSession}
          onClose={() => setCompletingSession(null)}
          session={completingSession}
        />
      )}

      {editingSessionId && (
        <SessionEditForm
          isOpen={!!editingSessionId}
          onClose={() => setEditingSessionId(null)}
          sessionId={editingSessionId}
        />
      )}

      <ConfirmDialog
        isOpen={!!deletingSession}
        onClose={() => setDeletingSession(null)}
        onConfirm={handleDeleteSession}
        title="Delete Session"
        message={
          deletingSession
            ? `Are you sure you want to delete the session "${deletingSession.workoutName}"? This action cannot be undone.`
            : ''
        }
      />
    </div>
  );
}; 