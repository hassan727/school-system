import React, { useState, useEffect } from 'react';
import { InstallmentData } from '@/types/student';
import { Button } from '@/components/ui/Button';
import { format, addMonths } from 'date-fns';
import { ar } from 'date-fns/locale';

interface InstallmentsCalculatorProps {
  totalAmount: number;
  installmentsCount: number;
  startDate: string;
  onCalculate: (installments: InstallmentData[]) => void;
  existingInstallments?: InstallmentData[];
}

const InstallmentsCalculator: React.FC<InstallmentsCalculatorProps> = ({
  totalAmount,
  installmentsCount,
  startDate,
  onCalculate,
  existingInstallments
}) => {
  const [installments, setInstallments] = useState<InstallmentData[]>([]);
  const [isCalculating, setIsCalculating] = useState(false);

  // حساب الأقساط عند تغيير المدخلات
  useEffect(() => {
    if (totalAmount > 0 && installmentsCount > 0 && startDate) {
      calculateInstallments();
    }
  }, [totalAmount, installmentsCount, startDate]);

  // استخدام الأقساط الموجودة إذا كانت متوفرة
  useEffect(() => {
    if (existingInstallments && existingInstallments.length > 0) {
      setInstallments(existingInstallments);
    }
  }, [existingInstallments]);

  // حساب الأقساط
  const calculateInstallments = () => {
    setIsCalculating(true);

    try {
      // التحقق من صحة المدخلات
      if (totalAmount <= 0 || installmentsCount <= 0 || !startDate) {
        setInstallments([]);
        return;
      }

      // حساب قيمة القسط
      const installmentAmount = Math.ceil(totalAmount / installmentsCount);

      // إنشاء مصفوفة الأقساط
      const newInstallments: InstallmentData[] = [];
      let remainingBalance = totalAmount;

      for (let i = 0; i < installmentsCount; i++) {
        // حساب تاريخ الاستحقاق (شهريًا من تاريخ البدء)
        const dueDate = format(
          addMonths(new Date(startDate), i),
          'yyyy-MM-dd'
        );

        // حساب المبلغ المتبقي بعد هذا القسط
        remainingBalance -= installmentAmount;

        // التأكد من أن القسط الأخير يغطي المبلغ المتبقي بالضبط
        const amount = i === installmentsCount - 1
          ? installmentAmount + remainingBalance
          : installmentAmount;

        // إضافة القسط إلى المصفوفة
        newInstallments.push({
          installment_number: i + 1,
          due_date: dueDate,
          amount: amount,
          remaining_balance: Math.max(0, remainingBalance),
          status: 'unpaid'
        });
      }

      setInstallments(newInstallments);
      onCalculate(newInstallments);
    } catch (error) {
      console.error('Error calculating installments:', error);
    } finally {
      setIsCalculating(false);
    }
  };

  // تنسيق التاريخ بالعربية
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'yyyy/MM/dd', { locale: ar });
    } catch (error) {
      return dateString;
    }
  };

  // تنسيق المبلغ بالجنيه المصري
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-EG', {
      style: 'currency',
      currency: 'EGP',
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="mt-4">
      <div className="flex justify-between items-center mb-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={calculateInstallments}
          isLoading={isCalculating}
          disabled={isCalculating || totalAmount <= 0 || installmentsCount <= 0}
        >
          {installments.length > 0 ? 'إعادة حساب الأقساط' : 'حساب الأقساط'}
        </Button>
      </div>

      {installments.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-right text-gray-700 dark:text-gray-300">
            <thead className="text-xs text-gray-700 uppercase bg-gray-100 dark:bg-gray-700 dark:text-gray-300">
              <tr>
                <th className="px-4 py-2">رقم القسط</th>
                <th className="px-4 py-2">تاريخ الاستحقاق</th>
                <th className="px-4 py-2">المبلغ</th>
                <th className="px-4 py-2">الرصيد المتبقي</th>
                <th className="px-4 py-2">الحالة</th>
              </tr>
            </thead>
            <tbody>
              {installments.map((installment) => (
                <tr key={installment.installment_number} className="border-b dark:border-gray-700">
                  <td className="px-4 py-2">{installment.installment_number}</td>
                  <td className="px-4 py-2">{formatDate(installment.due_date)}</td>
                  <td className="px-4 py-2">{formatCurrency(installment.amount)}</td>
                  <td className="px-4 py-2">{formatCurrency(installment.remaining_balance)}</td>
                  <td className="px-4 py-2">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      installment.status === 'paid'
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                        : installment.status === 'partial'
                        ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
                        : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                    }`}>
                      {installment.status === 'paid' ? 'مدفوع' : installment.status === 'partial' ? 'مدفوع جزئياً' : 'غير مدفوع'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded-md">
          <p className="text-center text-gray-500 dark:text-gray-400">
            {totalAmount <= 0 || installmentsCount <= 0
              ? 'يرجى إدخال المبلغ الإجمالي وعدد الأقساط ثم الضغط على زر حساب الأقساط'
              : 'اضغط على زر حساب الأقساط لعرض جدول الأقساط'}
          </p>
        </div>
      )}
    </div>
  );
};

export default InstallmentsCalculator;
