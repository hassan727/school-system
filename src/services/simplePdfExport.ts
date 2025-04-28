import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import autoTable from 'jspdf-autotable';

// تعريف الأنواع
interface ExportOptions {
  fileName: string;
  title?: string;
  subtitle?: string;
  orientation?: 'portrait' | 'landscape';
  pageSize?: string;
  includeHeaders?: boolean;
  rtl?: boolean;
}

/**
 * خدمة تصدير بسيطة للـ PDF
 */
const simplePdfExport = {
  /**
   * تصدير البيانات إلى ملف PDF
   */
  exportToPDF(
    data: any[],
    options: ExportOptions
  ): Promise<boolean> {
    return new Promise((resolve, reject) => {
      try {
        console.log('Exporting data to PDF:', data.length, 'records');

        const {
          fileName = 'export',
          title,
          subtitle,
          orientation = 'portrait',
          pageSize = 'a4',
          includeHeaders = true,
          rtl = true
        } = options;

        // إنشاء مستند PDF
        const doc = new jsPDF({
          orientation,
          unit: 'mm',
          format: pageSize,
        });

        // تعيين الخط الافتراضي
        doc.setFont('helvetica');
        
        // تعيين الاتجاه من اليمين إلى اليسار
        if (rtl) {
          doc.setR2L(true);
        }

        // تحضير البيانات للجدول
        if (!data || data.length === 0) {
          // إذا لم تكن هناك بيانات، أضف رسالة
          doc.setFontSize(14);
          doc.text(
            'لا توجد بيانات للعرض',
            doc.internal.pageSize.getWidth() / 2,
            50,
            { align: 'center' }
          );
          doc.save(`${fileName}.pdf`);
          resolve(true);
          return;
        }

        // تحضير البيانات للجدول
        const headers = Object.keys(data[0]);
        const rows = data.map(item => headers.map(header => item[header]));

        // إضافة العنوان
        let yPos = 20;
        if (title) {
          doc.setFontSize(18);
          doc.text(title, doc.internal.pageSize.getWidth() / 2, yPos, { align: 'center' });
          yPos += 10;
        }

        // إضافة العنوان الفرعي
        if (subtitle) {
          doc.setFontSize(12);
          doc.text(subtitle, doc.internal.pageSize.getWidth() / 2, yPos, { align: 'center' });
          yPos += 10;
        }

        // إضافة الجدول باستخدام autoTable
        (doc as any).autoTable({
          head: includeHeaders ? [headers] : undefined,
          body: rows,
          startY: yPos,
          theme: 'grid',
          styles: {
            font: 'helvetica',
            fontSize: 10,
            cellPadding: 5,
            halign: rtl ? 'right' : 'left',
            valign: 'middle',
            lineColor: [200, 200, 200],
            lineWidth: 0.1
          },
          headStyles: {
            fillColor: [220, 220, 220],
            textColor: [0, 0, 0],
            fontStyle: 'bold',
          },
          alternateRowStyles: {
            fillColor: [245, 245, 245],
          },
          margin: { top: 15, right: 15, bottom: 15, left: 15 }
        });

        // إضافة تذييل الصفحة
        const totalPages = doc.internal.getNumberOfPages();
        for (let i = 1; i <= totalPages; i++) {
          doc.setPage(i);
          
          // تذييل الصفحة
          const today = new Date();
          const dateStr = `${today.getDate()}/${today.getMonth() + 1}/${today.getFullYear()}`;
          const footerText = `Page ${i} of ${totalPages} - Generated on ${dateStr}`;
          
          doc.setFontSize(8);
          doc.text(
            footerText,
            doc.internal.pageSize.getWidth() / 2,
            doc.internal.pageSize.getHeight() - 10,
            { align: 'center' }
          );
        }

        // حفظ الملف
        doc.save(`${fileName}.pdf`);
        console.log('PDF export completed successfully');
        resolve(true);
      } catch (error) {
        console.error('Error exporting to PDF:', error);
        reject(error);
      }
    });
  }
};

export default simplePdfExport;
