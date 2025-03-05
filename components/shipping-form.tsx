"use client"

import { useState } from 'react'
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

type CountriesType = {
  [key: string]: {
    [key: string]: string[]
  }
}

const countries: CountriesType = {
  "USA": {
    "California": ["Los Angeles", "San Francisco", "San Diego"],
    "New York": ["New York City", "Buffalo", "Albany"],
    "Texas": ["Houston", "Austin", "Dallas"]
  },
  "India": {
    "Maharashtra": ["Mumbai", "Pune", "Nagpur"],
    "Delhi": ["New Delhi", "North Delhi", "South Delhi"],
    "Karnataka": ["Bangalore", "Mysore", "Hubli"]
  },
  "Australia": {
    "New South Wales": ["Sydney", "Newcastle", "Wollongong"],
    "Victoria": ["Melbourne", "Geelong", "Ballarat"],
    "Queensland": ["Brisbane", "Gold Coast", "Cairns"]
  },
  "United Kingdom": {
    "England": ["London", "Manchester", "Birmingham"],
    "Scotland": ["Edinburgh", "Glasgow", "Aberdeen"],
    "Wales": ["Cardiff", "Swansea", "Newport"]
  },
  "Hong Kong": {
    "Hong Kong Island": ["Central", "Wan Chai", "Causeway Bay"],
    "Kowloon": ["Tsim Sha Tsui", "Mong Kok", "Yau Ma Tei"],
    "New Territories": ["Sha Tin", "Tsuen Wan", "Tuen Mun"]
  }
}

const shippingDurations = [
  "Immediate",
  "1 Day",
  "2 Days",
  "3 Days",
  "4 Days",
  "5 Days",
  "6 Days",
  "7 Days",
  "8 Days",
  "9 Days",
  "10 Days",
  "11 Days",
  "12 Days",
  "13 Days",
  "14 Days",
  "15 Days"
]

const carriers = ["FedEx", "UPS", "USPS"]

export default function ShippingForm({ onClose }: { onClose: () => void }) {
  const [country, setCountry] = useState("")
  const [state, setState] = useState("")
  const [city, setCity] = useState("")
  const [duration, setDuration] = useState("")
  const [carrier, setCarrier] = useState("")
  const [trackingId, setTrackingId] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!country || !state || !city || !duration || !carrier) {
      toast.error("Please fill in all required fields")
      return
    }

    try {
      const response = await fetch('/api/shipments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          country,
          state,
          city,
          duration,
          carrier,
          trackingId
        }),
      })

      const data = await response.json()

      if (data.success) {
        toast.success('Shipment created successfully')
        onClose()
      } else {
        toast.error(data.message || 'Failed to create shipment')
      }
    } catch {
      toast.error('Something went wrong')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div>
          <Select value={country} onValueChange={setCountry}>
            <SelectTrigger>
              <SelectValue placeholder="Select Country" />
            </SelectTrigger>
            <SelectContent>
              {Object.keys(countries).map((country) => (
                <SelectItem key={country} value={country}>
                  {country}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {country && (
          <div>
            <Select value={state} onValueChange={setState}>
              <SelectTrigger>
                <SelectValue placeholder="Select State" />
              </SelectTrigger>
              <SelectContent>
                {Object.keys(countries[country as keyof typeof countries]).map((state) => (
                  <SelectItem key={state} value={state}>
                    {state}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {state && (
          <div>
            <Select value={city} onValueChange={setCity}>
              <SelectTrigger>
                <SelectValue placeholder="Select City" />
              </SelectTrigger>
              <SelectContent>
                {countries[country as keyof typeof countries][state].map((city) => (
                  <SelectItem key={city} value={city}>
                    {city}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <div>
          <Select value={duration} onValueChange={setDuration}>
            <SelectTrigger>
              <SelectValue placeholder="Select Shipping Duration" />
            </SelectTrigger>
            <SelectContent>
              {shippingDurations.map((duration) => (
                <SelectItem key={duration} value={duration}>
                  {duration}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Select value={carrier} onValueChange={setCarrier}>
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

        <div>
          <Input
            placeholder="Tracking ID"
            value={trackingId}
            onChange={(e) => setTrackingId(e.target.value)}
          />
        </div>
      </div>

      <div className="flex justify-end space-x-4">
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit">
          Create Shipment
        </Button>
      </div>
    </form>
  )
}