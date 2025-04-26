"use client";

import { useState, useEffect, ReactNode } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Menu, Home, Search, Package, LogOut } from 'lucide-react'; // Adjusted icons
import { toast } from 'sonner';
import { UserProfileDropdown } from '@/components/UserProfileDropdown';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import clsx from 'clsx';
import { CranberriLoader } from '../ui/CranberriLoader'; // Import the loader

interface CustomerLayoutProps {
  children: ReactNode;
}

// Customer-specific navigation items
const navItems = [
  { label: 'Home', icon: Home, href: '/' },
  { label: 'Search Diamond', icon: Search, href: '/Customer' },
  { label: 'Parcel-Goods', icon: Package, href: '/parcel-goods' }, // Assuming customers can see this
];

export function CustomerLayout({ children }: CustomerLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [userName, setUserName] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      setIsLoading(true);
      try {
        const response = await fetch('/api/auth/me', { credentials: 'include' });
        if (response.ok) {
          const user = await response.json();
          // Role check for Customer
          if (user.role !== 'customer') {
            toast.error("Access Denied: Customer role required.");
            router.push('/auth/signin');
            return;
          }
          setUserName(user.name);
        } else {
          toast.error("Authentication required. Please sign in.");
          router.push('/auth/signin');
        }
      } catch (error) {
        console.error('Error fetching user:', error);
        toast.error("Failed to verify user session.");
        router.push('/auth/signin');
      } finally {
        setIsLoading(false);
      }
    };
    fetchUser();
  }, [router]);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
      toast.success("Logged out successfully.");
      router.push('/auth/signin');
    } catch (error) {
      console.error('Logout error:', error);
      toast.error("Logout failed.");
    }
  };

  if (isLoading) {
    return <CranberriLoader />;
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-100 dark:bg-gray-900">
      {/* Horizontal Header Navigation */}
      <header className="sticky top-0 z-50 w-full bg-white dark:bg-gray-800 shadow-md">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          {/* Logo/Title */}
          <Link href="/Customer" className="flex items-center space-x-2 text-lg font-bold text-gray-800 dark:text-white">
            {/* Optional: Add Customer specific logo/icon */}
            <span>Customer Portal</span>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center space-x-4 lg:space-x-6">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className={clsx(
                    "flex items-center space-x-1 text-sm font-medium transition-colors",
                    isActive
                      ? "text-blue-600 dark:text-blue-400"
                      : "text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400"
                  )}
                >
                  <item.icon className={clsx("h-4 w-4", isActive ? "text-blue-600 dark:text-blue-400" : "")}/>
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center space-x-4">
            {/* User Profile Dropdown */}
            <UserProfileDropdown userName={userName} />

            {/* Logout Button (Desktop) */}
            <Button
                variant="outline"
                size="sm"
                className="hidden md:flex items-center space-x-2 text-gray-600 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400"
                onClick={handleLogout}
            >
                <LogOut className="h-4 w-4" />
                <span>Logout</span>
            </Button>

            {/* Mobile Navigation Menu Trigger */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" className="md:hidden">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Toggle Menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                      <DropdownMenuItem key={item.label} asChild>
                        <Link href={item.href} className={clsx("flex items-center space-x-2", isActive ? "text-blue-600 dark:text-blue-400 font-semibold" : "")}>
                          <item.icon className={clsx("h-4 w-4", isActive ? "text-blue-600 dark:text-blue-400" : "")} />
                          <span>{item.label}</span>
                        </Link>
                      </DropdownMenuItem>
                    );
                 })}
                 <DropdownMenuItem onSelect={handleLogout} className="text-red-600 focus:text-red-600 flex items-center space-x-2">
                     <LogOut className="h-4 w-4" />
                     <span>Logout</span>
                 </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 container mx-auto p-4 md:p-6 lg:p-8">
        {children}
      </main>

    </div>
  );
} 