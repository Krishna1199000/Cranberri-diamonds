"use client"

import { useState, useEffect } from 'react'
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

const paymentTerms = [
  "CASH ON DELIVERY",
  "ADVANCE PAYMENT",
  "WITHIN 5 DAYS",
  "WITHIN 7 DAYS",
  "WITHIN 15 DAYS",
]

const carriers = ["FedEx", "UPS", "USPS", "DLF","HAND DELIVERY"]

const organizationTypes = [
  "Sole Proprietor",
  "Corporation",
  "Individual",
  "Partnership",
  "Other"
]

const businessTypes = [
  "Retailer",
  "Broker",
  "Diamond Dealer/Manufacturer/Wholesaler",
  "Individual",
  "Jewelry Dealer/Manufacturer/Wholesaler/Jewelry Designer",
  "Other"
]

const tradeBodyMemberships = ["AGS", "AGTA", "JA", "JBT", "Other"]

const authorizedByOptions = ["Urmil Wadhvana", "Smith Pujara"]
const accountManagerOptions = ["Urmil Wadhvana", "Smith Pujara"]

const leadSourceOptions = ["Urmil Wadhvana", "Smith Pujara"]
const partyGroupOptions = ["Customer"]

const defaultReferences = [
  { companyName: "", contactPerson: "", contactNo: "" },
  { companyName: "", contactPerson: "", contactNo: "" },
  { companyName: "", contactPerson: "", contactNo: "" },
  { companyName: "", contactPerson: "", contactNo: "" },
  { companyName: "", contactPerson: "", contactNo: "" }
]

export default function CreateShipment() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    companyName: '',
    ownerName: '',
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
    limit: 0
  })

  const [salesExecutiveOptions, setSalesExecutiveOptions] = useState<Array<{ id: string, name: string }>>([])

  useEffect(() => {
    fetchSalesExecutives()
  }, [])

  const fetchSalesExecutives = async () => {
    try {
      const response = await fetch('/api/employees')
      const data = await response.json()
      if (data.success) {
        setSalesExecutiveOptions(data.employees)
      } else {
        toast.error('Failed to fetch sales executives')
      }
    } catch {
      toast.error('Error fetching sales executives')
    }
  }

  const handleChange = (field: string, value: string | string[]) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
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
    setIsSubmitting(true)

    try {
      const response = await fetch('/api/shipments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (data.success) {
        toast.success('Shipment created successfully')
        router.push('/dashboard')
      } else {
        toast.error(data.message || 'Failed to create shipment')
      }
    } catch {
      toast.error('An error occurred while creating the shipment')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Company Details Section */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Company Details</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Company Name <span className="text-red-500">*</span>
                </label>
                <Input
                  required
                  value={formData.companyName}
                  onChange={(e) => handleChange('companyName', e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Owner Name <span className="text-red-500">*</span>
                </label>
                <Input
                  required
                  value={formData.ownerName}
                  onChange={(e) => handleChange('ownerName', e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Address Line 1 <span className="text-red-500">*</span>
                </label>
                <Input
                  required
                  value={formData.addressLine1}
                  onChange={(e) => handleChange('addressLine1', e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Address Line 2
                </label>
                <Input
                  value={formData.addressLine2}
                  onChange={(e) => handleChange('addressLine2', e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Country <span className="text-red-500">*</span>
                  </label>
                  <Input
                    required
                    value={formData.country}
                    onChange={(e) => handleChange('country', e.target.value)}
                    placeholder="Enter Country"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    State <span className="text-red-500">*</span>
                  </label>
                  <Input
                    required
                    value={formData.state}
                    onChange={(e) => handleChange('state', e.target.value)}
                    placeholder="Enter State"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    City <span className="text-red-500">*</span>
                  </label>
                  <Input
                    required
                    value={formData.city}
                    onChange={(e) => handleChange('city', e.target.value)}
                    placeholder="Enter City"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Postal Code <span className="text-red-500">*</span>
                  </label>
                  <Input
                    required
                    value={formData.postalCode}
                    onChange={(e) => handleChange('postalCode', e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Phone No <span className="text-red-500">*</span>
                  </label>
                  <Input
                    required
                    value={formData.phoneNo}
                    onChange={(e) => handleChange('phoneNo', e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Fax No
                  </label>
                  <Input
                    value={formData.faxNo}
                    onChange={(e) => handleChange('faxNo', e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Email <span className="text-red-500">*</span>
                </label>
                <Input
                  required
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Website
                </label>
                <Input
                  type="url"
                  value={formData.website}
                  onChange={(e) => handleChange('website', e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Payment Terms <span className="text-red-500">*</span>
                  </label>
                  <Select
                    value={formData.paymentTerms}
                    onValueChange={(value) => handleChange('paymentTerms', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Payment Terms" />
                    </SelectTrigger>
                    <SelectContent>
                      {paymentTerms.map((term) => (
                        <SelectItem key={term} value={term}>
                          {term}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Shipped By <span className="text-red-500">*</span>
                  </label>
                  <Select
                    value={formData.carrier}
                    onValueChange={(value) => handleChange('carrier', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Carrier" />
                    </SelectTrigger>
                    <SelectContent>
                      {carriers.map((carrier) => (
                        <SelectItem key={carrier} value={carrier}>
                          {carrier}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>

          {/* Business Information Section */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Business Information</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Nature of Organization
                  </label>
                  <Select
                    value={formData.organizationType}
                    onValueChange={(value) => handleChange('organizationType', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Organization Type" />
                    </SelectTrigger>
                    <SelectContent>
                      {organizationTypes.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Business Type
                  </label>
                  <Select
                    value={formData.businessType}
                    onValueChange={(value) => handleChange('businessType', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Business Type" />
                    </SelectTrigger>
                    <SelectContent>
                      {businessTypes.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Business Registration No
                </label>
                <Input
                  value={formData.businessRegNo}
                  onChange={(e) => handleChange('businessRegNo', e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    PAN No / Tax Id No
                  </label>
                  <Input
                    value={formData.panNo}
                    onChange={(e) => handleChange('panNo', e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Seller Permit No
                  </label>
                  <Input
                    value={formData.sellerPermitNo}
                    onChange={(e) => handleChange('sellerPermitNo', e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  CST/TIN No
                </label>
                <Input
                  value={formData.cstTinNo}
                  onChange={(e) => handleChange('cstTinNo', e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Trade Body Membership
                </label>
                <Select
                  value={formData.tradeBodyMembership[0] || ''}
                  onValueChange={(value) => handleChange('tradeBodyMembership', [value])}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Trade Body Membership" />
                  </SelectTrigger>
                  <SelectContent>
                    {tradeBodyMemberships.map((membership) => (
                      <SelectItem key={membership} value={membership}>
                        {membership}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Additional Information Section */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Additional Information</h2>
            <div className="space-y-6">
              <div className="flex items-center space-x-4">
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    className="form-radio"
                    name="referenceType"
                    value="reference"
                    checked={formData.referenceType === 'reference'}
                    onChange={(e) => handleChange('referenceType', e.target.value)}
                  />
                  <span className="ml-2">Reference (minimum two)</span>
                </label>
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    className="form-radio"
                    name="referenceType"
                    value="no-reference"
                    checked={formData.referenceType === 'no-reference'}
                    onChange={(e) => handleChange('referenceType', e.target.value)}
                  />
                  <span className="ml-2">No Reference (Advance Pay Only)</span>
                </label>
              </div>

              {formData.referenceType === 'no-reference' ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Notes</label>
                  <textarea
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                    rows={4}
                    value={formData.referenceNotes}
                    onChange={(e) => handleChange('referenceNotes', e.target.value)}
                  />
                </div>
              ) : (
                <div className="space-y-4">
                  {formData.references.map((ref, index) => (
                    <div key={index} className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Company Name {index < 2 && <span className="text-red-500">*</span>}
                        </label>
                        <Input
                          required={index < 2}
                          value={ref.companyName}
                          onChange={(e) => handleReferenceChange(index, 'companyName', e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Contact Person {index < 2 && <span className="text-red-500">*</span>}
                        </label>
                        <Input
                          required={index < 2}
                          value={ref.contactPerson}
                          onChange={(e) => handleReferenceChange(index, 'contactPerson', e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Contact No {index < 2 && <span className="text-red-500">*</span>}
                        </label>
                        <Input
                          required={index < 2}
                          value={ref.contactNo}
                          onChange={(e) => handleReferenceChange(index, 'contactNo', e.target.value)}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Authorized By <span className="text-red-500">*</span>
                  </label>
                  <Select
                    value={formData.authorizedBy}
                    onValueChange={(value) => handleChange('authorizedBy', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Authorized By" />
                    </SelectTrigger>
                    <SelectContent>
                      {authorizedByOptions.map((option) => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Account Manager <span className="text-red-500">*</span>
                  </label>
                  <Select
                    value={formData.accountManager}
                    onValueChange={(value) => handleChange('accountManager', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Account Manager" />
                    </SelectTrigger>
                    <SelectContent>
                      {accountManagerOptions.map((option) => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Broker Name
                  </label>
                  <Input
                    value={formData.brokerName}
                    onChange={(e) => handleChange('brokerName', e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Party Group <span className="text-red-500">*</span>
                  </label>
                  <Select
                    value={formData.partyGroup}
                    onValueChange={(value) => handleChange('partyGroup', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Party Group" />
                    </SelectTrigger>
                    <SelectContent>
                      {partyGroupOptions.map((option) => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Sales Executive <span className="text-red-500">*</span>
                  </label>
                  <Select
                    value={formData.salesExecutive}
                    onValueChange={(value) => handleChange('salesExecutive', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Sales Executive" />
                    </SelectTrigger>
                    <SelectContent>
                      {salesExecutiveOptions.map((option) => (
                        <SelectItem key={option.id} value={option.name}>
                          {option.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Lead Source <span className="text-red-500">*</span>
                  </label>
                  <Select
                    value={formData.leadSource}
                    onValueChange={(value) => handleChange('leadSource', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Lead Source" />
                    </SelectTrigger>
                    <SelectContent>
                      {leadSourceOptions.map((option) => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Limit <span className="text-red-500">*</span>
                </label>
                <Input
                  type="number"
                  required
                  value={formData.limit}
                  onChange={(e) => handleChange('limit', e.target.value)}
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
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Submitting...' : 'Submit'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}