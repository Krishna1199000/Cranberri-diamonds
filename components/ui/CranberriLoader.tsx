"use client";

import Image from 'next/image';

export function CranberriLoader() {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white bg-opacity-90 dark:bg-gray-900 dark:bg-opacity-90">
      <div className="animate-pulse">
         {/* Using the provided logo path */}
        <Image 
            src="/IMG_8981[1].png" // Updated path
            alt="Cranberri Diamond Loading..."
            width={80} // Adjust size as needed
            height={80} // Adjust size as needed
            priority // Load the logo faster
        />
      </div>
    </div>
  );
} 