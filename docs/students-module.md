# وحدة إدارة الطلاب

## نظرة عامة

وحدة إدارة الطلاب هي جزء أساسي من نظام إدارة مدرسة الجيل الواعد. تتيح هذه الوحدة للمستخدمين إدارة بيانات الطلاب بشكل كامل، بما في ذلك إضافة طلاب جدد، وعرض بيانات الطلاب الحاليين، وتحديث بياناتهم، وحذفهم.

## الميزات الرئيسية

- **قائمة الطلاب**: عرض قائمة بجميع الطلاب مع إمكانية الفلترة والبحث.
- **إضافة طالب**: إضافة طالب جديد مع جميع البيانات المطلوبة.
- **عرض تفاصيل الطالب**: عرض جميع بيانات الطالب بشكل مفصل.
- **تعديل بيانات الطالب**: تحديث بيانات الطالب الحالي.
- **حذف طالب**: حذف طالب من النظام.
- **بحث متقدم**: البحث عن الطلاب باستخدام معايير متعددة.

## هيكل الملفات

```
src/
├── app/
│   └── students/
│       ├── page.tsx                # صفحة قائمة الطلاب
│       ├── add/
│       │   └── page.tsx            # صفحة إضافة طالب جديد
│       ├── [id]/
│       │   └── page.tsx            # صفحة تفاصيل الطالب
│       ├── edit/
│       │   └── [id]/
│       │       └── page.tsx        # صفحة تعديل بيانات الطالب
│       └── search/
│           └── page.tsx            # صفحة البحث المتقدم
├── components/
│   └── students/
│       ├── StudentCard.tsx         # مكون بطاقة الطالب
│       ├── StudentDetails.tsx      # مكون تفاصيل الطالب
│       ├── StudentFilters.tsx      # مكون فلاتر البحث
│       ├── StudentForm.tsx         # مكون نموذج الطالب
│       └── StudentList.tsx         # مكون قائمة الطلاب
├── services/
│   └── studentService.ts           # خدمة التعامل مع بيانات الطلاب
└── types/
    └── student.ts                  # أنواع البيانات الخاصة بالطلاب
```

## نماذج البيانات

### Student

```typescript
interface Student {
  id: string;
  first_name: string;
  last_name: string;
  full_name?: string;
  gender: 'male' | 'female';
  birth_date: string;
  national_id?: string;
  address?: string;
  phone?: string;
  email?: string;
  grade_level: number;
  classroom_id?: string;
  classroom_name?: string;
  enrollment_date: string;
  status: 'active' | 'inactive' | 'graduated' | 'transferred';
  parent_name?: string;
  parent_phone?: string;
  parent_email?: string;
  parent_job?: string;
  parent_relation?: 'father' | 'mother' | 'guardian';
  health_notes?: string;
  academic_notes?: string;
  behavior_notes?: string;
  profile_image?: string;
  created_at: string;
  updated_at: string;
}
```

## واجهة برمجة التطبيقات (API)

### الحصول على قائمة الطلاب

```typescript
getStudents(params: StudentSearchParams = {}): Promise<{ data: Student[] | null; count: number | null; error: any }>
```

### الحصول على طالب بواسطة المعرف

```typescript
getStudentById(id: string): Promise<{ data: Student | null; error: any }>
```

### إنشاء طالب جديد

```typescript
createStudent(student: CreateStudentInput): Promise<{ data: Student | null; error: any }>
```

### تحديث بيانات طالب

```typescript
updateStudent(student: UpdateStudentInput): Promise<{ data: Student | null; error: any }>
```

### حذف طالب

```typescript
deleteStudent(id: string): Promise<{ success: boolean; error: any }>
```

## قاعدة البيانات

### جدول الطلاب (students)

| الحقل | النوع | الوصف |
|-------|------|-------|
| id | UUID | المعرف الفريد للطالب |
| first_name | TEXT | الاسم الأول |
| last_name | TEXT | اسم العائلة |
| gender | TEXT | الجنس (ذكر/أنثى) |
| birth_date | DATE | تاريخ الميلاد |
| national_id | TEXT | الرقم القومي |
| address | TEXT | العنوان |
| phone | TEXT | رقم الهاتف |
| email | TEXT | البريد الإلكتروني |
| grade_level | INTEGER | المستوى الدراسي |
| classroom_id | UUID | معرف الفصل الدراسي |
| enrollment_date | DATE | تاريخ التسجيل |
| status | TEXT | الحالة (نشط/غير نشط/متخرج/منقول) |
| parent_name | TEXT | اسم ولي الأمر |
| parent_phone | TEXT | رقم هاتف ولي الأمر |
| parent_email | TEXT | البريد الإلكتروني لولي الأمر |
| parent_job | TEXT | وظيفة ولي الأمر |
| parent_relation | TEXT | صلة القرابة (أب/أم/ولي أمر) |
| health_notes | TEXT | ملاحظات صحية |
| academic_notes | TEXT | ملاحظات أكاديمية |
| behavior_notes | TEXT | ملاحظات سلوكية |
| profile_image | TEXT | رابط صورة الملف الشخصي |
| created_at | TIMESTAMP | تاريخ الإنشاء |
| updated_at | TIMESTAMP | تاريخ التحديث |

## كيفية الاستخدام

### عرض قائمة الطلاب

1. انتقل إلى صفحة "إدارة الطلاب" من القائمة الجانبية.
2. استخدم الفلاتر للبحث عن طلاب محددين.
3. انقر على "عرض التفاصيل" لعرض بيانات طالب محدد.
4. انقر على "تعديل" لتعديل بيانات طالب.
5. انقر على "حذف" لحذف طالب.

### إضافة طالب جديد

1. انتقل إلى صفحة "إدارة الطلاب" من القائمة الجانبية.
2. انقر على زر "إضافة طالب جديد".
3. املأ النموذج بجميع البيانات المطلوبة.
4. انقر على "إضافة طالب" لحفظ البيانات.

### تعديل بيانات طالب

1. انتقل إلى صفحة تفاصيل الطالب.
2. انقر على زر "تعديل البيانات".
3. قم بتعديل البيانات المطلوبة.
4. انقر على "تحديث البيانات" لحفظ التغييرات.

### البحث المتقدم

1. انتقل إلى صفحة "بحث متقدم" من القائمة الجانبية أو من صفحة إدارة الطلاب.
2. استخدم الفلاتر المتاحة للبحث عن طلاب محددين.
3. انقر على "تطبيق الفلتر" لعرض النتائج.

## ملاحظات تقنية

- تستخدم الوحدة Supabase كقاعدة بيانات.
- تستخدم React Hook Form للتعامل مع النماذج.
- تستخدم Zod للتحقق من صحة البيانات.
- تستخدم Next.js للتوجيه والتنقل بين الصفحات.
- تستخدم Tailwind CSS للتنسيق.
