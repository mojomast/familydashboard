import React, { useEffect, useState } from 'react';
import { createDAL } from '../lib/dal';

type CatKey = 'meals' | 'chores' | 'other';

export const Settings: React.FC = () => {
  const dal = createDAL();
  const [cats, setCats] = useState<Array<{ key: CatKey; name: string; bg?: string; fg?: string; border?: string }>>([]);
  const [weekDays, setWeekDays] = useState<number>(5);

  useEffect(() => {
    (async () => {
    try { setCats(await dal.getCategories()); } catch { /* ignore */ }
      try { const wd = await dal.getSetting<number>('weekDays'); if (wd) setWeekDays(Number(wd)); } catch { /* ignore */ }
    })();
  }, [dal]);

  const updateCat = async (key: CatKey, patch: Partial<{ name: string; bg: string; fg: string; border: string }>) => {
    setCats((s) => s.map(c => c.key === key ? { ...c, ...patch } : c));
    try { await dal.updateCategory(key, patch); } catch { /* ignore */ }
  };
  const saveWeekDays = async (n: number) => {
    setWeekDays(n);
    try { await dal.setSetting('weekDays', n); } catch { /* ignore */ }
  };

  return (
    <div className="container-sm">
      <h2 className="text-center">Settings</h2>
      <section>
        <h3>Categories</h3>
        {cats.map(c => (
          <div key={c.key} className="hstack-6">
            <strong style={{ minWidth: 70, display: 'inline-block' }}>{c.key}</strong>
            <label>Name <input value={c.name} onChange={(e) => updateCat(c.key, { name: e.target.value })} /></label>
            <label>Bg <input type="color" value={c.bg || '#ffffff'} onChange={(e) => updateCat(c.key, { bg: e.target.value })} /></label>
            <label>Fg <input type="color" value={c.fg || '#000000'} onChange={(e) => updateCat(c.key, { fg: e.target.value })} /></label>
            <label>Border <input type="color" value={c.border || '#cccccc'} onChange={(e) => updateCat(c.key, { border: e.target.value })} /></label>
          </div>
        ))}
      </section>

      <section style={{ marginTop: 16 }}>
        <h3>Week View</h3>
        <label>
          Days to show:
          <select value={weekDays} onChange={(e) => saveWeekDays(Number(e.target.value))} style={{ marginLeft: 8 }}>
            <option value={5}>5</option>
            <option value={7}>7</option>
          </select>
        </label>
      </section>
    </div>
  );
};

export default Settings;
