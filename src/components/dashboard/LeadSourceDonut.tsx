import { useMemo } from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { PieChart as PieIcon } from 'lucide-react';

export interface LeadSourceDonutProps {
  sourceAttribution?: Array<{
    source: string;
    leads: number;
    percentage: number;
  }>;
  isLoading?: boolean;
}

const PALETTE = [
  '#10B981', // Emerald
  '#3B82F6', // Blue
  '#8B5CF6', // Purple
  '#F59E0B', // Amber
  '#EC4899', // Pink
  '#06B6D4', // Cyan
  '#64748B', // Slate
];

export function LeadSourceDonut({
  sourceAttribution = [],
  isLoading = false,
}: LeadSourceDonutProps) {
  const totalLeads = useMemo(() => {
    return sourceAttribution.reduce((acc, curr) => acc + (curr.leads || 0), 0);
  }, [sourceAttribution]);

  const chartData = useMemo(() => {
    return sourceAttribution.map((item, idx) => ({
      name: item.source.replace(/_/g, ' '),
      leads: item.leads,
      percentage: item.percentage,
      color: PALETTE[idx % PALETTE.length],
    }));
  }, [sourceAttribution]);

  if (isLoading) {
    return (
      <div className="rounded-2xl bg-white border border-[#EDF0F2] p-6 shadow-[0_0_2px_0_rgba(145,158,171,0.2),0_12px_24px_-4px_rgba(145,158,171,0.12)] space-y-4">
        <div className="h-6 w-36 bg-slate-100 rounded-md animate-pulse" />
        <div className="h-60 w-full bg-slate-50 rounded-full animate-pulse" />
      </div>
    );
  }

  const hasData = chartData.length > 0 && totalLeads > 0;

  return (
    <div className="rounded-2xl bg-white border border-[#EDF0F2] p-6 shadow-[0_0_2px_0_rgba(145,158,171,0.2),0_12px_24px_-4px_rgba(145,158,171,0.12)] flex flex-col justify-between">
      {/* Header */}
      <div className="pb-4 border-b border-[#EDF0F2]">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-[#1F2937]">Lead Sources</h2>
            <p className="text-xs text-[#64748B] mt-0.5">
              Acquisition channels across {totalLeads} buyer leads
            </p>
          </div>
          <div className="h-8 w-8 rounded-lg bg-emerald-50 text-[#10B981] flex items-center justify-center">
            <PieIcon className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Chart & Donut Center */}
      <div className="pt-4 flex flex-col items-center justify-center">
        {!hasData ? (
          <div className="h-60 flex flex-col items-center justify-center text-center p-4">
            <PieIcon className="w-10 h-10 text-[#64748B]/40 mb-2" />
            <p className="text-sm font-semibold text-[#1F2937]">No Lead Attribution Yet</p>
            <p className="text-xs text-[#64748B] mt-1 max-w-[200px]">
              Channel sources from Meta Ads, WhatsApp, and Web Forms will display once leads are received.
            </p>
          </div>
        ) : (
          <div className="relative w-full h-56 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const item = payload[0].payload;
                    return (
                      <div className="rounded-xl bg-white border border-[#EDF0F2] p-2.5 shadow-[0_12px_24px_-4px_rgba(145,158,171,0.16)] text-xs space-y-1">
                        <div className="flex items-center gap-1.5 font-semibold text-[#1F2937]">
                          <span
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: item.color }}
                          />
                          <span>{item.name}</span>
                        </div>
                        <p className="text-[#64748B]">
                          Leads: <strong className="text-[#1F2937] tabular-nums">{item.leads}</strong> ({item.percentage}%)
                        </p>
                      </div>
                    );
                  }}
                />
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={65}
                  outerRadius={88}
                  paddingAngle={3}
                  dataKey="leads"
                  strokeWidth={0}
                >
                  {chartData.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>

            {/* Metric Inside Center Hole */}
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-2xl font-bold tracking-tight text-[#1F2937] tabular-nums leading-none">
                {totalLeads}
              </span>
              <span className="text-[11px] font-medium uppercase tracking-wider text-[#64748B] mt-1">
                Total Leads
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Legend Grid Below */}
      {hasData && (
        <div className="pt-4 border-t border-[#EDF0F2] grid grid-cols-2 gap-2 text-xs">
          {chartData.map((item) => (
            <div key={item.name} className="flex items-center justify-between p-1.5 rounded-lg bg-slate-50/80">
              <div className="flex items-center gap-1.5 min-w-0 pr-1">
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: item.color }}
                />
                <span className="font-medium text-[#1F2937] truncate capitalize">
                  {item.name.toLowerCase()}
                </span>
              </div>
              <span className="font-semibold text-[#64748B] tabular-nums shrink-0">
                {item.percentage}%
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

