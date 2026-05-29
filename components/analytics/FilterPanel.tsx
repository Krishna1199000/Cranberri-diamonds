"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { CalendarIcon, X, Filter, RotateCcw } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

// Filter interfaces
export interface AnalyticsFilters {
  users: string[];
  companies: string[];
  states: string[];
  shapes: string[];
  caratRange: {
    min: number | null;
    max: number | null;
  };
  clarityGrades: string[];
  colourWhite: string[];
  colourFancy: string[];
  dateRange: {
    startDate: Date | null;
    endDate: Date | null;
  };
  labs: string[];
}

interface FilterPanelProps {
  filters: AnalyticsFilters;
  onFiltersChange: (filters: AnalyticsFilters) => void;
  onApplyFilters: () => void;
  loading?: boolean;
  className?: string;
}

// Static filter options
const SHAPES = [
  'Round', 'Princess', 'Oval', 'Emerald', 'Pear', 'Cushion', 
  'Radiant', 'Marquise', 'Heart', 'Asscher'
];

const CLARITY_GRADES = [
  'FL', 'IF', 'VVS1', 'VVS2', 'VS1', 'VS2', 'SI1', 'SI2', 'I1', 'I2', 'I3'
];

const WHITE_COLOURS = [
  'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'
];

const FANCY_COLOURS = [
  'Fancy Yellow', 'Fancy Pink', 'Fancy Blue', 'Fancy Green', 
  'Fancy Brown', 'Fancy Orange', 'Fancy Red', 'Fancy Purple', 
  'Fancy Violet', 'Fancy Gray', 'Fancy Black', 'Fancy White'
];

const LABS = ['IGI', 'GIA', 'Non-Cert', 'Other'];

const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
  'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry',
];

/** Common client countries (used with state filter — matches invoice/memo `country` field) */
const CLIENT_COUNTRIES = [
  'India',
  'United States',
  'United Kingdom',
  'United Arab Emirates',
  'Hong Kong',
  'Belgium',
  'Israel',
  'China',
  'Singapore',
  'Switzerland',
  'Thailand',
  'Japan',
  'Australia',
  'Canada',
  'Germany',
  'France',
  'Italy',
  'Netherlands',
];

const STATE_AND_COUNTRY_OPTIONS = [...INDIAN_STATES, ...CLIENT_COUNTRIES];

export function FilterPanel({ 
  filters, 
  onFiltersChange, 
  onApplyFilters, 
  loading = false,
  className 
}: FilterPanelProps) {
  const [users, setUsers] = useState<Array<{ id: string; name: string; email: string }>>([]);
  const [companies, setCompanies] = useState<Array<{ id: string; name: string }>>([]);
  const [availableStates] = useState<string[]>(STATE_AND_COUNTRY_OPTIONS);
  const [loadingData, setLoadingData] = useState(false);

  const normalizeUsers = (payload: unknown): Array<{ id: string; name: string; email: string }> => {
    const candidate = Array.isArray(payload)
      ? payload
      : (payload as { employees?: unknown })?.employees;

    if (!Array.isArray(candidate)) return [];

    return candidate
      .filter((item): item is { id: string; name?: string; email?: string } => {
        return Boolean(item && typeof item === "object" && "id" in item);
      })
      .map((item) => ({
        id: String(item.id),
        name: item.name || item.email || "Unknown User",
        email: item.email || "",
      }));
  };

  const normalizeCompanies = (payload: unknown): Array<{ id: string; name: string }> => {
    const candidate = Array.isArray(payload)
      ? payload
      : (payload as { companies?: unknown })?.companies;

    if (!Array.isArray(candidate)) return [];

    return candidate
      .filter((item): item is { id: string; name?: string; companyName?: string } => {
        return Boolean(item && typeof item === "object" && "id" in item);
      })
      .map((item) => ({
        id: String(item.id),
        name: item.name || item.companyName || "Unknown Company",
      }));
  };

  // Fetch users and companies on mount
  useEffect(() => {
    fetchFilterData();
  }, []);

  // Filter companies based on selected users
  useEffect(() => {
    if (filters.users.length > 0) {
      fetchCompaniesForUsers(filters.users);
    } else {
      // Reset to all companies
      fetchAllCompanies();
    }
  }, [filters.users]);

  const fetchFilterData = async () => {
    setLoadingData(true);
    try {
      // Fetch users
      const usersResponse = await fetch('/api/employees');
      if (usersResponse.ok) {
        const usersData = await usersResponse.json();
        setUsers(normalizeUsers(usersData));
      } else {
        setUsers([]);
      }

      // Fetch all companies initially
      await fetchAllCompanies();
    } catch (error) {
      console.error('Error fetching filter data:', error);
    } finally {
      setLoadingData(false);
    }
  };

  const fetchAllCompanies = async () => {
    try {
      const companiesResponse = await fetch('/api/companies/search');
      if (companiesResponse.ok) {
        const companiesData = await companiesResponse.json();
        setCompanies(normalizeCompanies(companiesData));
      } else {
        setCompanies([]);
      }
    } catch (error) {
      console.error('Error fetching companies:', error);
      setCompanies([]);
    }
  };

  const fetchCompaniesForUsers = async (userIds: string[]) => {
    try {
      const response = await fetch('/api/analytics/companies-by-users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userIds })
      });
      
      if (response.ok) {
        const companiesData = await response.json();
        setCompanies(normalizeCompanies(companiesData));
      } else {
        setCompanies([]);
      }
    } catch (error) {
      console.error('Error fetching companies for users:', error);
      setCompanies([]);
    }
  };

  const updateFilters = (updates: Partial<AnalyticsFilters>) => {
    onFiltersChange({ ...filters, ...updates });
  };

  const handleMultiSelectChange = (
    value: string, 
    currentValues: string[], 
    field: keyof AnalyticsFilters
  ) => {
    const newValues = currentValues.includes(value)
      ? currentValues.filter(v => v !== value)
      : [...currentValues, value];
    
    updateFilters({ [field]: newValues });
  };

  const resetFilters = () => {
    const defaultFilters: AnalyticsFilters = {
      users: [],
      companies: [],
      states: [],
      shapes: [],
      caratRange: { min: null, max: null },
      clarityGrades: [],
      colourWhite: [],
      colourFancy: [],
      dateRange: { startDate: null, endDate: null },
      labs: []
    };
    onFiltersChange(defaultFilters);
  };

  const getSelectedCount = () => {
    let count = 0;
    count += filters.users.length;
    count += filters.companies.length;
    count += filters.states.length;
    count += filters.shapes.length;
    count += filters.clarityGrades.length;
    count += filters.colourWhite.length;
    count += filters.colourFancy.length;
    count += filters.labs.length;
    if (filters.caratRange.min !== null || filters.caratRange.max !== null) count++;
    if (filters.dateRange.startDate || filters.dateRange.endDate) count++;
    return count;
  };

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
            {getSelectedCount() > 0 && (
              <Badge variant="secondary">{getSelectedCount()} applied</Badge>
            )}
          </CardTitle>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={resetFilters}
              disabled={loading}
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset
            </Button>
            <Button
              onClick={onApplyFilters}
              disabled={loading}
              size="sm"
            >
              Apply Filters
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {loadingData ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Users Filter */}
            <div className="space-y-2">
              <Label>Select Users</Label>
              <div className="space-y-2 max-h-40 overflow-y-auto border rounded-md p-2">
                {users.map((user) => (
                  <div key={user.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`user-${user.id}`}
                      checked={filters.users.includes(user.id)}
                      onCheckedChange={() => 
                        handleMultiSelectChange(user.id, filters.users, 'users')
                      }
                    />
                    <Label
                      htmlFor={`user-${user.id}`}
                      className="text-sm cursor-pointer"
                    >
                      {user.name}
                    </Label>
                  </div>
                ))}
              </div>
              {filters.users.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {filters.users.slice(0, 3).map((userId) => {
                    const user = users.find(u => u.id === userId);
                    return user ? (
                      <Badge key={userId} variant="secondary" className="text-xs">
                        {user.name}
                        <X 
                          className="h-3 w-3 ml-1 cursor-pointer" 
                          onClick={() => handleMultiSelectChange(userId, filters.users, 'users')}
                        />
                      </Badge>
                    ) : null;
                  })}
                  {filters.users.length > 3 && (
                    <Badge variant="secondary" className="text-xs">
                      +{filters.users.length - 3} more
                    </Badge>
                  )}
                </div>
              )}
            </div>

            {/* Companies Filter */}
            <div className="space-y-2">
              <Label>Company Names</Label>
              <div className="space-y-2 max-h-40 overflow-y-auto border rounded-md p-2">
                {companies.map((company) => (
                  <div key={company.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`company-${company.id}`}
                      checked={filters.companies.includes(company.id)}
                      onCheckedChange={() => 
                        handleMultiSelectChange(company.id, filters.companies, 'companies')
                      }
                    />
                    <Label
                      htmlFor={`company-${company.id}`}
                      className="text-sm cursor-pointer"
                    >
                      {company.name}
                    </Label>
                  </div>
                ))}
              </div>
              {filters.companies.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {filters.companies.slice(0, 2).map((companyId) => {
                    const company = companies.find(c => c.id === companyId);
                    return company ? (
                      <Badge key={companyId} variant="secondary" className="text-xs">
                        {company.name}
                        <X 
                          className="h-3 w-3 ml-1 cursor-pointer" 
                          onClick={() => handleMultiSelectChange(companyId, filters.companies, 'companies')}
                        />
                      </Badge>
                    ) : null;
                  })}
                  {filters.companies.length > 2 && (
                    <Badge variant="secondary" className="text-xs">
                      +{filters.companies.length - 2} more
                    </Badge>
                  )}
                </div>
              )}
            </div>

            {/* State / Country Filter */}
            <div className="space-y-2">
              <Label>State / Country</Label>
              <div className="space-y-2 max-h-40 overflow-y-auto border rounded-md p-2">
                {availableStates.map((state) => (
                  <div key={state} className="flex items-center space-x-2">
                    <Checkbox
                      id={`state-${state}`}
                      checked={filters.states.includes(state)}
                      onCheckedChange={() => 
                        handleMultiSelectChange(state, filters.states, 'states')
                      }
                    />
                    <Label
                      htmlFor={`state-${state}`}
                      className="text-sm cursor-pointer"
                    >
                      {state}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Shapes Filter */}
            <div className="space-y-2">
              <Label>Shapes</Label>
              <div className="grid grid-cols-2 gap-1">
                {SHAPES.map((shape) => (
                  <div key={shape} className="flex items-center space-x-2">
                    <Checkbox
                      id={`shape-${shape}`}
                      checked={filters.shapes.includes(shape)}
                      onCheckedChange={() => 
                        handleMultiSelectChange(shape, filters.shapes, 'shapes')
                      }
                    />
                    <Label
                      htmlFor={`shape-${shape}`}
                      className="text-sm cursor-pointer"
                    >
                      {shape}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Carat Range */}
            <div className="space-y-2">
              <Label>Carat Range</Label>
              <div className="flex space-x-2">
                <Input
                  type="number"
                  placeholder="Min"
                  step="0.01"
                  value={filters.caratRange.min || ''}
                  onChange={(e) => 
                    updateFilters({
                      caratRange: {
                        ...filters.caratRange,
                        min: e.target.value ? parseFloat(e.target.value) : null
                      }
                    })
                  }
                />
                <Input
                  type="number"
                  placeholder="Max"
                  step="0.01"
                  value={filters.caratRange.max || ''}
                  onChange={(e) => 
                    updateFilters({
                      caratRange: {
                        ...filters.caratRange,
                        max: e.target.value ? parseFloat(e.target.value) : null
                      }
                    })
                  }
                />
              </div>
            </div>

            {/* Clarity Grades */}
            <div className="space-y-2">
              <Label>Clarity</Label>
              <div className="grid grid-cols-3 gap-1">
                {CLARITY_GRADES.map((clarity) => (
                  <div key={clarity} className="flex items-center space-x-2">
                    <Checkbox
                      id={`clarity-${clarity}`}
                      checked={filters.clarityGrades.includes(clarity)}
                      onCheckedChange={() => 
                        handleMultiSelectChange(clarity, filters.clarityGrades, 'clarityGrades')
                      }
                    />
                    <Label
                      htmlFor={`clarity-${clarity}`}
                      className="text-sm cursor-pointer"
                    >
                      {clarity}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {/* White Colours */}
            <div className="space-y-2">
              <Label>White Colours</Label>
              <div className="grid grid-cols-4 gap-1">
                {WHITE_COLOURS.slice(0, 12).map((colour) => (
                  <div key={colour} className="flex items-center space-x-1">
                    <Checkbox
                      id={`white-${colour}`}
                      checked={filters.colourWhite.includes(colour)}
                      onCheckedChange={() => 
                        handleMultiSelectChange(colour, filters.colourWhite, 'colourWhite')
                      }
                    />
                    <Label
                      htmlFor={`white-${colour}`}
                      className="text-xs cursor-pointer"
                    >
                      {colour}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Fancy Colours */}
            <div className="space-y-2">
              <Label>Fancy Colours</Label>
              <div className="space-y-1">
                {FANCY_COLOURS.map((colour) => (
                  <div key={colour} className="flex items-center space-x-2">
                    <Checkbox
                      id={`fancy-${colour}`}
                      checked={filters.colourFancy.includes(colour)}
                      onCheckedChange={() => 
                        handleMultiSelectChange(colour, filters.colourFancy, 'colourFancy')
                      }
                    />
                    <Label
                      htmlFor={`fancy-${colour}`}
                      className="text-sm cursor-pointer"
                    >
                      {colour}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Date Range */}
            <div className="space-y-2">
              <Label>Date Range</Label>
              <div className="flex space-x-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "justify-start text-left font-normal",
                        !filters.dateRange.startDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {filters.dateRange.startDate ? (
                        format(filters.dateRange.startDate, "PPP")
                      ) : (
                        <span>Start date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={filters.dateRange.startDate || undefined}
                      onSelect={(date) => 
                        updateFilters({
                          dateRange: { ...filters.dateRange, startDate: date || null }
                        })
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "justify-start text-left font-normal",
                        !filters.dateRange.endDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {filters.dateRange.endDate ? (
                        format(filters.dateRange.endDate, "PPP")
                      ) : (
                        <span>End date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={filters.dateRange.endDate || undefined}
                      onSelect={(date) => 
                        updateFilters({
                          dateRange: { ...filters.dateRange, endDate: date || null }
                        })
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* Labs Filter */}
            <div className="space-y-2">
              <Label>Labs</Label>
              <div className="grid grid-cols-2 gap-1">
                {LABS.map((lab) => (
                  <div key={lab} className="flex items-center space-x-2">
                    <Checkbox
                      id={`lab-${lab}`}
                      checked={filters.labs.includes(lab)}
                      onCheckedChange={() => 
                        handleMultiSelectChange(lab, filters.labs, 'labs')
                      }
                    />
                    <Label
                      htmlFor={`lab-${lab}`}
                      className="text-sm cursor-pointer"
                    >
                      {lab}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}