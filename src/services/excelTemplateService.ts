import * as XLSX from 'xlsx';

/**
 * خدمة إنشاء نماذج Excel
 */
export const excelTemplateService = {
  /**
   * إنشاء نموذج Excel فارغ لاستيراد بيانات الطلاب
   */
  createStudentImportTemplate(): Blob {
    // تعريف أعمدة النموذج - متطابقة مع هيكل جدول students في قاعدة البيانات
    const columns = [
      'الاسم الرباعي', // full_name
      'الجنس', // gender (male/female)
      'تاريخ الميلاد', // birth_date
      'الرقم القومي', // national_id
      'الديانة', // religion
      'العنوان', // address
      'رقم الهاتف', // phone
      'البريد الإلكتروني', // email
      'المستوى الدراسي', // grade_level (1-12)
      'رمز الفصل', // classroom_id (يجب أن يكون موجوداً في جدول classrooms)
      'تاريخ التسجيل', // enrollment_date
      'الحالة', // status (active/inactive/graduated/transferred)
      'اسم ولي الأمر', // parent_name
      'هاتف ولي الأمر', // parent_phone
      'هاتف ولي الأمر 2', // parent_phone2
      'بريد ولي الأمر', // parent_email
      'وظيفة ولي الأمر', // parent_job
      'صلة القرابة', // parent_relation
      'ملاحظات صحية', // health_notes
      'ملاحظات أكاديمية', // academic_notes
      'ملاحظات سلوكية', // behavior_notes
      'الرسوم الدراسية', // fees_amount
      'قيمة الخصم', // discount_amount
      'سبب الخصم', // discount_reason
      'رسوم فتح الملف', // file_opening_fee
      'الدفعة المقدمة', // advance_payment
      'طريقة الدفع', // payment_method (full/installments)
      'عدد الأقساط', // installments_count
      'قيمة القسط', // installment_amount
      'الحالة المالية' // financial_status
    ];

    // إنشاء صف نموذجي للمثال - متطابق مع هيكل جدول students في قاعدة البيانات
    const exampleRow = {
      'الاسم الرباعي': 'محمد أحمد علي حسن',
      'الجنس': 'male', // القيم المسموح بها: male, female
      'تاريخ الميلاد': '2010-05-15', // التنسيق المطلوب: YYYY-MM-DD
      'الرقم القومي': '12345678901234',
      'الديانة': 'islam', // القيم المسموح بها: islam, christianity
      'العنوان': 'القاهرة، مصر',
      'رقم الهاتف': '01012345678',
      'البريد الإلكتروني': 'example@example.com',
      'المستوى الدراسي': 5, // رقم من 1 إلى 12
      'رمز الفصل': 'cc67e7be-167c-4a63-bdc8-761f4f9085ea', // معرف الفصل من جدول classrooms
      'تاريخ التسجيل': '2023-09-01', // التنسيق المطلوب: YYYY-MM-DD
      'الحالة': 'active', // القيم المسموح بها: active, inactive, graduated, transferred
      'اسم ولي الأمر': 'أحمد محمد',
      'هاتف ولي الأمر': '01098765432',
      'هاتف ولي الأمر 2': '01087654321',
      'بريد ولي الأمر': 'parent@example.com',
      'وظيفة ولي الأمر': 'مهندس',
      'صلة القرابة': 'أب',
      'ملاحظات صحية': 'لا يوجد',
      'ملاحظات أكاديمية': 'طالب متفوق',
      'ملاحظات سلوكية': 'سلوك ممتاز',
      'الرسوم الدراسية': 5000,
      'قيمة الخصم': 500,
      'سبب الخصم': 'تفوق دراسي',
      'رسوم فتح الملف': 300,
      'الدفعة المقدمة': 1000, // قيمة الدفعة المقدمة
      'طريقة الدفع': 'installments', // القيم المسموح بها: full, installments
      'عدد الأقساط': 3,
      'قيمة القسط': 1500,
      'الحالة المالية': 'pending' // القيم المسموح بها: pending, paid, partially_paid, overdue
    };

    // إنشاء ورقة عمل فارغة مع صف واحد كمثال
    const worksheet = XLSX.utils.json_to_sheet([exampleRow]);

    // إضافة تعليقات للأعمدة المطلوبة
    const requiredColumns = [
      'الاسم الرباعي',
      'الجنس',
      'تاريخ الميلاد',
      'المستوى الدراسي',
      'تاريخ التسجيل',
      'الحالة'
    ];

    // إضافة تعليقات للأعمدة التي تحتاج إلى قيم محددة
    const specialColumns = {
      'الجنس': 'القيم المسموح بها: male (ذكر), female (أنثى)',
      'تاريخ الميلاد': 'التنسيق المطلوب: YYYY-MM-DD (مثال: 2010-05-15)',
      'تاريخ التسجيل': 'التنسيق المطلوب: YYYY-MM-DD (مثال: 2023-09-01)',
      'المستوى الدراسي': 'رقم من 1 إلى 12',
      'الحالة': 'القيم المسموح بها: active (نشط), inactive (غير نشط), graduated (متخرج), transferred (منقول)',
      'الديانة': 'القيم المسموح بها: islam (مسلم), christianity (مسيحي)',
      'طريقة الدفع': 'القيم المسموح بها: full (كامل), installments (أقساط)',
      'الحالة المالية': 'القيم المسموح بها: pending (معلق), paid (مدفوع), partially_paid (مدفوع جزئياً), overdue (متأخر)',
      'رمز الفصل': 'معرف الفصل من جدول classrooms (UUID)'
    };

    // إضافة تنسيق وتعليقات للأعمدة
    const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1:T2');
    const comments = {};

    // إضافة تعليقات للأعمدة
    for (let C = range.s.c; C <= range.e.c; C++) {
      const address = XLSX.utils.encode_cell({ r: 0, c: C });
      const cell = worksheet[address];
      const columnName = cell?.v?.toString() || '';

      // إضافة تعليق للحقول المطلوبة
      if (requiredColumns.includes(columnName)) {
        comments[address] = { t: 'هذا الحقل مطلوب' };
      }

      // إضافة تعليقات خاصة لبعض الأعمدة
      if (specialColumns[columnName]) {
        comments[address] = { t: specialColumns[columnName] };
      }
    }

    worksheet['!comments'] = comments;

    // إنشاء مصنف عمل وإضافة ورقة العمل
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'نموذج_الطلاب');

    // تحويل المصنف إلى Blob
    const wbout = XLSX.write(workbook, { bookType: 'xlsx', type: 'binary' });
    const buf = new ArrayBuffer(wbout.length);
    const view = new Uint8Array(buf);

    for (let i = 0; i < wbout.length; i++) {
      view[i] = wbout.charCodeAt(i) & 0xFF;
    }

    return new Blob([buf], { type: 'application/octet-stream' });
  }
};

export default excelTemplateService;
