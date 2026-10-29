import { useState } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { PageHeader } from '../components/ui/PageHeader';
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
  Loader2,
  RefreshCw,
  Phone,
  Mail,
  ShieldCheck,
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

export function LeadsPage() {
  const { toast } = useToast();
  const [viewMode, setViewMode] = useState<'table' | 'kanban'>('kanban');
  const [searchQuery, setSearchQuery] = useState('');
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

  return (
    <div className="space-y-6">
      {/* 1. Page Header */}
      <PageHeader
        title="Leads &amp; Pipeline"
        description="Inbound buyer inquiries, qualification stages, and sales pipeline records."
        actions={
          <div className="flex items-center space-x-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />}
            >
              Sync
            </Button>

            {/* View Switcher Segmented Control */}
            <div className="inline-flex items-center p-0.5 rounded-lg bg-neutral-100 border border-border">
              <button
                type="button"
                onClick={() => setViewMode('kanban')}
                className={`px-3 py-1 text-meta rounded-md transition-all flex items-center space-x-1 ${
                  viewMode === 'kanban'
                    ? 'bg-surface text-text-primary shadow-xs font-medium'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                <Columns className="w-3.5 h-3.5" />
                <span>Kanban</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`px-3 py-1 text-meta rounded-md transition-all flex items-center space-x-1 ${
                  viewMode === 'table'
                    ? 'bg-surface text-text-primary shadow-xs font-medium'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                <ListIcon className="w-3.5 h-3.5" />
                <span>Table</span>
              </button>
            </div>

            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={() => {
                setLeadErrors({});
                setIsAddModalOpen(true);
              }}
              leftIcon={<Plus className="w-3.5 h-3.5" />}
            >
              Add Lead
            </Button>
          </div>
        }
      />

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-surface p-3 rounded-card border border-border">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            placeholder="Search leads by name, phone, or project..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-10 text-sm pl-9 pr-3 rounded-[8px] border border-border bg-surface text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1 transition-all"
          />
        </div>

        <div className="flex items-center space-x-2 text-meta text-text-secondary tabular-nums">
          <span>{leads.length} Total Inquiries</span>
          <span>&bull;</span>
          <span>7 Pipeline Stages</span>
        </div>
      </div>

      {/* Loading & Error States */}
      {isLoading && (
        <div className="py-20 text-center flex flex-col items-center justify-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-text-muted" />
          <span className="text-sm text-text-secondary">Loading Inbound Leads...</span>
        </div>
      )}

      {isError && !isLoading && (
        <div className="p-6 text-center border border-border bg-status-danger-bg rounded-card text-status-danger space-y-2">
          <p className="font-semibold text-sm">Failed to retrieve leads from CRM.</p>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            Retry
          </Button>
        </div>
      )}

      {/* KANBAN BOARD VIEW */}
      {!isLoading && !isError && viewMode === 'kanban' && (
        <div className="overflow-x-auto pb-4">
          <div className="flex gap-4 min-w-[1340px]">
            {STAGES.map((stage) => {
              const stageLeads = leads.filter((l) => l.stage === stage);
              const count = stageCounts[stage] ?? stageLeads.length;

              return (
                <div
                  key={stage}
                  className="flex-1 min-w-[220px] bg-neutral-100 rounded-card border border-border flex flex-col overflow-hidden"
                >
                  {/* Column Header */}
                  <div className="p-3 border-b border-border bg-white flex items-center justify-between">
                    <span className="text-meta font-semibold uppercase tracking-wider text-text-primary">
                      {stage}
                    </span>
                    <span className="text-meta tabular-nums px-1.5 py-0.5 rounded-[4px] bg-neutral-100 text-text-secondary font-medium">
                      {count}
                    </span>
                  </div>

                  {/* Cards List */}
                  <div className="p-2 space-y-2 flex-1 min-h-[380px]">
                    {stageLeads.length === 0 ? (
                      <div className="h-28 flex items-center justify-center text-meta text-text-muted border border-dashed border-border rounded-[8px]">
                        No Leads
                      </div>
                    ) : (
                      stageLeads.map((lead) => (
                        <div
                          key={lead._id}
                          onClick={() => setSelectedLeadId(lead._id)}
                          className="p-3.5 bg-white rounded-[8px] border border-border hover:border-neutral-400 cursor-pointer shadow-card space-y-2 transition-all group"
                        >
                          <div className="flex items-start justify-between">
                            <h4 className="text-sm font-medium text-text-primary group-hover:underline">
                              {lead.name}
                            </h4>
                            <span className="text-[11px] px-1.5 py-0.5 rounded-[4px] bg-neutral-100 text-text-muted uppercase">
                              {lead.source}
                            </span>
                          </div>

                          <div className="text-meta text-text-secondary space-y-0.5">
                            <div className="truncate font-medium text-text-primary">
                              {lead.projectName || 'General Inquiry'}
                            </div>
                            <div className="font-semibold text-text-primary tabular-nums">
                              {lead.budgetDisplay || (lead.budget ? `₹ ${lead.budget.toLocaleString('en-IN')}` : 'Budget Open')}
                            </div>
                          </div>

                          <div className="flex items-center justify-between pt-1.5 border-t border-border text-meta text-text-muted">
                            <span>{lead.assignedAgentName || 'Unassigned'}</span>
                            <span className="text-text-primary font-medium">Inspect &rarr;</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TABLE VIEW (Comfortable 48px rows, sticky header) */}
      {!isLoading && !isError && viewMode === 'table' && (
        <Card className="p-0 overflow-hidden">
          <div className="overflow-x-auto bg-surface">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="bg-neutral-100 border-b border-border text-meta font-medium text-text-secondary sticky top-0">
                  <th className="px-4 py-3">Client Contact</th>
                  <th className="px-4 py-3">Inquired Development</th>
                  <th className="px-4 py-3">Budget Range</th>
                  <th className="px-4 py-3">Source Channel</th>
                  <th className="px-4 py-3">Stage</th>
                  <th className="px-4 py-3">Assigned Sales Agent</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {leads.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-10 text-center text-meta text-text-muted">
                      No leads recorded matching search criteria.
                    </td>
                  </tr>
                ) : (
                  leads.map((lead) => (
                    <tr
                      key={lead._id}
                      onClick={() => setSelectedLeadId(lead._id)}
                      className="hover:bg-surface-hover cursor-pointer h-12 transition-colors"
                    >
                      <td className="px-4 py-2.5">
                        <div className="font-medium text-text-primary">{lead.name}</div>
                        <div className="text-meta text-text-muted tabular-nums">{lead.phone}</div>
                      </td>
                      <td className="px-4 py-2.5 font-medium text-text-primary">
                        {lead.projectName || 'General Inquiry'}
                      </td>
                      <td className="px-4 py-2.5 font-semibold text-text-primary tabular-nums">
                        {lead.budgetDisplay || (lead.budget ? `₹ ${lead.budget.toLocaleString('en-IN')}` : 'Open')}
                      </td>
                      <td className="px-4 py-2.5">
                        <span className="text-[11px] px-2 py-0.5 rounded-[4px] bg-neutral-100 text-text-secondary">
                          {lead.source}
                        </span>
                      </td>
                      <td className="px-4 py-2.5">
                        <StatusBadge status={lead.stage} />
                      </td>
                      <td className="px-4 py-2.5 text-meta text-text-secondary">
                        {lead.assignedAgentName || 'Unassigned'}
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedLeadId(lead._id);
                          }}
                          className="text-meta text-text-secondary hover:text-text-primary underline underline-offset-2"
                        >
                          View Dossier
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* LEAD DETAIL WITH TIMELINE MODAL */}
      <Modal open={Boolean(selectedLeadId)} onOpenChange={(open) => !open && setSelectedLeadId(null)}>
        {activeLead && (
          <ModalContent className="max-w-2xl">
            <ModalHeader className="border-b border-border pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <ModalTitle>{activeLead.name}</ModalTitle>
                  <ModalDescription>
                    {activeLead.projectName || 'General Inquiry'} &bull; Budget: {activeLead.budgetDisplay || (activeLead.budget ? `₹ ${activeLead.budget.toLocaleString('en-IN')}` : 'Open')}
                  </ModalDescription>
                </div>
                <StatusBadge status={activeLead.stage} />
              </div>
            </ModalHeader>

            <div className="space-y-4 py-3 text-sm">
              {/* Contact & Stage Controls */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-surface-hover p-3 rounded-card border border-border">
                <div>
                  <span className="text-meta text-text-muted flex items-center space-x-1">
                    <Phone className="w-3 h-3" />
                    <span>Phone</span>
                  </span>
                  <span className="font-medium text-text-primary tabular-nums mt-0.5 block">{activeLead.phone}</span>
                </div>
                <div>
                  <span className="text-meta text-text-muted flex items-center space-x-1">
                    <Mail className="w-3 h-3" />
                    <span>Email</span>
                  </span>
                  <span className="font-medium text-text-primary truncate block mt-0.5">{activeLead.email || '—'}</span>
                </div>
                <div>
                  <span className="text-meta text-text-muted block">Source</span>
                  <span className="font-medium text-text-primary mt-0.5 block">{activeLead.source}</span>
                </div>
                <div>
                  <span className="text-meta text-text-muted block">Assigned</span>
                  <span className="font-medium text-text-primary mt-0.5 block">{activeLead.assignedAgentName || 'Unassigned'}</span>
                </div>
              </div>

              {/* Consent & Compliance Banner */}
              <div className="p-3 bg-neutral-100 rounded-card border border-border flex items-center justify-between text-meta">
                <div className="flex items-center space-x-2 text-text-secondary">
                  <ShieldCheck className="w-4 h-4 text-text-primary" />
                  <span>
                    Consent: <strong className="text-text-primary">{activeLead.consentGiven ? 'Verified' : 'Pending'}</strong> ({activeLead.consentSource || 'Direct'})
                  </span>
                </div>
                {activeLead.metaLeadId && (
                  <span className="text-meta text-text-muted tabular-nums">
                    Meta ID: {activeLead.metaLeadId}
                  </span>
                )}
              </div>

              {/* Stage Transition Controls */}
              <div className="space-y-2 border-t border-border pt-3">
                <label className="text-meta font-medium text-text-secondary block">
                  Advance Deal Stage
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {STAGES.map((stg) => (
                    <button
                      key={stg}
                      type="button"
                      disabled={updateLeadMutation.isPending}
                      onClick={() => handleStageChange(activeLead._id, stg)}
                      className={`px-3 py-1 text-meta rounded-[6px] border transition-all ${
                        activeLead.stage === stg
                          ? 'bg-primary text-white font-medium border-primary'
                          : 'bg-white text-text-secondary border-border hover:border-neutral-400'
                      }`}
                    >
                      {stg}
                    </button>
                  ))}
                </div>
              </div>

              {/* Timeline Events Feed */}
              <div className="space-y-3 border-t border-border pt-3">
                <h4 className="text-section font-semibold text-text-primary flex items-center space-x-1.5">
                  <Clock className="w-4 h-4 text-text-secondary" />
                  <span>
                    Interaction Timeline ({selectedLeadDetail?.timeline?.length ?? 0})
                  </span>
                </h4>

                {isLoadingDetail && (
                  <div className="py-6 text-center text-meta text-text-muted">
                    Loading timeline activities...
                  </div>
                )}

                <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                  {selectedLeadDetail?.timeline && selectedLeadDetail.timeline.length > 0 ? (
                    selectedLeadDetail.timeline.map((event) => (
                      <div
                        key={event._id || event.id}
                        className="border border-border bg-white rounded-card p-3 space-y-1"
                      >
                        <div className="flex items-center justify-between text-meta">
                          <span className="font-semibold text-text-primary uppercase tracking-wide text-[11px]">{event.type} &bull; {event.authorName}</span>
                          <span className="text-text-muted tabular-nums">
                            {new Date(event.createdAt).toLocaleDateString('en-IN', {
                              day: '2-digit',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                        <p className="text-text-secondary text-sm">{event.summary}</p>
                      </div>
                    ))
                  ) : (
                    <div className="p-4 text-center text-meta text-text-muted border border-border rounded-card">
                      No timeline events logged yet.
                    </div>
                  )}
                </div>

                {/* Add Timeline Note Form */}
                <form onSubmit={handleAddTimelineNote} className="flex flex-col sm:flex-row gap-2 pt-2">
                  <select
                    value={noteType}
                    onChange={(e) => setNoteType(e.target.value as 'CALL_LOG' | 'AGENT_NOTE' | 'SITE_VISIT_BOOKED')}
                    className="h-10 px-3 text-sm rounded-[8px] border border-border bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1"
                  >
                    <option value="CALL_LOG">Call Log</option>
                    <option value="AGENT_NOTE">Note</option>
                    <option value="SITE_VISIT_BOOKED">Site Visit</option>
                  </select>
                  <input
                    type="text"
                    placeholder="Log call summary, client feedback, or walkthrough note..."
                    value={newNoteText}
                    onChange={(e) => setNewNoteText(e.target.value)}
                    className="flex-1 h-10 px-3 text-sm rounded-[8px] border border-border bg-surface text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1"
                  />
                  <Button
                    type="submit"
                    variant="outline"
                    size="md"
                    disabled={!newNoteText.trim() || addTimelineMutation.isPending}
                  >
                    {addTimelineMutation.isPending ? 'Logging...' : 'Add Note'}
                  </Button>
                </form>
              </div>
            </div>
          </ModalContent>
        )}
      </Modal>

      {/* CREATE LEAD MODAL */}
      <Modal open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <ModalContent className="max-w-lg">
          <ModalHeader className="border-b border-border pb-3">
            <ModalTitle>Add Inbound Lead</ModalTitle>
            <ModalDescription>
              Record a new buyer inquiry or manual client contact into the tenant pipeline.
            </ModalDescription>
          </ModalHeader>

          <form onSubmit={handleCreateLead} className="space-y-4 py-3 text-sm">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-meta font-medium text-text-secondary block mb-1">
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
                    'w-full h-10 px-3 text-sm rounded-[8px] border bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1 transition-all',
                    leadErrors.name
                      ? 'border-status-danger ring-1 ring-status-danger'
                      : 'border-border'
                  )}
                />
                {leadErrors.name && (
                  <p className="text-meta text-status-danger mt-1">✕ {leadErrors.name}</p>
                )}
              </div>

              <div>
                <label className="text-meta font-medium text-text-secondary block mb-1">
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
                    'w-full h-10 px-3 text-sm rounded-[8px] border bg-surface text-text-primary tabular-nums focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1 transition-all',
                    leadErrors.phone
                      ? 'border-status-danger ring-1 ring-status-danger'
                      : 'border-border'
                  )}
                />
                {leadErrors.phone && (
                  <p className="text-meta text-status-danger mt-1">✕ {leadErrors.phone}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-meta font-medium text-text-secondary block mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  placeholder="client@company.com"
                  value={newEmail}
                  onChange={(e) => {
                    setNewEmail(e.target.value);
                    if (leadErrors.email) setLeadErrors((prev) => ({ ...prev, email: undefined }));
                  }}
                  className={cn(
                    'w-full h-10 px-3 text-sm rounded-[8px] border bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1 transition-all',
                    leadErrors.email
                      ? 'border-status-danger ring-1 ring-status-danger'
                      : 'border-border'
                  )}
                />
                {leadErrors.email && (
                  <p className="text-meta text-status-danger mt-1">✕ {leadErrors.email}</p>
                )}
              </div>

              <div>
                <label className="text-meta font-medium text-text-secondary block mb-1">
                  Inquired Project / Development
                </label>
                <input
                  type="text"
                  placeholder="e.g. The Grand Crest"
                  value={newProject}
                  onChange={(e) => setNewProject(e.target.value)}
                  className="w-full h-10 px-3 text-sm rounded-[8px] border border-border bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-meta font-medium text-text-secondary block mb-1">
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
                    'w-full h-10 px-3 text-sm rounded-[8px] border bg-surface text-text-primary tabular-nums focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1 transition-all',
                    leadErrors.budget
                      ? 'border-status-danger ring-1 ring-status-danger'
                      : 'border-border'
                  )}
                />
                {leadErrors.budget && (
                  <p className="text-meta text-status-danger mt-1">✕ {leadErrors.budget}</p>
                )}
              </div>

              <div>
                <label className="text-meta font-medium text-text-secondary block mb-1">
                  Initial Stage
                </label>
                <select
                  value={newStage}
                  onChange={(e) => setNewStage(e.target.value as LeadStage)}
                  className="w-full h-10 px-3 text-sm rounded-[8px] border border-border bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1"
                >
                  {STAGES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-meta font-medium text-text-secondary block mb-1">
                  Source
                </label>
                <select
                  value={newSource}
                  onChange={(e) => setNewSource(e.target.value as LeadSource)}
                  className="w-full h-10 px-3 text-sm rounded-[8px] border border-border bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1"
                >
                  <option value="DIRECT">Direct Inbound</option>
                  <option value="META_AD">Meta Ad Form</option>
                  <option value="WHATSAPP">WhatsApp</option>
                  <option value="PORTAL">Web Portal</option>
                  <option value="MANUAL">Manual Walk-in</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-meta font-medium text-text-secondary block mb-1">
                Client Requirements / Notes
              </label>
              <textarea
                rows={2}
                placeholder="Preferred configuration, floor preference, possession timeline..."
                value={newNotes}
                onChange={(e) => setNewNotes(e.target.value)}
                className="w-full p-3 text-sm rounded-[8px] border border-border bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1"
              />
            </div>

            <div className="flex justify-end space-x-2 pt-3 border-t border-border">
              <Button
                type="button"
                variant="outline"
                size="md"
                onClick={() => {
                  setLeadErrors({});
                  setIsAddModalOpen(false);
                }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="md"
                disabled={createLeadMutation.isPending}
              >
                {createLeadMutation.isPending ? 'Saving...' : 'Create Lead'}
              </Button>
            </div>
          </form>
        </ModalContent>
      </Modal>
    </div>
  );
}
