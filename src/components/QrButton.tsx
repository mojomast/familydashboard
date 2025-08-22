import React, { useState } from 'react';

export const QrButton: React.FC = () => {
  const [open, setOpen] = useState(false);
  const url = window.location.origin;

  return (
    <div style={{ position: 'relative' }}>
      <button className="small-btn" aria-haspopup="dialog" aria-expanded={open} onClick={() => setOpen(!open)} title="Show QR to open on phone">QR</button>
      {open && (
        <div role="dialog" aria-label="QR code" style={{ position: 'absolute', right: 0, top: '120%', background: 'var(--bg)', border: '1px solid var(--border)', padding: 8 }}>
          {/* Simple fallback: use Google Chart API avoided; render text URL for now. If a QR lib is allowed, we can integrate it later. */}
          <div style={{ fontSize: 12, maxWidth: 220 }}>Scan this URL on your phone:</div>
          <div style={{ fontSize: 12, color: 'var(--muted)' }}>{url}</div>
        </div>
      )}
    </div>
  );
};

export default QrButton;
