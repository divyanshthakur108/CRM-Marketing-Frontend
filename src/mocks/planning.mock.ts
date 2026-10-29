// MOCK DATA - Phase 4 AI Marketing Planning Suite
import { PlanningStatus } from '../components/ui/StatusPill';

export interface BrandProfile {
  organizationId: string;
  brandName: string;
  tagline: string;
  logoUrl: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    surface: string;
  };
  typographyFont: string;
  toneOfVoice: string;
  languages: ('English' | 'Hindi' | 'Hinglish')[];
  disclaimers: string;
  reraNumber: string;
  legalEntity: string;
  updatedAt: string;
}

export interface AudienceBrief {
  id: string;
  organizationId: string;
  projectId: string;
  projectName: string;
  targetPersona: string;
  objective: 'AWARENESS' | 'LEAD_GEN' | 'SITE_VISIT' | 'INVESTOR_ACQUISITION';
  locations: string[];
  budgetAllocationShare: string;
  incomeBracket: string;
  keyAppealDrivers: string[];
  housingAdComplianceNotice: string;
}

export interface ProjectBudgetAllocation {
  projectId: string;
  projectName: string;
  allocatedAmount: number;
  metaAds: number;
  googleAds: number;
  linkedinAds: number;
  directWhatsapp: number;
}

export interface CalendarItem {
  id: string;
  organizationId: string;
  projectId: string;
  projectName: string;
  title: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  format: 'INSTAGRAM_REEL' | 'FACEBOOK_CAROUSEL' | 'LINKEDIN_POST' | 'WHATSAPP_BROADCAST' | 'YOUTUBE_SHORTS' | 'PRINT_FLYER';
  channelType: 'ORGANIC' | 'PAID';
  status: PlanningStatus;
  copySnippet: string;
  previewUrl: string;
  targetAudience: string;
  ctaText: string;
}

export interface PlanReviewItem {
  id: string;
  organizationId: string;
  cycleName: string;
  projectId: string;
  projectName: string;
  scheduledPeriod: string;
  totalCreatives: number;
  allocatedBudget: number;
  strategySummary: string;
  status: PlanningStatus;
  items: {
    id: string;
    title: string;
    format: string;
    scheduledDate: string;
    channel: string;
    hook: string;
  }[];
  comments: {
    id: string;
    author: string;
    date: string;
    text: string;
  }[];
}

export interface CreativeApprovalItem {
  id: string;
  organizationId: string;
  projectId: string;
  projectName: string;
  creativeTitle: string;
  format: 'INSTAGRAM_REEL' | 'FACEBOOK_CAROUSEL' | 'LINKEDIN_POST' | 'WHATSAPP_BROADCAST';
  channel: string;
  assetUrl: string;
  copyHeadline: string;
  bodyCopy: string;
  cta: string;
  status: PlanningStatus;
  checklist: {
    priceVerified: boolean;
    priceDetails: string;
    bedroomsVerified: boolean;
    bedroomDetails: string;
    amenitiesVerified: boolean;
    amenitiesDetails: string;
    ctaVerified: boolean;
    ctaDetails: string;
    reraDisclaimerVerified: boolean;
    reraDetails: string;
  };
  revisions: {
    id: string;
    author: string;
    date: string;
    text: string;
  }[];
}

// -----------------------------------------------------------------------------
// MOCK DATA IMPLEMENTATIONS
// -----------------------------------------------------------------------------

export const MOCK_BRAND_PROFILE: BrandProfile = {
  organizationId: 'org-apex-01',
  brandName: 'Apex Luxe Realty & Infrastructure',
  tagline: 'Architectural Eminence & Refined Living',
  logoUrl: 'https://images.unsplash.com/photo-1541888946425-d0fbb1861593?w=300&auto=format&fit=crop&q=80',
  colors: {
    primary: '#000000',
    secondary: '#FFFFFF',
    accent: '#525252',
    surface: '#F5F5F5',
  },
  typographyFont: 'Inter & Outfit Pro Display',
  toneOfVoice: 'Authoritative & Sophisticated Luxury',
  languages: ['English', 'Hindi', 'Hinglish'],
  disclaimers:
    'RERA Registration No: HRERA-PKL-GGM-1482-2024. Available at https://haryanarera.gov.in. All dimensions, specifications, artistic renders, and visuals are indicative and subject to changes by competent authorities. 1 Sq. Mt. = 10.764 Sq. Ft. T&C Apply.',
  reraNumber: 'HRERA-PKL-GGM-1482-2024',
  legalEntity: 'Apex Realty Developers LLP',
  updatedAt: '2026-10-24T10:30:00Z',
};

export const MOCK_AUDIENCE_BRIEFS: AudienceBrief[] = [
  {
    id: 'brief-01',
    organizationId: 'org-apex-01',
    projectId: 'proj-01',
    projectName: 'The Palm Residences',
    targetPersona: 'Ultra-High-Net-Worth Executives & Tech Founders',
    objective: 'LEAD_GEN',
    locations: ['Golf Course Extension Road', 'Cyber City Gurugram', 'South Delhi (Vasant Vihar)', 'Aerocity Hub'],
    budgetAllocationShare: '45% of Monthly Spend',
    incomeBracket: 'Annual Household Income ₹ 75 Lac+',
    keyAppealDrivers: [
      'Private High-Speed Elevator Lobby to Unit',
      'Panoramic Sky Terrace Lounge on 28th Floor',
      '3-Tier Biometric Perimeter Security',
      'Immediate Title Deed & Registry Handover',
    ],
    housingAdComplianceNotice:
      'CRITICAL HOUSING AD NOTICE: Per Fair Housing and Meta/Google Special Ad Categories (Housing), targeting or exclusion by age, gender, parental status, or specific zip code radiuses (<15km) is strictly disabled. Campaigns rely strictly on broad geographic radiuses and verified property intent signals.',
  },
  {
    id: 'brief-02',
    organizationId: 'org-apex-01',
    projectId: 'proj-02',
    projectName: 'Cyber One Suites',
    targetPersona: 'Institutional Investors & Gulf NRI Family Offices',
    objective: 'INVESTOR_ACQUISITION',
    locations: ['DLF Cyber City Phase II', 'Aerocity Hospitality District', 'BKC Mumbai Expats', 'Dubai NRI Investor Desks'],
    budgetAllocationShare: '35% of Monthly Spend',
    incomeBracket: 'Corporate Portfolios & Accredit Investment Funds',
    keyAppealDrivers: [
      '9.2% Guaranteed Gross Annualized Rental Yield',
      'Fortune 500 MNC Anchor Tenant Locked 9 Years',
      '100% DG Power Redundancy with N+1 Backup',
    ],
    housingAdComplianceNotice:
      'CRITICAL HOUSING AD NOTICE: Commercial property ads adhere to truth-in-advertising guidelines. Guaranteed yield statements must prominently cite master lease agreements and statutory RERA disclosures.',
  },
  {
    id: 'brief-03',
    organizationId: 'org-apex-01',
    projectId: 'proj-03',
    projectName: 'Apex Logistics Park',
    targetPersona: 'Supply Chain Directors & E-Commerce Logistics Heads',
    objective: 'SITE_VISIT',
    locations: ['Delhi-Jaipur Freight Highway', 'Manesar IMT Industrial Belt', 'Faridabad Bypass Corridor'],
    budgetAllocationShare: '20% of Monthly Spend',
    incomeBracket: 'Corporate Logistics Fleet & 3PL Operators',
    keyAppealDrivers: [
      '36ft Clear High-Bay Ceiling Height',
      '12 Hydraulic Dock Levelers with Weather Canopies',
      'Direct 80ft Multi-Axle Trailer Access Road',
    ],
    housingAdComplianceNotice:
      'INDUSTRIAL ZONING COMPLIANCE: Land-use permits restrict warehousing to non-polluting dry logistics and light assembly. Heavy manufacturing zoning subject to pollution control board clearance.',
  },
];

export const MOCK_PROJECT_ALLOCATIONS: ProjectBudgetAllocation[] = [
  {
    projectId: 'proj-01',
    projectName: 'The Palm Residences',
    allocatedAmount: 225000,
    metaAds: 120000,
    googleAds: 75000,
    linkedinAds: 20000,
    directWhatsapp: 10000,
  },
  {
    projectId: 'proj-02',
    projectName: 'Cyber One Suites',
    allocatedAmount: 160000,
    metaAds: 60000,
    googleAds: 65000,
    linkedinAds: 25000,
    directWhatsapp: 10000,
  },
  {
    projectId: 'proj-03',
    projectName: 'Apex Logistics Park',
    allocatedAmount: 75000,
    metaAds: 25000,
    googleAds: 30000,
    linkedinAds: 15000,
    directWhatsapp: 5000,
  },
];

export const MOCK_CALENDAR_ITEMS: CalendarItem[] = [
  {
    id: 'cal-01',
    organizationId: 'org-apex-01',
    projectId: 'proj-01',
    projectName: 'The Palm Residences',
    title: 'Sunset Penthouse Video Walkthrough',
    date: '2026-11-04',
    time: '18:00',
    format: 'INSTAGRAM_REEL',
    channelType: 'PAID',
    status: 'Scheduled',
    copySnippet: 'Step onto the 28th floor private terrace. 3,850 sq ft of bespoke architectural eminence on Golf Course Extension.',
    previewUrl: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=600&auto=format&fit=crop&q=80',
    targetAudience: 'Ultra-High-Net-Worth Executives',
    ctaText: 'Schedule Private Walkthrough',
  },
  {
    id: 'cal-02',
    organizationId: 'org-apex-01',
    projectId: 'proj-02',
    projectName: 'Cyber One Suites',
    title: '9.2% Pre-Leased Commercial Yield Deep-Dive',
    date: '2026-11-05',
    time: '11:30',
    format: 'LINKEDIN_POST',
    channelType: 'ORGANIC',
    status: 'Approved',
    copySnippet: 'Why institutional capital is prioritizing Grade-A commercial office suites in Cyber City with 9-year institutional lock-ins.',
    previewUrl: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=600&auto=format&fit=crop&q=80',
    targetAudience: 'Institutional Investors & Family Offices',
    ctaText: 'Download Yield Audit Report',
  },
  {
    id: 'cal-03',
    organizationId: 'org-apex-01',
    projectId: 'proj-03',
    projectName: 'Apex Logistics Park',
    title: 'Direct 80ft Highway Arterial Access',
    date: '2026-11-06',
    time: '14:00',
    format: 'FACEBOOK_CAROUSEL',
    channelType: 'PAID',
    status: 'Launching',
    copySnippet: 'Eliminate freight bottleneck: Direct access to Delhi-Jaipur interchange engineered for 40ft high-cube trailers.',
    previewUrl: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=600&auto=format&fit=crop&q=80',
    targetAudience: 'Supply Chain Directors',
    ctaText: 'Request Logistics Layout Specs',
  },
  {
    id: 'cal-04',
    organizationId: 'org-apex-01',
    projectId: 'proj-01',
    projectName: 'The Palm Residences',
    title: 'Exclusive VIP Weekend Preview Invitation',
    date: '2026-11-08',
    time: '10:00',
    format: 'WHATSAPP_BROADCAST',
    channelType: 'ORGANIC',
    status: 'Draft',
    copySnippet: 'Personal invitation for private access to the newly completed model suite. Valet parking & hospitality arranged.',
    previewUrl: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600&auto=format&fit=crop&q=80',
    targetAudience: 'Verified HNI Inquiries',
    ctaText: 'Confirm Attendance',
  },
  {
    id: 'cal-05',
    organizationId: 'org-apex-01',
    projectId: 'proj-02',
    projectName: 'Cyber One Suites',
    title: '14th Floor Executive Sky Lounge 3D Tour',
    date: '2026-11-10',
    time: '17:00',
    format: 'YOUTUBE_SHORTS',
    channelType: 'PAID',
    status: 'Generated',
    copySnippet: 'A business lounge designed for landmark transactions. Unobstructed panoramic city horizons.',
    previewUrl: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=600&auto=format&fit=crop&q=80',
    targetAudience: 'Corporate Buyers',
    ctaText: 'View 360 Virtual Tour',
  },
  {
    id: 'cal-06',
    organizationId: 'org-apex-01',
    projectId: 'proj-01',
    projectName: 'The Palm Residences',
    title: 'RERA Compliance & Possession Timeline Breakdown',
    date: '2026-11-12',
    time: '12:00',
    format: 'FACEBOOK_CAROUSEL',
    channelType: 'PAID',
    status: 'Needs Action',
    copySnippet: 'Phase 1 possession verified. Complete statutory documentation and inspection dossiers available for download.',
    previewUrl: 'https://images.unsplash.com/photo-1600565193348-f74bd3c7ccdf?w=600&auto=format&fit=crop&q=80',
    targetAudience: 'Luxury Homebuyers',
    ctaText: 'View RERA Certification',
  },
  {
    id: 'cal-07',
    organizationId: 'org-apex-01',
    projectId: 'proj-03',
    projectName: 'Apex Logistics Park',
    title: 'Sanctioned 250KW Substation Infrastructure',
    date: '2026-11-14',
    time: '15:30',
    format: 'LINKEDIN_POST',
    channelType: 'ORGANIC',
    status: 'Paused',
    copySnippet: 'Dedicated high-tension power substation operational for cold chain and automation systems.',
    previewUrl: 'https://images.unsplash.com/photo-1553413077-190dd305871c?w=600&auto=format&fit=crop&q=80',
    targetAudience: 'Industrial Operators',
    ctaText: 'Inspect Power Infrastructure',
  },
  {
    id: 'cal-08',
    organizationId: 'org-apex-01',
    projectId: 'proj-01',
    projectName: 'The Palm Residences',
    title: 'Grand Olympic-Size Heated Pool Showcase',
    date: '2026-11-18',
    time: '19:00',
    format: 'INSTAGRAM_REEL',
    channelType: 'PAID',
    status: 'Active/Done',
    copySnippet: '25,000 sq ft master clubhouse with all-season temperature-controlled indoor aquatic facilities.',
    previewUrl: 'https://images.unsplash.com/photo-1571888160370-13f886f40954?w=600&auto=format&fit=crop&q=80',
    targetAudience: 'Luxury Resident Community',
    ctaText: 'Explore Clubhouse Amenities',
  },
];

export const MOCK_PLAN_REVIEWS: PlanReviewItem[] = [
  {
    id: 'plan-01',
    organizationId: 'org-apex-01',
    cycleName: 'Q4 Festive High-Rise Launch Blitz',
    projectId: 'proj-01',
    projectName: 'The Palm Residences',
    scheduledPeriod: 'Nov 01 - Nov 30, 2026',
    totalCreatives: 18,
    allocatedBudget: 225000,
    strategySummary:
      'High-impact multi-channel campaign targeting affluent buyers in Gurugram & South Delhi, emphasizing ready-to-move penthouses and 28th-floor sky amenities.',
    status: 'Needs Action',
    items: [
      {
        id: 'pi-01',
        title: 'Sunset Penthouse Video Reel',
        format: 'Instagram 9:16 Video',
        scheduledDate: '2026-11-04',
        channel: 'Meta Paid Ads',
        hook: 'Ever wondered what Golf Course Extension looks like from 300ft in the air?',
      },
      {
        id: 'pi-02',
        title: 'Exclusive Weekend Preview Invite',
        format: 'WhatsApp Interactive Broadcast',
        scheduledDate: '2026-11-08',
        channel: 'WhatsApp Business API',
        hook: 'You are cordially invited to the preview of Model Suite 28A.',
      },
      {
        id: 'pi-03',
        title: 'RERA Compliance & Possession Timeline',
        format: 'Facebook 1:1 Carousel',
        scheduledDate: '2026-11-12',
        channel: 'Meta Paid Ads',
        hook: 'Transparency is luxury: View official registry and occupancy certificates.',
      },
      {
        id: 'pi-04',
        title: 'Clubhouse Heated Aquatic Center',
        format: 'Instagram 9:16 Reel',
        scheduledDate: '2026-11-18',
        channel: 'Meta Paid Ads',
        hook: 'Winter swimming in Gurugram? Welcome to our indoor temperature-controlled pool.',
      },
    ],
    comments: [
      {
        id: 'c-01',
        author: 'Siddharth V. (Marketing Lead)',
        date: '2026-10-25 14:20',
        text: 'Initial creative batch prepared. Please review the RERA disclosure placement on the carousel cards.',
      },
      {
        id: 'c-02',
        author: 'Vikramaditya S. (Managing Director)',
        date: '2026-10-25 16:45',
        text: 'The reel hook is strong, but make sure the pricing disclaimer mentions "Starting at ₹ 2.45 Cr*". Requesting revision on item #3.',
      },
    ],
  },
  {
    id: 'plan-02',
    organizationId: 'org-apex-01',
    cycleName: 'Cyber One Pre-Leased Yield Syndicate',
    projectId: 'proj-02',
    projectName: 'Cyber One Suites',
    scheduledPeriod: 'Nov 01 - Nov 30, 2026',
    totalCreatives: 12,
    allocatedBudget: 160000,
    strategySummary:
      'B2B investment acquisition campaign targeted at Gulf NRI investors and domestic family offices for pre-leased Grade-A office suites.',
    status: 'Approved',
    items: [
      {
        id: 'pi-05',
        title: '9.2% Pre-Leased Commercial Yield Audit',
        format: 'LinkedIn PDF Whitepaper Carousel',
        scheduledDate: '2026-11-05',
        channel: 'LinkedIn Sponsored Content',
        hook: 'Comparing Commercial Real Estate vs Equities: Why 9.2% yields win in volatile markets.',
      },
      {
        id: 'pi-06',
        title: '14th Floor Executive Sky Lounge 3D Tour',
        format: 'YouTube Shorts (9:16)',
        scheduledDate: '2026-11-10',
        channel: 'Google Display / Video',
        hook: 'Corporate elegance defined: The Sky Lounge at Cyber One.',
      },
    ],
    comments: [
      {
        id: 'c-03',
        author: 'Priya K. (Investment Analyst)',
        date: '2026-10-24 11:15',
        text: 'All yield calculations reconciled with tenant lease agreements. Plan approved for distribution.',
      },
    ],
  },
];

export const MOCK_APPROVAL_CREATIVES: CreativeApprovalItem[] = [
  {
    id: 'appr-01',
    organizationId: 'org-apex-01',
    projectId: 'proj-01',
    projectName: 'The Palm Residences',
    creativeTitle: 'Sunset Penthouse 3BHK Video Ad',
    format: 'INSTAGRAM_REEL',
    channel: 'Instagram Sponsored Reel (Meta)',
    assetUrl: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&auto=format&fit=crop&q=80',
    copyHeadline: 'Elevate Above Gurugram: 3 BHK Luxury Penthouse Suite',
    bodyCopy:
      'Immerse in unparalleled luxury at Golf Course Extension Road. Featuring a double-height living room, 28th-floor private panoramic terrace, and 2 dedicated parking bays. Ready for immediate registry.',
    cta: 'Book Private Site Walkthrough',
    status: 'Needs Action',
    checklist: {
      priceVerified: true,
      priceDetails: 'Verified: ₹ 2.45 Cr* matches RERA master price list for 3BHK Penthouse.',
      bedroomsVerified: true,
      bedroomDetails: 'Verified: 3 BHK Luxury Suite correctly listed.',
      amenitiesVerified: true,
      amenitiesDetails: 'Verified: Heated Indoor Pool, 24/7 Security, and Sky Lounge are active Phase 1 amenities.',
      ctaVerified: true,
      ctaDetails: 'Verified: Destination link connects to official RERA verified booking portal.',
      reraDisclaimerVerified: false,
      reraDetails: 'FAILED: RERA registration number must appear with font size $\\ge$ 10pt at base of video frame.',
    },
    revisions: [
      {
        id: 'rev-01',
        author: 'Compliance Legal Officer',
        date: '2026-10-25 18:30',
        text: 'Please re-export the video with HRERA-PKL-GGM-1482-2024 visible throughout the final 3 seconds.',
      },
    ],
  },
  {
    id: 'appr-02',
    organizationId: 'org-apex-01',
    projectId: 'proj-02',
    projectName: 'Cyber One Suites',
    creativeTitle: 'Commercial Pre-Leased 9.2% Yield Announcement',
    format: 'LINKEDIN_POST',
    channel: 'LinkedIn Feed Sponsored',
    assetUrl: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&auto=format&fit=crop&q=80',
    copyHeadline: 'Institutional Grade-A Commercial Asset | 9.2% Guaranteed Gross Yield',
    bodyCopy:
      'Pre-leased to multinational technology leaders with a 9-year institutional lease lock-in. Located in Cyber City Sector 65 with 100% DG power backup and high-speed elevator banks.',
    cta: 'Download Institutional Dossier',
    status: 'Approved',
    checklist: {
      priceVerified: true,
      priceDetails: 'Verified: ₹ 1.85 Cr rate display matches commercial master schedule.',
      bedroomsVerified: true,
      bedroomDetails: 'Verified: N/A for commercial; floor area (3,500 sq ft) accurate.',
      amenitiesVerified: true,
      amenitiesDetails: 'Verified: DG Power Backup and High Speed Lifts verified on site.',
      ctaVerified: true,
      ctaDetails: 'Verified: Leads to authenticated investor dataroom.',
      reraDisclaimerVerified: true,
      reraDetails: 'Verified: Full commercial RERA disclosure included in post footer.',
    },
    revisions: [],
  },
  {
    id: 'appr-03',
    organizationId: 'org-apex-01',
    projectId: 'proj-03',
    projectName: 'Apex Logistics Park',
    creativeTitle: 'Grade-A Logistics Warehouse Trailer Access',
    format: 'FACEBOOK_CAROUSEL',
    channel: 'Facebook Business Feeds',
    assetUrl: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800&auto=format&fit=crop&q=80',
    copyHeadline: '36ft High-Bay Logistics Shed with 12 Hydraulic Levelers',
    bodyCopy:
      'Direct 80ft arterial road connectivity 12 minutes from Delhi-Jaipur interchange. Engineered for heavy multi-axle freight with 250KW sanctioned substation load.',
    cta: 'Request Engineering Blueprint',
    status: 'Approved',
    checklist: {
      priceVerified: true,
      priceDetails: 'Verified: Rental rate ₹ 45 / sq ft is accurate.',
      bedroomsVerified: true,
      bedroomDetails: 'Verified: Industrial land classification accurate.',
      amenitiesVerified: true,
      amenitiesDetails: 'Verified: 12 Hydraulic Docks & 36ft ceiling height verified in engineering plan.',
      ctaVerified: true,
      ctaDetails: 'Verified: Direct phone & blueprint request webhook active.',
      reraDisclaimerVerified: true,
      reraDetails: 'Verified: Industrial industrial-estate approvals attached.',
    },
    revisions: [],
  },
];
