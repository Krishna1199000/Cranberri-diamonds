"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"

const shapes = [
  { id: "round", label: "ROUND", image: "/shapes/round.png" },
  { id: "oval", label: "OVAL", image: "/shapes/oval.png" },
  { id: "pear", label: "PEAR", image: "/shapes/pear.png" },
  { id: "marquise", label: "MARQUISE", image: "/shapes/marquise.png" },
  { id: "heart", label: "HEART", image: "/shapes/heart.png" },
  { id: "emerald", label: "EMERALD", image: "/shapes/emerald.png" },
  { id: "cushion", label: "CUSHION", image: "/shapes/cushion.png" },
  { id: "princess", label: "PRINCESS", image: "/shapes/princess.png" },
  { id: "radiant", label: "RADIANT", image: "/shapes/radiant.png" },
  { id: "asscher", label: "ASSCHER", image: "/shapes/asscher.png" },
  { id: "others", label: "OTHERS", image: "/shapes/others.png" },
]

const additionalShapes = [
  { id: "half_moon", label: "HALF MOON", image: "/shapes/half_moon.png" },
  { id: "baguette", label: "BAGUETTE", image: "/shapes/baguette.png" },
  { id: "triangle", label: "TRIANGLE", image: "/shapes/triangle.png" },
  { id: "european", label: "EUROPEAN", image: "/shapes/european.png" },
  { id: "old_miner", label: "OLD MINER", image: "/shapes/old_miner.png" },
  { id: "briolette", label: "BRIOLETTE", image: "/shapes/briolette.png" },
  { id: "shield_cut", label: "SHIELD CUT", image: "/shapes/shield_cut.png" },
  { id: "star_cut", label: "STAR CUT", image: "/shapes/star_cut.png" },
  { id: "bullet_cut", label: "BULLET CUT", image: "/shapes/bullet_cut.png" },
  { id: "octagon", label: "OCTAGON", image: "/shapes/octagon.png" },
  { id: "hexagon", label: "HEXAGON", image: "/shapes/hexagon.png" },
  { id: "pentagon", label: "PENTAGON", image: "/shapes/pentagon.png" },
  { id: "portrait", label: "PORTRAIT", image: "/shapes/portrait.png" },
  { id: "kite", label: "KITE", image: "/shapes/kite.png" },
  { id: "trapazoid", label: "TRAPAZOID", image: "/shapes/trapazoid.png" },
  { id: "pear_rose", label: "PEAR ROSE", image: "/shapes/pear_rose.png" },
  { id: "rough", label: "ROUGH", image: "/shapes/rough.png" },
  { id: "rad", label: "RAD", image: "/shapes/rad.png" },
  { id: "carr", label: "CARR", image: "/shapes/carr.png" },
  { id: "rosecut", label: "ROSECUT", image: "/shapes/rosecut.png" },
  { id: "sq_radiant", label: "SQ.RADIANT", image: "/shapes/sq_radiant.png" },
  { id: "old_european", label: "OLD EUROPEAN", image: "/shapes/old_european.png" },
  { id: "long_kite", label: "LONG KITE", image: "/shapes/long_kite.png" },
  { id: "pear_rose_cut", label: "PEAR ROSE CUT", image: "/shapes/pear_rose_cut.png" },
  { id: "carre", label: "CARRE", image: "/shapes/carre.png" },
  { id: "long", label: "LONG", image: "/shapes/long.png" },
  { id: "hex_step_cut", label: "HEX STEP CUT", image: "/shapes/hex_step_cut.png" },
  { id: "oldminer", label: "OLDMINER", image: "/shapes/oldminer.png" },
  { id: "emeralad", label: "EMERALAD", image: "/shapes/emeralad.png" },
  { id: "crisscut", label: "CRISSCUT", image: "/shapes/crisscut.png" },
  { id: "crsc", label: "CRSC", image: "/shapes/crsc.png" },
  { id: "rose_cut", label: "ROSE CUT", image: "/shapes/rose_cut.png" },
  {
    id: "old_european_long_cushion",
    label: "OLD EUROPEAN LONG CUSHION",
    image: "/shapes/old_european_long_cushion.png",
  },
  { id: "oval_rose_cut", label: "OVAL ROSE CUT", image: "/shapes/oval_rose_cut.png" },
  { id: "trapeze", label: "TRAPEZE", image: "/shapes/trapeze.png" },
  { id: "octagonal", label: "OCTAGONAL", image: "/shapes/octagonal.png" },
  { id: "portugese", label: "PORTUGESE", image: "/shapes/portugese.png" },
]

const colors = [
  "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N",
  "FANCY INTENCE PINK", "FANCY BROWN", "BLUE", "FANCY INTENSE BLUE",
  "FANCY INTENCE YELLOW", "FANCY VIIVD PINK", "F+"
]

const clarities = [
  "FL", "IF", "VVS1", "VVS2", "VS1", "VS2", "SI1", "SI2", "SI3",
  "I1", "I2", "I3", "VS1-", "VS1+"
]

const cuts = ["ID", "EX", "VG", "GD", "FR", "N/A"]
const labs = ["IGI", "GIA", "GSI", "NONC", "GCAL", "NO-CERT"]
const polishes = ["ID", "EX", "VG", "GD", "FR"]
const symms = ["EX", "VG", "GD", "FR", "G"]
const flours = ["NON", "FNT", "MED", "SL", "VSL", "STG", "VST"]
const locations = ["LA", "NY"]

export default function SearchDiamonds() {
  const router = useRouter()
  const [selectedShapes, setSelectedShapes] = useState<string[]>([])
  const [caratFrom, setCaratFrom] = useState("")
  const [caratTo, setCaratTo] = useState("")
  const [stoneId, setStoneId] = useState("")
  const [priceFrom, setPriceFrom] = useState("")
  const [priceTo, setPriceTo] = useState("")
  const [selectedColors, setSelectedColors] = useState<string[]>([])
  const [selectedClarities, setSelectedClarities] = useState<string[]>([])
  const [selectedCuts, setSelectedCuts] = useState<string[]>([])
  const [selectedLabs, setSelectedLabs] = useState<string[]>([])
  const [selectedPolishes, setSelectedPolishes] = useState<string[]>([])
  const [selectedSymms, setSelectedSymms] = useState<string[]>([])
  const [selectedFlours, setSelectedFlours] = useState<string[]>([])
  const [selectedLocations, setSelectedLocations] = useState<string[]>([])
  const [othersExpanded, setOthersExpanded] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleShapeClick = (shapeId: string, isOthersButton: boolean) => {
    if (isOthersButton) {
      setOthersExpanded(!othersExpanded)
      return
    }

    const newSelectedShapes = selectedShapes.includes(shapeId)
      ? selectedShapes.filter(s => s !== shapeId)
      : [shapeId]
    setSelectedShapes(newSelectedShapes)
  }

  const handleSearch = async () => {
    setLoading(true)
    try {
      const searchParams = new URLSearchParams()
      
      if (selectedShapes.length > 0) searchParams.set('shapes', selectedShapes.join(','))
      if (caratFrom) searchParams.set('caratFrom', caratFrom)
      if (caratTo) searchParams.set('caratTo', caratTo)
      if (stoneId) searchParams.set('stoneId', stoneId)
      if (priceFrom) searchParams.set('priceFrom', priceFrom)
      if (priceTo) searchParams.set('priceTo', priceTo)
      if (selectedColors.length > 0) searchParams.set('colors', selectedColors.join(','))
      if (selectedClarities.length > 0) searchParams.set('clarities', selectedClarities.join(','))
      if (selectedCuts.length > 0) searchParams.set('cuts', selectedCuts.join(','))
      if (selectedLabs.length > 0) searchParams.set('labs', selectedLabs.join(','))
      if (selectedPolishes.length > 0) searchParams.set('polishes', selectedPolishes.join(','))
      if (selectedSymms.length > 0) searchParams.set('symms', selectedSymms.join(','))
      if (selectedFlours.length > 0) searchParams.set('flours', selectedFlours.join(','))
      if (selectedLocations.length > 0) searchParams.set('locations', selectedLocations.join(','))

      router.push(`/shop/search/results?${searchParams.toString()}`)
    } catch (error) {
      console.error('Search failed:', error)
      toast.error('Failed to search diamonds')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <span className="text-xl font-bold">Cranberri Diamonds</span>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="outline" onClick={() => router.push("/")}>
                Home
              </Button>
              <Button variant="outline" onClick={() => router.push("/shop")}>
                Stone-Inventory
              </Button>
              <Button variant="outline" onClick={() => router.push("/shop/search")}>
                Search-stone
              </Button>
              <Button variant="outline" onClick={() => router.push("/customer-vendor")}>
                Customer/Vendor
              </Button>
              <span className="text-gray-500">|</span>
              <span className="text-gray-600">Username</span>
              <Button variant="outline">Logout</Button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="mb-6">
            <Label className="text-sm font-medium mb-2 block">Shape</Label>
            <div className="grid grid-cols-11 gap-4">
              {shapes.map((shape) => (
                <div
                  key={shape.id}
                  className={`flex flex-col items-center cursor-pointer p-2 rounded border ${
                    selectedShapes.includes(shape.id) ? "border-blue-500 bg-blue-50" : "border-gray-200"
                  }`}
                  onClick={() => handleShapeClick(shape.id, shape.id === "others")}
                >
                  <div className="w-12 h-12 flex items-center justify-center">
                    <img src={shape.image || "/placeholder.svg"} alt={shape.label} className="max-w-full max-h-full" />
                  </div>
                  <span className="text-xs mt-1">{shape.label}</span>
                </div>
              ))}
            </div>
            {othersExpanded && (
              <div className="grid grid-cols-11 gap-4 mt-4">
                {additionalShapes.map((shape) => (
                  <div
                    key={shape.id}
                    className={`flex flex-col items-center cursor-pointer p-2 rounded border ${
                      selectedShapes.includes(shape.id) ? "border-blue-500 bg-blue-50" : "border-gray-200"
                    }`}
                    onClick={() => handleShapeClick(shape.id, false)}
                  >
                    <div className="w-12 h-12 flex items-center justify-center">
                      <img
                        src={shape.image || "/placeholder.svg"}
                        alt={shape.label}
                        className="max-w-full max-h-full"
                      />
                    </div>
                    <span className="text-xs mt-1">{shape.label}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-6 mb-6">
            <div>
              <Label className="text-sm font-medium mb-2 block">Carat</Label>
              <div className="flex space-x-2">
                <Input
                  type="number"
                  placeholder="From"
                  value={caratFrom}
                  onChange={(e) => setCaratFrom(e.target.value)}
                />
                <Input
                  type="number"
                  placeholder="To"
                  value={caratTo}
                  onChange={(e) => setCaratTo(e.target.value)}
                />
              </div>
            </div>

            <div>
              <Label className="text-sm font-medium mb-2 block">Stone Id #/Cert #</Label>
              <Input
                type="text"
                placeholder="Enter Stone ID or Certificate Number"
                value={stoneId}
                onChange={(e) => setStoneId(e.target.value)}
              />
            </div>
          </div>

          <div className="mb-6">
            <Label className="text-sm font-medium mb-2 block">Color</Label>
            <div className="flex flex-wrap gap-2">
              {colors.map((color) => (
                <Button
                  key={color}
                  variant={selectedColors.includes(color) ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    const newColors = selectedColors.includes(color)
                      ? selectedColors.filter(c => c !== color)
                      : [color]
                    setSelectedColors(newColors)
                  }}
                >
                  {color}
                </Button>
              ))}
            </div>
          </div>

          <div className="mb-6">
            <Label className="text-sm font-medium mb-2 block">Clarity</Label>
            <div className="flex flex-wrap gap-2">
              {clarities.map((clarity) => (
                <Button
                  key={clarity}
                  variant={selectedClarities.includes(clarity) ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    const newClarities = selectedClarities.includes(clarity)
                      ? selectedClarities.filter(c => c !== clarity)
                      : [clarity]
                    setSelectedClarities(newClarities)
                  }}
                >
                  {clarity}
                </Button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6 mb-6">
            <div>
              <Label className="text-sm font-medium mb-2 block">Cut</Label>
              <div className="flex flex-wrap gap-2">
                {cuts.map((cut) => (
                  <Button
                    key={cut}
                    variant={selectedCuts.includes(cut) ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      const newCuts = selectedCuts.includes(cut)
                        ? selectedCuts.filter(c => c !== cut)
                        : [cut]
                      setSelectedCuts(newCuts)
                    }}
                  >
                    {cut}
                  </Button>
                ))}
              </div>
            </div>

            <div>
              <Label className="text-sm font-medium mb-2 block">Lab</Label>
              <div className="flex flex-wrap gap-2">
                {labs.map((lab) => (
                  <Button
                    key={lab}
                    variant={selectedLabs.includes(lab) ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      const newLabs = selectedLabs.includes(lab)
                        ? selectedLabs.filter(l => l !== lab)
                        : [lab]
                      setSelectedLabs(newLabs)
                    }}
                  >
                    {lab}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6 mb-6">
            <div>
              <Label className="text-sm font-medium mb-2 block">Polish</Label>
              <div className="flex flex-wrap gap-2">
                {polishes.map((polish) => (
                  <Button
                    key={polish}
                    variant={selectedPolishes.includes(polish) ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      const newPolishes = selectedPolishes.includes(polish)
                        ? selectedPolishes.filter(p => p !== polish)
                        : [polish]
                      setSelectedPolishes(newPolishes)
                    }}
                  >
                    {polish}
                  </Button>
                ))}
              </div>
            </div>

            <div>
              <Label className="text-sm font-medium mb-2 block">Symm</Label>
              <div className="flex flex-wrap gap-2">
                {symms.map((symm) => (
                  <Button
                    key={symm}
                    variant={selectedSymms.includes(symm) ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      const newSymms = selectedSymms.includes(symm)
                        ? selectedSymms.filter(s => s !== symm)
                        : [symm]
                      setSelectedSymms(newSymms)
                    }}
                  >
                    {symm}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6 mb-6">
            <div>
              <Label className="text-sm font-medium mb-2 block">Flour</Label>
              <div className="flex flex-wrap gap-2">
                {flours.map((flour) => (
                  <Button
                    key={flour}
                    variant={selectedFlours.includes(flour) ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      const newFlours = selectedFlours.includes(flour)
                        ? selectedFlours.filter(f => f !== flour)
                        : [flour]
                      setSelectedFlours(newFlours)
                    }}
                  >
                    {flour}
                  </Button>
                ))}
              </div>
            </div>

            <div>
              <Label className="text-sm font-medium mb-2 block">Location</Label>
              <div className="flex flex-wrap gap-2">
                {locations.map((location) => (
                  <Button
                    key={location}
                    variant={selectedLocations.includes(location) ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      const newLocations = selectedLocations.includes(location)
                        ? selectedLocations.filter(l => l !== location)
                        : [location]
                      setSelectedLocations(newLocations)
                    }}
                  >
                    {location}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          <div className="mb-6">
            <Label className="text-sm font-medium mb-2 block">US$/CT</Label>
            <div className="flex space-x-2">
              <Input
                type="number"
                placeholder="From"
                value={priceFrom}
                onChange={(e) => setPriceFrom(e.target.value)}
              />
              <Input
                type="number"
                placeholder="To"
                value={priceTo}
                onChange={(e) => setPriceTo(e.target.value)}
              />
            </div>
          </div>

          <div className="flex justify-center space-x-4">
            <Button onClick={handleSearch} disabled={loading}>
              {loading ? 'Searching...' : 'Search'}
            </Button>
            <Button variant="outline">Advance Search</Button>
            <Button variant="outline">Post Your Demand</Button>
          </div>
        </div>
      </div>
    </div>
  )
}