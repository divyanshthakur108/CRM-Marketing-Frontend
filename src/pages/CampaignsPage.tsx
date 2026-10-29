import { useState } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { PageHeader } from '../components/ui/PageHeader';
import { StatusBadge } from '../components/ui/StatusBadge';
import { useToast } from '../components/ui/Toast';
import { formatCurrency } from '../lib/formatters';
import {
  useCampaigns,
  useResumeCampaign,
  useUpdateCampaignStatus,
  CampaignItem,
} from '../hooks/usePublishing';
import {
  TrendingUp,
  Play,
  Pause,
  RotateCw,
  AlertTriangle,
} from 'lucide-react';

export function CampaignsPage() {
  const { toast } = useToast();
  const [statusFilter, setStatusFilter] = useState('ALL');
  const { data: campaigns = [], isLoading } = useCampaigns(statusFilter);
  const resumeMutation = useResumeCampaign();
  const statusMutation = useUpdateCampaignStatus();
  const [resumingId, setResumingId] = useState<string | null>(null);

  const handleToggleStatus = async (item: CampaignItem) => {
    const nextStatus = item.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE';
    try {
      await statusMutation.mutateAsync({ campaignId: item._id, status: nextStatus });
      toast({
        title: `Campaign ${nextStatus === 'ACTIVE' ? 'Activated' : 'Paused'}`,
        message: `Updated Meta Ads delivery state for "${item.name}"`,
        type: nextStatus === 'ACTIVE' ? 'success' : 'info',
      });
    } catch (err: unknown) {
      toast({
        title: 'Status Update Failed',
        message: err instanceof Error ? err.message : 'Could not update campaign status',
        type: 'error',
      });
    }
  };

  const handleResume = async (item: CampaignItem) => {
    setResumingId(item._id);
    try {
      await resumeMutation.mutateAsync(item._id);
      toast({
        title: 'Deployment Resumed Successfully',
        message: `Continued deployment for "${item.name}" from first incomplete step.`,
        type: 'success',
      });
    } catch (err: unknown) {
      toast({
        title: 'Resumption Failed',
        message: err instanceof Error ? err.message : 'Could not resume campaign deployment',
        type: 'error',
      });
    } finally {
      setResumingId(null);
    }
  };

  const totalSpend = campaigns.reduce((sum, c) => sum + (c.totalSpend || 0), 0);
  const totalLeads = campaigns.reduce((sum, c) => sum + (c.metrics?.leads || 0), 0);
  const needsActionCount = campaigns.filter((c) => c.needsAction).length;

  return (
    <div className="space-y-6">
      {/* 1. Page Header */}
      <PageHeader
        title="Meta Ads &amp; Campaigns"
        description="Monitor real-time Meta campaign delivery, lead acquisition metrics, daily spend limits, and failure recovery."
        actions={
          <div className="flex items-center space-x-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-10 px-3 text-sm rounded-[8px] border border-border bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1 font-normal"
            >
              <option value="ALL">All Statuses ({campaigns.length})</option>
              <option value="ACTIVE">Active Only</option>
              <option value="PAUSED">Paused Only</option>
            </select>
          </div>
        }
      />

      {/* Needs Action Attention Banner */}
      {needsActionCount > 0 && (
        <div className="border border-border bg-neutral-900 text-white rounded-card p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <AlertTriangle className="w-5 h-5 text-white shrink-0" />
            <div>
              <span className="font-semibold text-sm block">
                {needsActionCount} Campaign Deployment(s) Need Action
              </span>
              <p className="text-meta text-neutral-300 mt-0.5">
                A transient API timeout occurred during multi-step setup. Click Resume on any affected campaign to continue.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* High-Level Spend & Inbound KPI Meters */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card className="p-4 space-y-1">
          <span className="text-meta font-medium uppercase tracking-wide text-text-muted block">
            Total Meta Ad Spend
          </span>
          <div className="text-2xl font-semibold text-text-primary tabular-nums">
            {formatCurrency(totalSpend)}
          </div>
          <span className="text-meta text-text-muted">Across all active campaigns</span>
        </Card>

        <Card className="p-4 space-y-1">
          <span className="text-meta font-medium uppercase tracking-wide text-text-muted block">
            Inbound Verified Leads
          </span>
          <div className="text-2xl font-semibold text-text-primary tabular-nums">
            {totalLeads} Leads
          </div>
          <span className="text-meta text-text-secondary font-medium">Special Category: Housing</span>
        </Card>

        <Card className="p-4 space-y-1">
          <span className="text-meta font-medium uppercase tracking-wide text-text-muted block">
            Needs Action / Stalled
          </span>
          <div className="text-2xl font-semibold text-text-primary tabular-nums">
            {needsActionCount}
          </div>
          <span className="text-meta text-text-muted">Resumable step deployments</span>
        </Card>

        <Card className="p-4 space-y-1">
          <span className="text-meta font-medium uppercase tracking-wide text-text-muted block">
            Compliance Enforcement
          </span>
          <div className="text-2xl font-semibold text-text-primary tabular-nums">
            100% PAUSED
          </div>
          <span className="text-meta text-text-muted">Starts paused per policy</span>
        </Card>
      </div>

      {/* Campaigns Table */}
      <Card className="p-0 overflow-hidden">
        <div className="p-4 border-b border-border flex items-center justify-between bg-surface">
          <h3 className="text-section font-semibold text-text-primary flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-text-primary" />
            <span>Meta Ads Campaigns ({campaigns.length})</span>
          </h3>
        </div>

        <div className="overflow-x-auto bg-surface">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="bg-neutral-100 border-b border-border text-meta font-medium text-text-secondary sticky top-0">
                <th className="px-4 py-3">Campaign &amp; Project</th>
                <th className="px-4 py-3">Objective</th>
                <th className="px-4 py-3">Daily Budget</th>
                <th className="px-4 py-3">Deployment Steps</th>
                <th className="px-4 py-3">Meta IDs</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Controls</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="p-10 text-center text-sm text-text-muted">
                    Loading campaigns from database...
                  </td>
                </tr>
              ) : campaigns.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-10 text-center text-meta text-text-muted">
                    No ad campaigns found. Deploy a campaign from an approved creative.
                  </td>
                </tr>
              ) : (
                campaigns.map((item) => (
                  <tr
                    key={item._id}
                    className={`hover:bg-surface-hover h-14 transition-colors ${
                      item.needsAction ? 'bg-neutral-50' : ''
                    }`}
                  >
                    <td className="px-4 py-2.5">
                      <div className="space-y-0.5">
                        <span className="text-[11px] uppercase tracking-wide text-text-muted block">
                          {item.projectId?.name || 'Project Entity'}
                        </span>
                        <h4 className="font-medium text-text-primary">{item.name}</h4>
                        <span className="text-meta text-text-muted tabular-nums">ID: {item._id}</span>

                        {item.needsAction && item.lastErrorMessage && (
                          <div className="mt-1 p-2 bg-neutral-900 text-white text-meta rounded-[6px] flex items-start space-x-1.5">
                            <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-status-warning" />
                            <span>
                              Failed at [{item.lastErrorStep}]: {item.lastErrorMessage}
                            </span>
                          </div>
                        )}
                      </div>
                    </td>

                    <td className="px-4 py-2.5">
                      <span className="text-[11px] px-2 py-0.5 rounded-[4px] bg-neutral-100 text-text-secondary">
                        {item.objective}
                      </span>
                    </td>

                    <td className="px-4 py-2.5 font-semibold text-text-primary tabular-nums">
                      {formatCurrency(item.dailyBudget)} / day
                    </td>

                    <td className="px-4 py-2.5">
                      <div className="flex items-center space-x-1">
                        {(['CAMPAIGN', 'AD_SET', 'CREATIVE', 'AD'] as const).map((step) => {
                          const isDone = item.completedSteps?.includes(step);
                          return (
                            <span
                              key={step}
                              className={`text-[12px] px-2 py-0.5 rounded-[4px] border ${
                                isDone
                                  ? 'bg-[#0A0A0A] text-white border-[#0A0A0A] font-medium'
                                  : 'bg-[#F5F5F5] text-[#737373] border-[#E5E5E5]'
                              }`}
                              title={`Step: ${step} (${isDone ? 'Completed' : 'Pending'})`}
                            >
                              {step.slice(0, 3)}
                            </span>
                          );
                        })}
                      </div>
                    </td>

                    <td className="px-4 py-2.5 text-meta text-text-muted tabular-nums space-y-0.5">
                      {item.metaCampaignId && <div><strong>Camp:</strong> {item.metaCampaignId}</div>}
                      {item.metaAdSetId && <div><strong>AdSet:</strong> {item.metaAdSetId}</div>}
                      {item.metaAdId && <div><strong>Ad:</strong> {item.metaAdId}</div>}
                    </td>

                    <td className="px-4 py-2.5">
                      {item.needsAction ? (
                        <StatusBadge status="needs_action" />
                      ) : (
                        <StatusBadge status={item.status} />
                      )}
                    </td>

                    <td className="px-4 py-2.5 text-right space-x-2">
                      {item.needsAction ? (
                        <Button
                          type="button"
                          variant="primary"
                          size="sm"
                          onClick={() => handleResume(item)}
                          isLoading={resumingId === item._id}
                          leftIcon={<RotateCw className="w-3.5 h-3.5" />}
                        >
                          Resume
                        </Button>
                      ) : (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleToggleStatus(item)}
                          leftIcon={
                            item.status === 'ACTIVE' ? (
                              <Pause className="w-3.5 h-3.5" />
                            ) : (
                              <Play className="w-3.5 h-3.5" />
                            )
                          }
                        >
                          {item.status === 'ACTIVE' ? 'Pause' : 'Activate'}
                        </Button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
