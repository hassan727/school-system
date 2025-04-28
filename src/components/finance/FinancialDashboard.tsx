'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { financialService } from '@/services/financialService';
import { realtimeService } from '@/services/realtimeService';
import { showToast } from '@/components/ui/ToastContainer';
import { FinancialSummaryCard } from './FinancialSummaryCard';
import { RevenueExpenseChart } from './RevenueExpenseChart';
import { PaymentStatusChart } from './PaymentStatusChart';
import { RecentTransactions } from './RecentTransactions';
import Spinner from '@/components/ui/Spinner';

/**
 * مكون لوحة التحكم المالية
 */
export function FinancialDashboard() {
  const [summary, setSummary] = useState<any>(null);
  const [chartData, setChartData] = useState<any>(null);
  const [period, setPeriod] = useState<string>('monthly');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  
  // مرجع للاشتراك في التغييرات في الوقت الحقيقي
  const realtimeSubscriptionRef = useRef<any>(null);
  
  // تحميل البيانات
  useEffect(() => {
    loadData();
    
    // الاشتراك في التغييرات في الوقت الحقيقي
    const subscriptions = financialService.subscribeToFinancialChanges((payload) => {
      console.log('Realtime financial update:', payload.eventType);
      loadData();
      showToast('تم تحديث البيانات المالية', 'info');
    });
    
    realtimeSubscriptionRef.current = subscriptions;
    
    // تنظيف الاشتراك عند إلغاء تحميل المكون
    return () => {
      if (realtimeSubscriptionRef.current) {
        realtimeSubscriptionRef.current.unsubscribeAll();
      }
    };
  }, []);
  
  // تحميل بيانات الرسوم البيانية عند تغيير الفترة
  useEffect(() => {
    loadChartData();
  }, [period]);
  
  // تحميل البيانات
  const loadData = async () => {
    setIsLoading(true);
    
    try {
      // تحميل ملخص البيانات المالية
      const { data, error } = await financialService.getFinancialSummary();
      
      if (error) {
        throw error;
      }
      
      setSummary(data);
      
      // تحميل بيانات الرسوم البيانية
      await loadChartData();
    } catch (error) {
      console.error('Error loading financial data:', error);
      showToast('حدث خطأ أثناء تحميل البيانات المالية', 'error');
    } finally {
      setIsLoading(false);
    }
  };
  
  // تحميل بيانات الرسوم البيانية
  const loadChartData = async () => {
    try {
      const { data, error } = await financialService.getFinancialChartData({
        period
      });
      
      if (error) {
        throw error;
      }
      
      setChartData(data);
    } catch (error) {
      console.error('Error loading chart data:', error);
      showToast('حدث خطأ أثناء تحميل بيانات الرسوم البيانية', 'error');
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
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">لوحة التحكم المالية</h2>
        <Button onClick={loadData} variant="outline" disabled={isLoading}>
          {isLoading ? <Spinner size="sm" /> : 'تحديث البيانات'}
        </Button>
      </div>
      
      {isLoading && !summary ? (
        <div className="flex justify-center items-center h-64">
          <Spinner size="lg" />
        </div>
      ) : (
        <>
          {/* بطاقات الملخص */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <FinancialSummaryCard
              title="إجمالي الإيرادات"
              value={summary?.totalPayments || 0}
              description={`من ${summary?.paymentCount || 0} مدفوعات`}
              trend={10}
              colorScheme="green"
            />
            <FinancialSummaryCard
              title="إجمالي المصروفات"
              value={summary?.totalExpenses || 0}
              description={`من ${summary?.expenseCount || 0} مصروفات`}
              trend={-5}
              colorScheme="red"
            />
            <FinancialSummaryCard
              title="صافي الإيرادات"
              value={summary?.netRevenue || 0}
              description="الإيرادات - المصروفات"
              trend={8}
              colorScheme="blue"
            />
            <FinancialSummaryCard
              title="المبالغ المستحقة"
              value={summary?.totalDue || 0}
              description={`من ${summary?.studentCount || 0} طلاب`}
              trend={-3}
              colorScheme="amber"
            />
          </div>
          
          {/* الرسوم البيانية */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>تحليل الإيرادات والمصروفات</CardTitle>
                <Tabs value={period} onValueChange={setPeriod} className="w-auto">
                  <TabsList>
                    <TabsTrigger value="daily">يومي</TabsTrigger>
                    <TabsTrigger value="weekly">أسبوعي</TabsTrigger>
                    <TabsTrigger value="monthly">شهري</TabsTrigger>
                    <TabsTrigger value="quarterly">ربع سنوي</TabsTrigger>
                    <TabsTrigger value="yearly">سنوي</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                {chartData ? (
                  <RevenueExpenseChart data={chartData} />
                ) : (
                  <div className="flex justify-center items-center h-full">
                    <Spinner size="lg" />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
          
          {/* المزيد من البيانات */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>حالة المدفوعات</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <PaymentStatusChart
                    paid={summary?.totalPayments || 0}
                    due={summary?.totalDue || 0}
                    discount={summary?.totalDiscounts || 0}
                  />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>أحدث المعاملات</CardTitle>
              </CardHeader>
              <CardContent>
                <RecentTransactions />
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
