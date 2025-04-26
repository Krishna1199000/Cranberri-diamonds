"use client";

import { motion } from 'framer-motion';
import { DiamondSearch } from '@/components/DiamondSearch';
import { CustomerLayout } from '@/components/layout/CustomerLayout';

export default function CustomerDashboard() {
  return (
    <CustomerLayout>
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Diamond Search Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h2 className="text-2xl font-bold mb-6">Diamond Search</h2>
          <DiamondSearch />
        </motion.div>
      </main>
    </CustomerLayout>
  );
}