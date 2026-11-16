import { Link } from 'react-router-dom';
import { AlertTriangle, CheckCircle, MessageCircle, FileCheck, ArrowRight } from 'lucide-react';
import { FrontendCreativeApproval } from '../../hooks/useApprovals';

export interface NeedsAttentionWidgetProps {
  pendingApprovals?: FrontendCreativeApproval[];
  urgentHandoffsCount?: number;
  isLoading: boolean;
  isError?: boolean;
}

export function NeedsAttentionWidget({
  pendingApprovals = [],
  urgentHandoffsCount = 0,
  isLoading,
  isError = false,
}: NeedsAttentionWidgetProps) {
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
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-[#1F2937]">Needs Immediate Attention</h2>
          </div>
          <p className="text-xs text-[#64748B] mt-0.5">
            Operational bottlenecks requiring human action.
          </p>
        </div>
        <div className="p-6 rounded-xl bg-slate-50 border border-[#EDF0F2] text-center my-4">
          <p className="text-xs text-[#64748B]">
            Approvals data restricted or currently unavailable for this role.
          </p>
        </div>
      </div>
    );
  }

  const items = [
    ...(urgentHandoffsCount > 0
      ? [
          {
            id: 'urgent-handoffs',
            title: `${urgentHandoffsCount} Urgent WhatsApp Handoff${urgentHandoffsCount > 1 ? 's' : ''}`,
            description: 'Customer requested human agent escalation on bot thread.',
            route: '/whatsapp',
            actionText: 'Open Chat',
            icon: MessageCircle,
            type: 'urgent',
          },
        ]
      : []),
    ...pendingApprovals
      .filter((a) => a.status === 'In Review' || a.status === 'Needs Action')
      .slice(0, 3)
      .map((appr) => ({
        id: appr.id,
        title: appr.creativeTitle || appr.copyHeadline || 'Creative Asset',
        description: `Approval required for ${appr.projectName || 'marketing asset'}.`,
        route: '/approvals',
        actionText: 'Review',
        icon: FileCheck,
        type: appr.status === 'Needs Action' ? 'warning' : 'info',
      })),
  ];

  return (
    <div className="rounded-2xl bg-white border border-[#EDF0F2] p-6 shadow-[0_0_2px_0_rgba(145,158,171,0.2),0_12px_24px_-4px_rgba(145,158,171,0.12)] flex flex-col justify-between">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-[#EDF0F2]">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-[#1F2937]">Needs Immediate Attention</h2>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-xs text-[#64748B] mt-0.5">
            Bottlenecks requiring direct action
          </p>
        </div>
        {items.length > 0 && (
          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
            {items.length} Action{items.length > 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Content */}
      <div className="pt-4 flex-1">
        {items.length === 0 ? (
          <div className="flex items-start gap-3.5 p-4 rounded-xl bg-emerald-50/60 border border-emerald-100">
            <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold text-emerald-900">
                All Systems Clear
              </p>
              <p className="text-xs text-emerald-700/90 mt-0.5 leading-relaxed">
                No pending creative reviews or urgent WhatsApp agent escalations currently open.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-2.5">
            {items.map((item) => {
              const Icon = item.icon;
              const isUrgent = item.type === 'urgent';
              return (
                <div
                  key={item.id}
                  className="p-3 rounded-xl border border-[#EDF0F2] hover:border-slate-300 hover:bg-slate-50/70 transition-all flex items-center justify-between gap-3 group"
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <div
                      className={`h-9 w-9 rounded-lg shrink-0 flex items-center justify-center ${
                        isUrgent
                          ? 'bg-[#FEE2E2] text-[#EF4444]'
                          : 'bg-[#FEF3C7] text-[#D97706]'
                      }`}
                    >
                      <Icon className="w-4 h-4 stroke-[2.2]" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-[#1F2937] truncate">
                        {item.title}
                      </p>
                      <p className="text-xs text-[#64748B] line-clamp-1 mt-0.5">
                        {item.description}
                      </p>
                    </div>
                  </div>

                  <Link
                    to={item.route}
                    className="shrink-0 inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-[#1F2937] bg-slate-100 hover:bg-[#10B981] hover:text-white transition-all shadow-2xs"
                  >
                    <span>{item.actionText}</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
