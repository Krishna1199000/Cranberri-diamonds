"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { Eye, Pencil, Trash2, Search, LogOut, Package, Plus, Menu, X, MessageSquare } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { RemarksDialog } from "@/components/ui/remarks-dialog"

interface Shipment {
  id: string
  companyName: string
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
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedShipment, setSelectedShipment] = useState<Shipment | null>(null)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [isRemarksDialogOpen, setIsRemarksDialogOpen] = useState(false)
  const [selectedShipmentId, setSelectedShipmentId] = useState<string>('')
  const [searchTerm, setSearchTerm] = useState('')
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const itemsPerPage = 10
  const [totalPages, setTotalPages] = useState(1)
  const [userRole, setUserRole] = useState<string>('')

  useEffect(() => {
    fetchShipments()
  }, [currentPage])

  const fetchShipments = async () => {
    try {
      const res = await fetch('/api/shipments')
      const data = await res.json()
      if (data.success) {
        setShipments(data.shipments)
        setTotalPages(Math.ceil(data.shipments.length / itemsPerPage))
      }
    } catch {
      toast.error('Failed to fetch shipments')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this shipment?')) return

    try {
      const res = await fetch(`/api/shipments/${id}`, {
        method: 'DELETE',
      })
      const data = await res.json()

      if (data.success) {
        toast.success('Shipment deleted successfully')
        fetchShipments()
      } else {
        toast.error(data.message || 'Failed to delete shipment')
      }
    } catch {
      toast.error('Something went wrong')
    }
  }

  useEffect(() => {
    const fetchUserRole = async () => {
      try {
        const res = await fetch('/api/auth/status', {
          credentials: 'include'
        });
        const data = await res.json();
        setUserRole(data.role);
      } catch (error) {
        console.error('Error fetching user role:', error);
      }
    };

    fetchUserRole();
  }, []);

  const handleLogout = async () => {
    try {
      const res = await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      })

      const data = await res.json()

      if (data.success) {
        toast.success('Logged out successfully')
        router.push('/auth/signin')
      } else {
        toast.error('Failed to logout')
      }
    } catch {
      toast.error('Something went wrong')
    }
  }

  const handleView = (shipment: Shipment) => {
    setSelectedShipment(shipment)
    setIsViewDialogOpen(true)
  }

  const handleViewRemarks = (shipmentId: string) => {
    setSelectedShipmentId(shipmentId)
    setIsRemarksDialogOpen(true)
  }

  const filteredShipments = shipments.filter(shipment =>
    shipment.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    shipment.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    shipment.phoneNo.includes(searchTerm) ||
    shipment.salesExecutive.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const paginatedShipments = filteredShipments.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  const startIndex = (currentPage - 1) * itemsPerPage

  const navItems = [
    { label: 'Create Master', icon: Plus, href: '/dashboard/create-shipment' },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Bar */}
      <nav className="bg-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="lg:hidden"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
              >
                {isMenuOpen ? <X /> : <Menu />}
              </motion.button>
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center ml-4"
              >
                <Package className="h-8 w-8 text-blue-600" />
                <span className="ml-2 text-xl font-bold">Master</span>
              </motion.div>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center space-x-8">
              {navItems.map((item) => (
                <motion.button
                  key={item.label}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex items-center space-x-2 text-gray-700 hover:text-blue-600"
                  onClick={() => router.push(item.href)}
                >
                  <item.icon className="h-5 w-5" />
                  <span>{item.label}</span>
                </motion.button>
              ))}
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  variant="default"
                  className="flex items-center space-x-2"
                  onClick={handleLogout}
                >
                  <LogOut className="h-5 w-5" />
                  <span>Logout</span>
                </Button>
              </motion.div>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="lg:hidden"
            >
              <div className="px-2 pt-2 pb-3 space-y-1">
                {navItems.map((item) => (
                  <motion.button
                    key={item.label}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="flex items-center space-x-2 w-full px-3 py-2 rounded-md text-gray-700 hover:text-blue-600 hover:bg-gray-100"
                    onClick={() => {
                      router.push(item.href);
                      setIsMenuOpen(false);
                    }}
                  >
                    <item.icon className="h-5 w-5" />
                    <span>{item.label}</span>
                  </motion.button>
                ))}
                <Button
                  variant="default"
                  className="flex items-center space-x-2 w-full"
                  onClick={handleLogout}
                >
                  <LogOut className="h-5 w-5" />
                  <span>Logout</span>
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* Main Content */}
      <motion.main
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="max-w-7xl mx-auto px-4 py-8"
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-between items-center mb-6"
        >
          <h1 className="text-3xl font-bold text-gray-900">
            Manage Masters
          </h1>
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <Input
                type="text"
                placeholder="Search Master..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-lg shadow-lg overflow-hidden"
        >
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {["Sr No", "Company Name", "Email", "Phone", "Salesman", "Last Updated", "Actions"].map((header) => (
                    <th key={header} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paginatedShipments.map((shipment, index) => (
                  <motion.tr
                    key={shipment.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="hover:bg-gray-50"
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {startIndex + index + 1}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {shipment.companyName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {shipment.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {shipment.phoneNo}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {shipment.salesExecutive}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(shipment.updatedAt).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <motion.div whileHover={{ scale: 1.1 }}>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleView(shipment)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </motion.div>
                        <motion.div whileHover={{ scale: 1.1 }}>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewRemarks(shipment.id)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            <MessageSquare className="h-4 w-4" />
                          </Button>
                        </motion.div>
                        {userRole === 'admin' && (
                          <>
                            <motion.div whileHover={{ scale: 1.1 }}>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => router.push(`/dashboard/edit-shipment/${shipment.id}`)}
                                className="text-blue-600 hover:text-blue-900"
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                            </motion.div>
                            <motion.div whileHover={{ scale: 1.1 }}>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDelete(shipment.id)}
                                className="text-red-600 hover:text-red-900"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </motion.div>
                          </>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Pagination */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="flex justify-center space-x-2 mt-6"
        >
          <Button
            variant="outline"
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
          >
            Previous
          </Button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <motion.div key={page} whileHover={{ scale: 1.1 }}>
              <Button
                variant={currentPage === page ? "default" : "outline"}
                onClick={() => setCurrentPage(page)}
              >
                {page}
              </Button>
            </motion.div>
          ))}
          <Button
            variant="outline"
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
          >
            Next
          </Button>
        </motion.div>
      </motion.main>

      {/* View Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-gray-900">
              Shipment Details
            </DialogTitle>
          </DialogHeader>
          {selectedShipment && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-2 gap-6 mt-4"
            >
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Company Information</h3>
                <div className="space-y-2">
                  <p><span className="font-medium">Company Name:</span> {selectedShipment.companyName}</p>
                  <p><span className="font-medium">Email:</span> {selectedShipment.email}</p>
                  <p><span className="font-medium">Phone:</span> {selectedShipment.phoneNo}</p>
                  <p><span className="font-medium">Website:</span> {selectedShipment.website || 'N/A'}</p>
                </div>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Address</h3>
                <div className="space-y-2">
                  <p>{selectedShipment.addressLine1}</p>
                  {selectedShipment.addressLine2 && <p>{selectedShipment.addressLine2}</p>}
                  <p>{`${selectedShipment.city}, ${selectedShipment.state}`}</p>
                  <p>{`${selectedShipment.country} - ${selectedShipment.postalCode}`}</p>
                </div>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Business Details</h3>
                <div className="space-y-2">
                  <p><span className="font-medium">Organization Type:</span> {selectedShipment.organizationType}</p>
                  <p><span className="font-medium">Business Type:</span> {selectedShipment.businessType}</p>
                  <p><span className="font-medium">Business Reg No:</span> {selectedShipment.businessRegNo}</p>
                  <p><span className="font-medium">PAN No:</span> {selectedShipment.panNo}</p>
                </div>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Shipping Details</h3>
                <div className="space-y-2">
                  <p><span className="font-medium">Payment Terms:</span> {selectedShipment.paymentTerms}</p>
                  <p><span className="font-medium">Carrier:</span> {selectedShipment.carrier}</p>
                  <p><span className="font-medium">Sales Executive:</span> {selectedShipment.salesExecutive}</p>
                </div>
              </div>
            </motion.div>
          )}
        </DialogContent>
      </Dialog>

      {/* Remarks Dialog */}
      <RemarksDialog
        isOpen={isRemarksDialogOpen}
        onClose={() => setIsRemarksDialogOpen(false)}
        shipmentId={selectedShipmentId}
        userRole={userRole}
      />
    </div>
  )
}