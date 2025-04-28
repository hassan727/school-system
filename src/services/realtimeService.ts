import { supabase } from '@/lib/supabase';

// تعريف أنواع الأحداث
export type RealtimeEvent = 'INSERT' | 'UPDATE' | 'DELETE' | '*';

// تعريف أنواع الجداول
export type TableName = 'students' | 'classrooms' | 'stages' | 'payments' | 'installments' | 'expenses' | 'receipts';

// تعريف نوع الاشتراك
export interface SubscriptionOptions {
  table: TableName;
  event?: RealtimeEvent;
  filter?: string;
  filterValue?: any;
}

/**
 * خدمة الاستماع للتغييرات في الوقت الحقيقي
 */
export const realtimeService = {
  // تخزين الاشتراكات النشطة
  activeSubscriptions: new Map<string, any>(),

  /**
   * الاستماع للتغييرات في جدول معين
   * @param options خيارات الاشتراك
   * @param callback الدالة التي سيتم استدعاؤها عند حدوث تغيير
   * @returns كائن الاشتراك
   */
  subscribeToTable(
    options: SubscriptionOptions,
    callback: (payload: any) => void
  ) {
    const { table, event = '*', filter, filterValue } = options;

    console.log(`Subscribing to changes in ${table} table, event: ${event}`);

    // إنشاء معرف فريد للاشتراك
    const subscriptionId = `${table}:${event}:${filter || 'all'}`;

    // التحقق مما إذا كان الاشتراك موجودًا بالفعل
    if (this.activeSubscriptions.has(subscriptionId)) {
      console.log(`Subscription already exists for ${subscriptionId}`);
      return this.activeSubscriptions.get(subscriptionId);
    }

    // التأكد من تفعيل ميزة الوقت الحقيقي
    supabase.realtime.setAuth(supabase.auth.getSession()?.access_token || '');

    // إعداد خيارات الاشتراك
    const subscriptionOptions: any = {
      event: event,
      schema: 'public',
      table: table
    };

    // إضافة فلتر إذا كان موجودًا
    if (filter && filterValue !== undefined) {
      subscriptionOptions.filter = `${filter}=eq.${filterValue}`;
    }

    // الاشتراك في التغييرات
    const subscription = supabase
      .channel(`public:${subscriptionId}`)
      .on('postgres_changes', subscriptionOptions, (payload) => {
        console.log(`Realtime event received for ${table}:`, payload.eventType);
        callback(payload);
      })
      .subscribe((status) => {
        console.log(`Subscription status for ${subscriptionId}:`, status);
      });

    // تخزين الاشتراك
    this.activeSubscriptions.set(subscriptionId, subscription);

    return subscription;
  },

  /**
   * الاستماع للتغييرات في جدول الطلاب
   * @param callback الدالة التي سيتم استدعاؤها عند حدوث تغيير
   * @param studentId معرف الطالب (اختياري)
   * @returns كائن الاشتراك
   */
  subscribeToStudents(callback: (payload: any) => void, studentId?: string) {
    const options: SubscriptionOptions = {
      table: 'students'
    };

    if (studentId) {
      options.filter = 'id';
      options.filterValue = studentId;
    }

    return this.subscribeToTable(options, callback);
  },

  /**
   * الاستماع للتغييرات في جدول الفصول الدراسية
   * @param callback الدالة التي سيتم استدعاؤها عند حدوث تغيير
   * @param classroomId معرف الفصل (اختياري)
   * @returns كائن الاشتراك
   */
  subscribeToClassrooms(callback: (payload: any) => void, classroomId?: string) {
    const options: SubscriptionOptions = {
      table: 'classrooms'
    };

    if (classroomId) {
      options.filter = 'id';
      options.filterValue = classroomId;
    }

    return this.subscribeToTable(options, callback);
  },

  /**
   * الاستماع للتغييرات في جدول المدفوعات
   * @param callback الدالة التي سيتم استدعاؤها عند حدوث تغيير
   * @param studentId معرف الطالب (اختياري)
   * @returns كائن الاشتراك
   */
  subscribeToPayments(callback: (payload: any) => void, studentId?: string) {
    const options: SubscriptionOptions = {
      table: 'payments'
    };

    if (studentId) {
      options.filter = 'student_id';
      options.filterValue = studentId;
    }

    return this.subscribeToTable(options, callback);
  },

  /**
   * الاستماع للتغييرات في جدول الأقساط
   * @param callback الدالة التي سيتم استدعاؤها عند حدوث تغيير
   * @param studentId معرف الطالب (اختياري)
   * @returns كائن الاشتراك
   */
  subscribeToInstallments(callback: (payload: any) => void, studentId?: string) {
    const options: SubscriptionOptions = {
      table: 'installments'
    };

    if (studentId) {
      options.filter = 'student_id';
      options.filterValue = studentId;
    }

    return this.subscribeToTable(options, callback);
  },

  /**
   * إلغاء الاشتراك
   * @param subscription كائن الاشتراك
   */
  unsubscribe(subscription: any) {
    if (subscription) {
      // البحث عن معرف الاشتراك
      for (const [id, sub] of this.activeSubscriptions.entries()) {
        if (sub === subscription) {
          this.activeSubscriptions.delete(id);
          break;
        }
      }

      supabase.removeChannel(subscription);
    }
  },

  /**
   * إلغاء جميع الاشتراكات
   */
  unsubscribeAll() {
    for (const subscription of this.activeSubscriptions.values()) {
      supabase.removeChannel(subscription);
    }

    this.activeSubscriptions.clear();
  }
};

export default realtimeService;
