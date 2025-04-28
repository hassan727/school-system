/**
 * خدمة طباعة HTML - تستخدم طباعة المتصفح المدمجة بدلاً من مكتبات PDF
 */
const htmlPrintService = {
  /**
   * طباعة البيانات باستخدام HTML
   */
  printData(
    data: any[],
    options: {
      title?: string;
      subtitle?: string;
    }
  ): Promise<boolean> {
    return new Promise((resolve, reject) => {
      try {
        console.log('Printing data using HTML print service:', data.length, 'records');

        const { title, subtitle } = options;

        // إنشاء نافذة جديدة للطباعة
        const printWindow = window.open('', '_blank');
        if (!printWindow) {
          alert('يرجى السماح بالنوافذ المنبثقة للطباعة');
          reject(new Error('Popup blocked'));
          return;
        }

        // تحضير البيانات
        if (!data || data.length === 0) {
          printWindow.document.write(`
            <!DOCTYPE html>
            <html dir="rtl">
            <head>
              <title>${title || 'تقرير'}</title>
              <meta charset="utf-8" />
              <style>
                body {
                  font-family: Arial, sans-serif;
                  padding: 20px;
                  direction: rtl;
                }
                .header {
                  text-align: center;
                  margin-bottom: 20px;
                }
                .message {
                  text-align: center;
                  padding: 50px;
                  font-size: 18px;
                }
              </style>
            </head>
            <body>
              <div class="header">
                <h1>مدرسة الجيل الواعد الخاصة</h1>
                ${title ? `<h2>${title}</h2>` : ''}
                <p>تاريخ الطباعة: ${new Date().toLocaleDateString('ar-EG')}</p>
              </div>
              <div class="message">
                لا توجد بيانات للعرض
              </div>
            </body>
            </html>
          `);
          printWindow.document.close();
          printWindow.print();
          resolve(true);
          return;
        }

        // الحصول على عناوين الأعمدة من البيانات
        const headers = Object.keys(data[0]);

        // إنشاء HTML للجدول
        let tableHtml = '';
        
        // إضافة رأس الجدول
        tableHtml += '<thead><tr>';
        headers.forEach(header => {
          tableHtml += `<th>${header}</th>`;
        });
        tableHtml += '</tr></thead>';
        
        // إضافة بيانات الجدول
        tableHtml += '<tbody>';
        data.forEach((row, index) => {
          const rowClass = index % 2 === 0 ? 'even-row' : 'odd-row';
          tableHtml += `<tr class="${rowClass}">`;
          headers.forEach(header => {
            const value = row[header] !== undefined && row[header] !== null 
              ? row[header] 
              : '';
            tableHtml += `<td>${value}</td>`;
          });
          tableHtml += '</tr>';
        });
        tableHtml += '</tbody>';

        // إنشاء HTML كامل للصفحة
        printWindow.document.write(`
          <!DOCTYPE html>
          <html dir="rtl">
          <head>
            <title>${title || 'تقرير'}</title>
            <meta charset="utf-8" />
            <style>
              body {
                font-family: Arial, sans-serif;
                padding: 20px;
                direction: rtl;
              }
              .header {
                text-align: center;
                margin-bottom: 20px;
              }
              .footer {
                text-align: center;
                margin-top: 30px;
                font-size: 12px;
                color: #666;
              }
              table {
                width: 100%;
                border-collapse: collapse;
                margin-bottom: 20px;
              }
              th, td {
                border: 1px solid #ddd;
                padding: 8px;
                text-align: right;
              }
              th {
                background-color: #f2f2f2;
                font-weight: bold;
              }
              .even-row {
                background-color: #ffffff;
              }
              .odd-row {
                background-color: #f9f9f9;
              }
              .signatures {
                margin-top: 50px;
                display: grid;
                grid-template-columns: 1fr 1fr 1fr;
                gap: 20px;
                text-align: center;
              }
              .signature-line {
                height: 40px;
                border-bottom: 1px solid #000;
                margin-top: 20px;
              }
              @media print {
                body {
                  print-color-adjust: exact;
                }
                .no-print {
                  display: none;
                }
              }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>مدرسة الجيل الواعد الخاصة</h1>
              ${title ? `<h2>${title}</h2>` : ''}
              ${subtitle ? `<h3>${subtitle}</h3>` : ''}
              <p>تاريخ الطباعة: ${new Date().toLocaleDateString('ar-EG')}</p>
            </div>

            <table>
              ${tableHtml}
            </table>

            <div class="signatures">
              <div>
                <p><strong>توقيع ولي الأمر</strong></p>
                <div class="signature-line"></div>
              </div>
              <div>
                <p><strong>توقيع المسؤول المالي</strong></p>
                <div class="signature-line"></div>
              </div>
              <div>
                <p><strong>توقيع مدير المدرسة</strong></p>
                <div class="signature-line"></div>
              </div>
            </div>

            <div class="footer">
              <p>تم إنشاء هذا المستند بواسطة نظام إدارة المدرسة</p>
              <p>جميع الحقوق محفوظة © ${new Date().getFullYear()}</p>
            </div>

            <div class="no-print" style="text-align: center; margin-top: 20px;">
              <button onclick="window.print();" style="padding: 10px 20px; font-size: 16px; cursor: pointer;">
                طباعة التقرير
              </button>
              <button onclick="window.close();" style="padding: 10px 20px; font-size: 16px; cursor: pointer; margin-right: 10px;">
                إغلاق
              </button>
            </div>
          </body>
          </html>
        `);

        // إغلاق الوثيقة وطباعتها
        printWindow.document.close();
        
        // تأخير قصير للتأكد من تحميل المحتوى
        setTimeout(() => {
          printWindow.focus();
          printWindow.print();
          
          // إعادة تعيين حالة التحميل عند إغلاق النافذة أو إلغاء الطباعة
          printWindow.onafterprint = () => {
            resolve(true);
          };
          
          // إعادة تعيين حالة التحميل بعد فترة زمنية محددة كإجراء احتياطي
          setTimeout(() => {
            resolve(true);
          }, 5000);
        }, 1000);

      } catch (error) {
        console.error('Error printing data:', error);
        reject(error);
      }
    });
  }
};

export default htmlPrintService;
