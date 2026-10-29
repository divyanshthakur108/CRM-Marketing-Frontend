import { format as formatDate, parseISO } from 'date-fns';

/**
 * Formats ISO or date string to "Mon, 2 Nov 2026"
 */
export function formatDisplayDate(dateInput?: string | Date | null): string {
  if (!dateInput) return '—';
  try {
    const d = typeof dateInput === 'string' ? parseISO(dateInput.slice(0, 10)) : dateInput;
    return formatDate(d, 'EEE, d MMM yyyy');
  } catch {
    return String(dateInput);
  }
}

/**
 * Formats time string to 24-hour "HH:mm" (e.g., "18:00")
 */
export function formatDisplayTime(timeStr?: string | null): string {
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

/**
 * Formats currency to Indian format e.g. "₹1.5 Cr", "₹75 L", "₹50,000"
 */
export function formatCurrency(amount?: number | string | null): string {
  if (amount === undefined || amount === null || amount === '') return '—';
  if (typeof amount === 'string') {
    if (amount.startsWith('₹') || amount.includes('Cr') || amount.includes('Lakh')) {
      return amount;
    }
    const parsed = parseFloat(amount.replace(/[^0-9.-]+/g, ''));
    if (isNaN(parsed)) return amount;
    amount = parsed;
  }

  if (amount >= 10000000) {
    const cr = amount / 10000000;
    return `₹${cr % 1 === 0 ? cr.toFixed(0) : cr.toFixed(2)} Cr`;
  }
  if (amount >= 100000) {
    const l = amount / 100000;
    return `₹${l % 1 === 0 ? l.toFixed(0) : l.toFixed(2)} L`;
  }
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Formats location string to Title Case (e.g. "MOHALI, CHANDIGARH" -> "Mohali, Chandigarh")
 */
export function formatLocationTitleCase(locationStr?: string | null): string {
  if (!locationStr) return '—';
  return locationStr
    .toLowerCase()
    .split(',')
    .map((part) =>
      part
        .trim()
        .split(' ')
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ')
    )
    .join(', ');
}

/**
 * Formats byte size to human readable (e.g. "1.2 MB")
 */
export function formatFileSize(bytes?: number | null): string {
  if (!bytes || bytes <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
}
