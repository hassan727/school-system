import React, { forwardRef, useEffect } from 'react';
import { Student, GRADE_LEVELS, InstallmentData } from '@/types/student';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

interface PrintableStudentFormProps {
  student: Partial<Student>;
  totalAfterDiscount?: number;
  fileOpeningFee?: number;
}

const PrintableStudentForm = forwardRef<HTMLDivElement, PrintableStudentFormProps>(
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

        {/* المعلومات الشخصية */}
        <div className="mb-6">
          <h2 className="text-xl font-bold border-b-2 border-gray-300 pb-2 mb-3">المعلومات الشخصية</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p><strong>الاسم الرباعي:</strong> {student.full_name}</p>
              <p><strong>الجنس:</strong> {student.gender === 'male' ? 'ذكر' : 'أنثى'}</p>
              <p><strong>تاريخ الميلاد:</strong> {formatDate(student.birth_date)}</p>
              <p><strong>الرقم القومي:</strong> {student.national_id || '-'}</p>
            </div>
            <div>
              <p><strong>العنوان:</strong> {student.address || '-'}</p>
              <p><strong>رقم الهاتف:</strong> {student.phone || '-'}</p>
              <p><strong>البريد الإلكتروني:</strong> {student.email || '-'}</p>
              <p><strong>الديانة:</strong> {student.religion === 'islam' ? 'الإسلام' : student.religion === 'christianity' ? 'المسيحية' : '-'}</p>
            </div>
          </div>
        </div>

        {/* المعلومات الدراسية */}
        <div className="mb-6">
          <h2 className="text-xl font-bold border-b-2 border-gray-300 pb-2 mb-3">المعلومات الدراسية</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p><strong>المستوى الدراسي:</strong> {getGradeLevelName(student.grade_level)}</p>
              <p><strong>الفصل الدراسي:</strong> {student.classroom_name || '-'}</p>
            </div>
            <div>
              <p><strong>تاريخ التسجيل:</strong> {formatDate(student.enrollment_date)}</p>
              <p><strong>الحالة:</strong> {
                student.status === 'active' ? 'نشط' :
                student.status === 'inactive' ? 'غير نشط' :
                student.status === 'graduated' ? 'متخرج' :
                student.status === 'transferred' ? 'منقول' :
                student.status === 'excellent' ? 'متفوق' :
                student.status === 'absent' ? 'غائب' : '-'
              }</p>
            </div>
          </div>
        </div>

        {/* معلومات ولي الأمر */}
        <div className="mb-6">
          <h2 className="text-xl font-bold border-b-2 border-gray-300 pb-2 mb-3">معلومات ولي الأمر</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p><strong>اسم ولي الأمر:</strong> {student.parent_name || '-'}</p>
              <p><strong>رقم الهاتف:</strong> {student.parent_phone || '-'}</p>
              <p><strong>رقم الهاتف البديل:</strong> {student.parent_phone2 || '-'}</p>
            </div>
            <div>
              <p><strong>البريد الإلكتروني:</strong> {student.parent_email || '-'}</p>
              <p><strong>الوظيفة:</strong> {student.parent_job || '-'}</p>
              <p><strong>صلة القرابة:</strong> {
                student.parent_relation === 'father' ? 'الأب' :
                student.parent_relation === 'mother' ? 'الأم' :
                student.parent_relation === 'guardian' ? 'ولي أمر' : '-'
              }</p>
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
              <p className="mt-2"><strong>الحالة المالية:</strong> <span className={`px-2 py-1 rounded-full text-xs ${
                student.financial_status === 'paid' ? 'bg-green-100 text-green-800' :
                student.financial_status === 'partial' ? 'bg-yellow-100 text-yellow-800' :
                'bg-red-100 text-red-800'
              }`}>
                {student.financial_status === 'paid' ? 'مدفوع بالكامل' :
                 student.financial_status === 'partial' ? 'مدفوع جزئياً' :
                 'غير مدفوع'}
              </span></p>
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
                      {installment.payment_date && installment.status !== 'unpaid' && (
                        <div className="text-xs mt-1 text-gray-600">
                          تاريخ الدفع: {formatDate(installment.payment_date)}
                        </div>
                      )}
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

        {/* سجل المدفوعات */}
        {student.payment_method === 'installments' && Array.isArray(student.payments) && student.payments.length > 0 && (
          <div className="mb-6">
            <h2 className="text-xl font-bold border-b-2 border-gray-300 pb-2 mb-3">سجل المدفوعات</h2>
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 p-2 text-right">التاريخ</th>
                  <th className="border border-gray-300 p-2 text-right">المبلغ</th>
                  <th className="border border-gray-300 p-2 text-right">نوع الدفع</th>
                  <th className="border border-gray-300 p-2 text-right">طريقة الدفع</th>
                  <th className="border border-gray-300 p-2 text-right">ملاحظات</th>
                </tr>
              </thead>
              <tbody>
                {student.payments.map((payment: any) => (
                  <tr key={payment.id} className="border-b">
                    <td className="border border-gray-300 p-2">{formatDate(payment.payment_date)}</td>
                    <td className="border border-gray-300 p-2">{formatCurrency(payment.amount)}</td>
                    <td className="border border-gray-300 p-2">
                      {payment.payment_type === 'advance_payment' ? 'دفعة مقدمة' :
                       payment.payment_type === 'installment' ? 'قسط' : 'أخرى'}
                    </td>
                    <td className="border border-gray-300 p-2">
                      {payment.payment_method === 'cash' ? 'نقدي' :
                       payment.payment_method === 'bank_transfer' ? 'تحويل بنكي' :
                       payment.payment_method === 'check' ? 'شيك' : 'بطاقة ائتمان'}
                    </td>
                    <td className="border border-gray-300 p-2">{payment.notes || '-'}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-gray-100 font-bold">
                  <td className="border border-gray-300 p-2 text-right">إجمالي المدفوعات:</td>
                  <td className="border border-gray-300 p-2">{formatCurrency(student.payments.reduce((sum: number, item: any) => sum + (item.amount || 0), 0))}</td>
                  <td colSpan={3} className="border border-gray-300 p-2"></td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}

        {/* ملخص المدفوعات */}
        {student.payment_method === 'installments' && (
          <div className="mb-6">
            <h2 className="text-xl font-bold border-b-2 border-gray-300 pb-2 mb-3">ملخص المدفوعات</h2>
            <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-md">
              <div>
                <p><strong>إجمالي المصاريف:</strong> {formatCurrency(student.fees_amount || 0)}</p>
                <p><strong>الخصم:</strong> {formatCurrency(student.discount_amount || 0)}</p>
                <p><strong>رسوم فتح الملف:</strong> {formatCurrency(student.file_opening_fee || 0)}</p>
              </div>
              <div>
                <p><strong>الإجمالي بعد الخصم:</strong> {formatCurrency(student.total_after_discount || 0)}</p>
                <p><strong>إجمالي المدفوعات:</strong> {formatCurrency(Array.isArray(student.payments) ? student.payments.reduce((sum: number, item: any) => sum + (item.amount || 0), 0) : 0)}</p>
                <p><strong>المبلغ المتبقي:</strong> {formatCurrency((student.total_after_discount || 0) - (Array.isArray(student.payments) ? student.payments.reduce((sum: number, item: any) => sum + (item.amount || 0), 0) : 0))}</p>
              </div>
            </div>
          </div>
        )}

        {/* ملاحظات */}
        {(student.health_notes || student.academic_notes || student.behavior_notes) && (
          <div className="mb-6">
            <h2 className="text-xl font-bold border-b-2 border-gray-300 pb-2 mb-3">ملاحظات</h2>
            {student.health_notes && (
              <div className="mb-2">
                <p><strong>ملاحظات صحية:</strong> {student.health_notes}</p>
              </div>
            )}
            {student.academic_notes && (
              <div className="mb-2">
                <p><strong>ملاحظات أكاديمية:</strong> {student.academic_notes}</p>
              </div>
            )}
            {student.behavior_notes && (
              <div className="mb-2">
                <p><strong>ملاحظات سلوكية:</strong> {student.behavior_notes}</p>
              </div>
            )}
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

        {/* ملاحظات قانونية */}
        <div className="mt-8 p-3 bg-gray-50 rounded-md text-sm text-gray-600 border border-gray-200">
          <p>• هذا المستند رسمي ويعتبر إقرارًا بالموافقة على جميع شروط وأحكام المدرسة.</p>
          <p>• يجب الالتزام بسداد الأقساط في مواعيدها المحددة.</p>
          <p>• في حالة التأخر عن سداد الأقساط، يحق للمدرسة اتخاذ الإجراءات اللازمة.</p>
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

PrintableStudentForm.displayName = 'PrintableStudentForm';

export default PrintableStudentForm;
