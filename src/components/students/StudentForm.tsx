'use client';

import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { Student, CreateStudentInput, GRADE_LEVELS, FILE_OPENING_FEE, InstallmentData } from '@/types/student';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import studentService from '@/services/studentService';
import { stageService } from '@/services/stageService';
import { classroomService } from '@/services/classroomService';
import { supabase } from '@/lib/supabase';
import { showToast } from '@/components/ui/ToastContainer';
import FinancialSection from './FinancialSection';

// تعريف مخطط التحقق من صحة البيانات
const studentSchema = z.object({
  full_name: z.string().min(5, 'الاسم الرباعي مطلوب ويجب أن يكون على الأقل 5 أحرف'),
  gender: z.enum(['male', 'female'], { required_error: 'الجنس مطلوب' }),
  birth_date: z.string().min(1, 'تاريخ الميلاد مطلوب'),
  national_id: z.string().min(14, 'الرقم القومي يجب أن يكون 14 رقم').max(14, 'الرقم القومي يجب أن يكون 14 رقم').regex(/^\d+$/, 'الرقم القومي يجب أن يحتوي على أرقام فقط'),
  religion: z.enum(['islam', 'christianity']).optional().nullable(),
  second_language: z.enum(['french', 'german']).optional().nullable(),
  address: z.string().optional().or(z.literal('')),
  phone: z.string().optional().or(z.literal('')),
  email: z.string().email('البريد الإلكتروني غير صالح').optional().or(z.literal('')),
  grade_level: z.number({ required_error: 'المستوى الدراسي مطلوب' }),
  // stage_id field removed
  classroom_id: z.string().optional().or(z.literal('')),
  enrollment_date: z.string().min(1, 'تاريخ التسجيل مطلوب'),
  status: z.enum(['active', 'inactive', 'graduated', 'transferred', 'excellent', 'absent'], { required_error: 'الحالة مطلوبة' }),
  parent_name: z.string().optional().or(z.literal('')),
  parent_phone: z.string().optional().or(z.literal('')),
  parent_phone2: z.string().optional().or(z.literal('')),
  parent_email: z.string().email('البريد الإلكتروني للوالد غير صالح').optional().or(z.literal('')),
  parent_job: z.string().optional().or(z.literal('')),
  parent_relation: z.enum(['father', 'mother', 'guardian']).optional().nullable(),
  health_notes: z.string().optional().or(z.literal('')),
  academic_notes: z.string().optional().or(z.literal('')),
  behavior_notes: z.string().optional().or(z.literal('')),
  fees_amount: z.union([z.number(), z.null()]).optional(),
  discount_amount: z.union([z.number(), z.null()]).optional(),
  discount_reason: z.union([z.string(), z.null()]).optional(),
  file_opening_fee: z.union([z.number(), z.null()]).optional(),
  advance_payment: z.union([z.number(), z.null()]).optional(),
  total_after_discount: z.union([z.number(), z.null()]).optional(),
  payment_method: z.union([z.enum(['full', 'installments']), z.null()]).optional(),
  installments_count: z.union([z.number(), z.null()]).optional(),
  installment_amount: z.union([z.number(), z.null()]).optional(),
  installments_data: z.array(
    z.object({
      installment_number: z.number(),
      due_date: z.string(),
      amount: z.number(),
      remaining_balance: z.number(),
      status: z.enum(['paid', 'unpaid', 'partial']).optional(),
      payment_date: z.string().optional(),
      payment_amount: z.number().optional(),
      payment_method: z.string().optional(),
      notes: z.string().optional(),
    })
  ).optional(),
});

type StudentFormValues = z.infer<typeof studentSchema>;

interface StudentFormProps {
  student?: Student;
  onSubmit: (data: any) => void;
  isSubmitting: boolean;
}

const StudentForm: React.FC<StudentFormProps> = ({ student, onSubmit, isSubmitting }) => {
  const [classrooms, setClassrooms] = useState<any[]>([]);
  const [selectedGradeLevel, setSelectedGradeLevel] = useState<number | undefined>(
    student?.grade_level
  );
  const [isLoadingClassrooms, setIsLoadingClassrooms] = useState(false);
  const [classroomsLoaded, setClassroomsLoaded] = useState(false);
  const [totalAfterDiscount, setTotalAfterDiscount] = useState<number>(0);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    formState: { errors },
  } = useForm<StudentFormValues>({
    resolver: zodResolver(studentSchema),
    defaultValues: student
      ? {
          ...student,
          birth_date: student.birth_date ? format(new Date(student.birth_date), 'yyyy-MM-dd') : '',
          enrollment_date: student.enrollment_date
            ? format(new Date(student.enrollment_date), 'yyyy-MM-dd')
            : '',
          file_opening_fee: student.file_opening_fee || FILE_OPENING_FEE,
        }
      : {
          status: 'active',
          gender: 'male',
          enrollment_date: format(new Date(), 'yyyy-MM-dd'),
          payment_method: 'full',
          file_opening_fee: FILE_OPENING_FEE,
        },
  });

  const watchGradeLevel = watch('grade_level');
  const watchFeesAmount = watch('fees_amount');
  const watchDiscountAmount = watch('discount_amount');
  const watchFileOpeningFee = watch('file_opening_fee');

  // تحويل القيم إلى أرقام أو استخدام القيم الافتراضية
  const feesAmount = typeof watchFeesAmount === 'number' && !isNaN(watchFeesAmount) ? watchFeesAmount : 0;
  const discountAmount = typeof watchDiscountAmount === 'number' && !isNaN(watchDiscountAmount) ? watchDiscountAmount : 0;
  const fileOpeningFee = typeof watchFileOpeningFee === 'number' && !isNaN(watchFileOpeningFee) ? watchFileOpeningFee : FILE_OPENING_FEE;
  const formValues = watch();

  // تم حذف تحميل المراحل الدراسية عند تحميل المكون

  // تحميل الفصول الدراسية عند تغيير المستوى الدراسي
  useEffect(() => {
    if (watchGradeLevel) {
      setSelectedGradeLevel(watchGradeLevel);
      loadClassroomsByGradeLevel(watchGradeLevel);
      setClassroomsLoaded(true);
    } else {
      setClassrooms([]);
      setClassroomsLoaded(false);
    }
  }, [watchGradeLevel]);

  // حساب المبلغ الإجمالي بعد الخصم
  useEffect(() => {
    const total = (feesAmount - discountAmount) + fileOpeningFee;
    setTotalAfterDiscount(total > 0 ? total : 0);
  }, [feesAmount, discountAmount, fileOpeningFee]);

  // تحميل الفصول الدراسية حسب المستوى الدراسي
  const loadClassroomsByGradeLevel = async (gradeLevel: number) => {
    setIsLoadingClassrooms(true);
    try {
      console.log(`تحميل الفصول الدراسية للمستوى ${gradeLevel}`);
      const { data, error } = await classroomService.getClassrooms(gradeLevel);
      if (error) {
        console.error('Error loading classrooms by grade level:', error);
        showToast('حدث خطأ أثناء تحميل الفصول الدراسية', 'error');
        return;
      }
      console.log(`تم تحميل ${data?.length || 0} فصل دراسي للمستوى ${gradeLevel}:`, data);
      setClassrooms(data || []);
    } catch (error) {
      console.error('Error loading classrooms by grade level:', error);
      showToast('حدث خطأ أثناء تحميل الفصول الدراسية', 'error');
    } finally {
      setIsLoadingClassrooms(false);
    }
  };

  // معالجة تقديم النموذج
  const handleFormSubmit = (data: StudentFormValues) => {
    console.log('Form submitted with values:', data);

    // تحويل القيم الرقمية
    const formattedData = {
      ...data,
      fees_amount: data.fees_amount !== undefined ? Number(data.fees_amount) : undefined,
      discount_amount: data.discount_amount !== undefined ? Number(data.discount_amount) : undefined,
      file_opening_fee: data.file_opening_fee !== undefined ? Number(data.file_opening_fee) : undefined,
      total_after_discount: data.total_after_discount !== undefined ? Number(data.total_after_discount) : undefined,
      installments_count: data.installments_count !== undefined ? Number(data.installments_count) : undefined,
      installment_amount: data.installment_amount !== undefined ? Number(data.installment_amount) : undefined,
    };

    onSubmit(formattedData as CreateStudentInput);
  };

  // معالجة الطباعة - تنفيذ مباشر بدون استخدام مكتبة react-to-print
  const handlePrint = () => {
    // إنشاء نافذة جديدة للطباعة
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('يرجى السماح بالنوافذ المنبثقة للطباعة');
      return;
    }

    // تنسيق المبلغ بالجنيه المصري
    const formatCurrency = (amount: number | null | undefined) => {
      if (amount === null || amount === undefined) return '0 جنيه';
      return new Intl.NumberFormat('ar-EG', {
        style: 'currency',
        currency: 'EGP',
        maximumFractionDigits: 2
      }).format(amount);
    };

    // تنسيق التاريخ بالعربية
    const formatDate = (dateString: string | null | undefined) => {
      if (!dateString) return '';
      try {
        return new Date(dateString).toLocaleDateString('ar-EG');
      } catch (error) {
        return dateString;
      }
    };

    // إعداد محتوى النافذة
    printWindow.document.write(`
      <!DOCTYPE html>
      <html dir="rtl">
      <head>
        <title>تسجيل الطالب - ${formValues.full_name || 'جديد'}</title>
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
            border-collapse: collapse;
            width: 100%;
            margin-bottom: 15px;
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
          .financial-table {
            margin-top: 15px;
            margin-bottom: 20px;
          }
          .installment-table {
            margin-top: 15px;
          }
          .payment-status {
            display: inline-block;
            padding: 3px 8px;
            border-radius: 12px;
            font-size: 12px;
          }
          .status-paid {
            background-color: #d1fae5;
            color: #065f46;
          }
          .status-unpaid {
            background-color: #fee2e2;
            color: #b91c1c;
          }
          .status-partial {
            background-color: #fef3c7;
            color: #92400e;
          }
          .payments-table {
            margin-top: 20px;
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
          <h2>نموذج تسجيل طالب</h2>
          <p>تاريخ الطباعة: ${new Date().toLocaleDateString('ar-EG')}</p>
        </div>

        <div class="section">
          <div class="section-title">المعلومات الشخصية</div>
          <div class="info-grid">
            <div class="info-item">
              <span class="info-label">الاسم الرباعي:</span> ${formValues.full_name || ''}
            </div>
            <div class="info-item">
              <span class="info-label">الجنس:</span> ${formValues.gender === 'male' ? 'ذكر' : 'أنثى'}
            </div>
            <div class="info-item">
              <span class="info-label">تاريخ الميلاد:</span> ${formatDate(formValues.birth_date)}
            </div>
            <div class="info-item">
              <span class="info-label">الرقم القومي:</span> ${formValues.national_id || ''}
            </div>
            <div class="info-item">
              <span class="info-label">العنوان:</span> ${formValues.address || ''}
            </div>
          </div>
        </div>

        <div class="section">
          <div class="section-title">المعلومات الدراسية</div>
          <div class="info-grid">
            <div class="info-item">
              <span class="info-label">المستوى الدراسي:</span> ${GRADE_LEVELS.find(g => g.id === formValues.grade_level)?.arabic_name || ''}
            </div>
            <div class="info-item">
              <span class="info-label">تاريخ التسجيل:</span> ${formatDate(formValues.enrollment_date)}
            </div>
          </div>
        </div>

        <div class="section">
          <div class="section-title">معلومات ولي الأمر</div>
          <div class="info-grid">
            <div class="info-item">
              <span class="info-label">اسم ولي الأمر:</span> ${formValues.parent_name || ''}
            </div>
            <div class="info-item">
              <span class="info-label">رقم الهاتف:</span> ${formValues.parent_phone || ''}
            </div>
          </div>
        </div>

        <div class="section">
          <div class="section-title">المعلومات المالية</div>
          <table class="financial-table">
            <tr>
              <th>البند</th>
              <th>القيمة</th>
            </tr>
            <tr>
              <td>الرسوم الدراسية</td>
              <td>${formatCurrency(formValues.fees_amount)}</td>
            </tr>
            <tr>
              <td>قيمة الخصم</td>
              <td>${formatCurrency(formValues.discount_amount)}</td>
            </tr>
            ${(formValues.discount_amount || 0) > 0 ? `<tr>
              <td>سبب الخصم</td>
              <td>${formValues.discount_reason || '-'}</td>
            </tr>` : ''}
            <tr>
              <td>رسوم فتح الملف</td>
              <td>${formatCurrency(formValues.file_opening_fee)}</td>
            </tr>
            ${(formValues.advance_payment || 0) > 0 ? `<tr>
              <td>الدفعة المقدمة</td>
              <td>${formatCurrency(formValues.advance_payment)}</td>
            </tr>` : ''}
            <tr>
              <td><strong>الإجمالي بعد الخصم</strong></td>
              <td><strong>${formatCurrency(totalAfterDiscount)}</strong></td>
            </tr>
            <tr>
              <td>طريقة السداد</td>
              <td>${formValues.payment_method === 'installments' ? 'أقساط' : 'دفعة واحدة'}</td>
            </tr>
            <tr>
              <td>حالة الدفع</td>
              <td>
                <span class="payment-status status-unpaid">
                  غير مدفوع
                </span>
              </td>
            </tr>
          </table>

          ${formValues.payment_method === 'installments' ? `
          <div class="section-title">تفاصيل الأقساط</div>
          ${formValues.installments_data && formValues.installments_data.length > 0 ? `
          <table class="installment-table">
            <tr>
              <th>رقم القسط</th>
              <th>تاريخ الاستحقاق</th>
              <th>المبلغ</th>
              <th>الحالة</th>
            </tr>
            ${formValues.installments_data.map(installment => `
            <tr>
              <td>${installment.installment_number}</td>
              <td>${formatDate(installment.due_date)}</td>
              <td>${formatCurrency(installment.amount)}</td>
              <td>
                <span class="payment-status ${installment.status === 'paid' ? 'status-paid' : installment.status === 'partial' ? 'status-partial' : 'status-unpaid'}">
                  ${installment.status === 'paid' ? 'مدفوع' : installment.status === 'partial' ? 'مدفوع جزئياً' : 'غير مدفوع'}
                </span>
              </td>
            </tr>
            `).join('')}
          </table>
          ` : `
          <div class="bg-gray-50 p-3 rounded-md text-center">
            <p class="text-gray-500">لا توجد أقساط مسجلة لهذا الطالب</p>
          </div>
          `}
          ` : ''}

          ${(formValues.advance_payment || 0) > 0 ? `
          <div class="section-title">سجل المدفوعات</div>
          <table class="payments-table">
            <tr>
              <th>التاريخ</th>
              <th>المبلغ</th>
              <th>نوع الدفع</th>
              <th>طريقة الدفع</th>
              <th>ملاحظات</th>
            </tr>
            <tr>
              <td>${formatDate(formValues.enrollment_date)}</td>
              <td>${formatCurrency(formValues.advance_payment)}</td>
              <td>دفعة مقدمة</td>
              <td>نقدي</td>
              <td>دفعة مقدمة عند التسجيل</td>
            </tr>
          </table>
          ` : ''}
        </div>

        <div style="margin-top: 50px; display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 20px; text-align: center;">
          <div>
            <p><strong>توقيع ولي الأمر</strong></p>
            <div style="height: 40px; border-bottom: 1px solid #000;"></div>
          </div>
          <div>
            <p><strong>توقيع المسؤول المالي</strong></p>
            <div style="height: 40px; border-bottom: 1px solid #000;"></div>
          </div>
          <div>
            <p><strong>توقيع مدير المدرسة</strong></p>
            <div style="height: 40px; border-bottom: 1px solid #000;"></div>
          </div>
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
      printWindow.onafterprint = () => {
        printWindow.close();
      };
    }, 500);
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      {/* المعلومات الشخصية */}
      <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-md">
        <h2 className="text-lg font-semibold mb-4">المعلومات الشخصية</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="col-span-1 md:col-span-2 lg:col-span-3">
            <Input
              label="الاسم الرباعي"
              {...register('full_name')}
              error={errors.full_name?.message}
              placeholder="أدخل الاسم الرباعي كاملاً"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              الجنس
            </label>
            <select
              {...register('gender')}
              className="w-full rounded-md border border-gray-300 bg-white p-2 text-sm focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:bg-gray-950"
            >
              <option value="male">ذكر</option>
              <option value="female">أنثى</option>
            </select>
            {errors.gender && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-500">
                {errors.gender.message}
              </p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              الديانة
            </label>
            <select
              {...register('religion')}
              className="w-full rounded-md border border-gray-300 bg-white p-2 text-sm focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:bg-gray-950"
            >
              <option value="">اختر الديانة</option>
              <option value="islam">الإسلام</option>
              <option value="christianity">المسيحية</option>
            </select>
            {errors.religion && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-500">
                {errors.religion.message}
              </p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              اللغة الثانية
            </label>
            <select
              {...register('second_language')}
              className="w-full rounded-md border border-gray-300 bg-white p-2 text-sm focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:bg-gray-950"
            >
              <option value="">اختر اللغة الثانية</option>
              <option value="french">الفرنسية</option>
              <option value="german">الألمانية</option>
            </select>
            {errors.second_language && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-500">
                {errors.second_language.message}
              </p>
            )}
          </div>
          <Input
            label="تاريخ الميلاد"
            type="date"
            {...register('birth_date')}
            error={errors.birth_date?.message}
          />
          <Input
            label="الرقم القومي"
            {...register('national_id')}
            error={errors.national_id?.message}
          />
          <Input
            label="رقم الهاتف"
            {...register('phone')}
            error={errors.phone?.message}
          />
          <Input
            label="البريد الإلكتروني"
            type="email"
            {...register('email')}
            error={errors.email?.message}
          />
          <Input
            label="العنوان"
            {...register('address')}
            error={errors.address?.message}
          />
        </div>
      </div>

      {/* المعلومات الدراسية */}
      <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-md">
        <h2 className="text-lg font-semibold mb-4">المعلومات الدراسية</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* المستوى الدراسي */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              المستوى الدراسي
            </label>
            <select
              {...register('grade_level', { valueAsNumber: true })}
              className="w-full rounded-md border border-gray-300 bg-white p-2 text-sm focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:bg-gray-950"
            >
              <option value="">اختر المستوى الدراسي</option>
              {GRADE_LEVELS.map((grade) => (
                <option key={grade.id} value={grade.id}>
                  {grade.arabic_name}
                </option>
              ))}
            </select>
            {errors.grade_level && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-500">
                {errors.grade_level.message}
              </p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              الفصل الدراسي
            </label>
            <select
              {...register('classroom_id')}
              className="w-full rounded-md border border-gray-300 bg-white p-2 text-sm focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:bg-gray-950"
              disabled={!selectedGradeLevel || isLoadingClassrooms || classrooms.length === 0}
            >
              <option value="">اختر الفصل الدراسي</option>
              {classrooms.map((classroom) => (
                <option key={classroom.id} value={classroom.id}>
                  {classroom.name}
                </option>
              ))}
            </select>
            {errors.classroom_id && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-500">
                {errors.classroom_id.message}
              </p>
            )}
            {isLoadingClassrooms && <div className="text-xs text-gray-500 mt-1">جاري تحميل الفصول...</div>}
            {!isLoadingClassrooms && selectedGradeLevel && classrooms.length === 0 && (
              <div className="text-xs text-red-500 mt-1">لا توجد فصول دراسية لهذا المستوى</div>
            )}
            {!selectedGradeLevel && (
              <div className="text-xs text-gray-500 mt-1">يرجى اختيار المستوى الدراسي أولاً</div>
            )}
          </div>
          <Input
            label="تاريخ التسجيل"
            type="date"
            {...register('enrollment_date')}
            error={errors.enrollment_date?.message}
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              الحالة
            </label>
            <select
              {...register('status')}
              className="w-full rounded-md border border-gray-300 bg-white p-2 text-sm focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:bg-gray-950"
            >
              <option value="active">نشط</option>
              <option value="inactive">غير نشط</option>
              <option value="graduated">متخرج</option>
              <option value="transferred">منقول</option>
              <option value="excellent">متفوق</option>
              <option value="absent">غائب</option>
            </select>
            {errors.status && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-500">
                {errors.status.message}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* معلومات ولي الأمر */}
      <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-md">
        <h2 className="text-lg font-semibold mb-4">معلومات ولي الأمر</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Input
            label="اسم ولي الأمر"
            {...register('parent_name')}
            error={errors.parent_name?.message}
          />
          <Input
            label="رقم هاتف ولي الأمر (الأساسي)"
            {...register('parent_phone')}
            error={errors.parent_phone?.message}
          />
          <Input
            label="رقم هاتف ولي الأمر (البديل)"
            {...register('parent_phone2')}
            error={errors.parent_phone2?.message}
          />
          <Input
            label="البريد الإلكتروني لولي الأمر"
            type="email"
            {...register('parent_email')}
            error={errors.parent_email?.message}
          />
          <Input
            label="وظيفة ولي الأمر"
            {...register('parent_job')}
            error={errors.parent_job?.message}
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              صلة القرابة
            </label>
            <select
              {...register('parent_relation')}
              className="w-full rounded-md border border-gray-300 bg-white p-2 text-sm focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:bg-gray-950"
            >
              <option value="">اختر صلة القرابة</option>
              <option value="father">الأب</option>
              <option value="mother">الأم</option>
              <option value="guardian">ولي أمر</option>
            </select>
            {errors.parent_relation && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-500">
                {errors.parent_relation.message}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* المعلومات المالية */}
      <FinancialSection
        register={register}
        watch={watch}
        setValue={setValue}
        control={control}
        errors={errors}
      />

      {/* ملاحظات إضافية */}
      <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">ملاحظات إضافية</h2>
          <span className="text-sm font-medium px-3 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 rounded-full">
            اختياري
          </span>
        </div>

        <div className="p-3 mb-4 bg-gray-50 dark:bg-gray-900/50 rounded-md border border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 inline-block ml-1 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            يمكنك ترك هذه الحقول فارغة. لن يؤثر ذلك على عملية تسجيل الطالب أو تحديث بياناته.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex justify-between">
              <span>ملاحظات صحية</span>
              <span className="text-xs text-gray-500 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">اختياري</span>
            </label>
            <textarea
              {...register('health_notes')}
              rows={3}
              placeholder="أدخل أي ملاحظات صحية"
              className="w-full rounded-md border border-gray-300 bg-white p-2 text-sm focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:bg-gray-950"
            ></textarea>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex justify-between">
              <span>ملاحظات أكاديمية</span>
              <span className="text-xs text-gray-500 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">اختياري</span>
            </label>
            <textarea
              {...register('academic_notes')}
              rows={3}
              placeholder="أدخل أي ملاحظات أكاديمية"
              className="w-full rounded-md border border-gray-300 bg-white p-2 text-sm focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:bg-gray-950"
            ></textarea>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex justify-between">
              <span>ملاحظات سلوكية</span>
              <span className="text-xs text-gray-500 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">اختياري</span>
            </label>
            <textarea
              {...register('behavior_notes')}
              rows={3}
              placeholder="أدخل أي ملاحظات سلوكية"
              className="w-full rounded-md border border-gray-300 bg-white p-2 text-sm focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:bg-gray-950"
            ></textarea>
          </div>
        </div>
      </div>

      {/* أزرار التحكم */}
      <div className="flex justify-between items-center">
        <Button
          type="button"
          variant="outline"
          onClick={handlePrint}
          disabled={isSubmitting}
        >
          طباعة النموذج
        </Button>

        <Button
          type="submit"
          variant="primary"
          isLoading={isSubmitting}
          disabled={isSubmitting}
        >
          {student ? 'تحديث البيانات' : 'إضافة طالب'}
        </Button>
      </div>

      {/* تم إزالة نموذج الطباعة المخفي واستبداله بطريقة أبسط للطباعة */}
    </form>
  );
};

export default StudentForm;
