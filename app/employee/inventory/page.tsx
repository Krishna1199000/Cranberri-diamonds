"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { InventoryTable } from "@/components/inventory/InventoryTable";
import { InventorySearch } from "@/components/inventory/InventorySearch";
import { EmployeeLayout } from "@/components/layout/EmployeeLayout";
import { FilterState } from "@/components/inventory/AdvancedFilters";
// Import Prisma type instead of utils/inventory
import type { InventoryItem as PrismaInventoryItem } from "@prisma/client";

// Use Prisma type
type InventoryItemType = PrismaInventoryItem;

export default function EmployeeInventoryPage() {
  const [isLoading, setIsLoading] = useState(true);
  // Use correct state names and types
  const [inventoryItems, setInventoryItems] = useState<InventoryItemType[]>([]); 
  const [totalItems, setTotalItems] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [advancedFilters, setAdvancedFilters] = useState<FilterState>({
    carat: "",
    colors: [],
    clarities: [],
    shapes: [],
    sortBy: "",
    sortOrder: 'desc'
  });
  
  // Fetch InventoryItems
  useEffect(() => {
    const fetchItems = async () => {
      setIsLoading(true);
      try {
        const query = new URLSearchParams({
          take: pageSize.toString(),
          skip: ((currentPage - 1) * pageSize).toString(),
        });
        
        if (searchQuery) {
          query.append("search", searchQuery);
        }
        
        if (statusFilter) {
          query.append("status", statusFilter);
        }
        
        // Add advanced filters
        if (advancedFilters.carat) {
          query.append("carat", advancedFilters.carat);
        }
        if (advancedFilters.colors.length > 0) {
          query.append("colors", advancedFilters.colors.join(","));
        }
        if (advancedFilters.clarities.length > 0) {
          query.append("clarities", advancedFilters.clarities.join(","));
        }
        if (advancedFilters.shapes.length > 0) {
          query.append("shapes", advancedFilters.shapes.join(","));
        }
        if (advancedFilters.sortBy) {
          query.append("sortBy", advancedFilters.sortBy);
        }
        if (advancedFilters.sortOrder) {
          query.append("sortOrder", advancedFilters.sortOrder);
        }
        
        // Fetch from the correct endpoint
        const response = await fetch(`/api/inventory-items?${query.toString()}`); 
        const data = await response.json();
        
        // Set state directly, assuming API returns correct structure
        setInventoryItems(data.items || []); 
        setTotalItems(data.total || 0);
      } catch (error) {
        console.error("Error fetching inventory items:", error);
        setInventoryItems([]); // Clear items on error
        setTotalItems(0);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchItems();
  }, [currentPage, pageSize, searchQuery, statusFilter, advancedFilters]);
  
  const handleSearch = (query: string, status: string, filters?: FilterState) => {
    setSearchQuery(query);
    setStatusFilter(status);
    if (filters) {
      setAdvancedFilters(filters);
    }
    setCurrentPage(1);
  };
  
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };
    
  return (
    <EmployeeLayout>
      <Card>
        <CardHeader>
          <CardTitle>Inventory</CardTitle>
          <CardDescription>Browse available items and check their status.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <InventorySearch onSearch={handleSearch} />
            <InventoryTable 
              items={inventoryItems} // Pass state directly
              isLoading={isLoading} 
              total={totalItems} // Pass correct total state
              currentPage={currentPage} 
              pageSize={pageSize}
              isAdmin={false} // Employee view is not admin
              userRole="employee"
              onPageChange={handlePageChange}
              // No onEdit, onStatusChange, onSelect for employee view (as per original code)
            />
          </div>
        </CardContent>
      </Card>
    </EmployeeLayout>
  );
}