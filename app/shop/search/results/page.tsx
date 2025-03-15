"use client"

import { Suspense } from "react";
import SearchResultsContent from "./SearchResultsContent";

export default function SearchResults() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <div className="text-lg">Loading diamonds...</div>
      </div>
    }>
      <SearchResultsContent />
    </Suspense>
  );
}