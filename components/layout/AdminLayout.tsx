"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, LogOut, Users, Database, BarChart, TrendingUp, FileText, Settings, Gauge, Package, Box } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { UserProfileDropdown } from '@/components/UserProfileDropdown';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { CranberriLoader } from '../ui/CranberriLoader';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [userName, setUserName] = useState('');
  const [isClient, setIsClient] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsClient(true);
    const fetchUser = async () => {
      try {
        const response = await fetch('/api/auth/me', { credentials: 'include' });
        if (response.ok) {
          const user = await response.json();
          setUserName(user.name || user.email || 'Admin');
        } else {
             console.error('Failed to fetch user:', response.status);
        }
      } catch (error) {
        console.error('Error fetching user:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchUser();
  }, []);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      });
      toast.success('Logged out successfully');
      router.push('/auth/signin');
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Logout failed');
    }
  };

  // Define navigation items specifically for the admin area
  const navItems = [
    { label: 'Dashboard', icon: Gauge, href: '/Admins' },
    { label: 'Sales', icon: BarChart, href: '/Admins/sales' },
    { label: 'Sales Report', icon: BarChart, href: '/Admins/sales-report' },
    { label: 'Performance', icon: TrendingUp, href: '/Admins/performance' },
    { label: 'Inventory', icon: Box, href: '/admin/inventory' },
    { label: 'Manage Users', icon: Users, href: '/admin/users' },
    { label: 'Invoices', icon: FileText, href: '/invoices' },
    { label: 'Memos', icon: FileText, href: '/memos' },
    { label: 'Sync Database', icon: Database, href: '/sync' },
    { label: 'Cust-Vendor', icon: Package, href: '/dashboard' },
    { label: 'Parcel-Goods', icon: Box, href: '/parcel-goods' },
  ];

  if (isLoading) {
    return <CranberriLoader />;
  }

  if (!isClient) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex flex-col">
      <nav className="bg-white dark:bg-gray-800 shadow-md sticky top-0 z-50 print:hidden">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/Admins" className="flex items-center gap-2 text-xl font-bold text-primary">
                 <Settings className="h-6 w-6"/>
                 <span>Admin Panel</span>
              </Link>
              <div className="ml-4 lg:hidden">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="p-2 rounded-md text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary"
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  aria-label="Toggle menu"
                >
                  {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                </motion.button>
              </div>
            </div>

            <div className="flex items-center">
              <div className="hidden lg:flex items-center space-x-1">
                {navItems.map((item) => {
                  const isActive = pathname === item.href || 
                                   (pathname.startsWith(item.href) && pathname.charAt(item.href.length) === '/');
                  return (
                    <Link key={item.label} href={item.href} passHref legacyBehavior>
                      <motion.a
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className={cn(
                          "flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-150 ease-in-out",
                          isActive
                            ? "bg-primary/10 text-primary dark:bg-primary/20"
                            : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white"
                        )}
                        aria-current={isActive ? 'page' : undefined}
                      >
                        <item.icon className={cn("h-5 w-5", isActive ? "text-primary" : "text-gray-400 dark:text-gray-500 group-hover:text-gray-500 dark:group-hover:text-gray-400")} />
                        <span>{item.label}</span>
                      </motion.a>
                    </Link>
                  );
                })}
              </div>

               <div className="hidden lg:block w-px h-6 bg-gray-200 dark:bg-gray-700 mx-4"></div>

              <div className="flex items-center space-x-3">
                 <UserProfileDropdown userName={userName} />
                 <Button
                   variant="outline"
                   size="icon"
                   className="text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 border-transparent hover:border-red-300 dark:hover:border-red-700"
                   onClick={handleLogout}
                   aria-label="Logout"
                 >
                   <LogOut className="h-5 w-5" />
                 </Button>
              </div>
            </div>
          </div>
        </div>

        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="lg:hidden border-t border-gray-200 dark:border-gray-700"
            >
              <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
                {navItems.map((item) => {
                   const isActive = pathname === item.href || 
                                    (pathname.startsWith(item.href) && pathname.charAt(item.href.length) === '/');
                  return (
                  <Link key={item.label} href={item.href} passHref legacyBehavior>
                    <a
                      className={cn(
                          "flex items-center space-x-3 px-3 py-2 rounded-md text-base font-medium transition-colors duration-150 ease-in-out",
                          isActive
                            ? "bg-primary/10 text-primary dark:bg-primary/20"
                            : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white"
                      )}
                      onClick={() => setIsMenuOpen(false)}
                      aria-current={isActive ? 'page' : undefined}
                    >
                      <item.icon className={cn("h-6 w-6", isActive ? "text-primary" : "text-gray-400 dark:text-gray-500")} />
                      <span>{item.label}</span>
                    </a>
                  </Link>
                )})}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      <main className="flex-grow max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {children}
      </main>
    </div>
  );
} 