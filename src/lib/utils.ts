import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * دمج أنماط Tailwind CSS بشكل صحيح
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * تنسيق المبلغ بالجنيه المصري
 */
export function formatCurrency(amount: number | undefined, options: { decimals?: number; showCurrency?: boolean; currencyPosition?: 'before' | 'after' } = {}) {
  // إذا كانت القيمة غير معرفة، نعيد قيمة افتراضية
  if (amount === undefined) {
    amount = 0;
  }

  const {
    decimals = 2, // تغيير القيمة الافتراضية إلى 2 لعرض رقمين عشريين
    showCurrency = true,
    currencyPosition = 'after'
  } = options;

  // تقريب المبلغ إلى العدد المحدد من الأرقام العشرية
  const roundedAmount = Number(amount.toFixed(decimals));

  // تنسيق المبلغ باستخدام Intl.NumberFormat
  const formatter = new Intl.NumberFormat('ar-EG', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });

  const formattedAmount = formatter.format(roundedAmount);

  // إضافة رمز العملة حسب الموضع المحدد
  if (showCurrency) {
    return currencyPosition === 'before'
      ? `ج.م ${formattedAmount}`
      : `${formattedAmount} ج.م`;
  }

  return formattedAmount;
}

/**
 * تنسيق التاريخ بالصيغة العربية
 */
export function formatDate(date: Date | string, options: Intl.DateTimeFormatOptions = {}) {
  const dateObj = typeof date === 'string' ? new Date(date) : date;

  return new Intl.DateTimeFormat('ar-EG', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    ...options
  }).format(dateObj);
}

/**
 * تنسيق الوقت بالصيغة العربية
 */
export function formatTime(date: Date | string) {
  const dateObj = typeof date === 'string' ? new Date(date) : date;

  return new Intl.DateTimeFormat('ar-EG', {
    hour: '2-digit',
    minute: '2-digit'
  }).format(dateObj);
}

/**
 * تنسيق التاريخ والوقت بالصيغة العربية
 */
export function formatDateTime(date: Date | string) {
  const dateObj = typeof date === 'string' ? new Date(date) : date;

  return new Intl.DateTimeFormat('ar-EG', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(dateObj);
}

/**
 * تنسيق النسب المئوية
 */
export function formatPercentage(percentage: number, decimals: number = 1) {
  return new Intl.NumberFormat('ar-EG', {
    style: 'percent',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(percentage / 100);
}

/**
 * تحويل النص إلى slug
 */
export function slugify(text: string) {
  return text
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-');
}

/**
 * الحصول على الأحرف الأولى من الاسم
 */
export function getInitials(name: string) {
  return name
    .split(' ')
    .map(part => part.charAt(0))
    .join('')
    .toUpperCase()
    .substring(0, 2);
}

/**
 * تأخير تنفيذ الكود
 */
export function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * تحويل الرقم إلى كلمات باللغة العربية
 */
export function numberToArabicWords(num: number): string {
  // تنفيذ بسيط - يمكن استخدام مكتبة متخصصة لتحويل الأرقام إلى كلمات عربية
  const arabicNumbers = ['صفر', 'واحد', 'اثنان', 'ثلاثة', 'أربعة', 'خمسة', 'ستة', 'سبعة', 'ثمانية', 'تسعة', 'عشرة'];

  if (num < 11) {
    return arabicNumbers[num];
  }

  return num.toString();
}

/**
 * تحويل الصف الدراسي إلى نص مقروء
 */
export function formatGradeLevel(grade: number, level: 'primary' | 'preparatory' | 'secondary'): string {
  const levelNames = {
    primary: 'الابتدائي',
    preparatory: 'الإعدادي',
    secondary: 'الثانوي'
  };

  return `الصف ${numberToArabicWords(grade)} ${levelNames[level]}`;
}

/**
 * تحويل حالة الطالب إلى نص مقروء
 */
export function formatStudentStatus(status: 'active' | 'inactive' | 'graduated' | 'transferred' | 'excellent' | 'absent'): string {
  const statusMap = {
    active: 'نشط',
    inactive: 'غير نشط',
    graduated: 'متخرج',
    transferred: 'منقول',
    excellent: 'متفوق',
    absent: 'غائب'
  };

  return statusMap[status] || 'غير معروف';
}

// La función formatCurrency ya está definida en la línea 14, así que eliminamos esta definición duplicada

/**
 * تحويل حالة الدفع إلى نص مقروء
 */
export function formatPaymentStatus(status: 'paid' | 'partial' | 'unpaid' | 'overdue'): string {
  const statusMap = {
    paid: 'مدفوع',
    partial: 'مدفوع جزئيًا',
    unpaid: 'غير مدفوع',
    overdue: 'متأخر'
  };

  return statusMap[status] || 'غير معروف';
}

/**
 * تحويل حالة الدفع إلى لون
 */
export function getPaymentStatusColor(status: 'paid' | 'partial' | 'unpaid' | 'overdue'): string {
  const colorMap = {
    paid: 'text-green-600 bg-green-100',
    partial: 'text-amber-600 bg-amber-100',
    unpaid: 'text-gray-600 bg-gray-100',
    overdue: 'text-red-600 bg-red-100'
  };

  return colorMap[status] || 'text-gray-600 bg-gray-100';
}

/**
 * تحويل حالة الحضور إلى نص مقروء
 */
export function formatAttendanceStatus(status: 'present' | 'absent' | 'late' | 'excused'): string {
  const statusMap = {
    present: 'حاضر',
    absent: 'غائب',
    late: 'متأخر',
    excused: 'معذور'
  };

  return statusMap[status] || 'غير معروف';
}

/**
 * تحويل حالة الحضور إلى لون
 */
export function getAttendanceStatusColor(status: 'present' | 'absent' | 'late' | 'excused'): string {
  const colorMap = {
    present: 'text-green-600 bg-green-100',
    absent: 'text-red-600 bg-red-100',
    late: 'text-amber-600 bg-amber-100',
    excused: 'text-blue-600 bg-blue-100'
  };

  return colorMap[status] || 'text-gray-600 bg-gray-100';
}
