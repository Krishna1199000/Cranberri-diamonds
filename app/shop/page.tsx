"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Diamond, ExternalLink, Info } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface DiamondData {
  StockID: string;
  Certificate_No: string;
  Shape: string;
  Size: number;
  Color: string;
  Clarity: string;
  Cut: string;
  Polish: string;
  Sym: string;
  Floro: string;
  Lab: string;
  RapPrice: number;
  RapAmount: number;
  Discount: number;
  PricePerCarat: number;
  FinalAmount: number;
  Measurement: string;
  Length: number;
  Width: number;
  Height: number;
  Depth: number;
  Table: number;
  Ratio: number;
  Status: string;
  Comment: string;
  Video_URL: string;
  Image_URL: string;
  Cert_URL: string;
  Girdle: string;
  Culet: string;
  Cangle: number;
  CHeight: number;
  PAngle: number;
  PDepth: number;
  "Fancy Intensity": string;
  "Fancy Overtone": string;
  "Fancy Color": string;
  Location: string;
  Inscription: string;
}

function LoadingCard() {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-6">
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

        <Skeleton className="h-px w-full my-4" />

        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-32 ml-2" />
            </div>
          ))}
        </div>

        <div className="flex gap-4 mt-4">
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-8 w-32" />
        </div>

        <div className="mt-4 space-y-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex justify-between items-center">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-20" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default function ShopPage() {
  const [diamonds, setDiamonds] = useState<DiamondData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDiamonds = async () => {
      try {
        const response = await fetch("https://kyrahapi.azurewebsites.net/api", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            USERNAME: "CRANBERRI",
            PASSWORD: "CRADIA@123",
          }),
        });

        const result = await response.json();

        if (result.success) {
          setDiamonds(result.data);
        } else {
          setError(result.message || "Failed to fetch diamonds");
        }
      } catch {
        setError("Failed to fetch diamonds");
      } finally {
        setLoading(false);
      }
    };

    fetchDiamonds();
  }, []);

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      </div>
    );
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value);
  };

  return (
    <TooltipProvider>
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-bold flex items-center gap-2">
            <Diamond className="h-8 w-8" />
            Diamond Collection
          </h1>
          {loading && (
            <div className="text-muted-foreground animate-pulse flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-primary/20 animate-[spin_3s_linear_infinite]" />
              Loading diamonds...
            </div>
          )}
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-6">
          {loading
            ? Array(6)
                .fill(0)
                .map((_, i) => <LoadingCard key={i} />)
            : diamonds.map((diamond) => (
                <Card key={diamond.StockID} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-semibold text-xl">{diamond.Shape}</h3>
                        <p className="text-sm text-muted-foreground">
                          Stock ID: {diamond.StockID}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-2xl">{diamond.Size} ct</p>
                        <p className="text-sm text-muted-foreground">
                          {formatCurrency(diamond.FinalAmount)}
                        </p>
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
                      {diamond.Image_URL && (
                        <a
                          href={diamond.Image_URL}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline flex items-center gap-1"
                        >
                          View Image <ExternalLink className="h-4 w-4" />
                        </a>
                      )}
                      {diamond.Video_URL && (
                        <a
                          href={diamond.Video_URL}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline flex items-center gap-1"
                        >
                          View Video <ExternalLink className="h-4 w-4" />
                        </a>
                      )}
                      {diamond.Cert_URL && (
                        <a
                          href={diamond.Cert_URL}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline flex items-center gap-1"
                        >
                          View Certificate <ExternalLink className="h-4 w-4" />
                        </a>
                      )}
                    </div>

                    <div className="mt-4 text-sm text-muted-foreground">
                      <div className="flex justify-between items-center">
                        <span>Price per carat:</span>
                        <span>{formatCurrency(diamond.PricePerCarat)}</span>
                      </div>
                      <div className="flex justify-between items-center">
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
                        <span>{formatCurrency(diamond.RapPrice)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Rap amount:</span>
                        <span>{formatCurrency(diamond.RapAmount)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Discount:</span>
                        <span>{diamond.Discount}%</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
        </div>
      </div>
    </TooltipProvider>
  );
}