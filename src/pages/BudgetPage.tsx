import { useState, useId, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { StatusBadge } from '../components/ui/StatusBadge';
import { PageHeader } from '../components/ui/PageHeader';
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
  CheckCircle2,
  Building,
  RotateCcw,
} from 'lucide-react';

export function BudgetPage() {
  const { toast } = useToast();
  const monthSelectId = useId();

  // State
  const [selectedMonth, setSelectedMonth] = useState('November 2026');
  const [overallCap, setOverallCap] = useState<number>(500000);
  const [allocations, setAllocations] = useState<FrontendProjectAllocation[]>([]);

  // Real React Query hook
  const { data: budgetData, isLoading, refetch } = useBudget(selectedMonth);
  const updateBudgetMutation = useUpdateBudget();

  // Synchronize state when backend data arrives
  useEffect(() => {
    if (budgetData) {
      setOverallCap(budgetData.overallCap);
      setAllocations(budgetData.allocations);
    }
  }, [budgetData]);

  // Computed values
  const totalAllocated = allocations.reduce((sum, a) => sum + a.allocatedAmount, 0);
  const remainingAmount = overallCap - totalAllocated;
  const isExceeded = totalAllocated > overallCap;
  const percentUsed =
    overallCap > 0 ? Math.min(100, Math.round((totalAllocated / overallCap) * 100)) : 0;

  const handleUpdateAllocation = (
    projectId: string,
    field: keyof FrontendProjectAllocation,
    value: number
  ) => {
    setAllocations((prev) =>
      prev.map((item) => {
        if (item.projectId !== projectId) return item;
        const updated = { ...item, [field]: value };

        if (field === 'allocatedAmount') {
          const metaShare = Math.round(value * 0.5);
          const googleShare = Math.round(value * 0.35);
          const linkedinShare = Math.round(value * 0.1);
          const directShare = value - (metaShare + googleShare + linkedinShare);
          return {
            ...updated,
            metaAds: metaShare,
            googleAds: googleShare,
            linkedinAds: linkedinShare,
            directWhatsapp: directShare,
          };
        }

        const newTotal =
          (field === 'metaAds' ? value : item.metaAds) +
          (field === 'googleAds' ? value : item.googleAds) +
          (field === 'linkedinAds' ? value : item.linkedinAds) +
          (field === 'directWhatsapp' ? value : item.directWhatsapp);

        return { ...updated, allocatedAmount: newTotal };
      })
    );
  };

  const handleSaveBudget = async () => {
    if (isExceeded) {
      toast({
        title: 'Validation error',
        message: 'Cannot save: Total allocations exceed the overall monthly budget cap.',
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
        title: 'Budget saved',
        message: `Allocations persisted for ${selectedMonth}.`,
        type: 'success',
      });
    } catch (err: unknown) {
      toast({
        title: 'Save failed',
        message: err instanceof Error ? err.message : 'Could not save budget',
        type: 'error',
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <PageHeader
        title="Marketing budget & allocation"
        description="Allocate monthly ad spend caps across projects and performance marketing channels."
        actions={
          <div className="flex items-center space-x-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => refetch()}
              leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
            >
              Reset
            </Button>

            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={handleSaveBudget}
              disabled={isExceeded || updateBudgetMutation.isPending}
              isLoading={updateBudgetMutation.isPending}
              leftIcon={<Save className="w-3.5 h-3.5" />}
            >
              Save budget
            </Button>
          </div>
        }
      />

      {/* Validation Alert when Budget Exceeded */}
      {isExceeded && (
        <div className="border border-[#FEE2E2] bg-[#FEF2F2] rounded-[10px] p-4 text-[#B91C1C]">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="w-5 h-5 text-[#B91C1C] shrink-0 mt-0.5" />
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <span className="text-[14px] font-semibold text-[#B91C1C]">
                  Budget ceiling exceeded &bull; Saving is blocked
                </span>
                <StatusBadge status="FAILED" label="Validation error" />
              </div>
              <p className="text-[13px] text-[#B91C1C]">
                Total allocations of <strong>{formatCurrency(totalAllocated)}</strong> exceed the monthly cap of{' '}
                <strong>{formatCurrency(overallCap)}</strong> by{' '}
                <strong>{formatCurrency(Math.abs(remainingAmount))}</strong>.
                You must reduce project allocations or increase the overall cap to save this configuration.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Budget Summary Metrics Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Month Selector */}
        <Card>
          <CardContent className="p-5 space-y-1">
            <label htmlFor={monthSelectId} className="text-[12px] font-medium text-[#737373] block">
              Billing cycle month
            </label>
            <select
              id={monthSelectId}
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-full text-[14px] font-medium p-2 border border-[#E5E5E5] rounded-[8px] bg-white focus:outline-none focus:ring-2 focus:ring-[#0A0A0A] focus:ring-offset-2"
            >
              <option value="October 2026">October 2026</option>
              <option value="November 2026">November 2026 (Current)</option>
              <option value="December 2026">December 2026</option>
              <option value="January 2027">January 2027</option>
            </select>
          </CardContent>
        </Card>

        {/* Overall Cap Input */}
        <Card>
          <CardContent className="p-5 space-y-1">
            <span className="text-[12px] font-medium text-[#737373] block">
              Monthly budget cap
            </span>
            <div className="flex items-center space-x-1.5">
              <span className="text-[14px] font-medium text-[#737373]">₹</span>
              <input
                type="number"
                value={overallCap}
                onChange={(e) => setOverallCap(Number(e.target.value) || 0)}
                step="10000"
                min="0"
                className="w-full text-[20px] font-semibold text-[#0A0A0A] tabular-nums p-1 border border-[#E5E5E5] rounded-[8px] bg-white focus:outline-none focus:ring-2 focus:ring-[#0A0A0A] focus:ring-offset-2"
              />
            </div>
          </CardContent>
        </Card>

        {/* Total Allocated */}
        <Card>
          <CardContent className="p-5 space-y-1">
            <span className="text-[12px] font-medium text-[#737373] block">
              Total allocated
            </span>
            <div className="text-[24px] font-semibold text-[#0A0A0A] tabular-nums">
              {formatCurrency(totalAllocated)}
            </div>
            <div className="text-[12px] text-[#737373]">
              {percentUsed}% of total capacity used
            </div>
          </CardContent>
        </Card>

        {/* Remaining Amount */}
        <Card className={isExceeded ? 'border-[#FEE2E2] bg-[#FEF2F2]' : ''}>
          <CardContent className="p-5 space-y-1">
            <span className="text-[12px] font-medium text-[#737373] block">
              {isExceeded ? 'Budget deficit' : 'Remaining unallocated'}
            </span>
            <div
              className={`text-[24px] font-semibold tabular-nums ${
                isExceeded ? 'text-[#B91C1C]' : 'text-[#0A0A0A]'
              }`}
            >
              {isExceeded
                ? `- ${formatCurrency(Math.abs(remainingAmount))}`
                : formatCurrency(remainingAmount)}
            </div>
            <div className="flex items-center space-x-1 text-[12px]">
              {isExceeded ? (
                <span className="text-[#B91C1C] font-semibold">Over cap</span>
              ) : (
                <span className="text-[#15803D] flex items-center">
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-[#15803D]" /> Within cap
                </span>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Visual Capacity Meter */}
      <Card>
        <CardContent className="p-5 space-y-2">
          <div className="flex items-center justify-between text-[13px]">
            <span className="font-semibold text-[#0A0A0A]">Monthly budget utilization</span>
            <span className="text-[#737373] tabular-nums">
              {formatCurrency(totalAllocated)} / {formatCurrency(overallCap)} ({percentUsed}%)
            </span>
          </div>

          <div className="w-full h-3 bg-[#F5F5F5] rounded-full overflow-hidden relative">
            <div
              className={`h-full transition-all duration-300 rounded-full ${
                isExceeded ? 'bg-[#B91C1C]' : 'bg-[#0A0A0A]'
              }`}
              style={{ width: `${percentUsed}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[12px] text-[#737373] pt-1">
            <span>0% Capacity</span>
            <span>100% Target Cap</span>
          </div>
        </CardContent>
      </Card>

      {/* Per-Project Allocation Breakdown */}
      <Card>
        <CardHeader className="border-b border-[#E5E5E5] pb-3">
          <CardTitle className="text-[16px] font-semibold text-[#0A0A0A] flex items-center space-x-2">
            <Wallet className="w-4 h-4 text-[#0A0A0A]" />
            <span>Per-project allocation &amp; channel spend</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4 space-y-4">
          {isLoading ? (
            <div className="p-8 text-center text-[14px] text-[#737373]">
              Loading project allocations...
            </div>
          ) : allocations.length === 0 ? (
            <EmptyState
              icon={<Wallet className="w-10 h-10 text-[#737373]" />}
              title="No project allocations"
              description="No projects allocated yet. Ensure active projects exist in your catalog."
            />
          ) : (
            <div className="space-y-4">
              {allocations.map((item) => (
                <div
                  key={item.projectId}
                  className="border border-[#E5E5E5] rounded-[10px] bg-white p-4 space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E5E5E5] pb-3">
                    <div className="flex items-center space-x-3">
                      <div className="p-2.5 bg-[#F5F5F5] rounded-[8px]">
                        <Building className="w-4 h-4 text-[#0A0A0A]" />
                      </div>
                      <div>
                        <h3 className="text-[15px] font-semibold text-[#0A0A0A]">{item.projectName}</h3>
                        <span className="text-[12px] text-[#737373]">
                          Project ID: <span className="font-mono">{item.projectId}</span>
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <span className="text-[13px] font-medium text-[#525252]">Total spend:</span>
                      <div className="flex items-center space-x-1">
                        <span className="text-[13px] text-[#737373]">₹</span>
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
                          className="w-32 text-[14px] font-semibold tabular-nums p-1.5 border border-[#E5E5E5] rounded-[6px] focus:outline-none focus:ring-2 focus:ring-[#0A0A0A] text-right"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Multichannel Distribution */}
                  <div>
                    <span className="text-[12px] font-medium text-[#737373] block mb-2">
                      Channel distribution
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <Input
                        label="Meta Ads (IG/FB)"
                        type="number"
                        step="1000"
                        value={String(item.metaAds)}
                        onChange={(e) =>
                          handleUpdateAllocation(
                            item.projectId,
                            'metaAds',
                            Number(e.target.value) || 0
                          )
                        }
                      />
                      <Input
                        label="Google Ads (Search/PMax)"
                        type="number"
                        step="1000"
                        value={String(item.googleAds)}
                        onChange={(e) =>
                          handleUpdateAllocation(
                            item.projectId,
                            'googleAds',
                            Number(e.target.value) || 0
                          )
                        }
                      />
                      <Input
                        label="LinkedIn B2B Sponsored"
                        type="number"
                        step="1000"
                        value={String(item.linkedinAds)}
                        onChange={(e) =>
                          handleUpdateAllocation(
                            item.projectId,
                            'linkedinAds',
                            Number(e.target.value) || 0
                          )
                        }
                      />
                      <Input
                        label="Direct WhatsApp API"
                        type="number"
                        step="1000"
                        value={String(item.directWhatsapp)}
                        onChange={(e) =>
                          handleUpdateAllocation(
                            item.projectId,
                            'directWhatsapp',
                            Number(e.target.value) || 0
                          )
                        }
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
