import React from 'react';
import Image from 'next/image';

export function LoadingSpinner() {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-white bg-opacity-80 z-50">
      <div className="text-center">
        <div className="relative w-32 h-32 mb-4">
          <Image
            src="/logo.png"
            alt="Cranberri Diamonds"
            width={128}
            height={128}
            className="animate-pulse"
          />
          <div className="absolute inset-0 border-t-4 border-blue-500 rounded-full animate-spin"></div>
        </div>
        <p className="text-lg font-semibold text-gray-700">Loading...</p>
      </div>
    </div>
  );
}