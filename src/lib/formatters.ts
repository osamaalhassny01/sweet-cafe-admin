export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

const STORAGE_TO_YER_RATE = 100;

const numberFormatter = new Intl.NumberFormat('ar-YE', {
  maximumFractionDigits: 0,
});

export const ORDER_STATUS_LABELS: Record<string, string> = {
  NEW: 'جديد',
  PENDING: 'قيد الانتظار',
  CONFIRMED: 'تم التأكيد',
  PREPARING: 'جاري التحضير',
  READY: 'جاهز',
  OUT_FOR_DELIVERY: 'في الطريق',
  DELIVERED: 'تم التوصيل',
  CANCELLED: 'ملغي',
};

export const ORDER_STATUS_BADGE_CLASSES: Record<string, string> = {
  NEW: 'bg-amber-100 text-amber-700',
  PENDING: 'bg-amber-100 text-amber-700',
  CONFIRMED: 'bg-blue-100 text-blue-700',
  PREPARING: 'bg-indigo-100 text-indigo-700',
  READY: 'bg-cyan-100 text-cyan-700',
  OUT_FOR_DELIVERY: 'bg-purple-100 text-purple-700',
  DELIVERED: 'bg-green-100 text-green-700',
  CANCELLED: 'bg-red-100 text-red-700',
};

export function toNumber(value: unknown): number {
  const amount = Number(value ?? 0);
  return Number.isFinite(amount) ? amount : 0;
}

export function toYemeniRial(value: unknown): number {
  return toNumber(value) * STORAGE_TO_YER_RATE;
}

export function toStorageAmount(value: unknown): number {
  return toNumber(value) / STORAGE_TO_YER_RATE;
}

export function formatCurrency(value: unknown): string {
  return `${numberFormatter.format(toYemeniRial(value))} ر.ي`;
}

export function formatPlainNumber(value: unknown): string {
  return numberFormatter.format(toNumber(value));
}

export function formatCompactCurrency(value: unknown): string {
  const rialValue = toYemeniRial(value);
  if (rialValue >= 1000000) {
    return `${numberFormatter.format(Math.round(rialValue / 1000000))} مليون`;
  }
  if (rialValue >= 1000) {
    return `${numberFormatter.format(Math.round(rialValue / 1000))} ألف`;
  }
  return numberFormatter.format(rialValue);
}

export function formatDateTime(value: string | Date): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString('ar-YE', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

export function formatTime(value: string | Date): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleTimeString('ar-YE', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function getAssetUrl(url?: string | null): string {
  if (!url) return '';
  if (/^https?:\/\//i.test(url)) return url;

  const baseUrl = API_BASE_URL.replace(/\/$/, '');
  const path = url.startsWith('/') ? url : `/${url}`;
  return `${baseUrl}${path}`;
}
