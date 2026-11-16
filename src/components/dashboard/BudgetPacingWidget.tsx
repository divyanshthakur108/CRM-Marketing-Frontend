import { Link } from 'react-router-dom';
import { Wallet, ArrowRight, Layers } from 'lucide-react';
import { NormalizedBudget, FrontendProjectAllocation } from '../../hooks/useBudget';
import { formatCurrency } from '../../lib/formatters';

export interface BudgetPacingWidgetProps {
  budgetData?: NormalizedBudget;
  totalSpent: number;
  isLoading: boolean;
  isError?: boolean;
}

export function BudgetPacingWidget({
  budgetData,
  totalSpent,
  isLoading,
  isError = false,
}: BudgetPacingWidgetProps) {
  if (isLoading) {
    return (
      <div className="rounded-2xl bg-white border border-[#EDF0F2] p-6 shadow-[0_0_2px_0_rgba(145,158,171,0.2),0_12px_24px_-4px_rgba(145,158,171,0.12)] space-y-4">
        <div className="h-6 w-36 bg-slate-100 rounded-md animate-pulse" />
        <div className="h-8 w-full bg-slate-50 rounded-xl animate-pulse" />
        <div className="h-24 w-full bg-slate-50 rounded-xl animate-pulse" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-2xl bg-white border border-[#EDF0F2] p-6 shadow-[0_0_2px_0_rgba(145,158,171,0.2),0_12px_24px_-4px_rgba(145,158,171,0.12)] flex flex-col justify-between">
        <div className="pb-4 border-b border-[#EDF0F2]">
          <h2 className="text-base font-bold text-[#1F2937]">Budget Pacing</h2>
          <p className="text-xs text-[#64748B] mt-0.5">
            Budget telemetry restricted or unavailable.
          </p>
        </div>
        <div className="p-6 rounded-xl bg-slate-50 border border-[#EDF0F2] text-center my-4">
          <p className="text-xs text-[#64748B]">
            Budget telemetry restricted or currently unavailable for this role.
          </p>
        </div>
      </div>
    );
  }

  const totalCap = budgetData?.overallCap || 0;
  const remainingBudget = Math.max(0, totalCap - totalSpent);
  const pacingPercentage = totalCap > 0 ? Math.min(100, Math.round((totalSpent / totalCap) * 100)) : 0;

  const getStatusBadge = () => {
    if (totalCap === 0) {
      return (
        <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
          Not Configured
        </span>
      );
    }
    if (totalSpent > totalCap) {
      return (
        <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700">
          Exceeded Cap
        </span>
      );
    }
    if (pacingPercentage > 90) {
      return (
        <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700">
          Near Cap ({pacingPercentage}%)
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700">
        On Track ({pacingPercentage}%)
      </span>
    );
  };

  return (
    <div className="rounded-2xl bg-white border border-[#EDF0F2] p-6 shadow-[0_0_2px_0_rgba(145,158,171,0.2),0_12px_24px_-4px_rgba(145,158,171,0.12)] flex flex-col justify-between">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-[#EDF0F2]">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-[#1F2937]">Monthly Budget Pacing</h2>
            <Wallet className="w-4 h-4 text-[#8B5CF6]" />
          </div>
          <p className="text-xs text-[#64748B] mt-0.5">
            Ad spend deployment against overall cap
          </p>
        </div>
        <Link
          to="/budget"
          className="text-xs font-semibold text-[#10B981] hover:text-[#059669] inline-flex items-center gap-1 transition-colors"
        >
          <span>Budget Manager</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Main Metric & Progress */}
      <div className="pt-4 space-y-4">
        {totalCap === 0 ? (
          <div className="text-center py-6">
            <div className="w-10 h-10 rounded-xl bg-slate-100 text-[#64748B] flex items-center justify-center mx-auto mb-2 border border-[#EDF0F2]">
              <Layers className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-semibold text-[#1F2937]">No Active Monthly Budget</h4>
            <p className="text-xs text-[#64748B] mt-1 max-w-xs mx-auto">
              Configure your monthly paid advertising budget and project allocations.
            </p>
            <Link
              to="/budget"
              className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#10B981] text-white hover:bg-[#059669] shadow-xs transition-colors"
            >
              <span>Set Monthly Cap</span>
            </Link>
          </div>
        ) : (
          <>
            <div>
              <div className="flex items-baseline justify-between">
                <div>
                  <span className="text-2xl font-bold tracking-tight text-[#1F2937] tabular-nums">
                    {formatCurrency(totalSpent)}
                  </span>
                  <span className="text-xs text-[#64748B] ml-2">
                    of {formatCurrency(totalCap)} monthly cap
                  </span>
                </div>
                {getStatusBadge()}
              </div>

              {/* Progress Bar */}
              <div
                role="progressbar"
                aria-valuenow={pacingPercentage}
                aria-valuemin={0}
                aria-valuemax={100}
                className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden mt-3"
              >
                <div
                  className="h-full bg-gradient-to-r from-[#10B981] to-[#059669] rounded-full transition-all duration-300"
                  style={{ width: `${pacingPercentage}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-xs text-[#64748B] mt-2 tabular-nums">
                <span className="font-medium text-[#1F2937]">{pacingPercentage}% Deployed</span>
                <span>{formatCurrency(remainingBudget)} Available</span>
              </div>
            </div>

            {/* Project Allocations Breakdown */}
            <div className="pt-3 border-t border-[#EDF0F2] space-y-2">
              <p className="text-[11px] font-bold uppercase tracking-wider text-[#64748B]">
                Project Allocations
              </p>

              {budgetData?.allocations && budgetData.allocations.length > 0 ? (
                <div className="space-y-2">
                  {budgetData.allocations.slice(0, 3).map((alloc: FrontendProjectAllocation) => {
                    const pct = totalCap > 0 ? Math.round((alloc.allocatedAmount / totalCap) * 100) : 0;
                    return (
                      <div key={alloc.projectId} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-[#1F2937] font-medium truncate max-w-[180px]">
                            {alloc.projectName}
                          </span>
                          <span className="font-bold text-[#1F2937] tabular-nums">
                            {formatCurrency(alloc.allocatedAmount)}
                          </span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[#10B981]/70 rounded-full"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-[#64748B]">
                  No project-specific allocations configured.
                </p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
