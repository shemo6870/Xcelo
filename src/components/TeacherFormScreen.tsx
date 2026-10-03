import React, { useState, useEffect, useRef } from 'react';
import { 
  GraduationCap, Save, User, Hash, Globe, Users, 
  CreditCard, Phone, Award, BookOpen, FileCheck, Sparkles, 
  Mail, Landmark, Calendar, Check, Copy, X, Trash2, Edit3, 
  AlertCircle, Search
} from 'lucide-react';
import { 
  TeacherRecord, 
  saveTeacherToFirestore, 
  getTeachersFromFirestore, 
  deleteTeacherFromFirestore,
  updateTeacherInFirestore
} from '../lib/api';
import { DatePickerField } from './DatePickerField';

interface TeacherFormScreenProps {
  onBack: () => void;
  academicYear: string;
  complexName: string;
}

interface LoadedTeacher extends TeacherRecord {
  source: 'firestore' | 'local';
}

// قائمة الجنسيات (تشمل جنسيات المعلمين + الخدمات المساندة)
const NATIONALITIES = [
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

const SECTIONS = ['بنين', 'بنات'];

// نصاب الحصص: الاختيارات من 1 إلى 35
const QUOTAS = Array.from({ length: 35 }, (_, i) => String(i + 1));

const QUALIFICATIONS = [
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

const SPECIALIZATIONS = [
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

const SUBJECTS = [
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

const LICENSES = [
  { value: '0', label: '0' },
  { value: '1', label: '1' }
];

// كلاسيرا: خبير ثم محترف
const CLASSERA_LEVELS = [
  'ممارس',
  'متقدم',
  'خبير',
  'محترف',
  'غير محدد'
];

const BANKS = [
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

const STORAGE_KEY = 'registered_teachers_fresh_v1';

const safeGetStorage = (key: string): string | null => {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
};

const safeSetStorage = (key: string, val: string) => {
  try {
    localStorage.setItem(key, val);
  } catch {}
};

export const TeacherFormScreen: React.FC<TeacherFormScreenProps> = ({
  onBack,
  academicYear,
  complexName
}) => {
  // الحقول الـ 16 المطلوبة
  const [jobNum, setJobNum] = useState('');
  const [name, setName] = useState('');
  const [nationality, setNationality] = useState('سعودي');
  const [section, setSection] = useState('بنين');
  const [nationalId, setNationalId] = useState('');
  const [phone, setPhone] = useState('');
  const [quota, setQuota] = useState('24');
  const [qualification, setQualification] = useState('بكالوريوس');
  const [specialization, setSpecialization] = useState('رياضيات');
  const [subject, setSubject] = useState('رياضيات');
  const [license, setLicense] = useState('1');
  const [classera, setClassera] = useState('ممارس');
  const [email, setEmail] = useState('');
  const [ibanDigits, setIbanDigits] = useState('');
  const [bank, setBank] = useState('مصرف الراجحي');
  const [startDate, setStartDate] = useState('');

  // حالات البحث والمعلم المحدد
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState<LoadedTeacher | null>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // حالة تأكيد الحذف كنافذة منبثقة آمنة داخلية
  const [teacherToDelete, setTeacherToDelete] = useState<LoadedTeacher | null>(null);

  // حالات مساعدة
  const [allTeachers, setAllTeachers] = useState<LoadedTeacher[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copiedIban, setCopiedIban] = useState(false);

  // التعامل مع إدخال الإيميل والإكمال التلقائي عند كتابة @
  const handleEmailChange = (val: string) => {
    if (val.endsWith('@') && !val.slice(0, -1).includes('@')) {
      setEmail(val + 'altanmiyah.edu.sa');
    } else {
      setEmail(val);
    }
  };

  // دالة لتنقية الأرقام فقط وتحويل الأرقام العربية الهندية (٠-٩) إلى أرقام (0-9)
  const toOnlyDigits = (str: string): string => {
    return str
      .replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d).toString())
      .replace(/\D/g, '');
  };

  // منع كتابة أي حروف أو رموز نهائياً والسماح فقط بالأرقام ومفاتيح التحكم
  const handleNumericKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (
      ['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab', 'Enter', 'Home', 'End'].includes(e.key) ||
      (e.ctrlKey || e.metaKey)
    ) {
      return;
    }
    if (!/^[0-9]$/.test(e.key) && !/^[٠-٩]$/.test(e.key)) {
      e.preventDefault();
    }
  };

  // إغلاق قائمة البحث عند النقر خارجها
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setIsSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // إغلاق النافذة عند الضغط على زر Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (teacherToDelete) {
          setTeacherToDelete(null);
        } else {
          onBack();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onBack, teacherToDelete]);

  // جلب البيانات: فقط وحصرياً ما يتم تسجيله من جديد
  const fetchAllTeachers = async () => {
    try {
      const rawLocal = safeGetStorage(STORAGE_KEY);
      let localList: LoadedTeacher[] = [];
      if (rawLocal) {
        try {
          localList = JSON.parse(rawLocal);
        } catch {
          localList = [];
        }
      }

      try {
        const fsTeachers = await getTeachersFromFirestore();
        const map = new Map<string, LoadedTeacher>();
        
        localList.forEach(t => {
          if (t && t.jobNum) map.set(t.jobNum, t);
        });

        fsTeachers.forEach(t => {
          if (t && t.jobNum) {
            map.set(t.jobNum, { ...t, source: 'firestore' });
          }
        });

        const merged = Array.from(map.values());
        setAllTeachers(merged);
        safeSetStorage(STORAGE_KEY, JSON.stringify(merged));
      } catch (err) {
        console.warn('Firestore fallback to local storage:', err);
        setAllTeachers(localList);
      }
    } catch (e) {
      console.error('Error fetching registered teachers:', e);
    }
  };

  useEffect(() => {
    fetchAllTeachers();
  }, []);

  // نتائج البحث المفلترة بالاسم أو الرقم الوظيفي
  const searchResults = React.useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    return allTeachers.filter(t => 
      t.name.toLowerCase().includes(q) || 
      t.jobNum.toLowerCase().includes(q)
    ).slice(0, 15);
  }, [searchQuery, allTeachers]);

  // تعبئة النموذج ببيانات المعلم المحدد للتعديل
  const populateTeacherData = (teacher: LoadedTeacher) => {
    setSelectedTeacher(teacher);
    setJobNum(teacher.jobNum || '');
    setName(teacher.name || '');
    setNationality(teacher.nationality || 'سعودي');
    setSection(teacher.section || 'بنين');
    setNationalId(teacher.nationalId || '');
    setPhone(teacher.phone || '');
    setQuota(teacher.quota || '24');
    setQualification(teacher.qualification || 'بكالوريوس');
    setSpecialization(teacher.specialization || 'رياضيات');
    setSubject(teacher.subject || 'رياضيات');
    setLicense(teacher.license === '1' ? '1' : '0');

    const currentClassera = teacher.classera === 'قائد' ? 'محترف' : (teacher.classera || 'ممارس');
    setClassera(currentClassera);
    
    setEmail(teacher.email || '');

    const ibanClean = (teacher.iban || '').toUpperCase().replace(/^SA/i, '').replace(/[^0-9]/g, '');
    setIbanDigits(ibanClean);

    setBank(teacher.bank || 'مصرف الراجحي');
    setStartDate(teacher.startDate || '');

    setIsSearchOpen(false);
    setErrorMessage(null);
    setSuccessMessage(`تم تحميل بيانات المعلم (${teacher.name}) للتعديل`);
  };

  // تفريغ النموذج والعودة للحالة الافتراضية
  const handleResetForm = () => {
    setSelectedTeacher(null);
    setSearchQuery('');
    setIsSearchOpen(false);
    setJobNum('');
    setName('');
    setNationality('سعودي');
    setSection('بنين');
    setNationalId('');
    setPhone('');
    setQuota('24');
    setQualification('بكالوريوس');
    setSpecialization('رياضيات');
    setSubject('رياضيات');
    setLicense('1');
    setClassera('ممارس');
    setEmail('');
    setIbanDigits('');
    setBank('مصرف الراجحي');
    setStartDate('');
    setErrorMessage(null);
  };

  // حفظ بيانات المعلم الجديدة
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage(null);
    setErrorMessage(null);

    if (!jobNum.trim()) {
      setErrorMessage('يرجى إدخال الرقم الوظيفي للمعلم');
      return;
    }
    if (!name.trim()) {
      setErrorMessage('يرجى إدخال اسم المعلم رباعي');
      return;
    }

    const fullIban = ibanDigits.trim() ? `SA${ibanDigits.trim()}` : 'SA';

    const teacherData: TeacherRecord = {
      jobNum: jobNum.trim(),
      name: name.trim(),
      nationality: nationality.trim(),
      section: section.trim(),
      nationalId: nationalId.trim(),
      phone: phone.trim(),
      quota: quota.trim(),
      qualification: qualification.trim(),
      specialization: specialization.trim(),
      subject: subject.trim(),
      license: license.trim(),
      classera: classera.trim(),
      email: email.trim(),
      iban: fullIban,
      bank: bank.trim(),
      startDate: startDate.trim()
    };

    setIsSaving(true);

    const tempId = 'teacher_' + Date.now();
    let savedId = tempId;

    try {
      const res = await saveTeacherToFirestore(teacherData);
      if (res && res.id) {
        savedId = res.id;
      }
    } catch (err) {
      console.warn('Saved locally, Firestore sync queued/error:', err);
    }

    const newTeacher: LoadedTeacher = { 
      ...teacherData, 
      id: savedId, 
      source: 'firestore' 
    };

    const updatedList = [newTeacher, ...allTeachers.filter(t => t.jobNum !== newTeacher.jobNum)];
    setAllTeachers(updatedList);
    safeSetStorage(STORAGE_KEY, JSON.stringify(updatedList));

    // عند الحفظ: تفريغ النموذج ويبقى زر الحفظ فقط دون ظهور تعديل أو حذف
    handleResetForm();
    setIsSaving(false);
    setSuccessMessage(`تم حفظ بيانات المعلم (${newTeacher.name}) بنجاح!`);
    setTimeout(() => setSuccessMessage(null), 4000);
  };

  // تعديل بيانات المعلم الحالي
  const handleEdit = async () => {
    if (!selectedTeacher) return;
    setSuccessMessage(null);
    setErrorMessage(null);

    if (!jobNum.trim()) {
      setErrorMessage('يرجى إدخال الرقم الوظيفي للمعلم');
      return;
    }
    if (!name.trim()) {
      setErrorMessage('يرجى إدخال اسم المعلم رباعي');
      return;
    }

    const fullIban = ibanDigits.trim() ? `SA${ibanDigits.trim()}` : 'SA';

    const updatedData: TeacherRecord = {
      jobNum: jobNum.trim(),
      name: name.trim(),
      nationality: nationality.trim(),
      section: section.trim(),
      nationalId: nationalId.trim(),
      phone: phone.trim(),
      quota: quota.trim(),
      qualification: qualification.trim(),
      specialization: specialization.trim(),
      subject: subject.trim(),
      license: license.trim(),
      classera: classera.trim(),
      email: email.trim(),
      iban: fullIban,
      bank: bank.trim(),
      startDate: startDate.trim()
    };

    setIsSaving(true);
    try {
      if (selectedTeacher.id) {
        try {
          await updateTeacherInFirestore(selectedTeacher.id, updatedData);
        } catch {
          await saveTeacherToFirestore(updatedData);
        }
      } else {
        await saveTeacherToFirestore(updatedData);
      }
    } catch (err) {
      console.warn('Update saved locally:', err);
    }

    const updatedLoadedTeacher: LoadedTeacher = {
      ...updatedData,
      id: selectedTeacher.id || 'teacher_' + Date.now(),
      source: 'firestore'
    };

    const updatedList = allTeachers.map(t => 
      (t.id === selectedTeacher.id || t.jobNum === selectedTeacher.jobNum) 
        ? updatedLoadedTeacher 
        : t
    );

    setAllTeachers(updatedList);
    safeSetStorage(STORAGE_KEY, JSON.stringify(updatedList));

    handleResetForm();
    setIsSaving(false);
    setSuccessMessage(`تم حفظ تعديلات بيانات المعلم (${updatedData.name}) بنجاح!`);
    setTimeout(() => setSuccessMessage(null), 4000);
  };

  // تأكيد وتنفيذ الحذف
  const confirmDeleteTeacher = async () => {
    if (!teacherToDelete) return;
    const target = teacherToDelete;
    setIsSaving(true);

    try {
      if (target.id) {
        try {
          await deleteTeacherFromFirestore(target.id);
        } catch (e) {
          console.warn('Firestore delete error:', e);
        }
      }
    } catch (e) {
      console.error(e);
    }

    const updatedList = allTeachers.filter(t => 
      t.id !== target.id && t.jobNum !== target.jobNum
    );

    setAllTeachers(updatedList);
    safeSetStorage(STORAGE_KEY, JSON.stringify(updatedList));

    if (selectedTeacher && (selectedTeacher.id === target.id || selectedTeacher.jobNum === target.jobNum)) {
      handleResetForm();
    }

    setTeacherToDelete(null);
    setIsSaving(false);
    setSuccessMessage(`تم حذف بيانات المعلم (${target.name}) بنجاح!`);
    setTimeout(() => setSuccessMessage(null), 4000);
  };

  return (
    <div 
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-2 sm:p-3 md:p-4" 
      dir="rtl"
      onClick={(e) => {
        if (e.target === e.currentTarget && !teacherToDelete) {
          onBack();
        }
      }}
    >
      {/* نافذة تأكيد الحذف المنبثقة والآمنة داخلياً */}
      {teacherToDelete && (
        <div className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-5 sm:p-6 max-w-md w-full shadow-2xl border border-slate-200 text-center space-y-4 animate-in fade-in zoom-in-95">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto shadow-inner">
              <Trash2 size={24} />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-slate-900 mb-1">تأكيد حذف المعلم</h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                هل أنت متأكد من حذف بيانات المعلم <span className="font-black text-slate-900">«{teacherToDelete.name}»</span> نهائياً من النظام؟
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setTeacherToDelete(null)}
                className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-bold hover:bg-slate-100 transition-all text-xs sm:text-sm cursor-pointer flex-1"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={confirmDeleteTeacher}
                disabled={isSaving}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 active:scale-95 text-white font-bold transition-all text-xs sm:text-sm cursor-pointer flex-1 shadow-md shadow-rose-600/25"
              >
                {isSaving ? 'جاري الحذف...' : 'نعم، حذف المعلم'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* بطاقة النافذة المنبثقة الرئيسية - أطول وبدون اسكرول مع شريط أزرار سفلي مثبت ودائم الظهور */}
      <div className="relative w-full max-w-5xl lg:max-w-6xl h-auto max-h-[96vh] bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col justify-between my-auto animate-in fade-in zoom-in-95 duration-150">
        
        {/* 1. شريط العنوان العلوي (مضغوط وأنيق ومثبت) */}
        <div className="bg-white border-b border-slate-200 px-4 sm:px-6 py-2.5 shadow-xs flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 sm:p-2 bg-blue-50 text-blue-600 rounded-xl border border-blue-100">
              <GraduationCap size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-black text-slate-800">
                  بطاقة بيانات الكادر التعليمي
                </h1>
                {selectedTeacher && (
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200 flex items-center gap-1">
                    <Edit3 size={11} />
                    <span>تعديل: {selectedTeacher.name}</span>
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 text-[11px] text-slate-500 font-bold">
                <span>{complexName}</span>
                <span>•</span>
                <span>العام الدراسي: {academicYear}</span>
                <span>•</span>
                <span className="text-blue-700 font-extrabold">{allTeachers.length} معلماً مسجلاً</span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onBack}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-all cursor-pointer flex items-center justify-center"
            title="إغلاق النافذة (Esc)"
          >
            <X size={20} />
          </button>
        </div>

        {/* 2. النموذج الكامل: يجمع المحتوى القابل للعرض مع شريط الأزرار السفلي المثبت دائماً */}
        <form 
          onSubmit={selectedTeacher ? (e) => { e.preventDefault(); handleEdit(); } : handleSave} 
          className="flex-1 flex flex-col min-h-0 overflow-hidden"
        >
          {/* محتوى الحقول القابل للتمرير إن لزم، ومضغوط بحيث يظهر كاملاً في معظم الشاشات */}
          <div className="p-3 sm:p-4 md:p-5 flex-1 overflow-y-auto space-y-2.5 sm:space-y-3">
            
            {/* خانة البحث فوق الحقول بالاسم أو الرقم الوظيفي */}
            <div ref={searchContainerRef} className="relative w-full z-30 shrink-0">
              <div className="bg-slate-50 hover:bg-white focus-within:bg-white px-3 py-1.5 sm:py-2 rounded-xl border border-blue-200 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100 transition-all flex items-center gap-2.5">
                <Search size={18} className="text-blue-600 shrink-0" />
                <div className="flex-1">
                  <input
                    type="text"
                    value={searchQuery}
                    onFocus={() => setIsSearchOpen(true)}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setIsSearchOpen(true);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && searchResults.length > 0) {
                        e.preventDefault();
                        populateTeacherData(searchResults[0]);
                      }
                    }}
                    placeholder={allTeachers.length === 0 ? "لا يوجد معلمون مسجلون حالياً، قم بتسجيل المعلمين بالأسفل..." : "ابحث هنا باسم المعلم أو الرقم الوظيفي..."}
                    className="w-full bg-transparent text-xs sm:text-sm font-bold text-slate-800 placeholder-slate-400 focus:outline-none"
                  />
                </div>

                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      setIsSearchOpen(false);
                    }}
                    className="p-1 text-slate-400 hover:text-slate-600 rounded-lg transition-colors cursor-pointer"
                    title="مسح البحث"
                  >
                    <X size={15} />
                  </button>
                )}
              </div>

              {/* قائمة نتائج البحث: لا يظهر إلا الاسم فقط وتحته تعديل أو حذف */}
              {isSearchOpen && searchQuery.trim() !== '' && (
                <div className="absolute top-full mt-1.5 right-0 left-0 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-50 max-h-56 overflow-y-auto">
                  <div className="p-2 bg-slate-50 border-b border-slate-100 text-[11px] font-bold text-slate-500 flex justify-between items-center">
                    <span>نتائج البحث ({searchResults.length})</span>
                    <span>اختر تعديل لتعبئة البيانات أو حذف لإزالته</span>
                  </div>
                  
                  {searchResults.length > 0 ? (
                    searchResults.map(teacher => (
                      <div
                        key={teacher.id || teacher.jobNum}
                        className="p-2.5 sm:p-3 hover:bg-blue-50/70 border-b border-slate-100 last:border-b-0 transition-colors flex items-center justify-between"
                      >
                        {/* لا يظهر إلا الاسم فقط */}
                        <div className="text-sm sm:text-base font-black text-slate-900">
                          {teacher.name}
                        </div>

                        {/* وتحته تعديل أو حذف */}
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => populateTeacherData(teacher)}
                            className="flex items-center gap-1 px-3 py-1 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer"
                          >
                            <Edit3 size={12} />
                            <span>تعديل</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setTeacherToDelete(teacher)}
                            className="flex items-center gap-1 px-3 py-1 bg-rose-50 hover:bg-rose-100 active:scale-95 text-rose-700 border border-rose-200 rounded-lg text-xs font-bold transition-all cursor-pointer"
                          >
                            <Trash2 size={12} />
                            <span>حذف</span>
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-4 text-center text-slate-500 text-xs font-bold">
                      لم يتم العثور على معلم يطابق "{searchQuery}"
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* رسائل التنبيه والنجاح */}
            {successMessage && (
              <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 px-3 py-1.5 rounded-xl flex items-center justify-between text-xs font-bold shrink-0 animate-in fade-in">
                <div className="flex items-center gap-1.5">
                  <Check size={14} className="text-emerald-600" />
                  <span>{successMessage}</span>
                </div>
                <button onClick={() => setSuccessMessage(null)} className="text-slate-400 hover:text-slate-600">
                  <X size={13} />
                </button>
              </div>
            )}

            {errorMessage && (
              <div className="bg-red-50 border border-red-300 text-red-900 px-3 py-1.5 rounded-xl flex items-center justify-between text-xs font-bold shrink-0 animate-in fade-in">
                <div className="flex items-center gap-1.5">
                  <AlertCircle size={14} className="text-red-600" />
                  <span>{errorMessage}</span>
                </div>
                <button onClick={() => setErrorMessage(null)} className="text-slate-400 hover:text-slate-600">
                  <X size={13} />
                </button>
              </div>
            )}

            {/* شبكة المدخلات: ثلاثة بجانب بعض في كل صف (مضغوطة لضمان اكتمال الرؤية) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-x-4 gap-y-2 sm:gap-y-2.5">
              
              {/* 1. الرقم الوظيفي */}
              <div>
                <label className="flex items-center gap-1 text-[11px] sm:text-xs font-bold text-slate-700 mb-0.5">
                  <Hash size={13} className="text-blue-600" />
                  <span>الرقم الوظيفي:</span>
                  <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  required
                  value={jobNum}
                  onKeyDown={handleNumericKeyDown}
                  onChange={(e) => setJobNum(toOnlyDigits(e.target.value))}
                  className="w-full py-1.5 px-3 bg-slate-50 hover:bg-white focus:bg-white border border-slate-300 rounded-lg text-xs sm:text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all font-mono"
                  dir="ltr"
                />
              </div>

              {/* 2. اسم المعلم (حقل مستطيل للكتابة) */}
              <div>
                <label className="flex items-center gap-1 text-[11px] sm:text-xs font-bold text-slate-700 mb-0.5">
                  <User size={13} className="text-blue-600" />
                  <span>اسم المعلم:</span>
                  <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="اسم المعلم رباعي..."
                  className="w-full py-1.5 px-3 bg-slate-50 hover:bg-white focus:bg-white border border-slate-300 rounded-lg text-xs sm:text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                />
              </div>

              {/* 3. الجنسية (حقل اختياري يشمل جنسيات المعلمين + الخدمات المساندة) */}
              <div>
                <label className="flex items-center gap-1 text-[11px] sm:text-xs font-bold text-slate-700 mb-0.5">
                  <Globe size={13} className="text-blue-600" />
                  <span>الجنسية:</span>
                </label>
                <select
                  value={nationality}
                  onChange={(e) => setNationality(e.target.value)}
                  className="w-full py-1.5 px-3 bg-slate-50 hover:bg-white focus:bg-white border border-slate-300 rounded-lg text-xs sm:text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all cursor-pointer"
                >
                  {NATIONALITIES.map(nat => (
                    <option key={nat} value={nat}>{nat}</option>
                  ))}
                </select>
              </div>

              {/* 4. القسم (اختيارات: بنين / بنات) */}
              <div>
                <label className="flex items-center gap-1 text-[11px] sm:text-xs font-bold text-slate-700 mb-0.5">
                  <Users size={13} className="text-indigo-600" />
                  <span>القسم:</span>
                </label>
                <select
                  value={section}
                  onChange={(e) => setSection(e.target.value)}
                  className="w-full py-1.5 px-3 bg-slate-50 hover:bg-white focus:bg-white border border-slate-300 rounded-lg text-xs sm:text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all cursor-pointer"
                >
                  {SECTIONS.map(sec => (
                    <option key={sec} value={sec}>{sec}</option>
                  ))}
                </select>
              </div>

              {/* 5. رقم الهوية */}
              <div>
                <label className="flex items-center gap-1 text-[11px] sm:text-xs font-bold text-slate-700 mb-0.5">
                  <CreditCard size={13} className="text-indigo-600" />
                  <span>رقم الهوية:</span>
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={10}
                  value={nationalId}
                  onKeyDown={handleNumericKeyDown}
                  onChange={(e) => setNationalId(toOnlyDigits(e.target.value).slice(0, 10))}
                  className="w-full py-1.5 px-3 bg-slate-50 hover:bg-white focus:bg-white border border-slate-300 rounded-lg text-xs sm:text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all font-mono"
                  dir="ltr"
                />
              </div>

              {/* 6. رقم الجوال */}
              <div>
                <label className="flex items-center gap-1 text-[11px] sm:text-xs font-bold text-slate-700 mb-0.5">
                  <Phone size={13} className="text-indigo-600" />
                  <span>رقم الجوال:</span>
                </label>
                <input
                  type="tel"
                  inputMode="numeric"
                  maxLength={10}
                  value={phone}
                  onKeyDown={handleNumericKeyDown}
                  onChange={(e) => setPhone(toOnlyDigits(e.target.value).slice(0, 10))}
                  className="w-full py-1.5 px-3 bg-slate-50 hover:bg-white focus:bg-white border border-slate-300 rounded-lg text-xs sm:text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all font-mono"
                  dir="ltr"
                />
              </div>

              {/* 7. نصاب المعلم (الحصص من 1 إلى 35) */}
              <div>
                <label className="flex items-center gap-1 text-[11px] sm:text-xs font-bold text-slate-700 mb-0.5">
                  <GraduationCap size={13} className="text-teal-600" />
                  <span>نصاب المعلم (1 إلى 35):</span>
                </label>
                <select
                  value={quota}
                  onChange={(e) => setQuota(e.target.value)}
                  className="w-full py-1.5 px-3 bg-slate-50 hover:bg-white focus:bg-white border border-slate-300 rounded-lg text-xs sm:text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all cursor-pointer font-mono"
                >
                  {QUOTAS.map(q => (
                    <option key={q} value={q}>{q} حصة</option>
                  ))}
                </select>
              </div>

              {/* 8. المؤهل (خلية اختيارات) */}
              <div>
                <label className="flex items-center gap-1 text-[11px] sm:text-xs font-bold text-slate-700 mb-0.5">
                  <Award size={13} className="text-teal-600" />
                  <span>المؤهل:</span>
                </label>
                <select
                  value={qualification}
                  onChange={(e) => setQualification(e.target.value)}
                  className="w-full py-1.5 px-3 bg-slate-50 hover:bg-white focus:bg-white border border-slate-300 rounded-lg text-xs sm:text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all cursor-pointer"
                >
                  {QUALIFICATIONS.map(q => (
                    <option key={q} value={q}>{q}</option>
                  ))}
                </select>
              </div>

              {/* 9. التخصص (خلية اختيارات) */}
              <div>
                <label className="flex items-center gap-1 text-[11px] sm:text-xs font-bold text-slate-700 mb-0.5">
                  <BookOpen size={13} className="text-teal-600" />
                  <span>التخصص:</span>
                </label>
                <select
                  value={specialization}
                  onChange={(e) => setSpecialization(e.target.value)}
                  className="w-full py-1.5 px-3 bg-slate-50 hover:bg-white focus:bg-white border border-slate-300 rounded-lg text-xs sm:text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all cursor-pointer"
                >
                  {SPECIALIZATIONS.map(spec => (
                    <option key={spec} value={spec}>{spec}</option>
                  ))}
                </select>
              </div>

              {/* 10. مادة التدريس (خلية اختيارات) */}
              <div>
                <label className="flex items-center gap-1 text-[11px] sm:text-xs font-bold text-slate-700 mb-0.5">
                  <BookOpen size={13} className="text-violet-600" />
                  <span>مادة التدريس:</span>
                </label>
                <select
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full py-1.5 px-3 bg-slate-50 hover:bg-white focus:bg-white border border-slate-300 rounded-lg text-xs sm:text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all cursor-pointer"
                >
                  {SUBJECTS.map(subj => (
                    <option key={subj} value={subj}>{subj}</option>
                  ))}
                </select>
              </div>

              {/* 11. الرخصة المهنية (اختيارات 0 أو 1) */}
              <div>
                <label className="flex items-center gap-1 text-[11px] sm:text-xs font-bold text-slate-700 mb-0.5">
                  <FileCheck size={13} className="text-emerald-600" />
                  <span>الرخصة المهنية:</span>
                </label>
                <select
                  value={license}
                  onChange={(e) => setLicense(e.target.value)}
                  className="w-full py-1.5 px-3 bg-slate-50 hover:bg-white focus:bg-white border border-slate-300 rounded-lg text-xs sm:text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all cursor-pointer font-mono"
                >
                  {LICENSES.map(lic => (
                    <option key={lic.value} value={lic.value}>{lic.label}</option>
                  ))}
                </select>
              </div>

              {/* 12. كلاسيرا (استبدال خيار قائد إلى محترف) */}
              <div>
                <label className="flex items-center gap-1 text-[11px] sm:text-xs font-bold text-slate-700 mb-0.5">
                  <Sparkles size={13} className="text-amber-500" />
                  <span>كلاسيرا:</span>
                </label>
                <select
                  value={classera}
                  onChange={(e) => setClassera(e.target.value)}
                  className="w-full py-1.5 px-3 bg-slate-50 hover:bg-white focus:bg-white border border-slate-300 rounded-lg text-xs sm:text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all cursor-pointer"
                >
                  {CLASSERA_LEVELS.map(lvl => (
                    <option key={lvl} value={lvl}>{lvl}</option>
                  ))}
                </select>
              </div>

              {/* 13. الإيميل (كتابة مع إكمال تلقائي عند كتابة @) */}
              <div>
                <label className="flex items-center justify-between text-[11px] sm:text-xs font-bold text-slate-700 mb-0.5">
                  <div className="flex items-center gap-1">
                    <Mail size={13} className="text-sky-600" />
                    <span>الإيميل:</span>
                  </div>
                  {!email.includes('@altanmiyah.edu.sa') && email && (
                    <button
                      type="button"
                      onClick={() => {
                        const cleanUser = email.split('@')[0];
                        setEmail(`${cleanUser}@altanmiyah.edu.sa`);
                      }}
                      className="text-[10px] text-sky-700 hover:text-sky-800 font-bold bg-sky-50 px-1.5 py-0.5 rounded cursor-pointer"
                    >
                      + @altanmiyah.edu.sa
                    </button>
                  )}
                </label>
                <input
                  type="text"
                  value={email}
                  onChange={(e) => handleEmailChange(e.target.value)}
                  placeholder="اكتب البريد (@ للإكمال التلقائي)"
                  className="w-full py-1.5 px-3 bg-slate-50 hover:bg-white focus:bg-white border border-slate-300 rounded-lg text-xs sm:text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-all font-mono text-left"
                  dir="ltr"
                />
              </div>

              {/* 14. رقم IBAN (مع SA ظاهرة كنص ثابت قبل أن تكتب أي رقم) */}
              <div>
                <label className="flex items-center justify-between text-[11px] sm:text-xs font-bold text-slate-700 mb-0.5">
                  <div className="flex items-center gap-1">
                    <CreditCard size={13} className="text-emerald-600" />
                    <span>رقم IBAN البنكي:</span>
                  </div>
                  {ibanDigits && (
                    <button
                      type="button"
                      onClick={() => {
                        try {
                          navigator.clipboard?.writeText(`SA${ibanDigits}`).catch(() => {});
                        } catch {}
                        setCopiedIban(true);
                        setTimeout(() => setCopiedIban(false), 1500);
                      }}
                      className="text-[10px] text-emerald-700 hover:text-emerald-800 font-bold flex items-center gap-1 cursor-pointer bg-emerald-50 px-1.5 py-0.5 rounded"
                    >
                      {copiedIban ? <Check size={10} /> : <Copy size={10} />}
                      <span>{copiedIban ? 'تم!' : 'نسخ'}</span>
                    </button>
                  )}
                </label>

                <div className="flex items-center bg-slate-50 hover:bg-white focus-within:bg-white border border-slate-300 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-emerald-500 focus-within:border-emerald-500 transition-all" dir="ltr">
                  <div className="bg-emerald-600 text-white font-mono font-black text-xs px-2.5 py-1.5 flex items-center justify-center select-none border-r border-emerald-700">
                    SA
                  </div>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={22}
                    value={ibanDigits}
                    onKeyDown={handleNumericKeyDown}
                    onChange={(e) => {
                      const clean = toOnlyDigits(e.target.value.replace(/^SA/i, '')).slice(0, 22);
                      setIbanDigits(clean);
                    }}
                    className="flex-1 py-1.5 px-2 bg-transparent text-xs sm:text-sm font-bold text-slate-900 focus:outline-none text-left font-mono tracking-wider"
                    dir="ltr"
                  />
                  <div className="text-[10px] font-mono font-bold text-slate-400 px-2 select-none">
                    {ibanDigits.length}/22
                  </div>
                </div>
              </div>

              {/* 15. البنك (خلية اختيارات) */}
              <div>
                <label className="flex items-center gap-1 text-[11px] sm:text-xs font-bold text-slate-700 mb-0.5">
                  <Landmark size={13} className="text-amber-700" />
                  <span>اسم البنك:</span>
                </label>
                <select
                  value={bank}
                  onChange={(e) => setBank(e.target.value)}
                  className="w-full py-1.5 px-3 bg-slate-50 hover:bg-white focus:bg-white border border-slate-300 rounded-lg text-xs sm:text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all cursor-pointer"
                >
                  {BANKS.map(b => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
              </div>

              {/* 16. تاريخ المباشرة */}
              <div>
                <label className="flex items-center gap-1 text-[11px] sm:text-xs font-bold text-slate-700 mb-0.5">
                  <Calendar size={13} className="text-blue-600" />
                  <span>تاريخ المباشرة:</span>
                </label>
                <DatePickerField
                  value={startDate}
                  onChange={setStartDate}
                  accentColor="blue"
                />
              </div>

            </div>

          </div>

          {/* 3. شريط الأزرار السفلي المثبت دائماً (لا يختفي ولا ينقطع إطلاقاً) */}
          <div className="bg-slate-50/95 border-t border-slate-200 px-4 sm:px-6 py-2.5 sm:py-3 flex items-center justify-between shrink-0 z-20">
            <div className="flex items-center gap-2">
              {selectedTeacher ? (
                <div className="flex items-center gap-1.5 text-xs text-amber-900 bg-amber-100 border border-amber-300 px-3 py-1.5 rounded-xl font-bold">
                  <Edit3 size={13} className="text-amber-700" />
                  <span>تعديل بيانات: <strong className="text-amber-950 font-black">{selectedTeacher.name}</strong></span>
                </div>
              ) : (
                <span className="text-[11px] sm:text-xs text-slate-500 font-bold">
                  الحقول المعلمة بـ (<span className="text-red-500">*</span>) إلزامية.
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {/* إذا تم اختيار معلم من البحث يظهر زري تعديل وحذف وإلغاء بوضوح تام */}
              {selectedTeacher ? (
                <>
                  <button
                    type="button"
                    onClick={() => setTeacherToDelete(selectedTeacher)}
                    disabled={isSaving}
                    className="flex items-center gap-1 px-4 py-2 bg-rose-600 hover:bg-rose-700 active:scale-95 disabled:opacity-50 text-white rounded-xl font-bold shadow-xs transition-all text-xs sm:text-sm cursor-pointer"
                    title="حذف هذا المعلم"
                  >
                    <Trash2 size={15} />
                    <span>حذف المعلم</span>
                  </button>

                  <button
                    type="submit"
                    disabled={isSaving}
                    className="flex items-center gap-1.5 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 active:scale-95 disabled:opacity-50 text-white rounded-xl font-bold shadow-md hover:shadow-indigo-500/25 transition-all text-xs sm:text-sm cursor-pointer"
                  >
                    <Edit3 size={15} />
                    <span>{isSaving ? 'جاري التعديل...' : 'تعديل وحفظ التغييرات'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleResetForm}
                    className="flex items-center gap-1 px-3.5 py-2 bg-white hover:bg-slate-100 text-slate-700 rounded-xl font-bold border border-slate-300 transition-all text-xs sm:text-sm cursor-pointer shadow-xs"
                  >
                    <X size={14} />
                    <span>إلغاء</span>
                  </button>
                </>
              ) : (
                /* في حالة الحفظ العادية: زر الحفظ الأساسي فقط */
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex items-center gap-1.5 px-8 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 disabled:opacity-50 text-white rounded-xl font-bold shadow-md hover:shadow-emerald-500/25 transition-all text-sm cursor-pointer"
                >
                  <Save size={16} />
                  <span>{isSaving ? 'جاري الحفظ...' : 'حفظ بيانات المعلم'}</span>
                </button>
              )}
            </div>
          </div>

        </form>

      </div>
    </div>
  );
};
