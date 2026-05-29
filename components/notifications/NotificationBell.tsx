"use client";

import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNotifications } from "./NotificationProvider";

export function NotificationBell() {
  const { visibleCount, visibleNotifications, showNotifications } = useNotifications();

  const hasHighPriority = visibleNotifications.some((n) => n.priority === "high");

  return (
    <Button
      variant="outline"
      size="sm"
      className={`relative ${hasHighPriority ? "border-red-300 text-red-600" : ""}`}
      onClick={showNotifications}
      aria-label="View overdue notifications"
    >
      <Bell className="h-4 w-4" />
      {visibleCount > 0 && (
        <Badge
          variant="destructive"
          className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
        >
          {visibleCount > 9 ? "9+" : visibleCount}
        </Badge>
      )}
    </Button>
  );
}
