import { supabase } from '@/lib/supabase';

/**
 * خدمة إدارة سندات القبض والصرف
 */
export const receiptService = {
  /**
   * الحصول على أنواع السندات
   */
  getReceiptTypes() {
    return [
      { id: 'income', name: 'سند قبض' },
      { id: 'expense', name: 'سند صرف' }
    ];
  },
  
  /**
   * الحصول على أنواع الكيانات
   */
  getEntityTypes() {
    return [
      { id: 'student', name: 'طالب' },
      { id: 'employee', name: 'موظف' },
      { id: 'expense', name: 'مصروف' },
      { id: 'other', name: 'أخرى' }
    ];
  },
  
  /**
   * إنشاء رقم سند جديد
   */
  async generateReceiptNumber(type: string): Promise<string> {
    // الحصول على التاريخ الحالي
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    
    // تحديد بادئة السند حسب النوع
    const prefix = type === 'income' ? 'IN' : 'EX';
    
    // الحصول على آخر رقم سند
    const { data, error } = await supabase
      .from('receipts')
      .select('receipt_number')
      .ilike('receipt_number', `${prefix}${year}${month}%`)
      .order('receipt_number', { ascending: false })
      .limit(1);
    
    let sequenceNumber = 1;
    
    if (!error && data && data.length > 0) {
      // استخراج رقم التسلسل من آخر رقم سند
      const lastReceiptNumber = data[0].receipt_number;
      const lastSequence = parseInt(lastReceiptNumber.slice(-4), 10);
      sequenceNumber = lastSequence + 1;
    }
    
    // تنسيق رقم التسلسل
    const formattedSequence = String(sequenceNumber).padStart(4, '0');
    
    // إنشاء رقم السند
    return `${prefix}${year}${month}${formattedSequence}`;
  },
  
  /**
   * إنشاء سند جديد
   */
  async createReceipt(receipt: any): Promise<{ data: any | null; error: any }> {
    try {
      // إنشاء رقم سند جديد إذا لم يكن موجودًا
      if (!receipt.receipt_number) {
        receipt.receipt_number = await this.generateReceiptNumber(receipt.receipt_type);
      }
      
      // إضافة تاريخ الإنشاء والتحديث
      const newReceipt = {
        ...receipt,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      const { data, error } = await supabase
        .from('receipts')
        .insert([newReceipt])
        .select()
        .single();
      
      if (error) {
        throw error;
      }
      
      return { data, error: null };
    } catch (error) {
      console.error('Error creating receipt:', error);
      return { data: null, error };
    }
  },
  
  /**
   * الحصول على السندات
   */
  async getReceipts(params: any = {}): Promise<{ data: any[] | null; count: number | null; error: any }> {
    try {
      const {
        receipt_type,
        entity_type,
        entity_id,
        start_date,
        end_date,
        page = 1,
        limit = 10
      } = params;
      
      // حساب الإزاحة للصفحة
      const offset = (page - 1) * limit;
      
      // بناء الاستعلام
      let query = supabase
        .from('receipts')
        .select('*', { count: 'exact' });
      
      // إضافة الفلاتر
      if (receipt_type) {
        query = query.eq('receipt_type', receipt_type);
      }
      
      if (entity_type) {
        query = query.eq('entity_type', entity_type);
      }
      
      if (entity_id) {
        query = query.eq('entity_id', entity_id);
      }
      
      if (start_date) {
        query = query.gte('receipt_date', start_date);
      }
      
      if (end_date) {
        query = query.lte('receipt_date', end_date);
      }
      
      // إضافة الترتيب والحدود
      const { data, count, error } = await query
        .order('receipt_date', { ascending: false })
        .range(offset, offset + limit - 1);
      
      if (error) {
        throw error;
      }
      
      return { data, count, error: null };
    } catch (error) {
      console.error('Error fetching receipts:', error);
      return { data: null, count: null, error };
    }
  },
  
  /**
   * الحصول على سند بواسطة المعرف
   */
  async getReceiptById(id: string): Promise<{ data: any | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('receipts')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) {
        throw error;
      }
      
      return { data, error: null };
    } catch (error) {
      console.error('Error fetching receipt:', error);
      return { data: null, error };
    }
  },
  
  /**
   * تحديث سند
   */
  async updateReceipt(id: string, updates: any): Promise<{ data: any | null; error: any }> {
    try {
      // تحديث تاريخ التحديث
      const updatedReceipt = {
        ...updates,
        updated_at: new Date().toISOString()
      };
      
      const { data, error } = await supabase
        .from('receipts')
        .update(updatedReceipt)
        .eq('id', id)
        .select()
        .single();
      
      if (error) {
        throw error;
      }
      
      return { data, error: null };
    } catch (error) {
      console.error('Error updating receipt:', error);
      return { data: null, error };
    }
  },
  
  /**
   * حذف سند
   */
  async deleteReceipt(id: string): Promise<{ success: boolean; error: any }> {
    try {
      const { error } = await supabase
        .from('receipts')
        .delete()
        .eq('id', id);
      
      if (error) {
        throw error;
      }
      
      return { success: true, error: null };
    } catch (error) {
      console.error('Error deleting receipt:', error);
      return { success: false, error };
    }
  },
  
  /**
   * طباعة سند
   */
  printReceipt(receipt: any) {
    // إنشاء نافذة طباعة جديدة
    const printWindow = window.open('', '_blank');
    
    if (!printWindow) {
      console.error('Failed to open print window');
      return;
    }
    
    // تحديد نوع السند
    const receiptTypeText = receipt.receipt_type === 'income' ? 'سند قبض' : 'سند صرف';
    
    // تنسيق التاريخ
    const formattedDate = new Date(receipt.receipt_date).toLocaleDateString('ar-EG');
    
    // تنسيق المبلغ
    const formattedAmount = new Intl.NumberFormat('ar-EG', {
      style: 'currency',
      currency: 'EGP',
      maximumFractionDigits: 2
    }).format(receipt.amount);
    
    // إنشاء محتوى HTML للطباعة
    const printContent = `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${receiptTypeText} - ${receipt.receipt_number}</title>
        <style>
          body {
            font-family: 'Arial', sans-serif;
            margin: 0;
            padding: 20px;
            direction: rtl;
          }
          .receipt {
            border: 1px solid #000;
            padding: 20px;
            max-width: 800px;
            margin: 0 auto;
          }
          .receipt-header {
            text-align: center;
            margin-bottom: 20px;
            border-bottom: 2px solid #000;
            padding-bottom: 10px;
          }
          .receipt-title {
            font-size: 24px;
            font-weight: bold;
            margin: 10px 0;
          }
          .receipt-number {
            font-size: 18px;
            margin: 10px 0;
          }
          .receipt-date {
            font-size: 16px;
            margin: 10px 0;
          }
          .receipt-body {
            margin-bottom: 20px;
          }
          .receipt-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 10px;
          }
          .receipt-label {
            font-weight: bold;
            width: 30%;
          }
          .receipt-value {
            width: 70%;
          }
          .receipt-amount {
            font-size: 18px;
            font-weight: bold;
            text-align: center;
            margin: 20px 0;
            padding: 10px;
            border: 1px solid #000;
            background-color: #f9f9f9;
          }
          .receipt-footer {
            display: flex;
            justify-content: space-between;
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #000;
          }
          .receipt-signature {
            width: 45%;
            text-align: center;
          }
          .signature-line {
            border-top: 1px solid #000;
            margin-top: 40px;
            padding-top: 10px;
          }
          @media print {
            body {
              padding: 0;
            }
            .receipt {
              border: none;
            }
            .no-print {
              display: none;
            }
          }
        </style>
      </head>
      <body>
        <div class="receipt">
          <div class="receipt-header">
            <h1 class="receipt-title">نظام إدارة المدرسة</h1>
            <h2 class="receipt-title">${receiptTypeText}</h2>
            <p class="receipt-number">رقم السند: ${receipt.receipt_number}</p>
            <p class="receipt-date">التاريخ: ${formattedDate}</p>
          </div>
          
          <div class="receipt-body">
            <div class="receipt-row">
              <div class="receipt-label">نوع الكيان:</div>
              <div class="receipt-value">${this.getEntityTypeText(receipt.entity_type)}</div>
            </div>
            
            <div class="receipt-row">
              <div class="receipt-label">الوصف:</div>
              <div class="receipt-value">${receipt.description || ''}</div>
            </div>
            
            <div class="receipt-amount">
              المبلغ: ${formattedAmount}
            </div>
          </div>
          
          <div class="receipt-footer">
            <div class="receipt-signature">
              <div class="signature-line">توقيع المستلم</div>
            </div>
            <div class="receipt-signature">
              <div class="signature-line">توقيع المسؤول</div>
            </div>
          </div>
        </div>
        
        <div class="no-print" style="text-align: center; margin-top: 20px;">
          <button onclick="window.print()">طباعة</button>
          <button onclick="window.close()">إغلاق</button>
        </div>
      </body>
      </html>
    `;
    
    // كتابة المحتوى في نافذة الطباعة
    printWindow.document.write(printContent);
    printWindow.document.close();
    
    // طباعة النافذة بعد تحميل المحتوى
    printWindow.onload = function() {
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
      }, 500);
    };
  },
  
  /**
   * الحصول على نص نوع الكيان
   */
  getEntityTypeText(entityType: string): string {
    const entityTypes = this.getEntityTypes();
    const entity = entityTypes.find(e => e.id === entityType);
    return entity ? entity.name : entityType;
  }
};

export default receiptService;
