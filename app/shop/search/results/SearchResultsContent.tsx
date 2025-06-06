"use client";

import { useState, useEffect, useCallback } from "react";
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
import { LoadingCards } from "@/components/loading";
import { Video, FileText, Search } from "lucide-react";
import Image from "next/image";

import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

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

interface PaginationInfo {
  total: number;
  pages: number;
  currentPage: number;
  perPage: number;
}

export default function SearchResultsContent() {
  const searchParams = useSearchParams();
  const [selectedDiamonds, setSelectedDiamonds] = useState<Set<string>>(new Set());
  const [diamonds, setDiamonds] = useState<Diamond[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<'admin' | 'employee' | 'customer'>('customer');
  const [pagination, setPagination] = useState<PaginationInfo>({
    total: 0,
    pages: 0,
    currentPage: 1,
    perPage: 40
  });

  const router = useRouter();

  useEffect(() => {
    const fetchUserRole = async () => {
      try {
        const response = await fetch('/api/auth/me');
        if (response.ok) {
          const user = await response.json();
          setUserRole(user.role);
        }
      } catch (error) {
        console.error('Error fetching user role:', error);
      }
    };
    fetchUserRole();
  }, []);

  const fetchDiamonds = useCallback(async (page: number) => {
    try {
      setLoading(true);

      const params: Record<string, string> = {};
      searchParams.forEach((value, key) => {
        params[key] = value;
      });

      const searchCriteria = {
        page,
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
        setPagination(data.pagination);
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
  }, [searchParams]);

  useEffect(() => {
    fetchDiamonds(1);
  }, [fetchDiamonds]);

  const handlePageChange = (page: number) => {
    fetchDiamonds(page);
  };

  const handleSelectDiamond = (id: string) => {
    const newSelected = new Set(selectedDiamonds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedDiamonds(newSelected);
  };

  const handleSelectAllDiamonds = (checked: boolean) => {
    if (checked) {
      const allIds = diamonds.map(diamond => diamond.id);
      setSelectedDiamonds(new Set(allIds));
    } else {
      setSelectedDiamonds(new Set());
    }
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

  const handleRowClick = (diamondId: string) => {
    router.push(`/shop/search/results/${diamondId}`);
  };

  const handleModifySearch = () => {
    const currentParams = new URLSearchParams();
    searchParams.forEach((value, key) => {
      currentParams.set(key, value);
    });
    router.push('/Admins');
  };

  if (loading) {
    return <LoadingCards />;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Search Results</h1>
          <div className="space-x-4">
            <Button 
              variant="outline" 
              onClick={handleModifySearch}
              className="flex items-center gap-2"
            >
              <Search className="h-4 w-4" />
              Modify Search
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
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox 
                    checked={selectedDiamonds.size === diamonds.length && diamonds.length > 0}
                    onChange={(e) => handleSelectAllDiamonds(e.target.checked)}
                  />
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
                {(userRole === 'admin' || userRole === 'employee') && (
                  <>
                    <TableHead>Price/Ct</TableHead>
                    <TableHead>Amount</TableHead>
                  </>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {diamonds.map((diamond, index) => (
                <TableRow 
                  key={diamond.id}
                  className="cursor-pointer hover:bg-gray-50"
                  onClick={() => handleRowClick(diamond.id)}
                >
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                      checked={selectedDiamonds.has(diamond.id)}
                      onChange={() => handleSelectDiamond(diamond.id)}
                    />
                  </TableCell>
                  <TableCell>{((pagination.currentPage - 1) * pagination.perPage) + index + 1}</TableCell>
                  <TableCell>{diamond.stockId}</TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <div className="flex space-x-2">
                      {diamond.imageUrl && (
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => window.open(diamond.imageUrl)}
                        >
                          <Image
                            src={diamond.imageUrl}
                            alt="Diamond image"
                            width={16}
                            height={16}
                            className="h-4 w-4"
                          />
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
                  {(userRole === 'admin' || userRole === 'employee') && (
                    <>
                      <TableCell>${diamond.pricePerCarat.toLocaleString()}</TableCell>
                      <TableCell>${diamond.finalAmount.toLocaleString()}</TableCell>
                    </>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <div className="flex justify-center p-6 border-t">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious 
                    onClick={() => handlePageChange(pagination.currentPage - 1)}
                    disabled={pagination.currentPage === 1}
                  />
                </PaginationItem>
                
                {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((page) => {
                  if (
                    page === 1 ||
                    page === pagination.pages ||
                    (page >= pagination.currentPage - 2 && page <= pagination.currentPage + 2)
                  ) {
                    return (
                      <PaginationItem key={page}>
                        <PaginationLink
                          onClick={() => handlePageChange(page)}
                          isActive={page === pagination.currentPage}
                        >
                          {page}
                        </PaginationLink>
                      </PaginationItem>
                    );
                  } else if (
                    page === pagination.currentPage - 3 ||
                    page === pagination.currentPage + 3
                  ) {
                    return (
                      <PaginationItem key={page}>
                        <PaginationEllipsis />
                      </PaginationItem>
                    );
                  }
                  return null;
                })}

                <PaginationItem>
                  <PaginationNext
                    onClick={() => handlePageChange(pagination.currentPage + 1)}
                    disabled={pagination.currentPage === pagination.pages}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>

          <div className="px-6 py-4 bg-gray-50 border-t">
            <p className="text-sm text-gray-700 text-center">
              Showing {((pagination.currentPage - 1) * pagination.perPage) + 1} to{' '}
              {Math.min(pagination.currentPage * pagination.perPage, pagination.total)} of{' '}
              {pagination.total} diamonds
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}