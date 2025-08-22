import './App.css';
import WeekView from './components/WeekView';
import { sampleTasks } from './data/sampleTasks';
import TaskEditor from './components/TaskEditor';
import MealPlanner from './components/MealPlanner';
import { useEffect, useMemo, useState } from 'react';
import { loadTasks } from './lib/storage';
import type { Task, UserProfile, Recipe, MealHistory } from './types';
import { instancesForDate } from './lib/recurrence';
import { createDAL, migrateLocalStorageToBackend } from './lib/dal';
import QrButton from './components/QrButton';
import GroceryList from './components/GroceryList';
import Settings from './components/Settings';
import { FamilyManager } from './components/FamilyManager';
import { PermissionsManager } from './components/PermissionsManager';
import BulkActionsBar from './components/BulkActionsBar';
import SyncIndicator from './components/SyncIndicator';
import { realtimeSync, onSyncEvent } from './lib/realtime';
import RecipeManager from './components/RecipeManager';
import MealHistoryView from './components/MealHistory';
import NutritionAnalysis from './components/NutritionAnalysis';
import RecipeAnalytics from './components/RecipeAnalytics';

type Tab = 'dashboard' | 'planner' | 'tasks' | 'family' | 'permissions' | 'recipes' | 'history' | 'analytics' | 'settings';
type ViewMode = 'all' | 'personal' | 'user';

function App() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [editing, setEditing] = useState<Task | null>(null);
  const [tab, setTab] = useState<Tab>('dashboard');
  const [weekDays, setWeekDays] = useState<number>(5);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => (localStorage.getItem('theme') as 'light' | 'dark') || 'light');
  const [viewMode, setViewMode] = useState<ViewMode>('all');
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [familyMembers, setFamilyMembers] = useState<UserProfile[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [mealHistory, setMealHistory] = useState<MealHistory[]>([]);
  const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set());
  const [bulkMode, setBulkMode] = useState<boolean>(false);
  const [showAssignModal, setShowAssignModal] = useState<boolean>(false);
  const [historySubTab, setHistorySubTab] = useState<'meals' | 'nutrition'>('meals');
  const dal = useMemo(() => createDAL(), []);

  useEffect(() => {
    // Prefer backend tasks; fall back to local sample if error
    (async () => {
      try {
        // Run migration first if using backend
        await migrateLocalStorageToBackend(dal);

        const remote = await dal.getTasks();
        setTasks(remote && remote.length ? remote : sampleTasks);
        const wd = await dal.getSetting<number>('weekDays');
        if (wd) setWeekDays(Number(wd));

        // Load family members for filtering
        const members = await dal.getUserProfiles();
        setFamilyMembers(members);

        // Load recipes for meal history
        const recipeList = await dal.getRecipes();
        setRecipes(recipeList);

        // Load meal history for nutrition analysis
        const historyList = await dal.getMealHistory();
        setMealHistory(historyList);
      } catch {
        const loaded = loadTasks();
        setTasks(loaded && loaded.length ? loaded : sampleTasks);
        console.warn('Failed to load remote tasks, falling back to local',
          new Error('remote load failed'));
      }
    })();
  }, [dal]);

  // Set up real-time sync event listeners
  useEffect(() => {
    const unsubscribeTasks = onSyncEvent('task_created', (event) => {
      console.log('Task created via sync:', event.data);
      // Refresh tasks
      dal.getTasks().then(setTasks).catch(console.error);
    });

    const unsubscribeTaskUpdated = onSyncEvent('task_updated', (event) => {
      console.log('Task updated via sync:', event.data);
      // Refresh tasks
      dal.getTasks().then(setTasks).catch(console.error);
    });

    const unsubscribeTaskDeleted = onSyncEvent('task_deleted', (event) => {
      console.log('Task deleted via sync:', event.data);
      // Refresh tasks
      dal.getTasks().then(setTasks).catch(console.error);
    });

    const unsubscribeCompletions = onSyncEvent('completion_added', (event) => {
      console.log('Completion added via sync:', event.data);
      // Refresh tasks to update completion status
      dal.getTasks().then(setTasks).catch(console.error);
    });

    const unsubscribeCompletionRemoved = onSyncEvent('completion_removed', (event) => {
      console.log('Completion removed via sync:', event.data);
      // Refresh tasks to update completion status
      dal.getTasks().then(setTasks).catch(console.error);
    });

    // Listen for tasks_synced event to refresh local data
    const unsubscribeTasksSynced = onSyncEvent('tasks_synced', (event) => {
      console.log('Tasks synced from remote:', event.data);
      // Update local tasks without triggering another sync
      if (event.data && event.data.tasks) {
        setTasks(event.data.tasks);
      }
    });

    return () => {
      unsubscribeTasks();
      unsubscribeTaskUpdated();
      unsubscribeTaskDeleted();
      unsubscribeCompletions();
      unsubscribeCompletionRemoved();
      unsubscribeTasksSynced();
    };
  }, [dal]);

  // Removed: No longer saving to localStorage to prevent data conflicts
  // Tasks are now managed exclusively through the DAL (backend or localStorage)

  // Listen for data changes and refresh from DAL
  useEffect(() => {
    const refresh = async () => {
      try {
        const list = await dal.getTasks();
        setTasks(list);
        const wd = await dal.getSetting<number>('weekDays');
        if (wd) setWeekDays(Number(wd));
      } catch (err) {
        console.warn('refresh tasks failed', err);
      }
    };
    window.addEventListener('familydashboard:data-changed', refresh as EventListener);
    return () => {
      window.removeEventListener('familydashboard:data-changed', refresh as EventListener);
    };
  }, [dal]);

  const handleCreate = async (t: Task) => {
    try {
      const saved = await dal.createTask(t);
      setTasks((s) => [saved, ...s]);
      // Emit real-time sync event
      realtimeSync.emit('task_created', { type: 'task_created', data: saved, timestamp: Date.now(), source: '' });
    } catch {
      setTasks((s) => [t, ...s]);
    }
  };

  const handleUpdate = async (t: Task) => {
    try {
      const saved = await dal.updateTask(t);
      setTasks((s) => s.map((x) => (x.id === saved.id ? saved : x)));
      // Emit real-time sync event
      realtimeSync.emit('task_updated', { type: 'task_updated', data: saved, timestamp: Date.now(), source: '' });
    } catch {
      setTasks((s) => s.map((x) => (x.id === t.id ? t : x)));
    }
  };

  const handleDelete = async (taskId: string) => {
    setTasks((s) => s.filter((x) => x.id !== taskId));
    try {
      await dal.deleteTask(taskId);
      // Emit real-time sync event
      realtimeSync.emit('task_deleted', { type: 'task_deleted', data: { taskId }, timestamp: Date.now(), source: '' });
    } catch { /* ignore */ }
  };
  const handleEdit = (taskId: string) => {
    const t = tasks.find((x) => x.id === taskId) || null;
    setEditing(t);
  };

  const handleAdd = (category: 'meals' | 'chores' | 'other', dateIso: string) => {
    // open editor with a prefilled one-off task
    setEditing({ title: '', type: 'one-off', createdAt: new Date().toISOString(), dueDate: dateIso, category } as Task);
  };

  // Bulk action handlers
  const handleBulkComplete = async () => {
    const selectedTaskIds = Array.from(selectedTasks);
    try {
      for (const taskId of selectedTaskIds) {
        // Find the task to get its instances
        const task = tasks.find(t => t.id === taskId);
        if (task) {
          // Complete all instances of the task
          const instances = instancesForDate(tasks, new Date());
          for (const instance of instances) {
            if (instance.task.id === taskId) {
              await dal.addCompletion({ taskId, instanceDate: instance.date });
              // Emit completion sync event
              realtimeSync.emit('completion_added', {
                type: 'completion_added',
                data: { taskId, instanceDate: instance.date },
                timestamp: Date.now(),
                source: ''
              });
            }
          }
        }
      }
      setSelectedTasks(new Set());
      setBulkMode(false);
      // Refresh data
      window.dispatchEvent(new CustomEvent('familydashboard:data-changed'));
    } catch (err) {
      console.error('Bulk complete failed:', err);
    }
  };

  const handleBulkIncomplete = async () => {
    const selectedTaskIds = Array.from(selectedTasks);
    try {
      for (const taskId of selectedTaskIds) {
        // Find the task to get its instances
        const task = tasks.find(t => t.id === taskId);
        if (task) {
          // Remove completion for all instances of the task
          const instances = instancesForDate(tasks, new Date());
          for (const instance of instances) {
            if (instance.task.id === taskId) {
              await dal.removeCompletion(taskId, instance.date);
            }
          }
        }
      }
      setSelectedTasks(new Set());
      setBulkMode(false);
      // Refresh data
      window.dispatchEvent(new CustomEvent('familydashboard:data-changed'));
    } catch (err) {
      console.error('Bulk incomplete failed:', err);
    }
  };

  const handleBulkDelete = async () => {
    if (!confirm(`Delete ${selectedTasks.size} selected tasks? This action cannot be undone.`)) return;

    const selectedTaskIds = Array.from(selectedTasks);
    try {
      for (const taskId of selectedTaskIds) {
        await dal.deleteTask(taskId);
      }
      setSelectedTasks(new Set());
      setBulkMode(false);
      // Refresh data
      window.dispatchEvent(new CustomEvent('familydashboard:data-changed'));
    } catch (err) {
      console.error('Bulk delete failed:', err);
    }
  };

  const handleBulkAssign = async (userId: string) => {
    const selectedTaskIds = Array.from(selectedTasks);
    try {
      for (const taskId of selectedTaskIds) {
        const task = tasks.find(t => t.id === taskId);
        if (task) {
          await dal.updateTask({ ...task, assignedTo: userId });
        }
      }
      setSelectedTasks(new Set());
      setBulkMode(false);
      // Refresh data
      window.dispatchEvent(new CustomEvent('familydashboard:data-changed'));
    } catch (err) {
      console.error('Bulk assign failed:', err);
    }
  };

  // Filter tasks based on view mode
  const filteredTasks = tasks.filter(task => {
    if (viewMode === 'all') return true; // Show all tasks
    if (viewMode === 'personal') return !task.assignedTo; // Show unassigned tasks
    if (viewMode === 'user') return task.assignedTo === selectedUser; // Show tasks for selected user
    return true;
  });

  return (
    <div className={`App theme-${theme}`}>
      <header>
        <h1>Family Dashboard</h1>
        <div aria-label="Theme toggle" className="btn-group-header">
          <QrButton />
          <SyncIndicator />
          <button className={`small-btn ${theme==='light'?'active':''}`} onClick={() => { setTheme('light'); localStorage.setItem('theme','light'); }}>Light</button>
          <button className={`small-btn ${theme==='dark'?'active':''}`} onClick={() => { setTheme('dark'); localStorage.setItem('theme','dark'); }}>Dark</button>
        </div>
      </header>
      <div className="tabs">
        <button className={`tab-button ${tab === 'dashboard' ? 'active' : ''}`} onClick={() => setTab('dashboard')}>Dashboard</button>
        <button className={`tab-button ${tab === 'planner' ? 'active' : ''}`} onClick={() => setTab('planner')}>Planner</button>
        <button className={`tab-button ${tab === 'tasks' ? 'active' : ''}`} onClick={() => setTab('tasks')}>Tasks</button>
        <button className={`tab-button ${tab === 'recipes' ? 'active' : ''}`} onClick={() => setTab('recipes')}>Recipes</button>
        <button className={`tab-button ${tab === 'history' ? 'active' : ''}`} onClick={() => setTab('history')}>History</button>
        <button className={`tab-button ${tab === 'analytics' ? 'active' : ''}`} onClick={() => setTab('analytics')}>Analytics</button>
        <button className={`tab-button ${tab === 'family' ? 'active' : ''}`} onClick={() => setTab('family')}>Family</button>
        <button className={`tab-button ${tab === 'permissions' ? 'active' : ''}`} onClick={() => setTab('permissions')}>Permissions</button>
        <button className={`tab-button ${tab === 'settings' ? 'active' : ''}`} onClick={() => setTab('settings')}>Settings</button>
      </div>
      <main>
        <div className="tab-content">
      {tab === 'dashboard' && (
         /* render WeekView directly so it can size itself */
         <div className="w-100">
           {/* View Mode Controls */}
           <div className="view-controls">
             <div className="view-mode-selector">
               <button
                 className={`view-btn ${viewMode === 'all' ? 'active' : ''}`}
                 onClick={() => setViewMode('all')}
               >
                 All Tasks
               </button>
               <button
                 className={`view-btn ${viewMode === 'personal' ? 'active' : ''}`}
                 onClick={() => setViewMode('personal')}
               >
                 Unassigned
               </button>
               <select
                 value={selectedUser}
                 onChange={(e) => {
                   setSelectedUser(e.target.value);
                   setViewMode('user');
                 }}
                 className="user-select"
                 aria-label="Select User"
               >
                 <option value="">Select User</option>
                 {familyMembers.map(member => (
                   <option key={member.id} value={member.name}>
                     {member.avatar} {member.name}
                   </option>
                 ))}
               </select>
               <button
                 className={`view-btn ${bulkMode ? 'active' : ''}`}
                 onClick={() => {
                   setBulkMode(!bulkMode);
                   if (bulkMode) {
                     setSelectedTasks(new Set());
                   }
                 }}
               >
                 {bulkMode ? 'Exit Bulk Mode' : 'Bulk Select'}
               </button>
             </div>
           </div>

           {bulkMode && (
             <BulkActionsBar
               selectedCount={selectedTasks.size}
               onMarkComplete={handleBulkComplete}
               onMarkIncomplete={handleBulkIncomplete}
               onDelete={handleBulkDelete}
               onAssign={() => setShowAssignModal(true)}
               onExitBulkMode={() => {
                 setSelectedTasks(new Set());
                 setBulkMode(false);
               }}
             />
           )}

           {showAssignModal && (
             <div className="modal-overlay" onClick={() => setShowAssignModal(false)}>
               <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                 <h3>Assign Tasks to Family Member</h3>
                 <div className="family-members-list">
                   <button
                     className="member-option"
                     onClick={() => {
                       handleBulkAssign('');
                       setShowAssignModal(false);
                     }}
                   >
                     Unassign
                   </button>
                   {familyMembers.map(member => (
                     <button
                       key={member.id}
                       className="member-option"
                       onClick={() => {
                         handleBulkAssign(member.name);
                         setShowAssignModal(false);
                       }}
                     >
                       <span className="member-avatar" style={{ backgroundColor: member.color + '20', color: member.color }}>
                         {member.avatar}
                       </span>
                       <span className="member-name">{member.name}</span>
                     </button>
                   ))}
                 </div>
                 <div className="modal-actions">
                   <button className="btn-secondary" onClick={() => setShowAssignModal(false)}>
                     Cancel
                   </button>
                 </div>
               </div>
             </div>
           )}

           <WeekView
             tasks={filteredTasks}
             onEdit={handleEdit}
             onDelete={handleDelete}
             onAdd={handleAdd}
             mode="rows"
             weekStart={new Date()}
             daysCount={weekDays}
             bulkMode={bulkMode}
             selectedTasks={selectedTasks}
             onTaskSelect={(taskId) => {
               const newSelected = new Set(selectedTasks);
               if (newSelected.has(taskId)) {
                 newSelected.delete(taskId);
               } else {
                 newSelected.add(taskId);
               }
               setSelectedTasks(newSelected);
             }}
           />
           <div className="container-sm">
             <h3 className="text-center">Today's Groceries</h3>
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
          {tab === 'analytics' && (
            <RecipeAnalytics
              recipes={recipes}
              mealHistory={mealHistory}
              familyMembers={familyMembers}
            />
          )}
          {tab === 'recipes' && <RecipeManager familyMembers={familyMembers} />}
          {tab === 'history' && (
            <div className="history-tab">
              <div className="history-sub-tabs">
                <button
                  className={`sub-tab-button ${historySubTab === 'meals' ? 'active' : ''}`}
                  onClick={() => setHistorySubTab('meals')}
                >
                  Meal History
                </button>
                <button
                  className={`sub-tab-button ${historySubTab === 'nutrition' ? 'active' : ''}`}
                  onClick={() => setHistorySubTab('nutrition')}
                >
                  Nutrition Analysis
                </button>
              </div>
              <div className="history-content">
                {historySubTab === 'meals' && (
                  <MealHistoryView familyMembers={familyMembers} recipes={recipes} />
                )}
                {historySubTab === 'nutrition' && (
                  <NutritionAnalysis
                    mealHistory={mealHistory}
                    recipes={recipes}
                    familyMembers={familyMembers}
                  />
                )}
              </div>
            </div>
          )}
          {tab === 'family' && <FamilyManager />}
          {tab === 'permissions' && <PermissionsManager />}
          {tab === 'settings' && <Settings />}
        </div>
        {/* floating editor shown when editing is set (opened by + buttons) */}
        {editing && (
          <>
          <div className="modal-backdrop" role="presentation" onClick={() => setEditing(null)} />
          <div className="editor-floating" role="dialog" aria-label="Create Task">
            <TaskEditor
              onCreate={(t) => { handleCreate(t); setEditing(null); }}
              initial={editing}
              onUpdate={(t) => { handleUpdate(t); setEditing(null); }}
            />
          </div>
          </>
        )}
      </main>
    </div>
  );
}

export default App;
