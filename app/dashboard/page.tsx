"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { Eye, Pencil, Trash2, Search } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface User {
  name: string;
}

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
  const [user, setUser] = useState<User | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const itemsPerPage = 10
  const [totalPages, setTotalPages] = useState(1)

  useEffect(() => {
    fetchShipments()
    fetchUser()
  }, [currentPage])

  const fetchUser = async () => {
    try {
      const res = await fetch('/api/auth/user')
      const data = await res.json()
      if (data.success) {
        setUser(data.user)
      }
    } catch {
      toast.error('Failed to fetch user details')
    }
  }

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
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      
      <nav className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <span className="text-xl font-bold">Shipments</span>
              <Button 
                variant="outline"
                onClick={handleLogout}
              >
                Logout
              </Button>
            </div>
            </div>
            </div>
      </nav >
      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">Shipments</h1>
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                type="text"
                placeholder="Search shipments..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 w-64"
              />
            </div>
            <Button 
              variant="default"
              onClick={() => router.push('/dashboard/create-shipment')}
            >
              Create Shipment
            </Button>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Sr No
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Company Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Phone
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Salesman
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Updated
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedShipments.map((shipment, index) => (
                <tr key={shipment.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
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
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleView(shipment)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push(`/dashboard/edit-shipment/${shipment.id}`)}
                      className="text-indigo-600 hover:text-indigo-900"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(shipment.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex justify-center space-x-2 mt-6">
          <Button
            variant="outline"
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
          >
            Previous
          </Button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <Button
              key={page}
              variant={currentPage === page ? "default" : "outline"}
              onClick={() => setCurrentPage(page)}
            >
              {page}
            </Button>
          ))}
          <Button
            variant="outline"
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
          >
            Next
          </Button>
        </div>
      </div>

      {/* View Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Shipment Details</DialogTitle>
          </DialogHeader>
          {selectedShipment && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="font-semibold mb-2">Company Information</h3>
                <p><strong>Company Name:</strong> {selectedShipment.companyName}</p>
                <p><strong>Email:</strong> {selectedShipment.email}</p>
                <p><strong>Phone:</strong> {selectedShipment.phoneNo}</p>
                <p><strong>Website:</strong> {selectedShipment.website || 'N/A'}</p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Address</h3>
                <p>{selectedShipment.addressLine1}</p>
                {selectedShipment.addressLine2 && <p>{selectedShipment.addressLine2}</p>}
                <p>{`${selectedShipment.city}, ${selectedShipment.state}`}</p>
                <p>{`${selectedShipment.country} - ${selectedShipment.postalCode}`}</p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Business Details</h3>
                <p><strong>Organization Type:</strong> {selectedShipment.organizationType}</p>
                <p><strong>Business Type:</strong> {selectedShipment.businessType}</p>
                <p><strong>Business Reg No:</strong> {selectedShipment.businessRegNo}</p>
                <p><strong>PAN No:</strong> {selectedShipment.panNo}</p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Shipping Details</h3>
                <p><strong>Payment Terms:</strong> {selectedShipment.paymentTerms}</p>
                <p><strong>Carrier:</strong> {selectedShipment.carrier}</p>
                <p><strong>Sales Executive:</strong> {selectedShipment.salesExecutive}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}