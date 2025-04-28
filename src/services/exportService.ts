import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { ChartData } from 'chart.js';
import { Chart } from 'chart.js/auto';
import { AMIRI_REGULAR_BASE64, AMIRI_BOLD_BASE64 } from '@/assets/fonts/arabic-fonts';

// تعريف الأنواع لمكتبة jspdf-autotable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

/**
 * خيارات التصدير
 */
export interface ExportOptions {
  fileName: string;
  sheetName?: string;
  title?: string;
  subtitle?: string;
  orientation?: 'portrait' | 'landscape';
  pageSize?: 'a4' | 'a3' | 'letter';
  includeHeaders?: boolean;
  columnsToExport?: string[];
  columnTitles?: Record<string, string>;
  logo?: string;
  footer?: string;
  rtl?: boolean;
}

/**
 * خدمة تصدير البيانات
 */
export const exportService = {
  /**
   * تصدير البيانات إلى ملف Excel
   */
  exportToExcel(data: any[], options: ExportOptions): Promise<boolean> {
    return new Promise((resolve, reject) => {
      try {
        console.log('Exporting data to Excel:', data.length, 'records');

        const {
          fileName,
          sheetName = 'Sheet1',
          columnsToExport,
          columnTitles = {},
          includeHeaders = true
        } = options;

        // تصفية الأعمدة إذا تم تحديدها
        let filteredData = data;
        if (columnsToExport && columnsToExport.length > 0) {
          filteredData = data.map(item => {
            const filteredItem: Record<string, any> = {};
            columnsToExport.forEach(col => {
              if (item[col] !== undefined) {
                filteredItem[col] = item[col];
              }
            });
            return filteredItem;
          });
        }

        // إعادة تسمية الأعمدة إذا تم توفير عناوين مخصصة
        const renamedData = filteredData.map(item => {
          const renamedItem: Record<string, any> = {};
          Object.keys(item).forEach(key => {
            const newKey = columnTitles[key] || key;
            renamedItem[newKey] = item[key];
          });
          return renamedItem;
        });

        // إنشاء ورقة عمل
        const worksheet = XLSX.utils.json_to_sheet(renamedData);

        // تعديل عرض الأعمدة
        const columnWidths = [];
        for (const key in renamedData[0] || {}) {
          columnWidths.push({ wch: Math.max(key.length, 15) });
        }
        worksheet['!cols'] = columnWidths;

        // إنشاء مصنف عمل وإضافة ورقة العمل
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

        // تصدير الملف
        XLSX.writeFile(workbook, `${fileName}.xlsx`);

        console.log('Excel export completed successfully');
        resolve(true);
      } catch (error) {
        console.error('Error exporting to Excel:', error);
        reject(error);
      }
    });
  },

  /**
   * تصدير البيانات إلى ملف PDF
   */
  exportToPDF(data: any[], options: ExportOptions): Promise<boolean> {
    return new Promise((resolve, reject) => {
      try {
        console.log('Exporting data to PDF:', data.length, 'records');

        const {
          fileName,
          title,
          subtitle,
          orientation = 'portrait',
          pageSize = 'a4',
          columnsToExport,
          columnTitles = {},
          includeHeaders = true,
          logo,
          footer,
          rtl = true
        } = options;

        // تصفية الأعمدة وتنظيف البيانات لتجنب مشاكل مع النصوص العربية
        let filteredData = data;
        if (columnsToExport && columnsToExport.length > 0) {
          filteredData = data.map(item => {
            const filteredItem: Record<string, any> = {};
            columnsToExport.forEach(col => {
              if (item[col] !== undefined) {
                // تنظيف البيانات من الأحرف الخاصة التي قد تسبب مشاكل
                if (typeof item[col] === 'string') {
                  filteredItem[col] = item[col].replace(/[\u0000-\u001F]/g, '');
                } else {
                  filteredItem[col] = item[col];
                }
              }
            });
            return filteredItem;
          });
        } else {
          // تنظيف جميع البيانات إذا لم يتم تحديد أعمدة محددة
          filteredData = data.map(item => {
            const cleanedItem: Record<string, any> = {};
            Object.keys(item).forEach(key => {
              if (typeof item[key] === 'string') {
                cleanedItem[key] = item[key].replace(/[\u0000-\u001F]/g, '');
              } else {
                cleanedItem[key] = item[key];
              }
            });
            return cleanedItem;
          });
        }

        // إعادة تسمية الأعمدة إذا تم توفير عناوين مخصصة
        const renamedData = filteredData.map(item => {
          const renamedItem: Record<string, any> = {};
          Object.keys(item).forEach(key => {
            const newKey = columnTitles[key] || key;
            renamedItem[newKey] = item[key];
          });
          return renamedItem;
        });

        // إنشاء مستند PDF
        const doc = new jsPDF({
          orientation,
          unit: 'mm',
          format: pageSize,
        });

        // دعم اللغة العربية - استخدام خط متوافق مع jsPDF
        try {
          // استخدام خط متوافق مع jsPDF بدلاً من محاولة تحميل خط عربي
          // هذا سيمنع حدوث أخطاء مع النصوص العربية
          doc.setFont('helvetica');

          // تعيين الاتجاه من اليمين إلى اليسار للنصوص العربية
          if (rtl) {
            doc.setR2L(true);
          }

          console.log('Font configuration for PDF completed successfully');
        } catch (error) {
          console.warn('Font configuration failed, using default settings:', error);
          doc.setFont('helvetica');
        }

        // تم تعيين الاتجاه من اليمين إلى اليسار في إعدادات الخط

        // إضافة الترويسة
        let yPos = 20;

        // إضافة الشعار إذا تم توفيره
        if (logo) {
          try {
            doc.addImage(logo, 'JPEG', rtl ? doc.internal.pageSize.getWidth() - 40 : 10, 10, 30, 30);
          } catch (err) {
            console.error('Error adding logo to PDF:', err);
          }
        }

        // إضافة العنوان - تنظيف النص من الأحرف الخاصة
        if (title) {
          // تنظيف النص من الأحرف الخاصة التي قد تسبب مشاكل
          const cleanTitle = typeof title === 'string' ? title.replace(/[\u0000-\u001F]/g, '') : title;
          doc.setFontSize(18);
          doc.text(cleanTitle, doc.internal.pageSize.getWidth() / 2, yPos, { align: 'center' });
          yPos += 10;
        }

        // إضافة العنوان الفرعي - تنظيف النص من الأحرف الخاصة
        if (subtitle) {
          // تنظيف النص من الأحرف الخاصة التي قد تسبب مشاكل
          const cleanSubtitle = typeof subtitle === 'string' ? subtitle.replace(/[\u0000-\u001F]/g, '') : subtitle;
          doc.setFontSize(12);
          doc.text(cleanSubtitle, doc.internal.pageSize.getWidth() / 2, yPos, { align: 'center' });
          yPos += 10;
        }

        // تحويل البيانات إلى تنسيق مناسب للجدول
        const headers = Object.keys(renamedData[0] || {});
        const rows = renamedData.map(item => headers.map(header => item[header]));

        // إضافة الجدول مع إعدادات متوافقة مع النصوص العربية
        doc.autoTable({
          head: includeHeaders ? [headers] : undefined,
          body: rows,
          startY: yPos,
          theme: 'grid',
          styles: {
            font: 'helvetica', // استخدام خط متوافق مع jsPDF
            fontSize: 10,
            cellPadding: 5,
            lineColor: [200, 200, 200],
            lineWidth: 0.1,
            halign: rtl ? 'right' : 'left',
            valign: 'middle',
            overflow: 'linebreak',
            minCellWidth: 20
          },
          headStyles: {
            fillColor: [220, 220, 220],
            textColor: [0, 0, 0],
            fontStyle: 'bold',
          },
          alternateRowStyles: {
            fillColor: [245, 245, 245],
          },
          margin: { top: 15, right: 15, bottom: 15, left: 15 },
          didParseCell: function(data) {
            // تحسين عرض الخلايا للنصوص العربية
            if (data.cell.text && typeof data.cell.text === 'string') {
              // تنظيف النص من الأحرف الخاصة التي قد تسبب مشاكل
              data.cell.text = data.cell.text.replace(/[\u0000-\u001F]/g, '');
            }
          },
          didDrawCell: function(data) {
            // يمكن إضافة تخصيصات إضافية هنا إذا لزم الأمر
          }
        });

        // إضافة ترويسة وتذييل للصفحات
        const totalPages = doc.internal.getNumberOfPages();
        for (let i = 1; i <= totalPages; i++) {
          doc.setPage(i);

          // تذييل الصفحة - استخدام نص بسيط لتجنب مشاكل الخطوط العربية
          let footerText = footer;
          if (!footerText) {
            // استخدام تنسيق بسيط للتاريخ لتجنب مشاكل مع التنسيق العربي
            const today = new Date();
            const dateStr = `${today.getDate()}/${today.getMonth() + 1}/${today.getFullYear()}`;
            footerText = `Page ${i} of ${totalPages} - Generated on ${dateStr}`;
          }

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
  },

  /**
   * تصدير الرسم البياني إلى ملف PDF
   */
  exportChartToPDF(
    chartData: ChartData,
    chartType: 'line' | 'bar' | 'pie' | 'doughnut',
    options: ExportOptions
  ): Promise<boolean> {
    return new Promise((resolve, reject) => {
      try {
        console.log('Exporting chart to PDF');

        const {
          fileName,
          title,
          subtitle,
          orientation = 'portrait',
          pageSize = 'a4',
          logo,
          footer,
          rtl = true
        } = options;

        // إنشاء مستند PDF
        const doc = new jsPDF({
          orientation,
          unit: 'mm',
          format: pageSize,
        });

        // دعم اللغة العربية - استخدام خط متوافق مع jsPDF
        try {
          // استخدام خط متوافق مع jsPDF بدلاً من محاولة تحميل خط عربي
          doc.setFont('helvetica');

          // تعيين الاتجاه من اليمين إلى اليسار للنصوص العربية
          if (rtl) {
            doc.setR2L(true);
          }

          console.log('Font configuration for chart PDF completed successfully');
        } catch (error) {
          console.warn('Font configuration failed, using default settings:', error);
          doc.setFont('helvetica');
        }

        // إضافة الترويسة
        let yPos = 20;

        // إضافة الشعار إذا تم توفيره
        if (logo) {
          try {
            doc.addImage(logo, 'JPEG', rtl ? doc.internal.pageSize.getWidth() - 40 : 10, 10, 30, 30);
          } catch (err) {
            console.error('Error adding logo to PDF:', err);
          }
        }

        // إضافة العنوان - تنظيف النص من الأحرف الخاصة
        if (title) {
          // تنظيف النص من الأحرف الخاصة التي قد تسبب مشاكل
          const cleanTitle = typeof title === 'string' ? title.replace(/[\u0000-\u001F]/g, '') : title;
          doc.setFontSize(18);
          doc.text(cleanTitle, doc.internal.pageSize.getWidth() / 2, yPos, { align: 'center' });
          yPos += 10;
        }

        // إضافة العنوان الفرعي - تنظيف النص من الأحرف الخاصة
        if (subtitle) {
          // تنظيف النص من الأحرف الخاصة التي قد تسبب مشاكل
          const cleanSubtitle = typeof subtitle === 'string' ? subtitle.replace(/[\u0000-\u001F]/g, '') : subtitle;
          doc.setFontSize(12);
          doc.text(cleanSubtitle, doc.internal.pageSize.getWidth() / 2, yPos, { align: 'center' });
          yPos += 10;
        }

        // إنشاء عنصر canvas مؤقت لرسم الرسم البياني
        const canvas = document.createElement('canvas');
        canvas.width = 600;
        canvas.height = 400;
        document.body.appendChild(canvas);

        // إنشاء رسم بياني مؤقت
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          throw new Error('Failed to get canvas context');
        }

        // إنشاء رسم بياني جديد
        const chart = new Chart(ctx, {
          type: chartType,
          data: chartData,
          options: {
            responsive: false,
            animation: false,
            plugins: {
              legend: {
                display: true,
                position: 'top',
              },
            },
          },
        });

        // تحديث الرسم البياني
        chart.render();

        // تحويل الرسم البياني إلى صورة
        const imageData = canvas.toDataURL('image/png');

        // إضافة الصورة إلى المستند
        const pageWidth = doc.internal.pageSize.getWidth();
        const imgWidth = pageWidth - 40; // هامش 20 مم من كل جانب
        const imgHeight = (canvas.height * imgWidth) / canvas.width;

        doc.addImage(imageData, 'PNG', 20, yPos, imgWidth, imgHeight);

        // تنظيف
        chart.destroy();
        document.body.removeChild(canvas);

        // إضافة ترويسة وتذييل للصفحات
        const totalPages = doc.internal.getNumberOfPages();
        for (let i = 1; i <= totalPages; i++) {
          doc.setPage(i);

          // تذييل الصفحة - استخدام نص بسيط لتجنب مشاكل الخطوط العربية
          let footerText = footer;
          if (!footerText) {
            // استخدام تنسيق بسيط للتاريخ لتجنب مشاكل مع التنسيق العربي
            const today = new Date();
            const dateStr = `${today.getDate()}/${today.getMonth() + 1}/${today.getFullYear()}`;
            footerText = `Page ${i} of ${totalPages} - Generated on ${dateStr}`;
          }

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

        console.log('Chart PDF export completed successfully');
        resolve(true);
      } catch (error) {
        console.error('Error exporting chart to PDF:', error);
        reject(error);
      }
    });
  },

  /**
   * تصدير الرسم البياني والبيانات إلى ملف Excel
   */
  exportChartDataToExcel(
    chartData: ChartData,
    options: ExportOptions
  ): Promise<boolean> {
    return new Promise((resolve, reject) => {
      try {
        console.log('Exporting chart data to Excel');

        const {
          fileName,
          sheetName = 'Chart Data',
        } = options;

        // استخراج البيانات من الرسم البياني
        const labels = chartData.labels || [];
        const datasets = chartData.datasets || [];

        // إنشاء مصفوفة البيانات
        const data: any[] = [];

        // إضافة الصف الأول (العناوين)
        const headers = ['Label', ...datasets.map(ds => ds.label || 'Dataset')];
        data.push(headers);

        // إضافة البيانات
        labels.forEach((label, i) => {
          const row = [label];
          datasets.forEach(ds => {
            row.push(ds.data[i]);
          });
          data.push(row);
        });

        // إنشاء ورقة عمل
        const worksheet = XLSX.utils.aoa_to_sheet(data);

        // تعديل عرض الأعمدة
        const columnWidths = [];
        for (let i = 0; i < headers.length; i++) {
          columnWidths.push({ wch: Math.max(headers[i].length, 15) });
        }
        worksheet['!cols'] = columnWidths;

        // إنشاء مصنف عمل وإضافة ورقة العمل
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

        // تصدير الملف
        XLSX.writeFile(workbook, `${fileName}.xlsx`);

        console.log('Chart data Excel export completed successfully');
        resolve(true);
      } catch (error) {
        console.error('Error exporting chart data to Excel:', error);
        reject(error);
      }
    });
  }
};

export default exportService;
