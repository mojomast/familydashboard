import './App.css';
import WeekView from './components/WeekView';
import { sampleTasks } from './data/sampleTasks';
import TaskEditor from './components/TaskEditor';
import MealPlanner from './components/MealPlanner';
import { useEffect, useState } from 'react';
import { loadTasks, saveTasks } from './lib/storage';
import type { Task } from './types';
import { createDAL } from './lib/dal';
import QrButton from './components/QrButton';
import GroceryList from './components/GroceryList';

type Tab = 'dashboard' | 'planner' | 'tasks';

function App() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [editing, setEditing] = useState<Task | null>(null);
  const [tab, setTab] = useState<Tab>('dashboard');
  const [theme, setTheme] = useState<'light' | 'dark'>(() => (localStorage.getItem('theme') as 'light' | 'dark') || 'light');
  const dal = createDAL();

  useEffect(() => {
    // Prefer backend tasks; fall back to local sample if error
    (async () => {
      try {
        const remote = await dal.getTasks();
        setTasks(remote && remote.length ? remote : sampleTasks);
      } catch (e) {
        const loaded = loadTasks();
        setTasks(loaded && loaded.length ? loaded : sampleTasks);
      }
    })();
  }, []);

  useEffect(() => {
    saveTasks(tasks);
  }, [tasks]);

  // listen for external saves (TaskEditor persisted directly to storage)
  useEffect(() => {
    const handler = () => {
      const reloaded = loadTasks();
      setTasks(reloaded);
    };
    window.addEventListener('familydashboard:task-added', handler as any);
    return () => window.removeEventListener('familydashboard:task-added', handler as any);
  }, []);

  const handleCreate = async (t: Task) => {
    try { const saved = await dal.createTask(t); setTasks((s) => [saved, ...s]); } catch { setTasks((s) => [t, ...s]); }
  };
  const handleUpdate = async (t: Task) => {
    try { const saved = await dal.updateTask(t); setTasks((s) => s.map((x) => (x.id === saved.id ? saved : x))); } catch { setTasks((s) => s.map((x) => (x.id === t.id ? t : x))); }
  };
  const handleDelete = async (taskId: string) => {
    setTasks((s) => s.filter((x) => x.id !== taskId));
    try { await dal.deleteTask(taskId); } catch { /* ignore */ }
  };
  const handleEdit = (taskId: string) => {
    const t = tasks.find((x) => x.id === taskId) || null;
    setEditing(t);
  };

  const handleAdd = (category: 'meals' | 'chores' | 'other', dateIso: string) => {
    // open editor with a prefilled one-off task
    setEditing({ title: '', type: 'one-off', createdAt: new Date().toISOString(), dueDate: dateIso, category } as any);
  };

  return (
    <div className={`App theme-${theme}`}>
    <header>
        <h1>Family Dashboard</h1>
        <div aria-label="Theme toggle" role="group" style={{ position: 'absolute', right: 12, top: 8 }}>
      <QrButton />
          <button aria-pressed={theme==='light'} className={`small-btn ${theme==='light'?'active':''}`} onClick={() => { setTheme('light'); localStorage.setItem('theme','light'); }}>Light</button>
          <button aria-pressed={theme==='dark'} className={`small-btn ${theme==='dark'?'active':''}`} onClick={() => { setTheme('dark'); localStorage.setItem('theme','dark'); }}>Dark</button>
        </div>
      </header>
      <div className="tabs">
        <button className={`tab-button ${tab === 'dashboard' ? 'active' : ''}`} onClick={() => setTab('dashboard')}>Dashboard</button>
        <button className={`tab-button ${tab === 'planner' ? 'active' : ''}`} onClick={() => setTab('planner')}>Planner</button>
        <button className={`tab-button ${tab === 'tasks' ? 'active' : ''}`} onClick={() => setTab('tasks')}>Tasks</button>
      </div>
      <main>
        <div className="tab-content">
          {tab === 'dashboard' && (
            /* render WeekView directly so it can size itself */
            <div style={{ width: '100%' }}>
              <WeekView tasks={tasks} onEdit={handleEdit} onDelete={handleDelete} onAdd={handleAdd} mode="rows" />
              <div style={{ maxWidth: 600, margin: '12px auto' }}>
                <h3 style={{ textAlign: 'center' }}>Today’s Groceries</h3>
                <GroceryList dateIso={new Date().toISOString().slice(0,10)} />
              </div>
            </div>
          )}

          {tab === 'planner' && (
            <MealPlanner tasks={tasks} onCreate={handleCreate} onEdit={handleEdit} onDelete={handleDelete} />
          )}

          {tab === 'tasks' && (
            <div>
              <TaskEditor onCreate={handleCreate} initial={editing} onUpdate={(t) => { handleUpdate(t); setEditing(null); }} />
              {/* future: tasks list */}
            </div>
          )}
        </div>
        {/* floating editor shown when editing is set (opened by + buttons) */}
        {editing && (
          <div className="editor-floating">
            <TaskEditor
              onCreate={(t) => { handleCreate(t); setEditing(null); }}
              initial={editing}
              onUpdate={(t) => { handleUpdate(t); setEditing(null); }}
            />
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
