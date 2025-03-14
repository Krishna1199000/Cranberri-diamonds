"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Diamond } from 'lucide-react';

export function Navbar() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);

  const navItems = [
    { label: 'Home', href: '/' },
    { label: 'Stone Inventory', href: '/shop' },
    { label: 'Search Stone', href: '/shop/search' },
    { label: 'Customer/Vendor', href: '/dashboard' },
    { label: 'Roles', href: '/admin/users' },
    { label: 'Sync-diamonds', href: '/sync' },
    {}
  ];

  return (
    <nav className="bg-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="flex items-center space-x-2"
            >
              <Diamond className="h-8 w-8 text-blue-600" />
              <span className="text-xl font-bold">Admin</span>
            </motion.div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-4">
            {navItems.map((item) => (
              <motion.button
                key={item.href}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-4 py-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
                onClick={() => item.href && router.push(item.href)}
              >
                {item.label}
              </motion.button>
            ))}
            <div className="h-6 w-px bg-gray-300 mx-2" />
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
              onClick={() => router.push('/auth/signout')}
            >
              Sign Out
            </motion.button>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 rounded-lg text-gray-700 hover:bg-gray-100"
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </motion.button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden"
          >
            <div className="px-4 pt-2 pb-3 space-y-1">
              {navItems.map((item) => (
                <motion.button
                  key={item.href}
                  whileTap={{ scale: 0.95 }}
                  className="block w-full text-left px-4 py-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
                  onClick={() => {
                    if (item.href) {
                      router.push(item.href);
                      setIsOpen(false);
                    }
                  }}
                >
                  {item.label}
                </motion.button>
              ))}
              <motion.button
                whileTap={{ scale: 0.95 }}
                className="block w-full text-left px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                onClick={() => {
                  router.push('/auth/signout');
                  setIsOpen(false);
                }}
              >
                Sign Out
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}