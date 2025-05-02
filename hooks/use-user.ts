"use client";

import { useState, useEffect } from 'react';

interface User {
  id: string;
  name?: string;
  email?: string;
  role: 'admin' | 'employee' | 'customer';
}

export function useUser() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      setIsLoading(true);
      try {
        const res = await fetch('/api/auth/me', {
          credentials: 'include',
        });
        
        if (!res.ok) {
          throw new Error('Failed to fetch user');
        }
        
        const userData = await res.json();
        setUser(userData);
      } catch (err) {
        console.error('Error fetching user:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch user');
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUser();
  }, []);

  return { user, isLoading, error };
}