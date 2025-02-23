"use client"

import { useSearchParams } from "next/navigation"

export default function PaginationHandler({ onPageChange }: { onPageChange: (page: number) => void }) {
  const searchParams = useSearchParams()
  const page = parseInt(searchParams.get("page") || "1", 10) || 1

  // Pass the page number to the parent component
  onPageChange(page)

  return null // This component does not render anything
}
