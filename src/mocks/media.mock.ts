// MOCK DATA - Phase 3 Media Library Assets
export type MediaAspectRatio = '4:5' | '1:1' | '9:16' | '16:9';
export type RoomCategory = 'Living Room' | 'Master Bed' | 'Kitchen' | 'Balcony' | 'Façade' | 'Floor Plan' | 'Amenities';
export type MediaApprovalStatus = 'APPROVED' | 'PENDING' | 'REJECTED';

export interface MediaAsset {
  id: string;
  organizationId: string;
  projectId: string;
  projectName: string;
  fileName: string;
  fileSizeKb: number;
  aspectRatio: MediaAspectRatio;
  roomCategory: RoomCategory;
  unitType?: string;
  isActual: boolean; // actual photo vs illustrative/render
  rightsConsentConfirmed: boolean;
  approvalStatus: MediaApprovalStatus;
  uploadedAt: string;
  url: string;
}

export const MOCK_MEDIA_ASSETS: MediaAsset[] = [
  {
    id: 'med-01',
    organizationId: 'org-apex-01',
    projectId: 'proj-01',
    projectName: 'The Palm Residences',
    fileName: 'palm_living_room_grand.jpg',
    fileSizeKb: 1420,
    aspectRatio: '4:5',
    roomCategory: 'Living Room',
    unitType: 'Type A - 3BHK',
    isActual: true,
    rightsConsentConfirmed: true,
    approvalStatus: 'APPROVED',
    uploadedAt: '25 Oct 2026',
    url: 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'med-02',
    organizationId: 'org-apex-01',
    projectId: 'proj-01',
    projectName: 'The Palm Residences',
    fileName: 'palm_modular_kitchen_quartz.jpg',
    fileSizeKb: 1180,
    aspectRatio: '1:1',
    roomCategory: 'Kitchen',
    unitType: 'Type A - 3BHK',
    isActual: true,
    rightsConsentConfirmed: true,
    approvalStatus: 'APPROVED',
    uploadedAt: '25 Oct 2026',
    url: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'med-03',
    organizationId: 'org-apex-01',
    projectId: 'proj-02',
    projectName: 'Apex Boulevard Villas',
    fileName: 'boulevard_infinity_pool_sunset.jpg',
    fileSizeKb: 2450,
    aspectRatio: '9:16',
    roomCategory: 'Amenities',
    unitType: 'Palacio Estate Villa',
    isActual: true,
    rightsConsentConfirmed: true,
    approvalStatus: 'APPROVED',
    uploadedAt: '24 Oct 2026',
    url: 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'med-04',
    organizationId: 'org-apex-01',
    projectId: 'proj-02',
    projectName: 'Apex Boulevard Villas',
    fileName: 'boulevard_master_bedroom_deck.jpg',
    fileSizeKb: 1650,
    aspectRatio: '4:5',
    roomCategory: 'Master Bed',
    unitType: 'Palacio Estate Villa',
    isActual: true,
    rightsConsentConfirmed: true,
    approvalStatus: 'APPROVED',
    uploadedAt: '24 Oct 2026',
    url: 'https://images.unsplash.com/photo-1616594039964-ae9021a400a0?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'med-05',
    organizationId: 'org-apex-01',
    projectId: 'proj-04',
    projectName: 'Apex Tech Park Tower A',
    fileName: 'tech_park_corporate_facade.jpg',
    fileSizeKb: 3100,
    aspectRatio: '16:9',
    roomCategory: 'Façade',
    unitType: 'Wing 6A',
    isActual: false,
    rightsConsentConfirmed: true,
    approvalStatus: 'APPROVED',
    uploadedAt: '23 Oct 2026',
    url: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'med-06',
    organizationId: 'org-apex-01',
    projectId: 'proj-03',
    projectName: 'Emerald Greenfield Plots',
    fileName: 'greenfield_boundary_drone_view.jpg',
    fileSizeKb: 2800,
    aspectRatio: '4:5',
    roomCategory: 'Façade',
    unitType: 'Plot No. 14',
    isActual: true,
    rightsConsentConfirmed: false,
    approvalStatus: 'PENDING',
    uploadedAt: 'Yesterday',
    url: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'med-07',
    organizationId: 'org-apex-01',
    projectId: 'proj-05',
    projectName: 'Skyline Commercial Plaza',
    fileName: 'retail_shop_storefront_render.jpg',
    fileSizeKb: 1890,
    aspectRatio: '1:1',
    roomCategory: 'Façade',
    unitType: 'Ground Floor Shop G-04',
    isActual: false,
    rightsConsentConfirmed: true,
    approvalStatus: 'PENDING',
    uploadedAt: 'Today',
    url: 'https://images.unsplash.com/photo-1567449303079-c15147a468e8?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'med-08',
    organizationId: 'org-apex-01',
    projectId: 'proj-06',
    projectName: 'Metro Logistics Hub',
    fileName: 'warehouse_bay_docking_interior.jpg',
    fileSizeKb: 1950,
    aspectRatio: '16:9',
    roomCategory: 'Amenities',
    unitType: 'PEB Warehouse Bay',
    isActual: true,
    rightsConsentConfirmed: true,
    approvalStatus: 'REJECTED',
    uploadedAt: '3 days ago',
    url: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=800&q=80',
  },
];
