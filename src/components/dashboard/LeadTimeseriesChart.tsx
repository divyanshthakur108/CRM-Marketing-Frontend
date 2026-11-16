import { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { AnalyticsTimeseriesPoint, AnalyticsKpi } from '../../hooks/useAnalytics';
import { formatCurrency } from '../../lib/formatters';
import { TrendingUp, BarChart2 } from 'lucide-react';

export interface LeadTimeseriesChartProps {
  timeseries?: AnalyticsTimeseriesPoint[];
  kpis?: AnalyticsKpi;
  selectedRange: '7D' | '30D' | '90D';
  onRangeChange: (range: '7D' | '30D' | '90D') => void;
  isLoading?: boolean;
}

type MetricMode = 'leads' | 'spend' | 'impressions';

const METRIC_CONFIGS: Record<
  MetricMode,
  {
    label: string;
    unit: string;
    stroke: string;
    gradientStart: string;
    gradientEnd: string;
    formatter: (val: number) => string;
  }
> = {
  leads: {
    label: 'Inbound Leads',
    unit: 'leads',
    stroke: '#10B981',
    gradientStart: 'rgba(16, 185, 129, 0.28)',
    gradientEnd: 'rgba(16, 185, 129, 0.01)',
    formatter: (val: number) => `${val.toLocaleString()} leads`,
  },
  spend: {
    label: 'Ad Spend',
    unit: '₹',
    stroke: '#8B5CF6',
    gradientStart: 'rgba(139, 92, 246, 0.28)',
    gradientEnd: 'rgba(139, 92, 246, 0.01)',
    formatter: (val: number) => formatCurrency(val),
  },
  impressions: {
    label: 'Ad Impressions',
    unit: 'views',
    stroke: '#0284C7',
    gradientStart: 'rgba(2, 132, 199, 0.28)',
    gradientEnd: 'rgba(2, 132, 199, 0.01)',
    formatter: (val: number) => `${val.toLocaleString()} views`,
  },
};

export function LeadTimeseriesChart({
  timeseries = [],
  kpis,
  selectedRange,
  onRangeChange,
  isLoading = false,
}: LeadTimeseriesChartProps) {
  const [metricMode, setMetricMode] = useState<MetricMode>('leads');

  const currentConfig = METRIC_CONFIGS[metricMode];

  // Format dates for chart X-Axis
  const chartData = useMemo(() => {
    return timeseries.map((pt) => {
      let displayDate = pt.date;
      try {
        const d = new Date(pt.date);
        displayDate = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      } catch {
        displayDate = pt.date;
      }

      return {
        ...pt,
        displayDate,
        value: pt[metricMode] ?? 0,
      };
    });
  }, [timeseries, metricMode]);

  // Aggregate total for the selected metric
  const metricTotal = useMemo(() => {
    if (!kpis) {
      return chartData.reduce((acc, curr) => acc + (curr.value || 0), 0);
    }
    if (metricMode === 'leads') return kpis.totalLeads;
    if (metricMode === 'spend') return kpis.totalSpend;
    if (metricMode === 'impressions') return kpis.totalImpressions;
    return 0;
  }, [kpis, chartData, metricMode]);

  if (isLoading) {
    return (
      <div className="rounded-2xl bg-white border border-[#EDF0F2] p-6 shadow-[0_0_2px_0_rgba(145,158,171,0.2),0_12px_24px_-4px_rgba(145,158,171,0.12)] space-y-4">
        <div className="flex items-center justify-between">
          <div className="h-6 w-44 bg-slate-100 rounded-md animate-pulse" />
          <div className="h-8 w-32 bg-slate-100 rounded-md animate-pulse" />
        </div>
        <div className="h-64 w-full bg-slate-50 rounded-xl animate-pulse" />
      </div>
    );
  }

  const hasData = chartData.length > 0;

  return (
    <div className="rounded-2xl bg-white border border-[#EDF0F2] p-6 shadow-[0_0_2px_0_rgba(145,158,171,0.2),0_12px_24px_-4px_rgba(145,158,171,0.12)] flex flex-col justify-between">
      {/* Header with Title, Range Selector & Metric Switches */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#EDF0F2]">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-[#1F2937]">Performance Overview</h2>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700">
              <TrendingUp className="w-3 h-3 stroke-[2.5]" />
              <span>Real-Time Sync</span>
            </span>
          </div>
          <p className="text-xs text-[#64748B] mt-0.5">
            {currentConfig.label}:{' '}
            <strong className="text-[#1F2937] font-semibold">
              {metricMode === 'spend' ? formatCurrency(metricTotal) : metricTotal.toLocaleString()}
            </strong>{' '}
            in selected window ({selectedRange})
          </p>
        </div>

        {/* Action Controls: Metric Tabs & Date Range */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Metric Selector Tabs */}
          <div className="inline-flex rounded-xl bg-slate-100 p-0.5 text-xs font-semibold">
            {(['leads', 'spend', 'impressions'] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setMetricMode(mode)}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  metricMode === mode
                    ? 'bg-white text-[#1F2937] shadow-xs'
                    : 'text-[#64748B] hover:text-[#1F2937]'
                }`}
              >
                {mode === 'leads' ? 'Leads' : mode === 'spend' ? 'Ad Spend' : 'Impressions'}
              </button>
            ))}
          </div>

          {/* Date Range Selector */}
          <div className="inline-flex rounded-xl border border-[#EDF0F2] bg-white p-0.5 text-xs font-semibold">
            {(['7D', '30D', '90D'] as const).map((range) => (
              <button
                key={range}
                type="button"
                onClick={() => onRangeChange(range)}
                className={`px-2.5 py-1.5 rounded-lg transition-all ${
                  selectedRange === range
                    ? 'bg-[#10B981] text-white shadow-xs'
                    : 'text-[#64748B] hover:text-[#1F2937]'
                }`}
              >
                {range}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Chart Visualization */}
      <div className="pt-6">
        {!hasData ? (
          <div className="h-64 flex flex-col items-center justify-center text-center p-6 bg-slate-50/50 rounded-xl border border-dashed border-[#EDF0F2]">
            <BarChart2 className="w-10 h-10 text-[#64748B]/40 mb-2" />
            <p className="text-sm font-semibold text-[#1F2937]">No Timeseries Data</p>
            <p className="text-xs text-[#64748B] mt-1 max-w-xs">
              Performance metrics from Meta campaigns and lead events will populate here as campaigns run.
            </p>
          </div>
        ) : (
          <div className="w-full h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="performanceGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={currentConfig.gradientStart} />
                    <stop offset="95%" stopColor={currentConfig.gradientEnd} />
                  </linearGradient>
                </defs>

                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#EDF0F2"
                />

                <XAxis
                  dataKey="displayDate"
                  stroke="#94A3B8"
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: '#EDF0F2' }}
                  dy={6}
                />

                <YAxis
                  stroke="#94A3B8"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(val) => {
                    if (metricMode === 'spend') {
                      return val >= 1000 ? `₹${(val / 1000).toFixed(0)}k` : `₹${val}`;
                    }
                    if (val >= 1000) return `${(val / 1000).toFixed(0)}k`;
                    return String(val);
                  }}
                  allowDecimals={false}
                />

                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const item = payload[0].payload as AnalyticsTimeseriesPoint & { displayDate: string; value: number };
                    return (
                      <div className="rounded-xl bg-white border border-[#EDF0F2] p-3 shadow-[0_12px_24px_-4px_rgba(145,158,171,0.16)] text-xs space-y-1.5 min-w-[140px]">
                        <p className="font-semibold text-[#1F2937] border-b border-[#EDF0F2] pb-1">
                          {item.date}
                        </p>
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-[#64748B] flex items-center gap-1.5">
                            <span
                              className="w-2 h-2 rounded-full"
                              style={{ backgroundColor: currentConfig.stroke }}
                            />
                            {currentConfig.label}:
                          </span>
                          <span className="font-bold text-[#1F2937] tabular-nums">
                            {currentConfig.formatter(item.value)}
                          </span>
                        </div>
                        {metricMode !== 'leads' && (
                          <div className="flex items-center justify-between gap-3 text-slate-500">
                            <span>Leads:</span>
                            <span className="font-semibold text-[#1F2937] tabular-nums">
                              {item.leads}
                            </span>
                          </div>
                        )}
                        {metricMode !== 'spend' && item.spend > 0 && (
                          <div className="flex items-center justify-between gap-3 text-slate-500">
                            <span>Spend:</span>
                            <span className="font-semibold text-[#1F2937] tabular-nums">
                              {formatCurrency(item.spend)}
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  }}
                />

                <Area
                  type="monotone"
                  dataKey="value"
                  stroke={currentConfig.stroke}
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#performanceGradient)"
                  dot={false}
                  activeDot={{
                    r: 5,
                    fill: currentConfig.stroke,
                    stroke: '#FFFFFF',
                    strokeWidth: 2,
                  }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}

