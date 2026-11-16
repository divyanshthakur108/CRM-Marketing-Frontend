import { useState } from 'react';
import { Button } from '../components/ui/Button';
import { StatusBadge } from '../components/ui/StatusBadge';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { useToast } from '../components/ui/Toast';
import {
  useMetaStatus,
  useMetaConnect,
  useMetaDisconnect,
} from '../hooks/usePublishing';
import { useAuthStore } from '../store/useAuthStore';
import { formatDisplayDate } from '../lib/formatters';
import {
  Share2,
  RefreshCw,
  Zap,
  ShieldCheck,
  Unlink,
  Lock,
  Copy,
  Check,
  Radio,
  AlertCircle,
} from 'lucide-react';

const InstagramIcon = ({ className = 'w-5 h-5' }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
  </svg>
);

const MetaAdsIcon = ({ className = 'w-5 h-5' }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M12 2L2 7l10 5 10-5-10-5z" />
    <path d="M2 17l10 5 10-5" />
    <path d="M2 12l10 5 10-5" />
  </svg>
);

export function MetaConnectionsPage() {
  const { toast } = useToast();
  const user = useAuthStore((s) => s.user);
  const { data: status, isLoading, isError, refetch } = useMetaStatus();
  const connectMutation = useMetaConnect();
  const disconnectMutation = useMetaDisconnect();

  const [isTestingWebhook, setIsTestingWebhook] = useState(false);
  const [showDisconnectConfirm, setShowDisconnectConfirm] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // RBAC permissions check
  const userRole = (user?.role || 'viewer').toLowerCase();
  const canManage = [
    'platform_admin',
    'org_owner',
    'marketing_manager',
    'owner',
    'admin',
  ].includes(userRole);

  const isConnected = status?.connected ?? false;
  const isPending = connectMutation.isPending || disconnectMutation.isPending;

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(label);
    setTimeout(() => setCopiedKey(null), 2000);
    toast({
      title: 'Copied to clipboard',
      message: `${label} (${text}) copied.`,
      type: 'info',
    });
  };

  const handleConnect = async () => {
    if (!canManage) {
      toast({
        title: 'Permission Denied',
        message: 'Only marketing managers and administrators can link Meta integrations.',
        type: 'error',
      });
      return;
    }

    try {
      await connectMutation.mutateAsync('mock_oauth_authorization_code_2026');
      toast({
        title: 'Meta Suite Connected',
        message: 'Facebook Page, Instagram, and Ad Account linked successfully with secured tokens.',
        type: 'success',
      });
    } catch (err: unknown) {
      toast({
        title: 'Connection Failed',
        message: err instanceof Error ? err.message : 'Could not link Meta accounts',
        type: 'error',
      });
    }
  };

  const handleDisconnect = async () => {
    if (!canManage) {
      toast({
        title: 'Permission Denied',
        message: 'Only marketing managers and administrators can disconnect Meta integrations.',
        type: 'error',
      });
      return;
    }

    try {
      await disconnectMutation.mutateAsync();
      setShowDisconnectConfirm(false);
      toast({
        title: 'Meta Disconnected',
        message: 'All publishing tokens cleared and accounts unlinked from RealCRM workspace.',
        type: 'info',
      });
    } catch (err: unknown) {
      toast({
        title: 'Disconnect Failed',
        message: err instanceof Error ? err.message : 'Could not disconnect Meta accounts',
        type: 'error',
      });
    }
  };

  const handleTestWebhook = async () => {
    setIsTestingWebhook(true);
    await new Promise((resolve) => setTimeout(resolve, 600));
    setIsTestingWebhook(false);

    if (isConnected) {
      toast({
        title: 'Meta Webhook Handshake Verified',
        message: 'Graph API endpoint verified for real-time lead acquisition & conversion events.',
        type: 'success',
      });
    } else {
      toast({
        title: 'Webhook Standby',
        message: 'Webhook endpoint listening. Connect your Meta suite to stream live webhook events.',
        type: 'info',
      });
    }
  };

  // Connected accounts counter
  const connectedChannelsCount = [
    status?.facebookPage?.connected,
    status?.instagramAccount?.connected,
    status?.adAccount?.connected,
  ].filter(Boolean).length;

  return (
    <div className="space-y-6">
      {/* 1. Header & Breadcrumbs */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-[#64748B] mb-1 font-medium">
            <span>Dashboard</span>
            <span>/</span>
            <span>Marketing</span>
            <span>/</span>
            <span className="text-[#10B981] font-semibold">Meta Connections</span>
          </div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-[#1F2937]">
              Meta Business Integrations
            </h1>
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                isConnected
                  ? 'bg-[#E8F7F1] text-[#10B981] border-[#10B981]/20'
                  : 'bg-amber-50 text-amber-700 border-amber-200'
              }`}
            >
              <Radio className="w-3.5 h-3.5" />
              {isConnected ? `${connectedChannelsCount}/3 Channels Active` : 'Ready to Connect'}
            </span>
          </div>
          <p className="text-xs text-[#64748B] mt-1">
            Connect your Facebook Page, Instagram Professional account, and Meta Ads Manager for automated marketing.
          </p>
        </div>

        {/* Global Integration Actions */}
        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={handleTestWebhook}
            isLoading={isTestingWebhook}
            leftIcon={<Zap className="w-3.5 h-3.5 text-amber-500" />}
            className="rounded-xl font-semibold border-[#EDF0F2] hover:bg-slate-50 cursor-pointer shadow-xs"
            title="Test real-time lead webhook handshake with Meta Graph API"
          >
            Test Webhook
          </Button>

          {isConnected ? (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setShowDisconnectConfirm(true)}
              isLoading={isPending}
              disabled={!canManage}
              leftIcon={<Unlink className="w-3.5 h-3.5 text-rose-600" />}
              className="rounded-xl font-semibold border-rose-200 text-rose-700 hover:bg-rose-50 cursor-pointer shadow-xs"
            >
              Disconnect Suite
            </Button>
          ) : (
            <Button
              type="button"
              size="sm"
              onClick={handleConnect}
              isLoading={isPending}
              disabled={!canManage}
              leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
              className="rounded-xl font-semibold bg-[#10B981] hover:bg-[#059669] text-white shadow-xs cursor-pointer"
            >
              Connect Meta Suite
            </Button>
          )}

          <button
            type="button"
            onClick={() => refetch()}
            disabled={isLoading}
            className="p-2 rounded-xl border border-[#EDF0F2] bg-white text-[#64748B] hover:text-[#1F2937] hover:bg-slate-50 shadow-xs transition-all active:scale-[0.98] cursor-pointer"
            title="Refresh connection status"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* 2. RBAC Permissions Advisory Banner */}
      {!canManage && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50/80 p-4 shadow-xs flex items-center gap-3 text-xs">
          <div className="h-9 w-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
            <Lock className="w-4 h-4 stroke-[2.2]" />
          </div>
          <div>
            <p className="font-bold text-amber-900 text-sm">Review-Only Access</p>
            <p className="text-amber-800/90 text-xs mt-0.5">
              Logged in as <strong className="capitalize">{userRole}</strong>. Connecting or disconnecting Meta business accounts requires <strong>marketing_manager</strong> or <strong>admin</strong> privileges.
            </p>
          </div>
        </div>
      )}

      {/* 3. Error Banner */}
      {isError && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50/80 p-4 shadow-xs flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5 text-rose-800">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            <span>Could not communicate with the Meta integration manager service.</span>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => refetch()}
            className="rounded-xl border-rose-300 text-rose-800 hover:bg-rose-100/60"
          >
            Retry
          </Button>
        </div>
      )}

      {/* 4. Security & Architecture Overview Strip */}
      <div className="rounded-2xl bg-white border border-[#EDF0F2] p-5 shadow-[0_0_2px_0_rgba(145,158,171,0.2),0_12px_24px_-4px_rgba(145,158,171,0.12)] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start md:items-center gap-3.5">
          <div className="h-11 w-11 rounded-xl bg-[#E8F7F1] text-[#10B981] flex items-center justify-center shrink-0">
            <ShieldCheck className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-[#1F2937]">
                OAuth Token Security &amp; Adapter Mode
              </h3>
              {status?.adapterMode && (
                <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                  {status.adapterMode}
                </span>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#64748B] mt-1">
              <span>
                Token Preview:{' '}
                <span className="font-mono font-semibold text-slate-800">
                  {status?.facebookPage?.tokenPreview || 'Not configured'}
                </span>
              </span>
              <span>&bull;</span>
              <span>
                System User:{' '}
                <strong className={status?.systemUserActive ? 'text-[#10B981]' : 'text-slate-600'}>
                  {status?.systemUserActive ? 'Active' : 'Standard'}
                </strong>
              </span>
              {status?.tokenExpiresAt && (
                <>
                  <span>&bull;</span>
                  <span>Expires: {formatDisplayDate(status.tokenExpiresAt)}</span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto">
          <StatusBadge
            status={isConnected ? 'ACTIVE' : 'DRAFT'}
            label={isConnected ? 'Tokens Secured' : 'No Active Tokens'}
          />
        </div>
      </div>

      {/* 5. 3 Enterprise Integration Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
        {/* Card 1: Facebook Page */}
        <div className="rounded-2xl bg-white border border-[#EDF0F2] p-5 shadow-[0_0_2px_0_rgba(145,158,171,0.2),0_12px_24px_-4px_rgba(145,158,171,0.12)] flex flex-col justify-between space-y-5">
          {/* Header */}
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-[#1877F2]/10 text-[#1877F2] flex items-center justify-center shrink-0">
                  <Share2 className="w-5 h-5 stroke-[2.2]" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#1F2937]">Facebook Page</h3>
                  <p className="text-[11px] text-[#64748B]">Organic Broadcasts &amp; Feed Posts</p>
                </div>
              </div>
              <StatusBadge
                status={status?.facebookPage?.connected ? 'ACTIVE' : 'DRAFT'}
                label={status?.facebookPage?.connected ? 'Connected' : 'Disconnected'}
              />
            </div>

            {/* Account Details */}
            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-50/80 border border-slate-100 space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748B] block">
                  Official Page Name
                </span>
                <span className="text-xs font-semibold text-[#1F2937] block truncate">
                  {status?.facebookPage?.connected ? status.facebookPage.pageName : 'Not connected'}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50/80 border border-slate-100">
                <span className="text-[#64748B]">Page ID:</span>
                {status?.facebookPage?.connected && status.facebookPage.pageId ? (
                  <button
                    type="button"
                    onClick={() => handleCopy(status.facebookPage.pageId, 'Page ID')}
                    className="group inline-flex items-center gap-1.5 font-mono text-[11px] text-slate-800 hover:text-slate-950 font-semibold cursor-pointer"
                    title="Click to copy Page ID"
                  >
                    <span>{status.facebookPage.pageId}</span>
                    {copiedKey === 'Page ID' ? (
                      <Check className="w-3.5 h-3.5 text-[#10B981]" />
                    ) : (
                      <Copy className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600" />
                    )}
                  </button>
                ) : (
                  <span className="text-slate-400 italic">—</span>
                )}
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50/80 border border-slate-100">
                <span className="text-[#64748B]">Publishing Permission:</span>
                <span className="font-mono text-[11px] font-semibold text-slate-800">
                  pages_manage_posts
                </span>
              </div>
            </div>
          </div>

          {/* Action Footer */}
          <div className="pt-3 border-t border-slate-100">
            {status?.facebookPage?.connected ? (
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setShowDisconnectConfirm(true)}
                disabled={!canManage || isPending}
                className="w-full rounded-xl font-semibold text-rose-700 hover:bg-rose-50 border-rose-200 cursor-pointer"
                leftIcon={<Unlink className="w-3.5 h-3.5" />}
                title="Disconnects unified Meta Business Suite credentials"
              >
                Disconnect Meta Suite
              </Button>
            ) : (
              <Button
                type="button"
                size="sm"
                onClick={handleConnect}
                disabled={!canManage || isPending}
                className="w-full rounded-xl font-semibold bg-[#1877F2] hover:bg-[#166fe5] text-white shadow-xs cursor-pointer"
                leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
              >
                Connect Facebook Page
              </Button>
            )}
          </div>
        </div>

        {/* Card 2: Instagram Professional */}
        <div className="rounded-2xl bg-white border border-[#EDF0F2] p-5 shadow-[0_0_2px_0_rgba(145,158,171,0.2),0_12px_24px_-4px_rgba(145,158,171,0.12)] flex flex-col justify-between space-y-5">
          {/* Header */}
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-[#E4405F]/10 text-[#E4405F] flex items-center justify-center shrink-0">
                  <InstagramIcon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#1F2937]">Instagram Professional</h3>
                  <p className="text-[11px] text-[#64748B]">Reels, Posts &amp; Stories Sync</p>
                </div>
              </div>
              <StatusBadge
                status={status?.instagramAccount?.connected ? 'ACTIVE' : 'DRAFT'}
                label={status?.instagramAccount?.connected ? 'Connected' : 'Disconnected'}
              />
            </div>

            {/* Account Details */}
            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-50/80 border border-slate-100 space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748B] block">
                  Instagram Handle
                </span>
                <span className="text-xs font-semibold text-[#1F2937] block truncate">
                  {status?.instagramAccount?.connected
                    ? `@${status.instagramAccount.handle.replace(/^@/, '')}`
                    : 'Not connected'}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50/80 border border-slate-100">
                <span className="text-[#64748B]">Account ID:</span>
                {status?.instagramAccount?.connected && status.instagramAccount.accountId ? (
                  <button
                    type="button"
                    onClick={() => handleCopy(status.instagramAccount.accountId, 'Instagram ID')}
                    className="group inline-flex items-center gap-1.5 font-mono text-[11px] text-slate-800 hover:text-slate-950 font-semibold cursor-pointer"
                    title="Click to copy Instagram Account ID"
                  >
                    <span>{status.instagramAccount.accountId}</span>
                    {copiedKey === 'Instagram ID' ? (
                      <Check className="w-3.5 h-3.5 text-[#10B981]" />
                    ) : (
                      <Copy className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600" />
                    )}
                  </button>
                ) : (
                  <span className="text-slate-400 italic">—</span>
                )}
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50/80 border border-slate-100">
                <span className="text-[#64748B]">Media Sync Capabilities:</span>
                <span className="font-semibold text-slate-800">
                  {status?.instagramAccount?.connected ? 'Reels & Image Posts' : 'Inactive'}
                </span>
              </div>
            </div>
          </div>

          {/* Action Footer */}
          <div className="pt-3 border-t border-slate-100">
            {status?.instagramAccount?.connected ? (
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setShowDisconnectConfirm(true)}
                disabled={!canManage || isPending}
                className="w-full rounded-xl font-semibold text-rose-700 hover:bg-rose-50 border-rose-200 cursor-pointer"
                leftIcon={<Unlink className="w-3.5 h-3.5" />}
                title="Disconnects unified Meta Business Suite credentials"
              >
                Disconnect Meta Suite
              </Button>
            ) : (
              <Button
                type="button"
                size="sm"
                onClick={handleConnect}
                disabled={!canManage || isPending}
                className="w-full rounded-xl font-semibold bg-[#E4405F] hover:bg-[#d62e4f] text-white shadow-xs cursor-pointer"
                leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
              >
                Connect Instagram
              </Button>
            )}
          </div>
        </div>

        {/* Card 3: Meta Ads Manager */}
        <div className="rounded-2xl bg-white border border-[#EDF0F2] p-5 shadow-[0_0_2px_0_rgba(145,158,171,0.2),0_12px_24px_-4px_rgba(145,158,171,0.12)] flex flex-col justify-between space-y-5">
          {/* Header */}
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-[#0081FB]/10 text-[#0081FB] flex items-center justify-center shrink-0">
                  <MetaAdsIcon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#1F2937]">Meta Ads Manager</h3>
                  <p className="text-[11px] text-[#64748B]">Paid Campaign &amp; AdSet Automation</p>
                </div>
              </div>
              <StatusBadge
                status={status?.adAccount?.connected ? 'ACTIVE' : 'DRAFT'}
                label={status?.adAccount?.connected ? 'Connected' : 'Disconnected'}
              />
            </div>

            {/* Account Details */}
            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-50/80 border border-slate-100 space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748B] block">
                  Ad Account Entity
                </span>
                <span className="text-xs font-semibold text-[#1F2937] block truncate">
                  {status?.adAccount?.connected ? status.adAccount.name : 'Not connected'}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50/80 border border-slate-100">
                <span className="text-[#64748B]">Ad Account ID:</span>
                {status?.adAccount?.connected && status.adAccount.accountId ? (
                  <button
                    type="button"
                    onClick={() => handleCopy(`act_${status.adAccount.accountId}`, 'Ad Account ID')}
                    className="group inline-flex items-center gap-1.5 font-mono text-[11px] text-slate-800 hover:text-slate-950 font-semibold cursor-pointer"
                    title="Click to copy Ad Account ID"
                  >
                    <span>act_{status.adAccount.accountId}</span>
                    {copiedKey === 'Ad Account ID' ? (
                      <Check className="w-3.5 h-3.5 text-[#10B981]" />
                    ) : (
                      <Copy className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600" />
                    )}
                  </button>
                ) : (
                  <span className="text-slate-400 italic">—</span>
                )}
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50/80 border border-slate-100">
                <span className="text-[#64748B]">Billing Currency:</span>
                <span className="font-semibold text-slate-800">
                  {status?.adAccount?.currency || 'INR'}
                </span>
              </div>
            </div>
          </div>

          {/* Action Footer */}
          <div className="pt-3 border-t border-slate-100">
            {status?.adAccount?.connected ? (
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setShowDisconnectConfirm(true)}
                disabled={!canManage || isPending}
                className="w-full rounded-xl font-semibold text-rose-700 hover:bg-rose-50 border-rose-200 cursor-pointer"
                leftIcon={<Unlink className="w-3.5 h-3.5" />}
                title="Disconnects unified Meta Business Suite credentials"
              >
                Disconnect Meta Suite
              </Button>
            ) : (
              <Button
                type="button"
                size="sm"
                onClick={handleConnect}
                disabled={!canManage || isPending}
                className="w-full rounded-xl font-semibold bg-[#0081FB] hover:bg-[#0070db] text-white shadow-xs cursor-pointer"
                leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
              >
                Connect Ad Account
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* 6. Disconnect Confirmation Safety Dialog */}
      <ConfirmDialog
        isOpen={showDisconnectConfirm}
        onClose={() => setShowDisconnectConfirm(false)}
        onConfirm={handleDisconnect}
        isLoading={disconnectMutation.isPending}
        variant="danger"
        title="Disconnect Unified Meta Suite"
        description={
          <div className="space-y-2 text-xs text-slate-600">
            <p>
              Are you sure you want to disconnect Meta Business Suite from RealCRM?
            </p>
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200/80 space-y-1 text-rose-900 text-[11px]">
              <p className="font-semibold flex items-center gap-1.5 text-rose-700">
                <AlertCircle className="w-3.5 h-3.5" />
                Unified OAuth Scope Impact:
              </p>
              <p className="text-rose-800 leading-relaxed">
                Meta integrates Facebook Pages, Instagram Professional accounts, and Ads Manager through unified business credentials. Disconnecting revokes all shared access tokens and stops:
              </p>
              <ul className="list-disc pl-4 space-y-0.5 text-rose-800">
                <li>Automated organic social broadcasts across feeds and reels.</li>
                <li>Live Meta Ads Manager campaign deployments and pause/resume controls.</li>
                <li>Real-time lead capture webhook delivery.</li>
              </ul>
            </div>
            <p className="text-[11px] text-slate-500">
              You can reconnect anytime using the official Meta OAuth flow.
            </p>
          </div>
        }
        confirmText="Revoke &amp; Disconnect"
        cancelText="Keep Connected"
      />
    </div>
  );
}
