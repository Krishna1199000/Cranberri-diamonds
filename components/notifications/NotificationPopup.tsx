"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { X, AlertCircle, Clock, FileText, ScrollText, ShieldX, Loader2 } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { useUser } from "@/hooks/use-user";
import { toast } from "sonner";
import type { OverdueNotification } from "./NotificationProvider";

interface NotificationPopupProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: OverdueNotification[];
  onRefresh?: () => void;
  onSessionDismiss: (notificationId: string) => void;
}

export function NotificationPopup({
  isOpen,
  onClose,
  notifications,
  onRefresh,
  onSessionDismiss,
}: NotificationPopupProps) {
  const [permanentlyDismissing, setPermanentlyDismissing] = useState<Set<string>>(new Set());
  const { user } = useUser();

  const handlePermanentDismiss = async (notification: OverdueNotification) => {
    if (user?.role !== "admin") {
      toast.error("Only admins can permanently dismiss notifications");
      return;
    }

    setPermanentlyDismissing((prev) => new Set(prev).add(notification.id));

    try {
      const response = await fetch("/api/notifications/dismiss", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          notificationId: notification.id,
          type: notification.type,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to permanently dismiss notification");
      }

      toast.success(data.message);
      onSessionDismiss(notification.id);
      if (onRefresh) await onRefresh();
    } catch (error) {
      console.error("Error permanently dismissing notification:", error);
      toast.error(error instanceof Error ? error.message : "Failed to dismiss notification");
    } finally {
      setPermanentlyDismissing((prev) => {
        const next = new Set(prev);
        next.delete(notification.id);
        return next;
      });
    }
  };

  if (!isOpen || notifications.length === 0) {
    return null;
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-100 border-red-300 text-red-800";
      case "medium":
        return "bg-yellow-100 border-yellow-300 text-yellow-800";
      case "low":
        return "bg-blue-100 border-blue-300 text-blue-800";
      default:
        return "bg-gray-100 border-gray-300 text-gray-800";
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[80vh] overflow-hidden">
        <div className="flex justify-between items-center p-6 border-b">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-500" />
            <h2 className="text-xl font-semibold">
              Overdue Payment & Memo Alerts ({notifications.length})
            </h2>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close">
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[60vh]">
          <div className="grid gap-4">
            {notifications.map((notification) => (
              <Card
                key={notification.id}
                className={`relative border-l-4 ${
                  notification.type === "invoice" ? "border-l-red-500" : "border-l-orange-500"
                }`}
              >
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 left-2 h-6 w-6 z-10"
                  onClick={() => onSessionDismiss(notification.id)}
                  aria-label="Dismiss for this session"
                >
                  <X className="h-3 w-3" />
                </Button>

                <CardHeader className="pb-3 pl-10">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      {notification.type === "invoice" ? (
                        <FileText className="h-5 w-5 text-red-500 shrink-0" />
                      ) : (
                        <ScrollText className="h-5 w-5 text-orange-500 shrink-0" />
                      )}
                      <div>
                        <CardTitle className="text-lg">{notification.title}</CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">
                          Client: {notification.clientName}
                        </p>
                      </div>
                    </div>
                    <Badge className={getPriorityColor(notification.priority)}>
                      <Clock className="h-3 w-3 mr-1" />
                      {notification.daysOverdue} day{notification.daysOverdue !== 1 ? "s" : ""}{" "}
                      overdue
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="pt-0 pl-10">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-muted-foreground">
                        {notification.type === "invoice" ? "Invoice #" : "Memo #"}
                      </span>
                      <p className="font-mono">{notification.documentNumber}</p>
                    </div>
                    <div>
                      <span className="font-medium text-muted-foreground">
                        {notification.type === "invoice" ? "Total Amount Due" : "Memo Issue Date"}
                      </span>
                      <p className="font-semibold">
                        {notification.type === "invoice"
                          ? formatCurrency(notification.amount)
                          : new Date(notification.issueDate).toLocaleDateString()}
                      </p>
                    </div>
                    {notification.type === "memo" && (
                      <>
                        <div className="md:col-span-2">
                          <span className="font-medium text-muted-foreground">Stone Summary</span>
                          <p className="text-sm mt-1 p-2 bg-gray-50 rounded border">
                            {notification.stoneSummary || "—"}
                          </p>
                        </div>
                        <div>
                          <span className="font-medium text-muted-foreground">Days Since Expired</span>
                          <p>{notification.daysOverdue}</p>
                        </div>
                      </>
                    )}
                  </div>

                  <div className="mt-4 pt-4 border-t flex flex-wrap justify-between items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onSessionDismiss(notification.id)}
                      className="flex items-center gap-2"
                    >
                      <X className="h-3 w-3" />
                      Dismiss for Session
                    </Button>

                    {user?.role === "admin" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePermanentDismiss(notification)}
                        disabled={permanentlyDismissing.has(notification.id)}
                        className="flex items-center gap-2 bg-red-50 hover:bg-red-100 border-red-300 text-red-700"
                      >
                        {permanentlyDismissing.has(notification.id) ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <ShieldX className="h-3 w-3" />
                        )}
                        {notification.type === "invoice"
                          ? "Mark Payment Received"
                          : "Mark Memo Returned"}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <div className="p-6 border-t bg-gray-50">
          <div className="flex items-center justify-between gap-4">
            <div className="text-sm text-muted-foreground">
              <p>
                <strong>Note:</strong> Session dismiss hides alerts until your next login.
              </p>
              {user?.role === "admin" && (
                <p>Admins can permanently dismiss by marking payment received or memo returned.</p>
              )}
            </div>
            <Button onClick={onClose}>Close</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
