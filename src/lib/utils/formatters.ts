import { format, isToday, isYesterday, isThisWeek, isSameYear, differenceInCalendarDays, parseISO } from 'date-fns';

export function extractDateFromObjectId(id?: string | null): Date | null {
  if (!id || typeof id !== 'string') return null;
  const cleanId = id.trim();
  // MongoDB ObjectId is a 24-character hex string whose first 8 characters encode the creation timestamp
  if (/^[0-9a-fA-F]{24}$/.test(cleanId)) {
    const timestampHex = cleanId.substring(0, 8);
    const seconds = parseInt(timestampHex, 16);
    if (!isNaN(seconds) && seconds > 0) {
      const d = new Date(seconds * 1000);
      if (!isNaN(d.getTime())) return d;
    }
  }
  return null;
}

export function safeParseDate(
  dateInput?: string | Date | number | null,
  fallbackId?: string | null
): Date | null {
  if (dateInput instanceof Date) {
    return isNaN(dateInput.getTime()) ? null : dateInput;
  }
  if (typeof dateInput === 'number') {
    const d = new Date(dateInput);
    return isNaN(d.getTime()) ? null : d;
  }
  if (typeof dateInput === 'string') {
    const trimmed = dateInput.trim();
    if (trimmed) {
      // Check if it's a numeric timestamp string (e.g. "1725219481000")
      if (/^\d{10,16}$/.test(trimmed)) {
        const d = new Date(Number(trimmed));
        if (!isNaN(d.getTime())) return d;
      }

      // Check if it's a 24-char ObjectId
      if (/^[0-9a-fA-F]{24}$/.test(trimmed)) {
        const fromId = extractDateFromObjectId(trimmed);
        if (fromId) return fromId;
      }

      try {
        const d = parseISO(trimmed);
        if (!isNaN(d.getTime())) return d;
      } catch {
        // Fallback
      }

      try {
        const d = new Date(trimmed);
        if (!isNaN(d.getTime())) return d;
      } catch {
        // Fallback
      }
    }
  }

  if (fallbackId) {
    return extractDateFromObjectId(fallbackId);
  }

  return null;
}

export function formatWhatsAppTime(
  dateInput?: string | Date | number | null,
  fallbackId?: string | null
): string {
  const date = safeParseDate(dateInput, fallbackId) || extractDateFromObjectId(fallbackId) || new Date();
  try {
    return format(date, 'h:mm a');
  } catch {
    return format(new Date(), 'h:mm a');
  }
}

export function formatWhatsAppChatDate(
  dateInput?: string | Date | number | null,
  fallbackId?: string | null
): string {
  const date = safeParseDate(dateInput, fallbackId) || extractDateFromObjectId(fallbackId);
  if (!date) return '';

  try {
    if (isToday(date)) {
      return format(date, 'h:mm a');
    }
    if (isYesterday(date)) {
      return 'Yesterday';
    }
    if (isThisWeek(date)) {
      return format(date, 'EEEE');
    }
    return format(date, 'dd/MM/yyyy');
  } catch {
    return '';
  }
}

export function formatMessageDividerDate(
  dateInput?: string | Date | number | null,
  fallbackId?: string | null
): string {
  const date = safeParseDate(dateInput, fallbackId) || extractDateFromObjectId(fallbackId) || new Date();

  try {
    if (isToday(date)) {
      return 'TODAY';
    }
    if (isYesterday(date)) {
      return 'YESTERDAY';
    }

    const now = new Date();
    const daysDiff = differenceInCalendarDays(now, date);

    // Within past 7 days: day of the week (e.g. "FRIDAY", "THURSDAY", "WEDNESDAY")
    if (daysDiff >= 2 && daysDiff <= 7) {
      return format(date, 'EEEE').toUpperCase();
    }

    // Within current calendar year: month and day (e.g. "AUGUST 28", "JULY 15", "JUNE 4")
    if (isSameYear(now, date)) {
      return format(date, 'MMMM d').toUpperCase();
    }

    // Older than current year: month, day, and year (e.g. "AUGUST 28, 2025")
    return format(date, 'MMMM d, yyyy').toUpperCase();
  } catch {
    return 'TODAY';
  }
}

export function formatFileSize(bytes?: number | null | string): string {
  if (bytes === undefined || bytes === null || bytes === '') return '0 B';
  const num = Number(bytes);
  if (isNaN(num) || num <= 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(num) / Math.log(k));
  const formatted = parseFloat((num / Math.pow(k, i)).toFixed(1));
  return `${formatted} ${sizes[i] || 'B'}`;
}

export function formatDuration(seconds?: number | null): string {
  if (seconds === undefined || seconds === null || !isFinite(seconds) || isNaN(seconds) || seconds <= 0) {
    return '0:00';
  }
  const totalSecs = Math.floor(seconds);
  const mins = Math.floor(totalSecs / 60);
  const secs = totalSecs % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function formatPhoneNumber(phone: string): string {
  if (!phone) return '';
  // Clean phone
  const clean = phone.replace(/[^\d+]/g, '');
  return clean;
}

export function getInitials(name?: string): string {
  if (!name) return '?';
  const cleaned = name.replace(/[^\w\s]/gi, '').trim();
  if (!cleaned) return '?';
  const parts = cleaned.split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function getAvatarBgColor(str?: string): string {
  if (!str) return 'bg-emerald-600';
  const colors = [
    'bg-emerald-600',
    'bg-teal-600',
    'bg-cyan-600',
    'bg-blue-600',
    'bg-indigo-600',
    'bg-violet-600',
    'bg-purple-600',
    'bg-rose-600',
    'bg-amber-600',
    'bg-orange-600',
  ];
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % colors.length;
  return colors[index];
}
