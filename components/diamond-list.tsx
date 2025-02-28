"use client"

import { useCallback, useState } from "react"
import Image from "next/image"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Info, Video, FileText, Diamond } from "lucide-react"

interface DiamondData {
  id: string
  stockId: string
  certificateNo: string
  shape: string
  size: number
  color: string
  clarity: string
  cut: string | null
  polish: string
  sym: string
  floro: string
  lab: string
  rapPrice: number
  rapAmount: number
  discount: number
  pricePerCarat: number
  finalAmount: number
  measurement: string
  length: number | null
  width: number | null
  height: number | null
  depth: number | null
  table: number | null
  ratio: number | null
  status: string
  comment: string | null
  videoUrl: string | null
  imageUrl: string | null
  certUrl: string | null
  girdle: string | null
  culet: string | null
  cAngle: number | null
  cHeight: number | null
  pAngle: number | null
  pDepth: number | null
  fancyIntensity: string | null
  fancyOvertone: string | null
  fancyColor: string | null
  location: string | null
  inscription: string | null
  createdAt: string
  updatedAt: string
}

interface PaginationData {
  currentPage: number
  totalPages: number
  totalItems: number
}

interface DiamondListProps {
  diamonds: DiamondData[]
  pagination: PaginationData
  currentPage: number
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value)
}

const isValidUrl = (url: string | null) => {
  if (!url) return false
  // Allow all URLs
  return true
}

const getImageUrl = (url: string | null) => {
  if (!url) return ""
  // Handle d360.tech image URLs
  if (url.includes("d360.tech") && !url.includes("/still.jpg")) {
    return url.replace("view.html?d=", "imaged/") + "/still.jpg"
  }
  return url
}

const ImageWithFallback = ({ src, alt }: { src: string | null; alt: string }) => {
  const [error, setError] = useState(false)
  const [loading, setLoading] = useState(true)

  if (error || !src || !isValidUrl(src)) {
    return (
      <div className="w-[40px] h-[40px] flex items-center justify-center bg-primary/10 rounded-sm">
        <Diamond className="w-4 h-4 text-primary" />
      </div>
    )
  }

  return (
    <div className="relative w-[40px] h-[40px]">
      {loading && <div className="absolute inset-0 image-skeleton rounded-sm" />}
      <Image
        src={getImageUrl(src) || "/placeholder.svg"}
        alt={alt}
        width={40}
        height={40}
        className={`w-[40px] h-[40px] object-cover rounded-sm ${loading ? "opacity-0" : "opacity-100"} transition-opacity duration-300`}
        onLoadingComplete={() => setLoading(false)}
        onError={() => setError(true)}
      />
    </div>
  )
}

export function DiamondList({ diamonds, pagination, currentPage }: DiamondListProps) {
  const router = useRouter()

  const handlePageChange = useCallback(
    (newPage: number) => {
      router.push(`/shop?page=${newPage}`)
    },
    [router],
  )

  return (
    <TooltipProvider>
      <div>
        <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-6">
          {diamonds.map((diamond, index) => (
            <Card key={diamond.id} className="diamond-card" style={{ animationDelay: `${index * 100}ms` }}>
              <CardContent className="p-6 relative">
                <div className="absolute top-2 right-2">
                  <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
                    {diamond.status}
                  </span>
                </div>

                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-semibold text-xl text-primary">{diamond.shape}</h3>
                    <p className="text-sm text-muted-foreground">Stock ID: {diamond.stockId}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-2xl bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/70">
                      {diamond.size} ct
                    </p>
                    <p className="text-sm font-medium text-primary">{formatCurrency(diamond.finalAmount)}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="space-y-2">
                    <div>
                      <span className="text-muted-foreground">Color:</span>
                      <span className="font-medium ml-2">{diamond.color}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Clarity:</span>
                      <span className="font-medium ml-2">{diamond.clarity}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Cut:</span>
                      <span className="font-medium ml-2">{diamond.cut}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Polish:</span>
                      <span className="font-medium ml-2">{diamond.polish}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Symmetry:</span>
                      <span className="font-medium ml-2">{diamond.sym}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Girdle:</span>
                      <span className="font-medium ml-2">{diamond.girdle}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Culet:</span>
                      <span className="font-medium ml-2">{diamond.culet}</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div>
                      <span className="text-muted-foreground">Lab:</span>
                      <span className="font-medium ml-2">{diamond.lab}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Fluorescence:</span>
                      <span className="font-medium ml-2">{diamond.floro}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Table:</span>
                      <span className="font-medium ml-2">{diamond.table}%</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Depth:</span>
                      <span className="font-medium ml-2">{diamond.depth}%</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Measurements:</span>
                      <span className="font-medium ml-2">{diamond.measurement}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Crown Angle:</span>
                      <span className="font-medium ml-2">{diamond.cAngle}°</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Pavilion Angle:</span>
                      <span className="font-medium ml-2">{diamond.pAngle}°</span>
                    </div>
                  </div>
                </div>

                {(diamond.fancyIntensity || diamond.fancyOvertone || diamond.fancyColor) && (
                  <>
                    <Separator className="my-4" />
                    <div className="space-y-2">
                      {diamond.fancyIntensity && (
                        <div>
                          <span className="text-muted-foreground">Fancy Intensity:</span>
                          <span className="font-medium ml-2">{diamond.fancyIntensity}</span>
                        </div>
                      )}
                      {diamond.fancyOvertone && (
                        <div>
                          <span className="text-muted-foreground">Fancy Overtone:</span>
                          <span className="font-medium ml-2">{diamond.fancyOvertone}</span>
                        </div>
                      )}
                      {diamond.fancyColor && (
                        <div>
                          <span className="text-muted-foreground">Fancy Color:</span>
                          <span className="font-medium ml-2">{diamond.fancyColor}</span>
                        </div>
                      )}
                    </div>
                  </>
                )}

                <Separator className="my-4" />

                <div className="space-y-2">
                  <div>
                    <span className="text-muted-foreground">Certificate:</span>
                    <span className="font-medium ml-2">{diamond.certificateNo}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Location:</span>
                    <span className="font-medium ml-2">{diamond.location}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Status:</span>
                    <span className="font-medium ml-2">{diamond.status}</span>
                  </div>
                  {diamond.comment && (
                    <div>
                      <span className="text-muted-foreground">Comment:</span>
                      <span className="font-medium ml-2">{diamond.comment}</span>
                    </div>
                  )}
                  {diamond.inscription && (
                    <div>
                      <span className="text-muted-foreground">Inscription:</span>
                      <span className="font-medium ml-2">{diamond.inscription}</span>
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap gap-4 mt-4">
                  {diamond.imageUrl && isValidUrl(diamond.imageUrl) && (
                    <a
                      href={getImageUrl(diamond.imageUrl)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center px-3 py-2 rounded-md bg-primary/10 text-primary hover:bg-primary/20 transition-colors duration-200"
                    >
                      <div className="relative mr-2">
                        <ImageWithFallback
                          src={diamond.imageUrl || "/placeholder.svg"}
                          alt={`Diamond ${diamond.stockId}`}
                        />
                      </div>
                      View Image
                    </a>
                  )}
                  {diamond.videoUrl && isValidUrl(diamond.videoUrl) && (
                    <a
                      href={diamond.videoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center px-3 py-2 rounded-md bg-primary/10 text-primary hover:bg-primary/20 transition-colors duration-200"
                    >
                      <Video className="h-4 w-4 mr-2" />
                      View Video
                    </a>
                  )}
                  {diamond.certUrl && isValidUrl(diamond.certUrl) && (
                    <a
                      href={diamond.certUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center px-3 py-2 rounded-md bg-primary/10 text-primary hover:bg-primary/20 transition-colors duration-200"
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      View Certificate
                    </a>
                  )}
                </div>

                <div className="mt-4 text-sm space-y-2">
                  <div className="flex justify-between items-center p-2 rounded-md hover:bg-secondary/50 transition-colors duration-200">
                    <span>Price per carat:</span>
                    <span className="font-medium">{formatCurrency(diamond.pricePerCarat)}</span>
                  </div>
                  <div className="flex justify-between items-center p-2 rounded-md hover:bg-secondary/50 transition-colors duration-200">
                    <span className="flex items-center gap-1">
                      Rap price
                      <Tooltip>
                        <TooltipTrigger>
                          <Info className="h-3 w-3" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Rapaport Price - Industry standard diamond pricing guide</p>
                        </TooltipContent>
                      </Tooltip>
                    </span>
                    <span className="font-medium">{formatCurrency(diamond.rapPrice)}</span>
                  </div>
                  <div className="flex justify-between items-center p-2 rounded-md hover:bg-secondary/50 transition-colors duration-200">
                    <span>Rap amount:</span>
                    <span className="font-medium">{formatCurrency(diamond.rapAmount)}</span>
                  </div>
                  <div className="flex justify-between items-center p-2 rounded-md hover:bg-secondary/50 transition-colors duration-200">
                    <span>Discount:</span>
                    <span className="font-medium text-primary">{diamond.discount}%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-8 flex justify-center gap-2">
          <Button variant="outline" disabled={currentPage <= 1} onClick={() => handlePageChange(currentPage - 1)}>
            Previous
          </Button>
          <span className="px-4 py-2 bg-secondary rounded">
            Page {pagination.currentPage} of {pagination.totalPages}
          </span>
          <Button
            variant="outline"
            disabled={currentPage >= pagination.totalPages}
            onClick={() => handlePageChange(currentPage + 1)}
          >
            Next
          </Button>
        </div>
      </div>
    </TooltipProvider>
  )
}

