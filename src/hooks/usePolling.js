import { useCallback, useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import { useIsFocused } from '@react-navigation/native';

// Calls tick() every `interval` ms while this screen is focused and the app is
// in the foreground. tick() resolves to true when it found something new;
// after `idleAfter` ms with nothing new the pace drops to `slowInterval` to
// save battery and Render's free-tier hours. Returns bump(), which resets to
// the fast pace (call it after the user sends something).
export default function usePolling(tick, { interval = 5000, slowInterval = 15000, idleAfter = 120000, enabled = true } = {}) {
  const isFocused = useIsFocused();
  const tickRef = useRef(tick);
  tickRef.current = tick;
  const lastActivity = useRef(Date.now());
  const appActive = useRef(AppState.currentState === 'active');
  const timer = useRef(null);
  const running = useRef(false);

  const bump = useCallback(() => { lastActivity.current = Date.now(); }, []);

  const schedule = useCallback(() => {
    clearTimeout(timer.current);
    if (!running.current) return;
    const idle = Date.now() - lastActivity.current > idleAfter;
    timer.current = setTimeout(async () => {
      if (!running.current) return;
      try {
        const gotNew = await tickRef.current();
        if (gotNew) lastActivity.current = Date.now();
      } catch {
        // A failed poll is retried on the next tick; the screen shows its own errors.
      }
      schedule();
    }, idle ? slowInterval : interval);
  }, [interval, slowInterval, idleAfter]);

  const start = useCallback(() => {
    if (running.current) return;
    running.current = true;
    lastActivity.current = Date.now();
    schedule();
  }, [schedule]);

  const stop = useCallback(() => {
    running.current = false;
    clearTimeout(timer.current);
  }, []);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      appActive.current = state === 'active';
      if (appActive.current && isFocused && enabled) {
        // Catch up straight away after coming back to the app.
        Promise.resolve().then(() => tickRef.current()).catch(() => {});
        start();
      } else {
        stop();
      }
    });
    return () => sub.remove();
  }, [isFocused, enabled, start, stop]);

  useEffect(() => {
    if (isFocused && enabled && appActive.current) start(); else stop();
    return stop;
  }, [isFocused, enabled, start, stop]);

  return bump;
}
