import React from 'react';
import { FILE_OPENING_FEE } from '@/types/student';

interface FinancialSummaryProps {
  feesAmount: number;
  discountAmount: number;
  discountReason?: string | null;
  fileOpeningFee: number;
  advancePayment?: number;
  totalAfterDiscount: number;
  installmentsCount?: number;
  installmentAmount?: number;
}

const FinancialSummary: React.FC<FinancialSummaryProps> = ({
  feesAmount,
  discountAmount,
  discountReason,
  fileOpeningFee,
  advancePayment = 0,
  totalAfterDiscount,
  installmentsCount,
  installmentAmount
}) => {
  // تنسيق المبلغ بالجنيه المصري
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-EG', {
      style: 'currency',
      currency: 'EGP',
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md">
      <h3 className="text-lg font-semibold mb-4">ملخص المعلومات المالية</h3>

      <div className="space-y-2">
        <div className="flex justify-between">
          <span className="text-gray-600 dark:text-gray-400">إجمالي الرسوم الدراسية:</span>
          <span className="font-medium">{formatCurrency(feesAmount)}</span>
        </div>

        {discountAmount > 0 && (
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">
              الخصم {discountReason ? `(${discountReason})` : ''}:
            </span>
            <span className="font-medium text-red-600 dark:text-red-400">
              - {formatCurrency(discountAmount)}
            </span>
          </div>
        )}

        <div className="flex justify-between">
          <span className="text-gray-600 dark:text-gray-400">رسوم فتح الملف:</span>
          <span className="font-medium">{formatCurrency(fileOpeningFee)}</span>
        </div>

        {advancePayment > 0 && (
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">الدفعة المقدمة:</span>
            <span className="font-medium text-green-600 dark:text-green-400">
              - {formatCurrency(advancePayment)}
            </span>
          </div>
        )}

        <div className="border-t border-gray-200 dark:border-gray-700 pt-2 mt-2">
          <div className="flex justify-between font-bold">
            <span>الإجمالي الصافي:</span>
            <span>{formatCurrency(totalAfterDiscount)}</span>
          </div>
        </div>

        {installmentsCount && installmentsCount > 0 && installmentAmount && (
          <div className="border-t border-gray-200 dark:border-gray-700 pt-2 mt-2">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">عدد الأقساط:</span>
              <span className="font-medium">{installmentsCount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">قيمة القسط:</span>
              <span className="font-medium">{formatCurrency(installmentAmount)}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FinancialSummary;
