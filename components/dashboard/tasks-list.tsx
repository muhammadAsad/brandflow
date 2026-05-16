'use client';

import { useState } from 'react';
import { CheckCircle2, Circle } from 'lucide-react';

export interface Task {
  id: string;
  title: string;
  due_at: string | null;
  priority: string;
  completed_at: string | null;
}

function dueLabel(due_at: string | null): { label: string; urgent: boolean } {
  if (!due_at) return { label: 'No due date', urgent: false };
  const diff = new Date(due_at).getTime() - Date.now();
  const h = diff / 3600000;
  if (h < 0) return { label: 'Overdue', urgent: true };
  if (h < 2) return { label: 'Due in 2h', urgent: true };
  if (h < 4) return { label: 'Due in 4h', urgent: true };
  if (h < 6) return { label: 'Due in 6h', urgent: true };
  if (h < 24) return { label: `Due in ${Math.round(h)}h`, urgent: false };
  return { label: `Due in ${Math.round(h / 24)}d`, urgent: false };
}

export function TasksList({ initial }: { initial: Task[] }) {
  const [tasks, setTasks] = useState(initial);

  const toggle = async (id: string) => {
    setTasks(prev =>
      prev.map(t => t.id === id ? { ...t, completed_at: t.completed_at ? null : new Date().toISOString() } : t)
    );
    try {
      const { createClient } = await import('@/lib/supabase-browser');
      const sb = createClient();
      const task = tasks.find(t => t.id === id);
      await sb.from('tasks').update({
        completed_at: task?.completed_at ? null : new Date().toISOString(),
      }).eq('id', id);
    } catch {}
  };

  const pending = tasks.filter(t => !t.completed_at).length;

  return (
    <div style={{ background: '#fff', borderRadius: 16, padding: 18, boxShadow: '0 2px 12px rgba(0,0,0,0.05)', border: '1px solid #f1f0ff' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#1e293b' }}>Today&apos;s Tasks</h3>
          <span style={{ background: '#ede9fe', color: '#7c3aed', fontSize: 11, fontWeight: 700, padding: '2px 7px', borderRadius: 20 }}>{pending}</span>
        </div>
        <button style={{ background: 'none', border: 'none', fontSize: 12, color: '#7c3aed', cursor: 'pointer', fontWeight: 600 }}>View all</button>
      </div>
      {tasks.map(task => {
        const done = !!task.completed_at;
        const { label, urgent } = dueLabel(task.due_at);
        return (
          <div key={task.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 0', borderBottom: '1px solid #f8f7ff' }}>
            <button onClick={() => toggle(task.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: done ? '#7c3aed' : '#cbd5e1', flexShrink: 0, display: 'flex' }}>
              {done ? <CheckCircle2 size={18} /> : <Circle size={18} />}
            </button>
            <span style={{ flex: 1, fontSize: 13, color: done ? '#94a3b8' : '#334155', textDecoration: done ? 'line-through' : 'none', lineHeight: 1.4 }}>
              {task.title}
            </span>
            <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 20, whiteSpace: 'nowrap', background: urgent ? '#fef2f2' : '#f8fafc', color: urgent ? '#ef4444' : '#94a3b8' }}>
              {label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
