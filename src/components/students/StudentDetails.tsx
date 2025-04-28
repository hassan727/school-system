'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Student, GRADE_LEVELS } from '@/types/student';
import { formatDate, formatCurrency } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import StudentFinancialInfo from './StudentFinancialInfo';
import studentService from '@/services/studentService';
import { installmentService } from '@/services/installmentService';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from '@/components/ui/Card';

interface StudentDetailsProps {
  student: Student;
  onDelete?: (id: string) => Promise<void>;
}

const StudentDetails: React.FC<StudentDetailsProps> = ({ student, onDelete }) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);

  // الحصول على اسم المستوى الدراسي
  const gradeLevel = GRADE_LEVELS.find(grade => grade.id === student.grade_level);



  // معالجة الطباعة - تنفيذ مباشر بدون استخدام مكتبة react-to-print
  const handlePrint = async () => {
    setIsPrinting(true);

    try {
      // جلب بيانات الأقساط المحدثة إذا كانت طريقة الدفع بالأقساط
      let installmentsData: any[] = [];
      if (student.payment_method === 'installments') {
        const { data, error } = await installmentService.getStudentInstallments(student.id);
        if (error) {
          console.error('Error fetching installments for printing:', error);
        } else if (data) {
          installmentsData = data;
        }
      }

      // حساب إجمالي المدفوعات
      const totalPayments = Array.isArray(student.payments)
        ? student.payments.reduce((sum, item) => sum + (item.amount || 0), 0)
        : 0;

      // حساب المبلغ المتبقي
      const totalAfterDiscount = student.total_after_discount ||
        ((student.fees_amount || 0) - (student.discount_amount || 0) + (student.file_opening_fee || 0));
      const remainingAmount = totalAfterDiscount - totalPayments;

      // إنشاء نافذة جديدة للطباعة
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        alert('يرجى السماح بالنوافذ المنبثقة للطباعة');
        setIsPrinting(false);
        return;
      }

      // إعداد محتوى النافذة باستخدام document.open و document.close بدلاً من document.write
      printWindow.document.open();
      printWindow.document.write(`
        <!DOCTYPE html>
        <html dir="rtl">
        <head>
          <title>بيانات الطالب - ${student.full_name}</title>
          <meta charset="utf-8" />
          <style>
            body {
              font-family: Arial, sans-serif;
              padding: 20px;
              direction: rtl;
            }
            .header {
              text-align: center;
              margin-bottom: 20px;
            }
            .section {
              margin-bottom: 20px;
              border-bottom: 1px solid #eee;
              padding-bottom: 10px;
            }
            .section-title {
              font-size: 18px;
              font-weight: bold;
              margin-bottom: 10px;
              background-color: #f5f5f5;
              padding: 5px 10px;
              border-radius: 4px;
            }
            .info-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 10px;
            }
            .info-item {
              margin-bottom: 5px;
            }
            .info-label {
              font-weight: bold;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 20px;
            }
            th, td {
              border: 1px solid #ddd;
              padding: 8px;
              text-align: right;
            }
            th {
              background-color: #f2f2f2;
              font-weight: bold;
            }
            .paid {
              background-color: #d1fae5;
            }
            .partial {
              background-color: #fef3c7;
            }
            .unpaid {
              background-color: #fee2e2;
            }
            .status-badge {
              display: inline-block;
              padding: 3px 8px;
              border-radius: 12px;
              font-size: 12px;
            }
            .status-paid {
              background-color: #d1fae5;
              color: #065f46;
            }
            .status-partial {
              background-color: #fef3c7;
              color: #92400e;
            }
            .status-unpaid {
              background-color: #fee2e2;
              color: #b91c1c;
            }
            .summary {
              background-color: #f9fafb;
              padding: 15px;
              border-radius: 8px;
              margin-bottom: 20px;
            }
            .summary-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 10px;
            }
            .signatures {
              margin-top: 50px;
              display: grid;
              grid-template-columns: 1fr 1fr 1fr;
              gap: 20px;
              text-align: center;
            }
            .signature-line {
              height: 40px;
              border-bottom: 1px solid #000;
              margin-top: 20px;
            }
            .highlight {
              font-size: 16px;
              color: #b91c1c;
              font-weight: bold;
            }
            .page-break {
              page-break-before: always;
            }
            @media print {
              body {
                print-color-adjust: exact;
              }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>مدرسة الجيل الواعد الخاصة</h1>
            <h2>بيانات الطالب</h2>
            <p>تاريخ الطباعة: ${new Date().toLocaleDateString('ar-EG')}</p>
          </div>

          <div class="section">
            <div class="section-title">بيانات الطالب</div>
            <div class="info-grid">
              <div class="info-item">
                <span class="info-label">الاسم الكامل:</span> ${student.full_name}
              </div>
              <div class="info-item">
                <span class="info-label">الرقم القومي:</span> ${student.national_id || 'غير متوفر'}
              </div>
              <div class="info-item">
                <span class="info-label">المستوى الدراسي:</span> ${gradeLevel?.arabic_name || 'غير متوفر'}
              </div>
              <div class="info-item">
                <span class="info-label">الفصل الدراسي:</span> ${student.classroom_name || 'غير متوفر'}
              </div>
              <div class="info-item">
                <span class="info-label">الجنس:</span> ${student.gender === 'male' ? 'ذكر' : 'أنثى'}
              </div>
              <div class="info-item">
                <span class="info-label">تاريخ الميلاد:</span> ${formatDate(student.birth_date)}
              </div>
              <div class="info-item">
                <span class="info-label">تاريخ التسجيل:</span> ${formatDate(student.enrollment_date)}
              </div>
              <div class="info-item">
                <span class="info-label">ولي الأمر:</span> ${student.parent_name || 'غير متوفر'}
              </div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">المعلومات المالية</div>
            <div class="info-grid">
              <div class="info-item">
                <span class="info-label">الرسوم الدراسية:</span> ${formatCurrency(student.fees_amount || 0)}
              </div>
              <div class="info-item">
                <span class="info-label">الخصم:</span> ${formatCurrency(student.discount_amount || 0)}
              </div>
              <div class="info-item">
                <span class="info-label">رسوم فتح الملف:</span> ${formatCurrency(student.file_opening_fee || 300)}
              </div>
              <div class="info-item">
                <span class="info-label">الإجمالي بعد الخصم:</span> ${formatCurrency(totalAfterDiscount)}
              </div>
              <div class="info-item">
                <span class="info-label">إجمالي المدفوعات:</span> ${formatCurrency(totalPayments)}
              </div>
              <div class="info-item">
                <span class="info-label">المبلغ المتبقي:</span> <span class="highlight">${formatCurrency(remainingAmount)}</span>
              </div>
              <div class="info-item">
                <span class="info-label">طريقة السداد:</span> ${student.payment_method === 'installments' ? 'أقساط' : 'دفعة واحدة'}
              </div>
              <div class="info-item">
                <span class="info-label">حالة الدفع:</span> ${student.financial_status === 'paid' ? 'مدفوع بالكامل' : student.financial_status === 'partial' ? 'مدفوع جزئياً' : 'غير مدفوع'}
              </div>
            </div>

            ${student.payment_method === 'installments' && installmentsData && installmentsData.length > 0 ? `
            <div style="margin-top: 20px;">
              <div class="section-title">جدول الأقساط</div>
              <table>
                <thead>
                  <tr>
                    <th>رقم القسط</th>
                    <th>تاريخ الاستحقاق</th>
                    <th>المبلغ</th>
                    <th>المبلغ المدفوع</th>
                    <th>الرصيد المتبقي</th>
                    <th>الحالة</th>
                  </tr>
                </thead>
                <tbody>
                  ${installmentsData.map(installment => `
                  <tr class="${installment.status === 'paid' ? 'paid' : installment.status === 'partial' ? 'partial' : 'unpaid'}">
                    <td>${installment.installment_number}</td>
                    <td>${formatDate(installment.due_date)}</td>
                    <td>${formatCurrency(installment.amount)}</td>
                    <td>${formatCurrency(installment.payment_amount || 0)}</td>
                    <td>${formatCurrency(installment.remaining_balance)}</td>
                    <td>
                      <span class="status-badge status-${installment.status}">
                        ${installment.status === 'paid' ? 'مدفوع' : installment.status === 'partial' ? 'مدفوع جزئياً' : 'غير مدفوع'}
                      </span>
                      ${installment.payment_date && installment.status !== 'unpaid' ? `
                      <div style="font-size: 11px; margin-top: 5px;">
                        تاريخ الدفع: ${formatDate(installment.payment_date)}
                      </div>
                      ` : ''}
                    </td>
                  </tr>
                  `).join('')}
                </tbody>
                <tfoot>
                  <tr>
                    <td colspan="2" style="text-align: right; font-weight: bold;">الإجمالي</td>
                    <td style="font-weight: bold;">${formatCurrency(installmentsData.reduce((sum, item) => sum + item.amount, 0))}</td>
                    <td style="font-weight: bold;">${formatCurrency(installmentsData.reduce((sum, item) => sum + (item.payment_amount || 0), 0))}</td>
                    <td colspan="2"></td>
                  </tr>
                </tfoot>
              </table>
            </div>
            ` : student.payment_method === 'installments' ? `
            <div style="margin-top: 20px;">
              <div class="section-title">جدول الأقساط</div>
              <p style="text-align: center; padding: 20px; background-color: #f9fafb; border-radius: 8px;">
                لا توجد أقساط مسجلة لهذا الطالب
              </p>
            </div>
            ` : ''}
          </div>

          ${student.payments && student.payments.length > 0 ? `
          <div class="section">
            <div class="section-title">سجل المدفوعات</div>
            <table>
              <thead>
                <tr>
                  <th>التاريخ</th>
                  <th>المبلغ</th>
                  <th>نوع الدفع</th>
                  <th>طريقة الدفع</th>
                  <th>ملاحظات</th>
                </tr>
              </thead>
              <tbody>
                ${student.payments.map(payment => `
                <tr>
                  <td>${formatDate(payment.payment_date)}</td>
                  <td>${formatCurrency(payment.amount)}</td>
                  <td>
                    ${payment.payment_type === 'advance_payment' ? 'دفعة مقدمة' :
                      payment.payment_type === 'installment' ? 'قسط' : 'أخرى'}
                  </td>
                  <td>
                    ${payment.payment_method === 'cash' ? 'نقدي' :
                      payment.payment_method === 'bank_transfer' ? 'تحويل بنكي' :
                      payment.payment_method === 'check' ? 'شيك' :
                      payment.payment_method === 'credit_card' ? 'بطاقة ائتمان' : 'أخرى'}
                  </td>
                  <td>${payment.notes || '-'}</td>
                </tr>
                `).join('')}
              </tbody>
              <tfoot>
                <tr>
                  <td style="text-align: right; font-weight: bold;">إجمالي المدفوعات:</td>
                  <td style="font-weight: bold;">${formatCurrency(totalPayments)}</td>
                  <td colspan="3"></td>
                </tr>
              </tfoot>
            </table>
          </div>
          ` : ''}

          <div class="signatures">
            <div>
              <p><strong>توقيع ولي الأمر</strong></p>
              <div class="signature-line"></div>
              <p style="font-size: 12px; margin-top: 5px;">${student.parent_name || '................................'}</p>
            </div>
            <div>
              <p><strong>توقيع المسؤول المالي</strong></p>
              <div class="signature-line"></div>
              <p style="font-size: 12px; margin-top: 5px;">................................</p>
            </div>
            <div>
              <p><strong>توقيع مدير المدرسة</strong></p>
              <div class="signature-line"></div>
              <p style="font-size: 12px; margin-top: 5px;">................................</p>
            </div>
          </div>

          <div style="margin-top: 30px; text-align: center; font-size: 12px; color: #666;">
            <p>تم إنشاء هذا المستند بواسطة نظام إدارة المدرسة</p>
            <p>جميع الحقوق محفوظة © ${new Date().getFullYear()}</p>
            <p>رقم المستند: ${student.id?.substring(0, 8) || 'XXXXXXXX'}-${new Date().getTime().toString().substring(0, 6)}</p>
          </div>
        </body>
        </html>
      `);

      // طباعة النافذة
      printWindow.document.close();
      printWindow.focus();

      // تأخير قصير للتأكد من تحميل المحتوى
      setTimeout(() => {
        printWindow.print();

        // إعادة تعيين حالة التحميل عند إغلاق النافذة أو إلغاء الطباعة
        printWindow.onafterprint = () => {
          printWindow.close();
          setIsPrinting(false);
        };

        // إعادة تعيين حالة التحميل إذا تم إغلاق النافذة بدون طباعة
        printWindow.onbeforeunload = () => {
          setIsPrinting(false);
        };

        // إعادة تعيين حالة التحميل بعد فترة زمنية محددة كإجراء احتياطي
        setTimeout(() => {
          setIsPrinting(false);
        }, 10000);
      }, 1000);

    } catch (error) {
      console.error('خطأ في الطباعة:', error);
      alert('حدث خطأ أثناء الطباعة');
      setIsPrinting(false);
    }
  };

  // تحويل الحالة إلى نص عربي
  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return 'نشط';
      case 'inactive':
        return 'غير نشط';
      case 'graduated':
        return 'متخرج';
      case 'transferred':
        return 'منقول';
      default:
        return status;
    }
  };

  // تحويل الجنس إلى نص عربي
  const getGenderText = (gender: string) => {
    return gender === 'male' ? 'ذكر' : 'أنثى';
  };

  // تحويل صلة القرابة إلى نص عربي
  const getRelationText = (relation?: string) => {
    switch (relation) {
      case 'father':
        return 'الأب';
      case 'mother':
        return 'الأم';
      case 'guardian':
        return 'ولي أمر';
      default:
        return 'غير محدد';
    }
  };

  // معالجة حذف الطالب
  const handleDelete = async () => {
    if (!onDelete) return;

    if (confirm('هل أنت متأكد من حذف هذا الطالب؟')) {
      setIsDeleting(true);
      await onDelete(student.id);
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* بطاقة المعلومات الأساسية */}
      <Card>
        <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div className="flex items-center space-x-4 space-x-reverse">
            <div className="relative w-20 h-20 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700">
              {student.profile_image ? (
                <Image
                  src={student.profile_image}
                  alt={student.full_name || 'صورة الطالب'}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-500 dark:text-gray-400 text-2xl font-bold">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
              )}
            </div>
            <div>
              <CardTitle className="text-2xl">
                {student.full_name || 'بدون اسم'}
              </CardTitle>
              <p className="text-gray-600 dark:text-gray-400">
                {gradeLevel?.arabic_name} {student.classroom_name && `- ${student.classroom_name}`}
              </p>
              <div className="mt-2 flex items-center">
                <span className={`inline-block px-3 py-1 text-sm rounded-full ${
                  student.status === 'active'
                    ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300'
                    : student.status === 'inactive'
                    ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300'
                    : student.status === 'graduated'
                    ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300'
                    : 'bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-300'
                }`}>
                  {getStatusText(student.status)}
                </span>
              </div>
            </div>
          </div>
          <div className="flex space-x-2 space-x-reverse mt-4 md:mt-0">
            <Button
              variant="outline"
              onClick={() => handlePrint()}
              isLoading={isPrinting}
              disabled={isPrinting}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              طباعة كافة البيانات
            </Button>
            <Link href={`/students/edit/${student.id}`}>
              <Button variant="secondary">
                تعديل البيانات
              </Button>
            </Link>
            {onDelete && (
              <Button
                variant="danger"
                onClick={handleDelete}
                isLoading={isDeleting}
                disabled={isDeleting}
              >
                حذف الطالب
              </Button>
            )}
          </div>
        </CardHeader>
      </Card>

      {/* المعلومات الشخصية */}
      <Card>
        <CardHeader>
          <CardTitle>المعلومات الشخصية</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">الاسم الكامل</p>
              <p className="font-medium">{student.full_name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">الجنس</p>
              <p className="font-medium">{getGenderText(student.gender)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">تاريخ الميلاد</p>
              <p className="font-medium">{formatDate(student.birth_date)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">الرقم القومي</p>
              <p className="font-medium">{student.national_id || 'غير متوفر'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">رقم الهاتف</p>
              <p className="font-medium">{student.phone || 'غير متوفر'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">البريد الإلكتروني</p>
              <p className="font-medium">{student.email || 'غير متوفر'}</p>
            </div>
            <div className="md:col-span-2">
              <p className="text-sm text-gray-500 dark:text-gray-400">العنوان</p>
              <p className="font-medium">{student.address || 'غير متوفر'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* المعلومات الدراسية */}
      <Card>
        <CardHeader>
          <CardTitle>المعلومات الدراسية</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">المستوى الدراسي</p>
              <p className="font-medium">{gradeLevel?.arabic_name || 'غير متوفر'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">الفصل الدراسي</p>
              <p className="font-medium">{student.classroom_name || 'غير متوفر'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">تاريخ التسجيل</p>
              <p className="font-medium">{formatDate(student.enrollment_date)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">الحالة</p>
              <p className="font-medium">{getStatusText(student.status)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* معلومات ولي الأمر */}
      <Card>
        <CardHeader>
          <CardTitle>معلومات ولي الأمر</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">اسم ولي الأمر</p>
              <p className="font-medium">{student.parent_name || 'غير متوفر'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">صلة القرابة</p>
              <p className="font-medium">{getRelationText(student.parent_relation)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">رقم هاتف ولي الأمر</p>
              <p className="font-medium">{student.parent_phone || 'غير متوفر'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">البريد الإلكتروني لولي الأمر</p>
              <p className="font-medium">{student.parent_email || 'غير متوفر'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">وظيفة ولي الأمر</p>
              <p className="font-medium">{student.parent_job || 'غير متوفر'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* المعلومات المالية */}
      <StudentFinancialInfo
        student={student}
        onUpdate={async (data) => {
          try {
            await studentService.updateStudent(data);
            alert('تم تحديث البيانات المالية بنجاح');
          } catch (error) {
            console.error('Error updating financial info:', error);
            alert('حدث خطأ أثناء تحديث البيانات المالية');
          }
        }}
      />

      {/* ملاحظات إضافية - عرضها فقط إذا كان هناك ملاحظات */}
      {(student.health_notes || student.academic_notes || student.behavior_notes) && (
        <Card>
          <CardHeader>
            <CardTitle>ملاحظات إضافية</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {student.health_notes && (
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">ملاحظات صحية</p>
                  <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded-md">
                    <p>{student.health_notes}</p>
                  </div>
                </div>
              )}
              {student.academic_notes && (
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">ملاحظات أكاديمية</p>
                  <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded-md">
                    <p>{student.academic_notes}</p>
                  </div>
                </div>
              )}
              {student.behavior_notes && (
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">ملاحظات سلوكية</p>
                  <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded-md">
                    <p>{student.behavior_notes}</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* تم إزالة نموذج الطباعة المخفي واستبداله بطريقة أبسط للطباعة */}
    </div>
  );
};

export default StudentDetails;
