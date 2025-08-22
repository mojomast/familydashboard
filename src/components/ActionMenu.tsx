import React from 'react';

export type MenuItem = { label: string; onSelect: () => void };

export const ActionMenu: React.FC<{ items: MenuItem[] }>
  = ({ items }) => {
  return (
    <details className="menu">
      <summary className="menu-trigger" aria-label="Open actions">⋯</summary>
      <div role="menu" className="menu-popover">
        {items.map((it, idx) => (
          <button key={idx} role="menuitem" className="menu-item" onClick={(e) => { e.preventDefault(); e.stopPropagation(); it.onSelect(); (e.currentTarget.closest('details') as HTMLDetailsElement)?.removeAttribute('open'); }}>
            {it.label}
          </button>
        ))}
      </div>
    </details>
  );
};

export default ActionMenu;
