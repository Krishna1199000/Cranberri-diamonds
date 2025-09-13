"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { X, RotateCcw } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

// Filter options
const CARAT_OPTIONS = [
  // Whole numbers
  10, 9, 8, 7, 6, 5, 4, 3, 2, 1,
  // Common decimal values
  9.5, 8.5, 7.5, 6.5, 5.5, 4.5, 3.5, 2.5, 1.5,
  9.3, 8.3, 7.3, 6.3, 5.3, 4.3, 3.3, 2.3, 1.3,
  9.7, 8.7, 7.7, 6.7, 5.7, 4.7, 3.7, 2.7, 1.7,
  9.4, 8.4, 7.4, 6.4, 5.4, 4.4, 3.4, 2.4, 1.4,
  9.6, 8.6, 7.6, 6.6, 5.6, 4.6, 3.6, 2.6, 1.6,
  9.2, 8.2, 7.2, 6.2, 5.2, 4.2, 3.2, 2.2, 1.2,
  9.8, 8.8, 7.8, 6.8, 5.8, 4.8, 3.8, 2.8, 1.8,
  9.1, 8.1, 7.1, 6.1, 5.1, 4.1, 3.1, 2.1, 1.1,
  9.9, 8.9, 7.9, 6.9, 5.9, 4.9, 3.9, 2.9, 1.9
].sort((a, b) => b - a); // Sort in descending order

const COLOR_OPTIONS = [
  // Standard colors
  "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z",
  // Fancy colors
  "FANCY Vivid Blue", "Fancy Intense Blue", "Fancy Blue",
  "FANCY Vivid Pink", "Fancy Intense Pink", "Fancy Pink",
  "FANCY Vivid Green", "Fancy Intense Green", "Fancy Green",
  "FANCY Vivid Yellow", "Fancy Intense Yellow", "Fancy Yellow",
  "FANCY Vivid Brown", "Fancy Intense Brown", "Fancy Brown",
  "Champagne Color", "Bluish Green", "Greenish Blue"
];

const CLARITY_OPTIONS = [
  "FL", "IF", "VVS1", "VVS2", "VS1", "VS2", "SI1", "SI2", "SI3", "I1", "I2", "I3"
];

const SHAPE_OPTIONS = [
  "Round", "Old Miner", "Pear", "Marquise", "Oval", "Emerald", "Radiant", 
  "Cushion", "Princess", "Heart", "Asscher", "Triangle", "Half Moon", "Others"
];

export interface FilterState {
  carat: string;
  colors: string[];
  clarities: string[];
  shapes: string[];
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

interface AdvancedFiltersProps {
  onFiltersChange: (filters: FilterState) => void;
  initialFilters?: FilterState;
}

export function AdvancedFilters({ onFiltersChange, initialFilters }: AdvancedFiltersProps) {
  const [filters, setFilters] = useState<FilterState>(
    initialFilters || {
      carat: "",
      colors: [],
      clarities: [],
      shapes: [],
      sortBy: "",
      sortOrder: 'desc'
    }
  );

  const updateFilters = (newFilters: Partial<FilterState>) => {
    const updatedFilters = { ...filters, ...newFilters };
    setFilters(updatedFilters);
    onFiltersChange(updatedFilters);
  };

  const handleCaratChange = (value: string) => {
    updateFilters({ carat: value });
  };

  const handleColorToggle = (color: string) => {
    const newColors = filters.colors.includes(color)
      ? filters.colors.filter(c => c !== color)
      : [...filters.colors, color];
    updateFilters({ colors: newColors });
  };

  const handleClarityToggle = (clarity: string) => {
    const newClarities = filters.clarities.includes(clarity)
      ? filters.clarities.filter(c => c !== clarity)
      : [...filters.clarities, clarity];
    updateFilters({ clarities: newClarities });
  };

  const handleShapeToggle = (shape: string) => {
    const newShapes = filters.shapes.includes(shape)
      ? filters.shapes.filter(s => s !== shape)
      : [...filters.shapes, shape];
    updateFilters({ shapes: newShapes });
  };

  const handleSortChange = (sortBy: string) => {
    updateFilters({ sortBy });
  };

  const handleSortOrderChange = (sortOrder: string) => {
    updateFilters({ sortOrder: sortOrder as 'asc' | 'desc' });
  };

  const resetFilters = () => {
    const resetFilters = {
      carat: "",
      colors: [],
      clarities: [],
      shapes: [],
      sortBy: "",
      sortOrder: 'desc' as const
    };
    setFilters(resetFilters);
    onFiltersChange(resetFilters);
  };

  const removeColor = (color: string) => {
    handleColorToggle(color);
  };

  const removeClarity = (clarity: string) => {
    handleClarityToggle(clarity);
  };

  const removeShape = (shape: string) => {
    handleShapeToggle(shape);
  };

  const hasActiveFilters = filters.carat || filters.colors.length > 0 || filters.clarities.length > 0 || filters.shapes.length > 0 || filters.sortBy;

  return (
    <div className="space-y-4">
      {/* Filter Row */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
        {/* Carat Filter */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Carat</label>
          <Select value={filters.carat} onValueChange={handleCaratChange}>
            <SelectTrigger className="border-gray-300 focus:border-black focus:ring-black">
              <SelectValue placeholder="Select Carat" />
            </SelectTrigger>
            <SelectContent className="max-h-60 overflow-y-auto">
              <SelectItem value="">All Carats</SelectItem>
              {CARAT_OPTIONS.map((carat) => (
                <SelectItem key={carat} value={carat.toString()}>
                  {carat} Carat
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Color Filter */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Color</label>
          <Select value="" onValueChange={() => {}}>
            <SelectTrigger className="border-gray-300 focus:border-black focus:ring-black">
              <SelectValue placeholder={`${filters.colors.length > 0 ? `${filters.colors.length} selected` : 'Select Colors'}`} />
            </SelectTrigger>
            <SelectContent className="max-h-60">
              {COLOR_OPTIONS.map((color) => (
                <div key={color} className="flex items-center space-x-2 px-2 py-1">
                  <Checkbox
                    id={`color-${color}`}
                    checked={filters.colors.includes(color)}
                    onChange={() => handleColorToggle(color)}
                  />
                  <label htmlFor={`color-${color}`} className="text-sm cursor-pointer">
                    {color}
                  </label>
                </div>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Clarity Filter */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Clarity</label>
          <Select value="" onValueChange={() => {}}>
            <SelectTrigger className="border-gray-300 focus:border-black focus:ring-black">
              <SelectValue placeholder={`${filters.clarities.length > 0 ? `${filters.clarities.length} selected` : 'Select Clarity'}`} />
            </SelectTrigger>
            <SelectContent className="max-h-60">
              {CLARITY_OPTIONS.map((clarity) => (
                <div key={clarity} className="flex items-center space-x-2 px-2 py-1">
                  <Checkbox
                    id={`clarity-${clarity}`}
                    checked={filters.clarities.includes(clarity)}
                    onChange={() => handleClarityToggle(clarity)}
                  />
                  <label htmlFor={`clarity-${clarity}`} className="text-sm cursor-pointer">
                    {clarity}
                  </label>
                </div>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Shape Filter */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Shape</label>
          <Select value="" onValueChange={() => {}}>
            <SelectTrigger className="border-gray-300 focus:border-black focus:ring-black">
              <SelectValue placeholder={`${filters.shapes.length > 0 ? `${filters.shapes.length} selected` : 'Select Shapes'}`} />
            </SelectTrigger>
            <SelectContent className="max-h-60">
              {SHAPE_OPTIONS.map((shape) => (
                <div key={shape} className="flex items-center space-x-2 px-2 py-1">
                  <Checkbox
                    id={`shape-${shape}`}
                    checked={filters.shapes.includes(shape)}
                    onChange={() => handleShapeToggle(shape)}
                  />
                  <label htmlFor={`shape-${shape}`} className="text-sm cursor-pointer">
                    {shape}
                  </label>
                </div>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Sort By Filter */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Sort By</label>
          <Select value={filters.sortBy} onValueChange={handleSortChange}>
            <SelectTrigger className="border-gray-300 focus:border-black focus:ring-black">
              <SelectValue placeholder="Sort By" />
            </SelectTrigger>
            <SelectContent className="max-h-60 overflow-y-auto">
              <SelectItem value="">Default</SelectItem>
              <SelectItem value="size">Carat</SelectItem>
              <SelectItem value="color">Color</SelectItem>
              <SelectItem value="clarity">Clarity</SelectItem>
              <SelectItem value="shape">Shape</SelectItem>
              <SelectItem value="pricePerCarat">Price per Carat</SelectItem>
              <SelectItem value="finalAmount">Final Amount</SelectItem>
              <SelectItem value="createdAt">Date Added</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Sort Order Filter */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Order</label>
          <Select value={filters.sortOrder} onValueChange={handleSortOrderChange}>
            <SelectTrigger className="border-gray-300 focus:border-black focus:ring-black">
              <SelectValue placeholder="Sort Order" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="desc">Descending</SelectItem>
              <SelectItem value="asc">Ascending</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Active Filters:</span>
            <Button
              variant="outline"
              size="sm"
              onClick={resetFilters}
              className="text-gray-600 hover:text-gray-800"
            >
              <RotateCcw className="h-4 w-4 mr-1" />
              Reset All
            </Button>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {filters.carat && (
              <Badge variant="secondary" className="flex items-center gap-1">
                Carat: {filters.carat}
                <X 
                  className="h-3 w-3 cursor-pointer" 
                  onClick={() => updateFilters({ carat: "" })}
                />
              </Badge>
            )}
            
            {filters.colors.map((color) => (
              <Badge key={color} variant="secondary" className="flex items-center gap-1">
                Color: {color}
                <X 
                  className="h-3 w-3 cursor-pointer" 
                  onClick={() => removeColor(color)}
                />
              </Badge>
            ))}
            
            {filters.clarities.map((clarity) => (
              <Badge key={clarity} variant="secondary" className="flex items-center gap-1">
                Clarity: {clarity}
                <X 
                  className="h-3 w-3 cursor-pointer" 
                  onClick={() => removeClarity(clarity)}
                />
              </Badge>
            ))}
            
            {filters.shapes.map((shape) => (
              <Badge key={shape} variant="secondary" className="flex items-center gap-1">
                Shape: {shape}
                <X 
                  className="h-3 w-3 cursor-pointer" 
                  onClick={() => removeShape(shape)}
                />
              </Badge>
            ))}
            
            {filters.sortBy && (
              <Badge variant="secondary" className="flex items-center gap-1">
                Sort: {filters.sortBy} ({filters.sortOrder})
                <X 
                  className="h-3 w-3 cursor-pointer" 
                  onClick={() => updateFilters({ sortBy: "" })}
                />
              </Badge>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
