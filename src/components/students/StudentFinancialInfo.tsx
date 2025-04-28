'use client';

import { useState, useEffect } from 'react';
import { Student, InstallmentData } from '@/types/student';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { formatCurrency } from '@/lib/utils';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { Spinner } from '@/components/ui/Spinner';
import { installmentService } from '@/services/installmentService';
import paymentService from '@/services/paymentService';
import { supabase } from '@/lib/supabase';

interface StudentFinancialInfoProps {
  student: Student;
  onUpdate?: (data: any) => Promise<void>;
}

const StudentFinancialInfo: React.FC<StudentFinancialInfoProps> = ({ student, onUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingInstallments, setIsLoadingInstallments] = useState(false);
  const [isLoadingPayments, setIsLoadingPayments] = useState(false);
  const [installments, setInstallments] = useState<InstallmentData[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [selectedInstallment, setSelectedInstallment] = useState<number | null>(null);
  const [partialPaymentAmount, setPartialPaymentAmount] = useState<number>(0);
  const [showPartialPaymentModal, setShowPartialPaymentModal] = useState(false);
  const [formData, setFormData] = useState({
    fees_amount: student.fees_amount || 0,
    discount_amount: student.discount_amount || 0,
    discount_reason: student.discount_reason || '',
    payment_method: student.payment_method || 'full',
  });

  // حساب الإجمالي بعد الخصم
  const totalAfterDiscount = formData.fees_amount - formData.discount_amount;

  // حساب إجمالي المدفوعات
  const calculateTotalPayments = () => {
    return payments.reduce((total, payment) => total + payment.amount, 0);
  };

  // حساب المبلغ المتبقي بعد خصم جميع المدفوعات
  const calculateRemainingAmount = () => {
    const totalAfterDiscount = student.total_after_discount || 0;
    const totalPayments = calculateTotalPayments();
    return Math.max(0, totalAfterDiscount - totalPayments);
  };

  // تحميل الأقساط والمدفوعات عند تحميل المكون
  useEffect(() => {
    if (student.payment_method === 'installments') {
      loadInstallments();
    }

    // تحميل سجلات المدفوعات
    loadPayments();

    // إعداد الاستماع للتغييرات في الوقت الفعلي
    setupRealTimeSubscriptions();

    // تنظيف الاشتراكات عند إلغاء تحميل المكون
    return () => {
      cleanupSubscriptions();
    };
  }, [student.id, student.payment_method]);

  // إعداد الاستماع للتغييرات في الوقت الفعلي
  const setupRealTimeSubscriptions = () => {
    // الاستماع للتغييرات في جدول الأقساط
    const installmentsSubscription = supabase
      .channel('installments-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'installments',
          filter: `student_id=eq.${student.id}`
        },
        (payload) => {
          console.log('Installments change detected:', payload);
          // إعادة تحميل الأقساط عند حدوث أي تغيير
          loadInstallments();
        }
      )
      .subscribe();

    // الاستماع للتغييرات في جدول المدفوعات
    const paymentsSubscription = supabase
      .channel('payments-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'payment_records',
          filter: `student_id=eq.${student.id}`
        },
        (payload) => {
          console.log('Payments change detected:', payload);
          // إعادة تحميل المدفوعات عند حدوث أي تغيير
          loadPayments();
        }
      )
      .subscribe();

    // تخزين الاشتراكات للتنظيف لاحقًا
    window.activeSubscriptions = window.activeSubscriptions || {};
    window.activeSubscriptions[`installments-${student.id}`] = installmentsSubscription;
    window.activeSubscriptions[`payments-${student.id}`] = paymentsSubscription;
  };

  // تنظيف الاشتراكات
  const cleanupSubscriptions = () => {
    if (window.activeSubscriptions) {
      const installmentsKey = `installments-${student.id}`;
      const paymentsKey = `payments-${student.id}`;

      if (window.activeSubscriptions[installmentsKey]) {
        supabase.removeChannel(window.activeSubscriptions[installmentsKey]);
        delete window.activeSubscriptions[installmentsKey];
      }

      if (window.activeSubscriptions[paymentsKey]) {
        supabase.removeChannel(window.activeSubscriptions[paymentsKey]);
        delete window.activeSubscriptions[paymentsKey];
      }
    }
  };

  // تحميل الأقساط
  const loadInstallments = async () => {
    setIsLoadingInstallments(true);
    try {
      // إذا كانت الأقساط موجودة في بيانات الطالب، استخدمها
      if (student.installments_data && student.installments_data.length > 0) {
        setInstallments(student.installments_data);
      } else {
        // وإلا، قم بجلبها من قاعدة البيانات
        const { data, error } = await installmentService.getStudentInstallments(student.id);
        if (error) {
          console.error('Error loading installments:', error);
        } else if (data) {
          setInstallments(data);
        }
      }
    } catch (error) {
      console.error('Error loading installments:', error);
    } finally {
      setIsLoadingInstallments(false);
    }
  };

  // تحميل سجلات المدفوعات
  const loadPayments = async () => {
    setIsLoadingPayments(true);
    try {
      const { data, error } = await paymentService.getStudentPayments(student.id);
      if (error) {
        console.error('Error loading payments:', error);
      } else if (data) {
        setPayments(data);
      }
    } catch (error) {
      console.error('Error loading payments:', error);
    } finally {
      setIsLoadingPayments(false);
    }
  };

  // تحديث بيانات النموذج
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;

    if (name === 'fees_amount' || name === 'discount_amount') {
      setFormData(prev => ({
        ...prev,
        [name]: parseFloat(value) || 0
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  // حفظ التغييرات
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!onUpdate) {
      setIsEditing(false);
      return;
    }

    setIsSubmitting(true);

    try {
      await onUpdate({
        id: student.id,
        ...formData,
        total_after_discount: totalAfterDiscount,
      });

      setIsEditing(false);

      // إعادة تحميل الأقساط بعد التحديث
      if (formData.payment_method === 'installments') {
        setTimeout(() => {
          loadInstallments();
        }, 1000);
      }
    } catch (error) {
      console.error('Error updating financial info:', error);
      alert('حدث خطأ أثناء تحديث البيانات المالية');
    } finally {
      setIsSubmitting(false);
    }
  };

  // تحديث حالة القسط
  const handleUpdateInstallmentStatus = async (installmentNumber: number, newStatus: 'paid' | 'unpaid' | 'partial') => {
    try {
      setIsSubmitting(true);

      const installment = installments.find(i => i.installment_number === installmentNumber);
      if (!installment) {
        alert('لم يتم العثور على القسط');
        return;
      }

      // تحديث حالة القسط في قاعدة البيانات
      const { success, error } = await installmentService.updateInstallmentStatus(
        student.id,
        installmentNumber,
        newStatus,
        {
          payment_date: new Date().toISOString().split('T')[0],
          payment_amount: installment.amount,
          payment_method: 'cash',
          notes: `تم تحديث الحالة إلى ${newStatus === 'paid' ? 'مدفوع' : newStatus === 'partial' ? 'مدفوع جزئياً' : 'غير مدفوع'}`
        }
      );

      if (!success) {
        console.error('Error updating installment status:', error);
        alert('حدث خطأ أثناء تحديث حالة القسط');
        return;
      }

      // إذا تم تحديث الحالة إلى مدفوع، قم بإنشاء سجل دفع
      if (newStatus === 'paid') {
        const paymentRecord = {
          student_id: student.id,
          amount: installment.amount,
          payment_date: new Date().toISOString(),
          payment_type: 'installment',
          payment_method: 'cash',
          notes: `دفع القسط رقم ${installmentNumber}`
        };

        const { error: paymentError } = await paymentService.createPayment(paymentRecord);
        if (paymentError) {
          console.error('Error creating payment record:', paymentError);
        }
      }

      // تحديث الحالة المالية للطالب
      await installmentService.updateStudentFinancialStatus(student.id);

      // إعادة تحميل الأقساط
      loadInstallments();

      alert('تم تحديث حالة القسط بنجاح');
    } catch (error) {
      console.error('Error updating installment status:', error);
      alert('حدث خطأ أثناء تحديث حالة القسط');
    } finally {
      setIsSubmitting(false);
    }
  };

  // إضافة دفعة جزئية للقسط
  const handleAddPartialPayment = async (installmentNumber: number, amount: number) => {
    try {
      setIsSubmitting(true);

      const installment = installments.find(i => i.installment_number === installmentNumber);
      if (!installment) {
        alert('لم يتم العثور على القسط');
        return;
      }

      // التحقق من صحة المبلغ
      if (amount <= 0 || amount > installment.amount) {
        alert('يرجى إدخال مبلغ صحيح (أكبر من 0 وأقل من أو يساوي قيمة القسط)');
        return;
      }

      // إنشاء سجل دفع للدفعة الجزئية
      const paymentRecord = {
        student_id: student.id,
        amount: amount,
        payment_date: new Date().toISOString(),
        payment_type: 'installment',
        payment_method: 'cash',
        notes: `دفعة جزئية للقسط رقم ${installmentNumber}`
      };

      const { error: paymentError } = await paymentService.createPayment(paymentRecord);
      if (paymentError) {
        console.error('Error creating payment record:', paymentError);
        alert('حدث خطأ أثناء إنشاء سجل الدفع');
        return;
      }

      // تحديث حالة القسط إلى مدفوع جزئياً
      const newStatus = amount === installment.amount ? 'paid' : 'partial';
      const { success, error } = await installmentService.updateInstallmentStatus(
        student.id,
        installmentNumber,
        newStatus,
        {
          payment_date: new Date().toISOString().split('T')[0],
          payment_amount: amount,
          payment_method: 'cash',
          notes: `تم دفع ${amount} جنيه من القسط`
        }
      );

      if (!success) {
        console.error('Error updating installment status:', error);
        alert('حدث خطأ أثناء تحديث حالة القسط');
        return;
      }

      // تحديث الحالة المالية للطالب
      await installmentService.updateStudentFinancialStatus(student.id);

      // إعادة تحميل الأقساط والمدفوعات
      loadInstallments();
      loadPayments();

      alert('تم تسجيل الدفعة بنجاح');
    } catch (error) {
      console.error('Error adding partial payment:', error);
      alert('حدث خطأ أثناء إضافة الدفعة');
    } finally {
      setIsSubmitting(false);
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

  // تحويل حالة الدفع إلى نص عربي
  const getFinancialStatusText = (status?: string) => {
    switch (status) {
      case 'paid':
        return 'مدفوع بالكامل';
      case 'partial':
        return 'مدفوع جزئياً';
      case 'unpaid':
        return 'غير مدفوع';
      default:
        return 'غير محدد';
    }
  };

  // تحويل طريقة الدفع إلى نص عربي
  const getPaymentMethodText = (method?: string) => {
    return method === 'installments' ? 'أقساط' : 'دفعة واحدة';
  };

  // تحديد لون حالة الدفع
  const getFinancialStatusColor = (status?: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300';
      case 'partial':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-300';
      case 'unpaid':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300';
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>المعلومات المالية</CardTitle>
        {onUpdate && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsEditing(!isEditing)}
            disabled={isSubmitting}
          >
            {isEditing ? 'إلغاء' : 'تعديل'}
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {isEditing ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  الرسوم الدراسية (جنيه)
                </label>
                <input
                  type="number"
                  name="fees_amount"
                  value={formData.fees_amount}
                  onChange={handleChange}
                  className="w-full rounded-md border border-gray-300 bg-white p-2 text-sm focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:bg-gray-950"
                  min="0"
                  step="0.01"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  قيمة الخصم (جنيه)
                </label>
                <input
                  type="number"
                  name="discount_amount"
                  value={formData.discount_amount}
                  onChange={handleChange}
                  className="w-full rounded-md border border-gray-300 bg-white p-2 text-sm focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:bg-gray-950"
                  min="0"
                  max={formData.fees_amount}
                  step="0.01"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  سبب الخصم
                </label>
                <input
                  type="text"
                  name="discount_reason"
                  value={formData.discount_reason}
                  onChange={handleChange}
                  className="w-full rounded-md border border-gray-300 bg-white p-2 text-sm focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:bg-gray-950"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  طريقة السداد
                </label>
                <select
                  name="payment_method"
                  value={formData.payment_method}
                  onChange={handleChange}
                  className="w-full rounded-md border border-gray-300 bg-white p-2 text-sm focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:bg-gray-950"
                >
                  <option value="full">دفعة واحدة</option>
                  <option value="installments">أقساط</option>
                </select>
              </div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded-md">
              <div className="flex justify-between items-center">
                <p className="font-medium">الإجمالي بعد الخصم:</p>
                <p className="font-bold text-lg">{formatCurrency(totalAfterDiscount)} جنيه</p>
              </div>
            </div>

            <div className="flex justify-end space-x-2 space-x-reverse">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditing(false)}
                disabled={isSubmitting}
              >
                إلغاء
              </Button>
              <Button
                type="submit"
                variant="primary"
                isLoading={isSubmitting}
                disabled={isSubmitting}
              >
                حفظ التغييرات
              </Button>
            </div>
          </form>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">الرسوم الدراسية</p>
                <p className="font-medium">{formatCurrency(student.fees_amount || 0)} جنيه</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">قيمة الخصم</p>
                <p className="font-medium">{formatCurrency(student.discount_amount || 0)} جنيه</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">سبب الخصم</p>
                <p className="font-medium">{student.discount_reason || 'لا يوجد'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">طريقة السداد</p>
                <p className="font-medium">{getPaymentMethodText(student.payment_method)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">الدفعة المقدمة</p>
                <p className="font-medium">{formatCurrency(student.advance_payment || 0)} جنيه</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">الإجمالي بعد الخصم</p>
                <p className="font-medium">{formatCurrency(student.total_after_discount || (student.fees_amount || 0) - (student.discount_amount || 0))} جنيه</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">حالة الدفع</p>
                <span className={`inline-block px-2 py-1 text-xs rounded-full ${getFinancialStatusColor(student.financial_status)}`}>
                  {getFinancialStatusText(student.financial_status)}
                </span>
              </div>
            </div>

            {student.payment_method === 'installments' && (
              <div className="mt-6">
                <h3 className="font-medium mb-2">تفاصيل الأقساط</h3>
                {isLoadingInstallments ? (
                  <div className="flex justify-center items-center py-4">
                    <Spinner size="md" />
                  </div>
                ) : installments.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-right text-gray-700 dark:text-gray-300">
                      <thead className="text-xs text-gray-700 uppercase bg-gray-100 dark:bg-gray-700 dark:text-gray-300">
                        <tr>
                          <th className="px-4 py-2">رقم القسط</th>
                          <th className="px-4 py-2">تاريخ الاستحقاق</th>
                          <th className="px-4 py-2">المبلغ</th>
                          <th className="px-4 py-2">الحالة</th>
                          <th className="px-4 py-2">الإجراءات</th>
                        </tr>
                      </thead>
                      <tbody>
                        {installments.map((installment) => (
                          <tr key={installment.installment_number} className="border-b dark:border-gray-700">
                            <td className="px-4 py-2">{installment.installment_number}</td>
                            <td className="px-4 py-2">{formatDate(installment.due_date)}</td>
                            <td className="px-4 py-2">{formatCurrency(installment.amount)} جنيه</td>
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
                            <td className="px-4 py-2">
                              {onUpdate && (
                                <div className="flex space-x-1 rtl:space-x-reverse">
                                  {installment.status !== 'paid' && (
                                    <>
                                      <Button
                                        variant="success"
                                        size="sm"
                                        onClick={() => handleUpdateInstallmentStatus(installment.installment_number, 'paid')}
                                        disabled={isSubmitting}
                                      >
                                        تم الدفع
                                      </Button>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                          setSelectedInstallment(installment.installment_number);
                                          setPartialPaymentAmount(installment.amount / 2); // اقتراح نصف المبلغ كدفعة جزئية
                                          setShowPartialPaymentModal(true);
                                        }}
                                        disabled={isSubmitting}
                                      >
                                        دفعة جزئية
                                      </Button>
                                    </>
                                  )}
                                  {installment.status !== 'unpaid' && (
                                    <Button
                                      variant="danger"
                                      size="sm"
                                      onClick={() => handleUpdateInstallmentStatus(installment.installment_number, 'unpaid')}
                                      disabled={isSubmitting}
                                    >
                                      إلغاء الدفع
                                    </Button>
                                  )}
                                </div>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded-md">
                    <p className="text-center text-gray-500 dark:text-gray-400">
                      لا توجد أقساط مسجلة لهذا الطالب
                    </p>
                  </div>
                )}
              </div>
            )}

            <div className="mt-6">
              <h3 className="font-medium mb-2">سجل المدفوعات</h3>
              {isLoadingPayments ? (
                <div className="flex justify-center items-center py-4">
                  <Spinner size="md" />
                </div>
              ) : payments.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-right text-gray-700 dark:text-gray-300">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-100 dark:bg-gray-700 dark:text-gray-300">
                      <tr>
                        <th className="px-4 py-2">التاريخ</th>
                        <th className="px-4 py-2">المبلغ</th>
                        <th className="px-4 py-2">نوع الدفع</th>
                        <th className="px-4 py-2">طريقة الدفع</th>
                        <th className="px-4 py-2">ملاحظات</th>
                      </tr>
                    </thead>
                    <tbody>
                      {payments.map((payment) => (
                        <tr key={payment.id} className="border-b dark:border-gray-700">
                          <td className="px-4 py-2">{formatDate(payment.payment_date)}</td>
                          <td className="px-4 py-2">{formatCurrency(payment.amount)} جنيه</td>
                          <td className="px-4 py-2">
                            {payment.payment_type === 'advance_payment' ? 'دفعة مقدمة' :
                             payment.payment_type === 'installment' ? 'قسط' : 'أخرى'}
                          </td>
                          <td className="px-4 py-2">
                            {payment.payment_method === 'cash' ? 'نقدي' :
                             payment.payment_method === 'bank_transfer' ? 'تحويل بنكي' :
                             payment.payment_method === 'check' ? 'شيك' : 'بطاقة ائتمان'}
                          </td>
                          <td className="px-4 py-2">{payment.notes || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-gray-100 dark:bg-gray-700 font-bold">
                      <tr>
                        <td colSpan={1} className="px-4 py-2 text-right">إجمالي المدفوعات:</td>
                        <td className="px-4 py-2">{formatCurrency(calculateTotalPayments())} جنيه</td>
                        <td colSpan={3}></td>
                      </tr>
                    </tfoot>
                  </table>

                  {/* ملخص المدفوعات والمبلغ المتبقي */}
                  <div className="mt-4 bg-gray-50 dark:bg-gray-900 p-4 rounded-md">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">الإجمالي بعد الخصم</p>
                        <p className="font-medium">{formatCurrency(student.total_after_discount || 0)} جنيه</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">إجمالي المدفوعات</p>
                        <p className="font-medium">{formatCurrency(calculateTotalPayments())} جنيه</p>
                      </div>
                      <div className="md:col-span-2">
                        <p className="text-sm text-gray-500 dark:text-gray-400">المبلغ المتبقي</p>
                        <p className="font-bold text-lg">{formatCurrency(calculateRemainingAmount())} جنيه</p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded-md">
                  <p className="text-center text-gray-500 dark:text-gray-400">
                    لا توجد مدفوعات مسجلة لهذا الطالب
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>

      {/* نافذة منبثقة لإضافة دفعة جزئية */}
      {showPartialPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">إضافة دفعة جزئية</h3>
            <p className="mb-4">
              إضافة دفعة جزئية للقسط رقم {selectedInstallment} بقيمة إجمالية {
                formatCurrency(installments.find(i => i.installment_number === selectedInstallment)?.amount || 0)
              }
            </p>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                قيمة الدفعة (جنيه)
              </label>
              <input
                type="number"
                value={partialPaymentAmount}
                onChange={(e) => setPartialPaymentAmount(parseFloat(e.target.value) || 0)}
                className="w-full rounded-md border border-gray-300 bg-white p-2 text-sm focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:bg-gray-950"
                min="1"
                max={installments.find(i => i.installment_number === selectedInstallment)?.amount || 0}
                step="0.01"
              />
            </div>

            <div className="flex justify-end space-x-2 space-x-reverse">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowPartialPaymentModal(false);
                  setSelectedInstallment(null);
                  setPartialPaymentAmount(0);
                }}
                disabled={isSubmitting}
              >
                إلغاء
              </Button>
              <Button
                type="button"
                variant="primary"
                onClick={() => {
                  if (selectedInstallment !== null) {
                    handleAddPartialPayment(selectedInstallment, partialPaymentAmount);
                    setShowPartialPaymentModal(false);
                    setSelectedInstallment(null);
                    setPartialPaymentAmount(0);
                  }
                }}
                isLoading={isSubmitting}
                disabled={isSubmitting || partialPaymentAmount <= 0 || (selectedInstallment !== null && partialPaymentAmount > (installments.find(i => i.installment_number === selectedInstallment)?.amount || 0))}
              >
                تأكيد الدفع
              </Button>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
};

export default StudentFinancialInfo;
