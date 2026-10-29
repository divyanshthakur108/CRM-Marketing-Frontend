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
import {
  Calendar,
  Check,
  Plus,
  Loader2,
  RefreshCw,
  Search,
  Star,
  Clock,
  Ticket,
} from 'lucide-react';

export function AppointmentsPage() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<AppointmentStatus | 'ALL'>('ALL');
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [selectedForFeedback, setSelectedForFeedback] = useState<BackendAppointment | null>(null);

  // Form State for Booking
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [projectName, setProjectName] = useState('');
  const [appointmentDate, setAppointmentDate] = useState(
    new Date(Date.now() + 86400000).toISOString().split('T')[0]
  );
  const [selectedSlot, setSelectedSlot] = useState('');
  const [assignedAgentName, setAssignedAgentName] = useState('');
  const [notes, setNotes] = useState('');

  // Form State for Feedback
  const [rating, setRating] = useState<number>(5);
  const [interestLevel, setInterestLevel] = useState<'HIGH' | 'MEDIUM' | 'LOW'>('HIGH');
  const [feedbackNotes, setFeedbackNotes] = useState('');
  const [nextAction, setNextAction] = useState('');
  const [nextActionDate, setNextActionDate] = useState(
    new Date(Date.now() + 2 * 86400000).toISOString().split('T')[0]
  );

  // Queries & Mutations
  const { data: appData, isLoading, refetch } = useAppointments({
    status: statusFilter === 'ALL' ? undefined : statusFilter,
    search: searchQuery.trim() || undefined,
  });

  const { data: availabilitySlots, isLoading: isLoadingSlots } = useAvailability(
    appointmentDate
  );

  const createAppointmentMutation = useCreateAppointment();
  const submitFeedbackMutation = useSubmitFeedback();
  const updateAppointmentMutation = useUpdateAppointment();

  const appointments = appData?.appointments || [];
  const scheduledCount = appData?.scheduledCount || 0;

  const handleBookAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName.trim() || !clientPhone.trim() || !projectName.trim() || !selectedSlot) {
      toast({
        title: 'Validation Error',
        message: 'Client name, phone, project, and time slot are required.',
        type: 'error',
      });
      return;
    }

    try {
      await createAppointmentMutation.mutateAsync({
        leadName: clientName.trim(),
        leadPhone: clientPhone.trim(),
        projectName: projectName.trim(),
        appointmentDate: new Date(appointmentDate).toISOString(),
        timeSlot: selectedSlot,
        assignedAgentName: assignedAgentName.trim() || undefined,
        notes: notes.trim() || undefined,
      });

      setIsScheduleModalOpen(false);
      setClientName('');
      setClientPhone('');
      setProjectName('');
      setSelectedSlot('');
      setAssignedAgentName('');
      setNotes('');

      toast({
        title: 'Site Visit Scheduled',
        message: `Walkthrough booked for ${clientName} on ${appointmentDate}.`,
        type: 'success',
      });
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { error?: { message?: string } } } }).response?.data?.error?.message
          : 'Could not book site visit slot.';
      toast({
        title: 'Booking Error',
        message: msg || 'Please verify form inputs.',
        type: 'error',
      });
    }
  };

  const handleFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedForFeedback) return;
    if (!feedbackNotes.trim() || !nextAction.trim()) {
      toast({
        title: 'Feedback Required',
        message: 'Please provide notes and a follow-up action.',
        type: 'error',
      });
      return;
    }

    try {
      await submitFeedbackMutation.mutateAsync({
        appointmentId: selectedForFeedback._id,
        feedback: {
          feedbackRating: rating,
          interestLevel,
          feedbackNotes: feedbackNotes.trim(),
          nextAction: nextAction.trim(),
          nextActionDate: new Date(nextActionDate).toISOString(),
        },
      });

      setSelectedForFeedback(null);
      setFeedbackNotes('');
      setNextAction('');
      toast({
        title: 'Feedback Recorded',
        message: 'Walkthrough marked completed and next action logged.',
        type: 'success',
      });
    } catch {
      toast({
        title: 'Submission Failed',
        message: 'Could not submit walkthrough feedback.',
        type: 'error',
      });
    }
  };

  const handleStatusChange = async (appointmentId: string, status: AppointmentStatus) => {
    try {
      await updateAppointmentMutation.mutateAsync({
        id: appointmentId,
        data: { status },
      });
      toast({
        title: 'Status Updated',
        message: `Appointment marked as ${status}.`,
        type: 'info',
      });
    } catch {
      toast({
        title: 'Update Failed',
        message: 'Could not change status.',
        type: 'error',
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Page Header */}
      <PageHeader
        title="Site Visits &amp; Walkthroughs"
        description="Coordinate physical property walkthroughs, model suite viewings, and track buyer feedback."
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

            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={() => setIsScheduleModalOpen(true)}
              leftIcon={<Plus className="w-3.5 h-3.5" />}
            >
              Schedule Walkthrough
            </Button>
          </div>
        }
      />

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-surface p-3 rounded-card border border-border">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            placeholder="Search visitor, phone, project, or gate pass..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-10 text-sm pl-9 pr-3 rounded-[8px] border border-border bg-surface text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1 transition-all"
          />
        </div>

        <div className="inline-flex items-center p-0.5 rounded-lg bg-neutral-100 border border-border">
          {(['ALL', 'Scheduled', 'Completed', 'Cancelled'] as const).map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1 text-meta rounded-md transition-all ${
                statusFilter === st
                  ? 'bg-surface text-text-primary shadow-xs font-medium'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Appointments List Card */}
      <Card className="p-0 overflow-hidden">
        <div className="p-4 border-b border-border flex items-center justify-between bg-surface">
          <div className="flex items-center space-x-2">
            <Calendar className="w-4 h-4 text-text-primary" />
            <h3 className="text-section font-semibold text-text-primary">
              Scheduled Site Visits ({appointments.length})
            </h3>
          </div>
          <span className="text-meta text-text-secondary tabular-nums">
            {scheduledCount} Active Scheduled Walkthroughs
          </span>
        </div>

        <div className="overflow-x-auto bg-surface">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="bg-neutral-100 border-b border-border text-meta font-medium text-text-secondary sticky top-0">
                <th className="px-4 py-3">Client Contact</th>
                <th className="px-4 py-3">Development Project</th>
                <th className="px-4 py-3">Date &amp; Time Slot</th>
                <th className="px-4 py-3">Gate Pass</th>
                <th className="px-4 py-3">Host Sales Agent</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-sm text-text-muted">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-text-secondary mb-2" />
                    Loading Scheduled Walkthroughs...
                  </td>
                </tr>
              ) : appointments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-10 text-center text-meta text-text-muted">
                    No property walkthrough appointments found matching criteria.
                  </td>
                </tr>
              ) : (
                appointments.map((item) => (
                  <tr key={item._id} className="hover:bg-surface-hover h-12 transition-colors">
                    <td className="px-4 py-2.5">
                      <div className="font-medium text-text-primary">{item.leadName}</div>
                      <div className="text-meta text-text-muted tabular-nums">{item.leadPhone}</div>
                    </td>
                    <td className="px-4 py-2.5 font-medium text-text-primary">{item.projectName}</td>
                    <td className="px-4 py-2.5">
                      <div className="font-medium text-text-primary tabular-nums">
                        {formatDisplayDate(item.appointmentDate)}
                      </div>
                      <div className="text-meta text-text-muted flex items-center space-x-1 tabular-nums">
                        <Clock className="w-3 h-3" />
                        <span>{item.timeSlot}</span>
                      </div>
                    </td>
                    <td className="px-4 py-2.5">
                      {item.gatePassCode ? (
                        <span className="inline-flex items-center text-meta px-2 py-0.5 rounded-[4px] bg-neutral-100 text-text-primary font-medium border border-border">
                          <Ticket className="w-3 h-3 mr-1 text-text-muted" />
                          {item.gatePassCode}
                        </span>
                      ) : (
                        <span className="text-text-muted text-meta">None</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-meta text-text-secondary">
                      {item.assignedAgentName || 'Assigned Host'}
                    </td>
                    <td className="px-4 py-2.5">
                      <StatusBadge status={item.status} />
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        {item.status === 'Scheduled' && (
                          <>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedForFeedback(item)}
                              leftIcon={<Check className="w-3.5 h-3.5" />}
                            >
                              Feedback
                            </Button>
                            <button
                              type="button"
                              onClick={() => handleStatusChange(item._id, 'Cancelled')}
                              className="text-meta text-text-muted hover:text-status-danger underline underline-offset-2 transition-colors"
                            >
                              Cancel
                            </button>
                          </>
                        )}
                        {item.status === 'Completed' && item.feedbackRating && (
                          <span className="text-meta text-text-secondary tabular-nums">
                            {item.feedbackRating}/5 ★ ({item.interestLevel})
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* SCHEDULE WALKTHROUGH MODAL */}
      <Modal open={isScheduleModalOpen} onOpenChange={setIsScheduleModalOpen}>
        <ModalContent className="max-w-lg">
          <ModalHeader className="border-b border-border pb-3">
            <ModalTitle>Schedule VIP Walkthrough</ModalTitle>
            <ModalDescription>
              Book an experience center walkthrough with collision prevention and digital gate pass.
            </ModalDescription>
          </ModalHeader>

          <form onSubmit={handleBookAppointment} className="space-y-4 py-3 text-sm">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-meta font-medium text-text-secondary block mb-1">Client Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ananya Birla"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  className="w-full h-10 px-3 text-sm rounded-[8px] border border-border bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1"
                />
              </div>

              <div>
                <label className="text-meta font-medium text-text-secondary block mb-1">Phone Number *</label>
                <input
                  type="tel"
                  required
                  placeholder="+91 98000 00000"
                  value={clientPhone}
                  onChange={(e) => setClientPhone(e.target.value)}
                  className="w-full h-10 px-3 text-sm rounded-[8px] border border-border bg-surface text-text-primary tabular-nums focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-meta font-medium text-text-secondary block mb-1">Project / Development *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. The Crest Villas"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  className="w-full h-10 px-3 text-sm rounded-[8px] border border-border bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1"
                />
              </div>

              <div>
                <label className="text-meta font-medium text-text-secondary block mb-1">Appointment Date *</label>
                <input
                  type="date"
                  required
                  value={appointmentDate}
                  onChange={(e) => setAppointmentDate(e.target.value)}
                  className="w-full h-10 px-3 text-sm rounded-[8px] border border-border bg-surface text-text-primary tabular-nums focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1"
                />
              </div>
            </div>

            {/* Time Slot Availability Picker */}
            <div>
              <label className="text-meta font-medium text-text-secondary block mb-1">
                Select Available Walkthrough Slot *
              </label>
              {isLoadingSlots ? (
                <div className="text-meta text-text-muted py-2">
                  Checking calendar availability...
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  {availabilitySlots?.map((slot) => (
                    <button
                      key={slot.timeSlot}
                      type="button"
                      disabled={!slot.isAvailable}
                      onClick={() => setSelectedSlot(slot.timeSlot)}
                      className={`p-2 text-left text-sm rounded-[8px] border transition-all flex items-center justify-between tabular-nums ${
                        selectedSlot === slot.timeSlot
                          ? 'bg-primary text-white font-medium border-primary'
                          : slot.isAvailable
                            ? 'bg-white border-border text-text-primary hover:border-neutral-400'
                            : 'bg-neutral-100 border-neutral-200 text-text-muted cursor-not-allowed line-through'
                      }`}
                    >
                      <span>{slot.timeSlot}</span>
                      <span className="text-[11px]">
                        {slot.isAvailable ? 'Available' : 'Booked'}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="text-meta font-medium text-text-secondary block mb-1">
                Assigned Host Agent
              </label>
              <input
                type="text"
                placeholder="Senior Sales Advisor Name"
                value={assignedAgentName}
                onChange={(e) => setAssignedAgentName(e.target.value)}
                className="w-full h-10 px-3 text-sm rounded-[8px] border border-border bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1"
              />
            </div>

            <div>
              <label className="text-meta font-medium text-text-secondary block mb-1">
                Special Requests / Notes
              </label>
              <textarea
                rows={2}
                placeholder="Specific unit view preference, VIP car parking slot..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full p-3 text-sm rounded-[8px] border border-border bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1"
              />
            </div>

            <div className="flex justify-end space-x-2 pt-3 border-t border-border">
              <Button
                type="button"
                variant="outline"
                size="md"
                onClick={() => setIsScheduleModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="md"
                disabled={createAppointmentMutation.isPending || !selectedSlot}
              >
                {createAppointmentMutation.isPending ? 'Confirming...' : 'Confirm Walkthrough'}
              </Button>
            </div>
          </form>
        </ModalContent>
      </Modal>

      {/* FEEDBACK & COMPLETION MODAL */}
      <Modal
        open={Boolean(selectedForFeedback)}
        onOpenChange={(open) => !open && setSelectedForFeedback(null)}
      >
        {selectedForFeedback && (
          <ModalContent className="max-w-lg">
            <ModalHeader className="border-b border-border pb-3">
              <ModalTitle>Record Walkthrough Feedback</ModalTitle>
              <ModalDescription>
                {selectedForFeedback.leadName} &bull; {selectedForFeedback.projectName} &bull; Slot: {selectedForFeedback.timeSlot}
              </ModalDescription>
            </ModalHeader>

            <form onSubmit={handleFeedbackSubmit} className="space-y-4 py-3 text-sm">
              <div>
                <label className="text-meta font-medium text-text-secondary block mb-1">
                  Client Interest Rating (1-5) *
                </label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className={`p-2 border rounded-[6px] text-sm font-medium flex items-center space-x-1 transition-all ${
                        rating >= star
                          ? 'bg-primary text-white border-primary'
                          : 'bg-white text-text-secondary border-border hover:border-neutral-400'
                      }`}
                    >
                      <Star className="w-3.5 h-3.5 fill-current" />
                      <span>{star}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-meta font-medium text-text-secondary block mb-1">
                  Buying Intent Level *
                </label>
                <select
                  value={interestLevel}
                  onChange={(e) => setInterestLevel(e.target.value as 'HIGH' | 'MEDIUM' | 'LOW')}
                  className="w-full h-10 px-3 text-sm rounded-[8px] border border-border bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1"
                >
                  <option value="HIGH">HIGH (Imminent Buyer / Financing Ready)</option>
                  <option value="MEDIUM">MEDIUM (Comparing Competitor Projects)</option>
                  <option value="LOW">LOW (Casual Walkthrough / Early Discovery)</option>
                </select>
              </div>

              <div>
                <label className="text-meta font-medium text-text-secondary block mb-1">
                  Detailed Visitor Observations *
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Notes on layout feedback, pricing reaction, amenities discussed..."
                  value={feedbackNotes}
                  onChange={(e) => setFeedbackNotes(e.target.value)}
                  className="w-full p-3 text-sm rounded-[8px] border border-border bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 border-t border-border pt-3">
                <div>
                  <label className="text-meta font-medium text-text-secondary block mb-1">
                    Next Sales Task / Action *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Dispatch customized payment schedule"
                    value={nextAction}
                    onChange={(e) => setNextAction(e.target.value)}
                    className="w-full h-10 px-3 text-sm rounded-[8px] border border-border bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1"
                  />
                </div>

                <div>
                  <label className="text-meta font-medium text-text-secondary block mb-1">
                    Follow-up Due Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={nextActionDate}
                    onChange={(e) => setNextActionDate(e.target.value)}
                    className="w-full h-10 px-3 text-sm rounded-[8px] border border-border bg-surface text-text-primary tabular-nums focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-border">
                <Button
                  type="button"
                  variant="outline"
                  size="md"
                  onClick={() => setSelectedForFeedback(null)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  disabled={submitFeedbackMutation.isPending}
                >
                  {submitFeedbackMutation.isPending ? 'Completing...' : 'Complete Walkthrough'}
                </Button>
              </div>
            </form>
          </ModalContent>
        )}
      </Modal>
    </div>
  );
}
