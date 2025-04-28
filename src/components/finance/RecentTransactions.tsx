'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { ArrowPathIcon } from '@heroicons/react/24/outline';
import { supabase } from '@/lib/supabase';
import Spinner from '@/components/ui/Spinner';

/**
 * مكون أحدث المعاملات
 */
export function RecentTransactions() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  
  // تحميل البيانات
  useEffect(() => {
    loadTransactions();
  }, []);
  
  // تحميل أحدث المعاملات
  const loadTransactions = async () => {
    setIsLoading(true);
    
    try {
      // الحصول على أحدث المدفوعات
      const { data: payments, error: paymentsError } = await supabase
        .from('payments')
        .select('*, students:student_id(full_name)')
        .order('payment_date', { ascending: false })
        .limit(5);
      
      if (paymentsError) {
        throw paymentsError;
      }
      
      // الحصول على أحدث المصروفات
      const { data: expenses, error: expensesError } = await supabase
        .from('expenses')
        .select('*')
        .order('expense_date', { ascending: false })
        .limit(5);
      
      if (expensesError) {
        throw expensesError;
      }
      
      // دمج وترتيب المعاملات
      const allTransactions = [
        ...(payments || []).map((payment: any) => ({
          id: payment.id,
          date: payment.payment_date,
          amount: payment.amount,
          type: 'payment',
          description: `دفعة من ${payment.students?.full_name || 'طالب'}`,
          paymentMethod: payment.payment_method
        })),
        ...(expenses || []).map((expense: any) => ({
          id: expense.id,
          date: expense.expense_date,
          amount: expense.amount,
          type: 'expense',
          description: expense.description || `مصروف - ${expense.category}`,
          paymentMethod: expense.payment_method
        }))
      ];
      
      // ترتيب المعاملات حسب التاريخ
      allTransactions.sort((a, b) => {
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      });
      
      // الاحتفاظ بأحدث 5 معاملات
      setTransactions(allTransactions.slice(0, 5));
    } catch (error) {
      console.error('Error loading transactions:', error);
    } finally {
      setIsLoading(false);
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
  
  // تنسيق التاريخ
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };
  
  // الحصول على لون الشارة حسب نوع المعاملة
  const getBadgeVariant = (type: string) => {
    return type === 'payment' ? 'success' : 'destructive';
  };
  
  // الحصول على نص الشارة حسب نوع المعاملة
  const getBadgeText = (type: string) => {
    return type === 'payment' ? 'إيراد' : 'مصروف';
  };
  
  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-sm font-medium text-gray-500">آخر 5 معاملات</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={loadTransactions}
          disabled={isLoading}
        >
          {isLoading ? <Spinner size="sm" /> : <ArrowPathIcon className="w-4 h-4" />}
        </Button>
      </div>
      
      {isLoading && transactions.length === 0 ? (
        <div className="flex justify-center items-center h-40">
          <Spinner size="md" />
        </div>
      ) : transactions.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          لا توجد معاملات حديثة
        </div>
      ) : (
        <div className="space-y-4">
          {transactions.map((transaction) => (
            <div
              key={`${transaction.type}-${transaction.id}`}
              className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
            >
              <div className="flex flex-col">
                <div className="flex items-center">
                  <Badge variant={getBadgeVariant(transaction.type)}>
                    {getBadgeText(transaction.type)}
                  </Badge>
                  <span className="text-xs text-gray-500 mr-2">
                    {formatDate(transaction.date)}
                  </span>
                </div>
                <div className="mt-1 text-sm">{transaction.description}</div>
              </div>
              <div className={`font-bold ${transaction.type === 'payment' ? 'text-green-600' : 'text-red-600'}`}>
                {transaction.type === 'payment' ? '+' : '-'} {formatCurrency(transaction.amount)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
