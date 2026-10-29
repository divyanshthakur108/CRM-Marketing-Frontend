// MOCK DATA - Phase 3 Projects & Property Specifications
export type ProjectCategory = 'Residential' | 'Commercial' | 'Industrial';

export type ResidentialSubtype = 'Apartment' | 'Villa' | 'Penthouse' | 'Plot / Land' | 'Studio';
export type CommercialSubtype = 'Office Space' | 'Retail Shop' | 'Showroom' | 'Commercial Plot' | 'Co-working';
export type IndustrialSubtype = 'Warehouse' | 'Factory' | 'Industrial Plot';

export interface UnitItem {
  id: string;
  organizationId: string;
  projectId: string;
  name: string;
  type: string;
  bhk?: string;
  bathrooms?: number;
  areaSqFt: number;
  priceDisplay: string;
  price: number;
  photosCount: number;
  isAvailable: boolean;
}

export interface ProjectItem {
  id: string;
  organizationId: string;
  name: string;
  category: ProjectCategory;
  subtype: string;
  isPlot: boolean;
  status: 'ACTIVE' | 'DRAFT' | 'SOLD_OUT';
  saleVsRent: 'SALE' | 'RENT' | 'LEASE';
  priceDisplay: string;
  price: number;
  address: string;
  city: string;
  state: string;
  pincode: string;
  contactNumber: string;
  website: string;
  amenities: string[];
  autoSavedAt: string;

  // Residential Specific (Forbidden on Plots)
  bhk?: string;
  bathrooms?: number;
  areaSqFt?: number;
  floor?: string;
  parking?: string;
  balconies?: number;
  facing?: string;
  furnishing?: 'Unfurnished' | 'Semi-Furnished' | 'Fully Furnished';
  possession?: string;

  // Commercial Specific
  usableAreaSqFt?: number;
  floorOrBuilding?: string;
  frontageFt?: number;
  lifts?: number;
  washrooms?: number;
  powerBackup?: boolean;
  commercialParking?: string;
  lease?: boolean;
  leaseTerms?: string;

  // Industrial Specific
  industrialType?: string;
  accessRoadWidthFt?: number;
  powerLoadKw?: number;
  loadingDocks?: number;
  ceilingHeightFt?: number;
  permittedUse?: string;

  units: UnitItem[];
  mediaCount: number;
}

export const MOCK_PROJECTS: ProjectItem[] = [
  {
    id: 'proj-01',
    organizationId: 'org-apex-01',
    name: 'The Palm Residences',
    category: 'Residential',
    subtype: 'Apartment',
    isPlot: false,
    status: 'ACTIVE',
    saleVsRent: 'SALE',
    priceDisplay: '₹ 2.45 Cr*',
    price: 24500000,
    address: 'Golf Course Extension Road, Sector 65',
    city: 'Gurugram',
    state: 'Haryana',
    pincode: '122018',
    contactNumber: '+91 98765 43210',
    website: 'https://apex-luxury.in/palm-residences',
    amenities: ['Clubhouse', 'Swimming Pool', 'EV Charging', '24/7 Security', 'Gym'],
    autoSavedAt: '12:05 PM',
    bhk: '3 BHK Luxury Suite',
    bathrooms: 3,
    areaSqFt: 2150,
    floor: '14th Floor (of 28)',
    parking: '2 Covered Reserved Bays',
    balconies: 3,
    facing: 'North-East Garden Facing',
    furnishing: 'Semi-Furnished',
    possession: 'Ready to Move',
    mediaCount: 18,
    units: [
      {
        id: 'unit-01-a',
        organizationId: 'org-apex-01',
        projectId: 'proj-01',
        name: 'Type A - 3BHK Grand Suite',
        type: 'Apartment',
        bhk: '3 BHK',
        bathrooms: 3,
        areaSqFt: 2150,
        priceDisplay: '₹ 2.45 Cr',
        price: 24500000,
        photosCount: 8,
        isAvailable: true,
      },
      {
        id: 'unit-01-b',
        organizationId: 'org-apex-01',
        projectId: 'proj-01',
        name: 'Type B - 4BHK Presidential Sky Villa',
        type: 'Penthouse',
        bhk: '4 BHK',
        bathrooms: 4,
        areaSqFt: 3450,
        priceDisplay: '₹ 4.10 Cr',
        price: 41000000,
        photosCount: 12,
        isAvailable: true,
      },
    ],
  },
  {
    id: 'proj-02',
    organizationId: 'org-apex-01',
    name: 'Apex Boulevard Villas',
    category: 'Residential',
    subtype: 'Villa',
    isPlot: false,
    status: 'ACTIVE',
    saleVsRent: 'SALE',
    priceDisplay: '₹ 5.80 Cr*',
    price: 58000000,
    address: 'Candolim Coastal Enclave',
    city: 'Goa',
    state: 'Goa',
    pincode: '403515',
    contactNumber: '+91 98765 43211',
    website: 'https://apex-luxury.in/boulevard-villas',
    amenities: ['Private Infinity Pool', 'Solar Panels', 'Landscaped Courtyard', 'Smart Home Automation'],
    autoSavedAt: '11:42 AM',
    bhk: '4 BHK Independent Villa',
    bathrooms: 5,
    areaSqFt: 4600,
    floor: 'G+2 Standalone',
    parking: '3 Private Stilt Garages',
    balconies: 4,
    facing: 'West Facing Sea Breeze',
    furnishing: 'Fully Furnished',
    possession: 'Under Construction (Possession Dec 2026)',
    mediaCount: 24,
    units: [
      {
        id: 'unit-02-a',
        organizationId: 'org-apex-01',
        projectId: 'proj-02',
        name: 'Palacio Estate Villa (4BHK)',
        type: 'Villa',
        bhk: '4 BHK',
        bathrooms: 5,
        areaSqFt: 4600,
        priceDisplay: '₹ 5.80 Cr',
        price: 58000000,
        photosCount: 14,
        isAvailable: true,
      },
    ],
  },
  {
    id: 'proj-03',
    organizationId: 'org-apex-01',
    name: 'Emerald Greenfield Plots',
    category: 'Residential',
    subtype: 'Plot / Land',
    isPlot: true,
    status: 'ACTIVE',
    saleVsRent: 'SALE',
    priceDisplay: '₹ 95.00 L*',
    price: 9500000,
    address: 'Wagholi Foothills Sector 4',
    city: 'Pune',
    state: 'Maharashtra',
    pincode: '412207',
    contactNumber: '+91 98765 43212',
    website: 'https://apex-luxury.in/greenfield-plots',
    amenities: ['Wide Asphalt Internal Roads', 'Gated Community Perimeter', 'Underground Utilities', 'Street Lighting'],
    autoSavedAt: 'Yesterday',
    // NO BHK, NO FLOOR, NO FURNISHING FOR PLOTS
    areaSqFt: 2400,
    facing: 'East Facing Vastu Compliant',
    possession: 'Immediate Registry Available',
    mediaCount: 8,
    units: [
      {
        id: 'unit-03-a',
        organizationId: 'org-apex-01',
        projectId: 'proj-03',
        name: 'Plot No. 14 (Corner)',
        type: 'Plot / Land',
        areaSqFt: 2400,
        priceDisplay: '₹ 95.00 L',
        price: 9500000,
        photosCount: 4,
        isAvailable: true,
      },
      {
        id: 'unit-03-b',
        organizationId: 'org-apex-01',
        projectId: 'proj-03',
        name: 'Plot No. 22 (Park Facing)',
        type: 'Plot / Land',
        areaSqFt: 3000,
        priceDisplay: '₹ 1.18 Cr',
        price: 11800000,
        photosCount: 4,
        isAvailable: true,
      },
    ],
  },
  {
    id: 'proj-04',
    organizationId: 'org-apex-01',
    name: 'Apex Tech Park Tower A',
    category: 'Commercial',
    subtype: 'Office Space',
    isPlot: false,
    status: 'ACTIVE',
    saleVsRent: 'LEASE',
    priceDisplay: '₹ 1.20 Cr / Year',
    price: 12000000,
    address: 'Outer Ring Road, Marathahalli Junction',
    city: 'Bengaluru',
    state: 'Karnataka',
    pincode: '560103',
    contactNumber: '+91 98765 43213',
    website: 'https://apex-luxury.in/tech-park-tower-a',
    amenities: ['High Speed Elevators', '100% DG Power Backup', 'LEED Gold Certified', 'Cafeteria & Food Court'],
    autoSavedAt: '10:15 AM',
    usableAreaSqFt: 12500,
    floorOrBuilding: 'Floor 6 (Warm Shell)',
    frontageFt: 85,
    lifts: 6,
    washrooms: 8,
    powerBackup: true,
    commercialParking: '20 Dedicated Basement Slots',
    leaseTerms: 'Minimum 5 Year Lock-in Period',
    mediaCount: 14,
    units: [
      {
        id: 'unit-04-a',
        organizationId: 'org-apex-01',
        projectId: 'proj-04',
        name: 'Wing 6A - Grade A Corporate Bay',
        type: 'Office Space',
        areaSqFt: 6250,
        priceDisplay: '₹ 60 L / Year',
        price: 6000000,
        photosCount: 6,
        isAvailable: true,
      },
      {
        id: 'unit-04-b',
        organizationId: 'org-apex-01',
        projectId: 'proj-04',
        name: 'Wing 6B - Tech Incubator Floor',
        type: 'Office Space',
        areaSqFt: 6250,
        priceDisplay: '₹ 60 L / Year',
        price: 6000000,
        photosCount: 6,
        isAvailable: true,
      },
    ],
  },
  {
    id: 'proj-05',
    organizationId: 'org-apex-01',
    name: 'Skyline Commercial Plaza',
    category: 'Commercial',
    subtype: 'Retail Shop',
    isPlot: false,
    status: 'DRAFT',
    saleVsRent: 'SALE',
    priceDisplay: '₹ 1.85 Cr*',
    price: 18500000,
    address: 'Linking Road, Bandra West',
    city: 'Mumbai',
    state: 'Maharashtra',
    pincode: '400050',
    contactNumber: '+91 98765 43214',
    website: 'https://apex-luxury.in/skyline-plaza',
    amenities: ['High Footfall Arterial Facing', 'Central Air Conditioning', 'Escalator Access', 'Valet Parking'],
    autoSavedAt: 'Just now',
    usableAreaSqFt: 850,
    floorOrBuilding: 'Ground Floor Shop G-04',
    frontageFt: 28,
    lifts: 2,
    washrooms: 2,
    powerBackup: true,
    commercialParking: '2 Dedicated Valet Slots',
    mediaCount: 6,
    units: [],
  },
  {
    id: 'proj-06',
    organizationId: 'org-apex-01',
    name: 'Metro Logistics Hub',
    category: 'Industrial',
    subtype: 'Warehouse',
    isPlot: false,
    status: 'ACTIVE',
    saleVsRent: 'LEASE',
    priceDisplay: '₹ 18.00 L / Month',
    price: 1800000,
    address: 'Mumbai-Nashik Highway Corridor',
    city: 'Bhiwandi',
    state: 'Maharashtra',
    pincode: '421302',
    contactNumber: '+91 98765 43215',
    website: 'https://apex-luxury.in/metro-logistics',
    amenities: ['Heavy Vehicle Turning Radius', 'Fire Sprinkler Grid', '24/7 Gatehouse Security', 'Truck Staging Yard'],
    autoSavedAt: '3 days ago',
    industrialType: 'PEB Pre-Engineered Warehouse',
    accessRoadWidthFt: 80,
    powerLoadKw: 250,
    loadingDocks: 12,
    ceilingHeightFt: 36,
    permittedUse: 'Logistics, FMCG Staging & Heavy Storage',
    mediaCount: 10,
    units: [],
  },
];
