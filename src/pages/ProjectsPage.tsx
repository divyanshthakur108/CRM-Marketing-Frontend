import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useProjects, BackendProject } from '../hooks/useProjects';
import { StatusBadge } from '../components/ui/StatusBadge';
import { EmptyState } from '../components/ui/EmptyState';
import { formatLocationTitleCase } from '../lib/formatters';
import {
  Search,
  Plus,
  Building2,
  ArrowRight,
  Loader2,
  RefreshCw,
  MapPin,
  ShieldCheck,
  LayoutGrid,
  List,
  RotateCcw,
  X,
  Layers,
  Image as ImageIcon,
  CheckCircle2,
  AlertTriangle,
  Building,
} from 'lucide-react';

type CategoryFilter = 'ALL' | 'RESIDENTIAL' | 'COMMERCIAL' | 'INDUSTRIAL';
type StatusFilter = 'ALL' | 'ACTIVE' | 'READY' | 'DRAFT' | 'SOLD_OUT';
type ViewMode = 'grid' | 'list';

export function ProjectsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('ALL');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});

  // Fetch Projects from API (full workspace dataset for client-side multi-filtering)
  const {
    data: projects = [],
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  } = useProjects();

  // Client-Side Multi-Filter
  const filteredProjects = useMemo(() => {
    if (!projects || projects.length === 0) return [];

    return projects.filter((project: BackendProject) => {
      // 1. Category Filter with case normalization
      if (categoryFilter !== 'ALL') {
        const normCat = project.category?.toUpperCase();
        if (normCat !== categoryFilter) {
          return false;
        }
      }

      // 2. Status Filter with case normalization
      if (statusFilter !== 'ALL') {
        const normStatus = project.status?.toUpperCase();
        if (normStatus !== statusFilter) {
          return false;
        }
      }

      // 3. Search Term Filter
      const term = searchTerm.toLowerCase().trim();
      if (!term) return true;

      const nameMatch = project.name?.toLowerCase().includes(term);
      const cityMatch = project.city?.toLowerCase().includes(term);
      const microMatch = project.location?.microMarket?.toLowerCase().includes(term);
      const subtypeMatch = project.subtype?.toLowerCase().includes(term);
      const addressMatch = project.address?.toLowerCase().includes(term);
      const reraMatch = project.reraNumber?.toLowerCase().includes(term);
      const tagMatch = project.amenities?.some((a) => a.toLowerCase().includes(term));

      return Boolean(nameMatch || cityMatch || microMatch || subtypeMatch || addressMatch || reraMatch || tagMatch);
    });
  }, [projects, searchTerm, categoryFilter, statusFilter]);

  // Derived Project Statistics (Accurately separated by category)
  const metrics = useMemo(() => {
    const total = filteredProjects.length;
    const active = filteredProjects.filter(
      (p) => p.status?.toUpperCase() === 'ACTIVE' || p.status?.toUpperCase() === 'READY'
    ).length;
    const residential = filteredProjects.filter(
      (p) => p.category?.toUpperCase() === 'RESIDENTIAL'
    ).length;
    const commercial = filteredProjects.filter(
      (p) => p.category?.toUpperCase() === 'COMMERCIAL'
    ).length;
    const industrial = filteredProjects.filter(
      (p) => p.category?.toUpperCase() === 'INDUSTRIAL'
    ).length;

    return { total, active, residential, commercial, industrial };
  }, [filteredProjects]);

  const hasActiveFilters =
    categoryFilter !== 'ALL' || statusFilter !== 'ALL' || searchTerm.trim() !== '';

  const handleResetFilters = () => {
    setSearchTerm('');
    setCategoryFilter('ALL');
    setStatusFilter('ALL');
  };

  const handleImageError = (projectId: string) => {
    setImageErrors((prev) => ({ ...prev, [projectId]: true }));
  };

  // Format Display Location
  const formatProjectLocation = (project: BackendProject) => {
    const parts: string[] = [];
    if (project.location?.microMarket) parts.push(project.location.microMarket);
    if (project.city) parts.push(project.city);
    if (project.state && parts.length < 2) parts.push(project.state);

    if (parts.length > 0) {
      return formatLocationTitleCase(parts.join(', '));
    }
    if (project.address) {
      return formatLocationTitleCase(project.address);
    }
    return 'Location on Request';
  };

  // Format Category Label & Tone
  const getCategoryDetails = (cat?: string) => {
    switch (cat) {
      case 'COMMERCIAL':
        return { label: 'Commercial', bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' };
      case 'INDUSTRIAL':
        return { label: 'Industrial / Land', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' };
      default:
        return { label: 'Residential', bg: 'bg-[#E8F7F1]', text: 'text-[#10B981]', border: 'border-[#10B981]/20' };
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Header & Contextual Breadcrumbs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <nav aria-label="Breadcrumbs" className="flex items-center gap-1.5 text-xs text-[#64748B] mb-1">
            <Link to="/dashboard" className="hover:text-[#10B981] transition-colors">
              Dashboard
            </Link>
            <span className="text-slate-300">/</span>
            <span className="text-[#64748B]">Inventory</span>
            <span className="text-slate-300">/</span>
            <span className="font-semibold text-[#1F2937]">Property Catalog</span>
          </nav>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-[#1F2937]">
              Property Catalog &amp; Developments
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#E8F7F1] text-[#10B981] border border-[#10B981]/20">
              {projects.length} Total Development{projects.length !== 1 ? 's' : ''}
            </span>
          </div>
          <p className="text-xs text-[#64748B] mt-0.5">
            Enterprise inventory management, RERA specifications, unit matrices, and rights-consented architectural media.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Refresh Action */}
          <button
            type="button"
            onClick={() => refetch()}
            disabled={isFetching}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[#EDF0F2] bg-white text-xs font-semibold text-[#1F2937] hover:bg-slate-50 shadow-xs transition-all active:scale-[0.98] cursor-pointer"
            title="Refresh developments from database"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-[#10B981] ${isFetching ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          {/* Create Project Action */}
          <Link to="/projects/new">
            <button
              type="button"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#10B981] text-white text-xs font-semibold hover:bg-[#059669] shadow-xs transition-all active:scale-[0.98] cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Development</span>
            </button>
          </Link>
        </div>
      </div>

      {/* 2. Overview KPI Cards (Real Backend Properties) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Total / Filtered Projects */}
        <div className="rounded-2xl bg-white border border-[#EDF0F2] p-5 shadow-[0_0_2px_0_rgba(145,158,171,0.2),0_12px_24px_-4px_rgba(145,158,171,0.12)] flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-[#64748B] uppercase tracking-wider block">
              {hasActiveFilters ? 'Filtered Projects' : 'Total Projects'}
            </span>
            <div className="text-2xl font-bold text-[#1F2937] tabular-nums mt-1">
              {isLoading ? (
                <div className="h-7 w-12 bg-slate-100 rounded-md animate-pulse" />
              ) : (
                metrics.total
              )}
            </div>
            <span className="text-[11px] text-[#64748B]">
              {hasActiveFilters ? `Filtered of ${projects.length} in portfolio` : 'Total catalog inventory'}
            </span>
          </div>
          <div className="h-10 w-10 rounded-xl bg-slate-100 text-[#1F2937] flex items-center justify-center shrink-0">
            <Building2 className="w-5 h-5 text-[#10B981]" />
          </div>
        </div>

        {/* KPI 2: Active & Ready */}
        <div className="rounded-2xl bg-white border border-[#EDF0F2] p-5 shadow-[0_0_2px_0_rgba(145,158,171,0.2),0_12px_24px_-4px_rgba(145,158,171,0.12)] flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-[#64748B] uppercase tracking-wider block">
              Active / Ready
            </span>
            <div className="text-2xl font-bold text-[#10B981] tabular-nums mt-1">
              {isLoading ? (
                <div className="h-7 w-12 bg-slate-100 rounded-md animate-pulse" />
              ) : (
                metrics.active
              )}
            </div>
            <span className="text-[11px] text-[#64748B]">
              {hasActiveFilters ? 'Filtered active developments' : 'Approved for marketing'}
            </span>
          </div>
          <div className="h-10 w-10 rounded-xl bg-[#E8F7F1] text-[#10B981] flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5 stroke-[2.2]" />
          </div>
        </div>

        {/* KPI 3: Residential Projects */}
        <div className="rounded-2xl bg-white border border-[#EDF0F2] p-5 shadow-[0_0_2px_0_rgba(145,158,171,0.2),0_12px_24px_-4px_rgba(145,158,171,0.12)] flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-[#64748B] uppercase tracking-wider block">
              Residential
            </span>
            <div className="text-2xl font-bold text-[#3B82F6] tabular-nums mt-1">
              {isLoading ? (
                <div className="h-7 w-12 bg-slate-100 rounded-md animate-pulse" />
              ) : (
                metrics.residential
              )}
            </div>
            <span className="text-[11px] text-[#64748B]">
              {hasActiveFilters ? 'Filtered residential units' : 'Apartments, villas & plots'}
            </span>
          </div>
          <div className="h-10 w-10 rounded-xl bg-[#EFF6FF] text-[#3B82F6] flex items-center justify-center shrink-0">
            <Building className="w-5 h-5 stroke-[2.2]" />
          </div>
        </div>

        {/* KPI 4: Commercial Projects */}
        <div className="rounded-2xl bg-white border border-[#EDF0F2] p-5 shadow-[0_0_2px_0_rgba(145,158,171,0.2),0_12px_24px_-4px_rgba(145,158,171,0.12)] flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-[#64748B] uppercase tracking-wider block">
              Commercial
            </span>
            <div className="text-2xl font-bold text-[#8B5CF6] tabular-nums mt-1">
              {isLoading ? (
                <div className="h-7 w-12 bg-slate-100 rounded-md animate-pulse" />
              ) : (
                metrics.commercial
              )}
            </div>
            <span className="text-[11px] text-[#64748B]">
              {metrics.industrial > 0 ? `Offices & retail (${metrics.industrial} industrial)` : 'Offices, retail & SCO'}
            </span>
          </div>
          <div className="h-10 w-10 rounded-xl bg-[#EDE9FE] text-[#8B5CF6] flex items-center justify-center shrink-0">
            <Layers className="w-5 h-5 stroke-[2.2]" />
          </div>
        </div>
      </div>

      {/* 3. Error Banner */}
      {isError && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50/80 p-4 shadow-xs flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <p className="font-bold text-rose-900 text-sm">Failed to Load Projects</p>
              <p className="text-rose-800/90 text-xs mt-0.5">
                {error instanceof Error ? error.message : 'Could not retrieve catalog developments.'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => refetch()}
            className="px-3.5 py-1.5 rounded-xl bg-rose-600 text-white font-semibold hover:bg-rose-700 transition-all cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* 4. Search & Multi-Filter Toolbar */}
      <div className="rounded-2xl bg-white border border-[#EDF0F2] p-4 shadow-[0_0_2px_0_rgba(145,158,171,0.2),0_12px_24px_-4px_rgba(145,158,171,0.12)] space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search Field */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search projects by name, location, RERA, amenities..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-10 text-xs pl-10 pr-9 rounded-xl border border-[#EDF0F2] bg-slate-50/50 text-[#1F2937] placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-[#10B981] focus:border-[#10B981] focus:bg-white transition-all"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#1F2937] p-0.5 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Segmented Category Filter */}
          <div className="inline-flex items-center rounded-xl bg-slate-100 p-0.5 text-xs font-semibold">
            {(['ALL', 'RESIDENTIAL', 'COMMERCIAL', 'INDUSTRIAL'] as const).map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategoryFilter(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  categoryFilter === cat
                    ? 'bg-white text-[#10B981] shadow-xs'
                    : 'text-[#64748B] hover:text-[#1F2937]'
                }`}
              >
                {cat === 'ALL' ? 'All Types' : cat === 'RESIDENTIAL' ? 'Residential' : cat === 'COMMERCIAL' ? 'Commercial' : 'Industrial'}
              </button>
            ))}
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-xl self-start md:self-auto">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-white text-[#10B981] shadow-xs'
                  : 'text-[#64748B] hover:text-[#1F2937]'
              }`}
              title="Grid View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                viewMode === 'list'
                  ? 'bg-white text-[#10B981] shadow-xs'
                  : 'text-[#64748B] hover:text-[#1F2937]'
              }`}
              title="List View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Secondary Filter: Status Pills */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#EDF0F2] text-xs">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[#64748B] font-medium mr-1 text-[11px]">Status:</span>
            {(['ALL', 'ACTIVE', 'READY', 'DRAFT', 'SOLD_OUT'] as const).map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setStatusFilter(st)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                  statusFilter === st
                    ? 'bg-[#E8F7F1] text-[#10B981] border border-[#10B981]/30'
                    : 'bg-slate-50 text-[#64748B] border border-slate-200/80 hover:bg-slate-100'
                }`}
              >
                {st === 'ALL' ? 'All Statuses' : st === 'ACTIVE' ? 'Active' : st === 'READY' ? 'Ready' : st === 'DRAFT' ? 'Draft' : 'Sold Out'}
              </button>
            ))}
          </div>

          {/* Reset Filters Action */}
          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#10B981] hover:text-[#059669] transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Filters</span>
            </button>
          )}
        </div>
      </div>

      {/* 5. Catalog Projects Presentation (Grid vs List View) */}
      {isLoading ? (
        <div className="py-24 flex flex-col items-center justify-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-[#10B981]" />
          <span className="text-xs font-semibold text-[#64748B]">
            Loading real estate developments...
          </span>
        </div>
      ) : filteredProjects.length === 0 ? (
        <EmptyState
          icon={<Building2 className="w-12 h-12 text-slate-400" />}
          title={hasActiveFilters ? 'No matching projects found' : 'No developments in catalog'}
          description={
            hasActiveFilters
              ? 'No projects match your active search terms or category filters. Reset filters to view all inventory.'
              : 'Get started by creating your first catalog development with verified RERA specifications and media.'
          }
          action={
            hasActiveFilters ? (
              <button
                type="button"
                onClick={handleResetFilters}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#10B981] text-white text-xs font-semibold hover:bg-[#059669] transition-all cursor-pointer shadow-xs"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Filters</span>
              </button>
            ) : (
              <Link to="/projects/new">
                <button
                  type="button"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#10B981] text-white text-xs font-semibold hover:bg-[#059669] transition-all cursor-pointer shadow-xs"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create Development</span>
                </button>
              </Link>
            )
          }
        />
      ) : viewMode === 'grid' ? (
        /* ========================================================================= */
        /* GRID VIEW: CARDS (Responsive 1 -> 2 -> 3 Cols)                           */
        /* ========================================================================= */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project: BackendProject) => {
            const displayLocation = formatProjectLocation(project);
            const catDetails = getCategoryDetails(project.category);
            const hasValidImage = Boolean(project.coverImageUrl && !imageErrors[project.id || project._id]);

            return (
              <div
                key={project.id || project._id}
                className="rounded-2xl border border-[#EDF0F2] bg-white shadow-[0_0_2px_0_rgba(145,158,171,0.2),0_12px_24px_-4px_rgba(145,158,171,0.12)] overflow-hidden flex flex-col justify-between hover:shadow-lg transition-all group"
              >
                <div>
                  {/* Media Thumbnail Container (16:9 Aspect Ratio) */}
                  <div className="relative w-full aspect-video bg-slate-100 overflow-hidden">
                    {hasValidImage ? (
                      <img
                        src={project.coverImageUrl}
                        alt={project.name}
                        onError={() => handleImageError(project.id || project._id)}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      /* Elegant Neutral Architectural Placeholder */
                      <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 text-slate-400 p-4">
                        <div className="w-12 h-12 rounded-2xl bg-white/80 shadow-xs flex items-center justify-center text-[#10B981] mb-2">
                          <Building2 className="w-6 h-6" />
                        </div>
                        <span className="text-xs font-semibold text-slate-500 line-clamp-1">
                          {project.name}
                        </span>
                        <span className="text-[10px] text-slate-400">Architectural Media Pending</span>
                      </div>
                    )}

                    {/* Gradient Overlay for Top Badges */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/20 pointer-events-none" />

                    {/* Top Left: Category Badge */}
                    <div className="absolute top-3 left-3">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[11px] font-bold shadow-xs backdrop-blur-xs ${catDetails.bg} ${catDetails.text} border ${catDetails.border}`}
                      >
                        {catDetails.label}
                      </span>
                    </div>

                    {/* Top Right: Status Badge */}
                    <div className="absolute top-3 right-3 shadow-xs">
                      <StatusBadge status={project.status || 'DRAFT'} />
                    </div>

                    {/* Bottom Right: Price Range Badge (If Supported) */}
                    <div className="absolute bottom-3 right-3">
                      <span className="px-2.5 py-1 rounded-xl text-xs font-bold bg-white/95 text-[#1F2937] shadow-sm backdrop-blur-xs tabular-nums">
                        {project.priceRange?.display || project.priceDisplay || 'Price on Request'}
                      </span>
                    </div>
                  </div>

                  {/* Card Content Body */}
                  <div className="p-5 space-y-3">
                    <div>
                      <Link
                        to={`/projects/${project.id || project._id}`}
                        className="text-base font-bold text-[#1F2937] hover:text-[#10B981] transition-colors line-clamp-1"
                      >
                        {project.name}
                      </Link>
                      <p className="text-xs font-medium text-[#64748B] mt-0.5 line-clamp-1">
                        {project.subtype || 'Residential Development'}
                      </p>
                    </div>

                    {/* Location */}
                    <div className="flex items-center gap-1.5 text-xs text-[#64748B]">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{displayLocation}</span>
                    </div>

                    {/* RERA Registration (Truthful Display Only) */}
                    {project.reraNumber && (
                      <div className="flex items-center gap-1.5 text-[11px] text-[#64748B] pt-1">
                        <ShieldCheck className="w-3.5 h-3.5 text-[#10B981] shrink-0" />
                        <span className="font-mono text-slate-600 truncate">
                          RERA: {project.reraNumber}
                        </span>
                      </div>
                    )}

                    {/* Amenities Chips */}
                    {project.amenities && project.amenities.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-2">
                        {project.amenities.slice(0, 3).map((a, idx) => (
                          <span
                            key={idx}
                            className="text-[10px] px-2 py-0.5 rounded-md bg-slate-50 text-[#64748B] font-semibold border border-slate-200/80"
                          >
                            {a}
                          </span>
                        ))}
                        {project.amenities.length > 3 && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-500 font-medium">
                            +{project.amenities.length - 3} more
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Action Footer */}
                <div className="p-4 px-5 border-t border-[#EDF0F2] bg-slate-50/50 flex items-center justify-between gap-3">
                  <Link
                    to={`/assets?projectId=${project.id || project._id}`}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#64748B] hover:text-[#1F2937] transition-colors"
                  >
                    <ImageIcon className="w-3.5 h-3.5 text-slate-400" />
                    <span>Media Assets</span>
                  </Link>

                  <Link to={`/projects/${project.id || project._id}`}>
                    <button
                      type="button"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#EDF0F2] bg-white hover:bg-slate-50 text-[#1F2937] text-xs font-semibold shadow-xs transition-all active:scale-[0.98] cursor-pointer"
                    >
                      <span>View Specs</span>
                      <ArrowRight className="w-3.5 h-3.5 text-[#10B981]" />
                    </button>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* ========================================================================= */
        /* LIST VIEW: ENTERPRISE ROWS                                               */
        /* ========================================================================= */
        <div className="rounded-2xl border border-[#EDF0F2] bg-white shadow-[0_0_2px_0_rgba(145,158,171,0.2),0_12px_24px_-4px_rgba(145,158,171,0.12)] divide-y divide-[#EDF0F2] overflow-hidden">
          {filteredProjects.map((project: BackendProject) => {
            const displayLocation = formatProjectLocation(project);
            const catDetails = getCategoryDetails(project.category);
            const hasValidImage = Boolean(project.coverImageUrl && !imageErrors[project.id || project._id]);

            return (
              <div
                key={project.id || project._id}
                className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/60 transition-colors"
              >
                <div className="flex items-start sm:items-center gap-4 min-w-0">
                  {/* Thumbnail (80x80) */}
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-slate-100 overflow-hidden shrink-0 relative border border-[#EDF0F2]">
                    {hasValidImage ? (
                      <img
                        src={project.coverImageUrl}
                        alt={project.name}
                        onError={() => handleImageError(project.id || project._id)}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[#10B981] bg-slate-50">
                        <Building2 className="w-6 h-6" />
                      </div>
                    )}
                  </div>

                  {/* Project Details */}
                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        to={`/projects/${project.id || project._id}`}
                        className="text-sm sm:text-base font-bold text-[#1F2937] hover:text-[#10B981] transition-colors truncate"
                      >
                        {project.name}
                      </Link>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${catDetails.bg} ${catDetails.text}`}
                      >
                        {catDetails.label}
                      </span>
                      <StatusBadge status={project.status || 'DRAFT'} />
                    </div>

                    <p className="text-xs text-[#64748B] flex items-center gap-1.5 truncate">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{displayLocation}</span>
                      <span className="text-slate-300">&bull;</span>
                      <span>{project.subtype || 'Development'}</span>
                    </p>

                    {project.reraNumber && (
                      <p className="text-[11px] font-mono text-slate-500 flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5 text-[#10B981]" />
                        <span>RERA: {project.reraNumber}</span>
                      </p>
                    )}
                  </div>
                </div>

                {/* Right Side: Price & Actions */}
                <div className="flex sm:flex-col sm:items-end justify-between items-center gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                  <div className="text-right">
                    <span className="text-[11px] text-[#64748B] block">Price Pacing</span>
                    <span className="text-sm font-bold text-[#1F2937] tabular-nums">
                      {project.priceRange?.display || project.priceDisplay || 'On Request'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Link
                      to={`/assets?projectId=${project.id || project._id}`}
                      className="px-2.5 py-1.5 rounded-xl border border-[#EDF0F2] text-xs font-semibold text-[#64748B] hover:text-[#1F2937] hover:bg-slate-50 transition-colors"
                      title="View media library assets for this project"
                    >
                      <ImageIcon className="w-3.5 h-3.5" />
                    </Link>

                    <Link to={`/projects/${project.id || project._id}`}>
                      <button
                        type="button"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#10B981] text-white text-xs font-semibold hover:bg-[#059669] shadow-xs transition-all cursor-pointer"
                      >
                        <span>View Specs</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
