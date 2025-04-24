# التعامل مع العملة المصرية

## عرض وتنسيق القيم المالية
- عرض جميع القيم المالية بالجنيه المصري مع رمز العملة (ج.م)
- تنسيق الأرقام حسب النظام المصري:
  - استخدام الفاصلة للألوف (1,000)
  - استخدام النقطة للكسور العشرية (1.50)
  - عرض القيم بصيغة: 1,234.56 ج.م
- إمكانية تغيير موضع رمز العملة (قبل أو بعد الرقم) من إعدادات النظام
- تقريب القيم المالية إلى أقرب قرش (0.01 ج.م)

## تحويل الأرقام إلى كلمات
- استخدام مكتبة متخصصة لتحويل الأرقام إلى كلمات باللغة العربية
- عرض المبالغ بالأرقام والحروف في الإيصالات والفواتير:
  - مثال: 1,234.50 ج.م (ألف ومائتان وأربعة وثلاثون جنيهاً وخمسون قرشاً)
- مراعاة قواعد اللغة العربية في كتابة المبالغ (التذكير والتأنيث، المفرد والجمع)
- دعم المبالغ الكبيرة (الملايين والمليارات) بشكل صحيح

## العمليات الحسابية
- إجراء جميع العمليات الحسابية المالية بدقة عالية لتجنب أخطاء التقريب
- استخدام نوع بيانات Decimal في قاعدة البيانات للقيم المالية
- تنفيذ دوال خاصة للعمليات المالية (جمع، طرح، ضرب، قسمة) تراعي دقة الحسابات
- التعامل مع كسور القرش بشكل صحيح في جميع العمليات الحسابية
- تطبيق قواعد التقريب المالي المعتمدة في مصر

## التقارير المالية
- عرض المجاميع والإجماليات بتنسيق العملة المصرية
- توفير تقارير مالية متنوعة (يومية، أسبوعية، شهرية، سنوية)
- إمكانية تصدير التقارير المالية مع الحفاظ على تنسيق العملة المصرية
- عرض الرسوم البيانية المالية مع تنسيق العملة المصرية
- توفير تقارير مقارنة للفترات المختلفة مع احتساب نسب النمو أو الانخفاض

## الواجهة المالية
- تصميم حقول إدخال المبالغ المالية بشكل يسهل إدخال القيم بالجنيه المصري
- تنسيق تلقائي للمبالغ المدخلة (إضافة الفواصل والنقاط)
- عرض رمز العملة بشكل ثابت بجوار حقول الإدخال المالية
- استخدام ألوان مميزة للقيم المالية (الإيرادات باللون الأخضر، المصروفات باللون الأحمر)

## تنفيذ تنسيق العملة المصرية
```typescript
// src/utils/currency.ts

/**
 * تنسيق المبلغ بالجنيه المصري
 * @param amount المبلغ المراد تنسيقه
 * @param options خيارات التنسيق
 * @returns المبلغ المنسق بالجنيه المصري
 */
export const formatEGP = (
  amount: number,
  options: {
    decimals?: number;
    showCurrency?: boolean;
    currencyPosition?: 'before' | 'after';
  } = {}
): string => {
  const {
    decimals = 2,
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
};

/**
 * تحويل المبلغ إلى كلمات باللغة العربية
 * @param amount المبلغ المراد تحويله
 * @returns المبلغ بالكلمات العربية
 */
export const amountToWords = (amount: number): string => {
  // القيم الأساسية للأرقام بالعربية
  const ones = [
    '', 'واحد', 'اثنان', 'ثلاثة', 'أربعة', 'خمسة', 'ستة', 'سبعة', 'ثمانية', 'تسعة',
    'عشرة', 'أحد عشر', 'اثنا عشر', 'ثلاثة عشر', 'أربعة عشر', 'خمسة عشر', 'ستة عشر',
    'سبعة عشر', 'ثمانية عشر', 'تسعة عشر'
  ];
  
  const tens = [
    '', '', 'عشرون', 'ثلاثون', 'أربعون', 'خمسون', 'ستون', 'سبعون', 'ثمانون', 'تسعون'
  ];
  
  const hundreds = [
    '', 'مائة', 'مائتان', 'ثلاثمائة', 'أربعمائة', 'خمسمائة', 'ستمائة', 'سبعمائة', 'ثمانمائة', 'تسعمائة'
  ];
  
  const thousands = ['', 'ألف', 'ألفان', 'آلاف', 'ألف'];
  const millions = ['', 'مليون', 'مليونان', 'ملايين', 'مليون'];
  const billions = ['', 'مليار', 'ملياران', 'مليارات', 'مليار'];
  
  // تحويل المبلغ إلى سلسلة نصية وفصل الجزء الصحيح عن الكسور
  const [integerPart, decimalPart = '0'] = amount.toFixed(2).split('.');
  
  // تحويل الجزء الصحيح إلى كلمات
  const convertToWords = (num: number): string => {
    if (num === 0) return '';
    
    if (num < 20) return ones[num];
    
    if (num < 100) {
      return ones[num % 10] + (ones[num % 10] ? ' و' : '') + tens[Math.floor(num / 10)];
    }
    
    if (num < 1000) {
      return hundreds[Math.floor(num / 100)] + (num % 100 ? ' و' + convertToWords(num % 100) : '');
    }
    
    if (num < 1000000) {
      const count = Math.floor(num / 1000);
      let suffix = '';
      
      if (count === 1) suffix = thousands[1];
      else if (count === 2) suffix = thousands[2];
      else if (count >= 3 && count <= 10) suffix = thousands[3];
      else suffix = thousands[4];
      
      const prefix = count === 1 || count === 2 ? '' : convertToWords(count);
      
      return (prefix + ' ' + suffix).trim() + (num % 1000 ? ' و' + convertToWords(num % 1000) : '');
    }
    
    if (num < 1000000000) {
      const count = Math.floor(num / 1000000);
      let suffix = '';
      
      if (count === 1) suffix = millions[1];
      else if (count === 2) suffix = millions[2];
      else if (count >= 3 && count <= 10) suffix = millions[3];
      else suffix = millions[4];
      
      const prefix = count === 1 || count === 2 ? '' : convertToWords(count);
      
      return (prefix + ' ' + suffix).trim() + (num % 1000000 ? ' و' + convertToWords(num % 1000000) : '');
    }
    
    const count = Math.floor(num / 1000000000);
    let suffix = '';
    
    if (count === 1) suffix = billions[1];
    else if (count === 2) suffix = billions[2];
    else if (count >= 3 && count <= 10) suffix = billions[3];
    else suffix = billions[4];
    
    const prefix = count === 1 || count === 2 ? '' : convertToWords(count);
    
    return (prefix + ' ' + suffix).trim() + (num % 1000000000 ? ' و' + convertToWords(num % 1000000000) : '');
  };
  
  // تحويل الجزء الصحيح إلى كلمات
  const integerWords = convertToWords(parseInt(integerPart, 10));
  
  // تحويل الكسور إلى كلمات
  const decimalValue = parseInt(decimalPart, 10);
  let decimalWords = '';
  
  if (decimalValue > 0) {
    if (decimalValue === 1) {
      decimalWords = 'قرش واحد';
    } else if (decimalValue === 2) {
      decimalWords = 'قرشان';
    } else if (decimalValue >= 3 && decimalValue <= 10) {
      decimalWords = convertToWords(decimalValue) + ' قروش';
    } else {
      decimalWords = convertToWords(decimalValue) + ' قرشاً';
    }
  }
  
  // تحديد صيغة الجنيه
  let currencyText = '';
  const integerValue = parseInt(integerPart, 10);
  
  if (integerValue === 0) {
    currencyText = '';
  } else if (integerValue === 1) {
    currencyText = 'جنيه واحد';
  } else if (integerValue === 2) {
    currencyText = 'جنيهان';
  } else if (integerValue >= 3 && integerValue <= 10) {
    currencyText = integerWords + ' جنيهات';
  } else {
    currencyText = integerWords + ' جنيهاً';
  }
  
  // الجمع بين الجزء الصحيح والكسور
  if (integerValue === 0) {
    return decimalWords;
  } else if (decimalValue === 0) {
    return currencyText + ' فقط لا غير';
  } else {
    return currencyText + ' و' + decimalWords + ' فقط لا غير';
  }
};

/**
 * تنفيذ العمليات الحسابية المالية بدقة
 */
export const currencyMath = {
  /**
   * جمع مبلغين ماليين
   * @param a المبلغ الأول
   * @param b المبلغ الثاني
   * @returns ناتج الجمع
   */
  add: (a: number, b: number): number => {
    return Number((a + b).toFixed(2));
  },
  
  /**
   * طرح مبلغين ماليين
   * @param a المبلغ الأول
   * @param b المبلغ الثاني
   * @returns ناتج الطرح
   */
  subtract: (a: number, b: number): number => {
    return Number((a - b).toFixed(2));
  },
  
  /**
   * ضرب مبلغ مالي في قيمة
   * @param a المبلغ المالي
   * @param b القيمة المضروبة
   * @returns ناتج الضرب
   */
  multiply: (a: number, b: number): number => {
    return Number((a * b).toFixed(2));
  },
  
  /**
   * قسمة مبلغ مالي على قيمة
   * @param a المبلغ المالي
   * @param b القيمة المقسوم عليها
   * @returns ناتج القسمة
   */
  divide: (a: number, b: number): number => {
    if (b === 0) throw new Error('لا يمكن القسمة على صفر');
    return Number((a / b).toFixed(2));
  },
  
  /**
   * حساب النسبة المئوية من مبلغ
   * @param amount المبلغ الأساسي
   * @param percentage النسبة المئوية
   * @returns قيمة النسبة المئوية من المبلغ
   */
  percentage: (amount: number, percentage: number): number => {
    return Number(((amount * percentage) / 100).toFixed(2));
  },
  
  /**
   * تقريب المبلغ إلى أقرب قيمة محددة
   * @param amount المبلغ المراد تقريبه
   * @param precision دقة التقريب (افتراضياً 0.01 للقرش)
   * @returns المبلغ المقرب
   */
  round: (amount: number, precision: number = 0.01): number => {
    return Number((Math.round(amount / precision) * precision).toFixed(2));
  }
};

/**
 * مكون React لعرض المبالغ المالية
 */
import React from 'react';

interface CurrencyProps {
  amount: number;
  showCurrency?: boolean;
  currencyPosition?: 'before' | 'after';
  decimals?: number;
  className?: string;
  isPositive?: boolean;
  isNegative?: boolean;
  showSign?: boolean;
}

export const Currency: React.FC<CurrencyProps> = ({
  amount,
  showCurrency = true,
  currencyPosition = 'after',
  decimals = 2,
  className = '',
  isPositive = false,
  isNegative = false,
  showSign = false
}) => {
  // تحديد لون المبلغ بناءً على قيمته أو الخيارات المحددة
  let colorClass = '';
  
  if (isPositive) {
    colorClass = 'text-green-600';
  } else if (isNegative) {
    colorClass = 'text-red-600';
  } else if (amount > 0) {
    colorClass = 'text-green-600';
  } else if (amount < 0) {
    colorClass = 'text-red-600';
  }
  
  // تنسيق المبلغ
  const formattedAmount = formatEGP(Math.abs(amount), {
    decimals,
    showCurrency,
    currencyPosition
  });
  
  // إضافة إشارة + أو - إذا كان مطلوباً
  const sign = showSign
    ? amount > 0
      ? '+'
      : amount < 0
      ? '-'
      : ''
    : amount < 0
    ? '-'
    : '';
  
  return (
    <span className={`font-medium ${colorClass} ${className}`} dir="ltr">
      {sign}{formattedAmount}
    </span>
  );
};
```
