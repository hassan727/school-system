import * as XLSX from 'xlsx';
import { Student } from '@/types/student';
import exportService from '@/services/exportService';

/**
 * خدمة تصدير بيانات الطلاب
 */
export const studentExportService = {
  /**
   * تصدير بيانات الطلاب إلى ملف Excel
   * @param students قائمة الطلاب
   * @returns وعد بنجاح العملية
   */
  exportToExcel(students: Student[]): Promise<boolean> {
    if (!students || students.length === 0) {
      return Promise.reject(new Error('لا توجد بيانات للتصدير'));
    }

    try {
      // تحويل البيانات إلى تنسيق مناسب للتصدير
      const data = students.map(student => {
        // الحصول على اسم الفصل بطريقة آمنة
        let classroomName = '';
        if (student.classroom_name) {
          classroomName = student.classroom_name;
        } else if (student.classrooms && student.classrooms.name) {
          classroomName = student.classrooms.name;
        }

        // تحويل القيم الإنجليزية إلى العربية للعرض
        const genderArabic = student.gender === 'male' ? 'ذكر' : 'أنثى';
        const statusArabic = this.getStatusInArabic(student.status);
        const religionArabic = this.getReligionInArabic(student.religion);
        const paymentMethodArabic = student.payment_method === 'full' ? 'دفعة واحدة' : 'أقساط';
        const financialStatusArabic = this.getFinancialStatusInArabic(student.financial_status);

        return {
          'الاسم الرباعي': student.full_name || '',
          'الجنس': genderArabic,
          'تاريخ الميلاد': student.birth_date || '',
          'الرقم القومي': student.national_id || '',
          'الديانة': religionArabic,
          'العنوان': student.address || '',
          'رقم الهاتف': student.phone || '',
          'البريد الإلكتروني': student.email || '',
          'المستوى الدراسي': student.grade_level || '',
          'رمز الفصل': student.classroom_id || '',
          'الفصل': classroomName,
          'تاريخ التسجيل': student.enrollment_date || '',
          'الحالة': statusArabic,
          'اسم ولي الأمر': student.parent_name || '',
          'هاتف ولي الأمر': student.parent_phone || '',
          'هاتف ولي الأمر 2': student.parent_phone2 || '',
          'بريد ولي الأمر': student.parent_email || '',
          'وظيفة ولي الأمر': student.parent_job || '',
          'صلة القرابة': student.parent_relation || '',
          'ملاحظات صحية': student.health_notes || '',
          'ملاحظات أكاديمية': student.academic_notes || '',
          'ملاحظات سلوكية': student.behavior_notes || '',
          'الرسوم الدراسية': student.fees_amount || 0,
          'قيمة الخصم': student.discount_amount || 0,
          'سبب الخصم': student.discount_reason || '',
          'رسوم فتح الملف': student.file_opening_fee || 0,
          'الإجمالي بعد الخصم': student.total_after_discount || 0,
          'طريقة الدفع': paymentMethodArabic,
          'عدد الأقساط': student.installments_count || 0,
          'قيمة القسط': student.installment_amount || 0,
          'الحالة المالية': financialStatusArabic,
        };
      });

      // استخدام خدمة التصدير
      return exportService.exportToExcel(data, {
        fileName: `بيانات_الطلاب_${new Date().toISOString().split('T')[0]}`,
        sheetName: 'الطلاب',
      });
    } catch (error) {
      console.error('Error exporting students to Excel:', error);
      return Promise.reject(error);
    }
  },

  /**
   * تصدير بيانات الطلاب إلى ملف PDF
   * @param students قائمة الطلاب
   * @returns وعد بنجاح العملية
   */
  exportToPDF(students: Student[]): Promise<boolean> {
    if (!students || students.length === 0) {
      return Promise.reject(new Error('لا توجد بيانات للتصدير'));
    }

    try {
      // تحويل البيانات إلى تنسيق مناسب للتصدير
      const data = students.map(student => {
        // الحصول على اسم الفصل بطريقة آمنة
        let classroomName = '';
        if (student.classroom_name) {
          classroomName = student.classroom_name;
        } else if (student.classrooms && student.classrooms.name) {
          classroomName = student.classrooms.name;
        }

        // تحويل القيم الإنجليزية إلى العربية للعرض
        const genderArabic = student.gender === 'male' ? 'ذكر' : 'أنثى';
        const statusArabic = this.getStatusInArabic(student.status);
        const religionArabic = this.getReligionInArabic(student.religion);

        return {
          'الاسم الكامل': student.full_name || '',
          'الجنس': genderArabic,
          'تاريخ الميلاد': student.birth_date || '',
          'المستوى الدراسي': student.grade_level || '',
          'الفصل': classroomName,
          'تاريخ التسجيل': student.enrollment_date || '',
          'الحالة': statusArabic,
          'اسم ولي الأمر': student.parent_name || '',
          'هاتف ولي الأمر': student.parent_phone || '',
        };
      });

      // استخدام خدمة التصدير
      return exportService.exportToPDF(data, {
        fileName: `بيانات_الطلاب_${new Date().toISOString().split('T')[0]}`,
        title: 'بيانات الطلاب',
        subtitle: `إجمالي عدد الطلاب: ${students.length}`,
        orientation: 'landscape',
        rtl: true
      });
    } catch (error) {
      console.error('Error exporting students to PDF:', error);
      return Promise.reject(error);
    }
  },

  /**
   * تحويل حالة الطالب من الإنجليزية إلى العربية
   * @param status حالة الطالب بالإنجليزية
   * @returns حالة الطالب بالعربية
   */
  getStatusInArabic(status: string | null | undefined): string {
    if (!status) return 'غير محدد';

    switch (status) {
      case 'active':
        return 'نشط';
      case 'inactive':
        return 'غير نشط';
      case 'graduated':
        return 'متخرج';
      case 'transferred':
        return 'منقول';
      case 'excellent':
        return 'متفوق';
      case 'absent':
        return 'غائب';
      default:
        return 'غير محدد';
    }
  },

  /**
   * تحويل الديانة من الإنجليزية إلى العربية
   * @param religion الديانة بالإنجليزية
   * @returns الديانة بالعربية
   */
  getReligionInArabic(religion: string | null | undefined): string {
    if (!religion) return '';

    switch (religion) {
      case 'islam':
        return 'مسلم';
      case 'christianity':
        return 'مسيحي';
      default:
        return religion;
    }
  },

  /**
   * تحويل الحالة المالية من الإنجليزية إلى العربية
   * @param status الحالة المالية بالإنجليزية
   * @returns الحالة المالية بالعربية
   */
  getFinancialStatusInArabic(status: string | null | undefined): string {
    if (!status) return 'غير محدد';

    switch (status) {
      case 'pending':
        return 'معلق';
      case 'paid':
        return 'مدفوع';
      case 'partially_paid':
        return 'مدفوع جزئياً';
      case 'overdue':
        return 'متأخر';
      default:
        return 'غير محدد';
    }
  }
};

export default studentExportService;
