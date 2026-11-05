import { Link } from 'react-router-dom';
import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '../lib/zodResolver';
import * as z from 'zod';
import {
  Building2,
  Plus,
  Search,
  Mail,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  ShieldAlert,
  ShieldCheck,
  User,
  Filter,
  Clapperboard,
} from 'lucide-react';
import axios from 'axios';
import { api } from '../lib/api';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { StatusBadge } from '../components/ui/StatusBadge';
import { PageHeader } from '../components/ui/PageHeader';
import { Card, CardContent } from '../components/ui/Card';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalDescription,
} from '../components/ui/Modal';
import { useToast } from '../components/ui/Toast';
import { formatDisplayDate } from '../lib/formatters';

const createOrgSchema = z.object({
  organizationName: z.string().min(2, 'Organization name must be at least 2 characters'),
  clientName: z.string().min(2, 'Client contact name must be at least 2 characters'),
  clientEmail: z.string().email('Please enter a valid work email address'),
});

type CreateOrgFormData = z.infer<typeof createOrgSchema>;

export interface AdminOrganization {
  id: string;
  name: string;
  slug: string;
  status: 'ACTIVE' | 'DISABLED';
  onboarding: {
    status: 'pending' | 'in_progress' | 'completed';
    currentStep: number;
    submittedAt?: string;
  };
  client?: {
    id: string;
    name?: string;
    fullName?: string;
    email: string;
    status: 'invited' | 'active' | 'disabled';
  } | null;
  createdAt: string;
}

export function AdminOrganizationsPage() {
  const [organizations, setOrganizations] = useState<AdminOrganization[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [onboardingFilter, setOnboardingFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Add Org Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Action Loading States
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    reset: resetForm,
    formState: { errors: formErrors },
  } = useForm<CreateOrgFormData>({
    resolver: zodResolver(createOrgSchema),
    defaultValues: {
      organizationName: '',
      clientName: '',
      clientEmail: '',
    },
  });

  const fetchOrganizations = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.get('/admin/organizations', {
        params: {
          search: searchQuery || undefined,
          status: statusFilter || undefined,
          onboardingStatus: onboardingFilter || undefined,
          page,
          limit: 10,
        },
      });

      const resData = response.data?.data;
      setOrganizations(resData?.organizations || []);
      setTotalPages(resData?.pagination?.pages || 1);
      setTotalCount(resData?.pagination?.total || 0);
    } catch (err: unknown) {
      let msg = 'Failed to load organization directory. Please check server connection.';
      if (axios.isAxiosError(err) && err.response?.data?.error?.message) {
        msg = err.response.data.error.message;
      }
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, statusFilter, onboardingFilter, page]);

  useEffect(() => {
    fetchOrganizations();
  }, [fetchOrganizations]);

  // Handle Add Organization Submit
  const handleCreateOrg = async (data: CreateOrgFormData) => {
    setIsCreating(true);
    setCreateError(null);
    try {
      await api.post('/admin/organizations', data);
      toast({
        title: 'Organization created',
        message: `Workspace "${data.organizationName}" registered and invite dispatched to ${data.clientEmail}`,
        type: 'success',
      });
      setIsModalOpen(false);
      resetForm();
      fetchOrganizations();
    } catch (err: unknown) {
      let msg = 'Failed to create organization.';
      if (axios.isAxiosError(err) && err.response?.data?.error?.message) {
        msg = err.response.data.error.message;
      }
      setCreateError(msg);
    } finally {
      setIsCreating(false);
    }
  };

  // Handle Resend Invite
  const handleResendInvite = async (org: AdminOrganization) => {
    if (!org.client) return;
    setActionLoadingId(`invite-${org.id}`);
    try {
      await api.post(`/admin/organizations/${org.id}/resend-invite`);
      toast({
        title: 'Invite re-sent',
        message: `Fresh activation link dispatched to ${org.client.email}`,
        type: 'success',
      });
    } catch (err: unknown) {
      let msg = 'Failed to resend invite.';
      if (axios.isAxiosError(err) && err.response?.data?.error?.message) {
        msg = err.response.data.error.message;
      }
      toast({
        title: 'Invite error',
        message: msg,
        type: 'error',
      });
    } finally {
      setActionLoadingId(null);
    }
  };

  // Handle Toggle Organization Status
  const handleToggleStatus = async (org: AdminOrganization) => {
    const nextStatus = org.status === 'ACTIVE' ? 'DISABLED' : 'ACTIVE';
    setActionLoadingId(`status-${org.id}`);
    try {
      await api.patch(`/admin/organizations/${org.id}/status`, { status: nextStatus });
      toast({
        title: 'Status updated',
        message: `Organization "${org.name}" status changed to ${nextStatus}`,
        type: 'success',
      });
      fetchOrganizations();
    } catch (err: unknown) {
      let msg = 'Failed to update organization status.';
      if (axios.isAxiosError(err) && err.response?.data?.error?.message) {
        msg = err.response.data.error.message;
      }
      toast({
        title: 'Update failed',
        message: msg,
        type: 'error',
      });
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <PageHeader
        title="Platform admin console"
        description="Supervise agency tenant organizations, client onboarding lifecycles, and invitation tokens."
        actions={
          <div className="flex items-center gap-2">
          <Link to="/admin/video-lab">
            <Button variant="secondary" size="sm" leftIcon={<Clapperboard className="w-4 h-4" />}>
              Video Lab
            </Button>
          </Link>
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              setCreateError(null);
              resetForm();
              setIsModalOpen(true);
            }}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Add organization
          </Button>
          </div>
        }
      />

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-5 space-y-1">
            <span className="text-[12px] font-medium text-[#737373] block">
              Total client workspaces
            </span>
            <span className="text-[24px] font-semibold text-[#0A0A0A] tabular-nums block">
              {totalCount}
            </span>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 space-y-1">
            <span className="text-[12px] font-medium text-[#737373] block">
              Completed onboarding
            </span>
            <span className="text-[24px] font-semibold text-[#15803D] tabular-nums block">
              {organizations.filter((o) => o.onboarding?.status === 'completed').length}
            </span>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 space-y-1">
            <span className="text-[12px] font-medium text-[#737373] block">
              Pending / in progress
            </span>
            <span className="text-[24px] font-semibold text-[#B45309] tabular-nums block">
              {organizations.filter((o) => o.onboarding?.status !== 'completed').length}
            </span>
          </CardContent>
        </Card>
      </div>

      {/* Search & Filters Bar */}
      <div className="border border-[#E5E5E5] bg-white rounded-[10px] p-3 flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between shadow-card">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-[#737373] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(1);
            }}
            placeholder="Search by organization name or email..."
            className="w-full pl-9 pr-3 py-2 text-[13px] border border-[#E5E5E5] rounded-[8px] bg-white placeholder:text-[#737373] focus:outline-none focus:ring-2 focus:ring-[#0A0A0A]"
          />
        </div>

        <div className="flex items-center space-x-2">
          <Filter className="w-3.5 h-3.5 text-[#737373] hidden sm:inline" />
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="text-[13px] border border-[#E5E5E5] rounded-[8px] bg-white py-2 px-3 focus:outline-none focus:ring-2 focus:ring-[#0A0A0A]"
          >
            <option value="">All statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="DISABLED">Disabled</option>
          </select>

          <select
            value={onboardingFilter}
            onChange={(e) => {
              setOnboardingFilter(e.target.value);
              setPage(1);
            }}
            className="text-[13px] border border-[#E5E5E5] rounded-[8px] bg-white py-2 px-3 focus:outline-none focus:ring-2 focus:ring-[#0A0A0A]"
          >
            <option value="">All onboarding</option>
            <option value="completed">Completed</option>
            <option value="in_progress">In progress</option>
            <option value="pending">Pending</option>
          </select>

          <Button
            variant="secondary"
            size="sm"
            onClick={fetchOrganizations}
            disabled={isLoading}
            title="Refresh directory"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="border border-[#FEE2E2] bg-[#FEF2F2] rounded-[8px] p-4 flex items-center justify-between text-[13px] text-[#B91C1C]">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 text-[#B91C1C] shrink-0" />
            <span>{error}</span>
          </div>
          <Button variant="secondary" size="sm" onClick={fetchOrganizations}>
            Retry
          </Button>
        </div>
      )}

      {/* Directory Table */}
      <div className="border border-[#E5E5E5] rounded-[10px] overflow-hidden bg-white shadow-card">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[14px]">
            <thead className="bg-[#FAFAFA] text-[#737373] text-[12px] font-medium border-b border-[#E5E5E5]">
              <tr>
                <th className="py-3.5 px-4">Organization</th>
                <th className="py-3.5 px-4">Client contact</th>
                <th className="py-3.5 px-4">Onboarding</th>
                <th className="py-3.5 px-4">Account status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E5E5]">
              {isLoading && organizations.length === 0 ? (
                Array.from({ length: 4 }).map((_, idx) => (
                  <tr key={idx} className="animate-pulse h-12">
                    <td className="py-4 px-4">
                      <div className="h-4 bg-[#F5F5F5] rounded w-36 mb-1"></div>
                      <div className="h-3 bg-[#F5F5F5] rounded w-24"></div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="h-4 bg-[#F5F5F5] rounded w-32 mb-1"></div>
                      <div className="h-3 bg-[#F5F5F5] rounded w-44"></div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="h-5 bg-[#F5F5F5] rounded w-20"></div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="h-5 bg-[#F5F5F5] rounded w-16"></div>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <div className="h-6 bg-[#F5F5F5] rounded w-24 ml-auto"></div>
                    </td>
                  </tr>
                ))
              ) : organizations.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-[#737373]">
                    <Building2 className="w-8 h-8 mx-auto text-[#737373] mb-2" />
                    <p className="font-semibold text-[15px] text-[#0A0A0A]">
                      No organizations found
                    </p>
                    <p className="text-[13px] text-[#525252] mt-1 max-w-sm mx-auto">
                      {searchQuery || statusFilter || onboardingFilter
                        ? 'No organizations match your current search and filter criteria.'
                        : 'Get started by creating your first agency organization using the button above.'}
                    </p>
                  </td>
                </tr>
              ) : (
                organizations.map((org) => {
                  const isOnboardingDone = org.onboarding?.status === 'completed';
                  const isOrgActive = org.status === 'ACTIVE';
                  const isInvited = org.client?.status === 'invited';
                  const isClientActive = org.client?.status === 'active';

                  return (
                    <tr key={org.id} className="hover:bg-[#F5F5F5] transition-colors h-14">
                      {/* Org Info */}
                      <td className="py-3 px-4">
                        <div className="font-semibold text-[#0A0A0A]">{org.name}</div>
                        <div className="text-[12px] text-[#737373]">
                          <span className="font-mono">/{org.slug}</span> &bull;{' '}
                          {org.createdAt ? formatDisplayDate(org.createdAt) : 'Active'}
                        </div>
                      </td>

                      {/* Client Info */}
                      <td className="py-3 px-4">
                        <div className="font-medium text-[#0A0A0A] flex items-center space-x-1.5">
                          <User className="w-3.5 h-3.5 text-[#737373]" />
                          <span>{org.client?.fullName || org.client?.name || 'Unassigned'}</span>
                        </div>
                        <div className="flex flex-wrap items-center gap-1.5 text-[12px] text-[#525252] mt-0.5">
                          <span>{org.client?.email || 'N/A'}</span>
                          {isInvited && (
                            <StatusBadge status="PENDING" label="Invite pending" />
                          )}
                          {isClientActive && (
                            <StatusBadge status="ACTIVE" label="Password set" />
                          )}
                        </div>
                      </td>

                      {/* Onboarding Status */}
                      <td className="py-3 px-4">
                        {isOnboardingDone ? (
                          <StatusBadge status="ACTIVE" label="Completed" />
                        ) : org.onboarding?.status === 'in_progress' ? (
                          <StatusBadge status="PENDING" label={`Step ${org.onboarding?.currentStep || 1}/4`} />
                        ) : (
                          <StatusBadge status="DRAFT" label="Pending" />
                        )}
                      </td>

                      {/* Account & Org Status */}
                      <td className="py-3 px-4">
                        <StatusBadge status={org.status} />
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          {/* Resend Invite Button */}
                          {isClientActive ? (
                            <span className="text-[12px] text-[#15803D] flex items-center">
                              <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-[#15803D]" />
                              Activated
                            </span>
                          ) : (
                            <Button
                              variant="secondary"
                              size="sm"
                              disabled={actionLoadingId === `invite-${org.id}` || !org.client}
                              onClick={() => handleResendInvite(org)}
                              title="Resend activation invite email"
                            >
                              <Mail className="w-3.5 h-3.5 mr-1" />
                              {actionLoadingId === `invite-${org.id}` ? 'Sending...' : 'Resend invite'}
                            </Button>
                          )}

                          {/* Enable/Disable Toggle */}
                          <Button
                            variant="secondary"
                            size="sm"
                            disabled={actionLoadingId === `status-${org.id}`}
                            onClick={() => handleToggleStatus(org)}
                            title={isOrgActive ? 'Disable organization access' : 'Reactivate organization'}
                          >
                            {isOrgActive ? (
                              <>
                                <ShieldAlert className="w-3.5 h-3.5 mr-1 text-[#B91C1C]" />
                                Disable
                              </>
                            ) : (
                              <>
                                <ShieldCheck className="w-3.5 h-3.5 mr-1 text-[#15803D]" />
                                Enable
                              </>
                            )}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="p-3.5 border-t border-[#E5E5E5] bg-[#FAFAFA] flex items-center justify-between text-[13px]">
            <span className="text-[#737373]">
              Page {page} of {totalPages} ({totalCount} total)
            </span>
            <div className="space-x-1">
              <Button
                variant="secondary"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(p - 1, 1))}
              >
                Previous
              </Button>
              <Button
                variant="secondary"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Add Organization Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <ModalContent className="max-w-md">
          <ModalHeader>
            <div className="flex items-center space-x-2">
              <Building2 className="w-5 h-5 text-[#0A0A0A]" />
              <ModalTitle className="text-[18px] font-semibold text-[#0A0A0A]">
                Register client organization
              </ModalTitle>
            </div>
            <ModalDescription className="text-[13px] text-[#525252]">
              Create a new tenant workspace and generate a 48-hour client invitation link.
            </ModalDescription>
          </ModalHeader>

          {createError && (
            <div className="border border-[#FEE2E2] bg-[#FEF2F2] rounded-[8px] p-3 text-[13px] text-[#B91C1C] flex items-start space-x-2">
              <AlertTriangle className="w-4 h-4 text-[#B91C1C] shrink-0 mt-0.5" />
              <span>{createError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit(handleCreateOrg)} className="space-y-4 text-left p-6 pt-2">
            <div>
              <Input
                label="Organization or agency name"
                placeholder="e.g. Prestige Signature Realty"
                error={formErrors.organizationName?.message}
                {...register('organizationName')}
              />
            </div>

            <div>
              <Input
                label="Client contact full name"
                placeholder="e.g. Priya Nambiar"
                error={formErrors.clientName?.message}
                {...register('clientName')}
              />
            </div>

            <div>
              <Input
                label="Client work email"
                type="email"
                placeholder="director@prestigerealty.in"
                error={formErrors.clientEmail?.message}
                {...register('clientEmail')}
              />
              <span className="text-[12px] text-[#737373] mt-1 block">
                An invitation with single-use activation token will be sent to this address.
              </span>
            </div>

            <div className="pt-4 flex items-center justify-end space-x-2 border-t border-[#E5E5E5]">
              <Button
                type="button"
                variant="secondary"
                size="md"
                onClick={() => setIsModalOpen(false)}
                disabled={isCreating}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="md"
                isLoading={isCreating}
                disabled={isCreating}
              >
                Create &amp; send invite
              </Button>
            </div>
          </form>
        </ModalContent>
      </Modal>
    </div>
  );
}
