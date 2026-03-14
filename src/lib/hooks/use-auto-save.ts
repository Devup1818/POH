'use client';

import { useEffect, useRef, useCallback, useState } from 'react';

const AUTO_SAVE_INTERVAL = 30_000; // 30 seconds

interface UseAutoSaveOptions<T> {
  key: string;
  data: T;
  enabled?: boolean;
  interval?: number;
}

interface UseAutoSaveReturn<T> {
  hasDraft: boolean;
  draft: T | null;
  restoreDraft: () => T | null;
  clearDraft: () => void;
  dismissDraft: () => void;
}

export function useAutoSave<T>({
  key,
  data,
  enabled = true,
  interval = AUTO_SAVE_INTERVAL,
}: UseAutoSaveOptions<T>): UseAutoSaveReturn<T> {
  const storageKey = `poh-autosave-${key}`;
  const [hasDraft, setHasDraft] = useState(false);
  const [draft, setDraft] = useState<T | null>(null);
  const dataRef = useRef(data);
  dataRef.current = data;

  // Check for existing draft on mount
  useEffect(() => {
    if (!enabled) return;
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved) as { data: T; timestamp: number };
        // Only restore drafts less than 24 hours old
        if (Date.now() - parsed.timestamp < 24 * 60 * 60 * 1000) {
          setDraft(parsed.data);
          setHasDraft(true);
        } else {
          localStorage.removeItem(storageKey);
        }
      }
    } catch {
      // Ignore parse errors
    }
  }, [storageKey, enabled]);

  // Auto-save on interval
  useEffect(() => {
    if (!enabled) return;

    const timer = setInterval(() => {
      try {
        const payload = JSON.stringify({
          data: dataRef.current,
          timestamp: Date.now(),
        });
        localStorage.setItem(storageKey, payload);
      } catch {
        // localStorage might be full or unavailable
      }
    }, interval);

    return () => clearInterval(timer);
  }, [storageKey, enabled, interval]);

  // Save on beforeunload
  useEffect(() => {
    if (!enabled) return;

    const handleBeforeUnload = () => {
      try {
        localStorage.setItem(
          storageKey,
          JSON.stringify({ data: dataRef.current, timestamp: Date.now() }),
        );
      } catch {
        // ignore
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [storageKey, enabled]);

  const restoreDraft = useCallback((): T | null => {
    setHasDraft(false);
    return draft;
  }, [draft]);

  const clearDraft = useCallback(() => {
    try {
      localStorage.removeItem(storageKey);
    } catch {
      // ignore
    }
    setHasDraft(false);
    setDraft(null);
  }, [storageKey]);

  const dismissDraft = useCallback(() => {
    setHasDraft(false);
    setDraft(null);
    try {
      localStorage.removeItem(storageKey);
    } catch {
      // ignore
    }
  }, [storageKey]);

  return { hasDraft, draft, restoreDraft, clearDraft, dismissDraft };
}
