import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/Tabs';
import { StatusBadge } from '../components/ui/StatusBadge';
import { PageHeader } from '../components/ui/PageHeader';
import { EmptyState } from '../components/ui/EmptyState';
import { Button } from '../components/ui/Button';
import { useToast } from '../components/ui/Toast';
import { formatCurrency } from '../lib/formatters';
import {
  useAnalyticsOverview,
  useAnalyticsCampaigns,
  useAnalyticsContent,
  useAnalyticsLeads,
  useSyncAnalytics,
} from '../hooks/useAnalytics';
import {
  BarChart3,
  TrendingUp,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  PieChart,
} from 'lucide-react';

export function AnalyticsPage() {
  const { toast } = useToast();
  const [dateRange, setDateRange] = useState('30D');

  const {
    data: overviewData,
    isLoading: isLoadingOverview,
    isError: isErrorOverview,
    refetch: refetchOverview,
  } = useAnalyticsOverview(dateRange);

  const { data: campaignsData, isLoading: isLoadingCampaigns } = useAnalyticsCampaigns();
  const { data: contentData, isLoading: isLoadingContent } = useAnalyticsContent();
  const { data: leadsData, isLoading: isLoadingLeads } = useAnalyticsLeads();
  const syncMutation = useSyncAnalytics();

  const handleSyncInsights = async () => {
    try {
      const days = dateRange === '7D' ? 7 : dateRange === '90D' ? 90 : 30;
      const res = await syncMutation.mutateAsync(days);
      await refetchOverview();
      toast({
        title: 'Insights synchronized',
        message: `Synced ${res.syncedCount} daily performance records.`,
        type: 'success',
      });
    } catch {
      toast({
        title: 'Sync failed',
        message: 'Could not sync insights from advertising platforms.',
        type: 'error',
      });
    }
  };

  const kpis = overviewData?.kpis || {
    totalSpend: 0,
    totalImpressions: 0,
    totalClicks: 0,
    totalLeads: 0,
    avgCpl: 0,
    ctr: 0,
    visitConversionRate: 0,
  };

  const timeseries = overviewData?.timeseries || [];
  const dataQuality = overviewData?.dataQuality;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <PageHeader
        title="Marketing intelligence & analytics"
        description="Full-funnel attribution: Track ad spend, CPL, click-through rates, and inbound lead conversion velocity."
        actions={
          <div className="flex items-center space-x-2">
            <Link to="/dashboard">
              <Button type="button" variant="secondary" size="sm">
                &larr; Dashboard
              </Button>
            </Link>

            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={syncMutation.isPending}
              onClick={handleSyncInsights}
              leftIcon={
                <RefreshCw
                  className={`w-3.5 h-3.5 ${syncMutation.isPending ? 'animate-spin' : ''}`}
                />
              }
            >
              {syncMutation.isPending ? 'Syncing...' : 'Sync insights'}
            </Button>

            <div className="flex border border-[#E5E5E5] rounded-[8px] overflow-hidden bg-[#FAFAFA] p-0.5">
              {[
                { label: '7D', value: '7D' },
                { label: '30D', value: '30D' },
                { label: '90D', value: '90D' },
              ].map((r) => (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => setDateRange(r.value)}
                  className={`px-3 py-1 text-[12px] rounded-[6px] font-medium transition-colors ${
                    dateRange === r.value
                      ? 'bg-[#0A0A0A] text-white'
                      : 'text-[#525252] hover:text-[#0A0A0A]'
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>
        }
      />

      {/* Data Quality / Latency Banner */}
      {dataQuality && (
        <div className="p-3.5 bg-[#FAFAFA] border border-[#E5E5E5] rounded-[8px] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-[13px] text-[#525252]">
          <div className="flex items-center space-x-2">
            {dataQuality.delayedCount > 0 ? (
              <AlertTriangle className="w-4 h-4 text-[#B45309]" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-[#15803D]" />
            )}
            <span>
              Ingestion status: <strong className="text-[#0A0A0A]">{dataQuality.totalRecords} records</strong> in period
              {dataQuality.delayedCount > 0 && (
                <span className="text-[#737373]"> ({dataQuality.delayedCount} delayed/provisional)</span>
              )}
            </span>
          </div>
          <span className="text-[#737373] text-[12px]">
            Last synced: {dataQuality?.lastSyncedAt ? new Date(dataQuality.lastSyncedAt).toLocaleString('en-IN') : 'Just now'}
          </span>
        </div>
      )}

      {/* Primary KPI Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-5 space-y-1">
            <span className="text-[12px] font-medium text-[#737373] block">
              Total marketing spend
            </span>
            <div className="text-[24px] font-semibold text-[#0A0A0A] tabular-nums">
              {formatCurrency(kpis.totalSpend ?? 0)}
            </div>
            <span className="text-[12px] text-[#737373] tabular-nums">
              {(kpis.totalImpressions ?? 0).toLocaleString('en-IN')} impressions
            </span>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5 space-y-1">
            <span className="text-[12px] font-medium text-[#737373] block">
              Verified inbound leads
            </span>
            <div className="text-[24px] font-semibold text-[#0A0A0A] tabular-nums">
              {kpis.totalLeads ?? 0} leads
            </div>
            <span className="text-[12px] text-[#737373] tabular-nums">
              {(kpis.totalClicks ?? 0).toLocaleString('en-IN')} clicks ({kpis.ctr ?? 0}% CTR)
            </span>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5 space-y-1">
            <span className="text-[12px] font-medium text-[#737373] block">
              Average cost per lead (CPL)
            </span>
            <div className="text-[24px] font-semibold text-[#0A0A0A] tabular-nums">
              {formatCurrency(kpis.avgCpl ?? 0)}
            </div>
            <span className="text-[12px] text-[#737373]">
              Industry benchmark: ₹3,500
            </span>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5 space-y-1">
            <span className="text-[12px] font-medium text-[#737373] block">
              Site visit conversion
            </span>
            <div className="text-[24px] font-semibold text-[#0A0A0A] tabular-nums">
              {kpis.visitConversionRate}%
            </div>
            <span className="text-[12px] text-[#737373]">
              Physical visits completed
            </span>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabbed Analytics Suite */}
      <Tabs defaultValue="overview" className="w-full space-y-6">
        <TabsList className="bg-transparent border-b border-[#E5E5E5] gap-4">
          <TabsTrigger value="overview">Overview (Spend &amp; Leads)</TabsTrigger>
          <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
          <TabsTrigger value="content">Content creative ROI</TabsTrigger>
          <TabsTrigger value="leads">Lead attribution</TabsTrigger>
        </TabsList>

        {/* TAB 1: OVERVIEW */}
        <TabsContent value="overview" className="space-y-6 pt-2">
          {isLoadingOverview ? (
            <div className="py-20 text-center text-[14px] text-[#737373]">
              Loading analytics timeseries...
            </div>
          ) : isErrorOverview ? (
            <div className="p-6 border border-[#E5E5E5] rounded-[10px] text-center space-y-2 bg-white">
              <p className="text-[14px] text-[#525252]">No insight data available for this range.</p>
              <Button size="sm" variant="secondary" onClick={handleSyncInsights}>
                Sync insights now
              </Button>
            </div>
          ) : timeseries.length === 0 ? (
            <EmptyState
              icon={<TrendingUp className="w-10 h-10 text-[#737373]" />}
              title="No performance records"
              description="No marketing performance records synced for this period yet."
              action={
                <Button size="sm" variant="primary" onClick={handleSyncInsights}>
                  Synchronize initial data
                </Button>
              }
            />
          ) : (
            <>
              {/* Main Area Chart: Spend vs Inbound Leads */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between border-b border-[#E5E5E5] pb-3">
                  <div>
                    <CardTitle className="text-[16px] font-semibold text-[#0A0A0A] flex items-center space-x-2">
                      <TrendingUp className="w-4 h-4 text-[#0A0A0A]" />
                      <span>Ad spend vs lead generation volume</span>
                    </CardTitle>
                    <span className="text-[12px] text-[#737373]">
                      Daily attribution across Meta Ads &amp; direct channels
                    </span>
                  </div>
                  <div className="flex items-center space-x-4 text-[12px] text-[#525252]">
                    <span className="flex items-center">
                      <span className="w-2.5 h-2.5 bg-[#0A0A0A] rounded-full inline-block mr-1.5" />
                      Daily ad spend
                    </span>
                    <span className="flex items-center">
                      <span className="w-2.5 h-2.5 bg-[#737373] rounded-full inline-block mr-1.5" />
                      Inbound leads
                    </span>
                  </div>
                </CardHeader>

                <CardContent className="pt-4">
                  <div className="h-72 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={timeseries} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" vertical={false} />
                        <XAxis dataKey="date" stroke="#737373" fontSize={12} tickLine={false} />
                        <YAxis stroke="#737373" fontSize={12} tickLine={false} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#ffffff',
                            border: '1px solid #e5e5e5',
                            borderRadius: '8px',
                            fontSize: '12px',
                            boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
                          }}
                        />
                        <Area
                          type="monotone"
                          dataKey="spend"
                          name="Ad spend (₹)"
                          stroke="#0A0A0A"
                          fill="#0A0A0A"
                          fillOpacity={0.08}
                          strokeWidth={2}
                        />
                        <Area
                          type="monotone"
                          dataKey="leads"
                          name="Leads"
                          stroke="#737373"
                          fill="#737373"
                          fillOpacity={0.15}
                          strokeWidth={2}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Secondary Bar Chart: Cost Per Lead Efficiency */}
              <Card>
                <CardHeader className="border-b border-[#E5E5E5] pb-3">
                  <CardTitle className="text-[16px] font-semibold text-[#0A0A0A] flex items-center space-x-2">
                    <BarChart3 className="w-4 h-4 text-[#0A0A0A]" />
                    <span>Cost per lead (CPL) efficiency over time</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="h-48 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={timeseries}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" vertical={false} />
                        <XAxis dataKey="date" stroke="#737373" fontSize={12} tickLine={false} />
                        <YAxis stroke="#737373" fontSize={12} tickLine={false} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#ffffff',
                            border: '1px solid #e5e5e5',
                            borderRadius: '8px',
                            fontSize: '12px',
                            boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
                          }}
                        />
                        <Bar dataKey="cpl" name="CPL (₹)" fill="#0A0A0A" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* TAB 2: CAMPAIGNS */}
        <TabsContent value="campaigns" className="space-y-4 pt-2">
          <Card>
            <CardHeader className="border-b border-[#E5E5E5] pb-3">
              <CardTitle className="text-[16px] font-semibold text-[#0A0A0A]">Campaign level breakdown</CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              {isLoadingCampaigns ? (
                <div className="py-12 text-center text-[14px] text-[#737373]">
                  Loading campaign performance...
                </div>
              ) : !campaignsData || campaignsData.length === 0 ? (
                <EmptyState
                  icon={<BarChart3 className="w-10 h-10 text-[#737373]" />}
                  title="No active campaigns recorded"
                  description="Start a campaign in Meta Ads Manager to track performance metrics."
                />
              ) : (
                <div className="border border-[#E5E5E5] rounded-[8px] overflow-x-auto bg-white">
                  <table className="w-full text-left text-[14px] border-collapse">
                    <thead>
                      <tr className="bg-[#FAFAFA] border-b border-[#E5E5E5] text-[12px] font-medium text-[#737373]">
                        <th className="p-3.5">Campaign name</th>
                        <th className="p-3.5">Project</th>
                        <th className="p-3.5">Spend</th>
                        <th className="p-3.5">Leads</th>
                        <th className="p-3.5">CPL</th>
                        <th className="p-3.5">CTR</th>
                        <th className="p-3.5">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E5E5E5]">
                      {campaignsData.map((c) => {
                        const itemRecord = c as unknown as Record<string, unknown>;
                        const spendVal =
                          typeof itemRecord.totalSpend === 'number'
                            ? itemRecord.totalSpend
                            : typeof itemRecord.spend === 'number'
                              ? itemRecord.spend
                              : 0;
                        const cplVal = c.cpl ?? 0;
                        return (
                          <tr key={c.id} className="hover:bg-[#F5F5F5] transition-colors h-12">
                            <td className="p-3.5 font-medium text-[#0A0A0A]">{c.name}</td>
                            <td className="p-3.5 text-[#525252]">{c.projectName}</td>
                            <td className="p-3.5 tabular-nums">{formatCurrency(spendVal)}</td>
                            <td className="p-3.5 font-semibold text-[#0A0A0A] tabular-nums">{c.leads ?? 0}</td>
                            <td className="p-3.5 tabular-nums">{formatCurrency(cplVal)}</td>
                            <td className="p-3.5 tabular-nums">{c.ctr ?? '0%'}</td>
                            <td className="p-3.5">
                              <StatusBadge status={c.status} />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 3: CONTENT */}
        <TabsContent value="content" className="space-y-4 pt-2">
          <Card>
            <CardHeader className="border-b border-[#E5E5E5] pb-3">
              <CardTitle className="text-[16px] font-semibold text-[#0A0A0A]">Creative format performance</CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              {isLoadingContent ? (
                <div className="py-12 text-center text-[14px] text-[#737373]">
                  Loading creative attribution...
                </div>
              ) : !contentData || contentData.length === 0 ? (
                <EmptyState
                  icon={<BarChart3 className="w-10 h-10 text-[#737373]" />}
                  title="No format analytics available"
                  description="Publish creatives across multiple formats to compare attribution rates."
                />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {contentData.map((fmt) => (
                    <div key={fmt.format} className="border border-[#E5E5E5] rounded-[10px] p-5 space-y-2.5 bg-white shadow-card">
                      <div className="flex items-center justify-between">
                        <span className="text-[14px] font-semibold text-[#0A0A0A] block">
                          {fmt.format}
                        </span>
                        <StatusBadge status="ACTIVE" label={`${fmt.conversionRate} conv`} />
                      </div>
                      <div className="text-[20px] font-semibold text-[#0A0A0A] tabular-nums">
                        {formatCurrency(fmt.cpl ?? 0)} CPL
                      </div>
                      <p className="text-[13px] text-[#0A0A0A] font-medium">{fmt.highlight}</p>
                      <p className="text-[12px] text-[#737373]">{fmt.description}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 4: LEADS */}
        <TabsContent value="leads" className="space-y-4 pt-2">
          <div className="space-y-4">
            <Card>
              <CardHeader className="border-b border-[#E5E5E5] pb-3">
                <CardTitle className="text-[16px] font-semibold text-[#0A0A0A] flex items-center space-x-2">
                  <PieChart className="w-4 h-4 text-[#0A0A0A]" />
                  <span>Lead source attribution</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                {isLoadingLeads ? (
                  <div className="py-12 text-center text-[14px] text-[#737373]">
                    Loading lead attribution...
                  </div>
                ) : !leadsData || !leadsData.sourceAttribution || leadsData.sourceAttribution.length === 0 ? (
                  <EmptyState
                    icon={<PieChart className="w-10 h-10 text-[#737373]" />}
                    title="No leads recorded yet"
                    description="Lead capture sources will appear here as inquiries arrive."
                  />
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-[13px]">
                    {leadsData.sourceAttribution.map((src) => (
                      <div key={src.source} className="border border-[#E5E5E5] rounded-[8px] p-3.5 bg-[#FAFAFA] space-y-1">
                        <span className="text-[#737373] block text-[12px] truncate">
                          {src.source}
                        </span>
                        <span className="text-[20px] font-semibold text-[#0A0A0A] block tabular-nums">
                          {src.leads} leads
                        </span>
                        <span className="text-[#737373] text-[12px]">
                          {src.percentage}% of pipeline
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Funnel Velocity Card */}
            {leadsData && (
              <Card>
                <CardHeader className="border-b border-[#E5E5E5] pb-3">
                  <CardTitle className="text-[16px] font-semibold text-[#0A0A0A]">Pipeline conversion velocity</CardTitle>
                </CardHeader>
                <CardContent className="pt-4 space-y-3">
                  {(() => {
                    const funnelData = leadsData.conversionFunnel as Array<{ count?: number }> | Record<string, number> | undefined;
                    const leadsRecord = leadsData as unknown as Record<string, unknown>;
                    const funnel =
                      (leadsRecord.funnelStages as Record<string, number> | undefined) ||
                      (Array.isArray(funnelData) ? null : funnelData) || {
                        totalLeads: Array.isArray(funnelData) ? (funnelData[0]?.count ?? 0) : 0,
                        contacted: Array.isArray(funnelData) ? (funnelData[1]?.count ?? 0) : 0,
                        qualified: 0,
                        visitsDone: Array.isArray(funnelData) ? (funnelData[2]?.count ?? 0) : 0,
                        negotiation: Array.isArray(funnelData) ? (funnelData[3]?.count ?? 0) : 0,
                        won: Array.isArray(funnelData) ? (funnelData[4]?.count ?? 0) : 0,
                      };
                    return (
                      <div className="grid grid-cols-2 sm:grid-cols-6 gap-3 text-[13px]">
                        <div className="border border-[#E5E5E5] rounded-[8px] p-3.5 bg-white">
                          <span className="text-[12px] text-[#737373] block">Total</span>
                          <span className="text-[18px] font-semibold text-[#0A0A0A] tabular-nums">{funnel.totalLeads ?? 0}</span>
                        </div>
                        <div className="border border-[#E5E5E5] rounded-[8px] p-3.5 bg-white">
                          <span className="text-[12px] text-[#737373] block">Contacted</span>
                          <span className="text-[18px] font-semibold text-[#0A0A0A] tabular-nums">{funnel.contacted ?? 0}</span>
                        </div>
                        <div className="border border-[#E5E5E5] rounded-[8px] p-3.5 bg-white">
                          <span className="text-[12px] text-[#737373] block">Qualified</span>
                          <span className="text-[18px] font-semibold text-[#0A0A0A] tabular-nums">{funnel.qualified ?? 0}</span>
                        </div>
                        <div className="border border-[#E5E5E5] rounded-[8px] p-3.5 bg-white">
                          <span className="text-[12px] text-[#737373] block">Visits done</span>
                          <span className="text-[18px] font-semibold text-[#0A0A0A] tabular-nums">{funnel.visitsDone ?? 0}</span>
                        </div>
                        <div className="border border-[#E5E5E5] rounded-[8px] p-3.5 bg-white">
                          <span className="text-[12px] text-[#737373] block">Negotiation</span>
                          <span className="text-[18px] font-semibold text-[#0A0A0A] tabular-nums">{funnel.negotiation ?? 0}</span>
                        </div>
                        <div className="border border-[#0A0A0A] rounded-[8px] p-3.5 bg-[#0A0A0A] text-white">
                          <span className="text-[12px] text-[#737373] block">Won deals</span>
                          <span className="text-[18px] font-semibold text-white tabular-nums">{funnel.won ?? 0}</span>
                        </div>
                      </div>
                    );
                  })()}
                  <div className="pt-2 text-[12px] text-[#737373]">
                    Average lead velocity from inquiry to visit:{' '}
                    <strong className="text-[#0A0A0A]">
                      {typeof leadsData.avgVelocityDays === 'number'
                        ? leadsData.avgVelocityDays
                        : (leadsData.avgVelocityDays as { toSiteVisit?: number } | undefined)?.toSiteVisit ?? 2.8}{' '}
                      days
                    </strong>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
