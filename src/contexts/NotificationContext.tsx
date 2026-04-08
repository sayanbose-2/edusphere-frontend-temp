import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  type ReactNode,
} from 'react';
import { toast } from 'react-toastify';
import { useAuth } from '@/contexts/AuthContext';
import { notificationService } from '@/services/notification.service';
import type { Notification } from '@/types/compliance.types';

interface NotificationContextValue {
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  fetchNotifications: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextValue | undefined>(undefined);

// Poll every 5 seconds as a reliable fallback
const POLL_INTERVAL_MS = 5000;

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { user, isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const knownIds = useRef<Set<string>>(new Set());
  const abortRef = useRef<AbortController | null>(null);

  // Central dedup + state update used by both SSE and polling
  const mergeNotifications = useCallback((incoming: Notification[]) => {
    const newOnes = incoming.filter((n) => !knownIds.current.has(n.notificationId));
    if (newOnes.length === 0) return;

    // Only toast if we already had some known notifications (not the very first load)
    if (knownIds.current.size > 0) {
      newOnes.forEach((n) => toast.info(n.message, { autoClose: 5000 }));
    }

    newOnes.forEach((n) => knownIds.current.add(n.notificationId));
    setNotifications((prev) => {
      const existingIds = new Set(prev.map((n) => n.notificationId));
      const toAdd = newOnes.filter((n) => !existingIds.has(n.notificationId));
      return toAdd.length > 0 ? [...toAdd, ...prev] : prev;
    });
  }, []);

  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    try {
      const incoming = await notificationService.getByUser(user.id);
      mergeNotifications(incoming);
      // Also sync full list to keep state in order with server
      setNotifications(incoming);
      knownIds.current = new Set(incoming.map((n) => n.notificationId));
    } catch (err: unknown) {
      const status =
        err &&
        typeof err === 'object' &&
        'response' in err &&
        (err as { response?: { status?: number } }).response?.status;
      if (status === 500 || status === 404) {
        setNotifications([]);
        knownIds.current = new Set();
      }
    }
  }, [user, mergeNotifications]);

  // SSE connection — best-effort live delivery on top of polling
  const connectSSE = useCallback((userId: string, signal: AbortSignal) => {
    const token = localStorage.getItem('accessToken');

    (async () => {
      try {
        const res = await fetch(`/api/v1/notifications/stream/${userId}`, {
          headers: { Authorization: `Bearer ${token}` },
          signal,
        });

        if (!res.ok || !res.body) return;

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() ?? '';

          for (const line of lines) {
            if (!line.startsWith('data:')) continue;
            const raw = line.slice(5).trim();
            if (!raw || raw === 'ping') continue;
            try {
              const n: Notification = JSON.parse(raw);
              if (knownIds.current.has(n.notificationId)) continue;
              knownIds.current.add(n.notificationId);
              if (knownIds.current.size > 1) {
                toast.info(n.message, { autoClose: 5000 });
              }
              setNotifications((prev) => [n, ...prev]);
            } catch {
              // malformed line — skip
            }
          }
        }
      } catch {
        // AbortError on cleanup, or SSE failed — polling covers it
      }
    })();
  }, []);

  useEffect(() => {
    if (!isAuthenticated || !user) return;

    knownIds.current = new Set();

    // Initial load (no toasts — establishes baseline)
    fetchNotifications();

    // SSE for live delivery
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    connectSSE(user.id, ctrl.signal);

    // Polling fallback — catches anything SSE misses
    const pollId = setInterval(async () => {
      if (!user) return;
      try {
        const incoming = await notificationService.getByUser(user.id);
        const newOnes = incoming.filter((n) => !knownIds.current.has(n.notificationId));
        if (newOnes.length > 0) {
          newOnes.forEach((n) => {
            toast.info(n.message, { autoClose: 5000 });
            knownIds.current.add(n.notificationId);
          });
          setNotifications(incoming);
          knownIds.current = new Set(incoming.map((n) => n.notificationId));
        }
      } catch {
        // ignore poll errors
      }
    }, POLL_INTERVAL_MS);

    return () => {
      ctrl.abort();
      abortRef.current = null;
      clearInterval(pollId);
    };
  }, [isAuthenticated, user, fetchNotifications, connectSSE]);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const markAsRead = async (id: string) => {
    try {
      await notificationService.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.notificationId === id ? { ...n, isRead: true } : n))
      );
    } catch {
      // ignore
    }
  };

  const markAllAsRead = async () => {
    if (!user) return;
    try {
      await notificationService.markAllAsRead(user.id);
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch {
      // ignore
    }
  };

  return (
    <NotificationContext.Provider
      value={{ notifications, unreadCount, markAsRead, markAllAsRead, fetchNotifications }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotifications must be used within NotificationProvider');
  return ctx;
}
