'use client';

import { useState, useEffect } from 'react';
import { DynamicImportExport } from '@/components/common/DynamicImportExport';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardContent } from '@/components/ui/Card';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/Alert';
import { showToast } from '@/components/ui/ToastContainer';
import { studentService } from '@/services/studentService';
import MainLayout from '@/components/layout/MainLayout';

export default function DynamicImportPage() {
  const [importComplete, setImportComplete] = useState(false);
  const [importResult, setImportResult] = useState<any>(null);

  // معالجة اكتمال الاستيراد
  const handleImportComplete = (result: any) => {
    setImportResult(result);
    setImportComplete(true);

    // إعادة تحميل البيانات بعد الاستيراد
    setTimeout(() => {
      setImportComplete(false);
      setImportResult(null);
    }, 10000);
  };

  return (
    <MainLayout>
      <div className="p-3 space-y-6">
        <PageHeader
          title="الاستيراد الديناميكي للطلاب"
          description="استيراد بيانات الطلاب من ملف Excel بأي هيكل"
        />

        {importComplete && importResult && (
          <Alert variant={importResult.success ? 'success' : 'destructive'}>
            <AlertTitle>
              {importResult.success ? 'تم الاستيراد بنجاح' : 'حدث خطأ أثناء الاستيراد'}
            </AlertTitle>
            <AlertDescription>
              {importResult.success ? (
                <div>
                  <p>تمت إضافة {importResult.addedCount} سجل جديد</p>
                  <p>تم تحديث {importResult.updatedCount} سجل موجود</p>
                  {importResult.newColumnsAdded && importResult.newColumnsAdded.length > 0 && (
                    <p>تمت إضافة أعمدة جديدة: {importResult.newColumnsAdded.join(', ')}</p>
                  )}
                </div>
              ) : (
                <div>
                  <p>عدد الأخطاء: {importResult.errorCount}</p>
                  {importResult.errors && importResult.errors.length > 0 && (
                    <p>الخطأ الأول: {importResult.errors[0].message || JSON.stringify(importResult.errors[0])}</p>
                  )}
                </div>
              )}
            </AlertDescription>
          </Alert>
        )}

        <Card>
          <CardContent className="p-6">
            <div className="space-y-6">
              <div className="bg-blue-50 p-4 rounded-md text-blue-700">
                <h3 className="font-semibold text-lg mb-2">ميزات الاستيراد الديناميكي</h3>
                <ul className="list-disc list-inside space-y-1">
                  <li>استيراد بيانات من ملف Excel بأي هيكل</li>
                  <li>إضافة أعمدة جديدة تلقائيًا إلى قاعدة البيانات</li>
                  <li>تخطيط الأعمدة بين Excel وقاعدة البيانات</li>
                  <li>معاينة البيانات قبل الاستيراد</li>
                  <li>تحديث السجلات الموجودة بناءً على الرقم القومي</li>
                </ul>
              </div>

              <DynamicImportExport
                tableName="students"
                identifierColumn="national_id"
                onImportComplete={handleImportComplete}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
