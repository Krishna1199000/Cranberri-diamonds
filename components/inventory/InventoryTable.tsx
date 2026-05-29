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
import { Edit, FileCog } from "lucide-react";
import { MediaPreview } from "./MediaPreview";
import { useRouter } from "next/navigation";
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

import type { InventoryItem as PrismaInventoryItem } from "@prisma/client";
import { canSeeTierPrices } from "@/lib/utils/pricing-tiers";

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
  onAddToCart?: (item: InventoryItemWithShipmentDetails) => void;
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
  onSelect,
  onAddToCart
}: InventoryTableProps) {
  const router = useRouter();
  const [selected, setSelected] = useState<string[]>([]);
  const [activeMedia, setActiveMedia] = useState<{ type: string; url: string } | null>(null);
  const showTierPrices = canSeeTierPrices(userRole);
  const showActions = isAdmin || userRole === 'employee';

  const columnCount =
    1 + // Sr No
    (isAdmin ? 1 : 0) +
    (userRole === 'admin' ? 1 : 0) +
    21 + // Status through Price
    (showTierPrices ? 4 : 0) +
    (showActions ? 1 : 0);
  
  const handleRowClick = (item: InventoryItemWithShipmentDetails, e: React.MouseEvent) => {
    // Don't redirect if clicking on buttons, checkboxes, or media icons
    const target = e.target as HTMLElement;
    if (
      target.closest('button') ||
      target.closest('input[type="checkbox"]') ||
      target.closest('[role="button"]') ||
      target.closest('.media-icon')
    ) {
      return;
    }
    router.push(`/shop/search/results/${item.id}`);
  };

  const exportSelectedToCSV = async () => {
    if (!selected.length) return;
    // Fetch full selected items by IDs to include selections across pages
    const params = new URLSearchParams({ ids: selected.join(',') });
    const res = await fetch(`/api/inventory-items?${params.toString()}`);
    const data = await res.json();
    const selectedItems = Array.isArray(data.items) && data.items.length ? data.items : items.filter(i => selected.includes(i.id));
    const headers = [
      'Sr No.',
      'Held By Company',
      'Status',
      'Stock ID',
      'Shape',
      'Carat',
      'Color',
      'Clarity',
      'Cut',
      'Polish',
      'Sym',
      'Lab',
      'Report No',
      'Location',
      'Measurement',
      'Ratio',
      'Table',
      'Depth',
      'Growth Type',
      'Flourence',
      'Price P/Ct',
      'Price',
      ...(showTierPrices ? ['Green Price P/Ct', 'Green Price', 'Red Price P/Ct', 'Red Price'] : []),
    ];

    const rows = selectedItems.map((item, idx) => [
      String(idx + 1),
      item.heldByShipment?.companyName ?? '',
      item.status,
      item.stockId ?? '',
      item.shape ?? '',
      String(item.size ?? ''),
      item.color ?? '',
      item.clarity ?? '',
      item.cut ?? '',
      item.polish ?? '',
      item.sym ?? '',
      item.lab ?? '',
      item.certificateNo ?? '',
      item.location ?? '',
      item.measurement ?? '',
      item.ratio !== null && item.ratio !== undefined ? String(item.ratio) : '',
      item.table !== null && item.table !== undefined ? String(item.table) : '',
      item.depth !== null && item.depth !== undefined ? String(item.depth) : '',
      item.growthType ?? '',
      item.flourence ?? '',
      item.pricePerCarat !== null && item.pricePerCarat !== undefined ? String(item.pricePerCarat) : '',
      String(item.finalAmount ?? ''),
      ...(showTierPrices
        ? [
            item.greenPricePerCarat !== null && item.greenPricePerCarat !== undefined ? String(item.greenPricePerCarat) : '',
            (item.greenPrice !== null && item.greenPrice !== undefined)
              ? String(item.greenPrice)
              : (item.greenPricePerCarat !== null && item.greenPricePerCarat !== undefined && item.size ? String(item.greenPricePerCarat * item.size) : ''),
            item.redPricePerCarat !== null && item.redPricePerCarat !== undefined ? String(item.redPricePerCarat) : '',
            (item.redPrice !== null && item.redPrice !== undefined)
              ? String(item.redPrice)
              : (item.redPricePerCarat !== null && item.redPricePerCarat !== undefined && item.size ? String(item.redPricePerCarat * item.size) : ''),
          ]
        : []),
    ]);

    const csv = [headers, ...rows]
      .map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'selected-inventory.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

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
  
  const handleSelectAll = async (checked: boolean | ChangeEvent<HTMLInputElement>) => {
    const isChecked = checked instanceof Object ? checked.target.checked : checked;
    
    if (isChecked) {
      // Select all items across all pages - fetch without pagination
      try {
        const response = await fetch('/api/inventory-items?take=10000'); // Large number to get all items
        if (response.ok) {
          const data = await response.json();
          const allItemIds = data.items.map((item: InventoryItemWithShipmentDetails) => item.id);
          setSelected(allItemIds);
          if (onSelect) onSelect(allItemIds);
        } else {
          // Fallback to current page only
          const newSelected = items.map(d => d.id);
          setSelected(newSelected);
          if (onSelect) onSelect(newSelected);
        }
      } catch (error) {
        console.error('Error fetching all items:', error);
        // Fallback to current page only
        const newSelected = items.map(d => d.id);
        setSelected(newSelected);
        if (onSelect) onSelect(newSelected);
      }
    } else {
      // Deselect all
      setSelected([]);
      if (onSelect) onSelect([]);
    }
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
      case "SOLD":
        return "SOLD" as DiamondStatus;
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
      polish: item.polish ?? null,
      sym: item.sym ?? null,
      floro: '',
      lab: item.lab ?? null,
      rapPrice: 0,
      rapAmount: 0,
      discount: 0,
      pricePerCarat: item.pricePerCarat ?? null,
      finalAmount: item.finalAmount ?? 0,
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
        {isAdmin && (
          <div className="flex items-center justify-between px-4 py-2">
            <div className="text-sm text-muted-foreground">
              {selected.length > 0 ? `${selected.length} selected` : ''}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                disabled={selected.length === 0}
                onClick={() => {
                  setSelected([]);
                  if (onSelect) onSelect([]);
                }}
              >
                Unselect All
              </Button>
              <Button
                variant="outline"
                disabled={selected.length === 0}
                onClick={exportSelectedToCSV}
              >
                Export Selected to CSV
              </Button>
            </div>
          </div>
        )}
        <Table>
          <TableHeader className="bg-black">
            <TableRow className="bg-black">
              {isAdmin && (
                <TableHead className="w-10 text-white">
                  <Checkbox 
                    checked={selected.length === items.length && items.length > 0}
                    onChange={handleSelectAll}
                  />
                </TableHead>
              )}
              <TableHead className="w-14 text-white">Sr No.</TableHead>
              {userRole === 'admin' && (
                <TableHead className="text-white">Held By Company</TableHead>
              )}
              <TableHead className="text-white">Status</TableHead>
              <TableHead className="text-white">Stock ID</TableHead>
              <TableHead className="text-white">Media</TableHead>
              <TableHead className="text-white">Shape</TableHead>
              <TableHead className="text-white">Carat</TableHead>
              <TableHead className="text-white">Color</TableHead>
              <TableHead className="text-white">Clarity</TableHead>
              <TableHead className="text-white">Cut</TableHead>
              <TableHead className="text-white">Polish</TableHead>
              <TableHead className="text-white">Sym</TableHead>
              <TableHead className="text-white">Lab</TableHead>
              <TableHead className="text-white">Report No</TableHead>
              <TableHead className="text-white">Location</TableHead>
              <TableHead className="text-white">Measurement</TableHead>
              <TableHead className="text-white">Ratio</TableHead>
              <TableHead className="text-white">Table</TableHead>
              <TableHead className="text-white">Depth</TableHead>
              <TableHead className="text-white">Growth Type</TableHead>
              <TableHead className="text-white">Flourence</TableHead>
              <TableHead className="text-white">Price P/Ct</TableHead>
              <TableHead className="text-white">Price</TableHead>
              {showTierPrices && (
                <>
                  <TableHead className="text-white bg-green-600">Green Price P/Ct</TableHead>
                  <TableHead className="text-white bg-green-600">Green Price</TableHead>
                  <TableHead className="text-white bg-red-600">Red Price P/Ct</TableHead>
                  <TableHead className="text-white bg-red-600">Red Price</TableHead>
                </>
              )}
              {showActions && <TableHead className="text-right text-white">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columnCount} className="h-24 text-center">
                  No inventory items found.
                </TableCell>
              </TableRow>
            ) : (
              items.map((item, index) => {
                const currentStatus = mapStatus(item.status);
                const companyName = (currentStatus === DiamondStatus.MEMO || currentStatus === DiamondStatus.HOLD || currentStatus === DiamondStatus.SOLD) 
                                    ? item.heldByShipment?.companyName || "-" 
                                    : "-";

                return (
                  <TableRow 
                    key={item.id}
                    className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    onClick={(e) => handleRowClick(item, e)}
                  >
                    {isAdmin && (
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <Checkbox 
                          checked={selected.includes(item.id)}
                          onChange={e => handleSelect(item.id, e.target.checked)}
                        />
                      </TableCell>
                    )}
                    <TableCell>{(currentPage - 1) * pageSize + index + 1}</TableCell>
                    {userRole === 'admin' && (
                      <TableCell>{companyName}</TableCell>
                    )}
                    <TableCell className={getStatusColor(currentStatus)}>
                      <Badge variant="outline">
                        {getStatusDisplay(itemToDiamond(item))}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">{item.stockId}</TableCell>
                    <TableCell>
                      <div className="flex gap-3 items-center">
                        {item.imageUrl && item.imageUrl.trim() !== '' && (
                          <span
                            className="text-xl cursor-pointer hover:scale-110 transition-transform media-icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMediaClick('image', item.imageUrl || null);
                            }}
                            title="View Image"
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                e.stopPropagation();
                                handleMediaClick('image', item.imageUrl || null);
                              }
                            }}
                          >
                            🖼️
                          </span>
                        )}
                        {item.videoUrl && item.videoUrl.trim() !== '' && (
                          <span
                            className="text-xl cursor-pointer hover:scale-110 transition-transform media-icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/shop/search/results/${item.id}`);
                            }}
                            title="View Details"
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                e.stopPropagation();
                                router.push(`/shop/search/results/${item.id}`);
                              }
                            }}
                          >
                            🎥
                          </span>
                        )}
                        {item.certUrl && item.certUrl.trim() !== '' && (
                          <span
                            className="text-xl cursor-pointer hover:scale-110 transition-transform media-icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMediaClick('certificate', item.certUrl || null);
                            }}
                            title="View Certificate"
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                e.stopPropagation();
                                handleMediaClick('certificate', item.certUrl || null);
                              }
                            }}
                          >
                            📄
                          </span>
                        )}
                        {(!item.imageUrl || item.imageUrl.trim() === '') && 
                         (!item.videoUrl || item.videoUrl.trim() === '') && 
                         (!item.certUrl || item.certUrl.trim() === '') && (
                          <span className="text-xs text-gray-400">-</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{item.shape}</TableCell>
                    <TableCell>{item.size?.toFixed(2) ?? 'N/A'}</TableCell>
                    <TableCell>{item.color}</TableCell>
                    <TableCell>{item.clarity}</TableCell>
                    <TableCell>{item.cut || '-'}</TableCell>
                    <TableCell>{item.polish || '-'}</TableCell>
                    <TableCell>{item.sym || '-'}</TableCell>
                    <TableCell>{item.lab || '-'}</TableCell>
                    <TableCell>{item.certificateNo || '-'}</TableCell>
                    <TableCell>{item.location || '-'}</TableCell>
                    <TableCell>{item.measurement || '-'}</TableCell>
                    <TableCell>{item.ratio !== null && item.ratio !== undefined ? formatNumber(item.ratio) : '-'}</TableCell>
                    <TableCell>{item.table !== null && item.table !== undefined ? formatNumber(item.table) : '-'}</TableCell>
                    <TableCell>{item.depth !== null && item.depth !== undefined ? formatNumber(item.depth) : '-'}</TableCell>
                    <TableCell>{item.growthType || '-'}</TableCell>
                    <TableCell>{item.flourence || '-'}</TableCell>
                    <TableCell>${formatNumber(item.pricePerCarat)}</TableCell>
                    <TableCell>${formatNumber(item.finalAmount)}</TableCell>
                    {showTierPrices && (
                      <>
                        <TableCell className="bg-green-100">${formatNumber(item.greenPricePerCarat)}</TableCell>
                        <TableCell className="bg-green-100">
                          {(item.greenPrice !== null && item.greenPrice !== undefined)
                            ? `$${formatNumber(item.greenPrice)}`
                            : (item.greenPricePerCarat !== null && item.greenPricePerCarat !== undefined && item.size
                              ? `$${formatNumber(item.greenPricePerCarat * item.size)}`
                              : '-')}
                        </TableCell>
                        <TableCell className="bg-red-100">${formatNumber(item.redPricePerCarat)}</TableCell>
                        <TableCell className="bg-red-100">
                          {(item.redPrice !== null && item.redPrice !== undefined)
                            ? `$${formatNumber(item.redPrice)}`
                            : (item.redPricePerCarat !== null && item.redPricePerCarat !== undefined && item.size
                              ? `$${formatNumber(item.redPricePerCarat * item.size)}`
                              : '-')}
                        </TableCell>
                      </>
                    )}
                    {showActions && (
                      <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-end gap-2">
                          {onAddToCart && (userRole === 'admin' || userRole === 'employee') && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                onAddToCart(item);
                              }}
                            >
                              Add to Cart
                            </Button>
                          )}
                          {isAdmin && (
                            <>
                              <Button
                                variant="outline" 
                                size="icon"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (onStatusChange) {
                                    onStatusChange(item);
                                  }
                                }}
                              >
                                <FileCog className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline" 
                                size="icon"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (onEdit) {
                                    onEdit(item);
                                  }
                                }}
                                title="Edit Item"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            </>
                          )}
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