import React from 'react';
import { EmptyState, ErrorState } from '../../components/ui';

// The AI study endpoints fail in a few expected ways. Turn each into a calm,
// specific empty state instead of a generic error.
export function describeStudyError(e) {
  const status = e?.response?.status;
  const server = e?.response?.data?.error;
  if (status === 503) {
    return { icon: 'sparkles-outline', title: "AI isn't available right now", message: 'Try again later. Everything else in the app still works.' };
  }
  if (status === 409) {
    return { icon: 'document-text-outline', title: 'No past papers or notes yet', message: server || 'Once your professor uploads past papers or notes, this will work.' };
  }
  if (status === 429) {
    return { icon: 'hourglass-outline', title: 'Daily limit reached', message: 'Try again tomorrow.' };
  }
  return null;
}

export function StudyErrorState({ error, onRetry }) {
  const known = describeStudyError(error);
  if (known) return <EmptyState {...known} actionTitle={onRetry && error?.response?.status === 503 ? 'Try again' : undefined} onAction={onRetry} />;
  return <ErrorState onRetry={onRetry} message={error?.response?.data?.error} />;
}

// For Alert-style feedback after an action.
export const studyErrorText = (e, fallback = 'Try again in a moment.') => {
  const known = describeStudyError(e);
  return known ? [known.title, known.message] : ['Something went wrong', e?.response?.data?.error || fallback];
};
