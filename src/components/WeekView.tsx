import React, { useEffect, useState } from 'react';
import { instancesForDate } from '../lib/recurrence';
import type { Task } from '../types';
import TaskList from './TaskList';
import { createDAL } from '../lib/dal';

export const WeekView: React.FC<{
  tasks: Task[];
  weekStart?: Date;
  onEdit?: (taskId: string) => void;
  onDelete?: (taskId: string) => void;
  onAdd?: (category: 'meals' | 'chores' | 'other', dateIso: string) => void;
  mode?: 'rows' | 'columns';
}> = ({ tasks, weekStart, onEdit, onDelete, onAdd, mode = 'columns' }) => {
  const start = weekStart ?? new Date();
  start.setHours(0, 0, 0, 0);

  // Always show the next 5 days for the dashboard; rows/columns only change layout
  const daysCount = 5;
  const days: Date[] = [];
  for (let i = 0; i < daysCount; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    days.push(d);
  }

  const dal = createDAL();
  const [notesStore, setNotesStore] = useState<Record<string, string>>({});
  useEffect(() => {
    // Preload notes for visible days
    (async () => {
      const entries: Record<string, string> = {};
      for (const d of days) {
        const iso = d.toISOString().slice(0, 10);
        try { entries[iso] = await dal.getNote(iso); } catch { entries[iso] = ''; }
      }
      setNotesStore(entries);
    })();
  }, []);

  // expanded state per day (notes visible). Default to true when a note exists, false otherwise.
  const initialExpanded: Record<string, boolean> = {};
  for (const d of days) {
    const iso = d.toISOString().slice(0, 10);
    initialExpanded[iso] = Boolean(notesStore[iso]);
  }
  const [expanded, setExpanded] = useState<Record<string, boolean>>(initialExpanded);

  return (
    <div>
      {mode === 'rows' && (
        <div className="column-headers">
          <div className="col-header col-meals">Meals</div>
          <div className="col-header col-chores">Chores</div>
          <div className="col-header col-other">Other</div>
        </div>
      )}
      <div className={mode === 'columns' ? 'dashboard-grid' : 'week-rows'}>
        {days.map((d) => {
          const iso = d.toISOString().slice(0, 10);
          const weekday = d.toLocaleDateString(undefined, { weekday: 'short' });
          const instances = instancesForDate(tasks, d);
          const meals = instances.filter((i) => i.task.category === 'meals');
          const chores = instances.filter((i) => i.task.category === 'chores');
          const other = instances.filter((i) => i.task.category === 'other');

          return (
            <div key={iso} className={mode === 'columns' ? 'day-column' : 'day-row'}>
              <div className="row-header">
                <div className="day-title">{weekday} — {iso}</div>
              </div>
              <div className="day-columns">
                <div className="column-cell col-meals">
                  <button className="cell-add" title={`Add meal for ${iso}`} onClick={() => onAdd && onAdd('meals', iso)}>➕</button>
                  <TaskList tasks={meals} onEdit={onEdit} onDelete={onDelete} />
                </div>
                <div className="column-cell col-chores">
                  <button className="cell-add" title={`Add chore for ${iso}`} onClick={() => onAdd && onAdd('chores', iso)}>➕</button>
                  <TaskList tasks={chores} onEdit={onEdit} onDelete={onDelete} />
                </div>
                <div className="column-cell col-other">
                  <button className="cell-add" title={`Add other task for ${iso}`} onClick={() => onAdd && onAdd('other', iso)}>➕</button>
                  <TaskList tasks={other} onEdit={onEdit} onDelete={onDelete} />
                </div>
              </div>
              <div className={`notes-area collapsible ${expanded[iso] ? '' : 'collapsed'}`}>
                <h5>Notes</h5>
                <textarea
                  className="day-note"
                  aria-label={`Notes for ${iso}`}
                  defaultValue={notesStore[iso] ?? ''}
                  onBlur={async (e) => {
                    const v = e.currentTarget.value;
                    try { await dal.saveNote(iso, v); } catch { /* ignore */ }
                    setNotesStore((s) => {
                      const next = { ...s };
                      if (v.trim()) next[iso] = v; else delete next[iso];
                      return next;
                    });
                    setExpanded((s) => ({ ...s, [iso]: Boolean(v && v.trim()) }));
                  }}
                  rows={2}
                />
              </div>
              <div className="day-footer">
                <button
                  className="note-toggle-bottom"
                  aria-expanded={expanded[iso]}
                  title="Toggle notes"
                  onClick={() => setExpanded((s) => ({ ...s, [iso]: !s[iso] }))}
                >＋</button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default WeekView;
