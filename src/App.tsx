import './App.css';
import WeekView from './components/WeekView';
import { sampleTasks } from './data/sampleTasks';
import TaskEditor from './components/TaskEditor';
import MealPlanner from './components/MealPlanner';
import { useEffect, useState } from 'react';
import { loadTasks, saveTasks } from './lib/storage';
import type { Task } from './types';

type Tab = 'dashboard' | 'planner' | 'tasks';

function App() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [editing, setEditing] = useState<Task | null>(null);
  const [tab, setTab] = useState<Tab>('dashboard');

  useEffect(() => {
    const loaded = loadTasks();
    if (loaded && loaded.length) setTasks(loaded);
    else setTasks(sampleTasks);
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

  const handleCreate = (t: Task) => setTasks((s) => [t, ...s]);
  const handleUpdate = (t: Task) => setTasks((s) => s.map((x) => (x.id === t.id ? t : x)));
  const handleDelete = (taskId: string) => setTasks((s) => s.filter((x) => x.id !== taskId));
  const handleEdit = (taskId: string) => {
    const t = tasks.find((x) => x.id === taskId) || null;
    setEditing(t);
  };

  const handleAdd = (category: 'meals' | 'chores' | 'other', dateIso: string) => {
    // open editor with a prefilled one-off task
    setEditing({ title: '', type: 'one-off', createdAt: new Date().toISOString(), dueDate: dateIso, category } as any);
  };

  return (
    <div className="App">
      <header>
        <h1>Family Dashboard</h1>
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
            <WeekView tasks={tasks} onEdit={handleEdit} onDelete={handleDelete} onAdd={handleAdd} mode="rows" />
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
