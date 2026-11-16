import { Link } from 'react-router-dom';
import { CalendarCheck, MapPin, ArrowRight, User, Clock } from 'lucide-react';
import { BackendAppointment } from '../../hooks/useAppointments';
import { FrontendCalendarItem } from '../../hooks/usePlans';
import { formatDisplayDate } from '../../lib/formatters';

export interface AgendaWidgetProps {
  appointments?: BackendAppointment[];
  planItems?: FrontendCalendarItem[];
  isLoading: boolean;
}

export function AgendaWidget({
  appointments = [],
  planItems = [],
  isLoading,
}: AgendaWidgetProps) {
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

  const scheduledVisits = appointments.filter((a) => a.status === 'Scheduled');
  const hasItems = scheduledVisits.length > 0 || planItems.length > 0;

  return (
    <div className="rounded-2xl bg-white border border-[#EDF0F2] p-6 shadow-[0_0_2px_0_rgba(145,158,171,0.2),0_12px_24px_-4px_rgba(145,158,171,0.12)] flex flex-col justify-between">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-[#EDF0F2]">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-[#1F2937]">Site Visits &amp; Agenda</h2>
            <CalendarCheck className="w-4 h-4 text-[#10B981]" />
          </div>
          <p className="text-xs text-[#64748B] mt-0.5">
            Confirmed buyer walk-throughs &amp; milestones
          </p>
        </div>
        <Link
          to="/appointments"
          className="text-xs font-semibold text-[#10B981] hover:text-[#059669] inline-flex items-center gap-1 transition-colors"
        >
          <span>All Appointments</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Content */}
      <div className="pt-4 flex-1">
        {!hasItems ? (
          <div className="h-44 flex flex-col items-center justify-center text-center p-4">
            <div className="h-10 w-10 rounded-xl bg-slate-100 text-[#64748B] flex items-center justify-center mb-2">
              <CalendarCheck className="w-5 h-5" />
            </div>
            <p className="text-sm font-semibold text-[#1F2937]">No Site Visits Today</p>
            <p className="text-xs text-[#64748B] mt-1 max-w-xs">
              Book a walk-through appointment from the Leads CRM or VIP tour requests.
            </p>
            <Link
              to="/appointments"
              className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#10B981] text-white hover:bg-[#059669] shadow-xs transition-colors"
            >
              <span>Schedule Walk-Through</span>
            </Link>
          </div>
        ) : (
          <div className="space-y-2.5">
            {scheduledVisits.slice(0, 3).map((visit) => (
              <div
                key={visit._id}
                className="p-3.5 rounded-xl border border-[#EDF0F2] hover:border-slate-300 hover:bg-slate-50/70 transition-all flex items-center justify-between gap-3"
              >
                <div className="space-y-1.5 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-[#1F2937] truncate">
                      {visit.leadName}
                    </span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700">
                      <Clock className="w-3 h-3 stroke-[2.2]" />
                      <span>{visit.timeSlot || 'Scheduled'}</span>
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-[#64748B] flex-wrap">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-slate-400" />
                      <span className="truncate max-w-[140px]">{visit.projectName}</span>
                    </span>
                    {visit.assignedAgentName && (
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3 text-slate-400" />
                        <span>{visit.assignedAgentName}</span>
                      </span>
                    )}
                    {visit.appointmentDate && (
                      <span className="text-slate-400 tabular-nums">
                        {formatDisplayDate(visit.appointmentDate)}
                      </span>
                    )}
                  </div>
                </div>

                <Link
                  to="/appointments"
                  className="shrink-0 text-xs font-semibold text-[#10B981] hover:underline"
                >
                  Details
                </Link>
              </div>
            ))}

            {planItems.slice(0, 1).map((item) => (
              <div
                key={item.id}
                className="p-3.5 rounded-xl border border-[#EDF0F2] hover:border-slate-300 hover:bg-slate-50/70 transition-all flex items-center justify-between gap-3"
              >
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-[#1F2937] truncate">
                      {item.title}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700">
                      {item.format}
                    </span>
                  </div>
                  <p className="text-xs text-[#64748B]">
                    {item.projectName || 'Marketing Plan Milestone'}
                  </p>
                </div>

                <Link
                  to="/calendar"
                  className="shrink-0 text-xs font-semibold text-[#10B981] hover:underline"
                >
                  Calendar
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
