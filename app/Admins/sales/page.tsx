"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { SalesAnalytics } from "@/components/sales/SalesAnalytics"
import { SalesTable } from "@/components/sales/SalesTable"
import { EmployeeRankings } from "@/components/sales/EmployeeRankings"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover"
import { Checkbox } from "@/components/ui/checkbox"
import { Award, ArrowLeft, ChevronDown, Users, Building2 } from "lucide-react"
import { AdminLayout } from "@/components/layout/AdminLayout"
import Link from "next/link"
import { SaleEntry } from "@/types/sales"

export default function SalesPage() {
  const [showRankings, setShowRankings] = useState(false)
  const [salesEntries, setSalesEntries] = useState<any[]>([])
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [period, setPeriod] = useState("7")
  const [customPeriod, setCustomPeriod] = useState({ start: "", end: "" })
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>(["all"])
  const [companies, setCompanies] = useState<string[]>([])
  const [selectedCompanies, setSelectedCompanies] = useState<string[]>([])
  const [colors, setColors] = useState<string[]>([])
  const [clarities, setClarities] = useState<string[]>([])
  const [shapes, setShapes] = useState<string[]>([])
  const [labs, setLabs] = useState<string[]>([])
  const [states, setStates] = useState<string[]>([])
  const [caratRange, setCaratRange] = useState<{ min: string; max: string }>({ min: "", max: "" })
  const [employees, setEmployees] = useState<{ id: string; name: string }[]>([])
  const [availableShapes, setAvailableShapes] = useState<string[]>([])
  const [availableLabs, setAvailableLabs] = useState<string[]>([])
  const [availableStates, setAvailableStates] = useState<string[]>([])

  const refreshData = () => {
    setRefreshTrigger(prev => prev + 1)
  }

  // Fetch companies for filter (customers/vendors)
  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const resp = await fetch("/api/companies")
        if (!resp.ok) return
        const data = await resp.json()
        if (Array.isArray(data)) {
          setCompanies(data.map((c: any) => c.companyName).filter(Boolean))
        }
      } catch (err) {
        console.error("Error fetching companies", err)
      }
    }
    fetchCompanies()
  }, [])

  useEffect(() => {
    const fetchEmps = async () => {
      try {
        const resp = await fetch("/api/employees")
        if (!resp.ok) return
        const data = await resp.json()
        if (data.success && Array.isArray(data.employees)) {
          setEmployees(data.employees)
        }
      } catch (err) {
        console.error("Error fetching employees", err)
      }
    }
    fetchEmps()
  }, [])

  const fetchSalesData = useCallback(async () => {
    try {
      let url = `/api/sales?period=${period}`
      if (period === "custom" && customPeriod.start && customPeriod.end) {
        url = `/api/sales?start=${customPeriod.start}&end=${customPeriod.end}`
      }
      if (selectedEmployees.length > 0 && !selectedEmployees.includes("all")) {
        url += `&employeeIds=${selectedEmployees.join(",")}`
      }
      if (selectedCompanies.length > 0) {
        url += `&companies=${selectedCompanies.join(",")}`
      }
      if (colors.length > 0) {
        url += `&colors=${colors.join(",")}`
      }
      if (clarities.length > 0) {
        url += `&clarities=${clarities.join(",")}`
      }
      if (shapes.length > 0) {
        url += `&shapes=${shapes.join(",")}`
      }
      if (labs.length > 0) {
        url += `&labs=${labs.join(",")}`
      }
      if (states.length > 0) {
        url += `&states=${states.join(",")}`
      }
      if (caratRange.min) {
        url += `&caratMin=${caratRange.min}`
      }
      if (caratRange.max) {
        url += `&caratMax=${caratRange.max}`
      }

      const response = await fetch(url)
      const data = await response.json()
      
      if (data.success && Array.isArray(data.entries)) {
        setSalesEntries(data.entries)
      } else {
        setSalesEntries([])
        console.error("Invalid data format received:", data)
      }
    } catch (error) {
      console.error("Error fetching sales data:", error)
      setSalesEntries([])
    }
  }, [period, customPeriod, selectedEmployees, selectedCompanies, colors, clarities, shapes, labs, states, caratRange])

  // Fetch unique values for filters
  useEffect(() => {
    const fetchFilterOptions = async () => {
      try {
        const resp = await fetch("/api/sales?period=365") // Get all data for filter options
        if (!resp.ok) return
        const data = await resp.json()
        if (data.success && Array.isArray(data.entries)) {
          const uniqueShapes = new Set<string>()
          const uniqueLabs = new Set<string>()
          const uniqueStates = new Set<string>()
          
          data.entries.forEach((entry: any) => {
            if (entry.state) uniqueStates.add(entry.state)
            entry.saleItems?.forEach((item: any) => {
              if (item.shape) uniqueShapes.add(item.shape)
              if (item.lab) uniqueLabs.add(item.lab)
            })
          })
          
          setAvailableShapes(Array.from(uniqueShapes).sort())
          setAvailableLabs(Array.from(uniqueLabs).sort())
          setAvailableStates(Array.from(uniqueStates).sort())
        }
      } catch (err) {
        console.error("Error fetching filter options", err)
      }
    }
    fetchFilterOptions()
  }, [])

  useEffect(() => {
    fetchSalesData()
  }, [fetchSalesData, refreshTrigger])

  // Format data for analytics/graphs (ensures admin sees all employees)
  const analyticsData: SaleEntry[] = useMemo(() => {
    return (salesEntries || []).map((entry: any) => {
      const firstItem = entry.saleItems?.[0]
      return {
        id: entry.id,
        date: new Date(entry.saleDate).toLocaleDateString(),
        rawDate: new Date(entry.saleDate),
        employeeId: entry.employee?.id ?? "unknown",
        employeeName: entry.employee?.name ?? "Unknown",
        trackingId: entry.trackingId ?? "-",
        companyName: entry.companyName ?? (entry.isNoSale ? "No Sale" : "-"),
        isNoSale: Boolean(entry.isNoSale),
        saleValue: entry.totalSaleValue ?? 0,
        purchaseValue: entry.purchaseValue ?? null,
        profit: entry.profit ?? null,
        profitMargin: entry.profitMargin ?? null,
        shipmentCarrier: entry.shipmentCarrier ?? "N/A",
        details: {
          carat: firstItem?.carat,
          color: firstItem?.color,
          clarity: firstItem?.clarity,
        },
        description: entry.description ?? "",
        paymentReceived: entry.paymentReceived ?? false,
      }
    })
  }, [salesEntries])

  return (
    <AdminLayout>
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <Link href="/Admins">
            <Button variant="outline" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Button>
          </Link>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Sales Dashboard</h1>
        </div>
        <Button
          onClick={() => setShowRankings(!showRankings)}
          className="flex items-center gap-2"
          variant="outline"
        >
          <Award className="w-5 h-5" />
          {showRankings ? "Hide Rankings" : "Show Rankings"}
        </Button>
      </div>

      {/* Filters */}
      <div className="mb-6 p-4 border rounded-lg bg-white shadow-sm">
        <h2 className="text-xl font-semibold mb-4">Filter Sales Data</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        <div className="space-y-2">
          <label className="block text-sm font-medium">Employees</label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="outline"
                className="w-full justify-between"
              >
                <span className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  {selectedEmployees.includes("all") || selectedEmployees.length === 0
                    ? "All employees"
                    : `${selectedEmployees.length} selected`}
                </span>
                <ChevronDown className="w-4 h-4 opacity-60" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-3 space-y-2">
              <div className="font-semibold text-sm mb-1">Select employees</div>
              <div className="space-y-1 max-h-56 overflow-y-auto">
                <label className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={selectedEmployees.includes("all")}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedEmployees(["all"])
                      } else {
                        setSelectedEmployees([])
                      }
                    }}
                  />
                  <span>All employees</span>
                </label>
                {employees.map((emp) => (
                  <label key={emp.id} className="flex items-center gap-2 text-sm">
                    <Checkbox
                      checked={
                        !selectedEmployees.includes("all") &&
                        selectedEmployees.includes(emp.id)
                      }
                      onChange={(e) => {
                        const checked = e.target.checked
                        setSelectedEmployees((prev) => {
                          if (checked) {
                            const base = prev.includes("all") ? [] : prev
                            return [...base, emp.id]
                          } else {
                            return prev.filter((id) => id !== emp.id)
                          }
                        })
                      }}
                    />
                    <span>{emp.name}</span>
                  </label>
                ))}
              </div>
            </PopoverContent>
          </Popover>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium">Companies</label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="outline"
                className="w-full justify-between"
              >
                <span className="flex items-center gap-2">
                  <Building2 className="w-4 h-4" />
                  {selectedCompanies.length === 0
                    ? "All companies"
                    : `${selectedCompanies.length} selected`}
                </span>
                <ChevronDown className="w-4 h-4 opacity-60" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-3 space-y-2">
              <div className="font-semibold text-sm mb-1">Select companies</div>
              <div className="space-y-1 max-h-56 overflow-y-auto">
                {companies.map((c) => (
                  <label key={c} className="flex items-center gap-2 text-sm">
                    <Checkbox
                      checked={selectedCompanies.includes(c)}
                      onChange={(e) => {
                        const checked = e.target.checked
                        setSelectedCompanies((prev) => {
                          if (checked) {
                            return [...prev, c]
                          } else {
                            return prev.filter((v) => v !== c)
                          }
                        })
                      }}
                    />
                    <span>{c}</span>
                  </label>
                ))}
              </div>
            </PopoverContent>
          </Popover>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium">State</label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="outline"
                className="w-full justify-between"
              >
                <span className="flex items-center gap-2">
                  {states.length === 0 ? "All states" : `${states.length} selected`}
                </span>
                <ChevronDown className="w-4 h-4 opacity-60" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-3 space-y-2">
              <div className="font-semibold text-sm mb-1">Select states</div>
              <div className="space-y-1 max-h-56 overflow-y-auto">
                {availableStates.map((s) => (
                  <label key={s} className="flex items-center gap-2 text-sm">
                    <Checkbox
                      checked={states.includes(s)}
                      onChange={(e) => {
                        const checked = e.target.checked
                        setStates((prev) => {
                          if (checked) {
                            return [...prev, s]
                          } else {
                            return prev.filter((v) => v !== s)
                          }
                        })
                      }}
                    />
                    <span>{s}</span>
                  </label>
                ))}
              </div>
            </PopoverContent>
          </Popover>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium">Shape</label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="outline"
                className="w-full justify-between"
              >
                <span className="flex items-center gap-2">
                  {shapes.length === 0 ? "All shapes" : `${shapes.length} selected`}
                </span>
                <ChevronDown className="w-4 h-4 opacity-60" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-3 space-y-2">
              <div className="font-semibold text-sm mb-1">Select shapes</div>
              <div className="space-y-1 max-h-56 overflow-y-auto">
                {availableShapes.map((s) => (
                  <label key={s} className="flex items-center gap-2 text-sm">
                    <Checkbox
                      checked={shapes.includes(s)}
                      onChange={(e) => {
                        const checked = e.target.checked
                        setShapes((prev) => {
                          if (checked) {
                            return [...prev, s]
                          } else {
                            return prev.filter((v) => v !== s)
                          }
                        })
                      }}
                    />
                    <span>{s}</span>
                  </label>
                ))}
              </div>
            </PopoverContent>
          </Popover>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium">Lab</label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="outline"
                className="w-full justify-between"
              >
                <span className="flex items-center gap-2">
                  {labs.length === 0 ? "All labs" : `${labs.length} selected`}
                </span>
                <ChevronDown className="w-4 h-4 opacity-60" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-3 space-y-2">
              <div className="font-semibold text-sm mb-1">Select labs</div>
              <div className="space-y-1 max-h-56 overflow-y-auto">
                {availableLabs.map((l) => (
                  <label key={l} className="flex items-center gap-2 text-sm">
                    <Checkbox
                      checked={labs.includes(l)}
                      onChange={(e) => {
                        const checked = e.target.checked
                        setLabs((prev) => {
                          if (checked) {
                            return [...prev, l]
                          } else {
                            return prev.filter((v) => v !== l)
                          }
                        })
                      }}
                    />
                    <span>{l}</span>
                  </label>
                ))}
              </div>
            </PopoverContent>
          </Popover>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium">Colors</label>
          <Input
            placeholder="Comma separated (e.g. D,E,F)"
            value={colors.join(",")}
            onChange={(e) => setColors(e.target.value.split(",").map(s => s.trim()).filter(Boolean))}
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium">Clarities</label>
          <Input
            placeholder="Comma separated (e.g. IF,VVS1)"
            value={clarities.join(",")}
            onChange={(e) => setClarities(e.target.value.split(",").map(s => s.trim()).filter(Boolean))}
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium">Carat Range</label>
          <div className="flex gap-2">
            <Input
              placeholder="Min"
              value={caratRange.min}
              onChange={(e) => setCaratRange(prev => ({ ...prev, min: e.target.value }))}
            />
            <Input
              placeholder="Max"
              value={caratRange.max}
              onChange={(e) => setCaratRange(prev => ({ ...prev, max: e.target.value }))}
            />
          </div>
        </div>
        </div>
      </div>

          {showRankings && (
            <div className="mb-6">
          <EmployeeRankings salesData={analyticsData} />
            </div>
          )}
            
          <div className="space-y-6">
            <SalesAnalytics 
          data={analyticsData}
              period={period}
              setPeriod={setPeriod}
              customPeriod={customPeriod}
              setCustomPeriod={setCustomPeriod}
            selectedEmployee={"all"} // keep existing prop signature; analytics scoping handled by API filters
            setSelectedEmployee={() => {}}
            />
            
            <SalesTable 
          salesData={salesEntries} 
              refreshData={refreshData} 
            />
          </div>
    </AdminLayout>
  )
}