import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts';
import { Users, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { LeadStage } from '../../hooks/useLeads';

export interface LeadPipelineFunnelProps {
  stageCounts?: Record<LeadStage | string, number>;
  totalLeads: number;
  isLoading: boolean;
  onRetry?: () => void;
}

const STAGES: { key: LeadStage; label: string; color: string }[] = [
  { key: 'New', label: 'New', color: '#10B981' },
  { key: 'Contacted', label: 'Contacted', color: '#3B82F6' },
  { key: 'Qualified', label: 'Qualified', color: '#8B5CF6' },
  { key: 'Visit scheduled', label: 'Visit Sched', color: '#F59E0B' },
  { key: 'Visit done', label: 'Visit Done', color: '#06B6D4' },
  { key: 'Negotiation', label: 'Negotiation', color: '#10B981' },
  { key: 'Won/Lost', label: 'Won', color: '#059669' },
];

export function LeadPipelineFunnel({
  stageCounts = {},
  totalLeads,
  isLoading,
  onRetry,
}: LeadPipelineFunnelProps) {
  if (isLoading) {
    return (
      <div className="rounded-2xl bg-white border border-[#EDF0F2] p-6 shadow-[0_0_2px_0_rgba(145,158,171,0.2),0_12px_24px_-4px_rgba(145,158,171,0.12)] space-y-4">
        <div className="h-6 w-48 bg-slate-100 rounded-md animate-pulse" />
        <div className="h-56 w-full bg-slate-50 rounded-xl animate-pulse" />
      </div>
    );
  }

  // Build chart dataset from real stageCounts
  const chartData = STAGES.map((stage) => {
    const count = stageCounts[stage.key] || 0;
    const conversion = totalLeads > 0 ? Math.round((count / totalLeads) * 100) : 0;
    return {
      stage: stage.label,
      rawKey: stage.key,
      count,
      conversion,
      color: stage.color,
    };
  });

  const wonCount = stageCounts['Won/Lost'] || 0;
  const overallConversion = totalLeads > 0 ? Math.round((wonCount / totalLeads) * 100) : 0;

  return (
    <div className="rounded-2xl bg-white border border-[#EDF0F2] p-6 shadow-[0_0_2px_0_rgba(145,158,171,0.2),0_12px_24px_-4px_rgba(145,158,171,0.12)] flex flex-col justify-between">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-[#EDF0F2]">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-[#1F2937]">Lead Conversion Pipeline</h2>
            <Users className="w-4 h-4 text-[#10B981]" />
          </div>
          <p className="text-xs text-[#64748B] mt-0.5">
            Stage progression across {totalLeads} active leads ({overallConversion}% closed-won conversion)
          </p>
        </div>
        <Link
          to="/leads"
          className="text-xs font-semibold text-[#10B981] hover:text-[#059669] inline-flex items-center gap-1 transition-colors"
        >
          <span>View Pipeline</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Content */}
      <div className="pt-4 space-y-4">
        {totalLeads === 0 ? (
          <div className="h-56 flex flex-col items-center justify-center text-center p-4">
            <Users className="w-8 h-8 text-slate-300 mb-2" />
            <p className="text-sm font-semibold text-[#1F2937]">No Leads in Pipeline</p>
            <p className="text-xs text-[#64748B] mt-1 max-w-xs">
              Leads from Meta ads, WhatsApp campaigns, and manual entries will appear here organized by conversion stage.
            </p>
            <Link
              to="/leads"
              className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#10B981] text-white hover:bg-[#059669] shadow-xs transition-colors"
              onClick={onRetry}
            >
              <span>Add First Lead</span>
            </Link>
          </div>
        ) : (
          <>
            {/* Recharts Bar Visualization */}
            <div className="w-full h-52" aria-hidden="true">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis
                    dataKey="stage"
                    stroke="#94A3B8"
                    fontSize={11}
                    tickLine={false}
                    axisLine={{ stroke: '#EDF0F2' }}
                    dy={4}
                  />
                  <YAxis
                    stroke="#94A3B8"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null;
                      const data = payload[0].payload;
                      return (
                        <div className="rounded-xl bg-white border border-[#EDF0F2] p-2.5 shadow-[0_12px_24px_-4px_rgba(145,158,171,0.16)] text-xs space-y-1">
                          <p className="font-semibold text-[#1F2937]">{data.rawKey}</p>
                          <p className="text-[#64748B]">
                            Leads: <strong className="text-[#1F2937] tabular-nums">{data.count}</strong>
                          </p>
                          <p className="text-[#64748B]">
                            Share of Pipeline: <strong className="text-[#1F2937] tabular-nums">{data.conversion}%</strong>
                          </p>
                        </div>
                      );
                    }}
                  />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                    {chartData.map((entry) => (
                      <Cell key={entry.rawKey} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Stage Quick Summary Row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 pt-2 border-t border-[#EDF0F2]">
              {chartData.map((item) => (
                <div
                  key={item.rawKey}
                  className="bg-slate-50 rounded-xl p-2 text-center border border-[#EDF0F2]/50"
                >
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-[#64748B] truncate">
                    {item.stage}
                  </p>
                  <p className="text-sm font-bold text-[#1F2937] tabular-nums mt-0.5">
                    {item.count}
                  </p>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
