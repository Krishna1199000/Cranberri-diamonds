"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Lock, Shield } from 'lucide-react';
import { toast } from 'sonner';

interface PasswordGateProps {
  children: React.ReactNode;
  title: string;
  description: string;
  endpoint: string; // API endpoint to verify password
  sessionKey: string; // Session storage key for unlock status
}

export function PasswordGate({ children, title, description, endpoint, sessionKey }: PasswordGateProps) {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [password, setPassword] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  // Check if already unlocked in session
  useEffect(() => {
    const unlocked = sessionStorage.getItem(sessionKey);
    if (unlocked === 'true') {
      setIsUnlocked(true);
    }
  }, [sessionKey]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsVerifying(true);

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password }),
      });

      if (response.ok) {
        sessionStorage.setItem(sessionKey, 'true');
        setIsUnlocked(true);
        toast.success('Access granted');
      } else {
        toast.error('Invalid password');
        setPassword('');
      }
    } catch (error) {
      console.error('Password verification error:', error);
      toast.error('Verification failed');
    } finally {
      setIsVerifying(false);
    }
  };

  if (isUnlocked) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-white">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-black rounded-full flex items-center justify-center mb-4">
            <Shield className="h-6 w-6 text-white" />
          </div>
          <CardTitle className="text-black">{title}</CardTitle>
          <CardDescription className="text-gray-600">
            {description}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter access password"
                className="pl-9 border-gray-300 focus:border-black focus:ring-black"
                required
              />
            </div>
            <Button
              type="submit"
              disabled={isVerifying || !password.trim()}
              className="w-full bg-black text-white hover:bg-gray-800"
            >
              {isVerifying ? 'Verifying...' : 'Unlock Access'}
            </Button>
          </form>
          <p className="text-xs text-gray-500 text-center mt-4">
            This section requires special authorization to access sensitive data.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}



