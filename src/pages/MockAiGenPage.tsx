import React, { useState, useEffect } from 'react';
import {
  Upload,
  CheckCircle2,
  ShieldAlert,
  Play,
  Film,
  Sparkles,
  Info,
  DollarSign,
  Download,
  Layers,
  Building,
  RefreshCw,
  Video as VideoIcon,
  Edit3,
  Check,
  X,
  Trash2,
} from 'lucide-react';
import { api } from '../lib/api';

interface MockProject {
  schemaVersion: string;
  datasetType: string;
  project: {
    id: string;
    name: string;
    projectType: string;
    description: string;
    floor: { unitFloor: number; buildingFloors: number; isTopFloor: boolean; liftAvailable: boolean };
    configuration: {
      bhk: number;
      bedrooms: number;
      bathrooms: number;
      livingRooms: number;
      diningAreas: number;
      kitchens: number;
      balconies: number;
      rooftopAccess: string;
    };
    area: { carpetSqFt: number; builtUpSqFt: number; balconySqFt: number; measurementsAreVerified: boolean };
    commercialFacts: {
      priceInr: number | null;
      reraNumber: string | null;
      contactPhone: string | null;
    };
    branding: {
      companyName: string;
      brandColors: string[];
      cta: string;
    };
  };
  areas: Array<{
    id: string;
    name: string;
    category: string;
    approxSizeSqFt: number | null;
    visibleOrExpectedFeatures: string[];
    assetIds: string[];
  }>;
  media: {
    logo: { uploaded: boolean; fileName: string | null; url?: string };
    assets: Array<{
      id: string;
      label: string;
      areaId: string;
      classification: string;
      uploaded: boolean;
      fileName: string | null;
    }>;
    sourceVideos?: Array<any>;
  };
  campaigns: Array<{
    id: string;
    campaignName: string;
    goal: string;
    language: string;
    designProfile: string;
    durationSeconds: number;
    scenes: Array<{
      assetId: string;
      seconds: number;
      role: string;
      text: string;
      language: string;
      motion: string;
      runwayClip: boolean;
    }>;
  }>;
}

interface StoredAsset {
  assetId: string;
  originalName: string;
  cleanName: string;
  url: string;
  sizeBytes: number;
  width: number;
  height: number;
  hasExifGpsRemoved: boolean;
}

interface SourceVideoMetadata {
  assetId: string;
  originalName: string;
  cleanName: string;
  url: string;
  thumbnailUrl: string;
  sizeBytes: number;
  durationSeconds: number;
  width: number;
  height: number;
  aspectRatio: string;
  orientation: 'portrait' | 'landscape' | 'square';
  rotation: number;
  fps: number;
  hasAudio: boolean;
  stability: 'stable' | 'moderate' | 'shaky';
  lighting: 'balanced' | 'underexposed' | 'overexposed';
  qualityScore: number;
  inferredRoom: string;
  inferredConfidence: number;
  userRoomOverride?: string;
  classification: 'ACTUAL' | 'ILLUSTRATIVE';
  highlightSegments: Array<{
    start: number;
    end: number;
    duration: number;
    description: string;
    score: number;
  }>;
  bestAdvertisingShot?: {
    start: number;
    end: number;
    rationale: string;
  };
}

interface ComposedAd {
  campaignId: string;
  designProfile: string;
  language: string;
  videoUrl: string;
  posterUrl?: string;
  durationSeconds: number;
  width: number;
  height: number;
  scenesCount: number;
  renderedAt: string;
  hasRunwayClip: boolean;
  runwayTaskId?: string;
}

export const MockAiGenPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'facts' | 'mapping' | 'campaigns' | 'runway' | 'output'>('facts');
  const [project, setProject] = useState<MockProject | null>(null);
  const [uploadedAssets, setUploadedAssets] = useState<StoredAsset[]>([]);
  const [sourceVideos, setSourceVideos] = useState<SourceVideoMetadata[]>([]);
  const [slotMappings, setSlotMappings] = useState<Record<string, string>>({});
  const [composedAds, setComposedAds] = useState<Record<string, ComposedAd>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // JSON Editing Modal State
  const [isEditingJson, setIsEditingJson] = useState(false);
  const [jsonDraft, setJsonDraft] = useState('');
  const [jsonError, setJsonError] = useState<string | null>(null);

  // Runway Gate States
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>('fb-2026-12-04');
  const [selectedSceneIndex, setSelectedSceneIndex] = useState<number>(1);
  const [hasCostApproval, setHasCostApproval] = useState<boolean>(false);
  const [runwayTask, setRunwayTask] = useState<any>(null);
  const [isGeneratingRunway, setIsGeneratingRunway] = useState<boolean>(false);
  const [isComposing, setIsComposing] = useState<boolean>(false);

  useEffect(() => {
    loadMockState();
  }, []);

  const loadMockState = async () => {
    try {
      setIsLoading(true);
      const res = await api.get('/mock-ai-gen/state');
      if (res.data?.success && res.data?.data) {
        setProject(res.data.data.project);
        setUploadedAssets(res.data.data.uploadedAssets || []);
        setSourceVideos(res.data.data.sourceVideos || []);
        const mappings: Record<string, string> = {};
        for (const [k, v] of Object.entries(res.data.data.slotMappings || {})) {
          mappings[k] = (v as any).assetId;
        }
        setSlotMappings(mappings);
        setComposedAds(res.data.data.composedAds || {});
      }
    } catch (err: any) {
      setStatusMessage(`Error loading mock project: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetMockData = async () => {
    const confirmed = window.confirm(
      'Are you sure you want to delete ALL mock AI data? This will permanently delete all uploaded videos, photos, slot mappings, and rendered ads, restoring the clean baseline.'
    );
    if (!confirmed) return;

    try {
      setIsLoading(true);
      setStatusMessage('Deleting all Mock AI data...');
      const res = await api.post('/mock-ai-gen/reset');
      if (res.data?.success) {
        setStatusMessage(res.data.message || 'All mock AI data deleted successfully.');
        await loadMockState();
      }
    } catch (err: any) {
      setStatusMessage(`Failed to delete mock data: ${err.response?.data?.message || err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenJsonEditor = () => {
    if (!project) return;
    setJsonDraft(JSON.stringify(project, null, 2));
    setJsonError(null);
    setIsEditingJson(true);
  };

  const handleSaveJson = async () => {
    try {
      setJsonError(null);
      const parsed = JSON.parse(jsonDraft);
      const res = await api.put('/mock-ai-gen/project', parsed);
      if (res.data?.success) {
        setProject(res.data.data);
        setIsEditingJson(false);
        setStatusMessage('Structured property project JSON updated successfully!');
      }
    } catch (err: any) {
      setJsonError(err.response?.data?.message || err.message);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>, isLogo = false) => {
    if (!e.target.files || e.target.files.length === 0) return;
    setIsLoading(true);
    setStatusMessage(null);

    try {
      for (let i = 0; i < e.target.files.length; i++) {
        const file = e.target.files[i];
        const formData = new FormData();
        formData.append('file', file);
        formData.append('isLogo', String(isLogo));

        await api.post('/mock-ai-gen/upload', formData);
      }
      setStatusMessage(`Uploaded & EXIF-stripped ${e.target.files.length} photo(s).`);
      await loadMockState();
    } catch (err: any) {
      setStatusMessage(`Upload failed: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    setIsLoading(true);
    setStatusMessage(null);

    try {
      for (let i = 0; i < e.target.files.length; i++) {
        const file = e.target.files[i];
        setStatusMessage(`Analyzing raw footage: ${file.name}...`);
        const formData = new FormData();
        formData.append('file', file);

        await api.post('/mock-ai-gen/upload-video', formData);
      }
      setStatusMessage(`Uploaded & analyzed ${e.target.files.length} raw video clip(s)!`);
      await loadMockState();
    } catch (err: any) {
      setStatusMessage(`Video upload failed: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateClassification = async (
    assetId: string,
    userRoomOverride: string,
    classification: 'ACTUAL' | 'ILLUSTRATIVE'
  ) => {
    try {
      const res = await api.post('/mock-ai-gen/update-classification', {
        assetId,
        userRoomOverride,
        classification,
      });
      if (res.data?.success) {
        setStatusMessage(`Updated room classification for ${assetId}`);
        await loadMockState();
      }
    } catch (err: any) {
      setStatusMessage(`Failed updating classification: ${err.message}`);
    }
  };

  const handleMapSlot = async (slotId: string, assetId: string) => {
    try {
      const res = await api.post('/mock-ai-gen/map-slot', { slotId, assetId });
      if (res.data?.success) {
        setSlotMappings((prev) => ({ ...prev, [slotId]: assetId }));
        setStatusMessage(`Slot "${slotId}" mapped successfully.`);
      }
    } catch (err: any) {
      setStatusMessage(`Mapping failed: ${err.message}`);
    }
  };

  const handleAutoMap = async () => {
    try {
      setIsLoading(true);
      const res = await api.post('/mock-ai-gen/auto-map');
      if (res.data?.success) {
        setStatusMessage('Auto-mapped uploaded property photos & videos across all room slots!');
        await loadMockState();
      }
    } catch (err: any) {
      setStatusMessage(`Auto-mapping failed: ${err.response?.data?.message || err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTriggerRunway = async () => {
    if (!hasCostApproval) {
      alert('BUDGET GATE: You must check the human cost approval box before spending Runway credits.');
      return;
    }

    setIsGeneratingRunway(true);
    setStatusMessage('Initiating Runway generative motion pilot task...');
    try {
      const res = await api.post('/mock-ai-gen/runway-pilot', {
        campaignId: selectedCampaignId,
        sceneIndex: selectedSceneIndex,
        hasHumanCostApproval: true,
      });

      if (res.data?.success) {
        setRunwayTask(res.data.data);
        if (res.data.data?.status === 'FAILED') {
          setStatusMessage(`Runway generation failed: ${res.data.data.error || 'Provider rejected request'}`);
        } else if (res.data.data?.status === 'SUCCEEDED') {
          setStatusMessage('Runway image-to-video clip generated & stored in sandbox!');
        } else if (res.data.data?.status === 'BLOCKED') {
          setStatusMessage(res.data.data?.error || 'Runway task blocked.');
        } else {
          setStatusMessage(`Runway task status: ${res.data.data?.status}`);
        }
        await loadMockState();
      } else {
        setStatusMessage(res.data?.message || 'Runway task blocked.');
      }
    } catch (err: any) {
      setStatusMessage(`Runway error: ${err.response?.data?.message || err.message}`);
    } finally {
      setIsGeneratingRunway(false);
    }
  };

  const handleComposeAd = async (campaignId: string) => {
    setIsComposing(true);
    setStatusMessage(`Composing 9:16 vertical video for ${campaignId}...`);
    try {
      const res = await api.post('/mock-ai-gen/compose-ad', { campaignId });
      if (res.data?.success) {
        setComposedAds((prev) => ({ ...prev, [campaignId]: res.data.data }));
        setStatusMessage(`Ad for "${campaignId}" rendered successfully!`);
        setActiveTab('output');
      }
    } catch (err: any) {
      setStatusMessage(`Rendering failed: ${err.response?.data?.message || err.message}`);
    } finally {
      setIsComposing(false);
    }
  };

  const handleComposePilot = async () => {
    setIsComposing(true);
    setStatusMessage('Composing 12.5s Style-Match Pilot demo (1013.mp4 style)...');
    try {
      const res = await api.post('/mock-ai-gen/compose-pilot');
      if (res.data?.success) {
        setComposedAds((prev) => ({ ...prev, pilot_style_match_1013: res.data.data }));
        setStatusMessage('1013.mp4 Style-Match Pilot demo rendered successfully!');
        setActiveTab('output');
      }
    } catch (err: any) {
      setStatusMessage(`Pilot rendering failed: ${err.response?.data?.message || err.message}`);
    } finally {
      setIsComposing(false);
    }
  };

  if (!project) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-6">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto text-amber-400 mb-4" />
          <p className="text-slate-400">Loading Mock AI Generation Lab...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* 1. TOP DEVELOPMENT & COMPLIANCE BANNER */}
      <div className="bg-amber-500/10 border-b border-amber-500/30 px-6 py-3 flex items-center justify-between text-xs sm:text-sm">
        <div className="flex items-center space-x-3">
          <ShieldAlert className="w-5 h-5 text-amber-400 flex-shrink-0" />
          <div>
            <span className="font-bold text-amber-300 uppercase tracking-wider mr-2">
              MOCK AI GEN LAB — TEST ONLY (ISOLATED PROOF-OF-CONCEPT)
            </span>
            <span className="text-amber-200/80 hidden md:inline">
              Dataset: {project.datasetType} • Zero CRM database mutations • Unverified commercial facts strictly disabled
            </span>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={handleResetMockData}
            disabled={isLoading}
            className="bg-red-500/20 hover:bg-red-500/30 text-red-300 px-3 py-1 rounded-full text-xs font-semibold border border-red-500/40 transition flex items-center gap-1.5 shadow"
            title="Temporary button: Delete all mock AI data"
          >
            <Trash2 className="w-3.5 h-3.5 text-red-400" />
            Delete All Mock Data
          </button>
          <span className="bg-amber-400/20 text-amber-300 px-2.5 py-1 rounded-full text-xs font-semibold border border-amber-400/40">
            STRICT SANDBOX
          </span>
        </div>
      </div>

      {/* 2. SUBHEADER */}
      <header className="bg-slate-900 border-b border-slate-800 px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-400" />
            {project.project.name}
            <span className="text-xs bg-slate-800 text-slate-400 px-2 py-0.5 rounded ml-2 font-mono">
              {project.project.id}
            </span>
            {isLoading && <RefreshCw className="w-4 h-4 animate-spin text-amber-400 ml-2" />}
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Factual baseline: {project.project.configuration.bhk} BHK • {project.project.area.carpetSqFt} sq.ft carpet •{' '}
            <strong className="text-amber-300">Shared Rooftop (Community area, not private)</strong>
          </p>
        </div>

        {/* TABS NAVIGATION */}
        <div className="flex items-center bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs font-medium">
          <button
            onClick={() => setActiveTab('facts')}
            className={`px-3 py-1.5 rounded-md transition ${activeTab === 'facts' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'}`}
          >
            1. Property Facts & JSON
          </button>
          <button
            onClick={() => setActiveTab('mapping')}
            className={`px-3 py-1.5 rounded-md transition ${activeTab === 'mapping' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'}`}
          >
            2. Media Lab & Analysis ({sourceVideos.length} Videos, {uploadedAssets.length} Photos)
          </button>
          <button
            onClick={() => setActiveTab('campaigns')}
            className={`px-3 py-1.5 rounded-md transition ${activeTab === 'campaigns' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'}`}
          >
            3. Creative Storyboards
          </button>
          <button
            onClick={() => setActiveTab('runway')}
            className={`px-3 py-1.5 rounded-md transition ${activeTab === 'runway' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'}`}
          >
            4. Runway AI Gate
          </button>
          <button
            onClick={() => setActiveTab('output')}
            className={`px-3 py-1.5 rounded-md transition ${activeTab === 'output' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'}`}
          >
            5. Rendered Ads (9:16)
          </button>
        </div>
      </header>

      {/* STATUS NOTIFICATION BAR */}
      {statusMessage && (
        <div className="bg-slate-800/80 border-b border-slate-700 px-6 py-2 text-xs flex items-center justify-between text-slate-200">
          <span className="flex items-center gap-2">
            <Info className="w-4 h-4 text-blue-400" />
            {statusMessage}
          </span>
          <button onClick={() => setStatusMessage(null)} className="text-slate-400 hover:text-white">
            Dismiss
          </button>
        </div>
      )}

      {/* JSON EDITING MODAL */}
      {isEditingJson && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-6">
          <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-4xl max-h-[85vh] flex flex-col shadow-2xl">
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-amber-400" />
                Edit Structured Property Project JSON
              </h2>
              <button
                onClick={() => setIsEditingJson(false)}
                className="text-slate-400 hover:text-white p-1 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 flex-1 overflow-auto">
              {jsonError && (
                <div className="mb-4 p-3 bg-red-950/80 border border-red-800/80 rounded-lg text-xs text-red-200">
                  {jsonError}
                </div>
              )}
              <textarea
                value={jsonDraft}
                onChange={(e) => setJsonDraft(e.target.value)}
                className="w-full h-96 bg-slate-950 border border-slate-800 rounded-lg p-3 font-mono text-xs text-amber-200/90 focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>
            <div className="px-6 py-3 border-t border-slate-800 flex justify-end gap-3 bg-slate-950/50">
              <button
                onClick={() => setIsEditingJson(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveJson}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg text-xs font-bold flex items-center gap-2"
              >
                <Check className="w-4 h-4" />
                Validate & Save JSON
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. MAIN WORKSPACE CONTENT */}
      <main className="flex-1 p-6 max-w-7xl mx-auto w-full">
        {/* TAB 1: PROPERTY FACTS & JSON */}
        {activeTab === 'facts' && (
          <div className="space-y-6">
            <div className="flex justify-end">
              <button
                onClick={handleOpenJsonEditor}
                className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg text-xs font-semibold border border-slate-700 transition flex items-center gap-2"
              >
                <Edit3 className="w-4 h-4 text-amber-400" />
                Edit Structured Project JSON
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Card 1: Configuration */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Building className="w-4 h-4 text-amber-400" /> Configuration & Structure
                </h3>
                <dl className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <dt className="text-slate-500">Unit Type</dt>
                    <dd className="font-semibold text-white">{project.project.configuration.bhk} BHK Flat</dd>
                  </div>
                  <div>
                    <dt className="text-slate-500">Floor Level</dt>
                    <dd className="font-semibold text-white">
                      Floor {project.project.floor.unitFloor} of {project.project.floor.buildingFloors}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-slate-500">Bedrooms / Baths</dt>
                    <dd className="font-semibold text-white">
                      {project.project.configuration.bedrooms} Bed • {project.project.configuration.bathrooms} Bath
                    </dd>
                  </div>
                  <div>
                    <dt className="text-slate-500">Carpet Area</dt>
                    <dd className="font-semibold text-white">{project.project.area.carpetSqFt} sq.ft</dd>
                  </div>
                </dl>

                <div className="mt-4 p-3 bg-slate-950 border border-slate-800 rounded-lg">
                  <span className="text-xs font-semibold text-amber-400 block mb-1">Rooftop Policy</span>
                  <p className="text-xs text-slate-400">
                    "{project.project.configuration.rooftopAccess}" — Shared community terrace, NOT private property.
                  </p>
                </div>
              </div>

              {/* Card 2: Legal & Commercial Compliance */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-amber-400" /> Commercial Integrity
                </h3>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between py-1 border-b border-slate-800">
                    <span className="text-slate-500">Price in INR:</span>
                    <span className="font-mono text-amber-300 font-semibold">
                      {project.project.commercialFacts.priceInr ?? 'UNVERIFIED / NULL'}
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800">
                    <span className="text-slate-500">RERA Number:</span>
                    <span className="font-mono text-amber-300 font-semibold">
                      {project.project.commercialFacts.reraNumber ?? 'UNVERIFIED / NULL'}
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800">
                    <span className="text-slate-500">Contact Phone:</span>
                    <span className="font-mono text-amber-300 font-semibold">
                      {project.project.commercialFacts.contactPhone ?? 'UNVERIFIED / NULL'}
                    </span>
                  </div>
                </div>
                <p className="text-xs text-slate-500 mt-4 italic">
                  Fictional demo data. The renderer will omit unverified claims and avoid fabricating numbers.
                </p>
              </div>

              {/* Card 3: Branding */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-amber-400" /> Branding Tokens
                </h3>
                <div className="space-y-3 text-xs">
                  <div>
                    <span className="text-slate-500 block">Studio Name</span>
                    <span className="font-semibold text-white">{project.project.branding.companyName}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block mb-1">Color Palette</span>
                    <div className="flex items-center gap-2">
                      {project.project.branding.brandColors.map((c, i) => (
                        <div key={i} className="flex items-center gap-1">
                          <span className="w-4 h-4 rounded-full border border-slate-700" style={{ backgroundColor: c }} />
                          <span className="font-mono text-[10px] text-slate-400">{c}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Default CTA</span>
                    <span className="font-semibold text-white">{project.project.branding.cta}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Areas & Slots Grid */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
              <h3 className="text-sm font-semibold text-slate-200 mb-3">
                Defined Areas ({project.areas.length}) & Room Media Slots ({project.media.assets.length})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {project.areas.map((area) => (
                  <div key={area.id} className="bg-slate-950 border border-slate-800/80 rounded-lg p-3 text-xs">
                    <div className="flex items-center justify-between font-semibold text-slate-200">
                      <span>{area.name}</span>
                      <span className="text-slate-500 font-mono text-[10px]">{area.category}</span>
                    </div>
                    <p className="text-slate-400 text-[11px] mt-1">
                      {area.approxSizeSqFt ? `${area.approxSizeSqFt} sq.ft • ` : ''}
                      {area.visibleOrExpectedFeatures.join(', ')}
                    </p>
                    <div className="mt-2 pt-2 border-t border-slate-900 flex items-center justify-between">
                      <span className="text-slate-500">Slots: {area.assetIds.join(', ')}</span>
                      {area.assetIds.some((s) => slotMappings[s]) ? (
                        <span className="text-emerald-400 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Mapped
                        </span>
                      ) : (
                        <span className="text-slate-600">Pending media</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: RAW MEDIA LAB & ANALYSIS */}
        {activeTab === 'mapping' && (
          <div className="space-y-6">
            {/* Upload Action Bar */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
              <h3 className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
                <Upload className="w-4 h-4 text-amber-400" />
                Raw Client Media Ingestion & Multi-Stream Upload
              </h3>
              <p className="text-xs text-slate-400 mb-4">
                Upload raw property videos (.mp4, .mov) and original photography. Our FFmpeg analyzer inspects rotation, camera stability,
                resolution, audio, and extracts advertising highlight timestamps automatically.
              </p>

              <div className="flex flex-wrap gap-4">
                <label className="cursor-pointer bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 shadow-lg">
                  <VideoIcon className="w-4 h-4" />
                  Upload Raw Property Videos (.mp4, .mov)
                  <input
                    type="file"
                    multiple
                    accept="video/*"
                    className="hidden"
                    onChange={handleVideoUpload}
                  />
                </label>

                <label className="cursor-pointer bg-amber-500 hover:bg-amber-400 text-slate-950 px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2">
                  <Upload className="w-4 h-4" />
                  Upload Property Photos
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handlePhotoUpload(e, false)}
                  />
                </label>

                <label className="cursor-pointer bg-slate-800 hover:bg-slate-700 text-slate-200 px-4 py-2 rounded-lg text-xs font-semibold border border-slate-700 transition flex items-center gap-2">
                  <Upload className="w-4 h-4" />
                  Upload Brand Logo
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handlePhotoUpload(e, true)}
                  />
                </label>

                {(uploadedAssets.length > 0 || sourceVideos.length > 0) && (
                  <button
                    onClick={handleAutoMap}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 shadow-lg"
                  >
                    <Sparkles className="w-4 h-4" />
                    Auto-Map All Media to Room Slots
                  </button>
                )}

                <button
                  onClick={handleResetMockData}
                  disabled={isLoading}
                  className="bg-red-950/80 hover:bg-red-900 text-red-300 border border-red-700/60 hover:border-red-600 px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 shadow-lg ml-auto"
                  title="Temporary button: Delete all mock AI data"
                >
                  <Trash2 className="w-4 h-4 text-red-400" />
                  Delete / Reset Mock Data
                </button>
              </div>
            </div>

            {/* RAW VIDEOS INSPECTION & PREVIEW */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <VideoIcon className="w-4 h-4 text-blue-400" />
                  Raw Mobile Video Footage ({sourceVideos.length} Videos)
                </h3>
                <span className="text-xs text-slate-400">
                  Inspected for rotation, shake, resolution & highlights
                </span>
              </div>

              {sourceVideos.length === 0 ? (
                <div className="p-8 text-center border border-dashed border-slate-800 rounded-lg text-slate-500 text-xs">
                  No video clips uploaded yet. Upload your mobile footage above to trigger automated FFmpeg analysis.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {sourceVideos.map((vid) => (
                    <div key={vid.assetId} className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden flex flex-col justify-between">
                      <div>
                        {/* Video Player */}
                        <div className="aspect-[9/16] max-h-56 w-full bg-black relative">
                          <video
                            src={vid.url}
                            poster={vid.thumbnailUrl}
                            controls
                            playsInline
                            className="w-full h-full object-contain"
                          />
                        </div>

                        {/* Metadata Pills */}
                        <div className="p-3 space-y-2 text-xs">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-white truncate max-w-[180px]">{vid.originalName}</span>
                            <span className="bg-slate-800 px-1.5 py-0.5 rounded text-[10px] text-amber-300 font-mono">
                              {vid.durationSeconds}s
                            </span>
                          </div>

                          <div className="flex flex-wrap gap-1 text-[10px]">
                            <span className="bg-slate-900 px-2 py-0.5 rounded text-slate-300 border border-slate-800">
                              {vid.width}x{vid.height} ({vid.orientation.toUpperCase()})
                            </span>
                            <span className="bg-slate-900 px-2 py-0.5 rounded text-slate-300 border border-slate-800">
                              Rotation: {vid.rotation}°
                            </span>
                            <span className="bg-emerald-950/60 text-emerald-400 px-2 py-0.5 rounded border border-emerald-800/40 font-semibold">
                              Stability: {vid.stability}
                            </span>
                            <span className="bg-blue-950/60 text-blue-300 px-2 py-0.5 rounded border border-blue-800/40 font-semibold">
                              Score: {vid.qualityScore}/10
                            </span>
                          </div>

                          {/* Room Category Override */}
                          <div className="pt-2 border-t border-slate-900 flex items-center justify-between gap-2">
                            <span className="text-[11px] text-slate-400">Room:</span>
                            <select
                              value={vid.userRoomOverride || vid.inferredRoom}
                              onChange={(e) =>
                                handleUpdateClassification(vid.assetId, e.target.value, vid.classification)
                              }
                              className="bg-slate-900 border border-slate-700 text-slate-200 text-[11px] rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-amber-500"
                            >
                              <option value="living">Living & Dining</option>
                              <option value="master">Master Bedroom</option>
                              <option value="bedroom2">Bedroom 2</option>
                              <option value="bedroom3">Bedroom 3</option>
                              <option value="kitchen">Kitchen</option>
                              <option value="bath_master">Master Bathroom</option>
                              <option value="balcony">Balcony</option>
                              <option value="terrace">Shared Rooftop Terrace</option>
                              <option value="exterior">Building Exterior</option>
                              <option value="entry">Main Entrance</option>
                            </select>
                          </div>

                          {/* Classification Pill */}
                          <div className="flex items-center justify-between text-[11px] text-slate-400">
                            <span>Classification:</span>
                            <button
                              onClick={() =>
                                handleUpdateClassification(
                                  vid.assetId,
                                  vid.userRoomOverride || vid.inferredRoom,
                                  vid.classification === 'ACTUAL' ? 'ILLUSTRATIVE' : 'ACTUAL'
                                )
                              }
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                vid.classification === 'ACTUAL'
                                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                  : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              }`}
                            >
                              {vid.classification}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Uploaded Photos Grid */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
              <h3 className="text-sm font-semibold text-white mb-3">
                Sandbox Uploaded Photos ({uploadedAssets.length})
              </h3>
              {uploadedAssets.length === 0 ? (
                <div className="p-8 text-center border border-dashed border-slate-800 rounded-lg text-slate-500 text-xs">
                  No photos uploaded yet.
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {uploadedAssets.map((asset) => (
                    <div key={asset.assetId} className="bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs">
                      <div className="aspect-video bg-slate-900 rounded overflow-hidden mb-2">
                        <img src={asset.url} alt={asset.originalName} className="w-full h-full object-cover" />
                      </div>
                      <p className="font-semibold truncate text-slate-200">{asset.originalName}</p>
                      <div className="flex items-center justify-between text-[10px] text-slate-500 mt-1">
                        <span>{asset.width}x{asset.height}</span>
                        {asset.hasExifGpsRemoved && (
                          <span className="text-emerald-400 flex items-center gap-0.5">
                            <CheckCircle2 className="w-2.5 h-2.5" /> GPS Stripped
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Room Slot Mapping Assignment */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
              <h3 className="text-sm font-semibold text-white mb-3">
                Room Media Slot Assignment ({project.media.assets.length} Slots)
              </h3>
              <div className="space-y-3">
                {project.media.assets.map((slot) => {
                  const mappedAssetId = slotMappings[slot.id];
                  const mappedPhoto = uploadedAssets.find((a) => a.assetId === mappedAssetId);
                  const mappedVideo = sourceVideos.find((v) => v.assetId === mappedAssetId);

                  return (
                    <div
                      key={slot.id}
                      className="bg-slate-950 border border-slate-800 rounded-lg p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-white">{slot.label}</span>
                          <span className="font-mono text-[10px] bg-slate-900 px-1.5 py-0.5 rounded text-slate-400">
                            {slot.id}
                          </span>
                          <span className="text-[10px] text-slate-500">({slot.areaId})</span>
                        </div>
                        {(mappedPhoto || mappedVideo) && (
                          <p className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Mapped to:{' '}
                            {mappedVideo
                              ? `[Video] ${mappedVideo.originalName} (${mappedVideo.durationSeconds}s)`
                              : `[Photo] ${mappedPhoto?.originalName}`}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <select
                          value={mappedAssetId || ''}
                          onChange={(e) => handleMapSlot(slot.id, e.target.value)}
                          className="bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-md px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-amber-500"
                        >
                          <option value="">-- Assign Media (Video or Photo) --</option>
                          <optgroup label="Raw Videos">
                            {sourceVideos.map((v) => (
                              <option key={v.assetId} value={v.assetId}>
                                📹 {v.originalName} ({v.durationSeconds}s • {v.inferredRoom})
                              </option>
                            ))}
                          </optgroup>
                          <optgroup label="Photos">
                            {uploadedAssets.map((asset) => (
                              <option key={asset.assetId} value={asset.assetId}>
                                📷 {asset.originalName} ({asset.width}x{asset.height})
                              </option>
                            ))}
                          </optgroup>
                        </select>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: CREATIVE STORYBOARDS */}
        {activeTab === 'campaigns' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {project.campaigns.map((camp) => (
                <div key={camp.id} className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20 font-bold">
                        {camp.id}
                      </span>
                      <span className="text-xs bg-slate-800 text-slate-400 px-2 py-0.5 rounded">
                        {camp.durationSeconds}s • 9:16 Vertical
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-white mb-1">{camp.campaignName}</h3>
                    <p className="text-xs text-slate-400 mb-3">{camp.goal}</p>

                    <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-xs space-y-1 mb-4">
                      <div>
                        <span className="text-slate-500">Design Profile: </span>
                        <strong className="text-white">{camp.designProfile}</strong>
                      </div>
                      <div>
                        <span className="text-slate-500">Language: </span>
                        <strong className="text-amber-300">{camp.language}</strong>
                      </div>
                    </div>

                    <h4 className="text-xs font-semibold text-slate-300 mb-2">Storyboard Timeline ({camp.scenes.length} scenes):</h4>
                    <div className="space-y-2 mb-4">
                      {camp.scenes.map((s, idx) => (
                        <div key={idx} className="bg-slate-950/60 border border-slate-850 p-2.5 rounded-lg text-xs flex items-center justify-between">
                          <div className="flex-1 mr-2">
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-amber-400 text-[10px] bg-slate-900 px-1 rounded">
                                #{idx + 1}
                              </span>
                              <span className="font-semibold text-slate-300 capitalize">{s.role}</span>
                              <span className="text-slate-500 text-[11px]">({s.seconds}s, {s.assetId})</span>
                            </div>
                            <p className="text-[11px] text-slate-400 italic mt-0.5">"{s.text}"</p>
                          </div>
                          {s.runwayClip ? (
                            <span className="text-[10px] bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded border border-purple-500/30 font-semibold whitespace-nowrap">
                              Runway AI Clip
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-600 whitespace-nowrap">Camera Push/Pan</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={() => handleComposeAd(camp.id)}
                    disabled={isComposing}
                    className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-2.5 rounded-lg text-xs transition border border-slate-700 flex items-center justify-center gap-2"
                  >
                    <Film className="w-4 h-4 text-amber-400" />
                    Compose 9:16 Video (FFmpeg + Safe Zones)
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: RUNWAY PILOT JOB & BUDGET GATE */}
        {activeTab === 'runway' && (
          <div className="space-y-6">
            {/* MANDATORY HUMAN BUDGET GATE CARD */}
            <div className="bg-amber-500/10 border-2 border-amber-500/40 rounded-xl p-6">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-amber-500/20 rounded-lg text-amber-300">
                  <DollarSign className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <h3 className="text-base font-bold text-amber-300">
                    Mandatory Runway Budget Gate (Pilot Image-to-Video)
                  </h3>
                  <p className="text-xs text-amber-200/80 mt-1">
                    Runway Dev API charges credits for video generation. In accordance with strict development rules,
                    no chargeable API calls are made automatically.
                  </p>

                  <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs bg-slate-950/80 p-3 rounded-lg border border-amber-500/20">
                    <div>
                      <span className="text-slate-500 block">Candidate Model</span>
                      <strong className="text-white font-mono">gen3a_turbo (Runway Gen-3 Alpha Turbo)</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Estimated Credits</span>
                      <strong className="text-amber-300 font-mono">5 Credits</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Estimated Cost</span>
                      <strong className="text-emerald-400 font-mono">~$0.25 USD</strong>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="costGate"
                      checked={hasCostApproval}
                      onChange={(e) => setHasCostApproval(e.target.checked)}
                      className="w-4 h-4 text-amber-500 bg-slate-900 border-slate-700 rounded focus:ring-amber-500"
                    />
                    <label htmlFor="costGate" className="text-xs text-white font-semibold cursor-pointer">
                      I explicitly approve spending up to 5 Runway credits ($0.25 USD) for this pilot test clip.
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* Pilot Job Configuration */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
              <h3 className="text-sm font-semibold text-white mb-4">Pilot Job Configuration</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs mb-6">
                <div>
                  <label className="text-slate-400 block mb-1">Target Campaign</label>
                  <select
                    value={selectedCampaignId}
                    onChange={(e) => setSelectedCampaignId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white"
                  >
                    {project.campaigns.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.campaignName} ({c.id} - {c.designProfile})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">Select Runway Candidate Scene</label>
                  <select
                    value={selectedSceneIndex}
                    onChange={(e) => setSelectedSceneIndex(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white"
                  >
                    {project.campaigns
                      .find((c) => c.id === selectedCampaignId)
                      ?.scenes.map((s, idx) => (
                        <option key={idx} value={idx} disabled={!s.runwayClip}>
                          Scene {idx + 1}: {s.role} ({s.assetId}) {s.runwayClip ? '✓ Runway Eligible' : '(Static Motion)'}
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              <button
                onClick={handleTriggerRunway}
                disabled={!hasCostApproval || isGeneratingRunway}
                className={`w-full py-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-2 ${
                  hasCostApproval && !isGeneratingRunway
                    ? 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                }`}
              >
                {isGeneratingRunway ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Generating Runway Clip (gen3a_turbo)...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4" />
                    Run Pilot Runway Image-To-Video Job ($0.25 USD)
                  </>
                )}
              </button>
            </div>

            {/* Task Log & Review */}
            {runwayTask && (
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                <h3 className="text-sm font-semibold text-white mb-2">Runway Task Execution Audit</h3>
                <div className="bg-slate-950 p-4 rounded-lg font-mono text-xs text-slate-300 space-y-1">
                  <div>Task ID: <span className="text-amber-400">{runwayTask.taskId}</span></div>
                  <div>
                    Status:{' '}
                    <span
                      className={
                        runwayTask.status === 'SUCCEEDED'
                          ? 'text-emerald-400 font-bold'
                          : runwayTask.status === 'FAILED'
                          ? 'text-rose-400 font-bold'
                          : 'text-amber-400 font-bold'
                      }
                    >
                      {runwayTask.status}
                    </span>
                  </div>
                  <div>Model: <span className="text-blue-400">{runwayTask.model}</span></div>
                  <div>Elapsed: <span>{runwayTask.elapsedSeconds ?? 0}s</span></div>
                  {runwayTask.error && (
                    <div className="mt-3 p-3 bg-rose-950/50 border border-rose-800/60 rounded text-rose-300 whitespace-pre-wrap break-words">
                      <strong className="block text-rose-400 mb-1">Execution Failure:</strong>
                      {runwayTask.error}
                    </div>
                  )}
                  {runwayTask.outputVideoUrl && (
                    <div className="mt-3">
                      <a
                        href={runwayTask.outputVideoUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-amber-400 underline font-semibold hover:text-amber-300"
                      >
                        Preview Generated Video Clip
                      </a>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 5: RENDERED ADS OUTPUT & QA */}
        {activeTab === 'output' && (
          <div className="space-y-6">
            {/* 1013.mp4 REFERENCE STYLE-MATCH PILOT & COMPARISON SECTION */}
            <div className="bg-gradient-to-r from-amber-950/40 via-slate-900 to-slate-900 border border-amber-500/30 rounded-xl p-6">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="bg-amber-500 text-slate-950 font-bold px-2 py-0.5 rounded text-[11px] uppercase tracking-wide">
                      Reference Benchmark (1013.mp4)
                    </span>
                    <span className="text-xs text-amber-300 font-mono">PRESENTER_LED_PREMIUM_AD</span>
                  </div>
                  <h3 className="text-base font-bold text-white mt-1">
                    Presenter-Led Premium Ad Pilot (12.5s) & Reference Comparison
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Engineered to match the 47s Delhi luxury reference video: white Hinglish typography with champagne-gold (<span className="text-amber-400 font-mono">#D4AF37</span>) italics, top-right brand capsule, animated vector location map, and luxury closing crest.
                  </p>
                </div>
                <button
                  onClick={handleComposePilot}
                  disabled={isComposing}
                  className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-2.5 rounded-lg text-xs transition flex items-center gap-2 shadow-lg flex-shrink-0"
                >
                  <RefreshCw className={`w-4 h-4 ${isComposing ? 'animate-spin' : ''}`} />
                  Re-Render 12.5s Pilot
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-4">
                {/* Pilot Video Player */}
                <div className="lg:col-span-4 bg-slate-950 border border-slate-800 rounded-lg p-4 flex flex-col items-center">
                  <span className="text-xs font-semibold text-amber-300 mb-2 self-start">
                    Rendered Pilot Demo (12.5s)
                  </span>
                  <div className="aspect-[9/16] bg-black rounded-lg overflow-hidden border border-slate-800 relative w-full max-w-[240px] shadow-2xl">
                    <video
                      src="/api/v1/mock-ai-gen/files/rendered_ads/pilot_style_match_1013.mp4"
                      poster="/api/v1/mock-ai-gen/files/rendered_ads/poster_pilot_style_match_1013.jpg"
                      controls
                      playsInline
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <a
                    href="/api/v1/mock-ai-gen/files/rendered_ads/pilot_style_match_1013.mp4"
                    download="pilot_style_match_1013.mp4"
                    className="w-full mt-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 rounded-lg text-xs transition flex items-center justify-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Download Pilot Demo MP4
                  </a>
                </div>

                {/* Side-by-Side Comparison Sheet */}
                <div className="lg:col-span-8 bg-slate-950 border border-slate-800 rounded-lg p-4 flex flex-col">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-white">
                      Side-by-Side QA: Reference Video (1013.mp4) vs. RealCRM Pilot
                    </span>
                    <a
                      href="/api/v1/mock-ai-gen/files/rendered_ads/comparison_reference_vs_realcrm.jpg"
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-amber-400 hover:underline"
                    >
                      View Full-Res Sheet →
                    </a>
                  </div>
                  <div className="rounded-lg overflow-hidden border border-slate-800 bg-black flex-1 flex items-center justify-center">
                    <img
                      src="/api/v1/mock-ai-gen/files/rendered_ads/comparison_reference_vs_realcrm.jpg"
                      alt="Reference 1013.mp4 vs RealCRM Comparison"
                      className="w-full h-auto max-h-[460px] object-contain"
                    />
                  </div>
                  <div className="grid grid-cols-4 gap-2 mt-2 text-[10px] text-slate-400 text-center">
                    <div>1. Hook Pacing</div>
                    <div>2. Architectural Reveal</div>
                    <div>3. Vector Map Route</div>
                    <div>4. Closing Brand Seal</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {project.campaigns.map((camp) => {
                const composed = composedAds[camp.id];

                return (
                  <div key={camp.id} className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-bold text-white text-sm">{camp.campaignName}</span>
                        <span className="text-xs bg-slate-800 px-2 py-0.5 rounded text-amber-300 font-mono">
                          {camp.id}
                        </span>
                      </div>

                      {composed ? (
                        <div className="space-y-4 my-3">
                          <div className="aspect-[9/16] bg-black rounded-lg overflow-hidden border border-slate-800 relative max-w-[280px] mx-auto shadow-2xl">
                            <video
                              key={`${composed.videoUrl}_${composed.renderedAt}`}
                              src={
                                composed.videoUrl.startsWith('/storage/mock_ai_gen/')
                                  ? composed.videoUrl.replace('/storage/mock_ai_gen/', '/api/v1/mock-ai-gen/files/')
                                  : composed.videoUrl
                              }
                              poster={
                                composed.posterUrl
                                  ? (composed.posterUrl.startsWith('/storage/mock_ai_gen/')
                                      ? composed.posterUrl.replace('/storage/mock_ai_gen/', '/api/v1/mock-ai-gen/files/')
                                      : composed.posterUrl)
                                  : undefined
                              }
                              controls
                              preload="metadata"
                              playsInline
                              className="w-full h-full object-cover"
                            />
                          </div>

                          <div className="bg-slate-950 p-3 rounded-lg text-xs space-y-1">
                            <div className="flex justify-between text-slate-400">
                              <span>Resolution:</span>
                              <strong className="text-white">{composed.width}x{composed.height} (9:16)</strong>
                            </div>
                            <div className="flex justify-between text-slate-400">
                              <span>Profile:</span>
                              <strong className="text-white">{composed.designProfile}</strong>
                            </div>
                            <div className="flex justify-between text-slate-400">
                              <span>Safe Zones:</span>
                              <strong className="text-emerald-400">Top 180px & Bottom 380px Safe</strong>
                            </div>
                            <div className="flex justify-between text-slate-400">
                              <span>Audio Bed:</span>
                              <strong className="text-white">Procedural Ambient (-14 LUFS)</strong>
                            </div>
                          </div>

                          <a
                            href={
                              composed.videoUrl.startsWith('/storage/mock_ai_gen/')
                                ? composed.videoUrl.replace('/storage/mock_ai_gen/', '/api/v1/mock-ai-gen/files/')
                                : composed.videoUrl
                            }
                            download={`ad_${camp.id}.mp4`}
                            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 rounded-lg text-xs transition flex items-center justify-center gap-2"
                          >
                            <Download className="w-4 h-4" />
                            Download Playable MP4
                          </a>
                        </div>
                      ) : (
                        <div className="p-12 text-center border border-dashed border-slate-800 rounded-lg text-slate-500 text-xs my-4">
                          No rendered video yet. Click compose below to assemble the vertical MP4.
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => handleComposeAd(camp.id)}
                      disabled={isComposing}
                      className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-2.5 rounded-lg text-xs transition border border-slate-700 flex items-center justify-center gap-2 mt-4"
                    >
                      <RefreshCw className={`w-4 h-4 text-amber-400 ${isComposing ? 'animate-spin' : ''}`} />
                      {composed ? 'Re-Compose Ad' : 'Compose 9:16 Vertical Video'}
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Quality Checklist */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 text-xs">
              <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                Proof-of-Concept Quality & Compliance Checklist
              </h3>
              <ul className="space-y-2 text-slate-300">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                  <span><strong>Factual Integrity:</strong> Accurate 3 BHK residential details; rooftop correctly branded as a shared community terrace.</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                  <span><strong>Safe Zone Adherence:</strong> Top bar placed at Y=205px (&gt; 180px); caption text placed above Y=1540px (&lt; 1540px) with 0 collision.</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                  <span><strong>Decoupled Overlays:</strong> No baked-in text sent to Runway; vector Sharp/SVG typography applied independently during FFmpeg assembly.</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                  <span><strong>EXIF Privacy:</strong> EXIF GPS metadata stripped from all uploaded photos before sandbox storage.</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                  <span><strong>Strict Budget Gate:</strong> Hard requirement for human cost confirmation ($0.25 USD / 5 credits) before chargeable Runway generation.</span>
                </li>
              </ul>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
