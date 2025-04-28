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
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { financialService } from '@/services/financialService';
import { realtimeService } from '@/services/realtimeService';
import { showToast } from '@/components/ui/ToastContainer';
import { GRADE_LEVELS } from '@/types/student';
import Spinner from '@/components/ui/Spinner';

/**
 * صفحة إدارة الرسوم الدراسية
 */
export default function FeesPage() {
  const [feeStructures, setFeeStructures] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [editingFee, setEditingFee] = useState<any>(null);
  const [formData, setFormData] = useState({
    grade_level: '',
    academic_year: new Date().getFullYear().toString(),
    fees_amount: '',
    description: ''
  });
  
  // مرجع للاشتراك في التغييرات في الوقت الحقيقي
  const realtimeSubscriptionRef = useRef<any>(null);
  
  // تحميل البيانات
  useEffect(() => {
    loadFeeStructures();
    
    // الاشتراك في التغييرات في الوقت الحقيقي
    realtimeSubscriptionRef.current = realtimeService.subscribeToTable(
      { table: 'fee_structures' },
      (payload) => {
        console.log('Realtime fee structure update:', payload.eventType);
        loadFeeStructures();
      }
    );
    
    // تنظيف الاشتراك عند إلغاء تحميل المكون
    return () => {
      if (realtimeSubscriptionRef.current) {
        realtimeService.unsubscribe(realtimeSubscriptionRef.current);
      }
    };
  }, []);
  
  // تحميل هياكل الرسوم
  const loadFeeStructures = async () => {
    setIsLoading(true);
    
    try {
      const { data, error } = await financialService.getFeeStructures();
      
      if (error) {
        throw error;
      }
      
      setFeeStructures(data || []);
    } catch (error) {
      console.error('Error loading fee structures:', error);
      showToast('حدث خطأ أثناء تحميل هياكل الرسوم', 'error');
    } finally {
      setIsLoading(false);
    }
  };
  
  // فتح مربع حوار إضافة/تعديل
  const openDialog = (fee?: any) => {
    if (fee) {
      // تعديل هيكل رسوم موجود
      setEditingFee(fee);
      setFormData({
        grade_level: fee.grade_level,
        academic_year: fee.academic_year,
        fees_amount: fee.fees_amount.toString(),
        description: fee.description || ''
      });
    } else {
      // إضافة هيكل رسوم جديد
      setEditingFee(null);
      setFormData({
        grade_level: '',
        academic_year: new Date().getFullYear().toString(),
        fees_amount: '',
        description: ''
      });
    }
    
    setIsDialogOpen(true);
  };
  
  // تغيير قيمة الحقل
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  // حفظ هيكل الرسوم
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // التحقق من صحة البيانات
      if (!formData.grade_level || !formData.academic_year || !formData.fees_amount) {
        showToast('يرجى ملء جميع الحقول المطلوبة', 'error');
        return;
      }
      
      const feeData = {
        grade_level: formData.grade_level,
        academic_year: formData.academic_year,
        fees_amount: parseFloat(formData.fees_amount),
        description: formData.description
      };
      
      let result;
      
      if (editingFee) {
        // تحديث هيكل رسوم موجود
        result = await financialService.updateFeeStructure(editingFee.id, feeData);
      } else {
        // إنشاء هيكل رسوم جديد
        result = await financialService.createFeeStructure(feeData);
      }
      
      if (result.error) {
        throw result.error;
      }
      
      // إغلاق مربع الحوار وتحديث القائمة
      setIsDialogOpen(false);
      loadFeeStructures();
      
      // عرض رسالة نجاح
      showToast(
        editingFee
          ? 'تم تحديث هيكل الرسوم بنجاح'
          : 'تم إنشاء هيكل الرسوم بنجاح',
        'success'
      );
    } catch (error) {
      console.error('Error saving fee structure:', error);
      showToast('حدث خطأ أثناء حفظ هيكل الرسوم', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // حذف هيكل رسوم
  const handleDelete = async (id: string) => {
    if (!window.confirm('هل أنت متأكد من رغبتك في حذف هيكل الرسوم هذا؟')) {
      return;
    }
    
    try {
      const { success, error } = await financialService.deleteFeeStructure(id);
      
      if (error) {
        throw error;
      }
      
      if (success) {
        // تحديث القائمة
        loadFeeStructures();
        
        // عرض رسالة نجاح
        showToast('تم حذف هيكل الرسوم بنجاح', 'success');
      }
    } catch (error) {
      console.error('Error deleting fee structure:', error);
      showToast('حدث خطأ أثناء حذف هيكل الرسوم', 'error');
    }
  };
  
  // الحصول على اسم المستوى الدراسي
  const getGradeLevelName = (gradeId: string) => {
    const grade = GRADE_LEVELS.find(g => g.id === gradeId);
    return grade ? grade.arabic_name : gradeId;
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
    <MainLayout>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">إدارة الرسوم الدراسية</h1>
          <Button onClick={() => openDialog()}>
            <PlusIcon className="w-5 h-5 ml-2" />
            إضافة هيكل رسوم جديد
          </Button>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>هياكل الرسوم الدراسية</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center items-center h-64">
                <Spinner size="lg" />
              </div>
            ) : feeStructures.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                لا توجد هياكل رسوم. قم بإضافة هيكل رسوم جديد.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>المستوى الدراسي</TableHead>
                    <TableHead>العام الدراسي</TableHead>
                    <TableHead>مبلغ الرسوم</TableHead>
                    <TableHead>الوصف</TableHead>
                    <TableHead>الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {feeStructures.map((fee) => (
                    <TableRow key={fee.id}>
                      <TableCell>{getGradeLevelName(fee.grade_level)}</TableCell>
                      <TableCell>{fee.academic_year}</TableCell>
                      <TableCell>{formatCurrency(fee.fees_amount)}</TableCell>
                      <TableCell>{fee.description || '-'}</TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openDialog(fee)}
                          >
                            <PencilIcon className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(fee.id)}
                          >
                            <TrashIcon className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
        
        {/* مربع حوار إضافة/تعديل هيكل رسوم */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingFee ? 'تعديل هيكل رسوم' : 'إضافة هيكل رسوم جديد'}
              </DialogTitle>
            </DialogHeader>
            
            <form onSubmit={handleSubmit}>
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="grade_level">المستوى الدراسي</Label>
                    <Select
                      id="grade_level"
                      name="grade_level"
                      value={formData.grade_level}
                      onChange={handleChange}
                      required
                    >
                      <option value="">اختر المستوى الدراسي</option>
                      {GRADE_LEVELS.map((grade) => (
                        <option key={grade.id} value={grade.id}>
                          {grade.arabic_name}
                        </option>
                      ))}
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="academic_year">العام الدراسي</Label>
                    <Input
                      id="academic_year"
                      name="academic_year"
                      value={formData.academic_year}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="fees_amount">مبلغ الرسوم (بالجنيه المصري)</Label>
                    <Input
                      id="fees_amount"
                      name="fees_amount"
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.fees_amount}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="description">الوصف (اختياري)</Label>
                    <Input
                      id="description"
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
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
                  {isSubmitting ? <Spinner size="sm" /> : editingFee ? 'تحديث' : 'إضافة'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
}
