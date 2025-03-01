"use client"

import { useSearchParams } from "next/navigation"
import { useEffect } from "react"

export default function PaginationHandler({ onPageChange }: { onPageChange: (page: number) => void }) {
  const searchParams = useSearchParams()
  const page = parseInt(searchParams.get("page") || "1", 10) || 1


  useEffect(() => {
    onPageChange(page)
  }, [page, onPageChange])

  return null 
}
