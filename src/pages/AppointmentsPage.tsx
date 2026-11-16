import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { StatusBadge } from '../components/ui/StatusBadge';
import { EmptyState } from '../components/ui/EmptyState';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalDescription,
  ModalFooter,
} from '../components/ui/Modal';
import { useToast } from '../components/ui/Toast';
import { formatDisplayDate } from '../lib/formatters';
import {
  useAppointments,
  useAvailability,
  useCreateAppointment,
  useSubmitFeedback,
  useUpdateAppointment,
  BackendAppointment,
  AppointmentStatus,
} from '../hooks/useAppointments';
import { useProjects } from '../hooks/useProjects';
import { useLeads } from '../hooks/useLeads';
import {
  Calendar,
  Clock,
  Ticket,
  Plus,
  Search,
  Star,
  RefreshCw,
  Check,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Building2,
  User,
  Phone,
  RotateCcw,
  FileText,
  CalendarCheck,
  CalendarClock,
  MessageSquare,
  Users,
} from 'lucide-react';

export function AppointmentsPage() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<AppointmentStatus | 'ALL'>('ALL');
  const [projectFilter, setProjectFilter] = useState('ALL');
  const [dateFilter, setDateFilter] = useState('');

  // Modals state
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [selectedForFeedback, setSelectedForFeedback] = useState<BackendAppointment | null>(null);
  const [viewingFeedback, setViewingFeedback] = useState<BackendAppointment | null>(null);
  const [cancellingItem, setCancellingItem] = useState<BackendAppointment | null>(null);

  // Form State for Booking
  const [selectedLeadId, setSelectedLeadId] = useState('');
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [projectName, setProjectName] = useState('');
  const [appointmentDate, setAppointmentDate] = useState(() => {
    const tomorrow = new Date(Date.now() + 86400000);
    return tomorrow.toISOString().split('T')[0];
  });
  const [selectedSlot, setSelectedSlot] = useState('');
  const [assignedAgentName, setAssignedAgentName] = useState('');
  const [notes, setNotes] = useState('');

  // Form State for Feedback
  const [rating, setRating] = useState<number>(5);
  const [interestLevel, setInterestLevel] = useState<'HIGH' | 'MEDIUM' | 'LOW'>('HIGH');
  const [feedbackNotes, setFeedbackNotes] = useState('');
  const [nextAction, setNextAction] = useState('');
  const [nextActionDate, setNextActionDate] = useState(() => {
    const followUp = new Date(Date.now() + 2 * 86400000);
    return followUp.toISOString().split('T')[0];
  });

  // Queries & Mutations
  const { data: appData, isLoading, isError, error, refetch, isFetching } = useAppointments({
    status: statusFilter === 'ALL' ? undefined : statusFilter,
    date: dateFilter || undefined,
    search: searchQuery.trim() || undefined,
  });

  const { data: availabilitySlots, isLoading: isLoadingSlots } = useAvailability(appointmentDate);
  const { data: projects = [] } = useProjects();
  const { data: leadsData } = useLeads();
  const leads = useMemo(() => leadsData?.leads || [], [leadsData?.leads]);

  const createAppointmentMutation = useCreateAppointment();
  const submitFeedbackMutation = useSubmitFeedback();
  const updateAppointmentMutation = useUpdateAppointment();

  const appointments = useMemo(() => appData?.appointments || [], [appData?.appointments]);
  const scheduledCount = appData?.scheduledCount ?? 0;

  // Client-side project filter
  const filteredAppointments = useMemo(() => {
    return appointments.filter((item) => {
      if (projectFilter !== 'ALL') {
        const matchesProjectId = item.projectId === projectFilter;
        const matchesProjectName = item.projectName.toLowerCase() === projectFilter.toLowerCase();
        if (!matchesProjectId && !matchesProjectName) return false;
      }
      return true;
    });
  }, [appointments, projectFilter]);

  // Derived KPI Metrics (Calculated from filtered records when filters are active)
  const metrics = useMemo(() => {
    const total = filteredAppointments.length;
    const upcoming = filteredAppointments.filter((a) => a.status === 'Scheduled').length;
    const completed = filteredAppointments.filter((a) => a.status === 'Completed').length;
    const cancelled = filteredAppointments.filter(
      (a) => a.status === 'Cancelled' || a.status === 'No-Show'
    ).length;
    return { total, upcoming, completed, cancelled };
  }, [filteredAppointments]);

  const hasActiveFilters =
    statusFilter !== 'ALL' ||
    projectFilter !== 'ALL' ||
    dateFilter !== '' ||
    searchQuery.trim() !== '';

  const handleResetFilters = () => {
    setStatusFilter('ALL');
    setProjectFilter('ALL');
    setDateFilter('');
    setSearchQuery('');
  };

  // Pre-fill client from lead selection
  const handleSelectLead = (leadId: string) => {
    setSelectedLeadId(leadId);
    if (!leadId) return;
    const found = leads.find((l) => l._id === leadId || l.id === leadId);
    if (found) {
      setClientName(found.name);
      setClientPhone(found.phone);
      if (found.projectName && !projectName) {
        setProjectName(found.projectName);
      }
    }
  };

  // Pre-fill project from project selection
  const handleSelectProject = (projId: string) => {
    setSelectedProjectId(projId);
    if (!projId) return;
    const found = projects.find((p) => p._id === projId || p.id === projId);
    if (found) {
      setProjectName(found.name);
    }
  };

  // Form submission: Book Appointment
  const handleBookAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName.trim() || !clientPhone.trim() || !projectName.trim() || !selectedSlot) {
      toast({
        title: 'Validation Error',
        message: 'Client name, phone, development project, and time slot are required.',
        type: 'error',
      });
      return;
    }

    try {
      await createAppointmentMutation.mutateAsync({
        leadId: selectedLeadId || undefined,
        projectId: selectedProjectId || undefined,
        leadName: clientName.trim(),
        leadPhone: clientPhone.trim(),
        projectName: projectName.trim(),
        // Normalize at midday (12:00:00) to eliminate international timezone shifts across server boundaries
        appointmentDate: appointmentDate.includes('T') ? appointmentDate : `${appointmentDate}T12:00:00`,
        timeSlot: selectedSlot,
        assignedAgentName: assignedAgentName.trim() || undefined,
        notes: notes.trim() || undefined,
      });

      setIsScheduleModalOpen(false);
      setSelectedLeadId('');
      setClientName('');
      setClientPhone('');
      setSelectedProjectId('');
      setProjectName('');
      setSelectedSlot('');
      setAssignedAgentName('');
      setNotes('');

      toast({
        title: 'Site Visit Scheduled',
        message: `Walkthrough booked for ${clientName} on ${formatDisplayDate(appointmentDate)}.`,
        type: 'success',
      });
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { error?: { message?: string }; message?: string } } })
              .response?.data?.error?.message ||
            (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : 'Could not book site visit slot.';
      toast({
        title: 'Booking Error',
        message: msg || 'Please verify form inputs.',
        type: 'error',
      });
    }
  };

  // Form submission: Feedback Recording
  const handleFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedForFeedback) return;
    if (!feedbackNotes.trim() || !nextAction.trim()) {
      toast({
        title: 'Feedback Required',
        message: 'Please provide detailed visitor observations and a next sales action.',
        type: 'error',
      });
      return;
    }

    try {
      await submitFeedbackMutation.mutateAsync({
        appointmentId: selectedForFeedback._id || selectedForFeedback.id!,
        feedback: {
          feedbackRating: rating,
          interestLevel,
          feedbackNotes: feedbackNotes.trim(),
          nextAction: nextAction.trim(),
          nextActionDate: nextActionDate
            ? nextActionDate.includes('T')
              ? nextActionDate
              : `${nextActionDate}T12:00:00`
            : undefined,
        },
      });

      setSelectedForFeedback(null);
      setFeedbackNotes('');
      setNextAction('');
      toast({
        title: 'Feedback Recorded',
        message: `Walkthrough completed for ${selectedForFeedback.leadName}. Lead stage updated to "Visit done".`,
        type: 'success',
      });
    } catch (err: unknown) {
      toast({
        title: 'Submission Failed',
        message: err instanceof Error ? err.message : 'Could not submit walkthrough feedback.',
        type: 'error',
      });
    }
  };

  // Status Change: Cancel or No-Show
  const handleConfirmCancel = async () => {
    if (!cancellingItem) return;
    try {
      await updateAppointmentMutation.mutateAsync({
        id: cancellingItem._id || cancellingItem.id!,
        data: { status: 'Cancelled' },
      });
      toast({
        title: 'Appointment Cancelled',
        message: `Walkthrough for ${cancellingItem.leadName} has been cancelled.`,
        type: 'info',
      });
      setCancellingItem(null);
    } catch (err: unknown) {
      toast({
        title: 'Cancellation Failed',
        message: err instanceof Error ? err.message : 'Could not cancel appointment.',
        type: 'error',
      });
    }
  };

  const handleMarkNoShow = async (appointmentId: string, leadName: string) => {
    try {
      await updateAppointmentMutation.mutateAsync({
        id: appointmentId,
        data: { status: 'No-Show' },
      });
      toast({
        title: 'Marked as No-Show',
        message: `Appointment for ${leadName} logged as No-Show.`,
        type: 'info',
      });
    } catch (err: unknown) {
      toast({
        title: 'Update Failed',
        message: err instanceof Error ? err.message : 'Could not mark appointment status.',
        type: 'error',
      });
    }
  };

  return (
    <div className="space-y-6 pb-16">
      {/* 1. Header & Contextual Breadcrumbs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <nav aria-label="Breadcrumbs" className="flex items-center gap-1.5 text-xs text-[#64748B] mb-1">
            <Link to="/dashboard" className="hover:text-[#10B981] transition-colors">
              Dashboard
            </Link>
            <span className="text-slate-300">/</span>
            <span className="text-[#64748B]">Sales &amp; CRM</span>
            <span className="text-slate-300">/</span>
            <span className="font-semibold text-[#1F2937]">Appointments</span>
          </nav>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-[#1F2937]">
              Site Visits &amp; Appointments
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#E8F7F1] text-[#10B981] border border-[#10B981]/20">
              VIP Experience Center
            </span>
          </div>
          <p className="text-xs text-[#64748B] mt-0.5">
            Coordinate physical property walkthroughs, model suite viewings, and record buyer feedback to advance deals.
          </p>
        </div>

        {/* Global Action Controls */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => refetch()}
            disabled={isFetching}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[#EDF0F2] bg-white text-xs font-semibold text-[#1F2937] hover:bg-slate-50 shadow-xs transition-all active:scale-[0.98] cursor-pointer"
            title="Refresh appointments from server"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-[#10B981] ${isFetching ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          <button
            type="button"
            onClick={() => setIsScheduleModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#10B981] text-white text-xs font-semibold hover:bg-[#059669] shadow-xs transition-all active:scale-[0.98] cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Schedule Walkthrough</span>
          </button>
        </div>
      </div>

      {/* 2. Overview KPI Cards (Real Backend Statuses) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Total Appointments */}
        <div className="rounded-2xl bg-white border border-[#EDF0F2] p-5 shadow-[0_0_2px_0_rgba(145,158,171,0.2),0_12px_24px_-4px_rgba(145,158,171,0.12)] flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-[#64748B] uppercase tracking-wider block">
              Total Bookings
            </span>
            <div className="text-2xl font-bold text-[#1F2937] tabular-nums mt-1">
              {isLoading ? (
                <div className="h-7 w-12 bg-slate-100 rounded-md animate-pulse" />
              ) : (
                metrics.total
              )}
            </div>
            <span className="text-[11px] text-[#64748B]">
              {hasActiveFilters ? 'Matching active filters' : 'Total workspace bookings'}
            </span>
          </div>
          <div className="h-10 w-10 rounded-xl bg-slate-100 text-[#1F2937] flex items-center justify-center shrink-0">
            <Calendar className="w-5 h-5 text-[#10B981]" />
          </div>
        </div>

        {/* KPI 2: Upcoming Walkthroughs */}
        <div className="rounded-2xl bg-white border border-[#EDF0F2] p-5 shadow-[0_0_2px_0_rgba(145,158,171,0.2),0_12px_24px_-4px_rgba(145,158,171,0.12)] flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-[#64748B] uppercase tracking-wider block">
              Upcoming Visits
            </span>
            <div className="text-2xl font-bold text-[#10B981] tabular-nums mt-1">
              {isLoading ? (
                <div className="h-7 w-12 bg-slate-100 rounded-md animate-pulse" />
              ) : (
                hasActiveFilters ? metrics.upcoming : (scheduledCount || metrics.upcoming)
              )}
            </div>
            <span className="text-[11px] text-[#64748B]">
              {hasActiveFilters ? 'Filtered scheduled slots' : 'Active scheduled slots'}
            </span>
          </div>
          <div className="h-10 w-10 rounded-xl bg-[#E8F7F1] text-[#10B981] flex items-center justify-center shrink-0">
            <CalendarClock className="w-5 h-5 stroke-[2.2]" />
          </div>
        </div>

        {/* KPI 3: Completed Visits */}
        <div className="rounded-2xl bg-white border border-[#EDF0F2] p-5 shadow-[0_0_2px_0_rgba(145,158,171,0.2),0_12px_24px_-4px_rgba(145,158,171,0.12)] flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-[#64748B] uppercase tracking-wider block">
              Completed Visits
            </span>
            <div className="text-2xl font-bold text-[#3B82F6] tabular-nums mt-1">
              {isLoading ? (
                <div className="h-7 w-12 bg-slate-100 rounded-md animate-pulse" />
              ) : (
                metrics.completed
              )}
            </div>
            <span className="text-[11px] text-[#64748B]">
              {hasActiveFilters ? 'Filtered completed visits' : 'Feedback recorded'}
            </span>
          </div>
          <div className="h-10 w-10 rounded-xl bg-[#EFF6FF] text-[#3B82F6] flex items-center justify-center shrink-0">
            <CalendarCheck className="w-5 h-5 stroke-[2.2]" />
          </div>
        </div>

        {/* KPI 4: Cancelled / No-Shows */}
        <div className="rounded-2xl bg-white border border-[#EDF0F2] p-5 shadow-[0_0_2px_0_rgba(145,158,171,0.2),0_12px_24px_-4px_rgba(145,158,171,0.12)] flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-[#64748B] uppercase tracking-wider block">
              Cancelled / No-Show
            </span>
            <div className="text-2xl font-bold text-[#F59E0B] tabular-nums mt-1">
              {isLoading ? (
                <div className="h-7 w-12 bg-slate-100 rounded-md animate-pulse" />
              ) : (
                metrics.cancelled
              )}
            </div>
            <span className="text-[11px] text-[#64748B]">
              {hasActiveFilters ? 'Filtered cancellations' : 'Requires re-engagement'}
            </span>
          </div>
          <div className="h-10 w-10 rounded-xl bg-[#FEF3C7] text-[#D97706] flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5 stroke-[2.2]" />
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
              <p className="font-bold text-rose-900 text-sm">Failed to Load Appointments</p>
              <p className="text-rose-800/90 text-xs mt-0.5">
                {error instanceof Error
                  ? error.message
                  : 'Could not retrieve scheduled site visit records.'}
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
              placeholder="Search visitor name, phone, project, or gate pass..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-10 text-xs pl-10 pr-9 rounded-xl border border-[#EDF0F2] bg-slate-50/50 text-[#1F2937] placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-[#10B981] focus:border-[#10B981] focus:bg-white transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#1F2937] p-0.5 cursor-pointer"
              >
                <XCircle className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Segmented Status Filter Bar */}
          <div className="inline-flex items-center rounded-xl bg-slate-100 p-0.5 text-xs font-semibold">
            {(['ALL', 'Scheduled', 'Completed', 'Cancelled', 'No-Show'] as const).map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  statusFilter === st
                    ? 'bg-white text-[#10B981] shadow-xs'
                    : 'text-[#64748B] hover:text-[#1F2937]'
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          {/* Reset Filters Action */}
          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#10B981] hover:text-[#059669] transition-colors self-start md:self-auto cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Filters</span>
            </button>
          )}
        </div>

        {/* Secondary Filters: Project & Date */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-[#EDF0F2]">
          <div>
            <label className="block text-[11px] font-semibold text-[#64748B] uppercase tracking-wider mb-1">
              Filter by Project
            </label>
            <select
              value={projectFilter}
              onChange={(e) => setProjectFilter(e.target.value)}
              className="w-full h-9 px-3 text-xs rounded-xl border border-[#EDF0F2] bg-white text-[#1F2937] focus:outline-none focus:ring-1 focus:ring-[#10B981] cursor-pointer"
            >
              <option value="ALL">All Development Projects</option>
              {projects.map((p) => (
                <option key={p.id || p._id} value={p.name}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-[#64748B] uppercase tracking-wider mb-1">
              Filter by Date
            </label>
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full h-9 px-3 text-xs rounded-xl border border-[#EDF0F2] bg-white text-[#1F2937] focus:outline-none focus:ring-1 focus:ring-[#10B981] cursor-pointer tabular-nums"
            />
          </div>
        </div>
      </div>

      {/* 5. Main Appointments Data Table & List */}
      <div className="rounded-2xl border border-[#EDF0F2] bg-white overflow-hidden shadow-[0_0_2px_0_rgba(145,158,171,0.2),0_12px_24px_-4px_rgba(145,158,171,0.12)]">
        <div className="p-4 border-b border-[#EDF0F2] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-xl bg-[#E8F7F1] text-[#10B981] flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#1F2937]">
                Scheduled Site Visits ({filteredAppointments.length})
              </h2>
              <p className="text-[11px] text-[#64748B]">
                {scheduledCount} active walkthroughs requiring experience center readiness
              </p>
            </div>
          </div>
          <span className="text-xs text-[#64748B] tabular-nums font-semibold hidden sm:inline">
            Showing {filteredAppointments.length} records
          </span>
        </div>

        {/* Responsive Content */}
        {isLoading ? (
          <div className="p-12 text-center text-xs text-[#64748B] space-y-3">
            <div className="h-6 w-6 border-2 border-[#10B981] border-t-transparent rounded-full animate-spin mx-auto" />
            <p>Loading scheduled walkthroughs and gate passes...</p>
          </div>
        ) : filteredAppointments.length === 0 ? (
          <EmptyState
            icon={<Calendar className="w-10 h-10 text-slate-400" />}
            title="No appointments found"
            description={
              hasActiveFilters
                ? 'No walkthroughs match your selected search or filter criteria. Try resetting filters.'
                : 'No property walkthroughs scheduled yet. Click "Schedule Walkthrough" to register your first visitor.'
            }
            actionLabel={hasActiveFilters ? 'Reset Filters' : 'Schedule First Walkthrough'}
            onAction={hasActiveFilters ? handleResetFilters : () => setIsScheduleModalOpen(true)}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-[#EDF0F2] text-[11px] font-semibold text-[#64748B] uppercase tracking-wider">
                  <th className="p-3.5">Visitor Contact</th>
                  <th className="p-3.5">Development Project</th>
                  <th className="p-3.5">Visit Slot</th>
                  <th className="p-3.5">Digital Gate Pass</th>
                  <th className="p-3.5">Assigned Host</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5">Feedback / Rating</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EDF0F2]">
                {filteredAppointments.map((item) => {
                  const initial = (item.leadName || 'U').charAt(0).toUpperCase();
                  const isScheduled = item.status === 'Scheduled';
                  const isCompleted = item.status === 'Completed';

                  return (
                    <tr key={item._id || item.id} className="hover:bg-slate-50/50 transition-colors h-14">
                      {/* Visitor Contact */}
                      <td className="p-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="h-8 w-8 rounded-full bg-[#E8F7F1] text-[#10B981] font-bold text-xs flex items-center justify-center shrink-0 border border-[#10B981]/20">
                            {initial}
                          </div>
                          <div className="min-w-0">
                            <span className="font-bold text-[#1F2937] block truncate">
                              {item.leadName}
                            </span>
                            <span className="text-[11px] text-[#64748B] flex items-center gap-1 tabular-nums">
                              <Phone className="w-3 h-3 text-slate-400" />
                              <span>{item.leadPhone}</span>
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Project */}
                      <td className="p-3.5">
                        <span className="font-semibold text-[#1F2937] flex items-center gap-1.5 truncate max-w-[180px]">
                          <Building2 className="w-3.5 h-3.5 text-[#10B981] shrink-0" />
                          <span className="truncate">{item.projectName}</span>
                        </span>
                      </td>

                      {/* Date & Time Slot */}
                      <td className="p-3.5">
                        <div className="space-y-0.5">
                          <span className="font-bold text-[#1F2937] tabular-nums block">
                            {formatDisplayDate(item.appointmentDate)}
                          </span>
                          <span className="text-[11px] text-[#64748B] flex items-center gap-1 tabular-nums">
                            <Clock className="w-3 h-3 text-slate-400" />
                            <span>{item.timeSlot}</span>
                          </span>
                        </div>
                      </td>

                      {/* Gate Pass */}
                      <td className="p-3.5">
                        {item.gatePassCode ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 text-[#1F2937] font-bold text-[11px] border border-[#EDF0F2] tabular-nums">
                            <Ticket className="w-3 h-3 text-[#10B981]" />
                            <span>{item.gatePassCode}</span>
                          </span>
                        ) : (
                          <span className="text-slate-400 text-xs italic">Unassigned</span>
                        )}
                      </td>

                      {/* Assigned Host */}
                      <td className="p-3.5">
                        <span className="text-xs text-[#1F2937] font-medium flex items-center gap-1">
                          <User className="w-3 h-3 text-slate-400" />
                          <span>{item.assignedAgentName || 'Assigned Host'}</span>
                        </span>
                      </td>

                      {/* Status */}
                      <td className="p-3.5">
                        <StatusBadge status={item.status} />
                      </td>

                      {/* Feedback / Rating */}
                      <td className="p-3.5">
                        {item.feedbackRating ? (
                          <div className="space-y-1">
                            <div className="flex items-center gap-1 text-amber-500 font-bold text-xs tabular-nums">
                              <Star className="w-3.5 h-3.5 fill-current" />
                              <span>{item.feedbackRating}/5</span>
                              {item.interestLevel && (
                                <span
                                  className={`ml-1 text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                                    item.interestLevel === 'HIGH'
                                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                      : item.interestLevel === 'MEDIUM'
                                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                        : 'bg-slate-100 text-slate-600'
                                  }`}
                                >
                                  {item.interestLevel} Intent
                                </span>
                              )}
                            </div>
                            {item.nextAction && (
                              <button
                                type="button"
                                onClick={() => setViewingFeedback(item)}
                                className="text-[11px] text-[#10B981] hover:underline flex items-center gap-1 cursor-pointer"
                              >
                                <FileText className="w-3 h-3" />
                                <span>View Notes</span>
                              </button>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400 text-[11px] italic">Pending visit</span>
                        )}
                      </td>

                      {/* Action Triggers */}
                      <td className="p-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {isScheduled && (
                            <>
                              <button
                                type="button"
                                onClick={() => setSelectedForFeedback(item)}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#E8F7F1] text-[#10B981] hover:bg-[#10B981] hover:text-white text-xs font-semibold transition-all cursor-pointer shadow-xs"
                                title="Record Walkthrough Feedback"
                              >
                                <Check className="w-3.5 h-3.5" />
                                <span>Feedback</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => handleMarkNoShow(item._id || item.id!, item.leadName)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition-colors cursor-pointer"
                                title="Mark as No-Show"
                              >
                                <XCircle className="w-4 h-4" />
                              </button>

                              <button
                                type="button"
                                onClick={() => setCancellingItem(item)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                                title="Cancel Walkthrough"
                              >
                                <AlertTriangle className="w-4 h-4" />
                              </button>
                            </>
                          )}

                          {isCompleted && item.feedbackNotes && (
                            <button
                              type="button"
                              onClick={() => setViewingFeedback(item)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-[#EDF0F2] bg-white text-[#1F2937] hover:bg-slate-50 text-xs font-semibold transition-all cursor-pointer shadow-xs"
                              title="Inspect visit notes"
                            >
                              <MessageSquare className="w-3.5 h-3.5 text-slate-400" />
                              <span>Details</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 6. SCHEDULE WALKTHROUGH MODAL */}
      <Modal open={isScheduleModalOpen} onOpenChange={setIsScheduleModalOpen}>
        <ModalContent className="max-w-lg rounded-2xl bg-white p-6 shadow-xl space-y-4">
          <ModalHeader>
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-xl bg-[#E8F7F1] text-[#10B981] flex items-center justify-center shrink-0">
                <Calendar className="w-5 h-5 stroke-[2.2]" />
              </div>
              <div>
                <ModalTitle className="text-lg font-bold text-[#1F2937]">
                  Schedule VIP Site Walkthrough
                </ModalTitle>
                <ModalDescription className="text-xs text-[#64748B]">
                  Reserve an experience center appointment slot with digital gate pass issuance.
                </ModalDescription>
              </div>
            </div>
          </ModalHeader>

          <form onSubmit={handleBookAppointment} className="space-y-4 py-2">
            {/* Quick Pre-fill from Existing Leads */}
            {leads.length > 0 && (
              <div className="p-3 bg-slate-50 border border-[#EDF0F2] rounded-xl space-y-1">
                <label className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider block flex items-center gap-1">
                  <Users className="w-3 h-3 text-[#10B981]" />
                  <span>Quick Pick Registered Lead (Optional)</span>
                </label>
                <select
                  value={selectedLeadId}
                  onChange={(e) => handleSelectLead(e.target.value)}
                  className="w-full h-8 px-2.5 text-xs rounded-lg border border-[#EDF0F2] bg-white text-[#1F2937] focus:outline-none focus:ring-1 focus:ring-[#10B981] cursor-pointer"
                >
                  <option value="">Choose an existing CRM lead to autofill details...</option>
                  {leads.map((l) => (
                    <option key={l._id || l.id} value={l._id || l.id}>
                      {l.name} &bull; {l.phone} {l.projectName ? `(${l.projectName})` : ''}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Client Name & Phone */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-[#1F2937] block mb-1">
                  Client Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Vikramaditya Singhania"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  className="w-full h-10 px-3 text-xs rounded-xl border border-[#EDF0F2] bg-white text-[#1F2937] placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-[#10B981]"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#1F2937] block mb-1">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  required
                  placeholder="+91 98000 00000"
                  value={clientPhone}
                  onChange={(e) => setClientPhone(e.target.value)}
                  className="w-full h-10 px-3 text-xs rounded-xl border border-[#EDF0F2] bg-white text-[#1F2937] placeholder:text-slate-400 tabular-nums focus:outline-none focus:ring-1 focus:ring-[#10B981]"
                />
              </div>
            </div>

            {/* Project Selection & Appointment Date */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-[#1F2937] block mb-1">
                  Development Project *
                </label>
                {projects.length > 0 ? (
                  <select
                    value={selectedProjectId}
                    onChange={(e) => handleSelectProject(e.target.value)}
                    className="w-full h-10 px-3 text-xs rounded-xl border border-[#EDF0F2] bg-white text-[#1F2937] focus:outline-none focus:ring-1 focus:ring-[#10B981] cursor-pointer"
                  >
                    <option value="">Select project...</option>
                    {projects.map((p) => (
                      <option key={p.id || p._id} value={p.id || p._id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    required
                    placeholder="e.g. The Crest Villas"
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    className="w-full h-10 px-3 text-xs rounded-xl border border-[#EDF0F2] bg-white text-[#1F2937] placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-[#10B981]"
                  />
                )}
              </div>

              <div>
                <label className="text-xs font-semibold text-[#1F2937] block mb-1">
                  Appointment Date *
                </label>
                <input
                  type="date"
                  required
                  value={appointmentDate}
                  onChange={(e) => setAppointmentDate(e.target.value)}
                  className="w-full h-10 px-3 text-xs rounded-xl border border-[#EDF0F2] bg-white text-[#1F2937] tabular-nums focus:outline-none focus:ring-1 focus:ring-[#10B981]"
                />
              </div>
            </div>

            {/* Time Slot Availability Picker */}
            <div>
              <label className="text-xs font-semibold text-[#1F2937] block mb-1.5">
                Select Available Walkthrough Slot *
              </label>
              {isLoadingSlots ? (
                <div className="text-xs text-slate-400 py-3 flex items-center gap-2">
                  <div className="w-3.5 h-3.5 border-2 border-[#10B981] border-t-transparent rounded-full animate-spin" />
                  <span>Checking experience center availability...</span>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {availabilitySlots?.map((slot) => {
                    const isSelected = selectedSlot === slot.timeSlot;
                    return (
                      <button
                        key={slot.timeSlot}
                        type="button"
                        disabled={!slot.isAvailable}
                        onClick={() => setSelectedSlot(slot.timeSlot)}
                        className={`p-2.5 text-left text-xs rounded-xl border transition-all flex items-center justify-between tabular-nums cursor-pointer ${
                          isSelected
                            ? 'bg-[#10B981] text-white font-bold border-[#10B981] shadow-xs'
                            : slot.isAvailable
                              ? 'bg-white border-[#EDF0F2] text-[#1F2937] hover:border-slate-300'
                              : 'bg-slate-50 border-[#EDF0F2] text-slate-400 cursor-not-allowed line-through'
                        }`}
                      >
                        <span className="font-semibold">{slot.timeSlot}</span>
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                          isSelected
                            ? 'bg-white/20 text-white'
                            : slot.isAvailable
                              ? 'bg-emerald-50 text-[#10B981]'
                              : 'bg-slate-200 text-slate-500'
                        }`}>
                          {slot.isAvailable ? 'Available' : 'Booked'}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Assigned Host Agent */}
            <div>
              <label className="text-xs font-semibold text-[#1F2937] block mb-1">
                Assigned Host Sales Agent
              </label>
              <input
                type="text"
                placeholder="Senior Sales Advisor Name"
                value={assignedAgentName}
                onChange={(e) => setAssignedAgentName(e.target.value)}
                className="w-full h-10 px-3 text-xs rounded-xl border border-[#EDF0F2] bg-white text-[#1F2937] placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-[#10B981]"
              />
            </div>

            {/* Special Requests / Notes */}
            <div>
              <label className="text-xs font-semibold text-[#1F2937] block mb-1">
                Special Requests / VIP Gate Notes
              </label>
              <textarea
                rows={2}
                placeholder="Specific model suite preference, valet parking pass..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full p-3 text-xs rounded-xl border border-[#EDF0F2] bg-white text-[#1F2937] placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-[#10B981] resize-none"
              />
            </div>

            <ModalFooter className="border-t border-[#EDF0F2] pt-4">
              <button
                type="button"
                onClick={() => setIsScheduleModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-[#EDF0F2] bg-white text-xs font-semibold text-[#1F2937] hover:bg-slate-50 transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={createAppointmentMutation.isPending || !selectedSlot}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#10B981] text-white text-xs font-semibold hover:bg-[#059669] shadow-xs transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <CalendarCheck className={`w-3.5 h-3.5 ${createAppointmentMutation.isPending ? 'animate-spin' : ''}`} />
                <span>{createAppointmentMutation.isPending ? 'Scheduling...' : 'Confirm Walkthrough'}</span>
              </button>
            </ModalFooter>
          </form>
        </ModalContent>
      </Modal>

      {/* 7. RECORD FEEDBACK MODAL */}
      <Modal
        open={Boolean(selectedForFeedback)}
        onOpenChange={(open) => !open && setSelectedForFeedback(null)}
      >
        {selectedForFeedback && (
          <ModalContent className="max-w-lg rounded-2xl bg-white p-6 shadow-xl space-y-4">
            <ModalHeader>
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-xl bg-[#EFF6FF] text-[#3B82F6] flex items-center justify-center shrink-0">
                  <Star className="w-5 h-5 stroke-[2.2]" />
                </div>
                <div>
                  <ModalTitle className="text-lg font-bold text-[#1F2937]">
                    Record Walkthrough Feedback
                  </ModalTitle>
                  <ModalDescription className="text-xs text-[#64748B]">
                    {selectedForFeedback.leadName} &bull; {selectedForFeedback.projectName} &bull; Slot: {selectedForFeedback.timeSlot}
                  </ModalDescription>
                </div>
              </div>
            </ModalHeader>

            <form onSubmit={handleFeedbackSubmit} className="space-y-4 py-2">
              {/* Star Rating */}
              <div>
                <label className="text-xs font-semibold text-[#1F2937] block mb-1.5">
                  Visitor Engagement Rating (1-5) *
                </label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className={`px-3 py-2 border rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                        rating >= star
                          ? 'bg-[#10B981] text-white border-[#10B981] shadow-xs'
                          : 'bg-white text-slate-600 border-[#EDF0F2] hover:border-slate-300'
                      }`}
                    >
                      <Star className="w-3.5 h-3.5 fill-current" />
                      <span>{star} Star{star > 1 ? 's' : ''}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Buying Intent Level */}
              <div>
                <label className="text-xs font-semibold text-[#1F2937] block mb-1">
                  Buying Intent Level *
                </label>
                <select
                  value={interestLevel}
                  onChange={(e) => setInterestLevel(e.target.value as 'HIGH' | 'MEDIUM' | 'LOW')}
                  className="w-full h-10 px-3 text-xs rounded-xl border border-[#EDF0F2] bg-white text-[#1F2937] focus:outline-none focus:ring-1 focus:ring-[#10B981] cursor-pointer"
                >
                  <option value="HIGH">HIGH (Imminent Buyer / Mortgage Pre-approved)</option>
                  <option value="MEDIUM">MEDIUM (Actively Comparing Competitor Units)</option>
                  <option value="LOW">LOW (Casual Walkthrough / Early Exploratory)</option>
                </select>
              </div>

              {/* Detailed Observations */}
              <div>
                <label className="text-xs font-semibold text-[#1F2937] block mb-1">
                  Detailed Visitor Observations *
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Notes on layout feedback, pricing reaction, specific floor preference, amenities discussed..."
                  value={feedbackNotes}
                  onChange={(e) => setFeedbackNotes(e.target.value)}
                  className="w-full p-3 text-xs rounded-xl border border-[#EDF0F2] bg-white text-[#1F2937] placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-[#10B981] resize-none"
                />
              </div>

              {/* Next Action & Due Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 border-t border-[#EDF0F2] pt-3">
                <div>
                  <label className="text-xs font-semibold text-[#1F2937] block mb-1">
                    Next Sales Task / Action *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Dispatch customized payment schedule"
                    value={nextAction}
                    onChange={(e) => setNextAction(e.target.value)}
                    className="w-full h-10 px-3 text-xs rounded-xl border border-[#EDF0F2] bg-white text-[#1F2937] placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-[#10B981]"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-[#1F2937] block mb-1">
                    Follow-up Due Date
                  </label>
                  <input
                    type="date"
                    value={nextActionDate}
                    onChange={(e) => setNextActionDate(e.target.value)}
                    className="w-full h-10 px-3 text-xs rounded-xl border border-[#EDF0F2] bg-white text-[#1F2937] tabular-nums focus:outline-none focus:ring-1 focus:ring-[#10B981]"
                  />
                </div>
              </div>

              <ModalFooter className="border-t border-[#EDF0F2] pt-4">
                <button
                  type="button"
                  onClick={() => setSelectedForFeedback(null)}
                  className="px-4 py-2 rounded-xl border border-[#EDF0F2] bg-white text-xs font-semibold text-[#1F2937] hover:bg-slate-50 transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitFeedbackMutation.isPending}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#10B981] text-white text-xs font-semibold hover:bg-[#059669] shadow-xs transition-all cursor-pointer disabled:opacity-50"
                >
                  <CheckCircle2 className={`w-3.5 h-3.5 ${submitFeedbackMutation.isPending ? 'animate-spin' : ''}`} />
                  <span>{submitFeedbackMutation.isPending ? 'Completing...' : 'Complete & Log Feedback'}</span>
                </button>
              </ModalFooter>
            </form>
          </ModalContent>
        )}
      </Modal>

      {/* 8. VIEW FEEDBACK DETAILS MODAL */}
      <Modal open={Boolean(viewingFeedback)} onOpenChange={(open) => !open && setViewingFeedback(null)}>
        {viewingFeedback && (
          <ModalContent className="max-w-md rounded-2xl bg-white p-6 shadow-xl space-y-4">
            <ModalHeader>
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-xl bg-[#E8F7F1] text-[#10B981] flex items-center justify-center shrink-0">
                  <FileText className="w-5 h-5 stroke-[2.2]" />
                </div>
                <div>
                  <ModalTitle className="text-base font-bold text-[#1F2937]">
                    Walkthrough Feedback &amp; Next Task
                  </ModalTitle>
                  <ModalDescription className="text-xs text-[#64748B]">
                    {viewingFeedback.leadName} &bull; {viewingFeedback.projectName}
                  </ModalDescription>
                </div>
              </div>
            </ModalHeader>

            <div className="space-y-3 py-2 text-xs">
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-[#EDF0F2]">
                <span className="font-semibold text-[#64748B]">Rating &amp; Buying Intent:</span>
                <div className="flex items-center gap-1.5 font-bold text-[#1F2937]">
                  <span className="flex items-center text-amber-500 gap-1">
                    <Star className="w-3.5 h-3.5 fill-current" />
                    <span>{viewingFeedback.feedbackRating}/5 Stars</span>
                  </span>
                  <span>&bull;</span>
                  <span className="text-[#10B981]">{viewingFeedback.interestLevel}</span>
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider block">
                  Visitor Notes:
                </span>
                <p className="p-3 rounded-xl bg-slate-50/50 border border-[#EDF0F2] text-[#1F2937] leading-relaxed whitespace-pre-line">
                  {viewingFeedback.feedbackNotes || 'No notes recorded.'}
                </p>
              </div>

              {viewingFeedback.nextAction && (
                <div className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-200 text-emerald-950 space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 block">
                    Next Sales Follow-Up Action:
                  </span>
                  <p className="font-bold text-xs">{viewingFeedback.nextAction}</p>
                  {viewingFeedback.nextActionDate && (
                    <p className="text-[11px] text-emerald-700 tabular-nums">
                      Due: {formatDisplayDate(viewingFeedback.nextActionDate)}
                    </p>
                  )}
                </div>
              )}
            </div>

            <ModalFooter className="border-t border-[#EDF0F2] pt-4">
              <button
                type="button"
                onClick={() => setViewingFeedback(null)}
                className="w-full py-2 rounded-xl bg-[#10B981] text-white text-xs font-semibold hover:bg-[#059669] transition-all cursor-pointer"
              >
                Close
              </button>
            </ModalFooter>
          </ModalContent>
        )}
      </Modal>

      {/* 9. CANCEL WALKTHROUGH CONFIRMATION MODAL */}
      <Modal open={Boolean(cancellingItem)} onOpenChange={(open) => !open && setCancellingItem(null)}>
        {cancellingItem && (
          <ModalContent className="max-w-md rounded-2xl bg-white p-6 shadow-xl space-y-4">
            <ModalHeader>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-5 h-5 stroke-[2.2]" />
                </div>
                <div>
                  <ModalTitle className="text-base font-bold text-[#1F2937]">
                    Cancel Site Visit Appointment
                  </ModalTitle>
                  <ModalDescription className="text-xs text-[#64748B]">
                    Confirmation required
                  </ModalDescription>
                </div>
              </div>
            </ModalHeader>

            <div className="p-3.5 rounded-xl bg-rose-50/50 border border-rose-200 text-xs text-rose-800 space-y-1.5">
              <p>
                Are you sure you want to cancel the walkthrough for{' '}
                <strong className="text-rose-950 font-bold">{cancellingItem.leadName}</strong> at{' '}
                <strong className="text-rose-950 font-bold">{cancellingItem.projectName}</strong>?
              </p>
              <p className="text-[11px] text-rose-700">
                This will release the booked slot ({cancellingItem.timeSlot}) and invalidate the gate pass code.
              </p>
            </div>

            <ModalFooter className="border-t border-[#EDF0F2] pt-4">
              <button
                type="button"
                disabled={updateAppointmentMutation.isPending}
                onClick={() => setCancellingItem(null)}
                className="px-4 py-2 rounded-xl border border-[#EDF0F2] bg-white text-xs font-semibold text-[#1F2937] hover:bg-slate-50 transition-all cursor-pointer"
              >
                Keep Appointment
              </button>
              <button
                type="button"
                disabled={updateAppointmentMutation.isPending}
                onClick={handleConfirmCancel}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-xs transition-all cursor-pointer disabled:opacity-50"
              >
                <XCircle className={`w-3.5 h-3.5 ${updateAppointmentMutation.isPending ? 'animate-spin' : ''}`} />
                <span>{updateAppointmentMutation.isPending ? 'Cancelling...' : 'Confirm Cancellation'}</span>
              </button>
            </ModalFooter>
          </ModalContent>
        )}
      </Modal>
    </div>
  );
}
