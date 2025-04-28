'use client';

import { useState, useEffect, useRef } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/Table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/Dialog';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Label } from '@/components/ui/Label';
import { Textarea } from '@/components/ui/Textarea';
import { PlusIcon, PencilIcon, TrashIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { expenseService } from '@/services/expenseService';
import { receiptService } from '@/services/receiptService';
import { realtimeService } from '@/services/realtimeService';
import { showToast } from '@/components/ui/ToastContainer';
import Spinner from '@/components/ui/Spinner';

/**
 * صفحة إدارة المصروفات
 */
export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [editingExpense, setEditingExpense] = useState<any>(null);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [formData, setFormData] = useState({
    expense_date: new Date().toISOString().split('T')[0],
    amount: '',
    category: '',
    description: '',
    payment_method: 'cash',
    receipt_number: '',
    receipt_image_url: ''
  });
  
  // مرجع للاشتراك في التغييرات في الوقت الحقيقي
  const realtimeSubscriptionRef = useRef<any>(null);
  
  // تحميل البيانات
  useEffect(() => {
    loadExpenses();
    
    // الاشتراك في التغييرات في الوقت الحقيقي
    realtimeSubscriptionRef.current = realtimeService.subscribeToTable(
      { table: 'expenses' },
      (payload) => {
        console.log('Realtime expense update:', payload.eventType);
        loadExpenses();
      }
    );
    
    // تنظيف الاشتراك عند إلغاء تحميل المكون
    return () => {
      if (realtimeSubscriptionRef.current) {
        realtimeService.unsubscribe(realtimeSubscriptionRef.current);
      }
    };
  }, [currentPage]);
  
  // تحميل المصروفات
  const loadExpenses = async () => {
    setIsLoading(true);
    
    try {
      const { data, count, error } = await expenseService.getExpenses({
        page: currentPage,
        limit: 10
      });
      
      if (error) {
        throw error;
      }
      
      setExpenses(data || []);
      setTotalCount(count || 0);
    } catch (error) {
      console.error('Error loading expenses:', error);
      showToast('حدث خطأ أثناء تحميل المصروفات', 'error');
    } finally {
      setIsLoading(false);
    }
  };
  
  // فتح مربع حوار إضافة/تعديل
  const openDialog = (expense?: any) => {
    if (expense) {
      // تعديل مصروف موجود
      setEditingExpense(expense);
      setFormData({
        expense_date: new Date(expense.expense_date).toISOString().split('T')[0],
        amount: expense.amount.toString(),
        category: expense.category,
        description: expense.description || '',
        payment_method: expense.payment_method,
        receipt_number: expense.receipt_number || '',
        receipt_image_url: expense.receipt_image_url || ''
      });
    } else {
      // إضافة مصروف جديد
      setEditingExpense(null);
      setFormData({
        expense_date: new Date().toISOString().split('T')[0],
        amount: '',
        category: '',
        description: '',
        payment_method: 'cash',
        receipt_number: '',
        receipt_image_url: ''
      });
    }
    
    setIsDialogOpen(true);
  };
  
  // تغيير قيمة الحقل
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  // حفظ المصروف
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // التحقق من صحة البيانات
      if (!formData.expense_date || !formData.amount || !formData.category || !formData.payment_method) {
        showToast('يرجى ملء جميع الحقول المطلوبة', 'error');
        setIsSubmitting(false);
        return;
      }
      
      const expenseData = {
        expense_date: formData.expense_date,
        amount: parseFloat(formData.amount),
        category: formData.category,
        description: formData.description,
        payment_method: formData.payment_method,
        receipt_number: formData.receipt_number,
        receipt_image_url: formData.receipt_image_url
      };
      
      let result;
      
      if (editingExpense) {
        // تحديث مصروف موجود
        result = await expenseService.updateExpense(editingExpense.id, expenseData);
      } else {
        // إنشاء مصروف جديد
        result = await expenseService.createExpense(expenseData);
      }
      
      if (result.error) {
        throw result.error;
      }
      
      // إنشاء سند صرف
      if (result.data && !editingExpense) {
        try {
          const receiptData = {
            receipt_date: formData.expense_date,
            receipt_type: 'expense',
            amount: parseFloat(formData.amount),
            entity_type: 'expense',
            entity_id: result.data.id,
            description: `مصروف - ${formData.category}: ${formData.description}`
          };
          
          const receiptResult = await receiptService.createReceipt(receiptData);
          
          if (receiptResult.error) {
            console.error('Error creating receipt:', receiptResult.error);
          }
        } catch (receiptError) {
          console.error('Error creating receipt:', receiptError);
        }
      }
      
      // إغلاق مربع الحوار وتحديث القائمة
      setIsDialogOpen(false);
      loadExpenses();
      
      // عرض رسالة نجاح
      showToast(
        editingExpense
          ? 'تم تحديث المصروف بنجاح'
          : 'تم إنشاء المصروف بنجاح',
        'success'
      );
    } catch (error) {
      console.error('Error saving expense:', error);
      showToast('حدث خطأ أثناء حفظ المصروف', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // حذف مصروف
  const handleDelete = async (id: string) => {
    if (!window.confirm('هل أنت متأكد من رغبتك في حذف هذا المصروف؟')) {
      return;
    }
    
    try {
      const { success, error } = await expenseService.deleteExpense(id);
      
      if (error) {
        throw error;
      }
      
      if (success) {
        // تحديث القائمة
        loadExpenses();
        
        // عرض رسالة نجاح
        showToast('تم حذف المصروف بنجاح', 'success');
      }
    } catch (error) {
      console.error('Error deleting expense:', error);
      showToast('حدث خطأ أثناء حذف المصروف', 'error');
    }
  };
  
  // الحصول على اسم الفئة
  const getCategoryName = (categoryId: string) => {
    const categories = expenseService.getExpenseCategories();
    const category = categories.find(c => c.id === categoryId);
    return category ? category.name : categoryId;
  };
  
  // الحصول على اسم طريقة الدفع
  const getPaymentMethodName = (methodId: string) => {
    const methods = expenseService.getPaymentMethods();
    const method = methods.find(m => m.id === methodId);
    return method ? method.name : methodId;
  };
  
  // تنسيق المبلغ بالجنيه المصري
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-EG', {
      style: 'currency',
      currency: 'EGP',
      maximumFractionDigits: 0
    }).format(amount);
  };
  
  // تنسيق التاريخ
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ar-EG');
  };
  
  // تغيير الصفحة
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };
  
  // حساب عدد الصفحات
  const pageCount = Math.ceil(totalCount / 10);
  
  return (
    <MainLayout>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">إدارة المصروفات</h1>
          <Button onClick={() => openDialog()}>
            <PlusIcon className="w-5 h-5 ml-2" />
            إضافة مصروف جديد
          </Button>
        </div>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>قائمة المصروفات</CardTitle>
            <Button variant="outline" onClick={loadExpenses} disabled={isLoading}>
              <ArrowPathIcon className="w-4 h-4 ml-2" />
              تحديث
            </Button>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center items-center h-64">
                <Spinner size="lg" />
              </div>
            ) : expenses.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                لا توجد مصروفات. قم بإضافة مصروف جديد.
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>التاريخ</TableHead>
                      <TableHead>الفئة</TableHead>
                      <TableHead>المبلغ</TableHead>
                      <TableHead>طريقة الدفع</TableHead>
                      <TableHead>الوصف</TableHead>
                      <TableHead>الإجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {expenses.map((expense) => (
                      <TableRow key={expense.id}>
                        <TableCell>{formatDate(expense.expense_date)}</TableCell>
                        <TableCell>{getCategoryName(expense.category)}</TableCell>
                        <TableCell>{formatCurrency(expense.amount)}</TableCell>
                        <TableCell>{getPaymentMethodName(expense.payment_method)}</TableCell>
                        <TableCell>{expense.description || '-'}</TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openDialog(expense)}
                            >
                              <PencilIcon className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(expense.id)}
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
        
        {/* مربع حوار إضافة/تعديل مصروف */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingExpense ? 'تعديل مصروف' : 'إضافة مصروف جديد'}
              </DialogTitle>
            </DialogHeader>
            
            <form onSubmit={handleSubmit}>
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="expense_date">تاريخ المصروف</Label>
                    <Input
                      id="expense_date"
                      name="expense_date"
                      type="date"
                      value={formData.expense_date}
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
                    <Label htmlFor="category">الفئة</Label>
                    <Select
                      id="category"
                      name="category"
                      value={formData.category}
                      onChange={handleChange}
                      required
                    >
                      <option value="">اختر الفئة</option>
                      {expenseService.getExpenseCategories().map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
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
                      {expenseService.getPaymentMethods().map((method) => (
                        <option key={method.id} value={method.id}>
                          {method.name}
                        </option>
                      ))}
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
                    <Label htmlFor="description">الوصف</Label>
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
                  {isSubmitting ? <Spinner size="sm" /> : editingExpense ? 'تحديث' : 'إضافة'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
}
