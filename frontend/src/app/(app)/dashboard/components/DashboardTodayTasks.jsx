'use client';
import Link from 'next/link';
import { CheckCircle2, ChevronRight, Trash2, Plus } from 'lucide-react';

export default function DashboardTodayTasks({
  todayTasks,
  handleToggleTask,
  handleDeleteTask,
  newTaskInput,
  setNewTaskInput,
  handleQuickAddTask,
  handleQuickAddTaskClick,
  isAddingTask,
}) {
  return (
    <div style={{ 
      background: 'var(--surface)', 
      border: '1px solid var(--border)', 
      borderRadius: '16px', 
      padding: '1.35rem',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      minHeight: '320px'
    }}>
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.65rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckCircle2 size={16} style={{ color: 'var(--text-muted)' }} />
            <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '0.06em' }}>
              TASKS FOR TODAY
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', fontWeight: 600 }}>
              {todayTasks.filter(t => t.status === 'done').length}/{todayTasks.length} completed
            </span>
            <Link href="/planner" className="dash-link" style={{ fontSize: '0.74rem', color: 'var(--text-muted)', fontWeight: 700, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '2px' }}>
              <span>Planner</span> <ChevronRight size={12} />
            </Link>
          </div>
        </div>

        {/* Task Progress Bar */}
        {todayTasks.length > 0 && (
          <div style={{ height: '4px', background: 'var(--surface-2)', borderRadius: '999px', overflow: 'hidden', marginBottom: '0.85rem' }}>
            <div style={{ 
              height: '100%', 
              width: `${(todayTasks.filter(t => t.status === 'done').length / todayTasks.length) * 100}%`, 
              background: 'var(--amber)', 
              borderRadius: '999px',
              transition: 'width 0.3s ease'
            }} />
          </div>
        )}

        {/* Task Items List */}
        {todayTasks.length === 0 ? (
          <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text)', margin: '0 0 0.35rem 0' }}>
              Nothing planned yet
            </h3>
            <p style={{ fontSize: '0.82rem', margin: 0 }}>
              Add the main goal or concept you want to conquer today.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '190px', overflowY: 'auto', paddingRight: '4px' }}>
            {todayTasks.map(task => {
              const isDone = task.status === 'done';
              const taskId = task.id || task._id;
              return (
                <div 
                  key={taskId} 
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between',
                    padding: '0.55rem 0.75rem',
                    background: 'var(--surface-2)',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                    gap: '8px'
                  }}
                >
                  <div 
                    onClick={() => handleToggleTask(taskId, task.status)}
                    style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', flex: 1, minWidth: 0 }}
                  >
                    <div style={{ 
                      width: '16px', height: '16px', borderRadius: '4px', 
                      border: isDone ? 'none' : '1px solid var(--border-strong)', 
                      background: isDone ? 'var(--amber)' : 'transparent',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      {isDone && <CheckCircle2 size={13} style={{ color: 'var(--btn-text)' }} />}
                    </div>
                    <span style={{ 
                      fontSize: '0.84rem',
                      color: isDone ? 'var(--text-muted)' : 'var(--text)',
                      textDecoration: isDone ? 'line-through' : 'none',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}>
                      {task.title}
                    </span>
                  </div>

                  <button
                    onClick={(e) => handleDeleteTask(taskId, e)}
                    title="Delete task"
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--text-muted)',
                      cursor: 'pointer',
                      padding: '2px',
                      display: 'flex',
                      alignItems: 'center'
                    }}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Quick Add Task Input */}
      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.85rem' }}>
        <input 
          type="text" 
          placeholder="Add a task for today and press Enter..." 
          value={newTaskInput}
          onChange={e => setNewTaskInput(e.target.value)}
          onKeyDown={handleQuickAddTask}
          disabled={isAddingTask}
          style={{ 
            flex: 1, 
            background: 'var(--surface-2)', 
            border: '1px solid var(--border)', 
            color: 'var(--text)', 
            fontSize: '0.82rem', 
            padding: '0.6rem 0.9rem', 
            borderRadius: '8px', 
            outline: 'none'
          }} 
        />
        <button
          onClick={handleQuickAddTaskClick}
          disabled={isAddingTask || !newTaskInput.trim()}
          style={{
            background: newTaskInput.trim() ? 'var(--btn-bg)' : 'var(--surface-2)',
            border: newTaskInput.trim() ? 'none' : '1px solid var(--border)',
            color: newTaskInput.trim() ? 'var(--btn-text)' : 'var(--text-muted)',
            fontWeight: 700,
            fontSize: '0.82rem',
            padding: '0.6rem 0.95rem',
            borderRadius: '8px',
            cursor: newTaskInput.trim() ? 'pointer' : 'default',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            opacity: isAddingTask ? 0.6 : 1
          }}
        >
          <Plus size={14} />
          <span>Add</span>
        </button>
      </div>
    </div>
  );
}
