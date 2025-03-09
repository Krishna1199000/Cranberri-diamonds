"use client"

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Image, Video, FileText } from "lucide-react";

interface Diamond {
  id: string;
  stockId: string;
  certificateNo: string;
  shape: string;
  size: number;
  color: string;
  clarity: string;
  cut: string;
  polish: string;
  sym: string;
  floro: string;
  lab: string;
  rapPrice: number;
  rapAmount: number;
  discount: number;
  pricePerCarat: number;
  finalAmount: number;
  measurement: string;
  depth: number;
  table: number;
  ratio: number;
  location: string;
  imageUrl?: string;
  videoUrl?: string;
  certUrl?: string;
}

export default function SearchResults() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedDiamonds, setSelectedDiamonds] = useState<Set<string>>(new Set());
  const [diamonds, setDiamonds] = useState<Diamond[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDiamonds = async () => {
      try {
        // Convert searchParams to an object
        const params: Record<string, string> = {};
        searchParams.forEach((value, key) => {
          params[key] = value;
        });

        // Parse the parameters
        const searchCriteria: {
          shapes?: string[];
          caratRange: { from: string; to: string };
          stoneId?: string;
          priceRange: { from: string; to: string };
          colors?: string[];
          clarities?: string[];
          cuts?: string[];
          labs?: string[];
          polishes?: string[];
          symmetries?: string[];
          fluorescence?: string[];
          locations?: string[];
        } = {
          shapes: params.shapes?.split(','),
          caratRange: {
            from: params.caratFrom,
            to: params.caratTo
          },
          stoneId: params.stoneId,
          priceRange: {
            from: params.priceFrom,
            to: params.priceTo
          },
          colors: params.colors?.split(','),
          clarities: params.clarities?.split(','),
          cuts: params.cuts?.split(','),
          labs: params.labs?.split(','),
          polishes: params.polishes?.split(','),
          symmetries: params.symms?.split(','),
          fluorescence: params.flours?.split(','),
          locations: params.locations?.split(',')
        };

        const response = await fetch('/api/diamonds/search', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(searchCriteria),
        });

        const data = await response.json();
        
        if (data.diamonds) {
          setDiamonds(data.diamonds);
          if (data.diamonds.length === 0) {
            toast.info('No diamonds found matching your criteria');
          }
        } else {
          toast.error('Failed to fetch diamonds');
        }
      } catch (error) {
        console.error('Failed to fetch diamonds:', error);
        toast.error('Failed to fetch diamonds');
      } finally {
        setLoading(false);
      }
    };

    fetchDiamonds();
  }, [searchParams]);

  const handleSelectDiamond = (id: string) => {
    const newSelected = new Set(selectedDiamonds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedDiamonds(newSelected);
  };

  const handleExport = async () => {
    if (selectedDiamonds.size === 0) {
      toast.error("Please select diamonds to export");
      return;
    }

    const selectedDiamondsList = diamonds.filter(d => selectedDiamonds.has(d.id));
    
    try {
      const response = await fetch('/api/diamonds/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ diamonds: selectedDiamondsList }),
      });

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'selected_diamonds.xlsx';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success(`Successfully exported ${selectedDiamonds.size} diamonds`);
    } catch (error) {
      console.error('Export failed:', error);
      toast.error('Failed to export diamonds');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <div className="text-lg">Loading diamonds...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Search Results</h1>
          <div className="space-x-4">
            <Button variant="outline" onClick={() => router.back()}>
              Back to Search
            </Button>
            <Button 
              onClick={handleExport}
              disabled={selectedDiamonds.size === 0}
            >
              Export Selected ({selectedDiamonds.size})
            </Button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow">
          <Tabs defaultValue="list" className="w-full">
            <TabsList className="w-full justify-start border-b p-0">
              <TabsTrigger value="list" className="px-6 py-3">
                List View
              </TabsTrigger>
              <TabsTrigger value="grid" className="px-6 py-3">
                Grid View
              </TabsTrigger>
            </TabsList>

            <TabsContent value="list" className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox />
                    </TableHead>
                    <TableHead>Sr No.</TableHead>
                    <TableHead>Stock ID</TableHead>
                    <TableHead>Media</TableHead>
                    <TableHead>Shape</TableHead>
                    <TableHead>Carat</TableHead>
                    <TableHead>Color</TableHead>
                    <TableHead>Clarity</TableHead>
                    <TableHead>Cut</TableHead>
                    <TableHead>Polish</TableHead>
                    <TableHead>Sym</TableHead>
                    <TableHead>Lab</TableHead>
                    <TableHead>Price/Ct</TableHead>
                    <TableHead>Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {diamonds.map((diamond, index) => (
                    <TableRow key={diamond.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedDiamonds.has(diamond.id)}
                          onChange={() => handleSelectDiamond(diamond.id)}
                        />
                      </TableCell>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>{diamond.stockId}</TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          {diamond.imageUrl && (
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => window.open(diamond.imageUrl)}
                            >
                              <Image className="h-4 w-4" />
                            </Button>
                          )}
                          {diamond.videoUrl && (
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => window.open(diamond.videoUrl)}
                            >
                              <Video className="h-4 w-4" />
                            </Button>
                          )}
                          {diamond.certUrl && (
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => window.open(diamond.certUrl)}
                            >
                              <FileText className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{diamond.shape}</TableCell>
                      <TableCell>{diamond.size.toFixed(2)}</TableCell>
                      <TableCell>{diamond.color}</TableCell>
                      <TableCell>{diamond.clarity}</TableCell>
                      <TableCell>{diamond.cut}</TableCell>
                      <TableCell>{diamond.polish}</TableCell>
                      <TableCell>{diamond.sym}</TableCell>
                      <TableCell>{diamond.lab}</TableCell>
                      <TableCell>${diamond.pricePerCarat.toLocaleString()}</TableCell>
                      <TableCell>${diamond.finalAmount.toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TabsContent>

            <TabsContent value="grid" className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {diamonds.map((diamond, index) => (
                  <Card key={diamond.id} className="relative">
                    <CardHeader>
                      <div className="absolute top-4 right-4">
                        <Checkbox
                          checked={selectedDiamonds.has(diamond.id)}
                          onChange={() => handleSelectDiamond(diamond.id)}
                        />
                      </div>
                      <CardTitle>Diamond #{index + 1}</CardTitle>
                      <CardDescription>{diamond.stockId}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex justify-center space-x-4">
                          {diamond.imageUrl && (
                            <Button
                              variant="outline"
                              onClick={() => window.open(diamond.imageUrl)}
                            >
                              <Image className="h-4 w-4 mr-2" />
                              View Image
                            </Button>
                          )}
                          {diamond.videoUrl && (
                            <Button
                              variant="outline"
                              onClick={() => window.open(diamond.videoUrl)}
                            >
                              <Video className="h-4 w-4 mr-2" />
                              View Video
                            </Button>
                          )}
                          {diamond.certUrl && (
                            <Button
                              variant="outline"
                              onClick={() => window.open(diamond.certUrl)}
                            >
                              <FileText className="h-4 w-4 mr-2" />
                              View Certificate
                            </Button>
                          )}
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>Shape: {diamond.shape}</div>
                          <div>Carat: {diamond.size.toFixed(2)}</div>
                          <div>Color: {diamond.color}</div>
                          <div>Clarity: {diamond.clarity}</div>
                          <div>Cut: {diamond.cut}</div>
                          <div>Polish: {diamond.polish}</div>
                          <div>Symmetry: {diamond.sym}</div>
                          <div>Lab: {diamond.lab}</div>
                        </div>
                        <div className="text-right font-semibold">
                          ${diamond.finalAmount.toLocaleString()}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}