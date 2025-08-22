import React, { useEffect, useState } from 'react';
import { createDAL } from '../lib/dal';

export const GroceryList: React.FC<{ dateIso: string; mealTaskId?: string }>
  = ({ dateIso, mealTaskId }) => {
  const dal = createDAL();
  const [items, setItems] = useState<Array<{ id: string; dateIso: string; label: string; done: boolean; mealTaskId?: string }>>([]);
  const [text, setText] = useState('');

  useEffect(() => {
    (async () => {
      try { setItems(await dal.listGroceries(dateIso)); } catch { setItems([]); }
    })();
  }, [dateIso]);

  const add = async () => {
    const label = text.trim();
    if (!label) return;
    setText('');
    try {
      const saved = await dal.addGrocery({ dateIso, label, mealTaskId });
      setItems((s) => [saved, ...s]);
    } catch { /* ignore */ }
  };
  const toggle = async (id: string, done: boolean) => {
    setItems((s) => s.map(i => i.id === id ? { ...i, done } : i));
    try { await dal.updateGrocery(id, { done }); } catch { /* ignore */ }
  };
  const remove = async (id: string) => {
    setItems((s) => s.filter(i => i.id !== id));
    try { await dal.deleteGrocery(id); } catch { /* ignore */ }
  };

  return (
    <div>
      <div className="hstack-6">
        <input aria-label={`Add grocery item for ${dateIso}`} value={text} onChange={(e) => setText(e.target.value)} />
        <button onClick={add} title="Add grocery">Add</button>
      </div>
      <ul>
        {items.map(i => (
          <li key={i.id} className="task-item">
            <label>
              <input type="checkbox" checked={i.done} onChange={(e) => toggle(i.id, e.currentTarget.checked)} /> {i.label}
            </label>
            <button className="icon-btn" title="Delete" onClick={() => remove(i.id)}>🗑️</button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default GroceryList;
