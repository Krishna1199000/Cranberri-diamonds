"use client";

import { Navbar } from '@/components/Navbar/index';
import { DiamondSearch } from '@/components/DiamondSearch';

export default function SearchPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <DiamondSearch />
      </div>
    </div>
  );
}