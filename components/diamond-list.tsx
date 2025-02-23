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
  StockID: string
  Certificate_No: string
  Shape: string
  Size: number
  Color: string
  Clarity: string
  Cut: string
  Polish: string
  Sym: string
  Floro: string
  Lab: string
  RapPrice: number
  RapAmount: number
  Discount: number
  PricePerCarat: number
  FinalAmount: number
  Measurement: string
  Length: number
  Width: number
  Height: number
  Depth: number
  Table: number
  Ratio: number
  Status: string
  Comment: string
  Video_URL: string
  Image_URL: string
  Cert_URL: string
  Girdle: string
  Culet: string
  Cangle: number
  CHeight: number
  PAngle: number
  PDepth: number
  "Fancy Intensity": string
  "Fancy Overtone": string
  "Fancy Color": string
  Location: string
  Inscription: string
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

const isValidUrl = (url: string) => {
  if (!url) return false
  // Check if URL is from allowed domains
  return url.includes('d360.tech') || url.includes('kslive.blob.core.windows.net')
}

const getImageUrl = (url: string) => {
  if (!url) return ''
  // Handle d360.tech image URLs
  if (url.includes('d360.tech') && !url.includes('/still.jpg')) {
    return url.replace('view.html?d=', 'imaged/') + '/still.jpg'
  }
  return url
}

const ImageWithFallback = ({ src, alt }: { src: string; alt: string }) => {
  const [error, setError] = useState(false)
  const [loading, setLoading] = useState(true)

  if (error || !isValidUrl(src)) {
    return (
      <div className="w-[40px] h-[40px] flex items-center justify-center bg-primary/10 rounded-sm">
        <Diamond className="w-4 h-4 text-primary" />
      </div>
    )
  }

  return (
    <div className="relative w-[40px] h-[40px]">
      {loading && (
        <div className="absolute inset-0 image-skeleton rounded-sm" />
      )}
      <Image
        src={getImageUrl(src)}
        alt={alt}
        width={40}
        height={40}
        className={`w-[40px] h-[40px] object-cover rounded-sm ${loading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
        onLoadingComplete={() => setLoading(false)}
        onError={() => setError(true)}
      />
    </div>
  )
}

export function DiamondList({ diamonds, pagination, currentPage }: DiamondListProps) {
  const router = useRouter()

  const handlePageChange = useCallback((newPage: number) => {
    router.push(`/shop?page=${newPage}`)
  }, [router])

  return (
    <TooltipProvider>
      <div>
        <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-6">
          {diamonds.map((diamond, index) => (
            <Card
              key={diamond.StockID}
              className="diamond-card"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <CardContent className="p-6 relative">
                <div className="absolute top-2 right-2">
                  <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
                    {diamond.Status}
                  </span>
                </div>

                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-semibold text-xl text-primary">{diamond.Shape}</h3>
                    <p className="text-sm text-muted-foreground">Stock ID: {diamond.StockID}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-2xl bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/70">
                      {diamond.Size} ct
                    </p>
                    <p className="text-sm font-medium text-primary">{formatCurrency(diamond.FinalAmount)}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="space-y-2">
                    <div>
                      <span className="text-muted-foreground">Color:</span>
                      <span className="font-medium ml-2">{diamond.Color}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Clarity:</span>
                      <span className="font-medium ml-2">{diamond.Clarity}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Cut:</span>
                      <span className="font-medium ml-2">{diamond.Cut}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Polish:</span>
                      <span className="font-medium ml-2">{diamond.Polish}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Symmetry:</span>
                      <span className="font-medium ml-2">{diamond.Sym}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Girdle:</span>
                      <span className="font-medium ml-2">{diamond.Girdle}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Culet:</span>
                      <span className="font-medium ml-2">{diamond.Culet}</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div>
                      <span className="text-muted-foreground">Lab:</span>
                      <span className="font-medium ml-2">{diamond.Lab}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Fluorescence:</span>
                      <span className="font-medium ml-2">{diamond.Floro}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Table:</span>
                      <span className="font-medium ml-2">{diamond.Table}%</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Depth:</span>
                      <span className="font-medium ml-2">{diamond.Depth}%</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Measurements:</span>
                      <span className="font-medium ml-2">{diamond.Measurement}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Crown Angle:</span>
                      <span className="font-medium ml-2">{diamond.Cangle}°</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Pavilion Angle:</span>
                      <span className="font-medium ml-2">{diamond.PAngle}°</span>
                    </div>
                  </div>
                </div>

                {(diamond["Fancy Intensity"] || diamond["Fancy Overtone"] || diamond["Fancy Color"]) && (
                  <>
                    <Separator className="my-4" />
                    <div className="space-y-2">
                      {diamond["Fancy Intensity"] && (
                        <div>
                          <span className="text-muted-foreground">Fancy Intensity:</span>
                          <span className="font-medium ml-2">{diamond["Fancy Intensity"]}</span>
                        </div>
                      )}
                      {diamond["Fancy Overtone"] && (
                        <div>
                          <span className="text-muted-foreground">Fancy Overtone:</span>
                          <span className="font-medium ml-2">{diamond["Fancy Overtone"]}</span>
                        </div>
                      )}
                      {diamond["Fancy Color"] && (
                        <div>
                          <span className="text-muted-foreground">Fancy Color:</span>
                          <span className="font-medium ml-2">{diamond["Fancy Color"]}</span>
                        </div>
                      )}
                    </div>
                  </>
                )}

                <Separator className="my-4" />

                <div className="space-y-2">
                  <div>
                    <span className="text-muted-foreground">Certificate:</span>
                    <span className="font-medium ml-2">{diamond.Certificate_No}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Location:</span>
                    <span className="font-medium ml-2">{diamond.Location}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Status:</span>
                    <span className="font-medium ml-2">{diamond.Status}</span>
                  </div>
                  {diamond.Comment && (
                    <div>
                      <span className="text-muted-foreground">Comment:</span>
                      <span className="font-medium ml-2">{diamond.Comment}</span>
                    </div>
                  )}
                  {diamond.Inscription && (
                    <div>
                      <span className="text-muted-foreground">Inscription:</span>
                      <span className="font-medium ml-2">{diamond.Inscription}</span>
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap gap-4 mt-4">
                  {diamond.Image_URL && isValidUrl(diamond.Image_URL) && (
                    <a
                      href={getImageUrl(diamond.Image_URL)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center px-3 py-2 rounded-md bg-primary/10 text-primary hover:bg-primary/20 transition-colors duration-200"
                    >
                      <div className="relative mr-2">
                        <ImageWithFallback
                          src={diamond.Image_URL}
                          alt={`Diamond ${diamond.StockID}`}
                        />
                      </div>
                      View Image
                    </a>
                  )}
                  {diamond.Video_URL && isValidUrl(diamond.Video_URL) && (
                    <a
                      href={diamond.Video_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center px-3 py-2 rounded-md bg-primary/10 text-primary hover:bg-primary/20 transition-colors duration-200"
                    >
                      <Video className="h-4 w-4 mr-2" />
                      View Video
                    </a>
                  )}
                  {diamond.Cert_URL && isValidUrl(diamond.Cert_URL) && (
                    <a
                      href={diamond.Cert_URL}
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
                    <span className="font-medium">{formatCurrency(diamond.PricePerCarat)}</span>
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
                    <span className="font-medium">{formatCurrency(diamond.RapPrice)}</span>
                  </div>
                  <div className="flex justify-between items-center p-2 rounded-md hover:bg-secondary/50 transition-colors duration-200">
                    <span>Rap amount:</span>
                    <span className="font-medium">{formatCurrency(diamond.RapAmount)}</span>
                  </div>
                  <div className="flex justify-between items-center p-2 rounded-md hover:bg-secondary/50 transition-colors duration-200">
                    <span>Discount:</span>
                    <span className="font-medium text-primary">{diamond.Discount}%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-8 flex justify-center gap-2">
          <Button
            variant="outline"
            disabled={currentPage <= 1}
            onClick={() => handlePageChange(currentPage - 1)}
          >
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