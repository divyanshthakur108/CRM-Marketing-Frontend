import { useState, useMemo, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  DndContext,
  useDraggable,
  useDroppable,
  DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { format as formatDate, parseISO, addDays } from 'date-fns';
import { Button } from '../components/ui/Button';
import { useToast } from '../components/ui/Toast';
import { useProjects } from '../hooks/useProjects';
import {
  usePlanItems,
  useReschedulePlanItem,
  usePausePlanItem,
  useResumePlanItem,
  useCancelPlanItem,
  useGeneratePlan,
  FrontendCalendarItem,
} from '../hooks/usePlans';
import {
  Calendar as CalendarIcon,
  Clock,
  Play,
  Pause,
  Trash2,
  ChevronLeft,
  ChevronRight,
  GripVertical,
  Sparkles,
  AlertTriangle,
  RotateCw,
  X,
  CheckCircle2,
  CalendarDays,
} from 'lucide-react';
import { cn } from '../lib/utils';

// -----------------------------------------------------------------------------
// 1. HELPERS & FORMATTERS
// -----------------------------------------------------------------------------

function formatDisplayDate(dateStr: string): string {
  if (!dateStr) return '';
  const cleanStr = dateStr.slice(0, 10);
  try {
    const parsed = parseISO(cleanStr);
    return formatDate(parsed, 'EEE, d MMM yyyy');
  } catch {
    const parts = cleanStr.split('-');
    if (parts.length < 3) return dateStr;
    const y = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10) - 1;
    const d = parseInt(parts[2], 10);
    const dateObj = new Date(y, m, d);
    return formatDate(dateObj, 'EEE, d MMM yyyy');
  }
}

const FacebookIcon = ({ className = 'w-3.5 h-3.5' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
  </svg>
);

const InstagramIcon = ({ className = 'w-3.5 h-3.5' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
  </svg>
);

const WhatsAppIcon = ({ className = 'w-3.5 h-3.5' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M12.031 0C5.396 0 .029 5.367.029 12.003c0 2.12.553 4.189 1.603 6.01L0 24l6.168-1.618a11.97 11.97 0 0 0 5.863 1.523h.005c6.632 0 12-5.367 12-12.003C24.036 5.368 18.666 0 12.031 0zm-.005 21.996h-.004a9.98 9.98 0 0 1-5.093-1.396l-.365-.217-3.784.992 1.01-3.689-.237-.378a9.96 9.96 0 0 1-1.528-5.305c0-5.514 4.486-10 10.006-10 2.673 0 5.184 1.042 7.073 2.932 1.888 1.89 2.928 4.403 2.928 7.075 0 5.515-4.486 10-10.006 10z" />
  </svg>
);

function getPlatformDetails(format: FrontendCalendarItem['format']) {
  switch (format) {
    case 'INSTAGRAM_REEL':
      return {
        label: 'Instagram Reel',
        badgeColor: 'bg-[#EDE9FE] text-[#8B5CF6] border-[#8B5CF6]/20',
        Icon: InstagramIcon,
      };
    case 'FACEBOOK_CAROUSEL':
      return {
        label: 'Facebook Post',
        badgeColor: 'bg-[#EFF6FF] text-[#2563EB] border-[#2563EB]/20',
        Icon: FacebookIcon,
      };
    case 'WHATSAPP_BROADCAST':
      return {
        label: 'WhatsApp Broadcast',
        badgeColor: 'bg-[#E8F7F1] text-[#10B981] border-[#10B981]/20',
        Icon: WhatsAppIcon,
      };
    default:
      return {
        label: 'Facebook Post',
        badgeColor: 'bg-slate-100 text-[#64748B] border-slate-200',
        Icon: FacebookIcon,
      };
  }
}

function formatCardTime(timeStr?: string): string {
  if (!timeStr) return '18:00';
  const match = timeStr.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
  if (match) {
    let hours = parseInt(match[1], 10);
    const minutes = match[2];
    const modifier = match[3]?.toUpperCase();
    if (modifier === 'PM' && hours < 12) hours += 12;
    if (modifier === 'AM' && hours === 12) hours = 0;
    return `${hours.toString().padStart(2, '0')}:${minutes}`;
  }
  return timeStr;
}

// -----------------------------------------------------------------------------
// 2. CALENDAR CARD COMPONENT (MUI Minimal Style)
// -----------------------------------------------------------------------------

interface DraggableItemCardProps {
  item: FrontendCalendarItem;
  onSelect: (item: FrontendCalendarItem) => void;
  isSelected: boolean;
  showProjectInitial: boolean;
}

function DraggableItemCard({
  item,
  onSelect,
  isSelected,
  showProjectInitial,
}: DraggableItemCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: item.id,
    data: { item },
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.35 : 1,
  };

  const { label: platformLabel, Icon } = getPlatformDetails(item.format);

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={() => onSelect(item)}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect(item);
        }
      }}
      className={cn(
        'group relative flex flex-col justify-between w-full min-w-0 rounded-xl p-2 text-left select-none cursor-pointer',
        'transition-all duration-150 ease-in-out',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#10B981] focus-visible:ring-offset-1',
        isSelected
          ? 'bg-white border-2 border-[#10B981] shadow-md ring-1 ring-[#10B981]/20'
          : 'bg-white border border-[#EDF0F2] shadow-[0_1px_3px_0_rgba(145,158,171,0.1)] hover:border-slate-300 hover:shadow-md'
      )}
    >
      {/* Row 1: Drag handle, Time, Project Monogram & Status dot */}
      <div className="flex items-center justify-between w-full min-w-0 gap-1">
        <div className="flex items-center gap-1 min-w-0">
          <button
            {...attributes}
            {...listeners}
            type="button"
            tabIndex={-1}
            aria-label="Drag to reschedule"
            className="w-4 h-4 flex items-center justify-center text-[#94A3B8] hover:text-[#1F2937] cursor-grab active:cursor-grabbing shrink-0 transition-opacity block lg:hidden lg:group-hover:flex lg:group-focus-within:flex focus-visible:flex"
          >
            <GripVertical className="w-3.5 h-3.5" />
          </button>
          <span className="tabular-nums text-[11px] font-bold text-[#1F2937] shrink-0">
            {formatCardTime(item.time)}
          </span>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {showProjectInitial && (
            <span
              title={`Project: ${item.projectName}`}
              className="w-4 h-4 rounded-full bg-[#E8F7F1] border border-[#10B981]/30 text-[10px] font-bold text-[#10B981] flex items-center justify-center leading-none"
            >
              {item.projectName ? item.projectName.charAt(0).toUpperCase() : 'P'}
            </span>
          )}

          {/* Status Dot */}
          <span
            title={`Status: ${item.status || 'Draft'}`}
            className={cn(
              'w-2 h-2 rounded-full shrink-0 transition-colors',
              item.status === 'Approved' && 'bg-[#10B981]',
              item.status === 'Scheduled' && 'bg-[#3B82F6]',
              item.status === 'Paused' && 'bg-[#D97706]',
              (item.status === 'Draft' || !item.status) && 'bg-[#94A3B8]'
            )}
          />
        </div>
      </div>

      {/* Row 2: Title */}
      <p
        title={item.title}
        className="line-clamp-2 text-xs font-semibold text-[#1F2937] leading-snug my-1.5 min-w-0"
      >
        {item.title}
      </p>

      {/* Row 3: Platform icon + Paid/Organic tag */}
      <div className="flex items-center justify-between gap-1 w-full min-w-0 pt-1.5 border-t border-[#EDF0F2]">
        <div
          title={platformLabel}
          className="flex items-center space-x-1 min-w-0 text-[#64748B]"
        >
          <Icon className="w-3.5 h-3.5 shrink-0 text-[#1F2937]" />
          <span className="text-[11px] font-medium truncate hidden 2xl:inline">
            {platformLabel}
          </span>
        </div>

        <span
          className={cn(
            'text-[10px] font-bold px-1.5 py-0.5 rounded-md shrink-0 transition-colors',
            item.isPaid
              ? 'bg-[#E8F7F1] text-[#10B981] border border-[#10B981]/20'
              : 'border border-[#EDF0F2] text-[#64748B] bg-slate-50'
          )}
        >
          {item.isPaid ? 'Paid' : 'Organic'}
        </span>
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// 3. DAY CELL COMPONENT
// -----------------------------------------------------------------------------

interface DroppableDayProps {
  dateStr: string;
  dayNumber: number;
  dayOfWeek: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  items: FrontendCalendarItem[];
  onSelect: (item: FrontendCalendarItem) => void;
  selectedItemId?: string;
  showProjectInitial: boolean;
  onOpenMore: (dateStr: string) => void;
}

function DroppableDay({
  dateStr,
  dayNumber,
  dayOfWeek,
  isCurrentMonth,
  isToday,
  items,
  onSelect,
  selectedItemId,
  showProjectInitial,
  onOpenMore,
}: DroppableDayProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: dateStr,
    data: { dateStr },
  });

  const visibleItems = items.slice(0, 2);
  const moreCount = items.length - 2;
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'min-h-[140px] border border-[#EDF0F2] rounded-xl p-1.5 sm:p-2 flex flex-col justify-between transition-all duration-150',
        isWeekend ? 'bg-slate-50/50' : 'bg-white',
        !isCurrentMonth && 'opacity-40 bg-slate-50/30',
        isToday && 'border-[#10B981] bg-[#E8F7F1]/20 shadow-xs ring-1 ring-[#10B981]/30',
        isOver && 'bg-[#E8F7F1]/40 border-[#10B981] ring-2 ring-[#10B981] shadow-md'
      )}
    >
      {/* Day Cell Header: date number and count badge */}
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center">
          {isToday ? (
            <span className="w-6 h-6 rounded-full bg-[#10B981] text-white flex items-center justify-center font-bold tabular-nums text-xs shadow-xs">
              {dayNumber}
            </span>
          ) : (
            <span className="text-xs font-semibold text-[#1F2937] tabular-nums px-1 py-0.5">
              {dayNumber}
            </span>
          )}
        </div>

        {items.length > 0 && (
          <span className="text-[10px] font-semibold text-[#64748B] bg-slate-100 px-1.5 py-0.5 rounded-full tabular-nums">
            {items.length} {items.length === 1 ? 'item' : 'items'}
          </span>
        )}
      </div>

      {/* Cards List (Max 2 cards visible per cell) */}
      <div className="space-y-1.5 flex-1 flex flex-col justify-start">
        {visibleItems.map((item) => (
          <DraggableItemCard
            key={item.id}
            item={item}
            onSelect={onSelect}
            isSelected={selectedItemId === item.id}
            showProjectInitial={showProjectInitial}
          />
        ))}

        {/* "+N More" Popover Trigger */}
        {moreCount > 0 && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onOpenMore(dateStr);
            }}
            className="w-full text-center py-1 text-[11px] font-semibold text-[#10B981] bg-[#E8F7F1]/60 hover:bg-[#E8F7F1] border border-[#10B981]/20 rounded-lg transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#10B981]"
          >
            +{moreCount} more
          </button>
        )}
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// 4. CONFIRMATION MODAL (Pause & Cancel)
// -----------------------------------------------------------------------------

interface ConfirmationModalProps {
  isOpen: boolean;
  title: string;
  description: string;
  confirmText: string;
  isDestructive?: boolean;
  isLoading: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

function ConfirmationModal({
  isOpen,
  title,
  description,
  confirmText,
  isDestructive,
  isLoading,
  onConfirm,
  onClose,
}: ConfirmationModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity duration-150"
        onClick={onClose}
      />

      {/* Dialog Body */}
      <div className="relative bg-white border border-[#EDF0F2] rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-2xl z-10 animate-in zoom-in-95 duration-150">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div
              className={cn(
                'h-9 w-9 rounded-xl flex items-center justify-center shrink-0',
                isDestructive ? 'bg-rose-50 text-rose-600' : 'bg-[#E8F7F1] text-[#10B981]'
              )}
            >
              <AlertTriangle className="w-5 h-5 stroke-[2.2]" />
            </div>
            <h3 className="text-base font-bold text-[#1F2937] leading-snug">
              {title}
            </h3>
          </div>
          <button
            type="button"
            aria-label="Close dialog"
            onClick={onClose}
            disabled={isLoading}
            className="text-[#64748B] hover:text-[#1F2937] p-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-[#64748B] leading-relaxed">
          {description}
        </p>

        <div className="flex items-center justify-end space-x-2 pt-3 border-t border-[#EDF0F2]">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="border border-[#EDF0F2] bg-white text-[#1F2937] hover:bg-slate-50 rounded-xl text-xs font-semibold px-3.5 py-2 transition-colors cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={cn(
              'rounded-xl text-xs font-bold px-4 py-2 transition-all cursor-pointer shadow-xs active:scale-[0.98]',
              isDestructive
                ? 'bg-rose-600 text-white hover:bg-rose-700'
                : 'bg-[#10B981] text-white hover:bg-[#059669]'
            )}
          >
            {isLoading ? 'Processing...' : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// 5. INTERACTIVE DATE PICKER INPUT
// -----------------------------------------------------------------------------

function DatePickerInput({
  value,
  onChange,
  disabled,
}: {
  value: string;
  onChange: (isoDate: string) => void;
  disabled?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const parsedDate = useMemo(() => {
    try {
      const d = parseISO(value);
      return isNaN(d.getTime()) ? new Date() : d;
    } catch {
      return new Date();
    }
  }, [value]);

  const [viewYear, setViewYear] = useState(() => parsedDate.getFullYear());
  const [viewMonth, setViewMonth] = useState(() => parsedDate.getMonth());

  useEffect(() => {
    setViewYear(parsedDate.getFullYear());
    setViewMonth(parsedDate.getMonth());
  }, [parsedDate]);

  const daysInGrid = useMemo(() => {
    const firstDayIndex = new Date(viewYear, viewMonth, 1).getDay();
    const totalDays = new Date(viewYear, viewMonth + 1, 0).getDate();
    const days: { day: number; dateStr: string; isCurrentMonth: boolean }[] = [];

    const prevMonthDays = new Date(viewYear, viewMonth, 0).getDate();
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const d = prevMonthDays - i;
      const m = viewMonth === 0 ? 12 : viewMonth;
      const y = viewMonth === 0 ? viewYear - 1 : viewYear;
      const mStr = String(m).padStart(2, '0');
      const dStr = String(d).padStart(2, '0');
      days.push({ day: d, dateStr: `${y}-${mStr}-${dStr}`, isCurrentMonth: false });
    }

    for (let d = 1; d <= totalDays; d++) {
      const m = viewMonth + 1;
      const mStr = String(m).padStart(2, '0');
      const dStr = String(d).padStart(2, '0');
      days.push({ day: d, dateStr: `${viewYear}-${mStr}-${dStr}`, isCurrentMonth: true });
    }

    const remainder = (7 - (days.length % 7)) % 7;
    for (let d = 1; d <= remainder; d++) {
      const m = viewMonth === 11 ? 1 : viewMonth + 2;
      const y = viewMonth === 11 ? viewYear + 1 : viewYear;
      const mStr = String(m).padStart(2, '0');
      const dStr = String(d).padStart(2, '0');
      days.push({ day: d, dateStr: `${y}-${mStr}-${dStr}`, isCurrentMonth: false });
    }

    return days;
  }, [viewYear, viewMonth]);

  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const monthLabel = new Date(viewYear, viewMonth, 1).toLocaleDateString('en-GB', {
    month: 'short',
    year: 'numeric',
  });

  return (
    <div ref={containerRef} className="relative w-full">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between border border-[#EDF0F2] bg-white rounded-xl px-3.5 py-2 text-xs font-semibold text-[#1F2937] hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#10B981] transition-colors cursor-pointer"
      >
        <span className="tabular-nums">{formatDisplayDate(value)}</span>
        <CalendarIcon className="w-4 h-4 text-[#64748B]" />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1.5 z-50 bg-white border border-[#EDF0F2] rounded-2xl p-3.5 shadow-2xl w-64 animate-in fade-in zoom-in-95 duration-100">
          <div className="flex items-center justify-between mb-2">
            <button
              type="button"
              aria-label="Previous month"
              onClick={handlePrevMonth}
              className="p-1 rounded-lg hover:bg-slate-100 text-[#64748B] hover:text-[#1F2937] transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-bold text-[#1F2937] uppercase tracking-wider">
              {monthLabel}
            </span>
            <button
              type="button"
              aria-label="Next month"
              onClick={handleNextMonth}
              className="p-1 rounded-lg hover:bg-slate-100 text-[#64748B] hover:text-[#1F2937] transition-colors cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-bold text-[#64748B] mb-1">
            <span>S</span>
            <span>M</span>
            <span>T</span>
            <span>W</span>
            <span>T</span>
            <span>F</span>
            <span>S</span>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center text-xs">
            {daysInGrid.map((d, idx) => {
              const isSelected = d.dateStr === value;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    onChange(d.dateStr);
                    setIsOpen(false);
                  }}
                  className={cn(
                    'h-7 w-7 rounded-lg flex items-center justify-center font-semibold tabular-nums transition-colors cursor-pointer',
                    isSelected
                      ? 'bg-[#10B981] text-white'
                      : d.isCurrentMonth
                        ? 'text-[#1F2937] hover:bg-slate-100'
                        : 'text-slate-300 hover:bg-slate-50'
                  )}
                >
                  {d.day}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// -----------------------------------------------------------------------------
// 6. ITEM INSPECTOR COMPONENT (Reusable Panel)
// -----------------------------------------------------------------------------

interface ItemInspectorProps {
  item: FrontendCalendarItem | null;
  onClose?: () => void;
  onTogglePause: () => void;
  onCancelItem: () => void;
  onUpdateDate: (newDateStr: string) => void;
  isUpdatingAction: boolean;
}

function ItemInspector({
  item,
  onClose,
  onTogglePause,
  onCancelItem,
  onUpdateDate,
  isUpdatingAction,
}: ItemInspectorProps) {
  const [rescheduleDate, setRescheduleDate] = useState(item?.date || '');

  useEffect(() => {
    if (item?.date) {
      setRescheduleDate(item.date);
    }
  }, [item?.date]);

  if (!item) {
    return (
      <div className="border border-[#EDF0F2] rounded-2xl bg-white p-6 text-center text-[#64748B] space-y-2 shadow-[0_0_2px_0_rgba(145,158,171,0.2),0_12px_24px_-4px_rgba(145,158,171,0.12)]">
        <CalendarIcon className="w-8 h-8 mx-auto text-[#94A3B8]" />
        <h4 className="text-xs uppercase tracking-wider font-bold text-[#1F2937]">No Item Selected</h4>
        <p className="text-xs text-[#64748B] leading-relaxed">
          Select any calendar item to inspect details, modify broadcast dates, or pause distribution.
        </p>
      </div>
    );
  }

  const { label: platformLabel, Icon } = getPlatformDetails(item.format);
  const isWhatsApp = item.format === 'WHATSAPP_BROADCAST';
  const pauseButtonText = isWhatsApp
    ? item.status === 'Paused'
      ? 'Resume Broadcast'
      : 'Pause Broadcast'
    : item.status === 'Paused'
      ? 'Resume Flight'
      : 'Pause Flight';

  return (
    <div className="border border-[#EDF0F2] rounded-2xl bg-white shadow-[0_0_2px_0_rgba(145,158,171,0.2),0_12px_24px_-4px_rgba(145,158,171,0.12)] overflow-hidden">
      {/* Inspector Header */}
      <div className="p-4 border-b border-[#EDF0F2] bg-slate-50/50 flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1 space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#10B981] block">
            Item Inspector
          </span>
          <h3 className="text-base font-bold text-[#1F2937] leading-snug">
            {item.title}
          </h3>
        </div>

        <div className="flex items-center space-x-2 shrink-0 pt-0.5">
          <span
            className={cn(
              'text-[11px] font-bold px-2.5 py-0.5 rounded-full tracking-tight transition-colors',
              item.status === 'Approved' && 'bg-[#E8F7F1] text-[#10B981] border border-[#10B981]/20',
              item.status === 'Scheduled' && 'bg-[#EFF6FF] text-[#3B82F6] border border-[#3B82F6]/20',
              item.status === 'Paused' && 'bg-[#FEF3C7] text-[#D97706] border border-[#D97706]/20',
              item.status === 'Draft' && 'bg-slate-100 text-[#64748B]'
            )}
          >
            {item.status || 'Draft'}
          </span>

          {onClose && (
            <button
              type="button"
              aria-label="Close inspector"
              onClick={onClose}
              className="text-[#64748B] hover:text-[#1F2937] p-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              title="Close Inspector"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      <div className="p-4 space-y-4 text-xs">
        {/* Details Two-Column List */}
        <div className="divide-y divide-[#EDF0F2]">
          <div className="flex justify-between items-center py-2">
            <span className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider">Project</span>
            <span className="text-xs font-bold text-[#1F2937] truncate max-w-[180px]" title={item.projectName}>
              {item.projectName}
            </span>
          </div>

          <div className="flex justify-between items-center py-2">
            <span className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider">Platform</span>
            <span className="text-xs font-semibold text-[#1F2937] flex items-center space-x-1.5">
              <Icon className="w-3.5 h-3.5 text-[#10B981]" />
              <span>{platformLabel}</span>
            </span>
          </div>

          <div className="flex justify-between items-center py-2">
            <span className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider">Type</span>
            <span className="text-xs font-semibold text-[#1F2937]">
              {item.isPaid ? 'Paid Advertising' : 'Organic Social'}
            </span>
          </div>

          <div className="flex justify-between items-center py-2">
            <span className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider">Scheduled Date</span>
            <span className="text-xs font-bold text-[#1F2937] tabular-nums">
              {formatDisplayDate(item.date)}
            </span>
          </div>

          <div className="flex justify-between items-center py-2">
            <span className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider">Time</span>
            <span className="text-xs font-bold text-[#1F2937] tabular-nums">
              {item.time} ({item.timezone || 'Asia/Kolkata'})
            </span>
          </div>

          <div className="flex justify-between items-center py-2">
            <span className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider">Version</span>
            <span className="text-xs font-bold text-[#1F2937] tabular-nums">
              v{item.version || 1}
            </span>
          </div>
        </div>

        {/* Creative Brief */}
        <div className="space-y-1.5">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748B] block">
            Creative Brief &amp; Topic
          </span>
          <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 text-xs leading-relaxed text-[#1F2937]">
            {item.creativeBrief || item.topic || 'Targeted property marketing and strategic campaign flight.'}
          </div>
        </div>

        {/* Reschedule Date Control */}
        <div className="space-y-2 border-t border-[#EDF0F2] pt-3">
          <label className="block text-[11px] font-bold uppercase tracking-wider text-[#64748B]">
            Reschedule Date
          </label>
          <div className="flex items-center space-x-2">
            <div className="flex-1">
              <DatePickerInput
                value={rescheduleDate}
                onChange={(newIso) => setRescheduleDate(newIso)}
                disabled={isUpdatingAction}
              />
            </div>
            <button
              type="button"
              disabled={rescheduleDate === item.date || !rescheduleDate || isUpdatingAction}
              onClick={() => onUpdateDate(rescheduleDate)}
              className="bg-[#10B981] text-white hover:bg-[#059669] disabled:opacity-40 disabled:cursor-not-allowed rounded-xl text-xs font-bold px-3.5 py-2 transition-all cursor-pointer shrink-0 shadow-xs"
            >
              Apply
            </button>
          </div>

          {/* Quick Reschedule Pills */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              type="button"
              disabled={isUpdatingAction}
              onClick={() => {
                const next = addDays(parseISO(rescheduleDate || item.date), 1);
                setRescheduleDate(formatDate(next, 'yyyy-MM-dd'));
              }}
              className="border border-[#EDF0F2] bg-white text-[#1F2937] hover:bg-slate-50 rounded-xl text-xs font-semibold py-1.5 px-3 transition-colors text-center cursor-pointer"
            >
              +1 day
            </button>
            <button
              type="button"
              disabled={isUpdatingAction}
              onClick={() => {
                const next = addDays(parseISO(rescheduleDate || item.date), 7);
                setRescheduleDate(formatDate(next, 'yyyy-MM-dd'));
              }}
              className="border border-[#EDF0F2] bg-white text-[#1F2937] hover:bg-slate-50 rounded-xl text-xs font-semibold py-1.5 px-3 transition-colors text-center cursor-pointer"
            >
              +7 days
            </button>
          </div>
        </div>

        {/* Actions: Pause & Cancel schedule */}
        <div className="space-y-2 border-t border-[#EDF0F2] pt-3">
          <button
            type="button"
            onClick={onTogglePause}
            disabled={isUpdatingAction}
            className="w-full border border-[#EDF0F2] bg-white text-[#1F2937] hover:bg-slate-50 rounded-xl text-xs font-bold py-2.5 transition-colors cursor-pointer flex items-center justify-center space-x-2"
          >
            {item.status === 'Paused' ? (
              <Play className="w-3.5 h-3.5 text-[#10B981]" />
            ) : (
              <Pause className="w-3.5 h-3.5 text-[#10B981]" />
            )}
            <span>{pauseButtonText}</span>
          </button>

          <button
            type="button"
            onClick={onCancelItem}
            disabled={isUpdatingAction}
            className="w-full border border-rose-200 text-rose-600 hover:bg-rose-50 rounded-xl text-xs font-bold py-2.5 transition-colors cursor-pointer flex items-center justify-center space-x-2"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Cancel Schedule</span>
          </button>
        </div>
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// 7. MAIN CALENDAR PAGE COMPONENT
// -----------------------------------------------------------------------------

export function CalendarPage() {
  const { toast } = useToast();
  const navigate = useNavigate();

  const [currentMonth, setCurrentMonth] = useState(11);
  const [currentYear, setCurrentYear] = useState(2026);
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'list'>('month');
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [projectFilter, setProjectFilter] = useState('ALL');

  // Tip Banner dismissal stored in localStorage
  const [isTipDismissed, setIsTipDismissed] = useState(() => {
    try {
      return localStorage.getItem('realcrm_calendar_tip_dismissed') === 'true';
    } catch {
      return false;
    }
  });

  const handleDismissTip = () => {
    setIsTipDismissed(true);
    try {
      localStorage.setItem('realcrm_calendar_tip_dismissed', 'true');
    } catch {
      // ignore
    }
  };

  // Responsive Drawer / Bottom Sheet States
  const [isInspectorOpen, setIsInspectorOpen] = useState(false);
  const [popoverDate, setPopoverDate] = useState<string | null>(null);
  const [selectedAgendaDate, setSelectedAgendaDate] = useState<string>('2026-11-01');

  // Confirmation Modal State
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    type: 'pause' | 'cancel';
    item: FrontendCalendarItem | null;
  }>({
    isOpen: false,
    type: 'pause',
    item: null,
  });

  // Real React Query Hooks
  const { data: projects = [] } = useProjects();
  const {
    data: rawItems = [],
    isLoading,
    isError,
    refetch,
    isFetching,
  } = usePlanItems(currentMonth, currentYear);

  const rescheduleMutation = useReschedulePlanItem();
  const pauseMutation = usePausePlanItem();
  const resumeMutation = useResumePlanItem();
  const cancelMutation = useCancelPlanItem();
  const generatePlanMutation = useGeneratePlan();

  // Find currently active item
  const selectedItem = useMemo(() => {
    if (!rawItems.length) return null;
    if (selectedItemId) {
      return rawItems.find((i) => i.id === selectedItemId) || rawItems[0];
    }
    return rawItems[0];
  }, [rawItems, selectedItemId]);

  // Extract distinct projects
  const distinctProjects = useMemo(() => {
    const map = new Map<string, string>();
    rawItems.forEach((i) => {
      if (i.projectId && i.projectName) {
        map.set(i.projectId, i.projectName);
      }
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [rawItems]);

  // Filter items
  const filteredItems = useMemo(() => {
    return rawItems.filter((item) =>
      projectFilter === 'ALL' ? true : item.projectId === projectFilter
    );
  }, [rawItems, projectFilter]);

  // Drag and Drop Sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    })
  );

  // Calendar Days calculation for active month
  const monthDays = useMemo(() => {
    const days: {
      day: number;
      dateStr: string;
      dayOfWeek: number;
      isCurrentMonth: boolean;
      isToday: boolean;
      items: FrontendCalendarItem[];
    }[] = [];

    const firstDayIndex = new Date(currentYear, currentMonth - 1, 1).getDay();
    const totalDays = new Date(currentYear, currentMonth, 0).getDate();

    // Previous month padding days
    const prevMonthLastDate = new Date(currentYear, currentMonth - 1, 0).getDate();
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const dayNum = prevMonthLastDate - i;
      const prevM = currentMonth === 1 ? 12 : currentMonth - 1;
      const prevY = currentMonth === 1 ? currentYear - 1 : currentYear;
      const mStr = String(prevM).padStart(2, '0');
      const dStr = String(dayNum).padStart(2, '0');
      const dateString = `${prevY}-${mStr}-${dStr}`;
      const dayOfWeek = new Date(prevY, prevM - 1, dayNum).getDay();
      days.push({
        day: dayNum,
        dateStr: dateString,
        dayOfWeek,
        isCurrentMonth: false,
        isToday: false,
        items: filteredItems.filter((item) => item.date === dateString),
      });
    }

    // Current month days
    for (let d = 1; d <= totalDays; d++) {
      const mStr = String(currentMonth).padStart(2, '0');
      const dStr = String(d).padStart(2, '0');
      const dateString = `${currentYear}-${mStr}-${dStr}`;
      const dayOfWeek = new Date(currentYear, currentMonth - 1, d).getDay();
      const now = new Date();
      const isToday =
        currentYear === now.getFullYear() &&
        currentMonth === now.getMonth() + 1 &&
        d === now.getDate();

      days.push({
        day: d,
        dateStr: dateString,
        dayOfWeek,
        isCurrentMonth: true,
        isToday,
        items: filteredItems.filter((item) => item.date === dateString),
      });
    }

    // Remainder to complete full grid weeks
    const remainder = (7 - (days.length % 7)) % 7;
    for (let d = 1; d <= remainder; d++) {
      const nextM = currentMonth === 12 ? 1 : currentMonth + 1;
      const nextY = currentMonth === 12 ? currentYear + 1 : currentYear;
      const mStr = String(nextM).padStart(2, '0');
      const dStr = String(d).padStart(2, '0');
      const dateString = `${nextY}-${mStr}-${dStr}`;
      const dayOfWeek = new Date(nextY, nextM - 1, d).getDay();
      days.push({
        day: d,
        dateStr: dateString,
        dayOfWeek,
        isCurrentMonth: false,
        isToday: false,
        items: filteredItems.filter((item) => item.date === dateString),
      });
    }

    return days;
  }, [currentYear, currentMonth, filteredItems]);

  const monthName = new Date(currentYear, currentMonth - 1, 1).toLocaleDateString('en-US', {
    month: 'long',
  });

  // Action Handlers
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    const itemId = active.id as string;
    const newDateStr = over.id as string;

    const draggedItem = rawItems.find((i) => i.id === itemId);
    if (!draggedItem || draggedItem.date === newDateStr) return;

    try {
      await rescheduleMutation.mutateAsync({
        itemId,
        scheduledDate: newDateStr,
        version: draggedItem.version,
      });

      toast({
        title: 'Item Rescheduled',
        message: `Moved "${draggedItem.title}" to ${formatDisplayDate(newDateStr)}.`,
        type: 'success',
      });
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { error?: { message?: string } } } }).response?.data?.error?.message
          : 'Failed to reschedule item';

      toast({
        title: 'Reschedule Error',
        message: msg || 'Could not move scheduled item.',
        type: 'error',
      });
    }
  };

  const handleUpdateDate = async (newDateStr: string) => {
    if (!selectedItem || selectedItem.date === newDateStr) return;

    try {
      await rescheduleMutation.mutateAsync({
        itemId: selectedItem.id,
        scheduledDate: newDateStr,
        version: selectedItem.version,
      });

      toast({
        title: 'Item Rescheduled',
        message: `Moved "${selectedItem.title}" to ${formatDisplayDate(newDateStr)}.`,
        type: 'success',
      });
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { error?: { message?: string } } } }).response?.data?.error?.message
          : 'Failed to reschedule item';

      toast({
        title: 'Reschedule Error',
        message: msg || 'Could not update broadcast date.',
        type: 'error',
      });
    }
  };

  const handleConfirmAction = async () => {
    if (!confirmModal.item) return;

    const item = confirmModal.item;
    try {
      if (confirmModal.type === 'cancel') {
        await cancelMutation.mutateAsync(item.id);
        toast({
          title: 'Broadcast Cancelled',
          message: `Successfully cancelled "${item.title}".`,
          type: 'success',
        });
      } else if (confirmModal.type === 'pause') {
        if (item.status === 'Paused') {
          await resumeMutation.mutateAsync(item.id);
          toast({
            title: 'Broadcast Resumed',
            message: `Active flight restored for "${item.title}".`,
            type: 'success',
          });
        } else {
          await pauseMutation.mutateAsync(item.id);
          toast({
            title: 'Broadcast Paused',
            message: `Publishing temporarily paused for "${item.title}".`,
            type: 'success',
          });
        }
      }
      setConfirmModal({ isOpen: false, type: 'pause', item: null });
      if (confirmModal.type === 'cancel' && selectedItemId === item.id) {
        setIsInspectorOpen(false);
      }
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { error?: { message?: string } } } }).response?.data?.error?.message
          : 'Action failed';

      toast({
        title: 'Action Error',
        message: msg || 'Could not complete requested action.',
        type: 'error',
      });
    }
  };

  const handleGeneratePlan = async () => {
    if (projects.length === 0) {
      toast({
        title: 'No Active Projects Found',
        message: 'Please add a property project in Catalog before generating monthly marketing plans.',
        type: 'error',
      });
      navigate('/projects/new');
      return;
    }

    try {
      const chosenProjectId =
        projectFilter !== 'ALL'
          ? projectFilter
          : distinctProjects[0]?.id || projects[0]?.id;

      await generatePlanMutation.mutateAsync({
        year: currentYear,
        month: currentMonth,
        projectId: chosenProjectId,
      });

      toast({
        title: 'Monthly Plan Generated',
        message: `Plan draft prepared for ${monthName} ${currentYear}.`,
        type: 'success',
      });
      refetch();
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { error?: { message?: string } } } }).response?.data?.error?.message
          : 'Plan generation failed';

      toast({
        title: 'Generation Failed',
        message: msg || 'Could not automatically generate plan.',
        type: 'error',
      });
    }
  };

  const handlePrevMonth = () => {
    if (currentMonth === 1) {
      setCurrentMonth(12);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 12) {
      setCurrentMonth(1);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  const handleGoToday = () => {
    const now = new Date();
    const y = now.getFullYear();
    const m = now.getMonth() + 1;
    const d = now.getDate();
    setCurrentMonth(m);
    setCurrentYear(y);
    setSelectedAgendaDate(`${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`);
  };

  // Loading Skeleton State
  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse pb-12">
        <div className="h-16 bg-white border border-[#EDF0F2] rounded-2xl w-full" />
        <div className="grid grid-cols-7 gap-3">
          {Array.from({ length: 35 }).map((_, i) => (
            <div key={i} className="h-36 bg-white border border-[#EDF0F2] rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  // Error State with Retry Button
  if (isError) {
    return (
      <div className="border border-rose-200 bg-rose-50/50 rounded-2xl p-8 space-y-4 text-center max-w-lg mx-auto my-12 shadow-sm">
        <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
          <AlertTriangle className="w-6 h-6 stroke-[2.2]" />
        </div>
        <div className="space-y-1">
          <h2 className="text-base font-bold text-rose-900">
            Error Loading Editorial Calendar
          </h2>
          <p className="text-xs text-rose-700 leading-relaxed">
            Could not retrieve scheduled campaigns from the backend API.
          </p>
        </div>
        <Button size="sm" variant="primary" onClick={() => refetch()} leftIcon={<RotateCw className="w-3.5 h-3.5" />}>
          Retry Connection
        </Button>
      </div>
    );
  }

  const isUpdatingAction =
    rescheduleMutation.isPending ||
    pauseMutation.isPending ||
    resumeMutation.isPending ||
    cancelMutation.isPending;

  // Real backend metrics summary (scoped to active property filter and calendar period)
  const totalCount = filteredItems.length;
  const approvedCount = filteredItems.filter((i) => i.status === 'Approved').length;
  const scheduledCount = filteredItems.filter((i) => i.status === 'Scheduled').length;
  const pausedCount = filteredItems.filter((i) => i.status === 'Paused').length;

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <div className="space-y-6 w-full max-w-full overflow-x-hidden pb-16">
        {/* 1. HEADER & BREADCRUMBS */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <nav aria-label="Breadcrumbs" className="flex items-center gap-1.5 text-xs text-[#64748B] mb-1">
              <Link to="/dashboard" className="hover:text-[#10B981] transition-colors">
                Dashboard
              </Link>
              <span className="text-slate-300">/</span>
              <span className="text-[#64748B]">Content Planning</span>
              <span className="text-slate-300">/</span>
              <span className="font-semibold text-[#1F2937]">Editorial Calendar</span>
            </nav>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight text-[#1F2937]">
                Editorial Content Calendar
              </h1>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#E8F7F1] text-[#10B981] border border-[#10B981]/20">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981]" />
                <span>Scheduled Content Flights</span>
              </span>
            </div>
            <p className="text-xs text-[#64748B] mt-0.5">
              Coordinate and reschedule real estate marketing flights across Meta Ads, Instagram Reels, and WhatsApp Broadcasts.
            </p>
          </div>

          {/* Quick Metrics Strip */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#EDF0F2] bg-white text-xs shadow-xs">
              <span className="text-[#64748B]">Total Scheduled:</span>
              <strong className="text-[#1F2937] font-bold tabular-nums">{totalCount}</strong>
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-emerald-200 bg-emerald-50 text-xs shadow-xs">
              <span className="text-emerald-700">Approved:</span>
              <strong className="text-emerald-900 font-bold tabular-nums">{approvedCount}</strong>
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-blue-200 bg-blue-50 text-xs shadow-xs">
              <span className="text-blue-700">Scheduled:</span>
              <strong className="text-blue-900 font-bold tabular-nums">{scheduledCount}</strong>
            </div>
            {pausedCount > 0 && (
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-amber-200 bg-amber-50 text-xs shadow-xs">
                <span className="text-amber-700">Paused:</span>
                <strong className="text-amber-900 font-bold tabular-nums">{pausedCount}</strong>
              </div>
            )}
          </div>
        </div>

        {/* 2. RESPONSIVE ACTION TOOLBAR */}
        <div className="rounded-2xl border border-[#EDF0F2] bg-white p-4 shadow-[0_0_2px_0_rgba(145,158,171,0.2),0_12px_24px_-4px_rgba(145,158,171,0.12)] flex flex-wrap items-center justify-between gap-3">
          {/* Left Controls: Month Navigator, Today, Segmented View Switcher & Project Filter */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Month Navigation (< Month Year >) */}
            <div className="inline-flex items-center rounded-xl border border-[#EDF0F2] bg-white shadow-xs">
              <button
                type="button"
                aria-label="Previous month"
                onClick={handlePrevMonth}
                className="p-2 hover:bg-slate-50 text-[#64748B] hover:text-[#1F2937] transition-colors cursor-pointer border-r border-[#EDF0F2] rounded-l-xl"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs font-bold text-[#1F2937] px-4 py-2 min-w-[140px] text-center tabular-nums">
                {monthName} {currentYear}
              </span>
              <button
                type="button"
                aria-label="Next month"
                onClick={handleNextMonth}
                className="p-2 hover:bg-slate-50 text-[#64748B] hover:text-[#1F2937] transition-colors cursor-pointer border-l border-[#EDF0F2] rounded-r-xl"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Today Action */}
            <button
              type="button"
              onClick={handleGoToday}
              className="rounded-xl border border-[#EDF0F2] bg-white text-[#1F2937] hover:bg-slate-50 px-3.5 py-2 text-xs font-semibold transition-all shadow-xs cursor-pointer active:scale-[0.98]"
            >
              Today
            </button>

            {/* Segmented View Mode Switcher */}
            <div className="inline-flex items-center rounded-xl bg-slate-100 p-0.5 text-xs font-semibold">
              {(['month', 'week', 'list'] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setViewMode(m)}
                  className={cn(
                    'px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer capitalize',
                    viewMode === m
                      ? 'bg-white text-[#10B981] shadow-xs'
                      : 'text-[#64748B] hover:text-[#1F2937]'
                  )}
                >
                  {m}
                </button>
              ))}
            </div>

            {/* Project Filter */}
            <select
              value={projectFilter}
              onChange={(e) => setProjectFilter(e.target.value)}
              aria-label="Filter by project"
              className="rounded-xl border border-[#EDF0F2] bg-white text-[#1F2937] px-3 py-2 text-xs font-semibold cursor-pointer shadow-xs focus:outline-none focus:ring-2 focus:ring-[#10B981]"
            >
              <option value="ALL">All Properties ({rawItems.length})</option>
              {distinctProjects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>

            {/* Refresh Action */}
            <button
              type="button"
              aria-label="Refresh calendar"
              onClick={() => refetch()}
              disabled={isFetching}
              title="Refresh calendar items"
              className="p-2 rounded-xl border border-[#EDF0F2] bg-white text-[#1F2937] hover:bg-slate-50 transition-colors shadow-xs cursor-pointer"
            >
              <RotateCw className={cn('w-4 h-4 text-[#10B981]', isFetching && 'animate-spin')} />
            </button>
          </div>

          {/* Right Action: Generate Monthly Plan Button */}
          <button
            type="button"
            onClick={handleGeneratePlan}
            disabled={generatePlanMutation.isPending}
            className="bg-[#10B981] hover:bg-[#059669] text-white rounded-xl text-xs font-bold px-4 py-2.5 flex items-center gap-2 shadow-xs transition-all active:scale-[0.98] cursor-pointer ml-auto disabled:opacity-50"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{generatePlanMutation.isPending ? 'Generating Draft...' : 'Generate Monthly Plan'}</span>
          </button>
        </div>

        {/* 3. DISMISSIBLE TIP BANNER */}
        {!isTipDismissed && (
          <div className="flex items-center justify-between border border-[#EDF0F2] bg-white rounded-2xl px-4 py-2.5 text-xs text-[#64748B] shadow-[0_0_2px_0_rgba(145,158,171,0.2),0_12px_24px_-4px_rgba(145,158,171,0.12)] transition-all">
            <div className="flex items-center gap-2 min-w-0">
              <GripVertical className="w-4 h-4 text-[#10B981] shrink-0" />
              <span className="truncate">
                <strong className="text-[#1F2937] font-semibold">Interactive Tip:</strong> Drag any content card to reschedule across dates, or click a card to inspect metadata, change times, and pause flights.
              </span>
            </div>
            <button
              type="button"
              aria-label="Dismiss tip"
              onClick={handleDismissTip}
              className="text-[#64748B] hover:text-[#1F2937] p-1 rounded-lg hover:bg-slate-100 transition-colors shrink-0 ml-2 cursor-pointer"
              title="Dismiss tip"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* 4. CALENDAR BODY & MULTI-VIEW PRESENTATION */}
        {rawItems.length === 0 ? (
          /* Empty Month State with Action */
          <div className="border border-[#EDF0F2] bg-white p-12 text-center space-y-4 rounded-2xl shadow-[0_0_2px_0_rgba(145,158,171,0.2),0_12px_24px_-4px_rgba(145,158,171,0.12)]">
            <div className="h-12 w-12 rounded-2xl bg-[#E8F7F1] text-[#10B981] flex items-center justify-center mx-auto">
              <CalendarDays className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-[#1F2937]">
                {projects.length === 0 ? 'Create a Property to Start Planning' : 'No Scheduled Content Flights'}
              </h3>
              <p className="text-xs text-[#64748B] max-w-md mx-auto leading-relaxed">
                {projects.length === 0
                  ? 'Your multi-channel editorial calendar schedules posts, reels, and broadcasts directly from real properties in your catalog. Please add your first project in Catalog to begin.'
                  : `No calendar items exist for ${monthName} ${currentYear}. Click below to synthesize an omni-channel schedule based on your active projects and target budget.`}
              </p>
            </div>
            {projects.length === 0 ? (
              <Link to="/projects/new">
                <Button type="button" variant="primary" size="sm" leftIcon={<Sparkles className="w-3.5 h-3.5" />}>
                  + Add Your First Project
                </Button>
              </Link>
            ) : (
              <button
                type="button"
                onClick={handleGeneratePlan}
                disabled={generatePlanMutation.isPending}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#10B981] text-white text-xs font-semibold hover:bg-[#059669] shadow-xs transition-all cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Generate Draft Calendar</span>
              </button>
            )}
          </div>
        ) : (
          <div>
            {/* A. MOBILE VIEW (<768px): Agenda List + Compact Month Jump Strip */}
            <div className="block md:hidden space-y-4">
              {/* Compact Month Jump Strip */}
              <div className="flex items-center space-x-1.5 overflow-x-auto pb-2 scrollbar-none border-b border-[#EDF0F2]">
                {monthDays.map((d) => {
                  const isSelected = selectedAgendaDate === d.dateStr;
                  const hasItems = d.items.length > 0;
                  const weekday = new Date(d.dateStr).toLocaleDateString('en-GB', { weekday: 'narrow' });
                  return (
                    <button
                      key={d.dateStr}
                      type="button"
                      onClick={() => setSelectedAgendaDate(d.dateStr)}
                      className={cn(
                        'flex flex-col items-center justify-center min-w-[44px] py-2 px-1 rounded-xl border transition-all text-xs cursor-pointer shrink-0',
                        isSelected
                          ? 'bg-[#10B981] text-white border-[#10B981] font-bold shadow-xs'
                          : 'bg-white text-[#64748B] border-[#EDF0F2] hover:border-slate-300'
                      )}
                    >
                      <span className="text-[10px] uppercase opacity-80">{weekday}</span>
                      <span className="text-xs font-bold tabular-nums mt-0.5">{d.day}</span>
                      {hasItems && (
                        <span
                          className={cn(
                            'w-1.5 h-1.5 rounded-full mt-1',
                            isSelected ? 'bg-white' : 'bg-[#10B981]'
                          )}
                        />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Agenda List Grouped by Date */}
              <div className="space-y-4">
                {monthDays
                  .filter((d) => (selectedAgendaDate ? d.dateStr === selectedAgendaDate : true))
                  .map((d) => (
                    <div key={d.dateStr} className="space-y-2">
                      <div className="bg-slate-50 p-2.5 rounded-xl border border-[#EDF0F2] text-xs font-bold text-[#1F2937] flex items-center justify-between">
                        <span className="tabular-nums">{formatDisplayDate(d.dateStr)}</span>
                        <span className="text-[#64748B] font-semibold tabular-nums">{d.items.length} items</span>
                      </div>

                      {d.items.length === 0 ? (
                        <p className="text-xs text-[#64748B] p-4 text-center border border-dashed border-[#EDF0F2] rounded-xl bg-white">
                          No scheduled flights for this date.
                        </p>
                      ) : (
                        <div className="space-y-2">
                          {d.items.map((item) => {
                            const { label: pLabel, Icon: PIcon } = getPlatformDetails(item.format);
                            return (
                              <div
                                key={item.id}
                                className="border border-[#EDF0F2] rounded-2xl bg-white p-3.5 space-y-2.5 text-xs shadow-xs"
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center space-x-1.5 text-xs font-bold text-[#1F2937]">
                                    <Clock className="w-3.5 h-3.5 text-[#10B981]" />
                                    <span className="tabular-nums">{item.time}</span>
                                    {projectFilter === 'ALL' && (
                                      <span className="w-4 h-4 rounded-full bg-[#E8F7F1] border border-[#10B981]/30 text-[10px] font-bold text-[#10B981] flex items-center justify-center">
                                        {item.projectName.charAt(0).toUpperCase()}
                                      </span>
                                    )}
                                  </div>
                                  <span
                                    className={cn(
                                      'text-[10px] font-bold px-2 py-0.5 rounded-full',
                                      item.status === 'Approved' && 'bg-[#E8F7F1] text-[#10B981]',
                                      item.status === 'Scheduled' && 'bg-[#EFF6FF] text-[#3B82F6]',
                                      item.status === 'Paused' && 'bg-[#FEF3C7] text-[#D97706]',
                                      item.status === 'Draft' && 'bg-slate-100 text-[#64748B]'
                                    )}
                                  >
                                    {item.status || 'Draft'}
                                  </span>
                                </div>

                                <p className="font-semibold text-xs text-[#1F2937] leading-snug">{item.title}</p>

                                <div className="flex items-center justify-between text-xs pt-2 border-t border-[#EDF0F2]">
                                  <span className="flex items-center space-x-1.5 text-[#64748B]">
                                    <PIcon className="w-3.5 h-3.5 text-[#1F2937]" />
                                    <span>{pLabel}</span>
                                  </span>
                                  <span
                                    className={cn(
                                      'text-[10px] font-bold px-2 py-0.5 rounded-md',
                                      item.isPaid
                                        ? 'bg-[#E8F7F1] text-[#10B981]'
                                        : 'border border-[#EDF0F2] text-[#64748B]'
                                    )}
                                  >
                                    {item.isPaid ? 'Paid' : 'Organic'}
                                  </span>
                                </div>

                                <div className="flex items-center space-x-2 pt-2 border-t border-[#EDF0F2]">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setSelectedItemId(item.id);
                                      setIsInspectorOpen(true);
                                    }}
                                    className="flex-1 border border-[#EDF0F2] bg-white text-[#1F2937] hover:bg-slate-50 rounded-xl text-xs font-semibold py-1.5 transition-colors text-center cursor-pointer"
                                  >
                                    Inspect &amp; Details
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setSelectedItemId(item.id);
                                      setIsInspectorOpen(true);
                                    }}
                                    className="border border-[#EDF0F2] bg-slate-50 hover:bg-slate-100 text-[#1F2937] rounded-xl text-xs font-semibold py-1.5 px-3 transition-colors text-center cursor-pointer"
                                  >
                                    Change Date
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            </div>

            {/* B. TABLET & DESKTOP VIEWS (>=768px) */}
            <div className="hidden md:flex flex-col xl:flex-row gap-6 items-start w-full">
              {/* Main Calendar Month Grid */}
              <div className="flex-1 min-w-0 space-y-4 w-full">
                {viewMode === 'month' && (
                  <div className="border border-[#EDF0F2] rounded-2xl bg-white shadow-[0_0_2px_0_rgba(145,158,171,0.2),0_12px_24px_-4px_rgba(145,158,171,0.12)] p-4 space-y-3">
                    {/* Weekday Section Headers */}
                    <div className="grid grid-cols-7 gap-2.5 text-center pb-2.5 border-b border-[#EDF0F2]">
                      {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map((w) => (
                        <div key={w} className="text-xs font-bold uppercase tracking-wider text-[#64748B]">
                          {w}
                        </div>
                      ))}
                    </div>

                    {/* Month Grid Cells (7 Columns) */}
                    <div className="grid grid-cols-7 gap-2.5">
                      {monthDays.map((d) => (
                        <DroppableDay
                          key={d.dateStr}
                          dateStr={d.dateStr}
                          dayNumber={d.day}
                          dayOfWeek={d.dayOfWeek}
                          isCurrentMonth={d.isCurrentMonth}
                          isToday={d.isToday}
                          items={d.items}
                          onSelect={(item) => {
                            setSelectedItemId(item.id);
                            setIsInspectorOpen(true);
                          }}
                          selectedItemId={selectedItem?.id}
                          showProjectInitial={projectFilter === 'ALL'}
                          onOpenMore={(dStr) => setPopoverDate(dStr)}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* 2. WEEK VIEW */}
                {viewMode === 'week' && (
                  <div className="border border-[#EDF0F2] rounded-2xl bg-white shadow-[0_0_2px_0_rgba(145,158,171,0.2),0_12px_24px_-4px_rgba(145,158,171,0.12)] p-4 space-y-3">
                    <div className="grid grid-cols-7 gap-2.5 text-center pb-2.5 border-b border-[#EDF0F2]">
                      {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map((w) => (
                        <div key={w} className="text-xs font-bold uppercase tracking-wider text-[#64748B]">
                          {w}
                        </div>
                      ))}
                    </div>
                    <div className="grid grid-cols-7 gap-2.5 min-h-[380px]">
                      {monthDays.slice(0, 7).map((d) => (
                        <DroppableDay
                          key={d.dateStr}
                          dateStr={d.dateStr}
                          dayNumber={d.day}
                          dayOfWeek={d.dayOfWeek}
                          isCurrentMonth={d.isCurrentMonth}
                          isToday={d.isToday}
                          items={d.items}
                          onSelect={(item) => {
                            setSelectedItemId(item.id);
                            setIsInspectorOpen(true);
                          }}
                          selectedItemId={selectedItem?.id}
                          showProjectInitial={projectFilter === 'ALL'}
                          onOpenMore={(dStr) => setPopoverDate(dStr)}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* 3. LIST VIEW */}
                {viewMode === 'list' && (
                  <div className="border border-[#EDF0F2] rounded-2xl bg-white shadow-[0_0_2px_0_rgba(145,158,171,0.2),0_12px_24px_-4px_rgba(145,158,171,0.12)] divide-y divide-[#EDF0F2] overflow-hidden">
                    {filteredItems.map((item) => {
                      const { label: pLabel, Icon: PIcon } = getPlatformDetails(item.format);
                      return (
                        <div
                          key={item.id}
                          onClick={() => {
                            setSelectedItemId(item.id);
                            setIsInspectorOpen(true);
                          }}
                          className={cn(
                            'p-4 flex items-center justify-between cursor-pointer hover:bg-slate-50/60 transition-colors duration-150',
                            selectedItem?.id === item.id && 'bg-[#E8F7F1]/30 border-l-4 border-[#10B981]'
                          )}
                        >
                          <div className="space-y-1 min-w-0 flex-1 pr-4">
                            <div className="flex items-center space-x-2">
                              <span className="text-xs font-semibold text-[#64748B] tabular-nums">
                                {formatDisplayDate(item.date)} &bull; {item.time}
                              </span>
                              <span className="text-xs font-bold text-[#1F2937] truncate">
                                &bull; {item.projectName}
                              </span>
                              <span
                                className={cn(
                                  'text-[10px] font-bold px-2 py-0.5 rounded-full',
                                  item.status === 'Approved' && 'bg-[#E8F7F1] text-[#10B981]',
                                  item.status === 'Scheduled' && 'bg-[#EFF6FF] text-[#3B82F6]',
                                  item.status === 'Paused' && 'bg-[#FEF3C7] text-[#D97706]',
                                  item.status === 'Draft' && 'bg-slate-100 text-[#64748B]'
                                )}
                              >
                                {item.status || 'Draft'}
                              </span>
                            </div>
                            <h4 className="text-xs font-bold text-[#1F2937] truncate">{item.title}</h4>
                          </div>

                          <div className="flex items-center space-x-2.5 shrink-0">
                            <span className="text-xs font-semibold text-[#1F2937] border border-[#EDF0F2] bg-white rounded-xl px-2.5 py-1 flex items-center space-x-1.5 shadow-xs">
                              <PIcon className="w-3.5 h-3.5 text-[#10B981]" />
                              <span>{pLabel}</span>
                            </span>
                            <span
                              className={cn(
                                'text-[11px] font-bold rounded-lg px-2 py-1',
                                item.isPaid
                                  ? 'bg-[#E8F7F1] text-[#10B981]'
                                  : 'border border-[#EDF0F2] text-[#64748B]'
                              )}
                            >
                              {item.isPaid ? 'Paid' : 'Organic'}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Static Sticky Inspector on Desktop >=1280px (xl:block) */}
              {isInspectorOpen && selectedItem && (
                <div className="hidden xl:block w-[320px] min-w-[320px] max-w-[320px] shrink-0">
                  <div className="sticky top-6 self-start max-h-[calc(100vh-4rem)] overflow-y-auto pr-1">
                    <ItemInspector
                      item={selectedItem}
                      onClose={() => setIsInspectorOpen(false)}
                      onTogglePause={() =>
                        selectedItem &&
                        setConfirmModal({
                          isOpen: true,
                          type: 'pause',
                          item: selectedItem,
                        })
                      }
                      onCancelItem={() =>
                        selectedItem &&
                        setConfirmModal({
                          isOpen: true,
                          type: 'cancel',
                          item: selectedItem,
                        })
                      }
                      onUpdateDate={handleUpdateDate}
                      isUpdatingAction={isUpdatingAction}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 5. TABLET RIGHT DRAWER (768px - 1279px) */}
        {isInspectorOpen && selectedItem && (
          <div className="hidden md:block xl:hidden">
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-slate-900/40 z-40 transition-opacity duration-150 backdrop-blur-xs"
              onClick={() => setIsInspectorOpen(false)}
            />
            {/* Slide-in Panel */}
            <div className="fixed top-0 right-0 bottom-0 z-50 w-88 max-w-[90vw] bg-white border-l border-[#EDF0F2] p-5 overflow-y-auto shadow-2xl animate-in slide-in-from-right duration-150">
              <ItemInspector
                item={selectedItem}
                onClose={() => setIsInspectorOpen(false)}
                onTogglePause={() =>
                  setConfirmModal({
                    isOpen: true,
                    type: 'pause',
                    item: selectedItem,
                  })
                }
                onCancelItem={() =>
                  setConfirmModal({
                    isOpen: true,
                    type: 'cancel',
                    item: selectedItem,
                  })
                }
                onUpdateDate={handleUpdateDate}
                isUpdatingAction={isUpdatingAction}
              />
            </div>
          </div>
        )}

        {/* 6. MOBILE BOTTOM SHEET (<768px) */}
        {isInspectorOpen && selectedItem && (
          <div className="block md:hidden">
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-slate-900/40 z-40 transition-opacity duration-150 backdrop-blur-xs"
              onClick={() => setIsInspectorOpen(false)}
            />
            {/* Sliding Bottom Sheet */}
            <div className="fixed inset-x-0 bottom-0 z-50 max-h-[85vh] bg-white rounded-t-2xl border-t border-[#EDF0F2] shadow-2xl p-5 overflow-y-auto pb-12 animate-in slide-in-from-bottom duration-150">
              {/* Grab Bar */}
              <div className="w-12 h-1 bg-slate-200 rounded-full mx-auto mb-4" />
              <ItemInspector
                item={selectedItem}
                onClose={() => setIsInspectorOpen(false)}
                onTogglePause={() =>
                  setConfirmModal({
                    isOpen: true,
                    type: 'pause',
                    item: selectedItem,
                  })
                }
                onCancelItem={() =>
                  setConfirmModal({
                    isOpen: true,
                    type: 'cancel',
                    item: selectedItem,
                  })
                }
                onUpdateDate={handleUpdateDate}
                isUpdatingAction={isUpdatingAction}
              />
            </div>
          </div>
        )}

        {/* 7. DAY CELL "+N MORE" MODAL POPOVER */}
        {popoverDate && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity duration-150"
              onClick={() => setPopoverDate(null)}
            />
            <div className="relative bg-white border border-[#EDF0F2] p-6 rounded-2xl max-w-md w-full space-y-4 shadow-2xl z-10 animate-in zoom-in-95 duration-150 max-h-[80vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-[#EDF0F2] pb-3">
                <div>
                  <h3 className="text-sm font-bold text-[#1F2937]">
                    Scheduled Deliverables
                  </h3>
                  <p className="text-xs text-[#64748B] tabular-nums mt-0.5">
                    {formatDisplayDate(popoverDate)}
                  </p>
                </div>
                <button
                  type="button"
                  aria-label="Close popover"
                  onClick={() => setPopoverDate(null)}
                  className="p-1 hover:text-[#1F2937] text-[#64748B] rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-2">
                {rawItems
                  .filter((item) => item.date === popoverDate)
                  .map((item) => (
                    <DraggableItemCard
                      key={item.id}
                      item={item}
                      onSelect={(it) => {
                        setSelectedItemId(it.id);
                        setIsInspectorOpen(true);
                        setPopoverDate(null);
                      }}
                      isSelected={selectedItem?.id === item.id}
                      showProjectInitial={projectFilter === 'ALL'}
                    />
                  ))}
              </div>
            </div>
          </div>
        )}

        {/* 8. CONFIRMATION DIALOG (Pause & Cancel) */}
        <ConfirmationModal
          isOpen={confirmModal.isOpen}
          title={
            confirmModal.type === 'cancel'
              ? 'Cancel Schedule?'
              : confirmModal.item?.status === 'Paused'
                ? 'Resume Schedule?'
                : confirmModal.item?.format === 'WHATSAPP_BROADCAST'
                  ? 'Pause WhatsApp Broadcast?'
                  : 'Pause Schedule?'
          }
          description={
            confirmModal.type === 'cancel'
              ? `Are you sure you want to cancel "${confirmModal.item?.title}"? This item will be permanently removed from active delivery.`
              : confirmModal.item?.status === 'Paused'
                ? `Resume delivery flight for "${confirmModal.item?.title}"?`
                : `Temporarily pause publishing delivery for "${confirmModal.item?.title}"?`
          }
          confirmText={
            confirmModal.type === 'cancel'
              ? 'Cancel schedule'
              : confirmModal.item?.status === 'Paused'
                ? 'Resume'
                : 'Pause'
          }
          isDestructive={confirmModal.type === 'cancel'}
          isLoading={pauseMutation.isPending || resumeMutation.isPending || cancelMutation.isPending}
          onConfirm={handleConfirmAction}
          onClose={() => setConfirmModal({ isOpen: false, type: 'pause', item: null })}
        />
      </div>
    </DndContext>
  );
}
