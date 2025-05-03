"use client";

import { useState, useEffect } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2 } from "lucide-react";
import { InventoryTable } from "@/components/inventory/InventoryTable";
import { InventorySearch } from "@/components/inventory/InventorySearch";
import { AddEditInventoryForm, InventoryItemFormData } from "@/components/inventory/AddEditInventoryForm";
import { StatusChangeDialog } from "@/components/inventory/StatusChangeDialog";
import { AdminLayout } from "@/components/layout/AdminLayout";

// Import actual Prisma types
import type { InventoryItem as PrismaInventoryItem, Shipment as PrismaShipment } from "@prisma/client"; 

// Use the Prisma type consistently
type InventoryItemType = PrismaInventoryItem;

// Define type for shipment options used in dropdowns
interface ShipmentOption {
  id: string;
  companyName: string;
}

export default function AdminInventoryPage() {

  
  const [isLoading, setIsLoading] = useState(true);
  const [inventoryItems, setInventoryItems] = useState<InventoryItemType[]>([]); // Use correct type
  const [totalItems, setTotalItems] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [refreshKey, setRefreshKey] = useState(0);
  
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItemType | undefined>(undefined); // Use correct type
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  
  const [shipments, setShipments] = useState<ShipmentOption[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  
  // Fetch shipments for the dropdown
  useEffect(() => {
    const fetchShipments = async () => {
      try {
        const response = await fetch("/api/shipments");
        const data = await response.json();
        if (data && data.success && Array.isArray(data.shipments)) {
          // Map PrismaShipment to ShipmentOption
          setShipments(data.shipments.map((shipment: PrismaShipment) => ({
            id: shipment.id,
            companyName: shipment.companyName
          })));
        } else {
          console.error("Invalid data structure received from /api/shipments:", data);
          setShipments([]); 
        }
      } catch (error) {
        console.error("Error fetching shipments:", error);
        setShipments([]); 
      }
    };
    
    fetchShipments();
  }, []);
  
  // Fetch inventory items with pagination and filters
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
        
        const response = await fetch(`/api/inventory-items?${query.toString()}`);
        const data = await response.json();
        
        // Set state assuming data.items is InventoryItemType[] 
        setInventoryItems(data.items || []); 
        
        setTotalItems(data.total); 
      } catch (error) {
        console.error("Error fetching inventory items:", error);
        // Optionally set items to [] on error
        setInventoryItems([]);
        setTotalItems(0);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchItems();
  }, [currentPage, pageSize, searchQuery, statusFilter, refreshKey]);
  
  const handleAddInventoryItem = async (data: InventoryItemFormData) => { 
    setFormSubmitting(true);
    try {
      const response = await fetch("/api/inventory-items", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
        credentials: "include",
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to add inventory item");
      }
      
      setCurrentPage(1);
      setRefreshKey(prevKey => prevKey + 1);
    } catch (error) {
      console.error("Error adding inventory item:", error);
      alert("Failed to add inventory item: " + (error as Error).message);
    } finally {
      setFormSubmitting(false);
    }
  };
  
  const handleEditInventoryItem = async (data: InventoryItemFormData) => {
    if (!selectedItem) return;

    setFormSubmitting(true);
    try {
      const response = await fetch(`/api/inventory-items/${selectedItem.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
        credentials: "include", 
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update inventory item");
      }

      setRefreshKey(prevKey => prevKey + 1);

    } catch (error) {
      console.error("Error updating inventory item:", error);
      alert("Failed to update inventory item: " + (error as Error).message);
    } finally {
      setFormSubmitting(false);
    }
  };
  
  const handleStatusChange = async (id: string, data: { status: string; heldByShipmentId: string | null }) => {
    setFormSubmitting(true);
    try {
      const originalItem = inventoryItems.find(item => item.id === id);
      if (!originalItem) throw new Error("Original item not found");
      
      const updatePayload = {
         ...originalItem, 
         status: data.status,
         heldByShipmentId: data.heldByShipmentId,
       };

      const response = await fetch(`/api/inventory-items/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatePayload),
        credentials: "include",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update status");
      }

      setRefreshKey(prevKey => prevKey + 1);

    } catch (error) {
      console.error("Error updating status:", error);
      alert("Failed to update status: " + (error as Error).message);
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedIds.length === 0) {
      alert("Please select items to delete.");
      return;
    }

    if (window.confirm(`Are you sure you want to delete ${selectedIds.length} selected item(s)?`)) {
      setIsLoading(true); 
      try {
        const deletePromises = selectedIds.map(id => 
          fetch(`/api/inventory-items/${id}`, {
            method: "DELETE",
            credentials: "include",
          })
        );

        const results = await Promise.all(deletePromises);
        
        const failedDeletes = results.filter(res => !res.ok);
        if (failedDeletes.length > 0) {
          console.error("Failed to delete items:", failedDeletes);
          alert(`Failed to delete ${failedDeletes.length} item(s). Check console for details.`);
        }

        setSelectedIds([]); 
        setRefreshKey(prevKey => prevKey + 1); 

      } catch (error) {
        console.error("Error deleting items:", error);
        alert("An error occurred while deleting items.");
      } finally {
        setIsLoading(false);
      }
    }
  };
  
  const handleSearch = (query: string, status: string) => {
    setSearchQuery(query);
    setStatusFilter(status);
    setCurrentPage(1);
  };
  
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };
  
  return (
    <AdminLayout>
      <div className="container mx-auto py-6">
        <Card>
          <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle>Inventory Management</CardTitle>
              <CardDescription>
                Manage your Inventory Items.
              </CardDescription>
            </div>
            <Button 
              onClick={() => {
                setSelectedItem(undefined);
                setIsAddDialogOpen(true);
              }}
              className="ml-auto mr-2" 
            >
              <Plus className="mr-2 h-4 w-4" /> Add Inventory
            </Button>
            <Button
              variant="outline"
              onClick={handleDeleteSelected}
              disabled={selectedIds.length === 0 || isLoading}
              className="text-red-500 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="mr-2 h-4 w-4" /> Delete Selected ({selectedIds.length})
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <InventorySearch onSearch={handleSearch} />
              
              <InventoryTable 
                items={inventoryItems} // Pass InventoryItemType[]
                isLoading={isLoading}
                total={totalItems}
                currentPage={currentPage}
                pageSize={pageSize}
                isAdmin={true}
                onPageChange={handlePageChange}
                onSelect={setSelectedIds} 
                onEdit={(item) => { // item here is InventoryItemType
                  setSelectedItem(item); // Works: assigns InventoryItemType to state
                  setIsEditDialogOpen(true);
                }}
                onStatusChange={(item) => { // item here is InventoryItemType
                  setSelectedItem(item); // Works: assigns InventoryItemType to state
                  setIsStatusDialogOpen(true);
                }}
              />
            </div>
          </CardContent>
        </Card>
      </div>
      
      {isAddDialogOpen && (
        <AddEditInventoryForm 
          isOpen={isAddDialogOpen}
          onClose={() => setIsAddDialogOpen(false)}
          onSubmit={handleAddInventoryItem}
          isLoading={formSubmitting}
          shipments={shipments}
          // item prop is implicitly undefined here (Add mode)
        />
      )}
      
      {isEditDialogOpen && selectedItem && (
        <AddEditInventoryForm
          isOpen={isEditDialogOpen}
          onClose={() => setIsEditDialogOpen(false)}
          item={selectedItem} // Pass InventoryItemType | undefined
          onSubmit={handleEditInventoryItem}
          isLoading={formSubmitting}
          shipments={shipments}
        />
      )}
      
      {isStatusDialogOpen && selectedItem && (
        <StatusChangeDialog 
          isOpen={isStatusDialogOpen}
          onClose={() => setIsStatusDialogOpen(false)}
          item={selectedItem} // Pass InventoryItemType | undefined
          onSubmit={handleStatusChange}
          isLoading={formSubmitting}
          shipments={shipments}
        />
      )}
    </AdminLayout>
  );
}
