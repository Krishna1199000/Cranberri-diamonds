"use client";

import { useState, useEffect } from 'react';
import { Bell, Check, Clock, X, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { formatDistanceToNow } from "date-fns/formatDistanceToNow";

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  dueDate?: string;
  createdAt: string;
  invoice?: {
    invoiceNo: string;
    companyName: string;
    totalAmount: number;
  };
}

interface NotificationDropdownProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NotificationDropdown({ isOpen, onClose }: NotificationDropdownProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [markingAsRead, setMarkingAsRead] = useState<string | null>(null);
  const [deletingNotification, setDeletingNotification] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
      checkUserRole();
    }
  }, [isOpen]);

  const checkUserRole = async () => {
    try {
      const response = await fetch('/api/auth/me', { credentials: 'include' });
      if (response.ok) {
        const user = await response.json();
        setIsAdmin(user.role === 'admin');
      }
    } catch (error) {
      console.error('Error checking user role:', error);
    }
  };

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/notifications');
      const data = await response.json();
      
      if (response.ok) {
        // Only show notifications that are actually due (dueDate <= now)
        const now = new Date();
        const filteredNotifications = data.notifications.filter((notif: Notification) => {
          // If notification has a dueDate, only show it if it's due
          if (notif.dueDate) {
            return new Date(notif.dueDate) <= now;
          }
          // If no dueDate, show it (for system notifications without timing)
          return true;
        });
        setNotifications(filteredNotifications);
      } else {
        throw new Error(data.error || 'Failed to fetch notifications');
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    if (markingAsRead) return;

    setMarkingAsRead(notificationId);
    try {
      const response = await fetch('/api/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ notificationId }),
      });

      if (response.ok) {
        setNotifications(prev =>
          prev.map(notif =>
            notif.id === notificationId ? { ...notif, read: true } : notif
          )
        );
        toast.success('Notification marked as read');
      } else {
        throw new Error('Failed to mark notification as read');
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
      toast.error('Failed to mark notification as read');
    } finally {
      setMarkingAsRead(null);
    }
  };

  const deleteNotification = async (notificationId: string) => {
    if (!isAdmin || deletingNotification) return;

    if (!confirm('Are you sure you want to delete this notification? This action cannot be undone.')) {
      return;
    }

    setDeletingNotification(notificationId);
    try {
      const response = await fetch('/api/notifications', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ notificationId }),
      });

      if (response.ok) {
        setNotifications(prev => prev.filter(notif => notif.id !== notificationId));
        toast.success('Notification deleted successfully');
      } else {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete notification');
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to delete notification');
    } finally {
      setDeletingNotification(null);
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  if (!isOpen) return null;

  return (
    <div className="absolute top-full right-0 mt-2 w-96 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-96 overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Notifications</CardTitle>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <Badge variant="destructive" className="text-xs">
                {unreadCount} new
              </Badge>
            )}
            <Button variant="outline" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        {loading ? (
          <div className="p-4 text-center text-gray-500">Loading notifications...</div>
        ) : notifications.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            <Bell className="h-8 w-8 mx-auto mb-2 text-gray-300" />
            No notifications
          </div>
        ) : (
          <div className="max-h-80 overflow-y-auto">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                  !notification.read ? 'bg-blue-50' : ''
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {notification.type === 'payment_reminder' && (
                        <Clock className="h-4 w-4 text-orange-500 flex-shrink-0" />
                      )}
                      <h4 className="font-medium text-sm truncate">{notification.title}</h4>
                      {!notification.read && (
                        <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" />
                      )}
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-2">{notification.message}</p>
                    
                    {notification.invoice && (
                      <div className="text-xs text-gray-500 mb-2">
                        <div>Invoice: {notification.invoice.invoiceNo}</div>
                        <div>Amount: ₹{notification.invoice.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
                      </div>
                    )}
                    
                    <div className="text-xs text-gray-400">
                      {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1 flex-shrink-0">
                  {!notification.read && (
                    <Button
                        variant="outline"
                      size="sm"
                      onClick={() => markAsRead(notification.id)}
                      disabled={markingAsRead === notification.id}
                        title="Mark as read"
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                  )}
                    
                    {isAdmin && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteNotification(notification.id)}
                        disabled={deletingNotification === notification.id}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        title="Delete notification (Admin only)"
                      >
                        {deletingNotification === notification.id ? (
                          <Clock className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </div>
  );
} 