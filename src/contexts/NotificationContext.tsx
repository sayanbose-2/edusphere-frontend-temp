import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  type ReactNode,
} from "react";
import { toast } from "react-toastify";
import { useAuth } from "@/contexts/AuthContext";
import apiClient from "@/api/client";
import type { INotification } from "@/types/complianceTypes";

interface NotificationContextValue {
  notifications: INotification[];
  unreadCount: number;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  fetchNotifications: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextValue | undefined>(
  undefined,
);

const POLL_INTERVAL_MS = 5000;

const NotificationProvider = ({ children }: { children: ReactNode }) => {
  const { user, isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState<INotification[]>([]);
  const knownIds = useRef<Set<string>>(new Set());
  const initialized = useRef(false);
  const abortRef = useRef<AbortController | null>(null);

  const mergeNotifications = useCallback((incoming: INotification[]) => {
    const newOnes = incoming.filter((n) => !knownIds.current.has(n.id));
    if (newOnes.length === 0) return;

    if (initialized.current) {
      newOnes.forEach((n) => toast.info(n.message, { autoClose: 5000 }));
    }

    newOnes.forEach((n) => knownIds.current.add(n.id));
    setNotifications((prev) => {
      const existingIds = new Set(prev.map((n) => n.id));
      const toAdd = newOnes.filter((n) => !existingIds.has(n.id));
      return toAdd.length > 0 ? [...toAdd, ...prev] : prev;
    });
  }, []);

  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    try {
      const incoming = await apiClient
        .get<INotification[]>(`/notifications/${user.id}`)
        .then((r) => r.data);
      mergeNotifications(incoming);
      setNotifications(incoming);
      knownIds.current = new Set(incoming.map((n) => n.id));
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response
        ?.status;
      if (status === 500 || status === 404) {
        setNotifications([]);
        knownIds.current = new Set();
      }
    } finally {
      initialized.current = true;
    }
  }, [user, mergeNotifications]);

  // SSE best-effort live delivery — polling is the reliable fallback
  const connectSSE = useCallback((userId: string, signal: AbortSignal) => {
    const token = localStorage.getItem("accessToken");

    (async () => {
      try {
        const res = await fetch(`/api/v1/notifications/stream/${userId}`, {
          headers: { Authorization: `Bearer ${token}` },
          signal,
        });

        if (!res.ok || !res.body) return;

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            if (!line.startsWith("data:")) continue;
            const raw = line.slice(5).trim();
            if (!raw || raw === "ping") continue;
            try {
              const n: INotification = JSON.parse(raw);
              if (knownIds.current.has(n.id)) continue;
              knownIds.current.add(n.id);
              if (initialized.current) {
                toast.info(n.message, { autoClose: 5000 });
              }
              setNotifications((prev) => [n, ...prev]);
            } catch {
              // malformed SSE line
            }
          }
        }
      } catch {
        // AbortError on cleanup or SSE failed — polling covers it
      }
    })();
  }, []);

  useEffect(() => {
    if (!isAuthenticated || !user) return;

    knownIds.current = new Set();
    initialized.current = false;

    fetchNotifications();

    const ctrl = new AbortController();
    abortRef.current = ctrl;
    connectSSE(user.id, ctrl.signal);

    const pollId = setInterval(async () => {
      if (!user) return;
      try {
        const incoming = await apiClient
          .get<INotification[]>(`/notifications/${user.id}`)
          .then((r) => r.data);
        const newOnes = incoming.filter((n) => !knownIds.current.has(n.id));
        if (newOnes.length > 0) {
          newOnes.forEach((n) => {
            toast.info(n.message, { autoClose: 5000 });
            knownIds.current.add(n.id);
          });
          setNotifications(incoming);
          knownIds.current = new Set(incoming.map((n) => n.id));
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
      await apiClient.patch(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
      );
    } catch {
      // ignore
    }
  };

  const markAllAsRead = async () => {
    if (!user) return;
    try {
      await apiClient.patch(`/notifications/${user.id}/read-all`);
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch {
      // ignore
    }
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        markAsRead,
        markAllAsRead,
        fetchNotifications,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
const useNotifications = () => {
  const ctx = useContext(NotificationContext);
  if (!ctx)
    throw new Error(
      "useNotifications must be used within NotificationProvider",
    );
  return ctx;
};

export { NotificationProvider, useNotifications };
