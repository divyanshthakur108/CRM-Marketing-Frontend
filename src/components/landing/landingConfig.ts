// Configuration file for Landing Page content
// Edit these values anytime to reflect real metrics, testimonials, and team badges.

export interface LandingStat {
  id: string;
  targetValue: number;
  prefix?: string;
  suffix: string;
  decimals?: number;
  label: string;
  sublabel: string;
}

export const landingStatsConfig: LandingStat[] = [
  {
    id: 'pipeline',
    targetValue: 100,
    prefix: '',
    suffix: '%',
    decimals: 0,
    label: 'Lead Capture & Retention',
    sublabel: 'Zero enquiry leakage across Meta, Google Ads, and property portals.',
  },
  {
    id: 'response',
    targetValue: 5,
    prefix: '< ',
    suffix: ' min',
    decimals: 0,
    label: 'Target Follow-up Speed',
    sublabel: 'Automated WhatsApp journeys triggered immediately upon new enquiry.',
  },
  {
    id: 'production',
    targetValue: 30,
    prefix: '< ',
    suffix: ' sec',
    decimals: 0,
    label: 'Video Lab Reel Generation',
    sublabel: 'From raw phone walkthrough to speech-captioned 9:16 vertical video.',
  },
];

export interface LandingBadge {
  name: string;
  tag: string;
}

export const landingBadgesConfig: LandingBadge[] = [
  { name: 'Residential Developer', tag: 'Townships & High-Rises' },
  { name: 'Luxury Brokerage', tag: 'High-Ticket Sales' },
  { name: 'Channel Partner Network', tag: 'Multi-Project Distribution' },
  { name: 'Commercial Agency', tag: 'Office & Retail Leasing' },
  { name: 'Boutique Realty Firm', tag: 'Prime City Segments' },
  { name: 'Land & Villa Developers', tag: 'Plotted Developments' },
  { name: 'Institutional Sales Team', tag: 'Corporate Mandates' },
  { name: 'Independent Broker Group', tag: 'Field Agents' },
];

export interface LandingCustomerStory {
  companyType: string;
  category: string;
  headlineMetric: string;
  metricLabel: string;
  quote: string;
  authorRole: string;
  isSample: boolean;
}

export const landingCustomerStoriesConfig: LandingCustomerStory[] = [
  {
    companyType: 'Mid-Size Residential Developer',
    category: 'Multi-Tower Residential Project',
    headlineMetric: 'Automated Workflow',
    metricLabel: 'From portal enquiry to WhatsApp brochure in under 60 seconds',
    quote:
      'RealCRM gave our sales team a single dashboard for both Meta ad leads and broker follow-ups. The automated WhatsApp brochure delivery ensured every prospect received verified project specs instantly.',
    authorRole: 'Sales & Marketing Head',
    isSample: true,
  },
  {
    companyType: 'Independent Realty Brokerage',
    category: '40-Agent Luxury Brokerage',
    headlineMetric: 'Creator Video Reels',
    metricLabel: 'Agents publishing branded walkthroughs directly from site visits',
    quote:
      'Our brokers record quick video tours on their phones during site visits. Video Lab automatically adds speech captions and our logo, giving us consistent social media presence without a dedicated video editor.',
    authorRole: 'Managing Broker',
    isSample: true,
  },
];

