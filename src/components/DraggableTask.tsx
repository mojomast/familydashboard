import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Task } from '../types';
import ActionMenu from './ActionMenu';

interface DraggableTaskProps {
  task: Task;
  date: string;
  isCompleted: boolean;
  onToggle: () => void;
  onEdit?: (taskId: string) => void;
  onDelete?: (taskId: string) => void;
  familyMembers: Array<{ id: string; name: string; avatar: string; color: string; }>;
  bulkMode?: boolean;
  isSelected?: boolean;
  onSelect?: (taskId: string) => void;
}

export const DraggableTask: React.FC<DraggableTaskProps> = ({
  task,
  date,
  isCompleted,
  onToggle,
  onEdit,
  onDelete,
  familyMembers,
  bulkMode,
  isSelected,
  onSelect
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: `${task.id}-${date}`,
    data: { task, date }
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const assignedMember = familyMembers.find(m => m.name === task.assignedTo);

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={`task-item ${isDragging ? 'dragging' : ''} ${isSelected ? 'bulk-selected' : ''}`}
    >
      <div className="task-content">
        {bulkMode ? (
          <label className="bulk-select-label">
            <input
              type="checkbox"
              checked={isSelected || false}
              onChange={() => onSelect && onSelect(task.id)}
            />
            <strong className="task-title">{task.title}</strong>
          </label>
        ) : (
          <label>
            <input
              type="checkbox"
              checked={isCompleted}
              onChange={onToggle}
            />
            <strong className="task-title">{task.title}</strong>
          </label>
        )}

        {task.assignedTo && (
          <span className="task-assignment">
            {assignedMember && (
              <span
                className="assignment-avatar"
                style={{ backgroundColor: assignedMember.color + '20', color: assignedMember.color }}
              >
                {assignedMember.avatar}
              </span>
            )}
            <span className="assignment-name">{task.assignedTo}</span>
          </span>
        )}
      </div>

      <div className="task-actions">
        <button
          className="drag-handle"
          {...attributes}
          {...listeners}
          aria-label="Drag to reorder task"
        >
          ⋮⋮
        </button>

        <ActionMenu
          items={[
            { label: 'Edit', onSelect: () => onEdit && onEdit(task.id) },
            { label: 'Delete', onSelect: () => onDelete && onDelete(task.id) },
          ]}
        />
      </div>
    </li>
  );
};