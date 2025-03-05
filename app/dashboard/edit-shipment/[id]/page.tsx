"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"

// Import the constants from a shared file
import {
  countries,
  paymentTerms,
  carriers,
  organizationTypes,
  businessTypes,
  tradeBodyMemberships,
  authorizedByOptions,
  accountManagerOptions,
  salesExecutiveOptions,
  leadSourceOptions,
  partyGroupOptions,
  defaultReferences
} from '../../create-shipment/constants'

export default function EditShipment({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [formData, setFormData] = useState({
    companyName: '',
    addressLine1: '',
    addressLine2: '',
    country: '',
    state: '',
    city: '',
    postalCode: '',
    phoneNo: '',
    faxNo: '',
    email: '',
    website: '',
    paymentTerms: '',
    carrier: '',
    organizationType: '',
    businessType: '',
    businessRegNo: '',
    panNo: '',
    sellerPermitNo: '',
    cstTinNo: '',
    tradeBodyMembership: [] as string[],
    referenceType: 'no-reference',
    referenceNotes: '',
    references: defaultReferences,
    authorizedBy: '',
    accountManager: '',
    brokerName: '',
    partyGroup: 'Customer',
    salesExecutive: '',
    leadSource: '',
    limit: 0,
    lastUpdatedBy: '',
    updatedAt: ''
  })

  useEffect(() => {
    fetchShipment()
  }, [])

  const fetchShipment = async () => {
    try {
      const res = await fetch(`/api/shipments/${params.id}`)
      const data = await res.json()
      if (data.success) {
        setFormData(data.shipment)
      } else {
        toast.error('Failed to fetch shipment')
        router.push('/dashboard')
      }
    } catch (error) {
      toast.error('Something went wrong')
      router.push('/dashboard')
    }
  }

  const handleChange = (field: string, value: string | string[]) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
      ...(field === 'country' && { state: '', city: '' }),
      ...(field === 'state' && { city: '' })
    }))
  }

  const handleReferenceChange = (index: number, field: string, value: string) => {
    setFormData(prev => {
      const newReferences = [...prev.references]
      newReferences[index] = { ...newReferences[index], [field]: value }
      return { ...prev, references: newReferences }
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const response = await fetch(`/api/shipments/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const data = await res.json()

      if (data.success) {
        toast.success('Shipment updated successfully')
        router.push('/dashboard')
      } else {
        toast.error(data.message || 'Failed to update shipment')
      }
    } catch (error) {
      toast.error('Something went wrong')
    }
  }

  // The rest of the JSX is identical to the create form, just update the title and button text
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Company Details Section */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Edit Company Details</h2>
            {/* Same form fields as create-shipment.tsx */}
            {/* ... */}
          </div>

          {/* Business Information Section */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Business Information</h2>
            {/* Same form fields as create-shipment.tsx */}
            {/* ... */}
          </div>

          {/* Additional Information Section */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Additional Information</h2>
            {/* Same form fields as create-shipment.tsx */}
            {/* ... */}
            
            {/* Last Updated Information */}
            <div className="mt-6 grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Last Updated By
                </label>
                <Input
                  disabled
                  value={formData.lastUpdatedBy || 'N/A'}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Last Updated At
                </label>
                <Input
                  disabled
                  value={formData.updatedAt ? new Date(formData.updatedAt).toLocaleString() : 'N/A'}
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/dashboard')}
            >
              Cancel
            </Button>
            <Button type="submit">
              Update Shipment
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}