import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

function LoadingCard() {
  return (
    <Card className="overflow-hidden diamond-card">
      <CardContent className="p-6">
        <div className="shimmer w-full h-full absolute inset-0"></div>
        <div className="flex justify-between items-start mb-4">
          <div className="space-y-2">
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-4 w-32" />
          </div>
          <div className="text-right space-y-2">
            <Skeleton className="h-8 w-20 ml-auto" />
            <Skeleton className="h-4 w-24 ml-auto" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-20 ml-2" />
              </div>
            ))}
          </div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-16 ml-2" />
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-3 mt-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-32 ml-2" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

export function LoadingCards() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-6">
      {Array(6).fill(0).map((_, i) => (
        <LoadingCard key={i} />
      ))}
    </div>
  )
}