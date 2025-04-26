"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Plus, Eye, FileText, Edit, Trash2, ChevronDown } from "lucide-react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { AdminLayout } from "@/components/layout/AdminLayout";
import { EmployeeLayout } from "@/components/layout/EmployeeLayout";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { RemarksDialog } from '@/components/ui/remarks-dialog'
import { CranberriLoader } from "@/components/ui/CranberriLoader";

interface Shipment {
  id: string
  companyName: string
  ownerName: string
  email: string
  phoneNo: string
  lastUpdatedBy: string
  updatedAt: string
  salesExecutive: string
  addressLine1: string
  addressLine2?: string
  country: string
  state: string
  city: string
  postalCode: string
  website?: string
  paymentTerms: string
  carrier: string
  organizationType: string
  businessType: string
  businessRegNo: string
  panNo: string
}

export default function Dashboard() {
  const router = useRouter()
  const [shipments, setShipments] = useState<Shipment[]>([])
  const [filteredShipments, setFilteredShipments] = useState<Shipment[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)
  const [selectedShipment, setSelectedShipment] = useState<Shipment | null>(null)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [isRemarksDialogOpen, setIsRemarksDialogOpen] = useState(false)
  const [selectedShipmentId, setSelectedShipmentId] = useState<string | null>(null)
  const [userRole, setUserRole] = useState<string | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [shipmentToDelete, setShipmentToDelete] = useState<string | null>(null);

  const fetchShipments = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/shipments')
      const data = await res.json()
      if (data.success) {
        setShipments(data.shipments)
        setFilteredShipments(data.shipments)
      } else {
        toast.error(data.message || "Failed to fetch shipments")
      }
    } catch {
      toast.error("Something went wrong while fetching shipments")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const checkRoleAndFetch = async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/auth/me', { credentials: 'include' });
        if (!res.ok) {
          toast.error("Session expired or invalid. Please sign in.");
          router.push('/auth/signin');
          return;
        }
        const data = await res.json();
        setUserRole(data.role);

        if (data.role === 'admin' || data.role === 'employee') {
            await fetchShipments();
        } else {
             toast.error("Access Denied: You don't have permission to view this page.");
            router.push('/auth/signin');
        }
      } catch (error) {
        console.error('Error fetching user role:', error);
        toast.error("Could not verify user session.");
        setLoading(false);
        router.push('/auth/signin');
      }
    };
    checkRoleAndFetch();
  }, [fetchShipments, router]);

  useEffect(() => {
    const lowerCaseSearchTerm = searchTerm.toLowerCase()
    const filtered = shipments.filter(shipment =>
      (shipment.companyName?.toLowerCase() || '').includes(lowerCaseSearchTerm) ||
      (shipment.email?.toLowerCase() || '').includes(lowerCaseSearchTerm) ||
      (shipment.phoneNo || '').includes(searchTerm) ||
      (shipment.salesExecutive?.toLowerCase() || '').includes(lowerCaseSearchTerm)
    )
    setFilteredShipments(filtered)
    setCurrentPage(1)
  }, [searchTerm, shipments])

  const handleView = (shipment: Shipment) => {
    setSelectedShipment(shipment)
    setIsViewDialogOpen(true)
  }
  
   const handleEdit = (shipmentId: string) => {
        router.push(`/dashboard/edit-shipment/${shipmentId}`);
    };

  const handleViewRemarks = (shipmentId: string) => {
    setSelectedShipmentId(shipmentId)
    setIsRemarksDialogOpen(true)
  }

  const handleDelete = async (shipmentId: string) => {
     if (userRole !== 'admin') {
         toast.error("Unauthorized: Only admins can delete.");
         return;
     }
      if (!window.confirm('Are you sure you want to delete this master? This action cannot be undone.')) {
          return;
      }
      try {
          const response = await fetch(`/api/shipments/${shipmentId}`, {
              method: 'DELETE',
              credentials: 'include'
          });
          if (!response.ok) {
              const errorData = await response.json();
              throw new Error(errorData.message || 'Failed to delete master');
          }
          toast.success('Master deleted successfully');
          fetchShipments();
      } catch (error) {
          console.error('Delete error:', error);
          toast.error(error instanceof Error ? error.message : 'Failed to delete master');
      }
      setShipmentToDelete(null);
      setShowDeleteConfirm(false);
  };

  const paginatedShipments = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    return filteredShipments.slice(startIndex, startIndex + itemsPerPage)
  }, [filteredShipments, currentPage, itemsPerPage])

  const totalPages = Math.ceil(filteredShipments.length / itemsPerPage)

  const handleNextPage = () => {
    setCurrentPage(prev => Math.min(prev + 1, totalPages))
  }

  const handlePreviousPage = () => {
    setCurrentPage(prev => Math.max(prev - 1, 1))
  }

  if (loading) {
      return <CranberriLoader />;
  }

  const LayoutComponent = userRole === 'admin' ? AdminLayout : userRole === 'employee' ? EmployeeLayout : null;

  if (!LayoutComponent) {
       return <div className="flex justify-center items-center min-h-screen">Error: Invalid user role or session.</div>;
  }

  return (
    <LayoutComponent>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Manage Masters</h1>
        {(userRole === 'admin' || userRole === 'employee') && (
             <Link href="/dashboard/create-shipment">
              <Button className="flex items-center gap-2">
                <Plus className="h-4 w-4" /> Create Master
              </Button>
            </Link>
        )}
      </div>

      <Card>
        <CardHeader>
            <div className="mb-4 relative max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <Input
                type="text"
                placeholder="Search Masters..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full"
              />
            </div>
        </CardHeader>
        <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">Sr No</TableHead>
                    <TableHead>Company Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Salesman</TableHead>
                    <TableHead>Last Updated</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center h-24">
                        Loading...
                      </TableCell>
                    </TableRow>
                  ) : paginatedShipments.length > 0 ? (
                    paginatedShipments.map((shipment, index) => (
                      <TableRow key={shipment.id}>
                        <TableCell>{(currentPage - 1) * itemsPerPage + index + 1}</TableCell>
                        <TableCell className="font-medium">{shipment.companyName}</TableCell>
                        <TableCell>{shipment.email}</TableCell>
                        <TableCell>{shipment.phoneNo}</TableCell>
                        <TableCell>{shipment.salesExecutive}</TableCell>
                        <TableCell>
                          {new Date(shipment.updatedAt).toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right">
                           <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="sm">
                                  Actions <ChevronDown className="ml-1 h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleView(shipment)}>
                                  <Eye className="mr-2 h-4 w-4" /> View Details
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleViewRemarks(shipment.id)}>
                                  <FileText className="mr-2 h-4 w-4" /> View Remarks
                                </DropdownMenuItem>
                                 {(userRole === 'admin' || userRole === 'employee') && (
                                     <DropdownMenuItem onClick={() => handleEdit(shipment.id)}>
                                         <Edit className="mr-2 h-4 w-4" /> Edit
                                     </DropdownMenuItem>
                                 )}
                                {userRole === 'admin' && (
                                  <DropdownMenuItem 
                                    onClick={() => {
                                      setShipmentToDelete(shipment.id);
                                      setShowDeleteConfirm(true);
                                    }}
                                    className="text-red-600 focus:text-red-700 focus:bg-red-50 dark:focus:bg-red-900/20"
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" /> Delete
                                  </DropdownMenuItem>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center h-24">
                        No masters found {searchTerm ? `matching "${searchTerm}"` : ""}.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            {totalPages > 1 && (
              <div className="flex justify-between items-center mt-4">
                <span className="text-sm text-muted-foreground">
                    Page {currentPage} of {totalPages}
                </span>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePreviousPage}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleNextPage}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
        </CardContent>
      </Card>

      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Master Details</DialogTitle>
            <DialogDescription>
              Detailed information for {selectedShipment?.companyName}.
            </DialogDescription>
          </DialogHeader>
          {selectedShipment && (
            <div className="grid gap-4 py-4 text-sm">
                <div className="grid grid-cols-4 items-center gap-4">
                    <span className="text-right font-medium col-span-1">Company:</span>
                    <span className="col-span-3">{selectedShipment.companyName}</span>
                </div>
                 <div className="grid grid-cols-4 items-center gap-4">
                    <span className="text-right font-medium col-span-1">Email:</span>
                    <span className="col-span-3">{selectedShipment.email}</span>
                </div>
                 <div className="grid grid-cols-4 items-center gap-4">
                    <span className="text-right font-medium col-span-1">Phone:</span>
                    <span className="col-span-3">{selectedShipment.phoneNo}</span>
                </div>
                 <div className="grid grid-cols-4 items-center gap-4">
                    <span className="text-right font-medium col-span-1">Address 1:</span>
                    <span className="col-span-3">{selectedShipment.addressLine1}</span>
                </div>
                {selectedShipment.addressLine2 && (
                     <div className="grid grid-cols-4 items-center gap-4">
                        <span className="text-right font-medium col-span-1">Address 2:</span>
                        <span className="col-span-3">{selectedShipment.addressLine2}</span>
                    </div>
                )}
                 <div className="grid grid-cols-4 items-center gap-4">
                    <span className="text-right font-medium col-span-1">City:</span>
                    <span className="col-span-3">{selectedShipment.city}</span>
                </div>
                 <div className="grid grid-cols-4 items-center gap-4">
                    <span className="text-right font-medium col-span-1">State:</span>
                    <span className="col-span-3">{selectedShipment.state}</span>
                </div>
                 <div className="grid grid-cols-4 items-center gap-4">
                    <span className="text-right font-medium col-span-1">Postal Code:</span>
                    <span className="col-span-3">{selectedShipment.postalCode}</span>
                </div>
                 <div className="grid grid-cols-4 items-center gap-4">
                    <span className="text-right font-medium col-span-1">Country:</span>
                    <span className="col-span-3">{selectedShipment.country}</span>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                    <span className="text-right font-medium col-span-1">Salesman:</span>
                    <span className="col-span-3">{selectedShipment.salesExecutive}</span>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                    <span className="text-right font-medium col-span-1">Updated At:</span>
                    <span className="col-span-3">{new Date(selectedShipment.updatedAt).toLocaleString()}</span>
                </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {selectedShipmentId && (
        <RemarksDialog
          isOpen={isRemarksDialogOpen}
          onClose={() => {
            setIsRemarksDialogOpen(false)
            setSelectedShipmentId(null)
          }}
          shipmentId={selectedShipmentId}
          isAdmin={userRole === 'admin'}
        />
      )}

      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this master? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>Cancel</Button>
            <Button variant="outline" onClick={() => handleDelete(shipmentToDelete as string)}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </LayoutComponent>
  )
}