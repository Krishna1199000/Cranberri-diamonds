"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, X, Filter } from "lucide-react";
import { statusOptions } from "@/lib/utils/inventory";
import { AdvancedFilters, FilterState } from "./AdvancedFilters";

interface InventorySearchProps {
  onSearch: (query: string, status: string, filters?: FilterState) => void;
}

export function InventorySearch({ onSearch }: InventorySearchProps) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    carat: "",
    colors: [],
    clarities: [],
    shapes: [],
    sortBy: "",
    sortOrder: 'desc'
  });

  const handleSearch = () => {
    onSearch(query, status, filters);
  };

  const handleFiltersChange = (newFilters: FilterState) => {
    setFilters(newFilters);
    // Auto-search when filters change
    onSearch(query, status, newFilters);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  return (
    <div className="space-y-4">
      {/* Basic Search Row */}
      <div className="flex flex-col gap-4 md:flex-row">
        <div className="relative flex-1">
          <Input
            placeholder="Search by stock ID, certificate, shape, color..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            className="pr-10"
          />
          {query && (
            <Button
              variant="outline"
              size="icon"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
              onClick={() => {
                setQuery("");
                if (!status && !showAdvancedFilters) onSearch("", "", filters);
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
        
        <div className="w-full md:w-48">
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger>
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Status</SelectItem>
              {statusOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex gap-2">
          <Button 
            variant="outline"
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            className="w-full md:w-auto"
          >
            <Filter className="mr-2 h-4 w-4" />
            {showAdvancedFilters ? 'Hide Filters' : 'Advanced Filters'}
          </Button>
          <Button onClick={handleSearch} className="w-full md:w-auto">
            <Search className="mr-2 h-4 w-4" /> Search
          </Button>
        </div>
      </div>

      {/* Advanced Filters */}
      {showAdvancedFilters && (
        <div className="border-t pt-4">
          <AdvancedFilters 
            onFiltersChange={handleFiltersChange}
            initialFilters={filters}
          />
        </div>
      )}
    </div>
  );
}