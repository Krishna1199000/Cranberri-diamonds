"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { shapes, additionalShapes, colors, clarities, cuts, labs, polishes, symms, flours, locations } from './data';
import Image from 'next/image';

export interface DiamondSearchProps {
  onSearch?: (params: URLSearchParams) => void;
  className?: string;
}

export function DiamondSearch({ onSearch, className = '' }: DiamondSearchProps) {
  const router = useRouter();
  const [selectedShapes, setSelectedShapes] = useState<string[]>([]);
  const [caratFrom, setCaratFrom] = useState("");
  const [caratTo, setCaratTo] = useState("");
  const [stoneId, setStoneId] = useState("");
  const [priceFrom, setPriceFrom] = useState("");
  const [priceTo, setPriceTo] = useState("");
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [selectedClarities, setSelectedClarities] = useState<string[]>([]);
  const [selectedCuts, setSelectedCuts] = useState<string[]>([]);
  const [selectedLabs, setSelectedLabs] = useState<string[]>([]);
  const [selectedPolishes, setSelectedPolishes] = useState<string[]>([]);
  const [selectedSymms, setSelectedSymms] = useState<string[]>([]);
  const [selectedFlours, setSelectedFlours] = useState<string[]>([]);
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
  const [othersExpanded, setOthersExpanded] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleShapeClick = (shapeId: string, isOthersButton: boolean) => {
    if (isOthersButton) {
      setOthersExpanded(!othersExpanded);
      return;
    }

    const newSelectedShapes = selectedShapes.includes(shapeId)
      ? selectedShapes.filter(s => s !== shapeId)
      : [shapeId];
    setSelectedShapes(newSelectedShapes);
  };

  const handleSearch = async () => {
    setLoading(true);
    try {
      const searchParams = new URLSearchParams();

      if (selectedShapes.length > 0) searchParams.set('shapes', selectedShapes.join(','));
      if (caratFrom) searchParams.set('caratFrom', caratFrom);
      if (caratTo) searchParams.set('caratTo', caratTo);
      if (stoneId) searchParams.set('stoneId', stoneId);
      if (priceFrom) searchParams.set('priceFrom', priceFrom);
      if (priceTo) searchParams.set('priceTo', priceTo);
      if (selectedColors.length > 0) searchParams.set('colors', selectedColors.join(','));
      if (selectedClarities.length > 0) searchParams.set('clarities', selectedClarities.join(','));
      if (selectedCuts.length > 0) searchParams.set('cuts', selectedCuts.join(','));
      if (selectedLabs.length > 0) searchParams.set('labs', selectedLabs.join(','));
      if (selectedPolishes.length > 0) searchParams.set('polishes', selectedPolishes.join(','));
      if (selectedSymms.length > 0) searchParams.set('symms', selectedSymms.join(','));
      if (selectedFlours.length > 0) searchParams.set('flours', selectedFlours.join(','));
      if (selectedLocations.length > 0) searchParams.set('locations', selectedLocations.join(','));

      if (onSearch) {
        onSearch(searchParams);
      } else {
        router.push(`shop/search/results?${searchParams.toString()}`);
      }
    } catch (error) {
      console.error('Search failed:', error);
      toast.error('Failed to search diamonds');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-white rounded-xl shadow-lg p-8 ${className}`}
    >
      <div className="space-y-8">
        {/* Shapes Section */}
        <section>
          <Label className="text-lg font-semibold mb-4 block">Diamond Shapes</Label>
          <motion.div
            layout
            className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-11 gap-4"
          >
            {shapes.map((shape) => (
              <motion.div
                key={shape.id}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`flex flex-col items-center cursor-pointer p-3 rounded-lg border-2 transition-colors ${selectedShapes.includes(shape.id)
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-blue-300'
                  }`}
                onClick={() => handleShapeClick(shape.id, shape.id === "others")}
              >
                <div className="w-16 h-16 flex items-center justify-center">
                  <Image
                    src={shape.image || "/placeholder.svg"}
                    alt={shape.label}
                    width={64}
                    height={64}
                    className="max-w-full max-h-full object-contain"
                  />
                </div>
                <span className="text-sm font-medium mt-2 text-center">{shape.label}</span>
              </motion.div>
            ))}
          </motion.div>

          <AnimatePresence>
            {othersExpanded && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-11 gap-4 mt-4"
              >
                {additionalShapes.map((shape) => (
                  <motion.div
                    key={shape.id}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`flex flex-col items-center cursor-pointer p-3 rounded-lg border-2 transition-colors ${selectedShapes.includes(shape.id)
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-blue-300'
                      }`}
                    onClick={() => handleShapeClick(shape.id, false)}
                  >
                    <div className="w-16 h-16 flex items-center justify-center">
                      <Image
                        src={shape.image || "/placeholder.svg"}
                        alt={shape.label}
                        width={64}
                        height={64}
                        className="max-w-full max-h-full object-contain"
                      />
                    </div>
                    <span className="text-sm font-medium mt-2 text-center">{shape.label}</span>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </section>

        {/* Specifications Section */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="space-y-4">
            <Label className="text-lg font-semibold">Carat Range</Label>
            <div className="flex space-x-4">
              <Input
                type="number"
                placeholder="From"
                className="w-full"
                value={caratFrom}
                onChange={(e) => setCaratFrom(e.target.value)}
              />
              <Input
                type="number"
                placeholder="To"
                className="w-full"
                value={caratTo}
                onChange={(e) => setCaratTo(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-4">
            <Label className="text-lg font-semibold">Stone ID / Certificate</Label>
            <Input
              type="text"
              placeholder="Enter ID or Certificate Number"
              className="w-full"
              value={stoneId}
              onChange={(e) => setStoneId(e.target.value)}
            />
          </div>

          <div className="space-y-4">
            <Label className="text-lg font-semibold">Price Range ($/CT)</Label>
            <div className="flex space-x-4">
              <Input
                type="number"
                placeholder="From"
                className="w-full"
                value={priceFrom}
                onChange={(e) => setPriceFrom(e.target.value)}
              />
              <Input
                type="number"
                placeholder="To"
                className="w-full"
                value={priceTo}
                onChange={(e) => setPriceTo(e.target.value)}
              />
            </div>
          </div>
        </section>

        {/* Characteristics Section */}
        <section className="space-y-6">
          <div>
            <Label className="text-lg font-semibold mb-3 block">Color</Label>
            <div className="flex flex-wrap gap-2">
              {colors.map((color) => (
                <motion.button
                  key={color}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${selectedColors.includes(color)
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  onClick={() => {
                    const newColors = selectedColors.includes(color)
                      ? selectedColors.filter(c => c !== color)
                      : [color];
                    setSelectedColors(newColors);
                  }}
                >
                  {color}
                </motion.button>
              ))}
            </div>
          </div>

          <div>
            <Label className="text-lg font-semibold mb-3 block">Clarity</Label>
            <div className="flex flex-wrap gap-2">
              {clarities.map((clarity) => (
                <motion.button
                  key={clarity}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${selectedClarities.includes(clarity)
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  onClick={() => {
                    const newClarities = selectedClarities.includes(clarity)
                      ? selectedClarities.filter(c => c !== clarity)
                      : [clarity];
                    setSelectedClarities(newClarities);
                  }}
                >
                  {clarity}
                </motion.button>
              ))}
            </div>
          </div>
        </section>

        {/* Additional Characteristics */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label className="text-lg font-semibold mb-3 block">Cut</Label>
            <div className="flex flex-wrap gap-2">
              {cuts.map((cut) => (
                <motion.button
                  key={cut}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${selectedCuts.includes(cut)
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  onClick={() => {
                    const newCuts = selectedCuts.includes(cut)
                      ? selectedCuts.filter(c => c !== cut)
                      : [cut];
                    setSelectedCuts(newCuts);
                  }}
                >
                  {cut}
                </motion.button>
              ))}
            </div>
          </div>

          <div>
            <Label className="text-lg font-semibold mb-3 block">Lab</Label>
            <div className="flex flex-wrap gap-2">
              {labs.map((lab) => (
                <motion.button
                  key={lab}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${selectedLabs.includes(lab)
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  onClick={() => {
                    const newLabs = selectedLabs.includes(lab)
                      ? selectedLabs.filter(l => l !== lab)
                      : [lab];
                    setSelectedLabs(newLabs);
                  }}
                >
                  {lab}
                </motion.button>
              ))}
            </div>
          </div>
        </section>

        {/* Polish, Symmetry, Fluorescence, and Location Section */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label className="text-lg font-semibold mb-3 block">Polish</Label>
            <div className="flex flex-wrap gap-2">
              {polishes.map((polish) => (
                <motion.button
                  key={polish}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${selectedPolishes.includes(polish)
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  onClick={() => {
                    const newPolishes = selectedPolishes.includes(polish)
                      ? selectedPolishes.filter(p => p !== polish)
                      : [polish];
                    setSelectedPolishes(newPolishes);
                  }}
                >
                  {polish}
                </motion.button>
              ))}
            </div>
          </div>

          <div>
            <Label className="text-lg font-semibold mb-3 block">Symmetry</Label>
            <div className="flex flex-wrap gap-2">
              {symms.map((symm) => (
                <motion.button
                  key={symm}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${selectedSymms.includes(symm)
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  onClick={() => {
                    const newSymms = selectedSymms.includes(symm)
                      ? selectedSymms.filter(s => s !== symm)
                      : [symm];
                    setSelectedSymms(newSymms);
                  }}
                >
                  {symm}
                </motion.button>
              ))}
            </div>
          </div>

          <div>
            <Label className="text-lg font-semibold mb-3 block">Fluorescence</Label>
            <div className="flex flex-wrap gap-2">
              {flours.map((flour) => (
                <motion.button
                  key={flour}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${selectedFlours.includes(flour)
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  onClick={() => {
                    const newFlours = selectedFlours.includes(flour)
                      ? selectedFlours.filter(f => f !== flour)
                      : [flour];
                    setSelectedFlours(newFlours);
                  }}
                >
                  {flour}
                </motion.button>
              ))}
            </div>
          </div>

          <div>
            <Label className="text-lg font-semibold mb-3 block">Location</Label>
            <div className="flex flex-wrap gap-2">
              {locations.map((location) => (
                <motion.button
                  key={location}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${selectedLocations.includes(location)
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  onClick={() => {
                    const newLocations = selectedLocations.includes(location)
                      ? selectedLocations.filter(l => l !== location)
                      : [location];
                    setSelectedLocations(newLocations);
                  }}
                >
                  {location}
                </motion.button>
              ))}
            </div>
          </div>
        </section>

        {/* Action Buttons */}
        <section className="flex justify-center space-x-4 pt-6">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`px-8 py-3 rounded-lg font-medium text-white transition-colors ${loading ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'
              }`}
            onClick={handleSearch}
            disabled={loading}
          >
            {loading ? 'Searching...' : 'Search Diamonds'}
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-8 py-3 rounded-lg font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors"
          >
            Advanced Search
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-8 py-3 rounded-lg font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors"
          >
            Post Your Demand
          </motion.button>
        </section>
      </div>
    </motion.div>
  );
}