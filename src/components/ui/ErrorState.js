import React from 'react';
import EmptyState from './EmptyState';

// Shown when loading failed. Says so plainly and lets the user try again,
// instead of leaving an empty screen that looks like there's no data.
export default function ErrorState({ message, onRetry, style }) {
  return (
    <EmptyState
      icon="cloud-offline-outline"
      title="Couldn't load this"
      message={message || 'Check your connection and try again. The server can take a few seconds to wake up.'}
      actionTitle={onRetry ? 'Try again' : undefined}
      onAction={onRetry}
      style={style}
    />
  );
}
