import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { Skeleton } from '../components/ui/Skeleton';
import { useToast } from '../components/ui/Toast';
import {
  useAudienceBriefs,
  useCreateAudienceBrief,
  useUpdateAudienceBrief,
  useDeleteAudienceBrief,
  BackendAudienceBrief,
} from '../hooks/useAudience';
import { useProjects } from '../hooks/useProjects';
import { formatDisplayDate } from '../lib/formatters';
import {
  Users,
  Target,
  MapPin,
  Plus,
  X,
  Save,
  Check,
  RefreshCw,
  Search,
  Trash2,
  Sparkles,
  ShieldCheck,
  ChevronRight,
  AlertTriangle,
  RotateCcw,
  Compass,
} from 'lucide-react';

// Common real estate location suggestions for quick adding
const SUGGESTED_LOCATIONS = [
  'Golf Course Road',
  'DLF Phase 5',
  'Cyber City',
  'South Delhi',
  'Whitefield',
  'BKC Mumbai',
  'Bandra West',
  'Worli Sea Face',
];

// Common real estate value drivers suggestions
const SUGGESTED_APPEALS = [
  'High Capital Appreciation',
  'Rental Yield & Pre-Leased',
  '100% DG Power Backup',
  'Exclusive Clubhouse & Spa',
  'Ready to Move-In',
  'Panoramic Golf Views',
  'Private Elevator Access',
  'EV Charging Stations',
];

export function AudiencePage() {
  const { toast } = useToast();

  const { data: briefs = [], isLoading, refetch, isFetching } = useAudienceBriefs();
  const { data: projects = [] } = useProjects();
  const createMutation = useCreateAudienceBrief();
  const updateMutation = useUpdateAudienceBrief();
  const deleteMutation = useDeleteAudienceBrief();

  // Selection & Search Filter States
  const [selectedBriefId, setSelectedBriefId] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [projectFilter, setProjectFilter] = useState('ALL');

  // Form Field States
  const [name, setName] = useState('');
  const [projectId, setProjectId] = useState<string>('');
  const [targetPersona, setTargetPersona] = useState('');
  const [incomeBracket, setIncomeBracket] = useState('');
  const [locations, setLocations] = useState<string[]>([]);
  const [keyAppeals, setKeyAppeals] = useState<string[]>([]);

  // Inline Tag Inputs
  const [newLocationInput, setNewLocationInput] = useState('');
  const [newAppealInput, setNewAppealInput] = useState('');

  // Initial Sync or Active Brief Selection
  useEffect(() => {
    if (briefs.length > 0) {
      const match = briefs.find((b) => b.id === selectedBriefId);
      if (match) {
        setName(match.name || match.projectName || '');
        setProjectId(match.projectId || '');
        setTargetPersona(match.targetPersona || '');
        setIncomeBracket(match.incomeBracket || '');
        setLocations(match.locations || []);
        setKeyAppeals(match.keyAppealDrivers || match.interests || []);
      } else if (!selectedBriefId) {
        // Default to first brief if nothing selected
        const first = briefs[0];
        setSelectedBriefId(first.id!);
        setName(first.name || first.projectName || '');
        setProjectId(first.projectId || '');
        setTargetPersona(first.targetPersona || '');
        setIncomeBracket(first.incomeBracket || '');
        setLocations(first.locations || []);
        setKeyAppeals(first.keyAppealDrivers || first.interests || []);
      }
    }
  }, [briefs, selectedBriefId]);

  const activeBrief = useMemo(() => {
    return briefs.find((b) => b.id === selectedBriefId) || null;
  }, [briefs, selectedBriefId]);

  // Client-Side Search & Filtering
  const filteredBriefs = useMemo(() => {
    return briefs.filter((brief) => {
      // 1. Project filter
      if (projectFilter !== 'ALL') {
        if (brief.projectId !== projectFilter) return false;
      }

      // 2. Search query filter
      const q = searchQuery.toLowerCase().trim();
      if (!q) return true;

      const nameMatch = (brief.name || brief.projectName || '').toLowerCase().includes(q);
      const personaMatch = (brief.targetPersona || '').toLowerCase().includes(q);
      const locMatch = brief.locations?.some((l) => l.toLowerCase().includes(q));
      const interestMatch = (brief.keyAppealDrivers || brief.interests || []).some((i) =>
        i.toLowerCase().includes(q)
      );

      return Boolean(nameMatch || personaMatch || locMatch || interestMatch);
    });
  }, [briefs, searchQuery, projectFilter]);

  // Unsaved Changes Detection
  const isDirty = useMemo(() => {
    if (!activeBrief) {
      // In create mode: dirty if name or persona has been typed
      return Boolean(name.trim() || targetPersona.trim() || locations.length > 0);
    }

    const initialAppeals = activeBrief.keyAppealDrivers || activeBrief.interests || [];
    const appealsMatch =
      keyAppeals.length === initialAppeals.length &&
      keyAppeals.every((a) => initialAppeals.includes(a));

    const initialLocs = activeBrief.locations || [];
    const locsMatch =
      locations.length === initialLocs.length &&
      locations.every((l) => initialLocs.includes(l));

    return (
      name !== (activeBrief.name || activeBrief.projectName || '') ||
      (projectId || '') !== (activeBrief.projectId || '') ||
      targetPersona !== (activeBrief.targetPersona || '') ||
      incomeBracket !== (activeBrief.incomeBracket || '') ||
      !locsMatch ||
      !appealsMatch
    );
  }, [activeBrief, name, projectId, targetPersona, incomeBracket, locations, keyAppeals]);

  // Warn before unloading if changes pending
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  // Telemetry Metrics
  const metrics = useMemo(() => {
    const total = briefs.length;
    const allLocations = new Set(briefs.flatMap((b) => b.locations || []));
    const allAppeals = new Set(briefs.flatMap((b) => b.keyAppealDrivers || b.interests || []));
    const projectLinked = briefs.filter((b) => Boolean(b.projectId)).length;

    return {
      total,
      uniqueLocations: allLocations.size,
      uniqueAppeals: allAppeals.size,
      projectLinked,
    };
  }, [briefs]);

  // Tag Handlers
  const handleAddLocation = (locToAdd?: string) => {
    const loc = (locToAdd || newLocationInput).trim();
    if (loc && !locations.includes(loc)) {
      setLocations([...locations, loc]);
      setNewLocationInput('');
    }
  };

  const handleRemoveLocation = (loc: string) => {
    setLocations(locations.filter((l) => l !== loc));
  };

  const handleAddAppeal = (appealToAdd?: string) => {
    const app = (appealToAdd || newAppealInput).trim();
    if (app && !keyAppeals.includes(app)) {
      setKeyAppeals([...keyAppeals, app]);
      setNewAppealInput('');
    }
  };

  const handleRemoveAppeal = (app: string) => {
    setKeyAppeals(keyAppeals.filter((a) => a !== app));
  };

  // Form Actions
  const handleSaveBrief = async () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      toast({ title: 'Validation Error', message: 'Audience profile name is required', type: 'error' });
      return;
    }

    try {
      if (activeBrief && activeBrief.id) {
        await updateMutation.mutateAsync({
          id: activeBrief.id,
          data: {
            name: trimmedName,
            projectId: projectId || undefined,
            targetPersona: targetPersona.trim() || 'Prospective Property Buyer',
            incomeBracket: incomeBracket.trim() || 'High Net-Worth Individuals',
            locations,
            interests: keyAppeals,
            housingAdPolicyAcknowledged: true,
          },
        });
        toast({
          title: 'Audience Profile Saved',
          message: `Targeting parameters for "${trimmedName}" updated successfully.`,
          type: 'success',
        });
      } else {
        const created = await createMutation.mutateAsync({
          name: trimmedName,
          projectId: projectId || undefined,
          targetPersona: targetPersona.trim() || 'Prospective Property Buyer',
          incomeBracket: incomeBracket.trim() || 'High Net-Worth Individuals',
          locations,
          interests: keyAppeals,
          housingAdPolicyAcknowledged: true,
        });
        setSelectedBriefId(created.id!);
        toast({
          title: 'Audience Profile Created',
          message: `Created "${trimmedName}" targeting profile.`,
          type: 'success',
        });
      }
    } catch (err: unknown) {
      toast({
        title: 'Save Failed',
        message: err instanceof Error ? err.message : 'Could not save audience profile',
        type: 'error',
      });
    }
  };

  const handleCreateNew = () => {
    setSelectedBriefId('');
    setName('New Luxury Buyer Persona');
    setProjectId('');
    setTargetPersona('C-Suite Tech Executives, Founders, NRI Investors');
    setIncomeBracket('₹2.0 Cr+ Annual Household Income');
    setLocations(['Golf Course Road', 'DLF Phase 5']);
    setKeyAppeals(['High Capital Appreciation', 'Architectural Eminence']);
  };

  const handleRevert = () => {
    if (activeBrief) {
      setName(activeBrief.name || activeBrief.projectName || '');
      setProjectId(activeBrief.projectId || '');
      setTargetPersona(activeBrief.targetPersona || '');
      setIncomeBracket(activeBrief.incomeBracket || '');
      setLocations(activeBrief.locations || []);
      setKeyAppeals(activeBrief.keyAppealDrivers || activeBrief.interests || []);
      toast({
        title: 'Edits Reverted',
        message: 'Reverted targeting form to stored profile values.',
        type: 'info',
      });
    }
  };

  const handleDeleteBrief = async (briefToDelete: BackendAudienceBrief) => {
    if (!briefToDelete?.id) return;
    if (confirm(`Permanently delete audience profile "${briefToDelete.name || briefToDelete.projectName}"?`)) {
      try {
        await deleteMutation.mutateAsync(briefToDelete.id);
        toast({
          title: 'Audience Profile Deleted',
          message: 'The profile has been removed from workspace inventory.',
          type: 'info',
        });
        setSelectedBriefId('');
      } catch (err: unknown) {
        toast({
          title: 'Delete Failed',
          message: err instanceof Error ? err.message : 'Could not delete audience profile',
          type: 'error',
        });
      }
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64 rounded-lg" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Skeleton className="h-24 w-full rounded-2xl" />
          <Skeleton className="h-24 w-full rounded-2xl" />
          <Skeleton className="h-24 w-full rounded-2xl" />
          <Skeleton className="h-24 w-full rounded-2xl" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 space-y-3">
            <Skeleton className="h-64 w-full rounded-2xl" />
          </div>
          <div className="lg:col-span-7 space-y-4">
            <Skeleton className="h-96 w-full rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 1. Breadcrumbs */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-slate-500">
        <Link to="/dashboard" className="hover:text-slate-900 transition-colors">
          Dashboard
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
        <Link to="/campaigns" className="hover:text-slate-900 transition-colors">
          Marketing
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
        <span className="text-slate-900 font-medium">Audience Intelligence</span>
      </nav>

      {/* 2. Header Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
                Audience Intelligence &amp; Targeting Profiles
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/60 tabular-nums">
                {briefs.length} Active Profiles
              </span>
              {isDirty && (
                <Badge variant="outline" className="border-amber-200 text-amber-800 bg-amber-50 text-xs">
                  Unsaved edits
                </Badge>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Configure project-specific buyer personas, micro-market geographic radiuses, and fair housing compliant targeting segments.
            </p>
          </div>

          {/* Action Controls */}
          <div className="flex items-center gap-2 self-end md:self-auto">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isFetching}
              leftIcon={<RefreshCw className={`w-3.5 h-3.5 text-slate-600 ${isFetching ? 'animate-spin' : ''}`} />}
              className="rounded-xl border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold"
            >
              Refresh
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCreateNew}
              leftIcon={<Plus className="w-3.5 h-3.5 text-emerald-600" />}
              className="rounded-xl border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold"
            >
              New Profile
            </Button>
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={handleSaveBrief}
              isLoading={updateMutation.isPending || createMutation.isPending}
              leftIcon={<Save className="w-3.5 h-3.5" />}
              className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm"
            >
              Save Profile
            </Button>
          </div>
        </div>
      </div>

      {/* 3. Statutory Housing-Ad Compliance Banner */}
      <div className="rounded-2xl border border-rose-200/80 bg-rose-50/70 p-4 shadow-xs">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-white border border-rose-200 rounded-xl shrink-0 mt-0.5 shadow-xs">
            <AlertTriangle className="w-5 h-5 text-rose-600" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-bold text-rose-900">
                Statutory Housing Advertising Compliance Policy Active
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700 border border-rose-200 uppercase tracking-wider">
                Special Ad Category
              </span>
            </div>
            <p className="text-xs text-rose-800/90 leading-relaxed">
              <strong>Fair Housing Regulations &amp; Ad Platform Rules:</strong> Real estate advertisements are strictly prohibited from targeting or excluding audiences on the basis of age, gender, parental status, marital status, religion, caste, national origin, or disability. RealCRM AI models enforce broad micro-market geographic radiuses and verified property value preferences only.
            </p>
          </div>
        </div>
      </div>

      {/* 4. Audience Overview KPI Deck */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Total Profiles */}
        <div className="rounded-2xl bg-white border border-slate-200/80 p-5 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
              Total Profiles
            </span>
            <div className="text-2xl font-bold text-slate-900 tabular-nums mt-1">
              {metrics.total}
            </div>
            <span className="text-[11px] text-slate-400">
              {searchQuery || projectFilter !== 'ALL'
                ? `Showing ${filteredBriefs.length} filtered`
                : 'Workspace targeting catalog'}
            </span>
          </div>
          <div className="h-10 w-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
            <Users className="w-5 h-5 text-emerald-600" />
          </div>
        </div>

        {/* KPI 2: Target Micro-Markets */}
        <div className="rounded-2xl bg-white border border-slate-200/80 p-5 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
              Target Micro-Markets
            </span>
            <div className="text-2xl font-bold text-emerald-700 tabular-nums mt-1">
              {metrics.uniqueLocations}
            </div>
            <span className="text-[11px] text-slate-400">Unique geographic clusters</span>
          </div>
          <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <MapPin className="w-5 h-5 stroke-[2.2]" />
          </div>
        </div>

        {/* KPI 3: Key Value Drivers */}
        <div className="rounded-2xl bg-white border border-slate-200/80 p-5 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
              Value Propositions
            </span>
            <div className="text-2xl font-bold text-blue-600 tabular-nums mt-1">
              {metrics.uniqueAppeals}
            </div>
            <span className="text-[11px] text-slate-400">Buyer appeal drivers</span>
          </div>
          <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Target className="w-5 h-5 stroke-[2.2]" />
          </div>
        </div>

        {/* KPI 4: Compliance Guard */}
        <div className="rounded-2xl bg-white border border-slate-200/80 p-5 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
              Fair Housing Guard
            </span>
            <div className="text-2xl font-bold text-emerald-600 tabular-nums mt-1">
              100%
            </div>
            <span className="text-[11px] text-slate-400">Policy enforced targeting</span>
          </div>
          <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5 stroke-[2.2]" />
          </div>
        </div>
      </div>

      {/* 5. Master-Detail Segmentation Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: PROFILES LIST & FILTERS (Col-span 5) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm space-y-3">
            {/* Filter Bar */}
            <div className="space-y-2">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search personas, locations, or appeals..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-8 py-2 text-xs rounded-xl border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Project Filter Selector */}
              {projects.length > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider shrink-0">
                    Project:
                  </span>
                  <select
                    value={projectFilter}
                    onChange={(e) => setProjectFilter(e.target.value)}
                    className="flex-1 py-1.5 px-2.5 text-xs rounded-lg border border-slate-200 bg-slate-50/50 text-slate-700 focus:outline-none focus:border-emerald-500 font-medium"
                  >
                    <option value="ALL">All Associated Developments</option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* List Header */}
            <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-xs text-slate-500 font-medium">
              <span>Audience Profiles ({filteredBriefs.length})</span>
              <button
                type="button"
                onClick={handleCreateNew}
                className="text-emerald-600 hover:text-emerald-700 font-bold flex items-center gap-1"
              >
                <Plus className="w-3 h-3" />
                <span>New</span>
              </button>
            </div>

            {/* Profiles Scrollable Cards List */}
            <div className="space-y-2.5 max-h-[620px] overflow-y-auto pr-1">
              {filteredBriefs.length === 0 ? (
                <div className="py-8 text-center space-y-2">
                  <Compass className="w-8 h-8 text-slate-300 mx-auto" />
                  <p className="text-xs font-semibold text-slate-700">No matching audience profiles</p>
                  <p className="text-[11px] text-slate-400">
                    {searchQuery ? 'Try clearing your search query.' : 'Create your first buyer persona brief.'}
                  </p>
                  {searchQuery && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setSearchQuery('')}
                      className="rounded-xl border-slate-200 text-xs font-semibold mt-2"
                    >
                      Reset Search
                    </Button>
                  )}
                </div>
              ) : (
                filteredBriefs.map((brief) => {
                  const isSelected = brief.id === selectedBriefId;
                  const linkedProj = projects.find((p) => p.id === brief.projectId);

                  return (
                    <div
                      key={brief.id}
                      onClick={() => setSelectedBriefId(brief.id!)}
                      className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer relative ${
                        isSelected
                          ? 'border-emerald-500 bg-emerald-50/40 ring-1 ring-emerald-500 shadow-sm'
                          : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/60'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-1 flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-xs font-bold text-slate-900 truncate">
                              {brief.name || brief.projectName}
                            </span>
                            {linkedProj ? (
                              <span className="px-2 py-0.2 rounded-md text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200 truncate max-w-[120px]">
                                {linkedProj.name}
                              </span>
                            ) : (
                              <span className="px-2 py-0.2 rounded-md text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                                Global
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-500 line-clamp-1">
                            {brief.targetPersona}
                          </p>
                        </div>
                        {isSelected && (
                          <div className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0 mt-0.5">
                            <Check className="w-3 h-3 stroke-[3]" />
                          </div>
                        )}
                      </div>

                      {/* Tags Footer */}
                      <div className="flex items-center gap-3 mt-2.5 pt-2 border-t border-slate-100 text-[11px] text-slate-500">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          <span className="font-semibold text-slate-700">{brief.locations?.length || 0}</span> areas
                        </span>
                        <span>&bull;</span>
                        <span className="flex items-center gap-1">
                          <Target className="w-3 h-3 text-slate-400" />
                          <span className="font-semibold text-slate-700">
                            {(brief.keyAppealDrivers || brief.interests || []).length}
                          </span> appeals
                        </span>
                        {brief.updatedAt && (
                          <>
                            <span className="ml-auto text-[10px] text-slate-400">
                              {formatDisplayDate(brief.updatedAt)}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: ACTIVE AUDIENCE PROFILE EDITOR (Col-span 7) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-6">
            {/* Header Strip */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/60 uppercase tracking-wider">
                    {activeBrief ? 'Configured Profile' : 'New Audience Draft'}
                  </span>
                  {activeBrief?.updatedAt && (
                    <span className="text-[11px] text-slate-400">
                      Last edited {formatDisplayDate(activeBrief.updatedAt)}
                    </span>
                  )}
                </div>
                <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                  {name || 'Audience Targeting Configuration'}
                </h2>
              </div>

              {/* Profile Actions */}
              <div className="flex items-center gap-2 self-start sm:self-auto">
                {isDirty && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleRevert}
                    leftIcon={<RotateCcw className="w-3.5 h-3.5 text-slate-600" />}
                    className="rounded-xl border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold"
                  >
                    Revert
                  </Button>
                )}
                {activeBrief && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteBrief(activeBrief)}
                    isLoading={deleteMutation.isPending}
                    leftIcon={<Trash2 className="w-3.5 h-3.5 text-rose-600" />}
                    className="rounded-xl border-rose-200 text-rose-700 hover:bg-rose-50 text-xs font-semibold"
                  >
                    Delete
                  </Button>
                )}
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={handleSaveBrief}
                  isLoading={updateMutation.isPending || createMutation.isPending}
                  leftIcon={<Save className="w-3.5 h-3.5" />}
                  className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm"
                >
                  Save Profile
                </Button>
              </div>
            </div>

            {/* SECTION 1: IDENTITY & AFFLUENCE QUALIFICATION */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                <Users className="w-4 h-4 text-emerald-600" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  1. Ideal Buyer Persona &amp; Affluence Bracket
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Target Audience Brief Title *"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. South Delhi & Gurugram HNIs"
                />

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Linked Real Estate Development
                  </label>
                  <select
                    value={projectId}
                    onChange={(e) => setProjectId(e.target.value)}
                    className="w-full p-2.5 text-xs rounded-xl border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium"
                  >
                    <option value="">Universal / All Developments</option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Primary Target Persona Description *"
                  value={targetPersona}
                  onChange={(e) => setTargetPersona(e.target.value)}
                  placeholder="e.g. C-Suite Tech Executives, Founders, Specialized Consultants"
                />

                <Input
                  label="Income Bracket / Liquidity Qualification"
                  value={incomeBracket}
                  onChange={(e) => setIncomeBracket(e.target.value)}
                  placeholder="e.g. ₹1.5 Cr+ Annual Household Income"
                />
              </div>
            </div>

            {/* SECTION 2: TARGET MICRO-MARKETS */}
            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-emerald-600" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    2. Geographic Micro-Markets ({locations.length})
                  </h3>
                </div>
                <span className="text-[11px] text-slate-400">Broad geographic radiuses</span>
              </div>

              {/* Tag Cloud */}
              <div className="flex flex-wrap gap-2 min-h-[44px] p-3 rounded-xl border border-slate-200/80 bg-slate-50/60">
                {locations.length === 0 ? (
                  <span className="text-xs text-slate-400 italic">
                    No micro-markets specified yet. Add targeted sectors, business districts, or neighborhoods.
                  </span>
                ) : (
                  locations.map((loc) => (
                    <span
                      key={loc}
                      className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold bg-white border border-slate-200 text-slate-800 rounded-lg shadow-2xs"
                    >
                      <MapPin className="w-3 h-3 text-emerald-600" />
                      <span>{loc}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveLocation(loc)}
                        className="text-slate-400 hover:text-rose-600 ml-1 transition-colors"
                        title={`Remove ${loc}`}
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </span>
                  ))
                )}
              </div>

              {/* Add Location Form & Quick Suggestions */}
              <div className="space-y-2">
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Enter micro-market (e.g. DLF CyberCity, Golf Course Ext)..."
                    value={newLocationInput}
                    onChange={(e) => setNewLocationInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddLocation();
                      }
                    }}
                    className="flex-1 p-2.5 text-xs rounded-xl border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleAddLocation()}
                    className="rounded-xl border-slate-300 text-slate-800 hover:bg-slate-50 text-xs font-semibold px-4"
                  >
                    <Plus className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                    Add Area
                  </Button>
                </div>

                {/* Suggestions */}
                <div className="flex items-center gap-1.5 flex-wrap pt-1">
                  <span className="text-[11px] font-semibold text-slate-400">Suggestions:</span>
                  {SUGGESTED_LOCATIONS.filter((l) => !locations.includes(l))
                    .slice(0, 4)
                    .map((sug) => (
                      <button
                        key={sug}
                        type="button"
                        onClick={() => handleAddLocation(sug)}
                        className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                      >
                        + {sug}
                      </button>
                    ))}
                </div>
              </div>
            </div>

            {/* SECTION 3: KEY APPEAL DRIVERS & VALUE PROPOSITIONS */}
            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-emerald-600" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    3. Key Appeal Drivers &amp; Value Propositions ({keyAppeals.length})
                  </h3>
                </div>
                <span className="text-[11px] text-slate-400">AI copywriting hooks</span>
              </div>

              {/* Tag Cloud */}
              <div className="flex flex-wrap gap-2 min-h-[44px] p-3 rounded-xl border border-slate-200/80 bg-slate-50/60">
                {keyAppeals.length === 0 ? (
                  <span className="text-xs text-slate-400 italic">
                    No value propositions specified. Add core hooks such as high ROI, luxury finishes, or panoramic views.
                  </span>
                ) : (
                  keyAppeals.map((app) => (
                    <span
                      key={app}
                      className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold bg-slate-900 text-white rounded-lg shadow-2xs"
                    >
                      <Sparkles className="w-3 h-3 text-amber-400" />
                      <span>{app}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveAppeal(app)}
                        className="text-slate-400 hover:text-rose-300 ml-1 transition-colors"
                        title={`Remove ${app}`}
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </span>
                  ))
                )}
              </div>

              {/* Add Appeal Input & Quick Suggestions */}
              <div className="space-y-2">
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Enter appeal driver (e.g. 100% DG Power Backup, High Capital Appreciation)..."
                    value={newAppealInput}
                    onChange={(e) => setNewAppealInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddAppeal();
                      }
                    }}
                    className="flex-1 p-2.5 text-xs rounded-xl border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleAddAppeal()}
                    className="rounded-xl border-slate-300 text-slate-800 hover:bg-slate-50 text-xs font-semibold px-4"
                  >
                    <Plus className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                    Add Appeal
                  </Button>
                </div>

                {/* Suggestions */}
                <div className="flex items-center gap-1.5 flex-wrap pt-1">
                  <span className="text-[11px] font-semibold text-slate-400">Suggestions:</span>
                  {SUGGESTED_APPEALS.filter((a) => !keyAppeals.includes(a))
                    .slice(0, 4)
                    .map((sug) => (
                      <button
                        key={sug}
                        type="button"
                        onClick={() => handleAddAppeal(sug)}
                        className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                      >
                        + {sug}
                      </button>
                    ))}
                </div>
              </div>
            </div>

            {/* SECTION 4: FAIR HOUSING & AD INTEGRATION POLICY NOTE */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 text-xs text-slate-600 flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-bold text-slate-900">Campaign Ad Platform Integration Rules</p>
                <p className="leading-relaxed">
                  When this audience profile is selected in Campaign Studio or Meta Connections, targeting parameters are automatically mapped into non-discriminatory geographic radii and interest categories compliant with Meta Special Ad Category standards for real estate housing.
                </p>
              </div>
            </div>

            {/* Bottom Form Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <span className="text-xs text-slate-500">
                {isDirty ? 'Unsaved profile modifications' : 'All parameters synchronized with database'}
              </span>

              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={handleSaveBrief}
                isLoading={updateMutation.isPending || createMutation.isPending}
                leftIcon={<Save className="w-3.5 h-3.5" />}
                className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm"
              >
                Save Audience Profile
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
