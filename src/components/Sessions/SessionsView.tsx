import { useTable, useStore } from 'tinybase/ui-react';
import { useState } from 'react';
import './SessionsView.css';
import { SessionCompletionForm } from './SessionCompletionForm';
import { ContextMenu } from '../ContextMenu/ContextMenu';
import { SessionEditForm } from './SessionEditForm';
import { ConfirmDialog } from '../ConfirmDialog/ConfirmDialog';
import { SessionForm } from './SessionForm';

type TimeFrame = 'day' | 'week' | 'month' | 'all';
type StatusFilter = 'all' | 'planned' | 'completed';

type Session = {
  plannedDate: string;
  workoutName: string;
  completed: boolean;
  completedDate?: string;
  targetMetrics: string;
  actualMetrics?: string;
};

export const SessionsView = () => {
  const [timeFrame, setTimeFrame] = useState<TimeFrame>('week');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [selectedWorkout, setSelectedWorkout] = useState('all');
  const [showSessionForm, setShowSessionForm] = useState(false);
  const sessions = useTable('sessions') as Record<string, Session>;
  const workouts = useTable('workouts') as Record<string, { name: string }>;
  const [completingSession, setCompletingSession] = useState<{
    id: string;
    workoutName: string;
    targetMetrics: string;
  } | null>(null);
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    sessionId: string;
    session: Session;
  } | null>(null);
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [deletingSession, setDeletingSession] = useState<{
    id: string;
    workoutName: string;
  } | null>(null);
  const store = useStore()!;

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
    .filter(([_, session]) => {
      const sessionDate = new Date(session.plannedDate);
      
      // Status filter
      if (statusFilter !== 'all') {
        if (statusFilter === 'planned' && session.completed) return false;
        if (statusFilter === 'completed' && !session.completed) return false;
      }

      // Workout filter
      if (selectedWorkout !== 'all' && session.workoutName !== selectedWorkout) {
        return false;
      }

      // Time frame filter
      if (timeFrame !== 'all') {
        return sessionDate >= today && sessionDate <= endDate;
      }
      
      return true;
    })
    .sort(([_, a], [__, b]) => 
      new Date(a.plannedDate).getTime() - new Date(b.plannedDate).getTime()
    );

  const handleContextMenu = (e: React.MouseEvent, id: string, session: Session) => {
    e.preventDefault();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      sessionId: id,
      session
    });
  };

  const handleDeleteSession = () => {
    if (deletingSession) {
      store.delRow('sessions', deletingSession.id);
      setDeletingSession(null);
    }
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
          {filteredSessions.map(([id, session]) => {
            const metrics = JSON.parse(session.targetMetrics);
            return (
              <li 
                key={id} 
                className={`session-item ${session.completed ? 'completed' : 'planned'}`}
                onContextMenu={(e) => handleContextMenu(e, id, session)}
              >
                <div className="session-header">
                  <div className="session-title">
                    <span className={`status-icon ${session.completed ? 'completed' : 'planned'}`}>
                      {session.completed ? '✓' : ' '}
                    </span>
                    <h3>{session.workoutName}</h3>
                  </div>
                  <div className="session-dates">
                    <span className="planned-date">
                      Planned: {new Date(session.plannedDate).toLocaleDateString()}
                    </span>
                    {session.completed && session.completedDate && (
                      <span className="completed-date">
                        Completed: {new Date(session.completedDate).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
                <div className="metrics-list">
                  {metrics.map((metric: { name: string, value: number }) => (
                    <div key={metric.name} className="metric-item">
                      <span className="metric-name">{metric.name}</span>
                      <div className="metric-values">
                        <span className="target-value">Target: {metric.value}</span>
                        {session.completed && session.actualMetrics && (
                          <span className="actual-value">
                            Actual: {JSON.parse(session.actualMetrics)
                              .find((m: { name: string }) => m.name === metric.name)?.value}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </li>
            );
          })}
        </ul>
      )}
      
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          onClose={() => setContextMenu(null)}
          items={[
            ...(contextMenu.session.completed 
              ? []
              : [{
                  label: 'Mark as Completed',
                  onClick: () => setCompletingSession({
                    id: contextMenu.sessionId,
                    workoutName: contextMenu.session.workoutName,
                    targetMetrics: contextMenu.session.targetMetrics
                  })
                }]
            ),
            {
              label: 'Edit Session',
              onClick: () => setEditingSessionId(contextMenu.sessionId)
            },
            {
              label: 'Delete Session',
              onClick: () => setDeletingSession({
                id: contextMenu.sessionId,
                workoutName: contextMenu.session.workoutName
              })
            }
          ]}
        />
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