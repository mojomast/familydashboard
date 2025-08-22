import React, { useState } from 'react';
import QRCode from 'react-qr-code';

export const QrButton: React.FC = () => {
  const [open, setOpen] = useState(false);
  const url = window.location.origin;

  return (
    <details className="qr-wrap" open={open} onToggle={(e) => setOpen((e.target as HTMLDetailsElement).open)}>
      <summary className="small-btn" aria-label="Show QR to open on phone">QR</summary>
      <div role="dialog" aria-label="QR code" className="qr-popover">
        <div className="qr-text">Scan this with your phone:</div>
        <div className="qr-box">
          <QRCode value={url} size={128} />
        </div>
      </div>
    </details>
  );
};

export default QrButton;
