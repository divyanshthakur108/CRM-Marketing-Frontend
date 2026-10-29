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
} from 'lucide-react';
import { cn } from '../lib/utils';

// -----------------------------------------------------------------------------
// 1. HELPERS & FORMATTERS (Inter & Tabular-nums everywhere)
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
        Icon: InstagramIcon,
      };
    case 'FACEBOOK_CAROUSEL':
      return {
        label: 'Facebook Post',
        Icon: FacebookIcon,
      };
    case 'WHATSAPP_BROADCAST':
      return {
        label: 'WhatsApp Broadcast',
        Icon: WhatsAppIcon,
      };
    default:
      return {
        label: 'Facebook Post',
        Icon: FacebookIcon,
      };
  }
}

// -----------------------------------------------------------------------------
// 2. CALENDAR CARD COMPONENT (Clean & Professional Monochrome)
// -----------------------------------------------------------------------------

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
        'group relative flex flex-col justify-between w-full min-w-0 rounded-[10px] p-1.5 text-left select-none cursor-pointer',
        'transition-all duration-150 ease-in-out',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0A0A0A] focus-visible:ring-offset-1',
        isSelected
          ? 'bg-white border-[1.5px] border-[#0A0A0A] shadow-[0_2px_8px_rgba(0,0,0,0.08)]'
          : 'bg-white border border-[#E5E5E5] shadow-[0_1px_2px_rgba(0,0,0,0.06)] hover:border-[#A3A3A3]'
      )}
    >
      {/* Row 1: time (e.g. 18:00) on the left, small status dot on the right, drag handle appears only on hover/focus (always visible below 1024px) */}
      <div className="flex items-center justify-between w-full min-w-0 gap-1">
        <div className="flex items-center gap-1 min-w-0">
          <button
            {...attributes}
            {...listeners}
            type="button"
            tabIndex={-1}
            aria-label="Drag to reschedule"
            className="w-3.5 h-3.5 flex items-center justify-center text-[#737373] hover:text-[#0A0A0A] cursor-grab active:cursor-grabbing shrink-0 transition-opacity duration-150 block lg:hidden lg:group-hover:flex lg:group-focus-within:flex focus-visible:flex"
          >
            <GripVertical className="w-3 h-3" />
          </button>
          <span className="tabular-nums text-[12px] font-medium text-[#525252] shrink-0">
            {formatCardTime(item.time)}
          </span>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {showProjectInitial && (
            <span
              title={`Project: ${item.projectName}`}
              className="w-5 h-5 rounded-full bg-[#F5F5F5] border border-[#E5E5E5] text-[12px] font-semibold text-[#525252] flex items-center justify-center leading-none"
            >
              {item.projectName ? item.projectName.charAt(0).toUpperCase() : 'P'}
            </span>
          )}

          {/* Status dot: Draft grey, Approved black, Scheduled outline, Paused yellow/neutral */}
          <span
            title={`Status: ${item.status || 'Draft'}`}
            className={cn(
              'w-2 h-2 rounded-full shrink-0 transition-colors',
              item.status === 'Approved' && 'bg-[#0A0A0A]',
              item.status === 'Scheduled' && 'border border-[#0A0A0A] bg-transparent',
              (item.status === 'Draft' || !item.status) && 'bg-[#A3A3A3]',
              item.status === 'Paused' && 'border border-[#737373] bg-[#E5E5E5]'
            )}
          />
        </div>
      </div>

      {/* Row 2: Title, max 2 lines, full text in tooltip */}
      <p
        title={item.title}
        className="line-clamp-2 text-[14px] font-medium text-[#0A0A0A] leading-snug my-1 min-w-0 break-normal [overflow-wrap:normal] overflow-hidden"
      >
        {item.title}
      </p>

      {/* Row 3: Platform icon + full label if it fits, otherwise icon only with tooltip; "Paid" badge = black filled, "Organic" = outlined */}
      <div className="flex items-center justify-between gap-1 w-full min-w-0 pt-1 border-t border-[#F0F0F0]">
        <div
          title={platformLabel}
          className="flex items-center space-x-1 min-w-0 text-[#525252]"
        >
          <Icon className="w-3.5 h-3.5 shrink-0 text-[#0A0A0A]" />
          <span className="text-[12px] font-medium truncate hidden 2xl:inline">
            {platformLabel}
          </span>
        </div>

        <span
          className={cn(
            'text-[12px] font-medium px-1.5 py-0.5 rounded-[4px] shrink-0 tracking-tight transition-colors',
            item.isPaid
              ? 'bg-[#0A0A0A] text-white'
              : 'border border-[#E5E5E5] text-[#525252] bg-transparent'
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
        'min-h-[140px] border border-[#E5E5E5] rounded-[10px] p-1 sm:p-1.5 flex flex-col justify-between transition-colors duration-150',
        isWeekend ? 'bg-[#FAFAFA]' : 'bg-white',
        !isCurrentMonth && 'opacity-40 bg-[#F9F9F9]',
        isToday && 'ring-1 ring-[#0A0A0A]',
        isOver && 'bg-[#F5F5F5] ring-2 ring-[#0A0A0A]'
      )}
    >
      {/* Day Cell Header: date number top left, item count on right */}
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center">
          {isToday ? (
            <span className="w-6 h-6 rounded-full bg-[#0A0A0A] text-white flex items-center justify-center font-medium tabular-nums text-[12px]">
              {dayNumber}
            </span>
          ) : (
            <span className="text-[12px] font-medium text-[#525252] tabular-nums px-1 py-0.5">
              {dayNumber}
            </span>
          )}
        </div>

        {items.length > 0 && (
          <span className="text-[12px] text-[#737373] tabular-nums">
            {items.length} {items.length === 1 ? 'item' : 'items'}
          </span>
        )}
      </div>

      {/* Cards List (Max 2 cards per cell) */}
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
            className="w-full text-center py-1 text-[12px] font-medium text-[#0A0A0A] bg-[#F5F5F5] hover:bg-[#E5E5E5] border border-[#E5E5E5] rounded-[6px] transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0A0A0A]"
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
        className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity duration-150"
        onClick={onClose}
      />

      {/* Dialog Body */}
      <div className="relative bg-white border border-[#E5E5E5] rounded-[10px] p-6 max-w-sm w-full space-y-4 shadow-xl z-10 animate-in zoom-in-95 duration-150">
        <div className="flex items-start justify-between">
          <h3 className="text-[16px] font-semibold text-[#0A0A0A] leading-snug">
            {title}
          </h3>
          <button
            type="button"
            aria-label="Close dialog"
            onClick={onClose}
            disabled={isLoading}
            className="text-[#737373] hover:text-[#0A0A0A] p-1 rounded-[6px] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-[14px] text-[#525252] leading-relaxed">
          {description}
        </p>

        <div className="flex items-center justify-end space-x-2 pt-2 border-t border-[#E5E5E5]">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="border border-[#E5E5E5] bg-white text-[#0A0A0A] hover:bg-[#F5F5F5] rounded-[8px] text-[12px] font-medium px-3 py-1.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0A0A0A]"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={cn(
              'rounded-[8px] text-[12px] font-medium px-3.5 py-1.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1',
              isDestructive
                ? 'bg-[#DC2626] text-white hover:bg-red-700 focus-visible:ring-red-600'
                : 'bg-[#0A0A0A] text-white hover:bg-[#262626] focus-visible:ring-[#0A0A0A]'
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
// 5. INTERACTIVE DATE PICKER INPUT (Format EEE, d MMM yyyy, store ISO internally)
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
        className="w-full flex items-center justify-between border border-[#E5E5E5] bg-white rounded-[8px] px-3 py-2 text-[12px] font-medium text-[#0A0A0A] hover:border-[#A3A3A3] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0A0A0A] transition-colors cursor-pointer"
      >
        <span className="tabular-nums">{formatDisplayDate(value)}</span>
        <CalendarIcon className="w-4 h-4 text-[#737373]" />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1.5 z-50 bg-white border border-[#E5E5E5] rounded-[10px] p-3 shadow-xl w-64 animate-in fade-in zoom-in-95 duration-100">
          <div className="flex items-center justify-between mb-2">
            <button
              type="button"
              aria-label="Previous month"
              onClick={handlePrevMonth}
              className="p-1 rounded-[6px] hover:bg-neutral-100 text-[#525252] hover:text-[#0A0A0A] transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-[12px] font-semibold text-[#0A0A0A] uppercase tracking-[0.04em]">
              {monthLabel}
            </span>
            <button
              type="button"
              aria-label="Next month"
              onClick={handleNextMonth}
              className="p-1 rounded-[6px] hover:bg-neutral-100 text-[#525252] hover:text-[#0A0A0A] transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center text-[12px] font-medium text-[#737373] mb-1">
            <span>S</span>
            <span>M</span>
            <span>T</span>
            <span>W</span>
            <span>T</span>
            <span>F</span>
            <span>S</span>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center text-[12px]">
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
                    'h-7 w-7 rounded-full flex items-center justify-center font-medium tabular-nums transition-colors',
                    isSelected
                      ? 'bg-[#0A0A0A] text-white font-semibold'
                      : d.isCurrentMonth
                        ? 'text-[#0A0A0A] hover:bg-neutral-100'
                        : 'text-[#A3A3A3] hover:bg-neutral-50'
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
// 6. ITEM INSPECTOR COMPONENT (Reusable for Desktop side, Drawer, Bottom Sheet)
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
      <div className="border border-[#E5E5E5] rounded-[10px] bg-white p-6 text-center text-[#737373] space-y-2 shadow-[0_1px_2px_rgba(0,0,0,0.06)]">
        <CalendarIcon className="w-8 h-8 mx-auto text-[#A3A3A3]" />
        <h4 className="text-[12px] uppercase tracking-[0.04em] font-medium text-[#0A0A0A]">No Item Selected</h4>
        <p className="text-[12px] text-[#525252] leading-relaxed">
          Select any calendar item to inspect details, modify broadcast dates, or pause distribution.
        </p>
      </div>
    );
  }

  const { label: platformLabel, Icon } = getPlatformDetails(item.format);
  const isWhatsApp = item.format === 'WHATSAPP_BROADCAST';
  const pauseButtonText = isWhatsApp
    ? item.status === 'Paused'
      ? 'Resume broadcast'
      : 'Pause broadcast'
    : item.status === 'Paused'
      ? 'Resume'
      : 'Pause';

  return (
    <div className="border border-[#E5E5E5] rounded-[10px] bg-white shadow-[0_1px_2px_rgba(0,0,0,0.06)] overflow-hidden">
      {/* Inspector Header: Title (18px, semibold), status badge, close button */}
      <div className="p-4 border-b border-[#E5E5E5] bg-white flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1 space-y-1">
          <span className="text-[12px] font-medium uppercase tracking-[0.04em] text-[#737373] block">
            Item Inspector
          </span>
          <h3 className="text-[18px] font-semibold text-[#0A0A0A] leading-snug">
            {item.title}
          </h3>
        </div>

        <div className="flex items-center space-x-2 shrink-0 pt-0.5">
          <span
            className={cn(
              'text-[12px] font-medium px-2.5 py-0.5 rounded-[6px] tracking-tight transition-colors',
              item.status === 'Approved' && 'bg-[#0A0A0A] text-white',
              item.status === 'Scheduled' && 'border border-[#0A0A0A] text-[#0A0A0A] bg-transparent',
              item.status === 'Paused' && 'border border-[#E5E5E5] bg-[#F5F5F5] text-[#525252]',
              item.status === 'Draft' && 'bg-neutral-100 text-[#525252]'
            )}
          >
            {item.status || 'Draft'}
          </span>

          {onClose && (
            <button
              type="button"
              aria-label="Close inspector"
              onClick={onClose}
              className="text-[#737373] hover:text-[#0A0A0A] p-1 rounded-[6px] transition-colors"
              title="Close Inspector"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      <div className="p-4 space-y-5 text-[12px]">
        {/* Details: Two-column list, muted 12px labels, 14px medium values, 12px vertical rhythm, thin dividers */}
        <div className="divide-y divide-[#E5E5E5]">
          <div className="flex justify-between items-center py-2.5">
            <span className="text-[12px] font-medium text-[#737373] uppercase tracking-[0.04em]">Project</span>
            <span className="text-[14px] font-medium text-[#0A0A0A] truncate max-w-[200px]" title={item.projectName}>
              {item.projectName}
            </span>
          </div>

          <div className="flex justify-between items-center py-2.5">
            <span className="text-[12px] font-medium text-[#737373] uppercase tracking-[0.04em]">Platform</span>
            <span className="text-[14px] font-medium text-[#0A0A0A] flex items-center space-x-1.5">
              <Icon className="w-4 h-4 text-[#0A0A0A]" />
              <span>{platformLabel}</span>
            </span>
          </div>

          <div className="flex justify-between items-center py-2.5">
            <span className="text-[12px] font-medium text-[#737373] uppercase tracking-[0.04em]">Type</span>
            <span className="text-[14px] font-medium text-[#0A0A0A]">
              {item.isPaid ? 'Paid' : 'Organic'}
            </span>
          </div>

          <div className="flex justify-between items-center py-2.5">
            <span className="text-[12px] font-medium text-[#737373] uppercase tracking-[0.04em]">Date</span>
            <span className="text-[14px] font-medium text-[#0A0A0A] tabular-nums">
              {formatDisplayDate(item.date)}
            </span>
          </div>

          <div className="flex justify-between items-center py-2.5">
            <span className="text-[12px] font-medium text-[#737373] uppercase tracking-[0.04em]">Time</span>
            <span className="text-[14px] font-medium text-[#0A0A0A] tabular-nums">
              {item.time} ({item.timezone || 'Asia/Kolkata'})
            </span>
          </div>

          <div className="flex justify-between items-center py-2.5">
            <span className="text-[12px] font-medium text-[#737373] uppercase tracking-[0.04em]">Status</span>
            <span className="text-[14px] font-medium text-[#0A0A0A]">
              {item.status}
            </span>
          </div>

          <div className="flex justify-between items-center py-2.5">
            <span className="text-[12px] font-medium text-[#737373] uppercase tracking-[0.04em]">Version</span>
            <span className="text-[14px] font-medium text-[#0A0A0A] tabular-nums">
              v{item.version || 1}
            </span>
          </div>
        </div>

        {/* Creative Brief in a soft grey box with 14px/1.5 text */}
        <div className="space-y-1.5">
          <span className="text-[12px] font-medium uppercase tracking-[0.04em] text-[#737373] block">
            Creative Brief & Topic
          </span>
          <div className="bg-[#F5F5F5] border border-[#E5E5E5] rounded-[10px] p-3.5 text-[14px] leading-[1.5] text-[#0A0A0A]">
            {item.creativeBrief || item.topic || 'Targeted property marketing and strategic campaign flight.'}
          </div>
        </div>

        {/* Reschedule Date Control with matching format date picker */}
        <div className="space-y-2 border-t border-[#E5E5E5] pt-4">
          <label className="block text-[12px] font-medium uppercase tracking-[0.04em] text-[#737373]">
            Reschedule Date (Current: <span className="tabular-nums font-semibold text-[#0A0A0A]">{formatDisplayDate(item.date)}</span>)
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
              className="bg-[#0A0A0A] text-white hover:bg-[#262626] disabled:opacity-40 disabled:cursor-not-allowed rounded-[8px] text-[12px] font-medium px-4 py-2 transition-colors cursor-pointer shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0A0A0A]"
            >
              Apply
            </button>
          </div>

          {/* Quick Reschedule Pills: "+1 day" and "+7 days" */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              type="button"
              disabled={isUpdatingAction}
              onClick={() => {
                const next = addDays(parseISO(rescheduleDate || item.date), 1);
                setRescheduleDate(formatDate(next, 'yyyy-MM-dd'));
              }}
              className="border border-[#E5E5E5] bg-white text-[#0A0A0A] hover:bg-[#F5F5F5] rounded-[8px] text-[12px] font-medium py-1.5 px-3 transition-colors text-center cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0A0A0A]"
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
              className="border border-[#E5E5E5] bg-white text-[#0A0A0A] hover:bg-[#F5F5F5] rounded-[8px] text-[12px] font-medium py-1.5 px-3 transition-colors text-center cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0A0A0A]"
            >
              +7 days
            </button>
          </div>
        </div>

        {/* Actions: Pause & Outlined Destructive Cancel schedule */}
        <div className="space-y-2 border-t border-[#E5E5E5] pt-4">
          <button
            type="button"
            onClick={onTogglePause}
            disabled={isUpdatingAction}
            className="w-full border border-[#E5E5E5] bg-white text-[#0A0A0A] hover:bg-[#F5F5F5] rounded-[10px] text-[12px] font-medium py-2.5 transition-colors cursor-pointer flex items-center justify-center space-x-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0A0A0A]"
          >
            {item.status === 'Paused' ? (
              <Play className="w-3.5 h-3.5 text-[#0A0A0A]" />
            ) : (
              <Pause className="w-3.5 h-3.5 text-[#0A0A0A]" />
            )}
            <span>{pauseButtonText}</span>
          </button>

          <button
            type="button"
            onClick={onCancelItem}
            disabled={isUpdatingAction}
            className="w-full border border-[#E5E5E5] text-[#DC2626] hover:border-[#DC2626] hover:bg-red-50/50 rounded-[10px] text-[12px] font-medium py-2.5 transition-colors cursor-pointer flex items-center justify-center space-x-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#DC2626]"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Cancel schedule</span>
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

  // Calendar Days calculation for the active month
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
      const isToday =
        currentYear === 2026 &&
        currentMonth === 11 &&
        d === 27;

      days.push({
        day: d,
        dateStr: dateString,
        dayOfWeek,
        isCurrentMonth: true,
        isToday,
        items: filteredItems.filter((item) => item.date === dateString),
      });
    }

    // Remainder to complete full grid weeks (up to 35 or 42 cells)
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
    setCurrentMonth(11);
    setCurrentYear(2026);
    setSelectedAgendaDate('2026-11-27');
  };

  // Loading Skeleton State
  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-14 bg-white border border-[#E5E5E5] rounded-[10px] w-full" />
        <div className="grid grid-cols-7 gap-2">
          {Array.from({ length: 35 }).map((_, i) => (
            <div key={i} className="h-32 bg-white border border-[#E5E5E5] rounded-[10px]" />
          ))}
        </div>
      </div>
    );
  }

  // Error State with Retry Button
  if (isError) {
    return (
      <div className="border border-[#E5E5E5] rounded-[10px] p-8 space-y-4 bg-white text-center max-w-lg mx-auto my-12 shadow-[0_1px_2px_rgba(0,0,0,0.06)]">
        <div className="w-12 h-12 rounded-full bg-[#F5F5F5] border border-[#E5E5E5] text-[#0A0A0A] flex items-center justify-center mx-auto">
          <AlertTriangle className="w-6 h-6 text-[#0A0A0A]" />
        </div>
        <div className="space-y-1">
          <h2 className="text-[16px] font-semibold text-[#0A0A0A]">
            Error Loading Calendar
          </h2>
          <p className="text-[14px] text-[#525252]">
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

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <div className="space-y-4 w-full max-w-full overflow-x-hidden">
        {/* 1. HEADER & RESPONSIVE TOOLBAR */}
        <div className="space-y-3 pb-3 border-b border-[#E5E5E5]">
          {/* Title with Subtitle below it */}
          <div>
            <h1 className="text-[28px] font-semibold tracking-tight text-[#0A0A0A] leading-tight">
              Marketing Calendar
            </h1>
            <p className="text-[12px] text-[#737373] mt-0.5 font-normal">
              Facebook, Instagram and WhatsApp
            </p>
          </div>

          {/* Aligned Toolbar: One row on desktop, wrapping on tablet/mobile */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            {/* Left Controls: Month Navigation, Today, Segmented Switcher & Project Filter */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Month Navigation (< Month Year >) */}
              <div className="flex items-center rounded-[8px] border border-[#E5E5E5] bg-white shadow-xs">
                <button
                  type="button"
                  aria-label="Previous month"
                  onClick={handlePrevMonth}
                  className="p-1.5 hover:bg-neutral-50 text-[#525252] hover:text-[#0A0A0A] transition-colors cursor-pointer border-r border-[#E5E5E5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0A0A0A]"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-[12px] font-medium text-[#0A0A0A] px-3 py-1.5 min-w-[130px] text-center tabular-nums">
                  {monthName} {currentYear}
                </span>
                <button
                  type="button"
                  aria-label="Next month"
                  onClick={handleNextMonth}
                  className="p-1.5 hover:bg-neutral-50 text-[#525252] hover:text-[#0A0A0A] transition-colors cursor-pointer border-l border-[#E5E5E5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0A0A0A]"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* Today Button */}
              <button
                type="button"
                onClick={handleGoToday}
                className="rounded-[8px] border border-[#E5E5E5] bg-white text-[#0A0A0A] hover:bg-neutral-50 px-3 py-1.5 text-[12px] font-medium transition-colors shadow-xs cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0A0A0A]"
              >
                Today
              </button>

              {/* Month/Week/List Segmented Control */}
              <div className="flex items-center rounded-[8px] border border-[#E5E5E5] bg-[#F5F5F5] p-0.5 gap-0.5">
                <button
                  type="button"
                  onClick={() => setViewMode('month')}
                  className={cn(
                    'px-3 py-1 text-[12px] font-medium rounded-[6px] transition-all duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0A0A0A]',
                    viewMode === 'month'
                      ? 'bg-[#0A0A0A] text-white shadow-xs font-semibold'
                      : 'text-[#525252] hover:text-[#0A0A0A]'
                  )}
                >
                  Month
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('week')}
                  className={cn(
                    'px-3 py-1 text-[12px] font-medium rounded-[6px] transition-all duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0A0A0A]',
                    viewMode === 'week'
                      ? 'bg-[#0A0A0A] text-white shadow-xs font-semibold'
                      : 'text-[#525252] hover:text-[#0A0A0A]'
                  )}
                >
                  Week
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('list')}
                  className={cn(
                    'px-3 py-1 text-[12px] font-medium rounded-[6px] transition-all duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0A0A0A]',
                    viewMode === 'list'
                      ? 'bg-[#0A0A0A] text-white shadow-xs font-semibold'
                      : 'text-[#525252] hover:text-[#0A0A0A]'
                  )}
                >
                  List
                </button>
              </div>

              {/* Project Filter */}
              <select
                value={projectFilter}
                onChange={(e) => setProjectFilter(e.target.value)}
                aria-label="Filter by project"
                className="rounded-[8px] border border-[#E5E5E5] bg-white text-[#0A0A0A] px-3 py-1.5 text-[12px] font-medium cursor-pointer shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0A0A0A]"
              >
                <option value="ALL">
                  All Projects ({rawItems.length})
                </option>
                {distinctProjects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>

              {/* Refresh Icon Button */}
              <button
                type="button"
                aria-label="Refresh calendar"
                onClick={() => refetch()}
                disabled={isFetching}
                title="Refresh calendar items"
                className="p-2 rounded-[8px] border border-[#E5E5E5] bg-white text-[#0A0A0A] hover:bg-neutral-50 transition-colors shadow-xs cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0A0A0A]"
              >
                <RotateCw className={cn('w-4 h-4', isFetching && 'animate-spin')} />
              </button>
            </div>

            {/* Right Action: Primary Black Generate Monthly Plan Button */}
            <button
              type="button"
              onClick={handleGeneratePlan}
              disabled={generatePlanMutation.isPending}
              className="bg-[#0A0A0A] text-white hover:bg-[#262626] rounded-[8px] text-[12px] font-medium px-4 py-2 flex items-center gap-2 shadow-xs transition-colors cursor-pointer ml-auto focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0A0A0A]"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{generatePlanMutation.isPending ? 'Generating...' : 'Generate Monthly Plan'}</span>
            </button>
          </div>
        </div>

        {/* 2. DISMISSIBLE TIP BANNER (Stays dismissed in localStorage) */}
        {!isTipDismissed && (
          <div className="flex items-center justify-between border border-[#E5E5E5] bg-white rounded-[10px] px-3.5 py-2 text-[12px] text-[#525252] shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition-all">
            <div className="flex items-center gap-2 min-w-0">
              <GripVertical className="w-3.5 h-3.5 text-[#737373] shrink-0" />
              <span className="truncate">
                <strong className="text-[#0A0A0A] font-medium">Tip:</strong> Drag any card to reschedule between days, or click to inspect and adjust broadcasts.
              </span>
            </div>
            <button
              type="button"
              aria-label="Dismiss tip"
              onClick={handleDismissTip}
              className="text-[#737373] hover:text-[#0A0A0A] p-1 rounded-[6px] hover:bg-neutral-100 transition-colors shrink-0 ml-2 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0A0A0A]"
              title="Dismiss tip"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* 3. CALENDAR BODY & RESPONSIVE LAYOUT */}
        {rawItems.length === 0 ? (
          /* Empty Month State with Action */
          <div className="border border-[#E5E5E5] bg-white p-12 text-center space-y-4 rounded-[10px] shadow-[0_1px_2px_rgba(0,0,0,0.06)]">
            <CalendarIcon className="w-10 h-10 mx-auto text-[#A3A3A3]" />
            <div className="space-y-1">
              <h3 className="text-[16px] font-semibold text-[#0A0A0A]">
                {projects.length === 0 ? 'Create a Project to Start Planning' : 'No Marketing Items Scheduled'}
              </h3>
              <p className="text-[14px] text-[#525252] max-w-md mx-auto leading-relaxed">
                {projects.length === 0
                  ? 'Your multi-channel marketing calendar generates social posts, ad flights, and campaigns directly from real properties in your catalog. Please add your first project in Catalog to generate your plan.'
                  : `No calendar items exist for ${monthName} ${currentYear}. Click below to generate an omni-channel schedule based on your active projects and budget.`}
              </p>
            </div>
            {projects.length === 0 ? (
              <Link to="/projects/new">
                <Button type="button" variant="primary" size="sm" leftIcon={<Sparkles className="w-3.5 h-3.5" />}>
                  + Add Your First Project
                </Button>
              </Link>
            ) : (
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={handleGeneratePlan}
                isLoading={generatePlanMutation.isPending}
                leftIcon={<Sparkles className="w-3.5 h-3.5" />}
              >
                Generate Draft Calendar
              </Button>
            )}
          </div>
        ) : (
          <div>
            {/* A. MOBILE VIEW (<768px): Agenda List + Compact Month Jump Strip */}
            <div className="block md:hidden space-y-4">
              {/* Compact Month Jump Strip */}
              <div className="flex items-center space-x-1.5 overflow-x-auto pb-2 scrollbar-none border-b border-[#E5E5E5]">
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
                        'flex flex-col items-center justify-center min-w-[44px] py-2 px-1 rounded-[8px] border transition-all text-[12px] cursor-pointer shrink-0',
                        isSelected
                          ? 'bg-[#0A0A0A] text-white border-[#0A0A0A] font-semibold shadow-xs'
                          : 'bg-white text-[#525252] border-[#E5E5E5] hover:border-[#A3A3A3]'
                      )}
                    >
                      <span className="text-[12px] uppercase opacity-75">{weekday}</span>
                      <span className="text-[14px] font-semibold tabular-nums">{d.day}</span>
                      {hasItems && (
                        <span
                          className={cn(
                            'w-1.5 h-1.5 rounded-full mt-1',
                            isSelected ? 'bg-white' : 'bg-[#0A0A0A]'
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
                      <div className="bg-[#F5F5F5] p-2.5 rounded-[8px] border border-[#E5E5E5] text-[12px] font-semibold text-[#0A0A0A] flex items-center justify-between">
                        <span className="tabular-nums">{formatDisplayDate(d.dateStr)}</span>
                        <span className="text-[#737373] font-normal tabular-nums">{d.items.length} items</span>
                      </div>

                      {d.items.length === 0 ? (
                        <p className="text-[12px] text-[#737373] p-4 text-center border border-dashed border-[#E5E5E5] rounded-[8px]">
                          No scheduled items for this date.
                        </p>
                      ) : (
                        <div className="space-y-2">
                          {d.items.map((item) => {
                            const { label: pLabel, Icon: PIcon } = getPlatformDetails(item.format);
                            return (
                              <div
                                key={item.id}
                                className="border border-[#E5E5E5] rounded-[10px] bg-white p-3 space-y-2 text-[12px] shadow-[0_1px_2px_rgba(0,0,0,0.06)]"
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center space-x-1.5 text-[12px] font-medium text-[#525252]">
                                    <Clock className="w-3.5 h-3.5 text-[#737373]" />
                                    <span className="tabular-nums">{item.time}</span>
                                    {projectFilter === 'ALL' && (
                                      <span className="w-5 h-5 rounded-full bg-[#F5F5F5] border border-[#E5E5E5] text-[12px] font-medium text-[#525252] flex items-center justify-center">
                                        {item.projectName.charAt(0).toUpperCase()}
                                      </span>
                                    )}
                                  </div>
                                  <span
                                    className={cn(
                                      'text-[12px] font-medium px-2 py-0.5 rounded-[6px]',
                                      item.status === 'Approved' && 'bg-[#0A0A0A] text-white',
                                      item.status === 'Scheduled' && 'border border-[#0A0A0A] text-[#0A0A0A] bg-transparent',
                                      item.status === 'Paused' && 'border border-[#E5E5E5] bg-[#F5F5F5] text-[#525252]',
                                      item.status === 'Draft' && 'bg-neutral-100 text-[#525252]'
                                    )}
                                  >
                                    {item.status || 'Draft'}
                                  </span>
                                </div>

                                <p className="font-medium text-[14px] text-[#0A0A0A] leading-snug">{item.title}</p>

                                <div className="flex items-center justify-between text-[12px] pt-2 border-t border-[#F0F0F0]">
                                  <span className="flex items-center space-x-1.5 text-[#525252]">
                                    <PIcon className="w-3.5 h-3.5 text-[#0A0A0A]" />
                                    <span>{pLabel}</span>
                                  </span>
                                  <span
                                    className={cn(
                                      'text-[12px] font-medium px-2 py-0.5 rounded-[6px]',
                                      item.isPaid
                                        ? 'bg-[#0A0A0A] text-white'
                                        : 'border border-[#E5E5E5] text-[#525252]'
                                    )}
                                  >
                                    {item.isPaid ? 'Paid' : 'Organic'}
                                  </span>
                                </div>

                                <div className="flex items-center space-x-2 pt-2 border-t border-[#F0F0F0]">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setSelectedItemId(item.id);
                                      setIsInspectorOpen(true);
                                    }}
                                    className="flex-1 border border-[#E5E5E5] bg-white text-[#0A0A0A] hover:bg-[#F5F5F5] rounded-[8px] text-[12px] font-medium py-1.5 transition-colors text-center cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0A0A0A]"
                                  >
                                    Inspect &amp; Details
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setSelectedItemId(item.id);
                                      setIsInspectorOpen(true);
                                    }}
                                    className="border border-[#E5E5E5] bg-[#F5F5F5] hover:bg-[#E5E5E5] text-[#0A0A0A] rounded-[8px] text-[12px] font-medium py-1.5 px-3 transition-colors text-center cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0A0A0A]"
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
            <div className="hidden md:flex flex-col xl:flex-row gap-4 items-start w-full">
              {/* Main Calendar Month Grid (Takes full width on tablet, flex-1 on desktop >=1280px) */}
              <div className="flex-1 min-w-0 space-y-4 w-full">
                {viewMode === 'month' && (
                  <div className="border border-[#E5E5E5] rounded-[10px] bg-white shadow-[0_1px_2px_rgba(0,0,0,0.06)] p-3 space-y-2">
                    {/* Weekday Section Headers: 12px/medium uppercase with 0.04em letter spacing */}
                    <div className="grid grid-cols-7 gap-2 text-center pb-2 border-b border-[#E5E5E5]">
                      {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map((w) => (
                        <div key={w} className="text-[12px] font-medium uppercase tracking-[0.04em] text-[#737373]">
                          {w}
                        </div>
                      ))}
                    </div>

                    {/* Month Grid Cells (7 Columns) */}
                    <div className="grid grid-cols-7 gap-2">
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
                  <div className="border border-[#E5E5E5] rounded-[10px] bg-white shadow-[0_1px_2px_rgba(0,0,0,0.06)] p-3 space-y-2">
                    <div className="grid grid-cols-7 gap-2 text-center pb-2 border-b border-[#E5E5E5]">
                      {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map((w) => (
                        <div key={w} className="text-[12px] font-medium uppercase tracking-[0.04em] text-[#737373]">
                          {w}
                        </div>
                      ))}
                    </div>
                    <div className="grid grid-cols-7 gap-2">
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
                  <div className="border border-[#E5E5E5] rounded-[10px] bg-white shadow-[0_1px_2px_rgba(0,0,0,0.06)] divide-y divide-[#E5E5E5] overflow-hidden">
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
                            'p-3.5 flex items-center justify-between cursor-pointer hover:bg-neutral-50 transition-colors duration-150',
                            selectedItem?.id === item.id && 'bg-[#F5F5F5] border-l-2 border-[#0A0A0A]'
                          )}
                        >
                          <div className="space-y-1 min-w-0 flex-1 pr-4">
                            <div className="flex items-center space-x-2">
                              <span className="text-[12px] font-medium text-[#525252] tabular-nums">
                                {formatDisplayDate(item.date)} • {item.time}
                              </span>
                              <span className="text-[12px] font-semibold text-[#0A0A0A] truncate">
                                • {item.projectName}
                              </span>
                              <span
                                className={cn(
                                  'text-[12px] font-medium px-2 py-0.5 rounded-[6px]',
                                  item.status === 'Approved' && 'bg-[#0A0A0A] text-white',
                                  item.status === 'Scheduled' && 'border border-[#0A0A0A] text-[#0A0A0A] bg-transparent',
                                  item.status === 'Paused' && 'border border-[#E5E5E5] bg-[#F5F5F5] text-[#525252]',
                                  item.status === 'Draft' && 'bg-neutral-100 text-[#525252]'
                                )}
                              >
                                {item.status || 'Draft'}
                              </span>
                            </div>
                            <h4 className="text-[14px] font-medium text-[#0A0A0A] truncate">{item.title}</h4>
                          </div>

                          <div className="flex items-center space-x-2 shrink-0">
                            <span className="text-[12px] font-medium text-[#525252] border border-[#E5E5E5] rounded-[6px] px-2 py-0.5 flex items-center space-x-1">
                              <PIcon className="w-3.5 h-3.5 text-[#0A0A0A]" />
                              <span>{pLabel}</span>
                            </span>
                            <span
                              className={cn(
                                'text-[12px] font-medium rounded-[6px] px-2 py-0.5',
                                item.isPaid
                                  ? 'bg-[#0A0A0A] text-white'
                                  : 'border border-[#E5E5E5] text-[#525252]'
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
                <div className="hidden xl:block w-[300px] min-w-[300px] max-w-[300px] shrink-0">
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

        {/* 4. TABLET RIGHT DRAWER (768px - 1279px) */}
        {isInspectorOpen && selectedItem && (
          <div className="hidden md:block xl:hidden">
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-black/40 z-40 transition-opacity duration-150"
              onClick={() => setIsInspectorOpen(false)}
            />
            {/* Slide-in Panel */}
            <div className="fixed top-0 right-0 bottom-0 z-50 w-88 max-w-[90vw] bg-white border-l border-[#E5E5E5] p-4 overflow-y-auto shadow-2xl animate-in slide-in-from-right duration-150">
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

        {/* 5. MOBILE BOTTOM SHEET (<768px) */}
        {isInspectorOpen && selectedItem && (
          <div className="block md:hidden">
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-black/40 z-40 transition-opacity duration-150"
              onClick={() => setIsInspectorOpen(false)}
            />
            {/* Sliding Bottom Sheet */}
            <div className="fixed inset-x-0 bottom-0 z-50 max-h-[85vh] bg-white rounded-t-[16px] border-t border-[#E5E5E5] shadow-2xl p-4 overflow-y-auto pb-12 animate-in slide-in-from-bottom duration-150">
              {/* Grab Bar */}
              <div className="w-10 h-1 bg-[#E5E5E5] rounded-full mx-auto mb-3" />
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

        {/* 6. DAY CELL "+N MORE" MODAL POPOVER */}
        {popoverDate && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity duration-150"
              onClick={() => setPopoverDate(null)}
            />
            <div className="relative bg-white border border-[#E5E5E5] p-5 rounded-[10px] max-w-md w-full space-y-4 shadow-xl z-10 animate-in zoom-in-95 duration-150 max-h-[80vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-[#E5E5E5] pb-2">
                <div>
                  <h3 className="text-[14px] font-semibold text-[#0A0A0A]">
                    All Scheduled Items
                  </h3>
                  <p className="text-[12px] text-[#737373] tabular-nums">
                    {formatDisplayDate(popoverDate)}
                  </p>
                </div>
                <button
                  type="button"
                  aria-label="Close popover"
                  onClick={() => setPopoverDate(null)}
                  className="p-1 hover:text-[#0A0A0A] text-[#737373] rounded-[6px] transition-colors cursor-pointer"
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

        {/* 7. CONFIRMATION DIALOG (Pause & Cancel) */}
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
