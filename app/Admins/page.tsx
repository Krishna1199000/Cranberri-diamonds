"use client";

import { motion } from 'framer-motion';
import { DiamondSearch } from '@/components/DiamondSearch/index';
import { AdminLayout } from '@/components/layout/AdminLayout';

export default function AdminDashboard() {
  return (
    <AdminLayout>
      <main className="w-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {/* Add any admin-specific cards or content here */}
          {/* Example: <StatCard title="Total Users" value="150" /> */}
        </motion.div>

        {/* Diamond Search Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-8 bg-white dark:bg-gray-800 p-6 rounded-lg shadow"
        >
          <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-gray-100">Diamond Search</h2>
          <DiamondSearch />
        </motion.div>
      </main>
    </AdminLayout>
  );
}