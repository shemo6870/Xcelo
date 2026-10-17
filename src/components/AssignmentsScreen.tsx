import React, { useState, useEffect } from 'react';
import { 
  Printer, Check, X, ChevronDown, 
  Save, Plus, Trash2, RotateCcw, 
  Clock, FileSpreadsheet, Filter, Edit3
} from 'lucide-react';
import { 
  TimetableDailyPeriodsRecord, 
  saveDailyPeriodsToFirestore 
} from '../lib/api';

interface AssignmentsScreenProps {
  onBack: () => void;
  academicYear: string;
  complexName: string;
  isAdmin?: boolean;
}

interface DayOption {
  key: string;
  label: string;
  enabled: boolean;
}

interface GradePeriodRow {
  id: string;
  gradeName: string;
  periods: Record<string, number | ''>;
  planPeriods: number;
}

interface SubjectQuotaItem {
  id: string;
  name: string;
  periods: number;
}

const DEFAULT_DAYS: DayOption[] = [
  { key: 'saturday', label: 'السبت', enabled: false },
  { key: 'sunday', label: 'الأحد', enabled: true },
  { key: 'monday', label: 'الاثنين', enabled: true },
  { key: 'tuesday', label: 'الثلاثاء', enabled: true },
  { key: 'wednesday', label: 'الأربعاء', enabled: true },
  { key: 'thursday', label: 'الخميس', enabled: true },
  { key: 'friday', label: 'الجمعة', enabled: false },
];

const DEFAULT_ROWS: GradePeriodRow[] = [
  {
    id: 'grade_1',
    gradeName: 'الأول الابتدائي التعليم العام',
    periods: { saturday: '', sunday: 7, monday: 7, tuesday: 7, wednesday: 6, thursday: 6, friday: '' },
    planPeriods: 33
  },
  {
    id: 'grade_2',
    gradeName: 'الثاني الابتدائي التعليم العام',
    periods: { saturday: '', sunday: 7, monday: 7, tuesday: 7, wednesday: 6, thursday: 6, friday: '' },
    planPeriods: 33
  },
  {
    id: 'grade_3',
    gradeName: 'الثالث الابتدائي التعليم العام',
    periods: { saturday: '', sunday: 7, monday: 7, tuesday: 7, wednesday: 6, thursday: 6, friday: '' },
    planPeriods: 33
  },
  {
    id: 'grade_4',
    gradeName: 'الرابع الابتدائي التعليم العام',
    periods: { saturday: '', sunday: 7, monday: 7, tuesday: 7, wednesday: 6, thursday: 6, friday: '' },
    planPeriods: 33
  },
  {
    id: 'grade_5',
    gradeName: 'الخامس الابتدائي التعليم العام',
    periods: { saturday: '', sunday: 7, monday: 7, tuesday: 7, wednesday: 6, thursday: 6, friday: '' },
    planPeriods: 33
  },
  {
    id: 'grade_6',
    gradeName: 'السادس الابتدائي التعليم العام',
    periods: { saturday: '', sunday: 7, monday: 7, tuesday: 7, wednesday: 6, thursday: 6, friday: '' },
    planPeriods: 33
  }
];

// نصاب المواد الافتراضي لصفوف المرحلة الابتدائية (كما في الصورة تماماً)
const DEFAULT_GRADE_3_SUBJECTS: SubjectQuotaItem[] = [
  { id: 'sub_1', name: 'الرياضيات', periods: 6 },
  { id: 'sub_2', name: 'اللغة الانجليزية', periods: 3 },
  { id: 'sub_3', name: 'التربية البدنية والدفاع عن النفس', periods: 3 },
  { id: 'sub_4', name: 'التربية الفنية', periods: 2 },
  { id: 'sub_5', name: 'العلوم', periods: 4 },
  { id: 'sub_6', name: 'القرآن الكريم والدراسات الإسلامية', periods: 5 },
  { id: 'sub_7', name: 'اللغة العربية', periods: 6 },
  { id: 'sub_8', name: 'المهارات الحياتية والأسرية', periods: 1 },
  { id: 'sub_9', name: 'النشاط', periods: 3 },
];

export const AssignmentsScreen: React.FC<AssignmentsScreenProps> = ({
  onBack,
  academicYear,
  complexName,
  isAdmin = false
}) => {
  // المراحل الرئيسية العلوية (Wizard Steps)
  const [currentStep, setCurrentStep] = useState<number>(1);

  // التبويب النشط تحت الخطوة 1 (الإعدادات العامة)
  const [activeSubTab, setActiveSubTab] = useState<string>('نصاب الحصص للمواد');

  // ==========================================
  // حالات شاشة نصاب الحصص للمواد (كما في الصورة)
  // ==========================================
  const [studySystem, setStudySystem] = useState<string>('منتظم');
  const [selectedGrade, setSelectedGrade] = useState<string>('الثالث الابتدائي');
  const [selectedSection, setSelectedSection] = useState<string>('التعليم العام');

  // قائمة المواد المعروضة
  const [subjectsList, setSubjectsList] = useState<SubjectQuotaItem[]>(DEFAULT_GRADE_3_SUBJECTS);
  
  // حالة تعديل مادة
  const [editingSubject, setEditingSubject] = useState<SubjectQuotaItem | null>(null);
  const [showAddSubjectModal, setShowAddSubjectModal] = useState(false);
  const [newSubjectName, setNewSubjectName] = useState('');
  const [newSubjectPeriods, setNewSubjectPeriods] = useState<number>(3);
  const [isPrintSubjectsModalOpen, setIsPrintSubjectsModalOpen] = useState(false);

  // ==========================================
  // حالات شاشة عدد الحصص اليومية
  // ==========================================
  const [days, setDays] = useState<DayOption[]>(DEFAULT_DAYS);
  const [rows, setRows] = useState<GradePeriodRow[]>(DEFAULT_ROWS);

  // حالات العرض والتنبيهات
  const [isSaving, setIsSaving] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [showAddGradeModal, setShowAddGradeModal] = useState(false);
  const [newGradeName, setNewGradeName] = useState('');
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  // مفتاح التخزين لعدد الحصص اليومية
  const storageKey = `assignments_daily_periods_${complexName}_${academicYear}`;
  
  // مفتاح التخزين لنصاب المواد
  const subjectsStorageKey = `assignments_subjects_quota_${complexName}_${academicYear}_${selectedGrade}_${selectedSection}`;

  // تحميل واستعادة البيانات
  useEffect(() => {
    try {
      const savedSubjects = localStorage.getItem(subjectsStorageKey);
      if (savedSubjects) {
        const parsed = JSON.parse(savedSubjects);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setSubjectsList(parsed);
        } else {
          setSubjectsList(DEFAULT_GRADE_3_SUBJECTS);
        }
      } else {
        setSubjectsList(DEFAULT_GRADE_3_SUBJECTS);
      }
    } catch {
      setSubjectsList(DEFAULT_GRADE_3_SUBJECTS);
    }
  }, [subjectsStorageKey]);

  useEffect(() => {
    try {
      localStorage.removeItem(storageKey);
    } catch {}
    setDays(DEFAULT_DAYS);
    setRows(DEFAULT_ROWS);
  }, [storageKey]);

  // ==========================================
  // دوال إدارة شاشة نصاب الحصص للمواد
  // ==========================================
  
  // حساب إجمالي نصاب المواد
  const totalSubjectPeriods = subjectsList.reduce((sum, item) => sum + (Number(item.periods) || 0), 0);

  // تنفيذ البحث
  const handleSearchSubjects = () => {
    try {
      const saved = localStorage.getItem(subjectsStorageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setSubjectsList(parsed);
          setSuccessToast(`تم تحميل نصاب (${selectedGrade}) بنجاح`);
          setTimeout(() => setSuccessToast(null), 3000);
          return;
        }
      }
    } catch {}

    setSubjectsList(DEFAULT_GRADE_3_SUBJECTS);
    setSuccessToast(`تم عرض نصاب مواد (${selectedGrade} - ${selectedSection})`);
    setTimeout(() => setSuccessToast(null), 3000);
  };

  // إعادة تعيين حقول البحث
  const handleResetSearch = () => {
    setStudySystem('منتظم');
    setSelectedGrade('الثالث الابتدائي');
    setSelectedSection('التعليم العام');
    setSubjectsList(DEFAULT_GRADE_3_SUBJECTS);
  };

  // حفظ تعديل نصاب مادة
  const handleSaveSubjectEdit = () => {
    if (!editingSubject) return;
    const updated = subjectsList.map(sub => 
      sub.id === editingSubject.id ? { ...sub, periods: Number(editingSubject.periods) || 0 } : sub
    );
    setSubjectsList(updated);
    try {
      localStorage.setItem(subjectsStorageKey, JSON.stringify(updated));
    } catch {}
    setEditingSubject(null);
    setSuccessToast(`تم تحديث نصاب مادة (${editingSubject.name})`);
    setTimeout(() => setSuccessToast(null), 3000);
  };

  // إضافة مادة جديدة لنصاب المواد
  const handleAddSubject = () => {
    if (!newSubjectName.trim()) return;
    const newItem: SubjectQuotaItem = {
      id: 'sub_' + Date.now(),
      name: newSubjectName.trim(),
      periods: Number(newSubjectPeriods) || 1
    };
    const updated = [...subjectsList, newItem];
    setSubjectsList(updated);
    try {
      localStorage.setItem(subjectsStorageKey, JSON.stringify(updated));
    } catch {}
    setNewSubjectName('');
    setShowAddSubjectModal(false);
    setSuccessToast(`تمت إضافة مادة (${newItem.name}) بنجاح`);
    setTimeout(() => setSuccessToast(null), 3000);
  };

  // حذف مادة من نصاب المواد
  const handleDeleteSubject = (id: string, name: string) => {
    if (window.confirm(`هل أنت متأكد من حذف مادة (${name}) من النصاب؟`)) {
      const updated = subjectsList.filter(s => s.id !== id);
      setSubjectsList(updated);
      try {
        localStorage.setItem(subjectsStorageKey, JSON.stringify(updated));
      } catch {}
      setSuccessToast(`تم حذف مادة (${name})`);
      setTimeout(() => setSuccessToast(null), 3000);
    }
  };

  // استعادة النصاب الافتراضي للمواد
  const handleResetSubjectsDefault = () => {
    if (window.confirm('هل تريد استعادة نصاب المواد الافتراضي (كما في الصورة)؟')) {
      setSubjectsList(DEFAULT_GRADE_3_SUBJECTS);
      try {
        localStorage.removeItem(subjectsStorageKey);
      } catch {}
      setSuccessToast('تمت استعادة نصاب المواد الافتراضي');
      setTimeout(() => setSuccessToast(null), 3000);
    }
  };

  // حفظ نصاب المواد
  const handleSaveSubjects = () => {
    setIsSaving(true);
    try {
      localStorage.setItem(subjectsStorageKey, JSON.stringify(subjectsList));
      setSuccessToast('تم حفظ نصاب الحصص للمواد بنجاح!');
      setTimeout(() => setSuccessToast(null), 3500);
    } catch (e) {
      console.warn(e);
    } finally {
      setIsSaving(false);
    }
  };

  // ==========================================
  // دوال إدارة شاشة عدد الحصص اليومية
  // ==========================================

  const toggleDay = (dayKey: string) => {
    setDays(prev => prev.map(d => {
      if (d.key === dayKey) {
        return { ...d, enabled: !d.enabled };
      }
      return d;
    }));
  };

  const handlePeriodChange = (rowId: string, dayKey: string, value: string) => {
    const numVal = value === '' ? '' : parseInt(value, 10);
    setRows(prev => prev.map(row => {
      if (row.id === rowId) {
        const safePeriods = row.periods || { saturday: '', sunday: 7, monday: 7, tuesday: 7, wednesday: 6, thursday: 6, friday: '' };
        return {
          ...row,
          periods: {
            ...safePeriods,
            [dayKey]: numVal
          }
        };
      }
      return row;
    }));
  };

  const handlePlanPeriodsChange = (rowId: string, val: string) => {
    const num = parseInt(val, 10) || 0;
    setRows(prev => prev.map(row => row.id === rowId ? { ...row, planPeriods: num } : row));
  };

  const getRowTotal = (row: GradePeriodRow): number => {
    let total = 0;
    if (!row) return 0;
    const safePeriods = row.periods || { saturday: '', sunday: 7, monday: 7, tuesday: 7, wednesday: 6, thursday: 6, friday: '' };
    days.forEach(d => {
      if (d && d.enabled) {
        const val = safePeriods[d.key];
        if (typeof val === 'number') {
          total += val;
        }
      }
    });
    return total;
  };

  const handleSaveDailyPeriods = async () => {
    setIsSaving(true);
    setSuccessToast(null);

    const daysMap: Record<string, boolean> = {};
    days.forEach(d => { daysMap[d.key] = d.enabled; });

    const payload: TimetableDailyPeriodsRecord = {
      complexName,
      academicYear,
      days: daysMap,
      rows: rows.map(r => ({
        id: r.id,
        gradeName: r.gradeName,
        periods: r.periods || { saturday: '', sunday: 7, monday: 7, tuesday: 7, wednesday: 6, thursday: 6, friday: '' },
        planPeriods: r.planPeriods || 33
      }))
    };

    try {
      localStorage.setItem(storageKey, JSON.stringify({ days, rows }));
    } catch {}

    try {
      await saveDailyPeriodsToFirestore(payload);
      setSuccessToast('تم حفظ عدد الحصص اليومية بنجاح!');
      setTimeout(() => setSuccessToast(null), 3500);
    } catch (e) {
      console.warn('Firestore error, saved locally:', e);
      setSuccessToast('تم الحفظ بنجاح محلياً!');
      setTimeout(() => setSuccessToast(null), 3500);
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetToDefault = () => {
    setDays(DEFAULT_DAYS);
    setRows(DEFAULT_ROWS);
    try {
      localStorage.removeItem(storageKey);
    } catch {}
    setSuccessToast('تم استعادة التوزيع الافتراضي');
    setTimeout(() => setSuccessToast(null), 3000);
  };

  const handleAddGrade = () => {
    if (!newGradeName.trim()) return;
    const newRow: GradePeriodRow = {
      id: 'grade_' + Date.now(),
      gradeName: newGradeName.trim(),
      periods: { saturday: '', sunday: 7, monday: 7, tuesday: 7, wednesday: 6, thursday: 6, friday: '' },
      planPeriods: 33
    };
    setRows(prev => [...prev, newRow]);
    setNewGradeName('');
    setShowAddGradeModal(false);
  };

  const handleDeleteRow = (id: string, name: string) => {
    if (window.confirm(`هل أنت متأكد من حذف (${name})؟`)) {
      setRows(prev => prev.filter(r => r.id !== id));
    }
  };

  const stepsList = [
    { num: 1, label: 'الإعدادات العامة' },
    { num: 2, label: 'العلاقات التدريسية' },
    { num: 3, label: 'توزيع حصص الانتظار وحجز الحصص الاختيارية' },
    { num: 4, label: 'جدول الحصص' }
  ];

  const subTabs = [
    'نصاب الحصص للمواد',
    'عدد الحصص اليومية',
    'مجموعات المعلمين',
    'حجز حصص لمادة',
    'حجز حصص لمعلمين',
    'أوقات الفسح',
    'معلم عجز'
  ];

  return (
    <div 
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-2 sm:p-3 md:p-4" 
      dir="rtl"
      onClick={(e) => {
        if (e.target === e.currentTarget && !showAddGradeModal && !isPrintModalOpen && !editingSubject && !showAddSubjectModal && !isPrintSubjectsModalOpen) {
          onBack();
        }
      }}
    >
      {/* بطاقة النافذة المنبثقة الرئيسية */}
      <div className="relative w-full max-w-5xl lg:max-w-6xl h-auto max-h-[96vh] bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col justify-between my-auto animate-in fade-in zoom-in-95 duration-150">
        
        {/* 1. شريط العنوان العلوي */}
        <div className="bg-white border-b border-slate-200 px-4 sm:px-6 py-2.5 shadow-xs flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 sm:p-2 bg-purple-50 text-purple-600 rounded-xl border border-purple-100">
              <FileSpreadsheet size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-black text-slate-800">
                  الاسنادات
                </h1>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
                  {activeSubTab}
                </span>
              </div>
              <div className="flex items-center gap-2 text-[11px] text-slate-500 font-bold">
                <span>{complexName}</span>
                <span>•</span>
                <span>العام الدراسي: {academicYear}</span>
                {activeSubTab === 'نصاب الحصص للمواد' ? (
                  <>
                    <span>•</span>
                    <span className="text-purple-700 font-extrabold">{subjectsList.length} مواد مسجلة ({totalSubjectPeriods} حصة)</span>
                  </>
                ) : activeSubTab === 'عدد الحصص اليومية' ? (
                  <>
                    <span>•</span>
                    <span className="text-purple-700 font-extrabold">{rows.length} صفوف مسجلة</span>
                  </>
                ) : null}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {successToast && (
              <div className="bg-emerald-50 border border-emerald-300 text-emerald-800 px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 animate-in fade-in">
                <Check size={14} className="text-emerald-600" />
                <span>{successToast}</span>
              </div>
            )}
            <button
              type="button"
              onClick={onBack}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-all cursor-pointer flex items-center justify-center"
              title="إغلاق النافذة (Esc)"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* 2. المحتوى الداخلي القابل للتمرير */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-3.5 space-y-3.5">
          
          {/* شريط الخطوات الأربعة العلوي */}
          <div className="bg-slate-50/70 rounded-2xl border border-slate-200/90 p-3 sm:p-4 shadow-xs">
            <div className="flex items-center justify-between w-full relative">
              {stepsList.map((st, index) => {
                const isActive = currentStep === st.num;
                return (
                  <React.Fragment key={st.num}>
                    {index > 0 && (
                      <div className="flex-1 h-[2px] bg-slate-200 mx-2 sm:mx-4" />
                    )}
                    
                    <div 
                      onClick={() => setCurrentStep(st.num)}
                      className="flex items-center gap-1.5 sm:gap-2.5 cursor-pointer group"
                    >
                      <div className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center text-xs font-black transition-all ${
                        isActive 
                          ? 'border-2 border-[#7c3aed] text-[#7c3aed] bg-white shadow-xs' 
                          : 'border border-slate-300 text-slate-400 bg-white group-hover:border-slate-400 group-hover:text-slate-600'
                      }`}>
                        {st.num}
                      </div>
                      <span className={`text-xs sm:text-sm font-bold transition-colors select-none ${
                        isActive ? 'text-slate-900 font-black' : 'text-slate-600 group-hover:text-slate-900'
                      }`}>
                        {st.label}
                      </span>
                    </div>
                  </React.Fragment>
                );
              })}
            </div>
          </div>

          {/* شريط التبويبات الفرعية */}
          <div className="bg-white rounded-xl border border-slate-200 p-1.5 shadow-xs overflow-x-auto scrollbar-none">
            <div className="flex items-center gap-1.5 min-w-max">
              {subTabs.map((tab) => {
                const isSelected = activeSubTab === tab;
                return (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setActiveSubTab(tab)}
                    className={`px-3.5 sm:px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer select-none ${
                      isSelected
                        ? 'bg-[#0f172a] text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                    }`}
                  >
                    {tab}
                  </button>
                );
              })}
            </div>
          </div>

          {/* ======================================================== */}
          {/* تبويب: "نصاب الحصص للمواد" (مطابق تماماً للصورة المرفقة) */}
          {/* ======================================================== */}
          {activeSubTab === 'نصاب الحصص للمواد' && (
            <div className="space-y-3.5 animate-in fade-in duration-150">
              
              {/* قسم: حقول البحث (مطابق لأعلى الصورة) */}
              <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs space-y-4">
                
                {/* عنوان حقول البحث مع أيقونة الفلتر */}
                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                  <div className="flex items-center gap-2 text-slate-900 font-black text-sm">
                    <Filter size={16} className="text-slate-700" />
                    <span>حقول البحث</span>
                  </div>
                </div>

                {/* الحقول الثلاثة الإجبارية */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  
                  {/* 1. النظام الدراسي * */}
                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1.5">
                      النظام الدراسي <span className="text-red-500 font-bold">*</span>
                    </label>
                    <div className="relative">
                      <select
                        value={studySystem}
                        onChange={(e) => setStudySystem(e.target.value)}
                        className="w-full appearance-none bg-white border border-slate-300 rounded-xl py-2 px-3 pl-8 text-xs sm:text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all cursor-pointer shadow-2xs hover:border-slate-400"
                      >
                        <option value="منتظم">منتظم</option>
                        <option value="انتساب">انتساب</option>
                        <option value="تعليم مستمر">تعليم مستمر</option>
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center px-2.5 text-slate-400">
                        <ChevronDown size={14} />
                      </div>
                    </div>
                  </div>

                  {/* 2. الصف * */}
                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1.5">
                      الصف <span className="text-red-500 font-bold">*</span>
                    </label>
                    <div className="relative">
                      <select
                        value={selectedGrade}
                        onChange={(e) => setSelectedGrade(e.target.value)}
                        className="w-full appearance-none bg-white border border-slate-300 rounded-xl py-2 px-3 pl-8 text-xs sm:text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all cursor-pointer shadow-2xs hover:border-slate-400"
                      >
                        <option value="الأول الابتدائي">الأول الابتدائي</option>
                        <option value="الثاني الابتدائي">الثاني الابتدائي</option>
                        <option value="الثالث الابتدائي">الثالث الابتدائي</option>
                        <option value="الرابع الابتدائي">الرابع الابتدائي</option>
                        <option value="الخامس الابتدائي">الخامس الابتدائي</option>
                        <option value="السادس الابتدائي">السادس الابتدائي</option>
                        <option value="الأول المتوسط">الأول المتوسط</option>
                        <option value="الثاني المتوسط">الثاني المتوسط</option>
                        <option value="الثالث المتوسط">الثالث المتوسط</option>
                        <option value="الأول الثانوي">الأول الثانوي</option>
                        <option value="الثاني الثانوي">الثاني الثانوي</option>
                        <option value="الثالث الثانوي">الثالث الثانوي</option>
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center px-2.5 text-slate-400">
                        <ChevronDown size={14} />
                      </div>
                    </div>
                  </div>

                  {/* 3. القسم * */}
                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1.5">
                      القسم <span className="text-red-500 font-bold">*</span>
                    </label>
                    <div className="relative">
                      <select
                        value={selectedSection}
                        onChange={(e) => setSelectedSection(e.target.value)}
                        className="w-full appearance-none bg-white border border-slate-300 rounded-xl py-2 px-3 pl-8 text-xs sm:text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all cursor-pointer shadow-2xs hover:border-slate-400"
                      >
                        <option value="التعليم العام">التعليم العام</option>
                        <option value="تحفيظ القرآن الكريم">تحفيظ القرآن الكريم</option>
                        <option value="التربية الخاصة">التربية الخاصة</option>
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center px-2.5 text-slate-400">
                        <ChevronDown size={14} />
                      </div>
                    </div>
                  </div>

                </div>

                {/* نص حقول إجبارية على اليمين */}
                <div className="text-[11px] font-bold text-slate-500 pt-1">
                  (*) حقول إجبارية.
                </div>

                {/* زرا البحث والعودة بالمنتصف (كما في الصورة تماماً) */}
                <div className="flex items-center justify-center gap-2.5 pt-1">
                  <button
                    type="button"
                    onClick={handleSearchSubjects}
                    className="px-7 py-2 bg-[#0f172a] hover:bg-slate-800 text-white rounded-xl text-xs sm:text-sm font-black shadow-xs transition-all cursor-pointer"
                  >
                    ابحث
                  </button>
                  <button
                    type="button"
                    onClick={handleResetSearch}
                    className="px-7 py-2 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 rounded-xl text-xs sm:text-sm font-bold shadow-2xs transition-all cursor-pointer"
                  >
                    عودة
                  </button>
                </div>

              </div>

              {/* بنر: لعرض صفحة قابلة للطباعة، انقر هنا (مستطيل بإطار متقطع أخضر/تركوازي) */}
              <div 
                onClick={() => setIsPrintSubjectsModalOpen(true)}
                className="border-2 border-dashed border-teal-500/70 bg-teal-50/40 hover:bg-teal-50/80 rounded-xl p-2.5 sm:p-3 flex items-center justify-between cursor-pointer transition-colors shadow-2xs"
              >
                <div className="flex items-center gap-2 text-teal-700 text-xs sm:text-sm font-bold select-none">
                  <Printer size={16} className="text-teal-600 shrink-0" />
                  <span>لعرض صفحة قابلة للطباعة، <span className="underline font-black">انقر هنا.</span></span>
                </div>
              </div>

              {/* جدول نصاب الحصص للمواد (مطابق للصورة بدقة) */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-right border-collapse min-w-[700px]">
                    
                    {/* رأس الجدول */}
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-700 text-xs sm:text-sm font-black bg-slate-50 select-none">
                        <th className="py-3 px-5 text-right w-1/2">
                          المادة
                        </th>
                        <th className="py-3 px-4 text-center w-1/4">
                          عدد الحصص
                        </th>
                        <th className="py-3 px-5 text-center w-1/4">
                          خيارات
                        </th>
                      </tr>
                    </thead>

                    {/* صفوف المواد */}
                    <tbody className="divide-y divide-slate-100 text-slate-800 text-xs sm:text-sm">
                      {subjectsList.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-50/80 transition-colors group">
                          
                          {/* اسم المادة */}
                          <td className="py-3 px-5 font-bold text-slate-900">
                            {item.name}
                          </td>

                          {/* عدد الحصص */}
                          <td className="py-3 px-4 text-center font-black text-slate-800">
                            <span className="inline-block px-3 py-0.5 rounded-md bg-slate-100 text-slate-900 border border-slate-200">
                              {item.periods}
                            </span>
                          </td>

                          {/* خيارات: رابط تعديل */}
                          <td className="py-3 px-5 text-center">
                            <div className="flex items-center justify-center gap-3">
                              <button
                                type="button"
                                onClick={() => setEditingSubject(item)}
                                className="text-xs sm:text-sm font-bold text-slate-600 hover:text-blue-700 hover:underline transition-colors cursor-pointer"
                              >
                                تعديل
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteSubject(item.id, item.name)}
                                className="text-slate-300 hover:text-rose-600 transition-colors p-1 rounded cursor-pointer opacity-0 group-hover:opacity-100"
                                title="حذف المادة من النصاب"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </td>

                        </tr>
                      ))}
                    </tbody>

                    {/* تذييل الجدول بإجمالي الحصص */}
                    <tfoot>
                      <tr className="bg-slate-50/90 border-t-2 border-slate-200 text-xs sm:text-sm font-black text-slate-900">
                        <td className="py-3 px-5">
                          إجمالي نصاب المواد لـ ({selectedGrade})
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className={`inline-block px-3 py-1 rounded-lg text-sm ${
                            totalSubjectPeriods === 33 
                              ? 'bg-emerald-100 text-emerald-900 border border-emerald-300' 
                              : 'bg-amber-100 text-amber-900 border border-amber-300'
                          }`}>
                            {totalSubjectPeriods} حصة
                          </span>
                        </td>
                        <td className="py-3 px-5 text-center text-slate-400 font-bold text-xs">
                          {totalSubjectPeriods === 33 ? 'مطابق للخطة (33)' : `فارق: ${33 - totalSubjectPeriods}`}
                        </td>
                      </tr>
                    </tfoot>

                  </table>
                </div>
              </div>

            </div>
          )}

          {/* ======================================================== */}
          {/* تبويب: "عدد الحصص اليومية" */}
          {/* ======================================================== */}
          {activeSubTab === 'عدد الحصص اليومية' && (
            <div className="space-y-3 animate-in fade-in duration-150">
              
              {/* بنر: لعرض صفحة قابلة للطباعة، انقر هنا */}
              <div 
                onClick={() => setIsPrintModalOpen(true)}
                className="border-2 border-dashed border-teal-500/70 bg-teal-50/40 hover:bg-teal-50/80 rounded-xl p-2.5 sm:p-3 flex items-center justify-between cursor-pointer transition-colors shadow-2xs"
              >
                <div className="flex items-center gap-2 text-teal-700 text-xs sm:text-sm font-bold select-none">
                  <Printer size={16} className="text-teal-600 shrink-0" />
                  <span>لعرض صفحة قابلة للطباعة، <span className="underline font-black">انقر هنا.</span></span>
                </div>
              </div>

              {/* الجدول الرئيسي */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-right border-collapse min-w-[850px]">
                    
                    {/* رأس الجدول */}
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-700 text-xs font-bold bg-slate-50 select-none">
                        <th className="py-2.5 px-3 font-black w-64">الصف/القسم</th>
                        
                        {days.map((day) => (
                          <th key={day.key} className="py-2.5 px-2 text-center font-bold">
                            <button
                              type="button"
                              onClick={() => toggleDay(day.key)}
                              className="inline-flex items-center gap-1.5 hover:text-blue-700 transition-colors cursor-pointer focus:outline-none"
                              title={`انقر لتفعيل أو إلغاء تفعيل يوم ${day.label}`}
                            >
                              <span>{day.label}</span>
                              <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center transition-all ${
                                day.enabled 
                                  ? 'bg-slate-900 border-slate-900 text-white' 
                                  : 'border-slate-400 bg-white'
                              }`}>
                                {day.enabled && <Check size={10} strokeWidth={3.5} />}
                              </div>
                            </button>
                          </th>
                        ))}

                        <th className="py-2.5 px-2.5 text-center font-black">مجموع الحصص</th>
                        <th className="py-2.5 px-2.5 text-center font-black">عدد حصص الخطة</th>
                        <th className="py-2.5 px-2 text-center w-10"></th>
                      </tr>
                    </thead>

                    {/* صفوف الجدول */}
                    <tbody className="divide-y divide-slate-100 text-slate-800 text-xs">
                      {rows.map((row) => {
                        const totalPeriods = getRowTotal(row);
                        const isMatching = totalPeriods === row.planPeriods;

                        return (
                          <tr key={row.id} className="hover:bg-slate-50/70 transition-colors">
                            {/* اسم الصف / القسم */}
                            <td className="py-2.5 px-3 font-black text-slate-900 whitespace-nowrap">
                              {row.gradeName}
                            </td>

                            {/* أيام الأسبوع */}
                            {days.map((day) => {
                              const safePeriods = row.periods || { saturday: '', sunday: 7, monday: 7, tuesday: 7, wednesday: 6, thursday: 6, friday: '' };
                              const val = safePeriods[day.key];
                              const isDayEnabled = day.enabled;

                              return (
                                <td key={day.key} className="py-2 px-1.5 text-center">
                                  {isDayEnabled ? (
                                    <div className="relative inline-block w-18 sm:w-20">
                                      <select
                                        value={val !== undefined && val !== '' ? String(val) : ''}
                                        onChange={(e) => handlePeriodChange(row.id, day.key, e.target.value)}
                                        className="w-full appearance-none bg-white border border-slate-300 rounded-lg py-1 pr-2.5 pl-5 text-xs font-bold text-center text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all cursor-pointer shadow-2xs hover:border-slate-400"
                                      >
                                        <option value="">-- اختر --</option>
                                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
                                          <option key={n} value={n}>{n}</option>
                                        ))}
                                      </select>
                                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center px-1.5 text-slate-400">
                                        <ChevronDown size={12} />
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="relative inline-block w-18 sm:w-20">
                                      <div className="w-full bg-slate-50 border border-slate-200 rounded-lg py-1 px-1.5 text-xs text-slate-400 text-center select-none cursor-not-allowed">
                                        -- اختر --
                                      </div>
                                    </div>
                                  )}
                                </td>
                              );
                            })}

                            {/* مجموع الحصص التلقائي */}
                            <td className="py-2.5 px-2.5 text-center">
                              <span className={`inline-block font-black text-xs sm:text-sm px-2 py-0.5 rounded-md ${
                                isMatching ? 'text-slate-900' : 'text-amber-700 bg-amber-50 border border-amber-200'
                              }`}>
                                {totalPeriods}
                              </span>
                            </td>

                            {/* عدد حصص الخطة */}
                            <td className="py-2.5 px-2.5 text-center">
                              <input
                                type="number"
                                min={0}
                                max={60}
                                value={row.planPeriods}
                                onChange={(e) => handlePlanPeriodsChange(row.id, e.target.value)}
                                className="w-14 py-0.5 px-1 text-center font-black text-xs sm:text-sm text-slate-900 bg-transparent border border-transparent hover:border-slate-200 focus:border-blue-500 focus:bg-white rounded-lg focus:outline-none transition-all"
                              />
                            </td>

                            {/* خيار الحذف إذا تم إضافة صف إضافي */}
                            <td className="py-2 px-1 text-center">
                              {rows.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => handleDeleteRow(row.id, row.gradeName)}
                                  className="p-1 text-slate-300 hover:text-rose-600 transition-colors rounded cursor-pointer"
                                  title="حذف هذا الصف"
                                >
                                  <Trash2 size={13} />
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* التبويبات الأخرى */}
          {/* ======================================================== */}
          {activeSubTab !== 'عدد الحصص اليومية' && activeSubTab !== 'نصاب الحصص للمواد' && (
            <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-3 animate-in fade-in">
              <div className="w-14 h-14 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
                <Clock size={28} />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-black text-slate-900">{activeSubTab}</h3>
                <p className="text-xs text-slate-500 font-medium max-w-md mx-auto">
                  هذا القسم مخصص لإعدادات ({activeSubTab}) وسيتم ربطه تلقائياً مع جداول الحصص الأسبوعية للمجمع ({complexName}).
                </p>
              </div>
              <div className="pt-2 flex items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveSubTab('نصاب الحصص للمواد')}
                  className="px-4 py-1.5 bg-[#0f172a] text-white rounded-xl font-bold text-xs hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  الذهاب لـ نصاب الحصص للمواد
                </button>
                <button
                  type="button"
                  onClick={() => setActiveSubTab('عدد الحصص اليومية')}
                  className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl font-bold text-xs transition-colors cursor-pointer"
                >
                  الذهاب لـ عدد الحصص اليومية
                </button>
              </div>
            </div>
          )}

        </div>

        {/* 3. شريط الأزرار والإحصائيات السفلي المثبت دائماً */}
        <div className="bg-slate-50 border-t border-slate-200 px-4 sm:px-6 py-2.5 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          
          {/* الإحصائيات والأزرار اليسرى حسب التبويب النشط */}
          {activeSubTab === 'نصاب الحصص للمواد' ? (
            <div className="text-xs sm:text-sm font-bold text-slate-800 flex items-center gap-2.5 order-2 sm:order-1">
              <span>عدد المواد: {subjectsList.length}</span>
              <button
                type="button"
                onClick={() => setShowAddSubjectModal(true)}
                className="text-xs text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1 cursor-pointer bg-blue-50 px-2 py-1 rounded-lg border border-blue-200 hover:bg-blue-100 transition-colors"
              >
                <Plus size={13} />
                <span>إضافة مادة</span>
              </button>
              <button
                type="button"
                onClick={handleResetSubjectsDefault}
                className="text-xs text-slate-500 hover:text-slate-800 font-bold flex items-center gap-1 cursor-pointer hover:underline"
                title="استعادة النصاب الافتراضي كما في الصورة"
              >
                <RotateCcw size={12} />
                <span>استعادة الافتراضي</span>
              </button>
            </div>
          ) : (
            <div className="text-xs sm:text-sm font-bold text-slate-800 flex items-center gap-2.5 order-2 sm:order-1">
              <span>عدد السجلات الكلي: {rows.length}</span>
              <button
                type="button"
                onClick={() => setShowAddGradeModal(true)}
                className="text-xs text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1 cursor-pointer bg-blue-50 px-2 py-1 rounded-lg border border-blue-200 hover:bg-blue-100 transition-colors"
              >
                <Plus size={13} />
                <span>إضافة صف / قسم</span>
              </button>
              <button
                type="button"
                onClick={handleResetToDefault}
                className="text-xs text-slate-500 hover:text-slate-800 font-bold flex items-center gap-1 cursor-pointer hover:underline"
                title="استعادة الوضع الافتراضي كما في الصورة"
              >
                <RotateCcw size={12} />
                <span>استعادة الافتراضي</span>
              </button>
            </div>
          )}

          {/* أزرار الحفظ والعودة */}
          <div className="flex items-center gap-2.5 order-1 sm:order-2">
            <button
              type="button"
              onClick={activeSubTab === 'نصاب الحصص للمواد' ? handleSaveSubjects : handleSaveDailyPeriods}
              disabled={isSaving}
              className="px-6 sm:px-8 py-2 bg-[#0f172a] hover:bg-slate-800 active:scale-95 disabled:opacity-50 text-white rounded-xl text-xs sm:text-sm font-black shadow-xs transition-all cursor-pointer flex items-center gap-2"
            >
              <Save size={15} />
              <span>{isSaving ? 'جارِ الحفظ...' : 'حفظ'}</span>
            </button>

            <button
              type="button"
              onClick={onBack}
              className="px-6 sm:px-8 py-2 bg-white hover:bg-slate-100 active:scale-95 border border-slate-300 text-slate-700 rounded-xl text-xs sm:text-sm font-bold shadow-2xs transition-all cursor-pointer"
            >
              عودة
            </button>
          </div>
        </div>

      </div>

      {/* نافذة تعديل نصاب مادة */}
      {editingSubject && (
        <div className="fixed inset-0 z-60 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 sm:p-6 shadow-2xl border border-slate-200 space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <Edit3 size={16} className="text-blue-600" />
                <span>تعديل نصاب المادة</span>
              </h3>
              <button onClick={() => setEditingSubject(null)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>
            
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">اسم المادة:</label>
              <div className="text-sm font-black text-slate-900 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                {editingSubject.name}
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">عدد الحصص الأسبوعية:</label>
              <input
                type="number"
                min={0}
                max={30}
                autoFocus
                value={editingSubject.periods}
                onChange={(e) => setEditingSubject({ ...editingSubject, periods: parseInt(e.target.value, 10) || 0 })}
                className="w-full py-2 px-3 bg-white border border-slate-300 rounded-xl text-center text-lg font-black text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveSubjectEdit();
                }}
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEditingSubject(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handleSaveSubjectEdit}
                className="px-5 py-2 bg-[#0f172a] hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs"
              >
                حفظ التعديل
              </button>
            </div>
          </div>
        </div>
      )}

      {/* نافذة إضافة مادة جديدة */}
      {showAddSubjectModal && (
        <div className="fixed inset-0 z-60 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-2xl border border-slate-200 space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <h3 className="text-sm font-black text-slate-900">إضافة مادة دراسية جديدة</h3>
              <button onClick={() => setShowAddSubjectModal(false)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>
            
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">اسم المادة:</label>
              <input
                type="text"
                autoFocus
                value={newSubjectName}
                onChange={(e) => setNewSubjectName(e.target.value)}
                placeholder="مثال: التفكير الناقد"
                className="w-full py-2 px-3 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">عدد الحصص:</label>
              <input
                type="number"
                min={1}
                max={30}
                value={newSubjectPeriods}
                onChange={(e) => setNewSubjectPeriods(parseInt(e.target.value, 10) || 1)}
                className="w-full py-2 px-3 bg-slate-50 border border-slate-300 rounded-xl text-center text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAddSubjectModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handleAddSubject}
                disabled={!newSubjectName.trim()}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs"
              >
                إضافة المادة
              </button>
            </div>
          </div>
        </div>
      )}

      {/* نافذة طباعة نصاب الحصص للمواد */}
      {isPrintSubjectsModalOpen && (
        <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 no-print">
              <div className="flex items-center gap-2">
                <Printer size={20} className="text-teal-600" />
                <h3 className="text-base font-black text-slate-900">معاينة تقرير نصاب المواد القابل للطباعة</h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-4 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs transition-all"
                >
                  <Printer size={14} />
                  <span>طباعة فورية</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsPrintSubjectsModalOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* ورقة التقرير المطبوع */}
            <div className="p-4 border border-slate-200 rounded-2xl bg-white space-y-4 text-center">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3 text-right">
                <div>
                  <h2 className="text-base font-black text-slate-900">{complexName}</h2>
                  <p className="text-xs text-slate-500 font-bold">العام الدراسي: {academicYear}</p>
                </div>
                <div className="text-center font-black text-sm text-slate-800 bg-slate-100 px-4 py-1.5 rounded-xl border border-slate-200">
                  تقرير نصاب الحصص للمواد الدراسية
                </div>
              </div>

              <div className="flex items-center justify-center gap-6 bg-slate-50 p-2.5 rounded-xl text-xs font-bold text-slate-700">
                <span>النظام الدراسي: {studySystem}</span>
                <span>•</span>
                <span>الصف: {selectedGrade}</span>
                <span>•</span>
                <span>القسم: {selectedSection}</span>
              </div>

              <table className="w-full text-right border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100 text-slate-800 font-bold border-b border-slate-300">
                    <th className="p-2 text-right">م</th>
                    <th className="p-2 text-right">اسم المادة</th>
                    <th className="p-2 text-center">عدد الحصص الأسبوعية</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {subjectsList.map((item, idx) => (
                    <tr key={item.id}>
                      <td className="p-2 font-bold text-slate-400">{idx + 1}</td>
                      <td className="p-2 font-bold text-slate-900">{item.name}</td>
                      <td className="p-2 text-center font-black">{item.periods}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-100 font-black text-slate-900 border-t-2 border-slate-300">
                    <td colSpan={2} className="p-2 text-right">إجمالي عدد الحصص</td>
                    <td className="p-2 text-center text-sm">{totalSubjectPeriods} حصة</td>
                  </tr>
                </tfoot>
              </table>

              <div className="text-left text-[11px] text-slate-400 pt-2 border-t border-slate-100">
                تاريخ الطباعة: {new Date().toLocaleDateString('ar-SA')}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* نافذة إضافة صف جديد لعدد الحصص اليومية */}
      {showAddGradeModal && (
        <div className="fixed inset-0 z-60 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-2xl border border-slate-200 space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-black text-slate-900">إضافة صف أو قسم جديد</h3>
              <button onClick={() => setShowAddGradeModal(false)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700">اسم الصف / القسم:</label>
              <input
                type="text"
                autoFocus
                value={newGradeName}
                onChange={(e) => setNewGradeName(e.target.value)}
                placeholder="مثال: الأول المتوسط التعليم العام"
                className="w-full py-2 px-3 bg-slate-50 border border-slate-300 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAddGrade();
                }}
              />
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAddGradeModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handleAddGrade}
                disabled={!newGradeName.trim()}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs"
              >
                إضافة
              </button>
            </div>
          </div>
        </div>
      )}

      {/* نافذة المعاينة والطباعة لعدد الحصص اليومية */}
      {isPrintModalOpen && (
        <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5">
          <div className="bg-white rounded-3xl max-w-4xl w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 no-print">
              <div className="flex items-center gap-2">
                <Printer size={20} className="text-teal-600" />
                <h3 className="text-base font-black text-slate-900">معاينة التقرير القابل للطباعة</h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-4 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs transition-all"
                >
                  <Printer size={14} />
                  <span>طباعة فورية</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsPrintModalOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* الورقة المطبوعة */}
            <div className="p-4 border border-slate-200 rounded-2xl bg-white space-y-4 text-center">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3 text-right">
                <div>
                  <h2 className="text-base font-black text-slate-900">{complexName}</h2>
                  <p className="text-xs text-slate-500 font-bold">العام الدراسي: {academicYear}</p>
                </div>
                <div className="text-center font-black text-sm text-slate-800 bg-slate-100 px-4 py-1.5 rounded-xl border border-slate-200">
                  خطة وتوزيع عدد الحصص اليومية
                </div>
              </div>

              <table className="w-full text-right border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100 text-slate-800 font-bold border-b border-slate-300">
                    <th className="p-2">الصف/القسم</th>
                    {days.filter(d => d.enabled).map(d => (
                      <th key={d.key} className="p-2 text-center">{d.label}</th>
                    ))}
                    <th className="p-2 text-center">مجموع الحصص</th>
                    <th className="p-2 text-center">حصص الخطة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {rows.map(r => {
                    const safePeriods = r.periods || {};
                    return (
                      <tr key={r.id}>
                        <td className="p-2 font-bold text-slate-900">{r.gradeName}</td>
                        {days.filter(d => d.enabled).map(d => (
                          <td key={d.key} className="p-2 text-center font-bold">{safePeriods[d.key] || '-'}</td>
                        ))}
                        <td className="p-2 text-center font-black">{getRowTotal(r)}</td>
                        <td className="p-2 text-center font-bold">{r.planPeriods}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              <div className="text-left text-[11px] text-slate-400 pt-2 border-t border-slate-100">
                تاريخ الطباعة: {new Date().toLocaleDateString('ar-SA')}
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
