// MOCK DATA - Phase 3 Dashboard Telemetry & Pacing
export interface DashboardStats {
  projectsCount: number;
  scheduledPostsCount: number;
  pendingApprovalsCount: number;
  newLeadsCount: number;
}

export interface UpcomingItem {
  id: string;
  organizationId: string;
  type: 'SCHEDULED_POST' | 'SITE_VISIT' | 'CLIENT_APPROVAL';
  title: string;
  property: string;
  date: string;
  time: string;
  channel?: 'INSTAGRAM' | 'FACEBOOK' | 'WHATSAPP';
  status: 'PENDING' | 'CONFIRMED' | 'SCHEDULED';
}

export interface BudgetSummary {
  totalBudget: number;
  spentBudget: number;
  remainingBudget: number;
  pacingPercentage: number;
  channels: {
    channel: string;
    allocated: number;
    spent: number;
  }[];
}

export const MOCK_DASHBOARD_STATS: DashboardStats = {
  projectsCount: 12,
  scheduledPostsCount: 28,
  pendingApprovalsCount: 5,
  newLeadsCount: 42,
};

export const MOCK_UPCOMING_ITEMS: UpcomingItem[] = [
  {
    id: 'up-01',
    organizationId: 'org-apex-01',
    type: 'SCHEDULED_POST',
    title: 'Autumn Luxury Showcase (4:5 Feed Reel)',
    property: 'The Palm Residences',
    date: 'Today, 26 Oct',
    time: '18:30 IST',
    channel: 'INSTAGRAM',
    status: 'SCHEDULED',
  },
  {
    id: 'up-02',
    organizationId: 'org-apex-01',
    type: 'SITE_VISIT',
    title: 'HNI Client Tour - Mr. Ananya Roy (3BHK Villa)',
    property: 'Apex Boulevard Villas',
    date: 'Tomorrow, 27 Oct',
    time: '11:00 IST',
    channel: 'WHATSAPP',
    status: 'CONFIRMED',
  },
  {
    id: 'up-03',
    organizationId: 'org-apex-01',
    type: 'CLIENT_APPROVAL',
    title: 'Monthly Ad Flight & Carousel Review',
    property: 'Skyline Commercial Plaza',
    date: '28 Oct 2026',
    time: '14:00 IST',
    status: 'PENDING',
  },
  {
    id: 'up-04',
    organizationId: 'org-apex-01',
    type: 'SCHEDULED_POST',
    title: 'Festive Early-Bird Incentive Story',
    property: 'Emerald Greenfield Plots',
    date: '29 Oct 2026',
    time: '09:00 IST',
    channel: 'FACEBOOK',
    status: 'SCHEDULED',
  },
  {
    id: 'up-05',
    organizationId: 'org-apex-01',
    type: 'SITE_VISIT',
    title: 'Institutional Investor Walkthrough (Tower A)',
    property: 'Apex Tech Park Tower A',
    date: '30 Oct 2026',
    time: '16:00 IST',
    channel: 'WHATSAPP',
    status: 'CONFIRMED',
  },
];

export const MOCK_BUDGET_SUMMARY: BudgetSummary = {
  totalBudget: 500000,
  spentBudget: 215000,
  remainingBudget: 285000,
  pacingPercentage: 43,
  channels: [
    { channel: 'Meta Paid Ads (Feed & Reels)', allocated: 250000, spent: 120000 },
    { channel: 'Meta Organic Engagement', allocated: 50000, spent: 22000 },
    { channel: 'Google Search & PMax', allocated: 150000, spent: 65000 },
    { channel: 'Offline Collateral & Portals', allocated: 50000, spent: 8000 },
  ],
};
