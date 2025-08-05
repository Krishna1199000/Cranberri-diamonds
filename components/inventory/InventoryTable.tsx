"use client";

import { useState, ChangeEvent } from "react";
import { 
  Table, 
  TableHeader, 
  TableRow, 
  TableHead, 
  TableBody, 
  TableCell 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getStatusColor, getStatusDisplay, formatNumber } from "@/lib/utils/inventory";
import { Checkbox } from "@/components/ui/checkbox";
import { LoadingCards } from "@/components/loading";
import { Eye, FileCog, Image as ImageIcon, Video, FileText } from "lucide-react";
import { MediaPreview } from "./MediaPreview";
import { 
  Pagination as PaginationContainer,
  PaginationContent, 
  PaginationEllipsis, 
  PaginationItem, 
  PaginationLink, 
  PaginationNext, 
  PaginationPrevious 
} from "@/components/ui/pagination";

// Import the DiamondStatus from @prisma/client
import { DiamondStatus } from "@prisma/client";

// Import Prisma type
import type { InventoryItem as PrismaInventoryItem } from "@prisma/client";

// Import Diamond type for helper function
import { Diamond } from "@/lib/utils/inventory";

// Define a more specific type for inventory items that includes shipment details
interface InventoryItemWithShipmentDetails extends PrismaInventoryItem {
  heldByShipment?: {
    id: string; // Assuming id is part of the shipment details
    companyName: string;
  } | null;
}

interface InventoryTableProps {
  items: InventoryItemWithShipmentDetails[]; 
  isLoading: boolean;
  total: number;
  currentPage: number;
  pageSize: number;
  isAdmin?: boolean;
  userRole?: 'admin' | 'employee' | 'customer';
  onPageChange: (page: number) => void;
  onEdit?: (item: InventoryItemWithShipmentDetails) => void; 
  onStatusChange?: (item: InventoryItemWithShipmentDetails) => void; 
  onSelect?: (selected: string[]) => void;
}

export function InventoryTable({ 
  items,
  isLoading, 
  total, 
  currentPage, 
  pageSize, 
  isAdmin = false,
  userRole = 'customer',
  onPageChange,
  onEdit,
  onStatusChange,
  onSelect
}: InventoryTableProps) {
  const [selected, setSelected] = useState<string[]>([]);
  const [activeMedia, setActiveMedia] = useState<{ type: string; url: string } | null>(null);

  const handleSelect = (id: string, checked: boolean) => {
    let newSelected = [...selected];
    
    if (checked) {
      // Prevent duplicate selections
      if (!newSelected.includes(id)) {
        newSelected.push(id);
      }
    } else {
      newSelected = newSelected.filter(item => item !== id);
    }
    
    setSelected(newSelected);
    if (onSelect) onSelect(newSelected);
  };
  
  const handleSelectAll = (checked: boolean | ChangeEvent<HTMLInputElement>) => {
    const isChecked = checked instanceof Object ? checked.target.checked : checked;
    const newSelected = isChecked ? items.map(d => d.id) : [];
    setSelected(newSelected);
    if (onSelect) onSelect(newSelected);
  };

  const handleMediaClick = (type: string, url: string | null) => {
    if (url) {
      setActiveMedia({ type, url });
    }
  };

  // Helper function to convert InventoryItem status to DiamondStatus
  const mapStatus = (status: string): DiamondStatus => {
    // Map to the actual enum values from your utility file
    switch(status.toUpperCase()) {
      case "AVAILABLE":
        return "AVAILABLE" as DiamondStatus;
      case "HOLD":
        return "HOLD" as DiamondStatus;
      case "MEMO":
        return "MEMO" as DiamondStatus;
      default:
        return "AVAILABLE" as DiamondStatus; // Default fallback
    }
  };

  // Helper function to convert InventoryItem to Diamond for getStatusDisplay
  const itemToDiamond = (item: InventoryItemWithShipmentDetails): Diamond => {
    return {
      id: item.id,
      stockId: item.stockId,
      status: mapStatus(item.status),
      certificateNo: '',
      shape: item.shape,
      size: item.size || 0,
      color: item.color,
      clarity: item.clarity,
      cut: item.cut ?? null,
      polish: item.polish,
      sym: item.sym,
      floro: '',
      lab: item.lab,
      rapPrice: 0,
      rapAmount: 0,
      discount: 0,
      pricePerCarat: item.pricePerCarat,
      finalAmount: item.finalAmount,
      measurement: '',
      length: null,
      width: null,
      height: null,
      depth: null,
      table: null,
      ratio: null,
      comment: null,
      videoUrl: item.videoUrl ?? null,
      imageUrl: item.imageUrl ?? null,
      certUrl: item.certUrl ?? null,
      girdle: null,
      culet: null,
      heldByShipmentId: null,
      heldByShipment: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  };

  if (isLoading) {
    return <LoadingCards />;
  }

  const totalPages = Math.ceil(total / pageSize);

  // Pagination Logic Helpers
  const getPaginationItems = () => {
    const items: (number | string)[] = [];
    const maxPagesToShow = 5; // Max number links shown (excluding prev/next/ellipsis)
    const halfMax = Math.floor(maxPagesToShow / 2);

    if (totalPages <= maxPagesToShow + 2) { // Show all pages if few enough
      for (let i = 1; i <= totalPages; i++) {
        items.push(i);
      }
    } else {
      // Always show first page
      items.push(1);

      // Ellipsis after first page?
      if (currentPage > halfMax + 2) {
        items.push("ellipsis-start");
      }

      // Middle pages
      const startPage = Math.max(2, currentPage - halfMax);
      const endPage = Math.min(totalPages - 1, currentPage + halfMax);
      
      for (let i = startPage; i <= endPage; i++) {
        items.push(i);
      }

      // Ellipsis before last page?
      if (currentPage < totalPages - halfMax - 1) {
        items.push("ellipsis-end");
      }

      // Always show last page
      items.push(totalPages);
    }
    return items;
  };

  return (
    <div className="rounded-md border">
      <div className="relative overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              {isAdmin && (
                <TableHead className="w-10">
                  <Checkbox 
                    checked={selected.length === items.length && items.length > 0}
                    onChange={handleSelectAll}
                  />
                </TableHead>
              )}
              <TableHead className="w-14">Sr No.</TableHead>
              {(userRole === 'admin' || userRole === 'employee') && (
                <TableHead>Held By Company</TableHead>
              )}
              <TableHead>Status</TableHead>
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
              {isAdmin && <TableHead className="text-right">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={
                  isAdmin ? 
                    (userRole === 'customer' ? 16 : 17) : 
                    (userRole === 'customer' ? 15 : 16)
                } className="h-24 text-center">
                  No inventory items found.
                </TableCell>
              </TableRow>
            ) : (
              items.map((item, index) => {
                const currentStatus = mapStatus(item.status);
                const companyName = (currentStatus === DiamondStatus.MEMO || currentStatus === DiamondStatus.HOLD) 
                                    ? item.heldByShipment?.companyName || "-" 
                                    : "-";

                return (
                  <TableRow key={item.id}>
                    {isAdmin && (
                      <TableCell>
                        <Checkbox 
                          checked={selected.includes(item.id)}
                          onChange={e => handleSelect(item.id, e.target.checked)}
                        />
                      </TableCell>
                    )}
                    <TableCell>{(currentPage - 1) * pageSize + index + 1}</TableCell>
                    {(userRole === 'admin' || userRole === 'employee') && (
                      <TableCell>{companyName}</TableCell>
                    )}
                    <TableCell className={getStatusColor(currentStatus)}>
                      <Badge variant="outline">
                        {getStatusDisplay(itemToDiamond(item))}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">{item.stockId}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {item.imageUrl && (
                          <Button 
                            variant="outline" 
                            size="icon" 
                            className="h-8 w-8"
                            onClick={() => handleMediaClick('image', item.imageUrl || null)}
                          >
                            <ImageIcon className="h-4 w-4" />
                          </Button>
                        )}
                        {item.videoUrl && (
                          <Button 
                            variant="outline" 
                            size="icon" 
                            className="h-8 w-8"
                            onClick={() => handleMediaClick('video', item.videoUrl || null)}
                          >
                            <Video className="h-4 w-4" />
                          </Button>
                        )}
                        {item.certUrl && (
                          <Button 
                            variant="outline" 
                            size="icon" 
                            className="h-8 w-8"
                            onClick={() => handleMediaClick('certificate', item.certUrl || null)}
                          >
                            <FileText className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{item.shape}</TableCell>
                    <TableCell>{item.size?.toFixed(2) ?? 'N/A'}</TableCell>
                    <TableCell>{item.color}</TableCell>
                    <TableCell>{item.clarity}</TableCell>
                    <TableCell>{item.cut || '-'}</TableCell>
                    <TableCell>{item.polish}</TableCell>
                    <TableCell>{item.sym}</TableCell>
                    <TableCell>{item.lab}</TableCell>
                    <TableCell>${formatNumber(item.pricePerCarat)}</TableCell>
                    <TableCell>${formatNumber(item.finalAmount)}</TableCell>
                    {isAdmin && (
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline" 
                            size="icon"
                            onClick={() => onStatusChange && onStatusChange(item)}
                          >
                            <FileCog className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline" 
                            size="icon"
                            onClick={() => onEdit && onEdit(item)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
      
      {totalPages > 1 && (
        <div className="p-4 border-t flex justify-center">
          <PaginationContainer>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious 
                  onClick={() => onPageChange(currentPage - 1)}
                  aria-disabled={currentPage <= 1}
                  className={currentPage <= 1 ? "pointer-events-none opacity-50" : undefined}
                />
              </PaginationItem>

              {getPaginationItems().map((item, index) => (
                <PaginationItem key={typeof item === 'number' ? item : `ellipsis-${index}`}>
                  {item === "ellipsis-start" || item === "ellipsis-end" ? (
                    <PaginationEllipsis />
                  ) : (
                    <PaginationLink 
                      isActive={currentPage === item}
                      onClick={() => onPageChange(item as number)}
                    >
                      {item}
                    </PaginationLink>
                  )}
                </PaginationItem>
              ))}

              <PaginationItem>
                <PaginationNext 
                  onClick={() => onPageChange(currentPage + 1)}
                  aria-disabled={currentPage >= totalPages}
                  className={currentPage >= totalPages ? "pointer-events-none opacity-50" : undefined}
                />
              </PaginationItem>
            </PaginationContent>
          </PaginationContainer>
        </div>
      )}
      
      {activeMedia && (
        <MediaPreview 
          type={activeMedia.type} 
          url={activeMedia.url} 
          onClose={() => setActiveMedia(null)} 
        />
      )}
    </div>
  );
}