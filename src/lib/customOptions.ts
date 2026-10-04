import { db } from './firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

// 1. الجنسيات الافتراضية (مشتركة لكافة الكوادر)
export const DEFAULT_NATIONALITIES = [
  'سعودي',
  'سعودية',
  'مصري',
  'مصرية',
  'أردني',
  'أردنية',
  'سوري',
  'سورية',
  'سوداني',
  'سودانية',
  'يمني',
  'يمنية',
  'هندي',
  'باكستاني',
  'بنجلاديشي',
  'نيبالي',
  'فلبيني'
];

// 2. الأقسام
export const DEFAULT_TEACHER_SECTIONS = ['بنين', 'بنات'];
export const DEFAULT_ADMIN_SECTIONS = ['إدارة المجمع', 'بنين', 'بنات'];
export const DEFAULT_SUPPORT_SECTIONS = ['إدارة المجمع', 'بنين', 'بنات'];

// 2.5 المسارات (مشتركة بين الكادر التعليمي والكادر الإداري مع إدارة للأدمن)
export const DEFAULT_TRACKS = [
  'أهلي',
  'دولي',
  'دبلومة أمريكية',
  'نون',
  'مصري',
  'تربية خاصة',
  'فرنسي'
];

// 3. المراحل
export const DEFAULT_TEACHER_STAGES = [
  'رياض أطفال',
  'ابتدائي',
  'متوسط',
  'ثانوي',
  'جميع المراحل'
];

export const DEFAULT_ADMIN_STAGES = [
  'إدارة المجمع',
  'رياض أطفال',
  'ابتدائي',
  'متوسط',
  'ثانوي',
  'جميع المراحل'
];

// 4. الوظائف
export const DEFAULT_TEACHER_JOBS = [
  'معلم',
  'معلمة',
  'معلم صف',
  'معلم مادة',
  'رائد نشاط',
  'موجه طلابي',
  'محضر مختبر',
  'أمين مصادر تعلم',
  'مشرف تربوي مقيم',
  'أخرى'
];

export const DEFAULT_ADMIN_JOBS = [
  'مدير مجمع',
  'مدير مدرسة',
  'وكيل شؤون تعليمية',
  'وكيل شؤون مدرسية',
  'وكيل شؤون طلاب',
  'موجه طلابي',
  'سكرتير',
  'مراقب',
  'محاسب',
  'مسؤول موارد بشرية',
  'موظف إداري',
  'أمين مستودع',
  'مشرف مقيم',
  'أخرى'
];

// 5. نصاب الحصص (1 إلى 35)
export const DEFAULT_QUOTAS = Array.from({ length: 35 }, (_, i) => String(i + 1));

// 6. المؤهلات
export const DEFAULT_TEACHER_QUALIFICATIONS = [
  'بكالوريوس',
  'بكالوريوس تربية',
  'بكالوريوس علوم وتربية',
  'بكالوريوس خدمة اجتماعية',
  'بكالوريوس تربية رياضية',
  'بكالوريوس تربية نوعية',
  'بكالوريوس دار علوم',
  'ليسانس آداب',
  'ليسانس آداب وتربية',
  'ليسانس أزهر',
  'ماجستير',
  'دكتوراه',
  'دبلوم',
  'دبلوم عالي'
];

export const DEFAULT_ADMIN_QUALIFICATIONS = [
  'بكالوريوس',
  'بكالوريوس تربية',
  'بكالوريوس علوم وتربية',
  'بكالوريوس خدمة اجتماعية',
  'بكالوريوس إدارة أعمال',
  'بكالوريوس محاسبة',
  'بكالوريوس نظم معلومات',
  'بكالوريوس لغة عربية',
  'بكالوريوس لغة إنجليزية',
  'ليسانس آداب',
  'ماجستير',
  'دكتوراه',
  'دبلوم',
  'دبلوم عالي',
  'ثانوية عامة'
];

// 7. التخصصات
export const DEFAULT_TEACHER_SPECIALIZATIONS = [
  'رياضيات',
  'لغة عربية',
  'لغة إنجليزية',
  'علوم',
  'فيزياء',
  'كيمياء',
  'أحياء',
  'تربية إسلامية',
  'دراسات اجتماعية',
  'مهارات رقمية / حاسب آلي',
  'تربية بدنية',
  'تربية فنية',
  'صفوف أولية',
  'رياض أطفال',
  'علم نفس',
  'علم اجتماع',
  'تاريخ',
  'جغرافيا',
  'صعوبات تعلم',
  'موهوبين'
];

export const DEFAULT_ADMIN_SPECIALIZATIONS = [
  'إدارة أعمال / إدارة عامة',
  'محاسبة ومالية',
  'موارد بشرية',
  'تقنية معلومات وحاسب آلي',
  'خدمة اجتماعية وعلم اجتماع',
  'علم نفس وتوجيه طلابي',
  'شؤون تعليمية ومدرسية',
  'لغة عربية',
  'لغة إنجليزية',
  'رياضيات وإحصاء',
  'إدارة مكتبية وسكرتارية',
  'أخرى'
];

// 8. مواد التدريس (للكادر التعليمي)
export const DEFAULT_SUBJECTS = [
  'رياضيات',
  'لغة عربية',
  'لغة إنجليزية',
  'علوم',
  'فيزياء',
  'كيمياء',
  'أحياء',
  'دراسات إسلامية',
  'قرآن كريم',
  'توحيد',
  'فقه',
  'حديث',
  'تفسير',
  'دراسات اجتماعية',
  'مهارات رقمية / حاسب آلي',
  'تربية بدنية والدفاع عن النفس',
  'تربية فنية',
  'تفكير ناقد',
  'علم البيئة',
  'مهارات حياتية وأسرية',
  'لغة فرنسية',
  'لغة صينية',
  'صفوف أولية',
  'رياض أطفال'
];

// 9. الرخصة المهنية
export const DEFAULT_LICENSES = ['0', '1', 'سارية', 'منتهية', 'غير محدد'];

// 10. مستويات كلاسيرا
export const DEFAULT_CLASSERA_LEVELS = [
  'ممارس',
  'متقدم',
  'خبير',
  'محترف',
  'غير محدد'
];

// 11. البنوك الافتراضية (مشتركة لكافة الكوادر)
export const DEFAULT_BANKS = [
  'مصرف الراجحي',
  'البنك الأهلي السعودي (SNB)',
  'مصرف الإنماء',
  'بنك الرياض',
  'بنك البلاد',
  'البنك العربي الوطني (ANB)',
  'بنك الجزيرة',
  'البنك السعودي الأول (SAB)',
  'البنك السعودي الفرنسي (BSF)',
  'البنك السعودي للاستثمار (SAIB)',
  'بنك الخليج الدولي',
  'بنك دبي الإسلامي'
];

// دوال إدارة التخزين المحلي والمزامنة مع فايربيس
export const loadCustomOptions = (key: string, fallback: string[]): string[] => {
  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn(`Error reading localStorage for ${key}:`, e);
  }
  return fallback;
};

export const saveCustomOptions = (key: string, options: string[]): void => {
  try {
    localStorage.setItem(key, JSON.stringify(options));
  } catch (e) {
    console.warn(`Error saving localStorage for ${key}:`, e);
  }

  // حفظ في فايربيس للتزامن بين مختلف الأجهزة والمتصفحات
  try {
    setDoc(doc(db, 'system_options', key), {
      options,
      updatedAt: new Date().toISOString()
    }).catch(err => {
      console.warn(`Firestore option sync notice for ${key}:`, err);
    });
  } catch (e) {
    console.warn(e);
  }
};

export const fetchCustomOptionsFromFirestore = async (key: string, fallback: string[]): Promise<string[]> => {
  try {
    const snap = await getDoc(doc(db, 'system_options', key));
    if (snap.exists()) {
      const data = snap.data();
      if (Array.isArray(data?.options) && data.options.length > 0) {
        localStorage.setItem(key, JSON.stringify(data.options));
        return data.options;
      }
    }
  } catch (e) {
    console.warn(`Firestore option fetch notice for ${key}:`, e);
  }
  return loadCustomOptions(key, fallback);
};
