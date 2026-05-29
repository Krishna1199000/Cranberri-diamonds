"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { NotificationPopup } from "./NotificationPopup";

export interface OverdueNotification {
  id: string;
  type: "invoice" | "memo";
  title: string;
  clientName: string;
  documentNumber: string;
  stoneSummary: string;
  issueDate: string;
  daysOverdue: number;
  amount: number;
  priority: "high" | "medium" | "low";
}

interface NotificationContextType {
  notifications: OverdueNotification[];
  visibleNotifications: OverdueNotification[];
  visibleCount: number;
  showNotifications: () => void;
  refreshNotifications: () => Promise<void>;
  dismissForSession: (notificationId: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

const DISMISSED_KEY = "dismissedNotifications";

function loadDismissedIds(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = sessionStorage.getItem(DISMISSED_KEY);
    if (!raw) return new Set();
    return new Set(JSON.parse(raw) as string[]);
  } catch {
    return new Set();
  }
}

interface NotificationProviderProps {
  children: React.ReactNode;
}

export function NotificationProvider({ children }: NotificationProviderProps) {
  const [notifications, setNotifications] = useState<OverdueNotification[]>([]);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(() => loadDismissedIds());
  const [showPopup, setShowPopup] = useState(false);
  const [hasCheckedOnLogin, setHasCheckedOnLogin] = useState(false);

  const fetchNotifications = useCallback(async () => {
    try {
      const response = await fetch("/api/notifications");
      const data = await response.json();

      if (data.success) {
        setNotifications(data.notifications);
        return data.notifications as OverdueNotification[];
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
    }
    return [];
  }, []);

  const visibleNotifications = useMemo(
    () => notifications.filter((n) => !dismissedIds.has(n.id)),
    [notifications, dismissedIds]
  );

  const dismissForSession = useCallback((notificationId: string) => {
    setDismissedIds((prev) => {
      const next = new Set(prev);
      next.add(notificationId);
      sessionStorage.setItem(DISMISSED_KEY, JSON.stringify(Array.from(next)));
      return next;
    });
  }, []);

  const showNotifications = useCallback(() => {
    setShowPopup(true);
  }, []);

  const refreshNotifications = useCallback(async () => {
    await fetchNotifications();
  }, [fetchNotifications]);

  useEffect(() => {
    const checkNotificationsOnLogin = async () => {
      if (hasCheckedOnLogin) return;

      const fetched = await fetchNotifications();
      const dismissed = loadDismissedIds();
      setDismissedIds(dismissed);

      const visible = fetched.filter((n) => !dismissed.has(n.id));
      if (visible.length > 0) {
        setShowPopup(true);
      }

      setHasCheckedOnLogin(true);
    };

    checkNotificationsOnLogin();
  }, [hasCheckedOnLogin, fetchNotifications]);

  useEffect(() => {
    if (showPopup && visibleNotifications.length === 0) {
      setShowPopup(false);
    }
  }, [showPopup, visibleNotifications.length]);

  const contextValue: NotificationContextType = {
    notifications,
    visibleNotifications,
    visibleCount: visibleNotifications.length,
    showNotifications,
    refreshNotifications,
    dismissForSession,
  };

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
      <NotificationPopup
        isOpen={showPopup}
        onClose={() => setShowPopup(false)}
        notifications={visibleNotifications}
        onRefresh={refreshNotifications}
        onSessionDismiss={dismissForSession}
      />
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error("useNotifications must be used within a NotificationProvider");
  }
  return context;
}
