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

const countries = {
  "USA": {
    "California": ["Los Angeles", "San Francisco", "San Diego", "Sacramento", "San Jose", "Fresno", "Long Beach", "Oakland", "Bakersfield", "Anaheim"],
    "New York": ["New York City", "Buffalo", "Albany", "Rochester", "Syracuse", "Yonkers", "Schenectady", "Utica", "White Plains", "Binghamton"],
    "Texas": ["Houston", "Austin", "Dallas", "San Antonio", "Fort Worth", "El Paso", "Arlington", "Corpus Christi", "Plano", "Lubbock"],
    "Florida": ["Miami", "Orlando", "Tampa", "Fort Lauderdale", "Jacksonville", "St. Petersburg", "Tallahassee", "Gainesville", "Clearwater", "Pensacola"],
    "Illinois": ["Chicago", "Aurora", "Naperville", "Joliet", "Rockford", "Springfield", "Peoria", "Elgin", "Waukegan", "Champaign"],
    "Pennsylvania": ["Philadelphia", "Pittsburgh", "Allentown", "Erie", "Reading", "Scranton", "Bethlehem", "Lancaster", "Harrisburg", "Altoona"],
    "Ohio": ["Columbus", "Cleveland", "Cincinnati", "Toledo", "Akron", "Dayton", "Parma", "Canton", "Youngstown", "Lorain"],
    "Michigan": ["Detroit", "Grand Rapids", "Warren", "Sterling Heights", "Ann Arbor", "Lansing", "Flint", "Dearborn", "Livonia", "Westland"],
    "Georgia": ["Atlanta", "Augusta", "Columbus", "Savannah", "Athens", "Sandy Springs", "Macon", "Roswell", "Albany", "Johns Creek"],
    "North Carolina": ["Charlotte", "Raleigh", "Greensboro", "Durham", "Winston-Salem", "Fayetteville", "Cary", "Wilmington", "High Point", "Asheville"],
    "New Jersey": ["Newark", "Jersey City", "Paterson", "Elizabeth", "Trenton", "Camden", "Clifton", "Passaic", "East Orange", "Union City"],
    "Virginia": ["Virginia Beach", "Norfolk", "Chesapeake", "Richmond", "Newport News", "Alexandria", "Hampton", "Roanoke", "Portsmouth", "Suffolk"],
    "Washington": ["Seattle", "Spokane", "Tacoma", "Vancouver", "Bellevue", "Kent", "Everett", "Renton", "Yakima", "Federal Way"],
    "Arizona": ["Phoenix", "Tucson", "Mesa", "Chandler", "Glendale", "Scottsdale", "Gilbert", "Tempe", "Peoria", "Surprise"],
    "Massachusetts": ["Boston", "Worcester", "Springfield", "Lowell", "Cambridge", "New Bedford", "Brockton", "Quincy", "Lynn", "Fall River"],
    "Indiana": ["Indianapolis", "Fort Wayne", "Evansville", "South Bend", "Carmel", "Fishers", "Bloomington", "Hammond", "Gary", "Lafayette"],
    "Tennessee": ["Nashville", "Memphis", "Knoxville", "Chattanooga", "Clarksville", "Murfreesboro", "Franklin", "Jackson", "Johnson City", "Kingsport"],
    "Missouri": ["Kansas City", "St. Louis", "Springfield", "Columbia", "Independence", "Lee's Summit", "O'Fallon", "St. Joseph", "St. Charles", "Blue Springs"],
    "Maryland": ["Baltimore", "Frederick", "Rockville", "Gaithersburg", "Bowie", "Annapolis", "Hagerstown", "College Park", "Salisbury", "Laurel"],
    "Wisconsin": ["Milwaukee", "Madison", "Green Bay", "Kenosha", "Racine", "Appleton", "Waukesha", "Oshkosh", "Eau Claire", "Janesville"],
    "Minnesota": ["Minneapolis", "St. Paul", "Rochester", "Duluth", "Bloomington", "Brooklyn Park", "Plymouth", "St. Cloud", "Eagan", "Woodbury"],
    "Colorado": ["Denver", "Colorado Springs", "Aurora", "Fort Collins", "Lakewood", "Thornton", "Arvada", "Westminster", "Pueblo", "Centennial"],
    "Alabama": ["Birmingham", "Montgomery", "Mobile", "Huntsville", "Tuscaloosa", "Hoover", "Dothan", "Auburn", "Decatur", "Madison"],
    "South Carolina": ["Columbia", "Charleston", "North Charleston", "Mount Pleasant", "Rock Hill", "Greenville", "Summerville", "Spartanburg", "Goose Creek", "Hilton Head Island"],
    "Louisiana": ["New Orleans", "Baton Rouge", "Shreveport", "Lafayette", "Lake Charles", "Kenner", "Bossier City", "Monroe", "Alexandria", "Houma"],
    "Kentucky": ["Louisville", "Lexington", "Bowling Green", "Owensboro", "Covington", "Hopkinsville", "Richmond", "Florence", "Georgetown", "Henderson"],
    "Oregon": ["Portland", "Eugene", "Salem", "Gresham", "Hillsboro", "Beaverton", "Bend", "Medford", "Springfield", "Corvallis"],
    "Oklahoma": ["Oklahoma City", "Tulsa", "Norman", "Broken Arrow", "Lawton", "Edmond", "Moore", "Midwest City", "Enid", "Stillwater"],
    "Connecticut": ["Bridgeport", "New Haven", "Stamford", "Hartford", "Waterbury", "Norwalk", "Danbury", "New Britain", "Bristol", "Meriden"],
    "Utah": ["Salt Lake City", "West Valley City", "Provo", "West Jordan", "Orem", "Sandy", "Ogden", "St. George", "Layton", "South Jordan"],
    "Iowa": ["Des Moines", "Cedar Rapids", "Davenport", "Sioux City", "Iowa City", "Waterloo", "Council Bluffs", "Ames", "West Des Moines", "Ankeny"],
    "Nevada": ["Las Vegas", "Henderson", "Reno", "North Las Vegas", "Sparks", "Carson City", "Fernley", "Elko", "Mesquite", "Boulder City"],
    "Arkansas": ["Little Rock", "Fort Smith", "Fayetteville", "Springdale", "Jonesboro", "North Little Rock", "Conway", "Rogers", "Pine Bluff", "Bentonville"],
    "Mississippi": ["Jackson", "Gulfport", "Southaven", "Hattiesburg", "Biloxi", "Meridian", "Tupelo", "Greenville", "Olive Branch", "Clinton"],
    "Kansas": ["Wichita", "Overland Park", "Kansas City", "Olathe", "Topeka", "Lawrence", "Shawnee", "Manhattan", "Lenexa", "Salina"],
    "New Mexico": ["Albuquerque", "Las Cruces", "Rio Rancho", "Santa Fe", "Roswell", "Farmington", "Clovis", "Hobbs", "Alamogordo", "Carlsbad"],
    "Nebraska": ["Omaha", "Lincoln", "Bellevue", "Grand Island", "Kearney", "Fremont", "Hastings", "Norfolk", "Columbus", "North Platte"],
    "Idaho": ["Boise", "Meridian", "Nampa", "Idaho Falls", "Pocatello", "Caldwell", "Coeur d'Alene", "Twin Falls", "Post Falls", "Lewiston"],
    "West Virginia": ["Charleston", "Huntington", "Morgantown", "Parkersburg", "Wheeling", "Weirton", "Fairmont", "Beckley", "Martinsburg", "Clarksburg"],
    "Hawaii": ["Honolulu", "Hilo", "Kailua", "Kapolei", "Kaneohe", "Waipahu", "Pearl City", "Waimalu", "Mililani", "Kahului"],
    "New Hampshire": ["Manchester", "Nashua", "Concord", "Derry", "Dover", "Rochester", "Salem", "Merrimack", "Londonderry", "Hudson"],
    "Maine": ["Portland", "Lewiston", "Bangor", "South Portland", "Auburn", "Biddeford", "Sanford", "Augusta", "Westbrook", "Waterville"],
    "Montana": ["Billings", "Missoula", "Great Falls", "Bozeman", "Butte", "Helena", "Kalispell", "Havre", "Anaconda", "Miles City"],
    "Rhode Island": ["Providence", "Warwick", "Cranston", "Pawtucket", "East Providence", "Woonsocket", "Coventry", "Cumberland", "North Providence", "West Warwick"],
    "Delaware": ["Wilmington", "Dover", "Newark", "Middletown", "Smyrna", "Milford", "Seaford", "Georgetown", "Elsmere", "New Castle"],
    "South Dakota": ["Sioux Falls", "Rapid City", "Aberdeen", "Brookings", "Watertown", "Mitchell", "Yankton", "Pierre", "Huron", "Vermillion"],
    "North Dakota": ["Fargo", "Bismarck", "Grand Forks", "Minot", "West Fargo", "Williston", "Dickinson", "Mandan", "Jamestown", "Wahpeton"],
    "Alaska": ["Anchorage", "Fairbanks", "Juneau", "Sitka", "Ketchikan", "Wasilla", "Kenai", "Kodiak", "Bethel", "Palmer"],
    "Vermont": ["Burlington", "South Burlington", "Rutland", "Barre", "Montpelier", "Essex Junction", "Bennington", "Brattleboro", "St. Albans", "Winooski"],
    "Wyoming": ["Cheyenne", "Casper", "Laramie", "Gillette", "Rock Springs", "Sheridan", "Green River", "Evanston", "Riverton", "Jackson"]
  },
  "India": {
    "Andhra Pradesh": ["Visakhapatnam", "Vijayawada", "Guntur", "Nellore", "Kurnool", "Rajahmundry", "Tirupati", "Kakinada", "Kadapa", "Anantapur"],
    "Arunachal Pradesh": ["Itanagar", "Naharlagun", "Pasighat", "Tawang", "Ziro", "Bomdila", "Tezu", "Roing", "Along", "Namsai"],
    "Assam": ["Guwahati", "Silchar", "Dibrugarh", "Jorhat", "Nagaon", "Tinsukia", "Tezpur", "Karimganj", "Diphu", "North Lakhimpur"],
    "Bihar": ["Patna", "Gaya", "Muzaffarpur", "Bhagalpur", "Darbhanga", "Purnia", "Arrah", "Begusarai", "Katihar", "Munger"],
    "Chhattisgarh": ["Raipur", "Bhilai", "Bilaspur", "Korba", "Durg", "Rajnandgaon", "Jagdalpur", "Ambikapur", "Raigarh", "Dhamtari"],
    "Goa": ["Panaji", "Margao", "Vasco da Gama", "Mapusa", "Ponda", "Bicholim", "Curchorem", "Cuncolim", "Canacona", "Pernem"],
    "Gujarat": ["Ahmedabad", "Surat", "Vadodara", "Rajkot", "Bhavnagar", "Jamnagar", "Gandhinagar", "Junagadh", "Anand", "Navsari"],
    "Haryana": ["Faridabad", "Gurgaon", "Panipat", "Ambala", "Yamunanagar", "Rohtak", "Hisar", "Karnal", "Sonipat", "Panchkula"],
    "Himachal Pradesh": ["Shimla", "Dharamshala", "Solan", "Mandi", "Kullu", "Palampur", "Hamirpur", "Una", "Nahan", "Bilaspur"],
    "Jharkhand": ["Ranchi", "Jamshedpur", "Dhanbad", "Bokaro", "Hazaribagh", "Deoghar", "Giridih", "Ramgarh", "Dumka", "Chaibasa"],
    "Karnataka": ["Bangalore", "Mysore", "Hubli-Dharwad", "Mangalore", "Belgaum", "Gulbarga", "Davanagere", "Bellary", "Bijapur", "Shimoga"],
    "Kerala": ["Thiruvananthapuram", "Kochi", "Kozhikode", "Thrissur", "Kollam", "Kannur", "Alappuzha", "Kottayam", "Palakkad", "Malappuram"],
    "Madhya Pradesh": ["Indore", "Bhopal", "Jabalpur", "Gwalior", "Ujjain", "Sagar", "Dewas", "Satna", "Ratlam", "Rewa"],
    "Maharashtra": ["Mumbai", "Pune", "Nagpur", "Thane", "Nashik", "Aurangabad", "Solapur", "Amravati", "Kolhapur", "Sangli"],
    "Manipur": ["Imphal", "Thoubal", "Kakching", "Ukhrul", "Chandel", "Bishnupur", "Churachandpur", "Senapati", "Tamenglong", "Jiribam"],
    "Meghalaya": ["Shillong", "Tura", "Jowai", "Nongstoin", "Williamnagar", "Baghmara", "Resubelpara", "Ampati", "Khliehriat", "Mawkyrwat"],
    "Mizoram": ["Aizawl", "Lunglei", "Champhai", "Serchhip", "Kolasib", "Lawngtlai", "Saiha", "Mamit", "Saitual", "Khawzawl"],
    "Nagaland": ["Kohima", "Dimapur", "Mokokchung", "Tuensang", "Wokha", "Zunheboto", "Mon", "Phek", "Kiphire", "Longleng"],
    "Odisha": ["Bhubaneswar", "Cuttack", "Rourkela", "Berhampur", "Sambalpur", "Puri", "Balasore", "Bhadrak", "Baripada", "Jharsuguda"],
    "Punjab": ["Ludhiana", "Amritsar", "Jalandhar", "Patiala", "Bathinda", "Mohali", "Pathankot", "Hoshiarpur", "Batala", "Moga"],
    "Rajasthan": ["Jaipur", "Jodhpur", "Udaipur", "Kota", "Bikaner", "Ajmer", "Alwar", "Bhilwara", "Bharatpur", "Sikar"],
    "Sikkim": ["Gangtok", "Namchi", "Mangan", "Gyalshing", "Rangpo", "Jorethang", "Singtam", "Ravangla", "Chungthang", "Soreng"],
    "Tamil Nadu": ["Chennai", "Coimbatore", "Madurai", "Tiruchirappalli", "Salem", "Tirunelveli", "Tiruppur", "Erode", "Vellore", "Thoothukudi"],
    "Telangana": ["Hyderabad", "Warangal", "Nizamabad", "Karimnagar", "Khammam", "Ramagundam", "Mahbubnagar", "Nalgonda", "Adilabad", "Siddipet"],
    "Tripura": ["Agartala", "Udaipur", "Dharmanagar", "Kailashahar", "Belonia", "Ambassa", "Khowai", "Teliamura", "Sabroom", "Santirbazar"],
    "Uttar Pradesh": ["Lucknow", "Kanpur", "Varanasi", "Agra", "Prayagraj (Allahabad)", "Meerut", "Ghaziabad", "Aligarh", "Bareilly", "Moradabad"],
    "Uttarakhand": ["Dehradun", "Haridwar", "Rishikesh", "Haldwani", "Rudrapur", "Kashipur", "Roorkee", "Mussoorie", "Nainital", "Almora"],
    "West Bengal": ["Kolkata", "Howrah", "Durgapur", "Asansol", "Siliguri", "Bardhaman", "Malda", "Baharampur", "Jalpaiguri", "Kharagpur"]
  },
  "Australia": {
    "New South Wales": ["Sydney", "Newcastle", "Wollongong", "Central Coast", "Coffs Harbour", "Wagga Wagga", "Albury", "Port Macquarie", "Tamworth", "Orange"],
    "Victoria": ["Melbourne", "Geelong", "Ballarat", "Bendigo", "Shepparton", "Melton", "Mildura", "Wodonga", "Warrnambool", "Traralgon"],
    "Queensland": ["Brisbane", "Gold Coast", "Sunshine Coast", "Townsville", "Cairns", "Toowoomba", "Mackay", "Rockhampton", "Bundaberg", "Hervey Bay"],
    "Western Australia": ["Perth", "Bunbury", "Geraldton", "Kalgoorlie", "Albany", "Broome", "Mandurah", "Karratha", "Port Hedland", "Busselton"],
    "South Australia": ["Adelaide", "Mount Gambier", "Whyalla", "Port Augusta", "Port Lincoln", "Victor Harbor", "Murray Bridge", "Port Pirie", "Gawler", "Mount Barker"],
    "Tasmania": ["Hobart", "Launceston", "Devonport", "Burnie", "Ulverstone", "Kingston", "Glenorchy", "Clarence", "Sorell", "New Norfolk"],
    "Northern Territory": ["Darwin", "Alice Springs", "Palmerston", "Katherine", "Nhulunbuy", "Tennant Creek", "Wadeye", "Humpty Doo", "Jabiru", "Yulara"],
    "Australian Capital Territory": ["Canberra", "Belconnen", "Tuggeranong", "Gungahlin", "Woden Valley", "Weston Creek", "Molonglo Valley", "Hall", "Tharwa", "Oaks Estate"]
  },
  "United Kingdom": {
    "England": ["London", "Birmingham", "Manchester", "Liverpool", "Leeds", "Sheffield", "Bristol", "Newcastle", "Nottingham", "Southampton"],
    "Scotland": ["Edinburgh", "Glasgow", "Aberdeen", "Dundee", "Inverness", "Perth", "Stirling", "Dumfries", "Fort William", "St Andrews"],
    "Wales": ["Cardiff", "Swansea", "Newport", "Bangor", "St Davids", "Wrexham", "Aberystwyth", "Llandudno", "Carmarthen", "Merthyr Tydfil"],
    "Northern Ireland": ["Belfast", "Londonderry (Derry)", "Newry", "Lisburn", "Armagh", "Enniskillen", "Bangor", "Omagh", "Ballymena", "Coleraine"]
  },
  "Hong Kong": {
    "Hong Kong Island": ["Central", "Wan Chai", "Causeway Bay", "North Point", "Quarry Bay", "Chai Wan", "Aberdeen", "Stanley", "Shek O", "Kennedy Town"],
    "Kowloon": ["Tsim Sha Tsui", "Mong Kok", "Yau Ma Tei", "Sham Shui Po", "Kowloon City", "Wong Tai Sin", "Kwun Tong", "Diamond Hill", "San Po Kong", "Lai Chi Kok"],
    "New Territories": ["Sha Tin", "Tai Po", "Tsuen Wan", "Tuen Mun", "Yuen Long", "Fanling", "Sheung Shui", "Sai Kung", "Tai O", "Tin Shui Wai"],
    "Outlying Islands": ["Lantau Island", "Cheung Chau", "Lamma Island", "Peng Chau", "Discovery Bay", "Mui Wo", "Sok Kwu Wan", "Yung Shue Wan", "Tung Chung", "Ma Wan"]
  }
}

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
      toast.error('Something went wrong')
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
                  <Select
                    value={formData.country}
                    onValueChange={(value) => handleChange('country', value)}
                  >
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

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    State <span className="text-red-500">*</span>
                  </label>
                  <Select
                    value={formData.state}
                    onValueChange={(value) => handleChange('state', value)}
                    disabled={!formData.country}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select State" />
                    </SelectTrigger>
                    <SelectContent>
                      {formData.country && Object.keys(countries[formData.country as keyof typeof countries]).map((state) => (
                        <SelectItem key={state} value={state}>
                          {state}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    City <span className="text-red-500">*</span>
                  </label>
                  <Select
                    value={formData.city}
                    onValueChange={(value) => handleChange('city', value)}
                    disabled={!formData.state}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select City" />
                    </SelectTrigger>
                    <SelectContent>
                      {formData.country && formData.state &&
                        ((countries[formData.country as keyof typeof countries] as Record<string, string[]>)[formData.state]).map((city) => (
                          <SelectItem key={city} value={city}>
                            {city}
                          </SelectItem>
                        ))
                      }
                    </SelectContent>
                  </Select>
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
            <Button type="submit">
              Submit
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}