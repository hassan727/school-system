import { jsPDF } from 'jspdf';

// تعريف الأنواع
interface ExportOptions {
  fileName: string;
  title?: string;
  subtitle?: string;
  orientation?: 'portrait' | 'landscape';
  pageSize?: string;
  rtl?: boolean;
}

/**
 * خدمة تصدير PDF بسيطة تعمل مع Next.js
 */
const simplePdfService = {
  /**
   * تصدير البيانات إلى ملف PDF
   */
  exportToPDF(
    data: any[],
    options: ExportOptions
  ): Promise<boolean> {
    return new Promise((resolve, reject) => {
      try {
        console.log('Exporting data to PDF using simple PDF service:', data.length, 'records');

        const {
          fileName = 'export',
          title,
          subtitle,
          orientation = 'portrait',
          pageSize = 'a4',
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

        // تحضير البيانات
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

        // إضافة العنوان
        let yPos = 20;
        if (title) {
          doc.setFontSize(18);
          doc.text(title, doc.internal.pageSize.getWidth() / 2, yPos, { align: 'center' });
          yPos += 15;
        }

        // إضافة العنوان الفرعي
        if (subtitle) {
          doc.setFontSize(12);
          doc.text(subtitle, doc.internal.pageSize.getWidth() / 2, yPos, { align: 'center' });
          yPos += 15;
        }

        // إنشاء جدول بسيط
        const headers = Object.keys(data[0]);
        const cellWidth = (doc.internal.pageSize.getWidth() - 20) / headers.length;
        const cellHeight = 10;
        
        // رسم خلفية رأس الجدول
        doc.setFillColor(220, 220, 220);
        doc.rect(10, yPos, doc.internal.pageSize.getWidth() - 20, cellHeight, 'F');
        
        // إضافة عناوين الأعمدة
        doc.setFontSize(10);
        doc.setTextColor(0, 0, 0);
        headers.forEach((header, index) => {
          const xPos = rtl 
            ? doc.internal.pageSize.getWidth() - 10 - (index * cellWidth)
            : 10 + (index * cellWidth);
          doc.text(header, xPos - (rtl ? 0 : cellWidth/2), yPos + 7, { align: rtl ? 'right' : 'left' });
        });
        
        yPos += cellHeight;
        
        // إضافة بيانات الصفوف
        let rowCount = 0;
        data.forEach(row => {
          // التحقق مما إذا كانت الصفحة الحالية ممتلئة
          if (yPos > doc.internal.pageSize.getHeight() - 20) {
            doc.addPage();
            yPos = 20;
          }
          
          // رسم خلفية الصف (متناوبة)
          if (rowCount % 2 === 1) {
            doc.setFillColor(245, 245, 245);
            doc.rect(10, yPos, doc.internal.pageSize.getWidth() - 20, cellHeight, 'F');
          }
          
          // إضافة بيانات الصف
          headers.forEach((header, index) => {
            const value = row[header] !== undefined && row[header] !== null 
              ? String(row[header]) 
              : '';
            
            const xPos = rtl 
              ? doc.internal.pageSize.getWidth() - 10 - (index * cellWidth)
              : 10 + (index * cellWidth);
            
            doc.text(value, xPos - (rtl ? 0 : cellWidth/2), yPos + 7, { align: rtl ? 'right' : 'left' });
          });
          
          yPos += cellHeight;
          rowCount++;
        });
        
        // إضافة تذييل الصفحة
        const totalPages = doc.internal.getNumberOfPages();
        for (let i = 1; i <= totalPages; i++) {
          doc.setPage(i);
          
          // تذييل الصفحة
          const today = new Date();
          const dateStr = `${today.getDate()}/${today.getMonth() + 1}/${today.getFullYear()}`;
          const footerText = `الصفحة ${i} من ${totalPages} - تم الإنشاء في ${dateStr}`;
          
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

export default simplePdfService;
