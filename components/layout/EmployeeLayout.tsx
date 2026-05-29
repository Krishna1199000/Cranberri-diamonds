"use client";

import { useState, useEffect, ReactNode } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { Menu, Home, Search, Package, DollarSign, Box, LogOut, FileText, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';
import { UserProfileDropdown } from '@/components/UserProfileDropdown';
import { NotificationProvider } from '@/components/notifications/NotificationProvider';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import clsx from 'clsx';
import { CranberriLoader } from '../ui/CranberriLoader';

interface EmployeeLayoutProps {
  children: ReactNode;
}

const navItems = [
  { label: 'Home', icon: Home, href: '/' },
  { label: 'Search Diamond', icon: Search, href: '/employee' },
  { 
    label: 'Sales & Performance', 
    icon: DollarSign, 
    href: '/employee/sales',
    subItems: [
      { label: 'Sales Dashboard', href: '/employee/sales' },
      { label: 'Analytics', href: '/employee/analytics' },
      { label: 'Requirements', href: '/employee/requirements' },
      { label: 'Performance', href: '/employee/performance' },
    ]
  },
  { 
    label: 'Inventory & Products', 
    icon: Box, 
    href: '/employee/inventory',
    subItems: [
      { label: 'Inventory', href: '/employee/inventory' },
      { label: 'Parcel Goods', href: '/parcel-goods' },
    ]
  },
  { label: 'Cust-Vendor', icon: Package, href: '/dashboard' },
  { 
    label: 'Invoices & Memos', 
    icon: FileText, 
    href: '/invoices',
    subItems: [
      { label: 'Invoices', href: '/invoices' },
      { label: 'Memos', href: '/memos' },
      { label: 'Cart', href: '/cart' },
    ]
  },
];

export function EmployeeLayout({ children }: EmployeeLayoutProps) {
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
          if (user.role !== 'employee') {
             toast.error("Access Denied: Employee role required.");
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
    <NotificationProvider>
    <div className="flex flex-col min-h-screen bg-gray-100 dark:bg-gray-900">
      {/* Horizontal Header Navigation */}
      <header className="sticky top-0 z-50 w-full bg-white dark:bg-gray-800 shadow-md print:hidden">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          {/* Logo/Title */}
          <div className="flex items-center mr-8">
            <Link href="/employee" className="flex items-center space-x-2 text-lg font-bold text-gray-800 dark:text-white">
              <span>Employee Panel</span>
            </Link>
          </div>

          {/* Desktop Navigation Links - Centered and spaced */}
          <nav className="hidden md:flex flex-1 justify-center items-center space-x-6">
            {navItems.map((item) => {
              // For items with subItems, only check subItems for active state
              // For items without subItems, only check exact match
              let isActive = false;
              if (item.subItems) {
                // Only active if a subItem matches
                isActive = item.subItems.some(sub => 
                  pathname === sub.href || pathname.startsWith(sub.href + '/')
                );
              } else {
                // For items without subItems, only exact match (no sub-paths)
                isActive = pathname === item.href;
              }
              
              if (item.subItems) {
                return (
                  <DropdownMenu key={item.label}>
                    <DropdownMenuTrigger asChild>
                      <button
                        className={clsx(
                          "flex items-center space-x-1 text-sm font-medium transition-colors whitespace-nowrap",
                          isActive
                            ? "text-primary dark:text-primary-foreground font-semibold"
                            : "text-foreground/70 dark:text-foreground/70 hover:text-primary dark:hover:text-primary-foreground"
                        )}
                      >
                        <item.icon className={clsx("h-4 w-4", isActive ? "text-primary dark:text-primary-foreground" : "text-foreground/70 dark:text-foreground/70")}/>
                        <span>{item.label}</span>
                        <ChevronDown className="h-3 w-3 ml-1" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="center">
                      {item.subItems.map((subItem) => {
                        const isSubActive = pathname === subItem.href || pathname.startsWith(subItem.href + '/');
                        return (
                          <DropdownMenuItem key={subItem.label} asChild>
                            <Link 
                              href={subItem.href}
                              className={clsx(
                                isSubActive && "bg-primary/10 text-primary"
                              )}
                            >
                              {subItem.label}
                            </Link>
                          </DropdownMenuItem>
                        );
                      })}
                    </DropdownMenuContent>
                  </DropdownMenu>
                );
              }
              
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className={clsx(
                    "flex items-center space-x-1 text-sm font-medium transition-colors whitespace-nowrap",
                    isActive
                      ? "text-primary dark:text-primary-foreground font-semibold"
                      : "text-foreground/70 dark:text-foreground/70 hover:text-primary dark:hover:text-primary-foreground"
                  )}
                >
                  <item.icon className={clsx("h-4 w-4", isActive ? "text-primary dark:text-primary-foreground" : "text-foreground/70 dark:text-foreground/70")}/>
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Profile/Logout - Right aligned */}
          <div className="flex items-center space-x-4 ml-8">
            <UserProfileDropdown userName={userName} userRole="employee" />
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
                    // For items with subItems, only check subItems for active state
                    // For items without subItems, only check exact match
                    let isActive = false;
                    if (item.subItems) {
                      // Only active if a subItem matches
                      isActive = item.subItems.some(sub => 
                        pathname === sub.href || pathname.startsWith(sub.href + '/')
                      );
                    } else {
                      // For items without subItems, only exact match (no sub-paths)
                      isActive = pathname === item.href;
                    }
                    
                    if (item.subItems) {
                      return (
                        <div key={item.label}>
                          <div className={clsx(
                            "px-2 py-1.5 text-sm font-semibold",
                            isActive && "text-primary"
                          )}>
                            {item.label}
                          </div>
                          {item.subItems.map((subItem) => {
                            const isSubActive = pathname === subItem.href || pathname.startsWith(subItem.href + '/');
                            return (
                              <DropdownMenuItem key={subItem.label} asChild>
                                <Link href={subItem.href} className={clsx(
                                    "flex items-center space-x-2 pl-6", 
                                    isSubActive 
                                        ? "text-primary dark:text-primary-foreground font-semibold" 
                                        : "text-foreground/80 dark:text-foreground/80"
                                    )}
                                >
                                  <span>{subItem.label}</span>
                                </Link>
                              </DropdownMenuItem>
                            );
                          })}
                        </div>
                      );
                    }
                    
                    return (
                      <DropdownMenuItem key={item.label} asChild>
                        <Link href={item.href} className={clsx(
                            "flex items-center space-x-2", 
                            isActive 
                                ? "text-primary dark:text-primary-foreground font-semibold" 
                                : "text-foreground/80 dark:text-foreground/80"
                            )}
                        >
                          <item.icon className={clsx("h-4 w-4", isActive ? "text-primary dark:text-primary-foreground" : "text-foreground/80 dark:text-foreground/80")} />
                          <span>{item.label}</span>
                        </Link>
                      </DropdownMenuItem>
                    );
                 })}
                 <DropdownMenuItem onSelect={handleLogout} className="focus:text-red-600 flex items-center space-x-2 text-destructive">
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

       {/* Footer (Optional) */}
       {/* <footer className="bg-gray-200 dark:bg-gray-700 p-4 text-center text-sm text-gray-600 dark:text-gray-400">
           © {new Date().getFullYear()} Cranberri Diamond
       </footer> */}
    </div>
    </NotificationProvider>
  );
} 