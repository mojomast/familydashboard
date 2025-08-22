import React from 'react';

interface BulkActionsBarProps {
  selectedCount: number;
  onMarkComplete: () => void;
  onMarkIncomplete: () => void;
  onDelete: () => void;
  onAssign: () => void;
  onExitBulkMode: () => void;
}

export const BulkActionsBar: React.FC<BulkActionsBarProps> = ({
  selectedCount,
  onMarkComplete,
  onMarkIncomplete,
  onDelete,
  onAssign,
  onExitBulkMode
}) => {
  if (selectedCount === 0) {
    return (
      <div className="bulk-actions-bar">
        <div className="bulk-info">
          <span>Select tasks to bulk edit</span>
        </div>
        <button className="btn-secondary" onClick={onExitBulkMode}>
          Exit Bulk Mode
        </button>
      </div>
    );
  }

  return (
    <div className="bulk-actions-bar active">
      <div className="bulk-info">
        <span>{selectedCount} task{selectedCount !== 1 ? 's' : ''} selected</span>
      </div>
      <div className="bulk-actions">
        <button className="btn-primary" onClick={onMarkComplete}>
          Mark Complete
        </button>
        <button className="btn-secondary" onClick={onMarkIncomplete}>
          Mark Incomplete
        </button>
        <button className="btn-secondary" onClick={onAssign}>
          Assign
        </button>
        <button className="btn-danger" onClick={onDelete}>
          Delete
        </button>
        <button className="btn-secondary" onClick={onExitBulkMode}>
          Cancel
        </button>
      </div>
    </div>
  );
};

export default BulkActionsBar;