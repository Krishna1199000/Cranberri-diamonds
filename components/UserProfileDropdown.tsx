"use client";

import { useState } from 'react';
import { User, Settings, Key } from 'lucide-react';
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

interface UserProfileDropdownProps {
  userName: string;
}

export function UserProfileDropdown({ userName }: UserProfileDropdownProps) {
  const [isUpdateOpen, setIsUpdateOpen] = useState(false);
  const [isPasswordOpen, setIsPasswordOpen] = useState(false);
  const [isOtpOpen, setIsOtpOpen] = useState(false);
  const [newName, setNewName] = useState(userName);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');

  const handleUpdateProfile = async () => {
    try {
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
        setError('Failed to update profile');
      }
    } catch {
      setError('An error occurred');
    }
  };

  const handlePasswordUpdate = async () => {
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      const response = await fetch('/api/auth/password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ oldPassword, newPassword }),
      });

      if (response.ok) {
        setIsPasswordOpen(false);
        setError('');
      } else {
        setError('Invalid old password');
      }
    } catch {
      setError('An error occurred');
    }
  };

  const handleForgotPassword = async () => {
    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
      });

      if (response.ok) {
        setIsPasswordOpen(false);
        setIsOtpOpen(true);
      }
    } catch {
      setError('Failed to send OTP');
    }
  };

  const verifyOtp = async () => {
    try {
      const response = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ otp, newPassword, confirmPassword }),
      });

      if (response.ok) {
        setIsOtpOpen(false);
        setError('');
      } else {
        setError('Invalid OTP');
      }
    } catch {
      setError('An error occurred');
    }
  };

  return (
    <>
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
            <Button onClick={handleUpdateProfile}>Update</Button>
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
              <Button onClick={handlePasswordUpdate}>Update Password</Button>
              <Button variant="outline" onClick={handleForgotPassword}>
                Forgot Password?
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isOtpOpen} onOpenChange={setIsOtpOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enter OTP</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="otp">OTP</Label>
              <Input
                id="otp"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="newPasswordOtp">New Password</Label>
              <Input
                id="newPasswordOtp"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="confirmPasswordOtp">Confirm Password</Label>
              <Input
                id="confirmPasswordOtp"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <Button onClick={verifyOtp}>Verify OTP</Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}