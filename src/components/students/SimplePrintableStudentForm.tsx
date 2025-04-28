import React, { forwardRef, useEffect } from 'react';
import { Student, GRADE_LEVELS, InstallmentData } from '@/types/student';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

interface SimplePrintableStudentFormProps {
  student: Partial<Student>;
  totalAfterDiscount?: number;
  fileOpeningFee?: number;
}

const SimplePrintableStudentForm = forwardRef<HTMLDivElement, SimplePrintableStudentFormProps>(
  ({ student, totalAfterDiscount, fileOpeningFee }, ref) => {
    // حساب الإجمالي بعد الخصم إذا لم يتم تمريره
    const calculatedTotalAfterDiscount = totalAfterDiscount ||
      ((student.fees_amount || 0) - (student.discount_amount || 0) + (student.file_opening_fee || fileOpeningFee || 0));
    
    // حساب إجمالي المدفوعات
    const totalPayments = Array.isArray(student.payments) 
      ? student.payments.reduce((sum, item) => sum + (item.amount || 0), 0) 
      : 0;
    
    // حساب المبلغ المتبقي
    const remainingAmount = calculatedTotalAfterDiscount - totalPayments;

    // تنفيذ تأثير لتحسين الطباعة
    useEffect(() => {
      // إضافة فئة للطباعة عند تحميل المكون
      if (ref && typeof ref === 'object' && ref.current) {
        ref.current.classList.add('printable-form', 'print-container');
      }

      return () => {
        // إزالة فئة الطباعة عند إلغاء تحميل المكون
        if (ref && typeof ref === 'object' && ref.current) {
          ref.current.classList.remove('printable-form', 'print-container');
        }
      };
    }, [ref]);
    
    // تنسيق التاريخ بالعربية
    const formatDate = (dateString?: string) => {
      if (!dateString) return '';
      try {
        return format(new Date(dateString), 'yyyy/MM/dd', { locale: ar });
      } catch (error) {
        return dateString;
      }
    };

    // تنسيق المبلغ بالجنيه المصري
    const formatCurrency = (amount?: number) => {
      if (amount === undefined || amount === null) return '';
      return new Intl.NumberFormat('ar-EG', {
        style: 'currency',
        currency: 'EGP',
        maximumFractionDigits: 0
      }).format(amount);
    };

    // الحصول على اسم المستوى الدراسي
    const getGradeLevelName = (gradeLevel?: number) => {
      if (!gradeLevel) return '';
      const grade = GRADE_LEVELS.find(g => g.id === gradeLevel);
      return grade ? grade.arabic_name : '';
    };

    return (
      <div ref={ref} className="p-8 bg-white text-black print:text-black" style={{ direction: 'rtl' }}>
        <div className="text-center mb-6">
          <div className="flex justify-between items-center mb-4">
            <div className="w-24 h-24 bg-gray-100 flex items-center justify-center rounded-md">
              <span className="text-gray-400 text-xs">شعار المدرسة</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold">مدرسة الجيل الواعد الخاصة</h1>
              <p className="text-gray-600">نظام إدارة المدرسة</p>
            </div>
            <div className="w-24 h-24"></div>
          </div>
          <h2 className="text-xl font-bold bg-gray-100 py-2 rounded-md">بيانات الطالب</h2>
          <p className="text-gray-600 mt-2">تاريخ الطباعة: {formatDate(new Date().toISOString())}</p>
        </div>

        {/* بيانات الطالب الأساسية */}
        <div className="mb-6">
          <h2 className="text-xl font-bold border-b-2 border-gray-300 pb-2 mb-3">بيانات الطالب</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p><strong>الاسم الكامل:</strong> {student.full_name}</p>
              <p><strong>الرقم القومي:</strong> {student.national_id || '-'}</p>
              <p><strong>المستوى الدراسي:</strong> {getGradeLevelName(student.grade_level)}</p>
              <p><strong>الفصل الدراسي:</strong> {student.classroom_name || '-'}</p>
            </div>
            <div>
              <p><strong>الجنس:</strong> {student.gender === 'male' ? 'ذكر' : 'أنثى'}</p>
              <p><strong>تاريخ الميلاد:</strong> {formatDate(student.birth_date)}</p>
              <p><strong>تاريخ التسجيل:</strong> {formatDate(student.enrollment_date)}</p>
              <p><strong>ولي الأمر:</strong> {student.parent_name || '-'}</p>
            </div>
          </div>
        </div>

        {/* المعلومات المالية */}
        <div className="mb-6">
          <h2 className="text-xl font-bold border-b-2 border-gray-300 pb-2 mb-3">المعلومات المالية</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p><strong>الرسوم الدراسية:</strong> {formatCurrency(student.fees_amount || 0)}</p>
              <p><strong>الخصم{student.discount_reason ? ` (${student.discount_reason})` : ''}:</strong> {formatCurrency(student.discount_amount || 0)}</p>
              <p><strong>رسوم فتح الملف:</strong> {formatCurrency(student.file_opening_fee || fileOpeningFee || 0)}</p>
              <p className="mt-2 pt-2 border-t border-gray-200"><strong>الإجمالي الصافي:</strong> <span className="font-bold text-lg">{formatCurrency(calculatedTotalAfterDiscount)}</span></p>
            </div>
            <div className="bg-gray-50 p-3 rounded-md">
              <p><strong>طريقة السداد:</strong> {student.payment_method === 'full' ? 'دفعة واحدة' : student.payment_method === 'installments' ? 'أقساط' : '-'}</p>
              {student.payment_method === 'installments' && (
                <>
                  <p><strong>عدد الأقساط:</strong> {student.installments_count || 0}</p>
                  <p><strong>قيمة القسط:</strong> {formatCurrency(student.installment_amount || 0)}</p>
                </>
              )}
              <p className="mt-2"><strong>إجمالي المدفوعات:</strong> {formatCurrency(totalPayments)}</p>
              <p className="font-bold text-lg"><strong>المبلغ المتبقي:</strong> {formatCurrency(remainingAmount)}</p>
            </div>
          </div>
        </div>

        {/* جدول الأقساط */}
        {student.payment_method === 'installments' && Array.isArray(student.installments_data) && student.installments_data.length > 0 && (
          <div className="mb-6">
            <h2 className="text-xl font-bold border-b-2 border-gray-300 pb-2 mb-3">جدول الأقساط</h2>
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 p-2 text-right">رقم القسط</th>
                  <th className="border border-gray-300 p-2 text-right">تاريخ الاستحقاق</th>
                  <th className="border border-gray-300 p-2 text-right">المبلغ</th>
                  <th className="border border-gray-300 p-2 text-right">المبلغ المدفوع</th>
                  <th className="border border-gray-300 p-2 text-right">الرصيد المتبقي</th>
                  <th className="border border-gray-300 p-2 text-right">الحالة</th>
                </tr>
              </thead>
              <tbody>
                {student.installments_data.map((installment: InstallmentData) => (
                  <tr key={installment.installment_number} className={installment.status === 'paid' ? 'bg-green-50' : installment.status === 'partial' ? 'bg-yellow-50' : ''}>
                    <td className="border border-gray-300 p-2">{installment.installment_number}</td>
                    <td className="border border-gray-300 p-2">{formatDate(installment.due_date)}</td>
                    <td className="border border-gray-300 p-2">{formatCurrency(installment.amount)}</td>
                    <td className="border border-gray-300 p-2">{formatCurrency(installment.payment_amount || 0)}</td>
                    <td className="border border-gray-300 p-2">{formatCurrency(installment.remaining_balance)}</td>
                    <td className="border border-gray-300 p-2">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        installment.status === 'paid' ? 'bg-green-100 text-green-800' :
                        installment.status === 'partial' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {installment.status === 'paid' ? 'مدفوع' :
                         installment.status === 'partial' ? 'مدفوع جزئياً' :
                         'غير مدفوع'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-gray-100 font-bold">
                  <td colSpan={2} className="border border-gray-300 p-2 text-right">الإجمالي</td>
                  <td className="border border-gray-300 p-2">{formatCurrency(student.installments_data.reduce((sum, item) => sum + (item.amount || 0), 0))}</td>
                  <td className="border border-gray-300 p-2">{formatCurrency(student.installments_data.reduce((sum, item) => sum + (item.payment_amount || 0), 0))}</td>
                  <td colSpan={2} className="border border-gray-300 p-2"></td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}

        {/* التوقيعات */}
        <div className="mt-12 grid grid-cols-3 gap-4">
          <div className="text-center border border-gray-200 rounded-md p-4">
            <p className="font-bold">توقيع ولي الأمر</p>
            <div className="h-16 border-b border-gray-400 mt-8"></div>
            <p className="text-sm text-gray-500 mt-2">الاسم: {student.parent_name || '................................'}</p>
          </div>
          <div className="text-center border border-gray-200 rounded-md p-4">
            <p className="font-bold">توقيع المسؤول المالي</p>
            <div className="h-16 border-b border-gray-400 mt-8"></div>
            <p className="text-sm text-gray-500 mt-2">الاسم: ................................</p>
          </div>
          <div className="text-center border border-gray-200 rounded-md p-4">
            <p className="font-bold">توقيع مدير المدرسة</p>
            <div className="h-16 border-b border-gray-400 mt-8"></div>
            <p className="text-sm text-gray-500 mt-2">الاسم: ................................</p>
          </div>
        </div>

        {/* تذييل الصفحة */}
        <div className="mt-8 text-center text-sm text-gray-500 border-t border-gray-200 pt-4">
          <p>تم إنشاء هذا المستند بواسطة نظام إدارة المدرسة</p>
          <p>جميع الحقوق محفوظة © {new Date().getFullYear()}</p>
          <p className="mt-2">رقم المستند: {student.id?.substring(0, 8) || 'XXXXXXXX'}-{new Date().getTime().toString().substring(0, 6)}</p>
        </div>
      </div>
    );
  }
);

SimplePrintableStudentForm.displayName = 'SimplePrintableStudentForm';

export default SimplePrintableStudentForm;
