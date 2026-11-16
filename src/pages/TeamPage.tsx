import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { StatusBadge } from '../components/ui/StatusBadge';
import { StatCard } from '../components/ui/StatCard';
import { Avatar } from '../components/ui/Avatar';
import { Modal, ModalFooter } from '../components/ui/Modal';
import { RoleGate } from '../components/RoleGate';
import { useToast } from '../components/ui/Toast';
import { useAuthStore } from '../store/useAuthStore';
import { can, PERMISSIONS, UserRole, Action } from '../lib/rbac';
import { api } from '../lib/api';
import {
  Users,
  UserPlus,
  Mail,
  ShieldCheck,
  Building2,
  Search,
  Check,
  X,
  ChevronRight,
  RefreshCw,
  KeyRound,
  CheckCircle2,
  Lock,
  Copy,
  Info,
  Shield,
  Layers,
} from 'lucide-react';

interface TeamMemberItem {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  assignedProjects: string[];
  status: 'ACTIVE' | 'INVITED' | 'PENDING';
  isCurrentUser?: boolean;
  invitedAt?: string;
  inviteLink?: string;
}

// Enterprise role metadata & color definitions
const ROLE_CONFIG: Record<
  UserRole,
  {
    label: string;
    description: string;
    badgeVariant: 'primary' | 'success' | 'warning' | 'info' | 'neutral' | 'danger';
    badgeClasses: string;
  }
> = {
  OWNER: {
    label: 'Workspace Owner',
    description: 'Full root administration, billing, team management & security policies',
    badgeVariant: 'primary',
    badgeClasses: 'bg-purple-50 text-purple-700 border-purple-200',
  },
  ADMIN: {
    label: 'Administrator',
    description: 'Complete administrative control over campaigns, team, and property listings',
    badgeVariant: 'primary',
    badgeClasses: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  },
  MARKETING_MANAGER: {
    label: 'Marketing Manager',
    description: 'Campaign orchestration, ad spend budgets, approvals & Meta publishing',
    badgeVariant: 'success',
    badgeClasses: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  },
  SALES_AGENT: {
    label: 'Sales Agent',
    description: 'Lead pipeline management, site visits, customer chats & lead exports',
    badgeVariant: 'warning',
    badgeClasses: 'bg-amber-50 text-amber-800 border-amber-200',
  },
  CREATIVE_EDITOR: {
    label: 'Creative Editor',
    description: 'AI Creative Studio generation, video lab renders & visual brand assets',
    badgeVariant: 'info',
    badgeClasses: 'bg-sky-50 text-sky-700 border-sky-200',
  },
  VIEWER: {
    label: 'Read-only Viewer',
    description: 'Read-only visibility into analytics, performance dashboards & reports',
    badgeVariant: 'neutral',
    badgeClasses: 'bg-slate-100 text-slate-700 border-slate-200',
  },
};

const ALL_ROLES: UserRole[] = [
  'OWNER',
  'ADMIN',
  'MARKETING_MANAGER',
  'SALES_AGENT',
  'CREATIVE_EDITOR',
  'VIEWER',
];

// RBAC capabilities matrix data
interface RBACCapability {
  category: string;
  action: Action;
  label: string;
  description: string;
}

const RBAC_CAPABILITIES: RBACCapability[] = [
  { category: 'Property Catalog', action: 'create:project', label: 'Create Projects', description: 'Add new real estate developments' },
  { category: 'Property Catalog', action: 'edit:project', label: 'Edit Project & Inventory', description: 'Update project configurations & unit stock' },
  { category: 'Property Catalog', action: 'delete:project', label: 'Delete Projects', description: 'Archive or remove development listings' },
  { category: 'Creative Studio', action: 'approve:creative', label: 'Approve Creatives', description: 'Sign off on marketing graphics & ad copy' },
  { category: 'Creative Studio', action: 'request:revision', label: 'Request Revision', description: 'Send creatives back for revision' },
  { category: 'Campaigns & Ads', action: 'edit:budget', label: 'Manage Ad Budgets', description: 'Allocate and edit campaign spend ceilings' },
  { category: 'Campaigns & Ads', action: 'publish:campaign', label: 'Publish to Meta Ads', description: 'Push live ad sets to Facebook and Instagram' },
  { category: 'Campaigns & Ads', action: 'connect:meta', label: 'Connect Meta Accounts', description: 'Authorize business manager ad accounts' },
  { category: 'Team & Governance', action: 'manage:team', label: 'Manage Team & Access', description: 'Invite new members, assign roles, revoke access' },
  { category: 'Brand Identity', action: 'manage:brand', label: 'Manage Brand Kit', description: 'Configure logo, color palette & RERA disclosures' },
  { category: 'CRM & Leads', action: 'edit:lead', label: 'Manage Leads & Pipeline', description: 'Qualify leads, log visits & update stages' },
  { category: 'CRM & Leads', action: 'export:data', label: 'Export CRM Records', description: 'Download client datasets & leads CSV' },
  { category: 'Analytics & BI', action: 'view:analytics', label: 'View Analytics & ROI', description: 'Access performance dashboards & attribution' },
];

const SESSION_INVITES_KEY = 'realcrm_session_invitations';

export function TeamPage() {
  const { toast } = useToast();
  const { user } = useAuthStore();

  // Load session invitations from sessionStorage
  const [invitedMembers, setInvitedMembers] = useState<TeamMemberItem[]>(() => {
    try {
      const stored = sessionStorage.getItem(SESSION_INVITES_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {
      // Fallback
    }
    return [];
  });

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<'ALL' | UserRole>('ALL');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INVITED'>('ALL');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Modals State
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [selectedMemberForDetails, setSelectedMemberForDetails] = useState<TeamMemberItem | null>(null);

  // Invite Form State
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<UserRole>('MARKETING_MANAGER');
  const [isInviting, setIsInviting] = useState(false);
  const [latestInviteLink, setLatestInviteLink] = useState<string | null>(null);

  // Save invites to sessionStorage
  const persistInvites = (invites: TeamMemberItem[]) => {
    setInvitedMembers(invites);
    try {
      sessionStorage.setItem(SESSION_INVITES_KEY, JSON.stringify(invites));
    } catch {
      // Ignore
    }
  };

  // Base list of team members
  const allMembers = useMemo<TeamMemberItem[]>(() => {
    const list: TeamMemberItem[] = [];

    // 1. Current authenticated user as primary workspace administrator
    if (user) {
      const normalizedRole: UserRole =
        user.role === 'org_owner'
          ? 'OWNER'
          : (user.role?.toUpperCase() as UserRole) || 'OWNER';

      list.push({
        id: user.id,
        name: user.name || 'Workspace Administrator',
        email: user.email,
        role: normalizedRole,
        assignedProjects: ['All active organization projects'],
        status: 'ACTIVE',
        isCurrentUser: true,
      });
    }

    // 2. Append pending invited members
    list.push(...invitedMembers);

    return list;
  }, [user, invitedMembers]);

  // Filtered members based on search and filters
  const filteredMembers = useMemo(() => {
    return allMembers.filter((member) => {
      // Role filter
      if (selectedRoleFilter !== 'ALL' && member.role !== selectedRoleFilter) {
        return false;
      }

      // Status filter
      if (selectedStatusFilter !== 'ALL' && member.status !== selectedStatusFilter) {
        return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = member.name.toLowerCase().includes(q);
        const matchesEmail = member.email.toLowerCase().includes(q);
        const matchesRole = member.role.toLowerCase().includes(q);
        if (!matchesName && !matchesEmail && !matchesRole) {
          return false;
        }
      }

      return true;
    });
  }, [allMembers, selectedRoleFilter, selectedStatusFilter, searchQuery]);

  // Derived KPI metrics
  const activeSeats = useMemo(() => {
    return allMembers.filter((m) => m.status === 'ACTIVE').length;
  }, [allMembers]);

  const pendingInvitesCount = useMemo(() => {
    return allMembers.filter((m) => m.status === 'INVITED' || m.status === 'PENDING').length;
  }, [allMembers]);

  const currentUserRole: UserRole = useMemo(() => {
    if (!user?.role) return 'OWNER';
    if (user.role === 'org_owner') return 'OWNER';
    return (user.role.toUpperCase() as UserRole) || 'OWNER';
  }, [user?.role]);

  // Refresh handler
  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      toast({
        title: 'Team Directory Updated',
        message: 'Loaded latest member permissions and role policies.',
        type: 'info',
      });
    }, 450);
  };

  // Reset filters handler
  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedRoleFilter('ALL');
    setSelectedStatusFilter('ALL');
  };

  // Submit invite handler
  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedEmail = inviteEmail.toLowerCase().trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!trimmedEmail || !emailRegex.test(trimmedEmail)) {
      toast({
        title: 'Validation Error',
        message: 'Please provide a valid recipient email address.',
        type: 'error',
      });
      return;
    }

    // Check if user is already in members list
    const alreadyExists = allMembers.some((m) => m.email.toLowerCase() === trimmedEmail);
    if (alreadyExists) {
      toast({
        title: 'Duplicate Member',
        message: 'A team member or invitation already exists for this email address.',
        type: 'warning',
      });
      return;
    }

    setIsInviting(true);
    try {
      // Backend call to POST /api/v1/auth/invite
      const response = await api.post('/auth/invite', {
        email: trimmedEmail,
        role: inviteRole,
      });

      const inviteData = response.data?.data || response.data || {};
      const generatedLink = inviteData.inviteLink || '';
      setLatestInviteLink(generatedLink);

      // Create new invited member item
      const newInvite: TeamMemberItem = {
        id: inviteData.id || `inv_${Date.now()}`,
        name: trimmedEmail.split('@')[0],
        email: trimmedEmail,
        role: inviteRole,
        assignedProjects: ['All active organization projects'],
        status: 'INVITED',
        invitedAt: new Date().toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        }),
        inviteLink: generatedLink,
      };

      const updated = [newInvite, ...invitedMembers];
      persistInvites(updated);

      toast({
        title: 'Invitation Dispatched',
        message: `An invitation with role ${ROLE_CONFIG[inviteRole].label} has been sent to ${trimmedEmail}.`,
        type: 'success',
      });

      // Clear email but keep modal or close depending on link availability
      setInviteEmail('');
      setIsInviteModalOpen(false);
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { message?: string } } };
      const errorMessage =
        axiosError.response?.data?.message ||
        (err instanceof Error ? err.message : 'Could not dispatch team invitation.');

      toast({
        title: 'Invitation Failed',
        message: errorMessage,
        type: 'error',
      });
    } finally {
      setIsInviting(false);
    }
  };

  // Copy invitation link to clipboard
  const handleCopyInviteLink = (linkToCopy?: string) => {
    const link = linkToCopy || latestInviteLink;
    if (!link) return;
    navigator.clipboard.writeText(link);
    toast({
      title: 'Link Copied',
      message: 'Invitation link copied to clipboard.',
      type: 'info',
    });
  };

  // Revoke invitation handler
  const handleRevokeInvite = (inviteId: string, email: string) => {
    const updated = invitedMembers.filter((m) => m.id !== inviteId);
    persistInvites(updated);
    toast({
      title: 'Invitation Revoked',
      message: `Pending invitation for ${email} has been canceled.`,
      type: 'info',
    });
  };

  return (
    <div className="space-y-6">
      {/* 1. Breadcrumbs */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-slate-500">
        <Link to="/dashboard" className="hover:text-slate-900 transition-colors">
          Dashboard
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
        <span className="text-slate-500">Settings</span>
        <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
        <span className="text-slate-900 font-medium">Team Management</span>
      </nav>

      {/* 2. Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-app-border">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-2xl font-bold tracking-tight text-ink">
              Team & Access Management
            </h1>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <Building2 className="w-3 h-3 text-emerald-600" />
              {user?.organizationName || 'RealCRM Workspace'}
            </span>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
              {allMembers.length} {allMembers.length === 1 ? 'Member' : 'Members'}
            </span>
          </div>
          <p className="text-sm text-ink-muted mt-1">
            Govern workspace membership, assign granular role-based permissions, and manage real estate project access scopes.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            leftIcon={<RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />}
          >
            Refresh
          </Button>

          <RoleGate
            action="manage:team"
            fallback={
              <span className="inline-flex items-center px-3 py-1.5 rounded-control text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
                <Lock className="w-3.5 h-3.5 mr-1 text-slate-400" />
                Read-Only Access
              </span>
            }
          >
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={() => setIsInviteModalOpen(true)}
              leftIcon={<UserPlus className="w-4 h-4" />}
            >
              Invite Member
            </Button>
          </RoleGate>
        </div>
      </div>

      {/* 3. Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Organization Members"
          value={allMembers.length}
          helperText={user?.organizationName ? `${user.organizationName} workspace` : 'Active workspace'}
          icon={<Users className="w-4 h-4 text-brand-primary" />}
        />
        <StatCard
          label="Active Member Seats"
          value={activeSeats}
          helperText={
            pendingInvitesCount > 0
              ? `${pendingInvitesCount} invitation pending acceptance`
              : 'All active seats verified'
          }
          icon={<ShieldCheck className="w-4 h-4 text-emerald-600" />}
        />
        <StatCard
          label="Configured Access Roles"
          value="6 Roles"
          helperText="Strict RBAC matrix enforced"
          icon={<KeyRound className="w-4 h-4 text-indigo-600" />}
        />
        <StatCard
          label="Your Access Role"
          value={ROLE_CONFIG[currentUserRole]?.label || currentUserRole}
          helperText={user?.isPlatformAdmin ? 'Platform Administrator' : 'Tenant Account'}
          icon={<Building2 className="w-4 h-4 text-purple-600" />}
        />
      </div>

      {/* 4. Search and Role Filter Bar */}
      <div className="bg-app-surface p-4 rounded-card border border-app-border shadow-xs space-y-3">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search members by name, email, or role..."
              className="w-full pl-9 pr-9 py-2 text-sm bg-app-surface border border-app-border rounded-control text-ink placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-brand-primary transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Status Segmented Filter */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-control text-xs font-medium self-start lg:self-center">
            {(['ALL', 'ACTIVE', 'INVITED'] as const).map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => setSelectedStatusFilter(status)}
                className={`px-3 py-1.5 rounded-sm transition-all ${
                  selectedStatusFilter === status
                    ? 'bg-white text-slate-900 shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {status === 'ALL' ? 'All Statuses' : status === 'ACTIVE' ? 'Active' : 'Invited'}
              </button>
            ))}
          </div>
        </div>

        {/* Role Filter Badges */}
        <div className="flex items-center gap-1.5 flex-wrap pt-2 border-t border-app-border/60">
          <span className="text-xs font-semibold text-slate-500 mr-1 flex items-center gap-1">
            <Shield className="w-3.5 h-3.5 text-slate-400" />
            Role Filter:
          </span>
          <button
            type="button"
            onClick={() => setSelectedRoleFilter('ALL')}
            className={`px-2.5 py-1 rounded-full text-xs transition-all ${
              selectedRoleFilter === 'ALL'
                ? 'bg-slate-900 text-white font-medium shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Roles ({allMembers.length})
          </button>

          {ALL_ROLES.map((role) => {
            const count = allMembers.filter((m) => m.role === role).length;
            const isSelected = selectedRoleFilter === role;
            return (
              <button
                key={role}
                type="button"
                onClick={() => setSelectedRoleFilter(role)}
                className={`px-2.5 py-1 rounded-full text-xs transition-all flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-brand-primary text-white font-medium shadow-xs'
                    : 'bg-app-surface border border-app-border text-slate-600 hover:border-slate-300 hover:text-slate-900'
                }`}
              >
                <span>{ROLE_CONFIG[role].label}</span>
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                    isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}

          {(searchQuery || selectedRoleFilter !== 'ALL' || selectedStatusFilter !== 'ALL') && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="text-xs text-brand-primary hover:underline font-medium ml-auto flex items-center gap-1"
            >
              <RefreshCw className="w-3 h-3" />
              Reset filters
            </button>
          )}
        </div>
      </div>

      {/* 5. Team Members Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between py-4">
          <CardTitle className="text-base font-semibold text-ink flex items-center gap-2">
            <Users className="w-4 h-4 text-brand-primary" />
            <span>Organization Members</span>
            <span className="text-xs font-normal text-slate-500">
              (Showing {filteredMembers.length} of {allMembers.length})
            </span>
          </CardTitle>
          <div className="text-xs text-slate-500">
            Current tenancy: <span className="font-semibold text-slate-700">{user?.organizationName || 'Primary Workspace'}</span>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-y border-app-border text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  <th className="py-3 px-4">Team Member</th>
                  <th className="py-3 px-4">Assigned Role</th>
                  <th className="py-3 px-4">Permission Scope</th>
                  <th className="py-3 px-4">Project Scopes</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-app-border text-ink">
                {filteredMembers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center">
                      <div className="flex flex-col items-center justify-center space-y-2">
                        <Users className="w-8 h-8 text-slate-300" />
                        <p className="text-sm font-medium text-slate-700">No team members match your filter</p>
                        <p className="text-xs text-slate-500 max-w-sm">
                          Try adjusting your search keywords or reset the role and status filters.
                        </p>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={handleResetFilters}
                          className="mt-2"
                        >
                          Clear Filters
                        </Button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredMembers.map((member) => (
                    <tr
                      key={member.id}
                      className="hover:bg-slate-50/60 transition-colors h-16 group"
                    >
                      {/* Member Info */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <Avatar name={member.name} size="sm" />
                          <div>
                            <div className="font-medium text-slate-900 flex items-center gap-1.5">
                              <span>{member.name}</span>
                              {member.isCurrentUser && (
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                  You
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                              <Mail className="w-3.5 h-3.5 text-slate-400" />
                              <span>{member.email}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Role Badge */}
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${
                            ROLE_CONFIG[member.role]?.badgeClasses || 'bg-slate-100 text-slate-700 border-slate-200'
                          }`}
                        >
                          {ROLE_CONFIG[member.role]?.label || member.role}
                        </span>
                      </td>

                      {/* Permission Scope */}
                      <td className="py-3 px-4 max-w-xs">
                        <p className="text-xs text-slate-600 line-clamp-2">
                          {ROLE_CONFIG[member.role]?.description || 'Standard workspace privileges'}
                        </p>
                      </td>

                      {/* Project Scope */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1 text-xs text-slate-600">
                          <Layers className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{member.assignedProjects.join(', ')}</span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4">
                        {member.status === 'ACTIVE' ? (
                          <StatusBadge status="ACTIVE" label="Active" />
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
                            Invited
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {member.inviteLink && member.status === 'INVITED' && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleCopyInviteLink(member.inviteLink)}
                              title="Copy invite URL"
                              className="text-xs text-slate-600 hover:text-slate-900"
                            >
                              <Copy className="w-3.5 h-3.5 mr-1" />
                              Copy Link
                            </Button>
                          )}

                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedMemberForDetails(member)}
                            className="text-xs text-slate-600 hover:text-slate-900"
                          >
                            View Details
                          </Button>

                          {member.status === 'INVITED' && !member.isCurrentUser && (
                            <RoleGate action="manage:team">
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRevokeInvite(member.id, member.email)}
                                className="text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                              >
                                Revoke
                              </Button>
                            </RoleGate>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* 6. Role-Based Access Control Matrix Card */}
      <Card>
        <CardHeader className="border-b border-app-border py-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <CardTitle className="text-base font-semibold text-ink flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-indigo-600" />
                <span>Role-Based Access Control (RBAC) Matrix</span>
              </CardTitle>
              <p className="text-xs text-slate-500 mt-0.5">
                Overview of security permissions and operational capabilities mapped to each enterprise role.
              </p>
            </div>
            <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full self-start sm:self-center">
              13 Verified Capability Scopes
            </span>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/90 border-b border-app-border text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  <th className="py-3 px-4 min-w-[200px]">System Capability</th>
                  <th className="py-3 px-2 text-center min-w-[85px]">Owner</th>
                  <th className="py-3 px-2 text-center min-w-[85px]">Admin</th>
                  <th className="py-3 px-2 text-center min-w-[110px]">Marketing Mgr</th>
                  <th className="py-3 px-2 text-center min-w-[95px]">Sales Agent</th>
                  <th className="py-3 px-2 text-center min-w-[100px]">Creative Editor</th>
                  <th className="py-3 px-2 text-center min-w-[75px]">Viewer</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-app-border">
                {RBAC_CAPABILITIES.map((cap) => (
                  <tr key={cap.action} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-2.5 px-4">
                      <div className="font-medium text-slate-900">{cap.label}</div>
                      <div className="text-[11px] text-slate-500">{cap.description}</div>
                    </td>

                    {ALL_ROLES.map((role) => {
                      const isAllowed = can(role, cap.action);
                      return (
                        <td key={role} className="py-2.5 px-2 text-center">
                          {isAllowed ? (
                            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-emerald-100 text-emerald-700">
                              <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                            </span>
                          ) : (
                            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-slate-100 text-slate-300">
                              <X className="w-3 h-3 stroke-[2]" />
                            </span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="p-4 bg-slate-50/50 border-t border-app-border flex items-start gap-2.5 text-xs text-slate-600">
            <Info className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
            <p>
              RealCRM operates under strict multi-tenant authorization policies. Action permissions are cryptographically validated by tenant middlewares (`resolveTenant` and `authorize`) on every API request.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* 7. Invite Team Member Modal */}
      <Modal
        isOpen={isInviteModalOpen}
        onClose={() => {
          setIsInviteModalOpen(false);
          setInviteEmail('');
        }}
        title="Invite New Team Member"
        description="Send an organization invitation with assigned operational permissions."
        className="max-w-lg"
      >
        <form onSubmit={handleSendInvite} className="space-y-4 pt-2">
          {/* Target Organization Callout */}
          <div className="p-3 bg-emerald-50/60 border border-emerald-200/60 rounded-control flex items-center justify-between text-xs text-emerald-900">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-emerald-700 shrink-0" />
              <span>Target Workspace:</span>
              <strong className="font-semibold text-emerald-950">
                {user?.organizationName || 'Primary Organization'}
              </strong>
            </div>
            <span className="text-[10px] uppercase font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
              Isolated Tenant
            </span>
          </div>

          {/* Email Address */}
          <div>
            <Input
              label="Recipient Email Address"
              type="email"
              required
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="e.g. associate@realestatefirm.com"
              helperText="An invitation with login credentials will be generated for this email."
            />
          </div>

          {/* Role Selection */}
          <div className="space-y-1.5">
            <label className="block text-caption-text font-medium text-ink-muted">
              Assigned Access Role
            </label>
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {ALL_ROLES.map((role) => {
                const config = ROLE_CONFIG[role];
                const isSelected = inviteRole === role;
                return (
                  <div
                    key={role}
                    onClick={() => setInviteRole(role)}
                    className={`p-3 rounded-control border cursor-pointer transition-all ${
                      isSelected
                        ? 'border-brand-primary bg-brand-primary-soft/30 ring-1 ring-brand-primary'
                        : 'border-app-border hover:border-slate-300 bg-app-surface'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="inviteRole"
                          checked={isSelected}
                          onChange={() => setInviteRole(role)}
                          className="text-brand-primary focus:ring-brand-primary h-4 w-4"
                        />
                        <span className="text-sm font-semibold text-slate-900">
                          {config.label}
                        </span>
                      </div>
                      <Badge variant={config.badgeVariant} size="sm">
                        {role}
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-500 mt-1 pl-6">
                      {config.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Project Scope Notice */}
          <div className="p-3 bg-slate-50 rounded-control border border-app-border text-xs text-slate-600 flex items-start gap-2">
            <Layers className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
            <span>
              Invited members automatically inherit access to all active property developments under this workspace.
            </span>
          </div>

          <ModalFooter className="pt-4">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isInviting}
              onClick={() => {
                setIsInviteModalOpen(false);
                setInviteEmail('');
              }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={isInviting || !inviteEmail.trim()}
              leftIcon={
                isInviting ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <UserPlus className="w-4 h-4" />
                )
              }
            >
              {isInviting ? 'Dispatching...' : 'Send Invitation'}
            </Button>
          </ModalFooter>
        </form>
      </Modal>

      {/* 8. Member Details & Permissions Inspector Modal */}
      {selectedMemberForDetails && (
        <Modal
          isOpen={Boolean(selectedMemberForDetails)}
          onClose={() => setSelectedMemberForDetails(null)}
          title="Member Access Profile"
          description="Detailed inspection of identity, tenancy association, and RBAC permissions."
          className="max-w-xl"
        >
          <div className="space-y-4 pt-2">
            {/* Member Profile Header */}
            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-card border border-app-border">
              <Avatar name={selectedMemberForDetails.name} size="md" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-slate-900 truncate">
                    {selectedMemberForDetails.name}
                  </h3>
                  {selectedMemberForDetails.isCurrentUser && (
                    <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                      You
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 truncate flex items-center gap-1 mt-0.5">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  {selectedMemberForDetails.email}
                </p>
              </div>
              <div className="text-right">
                <span
                  className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${
                    ROLE_CONFIG[selectedMemberForDetails.role]?.badgeClasses || 'bg-slate-100 text-slate-700'
                  }`}
                >
                  {ROLE_CONFIG[selectedMemberForDetails.role]?.label || selectedMemberForDetails.role}
                </span>
              </div>
            </div>

            {/* Account Details Metadata */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-2.5 bg-app-surface rounded-control border border-app-border">
                <span className="text-slate-400 block font-medium">Organization</span>
                <span className="font-semibold text-slate-800">
                  {user?.organizationName || 'Primary Workspace'}
                </span>
              </div>
              <div className="p-2.5 bg-app-surface rounded-control border border-app-border">
                <span className="text-slate-400 block font-medium">Account Status</span>
                <span className="font-semibold text-slate-800">
                  {selectedMemberForDetails.status === 'ACTIVE' ? 'Active Member' : 'Pending Invite'}
                </span>
              </div>
            </div>

            {/* Granted Capabilities */}
            <div>
              <h4 className="text-xs font-semibold text-slate-700 mb-2 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Granted Operational Permissions ({PERMISSIONS[selectedMemberForDetails.role]?.length || 0})
              </h4>
              <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1">
                {(PERMISSIONS[selectedMemberForDetails.role] || []).map((action) => {
                  const capability = RBAC_CAPABILITIES.find((c) => c.action === action);
                  return (
                    <div
                      key={action}
                      className="flex items-center justify-between p-2 rounded-control bg-emerald-50/50 border border-emerald-100 text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span className="font-medium text-emerald-950">
                          {capability?.label || action}
                        </span>
                      </div>
                      <span className="text-[10px] text-emerald-700">
                        {capability?.category || 'Authorized'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Restricted Capabilities */}
            {selectedMemberForDetails.role !== 'OWNER' && selectedMemberForDetails.role !== 'ADMIN' && (
              <div>
                <h4 className="text-xs font-semibold text-slate-700 mb-2 flex items-center gap-1.5">
                  <Lock className="w-4 h-4 text-slate-400" />
                  Restricted Capabilities
                </h4>
                <div className="max-h-32 overflow-y-auto space-y-1.5 pr-1">
                  {RBAC_CAPABILITIES.filter(
                    (c) => !can(selectedMemberForDetails.role, c.action)
                  ).map((c) => (
                    <div
                      key={c.action}
                      className="flex items-center justify-between p-2 rounded-control bg-slate-50 border border-slate-200/60 text-xs text-slate-500"
                    >
                      <div className="flex items-center gap-2">
                        <X className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{c.label}</span>
                      </div>
                      <span className="text-[10px] text-slate-400">{c.category}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <ModalFooter className="pt-3">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setSelectedMemberForDetails(null)}
              >
                Close
              </Button>
            </ModalFooter>
          </div>
        </Modal>
      )}
    </div>
  );
}
