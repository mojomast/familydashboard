import React, { useState, useEffect } from 'react';
import type { Task, UserProfile } from '../types';
import { createDAL } from '../lib/dal';
import type { DragEndEvent } from '@dnd-kit/core';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { DraggableTask } from './DraggableTask';

export const TaskList: React.FC<{
  tasks: { task: Task; date: string }[];
  onEdit?: (taskId: string) => void;
  onDelete?: (taskId: string) => void;
  bulkMode?: boolean;
  selectedTasks?: Set<string>;
  onTaskSelect?: (taskId: string) => void;
}> = ({ tasks, onEdit, onDelete, bulkMode, selectedTasks, onTaskSelect }) => {
  const dal = createDAL();
  const [completedKeys, setCompletedKeys] = useState<Set<string>>(new Set());
  const [familyMembers, setFamilyMembers] = useState<UserProfile[]>([]);

  // Sensors for drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    // Load completed instances for involved dates
    (async () => {
      try {
        const perDate = new Map<string, string[]>();
        for (const it of tasks) {
          const list = perDate.get(it.date) || [];
          list.push(it.task.id);
          perDate.set(it.date, list);
        }
        const set = new Set<string>();
        for (const [dateIso] of perDate) {
          const comps = await dal.getCompletions(dateIso);
          for (const c of comps) set.add(`${c.taskId}@${c.instanceDate}`);
        }
        setCompletedKeys(set);
      } catch { /* ignore */ }
   })();
  }, [tasks, dal]);

  useEffect(() => {
    // Load family members for assignment display
    (async () => {
      try {
        const members = await dal.getUserProfiles();
        setFamilyMembers(members);
      } catch (err) {
        console.warn('Failed to load family members:', err);
      }
    })();
  }, [dal]);

  if (!tasks.length) return <div className="no-tasks">No tasks</div>;

  const toggle = async (taskId: string, dateIso: string) => {
    const key = `${taskId}@${dateIso}`;
    const isDone = completedKeys.has(key);
    if (isDone) {
      setCompletedKeys((s) => { const n = new Set(s); n.delete(key); return n; });
  try { await dal.removeCompletion(taskId, dateIso); } catch (err) { console.warn('removeCompletion failed', err); }
  try { window.dispatchEvent(new CustomEvent('familydashboard:data-changed')); } catch (err) { console.warn('dispatch event failed', err); }
    } else {
      setCompletedKeys((s) => { const n = new Set(s); n.add(key); return n; });
  try { await dal.addCompletion({ taskId, instanceDate: dateIso }); } catch (err) { console.warn('addCompletion failed', err); }
  try { window.dispatchEvent(new CustomEvent('familydashboard:data-changed')); } catch (err) { console.warn('dispatch event failed', err); }
    }
  };


  // Handle drag end event
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = tasks.findIndex(item => `${item.task.id}-${item.date}` === active.id);
      const newIndex = tasks.findIndex(item => `${item.task.id}-${item.date}` === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        // For now, just log the drag operation
        // In a full implementation, this would reorder the tasks in the backend
        console.log(`Dragged task from index ${oldIndex} to ${newIndex}`);
      }
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={tasks.map(t => `${t.task.id}-${t.date}`)}
        strategy={verticalListSortingStrategy}
      >
        <ul>
          {tasks.map((t) => {
            const completed = completedKeys.has(`${t.task.id}@${t.date}`);
            return (
              <DraggableTask
                key={`${t.task.id}-${t.date}`}
                task={t.task}
                date={t.date}
                isCompleted={completed}
                onToggle={() => toggle(t.task.id, t.date)}
                onEdit={onEdit}
                onDelete={onDelete}
                familyMembers={familyMembers.map(m => ({
                  id: m.id,
                  name: m.name,
                  avatar: m.avatar || '👤',
                  color: m.color
                }))}
                bulkMode={bulkMode}
                isSelected={selectedTasks?.has(t.task.id) || false}
                onSelect={onTaskSelect}
              />
            );
          })}
        </ul>
      </SortableContext>
    </DndContext>
  );
};

export default TaskList;
