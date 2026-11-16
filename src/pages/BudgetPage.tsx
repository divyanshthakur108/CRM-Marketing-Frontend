import { useState, useId, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { EmptyState } from '../components/ui/EmptyState';
import { useToast } from '../components/ui/Toast';
import { formatCurrency } from '../lib/formatters';
import {
  useBudget,
  useUpdateBudget,
  FrontendProjectAllocation,
} from '../hooks/useBudget';
import {
  Wallet,
  AlertTriangle,
  Save,
  Building2,
  RotateCcw,
  PieChart,
  Target,
  Info,
} from 'lucide-react';

const MONTH_OPTIONS = [
  'October 2026',
  'November 2026',
  'December 2026',
  'January 2027',
  'February 2027',
  'March 2027',
];

export function BudgetPage() {
  const { toast } = useToast();
  const monthSelectId = useId();

  // State
  const [selectedMonth, setSelectedMonth] = useState('November 2026');
  const [overallCap, setOverallCap] = useState<number>(500000);
  const [allocations, setAllocations] = useState<FrontendProjectAllocation[]>([]);
  const [isEditingCap, setIsEditingCap] = useState(false);

  // TanStack Query Hooks
  const { data: budgetData, isLoading, refetch, isFetching } = useBudget(selectedMonth);
  const updateBudgetMutation = useUpdateBudget();

  // Synchronize state when backend data arrives
  useEffect(() => {
    if (budgetData) {
      setOverallCap(budgetData.overallCap ?? 500000);
      setAllocations(Array.isArray(budgetData.allocations) ? budgetData.allocations : []);
    }
  }, [budgetData]);

  // Financial Calculations
  const totalAllocated = useMemo(() => {
    return allocations.reduce((sum, a) => sum + (Number(a.allocatedAmount) || 0), 0);
  }, [allocations]);

  const remainingAmount = overallCap - totalAllocated;
  const isExceeded = totalAllocated > overallCap;
  const percentUsed =
    overallCap > 0 ? Math.round((totalAllocated / overallCap) * 100) : 0;
  const isNearLimit = percentUsed >= 85 && !isExceeded;

  // Channel aggregations
  const channelTotals = useMemo(() => {
    return allocations.reduce(
      (acc, a) => {
        acc.meta += Number(a.metaAds) || 0;
        acc.google += Number(a.googleAds) || 0;
        acc.linkedin += Number(a.linkedinAds) || 0;
        acc.whatsapp += Number(a.directWhatsapp) || 0;
        return acc;
      },
      { meta: 0, google: 0, linkedin: 0, whatsapp: 0 }
    );
  }, [allocations]);

  // Two-way allocation update handler
  const handleUpdateAllocation = (
    projectId: string,
    field: keyof FrontendProjectAllocation,
    value: number
  ) => {
    const cleanValue = Math.max(0, Math.round(Number(value) || 0));

    setAllocations((prev) =>
      prev.map((item) => {
        if (item.projectId !== projectId) return item;
        const updated = { ...item, [field]: cleanValue };

        if (field === 'allocatedAmount') {
          // Auto-distribute by channel proportions: 50% Meta, 35% Google, 10% LinkedIn, remainder WhatsApp
          const metaShare = Math.round(cleanValue * 0.5);
          const googleShare = Math.round(cleanValue * 0.35);
          const linkedinShare = Math.round(cleanValue * 0.1);
          const directShare = Math.max(0, cleanValue - (metaShare + googleShare + linkedinShare));
          return {
            ...updated,
            metaAds: metaShare,
            googleAds: googleShare,
            linkedinAds: linkedinShare,
            directWhatsapp: directShare,
          };
        }

        // When a single channel is updated, compute new total sum
        const newTotal =
          (field === 'metaAds' ? cleanValue : item.metaAds) +
          (field === 'googleAds' ? cleanValue : item.googleAds) +
          (field === 'linkedinAds' ? cleanValue : item.linkedinAds) +
          (field === 'directWhatsapp' ? cleanValue : item.directWhatsapp);

        return { ...updated, allocatedAmount: newTotal };
      })
    );
  };

  // Quick increment helper (+₹10k, +₹50k)
  const handleQuickAdd = (projectId: string, increment: number) => {
    const project = allocations.find((a) => a.projectId === projectId);
    if (!project) return;
    const current = project.allocatedAmount || 0;
    handleUpdateAllocation(projectId, 'allocatedAmount', current + increment);
  };

  // Reset to server values
  const handleReset = async () => {
    await refetch();
    toast({
      title: 'Budget Reloaded',
      message: 'Restored latest saved values from the server.',
      type: 'info',
    });
  };

  // Save budget mutation
  const handleSaveBudget = async () => {
    if (isExceeded) {
      toast({
        title: 'Validation Error',
        message: 'Cannot save: Total allocations exceed the monthly budget ceiling.',
        type: 'error',
      });
      return;
    }

    try {
      await updateBudgetMutation.mutateAsync({
        monthString: selectedMonth,
        overallCap,
        allocations,
      });
      toast({
        title: 'Budget Saved Successfully',
        message: `Allocations for ${selectedMonth} have been persisted.`,
        type: 'success',
      });
    } catch (err: unknown) {
      toast({
        title: 'Save Failed',
        message: err instanceof Error ? err.message : 'Could not persist budget changes.',
        type: 'error',
      });
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Header & Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <nav aria-label="Breadcrumbs" className="flex items-center gap-1.5 text-xs text-[#64748B] mb-1">
            <Link to="/dashboard" className="hover:text-[#10B981] transition-colors">
              Dashboard
            </Link>
            <span className="text-slate-300">/</span>
            <span>Finance</span>
            <span className="text-slate-300">/</span>
            <span className="font-semibold text-[#1F2937]">Budget Management</span>
          </nav>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-[#1F2937]">
              Budget Management
            </h1>
            <span
              className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                isExceeded
                  ? 'bg-rose-50 text-rose-700 border-rose-200'
                  : 'bg-[#E8F7F1] text-[#10B981] border-[#10B981]/20'
              }`}
            >
              {isExceeded ? 'Deficit Alert' : 'Cap Compliant'}
            </span>
          </div>
          <p className="text-xs text-[#64748B] mt-0.5">
            Allocate monthly advertising spend caps across catalog projects and multichannel marketing funnels.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Month Selector Dropdown */}
          <div className="relative">
            <select
              id={monthSelectId}
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="h-9 text-xs font-semibold px-3 py-1.5 rounded-xl border border-[#EDF0F2] bg-white text-[#1F2937] shadow-xs hover:border-slate-300 focus:outline-none focus:ring-1 focus:ring-[#10B981] cursor-pointer"
            >
              {MONTH_OPTIONS.map((m) => (
                <option key={m} value={m}>
                  {m} {m === 'November 2026' ? '(Current)' : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Reset / Reload Button */}
          <button
            type="button"
            onClick={handleReset}
            disabled={isLoading || isFetching}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[#EDF0F2] bg-white text-xs font-semibold text-[#1F2937] hover:bg-slate-50 shadow-xs transition-all active:scale-[0.98] cursor-pointer"
            title="Reload saved budget from server"
          >
            <RotateCcw
              className={`w-3.5 h-3.5 text-[#10B981] ${
                isLoading || isFetching ? 'animate-spin' : ''
              }`}
            />
            <span>Reset</span>
          </button>

          {/* Save Budget Mutation Button */}
          <button
            type="button"
            onClick={handleSaveBudget}
            disabled={isExceeded || updateBudgetMutation.isPending}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#10B981] text-white text-xs font-semibold hover:bg-[#059669] shadow-xs transition-all active:scale-[0.98] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            title="Persist budget allocations"
          >
            <Save className={`w-3.5 h-3.5 ${updateBudgetMutation.isPending ? 'animate-spin' : ''}`} />
            <span>{updateBudgetMutation.isPending ? 'Saving...' : 'Save Budget'}</span>
          </button>
        </div>
      </div>

      {/* 2. Critical Overrun or Warning Banners */}
      {isExceeded && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50/80 p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-start sm:items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <p className="font-bold text-rose-900 text-sm">
                Budget Ceiling Exceeded &bull; Saving is Blocked
              </p>
              <p className="text-rose-800/90 text-xs mt-0.5">
                Total allocations of <strong className="font-bold">{formatCurrency(totalAllocated)}</strong> exceed the
                monthly ceiling of <strong className="font-bold">{formatCurrency(overallCap)}</strong> by{' '}
                <strong className="font-bold text-rose-900">{formatCurrency(Math.abs(remainingAmount))}</strong>. Reduce
                project allocations or raise the monthly cap to save.
              </p>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-rose-200 text-rose-800 shrink-0 self-start sm:self-center">
            Deficit: -{formatCurrency(Math.abs(remainingAmount))}
          </span>
        </div>
      )}

      {isNearLimit && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50/80 p-4 shadow-xs flex items-center gap-3 text-xs">
          <div className="h-9 w-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
            <Info className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div>
            <p className="font-bold text-amber-900 text-sm">Approaching Budget Ceiling</p>
            <p className="text-amber-800/90 text-xs mt-0.5">
              Allocations are at <strong className="font-bold">{percentUsed}%</strong> of total monthly capacity. Only{' '}
              <strong className="font-bold">{formatCurrency(remainingAmount)}</strong> remains available for allocation.
            </p>
          </div>
        </div>
      )}

      {/* 3. Primary Financial KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Monthly Budget Cap */}
        <div className="rounded-2xl bg-white border border-[#EDF0F2] p-5 shadow-[0_0_2px_0_rgba(145,158,171,0.2),0_12px_24px_-4px_rgba(145,158,171,0.12)] flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold tracking-wider uppercase text-[#64748B]">
                Total Budget Ceiling
              </p>
              {isEditingCap ? (
                <div className="flex items-center gap-1 mt-1">
                  <span className="text-lg font-bold text-[#1F2937]">₹</span>
                  <input
                    type="number"
                    value={overallCap}
                    onChange={(e) => setOverallCap(Math.max(0, Number(e.target.value) || 0))}
                    step="50000"
                    min="0"
                    onBlur={() => setIsEditingCap(false)}
                    autoFocus
                    className="w-32 text-xl font-bold text-[#1F2937] tabular-nums px-2 py-0.5 rounded-lg border border-[#10B981] focus:outline-none"
                  />
                </div>
              ) : (
                <div
                  onClick={() => setIsEditingCap(true)}
                  className="text-[26px] font-bold tracking-tight text-[#1F2937] tabular-nums leading-none mt-1.5 cursor-pointer hover:text-[#10B981] transition-colors flex items-center gap-1.5"
                  title="Click to edit budget cap"
                >
                  {isLoading ? (
                    <div className="h-7 w-28 bg-slate-100 rounded-md animate-pulse" />
                  ) : (
                    <>
                      <span>{formatCurrency(overallCap)}</span>
                      <span className="text-[11px] font-normal text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-md">
                        Edit
                      </span>
                    </>
                  )}
                </div>
              )}
            </div>
            <div className="h-10 w-10 rounded-xl bg-[#EDE9FE] text-[#8B5CF6] flex items-center justify-center shrink-0">
              <Wallet className="w-5 h-5 stroke-[2.2]" />
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-[#EDF0F2] flex items-center justify-between text-xs text-[#64748B]">
            <span>Monthly ceiling for {selectedMonth}</span>
            <button
              type="button"
              onClick={() => setIsEditingCap((v) => !v)}
              className="text-[#10B981] hover:underline font-semibold"
            >
              {isEditingCap ? 'Done' : 'Change'}
            </button>
          </div>
        </div>

        {/* KPI 2: Total Allocated Budget */}
        <div className="rounded-2xl bg-white border border-[#EDF0F2] p-5 shadow-[0_0_2px_0_rgba(145,158,171,0.2),0_12px_24px_-4px_rgba(145,158,171,0.12)] flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold tracking-wider uppercase text-[#64748B]">
                Allocated Spend
              </p>
              <div className="text-[26px] font-bold tracking-tight text-[#1F2937] tabular-nums leading-none mt-1.5">
                {isLoading ? (
                  <div className="h-7 w-24 bg-slate-100 rounded-md animate-pulse" />
                ) : (
                  formatCurrency(totalAllocated)
                )}
              </div>
            </div>
            <div className="h-10 w-10 rounded-xl bg-[#EFF6FF] text-[#3B82F6] flex items-center justify-center shrink-0">
              <Building2 className="w-5 h-5 stroke-[2.2]" />
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-[#EDF0F2] flex items-center justify-between text-xs text-[#64748B]">
            <span>Across {allocations.length} projects</span>
            <span className="font-semibold text-[#1F2937] tabular-nums">{percentUsed}% utilized</span>
          </div>
        </div>

        {/* KPI 3: Remaining Unallocated / Deficit */}
        <div
          className={`rounded-2xl border p-5 shadow-[0_0_2px_0_rgba(145,158,171,0.2),0_12px_24px_-4px_rgba(145,158,171,0.12)] flex flex-col justify-between ${
            isExceeded ? 'bg-rose-50/40 border-rose-200' : 'bg-white border-[#EDF0F2]'
          }`}
        >
          <div className="flex items-start justify-between">
            <div>
              <p
                className={`text-xs font-semibold tracking-wider uppercase ${
                  isExceeded ? 'text-rose-700' : 'text-[#64748B]'
                }`}
              >
                {isExceeded ? 'Budget Deficit' : 'Available Capacity'}
              </p>
              <div
                className={`text-[26px] font-bold tracking-tight tabular-nums leading-none mt-1.5 ${
                  isExceeded ? 'text-rose-700' : 'text-[#10B981]'
                }`}
              >
                {isLoading ? (
                  <div className="h-7 w-24 bg-slate-100 rounded-md animate-pulse" />
                ) : isExceeded ? (
                  `- ${formatCurrency(Math.abs(remainingAmount))}`
                ) : (
                  formatCurrency(remainingAmount)
                )}
              </div>
            </div>
            <div
              className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${
                isExceeded ? 'bg-rose-100 text-rose-700' : 'bg-[#E8F7F1] text-[#10B981]'
              }`}
            >
              {isExceeded ? (
                <AlertTriangle className="w-5 h-5 stroke-[2.2]" />
              ) : (
                <Target className="w-5 h-5 stroke-[2.2]" />
              )}
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-[#EDF0F2] flex items-center justify-between text-xs text-[#64748B]">
            <span>{isExceeded ? 'Over limit' : 'Ready for deployment'}</span>
            <span
              className={`font-semibold ${
                isExceeded ? 'text-rose-700' : 'text-[#10B981]'
              }`}
            >
              {isExceeded ? 'Action Required' : 'Within Budget'}
            </span>
          </div>
        </div>

        {/* KPI 4: Multichannel Distribution Overview */}
        <div className="rounded-2xl bg-white border border-[#EDF0F2] p-5 shadow-[0_0_2px_0_rgba(145,158,171,0.2),0_12px_24px_-4px_rgba(145,158,171,0.12)] flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold tracking-wider uppercase text-[#64748B]">
                Channel Diversity
              </p>
              <div className="text-[26px] font-bold tracking-tight text-[#1F2937] tabular-nums leading-none mt-1.5">
                4 Channels
              </div>
            </div>
            <div className="h-10 w-10 rounded-xl bg-[#FEF3C7] text-[#D97706] flex items-center justify-center shrink-0">
              <PieChart className="w-5 h-5 stroke-[2.2]" />
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-[#EDF0F2] flex items-center justify-between text-xs text-[#64748B]">
            <span>Meta &bull; Google &bull; LinkedIn &bull; WA</span>
            <span className="font-semibold text-[#1F2937]">Balanced</span>
          </div>
        </div>
      </div>

      {/* 4. Visual Capacity Meter & Channel Aggregations */}
      <div className="rounded-2xl bg-white border border-[#EDF0F2] p-6 shadow-[0_0_2px_0_rgba(145,158,171,0.2),0_12px_24px_-4px_rgba(145,158,171,0.12)] space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-bold text-[#1F2937]">Monthly Budget Utilization</h2>
            <p className="text-xs text-[#64748B] mt-0.5">
              Live consumption against configured workspace ceiling for {selectedMonth}.
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <span className="text-[#64748B]">
              Committed:{' '}
              <strong className="font-bold text-[#1F2937] tabular-nums">
                {formatCurrency(totalAllocated)}
              </strong>{' '}
              / {formatCurrency(overallCap)}
            </span>
            <span
              className={`px-2.5 py-0.5 rounded-full font-bold tabular-nums ${
                isExceeded
                  ? 'bg-rose-100 text-rose-800'
                  : isNearLimit
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-[#E8F7F1] text-[#10B981]'
              }`}
            >
              {percentUsed}%
            </span>
          </div>
        </div>

        {/* Progress Bar Container */}
        <div className="w-full h-3.5 bg-slate-100 rounded-full overflow-hidden p-0.5">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              isExceeded
                ? 'bg-rose-600'
                : isNearLimit
                  ? 'bg-amber-500'
                  : 'bg-[#10B981]'
            }`}
            style={{ width: `${Math.min(100, percentUsed)}%` }}
          />
        </div>

        {/* Progress Milestones */}
        <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400">
          <span>0% Baseline</span>
          <span>50% Midpoint</span>
          <span>85% Warning</span>
          <span>100% Target Ceiling</span>
        </div>

        {/* Aggregated Channel Distribution Breakdown */}
        <div className="pt-3 border-t border-[#EDF0F2] grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
            <div className="flex items-center justify-between text-[#64748B]">
              <span className="font-semibold">Meta Ads</span>
              <span className="text-[10px] bg-blue-100 text-blue-700 font-bold px-1.5 py-0.2 rounded-md">
                50% Target
              </span>
            </div>
            <div className="text-base font-bold text-[#1F2937] tabular-nums mt-1">
              {formatCurrency(channelTotals.meta)}
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
            <div className="flex items-center justify-between text-[#64748B]">
              <span className="font-semibold">Google Ads</span>
              <span className="text-[10px] bg-emerald-100 text-emerald-700 font-bold px-1.5 py-0.2 rounded-md">
                35% Target
              </span>
            </div>
            <div className="text-base font-bold text-[#1F2937] tabular-nums mt-1">
              {formatCurrency(channelTotals.google)}
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
            <div className="flex items-center justify-between text-[#64748B]">
              <span className="font-semibold">LinkedIn B2B</span>
              <span className="text-[10px] bg-purple-100 text-purple-700 font-bold px-1.5 py-0.2 rounded-md">
                10% Target
              </span>
            </div>
            <div className="text-base font-bold text-[#1F2937] tabular-nums mt-1">
              {formatCurrency(channelTotals.linkedin)}
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
            <div className="flex items-center justify-between text-[#64748B]">
              <span className="font-semibold">WhatsApp API</span>
              <span className="text-[10px] bg-teal-100 text-teal-700 font-bold px-1.5 py-0.2 rounded-md">
                Direct
              </span>
            </div>
            <div className="text-base font-bold text-[#1F2937] tabular-nums mt-1">
              {formatCurrency(channelTotals.whatsapp)}
            </div>
          </div>
        </div>
      </div>

      {/* 5. Per-Project Allocation Breakdown Section */}
      <div className="rounded-2xl bg-white border border-[#EDF0F2] p-6 shadow-[0_0_2px_0_rgba(145,158,171,0.2),0_12px_24px_-4px_rgba(145,158,171,0.12)]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-[#EDF0F2]">
          <div>
            <h2 className="text-base font-bold text-[#1F2937] flex items-center gap-2">
              <Building2 className="w-4 h-4 text-[#10B981]" />
              <span>Project Allocation &amp; Channel Distribution</span>
            </h2>
            <p className="text-xs text-[#64748B] mt-0.5">
              Specify monthly budgets per project. Updating total spend automatically adjusts channels proportionally, or edit each channel directly.
            </p>
          </div>
          <span className="text-xs text-[#64748B] font-semibold bg-slate-100 px-3 py-1 rounded-full self-start sm:self-auto">
            {allocations.length} Active Catalog Projects
          </span>
        </div>

        <div className="pt-5 space-y-5">
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2].map((n) => (
                <div
                  key={n}
                  className="rounded-2xl border border-[#EDF0F2] p-5 space-y-4 animate-pulse bg-slate-50/50"
                >
                  <div className="h-6 w-48 bg-slate-200 rounded-md" />
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                    <div className="h-16 bg-slate-100 rounded-xl" />
                    <div className="h-16 bg-slate-100 rounded-xl" />
                    <div className="h-16 bg-slate-100 rounded-xl" />
                    <div className="h-16 bg-slate-100 rounded-xl" />
                  </div>
                </div>
              ))}
            </div>
          ) : allocations.length === 0 ? (
            <EmptyState
              icon={<Wallet className="w-10 h-10 text-[#64748B]" />}
              title="No project allocations"
              description="No projects found in this organization. Create catalog projects to begin allocating marketing budgets."
              action={
                <Link to="/projects/new">
                  <button
                    type="button"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#10B981] text-white text-xs font-semibold hover:bg-[#059669] transition-all cursor-pointer"
                  >
                    <span>Create Catalog Project</span>
                  </button>
                </Link>
              }
            />
          ) : (
            allocations.map((item) => {
              const projectShare =
                overallCap > 0
                  ? Math.round(((item.allocatedAmount || 0) / overallCap) * 100)
                  : 0;

              return (
                <div
                  key={item.projectId}
                  className="rounded-2xl border border-[#EDF0F2] bg-white p-5 space-y-4 shadow-xs hover:border-slate-300 transition-all"
                >
                  {/* Project Top Bar */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#EDF0F2] pb-3.5">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-slate-100 text-[#1F2937] flex items-center justify-center shrink-0">
                        <Building2 className="w-5 h-5 text-[#10B981]" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-bold text-[#1F2937]">{item.projectName}</h3>
                          <span className="text-[10px] font-semibold bg-slate-100 text-[#64748B] px-2 py-0.5 rounded-full">
                            {projectShare}% of cap
                          </span>
                        </div>
                        <span className="text-xs text-slate-400 font-mono">
                          ID: {item.projectId}
                        </span>
                      </div>
                    </div>

                    {/* Total Project Allocation Field & Quick Buttons */}
                    <div className="flex flex-wrap items-center gap-2.5">
                      <div className="inline-flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleQuickAdd(item.projectId, 10000)}
                          className="px-2 py-1 rounded-lg border border-[#EDF0F2] bg-slate-50 text-[11px] font-semibold text-[#1F2937] hover:bg-slate-100 transition-all cursor-pointer"
                        >
                          +₹10k
                        </button>
                        <button
                          type="button"
                          onClick={() => handleQuickAdd(item.projectId, 50000)}
                          className="px-2 py-1 rounded-lg border border-[#EDF0F2] bg-slate-50 text-[11px] font-semibold text-[#1F2937] hover:bg-slate-100 transition-all cursor-pointer"
                        >
                          +₹50k
                        </button>
                      </div>

                      <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-[#EDF0F2]">
                        <span className="text-xs font-semibold text-[#64748B]">Total: ₹</span>
                        <input
                          type="number"
                          value={item.allocatedAmount}
                          onChange={(e) =>
                            handleUpdateAllocation(
                              item.projectId,
                              'allocatedAmount',
                              Number(e.target.value) || 0
                            )
                          }
                          step="5000"
                          min="0"
                          className="w-28 text-sm font-bold text-[#1F2937] tabular-nums bg-transparent focus:outline-none text-right"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Channel Breakdown Grid */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-[#64748B]">
                        Multichannel Distribution (Auto-balanced or custom edit)
                      </span>
                      <span className="text-[11px] text-slate-400">
                        Sum: {formatCurrency(item.allocatedAmount)}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                      {/* Meta Ads Channel */}
                      <div className="p-3 rounded-xl border border-[#EDF0F2] bg-white focus-within:border-[#10B981] transition-all">
                        <div className="flex items-center justify-between text-xs text-[#64748B] mb-1">
                          <span className="font-semibold text-[#1F2937]">Meta Ads (FB/IG)</span>
                          <span className="text-[10px] text-blue-600 font-bold">50%</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-xs text-slate-400">₹</span>
                          <input
                            type="number"
                            step="1000"
                            min="0"
                            value={item.metaAds}
                            onChange={(e) =>
                              handleUpdateAllocation(
                                item.projectId,
                                'metaAds',
                                Number(e.target.value) || 0
                              )
                            }
                            className="w-full text-xs font-bold text-[#1F2937] tabular-nums focus:outline-none"
                          />
                        </div>
                      </div>

                      {/* Google Ads Channel */}
                      <div className="p-3 rounded-xl border border-[#EDF0F2] bg-white focus-within:border-[#10B981] transition-all">
                        <div className="flex items-center justify-between text-xs text-[#64748B] mb-1">
                          <span className="font-semibold text-[#1F2937]">Google Ads</span>
                          <span className="text-[10px] text-emerald-600 font-bold">35%</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-xs text-slate-400">₹</span>
                          <input
                            type="number"
                            step="1000"
                            min="0"
                            value={item.googleAds}
                            onChange={(e) =>
                              handleUpdateAllocation(
                                item.projectId,
                                'googleAds',
                                Number(e.target.value) || 0
                              )
                            }
                            className="w-full text-xs font-bold text-[#1F2937] tabular-nums focus:outline-none"
                          />
                        </div>
                      </div>

                      {/* LinkedIn Channel */}
                      <div className="p-3 rounded-xl border border-[#EDF0F2] bg-white focus-within:border-[#10B981] transition-all">
                        <div className="flex items-center justify-between text-xs text-[#64748B] mb-1">
                          <span className="font-semibold text-[#1F2937]">LinkedIn B2B</span>
                          <span className="text-[10px] text-purple-600 font-bold">10%</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-xs text-slate-400">₹</span>
                          <input
                            type="number"
                            step="1000"
                            min="0"
                            value={item.linkedinAds}
                            onChange={(e) =>
                              handleUpdateAllocation(
                                item.projectId,
                                'linkedinAds',
                                Number(e.target.value) || 0
                              )
                            }
                            className="w-full text-xs font-bold text-[#1F2937] tabular-nums focus:outline-none"
                          />
                        </div>
                      </div>

                      {/* WhatsApp Channel */}
                      <div className="p-3 rounded-xl border border-[#EDF0F2] bg-white focus-within:border-[#10B981] transition-all">
                        <div className="flex items-center justify-between text-xs text-[#64748B] mb-1">
                          <span className="font-semibold text-[#1F2937]">WhatsApp Direct</span>
                          <span className="text-[10px] text-teal-600 font-bold">Direct</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-xs text-slate-400">₹</span>
                          <input
                            type="number"
                            step="1000"
                            min="0"
                            value={item.directWhatsapp}
                            onChange={(e) =>
                              handleUpdateAllocation(
                                item.projectId,
                                'directWhatsapp',
                                Number(e.target.value) || 0
                              )
                            }
                            className="w-full text-xs font-bold text-[#1F2937] tabular-nums focus:outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
