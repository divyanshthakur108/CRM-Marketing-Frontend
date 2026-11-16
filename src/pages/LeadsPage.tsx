import { useState } from 'react';
import { Button } from '../components/ui/Button';
import { StatusBadge } from '../components/ui/StatusBadge';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalDescription,
} from '../components/ui/Modal';
import { useToast } from '../components/ui/Toast';
import { cn } from '../lib/utils';
import { formatCurrency, formatDisplayDate } from '../lib/formatters';
import {
  useLeads,
  useLead,
  useCreateLead,
  useUpdateLead,
  useAddTimelineEntry,
  BackendLead,
  LeadStage,
  LeadSource,
} from '../hooks/useLeads';
import {
  Search,
  Columns,
  List as ListIcon,
  Clock,
  Plus,
  RefreshCw,
  Phone,
  Mail,
  ShieldCheck,
  Building2,
  Users,
  CalendarCheck,
  Trophy,
  Filter,
  X,
  ArrowRight,
  TrendingUp,
  UserCheck,
  PhoneCall,
  FileText,
  Calendar,
  MessageCircle,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

const STAGES: LeadStage[] = [
  'New',
  'Contacted',
  'Qualified',
  'Visit scheduled',
  'Visit done',
  'Negotiation',
  'Won/Lost',
];

const STAGE_ACCENT_COLORS: Record<LeadStage, { border: string; bg: string; text: string }> = {
  New: { border: '#10B981', bg: 'bg-[#E8F7F1]', text: 'text-[#10B981]' },
  Contacted: { border: '#3B82F6', bg: 'bg-[#EFF6FF]', text: 'text-[#3B82F6]' },
  Qualified: { border: '#8B5CF6', bg: 'bg-[#F5F3FF]', text: 'text-[#8B5CF6]' },
  'Visit scheduled': { border: '#F59E0B', bg: 'bg-[#FEF3C7]', text: 'text-[#D97706]' },
  'Visit done': { border: '#06B6D4', bg: 'bg-[#ECFEFF]', text: 'text-[#06B6D4]' },
  Negotiation: { border: '#059669', bg: 'bg-[#E8F7F1]', text: 'text-[#059669]' },
  'Won/Lost': { border: '#16A34A', bg: 'bg-[#DCFCE7]', text: 'text-[#15803D]' },
};

const STAGE_DISPLAY_NAMES: Record<LeadStage, string> = {
  New: 'New Lead',
  Contacted: 'Contacted',
  Qualified: 'Qualified',
  'Visit scheduled': 'Visit Scheduled',
  'Visit done': 'Visit Done',
  Negotiation: 'Negotiation',
  'Won/Lost': 'Won / Lost',
};

const KANBAN_LIMIT = 100; // Backend schema restricts query limit to max 100

export function LeadsPage() {
  const { toast } = useToast();
  const [viewMode, setViewMode] = useState<'kanban' | 'table'>('table');
  const [searchQuery, setSearchQuery] = useState('');
  const [stageFilter, setStageFilter] = useState<LeadStage | 'ALL'>('ALL');
  const [sourceFilter, setSourceFilter] = useState<LeadSource | 'ALL'>('ALL');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [kanbanPage, setKanbanPage] = useState(1);

  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [newNoteText, setNewNoteText] = useState('');
  const [noteType, setNoteType] = useState<'CALL_LOG' | 'AGENT_NOTE' | 'SITE_VISIT_BOOKED'>('CALL_LOG');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // New Lead Form State
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newProject, setNewProject] = useState('');
  const [newBudget, setNewBudget] = useState('');
  const [newStage, setNewStage] = useState<LeadStage>('New');
  const [newSource, setNewSource] = useState<LeadSource>('DIRECT');
  const [newNotes, setNewNotes] = useState('');
  const [leadErrors, setLeadErrors] = useState<{ name?: string; phone?: string; email?: string; budget?: string }>({});

  // Queries & Mutations
  const { data: leadsData, isLoading, isError, refetch } = useLeads({
    search: searchQuery.trim() || undefined,
    stage: stageFilter !== 'ALL' ? stageFilter : undefined,
    source: sourceFilter !== 'ALL' ? sourceFilter : undefined,
    page: viewMode === 'table' ? page : kanbanPage,
    limit: viewMode === 'table' ? pageSize : KANBAN_LIMIT,
  });
  const { data: selectedLeadDetail, isLoading: isLoadingDetail } = useLead(selectedLeadId);
  const createLeadMutation = useCreateLead();
  const updateLeadMutation = useUpdateLead();
  const addTimelineMutation = useAddTimelineEntry();

  const leads = leadsData?.leads || [];
  const stageCounts = leadsData?.stageCounts || {
    New: 0,
    Contacted: 0,
    Qualified: 0,
    'Visit scheduled': 0,
    'Visit done': 0,
    Negotiation: 0,
    'Won/Lost': 0,
  };

  // Total unfiltered leads across all stages in this organization
  const totalWorkspaceLeads = Object.values(stageCounts).reduce((sum, c) => sum + (c || 0), 0);
  const matchingLeadsCount = leadsData?.pagination?.total ?? leads.length;
  const totalTablePages = Math.max(1, Math.ceil(matchingLeadsCount / pageSize));
  const totalKanbanPages = Math.max(1, Math.ceil(matchingLeadsCount / KANBAN_LIMIT));

  // KPI Calculations derived from authentic unfiltered stageCounts
  const activePipelineCount =
    (stageCounts['New'] || 0) +
    (stageCounts['Contacted'] || 0) +
    (stageCounts['Qualified'] || 0) +
    (stageCounts['Negotiation'] || 0);
  const scheduledVisitsCount = stageCounts['Visit scheduled'] || 0;
  const closedOutcomesCount = stageCounts['Won/Lost'] || 0;
  const terminalClosureRate = totalWorkspaceLeads > 0 ? Math.round((closedOutcomesCount / totalWorkspaceLeads) * 100) : 0;

  const isFiltered = Boolean(searchQuery.trim() || stageFilter !== 'ALL' || sourceFilter !== 'ALL');

  const handleResetFilters = () => {
    setSearchQuery('');
    setStageFilter('ALL');
    setSourceFilter('ALL');
    setPage(1);
    setKanbanPage(1);
  };

  const handleStageChange = async (leadId: string, stage: LeadStage) => {
    try {
      await updateLeadMutation.mutateAsync({
        id: leadId,
        data: { stage },
      });
      toast({
        title: 'Lead Stage Advanced',
        message: `Pipeline status successfully updated to "${stage}"`,
        type: 'success',
      });
    } catch {
      toast({
        title: 'Update Failed',
        message: 'Could not change lead pipeline stage.',
        type: 'error',
      });
    }
  };

  const handleAddTimelineNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLeadId || !newNoteText.trim()) return;

    try {
      await addTimelineMutation.mutateAsync({
        leadId: selectedLeadId,
        entry: {
          type: noteType,
          summary: newNoteText.trim(),
        },
      });
      setNewNoteText('');
      toast({
        title: 'Timeline Activity Recorded',
        message: 'Interaction note logged to lead dossier.',
        type: 'success',
      });
    } catch {
      toast({
        title: 'Failed to Add Note',
        message: 'Could not append note to timeline.',
        type: 'error',
      });
    }
  };

  const validateLeadForm = () => {
    const errors: { name?: string; phone?: string; email?: string; budget?: string } = {};

    if (!newName.trim()) {
      errors.name = 'Full name is required';
    }

    const cleanPhone = newPhone.replace(/[\s-]/g, '');
    if (!cleanPhone) {
      errors.phone = 'Phone number is required';
    } else if (!/^\+?[0-9]{10,15}$/.test(cleanPhone)) {
      errors.phone = 'Enter valid 10-15 digit phone';
    }

    if (newEmail.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail.trim())) {
      errors.email = 'Enter a valid email address';
    }

    if (newBudget.trim()) {
      const budgetNum = Number(newBudget);
      if (isNaN(budgetNum) || budgetNum <= 0) {
        errors.budget = 'Budget must be a positive number';
      }
    }

    setLeadErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreateLead = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateLeadForm()) {
      return;
    }

    try {
      const budgetNum = newBudget.trim() ? Number(newBudget) : undefined;
      await createLeadMutation.mutateAsync({
        name: newName.trim(),
        phone: newPhone.trim(),
        email: newEmail.trim() || undefined,
        projectName: newProject.trim() || undefined,
        budget: budgetNum,
        stage: newStage,
        source: newSource,
        notes: newNotes.trim() || undefined,
      });

      toast({
        title: 'Lead Ingested',
        message: `${newName} has been added to the ${newStage} pipeline.`,
        type: 'success',
      });

      // Reset form
      setNewName('');
      setNewPhone('');
      setNewEmail('');
      setNewProject('');
      setNewBudget('');
      setNewStage('New');
      setNewSource('DIRECT');
      setNewNotes('');
      setLeadErrors({});
      setIsAddModalOpen(false);
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { error?: { message?: string } } } }).response?.data?.error?.message
          : 'Could not create lead.';
      toast({
        title: 'Ingestion Error',
        message: msg || 'Please verify form inputs.',
        type: 'error',
      });
    }
  };

  const activeLead: BackendLead | undefined =
    selectedLeadDetail?.lead || leads.find((l) => l._id === selectedLeadId);

  // Helper for initials
  const getInitials = (name?: string) => {
    if (!name) return 'L';
    return name
      .split(' ')
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  };

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          {/* Breadcrumbs */}
          <nav aria-label="Breadcrumbs" className="flex items-center gap-1.5 text-xs text-[#64748B] mb-1">
            <span>Dashboard</span>
            <span className="text-slate-300">/</span>
            <span>CRM</span>
            <span className="text-slate-300">/</span>
            <span className="font-semibold text-[#1F2937]">Leads &amp; Pipeline</span>
          </nav>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-[#1F2937]">
              Leads &amp; Pipeline
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#E8F7F1] text-[#10B981] border border-[#10B981]/20">
              {isFiltered
                ? `${matchingLeadsCount} of ${totalWorkspaceLeads} Leads`
                : `${totalWorkspaceLeads} Total Leads`}
            </span>
          </div>
          <p className="text-xs text-[#64748B] mt-0.5">
            Manage buyer inquiries, qualification stages, and walk-through appointments across all marketing channels.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Refresh / Sync Button */}
          <button
            type="button"
            onClick={() => refetch()}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[#EDF0F2] bg-white text-xs font-semibold text-[#1F2937] hover:bg-slate-50 shadow-xs transition-all active:scale-[0.98] cursor-pointer"
            title="Sync latest leads from all channels"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-[#10B981] ${isLoading ? 'animate-spin' : ''}`} />
            <span>Sync</span>
          </button>

          {/* View Switcher Segmented Control */}
          <div className="inline-flex rounded-xl bg-slate-100 p-0.5 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-white text-[#1F2937] shadow-xs'
                  : 'text-[#64748B] hover:text-[#1F2937]'
              }`}
            >
              <ListIcon className="w-3.5 h-3.5" />
              <span>Table</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('kanban')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'kanban'
                  ? 'bg-white text-[#1F2937] shadow-xs'
                  : 'text-[#64748B] hover:text-[#1F2937]'
              }`}
            >
              <Columns className="w-3.5 h-3.5" />
              <span>Kanban</span>
            </button>
          </div>

          {/* Primary Add Lead Button */}
          <button
            type="button"
            onClick={() => {
              setLeadErrors({});
              setIsAddModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#10B981] text-white text-xs font-semibold hover:bg-[#059669] shadow-xs active:scale-[0.98] transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Add Lead</span>
          </button>
        </div>
      </div>

      {/* 2. Top Minimal KPI Statistics Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Total Leads */}
        <div className="rounded-2xl bg-white border border-[#EDF0F2] p-5 shadow-[0_0_2px_0_rgba(145,158,171,0.2),0_12px_24px_-4px_rgba(145,158,171,0.12)] flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <p className="text-xs font-semibold tracking-wider uppercase text-[#64748B]">Total Inbound Leads</p>
            <div className="h-10 w-10 rounded-xl bg-[#E8F7F1] text-[#10B981] flex items-center justify-center shrink-0">
              <Users className="w-5 h-5 stroke-[2.2]" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-[28px] font-bold tracking-tight text-[#1F2937] tabular-nums leading-none">
              {totalWorkspaceLeads}
            </div>
            <p className="text-xs text-[#64748B] mt-2 pt-2 border-t border-[#EDF0F2]">
              {isFiltered
                ? `${matchingLeadsCount} matching filter criteria`
                : 'Across Meta, WhatsApp, and Web channels'}
            </p>
          </div>
        </div>

        {/* Metric 2: Active Pipeline */}
        <div className="rounded-2xl bg-white border border-[#EDF0F2] p-5 shadow-[0_0_2px_0_rgba(145,158,171,0.2),0_12px_24px_-4px_rgba(145,158,171,0.12)] flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <p className="text-xs font-semibold tracking-wider uppercase text-[#64748B]">Active Pipeline</p>
            <div className="h-10 w-10 rounded-xl bg-[#EFF6FF] text-[#3B82F6] flex items-center justify-center shrink-0">
              <UserCheck className="w-5 h-5 stroke-[2.2]" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-[28px] font-bold tracking-tight text-[#1F2937] tabular-nums leading-none">
              {activePipelineCount}
            </div>
            <p className="text-xs text-[#64748B] mt-2 pt-2 border-t border-[#EDF0F2]">
              New, Contacted, and Qualified inquiries
            </p>
          </div>
        </div>

        {/* Metric 3: Confirmed Visits */}
        <div className="rounded-2xl bg-white border border-[#EDF0F2] p-5 shadow-[0_0_2px_0_rgba(145,158,171,0.2),0_12px_24px_-4px_rgba(145,158,171,0.12)] flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <p className="text-xs font-semibold tracking-wider uppercase text-[#64748B]">Site Visits Scheduled</p>
            <div className="h-10 w-10 rounded-xl bg-[#FEF3C7] text-[#D97706] flex items-center justify-center shrink-0">
              <CalendarCheck className="w-5 h-5 stroke-[2.2]" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-[28px] font-bold tracking-tight text-[#1F2937] tabular-nums leading-none">
              {scheduledVisitsCount}
            </div>
            <p className="text-xs text-[#64748B] mt-2 pt-2 border-t border-[#EDF0F2]">
              Buyer walk-throughs in queue
            </p>
          </div>
        </div>

        {/* Metric 4: Win Conversion Rate (Unavailable / Combined Outcome State) */}
        <div className="rounded-2xl bg-white border border-[#EDF0F2] p-5 shadow-[0_0_2px_0_rgba(145,158,171,0.2),0_12px_24px_-4px_rgba(145,158,171,0.12)] flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold tracking-wider uppercase text-[#64748B]">Win Conversion Rate</p>
              <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 border border-amber-200/80 px-1.5 py-0.5 rounded-md mt-1 inline-block">
                Won/Lost Combined
              </span>
            </div>
            <div className="h-10 w-10 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center shrink-0">
              <Trophy className="w-5 h-5 stroke-[2.2]" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-[28px] font-bold tracking-tight text-[#1F2937] tabular-nums leading-none flex items-baseline gap-2">
              <span>N/A</span>
              <span className="text-xs font-normal text-[#64748B]">
                ({closedOutcomesCount} closed)
              </span>
            </div>
            <p className="text-xs text-[#64748B] mt-2 pt-2 border-t border-[#EDF0F2]" title="The backend CRM schema groups Won and Lost outcomes together into a single terminal stage ('Won/Lost'). Separate win-rate tracking is unavailable without schema differentiation.">
              {terminalClosureRate}% total closure rate &bull; Win rate N/A
            </p>
          </div>
        </div>
      </div>

      {/* 3. Filter & Search Bar */}
      <div className="rounded-2xl bg-white border border-[#EDF0F2] p-4 shadow-[0_0_2px_0_rgba(145,158,171,0.2),0_12px_24px_-4px_rgba(145,158,171,0.12)]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search leads by client name, phone, or project..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
                setKanbanPage(1);
              }}
              className="w-full h-10 text-xs pl-10 pr-9 rounded-xl border border-[#EDF0F2] bg-slate-50/50 text-[#1F2937] placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-[#10B981] focus:border-[#10B981] focus:bg-white transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setPage(1);
                  setKanbanPage(1);
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#1F2937] p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Dropdown Filters */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Stage Filter */}
            <div className="relative">
              <select
                value={stageFilter}
                onChange={(e) => {
                  setStageFilter(e.target.value as LeadStage | 'ALL');
                  setPage(1);
                  setKanbanPage(1);
                }}
                className="h-10 pl-3 pr-8 rounded-xl border border-[#EDF0F2] bg-white text-xs font-medium text-[#1F2937] focus:outline-none focus:ring-1 focus:ring-[#10B981] appearance-none cursor-pointer shadow-2xs"
              >
                <option value="ALL">All Deal Stages</option>
                {STAGES.map((s) => (
                  <option key={s} value={s}>
                    {STAGE_DISPLAY_NAMES[s] || s} ({stageCounts[s] || 0})
                  </option>
                ))}
              </select>
              <Filter className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>

            {/* Source Filter */}
            <div className="relative">
              <select
                value={sourceFilter}
                onChange={(e) => {
                  setSourceFilter(e.target.value as LeadSource | 'ALL');
                  setPage(1);
                  setKanbanPage(1);
                }}
                className="h-10 pl-3 pr-8 rounded-xl border border-[#EDF0F2] bg-white text-xs font-medium text-[#1F2937] focus:outline-none focus:ring-1 focus:ring-[#10B981] appearance-none cursor-pointer shadow-2xs"
              >
                <option value="ALL">All Acquisition Channels</option>
                <option value="DIRECT">Direct Inbound</option>
                <option value="META_AD">Meta Ad Form</option>
                <option value="WHATSAPP">WhatsApp Bot</option>
                <option value="PORTAL">Web Portal</option>
                <option value="MANUAL">Manual Walk-in</option>
              </select>
              <Filter className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>

            {/* Reset Filters Pill */}
            {isFiltered && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="inline-flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 transition-colors cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
                <span>Reset Filters</span>
              </button>
            )}

            {/* Results Match Count */}
            <span className="text-xs text-[#64748B] pl-2 tabular-nums">
              Showing <strong>{matchingLeadsCount}</strong> matching inquiry{matchingLeadsCount === 1 ? '' : 'ies'}
            </span>
          </div>
        </div>
      </div>

      {/* Loading & Error States */}
      {isLoading && (
        <div className="rounded-2xl bg-white border border-[#EDF0F2] p-12 text-center flex flex-col items-center justify-center space-y-3 shadow-xs">
          <div className="h-9 w-9 border-2 border-[#10B981] border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-semibold text-[#1F2937]">Synchronizing Inbound Leads...</p>
          <p className="text-xs text-[#64748B]">Querying verified buyer pipeline records</p>
        </div>
      )}

      {isError && !isLoading && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50/60 p-6 text-center text-rose-700 space-y-2">
          <p className="font-semibold text-sm">Failed to retrieve leads from CRM.</p>
          <p className="text-xs text-rose-600">Please verify connection or try again.</p>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            Retry Query
          </Button>
        </div>
      )}

      {/* 4. TABLE VIEW (Comfortable 56px rows, pastel status chips) */}
      {!isLoading && !isError && viewMode === 'table' && (
        <div className="rounded-2xl bg-white border border-[#EDF0F2] overflow-hidden shadow-[0_0_2px_0_rgba(145,158,171,0.2),0_12px_24px_-4px_rgba(145,158,171,0.12)]">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-[#EDF0F2] text-[11px] font-semibold text-[#64748B] uppercase tracking-wider sticky top-0 z-10">
                  <th className="px-5 py-3.5">Client Contact</th>
                  <th className="px-4 py-3.5">Inquired Project</th>
                  <th className="px-4 py-3.5">Budget Range</th>
                  <th className="px-4 py-3.5">Channel</th>
                  <th className="px-4 py-3.5">Stage</th>
                  <th className="px-4 py-3.5">Assigned Agent</th>
                  <th className="px-4 py-3.5">Captured</th>
                  <th className="px-5 py-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EDF0F2]">
                {leads.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-16 text-center">
                      <div className="max-w-xs mx-auto space-y-2">
                        <Users className="w-8 h-8 text-slate-300 mx-auto" />
                        <p className="text-sm font-semibold text-[#1F2937]">No Leads Found</p>
                        <p className="text-xs text-[#64748B]">
                          No buyer inquiries match your current search criteria or filter tags.
                        </p>
                        {isFiltered && (
                          <button
                            type="button"
                            onClick={handleResetFilters}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#10B981] text-white hover:bg-[#059669] shadow-xs transition-colors cursor-pointer mt-1"
                          >
                            Reset Filters
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  leads.map((lead) => {
                    return (
                      <tr
                        key={lead._id}
                        onClick={() => setSelectedLeadId(lead._id)}
                        className="hover:bg-slate-50/80 cursor-pointer h-14 transition-colors group"
                      >
                        {/* Client Contact */}
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-full bg-[#E8F7F1] text-[#10B981] font-bold text-xs flex items-center justify-center shrink-0 border border-[#10B981]/20">
                              {getInitials(lead.name)}
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold text-[#1F2937] group-hover:text-[#10B981] transition-colors truncate">
                                {lead.name}
                              </p>
                              <p className="text-[11px] text-[#64748B] flex items-center gap-1.5 tabular-nums mt-0.5">
                                <Phone className="w-2.5 h-2.5 text-slate-400" />
                                <span>{lead.phone}</span>
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Inquired Project */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className="font-medium text-[#1F2937] truncate max-w-[150px]">
                              {lead.projectName || 'General Inquiry'}
                            </span>
                          </div>
                        </td>

                        {/* Budget Range */}
                        <td className="px-4 py-3 font-semibold text-[#1F2937] tabular-nums whitespace-nowrap">
                          {lead.budgetDisplay || (lead.budget ? formatCurrency(lead.budget) : 'Open Budget')}
                        </td>

                        {/* Channel */}
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                            {lead.source?.replace(/_/g, ' ') || 'DIRECT'}
                          </span>
                        </td>

                        {/* Stage */}
                        <td className="px-4 py-3 whitespace-nowrap">
                          <StatusBadge status={lead.stage} />
                        </td>

                        {/* Assigned Agent */}
                        <td className="px-4 py-3 text-[#64748B] whitespace-nowrap">
                          <span className="inline-flex items-center gap-1.5">
                            <span className="h-2 w-2 rounded-full bg-slate-300" />
                            <span>{lead.assignedAgentName || 'Unassigned'}</span>
                          </span>
                        </td>

                        {/* Date */}
                        <td className="px-4 py-3 text-[#64748B] tabular-nums whitespace-nowrap">
                          {formatDisplayDate(lead.createdAt)}
                        </td>

                        {/* Action Pill */}
                        <td className="px-5 py-3 text-right whitespace-nowrap">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedLeadId(lead._id);
                            }}
                            className="inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-semibold text-[#1F2937] bg-slate-100 hover:bg-[#10B981] hover:text-white transition-all shadow-2xs"
                          >
                            <span>Dossier</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Table Pagination Toolbar */}
          {matchingLeadsCount > 0 && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-3.5 border-t border-[#EDF0F2] bg-white text-xs">
              <div className="flex flex-wrap items-center gap-4 text-[#64748B]">
                <span>
                  Showing{' '}
                  <strong className="text-[#1F2937]">
                    {(page - 1) * pageSize + 1}
                  </strong>{' '}
                  to{' '}
                  <strong className="text-[#1F2937]">
                    {Math.min(page * pageSize, matchingLeadsCount)}
                  </strong>{' '}
                  of <strong className="text-[#1F2937]">{matchingLeadsCount}</strong> records
                </span>

                <div className="flex items-center gap-2">
                  <label htmlFor="pageSizeSelect" className="text-xs text-[#64748B]">
                    Rows per page:
                  </label>
                  <select
                    id="pageSizeSelect"
                    value={pageSize}
                    onChange={(e) => {
                      setPageSize(Number(e.target.value));
                      setPage(1);
                    }}
                    className="h-8 px-2 rounded-lg border border-[#EDF0F2] bg-white text-xs font-semibold text-[#1F2937] focus:outline-none focus:ring-1 focus:ring-[#10B981] cursor-pointer"
                  >
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-1.5 self-end sm:self-auto">
                <span className="text-[#64748B] mr-2">
                  Page <strong className="text-[#1F2937]">{page}</strong> of{' '}
                  <strong className="text-[#1F2937]">{totalTablePages}</strong>
                </span>
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="p-1.5 rounded-lg border border-[#EDF0F2] text-[#1F2937] hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
                  title="Previous Page"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  disabled={page >= totalTablePages}
                  onClick={() => setPage((p) => Math.min(totalTablePages, p + 1))}
                  className="p-1.5 rounded-lg border border-[#EDF0F2] text-[#1F2937] hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
                  title="Next Page"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 5. KANBAN BOARD VIEW (7 Columns with pastel accents) */}
      {!isLoading && !isError && viewMode === 'kanban' && (
        <div className="space-y-3">
          {/* Kanban Scope & Batch Navigation Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-white rounded-2xl border border-[#EDF0F2] shadow-[0_0_2px_0_rgba(145,158,171,0.2),0_12px_24px_-4px_rgba(145,158,171,0.12)] text-xs">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-semibold text-[#1F2937]">
                Kanban Pipeline Scope:
              </span>
              <span className="text-[#64748B]">
                Displaying {leads.length} inquiries
                {totalKanbanPages > 1 ? ` (Batch ${kanbanPage} of ${totalKanbanPages}, up to 100 per board)` : ''}
              </span>
              {isFiltered && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                  Filters Active
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto">
              {totalKanbanPages > 1 && (
                <div className="flex items-center gap-1.5 mr-2">
                  <button
                    type="button"
                    disabled={kanbanPage <= 1}
                    onClick={() => setKanbanPage((p) => Math.max(1, p - 1))}
                    className="p-1.5 rounded-lg border border-[#EDF0F2] text-[#1F2937] hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
                    title="Previous 100 Leads"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-xs text-[#64748B]">
                    Batch <strong className="text-[#1F2937]">{kanbanPage}</strong> of{' '}
                    <strong className="text-[#1F2937]">{totalKanbanPages}</strong>
                  </span>
                  <button
                    type="button"
                    disabled={kanbanPage >= totalKanbanPages}
                    onClick={() => setKanbanPage((p) => Math.min(totalKanbanPages, p + 1))}
                    className="p-1.5 rounded-lg border border-[#EDF0F2] text-[#1F2937] hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
                    title="Next 100 Leads"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-[#EDF0F2] bg-slate-50 hover:bg-slate-100 text-[#1F2937] text-xs font-semibold transition-colors cursor-pointer"
              >
                <ListIcon className="w-3.5 h-3.5 text-slate-500" />
                <span>Switch to Table View</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto pb-4">
            <div className="flex gap-4 min-w-[1400px]">
              {STAGES.map((stage) => {
                const stageLeads = leads.filter((l) => l.stage === stage);
                const count = stageCounts[stage] ?? stageLeads.length;
                const accent = STAGE_ACCENT_COLORS[stage];

                return (
                  <div
                    key={stage}
                    className="flex-1 min-w-[230px] rounded-2xl bg-slate-50/80 border border-[#EDF0F2] flex flex-col overflow-hidden shadow-xs"
                  >
                    {/* Column Header */}
                    <div
                      className="p-3.5 bg-white border-b border-[#EDF0F2] flex items-center justify-between"
                      style={{ borderTop: `3px solid ${accent.border}` }}
                    >
                      <span className="text-xs font-bold text-[#1F2937] truncate pr-1">
                        {STAGE_DISPLAY_NAMES[stage] || stage}
                      </span>
                      <span
                        className={`text-xs tabular-nums px-2 py-0.5 rounded-full font-bold ${accent.bg} ${accent.text}`}
                        title={
                          isFiltered
                            ? `${stageLeads.length} leads matching current filters in this batch (${count} total in workspace)`
                            : count > stageLeads.length
                            ? `Showing ${stageLeads.length} of ${count} total leads in this stage (Batch ${kanbanPage})`
                            : `${count} total leads`
                        }
                      >
                        {isFiltered
                          ? `${stageLeads.length} / ${count}`
                          : count > stageLeads.length
                          ? `${stageLeads.length} of ${count}`
                          : count}
                      </span>
                    </div>

                    {/* Cards Feed */}
                    <div className="p-2.5 space-y-2.5 flex-1 min-h-[440px]">
                      {stageLeads.length === 0 ? (
                        <div className="h-32 flex flex-col items-center justify-center text-xs text-slate-400 border border-dashed border-[#EDF0F2] rounded-xl bg-white/50 p-2 text-center">
                          <span>No Leads in {STAGE_DISPLAY_NAMES[stage] || stage}</span>
                          {count > 0 && isFiltered && (
                            <span className="text-[10px] text-slate-400 mt-1">
                              ({count} in workspace, 0 matching filters)
                            </span>
                          )}
                        </div>
                      ) : (
                        stageLeads.map((lead) => (
                          <div
                            key={lead._id}
                            onClick={() => setSelectedLeadId(lead._id)}
                            className="p-3.5 bg-white rounded-xl border border-[#EDF0F2] hover:border-slate-300 hover:shadow-md transition-all cursor-pointer space-y-2.5 group"
                          >
                            {/* Card Top: Client Name & Source */}
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-center gap-2 min-w-0">
                                <div className="h-7 w-7 rounded-full bg-[#E8F7F1] text-[#10B981] font-bold text-[11px] flex items-center justify-center shrink-0">
                                  {getInitials(lead.name)}
                                </div>
                                <h4 className="text-xs font-bold text-[#1F2937] group-hover:text-[#10B981] transition-colors truncate">
                                  {lead.name}
                                </h4>
                              </div>
                              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-600 font-semibold shrink-0">
                                {lead.source}
                              </span>
                            </div>

                            {/* Card Body: Project & Budget */}
                            <div className="space-y-1 text-xs">
                              <div className="flex items-center gap-1 text-[#64748B] truncate">
                                <Building2 className="w-3 h-3 shrink-0 text-slate-400" />
                                <span className="truncate">{lead.projectName || 'General Inquiry'}</span>
                              </div>
                              <div className="font-bold text-[#1F2937] tabular-nums">
                                {lead.budgetDisplay || (lead.budget ? formatCurrency(lead.budget) : 'Open Budget')}
                              </div>
                            </div>

                            {/* Card Footer: Agent & Inspect */}
                            <div className="flex items-center justify-between pt-2 border-t border-[#EDF0F2] text-[11px] text-[#64748B]">
                              <span className="truncate max-w-[110px]">
                                {lead.assignedAgentName || 'Unassigned'}
                              </span>
                              <span className="font-semibold text-[#10B981] group-hover:translate-x-0.5 transition-transform inline-flex items-center gap-0.5">
                                <span>Inspect</span>
                                <ArrowRight className="w-3 h-3" />
                              </span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    {/* Column Footer: Table View Fallback */}
                    {count > 0 && (
                      <div className="p-2 border-t border-[#EDF0F2] bg-white/60 text-center">
                        <button
                          type="button"
                          onClick={() => {
                            setStageFilter(stage);
                            setViewMode('table');
                            setPage(1);
                          }}
                          className="text-[11px] font-semibold text-[#64748B] hover:text-[#10B981] transition-colors inline-flex items-center gap-1 cursor-pointer"
                          title={`Inspect all ${count} leads in ${STAGE_DISPLAY_NAMES[stage] || stage} via Table View`}
                        >
                          <span>View all {count} in Table</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 6. LEAD DETAIL DOSSIER MODAL */}
      <Modal open={Boolean(selectedLeadId)} onOpenChange={(open) => !open && setSelectedLeadId(null)}>
        {activeLead && (
          <ModalContent className="max-w-2xl rounded-2xl p-6 bg-white border border-[#EDF0F2] shadow-2xl">
            {/* Modal Header */}
            <ModalHeader className="border-b border-[#EDF0F2] pb-4">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2.5">
                    <div className="h-9 w-9 rounded-full bg-[#E8F7F1] text-[#10B981] font-bold text-sm flex items-center justify-center shrink-0">
                      {getInitials(activeLead.name)}
                    </div>
                    <div>
                      <ModalTitle className="text-lg font-bold text-[#1F2937]">{activeLead.name}</ModalTitle>
                      <ModalDescription className="text-xs text-[#64748B]">
                        {activeLead.projectName || 'General Inquiry'} &bull; Budget:{' '}
                        <strong className="text-[#1F2937]">
                          {activeLead.budgetDisplay || (activeLead.budget ? formatCurrency(activeLead.budget) : 'Open')}
                        </strong>
                      </ModalDescription>
                    </div>
                  </div>
                </div>
                <StatusBadge status={activeLead.stage} />
              </div>
            </ModalHeader>

            <div className="space-y-4 py-2 text-xs">
              {/* Contact Information Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3.5 rounded-xl border border-[#EDF0F2]">
                <div>
                  <span className="text-[11px] text-[#64748B] flex items-center gap-1 font-medium">
                    <Phone className="w-3 h-3 text-slate-400" />
                    <span>Phone</span>
                  </span>
                  <a
                    href={`tel:${activeLead.phone}`}
                    className="font-semibold text-[#1F2937] hover:text-[#10B981] tabular-nums mt-1 block transition-colors"
                  >
                    {activeLead.phone}
                  </a>
                </div>
                <div>
                  <span className="text-[11px] text-[#64748B] flex items-center gap-1 font-medium">
                    <Mail className="w-3 h-3 text-slate-400" />
                    <span>Email</span>
                  </span>
                  {activeLead.email ? (
                    <a
                      href={`mailto:${activeLead.email}`}
                      className="font-semibold text-[#1F2937] hover:text-[#10B981] truncate mt-1 block transition-colors"
                    >
                      {activeLead.email}
                    </a>
                  ) : (
                    <span className="text-slate-400 mt-1 block">—</span>
                  )}
                </div>
                <div>
                  <span className="text-[11px] text-[#64748B] block font-medium">Source</span>
                  <span className="font-semibold text-[#1F2937] mt-1 block">
                    {activeLead.source?.replace(/_/g, ' ') || 'DIRECT'}
                  </span>
                </div>
                <div>
                  <span className="text-[11px] text-[#64748B] block font-medium">Assigned Agent</span>
                  <span className="font-semibold text-[#1F2937] mt-1 block">
                    {activeLead.assignedAgentName || 'Unassigned'}
                  </span>
                </div>
              </div>

              {/* Consent & Compliance Banner */}
              <div className="p-3 bg-slate-50/70 rounded-xl border border-[#EDF0F2] flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-[#1F2937]">
                  <ShieldCheck className="w-4 h-4 text-[#10B981] shrink-0" />
                  <span>
                    Consent Status:{' '}
                    <strong className="text-[#1F2937]">
                      {activeLead.consentGiven ? 'Verified & Documented' : 'Pending Consent'}
                    </strong>{' '}
                    ({activeLead.consentSource || 'Direct'})
                  </span>
                </div>
                {activeLead.metaLeadId && (
                  <span className="text-[11px] text-[#64748B] tabular-nums bg-white px-2 py-0.5 rounded-md border border-[#EDF0F2]">
                    Meta ID: {activeLead.metaLeadId}
                  </span>
                )}
              </div>

              {/* Advance Deal Stage Interactive Control */}
              <div className="space-y-2 pt-2 border-t border-[#EDF0F2]">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-[#1F2937] flex items-center gap-1.5">
                    <TrendingUp className="w-3.5 h-3.5 text-[#10B981]" />
                    <span>Advance Pipeline Deal Stage</span>
                  </label>
                  <span className="text-[11px] text-[#64748B]">Click stage to advance</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {STAGES.map((stg) => {
                    const isCurrent = activeLead.stage === stg;
                    const accent = STAGE_ACCENT_COLORS[stg];
                    return (
                      <button
                        key={stg}
                        type="button"
                        disabled={updateLeadMutation.isPending}
                        onClick={() => handleStageChange(activeLead._id, stg)}
                        className={`px-3 py-1.5 text-xs rounded-xl font-semibold border transition-all cursor-pointer ${
                          isCurrent
                            ? `${accent.bg} ${accent.text} border-transparent shadow-xs ring-1 ring-offset-1 ring-[#10B981]`
                            : 'bg-white text-[#64748B] border-[#EDF0F2] hover:border-slate-300 hover:text-[#1F2937]'
                        }`}
                      >
                        {STAGE_DISPLAY_NAMES[stg] || stg}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Interaction Timeline Events Feed */}
              <div className="space-y-3 pt-3 border-t border-[#EDF0F2]">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-[#1F2937] flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-[#10B981]" />
                    <span>
                      Interaction Timeline ({selectedLeadDetail?.timeline?.length ?? 0} events)
                    </span>
                  </h4>
                </div>

                {isLoadingDetail && (
                  <div className="py-6 text-center text-xs text-[#64748B]">
                    Loading timeline events...
                  </div>
                )}

                <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                  {selectedLeadDetail?.timeline && selectedLeadDetail.timeline.length > 0 ? (
                    selectedLeadDetail.timeline.map((event) => {
                      const isCall = event.type === 'CALL_LOG';
                      const isVisit = event.type === 'SITE_VISIT_BOOKED';
                      const isWhatsapp = event.type === 'WHATSAPP_MESSAGE';

                      const EventIcon = isCall
                        ? PhoneCall
                        : isVisit
                        ? Calendar
                        : isWhatsapp
                        ? MessageCircle
                        : FileText;

                      return (
                        <div
                          key={event._id || event.id}
                          className="border border-[#EDF0F2] bg-white rounded-xl p-3 space-y-1 shadow-2xs flex items-start gap-3"
                        >
                          <div
                            className={`p-2 rounded-lg shrink-0 ${
                              isCall
                                ? 'bg-blue-50 text-blue-600'
                                : isVisit
                                ? 'bg-amber-50 text-amber-600'
                                : isWhatsapp
                                ? 'bg-emerald-50 text-emerald-600'
                                : 'bg-purple-50 text-purple-600'
                            }`}
                          >
                            <EventIcon className="w-3.5 h-3.5" />
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between text-[11px]">
                              <span className="font-bold text-[#1F2937] uppercase tracking-wide">
                                {event.type.replace(/_/g, ' ')} &bull; {event.authorName}
                              </span>
                              <span className="text-[#64748B] tabular-nums">
                                {new Date(event.createdAt).toLocaleDateString('en-IN', {
                                  day: '2-digit',
                                  month: 'short',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                            </div>
                            <p className="text-xs text-[#1F2937] mt-1 leading-relaxed">{event.summary}</p>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="p-4 text-center text-xs text-[#64748B] border border-dashed border-[#EDF0F2] rounded-xl">
                      No interaction logs recorded yet. Add the first call note below.
                    </div>
                  )}
                </div>

                {/* Add Timeline Note Form */}
                <form onSubmit={handleAddTimelineNote} className="flex flex-col sm:flex-row gap-2 pt-2">
                  <select
                    value={noteType}
                    onChange={(e) => setNoteType(e.target.value as 'CALL_LOG' | 'AGENT_NOTE' | 'SITE_VISIT_BOOKED')}
                    className="h-10 px-3 text-xs rounded-xl border border-[#EDF0F2] bg-white text-[#1F2937] font-medium focus:outline-none focus:ring-1 focus:ring-[#10B981]"
                  >
                    <option value="CALL_LOG">Call Log</option>
                    <option value="AGENT_NOTE">Agent Note</option>
                    <option value="SITE_VISIT_BOOKED">Site Visit Walk-Through</option>
                  </select>
                  <input
                    type="text"
                    placeholder="Log call summary, client feedback, or walkthrough note..."
                    value={newNoteText}
                    onChange={(e) => setNewNoteText(e.target.value)}
                    className="flex-1 h-10 px-3 text-xs rounded-xl border border-[#EDF0F2] bg-white text-[#1F2937] placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-[#10B981]"
                  />
                  <button
                    type="submit"
                    disabled={!newNoteText.trim() || addTimelineMutation.isPending}
                    className="px-4 py-2 rounded-xl bg-[#10B981] text-white text-xs font-semibold hover:bg-[#059669] shadow-xs active:scale-[0.98] transition-all disabled:opacity-50 cursor-pointer"
                  >
                    {addTimelineMutation.isPending ? 'Logging...' : 'Log Activity'}
                  </button>
                </form>
              </div>
            </div>
          </ModalContent>
        )}
      </Modal>

      {/* 7. CREATE INBOUND LEAD MODAL */}
      <Modal open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <ModalContent className="max-w-lg rounded-2xl p-6 bg-white border border-[#EDF0F2] shadow-2xl">
          <ModalHeader className="border-b border-[#EDF0F2] pb-4">
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-xl bg-[#E8F7F1] text-[#10B981] flex items-center justify-center shrink-0">
                <Plus className="w-5 h-5 stroke-[2.5]" />
              </div>
              <div>
                <ModalTitle className="text-base font-bold text-[#1F2937]">Ingest Inbound Lead</ModalTitle>
                <ModalDescription className="text-xs text-[#64748B]">
                  Record a buyer inquiry or manual client contact into the workspace CRM.
                </ModalDescription>
              </div>
            </div>
          </ModalHeader>

          <form onSubmit={handleCreateLead} className="space-y-4 py-3 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-[#1F2937] block mb-1">
                  Client Full Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Rahul Sharma"
                  value={newName}
                  onChange={(e) => {
                    setNewName(e.target.value);
                    if (leadErrors.name) setLeadErrors((prev) => ({ ...prev, name: undefined }));
                  }}
                  className={cn(
                    'w-full h-10 px-3 text-xs rounded-xl border bg-white text-[#1F2937] placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-[#10B981] transition-all',
                    leadErrors.name ? 'border-rose-500 ring-1 ring-rose-500' : 'border-[#EDF0F2]'
                  )}
                />
                {leadErrors.name && (
                  <p className="text-[11px] text-rose-600 mt-1">✕ {leadErrors.name}</p>
                )}
              </div>

              <div>
                <label className="text-xs font-semibold text-[#1F2937] block mb-1">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  placeholder="+91 98000 00000"
                  value={newPhone}
                  onChange={(e) => {
                    setNewPhone(e.target.value);
                    if (leadErrors.phone) setLeadErrors((prev) => ({ ...prev, phone: undefined }));
                  }}
                  className={cn(
                    'w-full h-10 px-3 text-xs rounded-xl border bg-white text-[#1F2937] placeholder:text-slate-400 tabular-nums focus:outline-none focus:ring-1 focus:ring-[#10B981] transition-all',
                    leadErrors.phone ? 'border-rose-500 ring-1 ring-rose-500' : 'border-[#EDF0F2]'
                  )}
                />
                {leadErrors.phone && (
                  <p className="text-[11px] text-rose-600 mt-1">✕ {leadErrors.phone}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-[#1F2937] block mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  placeholder="client@domain.com"
                  value={newEmail}
                  onChange={(e) => {
                    setNewEmail(e.target.value);
                    if (leadErrors.email) setLeadErrors((prev) => ({ ...prev, email: undefined }));
                  }}
                  className={cn(
                    'w-full h-10 px-3 text-xs rounded-xl border bg-white text-[#1F2937] placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-[#10B981] transition-all',
                    leadErrors.email ? 'border-rose-500 ring-1 ring-rose-500' : 'border-[#EDF0F2]'
                  )}
                />
                {leadErrors.email && (
                  <p className="text-[11px] text-rose-600 mt-1">✕ {leadErrors.email}</p>
                )}
              </div>

              <div>
                <label className="text-xs font-semibold text-[#1F2937] block mb-1">
                  Inquired Project / Development
                </label>
                <input
                  type="text"
                  placeholder="e.g. The Grand Crest"
                  value={newProject}
                  onChange={(e) => setNewProject(e.target.value)}
                  className="w-full h-10 px-3 text-xs rounded-xl border border-[#EDF0F2] bg-white text-[#1F2937] placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-[#10B981]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-semibold text-[#1F2937] block mb-1">
                  Budget (INR)
                </label>
                <input
                  type="number"
                  placeholder="25000000"
                  value={newBudget}
                  onChange={(e) => {
                    setNewBudget(e.target.value);
                    if (leadErrors.budget) setLeadErrors((prev) => ({ ...prev, budget: undefined }));
                  }}
                  className={cn(
                    'w-full h-10 px-3 text-xs rounded-xl border bg-white text-[#1F2937] placeholder:text-slate-400 tabular-nums focus:outline-none focus:ring-1 focus:ring-[#10B981] transition-all',
                    leadErrors.budget ? 'border-rose-500 ring-1 ring-rose-500' : 'border-[#EDF0F2]'
                  )}
                />
                {leadErrors.budget && (
                  <p className="text-[11px] text-rose-600 mt-1">✕ {leadErrors.budget}</p>
                )}
              </div>

              <div>
                <label className="text-xs font-semibold text-[#1F2937] block mb-1">
                  Initial Stage
                </label>
                <select
                  value={newStage}
                  onChange={(e) => setNewStage(e.target.value as LeadStage)}
                  className="w-full h-10 px-3 text-xs rounded-xl border border-[#EDF0F2] bg-white text-[#1F2937] font-medium focus:outline-none focus:ring-1 focus:ring-[#10B981]"
                >
                  {STAGES.map((s) => (
                    <option key={s} value={s}>
                      {STAGE_DISPLAY_NAMES[s] || s}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-[#1F2937] block mb-1">
                  Acquisition Source
                </label>
                <select
                  value={newSource}
                  onChange={(e) => setNewSource(e.target.value as LeadSource)}
                  className="w-full h-10 px-3 text-xs rounded-xl border border-[#EDF0F2] bg-white text-[#1F2937] font-medium focus:outline-none focus:ring-1 focus:ring-[#10B981]"
                >
                  <option value="DIRECT">Direct Inbound</option>
                  <option value="META_AD">Meta Ad Form</option>
                  <option value="WHATSAPP">WhatsApp Bot</option>
                  <option value="PORTAL">Web Portal</option>
                  <option value="MANUAL">Manual Walk-in</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-[#1F2937] block mb-1">
                Client Requirements / Notes
              </label>
              <textarea
                rows={3}
                placeholder="Preferred 3BHK configuration, high floor, possession timeline, site visit preference..."
                value={newNotes}
                onChange={(e) => setNewNotes(e.target.value)}
                className="w-full p-3 text-xs rounded-xl border border-[#EDF0F2] bg-white text-[#1F2937] placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-[#10B981]"
              />
            </div>

            <div className="flex justify-end gap-2.5 pt-4 border-t border-[#EDF0F2]">
              <button
                type="button"
                onClick={() => {
                  setLeadErrors({});
                  setIsAddModalOpen(false);
                }}
                className="px-4 py-2 rounded-xl border border-[#EDF0F2] bg-white text-xs font-semibold text-[#1F2937] hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={createLeadMutation.isPending}
                className="px-5 py-2 rounded-xl bg-[#10B981] text-white text-xs font-semibold hover:bg-[#059669] shadow-xs active:scale-[0.98] transition-all disabled:opacity-50 cursor-pointer"
              >
                {createLeadMutation.isPending ? 'Ingesting Lead...' : 'Create Lead'}
              </button>
            </div>
          </form>
        </ModalContent>
      </Modal>
    </div>
  );
}
