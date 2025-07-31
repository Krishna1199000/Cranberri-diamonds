"use client";

import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Search, CheckCircle, XCircle, Building, Phone, Mail, Globe } from "lucide-react";
import { toast } from "sonner";

interface SearchResult {
  id: string;
  companyName: string;
  phoneNo: string;
  email: string;
  website?: string;
  ownerName?: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  createdAt: string;
}

interface SearchResponse {
  success: boolean;
  found: boolean;
  count: number;
  results: SearchResult[];
}

export function CustomerVendorSearch() {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchType, setSearchType] = useState("companyName");
  const [loading, setLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResponse | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const searchOptions = [
    { value: "companyName", label: "Company Name", icon: Building },
    { value: "phoneNumber", label: "Phone Number", icon: Phone },
    { value: "email", label: "Email", icon: Mail },
    { value: "website", label: "Website", icon: Globe },
  ];

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      toast.error("Please enter a search term");
      return;
    }

    setLoading(true);
    setHasSearched(false);
    
    try {
      const response = await fetch('/api/companies/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          searchTerm: searchTerm.trim(),
          searchType
        }),
        credentials: 'include'
      });

      const data: SearchResponse = await response.json();
      
      if (data.success) {
        setSearchResults(data);
        setHasSearched(true);
        
        if (data.found) {
          toast.success(`Found ${data.count} result(s)`);
        } else {
          toast.info("No results found");
        }
      } else {
        toast.error("Search failed");
      }
    } catch (error) {
      console.error('Search error:', error);
      toast.error("Failed to perform search");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const getSelectedIcon = () => {
    const option = searchOptions.find(opt => opt.value === searchType);
    const IconComponent = option?.icon || Building;
    return <IconComponent className="h-4 w-4" />;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Customer/Vendor Search
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="searchType">Search Type</Label>
              <Select value={searchType} onValueChange={setSearchType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select search type" />
                </SelectTrigger>
                <SelectContent>
                  {searchOptions.map((option) => {
                    const IconComponent = option.icon;
                    return (
                      <SelectItem key={option.value} value={option.value}>
                        <div className="flex items-center gap-2">
                          <IconComponent className="h-4 w-4" />
                          {option.label}
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="searchTerm">Search Term</Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                    {getSelectedIcon()}
                  </div>
                  <Input
                    id="searchTerm"
                    type="text"
                    placeholder={`Enter ${searchOptions.find(opt => opt.value === searchType)?.label.toLowerCase()}`}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="pl-10"
                  />
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>&nbsp;</Label>
              <Button 
                onClick={handleSearch} 
                disabled={loading}
                className="w-full"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Searching...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Search className="h-4 w-4" />
                    Search
                  </div>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Search Results */}
      {hasSearched && searchResults && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {searchResults.found ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <XCircle className="h-5 w-5 text-red-500" />
              )}
              Search Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Badge variant={searchResults.found ? "default" : "secondary"}>
                  {searchResults.found ? "FOUND" : "NOT FOUND"}
                </Badge>
                <span className="text-sm text-gray-600">
                  {searchResults.count} result(s) for &ldquo;{searchTerm}&rdquo;
                </span>
              </div>

              {searchResults.found && searchResults.results.length > 0 && (
                <div className="space-y-4">
                  {searchResults.results.map((result) => (
                    <Card key={result.id} className="border-l-4 border-l-green-500">
                      <CardContent className="pt-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <Building className="h-4 w-4 text-gray-500" />
                              <span className="font-semibold">{result.companyName}</span>
                            </div>
                            {result.ownerName && (
                              <div className="text-sm text-gray-600">
                                Owner: {result.ownerName}
                              </div>
                            )}
                            <div className="flex items-center gap-2">
                              <Phone className="h-4 w-4 text-gray-500" />
                              <span className="text-sm">{result.phoneNo}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Mail className="h-4 w-4 text-gray-500" />
                              <span className="text-sm">{result.email}</span>
                            </div>
                            {result.website && (
                              <div className="flex items-center gap-2">
                                <Globe className="h-4 w-4 text-gray-500" />
                                <span className="text-sm">{result.website}</span>
                              </div>
                            )}
                          </div>
                          
                          <div className="space-y-2">
                            <div className="text-sm">
                              <div className="font-medium">Address:</div>
                              <div className="text-gray-600">
                                {result.addressLine1}
                                {result.addressLine2 && <>, {result.addressLine2}</>}
                                <br />
                                {result.city}, {result.state} {result.postalCode}
                                <br />
                                {result.country}
                              </div>
                            </div>
                            <div className="text-xs text-gray-500">
                              Created: {new Date(result.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {!searchResults.found && (
                <div className="text-center py-8 text-gray-500">
                  <XCircle className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p>No customer/vendor found with the specified {searchOptions.find(opt => opt.value === searchType)?.label.toLowerCase()}.</p>
                  <p className="text-sm mt-2">Try a different search term or search type.</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 