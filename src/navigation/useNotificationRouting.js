import { useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';

// Opens the right screen when the user taps a push notification. Message
// pushes carry { type: 'message', conversationId }. Covers both a tap while
// the app is running and the tap that cold-started it.
export default function useNotificationRouting(navigationRef, { ready, signedIn }) {
  const handled = useRef(new Set());

  useEffect(() => {
    if (!ready || !signedIn) return undefined;

    const open = (response) => {
      const id = response?.notification?.request?.identifier;
      if (!id || handled.current.has(id)) return;
      handled.current.add(id);
      const data = response.notification.request.content.data || {};
      if (data.type === 'message' && data.conversationId) {
        navigationRef.navigate('Main', {
          screen: 'Conversation',
          params: { conversationId: Number(data.conversationId) },
        });
      }
    };

    Notifications.getLastNotificationResponseAsync().then(open).catch(() => {});
    const sub = Notifications.addNotificationResponseReceivedListener(open);
    return () => sub.remove();
  }, [navigationRef, ready, signedIn]);
}
