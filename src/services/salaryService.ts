import { supabase } from '@/lib/supabase';

/**
 * خدمة إدارة الرواتب
 */
export const salaryService = {
  /**
   * الحصول على حالات الدفع
   */
  getPaymentStatuses() {
    return [
      { id: 'pending', name: 'قيد الانتظار' },
      { id: 'paid', name: 'مدفوع' },
      { id: 'partial', name: 'مدفوع جزئيًا' },
      { id: 'cancelled', name: 'ملغي' }
    ];
  },
  
  /**
   * الحصول على الرواتب
   */
  async getSalaries(params: any = {}): Promise<{ data: any[] | null; count: number | null; error: any }> {
    try {
      const {
        employee_id,
        salary_month,
        payment_status,
        page = 1,
        limit = 10
      } = params;
      
      // حساب الإزاحة للصفحة
      const offset = (page - 1) * limit;
      
      // بناء الاستعلام
      let query = supabase
        .from('salaries')
        .select('*, employees:employee_id(*)', { count: 'exact' });
      
      // إضافة الفلاتر
      if (employee_id) {
        query = query.eq('employee_id', employee_id);
      }
      
      if (salary_month) {
        query = query.eq('salary_month', salary_month);
      }
      
      if (payment_status) {
        query = query.eq('payment_status', payment_status);
      }
      
      // إضافة الترتيب والحدود
      const { data, count, error } = await query
        .order('salary_month', { ascending: false })
        .range(offset, offset + limit - 1);
      
      if (error) {
        throw error;
      }
      
      return { data, count, error: null };
    } catch (error) {
      console.error('Error fetching salaries:', error);
      return { data: null, count: null, error };
    }
  },
  
  /**
   * إنشاء راتب جديد
   */
  async createSalary(salary: any): Promise<{ data: any | null; error: any }> {
    try {
      // حساب صافي الراتب
      const netSalary = this.calculateNetSalary(
        salary.base_salary,
        salary.allowances,
        salary.deductions
      );
      
      // إضافة صافي الراتب وتاريخ الإنشاء والتحديث
      const newSalary = {
        ...salary,
        net_salary: netSalary,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      const { data, error } = await supabase
        .from('salaries')
        .insert([newSalary])
        .select()
        .single();
      
      if (error) {
        throw error;
      }
      
      return { data, error: null };
    } catch (error) {
      console.error('Error creating salary:', error);
      return { data: null, error };
    }
  },
  
  /**
   * تحديث راتب
   */
  async updateSalary(id: string, updates: any): Promise<{ data: any | null; error: any }> {
    try {
      // حساب صافي الراتب إذا تم تحديث الراتب الأساسي أو البدلات أو الخصومات
      let netSalary = updates.net_salary;
      
      if (
        updates.base_salary !== undefined ||
        updates.allowances !== undefined ||
        updates.deductions !== undefined
      ) {
        // الحصول على البيانات الحالية
        const { data: currentSalary, error: fetchError } = await supabase
          .from('salaries')
          .select('base_salary, allowances, deductions')
          .eq('id', id)
          .single();
        
        if (fetchError) {
          throw fetchError;
        }
        
        // حساب صافي الراتب الجديد
        netSalary = this.calculateNetSalary(
          updates.base_salary !== undefined ? updates.base_salary : currentSalary.base_salary,
          updates.allowances !== undefined ? updates.allowances : currentSalary.allowances,
          updates.deductions !== undefined ? updates.deductions : currentSalary.deductions
        );
      }
      
      // تحديث صافي الراتب وتاريخ التحديث
      const updatedSalary = {
        ...updates,
        net_salary: netSalary,
        updated_at: new Date().toISOString()
      };
      
      const { data, error } = await supabase
        .from('salaries')
        .update(updatedSalary)
        .eq('id', id)
        .select()
        .single();
      
      if (error) {
        throw error;
      }
      
      return { data, error: null };
    } catch (error) {
      console.error('Error updating salary:', error);
      return { data: null, error };
    }
  },
  
  /**
   * حذف راتب
   */
  async deleteSalary(id: string): Promise<{ success: boolean; error: any }> {
    try {
      const { error } = await supabase
        .from('salaries')
        .delete()
        .eq('id', id);
      
      if (error) {
        throw error;
      }
      
      return { success: true, error: null };
    } catch (error) {
      console.error('Error deleting salary:', error);
      return { success: false, error };
    }
  },
  
  /**
   * إنشاء رواتب شهرية للموظفين
   */
  async generateMonthlySalaries(month: string): Promise<{ success: boolean; count: number; error: any }> {
    try {
      // الحصول على جميع الموظفين النشطين
      const { data: employees, error: employeesError } = await supabase
        .from('employees')
        .select('id, base_salary, allowances, deductions')
        .eq('status', 'active');
      
      if (employeesError) {
        throw employeesError;
      }
      
      if (!employees || employees.length === 0) {
        return { success: true, count: 0, error: null };
      }
      
      // إنشاء رواتب للموظفين
      const salaries = employees.map(employee => ({
        employee_id: employee.id,
        salary_month: month,
        base_salary: employee.base_salary,
        allowances: employee.allowances || 0,
        deductions: employee.deductions || 0,
        net_salary: this.calculateNetSalary(
          employee.base_salary,
          employee.allowances || 0,
          employee.deductions || 0
        ),
        payment_status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }));
      
      // إدخال الرواتب في قاعدة البيانات
      const { data, error } = await supabase
        .from('salaries')
        .insert(salaries);
      
      if (error) {
        throw error;
      }
      
      return { success: true, count: salaries.length, error: null };
    } catch (error) {
      console.error('Error generating monthly salaries:', error);
      return { success: false, count: 0, error };
    }
  },
  
  /**
   * تحديث حالة دفع الراتب
   */
  async updateSalaryPaymentStatus(id: string, status: string, paymentDate?: string): Promise<{ success: boolean; error: any }> {
    try {
      const updates: any = {
        payment_status: status,
        updated_at: new Date().toISOString()
      };
      
      if (paymentDate) {
        updates.payment_date = paymentDate;
      }
      
      const { error } = await supabase
        .from('salaries')
        .update(updates)
        .eq('id', id);
      
      if (error) {
        throw error;
      }
      
      return { success: true, error: null };
    } catch (error) {
      console.error('Error updating salary payment status:', error);
      return { success: false, error };
    }
  },
  
  /**
   * حساب صافي الراتب
   */
  calculateNetSalary(baseSalary: number, allowances: number, deductions: number): number {
    return Number(baseSalary) + Number(allowances) - Number(deductions);
  },
  
  /**
   * الحصول على إحصائيات الرواتب
   */
  async getSalaryStatistics(params: any = {}): Promise<{ data: any | null; error: any }> {
    try {
      const { year, month } = params;
      
      // بناء الاستعلام
      let query = supabase
        .from('salaries')
        .select('salary_month, base_salary, allowances, deductions, net_salary, payment_status');
      
      // إضافة فلاتر السنة والشهر
      if (year) {
        query = query.ilike('salary_month', `${year}-%`);
      }
      
      if (month) {
        query = query.eq('salary_month', month);
      }
      
      // تنفيذ الاستعلام
      const { data, error } = await query;
      
      if (error) {
        throw error;
      }
      
      // تجميع البيانات
      let totalBaseSalary = 0;
      let totalAllowances = 0;
      let totalDeductions = 0;
      let totalNetSalary = 0;
      let pendingCount = 0;
      let paidCount = 0;
      let partialCount = 0;
      let cancelledCount = 0;
      
      // تجميع البيانات حسب الشهر
      const monthlyData: Record<string, any> = {};
      
      data.forEach(salary => {
        // إجماليات عامة
        totalBaseSalary += Number(salary.base_salary);
        totalAllowances += Number(salary.allowances);
        totalDeductions += Number(salary.deductions);
        totalNetSalary += Number(salary.net_salary);
        
        // عدد الرواتب حسب الحالة
        switch (salary.payment_status) {
          case 'pending':
            pendingCount++;
            break;
          case 'paid':
            paidCount++;
            break;
          case 'partial':
            partialCount++;
            break;
          case 'cancelled':
            cancelledCount++;
            break;
        }
        
        // تجميع البيانات حسب الشهر
        if (!monthlyData[salary.salary_month]) {
          monthlyData[salary.salary_month] = {
            month: salary.salary_month,
            count: 0,
            totalBaseSalary: 0,
            totalAllowances: 0,
            totalDeductions: 0,
            totalNetSalary: 0
          };
        }
        
        monthlyData[salary.salary_month].count++;
        monthlyData[salary.salary_month].totalBaseSalary += Number(salary.base_salary);
        monthlyData[salary.salary_month].totalAllowances += Number(salary.allowances);
        monthlyData[salary.salary_month].totalDeductions += Number(salary.deductions);
        monthlyData[salary.salary_month].totalNetSalary += Number(salary.net_salary);
      });
      
      // تحويل البيانات الشهرية إلى مصفوفة وترتيبها
      const monthlyDataArray = Object.values(monthlyData).sort((a, b) => {
        return b.month.localeCompare(a.month);
      });
      
      // إعداد البيانات
      const statistics = {
        totalCount: data.length,
        totalBaseSalary,
        totalAllowances,
        totalDeductions,
        totalNetSalary,
        statusCounts: {
          pending: pendingCount,
          paid: paidCount,
          partial: partialCount,
          cancelled: cancelledCount
        },
        monthlyData: monthlyDataArray
      };
      
      return { data: statistics, error: null };
    } catch (error) {
      console.error('Error fetching salary statistics:', error);
      return { data: null, error };
    }
  }
};

export default salaryService;
