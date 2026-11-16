import { Link } from 'react-router-dom';
import { Users, ArrowRight, Phone } from 'lucide-react';
import { BackendLead } from '../../hooks/useLeads';
import { formatDisplayDate } from '../../lib/formatters';

export interface RecentLeadsWidgetProps {
  leads?: BackendLead[];
  isLoading: boolean;
}

const STAGE_STYLES: Record<string, { bg: string; text: string }> = {
  New: { bg: 'bg-emerald-50', text: 'text-emerald-700' },
  Contacted: { bg: 'bg-blue-50', text: 'text-blue-700' },
  Qualified: { bg: 'bg-purple-50', text: 'text-purple-700' },
  'Visit scheduled': { bg: 'bg-amber-50', text: 'text-amber-700' },
  'Visit done': { bg: 'bg-cyan-50', text: 'text-cyan-700' },
  Negotiation: { bg: 'bg-emerald-100', text: 'text-emerald-800' },
  'Won/Lost': { bg: 'bg-slate-100', text: 'text-slate-700' },
};

export function RecentLeadsWidget({ leads = [], isLoading }: RecentLeadsWidgetProps) {
  if (isLoading) {
    return (
      <div className="rounded-2xl bg-white border border-[#EDF0F2] p-6 shadow-[0_0_2px_0_rgba(145,158,171,0.2),0_12px_24px_-4px_rgba(145,158,171,0.12)] space-y-4">
        <div className="h-6 w-40 bg-slate-100 rounded-md animate-pulse" />
        <div className="space-y-3">
          <div className="h-12 w-full bg-slate-50 rounded-xl animate-pulse" />
          <div className="h-12 w-full bg-slate-50 rounded-xl animate-pulse" />
          <div className="h-12 w-full bg-slate-50 rounded-xl animate-pulse" />
        </div>
      </div>
    );
  }

  const recentList = leads.slice(0, 5);

  return (
    <div className="rounded-2xl bg-white border border-[#EDF0F2] p-6 shadow-[0_0_2px_0_rgba(145,158,171,0.2),0_12px_24px_-4px_rgba(145,158,171,0.12)] flex flex-col justify-between">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-[#EDF0F2]">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-[#1F2937]">Recent Inbound Leads</h2>
            <Users className="w-4 h-4 text-[#10B981]" />
          </div>
          <p className="text-xs text-[#64748B] mt-0.5">
            Latest customer inquiries across active campaigns
          </p>
        </div>
        <Link
          to="/leads"
          className="text-xs font-semibold text-[#10B981] hover:text-[#059669] inline-flex items-center gap-1 transition-colors"
        >
          <span>All Leads CRM</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Table Content */}
      <div className="pt-2 overflow-x-auto">
        {recentList.length === 0 ? (
          <div className="h-44 flex flex-col items-center justify-center text-center p-4">
            <Users className="w-8 h-8 text-slate-300 mb-2" />
            <p className="text-sm font-semibold text-[#1F2937]">No Inbound Leads Yet</p>
            <p className="text-xs text-[#64748B] mt-1 max-w-xs">
              Inquiries from Meta ad campaigns, web forms, and WhatsApp bots will display here.
            </p>
            <Link
              to="/leads"
              className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#10B981] text-white hover:bg-[#059669] shadow-xs transition-colors"
            >
              <span>Add First Lead</span>
            </Link>
          </div>
        ) : (
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#EDF0F2] text-[#64748B]">
                <th className="py-3 pr-4 font-semibold uppercase text-[10px] tracking-wider">Buyer Lead</th>
                <th className="py-3 px-3 font-semibold uppercase text-[10px] tracking-wider hidden sm:table-cell">Project</th>
                <th className="py-3 px-3 font-semibold uppercase text-[10px] tracking-wider hidden md:table-cell">Source</th>
                <th className="py-3 px-3 font-semibold uppercase text-[10px] tracking-wider">Stage</th>
                <th className="py-3 pl-3 font-semibold uppercase text-[10px] tracking-wider text-right">Captured</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EDF0F2]">
              {recentList.map((lead) => {
                const stageStyle = STAGE_STYLES[lead.stage || 'New'] || STAGE_STYLES.New;
                const initials = lead.name
                  ? lead.name
                      .split(' ')
                      .map((n) => n[0])
                      .join('')
                      .slice(0, 2)
                      .toUpperCase()
                  : 'L';

                return (
                  <tr key={lead._id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 pr-4">
                      <div className="flex items-center gap-2.5">
                        <div className="h-8 w-8 rounded-full bg-[#E8F7F1] text-[#10B981] font-bold text-xs flex items-center justify-center shrink-0">
                          {initials}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-[#1F2937] truncate max-w-[130px] sm:max-w-none">
                            {lead.name}
                          </p>
                          <p className="text-[11px] text-[#64748B] flex items-center gap-1 tabular-nums">
                            <Phone className="w-2.5 h-2.5 text-slate-400" />
                            <span>{lead.phone}</span>
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-3 hidden sm:table-cell">
                      <span className="text-[#1F2937] font-medium truncate max-w-[140px] inline-block">
                        {lead.projectName || 'General Inquiry'}
                      </span>
                    </td>

                    <td className="py-3 px-3 hidden md:table-cell">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700">
                        {lead.source?.replace(/_/g, ' ') || 'DIRECT'}
                      </span>
                    </td>

                    <td className="py-3 px-3">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${stageStyle.bg} ${stageStyle.text}`}
                      >
                        {lead.stage || 'New'}
                      </span>
                    </td>

                    <td className="py-3 pl-3 text-right text-[#64748B] tabular-nums whitespace-nowrap">
                      {formatDisplayDate(lead.createdAt)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
