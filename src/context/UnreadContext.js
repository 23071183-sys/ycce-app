import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import api from '../services/api';
import { useAuth } from './AuthContext';

const POLL_MS = 30000;
// Fest admins have no Messages tab, so there's nothing to count for them.
const CAN_MESSAGE = ['student', 'professor', 'admin', 'super_admin'];

const UnreadContext = createContext({ total: 0, refresh: () => {} });

// The unread direct-message count behind the Messages tab badge. Polls while
// the app is in the foreground; screens call refresh() after reading a thread
// so the badge drops straight away.
export function UnreadProvider({ children }) {
  const { user } = useAuth();
  const enabled = CAN_MESSAGE.includes(user?.role);
  const [total, setTotal] = useState(0);
  const timer = useRef(null);

  const refresh = useCallback(async () => {
    if (!enabled) return;
    try {
      const { data } = await api.get('/messages/unread-count');
      setTotal(Number(data?.total) || 0);
    } catch {
      // Keep the last count; the next poll tries again.
    }
  }, [enabled]);

  useEffect(() => {
    if (!enabled) { setTotal(0); return undefined; }
    const start = () => {
      clearInterval(timer.current);
      refresh();
      timer.current = setInterval(refresh, POLL_MS);
    };
    const stop = () => clearInterval(timer.current);
    if (AppState.currentState === 'active') start();
    const sub = AppState.addEventListener('change', (s) => (s === 'active' ? start() : stop()));
    return () => { stop(); sub.remove(); };
  }, [enabled, refresh, user?.id]);

  return <UnreadContext.Provider value={{ total, refresh }}>{children}</UnreadContext.Provider>;
}

export const useUnread = () => useContext(UnreadContext);
