import React, { useState, useEffect } from 'react';
import { UseFormRegister, UseFormWatch, UseFormSetValue, Control } from 'react-hook-form';
import { StudentFormValues } from './StudentForm';
import { GRADE_FEES, FILE_OPENING_FEE, InstallmentData } from '@/types/student';
import { Input } from '@/components/ui/Input';
import { Controller } from 'react-hook-form';
import FinancialSummary from './FinancialSummary';
import InstallmentsCalculator from './InstallmentsCalculator';

interface FinancialSectionProps {
  register: UseFormRegister<StudentFormValues>;
  watch: UseFormWatch<StudentFormValues>;
  setValue: UseFormSetValue<StudentFormValues>;
  control: Control<StudentFormValues>;
  errors: any;
}

const FinancialSection: React.FC<FinancialSectionProps> = ({
  register,
  watch,
  setValue,
  control,
  errors
}) => {
  // متابعة قيم النموذج
  const watchGradeLevel = watch('grade_level');
  const watchFeesAmount = watch('fees_amount');
  const watchDiscountAmount = watch('discount_amount');
  const watchAdvancePayment = watch('advance_payment');
  const watchPaymentMethod = watch('payment_method');
  const watchInstallmentsCount = watch('installments_count');
  const watchEnrollmentDate = watch('enrollment_date');

  // تحويل القيم إلى أرقام أو استخدام القيم الافتراضية
  const feesAmount = typeof watchFeesAmount === 'number' && !isNaN(watchFeesAmount) ? watchFeesAmount : 0;
  const discountAmount = typeof watchDiscountAmount === 'number' && !isNaN(watchDiscountAmount) ? watchDiscountAmount : 0;
  const advancePayment = typeof watchAdvancePayment === 'number' && !isNaN(watchAdvancePayment) ? watchAdvancePayment : 0;
  const installmentsCount = typeof watchInstallmentsCount === 'number' && !isNaN(watchInstallmentsCount) ? watchInstallmentsCount : 0;

  // حالة المكون
  const [fileOpeningFee, setFileOpeningFee] = useState(FILE_OPENING_FEE);
  const [totalAfterDiscount, setTotalAfterDiscount] = useState(0);
  const [installmentAmount, setInstallmentAmount] = useState(0);

  // تحديث الرسوم الدراسية بناءً على المستوى الدراسي
  useEffect(() => {
    if (watchGradeLevel && GRADE_FEES[watchGradeLevel]) {
      setValue('fees_amount', GRADE_FEES[watchGradeLevel]);
    }
  }, [watchGradeLevel, setValue]);

  // حساب المبلغ الإجمالي بعد الخصم
  useEffect(() => {
    const total = (feesAmount - discountAmount) + fileOpeningFee;
    const totalAfterAdvance = total - advancePayment;
    setTotalAfterDiscount(totalAfterAdvance > 0 ? totalAfterAdvance : 0);
    setValue('total_after_discount', totalAfterAdvance > 0 ? totalAfterAdvance : 0);
    setValue('file_opening_fee', fileOpeningFee);

    // إذا كانت الدفعة المقدمة أكبر من الصفر، قم بإنشاء سجل دفع
    if (advancePayment > 0) {
      // تحديث حالة الدفع
      setValue('financial_status', 'partial');
    }
  }, [feesAmount, discountAmount, advancePayment, fileOpeningFee, setValue]);

  // حساب قيمة القسط وإنشاء الأقساط تلقائياً
  useEffect(() => {
    if (watchPaymentMethod === 'installments' && installmentsCount > 0) {
      // حساب المبلغ المتبقي بعد الدفعة المقدمة
      const remainingAmount = totalAfterDiscount;
      const amount = Math.ceil(remainingAmount / installmentsCount);
      setInstallmentAmount(amount);
      setValue('installment_amount', amount);

      // إنشاء الأقساط تلقائياً
      if (remainingAmount > 0 && watchEnrollmentDate) {
        const newInstallments: InstallmentData[] = [];
        let remainingBalance = remainingAmount;

        for (let i = 0; i < installmentsCount; i++) {
          // حساب تاريخ الاستحقاق (شهريًا من تاريخ البدء)
          const dueDate = new Date(watchEnrollmentDate);
          dueDate.setMonth(dueDate.getMonth() + i);

          // حساب المبلغ المتبقي بعد هذا القسط
          remainingBalance -= amount;

          // التأكد من أن القسط الأخير يغطي المبلغ المتبقي بالضبط
          const installmentAmount = i === installmentsCount - 1
            ? amount + remainingBalance
            : amount;

          // إضافة القسط إلى المصفوفة
          newInstallments.push({
            installment_number: i + 1,
            due_date: dueDate.toISOString().split('T')[0],
            amount: installmentAmount,
            remaining_balance: Math.max(0, remainingBalance),
            status: 'unpaid'
          });
        }

        setValue('installments_data', newInstallments);
      }
    } else {
      setInstallmentAmount(0);
      setValue('installment_amount', 0);
    }
  }, [totalAfterDiscount, installmentsCount, watchPaymentMethod, watchEnrollmentDate, setValue]);

  // معالجة حساب الأقساط
  const handleCalculateInstallments = (installments: InstallmentData[]) => {
    setValue('installments_data', installments);
  };

  // قائمة أسباب الخصم
  const discountReasons = [
    { value: '', label: 'اختر سبب الخصم' },
    { value: 'siblings', label: 'خصم الأخوة' },
    { value: 'early_payment', label: 'الدفع المبكر' },
    { value: 'scholarship', label: 'منحة دراسية' },
    { value: 'staff', label: 'خصم الموظفين' },
    { value: 'other', label: 'أخرى' }
  ];

  return (
    <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-md">
      <h2 className="text-lg font-semibold mb-4">المعلومات المالية</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            الرسوم الدراسية (جنيه)
          </label>
          <input
            type="number"
            {...register('fees_amount', {
              setValueAs: (value) => value === "" ? null : parseFloat(value)
            })}
            className="w-full rounded-md border border-gray-300 bg-white p-2 text-sm focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:bg-gray-950"
            min="0"
            step="1"
          />
          {errors.fees_amount && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-500">
              {errors.fees_amount.message}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            قيمة الخصم (جنيه)
          </label>
          <input
            type="number"
            {...register('discount_amount', {
              setValueAs: (value) => value === "" ? null : parseFloat(value)
            })}
            className="w-full rounded-md border border-gray-300 bg-white p-2 text-sm focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:bg-gray-950"
            min="0"
            step="1"
          />
          {errors.discount_amount && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-500">
              {errors.discount_amount.message}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            سبب الخصم
          </label>
          <select
            {...register('discount_reason')}
            className="w-full rounded-md border border-gray-300 bg-white p-2 text-sm focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:bg-gray-950"
          >
            {discountReasons.map((reason) => (
              <option key={reason.value} value={reason.value}>
                {reason.label}
              </option>
            ))}
          </select>
          {errors.discount_reason && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-500">
              {errors.discount_reason.message}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            الدفعة المقدمة (جنيه)
          </label>
          <input
            type="number"
            {...register('advance_payment', {
              setValueAs: (value) => value === "" ? null : parseFloat(value)
            })}
            className="w-full rounded-md border border-gray-300 bg-white p-2 text-sm focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:bg-gray-950"
            min="0"
            step="1"
          />
          {errors.advance_payment && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-500">
              {errors.advance_payment.message}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            طريقة السداد
          </label>
          <select
            {...register('payment_method')}
            className="w-full rounded-md border border-gray-300 bg-white p-2 text-sm focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:bg-gray-950"
          >
            <option value="full">دفعة واحدة</option>
            <option value="installments">أقساط</option>
          </select>
          {errors.payment_method && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-500">
              {errors.payment_method.message}
            </p>
          )}
        </div>

        {watchPaymentMethod === 'installments' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              عدد الأقساط
            </label>
            <input
              type="number"
              {...register('installments_count', {
                setValueAs: (value) => value === "" ? null : parseFloat(value)
              })}
              className="w-full rounded-md border border-gray-300 bg-white p-2 text-sm focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:bg-gray-950"
              min="1"
              max="12"
              step="1"
            />
            {errors.installments_count && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-500">
                {errors.installments_count.message}
              </p>
            )}
          </div>
        )}
      </div>

      {/* ملخص المعلومات المالية */}
      <FinancialSummary
        feesAmount={feesAmount}
        discountAmount={discountAmount}
        discountReason={watch('discount_reason')}
        fileOpeningFee={fileOpeningFee}
        advancePayment={advancePayment}
        totalAfterDiscount={totalAfterDiscount}
        installmentsCount={watchPaymentMethod === 'installments' ? installmentsCount : undefined}
        installmentAmount={watchPaymentMethod === 'installments' ? installmentAmount : undefined}
      />

      {/* حاسبة الأقساط */}
      {watchPaymentMethod === 'installments' && (
        <div className="mt-6">
          <h3 className="font-medium mb-2">تفاصيل الأقساط</h3>
          {installmentsCount > 0 ? (
            <InstallmentsCalculator
              totalAmount={totalAfterDiscount}
              installmentsCount={installmentsCount}
              startDate={watchEnrollmentDate || new Date().toISOString().split('T')[0]}
              onCalculate={handleCalculateInstallments}
              existingInstallments={watch('installments_data')}
            />
          ) : (
            <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded-md">
              <p className="text-center text-gray-500 dark:text-gray-400">
                يرجى تحديد عدد الأقساط لعرض جدول الأقساط
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default FinancialSection;
