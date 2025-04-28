import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';

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
 * خدمة تصدير PDF مع دعم كامل للغة العربية
 */
const arabicPdfExport = {
  /**
   * تهيئة الخطوط العربية
   */
  initFonts() {
    // تعريف الخطوط
    const fonts = {
      Roboto: {
        normal: 'https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.2.7/fonts/Roboto/Roboto-Regular.ttf',
        bold: 'https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.2.7/fonts/Roboto/Roboto-Medium.ttf',
        italics: 'https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.2.7/fonts/Roboto/Roboto-Italic.ttf',
        bolditalics: 'https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.2.7/fonts/Roboto/Roboto-MediumItalic.ttf'
      },
      // استخدام خط Amiri العربي من Google Fonts
      Amiri: {
        normal: 'https://fonts.gstatic.com/s/amiri/v17/J7aRnpd8CGxBHpUrtLMA7w.ttf',
        bold: 'https://fonts.gstatic.com/s/amiri/v17/J7acnpd8CGxBHp2VkaY6zp5gGDAbnCA.ttf',
        italics: 'https://fonts.gstatic.com/s/amiri/v17/J7afnpd8CGxBHpUrhLQY67FIEjgjpQ.ttf',
        bolditalics: 'https://fonts.gstatic.com/s/amiri/v17/J7aanpd8CGxBHpUrjAo9zptgHjAavCA.ttf'
      }
    };

    // تهيئة pdfMake مع الخطوط
    pdfMake.vfs = pdfFonts.pdfMake.vfs;
    
    // تعيين الخطوط الافتراضية
    pdfMake.fonts = {
      Roboto: {
        normal: 'Roboto',
        bold: 'Roboto',
        italics: 'Roboto',
        bolditalics: 'Roboto'
      },
      Amiri: {
        normal: 'Amiri',
        bold: 'Amiri',
        italics: 'Amiri',
        bolditalics: 'Amiri'
      }
    };
  },

  /**
   * تصدير البيانات إلى ملف PDF
   */
  exportToPDF(
    data: any[],
    options: ExportOptions
  ): Promise<boolean> {
    return new Promise((resolve, reject) => {
      try {
        console.log('Exporting data to PDF using pdfmake:', data.length, 'records');

        // تهيئة الخطوط
        this.initFonts();

        const {
          fileName = 'export',
          title,
          subtitle,
          orientation = 'portrait',
          pageSize = 'A4',
          rtl = true
        } = options;

        // تحضير البيانات
        if (!data || data.length === 0) {
          // إذا لم تكن هناك بيانات، أضف رسالة
          const docDefinition = {
            pageSize: pageSize,
            pageOrientation: orientation,
            defaultStyle: {
              font: 'Amiri',
              fontSize: 12,
              alignment: rtl ? 'right' : 'left'
            },
            content: [
              {
                text: 'لا توجد بيانات للعرض',
                fontSize: 14,
                alignment: 'center',
                margin: [0, 50, 0, 0]
              }
            ],
            footer: function(currentPage: number, pageCount: number) {
              return {
                text: `الصفحة ${currentPage} من ${pageCount}`,
                alignment: 'center',
                fontSize: 8
              };
            }
          };

          // إنشاء وتنزيل الملف
          pdfMake.createPdf(docDefinition).download(`${fileName}.pdf`);
          resolve(true);
          return;
        }

        // تحضير عناوين الأعمدة
        const headers = Object.keys(data[0]);
        
        // تحضير بيانات الجدول
        const tableBody = [
          // صف العناوين
          headers.map(header => ({
            text: header,
            style: 'tableHeader',
            alignment: rtl ? 'right' : 'left'
          }))
        ];

        // إضافة صفوف البيانات
        data.forEach(row => {
          const rowData = headers.map(header => ({
            text: row[header] !== undefined && row[header] !== null ? String(row[header]) : '',
            alignment: rtl ? 'right' : 'left'
          }));
          tableBody.push(rowData);
        });

        // تعريف المستند
        const docDefinition: any = {
          pageSize: pageSize,
          pageOrientation: orientation,
          // تعيين الاتجاه من اليمين إلى اليسار
          rtl: rtl,
          defaultStyle: {
            font: 'Amiri',
            fontSize: 10
          },
          styles: {
            header: {
              fontSize: 18,
              bold: true,
              margin: [0, 0, 0, 10],
              alignment: 'center'
            },
            subheader: {
              fontSize: 14,
              bold: true,
              margin: [0, 10, 0, 5],
              alignment: 'center'
            },
            tableHeader: {
              bold: true,
              fontSize: 11,
              color: 'black',
              fillColor: '#eeeeee'
            },
            tableRow: {
              fontSize: 10
            }
          },
          content: [] as any[]
        };

        // إضافة العنوان
        if (title) {
          docDefinition.content.push({
            text: title,
            style: 'header'
          });
        }

        // إضافة العنوان الفرعي
        if (subtitle) {
          docDefinition.content.push({
            text: subtitle,
            style: 'subheader'
          });
        }

        // إضافة الجدول
        docDefinition.content.push({
          table: {
            headerRows: 1,
            widths: Array(headers.length).fill('*'),
            body: tableBody
          },
          layout: {
            fillColor: function(rowIndex: number) {
              return (rowIndex % 2 === 0) ? '#FFFFFF' : '#F8F8F8';
            }
          }
        });

        // إضافة تذييل الصفحة
        docDefinition.footer = function(currentPage: number, pageCount: number) {
          const today = new Date();
          const dateStr = `${today.getDate()}/${today.getMonth() + 1}/${today.getFullYear()}`;
          
          return {
            columns: [
              { text: dateStr, alignment: 'left', fontSize: 8, margin: [10, 0, 0, 0] },
              { text: `الصفحة ${currentPage} من ${pageCount}`, alignment: 'center', fontSize: 8 },
              { text: 'نظام إدارة المدرسة', alignment: 'right', fontSize: 8, margin: [0, 0, 10, 0] }
            ],
            margin: [10, 0]
          };
        };

        // إنشاء وتنزيل الملف
        pdfMake.createPdf(docDefinition).download(`${fileName}.pdf`);
        console.log('PDF export completed successfully');
        resolve(true);
      } catch (error) {
        console.error('Error exporting to PDF:', error);
        reject(error);
      }
    });
  }
};

export default arabicPdfExport;
