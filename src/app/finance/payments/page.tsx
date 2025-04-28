'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/Table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/Dialog';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Label } from '@/components/ui/Label';
import { Textarea } from '@/components/ui/Textarea';
import { PlusIcon, PencilIcon, TrashIcon, ArrowPathIcon, PrinterIcon, XCircleIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { paymentService } from '@/services/paymentService';
import { receiptService } from '@/services/receiptService';
import { realtimeService } from '@/services/realtimeService';
import { showToast } from '@/components/ui/ToastContainer';
import Spinner from '@/components/ui/Spinner';
import { supabase } from '@/lib/supabase';

/**
 * صفحة إدارة المدفوعات
 */
export default function PaymentsPage() {
  const [payments, setPayments] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [editingPayment, setEditingPayment] = useState<any>(null);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [filters, setFilters] = useState({
    student_id: '',
    payment_type: '',
    payment_method: ''
  });

  // حالة البحث عن الطلاب في النموذج
  const [studentSearchQuery, setStudentSearchQuery] = useState<string>('');

  // حالة البحث في جدول المدفوعات
  const [tableSearchQuery, setTableSearchQuery] = useState<string>('');

  // حالة مربع حوار التفاصيل المالية للطالب
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState<boolean>(false);
  const [selectedStudentDetails, setSelectedStudentDetails] = useState<any>(null);
  const [studentPayments, setStudentPayments] = useState<any[]>([]);
  const [isLoadingDetails, setIsLoadingDetails] = useState<boolean>(false);

  // تصفية الطلاب حسب البحث
  const filteredStudents = useMemo(() => {
    if (!studentSearchQuery.trim()) {
      return students;
    }

    const query = studentSearchQuery.trim().toLowerCase();
    return students.filter(student =>
      student.full_name.toLowerCase().includes(query)
    );
  }, [students, studentSearchQuery]);

  // تصفية المدفوعات حسب البحث
  const filteredPayments = useMemo(() => {
    if (!tableSearchQuery.trim()) {
      return payments;
    }

    const query = tableSearchQuery.trim().toLowerCase();
    return payments.filter(payment => {
      const studentName = payment.students?.full_name || '';
      const paymentType = getPaymentTypeName(payment.payment_type);
      const paymentMethod = getPaymentMethodName(payment.payment_method);
      const description = payment.description || '';

      return (
        studentName.toLowerCase().includes(query) ||
        paymentType.toLowerCase().includes(query) ||
        paymentMethod.toLowerCase().includes(query) ||
        description.toLowerCase().includes(query) ||
        payment.amount.toString().includes(query)
      );
    });
  }, [payments, tableSearchQuery]);
  const [formData, setFormData] = useState({
    student_id: '',
    payment_date: new Date().toISOString().split('T')[0],
    amount: '',
    payment_type: 'tuition_fee',
    payment_method: 'cash',
    description: '',
    receipt_number: ''
  });

  // مرجع للاشتراك في التغييرات في الوقت الحقيقي
  const realtimeSubscriptionRef = useRef<any>(null);

  // تحميل البيانات
  useEffect(() => {
    loadPayments();
    loadStudents();

    // الاشتراك في التغييرات في الوقت الحقيقي لجدول المدفوعات
    const paymentSubscription = realtimeService.subscribeToTable(
      { table: 'payment_records' },
      (payload) => {
        console.log('Realtime payment update:', payload.eventType);
        loadPayments();
        // عرض إشعار بالتحديث
        showToast('تم تحديث بيانات المدفوعات', 'info');
      }
    );

    // الاشتراك في التغييرات في الوقت الحقيقي لجدول الطلاب
    const studentsSubscription = realtimeService.subscribeToTable(
      { table: 'students' },
      (payload) => {
        if (payload.eventType === 'UPDATE') {
          console.log('Realtime student update:', payload);
          // تحديث بيانات الطلاب عند تغيير البيانات المالية
          loadStudents();
        }
      }
    );

    // تخزين الاشتراكات للتنظيف لاحقًا
    realtimeSubscriptionRef.current = {
      payments: paymentSubscription,
      students: studentsSubscription
    };

    // تنظيف الاشتراكات عند إلغاء تحميل المكون
    return () => {
      if (realtimeSubscriptionRef.current) {
        if (realtimeSubscriptionRef.current.payments) {
          realtimeService.unsubscribe(realtimeSubscriptionRef.current.payments);
        }
        if (realtimeSubscriptionRef.current.students) {
          realtimeService.unsubscribe(realtimeSubscriptionRef.current.students);
        }
      }
    };
  }, [currentPage, filters]);

  // تحميل المدفوعات
  const loadPayments = async () => {
    setIsLoading(true);

    try {
      // حساب الإزاحة للصفحة
      const offset = (currentPage - 1) * 10;

      // بناء الاستعلام
      let query = supabase
        .from('payment_records')
        .select('*, students:student_id(id, full_name)', { count: 'exact' });

      // إضافة الفلاتر
      if (filters.student_id) {
        query = query.eq('student_id', filters.student_id);
      }

      if (filters.payment_type) {
        query = query.eq('payment_type', filters.payment_type);
      }

      if (filters.payment_method) {
        query = query.eq('payment_method', filters.payment_method);
      }

      // إضافة الترتيب والحدود
      const { data, count, error } = await query
        .order('payment_date', { ascending: false })
        .range(offset, offset + 9);

      if (error) {
        throw error;
      }

      console.log('Loaded payments:', data);

      setPayments(data || []);
      setTotalCount(count || 0);
    } catch (error) {
      console.error('Error loading payments:', error);
      showToast('حدث خطأ أثناء تحميل المدفوعات', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // تحميل الطلاب
  const loadStudents = async () => {
    try {
      const { data, error } = await supabase
        .from('students')
        .select('id, full_name')
        .order('full_name');

      if (error) {
        throw error;
      }

      setStudents(data || []);
    } catch (error) {
      console.error('Error loading students:', error);
      showToast('حدث خطأ أثناء تحميل بيانات الطلاب', 'error');
    }
  };

  // فتح مربع حوار إضافة/تعديل
  const openDialog = (payment?: any) => {
    // إعادة تعيين النموذج أولاً بغض النظر عن نوع العملية
    setFormData({
      student_id: '',
      payment_date: new Date().toISOString().split('T')[0],
      amount: '',
      payment_type: 'tuition_fee',
      payment_method: 'cash',
      description: '',
      receipt_number: ''
    });

    // إعادة تعيين قيمة البحث
    setStudentSearchQuery('');

    // ثم تعيين بيانات المدفوعة إذا كانت عملية تعديل
    if (payment) {
      // تعديل مدفوعة موجودة
      setTimeout(() => {
        setEditingPayment(payment);

        // تعيين بيانات المدفوعة
        setFormData({
          student_id: payment.student_id,
          payment_date: new Date(payment.payment_date).toISOString().split('T')[0],
          amount: payment.amount.toString(),
          payment_type: payment.payment_type,
          payment_method: payment.payment_method,
          description: payment.description || '',
          receipt_number: payment.receipt_number || ''
        });

        // تعيين قيمة البحث باسم الطالب
        const selectedStudent = students.find(s => s.id === payment.student_id);
        if (selectedStudent) {
          setStudentSearchQuery(selectedStudent.full_name);
        }
      }, 50);
    } else {
      // إضافة مدفوعة جديدة
      setEditingPayment(null);
    }

    setIsDialogOpen(true);
  };

  // تغيير قيمة الحقل
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    // إذا تم تغيير الطالب من القائمة المنسدلة، قم بتحديث قيمة البحث
    if (name === 'student_id' && value) {
      const selectedStudent = students.find(s => s.id === value);
      if (selectedStudent) {
        setStudentSearchQuery(selectedStudent.full_name);
      }
    }
  };

  // تغيير قيمة الفلتر
  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
    setCurrentPage(1);

    // إذا تم تغيير الطالب من القائمة المنسدلة، قم بتحديث قيمة البحث
    if (name === 'student_id' && value) {
      const selectedStudent = students.find(s => s.id === value);
      if (selectedStudent) {
        setStudentSearchQuery(selectedStudent.full_name);
      }
    } else if (name === 'student_id' && !value) {
      // إذا تم اختيار "جميع الطلاب"، قم بمسح البحث
      setStudentSearchQuery('');
    }
  };

  // حفظ المدفوعة
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // حفظ نسخة من البيانات قبل إعادة تعيين النموذج
    const currentFormData = { ...formData };

    try {
      // التحقق من صحة البيانات
      if (!currentFormData.student_id || !currentFormData.payment_date || !currentFormData.amount || !currentFormData.payment_type || !currentFormData.payment_method) {
        showToast('يرجى ملء جميع الحقول المطلوبة', 'error');
        setIsSubmitting(false);
        return;
      }

      // تفريغ النموذج فورًا بعد التحقق من صحة البيانات
      setFormData({
        student_id: '',
        payment_date: new Date().toISOString().split('T')[0],
        amount: '',
        payment_type: 'tuition_fee',
        payment_method: 'cash',
        description: '',
        receipt_number: ''
      });

      // تحويل البيانات إلى الشكل المتوافق مع نموذج البيانات
      const paymentData = {
        student_id: currentFormData.student_id,
        payment_date: new Date(currentFormData.payment_date).toISOString(),
        amount: parseFloat(currentFormData.amount),
        payment_type: currentFormData.payment_type,
        payment_method: currentFormData.payment_method,
        notes: currentFormData.description || '',
        receipt_number: currentFormData.receipt_number || '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      console.log('Payment data to be saved:', paymentData);

      // استخدام Supabase مباشرة بدلاً من خدمة المدفوعات
      let result;

      if (editingPayment) {
        // تحديث مدفوعة موجودة
        const { data, error } = await supabase
          .from('payment_records')
          .update({
            ...paymentData,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingPayment.id)
          .select()
          .single();

        result = { data, error };
      } else {
        // إنشاء مدفوعة جديدة
        const { data, error } = await supabase
          .from('payment_records')
          .insert([paymentData])
          .select()
          .single();

        result = { data, error };
      }

      console.log('Payment result:', result);

      if (result.error) {
        throw result.error;
      }

      // إنشاء سند قبض
      if (result.data && !editingPayment) {
        try {
          const receiptData = {
            receipt_date: formData.payment_date,
            receipt_type: 'income',
            amount: parseFloat(formData.amount),
            entity_type: 'student',
            entity_id: formData.student_id,
            description: `دفعة ${getPaymentTypeName(formData.payment_type)} - ${getStudentName(formData.student_id)}`
          };

          const receiptResult = await receiptService.createReceipt(receiptData);

          if (receiptResult.error) {
            console.error('Error creating receipt:', receiptResult.error);
          }
        } catch (receiptError) {
          console.error('Error creating receipt:', receiptError);
        }
      }

      // تحديث البيانات المالية للطالب
      try {
        await updateStudentFinancialData(formData.student_id);
      } catch (error) {
        console.error('Error updating student financial data:', error);
      }

      // إغلاق مربع الحوار
      setIsDialogOpen(false);

      // إعادة تعيين حالة التعديل
      setEditingPayment(null);

      // تحديث قائمة المدفوعات
      loadPayments();

      // تأكد من تفريغ النموذج مرة أخرى بعد الإغلاق
      setTimeout(() => {
        setFormData({
          student_id: '',
          payment_date: new Date().toISOString().split('T')[0],
          amount: '',
          payment_type: 'tuition_fee',
          payment_method: 'cash',
          description: '',
          receipt_number: ''
        });
      }, 100);

      // عرض رسالة نجاح
      showToast(
        editingPayment
          ? 'تم تحديث المدفوعة بنجاح'
          : 'تم إنشاء المدفوعة بنجاح',
        'success'
      );
    } catch (error) {
      console.error('Error saving payment:', error);

      // عرض رسالة خطأ أكثر تفصيلاً
      let errorMessage = 'حدث خطأ أثناء حفظ المدفوعة';

      if (error && typeof error === 'object') {
        console.log('Error object:', JSON.stringify(error, null, 2));

        if ('message' in error) {
          errorMessage += `: ${error.message}`;
        } else if ('details' in error) {
          errorMessage += `: ${error.details}`;
        } else if ('hint' in error) {
          errorMessage += `: ${error.hint}`;
        } else if ('code' in error) {
          errorMessage += ` (كود الخطأ: ${error.code})`;
        }
      }

      showToast(errorMessage, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // حذف مدفوعة
  const handleDelete = async (id: string) => {
    if (!window.confirm('هل أنت متأكد من رغبتك في حذف هذه المدفوعة؟')) {
      return;
    }

    try {
      // الحصول على معرف الطالب قبل حذف المدفوعة
      const { data: payment, error: fetchError } = await supabase
        .from('payment_records')
        .select('student_id')
        .eq('id', id)
        .single();

      if (fetchError) {
        throw fetchError;
      }

      const studentId = payment?.student_id;

      // حذف المدفوعة
      const { error } = await supabase
        .from('payment_records')
        .delete()
        .eq('id', id);

      if (error) {
        throw error;
      }

      // تحديث البيانات المالية للطالب بعد الحذف
      if (studentId) {
        try {
          await updateStudentFinancialData(studentId);
        } catch (updateError) {
          console.error('Error updating student financial data after deletion:', updateError);
        }
      }

      // تحديث القائمة
      loadPayments();

      // عرض رسالة نجاح
      showToast('تم حذف المدفوعة بنجاح', 'success');
    } catch (error) {
      console.error('Error deleting payment:', error);

      // عرض رسالة خطأ أكثر تفصيلاً
      let errorMessage = 'حدث خطأ أثناء حذف المدفوعة';

      if (error && typeof error === 'object') {
        console.log('Error object:', JSON.stringify(error, null, 2));

        if ('message' in error) {
          errorMessage += `: ${error.message}`;
        } else if ('details' in error) {
          errorMessage += `: ${error.details}`;
        } else if ('hint' in error) {
          errorMessage += `: ${error.hint}`;
        }
      }

      showToast(errorMessage, 'error');
    }
  };

  // طباعة إيصال
  const handlePrintReceipt = async (payment: any) => {
    try {
      // البحث عن سند قبض مرتبط بالمدفوعة
      const { data: receipts, error } = await supabase
        .from('receipts')
        .select('*')
        .eq('entity_type', 'student')
        .eq('entity_id', payment.student_id)
        .eq('amount', payment.amount)
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) {
        throw error;
      }

      if (receipts && receipts.length > 0) {
        // طباعة السند الموجود
        receiptService.printReceipt(receipts[0]);
      } else {
        // إنشاء سند جديد وطباعته
        const receiptData = {
          receipt_date: payment.payment_date,
          receipt_type: 'income',
          amount: parseFloat(payment.amount),
          entity_type: 'student',
          entity_id: payment.student_id,
          description: `دفعة ${getPaymentTypeName(payment.payment_type)} - ${getStudentName(payment.student_id)}`
        };

        const { data: newReceipt, error: createError } = await receiptService.createReceipt(receiptData);

        if (createError) {
          throw createError;
        }

        if (newReceipt) {
          receiptService.printReceipt(newReceipt);
        }
      }
    } catch (error) {
      console.error('Error printing receipt:', error);
      showToast('حدث خطأ أثناء طباعة الإيصال', 'error');
    }
  };

  // عرض التفاصيل المالية للطالب
  const showStudentFinancialDetails = async (studentId: string) => {
    setIsLoadingDetails(true);
    setIsDetailsDialogOpen(true);

    try {
      // تحميل بيانات الطالب
      const { data: studentData, error: studentError } = await supabase
        .from('students')
        .select('*')
        .eq('id', studentId)
        .single();

      if (studentError) {
        throw studentError;
      }

      // تحميل مدفوعات الطالب
      const { data: paymentsData, error: paymentsError } = await supabase
        .from('payment_records')
        .select('*')
        .eq('student_id', studentId)
        .order('payment_date', { ascending: false });

      if (paymentsError) {
        throw paymentsError;
      }

      // تعيين البيانات
      setSelectedStudentDetails(studentData);
      setStudentPayments(paymentsData || []);

    } catch (error) {
      console.error('Error loading student financial details:', error);
      showToast('حدث خطأ أثناء تحميل البيانات المالية للطالب', 'error');
    } finally {
      setIsLoadingDetails(false);
    }
  };

  // طباعة البيانات المالية للطالب
  const printStudentFinancialDetails = () => {
    if (!selectedStudentDetails) return;

    try {
      // حساب إجمالي المدفوعات من سجل المدفوعات
      const totalPaymentsFromRecords = studentPayments.reduce((sum, payment) => sum + Number(payment.amount || 0), 0);

      // حساب الرسوم الإجمالية والمبلغ المتبقي
      const totalFees = Number(selectedStudentDetails.fees_amount || 0);
      const totalDiscount = Number(selectedStudentDetails.discount_amount || 0);
      const netFees = totalFees - totalDiscount; // صافي الرسوم بعد الخصم
      const remainingAmount = netFees - totalPaymentsFromRecords; // المبلغ المتبقي

      // إنشاء محتوى الطباعة
      const printContent = document.createElement('div');
      printContent.innerHTML = `
        <div style="direction: rtl; text-align: right; font-family: Arial, sans-serif; padding: 20px;">
          <div style="text-align: center; margin-bottom: 20px;">
            <h1 style="margin: 0;">البيانات المالية للطالب</h1>
            <h2 style="margin: 10px 0;">${selectedStudentDetails.full_name}</h2>
          </div>

          <div style="margin-bottom: 20px;">
            <h3>ملخص البيانات المالية</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <th style="border: 1px solid #ddd; padding: 8px; text-align: right; background-color: #f2f2f2;">إجمالي الرسوم</th>
                <td style="border: 1px solid #ddd; padding: 8px;">${formatCurrency(totalFees)}</td>
              </tr>
              <tr>
                <th style="border: 1px solid #ddd; padding: 8px; text-align: right; background-color: #f2f2f2;">الخصم</th>
                <td style="border: 1px solid #ddd; padding: 8px;">${formatCurrency(totalDiscount)}</td>
              </tr>
              <tr>
                <th style="border: 1px solid #ddd; padding: 8px; text-align: right; background-color: #f2f2f2;">صافي الرسوم بعد الخصم</th>
                <td style="border: 1px solid #ddd; padding: 8px; font-weight: bold;">${formatCurrency(netFees)}</td>
              </tr>
              <tr>
                <th style="border: 1px solid #ddd; padding: 8px; text-align: right; background-color: #f2f2f2;">إجمالي المدفوعات</th>
                <td style="border: 1px solid #ddd; padding: 8px;">${formatCurrency(totalPaymentsFromRecords)}</td>
              </tr>
              <tr>
                <th style="border: 1px solid #ddd; padding: 8px; text-align: right; background-color: #f2f2f2;">المبلغ المتبقي</th>
                <td style="border: 1px solid #ddd; padding: 8px; font-weight: bold; ${remainingAmount > 0 ? 'color: #e53e3e;' : 'color: #38a169;'}">${formatCurrency(remainingAmount > 0 ? remainingAmount : 0)}</td>
              </tr>
              <tr>
                <th style="border: 1px solid #ddd; padding: 8px; text-align: right; background-color: #f2f2f2;">الحالة المالية</th>
                <td style="border: 1px solid #ddd; padding: 8px;">${getFinancialStatusName(selectedStudentDetails.financial_status || 'unpaid')}</td>
              </tr>
            </table>
          </div>

          <div>
            <h3>سجل المدفوعات</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <thead>
                <tr>
                  <th style="border: 1px solid #ddd; padding: 8px; text-align: right; background-color: #f2f2f2;">التاريخ</th>
                  <th style="border: 1px solid #ddd; padding: 8px; text-align: right; background-color: #f2f2f2;">المبلغ</th>
                  <th style="border: 1px solid #ddd; padding: 8px; text-align: right; background-color: #f2f2f2;">نوع الدفع</th>
                  <th style="border: 1px solid #ddd; padding: 8px; text-align: right; background-color: #f2f2f2;">طريقة الدفع</th>
                  <th style="border: 1px solid #ddd; padding: 8px; text-align: right; background-color: #f2f2f2;">الوصف</th>
                </tr>
              </thead>
              <tbody>
                ${studentPayments.map((payment, index) => {
                  // حساب المبلغ المتراكم والمتبقي بعد كل دفعة
                  const cumulativePayment = studentPayments
                    .slice(0, index + 1)
                    .reduce((sum, p) => sum + Number(p.amount || 0), 0);

                  const remainingAfterPayment = netFees - cumulativePayment;

                  return `
                    <tr>
                      <td style="border: 1px solid #ddd; padding: 8px;">${formatDate(payment.payment_date)}</td>
                      <td style="border: 1px solid #ddd; padding: 8px;">${formatCurrency(payment.amount)}</td>
                      <td style="border: 1px solid #ddd; padding: 8px;">${getPaymentTypeName(payment.payment_type)}</td>
                      <td style="border: 1px solid #ddd; padding: 8px;">${getPaymentMethodName(payment.payment_method)}</td>
                      <td style="border: 1px solid #ddd; padding: 8px;">${payment.notes || '-'}</td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
              <tfoot>
                <tr>
                  <th colspan="1" style="border: 1px solid #ddd; padding: 8px; text-align: right; background-color: #f2f2f2;">الإجمالي</th>
                  <th style="border: 1px solid #ddd; padding: 8px; text-align: right; background-color: #f2f2f2;">${formatCurrency(totalPaymentsFromRecords)}</th>
                  <th colspan="3" style="border: 1px solid #ddd; padding: 8px; text-align: right; background-color: #f2f2f2;">المبلغ المتبقي: ${formatCurrency(remainingAmount > 0 ? remainingAmount : 0)}</th>
                </tr>
              </tfoot>
            </table>
          </div>

          <div style="margin-top: 30px; border-top: 1px solid #ddd; padding-top: 20px;">
            <div style="display: flex; justify-content: space-between;">
              <div style="width: 45%;">
                <p style="font-weight: bold;">ملاحظات:</p>
                <p>1. يرجى الاحتفاظ بإيصال الدفع.</p>
                <p>2. جميع المدفوعات نهائية ولا يمكن استردادها.</p>
                <p>3. في حالة وجود أي استفسار يرجى التواصل مع إدارة المدرسة.</p>
              </div>
              <div style="width: 45%; text-align: center;">
                <p style="margin-bottom: 50px;">ختم المدرسة</p>
                <p style="margin-top: 50px;">توقيع المسؤول المالي</p>
              </div>
            </div>
          </div>

          <div style="margin-top: 30px; text-align: center; font-size: 12px;">
            <p>تم إصدار هذا التقرير بتاريخ ${formatDate(new Date().toISOString())}</p>
          </div>
        </div>
      `;

      // فتح نافذة الطباعة
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>البيانات المالية للطالب - ${selectedStudentDetails.full_name}</title>
            </head>
            <body>
              ${printContent.innerHTML}
              <script>
                window.onload = function() {
                  window.print();
                  window.setTimeout(function() {
                    window.close();
                  }, 500);
                }
              </script>
            </body>
          </html>
        `);
        printWindow.document.close();
      }
    } catch (error) {
      console.error('Error printing student financial details:', error);
      showToast('حدث خطأ أثناء طباعة البيانات المالية للطالب', 'error');
    }
  };

  // الحصول على اسم الطالب
  const getStudentName = (studentId: string) => {
    const student = students.find(s => s.id === studentId);
    return student ? student.full_name : 'طالب غير معروف';
  };

  // الحصول على اسم نوع الدفع
  const getPaymentTypeName = (type: string) => {
    const types = {
      'tuition_fee': 'رسوم دراسية',
      'advance_payment': 'دفعة مقدمة',
      'installment': 'قسط',
      'activity_fee': 'رسوم نشاط',
      'transportation_fee': 'رسوم نقل',
      'uniform_fee': 'رسوم زي مدرسي',
      'book_fee': 'رسوم كتب',
      'other': 'أخرى'
    };

    return types[type as keyof typeof types] || type;
  };

  // الحصول على اسم طريقة الدفع
  const getPaymentMethodName = (method: string) => {
    const methods = {
      'cash': 'نقدًا',
      'bank_transfer': 'تحويل بنكي',
      'credit_card': 'بطاقة ائتمان',
      'check': 'شيك',
      'other': 'أخرى'
    };

    return methods[method as keyof typeof methods] || method;
  };

  // الحصول على اسم الحالة المالية
  const getFinancialStatusName = (status: string) => {
    const statuses = {
      'paid': 'مدفوع بالكامل',
      'partially_paid': 'مدفوع جزئيًا',
      'unpaid': 'غير مدفوع',
      'overdue': 'متأخر',
      'refunded': 'مسترد'
    };

    return statuses[status as keyof typeof statuses] || status;
  };

  // تنسيق التاريخ
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('ar-EG', {
        year: 'numeric',
        month: 'numeric',
        day: 'numeric'
      });
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

  // تغيير الصفحة
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // حساب عدد الصفحات
  const pageCount = Math.ceil(totalCount / 10);

  // تحديث البيانات المالية للطالب
  const updateStudentFinancialData = async (studentId: string) => {
    if (!studentId) return;

    try {
      console.log('Updating financial data for student:', studentId);

      // الحصول على إجمالي الرسوم والخصومات للطالب
      const { data: student, error: studentError } = await supabase
        .from('students')
        .select('fees_amount, discount_amount, full_name, classroom_id')
        .eq('id', studentId)
        .single();

      if (studentError) {
        throw studentError;
      }

      // الحصول على إجمالي المدفوعات للطالب
      const { data: payments, error: paymentsError } = await supabase
        .from('payment_records')
        .select('amount, payment_type, payment_date')
        .eq('student_id', studentId);

      if (paymentsError) {
        throw paymentsError;
      }

      // حساب إجمالي المدفوعات
      let totalPaid = 0;
      payments?.forEach(payment => {
        totalPaid += Number(payment.amount || 0);
      });

      // حساب إجمالي المستحق
      const totalFees = Number(student?.fees_amount || 0);
      const totalDiscount = Number(student?.discount_amount || 0);
      const totalDue = totalFees - totalDiscount - totalPaid;

      // تحديد الحالة المالية
      let financialStatus = 'unpaid';

      if (totalDue <= 0) {
        financialStatus = 'paid';
      } else if (totalPaid > 0) {
        financialStatus = 'partial';
      }

      // تحديث الحالة المالية للطالب
      const { error: updateError } = await supabase
        .from('students')
        .update({
          financial_status: financialStatus,
          total_paid: totalPaid,
          total_due: totalDue > 0 ? totalDue : 0,
          updated_at: new Date().toISOString()
        })
        .eq('id', studentId);

      if (updateError) {
        throw updateError;
      }

      // تحديث جدول المدفوعات الرئيسي (payments) للتزامن مع لوحة التحكم
      try {
        // التحقق من وجود سجل للطالب في جدول المدفوعات
        const { data: existingPayment, error: checkError } = await supabase
          .from('payments')
          .select('id')
          .eq('student_id', studentId)
          .maybeSingle();

        if (checkError) {
          console.error('Error checking existing payment:', checkError);
        }

        const paymentData = {
          student_id: studentId,
          student_name: student?.full_name || '',
          classroom_id: student?.classroom_id || null,
          amount: totalPaid,
          remaining: totalDue > 0 ? totalDue : 0,
          status: financialStatus,
          last_payment_date: payments && payments.length > 0
            ? new Date(Math.max(...payments.map(p => new Date(p.payment_date).getTime()))).toISOString()
            : null,
          updated_at: new Date().toISOString()
        };

        if (existingPayment?.id) {
          // تحديث السجل الموجود
          const { error: syncError } = await supabase
            .from('payments')
            .update(paymentData)
            .eq('id', existingPayment.id);

          if (syncError) {
            console.error('Error updating payments table:', syncError);
          } else {
            console.log('Payments table updated successfully');
          }
        } else {
          // إنشاء سجل جديد
          const { error: syncError } = await supabase
            .from('payments')
            .insert([{
              ...paymentData,
              created_at: new Date().toISOString()
            }]);

          if (syncError) {
            console.error('Error inserting into payments table:', syncError);
          } else {
            console.log('New record created in payments table');
          }
        }
      } catch (syncError) {
        console.error('Error syncing with payments table:', syncError);
      }

      console.log('Student financial data updated successfully:', {
        studentId,
        totalPaid,
        totalDue,
        financialStatus
      });

      return { success: true };
    } catch (error) {
      console.error('Error updating student financial data:', error);
      throw error;
    }
  };

  return (
    <MainLayout>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">إدارة المدفوعات</h1>
          <Button onClick={() => openDialog()}>
            <PlusIcon className="w-5 h-5 ml-2" />
            إضافة مدفوعة جديدة
          </Button>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>فلترة المدفوعات</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="student_id">الطالب</Label>
                <div className="space-y-2">
                  <div className="relative">
                    <Input
                      type="text"
                      placeholder="ابحث عن طالب..."
                      value={studentSearchQuery}
                      onChange={(e) => setStudentSearchQuery(e.target.value)}
                      className="mb-2"
                    />
                    <MagnifyingGlassIcon className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    {studentSearchQuery && (
                      <button
                        type="button"
                        onClick={() => setStudentSearchQuery('')}
                        className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                      >
                        <XCircleIcon className="h-4 w-4" />
                      </button>
                    )}

                    {/* قائمة اقتراحات الطلاب */}
                    {studentSearchQuery && filteredStudents.length > 0 && (
                      <div className="absolute z-10 mt-1 w-full bg-white rounded-md shadow-lg border border-gray-200 max-h-60 overflow-auto">
                        {filteredStudents.map((student) => (
                          <div
                            key={student.id}
                            className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-right"
                            onClick={() => {
                              setFilters(prev => ({ ...prev, student_id: student.id }));
                              setStudentSearchQuery(student.full_name);
                              // إعادة تحميل المدفوعات بعد اختيار الطالب
                              setTimeout(() => loadPayments(), 100);
                            }}
                          >
                            {student.full_name}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <Select
                    id="student_id"
                    name="student_id"
                    value={filters.student_id}
                    onChange={handleFilterChange}
                  >
                    <option value="">جميع الطلاب</option>
                    {filteredStudents.map((student) => (
                      <option key={student.id} value={student.id}>
                        {student.full_name}
                      </option>
                    ))}
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="payment_type">نوع الدفع</Label>
                <Select
                  id="payment_type"
                  name="payment_type"
                  value={filters.payment_type}
                  onChange={handleFilterChange}
                >
                  <option value="">جميع أنواع الدفع</option>
                  <option value="tuition_fee">رسوم دراسية</option>
                  <option value="advance_payment">دفعة مقدمة</option>
                  <option value="installment">قسط</option>
                  <option value="activity_fee">رسوم نشاط</option>
                  <option value="transportation_fee">رسوم نقل</option>
                  <option value="uniform_fee">رسوم زي مدرسي</option>
                  <option value="book_fee">رسوم كتب</option>
                  <option value="other">أخرى</option>
                </Select>
              </div>

              <div>
                <Label htmlFor="payment_method">طريقة الدفع</Label>
                <Select
                  id="payment_method"
                  name="payment_method"
                  value={filters.payment_method}
                  onChange={handleFilterChange}
                >
                  <option value="">جميع طرق الدفع</option>
                  <option value="cash">نقدًا</option>
                  <option value="bank_transfer">تحويل بنكي</option>
                  <option value="credit_card">بطاقة ائتمان</option>
                  <option value="check">شيك</option>
                  <option value="other">أخرى</option>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>قائمة المدفوعات</CardTitle>
            <div className="flex items-center space-x-2 space-x-reverse">
              <div className="relative w-64">
                <Input
                  type="text"
                  placeholder="بحث في المدفوعات..."
                  value={tableSearchQuery}
                  onChange={(e) => setTableSearchQuery(e.target.value)}
                  className="pl-8"
                />
                <MagnifyingGlassIcon className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                {tableSearchQuery && (
                  <button
                    type="button"
                    onClick={() => setTableSearchQuery('')}
                    className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    <XCircleIcon className="h-4 w-4" />
                  </button>
                )}
              </div>
              <Button variant="outline" onClick={loadPayments} disabled={isLoading}>
                <ArrowPathIcon className="w-4 h-4 ml-2" />
                تحديث
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center items-center h-64">
                <Spinner size="lg" />
              </div>
            ) : payments.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                لا توجد مدفوعات. قم بإضافة مدفوعة جديدة.
              </div>
            ) : tableSearchQuery && filteredPayments.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                لا توجد نتائج تطابق بحثك "{tableSearchQuery}". حاول استخدام كلمات بحث مختلفة.
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>الطالب</TableHead>
                      <TableHead>التاريخ</TableHead>
                      <TableHead>المبلغ</TableHead>
                      <TableHead>نوع الدفع</TableHead>
                      <TableHead>طريقة الدفع</TableHead>
                      <TableHead>الوصف</TableHead>
                      <TableHead>الإجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(tableSearchQuery ? filteredPayments : payments).map((payment) => (
                      <TableRow key={payment.id}>
                        <TableCell>{getStudentName(payment.student_id)}</TableCell>
                        <TableCell>{formatDate(payment.payment_date)}</TableCell>
                        <TableCell>{formatCurrency(payment.amount)}</TableCell>
                        <TableCell>{getPaymentTypeName(payment.payment_type)}</TableCell>
                        <TableCell>{getPaymentMethodName(payment.payment_method)}</TableCell>
                        <TableCell>{payment.description || '-'}</TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => showStudentFinancialDetails(payment.student_id)}
                              title="عرض التفاصيل المالية للطالب"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                              </svg>
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handlePrintReceipt(payment)}
                              title="طباعة إيصال"
                            >
                              <PrinterIcon className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openDialog(payment)}
                              title="تعديل المدفوعة"
                            >
                              <PencilIcon className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(payment.id)}
                              title="حذف المدفوعة"
                            >
                              <TrashIcon className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {/* ترقيم الصفحات */}
                {pageCount > 1 && (
                  <div className="flex justify-center mt-4">
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                      >
                        السابق
                      </Button>

                      {Array.from({ length: pageCount }, (_, i) => i + 1).map((page) => (
                        <Button
                          key={page}
                          variant={currentPage === page ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => handlePageChange(page)}
                        >
                          {page}
                        </Button>
                      ))}

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === pageCount}
                      >
                        التالي
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* مربع حوار التفاصيل المالية للطالب */}
        <Dialog
          open={isDetailsDialogOpen}
          onOpenChange={(open) => {
            if (!open) {
              setSelectedStudentDetails(null);
              setStudentPayments([]);
            }
            setIsDetailsDialogOpen(open);
          }}
        >
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>
                {selectedStudentDetails ? `البيانات المالية للطالب: ${selectedStudentDetails.full_name}` : 'البيانات المالية للطالب'}
              </DialogTitle>
            </DialogHeader>

            {isLoadingDetails ? (
              <div className="flex justify-center items-center h-64">
                <Spinner size="lg" />
              </div>
            ) : selectedStudentDetails ? (
              <div className="space-y-6">
                {/* ملخص البيانات المالية */}
                <Card>
                  <CardHeader>
                    <CardTitle>ملخص البيانات المالية</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {/* حساب القيم المالية */}
                    {(() => {
                      const totalPaymentsFromRecords = studentPayments.reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
                      const totalFees = Number(selectedStudentDetails.fees_amount || 0);
                      const totalDiscount = Number(selectedStudentDetails.discount_amount || 0);
                      const netFees = totalFees - totalDiscount;
                      const remainingAmount = netFees - totalPaymentsFromRecords;

                      return (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span className="font-medium">إجمالي الرسوم:</span>
                              <span>{formatCurrency(totalFees)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="font-medium">الخصم:</span>
                              <span>{formatCurrency(totalDiscount)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="font-medium">صافي الرسوم بعد الخصم:</span>
                              <span className="font-bold">{formatCurrency(netFees)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="font-medium">إجمالي المدفوعات:</span>
                              <span>{formatCurrency(totalPaymentsFromRecords)}</span>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span className="font-medium">المبلغ المتبقي:</span>
                              <span className={`font-bold ${remainingAmount > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                {formatCurrency(remainingAmount > 0 ? remainingAmount : 0)}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="font-medium">الحالة المالية:</span>
                              <span>{getFinancialStatusName(selectedStudentDetails.financial_status || 'unpaid')}</span>
                            </div>
                            <div className="flex justify-between mt-4">
                              <span className="font-medium">نسبة السداد:</span>
                              <span>
                                {netFees > 0 ? Math.min(100, Math.round((totalPaymentsFromRecords / netFees) * 100)) : 100}%
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                  </CardContent>
                </Card>

                {/* سجل المدفوعات */}
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>سجل المدفوعات</CardTitle>
                    <Button variant="outline" onClick={printStudentFinancialDetails}>
                      <PrinterIcon className="w-4 h-4 ml-2" />
                      طباعة التقرير المالي
                    </Button>
                  </CardHeader>
                  <CardContent>
                    {studentPayments.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        لا توجد مدفوعات مسجلة لهذا الطالب.
                      </div>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>التاريخ</TableHead>
                            <TableHead>المبلغ</TableHead>
                            <TableHead>نوع الدفع</TableHead>
                            <TableHead>طريقة الدفع</TableHead>
                            <TableHead>الوصف</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {studentPayments.map((payment, index) => {
                            // حساب المبلغ المتراكم بعد كل دفعة
                            const totalPaymentsFromRecords = studentPayments.reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
                            const totalFees = Number(selectedStudentDetails.fees_amount || 0);
                            const totalDiscount = Number(selectedStudentDetails.discount_amount || 0);
                            const netFees = totalFees - totalDiscount;

                            return (
                              <TableRow key={payment.id}>
                                <TableCell>{formatDate(payment.payment_date)}</TableCell>
                                <TableCell>{formatCurrency(payment.amount)}</TableCell>
                                <TableCell>{getPaymentTypeName(payment.payment_type)}</TableCell>
                                <TableCell>{getPaymentMethodName(payment.payment_method)}</TableCell>
                                <TableCell>{payment.notes || '-'}</TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                        <tfoot>
                          {(() => {
                            const totalPaymentsFromRecords = studentPayments.reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
                            const totalFees = Number(selectedStudentDetails.fees_amount || 0);
                            const totalDiscount = Number(selectedStudentDetails.discount_amount || 0);
                            const netFees = totalFees - totalDiscount;
                            const remainingAmount = netFees - totalPaymentsFromRecords;

                            return (
                              <TableRow className="bg-gray-50">
                                <TableCell className="font-bold">الإجمالي</TableCell>
                                <TableCell className="font-bold">{formatCurrency(totalPaymentsFromRecords)}</TableCell>
                                <TableCell colSpan={3} className="font-bold text-left">
                                  المبلغ المتبقي: {formatCurrency(remainingAmount > 0 ? remainingAmount : 0)}
                                </TableCell>
                              </TableRow>
                            );
                          })()}
                        </tfoot>
                      </Table>
                    )}
                  </CardContent>
                </Card>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                لا توجد بيانات متاحة.
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDetailsDialogOpen(false)}>
                إغلاق
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* مربع حوار إضافة/تعديل مدفوعة */}
        <Dialog
          open={isDialogOpen}
          onOpenChange={(open) => {
            // إعادة تعيين النموذج عند إغلاق مربع الحوار
            if (!open) {
              setFormData({
                student_id: '',
                payment_date: new Date().toISOString().split('T')[0],
                amount: '',
                payment_type: 'tuition_fee',
                payment_method: 'cash',
                description: '',
                receipt_number: ''
              });
              setEditingPayment(null);
              // إعادة تعيين قيمة البحث
              setStudentSearchQuery('');
            }
            setIsDialogOpen(open);
          }}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingPayment ? 'تعديل مدفوعة' : 'إضافة مدفوعة جديدة'}
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSubmit}>
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="student_id">الطالب</Label>
                    <div className="space-y-2">
                      <div className="relative">
                        <Input
                          type="text"
                          placeholder="ابحث عن طالب..."
                          value={studentSearchQuery}
                          onChange={(e) => setStudentSearchQuery(e.target.value)}
                          className="mb-2"
                        />
                        <MagnifyingGlassIcon className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                        {studentSearchQuery && (
                          <button
                            type="button"
                            onClick={() => setStudentSearchQuery('')}
                            className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                          >
                            <XCircleIcon className="h-4 w-4" />
                          </button>
                        )}

                        {/* قائمة اقتراحات الطلاب في النموذج */}
                        {studentSearchQuery && filteredStudents.length > 0 && (
                          <div className="absolute z-10 mt-1 w-full bg-white rounded-md shadow-lg border border-gray-200 max-h-60 overflow-auto">
                            {filteredStudents.map((student) => (
                              <div
                                key={student.id}
                                className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-right"
                                onClick={() => {
                                  setFormData(prev => ({ ...prev, student_id: student.id }));
                                  setStudentSearchQuery(student.full_name);
                                }}
                              >
                                {student.full_name}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      <Select
                        id="student_id"
                        name="student_id"
                        value={formData.student_id}
                        onChange={handleChange}
                        required
                      >
                        <option value="">اختر الطالب</option>
                        {filteredStudents.map((student) => (
                          <option key={student.id} value={student.id}>
                            {student.full_name}
                          </option>
                        ))}
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="payment_date">تاريخ الدفع</Label>
                    <Input
                      id="payment_date"
                      name="payment_date"
                      type="date"
                      value={formData.payment_date}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="amount">المبلغ (بالجنيه المصري)</Label>
                    <Input
                      id="amount"
                      name="amount"
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.amount}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="payment_type">نوع الدفع</Label>
                    <Select
                      id="payment_type"
                      name="payment_type"
                      value={formData.payment_type}
                      onChange={handleChange}
                      required
                    >
                      <option value="tuition_fee">رسوم دراسية</option>
                      <option value="advance_payment">دفعة مقدمة</option>
                      <option value="installment">قسط</option>
                      <option value="activity_fee">رسوم نشاط</option>
                      <option value="transportation_fee">رسوم نقل</option>
                      <option value="uniform_fee">رسوم زي مدرسي</option>
                      <option value="book_fee">رسوم كتب</option>
                      <option value="other">أخرى</option>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="payment_method">طريقة الدفع</Label>
                    <Select
                      id="payment_method"
                      name="payment_method"
                      value={formData.payment_method}
                      onChange={handleChange}
                      required
                    >
                      <option value="cash">نقدًا</option>
                      <option value="bank_transfer">تحويل بنكي</option>
                      <option value="credit_card">بطاقة ائتمان</option>
                      <option value="check">شيك</option>
                      <option value="other">أخرى</option>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="receipt_number">رقم الإيصال (اختياري)</Label>
                    <Input
                      id="receipt_number"
                      name="receipt_number"
                      value={formData.receipt_number}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">الوصف (اختياري)</Label>
                    <Textarea
                      id="description"
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      rows={3}
                    />
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                  disabled={isSubmitting}
                >
                  إلغاء
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? <Spinner size="sm" /> : editingPayment ? 'تحديث' : 'إضافة'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
}
