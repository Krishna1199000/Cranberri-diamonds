"use client"

import { Suspense, useState, useEffect } from "react"
import { DiamondList } from "@/components/diamond-list"
import { Diamond } from "lucide-react"
import { LoadingCards } from "@/components/loading"
import PaginationHandler from "@/components/PaginationHandler"



export default function ShopPage() {
  const [currentPage, setCurrentPage] = useState(1)
  const [data, setData] = useState({
    diamonds: [],
    pagination: { currentPage: 1, totalPages: 1, totalItems: 0 },
    error: ""
  })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true)
      try {
        const response = await fetch(`/api/diamonds?page=${currentPage}`)
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        
        const result = await response.json()
        setData({
          diamonds: result.diamonds,
          pagination: result.pagination,
          error: ""
        })
      } catch (error) {
        console.error("Error fetching diamonds:", error)
        setData({
          diamonds: [],
          pagination: { currentPage, totalPages: 1, totalItems: 0 },
          error: error instanceof Error ? error.message : "An unknown error occurred"
        })
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchData()
  }, [currentPage])

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-bold flex items-center gap-2 animate-float">
            <Diamond className="h-8 w-8 text-primary animate-sparkle" />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/70">
              Diamond Collection
            </span>
          </h1>
        </div>

        {/* ✅ Wrap PaginationHandler inside Suspense */}
        <Suspense fallback={null}>
          <PaginationHandler onPageChange={setCurrentPage} />
        </Suspense>

        <Suspense fallback={<LoadingCards />}>
          {isLoading ? (
            <LoadingCards />
          ) : data.error ? (
            <div className="text-center p-8">
              <p className="text-destructive text-lg">Error: {data.error}</p>
              <p className="text-muted-foreground mt-2">Please try again later</p>
            </div>
          ) : (
            <DiamondList 
              diamonds={data.diamonds} 
              pagination={data.pagination} 
              currentPage={currentPage} 
            />
          )}
        </Suspense>
      </div>
    </div>
  )
}