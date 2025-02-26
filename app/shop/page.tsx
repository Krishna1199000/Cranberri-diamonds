"use client"
import { Suspense, useState, useEffect } from "react"
import { DiamondList } from "@/components/diamond-list"
import { Diamond } from "lucide-react"
import { LoadingCards } from "@/components/loading"
import PaginationHandler from "@/components/PaginationHandler"

const ITEMS_PER_PAGE = 12

async function getDiamonds(page: number = 1) {
  try {
    const response = await fetch("https://kyrahapi.azurewebsites.net/api", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        USERNAME: "CRANBERRI",
        PASSWORD: "CRADIA@123",
      }),
      next: { revalidate: 300 },
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const result = await response.json()
    if (!result.success) {
      throw new Error(result.message || "Failed to fetch diamonds")
    }

    if (!Array.isArray(result.data)) {
      throw new Error("Invalid data format received from server")
    }

    const totalItems = result.data.length
    const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE)
    const startIndex = (page - 1) * ITEMS_PER_PAGE
    const endIndex = startIndex + ITEMS_PER_PAGE

    return {
      diamonds: result.data.slice(startIndex, endIndex),
      pagination: { currentPage: page, totalPages, totalItems },
      error: "",
    }
  } catch (error) {
    console.error("Error fetching diamonds:", error)
    return {
      diamonds: [],
      pagination: { currentPage: page, totalPages: 1, totalItems: 0 },
      error: error instanceof Error ? error.message : "An unknown error occurred",
    }
  }
}

export default function ShopPage() {
  const [currentPage, setCurrentPage] = useState(1)
  const [data, setData] = useState({ diamonds: [], pagination: { currentPage: 1, totalPages: 1, totalItems: 0 }, error: "" })

  useEffect(() => {
    async function fetchData() {
      const result = await getDiamonds(currentPage)
      setData(result)
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

        {/* Pagination Handler for fetching page number from URL */}
        <PaginationHandler onPageChange={setCurrentPage} />

        <Suspense fallback={<LoadingCards />}>
          {data.error ? (
            <div className="text-center p-8">
              <p className="text-destructive text-lg">Error: {data.error}</p>
              <p className="text-muted-foreground mt-2">Please try again later</p>
            </div>
          ) : (
            <DiamondList diamonds={data.diamonds} pagination={data.pagination} currentPage={currentPage} />
          )}
        </Suspense>
      </div>
    </div>
  )
}
