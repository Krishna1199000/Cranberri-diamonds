"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { Eye, Pencil, Trash2, Search, LogOut, Package, Plus } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

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
  const [searchTerm, setSearchTerm] = useState('')
  const itemsPerPage = 10
  const [totalPages, setTotalPages] = useState(1)

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 transition-all duration-300">
      {/* Navbar */}
      <nav className="bg-white shadow-lg backdrop-blur-lg bg-opacity-80 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Package className="h-8 w-8 text-blue-600 animate-[pulse_2s_ease-in-out_infinite]" />
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent">
                Master
              </span>
            </div>
            <Button 
              variant="outline"
              onClick={handleLogout}
              className="flex items-center space-x-2 hover:bg-red-50 hover:text-red-600 transition-all duration-300 ease-in-out transform hover:scale-105"
            >
              <LogOut className="h-4 w-4" />
              <span>Logout</span>
            </Button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 
            className="text-3xl font-bold text-blue-900 animate-slideDown opacity-0"
            style={{
              animation: 'slideDown 0.5s ease-out forwards'
            }}
          >
            Manage Shipments
          </h1>
          <div className="flex items-center space-x-4">
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-400 h-4 w-4 transition-colors group-hover:text-blue-600" />
              <Input
                type="text"
                placeholder="Search shipments..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 w-64 transition-all duration-300 border-blue-200 focus:border-blue-400 focus:ring-blue-400 rounded-full"
              />
            </div>
            <Button 
              variant="default"
              onClick={() => router.push('/dashboard/create-shipment')}
              className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 transform hover:scale-105 transition-all duration-300 ease-in-out animate-[fadeIn_0.5s_ease-out]"
              style={{
                animation: 'fadeIn 0.5s ease-out',
              }}
            >
              <Plus className="h-4 w-4" />
              <span>Create Shipment</span>
            </Button>
          </div>
        </div>
        
        <div
          className="bg-white rounded-xl shadow-xl overflow-hidden transition-all duration-300 hover:shadow-2xl"
          style={{
            animation: 'slideUp 0.5s ease-out',
          }}
        >
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-blue-200">
              <thead className="bg-blue-50">
                <tr>
                  {["Sr No", "Company Name", "Email", "Phone", "Salesman", "Last Updated", "Actions"].map((header) => (
                    <th key={header} className="px-6 py-3 text-left text-xs font-medium text-blue-700 uppercase tracking-wider">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-blue-100">
                {paginatedShipments.map((shipment, index) => (
                  <tr 
                    key={shipment.id}
                    className="hover:bg-blue-50 transition-colors duration-200 ease-in-out animate-[fadeIn_0.5s_ease-out]"
                    style={{
                      animation: `fadeIn 0.5s ease-out ${index * 0.1}s`
                    }}
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-900">
                      {startIndex + index + 1}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-900">
                      {shipment.companyName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600">
                      {shipment.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600">
                      {shipment.phoneNo}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600">
                      {shipment.salesExecutive}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600">
                      {new Date(shipment.updatedAt).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleView(shipment)}
                          className="text-blue-600 hover:text-blue-900 hover:bg-blue-50 transition-all duration-200 ease-in-out transform hover:scale-110"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => router.push(`/dashboard/edit-shipment/${shipment.id}`)}
                          className="text-blue-600 hover:text-blue-900 hover:bg-blue-50 transition-all duration-200 ease-in-out transform hover:scale-110"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(shipment.id)}
                          className="text-red-600 hover:text-red-900 hover:bg-red-50 transition-all duration-200 ease-in-out transform hover:scale-110"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        <div className="flex justify-center space-x-2 mt-6">
          <Button
            variant="outline"
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="transition-all duration-200 hover:bg-blue-600 hover:text-white disabled:opacity-50 border-blue-200"
          >
            Previous
          </Button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <Button
              key={page}
              variant={currentPage === page ? "default" : "outline"}
              onClick={() => setCurrentPage(page)}
              className={`transition-all duration-200 ${
                currentPage === page 
                  ? 'bg-blue-600 text-white transform scale-105'
                  : 'hover:bg-blue-600 hover:text-white border-blue-200'
              }`}
            >
              {page}
            </Button>
          ))}
          <Button
            variant="outline"
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="transition-all duration-200 hover:bg-blue-600 hover:text-white disabled:opacity-50 border-blue-200"
          >
            Next
          </Button>
        </div>
      </div>

      {/* View Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-3xl transform transition-all duration-300">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-blue-600">
              Shipment Details
            </DialogTitle>
          </DialogHeader>
          {selectedShipment && (
            <div className="grid grid-cols-2 gap-6 mt-4">
              <div className="bg-blue-50 p-4 rounded-lg transition-all duration-300 hover:shadow-md hover:transform hover:scale-[1.02]">
                <h3 className="text-lg font-semibold text-blue-600 mb-3">Company Information</h3>
                <div className="space-y-2">
                  <p><span className="font-medium">Company Name:</span> {selectedShipment.companyName}</p>
                  <p><span className="font-medium">Email:</span> {selectedShipment.email}</p>
                  <p><span className="font-medium">Phone:</span> {selectedShipment.phoneNo}</p>
                  <p><span className="font-medium">Website:</span> {selectedShipment.website || 'N/A'}</p>
                </div>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg transition-all duration-300 hover:shadow-md hover:transform hover:scale-[1.02]">
                <h3 className="text-lg font-semibold text-blue-600 mb-3">Address</h3>
                <div className="space-y-2">
                  <p>{selectedShipment.addressLine1}</p>
                  {selectedShipment.addressLine2 && <p>{selectedShipment.addressLine2}</p>}
                  <p>{`${selectedShipment.city}, ${selectedShipment.state}`}</p>
                  <p>{`${selectedShipment.country} - ${selectedShipment.postalCode}`}</p>
                </div>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg transition-all duration-300 hover:shadow-md hover:transform hover:scale-[1.02]">
                <h3 className="text-lg font-semibold text-blue-600 mb-3">Business Details</h3>
                <div className="space-y-2">
                  <p><span className="font-medium">Organization Type:</span> {selectedShipment.organizationType}</p>
                  <p><span className="font-medium">Business Type:</span> {selectedShipment.businessType}</p>
                  <p><span className="font-medium">Business Reg No:</span> {selectedShipment.businessRegNo}</p>
                  <p><span className="font-medium">PAN No:</span> {selectedShipment.panNo}</p>
                </div>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg transition-all duration-300 hover:shadow-md hover:transform hover:scale-[1.02]">
                <h3 className="text-lg font-semibold text-blue-600 mb-3">Shipping Details</h3>
                <div className="space-y-2">
                  <p><span className="font-medium">Payment Terms:</span> {selectedShipment.paymentTerms}</p>
                  <p><span className="font-medium">Carrier:</span> {selectedShipment.carrier}</p>
                  <p><span className="font-medium">Sales Executive:</span> {selectedShipment.salesExecutive}</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}