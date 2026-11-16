import { Link } from 'react-router-dom';
import { Zap, ArrowRight } from 'lucide-react';
import { CampaignAnalyticsItem } from '../../hooks/useAnalytics';
import { formatCurrency } from '../../lib/formatters';

export interface CampaignSummaryWidgetProps {
  campaigns?: CampaignAnalyticsItem[];
  isLoading: boolean;
  isError?: boolean;
}

export function CampaignSummaryWidget({
  campaigns = [],
  isLoading,
  isError = false,
}: CampaignSummaryWidgetProps) {
  if (isLoading) {
    return (
      <div className="rounded-2xl bg-white border border-[#EDF0F2] p-6 shadow-[0_0_2px_0_rgba(145,158,171,0.2),0_12px_24px_-4px_rgba(145,158,171,0.12)] space-y-4">
        <div className="h-6 w-44 bg-slate-100 rounded-md animate-pulse" />
        <div className="space-y-3">
          <div className="h-16 w-full bg-slate-50 rounded-xl animate-pulse" />
          <div className="h-16 w-full bg-slate-50 rounded-xl animate-pulse" />
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-2xl bg-white border border-[#EDF0F2] p-6 shadow-[0_0_2px_0_rgba(145,158,171,0.2),0_12px_24px_-4px_rgba(145,158,171,0.12)] flex flex-col justify-between">
        <div className="pb-4 border-b border-[#EDF0F2]">
          <h2 className="text-base font-bold text-[#1F2937]">Campaign Performance</h2>
          <p className="text-xs text-[#64748B] mt-0.5">
            Active paid advertising campaigns on Meta.
          </p>
        </div>
        <div className="p-6 rounded-xl bg-slate-50 border border-[#EDF0F2] text-center my-4">
          <p className="text-xs text-[#64748B]">
            Campaign analytics restricted or currently unavailable for this role.
          </p>
        </div>
      </div>
    );
  }

  const activeCampaigns = campaigns.slice(0, 4);

  return (
    <div className="rounded-2xl bg-white border border-[#EDF0F2] p-6 shadow-[0_0_2px_0_rgba(145,158,171,0.2),0_12px_24px_-4px_rgba(145,158,171,0.12)] flex flex-col justify-between">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-[#EDF0F2]">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-[#1F2937]">Active Campaigns</h2>
            <Zap className="w-4 h-4 text-[#F59E0B]" />
          </div>
          <p className="text-xs text-[#64748B] mt-0.5">
            Meta &amp; Instagram advertising telemetry
          </p>
        </div>
        <Link
          to="/campaigns"
          className="text-xs font-semibold text-[#10B981] hover:text-[#059669] inline-flex items-center gap-1 transition-colors"
        >
          <span>All Ads</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Content */}
      <div className="pt-4 flex-1">
        {activeCampaigns.length === 0 ? (
          <div className="h-44 flex flex-col items-center justify-center text-center p-4">
            <Zap className="w-8 h-8 text-slate-300 mb-2" />
            <p className="text-sm font-semibold text-[#1F2937]">No Active Campaigns</p>
            <p className="text-xs text-[#64748B] mt-1 max-w-xs">
              Launch targeted Meta and Instagram ad campaigns to generate qualified property buyer leads.
            </p>
            <Link
              to="/campaigns"
              className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#10B981] text-white hover:bg-[#059669] shadow-xs transition-colors"
            >
              <span>Create Campaign</span>
            </Link>
          </div>
        ) : (
          <div className="space-y-2.5">
            {activeCampaigns.map((camp) => (
              <div
                key={camp.id}
                className="p-3.5 rounded-xl border border-[#EDF0F2] hover:border-slate-300 hover:bg-slate-50/70 transition-all flex items-center justify-between gap-3"
              >
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-[#1F2937] truncate">
                      {camp.name}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        camp.status === 'ACTIVE'
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {camp.status}
                    </span>
                  </div>
                  <p className="text-xs text-[#64748B]">
                    {camp.projectName || 'General Real Estate'}
                  </p>
                </div>

                <div className="flex items-center gap-3 text-right shrink-0 tabular-nums text-xs">
                  <div>
                    <p className="font-semibold text-[#1F2937]">{formatCurrency(camp.totalSpend)}</p>
                    <p className="text-[10px] text-[#64748B]">Spend</p>
                  </div>
                  <div>
                    <p className="font-bold text-[#10B981]">{camp.leads}</p>
                    <p className="text-[10px] text-[#64748B]">Leads</p>
                  </div>
                  <div className="hidden sm:block">
                    <p className="font-semibold text-[#1F2937]">{formatCurrency(camp.cpl)}</p>
                    <p className="text-[10px] text-[#64748B]">CPL</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
