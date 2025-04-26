"use client";

import { motion } from 'framer-motion';
import { DiamondSearch } from '@/components/DiamondSearch/index';
import { EmployeeLayout } from '@/components/layout/EmployeeLayout';

export default function EmployeeDashboard() {
  return (
    <EmployeeLayout>
      <main className="max-w-7xl mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {/* Content previously inside the main tag can go here if needed, or remain below */}
        </motion.div>

        {/* Diamond Search Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-8"
        >
          <h2 className="text-2xl font-bold mb-6">Diamond Search</h2>
          <DiamondSearch />
        </motion.div>
      </main>
    </EmployeeLayout>
  );
}