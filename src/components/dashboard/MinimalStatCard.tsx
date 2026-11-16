import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

export type StatColorTone = 'emerald' | 'amber' | 'purple' | 'rose' | 'cyan';

export interface MinimalStatCardProps {
  label: string;
  value: string | number;
  tone: StatColorTone;
  icon: React.ReactNode;
  helperText?: string;
  change?: string | number;
  trendDirection?: 'up' | 'down' | 'neutral';
  trendLabel?: string;
  sparklineData?: number[];
  isLoading?: boolean;
}

const TONE_STYLES: Record<
  StatColorTone,
  {
    iconBg: string;
    iconColor: string;
    strokeColor: string;
    gradientStop: string;
  }
> = {
  emerald: {
    iconBg: 'bg-[#E8F7F1]',
    iconColor: 'text-[#10B981]',
    strokeColor: '#10B981',
    gradientStop: '#10B981',
  },
  amber: {
    iconBg: 'bg-[#FEF3C7]',
    iconColor: 'text-[#D97706]',
    strokeColor: '#D97706',
    gradientStop: '#F59E0B',
  },
  purple: {
    iconBg: 'bg-[#EDE9FE]',
    iconColor: 'text-[#8B5CF6]',
    strokeColor: '#8B5CF6',
    gradientStop: '#8B5CF6',
  },
  rose: {
    iconBg: 'bg-[#FEE2E2]',
    iconColor: 'text-[#EF4444]',
    strokeColor: '#EF4444',
    gradientStop: '#EF4444',
  },
  cyan: {
    iconBg: 'bg-[#E0F2FE]',
    iconColor: 'text-[#0284C7]',
    strokeColor: '#0284C7',
    gradientStop: '#0284C7',
  },
};

export function MinimalStatCard({
  label,
  value,
  tone,
  icon,
  helperText,
  change,
  trendDirection,
  trendLabel,
  sparklineData,
  isLoading = false,
}: MinimalStatCardProps) {
  const styles = TONE_STYLES[tone] || TONE_STYLES.emerald;

  if (isLoading) {
    return (
      <div className="rounded-2xl bg-white border border-[#EDF0F2] p-5 shadow-[0_0_2px_0_rgba(145,158,171,0.2),0_12px_24px_-4px_rgba(145,158,171,0.12)] space-y-4">
        <div className="flex items-center justify-between">
          <div className="h-4 w-28 bg-slate-100 rounded-md animate-pulse" />
          <div className="h-12 w-12 bg-slate-100 rounded-xl animate-pulse" />
        </div>
        <div className="h-8 w-24 bg-slate-100 rounded-md animate-pulse" />
        <div className="h-3 w-36 bg-slate-100 rounded-md animate-pulse" />
      </div>
    );
  }

  // Mini Sparkline SVG rendering if array of points provided
  const renderSparkline = () => {
    if (!sparklineData || sparklineData.length < 2) return null;
    const min = Math.min(...sparklineData);
    const max = Math.max(...sparklineData);
    const range = max - min || 1;
    const width = 64;
    const height = 24;

    const points = sparklineData
      .map((val, idx) => {
        const x = (idx / (sparklineData.length - 1)) * width;
        const y = height - ((val - min) / range) * (height - 6) - 3;
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(' ');

    return (
      <svg className="w-16 h-6 overflow-visible shrink-0" aria-hidden="true">
        <polyline
          fill="none"
          stroke={styles.strokeColor}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={points}
        />
      </svg>
    );
  };

  const renderTrendBadge = () => {
    if (!change && !trendDirection) return null;
    const isUp = trendDirection === 'up' || (typeof change === 'string' && change.startsWith('+'));
    const isDown = trendDirection === 'down' || (typeof change === 'string' && change.startsWith('-'));

    const Icon = isUp ? TrendingUp : isDown ? TrendingDown : Minus;
    const badgeBg = isUp ? 'bg-emerald-50 text-emerald-700' : isDown ? 'bg-rose-50 text-rose-700' : 'bg-slate-100 text-slate-700';

    return (
      <div className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-xs font-semibold ${badgeBg}`}>
        <Icon className="w-3 h-3 stroke-[2.5]" />
        <span>{change}</span>
        {trendLabel && <span className="text-slate-500 font-normal ml-0.5">{trendLabel}</span>}
      </div>
    );
  };

  return (
    <div className="relative overflow-hidden rounded-2xl bg-white border border-[#EDF0F2] p-5 shadow-[0_0_2px_0_rgba(145,158,171,0.2),0_12px_24px_-4px_rgba(145,158,171,0.12)] hover:shadow-[0_0_2px_0_rgba(145,158,171,0.2),0_16px_32px_-4px_rgba(145,158,171,0.16)] transition-all duration-200 flex flex-col justify-between">
      {/* Top Row: Label and Pastel Icon */}
      <div className="flex items-start justify-between gap-3 mb-2">
        <div>
          <p className="text-xs font-semibold tracking-wider uppercase text-[#64748B]">
            {label}
          </p>
        </div>
        <div
          className={`h-11 w-11 rounded-xl ${styles.iconBg} ${styles.iconColor} shrink-0 flex items-center justify-center transition-transform group-hover:scale-105`}
        >
          {icon}
        </div>
      </div>

      {/* Middle Row: Large 28px Value & Trend */}
      <div className="flex items-baseline justify-between gap-2 mt-1">
        <div className="text-[28px] font-bold tracking-tight text-[#1F2937] tabular-nums leading-none">
          {value}
        </div>
        {renderTrendBadge()}
      </div>

      {/* Bottom Row: Helper Text / Sparkline */}
      {(helperText || sparklineData) && (
        <div className="mt-4 pt-3 border-t border-[#EDF0F2] flex items-center justify-between text-xs text-[#64748B]">
          {helperText && <span className="line-clamp-1">{helperText}</span>}
          {renderSparkline()}
        </div>
      )}
    </div>
  );
}

