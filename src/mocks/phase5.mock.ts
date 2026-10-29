// MOCK DATA - Phase 5 Remaining Pages and Workflows
import { PlanningStatus } from '../components/ui/StatusPill';

// -----------------------------------------------------------------------------
// 1. AI CREATIVE STUDIO
// -----------------------------------------------------------------------------
export interface CreativeStudioItem {
  id: string;
  organizationId: string;
  title: string;
  projectId: string;
  projectName: string;
  format: '1:1' | '4:5' | '9:16';
  aspectRatio: string;
  status: PlanningStatus;
  prompt: string;
  currentVersion: number;
  versions: {
    version: number;
    assetUrl: string;
    timestamp: string;
    prompt: string;
    changeSummary: string;
  }[];
  focalPoints: string[];
}

export const MOCK_STUDIO_CREATIVES: CreativeStudioItem[] = [
  {
    id: 'cst-01',
    organizationId: 'org-apex-01',
    title: 'The Palm Residences - Twilight Penthouse Sky View',
    projectId: 'proj-01',
    projectName: 'The Palm Residences',
    format: '4:5',
    aspectRatio: '4:5 Portrait Feed',
    status: 'Approved',
    prompt:
      'Ultra-luxury modern penthouse terrace during twilight golden hour, double height glass facade, Gurugram skyline in background, subtle warm lighting, architectural photography style, 8k resolution',
    currentVersion: 3,
    versions: [
      {
        version: 3,
        assetUrl: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&auto=format&fit=crop&q=80',
        timestamp: '2026-10-25 15:30',
        prompt: 'Twilight golden hour with corrected warm architectural lighting & sharp glass reflection',
        changeSummary: 'Adjusted terrace ambient illumination and RERA font space',
      },
      {
        version: 2,
        assetUrl: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&auto=format&fit=crop&q=80',
        timestamp: '2026-10-24 11:20',
        prompt: 'Daytime perspective with expansive balcony view',
        changeSummary: 'Initial wide angle render',
      },
      {
        version: 1,
        assetUrl: 'https://images.unsplash.com/photo-1600565193348-f74bd3c7ccdf?w=800&auto=format&fit=crop&q=80',
        timestamp: '2026-10-23 09:15',
        prompt: 'Rough architectural wireframe concept render',
        changeSummary: 'Base geometry layout test',
      },
    ],
    focalPoints: ['28th Floor Sky Terrace', 'Infinity Edge Glass Balustrade', 'Golf Course Greenery'],
  },
  {
    id: 'cst-02',
    organizationId: 'org-apex-01',
    title: 'Cyber One Suites - Corporate Grand Atrium',
    projectId: 'proj-02',
    projectName: 'Cyber One Suites',
    format: '1:1',
    aspectRatio: '1:1 Square Feed',
    status: 'Generated',
    prompt:
      'Triple-height corporate lobby in commercial office tower, Italian statuario marble flooring, high-speed destination elevators, corporate executives in suits, sleek architectural minimalist aesthetics',
    currentVersion: 2,
    versions: [
      {
        version: 2,
        assetUrl: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&auto=format&fit=crop&q=80',
        timestamp: '2026-10-25 12:10',
        prompt: 'Updated corporate entrance with branded reception desk',
        changeSummary: 'Added Fortune 500 corporate signage integration',
      },
      {
        version: 1,
        assetUrl: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&auto=format&fit=crop&q=80',
        timestamp: '2026-10-24 16:40',
        prompt: 'Initial interior lobby design render',
        changeSummary: 'First pass lighting balance',
      },
    ],
    focalPoints: ['Triple-Height Marble Lobby', 'Destination Elevators', 'Turnstile Access Control'],
  },
  {
    id: 'cst-03',
    organizationId: 'org-apex-01',
    title: 'Palm Residences - Heated Olympic Indoor Pool Reel',
    projectId: 'proj-01',
    projectName: 'The Palm Residences',
    format: '9:16',
    aspectRatio: '9:16 Vertical Reel',
    status: 'Needs Action',
    prompt:
      'Indoor heated Olympic lap pool inside luxury residential clubhouse, timber slatted ceiling, acoustic panels, floor-to-ceiling glass wall looking onto landscaped Japanese garden, serene morning light',
    currentVersion: 1,
    versions: [
      {
        version: 1,
        assetUrl: 'https://images.unsplash.com/photo-1571888160370-13f886f40954?w=800&auto=format&fit=crop&q=80',
        timestamp: '2026-10-25 09:45',
        prompt: 'Indoor heated pool morning architectural capture',
        changeSummary: 'Base version generated',
      },
    ],
    focalPoints: ['Olympic Lap Pool', 'Timber Ceiling Architecture', 'Garden Landscape Vista'],
  },
];

// -----------------------------------------------------------------------------
// 2. CAPTION STUDIO
// -----------------------------------------------------------------------------
export interface CaptionStudioItem {
  id: string;
  projectId: string;
  projectName: string;
  title: string;
  angle: string;
  languages: {
    English: { hook: string; short: string; long: string; hashtags: string[]; cta: string };
    Hindi: { hook: string; short: string; long: string; hashtags: string[]; cta: string };
    Hinglish: { hook: string; short: string; long: string; hashtags: string[]; cta: string };
  };
}

export const MOCK_CAPTION_STUDIO_ITEMS: CaptionStudioItem[] = [
  {
    id: 'cap-01',
    projectId: 'proj-01',
    projectName: 'The Palm Residences',
    title: 'Sunset Penthouse Ad Copy',
    angle: 'Luxury Architectural Eminence',
    languages: {
      English: {
        hook: 'Ever wondered what Golf Course Extension looks like from 300ft in the air?',
        short: 'Bespoke 3BHK Penthouse on Golf Course Extension. 3,850 sq ft of architectural eminence with private sky terrace. Ready for immediate registry.',
        long: 'Welcome to an elevated echelon of NCR living. The Palm Residences features bespoke 3 and 4 BHK luxury penthouse suites with double-height living areas, private elevator foyers, and unobstructed panoramic horizons across the Aravallis. Every square foot is engineered for discerning connoisseurs.\n\n✓ Ready to Move | Immediate Registry Available\n✓ 25,000 Sq Ft Master Clubhouse with Heated Indoor Pool\n✓ 3-Tier Biometric Security & 2 Covered Parking Bays',
        hashtags: ['#LuxuryRealEstate', '#GurugramPenthouse', '#GolfCourseExtension', '#ThePalmResidences', '#ApexLuxe'],
        cta: 'Book Private Site Walkthrough',
      },
      Hindi: {
        hook: 'क्या आपने कभी गोल्फ कोर्स एक्सटेंशन को 300 फीट की ऊंचाई से देखा है?',
        short: 'गोल्फ कोर्स एक्सटेंशन पर 3BHK लग्जरी पेंटहाउस। 3,850 वर्ग फुट का निजी स्काई टैरेस और तुरंत रजिस्ट्री।',
        long: 'एनसीआर में अद्वितीय विलासिता का नया प्रतीक — द पाम रेजिडेंस। 28वीं मंजिल पर स्थित निजी स्काई टैरेस, डबल-हाइट लिविंग रूम और अरावली के विहंगम दृश्य।\n\n✓ रेडी टू मूव | तुरंत रजिस्ट्री उपलब्ध\n✓ 25,000 वर्ग फुट का ग्रैंड क्लब हाउस और इनडोर गर्म स्विमिंग पूल\n✓ 24/7 त्रि-स्तरीय बायोमेट्रिक सुरक्षा',
        hashtags: ['#लक्जरी_घर', '#गुरुग्राम_रियल_एस्टेट', '#पाम_रेजिडेंस', '#प्रॉपर्टी'],
        cta: 'प्राइवेट वॉकथ्रू बुक करें',
      },
      Hinglish: {
        hook: 'Golf Course Extension ka sabse exclusive view — 300ft above the city.',
        short: 'The Palm Residences mein bespoke 3BHK Penthouse. 3,850 sq ft ka private sky terrace aur immediate registry available.',
        long: 'Agar aap luxury NCR address dhoondh rahe hain jo real exclusivity deliver kare, welcome to The Palm Residences. Double-height ceilings, private high-speed elevator, aur Aravali hills ka panoramic view.\n\n✓ Ready to Move | Registry Ready\n✓ 25k sq ft clubhouse with heated indoor pool\n✓ 2 dedicated covered parking slots',
        hashtags: ['#GurugramLuxuryHomes', '#PenthouseNCR', '#RealEstateIndia', '#ThePalmResidences'],
        cta: 'Schedule Private Walkthrough',
      },
    },
  },
  {
    id: 'cap-02',
    projectId: 'proj-02',
    projectName: 'Cyber One Suites',
    title: '9.2% Assured Yield Commercial Ad',
    angle: 'Institutional Grade-A Wealth Creation',
    languages: {
      English: {
        hook: 'Comparing Commercial Real Estate vs Equities: Why 9.2% yields win in volatile markets.',
        short: 'Pre-leased Grade-A commercial office suites in Cyber City. 9-year institutional lock-in with Fortune 500 MNC anchor.',
        long: 'Institutional capital demands resilience and predictable cashflows. Cyber One Suites offers institutional grade-A commercial office floors in Sector 65 Gurugram, pre-leased with a 9-year lock-in period yielding 9.2% gross returns.\n\n✓ Fortune 500 Multinational Anchor Tenant\n✓ 100% DG Power Backup & Dual High-Speed Elevator Banks\n✓ Complete RERA & Title Due Diligence Dossier Available',
        hashtags: ['#CommercialRealEstate', '#PreLeasedOffice', '#GurugramCommercial', '#HighYieldRealEstate', '#CyberOne'],
        cta: 'Download Institutional Dossier',
      },
      Hindi: {
        hook: 'शेयर बाजार की अनिश्चितता के बीच 9.2% सुनिश्चित कमर्शियल रेंटल यील्ड।',
        short: 'साइबर सिटी में प्री-लीज़्ड ग्रेड-ए ऑफिस स्पेस। फॉर्च्यून 500 एमएनसी के साथ 9 साल का संस्थागत लॉक-इन।',
        long: 'मजबूत और सुरक्षित रिटर्न के लिए साइबर वन सूट्स। 9.2% वार्षिक ग्रॉस यील्ड और अंतरराष्ट्रीय कॉर्पोरेट टेनेंट के साथ अनुबंधित ऑफिस फ्लोर्स।\n\n✓ 9-वर्षीय संस्थागत लीज लॉक-इन\n✓ 100% डीजी पावर बैकअप और हाई-स्पीड लिफ्ट्स\n✓ पूर्ण रेरा ऑडिटेड दस्तावेज उपलब्ध',
        hashtags: ['#कमर्शियल_प्रॉपर्टी', '#रेंटल_यील्ड', '#साइबर_वन'],
        cta: 'इन्वेस्टमेंट रिपोर्ट डाउनलोड करें',
      },
      Hinglish: {
        hook: 'Equities vs Commercial Real Estate: Guaranteed 9.2% yield in Cyber City.',
        short: 'Cyber One mein Grade-A pre-leased commercial office suites. 9 years lock-in with MNC tenant.',
        long: 'Predictable rental income dhundh rahe hain? Cyber One Suites offer karta hai premium commercial office spaces in Sector 65 with 9.2% assured yield and 9 years corporate lock-in.\n\n✓ Multinational IT Anchor Tenant\n✓ 100% Power Backup and High Speed Lifts\n✓ Verified Title and RERA Clearance',
        hashtags: ['#CommercialProperty', '#GurugramOffices', '#CyberOneSuites', '#PassiveIncome'],
        cta: 'Request Investment Pack',
      },
    },
  },
];

// -----------------------------------------------------------------------------
// 3. PUBLISHING LOG
// -----------------------------------------------------------------------------
export interface PublishingLogItem {
  id: string;
  creativeTitle: string;
  projectId: string;
  projectName: string;
  platform: 'Instagram' | 'Facebook' | 'LinkedIn' | 'WhatsApp';
  metaCampaignId: string;
  metaAdSetId: string;
  metaCreativeId: string;
  status: PlanningStatus;
  publishedAt: string;
  impressions: number;
  clicks: number;
  errorMessage?: string;
}

export const MOCK_PUBLISHING_LOGS: PublishingLogItem[] = [
  {
    id: 'pub-01',
    creativeTitle: 'Sunset Penthouse Video Walkthrough (4:5 Feed)',
    projectId: 'proj-01',
    projectName: 'The Palm Residences',
    platform: 'Instagram',
    metaCampaignId: 'act_982348_camp_01',
    metaAdSetId: 'adset_palm_hni_ncr',
    metaCreativeId: 'cr_98234_v3',
    status: 'Active/Done',
    publishedAt: '2026-10-25 18:00',
    impressions: 48500,
    clicks: 1840,
  },
  {
    id: 'pub-02',
    creativeTitle: '9.2% Pre-Leased Commercial Yield Whitepaper',
    projectId: 'proj-02',
    projectName: 'Cyber One Suites',
    platform: 'LinkedIn',
    metaCampaignId: 'li_camp_cyberone_09',
    metaAdSetId: 'li_adset_nri_funds',
    metaCreativeId: 'li_cr_yield_audit',
    status: 'Scheduled',
    publishedAt: '2026-11-05 11:30',
    impressions: 0,
    clicks: 0,
  },
  {
    id: 'pub-03',
    creativeTitle: 'RERA Compliance & Possession Timeline Breakdown',
    projectId: 'proj-01',
    projectName: 'The Palm Residences',
    platform: 'Facebook',
    metaCampaignId: 'act_982348_camp_02',
    metaAdSetId: 'adset_palm_delhi_south',
    metaCreativeId: 'cr_fb_rera_timeline',
    status: 'Needs Action',
    publishedAt: '2026-10-24 14:15',
    impressions: 120,
    clicks: 4,
    errorMessage: 'Meta Graph API 400: Ad creative image text overlay exceeds compliance ratio (RERA font re-check required).',
  },
  {
    id: 'pub-04',
    creativeTitle: 'Highway Freight Connectivity Layout Specs',
    projectId: 'proj-03',
    projectName: 'Apex Logistics Park',
    platform: 'Facebook',
    metaCampaignId: 'act_982348_camp_03',
    metaAdSetId: 'adset_logistics_manesar',
    metaCreativeId: 'cr_fb_industrial_trailer',
    status: 'Launching',
    publishedAt: '2026-10-26 10:00',
    impressions: 4200,
    clicks: 190,
  },
  {
    id: 'pub-05',
    creativeTitle: 'VIP Weekend Preview Private Broadcast',
    projectId: 'proj-01',
    projectName: 'The Palm Residences',
    platform: 'WhatsApp',
    metaCampaignId: 'waba_msg_campaign_08',
    metaAdSetId: 'waba_template_palm_vip',
    metaCreativeId: 'waba_hsm_invitation_01',
    status: 'Paused',
    publishedAt: '2026-10-22 17:00',
    impressions: 850,
    clicks: 412,
  },
];

// -----------------------------------------------------------------------------
// 4. META CONNECTIONS
// -----------------------------------------------------------------------------
export interface MetaConnectionState {
  facebookPage: {
    connected: boolean;
    pageName: string;
    pageId: string;
    likes: number;
    connectedAt: string;
  };
  instagramAccount: {
    connected: boolean;
    handle: string;
    accountId: string;
    followers: number;
    connectedAt: string;
  };
  adAccount: {
    connected: boolean;
    accountName: string;
    accountId: string;
    currency: string;
    pixelActive: boolean;
    billingStatus: string;
  };
}

export const MOCK_META_CONNECTIONS: MetaConnectionState = {
  facebookPage: {
    connected: true,
    pageName: 'Apex Luxe Realty & Infrastructure Official',
    pageId: '109283019238472',
    likes: 42800,
    connectedAt: '2026-08-15',
  },
  instagramAccount: {
    connected: true,
    handle: '@apexluxerealty',
    accountId: '17841402938472910',
    followers: 68400,
    connectedAt: '2026-08-15',
  },
  adAccount: {
    connected: true,
    accountName: 'Apex Realty Developers LLP (Act #982348)',
    accountId: 'act_9823482394872',
    currency: 'INR (₹)',
    pixelActive: true,
    billingStatus: 'VERIFIED & ACTIVE (Direct Debit Linked)',
  },
};

// -----------------------------------------------------------------------------
// 5. ADS & CAMPAIGNS
// -----------------------------------------------------------------------------
export interface CampaignItem {
  id: string;
  name: string;
  projectId: string;
  projectName: string;
  objective: 'LEAD_GEN' | 'SITE_VISIT' | 'AWARENESS' | 'CONVERSIONS' | 'INVESTOR_ACQUISITION';
  dailyBudget: number;
  totalSpend: number;
  status: 'ACTIVE' | 'PAUSED' | 'LEARNING' | 'COMPLETED';
  leads: number;
  cpl: number;
  ctr: string;
  roas: string;
}

export const MOCK_CAMPAIGNS: CampaignItem[] = [
  {
    id: 'cmp-01',
    name: 'The Palm Residences - HNI Ultra Luxury Blitz',
    projectId: 'proj-01',
    projectName: 'The Palm Residences',
    objective: 'LEAD_GEN',
    dailyBudget: 7500,
    totalSpend: 185000,
    status: 'ACTIVE',
    leads: 84,
    cpl: 2202,
    ctr: '2.84%',
    roas: '14.2x',
  },
  {
    id: 'cmp-02',
    name: 'Cyber One Suites - Gulf NRI Commercial Syndicate',
    projectId: 'proj-02',
    projectName: 'Cyber One Suites',
    objective: 'INVESTOR_ACQUISITION',
    dailyBudget: 5000,
    totalSpend: 120000,
    status: 'ACTIVE',
    leads: 42,
    cpl: 2857,
    ctr: '2.15%',
    roas: '18.5x',
  },
  {
    id: 'cmp-03',
    name: 'Apex Logistics - Dry Port Highway Campaign',
    projectId: 'proj-03',
    projectName: 'Apex Logistics Park',
    objective: 'SITE_VISIT',
    dailyBudget: 2500,
    totalSpend: 40000,
    status: 'PAUSED',
    leads: 16,
    cpl: 2500,
    ctr: '1.75%',
    roas: '9.4x',
  },
];

// -----------------------------------------------------------------------------
// 6. ANALYTICS (CHART TIME SERIES)
// -----------------------------------------------------------------------------
export const MOCK_ANALYTICS_TIMESERIES = [
  { date: 'Oct 01', spend: 8500, leads: 4, impressions: 16200, cpl: 2125 },
  { date: 'Oct 05', spend: 11000, leads: 5, impressions: 21500, cpl: 2200 },
  { date: 'Oct 10', spend: 14500, leads: 7, impressions: 29000, cpl: 2071 },
  { date: 'Oct 15', spend: 12000, leads: 6, impressions: 24000, cpl: 2000 },
  { date: 'Oct 20', spend: 18000, leads: 9, impressions: 38000, cpl: 2000 },
  { date: 'Oct 25', spend: 22500, leads: 11, impressions: 45000, cpl: 2045 },
  { date: 'Oct 30', spend: 25000, leads: 12, impressions: 51000, cpl: 2083 },
];

// -----------------------------------------------------------------------------
// 7. LEADS CRM
// -----------------------------------------------------------------------------
export type LeadStage =
  | 'New'
  | 'Contacted'
  | 'Qualified'
  | 'Visit scheduled'
  | 'Visit done'
  | 'Negotiation'
  | 'Won/Lost';

export interface LeadItem {
  id: string;
  name: string;
  phone: string;
  email: string;
  projectId: string;
  projectName: string;
  budget: string;
  source: 'Meta Ads' | 'WhatsApp Inbound' | 'Website Portal' | 'Direct Referral';
  stage: LeadStage;
  assignedAgent: string;
  createdAt: string;
  timeline: {
    id: string;
    date: string;
    type: string;
    summary: string;
    author: string;
  }[];
}

export const MOCK_LEADS: LeadItem[] = [
  {
    id: 'lead-101',
    name: 'Rajesh Singhania',
    phone: '+91 98110 54321',
    email: 'r.singhania@apexfin.in',
    projectId: 'proj-01',
    projectName: 'The Palm Residences',
    budget: '₹ 2.50 - 3.00 Cr',
    source: 'Meta Ads',
    stage: 'Visit scheduled',
    assignedAgent: 'Vikramaditya Sharma',
    createdAt: '2026-10-24 14:15',
    timeline: [
      {
        id: 'tl-1',
        date: '2026-10-24 14:15',
        type: 'INBOUND_SUBMISSION',
        summary: 'Lead submitted via Instagram Penthouse Reel ad',
        author: 'Meta Ads Webhook',
      },
      {
        id: 'tl-2',
        date: '2026-10-24 14:30',
        type: 'WHATSAPP_AUTO_DISPATCH',
        summary: 'Dispatched automated 3BHK brochure and interactive floorplan via WhatsApp AI',
        author: 'WhatsApp Bot',
      },
      {
        id: 'tl-3',
        date: '2026-10-25 10:00',
        type: 'SALES_CALL',
        summary: 'Spoke with client. Client looking for top floor with Aravalli view. Scheduled on-site walkthrough.',
        author: 'Vikramaditya Sharma',
      },
    ],
  },
  {
    id: 'lead-102',
    name: 'Kavita Sundaram',
    phone: '+91 98200 12894',
    email: 'kavita.s@zenithtech.com',
    projectId: 'proj-01',
    projectName: 'The Palm Residences',
    budget: '₹ 2.45 Cr',
    source: 'WhatsApp Inbound',
    stage: 'Qualified',
    assignedAgent: 'Neha Chawla',
    createdAt: '2026-10-25 09:30',
    timeline: [
      {
        id: 'tl-4',
        date: '2026-10-25 09:30',
        type: 'WHATSAPP_CHAT',
        summary: 'Inquired about possession date and RERA registration number',
        author: 'WhatsApp AI',
      },
    ],
  },
  {
    id: 'lead-103',
    name: 'Tariq Al-Mansoor',
    phone: '+971 50 829 1042',
    email: 'tariq.m@almansoorinvest.ae',
    projectId: 'proj-02',
    projectName: 'Cyber One Suites',
    budget: '₹ 5.00 Cr+',
    source: 'Meta Ads',
    stage: 'Negotiation',
    assignedAgent: 'Vikramaditya Sharma',
    createdAt: '2026-10-20 16:20',
    timeline: [
      {
        id: 'tl-5',
        date: '2026-10-20 16:20',
        type: 'NRI_INQUIRY',
        summary: 'Inquired from Dubai regarding 9.2% pre-leased commercial office floor',
        author: 'Meta Ads Webhook',
      },
      {
        id: 'tl-6',
        date: '2026-10-23 18:00',
        type: 'LEGAL_AUDIT',
        summary: 'Sent tenant institutional lease copy and gross yield calculations',
        author: 'Vikramaditya Sharma',
      },
    ],
  },
  {
    id: 'lead-104',
    name: 'Harpreet Singh Bindra',
    phone: '+91 98765 99882',
    email: 'bindra.logistics@bindragroup.com',
    projectId: 'proj-03',
    projectName: 'Apex Logistics Park',
    budget: '₹ 80,000 / mo',
    source: 'Website Portal',
    stage: 'New',
    assignedAgent: 'Neha Chawla',
    createdAt: '2026-10-26 11:00',
    timeline: [
      {
        id: 'tl-7',
        date: '2026-10-26 11:00',
        type: 'WEB_FORM',
        summary: 'Requested warehouse blueprint for 40,000 sq ft trailer dock facility',
        author: 'Website Portal',
      },
    ],
  },
  {
    id: 'lead-105',
    name: 'Dr. Amitav Banerjee',
    phone: '+91 94330 65412',
    email: 'dr.banerjee@cardiohealth.in',
    projectId: 'proj-01',
    projectName: 'The Palm Residences',
    budget: '₹ 2.80 Cr',
    source: 'Direct Referral',
    stage: 'Visit done',
    assignedAgent: 'Vikramaditya Sharma',
    createdAt: '2026-10-21 12:45',
    timeline: [
      {
        id: 'tl-8',
        date: '2026-10-24 16:00',
        type: 'SITE_WALKTHROUGH',
        summary: 'Completed physical tour of 28A model suite and heated pool. Liked layout, discussing token payment.',
        author: 'Vikramaditya Sharma',
      },
    ],
  },
];

// -----------------------------------------------------------------------------
// 8. CONVERSATIONS
// -----------------------------------------------------------------------------
export interface ConversationThread {
  id: string;
  leadId: string;
  contactName: string;
  contactPhone: string;
  projectName: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  channel: 'WhatsApp' | 'SMS' | 'Website Chat';
  messages: {
    id: string;
    sender: 'user' | 'agent' | 'bot';
    text: string;
    time: string;
  }[];
}

export const MOCK_CONVERSATIONS: ConversationThread[] = [
  {
    id: 'conv-01',
    leadId: 'lead-101',
    contactName: 'Rajesh Singhania',
    contactPhone: '+91 98110 54321',
    projectName: 'The Palm Residences',
    lastMessage: 'Great, see you tomorrow at 11 AM at the experience center.',
    lastMessageTime: '10:45 AM',
    unreadCount: 0,
    channel: 'WhatsApp',
    messages: [
      {
        id: 'm1',
        sender: 'user',
        text: 'Hi, I saw your Instagram ad for the 3BHK Penthouse on Golf Course Extension.',
        time: 'Yesterday 2:15 PM',
      },
      {
        id: 'm2',
        sender: 'bot',
        text: 'Greetings Mr. Singhania! Thank you for connecting with Apex Luxe. Here is the official verified e-brochure and virtual tour link.',
        time: 'Yesterday 2:16 PM',
      },
      {
        id: 'm3',
        sender: 'agent',
        text: 'Hello Rajesh, this is Vikramaditya from Apex Luxe. We can arrange a private preview of the 28th-floor model suite with valet parking for you tomorrow.',
        time: '10:30 AM',
      },
      {
        id: 'm4',
        sender: 'user',
        text: 'Great, see you tomorrow at 11 AM at the experience center.',
        time: '10:45 AM',
      },
    ],
  },
  {
    id: 'conv-02',
    leadId: 'lead-103',
    contactName: 'Tariq Al-Mansoor',
    contactPhone: '+971 50 829 1042',
    projectName: 'Cyber One Suites',
    lastMessage: 'Can you email the 9-year corporate lease agreement draft?',
    lastMessageTime: 'Yesterday',
    unreadCount: 1,
    channel: 'WhatsApp',
    messages: [
      {
        id: 'm5',
        sender: 'user',
        text: 'Inquiring about Cyber One 9.2% commercial yield. What is the lock-in duration?',
        time: 'Oct 23 6:15 PM',
      },
      {
        id: 'm6',
        sender: 'agent',
        text: 'Hello Tariq, the commercial office floors are pre-leased to an MNC with a 9-year institutional lock-in and 15% escalation every 3 years.',
        time: 'Oct 23 6:30 PM',
      },
      {
        id: 'm7',
        sender: 'user',
        text: 'Can you email the 9-year corporate lease agreement draft?',
        time: 'Yesterday 4:00 PM',
      },
    ],
  },
];

// -----------------------------------------------------------------------------
// 9. APPOINTMENTS
// -----------------------------------------------------------------------------
export interface AppointmentItem {
  id: string;
  leadName: string;
  phone: string;
  projectName: string;
  date: string;
  time: string;
  agent: string;
  status: 'Confirmed' | 'Completed' | 'Rescheduled';
  location: string;
}

export const MOCK_APPOINTMENTS: AppointmentItem[] = [
  {
    id: 'apt-01',
    leadName: 'Rajesh Singhania',
    phone: '+91 98110 54321',
    projectName: 'The Palm Residences',
    date: '2026-10-27',
    time: '11:00 AM',
    agent: 'Vikramaditya Sharma',
    status: 'Confirmed',
    location: 'Apex Experience Center, Golf Course Ext Road',
  },
  {
    id: 'apt-02',
    leadName: 'Dr. Amitav Banerjee',
    phone: '+91 94330 65412',
    projectName: 'The Palm Residences',
    date: '2026-10-24',
    time: '04:00 PM',
    agent: 'Vikramaditya Sharma',
    status: 'Completed',
    location: 'Unit 28A Sky Suite',
  },
  {
    id: 'apt-03',
    leadName: 'Harpreet Singh Bindra',
    phone: '+91 98765 99882',
    projectName: 'Apex Logistics Park',
    date: '2026-10-28',
    time: '02:30 PM',
    agent: 'Neha Chawla',
    status: 'Confirmed',
    location: 'Sector 8 Industrial Zone, Manesar Corridor',
  },
];

// -----------------------------------------------------------------------------
// 10. TEAM & ROLES
// -----------------------------------------------------------------------------
export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: 'OWNER' | 'ADMIN' | 'MARKETING_MANAGER' | 'SALES_AGENT' | 'CREATIVE_EDITOR';
  status: 'Active' | 'Invited' | 'Suspended';
  assignedProjects: string[];
}

export const MOCK_TEAM_MEMBERS: TeamMember[] = [
  {
    id: 'usr-01',
    name: 'Siddharth V. Singhal',
    email: 'siddharth@apexluxerealty.in',
    role: 'OWNER',
    status: 'Active',
    assignedProjects: ['All Projects'],
  },
  {
    id: 'usr-02',
    name: 'Vikramaditya Sharma',
    email: 'vikram@apexluxerealty.in',
    role: 'MARKETING_MANAGER',
    status: 'Active',
    assignedProjects: ['The Palm Residences', 'Cyber One Suites'],
  },
  {
    id: 'usr-03',
    name: 'Neha Chawla',
    email: 'neha.c@apexluxerealty.in',
    role: 'SALES_AGENT',
    status: 'Active',
    assignedProjects: ['The Palm Residences', 'Apex Logistics Park'],
  },
  {
    id: 'usr-04',
    name: 'Aarav Malhotra',
    email: 'aarav.m@apexluxerealty.in',
    role: 'CREATIVE_EDITOR',
    status: 'Active',
    assignedProjects: ['The Palm Residences'],
  },
];

// -----------------------------------------------------------------------------
// 11. NOTIFICATIONS
// -----------------------------------------------------------------------------
export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  category: 'RERA_COMPLIANCE' | 'LEAD_INBOUND' | 'BUDGET_ALERT' | 'APPROVAL_REQUEST';
  date: string;
  read: boolean;
}

export const MOCK_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'notif-01',
    title: 'New High-Intent Inbound Lead',
    message: 'Rajesh Singhania submitted an inquiry for The Palm Residences Penthouse.',
    category: 'LEAD_INBOUND',
    date: '10 mins ago',
    read: false,
  },
  {
    id: 'notif-02',
    title: 'Mandatory RERA Verification Required',
    message: 'Facebook Carousel ad flagged for review: verify HRERA-PKL-GGM-1482-2024 placement.',
    category: 'RERA_COMPLIANCE',
    date: '1 hour ago',
    read: false,
  },
  {
    id: 'notif-03',
    title: 'Budget Allocation Cap Approaching',
    message: 'Monthly spend at 92% of target limit (₹ 4,60,000 / ₹ 5,00,000).',
    category: 'BUDGET_ALERT',
    date: '3 hours ago',
    read: true,
  },
  {
    id: 'notif-04',
    title: 'Creative Sign-off Requested',
    message: 'Q4 Festive High-Rise Launch Blitz submitted for final sign-off.',
    category: 'APPROVAL_REQUEST',
    date: 'Yesterday',
    read: true,
  },
];
