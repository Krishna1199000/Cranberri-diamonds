"use client";

import { useState, useEffect } from 'react';
import { User, Settings, Key, Bell } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ForgotPasswordDialog } from './ForgotPasswordDialog';
import { NotificationDropdown } from './NotificationDropdown';

interface UserProfileDropdownProps {
  userName: string;
  userRole?: string;
}

export function UserProfileDropdown({ userName, userRole }: UserProfileDropdownProps) {
  const [isUpdateOpen, setIsUpdateOpen] = useState(false);
  const [isPasswordOpen, setIsPasswordOpen] = useState(false);
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [newName, setNewName] = useState(userName);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Fetch unread notification count (admin only)
  useEffect(() => {
    if (userRole !== 'admin') return;

    const fetchUnreadCount = async () => {
      try {
        const response = await fetch('/api/notifications');
        const data = await response.json();
        
        if (response.ok) {
          const now = new Date();
          const dueNotifications = data.notifications.filter((notif: Record<string, unknown>) => {
            if (notif.dueDate && typeof notif.dueDate === 'string') {
              return new Date(notif.dueDate) <= now && !notif.read;
            }
            return !notif.read;
          });
          setUnreadCount(dueNotifications.length);
        }
      } catch (error) {
        console.error('Error fetching notification count:', error);
      }
    };

    fetchUnreadCount();
    // Poll for new notifications every minute
    const interval = setInterval(fetchUnreadCount, 60000);
    return () => clearInterval(interval);
  }, [userRole]);

  const handleUpdateProfile = async () => {
    try {
      setIsLoading(true);
      setError('');
      const response = await fetch('/api/auth/me', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: newName }),
      });

      if (response.ok) {
        setIsUpdateOpen(false);
        window.location.reload();
      } else {
        const data = await response.text();
        setError(data || 'Failed to update profile');
      }
    } catch  {
      setError('An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordUpdate = async () => {
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      setIsLoading(true);
      setError('');
      const response = await fetch('/api/auth/password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ oldPassword, newPassword }),
      });

      if (response.ok) {
        setIsPasswordOpen(false);
        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setError('');
      } else {
        const data = await response.text();
        setError(data || 'Invalid old password');
      }
    } catch {
      setError('An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="flex items-center gap-3">
        {/* Notification Bell - Admin Only */}
        {userRole === 'admin' && (
          <div className="relative">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsNotificationOpen(!isNotificationOpen)}
              className="relative"
            >
              <Bell className="h-4 w-4" />
              {unreadCount > 0 && (
                <Badge
                  variant="destructive"
                  className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
                >
                  {unreadCount > 9 ? '9+' : unreadCount}
                </Badge>
              )}
            </Button>
            
            <NotificationDropdown
              isOpen={isNotificationOpen}
              onClose={() => setIsNotificationOpen(false)}
            />
          </div>
        )}

        {/* User Profile Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="flex items-center gap-2">
              <User className="h-5 w-5" />
              <span>{userName}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setIsUpdateOpen(true)}>
              <Settings className="mr-2 h-4 w-4" />
              Update Profile
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setIsPasswordOpen(true)}>
              <Key className="mr-2 h-4 w-4" />
              Change Password
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <Dialog open={isUpdateOpen} onOpenChange={setIsUpdateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Profile</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
              />
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <Button 
              onClick={handleUpdateProfile} 
              disabled={isLoading}
            >
              {isLoading ? 'Updating...' : 'Update'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isPasswordOpen} onOpenChange={setIsPasswordOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Password</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="oldPassword">Current Password</Label>
              <Input
                id="oldPassword"
                type="password"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="newPassword">New Password</Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <div className="flex justify-between">
              <Button 
                onClick={handlePasswordUpdate}
                disabled={isLoading}
              >
                {isLoading ? 'Updating...' : 'Update Password'}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  setIsPasswordOpen(false);
                  setIsForgotPasswordOpen(true);
                }}
                disabled={isLoading}
              >
                Forgot Password?
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <ForgotPasswordDialog
        isOpen={isForgotPasswordOpen}
        onClose={() => setIsForgotPasswordOpen(false)}
      />
    </>
  );
}