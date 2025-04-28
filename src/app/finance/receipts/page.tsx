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
import { PlusIcon, PrinterIcon, EyeIcon, TrashIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { receiptService } from '@/services/receiptService';
import { realtimeService } from '@/services/realtimeService';
import { showToast } from '@/components/ui/ToastContainer';
import Spinner from '@/components/ui/Spinner';

/**
 * صفحة إدارة سندات القبض والصرف
 */
export default function ReceiptsPage() {
  const [receipts, setReceipts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [filters, setFilters] = useState({
    receipt_type: '',
    entity_type: ''
  });
  const [formData, setFormData] = useState({
    receipt_date: new Date().toISOString().split('T')[0],
    receipt_type: 'income',
    amount: '',
    entity_type: 'student',
    entity_id: '',
    description: ''
  });

  // مرجع للاشتراك في التغييرات في الوقت الحقيقي
  const realtimeSubscriptionRef = useRef<any>(null);

  // تحميل البيانات
  useEffect(() => {
    loadReceipts();

    // الاشتراك في التغييرات في الوقت الحقيقي
    realtimeSubscriptionRef.current = realtimeService.subscribeToTable(
      { table: 'receipts' },
      (payload) => {
        console.log('Realtime receipt update:', payload.eventType);
        loadReceipts();
      }
    );

    // تنظيف الاشتراك عند إلغاء تحميل المكون
    return () => {
      if (realtimeSubscriptionRef.current) {
        realtimeService.unsubscribe(realtimeSubscriptionRef.current);
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, filters]);

  // تحميل السندات
  const loadReceipts = async () => {
    setIsLoading(true);

    try {
      const { data, count, error } = await receiptService.getReceipts({
        receipt_type: filters.receipt_type || undefined,
        entity_type: filters.entity_type || undefined,
        page: currentPage,
        limit: 10
      });

      if (error) {
        throw error;
      }

      setReceipts(data || []);
      setTotalCount(count || 0);
    } catch (error) {
      console.error('Error loading receipts:', error);
      showToast('حدث خطأ أثناء تحميل السندات', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // فتح مربع حوار إضافة
  const openDialog = () => {
    setFormData({
      receipt_date: new Date().toISOString().split('T')[0],
      receipt_type: 'income',
      amount: '',
      entity_type: 'student',
      entity_id: '',
      description: ''
    });

    setIsDialogOpen(true);
  };

  // تغيير قيمة الحقل
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // تغيير قيمة الفلتر
  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
    setCurrentPage(1);
  };

  // حفظ السند
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // التحقق من صحة البيانات
      if (!formData.receipt_date || !formData.amount || !formData.entity_type || !formData.entity_id) {
        showToast('يرجى ملء جميع الحقول المطلوبة', 'error');
        setIsSubmitting(false);
        return;
      }

      const receiptData = {
        receipt_date: formData.receipt_date,
        receipt_type: formData.receipt_type,
        amount: parseFloat(formData.amount),
        entity_type: formData.entity_type,
        entity_id: formData.entity_id,
        description: formData.description
      };

      // إنشاء سند جديد
      const result = await receiptService.createReceipt(receiptData);

      if (result.error) {
        throw result.error;
      }

      // إغلاق مربع الحوار وتحديث القائمة
      setIsDialogOpen(false);
      loadReceipts();

      // عرض رسالة نجاح
      showToast('تم إنشاء السند بنجاح', 'success');

      // طباعة السند
      if (window.confirm('هل ترغب في طباعة السند؟')) {
        receiptService.printReceipt(result.data);
      }
    } catch (error) {
      console.error('Error saving receipt:', error);
      showToast('حدث خطأ أثناء حفظ السند', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // حذف سند
  const handleDelete = async (id: string) => {
    if (!window.confirm('هل أنت متأكد من رغبتك في حذف هذا السند؟')) {
      return;
    }

    try {
      const { success, error } = await receiptService.deleteReceipt(id);

      if (error) {
        throw error;
      }

      if (success) {
        // تحديث القائمة
        loadReceipts();

        // عرض رسالة نجاح
        showToast('تم حذف السند بنجاح', 'success');
      }
    } catch (error) {
      console.error('Error deleting receipt:', error);
      showToast('حدث خطأ أثناء حذف السند', 'error');
    }
  };

  // طباعة سند
  const handlePrint = async (id: string) => {
    try {
      const { data, error } = await receiptService.getReceiptById(id);

      if (error) {
        throw error;
      }

      if (data) {
        receiptService.printReceipt(data);
      }
    } catch (error) {
      console.error('Error printing receipt:', error);
      showToast('حدث خطأ أثناء طباعة السند', 'error');
    }
  };

  // الحصول على نص نوع السند
  const getReceiptTypeText = (type: string) => {
    return type === 'income' ? 'سند قبض' : 'سند صرف';
  };

  // الحصول على نص نوع الكيان
  const getEntityTypeText = (type: string) => {
    return receiptService.getEntityTypeText(type);
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
          <h1 className="text-2xl font-bold">إدارة سندات القبض والصرف</h1>
          <Button onClick={openDialog}>
            <PlusIcon className="w-5 h-5 ml-2" />
            إنشاء سند جديد
          </Button>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>فلترة السندات</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="receipt_type">نوع السند</Label>
                <Select
                  id="receipt_type"
                  name="receipt_type"
                  value={filters.receipt_type}
                  onChange={handleFilterChange}
                >
                  <option value="">جميع أنواع السندات</option>
                  {receiptService.getReceiptTypes().map((type) => (
                    <option key={type.id} value={type.id}>
                      {type.name}
                    </option>
                  ))}
                </Select>
              </div>

              <div>
                <Label htmlFor="entity_type">نوع الكيان</Label>
                <Select
                  id="entity_type"
                  name="entity_type"
                  value={filters.entity_type}
                  onChange={handleFilterChange}
                >
                  <option value="">جميع أنواع الكيانات</option>
                  {receiptService.getEntityTypes().map((type) => (
                    <option key={type.id} value={type.id}>
                      {type.name}
                    </option>
                  ))}
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>قائمة السندات</CardTitle>
            <Button variant="outline" onClick={loadReceipts} disabled={isLoading}>
              <ArrowPathIcon className="w-4 h-4 ml-2" />
              تحديث
            </Button>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center items-center h-64">
                <Spinner size="lg" />
              </div>
            ) : receipts.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                لا توجد سندات. قم بإنشاء سند جديد.
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>رقم السند</TableHead>
                      <TableHead>التاريخ</TableHead>
                      <TableHead>النوع</TableHead>
                      <TableHead>المبلغ</TableHead>
                      <TableHead>الكيان</TableHead>
                      <TableHead>الوصف</TableHead>
                      <TableHead>الإجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {receipts.map((receipt) => (
                      <TableRow key={receipt.id}>
                        <TableCell>{receipt.receipt_number}</TableCell>
                        <TableCell>{formatDate(receipt.receipt_date)}</TableCell>
                        <TableCell>{getReceiptTypeText(receipt.receipt_type)}</TableCell>
                        <TableCell>{formatCurrency(receipt.amount)}</TableCell>
                        <TableCell>{getEntityTypeText(receipt.entity_type)}</TableCell>
                        <TableCell>{receipt.description || '-'}</TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handlePrint(receipt.id)}
                            >
                              <PrinterIcon className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(receipt.id)}
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

        {/* مربع حوار إنشاء سند */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>إنشاء سند جديد</DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSubmit}>
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="receipt_type">نوع السند</Label>
                    <Select
                      id="receipt_type"
                      name="receipt_type"
                      value={formData.receipt_type}
                      onChange={handleChange}
                      required
                    >
                      {receiptService.getReceiptTypes().map((type) => (
                        <option key={type.id} value={type.id}>
                          {type.name}
                        </option>
                      ))}
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="receipt_date">تاريخ السند</Label>
                    <Input
                      id="receipt_date"
                      name="receipt_date"
                      type="date"
                      value={formData.receipt_date}
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
                    <Label htmlFor="entity_type">نوع الكيان</Label>
                    <Select
                      id="entity_type"
                      name="entity_type"
                      value={formData.entity_type}
                      onChange={handleChange}
                      required
                    >
                      {receiptService.getEntityTypes().map((type) => (
                        <option key={type.id} value={type.id}>
                          {type.name}
                        </option>
                      ))}
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="entity_id">معرف الكيان</Label>
                    <Input
                      id="entity_id"
                      name="entity_id"
                      value={formData.entity_id}
                      onChange={handleChange}
                      required
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
                  {isSubmitting ? <Spinner size="sm" /> : 'إنشاء'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
}
