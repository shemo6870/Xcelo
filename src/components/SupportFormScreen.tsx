import React, { useState, useEffect, useRef } from 'react';
import { 
  HeartHandshake, Save, User, Hash, Globe, Users, 
  CreditCard, Phone, 
  Mail, Landmark, Calendar, Check, Copy, X, Trash2, Edit3, 
  AlertCircle, Search, Plus
} from 'lucide-react';
import { 
  SupportStaffRecord, 
  saveSupportStaffToFirestore, 
  getSupportStaffFromFirestore, 
  deleteSupportStaffFromFirestore,
  updateSupportStaffInFirestore
} from '../lib/api';
import { DatePickerField } from './DatePickerField';
import { OptionManagerModal } from './OptionManagerModal';
import { ManagedSelectField } from './ManagedSelectField';
import {
  DEFAULT_NATIONALITIES,
  DEFAULT_SUPPORT_SECTIONS,
  DEFAULT_BANKS,
  loadCustomOptions,
  saveCustomOptions,
  fetchCustomOptionsFromFirestore
} from '../lib/customOptions';

interface SupportFormScreenProps {
  onBack: () => void;
  academicYear: string;
  complexName: string;
  isAdmin?: boolean;
}

interface LoadedSupportStaff extends SupportStaffRecord {
  source: 'firestore' | 'local';
}

const STORAGE_KEY = 'registered_support_staff_fresh_v1';

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

type SupportOptionFieldKey = 'nationality' | 'section' | 'bank';

export const SupportFormScreen: React.FC<SupportFormScreenProps> = ({
  onBack,
  academicYear,
  complexName,
  isAdmin = true
}) => {
  // خيارات كافة المدخلات القابلة للتخصيص من قبل الأدمن
  const [nationalityOptions, setNationalityOptions] = useState<string[]>(() => 
    loadCustomOptions('custom_nationalities_v1', DEFAULT_NATIONALITIES)
  );
  const [sectionOptions, setSectionOptions] = useState<string[]>(() => 
    loadCustomOptions('custom_support_sections_v1', DEFAULT_SUPPORT_SECTIONS)
  );
  const [bankOptions, setBankOptions] = useState<string[]>(() => 
    loadCustomOptions('custom_banks_v1', DEFAULT_BANKS)
  );

  // مزامنة الخيارات مع فايربيس في الخلفية
  useEffect(() => {
    fetchCustomOptionsFromFirestore('custom_nationalities_v1', DEFAULT_NATIONALITIES).then(setNationalityOptions);
    fetchCustomOptionsFromFirestore('custom_support_sections_v1', DEFAULT_SUPPORT_SECTIONS).then(setSectionOptions);
    fetchCustomOptionsFromFirestore('custom_banks_v1', DEFAULT_BANKS).then(setBankOptions);
  }, []);

  // الحقول الخاصة بالخدمات المساندة
  const [jobNum, setJobNum] = useState('');
  const [name, setName] = useState('');
  const [nationality, setNationality] = useState(nationalityOptions[0] || 'سعودي');
  const [section, setSection] = useState(sectionOptions[0] || 'إدارة المجمع');
  const [nationalId, setNationalId] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [ibanDigits, setIbanDigits] = useState('');
  const [bank, setBank] = useState(bankOptions[0] || 'مصرف الراجحي');
  const [startDate, setStartDate] = useState('');

  // حالة نافذة إدارة الخيارات للأدمن
  const [optionManager, setOptionManager] = useState<{
    isOpen: boolean;
    fieldKey: SupportOptionFieldKey | '';
    title: string;
    options: string[];
    accentColor: 'blue' | 'indigo' | 'emerald' | 'teal' | 'violet' | 'amber';
  }>({
    isOpen: false,
    fieldKey: '',
    title: '',
    options: [],
    accentColor: 'teal'
  });

  const openOptionManager = (
    fieldKey: SupportOptionFieldKey,
    title: string,
    options: string[],
    accentColor: 'blue' | 'indigo' | 'emerald' | 'teal' | 'violet' | 'amber' = 'teal'
  ) => {
    setOptionManager({
      isOpen: true,
      fieldKey,
      title,
      options,
      accentColor
    });
  };

  const applyOptionsUpdate = (key: SupportOptionFieldKey, newOpts: string[]) => {
    let storageKey = '';
    switch (key) {
      case 'nationality':
        setNationalityOptions(newOpts);
        storageKey = 'custom_nationalities_v1';
        break;
      case 'section':
        setSectionOptions(newOpts);
        storageKey = 'custom_support_sections_v1';
        break;
      case 'bank':
        setBankOptions(newOpts);
        storageKey = 'custom_banks_v1';
        break;
    }
    if (storageKey) {
      saveCustomOptions(storageKey, newOpts);
    }
    setOptionManager(prev => ({ ...prev, options: newOpts }));
  };

  const handleAddOption = (newOpt: string) => {
    if (!optionManager.fieldKey) return;
    const current = optionManager.options;
    const updated = [...current, newOpt];
    applyOptionsUpdate(optionManager.fieldKey, updated);

    switch (optionManager.fieldKey) {
      case 'nationality': setNationality(newOpt); break;
      case 'section': setSection(newOpt); break;
      case 'bank': setBank(newOpt); break;
    }
  };

  const handleDeleteOption = (optToDelete: string) => {
    if (!optionManager.fieldKey) return;
    const updated = optionManager.options.filter(o => o !== optToDelete);
    applyOptionsUpdate(optionManager.fieldKey, updated);

    const fallback = updated[0] || '';
    switch (optionManager.fieldKey) {
      case 'nationality': if (nationality === optToDelete) setNationality(fallback); break;
      case 'section': if (section === optToDelete) setSection(fallback); break;
      case 'bank': if (bank === optToDelete) setBank(fallback); break;
    }
  };

  const handleEditOption = (oldOpt: string, newOpt: string) => {
    if (!optionManager.fieldKey) return;
    const updated = optionManager.options.map(o => o === oldOpt ? newOpt : o);
    applyOptionsUpdate(optionManager.fieldKey, updated);

    switch (optionManager.fieldKey) {
      case 'nationality': if (nationality === oldOpt) setNationality(newOpt); break;
      case 'section': if (section === oldOpt) setSection(newOpt); break;
      case 'bank': if (bank === oldOpt) setBank(newOpt); break;
    }
  };

  // حالات البحث والموظف المحدد
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<LoadedSupportStaff | null>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // حالة تأكيد الحذف
  const [staffToDelete, setStaffToDelete] = useState<LoadedSupportStaff | null>(null);

  // حالات مساعدة
  const [allStaff, setAllStaff] = useState<LoadedSupportStaff[]>([]);
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
        if (staffToDelete) {
          setStaffToDelete(null);
        } else {
          onBack();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onBack, staffToDelete]);

  // جلب البيانات: فقط وحصرياً ما يتم تسجيله جديداً في الخدمات المساندة
  const fetchAllStaff = async () => {
    try {
      const rawLocal = safeGetStorage(STORAGE_KEY);
      let localList: LoadedSupportStaff[] = [];
      if (rawLocal) {
        try {
          localList = JSON.parse(rawLocal);
        } catch {
          localList = [];
        }
      }

      try {
        const fsStaff = await getSupportStaffFromFirestore();
        const map = new Map<string, LoadedSupportStaff>();
        
        localList.forEach(s => {
          if (s && s.jobNum) map.set(s.jobNum, s);
        });

        fsStaff.forEach(s => {
          if (s && s.jobNum) {
            map.set(s.jobNum, { ...s, source: 'firestore' });
          }
        });

        const merged = Array.from(map.values());
        setAllStaff(merged);
        safeSetStorage(STORAGE_KEY, JSON.stringify(merged));
      } catch (err) {
        console.warn('Firestore fallback to local storage for support staff:', err);
        setAllStaff(localList);
      }
    } catch (e) {
      console.error('Error fetching registered support staff:', e);
    }
  };

  useEffect(() => {
    fetchAllStaff();
  }, []);

  // نتائج البحث المفلترة بالاسم أو الرقم الوظيفي حصراً في الخدمات المساندة
  const searchResults = React.useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    return allStaff.filter(s => 
      s.name.toLowerCase().includes(q) || 
      s.jobNum.toLowerCase().includes(q)
    ).slice(0, 15);
  }, [searchQuery, allStaff]);

  // تعبئة النموذج ببيانات موظف الخدمات المساندة المحدد للتعديل
  const populateStaffData = (staff: LoadedSupportStaff) => {
    setSelectedStaff(staff);
    setJobNum(staff.jobNum || '');
    setName(staff.name || '');
    setNationality(staff.nationality || 'سعودي');
    setSection(staff.section || 'إدارة المجمع');
    setNationalId(staff.nationalId || '');
    setPhone(staff.phone || '');
    setEmail(staff.email || '');

    const ibanClean = (staff.iban || '').toUpperCase().replace(/^SA/i, '').replace(/[^0-9]/g, '');
    setIbanDigits(ibanClean);

    setBank(staff.bank || 'مصرف الراجحي');
    setStartDate(staff.startDate || '');

    setIsSearchOpen(false);
    setErrorMessage(null);
    setSuccessMessage(`تم تحميل بيانات موظف الخدمات المساندة (${staff.name}) للتعديل`);
  };

  // تفريغ النموذج والعودة للحالة الافتراضية
  const handleResetForm = () => {
    setSelectedStaff(null);
    setSearchQuery('');
    setIsSearchOpen(false);
    setJobNum('');
    setName('');
    setNationality(nationalityOptions[0] || 'سعودي');
    setSection(sectionOptions[0] || 'إدارة المجمع');
    setNationalId('');
    setPhone('');
    setEmail('');
    setIbanDigits('');
    setBank(bankOptions[0] || 'مصرف الراجحي');
    setStartDate('');
    setErrorMessage(null);
  };

  // حفظ بيانات موظف الخدمات المساندة الجديدة
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage(null);
    setErrorMessage(null);

    if (!jobNum.trim()) {
      setErrorMessage('يرجى إدخال الرقم الوظيفي للموظف');
      return;
    }
    if (!name.trim()) {
      setErrorMessage('يرجى إدخال اسم الموظف رباعي');
      return;
    }

    const fullIban = ibanDigits.trim() ? `SA${ibanDigits.trim()}` : 'SA';

    const staffData: SupportStaffRecord = {
      jobNum: jobNum.trim(),
      name: name.trim(),
      nationality: nationality.trim(),
      section: section.trim(),
      nationalId: nationalId.trim(),
      phone: phone.trim(),
      email: email.trim(),
      iban: fullIban,
      bank: bank.trim(),
      startDate: startDate.trim()
    };

    setIsSaving(true);

    const tempId = 'support_' + Date.now();
    let savedId = tempId;

    try {
      const res = await saveSupportStaffToFirestore(staffData);
      if (res && res.id) {
        savedId = res.id;
      }
    } catch (err) {
      console.warn('Saved locally, Firestore sync queued/error for support staff:', err);
    }

    const newStaff: LoadedSupportStaff = { 
      ...staffData, 
      id: savedId, 
      source: 'firestore' 
    };

    const updatedList = [newStaff, ...allStaff.filter(s => s.jobNum !== newStaff.jobNum)];
    setAllStaff(updatedList);
    safeSetStorage(STORAGE_KEY, JSON.stringify(updatedList));

    // عند الحفظ: تفريغ النموذج ويبقى زر الحفظ فقط دون ظهور تعديل أو حذف
    handleResetForm();
    setIsSaving(false);
    setSuccessMessage(`تم حفظ بيانات موظف الخدمات المساندة (${newStaff.name}) بنجاح!`);
    setTimeout(() => setSuccessMessage(null), 4000);
  };

  // تعديل بيانات موظف الخدمات المساندة الحالي
  const handleEdit = async () => {
    if (!selectedStaff) return;
    setSuccessMessage(null);
    setErrorMessage(null);

    if (!jobNum.trim()) {
      setErrorMessage('يرجى إدخال الرقم الوظيفي للموظف');
      return;
    }
    if (!name.trim()) {
      setErrorMessage('يرجى إدخال اسم الموظف رباعي');
      return;
    }

    const fullIban = ibanDigits.trim() ? `SA${ibanDigits.trim()}` : 'SA';

    const updatedData: SupportStaffRecord = {
      jobNum: jobNum.trim(),
      name: name.trim(),
      nationality: nationality.trim(),
      section: section.trim(),
      nationalId: nationalId.trim(),
      phone: phone.trim(),
      email: email.trim(),
      iban: fullIban,
      bank: bank.trim(),
      startDate: startDate.trim()
    };

    setIsSaving(true);
    try {
      if (selectedStaff.id) {
        try {
          await updateSupportStaffInFirestore(selectedStaff.id, updatedData);
        } catch {
          await saveSupportStaffToFirestore(updatedData);
        }
      } else {
        await saveSupportStaffToFirestore(updatedData);
      }
    } catch (err) {
      console.warn('Support staff update saved locally:', err);
    }

    const updatedLoadedStaff: LoadedSupportStaff = {
      ...updatedData,
      id: selectedStaff.id || 'support_' + Date.now(),
      source: 'firestore'
    };

    const updatedList = allStaff.map(s => 
      (s.id === selectedStaff.id || s.jobNum === selectedStaff.jobNum) 
        ? updatedLoadedStaff 
        : s
    );

    setAllStaff(updatedList);
    safeSetStorage(STORAGE_KEY, JSON.stringify(updatedList));

    handleResetForm();
    setIsSaving(false);
    setSuccessMessage(`تم حفظ تعديلات بيانات موظف الخدمات المساندة (${updatedData.name}) بنجاح!`);
    setTimeout(() => setSuccessMessage(null), 4000);
  };

  // تأكيد وتنفيذ الحذف
  const confirmDeleteStaff = async () => {
    if (!staffToDelete) return;
    const target = staffToDelete;
    setIsSaving(true);

    try {
      if (target.id) {
        try {
          await deleteSupportStaffFromFirestore(target.id);
        } catch (e) {
          console.warn('Firestore delete error for support staff:', e);
        }
      }
    } catch (e) {
      console.error(e);
    }

    const updatedList = allStaff.filter(s => 
      s.id !== target.id && s.jobNum !== target.jobNum
    );

    setAllStaff(updatedList);
    safeSetStorage(STORAGE_KEY, JSON.stringify(updatedList));

    if (selectedStaff && (selectedStaff.id === target.id || selectedStaff.jobNum === target.jobNum)) {
      handleResetForm();
    }

    setStaffToDelete(null);
    setIsSaving(false);
    setSuccessMessage(`تم حذف بيانات موظف الخدمات المساندة (${target.name}) بنجاح!`);
    setTimeout(() => setSuccessMessage(null), 4000);
  };

  return (
    <div 
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-2 sm:p-3 md:p-4" 
      dir="rtl"
      onClick={(e) => {
        if (e.target === e.currentTarget && !staffToDelete) {
          onBack();
        }
      }}
    >
      {/* نافذة تأكيد الحذف المنبثقة والآمنة داخلياً */}
      {staffToDelete && (
        <div className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-5 sm:p-6 max-w-md w-full shadow-2xl border border-slate-200 text-center space-y-4 animate-in fade-in zoom-in-95">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto shadow-inner">
              <Trash2 size={24} />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-slate-900 mb-1">تأكيد حذف الموظف</h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                هل أنت متأكد من حذف بيانات موظف الخدمات المساندة <span className="font-black text-slate-900">«{staffToDelete.name}»</span> نهائياً من النظام؟
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setStaffToDelete(null)}
                className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-bold hover:bg-slate-100 transition-all text-xs sm:text-sm cursor-pointer flex-1"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={confirmDeleteStaff}
                disabled={isSaving}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 active:scale-95 text-white font-bold transition-all text-xs sm:text-sm cursor-pointer flex-1 shadow-md shadow-rose-600/25"
              >
                {isSaving ? 'جاري الحذف...' : 'نعم، حذف الموظف'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* بطاقة النافذة المنبثقة الرئيسية - الخدمات المساندة */}
      <div className="relative w-full max-w-5xl lg:max-w-6xl h-auto max-h-[96vh] bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col justify-between my-auto animate-in fade-in zoom-in-95 duration-150">
        
        {/* 1. شريط العنوان العلوي (مضغوط وأنيق ومثبت) */}
        <div className="bg-white border-b border-slate-200 px-4 sm:px-6 py-2.5 shadow-xs flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 sm:p-2 bg-teal-50 text-teal-600 rounded-xl border border-teal-100">
              <HeartHandshake size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-black text-slate-800">
                  بطاقة بيانات الخدمات المساندة
                </h1>
                {selectedStaff && (
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200 flex items-center gap-1">
                    <Edit3 size={11} />
                    <span>تعديل: {selectedStaff.name}</span>
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 text-[11px] text-slate-500 font-bold">
                <span>{complexName}</span>
                <span>•</span>
                <span>العام الدراسي: {academicYear}</span>
                <span>•</span>
                <span className="text-teal-700 font-extrabold">{allStaff.length} موظفاً مسجلاً</span>
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
          onSubmit={selectedStaff ? (e) => { e.preventDefault(); handleEdit(); } : handleSave} 
          className="flex-1 flex flex-col min-h-0 overflow-hidden"
        >
          {/* محتوى الحقول القابل للتمرير إن لزم، ومضغوط بحيث يظهر كاملاً في معظم الشاشات */}
          <div className="p-3 sm:p-4 md:p-5 flex-1 overflow-y-auto space-y-2.5 sm:space-y-3">
            
            {/* خانة البحث فوق الحقول بالاسم أو الرقم الوظيفي حصراً في الخدمات المساندة */}
            <div ref={searchContainerRef} className="relative w-full z-30 shrink-0">
              <div className="bg-slate-50 hover:bg-white focus-within:bg-white px-3 py-1.5 sm:py-2 rounded-xl border border-teal-200 focus-within:border-teal-500 focus-within:ring-2 focus-within:ring-teal-100 transition-all flex items-center gap-2.5">
                <Search size={18} className="text-teal-600 shrink-0" />
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
                        populateStaffData(searchResults[0]);
                      }
                    }}
                    placeholder={allStaff.length === 0 ? "لا يوجد موظفو خدمات مساندة مسجلون حالياً، قم بتسجيل الموظفين بالأسفل..." : "ابحث هنا باسم موظف الخدمات المساندة أو الرقم الوظيفي..."}
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

              {/* قائمة نتائج البحث: يظهر الاسم فقط وتحته تعديل أو حذف */}
              {isSearchOpen && searchQuery.trim() !== '' && (
                <div className="absolute top-full mt-1.5 right-0 left-0 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-50 max-h-56 overflow-y-auto">
                  <div className="p-2 bg-slate-50 border-b border-slate-100 text-[11px] font-bold text-slate-500 flex justify-between items-center">
                    <span>نتائج بحث الخدمات المساندة ({searchResults.length})</span>
                    <span>اختر تعديل لتعبئة البيانات أو حذف لإزالته</span>
                  </div>
                  
                  {searchResults.length > 0 ? (
                    searchResults.map(staff => (
                      <div
                        key={staff.id || staff.jobNum}
                        className="p-2.5 sm:p-3 hover:bg-teal-50/70 border-b border-slate-100 last:border-b-0 transition-colors flex items-center justify-between"
                      >
                        {/* يظهر الاسم فقط */}
                        <div className="text-sm sm:text-base font-black text-slate-900">
                          {staff.name}
                        </div>

                        {/* وتحته تعديل أو حذف */}
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => populateStaffData(staff)}
                            className="flex items-center gap-1 px-3 py-1 bg-teal-600 hover:bg-teal-700 active:scale-95 text-white rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer"
                          >
                            <Edit3 size={12} />
                            <span>تعديل</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setStaffToDelete(staff)}
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
                      لم يتم العثور على موظف يطابق "{searchQuery}"
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

            {/* شبكة المدخلات: 10 حقول بعد استبعاد المؤهل والتخصص ومادة التدريس ونصاب المعلم والرخصة المهنية وكلاسيرا */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-x-4 gap-y-2 sm:gap-y-2.5">
              
              {/* 1. الرقم الوظيفي */}
              <div>
                <label className="flex items-center gap-1 text-[11px] sm:text-xs font-bold text-slate-700 mb-0.5">
                  <Hash size={13} className="text-teal-600" />
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
                  className="w-full py-1.5 px-3 bg-slate-50 hover:bg-white focus:bg-white border border-slate-300 rounded-lg text-xs sm:text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all font-mono"
                  dir="ltr"
                />
              </div>

              {/* 2. اسم الموظف */}
              <div>
                <label className="flex items-center gap-1 text-[11px] sm:text-xs font-bold text-slate-700 mb-0.5">
                  <User size={13} className="text-teal-600" />
                  <span>اسم الموظف:</span>
                  <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="اسم موظف الخدمات المساندة رباعي..."
                  className="w-full py-1.5 px-3 bg-slate-50 hover:bg-white focus:bg-white border border-slate-300 rounded-lg text-xs sm:text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all"
                />
              </div>

              {/* 3. الجنسية (اختيارات مع إدارة للأدمن) */}
              <ManagedSelectField
                label="الجنسية"
                icon={<Globe size={13} className="text-teal-600" />}
                value={nationality}
                onChange={setNationality}
                options={nationalityOptions}
                onManageOptions={() => openOptionManager('nationality', 'الجنسية', nationalityOptions, 'teal')}
                isAdmin={isAdmin}
                accentColor="teal"
              />

              {/* 4. القسم (إدارة المجمع / بنين / بنات مع إدارة للأدمن) */}
              <ManagedSelectField
                label="القسم"
                icon={<Users size={13} className="text-teal-600" />}
                value={section}
                onChange={setSection}
                options={sectionOptions}
                onManageOptions={() => openOptionManager('section', 'القسم', sectionOptions, 'teal')}
                isAdmin={isAdmin}
                accentColor="teal"
              />

              {/* 5. رقم الهوية */}
              <div>
                <label className="flex items-center gap-1 text-[11px] sm:text-xs font-bold text-slate-700 mb-0.5">
                  <CreditCard size={13} className="text-teal-600" />
                  <span>رقم الهوية / الإقامة:</span>
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={10}
                  value={nationalId}
                  onKeyDown={handleNumericKeyDown}
                  onChange={(e) => setNationalId(toOnlyDigits(e.target.value).slice(0, 10))}
                  className="w-full py-1.5 px-3 bg-slate-50 hover:bg-white focus:bg-white border border-slate-300 rounded-lg text-xs sm:text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all font-mono"
                  dir="ltr"
                />
              </div>

              {/* 6. رقم الجوال */}
              <div>
                <label className="flex items-center gap-1 text-[11px] sm:text-xs font-bold text-slate-700 mb-0.5">
                  <Phone size={13} className="text-teal-600" />
                  <span>رقم الجوال:</span>
                </label>
                <input
                  type="tel"
                  inputMode="numeric"
                  maxLength={10}
                  value={phone}
                  onKeyDown={handleNumericKeyDown}
                  onChange={(e) => setPhone(toOnlyDigits(e.target.value).slice(0, 10))}
                  className="w-full py-1.5 px-3 bg-slate-50 hover:bg-white focus:bg-white border border-slate-300 rounded-lg text-xs sm:text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all font-mono"
                  dir="ltr"
                />
              </div>

              {/* 7. الإيميل (كتابة مع إكمال تلقائي عند كتابة @) */}
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

              {/* 8. رقم IBAN (مع SA ظاهرة كنص ثابت) */}
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

              {/* 9. البنك (اختيارات مع إدارة للأدمن) */}
              <ManagedSelectField
                label="اسم البنك"
                icon={<Landmark size={13} className="text-amber-700" />}
                value={bank}
                onChange={setBank}
                options={bankOptions}
                onManageOptions={() => openOptionManager('bank', 'اسم البنك', bankOptions, 'amber')}
                isAdmin={isAdmin}
                accentColor="amber"
              />

              {/* 10. تاريخ المباشرة */}
              <div>
                <label className="flex items-center gap-1 text-[11px] sm:text-xs font-bold text-slate-700 mb-0.5">
                  <Calendar size={13} className="text-teal-600" />
                  <span>تاريخ المباشرة:</span>
                </label>
                <DatePickerField
                  value={startDate}
                  onChange={setStartDate}
                  accentColor="blue"
                  dropUp={true}
                />
              </div>

            </div>

          </div>

          {/* 3. شريط الأزرار السفلي المثبت دائماً للخدمات المساندة */}
          <div className="bg-slate-50/95 border-t border-slate-200 px-4 sm:px-6 py-2.5 sm:py-3 flex items-center justify-between shrink-0 z-20">
            <div className="flex items-center gap-2">
              {selectedStaff ? (
                <div className="flex items-center gap-1.5 text-xs text-amber-900 bg-amber-100 border border-amber-300 px-3 py-1.5 rounded-xl font-bold">
                  <Edit3 size={13} className="text-amber-700" />
                  <span>تعديل بيانات: <strong className="text-amber-950 font-black">{selectedStaff.name}</strong></span>
                </div>
              ) : (
                <span className="text-[11px] sm:text-xs text-slate-500 font-bold">
                  الحقول المعلمة بـ (<span className="text-red-500">*</span>) إلزامية.
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {/* إذا تم اختيار موظف من البحث يظهر زري تعديل وحذف وإلغاء بوضوح تام */}
              {selectedStaff ? (
                <>
                  <button
                    type="button"
                    onClick={() => setStaffToDelete(selectedStaff)}
                    disabled={isSaving}
                    className="flex items-center gap-1 px-4 py-2 bg-rose-600 hover:bg-rose-700 active:scale-95 disabled:opacity-50 text-white rounded-xl font-bold shadow-xs transition-all text-xs sm:text-sm cursor-pointer"
                    title="حذف هذا الموظف"
                  >
                    <Trash2 size={15} />
                    <span>حذف الموظف</span>
                  </button>

                  <button
                    type="submit"
                    disabled={isSaving}
                    className="flex items-center gap-1.5 px-5 py-2 bg-teal-600 hover:bg-teal-700 active:scale-95 disabled:opacity-50 text-white rounded-xl font-bold shadow-md hover:shadow-teal-500/25 transition-all text-xs sm:text-sm cursor-pointer"
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
                  <span>{isSaving ? 'جاري الحفظ...' : 'حفظ بيانات الموظف'}</span>
                </button>
              )}
            </div>
          </div>

        </form>

      </div>

      {/* نافذة إدارة الخيارات للأدمن */}
      <OptionManagerModal
        isOpen={optionManager.isOpen}
        onClose={() => setOptionManager(prev => ({ ...prev, isOpen: false }))}
        title={optionManager.title}
        options={optionManager.options}
        onAddOption={handleAddOption}
        onDeleteOption={handleDeleteOption}
        onEditOption={handleEditOption}
        accentColor={optionManager.accentColor}
      />
    </div>
  );
};
