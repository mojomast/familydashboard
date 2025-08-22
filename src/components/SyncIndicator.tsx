import React from 'react';
import { useSyncState } from '../lib/realtime';

export const SyncIndicator: React.FC = () => {
  const syncState = useSyncState();

  const getStatusColor = () => {
    if (!syncState.isOnline) return '#ef4444'; // red
    if (syncState.isSyncing) return '#f59e0b'; // yellow
    if (syncState.connectionStatus === 'connected') return '#10b981'; // green
    return '#6b7280'; // gray
  };

  const getStatusText = () => {
    if (!syncState.isOnline) return 'Offline';
    if (syncState.isSyncing) return 'Syncing...';
    if (syncState.connectionStatus === 'connected') return 'Synced';
    if (syncState.connectionStatus === 'connecting') return 'Connecting...';
    return 'Disconnected';
  };

  const getStatusIcon = () => {
    if (!syncState.isOnline) return '📶';
    if (syncState.isSyncing) return '🔄';
    if (syncState.connectionStatus === 'connected') return '✅';
    if (syncState.connectionStatus === 'connecting') return '⏳';
    return '❌';
  };

  return (
    <div className="sync-indicator" title={`${getStatusText()} - Last sync: ${new Date(syncState.lastSyncTime).toLocaleTimeString()}`}>
      <div
        className="sync-status-dot"
        style={{ backgroundColor: getStatusColor() }}
      />
      <span className="sync-text">
        {getStatusIcon()} {getStatusText()}
      </span>
      {syncState.pendingChanges > 0 && (
        <span className="pending-changes">
          ({syncState.pendingChanges})
        </span>
      )}
    </div>
  );
};

export default SyncIndicator;