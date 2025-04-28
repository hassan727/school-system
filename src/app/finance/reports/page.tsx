'use client';

import { useState, useEffect } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { Select } from '@/components/ui/Select';
import { Label } from '@/components/ui/Label';
import { Input } from '@/components/ui/Input';
import { ArrowDownTrayIcon, PrinterIcon } from '@heroicons/react/24/outline';
import { financialService } from '@/services/financialService';
import { expenseService } from '@/services/expenseService';
import { paymentService } from '@/services/paymentService';
import { showToast } from '@/components/ui/ToastContainer';
import { RevenueExpenseChart } from '@/components/finance/RevenueExpenseChart';
import { PaymentStatusChart } from '@/components/finance/PaymentStatusChart';
import Spinner from '@/components/ui/Spinner';

/**
 * صفحة التقارير المالية
 */
export default function FinancialReportsPage() {
  const [activeTab, setActiveTab] = useState<string>('summary');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [summary, setSummary] = useState<any>(null);
  const [chartData, setChartData] = useState<any>(null);
  const [expenseStats, setExpenseStats] = useState<any>(null);
  const [period, setPeriod] = useState<string>('monthly');
  const [year, setYear] = useState<string>(new Date().getFullYear().toString());
  const [dateRange, setDateRange] = useState({
    start_date: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0],
    end_date: new Date().toISOString().split('T')[0]
  });
  
  // تحميل البيانات
  useEffect(() => {
    loadData();
  }, [activeTab, period, year, dateRange]);
  
  // تحميل البيانات
  const loadData = async () => {
    setIsLoading(true);
    
    try {
      // تحميل البيانات حسب التبويب النشط
      switch (activeTab) {
        case 'summary':
          await loadSummary();
          break;
        case 'revenue-expense':
          await loadChartData();
          break;
        case 'expenses':
          await loadExpenseStats();
          break;
        default:
          await loadSummary();
      }
    } catch (error) {
      console.error('Error loading financial data:', error);
      showToast('حدث خطأ أثناء تحميل البيانات المالية', 'error');
    } finally {
      setIsLoading(false);
    }
  };
  
  // تحميل ملخص البيانات المالية
  const loadSummary = async () => {
    const { data, error } = await financialService.getFinancialSummary({
      start_date: dateRange.start_date,
      end_date: dateRange.end_date
    });
    
    if (error) {
      throw error;
    }
    
    setSummary(data);
  };
  
  // تحميل بيانات الرسوم البيانية
  const loadChartData = async () => {
    const { data, error } = await financialService.getFinancialChartData({
      period,
      year: parseInt(year)
    });
    
    if (error) {
      throw error;
    }
    
    setChartData(data);
  };
  
  // تحميل إحصائيات المصروفات
  const loadExpenseStats = async () => {
    const { data, error } = await expenseService.getExpenseStatistics({
      start_date: dateRange.start_date,
      end_date: dateRange.end_date
    });
    
    if (error) {
      throw error;
    }
    
    setExpenseStats(data);
  };
  
  // تغيير قيمة حقل التاريخ
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setDateRange(prev => ({ ...prev, [name]: value }));
  };
  
  // تنسيق المبلغ بالجنيه المصري
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-EG', {
      style: 'currency',
      currency: 'EGP',
      maximumFractionDigits: 0
    }).format(amount);
  };
  
  // طباعة التقرير
  const handlePrint = () => {
    window.print();
  };
  
  // تصدير التقرير إلى Excel
  const handleExport = () => {
    // تنفيذ تصدير التقرير إلى Excel
    showToast('جاري تطوير ميزة التصدير إلى Excel', 'info');
  };
  
  return (
    <MainLayout>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">التقارير المالية</h1>
          <div className="flex space-x-2">
            <Button variant="outline" onClick={handlePrint}>
              <PrinterIcon className="w-5 h-5 ml-2" />
              طباعة
            </Button>
            <Button variant="outline" onClick={handleExport}>
              <ArrowDownTrayIcon className="w-5 h-5 ml-2" />
              تصدير إلى Excel
            </Button>
          </div>
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="summary">ملخص مالي</TabsTrigger>
            <TabsTrigger value="revenue-expense">الإيرادات والمصروفات</TabsTrigger>
            <TabsTrigger value="expenses">تحليل المصروفات</TabsTrigger>
          </TabsList>
          
          {/* تبويب الملخص المالي */}
          <TabsContent value="summary">
            <Card className="mb-6">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>نطاق التقرير</CardTitle>
                  <Button variant="outline" onClick={loadSummary} disabled={isLoading}>
                    {isLoading ? <Spinner size="sm" /> : 'تحديث'}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="start_date">من تاريخ</Label>
                    <Input
                      id="start_date"
                      name="start_date"
                      type="date"
                      value={dateRange.start_date}
                      onChange={handleDateChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="end_date">إلى تاريخ</Label>
                    <Input
                      id="end_date"
                      name="end_date"
                      type="date"
                      value={dateRange.end_date}
                      onChange={handleDateChange}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {isLoading ? (
              <div className="flex justify-center items-center h-64">
                <Spinner size="lg" />
              </div>
            ) : summary ? (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>ملخص مالي</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                        <p className="text-sm text-gray-600 dark:text-gray-400">إجمالي الإيرادات</p>
                        <p className="text-2xl font-bold">{formatCurrency(summary.totalPayments)}</p>
                        <p className="text-xs text-gray-500 mt-2">من {summary.paymentCount} مدفوعات</p>
                      </div>
                      <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
                        <p className="text-sm text-gray-600 dark:text-gray-400">إجمالي المصروفات</p>
                        <p className="text-2xl font-bold">{formatCurrency(summary.totalExpenses)}</p>
                        <p className="text-xs text-gray-500 mt-2">من {summary.expenseCount} مصروفات</p>
                      </div>
                      <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                        <p className="text-sm text-gray-600 dark:text-gray-400">صافي الإيرادات</p>
                        <p className="text-2xl font-bold">{formatCurrency(summary.netRevenue)}</p>
                        <p className="text-xs text-gray-500 mt-2">الإيرادات - المصروفات</p>
                      </div>
                      <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-lg">
                        <p className="text-sm text-gray-600 dark:text-gray-400">المبالغ المستحقة</p>
                        <p className="text-2xl font-bold">{formatCurrency(summary.totalDue)}</p>
                        <p className="text-xs text-gray-500 mt-2">من {summary.studentCount} طلاب</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>حالة المدفوعات</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-64">
                        <PaymentStatusChart
                          paid={summary.totalPayments}
                          due={summary.totalDue}
                          discount={summary.totalDiscounts}
                        />
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle>تفاصيل الرسوم</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                          <span>إجمالي الرسوم</span>
                          <span className="font-bold">{formatCurrency(summary.totalFees)}</span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                          <span>إجمالي الخصومات</span>
                          <span className="font-bold">{formatCurrency(summary.totalDiscounts)}</span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                          <span>إجمالي المدفوعات</span>
                          <span className="font-bold">{formatCurrency(summary.totalPayments)}</span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                          <span>إجمالي المتبقي</span>
                          <span className="font-bold">{formatCurrency(summary.totalDue)}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                لا توجد بيانات متاحة. يرجى تحديد نطاق تاريخ مختلف.
              </div>
            )}
          </TabsContent>
          
          {/* تبويب الإيرادات والمصروفات */}
          <TabsContent value="revenue-expense">
            <Card className="mb-6">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>إعدادات التقرير</CardTitle>
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <Label htmlFor="period">الفترة</Label>
                      <Select
                        id="period"
                        value={period}
                        onChange={(e) => setPeriod(e.target.value)}
                        className="w-32"
                      >
                        <option value="daily">يومي</option>
                        <option value="weekly">أسبوعي</option>
                        <option value="monthly">شهري</option>
                        <option value="quarterly">ربع سنوي</option>
                        <option value="yearly">سنوي</option>
                      </Select>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Label htmlFor="year">السنة</Label>
                      <Select
                        id="year"
                        value={year}
                        onChange={(e) => setYear(e.target.value)}
                        className="w-32"
                      >
                        {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map((y) => (
                          <option key={y} value={y}>
                            {y}
                          </option>
                        ))}
                      </Select>
                    </div>
                    <Button variant="outline" onClick={loadChartData} disabled={isLoading}>
                      {isLoading ? <Spinner size="sm" /> : 'تحديث'}
                    </Button>
                  </div>
                </div>
              </CardHeader>
            </Card>
            
            {isLoading ? (
              <div className="flex justify-center items-center h-64">
                <Spinner size="lg" />
              </div>
            ) : chartData ? (
              <Card>
                <CardHeader>
                  <CardTitle>تحليل الإيرادات والمصروفات</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-96">
                    <RevenueExpenseChart data={chartData} />
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="text-center py-8 text-gray-500">
                لا توجد بيانات متاحة. يرجى تحديد فترة أو سنة مختلفة.
              </div>
            )}
          </TabsContent>
          
          {/* تبويب تحليل المصروفات */}
          <TabsContent value="expenses">
            <Card className="mb-6">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>نطاق التقرير</CardTitle>
                  <Button variant="outline" onClick={loadExpenseStats} disabled={isLoading}>
                    {isLoading ? <Spinner size="sm" /> : 'تحديث'}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="expenses_start_date">من تاريخ</Label>
                    <Input
                      id="expenses_start_date"
                      name="start_date"
                      type="date"
                      value={dateRange.start_date}
                      onChange={handleDateChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="expenses_end_date">إلى تاريخ</Label>
                    <Input
                      id="expenses_end_date"
                      name="end_date"
                      type="date"
                      value={dateRange.end_date}
                      onChange={handleDateChange}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {isLoading ? (
              <div className="flex justify-center items-center h-64">
                <Spinner size="lg" />
              </div>
            ) : expenseStats ? (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>ملخص المصروفات</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
                        <p className="text-sm text-gray-600 dark:text-gray-400">إجمالي المصروفات</p>
                        <p className="text-2xl font-bold">{formatCurrency(expenseStats.totalExpenses)}</p>
                        <p className="text-xs text-gray-500 mt-2">من {expenseStats.expensesCount} مصروفات</p>
                      </div>
                      <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                        <p className="text-sm text-gray-600 dark:text-gray-400">عدد الفئات</p>
                        <p className="text-2xl font-bold">{expenseStats.categoriesCount}</p>
                        <p className="text-xs text-gray-500 mt-2">فئات المصروفات</p>
                      </div>
                      <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-lg">
                        <p className="text-sm text-gray-600 dark:text-gray-400">متوسط المصروفات</p>
                        <p className="text-2xl font-bold">
                          {formatCurrency(expenseStats.expensesCount > 0 ? expenseStats.totalExpenses / expenseStats.expensesCount : 0)}
                        </p>
                        <p className="text-xs text-gray-500 mt-2">لكل مصروف</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>المصروفات حسب الفئة</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {expenseStats.categoriesData.map((category: any, index: number) => (
                        <div key={index} className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span>{getCategoryName(category.category)}</span>
                            <span className="font-bold">{formatCurrency(category.amount)}</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                            <div
                              className="bg-blue-600 h-2.5 rounded-full"
                              style={{ width: `${category.percentage}%` }}
                            ></div>
                          </div>
                          <p className="text-xs text-gray-500 text-left">
                            {category.percentage.toFixed(1)}% من إجمالي المصروفات
                          </p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                لا توجد بيانات متاحة. يرجى تحديد نطاق تاريخ مختلف.
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
  
  // الحصول على اسم الفئة
  function getCategoryName(categoryId: string) {
    const categories = expenseService.getExpenseCategories();
    const category = categories.find(c => c.id === categoryId);
    return category ? category.name : categoryId;
  }
}
