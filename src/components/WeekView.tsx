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
  daysCount?: number;
}> = ({ tasks, weekStart, onEdit, onDelete, onAdd, mode = 'columns', daysCount = 5 }) => {
  const start = weekStart ?? new Date();
  start.setHours(0, 0, 0, 0);

  const days: Date[] = React.useMemo(() => {
    const arr: Date[] = [];
    for (let i = 0; i < daysCount; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      arr.push(d);
    }
    return arr;
  }, [start.getTime(), daysCount]);

  const dal = createDAL();
  const [notesStore, setNotesStore] = useState<Record<string, string>>({});
  const [catNames, setCatNames] = useState<Record<'meals'|'chores'|'other', string>>({ meals: 'Meals', chores: 'Chores', other: 'Other' });
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
  }, [dal, daysCount, weekStart]);
  useEffect(() => {
    (async () => {
      try {
        const cats = await dal.getCategories();
    const names: Record<'meals'|'chores'|'other', string> = { meals: 'Meals', chores: 'Chores', other: 'Other' };
        for (const c of cats) names[c.key] = c.name || names[c.key];
        setCatNames(names);
        // apply colors to CSS variables at root for theming
        const root = document.documentElement;
        for (const c of cats) {
          if (c.bg) root.style.setProperty(`--cat-${c.key}-bg`, c.bg);
          if (c.fg) root.style.setProperty(`--cat-${c.key}-fg`, c.fg);
          if (c.border) root.style.setProperty(`--cat-${c.key}-border`, c.border);
        }
      } catch { /* ignore */ }
    })();
  }, [dal]);

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
          <div className="col-header col-meals">{catNames.meals}</div>
          <div className="col-header col-chores">{catNames.chores}</div>
          <div className="col-header col-other">{catNames.other}</div>
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
                    try { await dal.saveNote(iso, v); } catch (err) { console.warn('saveNote failed', err); }
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
                  aria-expanded={expanded[iso] ? 'true' : 'false'}
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
