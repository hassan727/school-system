/**
 * قاموس ترجمة الأسماء العربية إلى الإنجليزية
 */
export const arabicToEnglishColumnMap: Record<string, string> = {
  'الاسم الكامل': 'full_name',
  'الرقم القومي': 'national_id',
  'الجنس': 'gender',
  'تاريخ الميلاد': 'birth_date',
  'المرحلة الدراسية': 'grade_level',
  'تاريخ الالتحاق': 'enrollment_date',
  'الحالة': 'status',
  'رقم الهاتف': 'phone',
  'اسم ولي الأمر': 'parent_name',
  'هاتف ولي الأمر': 'parent_phone',
  'البريد الإلكتروني': 'email',
  'الديانة': 'religion',
  'اللغة الثانية': 'second_language',
  'العنوان': 'address',
  'ملاحظات': 'notes',
  'ملاحظات صحية': 'health_notes',
  'ملاحظات أكاديمية': 'academic_notes',
  'ملاحظات سلوكية': 'behavior_notes',
  'الرسوم': 'fees_amount',
  'الخصم': 'discount_amount',
  'سبب الخصم': 'discount_reason',
  'رسوم فتح الملف': 'file_opening_fee',
  'الإجمالي بعد الخصم': 'total_after_discount',
  'طريقة الدفع': 'payment_method',
  'عدد الأقساط': 'installments_count',
  'قيمة القسط': 'installment_amount',
  'بيانات الأقساط': 'installments_data',
  'الدفعة المقدمة': 'advance_payment',
  'مستجد': 'active',
  'منقول': 'transferred',
  'ذكر': 'male',
  'أنثى': 'female',
  'فرنسي': 'french',
  'ألماني': 'german',
  'مسلم': 'Muslim',
  'مسيحي': 'Christian'
};

/**
 * تحويل اسم عمود عربي إلى اسم إنجليزي صالح لقاعدة البيانات
 * @param arabicName اسم العمود بالعربية
 * @returns اسم العمود بالإنجليزية
 */
export function translateColumnName(arabicName: string): string {
  // البحث في القاموس
  const englishName = arabicToEnglishColumnMap[arabicName];

  if (englishName) {
    console.log(`Translated column name from "${arabicName}" to "${englishName}"`);
    return englishName;
  }

  // إذا لم يوجد في القاموس، نقوم بتنظيف الاسم وتحويله إلى اسم صالح
  // تحويل الاسم إلى حروف لاتينية فقط
  const cleanName = arabicName
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/[^\w\s]/g, '') // إزالة الأحرف غير اللاتينية
    .replace(/[^\x00-\x7F]/g, '') // إزالة الأحرف غير ASCII
    || `column_${Math.floor(Math.random() * 1000)}`; // إذا كان الاسم فارغًا بعد التنظيف، نستخدم اسمًا عشوائيًا

  console.log(`Generated safe column name from "${arabicName}" to "${cleanName}"`);
  return cleanName;
}

/**
 * تحويل قيمة عربية إلى قيمة إنجليزية
 * @param arabicValue القيمة العربية
 * @returns القيمة الإنجليزية
 */
export function translateValue(arabicValue: string): string {
  if (!arabicValue || typeof arabicValue !== 'string') {
    return arabicValue;
  }

  // البحث في القاموس
  const englishValue = arabicToEnglishColumnMap[arabicValue];

  if (englishValue) {
    console.log(`Translated value from "${arabicValue}" to "${englishValue}"`);
    return englishValue;
  }

  return arabicValue;
}

const columnTranslator = {
  arabicToEnglishColumnMap,
  translateColumnName,
  translateValue
};

export default columnTranslator;
