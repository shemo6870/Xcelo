import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  BarChart3, Save, Compass, Users, BookOpen, 
  Layers, Check, X, Trash2, Edit3, AlertCircle, 
  Search, Plus, Sparkles, GraduationCap, School,
  UserCheck, UserX, Calculator, RefreshCw, ChevronDown
} from 'lucide-react';
import { 
  ClassStatsRecord, 
  saveClassStatsToFirestore, 
  getClassStatsFromFirestore, 
  deleteClassStatsFromFirestore,
  updateClassStatsInFirestore
} from '../lib/api';
import { OptionManagerModal } from './OptionManagerModal';
import { ManagedSelectField } from './ManagedSelectField';
import { arabicIncludes } from '../lib/arabicUtils';
import {
  DEFAULT_TRACKS,
  DEFAULT_STUDENT_SECTIONS,
  DEFAULT_BOYS_STAGES,
  DEFAULT_GIRLS_STAGES,
  DEFAULT_KG_GRADES,
  DEFAULT_PRIMARY_GRADES,
  DEFAULT_MIDDLE_GRADES,
  DEFAULT_SECONDARY_GRADES,
  DEFAULT_SECONDARY_TRACKS,
  DEFAULT_CLASS_COUNTS,
  loadCustomOptions,
  saveCustomOptions,
  fetchCustomOptionsFromFirestore
} from '../lib/customOptions';

interface ClassStatsFormScreenProps {
  onBack: () => void;
  academicYear: string;
  complexName: string;
  isAdmin?: boolean;
}

interface LoadedClassStats extends ClassStatsRecord {
  source: 'firestore' | 'local';
}

const STORAGE_KEY = 'registered_classes_stats_v1';

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

type ClassStatsOptionFieldKey = 'track' | 'section' | 'secondaryTrack';

export const ClassStatsFormScreen: React.FC<ClassStatsFormScreenProps> = ({
  onBack,
  academicYear,
  complexName,
  isAdmin = true
}) => {
  // 1. خيارات المسار العام (مشتركة مع إمكانية إدارة للأدمن)
  const [trackOptions, setTrackOptions] = useState<string[]>(() => 
    loadCustomOptions('custom_tracks_v1', DEFAULT_TRACKS)
  );

  // 2. خيارات القسم
  const [sectionOptions, setSectionOptions] = useState<string[]>(() => 
    loadCustomOptions('custom_student_sections_v1', DEFAULT_STUDENT_SECTIONS)
  );

  // 3. خيارات مسار الثانوي التخصصي
  const [secondaryTrackOptions, setSecondaryTrackOptions] = useState<string[]>(() => 
    loadCustomOptions('custom_secondary_tracks_v1', DEFAULT_SECONDARY_TRACKS)
  );

  // مزامنة الخيارات مع فايربيس في الخلفية
  useEffect(() => {
    fetchCustomOptionsFromFirestore('custom_tracks_v1', DEFAULT_TRACKS).then(setTrackOptions);
    fetchCustomOptionsFromFirestore('custom_student_sections_v1', DEFAULT_STUDENT_SECTIONS).then(setSectionOptions);
    fetchCustomOptionsFromFirestore('custom_secondary_tracks_v1', DEFAULT_SECONDARY_TRACKS).then(setSecondaryTrackOptions);
  }, []);

  // الحقول الأساسية للنموذج
  const [track, setTrack] = useState(trackOptions[0] || 'أهلي');
  const [section, setSection] = useState<'بنين' | 'بنات' | string>(sectionOptions[0] || 'بنين');
  
  // المرحلة: تتوقف على القسم (بنين لا يظهر فيها تمهيدي، بنات يظهر فيها تمهيدي)
  const currentStageOptions = useMemo(() => {
    return section === 'بنات' ? DEFAULT_GIRLS_STAGES : DEFAULT_BOYS_STAGES;
  }, [section]);

  const [stage, setStage] = useState<string>(() => (section === 'بنات' ? 'تمهيدي' : 'ابتدائي'));

  // الصف: يتوقف تماماً على المرحلة المختارة
  const currentGradeOptions = useMemo(() => {
    switch (stage) {
      case 'تمهيدي':
        return DEFAULT_KG_GRADES;
      case 'ابتدائي':
        return DEFAULT_PRIMARY_GRADES;
      case 'متوسط':
        return DEFAULT_MIDDLE_GRADES;
      case 'ثانوي':
        return DEFAULT_SECONDARY_GRADES;
      default:
        return DEFAULT_PRIMARY_GRADES;
    }
  }, [stage]);

  const [grade, setGrade] = useState<string>(() => currentGradeOptions[0] || 'أول ابتدائي');

  // عدد الفصول (1 إلى 10)
  const [classCount, setClassCount] = useState<string>('1');

  // مسار المرحلة الثانوية (يظهر عند اختيار المرحلة = ثانوي)
  const [secondaryTrack, setSecondaryTrack] = useState<string>(secondaryTrackOptions[0] || 'مسار عام');

  // مدخل نوع الطلاب (بنين أو بنات لغير التمهيدي)
  const [studentType, setStudentType] = useState<'بنين' | 'بنات'>(section === 'بنات' ? 'بنات' : 'بنين');

  // أعداد الطلاب العادية (لغير التمهيدي) - افتراضياً حقول فارغة بدون أصفار
  const [saudiCount, setSaudiCount] = useState<string>('');
  const [nonSaudiCount, setNonSaudiCount] = useState<string>('');

  // أعداد التمهيدي المنفصلة (بنين وبنات وسعودي وغير سعودي) - افتراضياً حقول فارغة بدون أصفار
  const [kgBoysSaudi, setKgBoysSaudi] = useState<string>('');
  const [kgBoysNonSaudi, setKgBoysNonSaudi] = useState<string>('');
  const [kgGirlsSaudi, setKgGirlsSaudi] = useState<string>('');
  const [kgGirlsNonSaudi, setKgGirlsNonSaudi] = useState<string>('');

  // تحديث المرحلة تلقائياً إذا تغير القسم إلى بنين وكان تمهيدي
  const handleSectionChange = (newSec: string) => {
    setSection(newSec);
    if (newSec === 'بنين') {
      if (stage === 'تمهيدي') {
        setStage('ابتدائي');
        setGrade(DEFAULT_PRIMARY_GRADES[0]);
      }
      setStudentType('بنين');
    } else {
      setStudentType('بنات');
    }
  };

  // تحديث الصف تلقائياً عند تغيير المرحلة
  const handleStageChange = (newStage: string) => {
    setStage(newStage);
    let newDefaultGrade = '';
    switch (newStage) {
      case 'تمهيدي':
        newDefaultGrade = DEFAULT_KG_GRADES[0];
        break;
      case 'ابتدائي':
        newDefaultGrade = DEFAULT_PRIMARY_GRADES[0];
        break;
      case 'متوسط':
        newDefaultGrade = DEFAULT_MIDDLE_GRADES[0];
        break;
      case 'ثانوي':
        newDefaultGrade = DEFAULT_SECONDARY_GRADES[0];
        break;
      default:
        newDefaultGrade = DEFAULT_PRIMARY_GRADES[0];
    }
    setGrade(newDefaultGrade);
  };

  // نافذة إدارة الخيارات للأدمن
  const [optionManager, setOptionManager] = useState<{
    isOpen: boolean;
    fieldKey: ClassStatsOptionFieldKey | '';
    title: string;
    options: string[];
    accentColor: 'blue' | 'indigo' | 'emerald' | 'teal' | 'violet' | 'amber';
  }>({
    isOpen: false,
    fieldKey: '',
    title: '',
    options: [],
    accentColor: 'emerald'
  });

  const openOptionManager = (
    fieldKey: ClassStatsOptionFieldKey,
    title: string,
    options: string[],
    accentColor: 'blue' | 'indigo' | 'emerald' | 'teal' | 'violet' | 'amber' = 'emerald'
  ) => {
    setOptionManager({
      isOpen: true,
      fieldKey,
      title,
      options,
      accentColor
    });
  };

  const applyOptionsUpdate = (key: ClassStatsOptionFieldKey, newOpts: string[]) => {
    let storageKey = '';
    switch (key) {
      case 'track':
        setTrackOptions(newOpts);
        storageKey = 'custom_tracks_v1';
        break;
      case 'section':
        setSectionOptions(newOpts);
        storageKey = 'custom_student_sections_v1';
        break;
      case 'secondaryTrack':
        setSecondaryTrackOptions(newOpts);
        storageKey = 'custom_secondary_tracks_v1';
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
      case 'track': setTrack(newOpt); break;
      case 'section': handleSectionChange(newOpt); break;
      case 'secondaryTrack': setSecondaryTrack(newOpt); break;
    }
  };

  const handleDeleteOption = (optToDelete: string) => {
    if (!optionManager.fieldKey) return;
    const updated = optionManager.options.filter(o => o !== optToDelete);
    applyOptionsUpdate(optionManager.fieldKey, updated);

    const fallback = updated[0] || '';
    switch (optionManager.fieldKey) {
      case 'track': if (track === optToDelete) setTrack(fallback); break;
      case 'section': if (section === optToDelete) handleSectionChange(fallback); break;
      case 'secondaryTrack': if (secondaryTrack === optToDelete) setSecondaryTrack(fallback); break;
    }
  };

  const handleEditOption = (oldOpt: string, newOpt: string) => {
    if (!optionManager.fieldKey) return;
    const updated = optionManager.options.map(o => o === oldOpt ? newOpt : o);
    applyOptionsUpdate(optionManager.fieldKey, updated);

    switch (optionManager.fieldKey) {
      case 'track': if (track === oldOpt) setTrack(newOpt); break;
      case 'section': if (section === oldOpt) handleSectionChange(newOpt); break;
      case 'secondaryTrack': if (secondaryTrack === oldOpt) setSecondaryTrack(newOpt); break;
    }
  };

  // حالات السجلات والبحث والتعديل والحذف
  const [allRecords, setAllRecords] = useState<LoadedClassStats[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<LoadedClassStats | null>(null);
  const [recordToDelete, setRecordToDelete] = useState<LoadedClassStats | null>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const formTopRef = useRef<HTMLDivElement>(null);

  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // دالة لتنقية الأرقام فقط
  const toOnlyDigits = (str: string): string => {
    return str
      .replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d).toString())
      .replace(/\D/g, '');
  };

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
        if (recordToDelete) {
          setRecordToDelete(null);
        } else {
          onBack();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onBack, recordToDelete]);

  // جلب السجلات المخزنة من فايربيس والتخزين المحلي
  const fetchAllRecords = async () => {
    try {
      const rawLocal = safeGetStorage(STORAGE_KEY);
      let localList: LoadedClassStats[] = [];
      if (rawLocal) {
        try {
          localList = JSON.parse(rawLocal);
        } catch {
          localList = [];
        }
      }

      try {
        const fsRecords = await getClassStatsFromFirestore();
        const map = new Map<string, LoadedClassStats>();
        
        localList.forEach(r => {
          const key = r.id || `${r.section}_${r.stage}_${r.grade}_${r.secondaryTrack || ''}`;
          map.set(key, r);
        });

        fsRecords.forEach(r => {
          const key = r.id || `${r.section}_${r.stage}_${r.grade}_${r.secondaryTrack || ''}`;
          map.set(key, { ...r, source: 'firestore' });
        });

        const merged = Array.from(map.values());
        const filtered = (complexName === 'كل المجمعات')
          ? merged
          : merged.filter(r => r.complexName === complexName || (!r.complexName && complexName === 'دار القلم'));
        setAllRecords(filtered);
        safeSetStorage(STORAGE_KEY, JSON.stringify(merged));
      } catch (err) {
        console.warn('Firestore fallback to local storage for class stats:', err);
        const filteredLocal = (complexName === 'كل المجمعات')
          ? localList
          : localList.filter(r => r.complexName === complexName || (!r.complexName && complexName === 'دار القلم'));
        setAllRecords(filteredLocal);
      }
    } catch (e) {
      console.error('Error fetching registered class stats:', e);
    }
  };

  useEffect(() => {
    fetchAllRecords();
  }, []);

  // نتائج البحث مع معالجة كافة الفروق الإملائية
  const searchResults = useMemo(() => {
    const q = searchQuery.trim();
    if (!q) return [];
    return allRecords.filter(r => 
      arabicIncludes(r.grade, q) || 
      arabicIncludes(r.stage, q) || 
      arabicIncludes(r.section, q) || 
      arabicIncludes(r.track, q) ||
      arabicIncludes(r.secondaryTrack, q)
    ).slice(0, 15);
  }, [searchQuery, allRecords]);

  // إحصائيات عامة مباشرة للسجلات المسجلة
  const overallStats = useMemo(() => {
    let totalClasses = 0;
    let totalStudents = 0;
    let totalSaudi = 0;
    let totalNonSaudi = 0;
    let totalBoys = 0;
    let totalGirls = 0;

    allRecords.forEach(r => {
      totalClasses += Number(r.classCount) || 0;
      totalStudents += Number(r.totalStudents) || 0;
      
      if (r.stage === 'تمهيدي') {
        const bs = Number(r.kgBoysSaudi) || 0;
        const bns = Number(r.kgBoysNonSaudi) || 0;
        const gs = Number(r.kgGirlsSaudi) || 0;
        const gns = Number(r.kgGirlsNonSaudi) || 0;
        totalSaudi += (bs + gs);
        totalNonSaudi += (bns + gns);
        totalBoys += (bs + bns);
        totalGirls += (gs + gns);
      } else {
        const s = Number(r.saudiCount) || 0;
        const ns = Number(r.nonSaudiCount) || 0;
        totalSaudi += s;
        totalNonSaudi += ns;
        if (r.studentType === 'بنين' || r.section === 'بنين') {
          totalBoys += (s + ns);
        } else {
          totalGirls += (s + ns);
        }
      }
    });

    return {
      recordsCount: allRecords.length,
      totalClasses,
      totalStudents,
      totalSaudi,
      totalNonSaudi,
      totalBoys,
      totalGirls
    };
  }, [allRecords]);

  // حساب إجمالي الطلاب الحالي في النموذج بشكل حي
  const currentCalculatedTotals = useMemo(() => {
    const parsedClasses = Math.max(1, parseInt(classCount, 10) || 1);
    if (stage === 'تمهيدي') {
      const bs = parseInt(kgBoysSaudi, 10) || 0;
      const bns = parseInt(kgBoysNonSaudi, 10) || 0;
      const gs = parseInt(kgGirlsSaudi, 10) || 0;
      const gns = parseInt(kgGirlsNonSaudi, 10) || 0;
      const boysTotal = bs + bns;
      const girlsTotal = gs + gns;
      const total = boysTotal + girlsTotal;
      const saudi = bs + gs;
      const nonSaudi = bns + gns;
      const avg = total > 0 ? (total / parsedClasses).toFixed(1) : '0';
      return { total, saudi, nonSaudi, boysTotal, girlsTotal, avg, parsedClasses };
    } else {
      const s = parseInt(saudiCount, 10) || 0;
      const ns = parseInt(nonSaudiCount, 10) || 0;
      const total = s + ns;
      const avg = total > 0 ? (total / parsedClasses).toFixed(1) : '0';
      return { total, saudi: s, nonSaudi: ns, boysTotal: studentType === 'بنين' ? total : 0, girlsTotal: studentType === 'بنات' ? total : 0, avg, parsedClasses };
    }
  }, [stage, classCount, saudiCount, nonSaudiCount, kgBoysSaudi, kgBoysNonSaudi, kgGirlsSaudi, kgGirlsNonSaudi, studentType]);

  // تعبئة النموذج ببيانات سجل محدد للتعديل
  const populateRecordData = (record: LoadedClassStats) => {
    setSelectedRecord(record);
    setTrack(record.track || trackOptions[0] || 'أهلي');
    setSection(record.section || 'بنين');
    setStage(record.stage || 'ابتدائي');
    setGrade(record.grade || 'أول ابتدائي');
    setClassCount(String(record.classCount || 1));
    setSecondaryTrack(record.secondaryTrack || secondaryTrackOptions[0] || 'مسار عام');
    setStudentType(record.studentType || (record.section === 'بنات' ? 'بنات' : 'بنين'));

    if (record.stage === 'تمهيدي') {
      setKgBoysSaudi(record.kgBoysSaudi ? String(record.kgBoysSaudi) : '');
      setKgBoysNonSaudi(record.kgBoysNonSaudi ? String(record.kgBoysNonSaudi) : '');
      setKgGirlsSaudi(record.kgGirlsSaudi ? String(record.kgGirlsSaudi) : '');
      setKgGirlsNonSaudi(record.kgGirlsNonSaudi ? String(record.kgGirlsNonSaudi) : '');
      setSaudiCount('');
      setNonSaudiCount('');
    } else {
      setSaudiCount(record.saudiCount ? String(record.saudiCount) : '');
      setNonSaudiCount(record.nonSaudiCount ? String(record.nonSaudiCount) : '');
      setKgBoysSaudi('');
      setKgBoysNonSaudi('');
      setKgGirlsSaudi('');
      setKgGirlsNonSaudi('');
    }

    setIsSearchOpen(false);
    setErrorMessage(null);
    setSuccessMessage(`تم تحميل بيانات الصف (${record.grade} - ${record.stage}) لتعديلها.`);

    // التمرير لأعلى النموذج
    if (formTopRef.current) {
      formTopRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // تفريغ النموذج وجعل حقول الأعداد فارغة تماماً
  const handleResetForm = () => {
    setSelectedRecord(null);
    setSearchQuery('');
    setIsSearchOpen(false);
    setTrack(trackOptions[0] || 'أهلي');
    setSection(sectionOptions[0] || 'بنين');
    const defaultStg = (sectionOptions[0] === 'بنات' ? 'تمهيدي' : 'ابتدائي');
    setStage(defaultStg);
    setGrade(defaultStg === 'تمهيدي' ? DEFAULT_KG_GRADES[0] : DEFAULT_PRIMARY_GRADES[0]);
    setClassCount('1');
    setSecondaryTrack(secondaryTrackOptions[0] || 'مسار عام');
    setStudentType(sectionOptions[0] === 'بنات' ? 'بنات' : 'بنين');
    setSaudiCount('');
    setNonSaudiCount('');
    setKgBoysSaudi('');
    setKgBoysNonSaudi('');
    setKgGirlsSaudi('');
    setKgGirlsNonSaudi('');
    setErrorMessage(null);
  };

  // حفظ سجل جديد
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage(null);
    setErrorMessage(null);

    const parsedClasses = Math.max(1, parseInt(classCount, 10) || 1);
    let total = 0;
    let sCount = 0;
    let nsCount = 0;

    if (stage === 'تمهيدي') {
      const bs = parseInt(kgBoysSaudi, 10) || 0;
      const bns = parseInt(kgBoysNonSaudi, 10) || 0;
      const gs = parseInt(kgGirlsSaudi, 10) || 0;
      const gns = parseInt(kgGirlsNonSaudi, 10) || 0;
      total = bs + bns + gs + gns;
      sCount = bs + gs;
      nsCount = bns + gns;
    } else {
      sCount = parseInt(saudiCount, 10) || 0;
      nsCount = parseInt(nonSaudiCount, 10) || 0;
      total = sCount + nsCount;
    }

    const newRecord: ClassStatsRecord = {
      complexName,
      academicYear,
      track: track.trim(),
      section: section.trim(),
      stage: stage.trim(),
      grade: grade.trim(),
      classCount: parsedClasses,
      secondaryTrack: stage === 'ثانوي' ? secondaryTrack.trim() : undefined,
      studentType: stage !== 'تمهيدي' ? studentType : undefined,
      saudiCount: sCount,
      nonSaudiCount: nsCount,
      totalStudents: total,
      kgBoysSaudi: stage === 'تمهيدي' ? (parseInt(kgBoysSaudi, 10) || 0) : undefined,
      kgBoysNonSaudi: stage === 'تمهيدي' ? (parseInt(kgBoysNonSaudi, 10) || 0) : undefined,
      kgGirlsSaudi: stage === 'تمهيدي' ? (parseInt(kgGirlsSaudi, 10) || 0) : undefined,
      kgGirlsNonSaudi: stage === 'تمهيدي' ? (parseInt(kgGirlsNonSaudi, 10) || 0) : undefined
    };

    setIsSaving(true);
    let savedId = 'stats_' + Date.now();

    try {
      const res = await saveClassStatsToFirestore(newRecord);
      if (res && res.id) {
        savedId = res.id;
      }
    } catch (err) {
      console.warn('Saved locally, Firestore sync queued/error for class stats:', err);
    }

    const fullSaved: LoadedClassStats = {
      ...newRecord,
      id: savedId,
      source: 'firestore'
    };

    const updatedList = [fullSaved, ...allRecords];
    setAllRecords(updatedList);
    safeSetStorage(STORAGE_KEY, JSON.stringify(updatedList));

    // تفريغ حقول الأعداد لتكون جاهزة وفارغة لإدخال الصف التالي
    setSaudiCount('');
    setNonSaudiCount('');
    setKgBoysSaudi('');
    setKgBoysNonSaudi('');
    setKgGirlsSaudi('');
    setKgGirlsNonSaudi('');

    setIsSaving(false);
    setSuccessMessage(`تم حفظ إحصاء (${fullSaved.grade} - ${fullSaved.stage}) بنجاح! الإجمالي: ${fullSaved.totalStudents} طالباً.`);
    setTimeout(() => setSuccessMessage(null), 4000);
  };

  // تعديل وتحديث سجل حالي
  const handleUpdate = async () => {
    if (!selectedRecord) return;
    setSuccessMessage(null);
    setErrorMessage(null);

    const parsedClasses = Math.max(1, parseInt(classCount, 10) || 1);
    let total = 0;
    let sCount = 0;
    let nsCount = 0;

    if (stage === 'تمهيدي') {
      const bs = parseInt(kgBoysSaudi, 10) || 0;
      const bns = parseInt(kgBoysNonSaudi, 10) || 0;
      const gs = parseInt(kgGirlsSaudi, 10) || 0;
      const gns = parseInt(kgGirlsNonSaudi, 10) || 0;
      total = bs + bns + gs + gns;
      sCount = bs + gs;
      nsCount = bns + gns;
    } else {
      sCount = parseInt(saudiCount, 10) || 0;
      nsCount = parseInt(nonSaudiCount, 10) || 0;
      total = sCount + nsCount;
    }

    const updatedData: ClassStatsRecord = {
      complexName,
      academicYear,
      track: track.trim(),
      section: section.trim(),
      stage: stage.trim(),
      grade: grade.trim(),
      classCount: parsedClasses,
      secondaryTrack: stage === 'ثانوي' ? secondaryTrack.trim() : undefined,
      studentType: stage !== 'تمهيدي' ? studentType : undefined,
      saudiCount: sCount,
      nonSaudiCount: nsCount,
      totalStudents: total,
      kgBoysSaudi: stage === 'تمهيدي' ? (parseInt(kgBoysSaudi, 10) || 0) : undefined,
      kgBoysNonSaudi: stage === 'تمهيدي' ? (parseInt(kgBoysNonSaudi, 10) || 0) : undefined,
      kgGirlsSaudi: stage === 'تمهيدي' ? (parseInt(kgGirlsSaudi, 10) || 0) : undefined,
      kgGirlsNonSaudi: stage === 'تمهيدي' ? (parseInt(kgGirlsNonSaudi, 10) || 0) : undefined
    };

    setIsSaving(true);
    try {
      if (selectedRecord.id) {
        try {
          await updateClassStatsInFirestore(selectedRecord.id, updatedData);
        } catch {
          await saveClassStatsToFirestore(updatedData);
        }
      } else {
        await saveClassStatsToFirestore(updatedData);
      }
    } catch (err) {
      console.warn('Class stats update saved locally:', err);
    }

    const updatedLoadedRecord: LoadedClassStats = {
      ...updatedData,
      id: selectedRecord.id || 'stats_' + Date.now(),
      source: 'firestore'
    };

    const updatedList = allRecords.map(r => 
      r.id === selectedRecord.id ? updatedLoadedRecord : r
    );

    setAllRecords(updatedList);
    safeSetStorage(STORAGE_KEY, JSON.stringify(updatedList));

    // تفريغ الحقول بعد التحديث
    handleResetForm();

    setIsSaving(false);
    setSelectedRecord(null);
    setSuccessMessage(`تم تحديث بيانات الصف (${updatedLoadedRecord.grade}) بنجاح!`);
    setTimeout(() => setSuccessMessage(null), 4000);
  };

  // تأكيد الحذف
  const confirmDeleteRecord = async () => {
    if (!recordToDelete) return;
    setIsSaving(true);
    try {
      if (recordToDelete.id) {
        await deleteClassStatsFromFirestore(recordToDelete.id);
      }
    } catch (err) {
      console.warn('Error deleting class stats from firestore, removing locally:', err);
    }

    const updatedList = allRecords.filter(r => r.id !== recordToDelete.id);
    setAllRecords(updatedList);
    safeSetStorage(STORAGE_KEY, JSON.stringify(updatedList));

    if (selectedRecord && selectedRecord.id === recordToDelete.id) {
      handleResetForm();
    }

    setIsSaving(false);
    const deletedName = `${recordToDelete.grade} (${recordToDelete.stage})`;
    setRecordToDelete(null);
    setSuccessMessage(`تم حذف إحصاء ${deletedName} بنجاح.`);
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      
      {/* نافذة تأكيد الحذف */}
      {recordToDelete && (
        <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-5 sm:p-6 max-w-md w-full shadow-2xl border border-slate-200 text-center space-y-4 animate-in fade-in zoom-in-95">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto shadow-inner">
              <Trash2 size={24} />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-slate-900 mb-1">تأكيد حذف السجل</h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                هل أنت متأكد من حذف إحصاء الصف <span className="font-black text-slate-900">«{recordToDelete.grade} - {recordToDelete.stage}»</span> نهائياً؟
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setRecordToDelete(null)}
                className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-bold hover:bg-slate-100 transition-all text-xs sm:text-sm cursor-pointer flex-1"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={confirmDeleteRecord}
                disabled={isSaving}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 active:scale-95 text-white font-bold transition-all text-xs sm:text-sm cursor-pointer flex-1 shadow-md shadow-rose-600/25"
              >
                {isSaving ? 'جاري الحذف...' : 'نعم، حذف السجل'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* النافذة الرئيسية */}
      <div 
        ref={formTopRef}
        className="relative w-full max-w-5xl lg:max-w-6xl h-auto max-h-[96vh] bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col justify-between my-auto animate-in fade-in zoom-in-95 duration-150"
      >
        
        {/* 1. شريط العنوان العلوي */}
        <div className="bg-white border-b border-slate-200 px-4 sm:px-6 py-2.5 shadow-xs flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 sm:p-2 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100">
              <BarChart3 size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-black text-slate-800">
                  بطاقة إحصاء الفصول والطلاب
                </h1>
                {selectedRecord && (
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200 flex items-center gap-1 animate-pulse">
                    <Edit3 size={11} />
                    <span>تعديل: {selectedRecord.grade} ({selectedRecord.stage})</span>
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 text-[11px] text-slate-500 font-bold">
                <span>{complexName}</span>
                <span>•</span>
                <span>العام الدراسي: {academicYear}</span>
                <span>•</span>
                <span className="text-emerald-700 font-extrabold">{overallStats.recordsCount} صفوف مسجلة ({overallStats.totalStudents} طالباً)</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={onBack}
              className="p-1.5 sm:p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
              title="إغلاق (Esc)"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* 2. محتوى النافذة المنبثقة القابل للتمرير */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-5 space-y-4">

          {/* شريط البحث المباشر للوصول السريع والتعديل والحذف */}
          <div className="space-y-2">
            <div ref={searchContainerRef} className="relative">
              <div className="relative flex items-center">
                <input
                  type="text"
                  value={searchQuery}
                  onFocus={() => setIsSearchOpen(true)}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setIsSearchOpen(true);
                  }}
                  placeholder="ابحث عن صف، مرحلة، مسار، قسم لتعديل بياناته أو حذفه..."
                  className="w-full py-2 pr-9 pl-9 bg-slate-50 hover:bg-slate-100/80 focus:bg-white border border-slate-300 focus:border-emerald-500 rounded-xl text-xs sm:text-sm font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all shadow-xs"
                />
                <div className="absolute right-3 text-slate-400 pointer-events-none">
                  <Search size={15} />
                </div>
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      setIsSearchOpen(false);
                    }}
                    className="absolute left-3 p-1 text-slate-400 hover:text-slate-600 rounded-lg transition-colors cursor-pointer"
                    title="مسح البحث"
                  >
                    <X size={15} />
                  </button>
                )}
              </div>

              {/* قائمة نتائج البحث */}
              {isSearchOpen && searchQuery.trim() !== '' && (
                <div className="absolute top-full mt-1.5 right-0 left-0 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-50 max-h-56 overflow-y-auto">
                  <div className="p-2 bg-slate-50 border-b border-slate-100 text-[11px] font-bold text-slate-500 flex justify-between items-center">
                    <span>نتائج البحث ({searchResults.length})</span>
                    <span>اختر تعديل لتعبئة البيانات أو حذف لإزالته</span>
                  </div>
                  
                  {searchResults.length > 0 ? (
                    searchResults.map(record => (
                      <div
                        key={record.id || `${record.grade}_${record.stage}_${record.section}`}
                        className="p-2.5 sm:p-3 hover:bg-emerald-50/70 border-b border-slate-100 last:border-b-0 transition-colors flex items-center justify-between"
                      >
                        <div>
                          <div className="text-sm font-black text-slate-900 flex items-center gap-1.5">
                            <span>{record.grade}</span>
                            <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800">
                              {record.stage} ({record.section})
                            </span>
                            {record.secondaryTrack && (
                              <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-sky-100 text-sky-800">
                                {record.secondaryTrack}
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-slate-500 font-bold mt-0.5 flex gap-2">
                            <span>{record.classCount} فصول</span>
                            <span>•</span>
                            <span>إجمالي الطلاب: {record.totalStudents} (سعودي: {record.saudiCount} | غير سعودي: {record.nonSaudiCount})</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => populateRecordData(record)}
                            className="flex items-center gap-1 px-3 py-1 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer"
                          >
                            <Edit3 size={12} />
                            <span>تعديل</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setRecordToDelete(record)}
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
                      لم يتم العثور على سجل يطابق "{searchQuery}"
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

            {/* بطاقات الإحصاء السريع بالأعلى */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
              <div className="bg-slate-50 border border-slate-200 p-2 rounded-xl">
                <span className="text-[10px] text-slate-500 font-bold block">إجمالي الفصول المسجلة</span>
                <span className="text-base sm:text-lg font-black text-slate-800">{overallStats.totalClasses} فصل</span>
              </div>
              <div className="bg-emerald-50 border border-emerald-200 p-2 rounded-xl">
                <span className="text-[10px] text-emerald-700 font-bold block">إجمالي الطلاب المسجلين</span>
                <span className="text-base sm:text-lg font-black text-emerald-800">{overallStats.totalStudents} طالب</span>
              </div>
              <div className="bg-blue-50 border border-blue-200 p-2 rounded-xl">
                <span className="text-[10px] text-blue-700 font-bold block">سعوديون / غير سعوديين</span>
                <span className="text-xs sm:text-sm font-black text-blue-900">{overallStats.totalSaudi} / {overallStats.totalNonSaudi}</span>
              </div>
              <div className="bg-purple-50 border border-purple-200 p-2 rounded-xl">
                <span className="text-[10px] text-purple-700 font-bold block">بنين / بنات</span>
                <span className="text-xs sm:text-sm font-black text-purple-900">{overallStats.totalBoys} / {overallStats.totalGirls}</span>
              </div>
            </div>

            {/* النموذج الرئيسي */}
            <form onSubmit={handleSave} className="bg-slate-50/80 p-3.5 sm:p-4 rounded-2xl border border-slate-200 space-y-3.5">
              
              <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
                <div className="flex items-center gap-1.5 text-xs sm:text-sm font-black text-slate-800">
                  <Layers size={16} className="text-emerald-600" />
                  <span>بيانات الصف والشعب والطلاب</span>
                </div>
                {selectedRecord && (
                  <button
                    type="button"
                    onClick={handleResetForm}
                    className="text-xs text-amber-700 hover:text-amber-900 font-bold flex items-center gap-1"
                  >
                    <span>إلغاء التعديل</span>
                    <X size={12} />
                  </button>
                )}
              </div>

              {/* شبكة الحقول الأساسية: المسار، القسم، المرحلة، الصف، عدد الفصول */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                
                {/* 1. المسار باختياراته */}
                <ManagedSelectField
                  label="المسار"
                  icon={<Compass size={13} className="text-emerald-600" />}
                  value={track}
                  onChange={setTrack}
                  options={trackOptions}
                  onManageOptions={() => openOptionManager('track', 'المسار', trackOptions, 'emerald')}
                  isAdmin={isAdmin}
                  accentColor="emerald"
                />

                {/* 2. القسم (بنين / بنات) */}
                <ManagedSelectField
                  label="القسم"
                  icon={<Users size={13} className="text-emerald-600" />}
                  value={section}
                  onChange={handleSectionChange}
                  options={sectionOptions}
                  onManageOptions={() => openOptionManager('section', 'القسم', sectionOptions, 'emerald')}
                  isAdmin={isAdmin}
                  accentColor="emerald"
                />

                {/* 3. المرحلة باختياراتها (بنين بدون تمهيدي، بنات مع تمهيدي) */}
                <div>
                  <label className="flex items-center gap-1 text-[11px] sm:text-xs font-bold text-slate-700 mb-0.5">
                    <School size={13} className="text-emerald-600" />
                    <span>المرحلة:</span>
                  </label>
                  <select
                    value={stage}
                    onChange={(e) => handleStageChange(e.target.value)}
                    className="w-full py-1.5 px-3 bg-white border border-slate-300 focus:border-emerald-500 rounded-lg text-xs sm:text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all cursor-pointer"
                  >
                    {currentStageOptions.map(stg => (
                      <option key={stg} value={stg}>{stg}</option>
                    ))}
                  </select>
                </div>

                {/* 4. الصف باختياراته المعتمدة على المرحلة */}
                <div>
                  <label className="flex items-center gap-1 text-[11px] sm:text-xs font-bold text-slate-700 mb-0.5">
                    <BookOpen size={13} className="text-emerald-600" />
                    <span>الصف:</span>
                  </label>
                  <select
                    value={grade}
                    onChange={(e) => setGrade(e.target.value)}
                    className="w-full py-1.5 px-3 bg-white border border-slate-300 focus:border-emerald-500 rounded-lg text-xs sm:text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all cursor-pointer"
                  >
                    {currentGradeOptions.map(grd => (
                      <option key={grd} value={grd}>{grd}</option>
                    ))}
                  </select>
                </div>

                {/* 5. عدد الصف (الفصول من 1 إلى 10) */}
                <div>
                  <label className="flex items-center gap-1 text-[11px] sm:text-xs font-bold text-slate-700 mb-0.5">
                    <Layers size={13} className="text-emerald-600" />
                    <span>عدد الفصول (الشعب):</span>
                  </label>
                  <select
                    value={classCount}
                    onChange={(e) => setClassCount(e.target.value)}
                    className="w-full py-1.5 px-3 bg-white border border-slate-300 focus:border-emerald-500 rounded-lg text-xs sm:text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all cursor-pointer font-mono"
                  >
                    {DEFAULT_CLASS_COUNTS.map(num => (
                      <option key={num} value={num}>{num} {num === '1' ? 'فصل' : 'فصول'}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* 6. مسار المرحلة الثانوية التخصصي (يظهر فقط عند اختيار الثانوي) */}
              {stage === 'ثانوي' && (
                <div className="bg-sky-50/70 border border-sky-200 p-3 rounded-xl animate-in fade-in">
                  <div className="flex items-center justify-between mb-2">
                    <label className="flex items-center gap-1.5 text-xs font-black text-sky-900">
                      <GraduationCap size={15} className="text-sky-600" />
                      <span>مسار المرحلة الثانوية التخصصي:</span>
                    </label>
                    <span className="text-[11px] text-sky-700 font-bold bg-sky-100/80 px-2 py-0.5 rounded-full border border-sky-200">
                      خاص بالصفوف الثانوية
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {secondaryTrackOptions.map(tName => (
                      <button
                        type="button"
                        key={tName}
                        onClick={() => setSecondaryTrack(tName)}
                        className={`py-2 px-3 rounded-lg text-xs font-bold transition-all border flex items-center justify-center gap-1.5 cursor-pointer ${
                          secondaryTrack === tName
                            ? 'bg-sky-600 text-white border-sky-700 shadow-sm shadow-sky-600/30'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-sky-50'
                        }`}
                      >
                        <Check size={13} className={secondaryTrack === tName ? 'opacity-100' : 'opacity-0'} />
                        <span>{tName}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* 7. مدخل الطلاب وتوزيع الأعداد */}
              <div className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-3">
                
                {/* حالة التمهيدي: يظهر في العدد بنين وبنات وسعودي وغير سعودي */}
                {stage === 'تمهيدي' ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <div className="flex items-center gap-1.5 text-xs font-black text-slate-800">
                        <Users size={15} className="text-emerald-600" />
                        <span>أعداد طلاب التمهيدي (بنين وبنات):</span>
                      </div>
                      <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        مرحلة تمهيدي مشتركة
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                      
                      {/* بطاقة البنين */}
                      <div className="bg-blue-50/60 border border-blue-200/80 p-3 rounded-xl space-y-2">
                        <div className="flex items-center justify-between text-xs font-black text-blue-900 border-b border-blue-200/60 pb-1.5">
                          <span className="flex items-center gap-1">
                            <UserCheck size={14} className="text-blue-600" />
                            <span>الطلاب (البنين)</span>
                          </span>
                          <span className="text-[11px] text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full">
                            مجموع البنين: {currentCalculatedTotals.boysTotal}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2.5">
                          <div>
                            <label className="text-[11px] font-bold text-slate-700 block mb-1">
                              سعودي:
                            </label>
                            <input
                              type="text"
                              inputMode="numeric"
                              value={kgBoysSaudi}
                              onKeyDown={handleNumericKeyDown}
                              onChange={(e) => setKgBoysSaudi(toOnlyDigits(e.target.value))}
                              placeholder="اكتب العدد..."
                              className="w-full py-1.5 px-3 bg-white border border-slate-300 rounded-lg text-xs sm:text-sm font-bold text-slate-900 text-center font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>

                          <div>
                            <label className="text-[11px] font-bold text-slate-700 block mb-1">
                              غير سعودي:
                            </label>
                            <input
                              type="text"
                              inputMode="numeric"
                              value={kgBoysNonSaudi}
                              onKeyDown={handleNumericKeyDown}
                              onChange={(e) => setKgBoysNonSaudi(toOnlyDigits(e.target.value))}
                              placeholder="اكتب العدد..."
                              className="w-full py-1.5 px-3 bg-white border border-slate-300 rounded-lg text-xs sm:text-sm font-bold text-slate-900 text-center font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                        </div>
                      </div>

                      {/* بطاقة البنات */}
                      <div className="bg-pink-50/60 border border-pink-200/80 p-3 rounded-xl space-y-2">
                        <div className="flex items-center justify-between text-xs font-black text-pink-900 border-b border-pink-200/60 pb-1.5">
                          <span className="flex items-center gap-1">
                            <UserCheck size={14} className="text-pink-600" />
                            <span>الطالبات (البنات)</span>
                          </span>
                          <span className="text-[11px] text-pink-700 bg-pink-100 px-2 py-0.5 rounded-full">
                            مجموع البنات: {currentCalculatedTotals.girlsTotal}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2.5">
                          <div>
                            <label className="text-[11px] font-bold text-slate-700 block mb-1">
                              سعودي:
                            </label>
                            <input
                              type="text"
                              inputMode="numeric"
                              value={kgGirlsSaudi}
                              onKeyDown={handleNumericKeyDown}
                              onChange={(e) => setKgGirlsSaudi(toOnlyDigits(e.target.value))}
                              placeholder="اكتب العدد..."
                              className="w-full py-1.5 px-3 bg-white border border-slate-300 rounded-lg text-xs sm:text-sm font-bold text-slate-900 text-center font-mono focus:outline-none focus:ring-2 focus:ring-pink-500"
                            />
                          </div>

                          <div>
                            <label className="text-[11px] font-bold text-slate-700 block mb-1">
                              غير سعودي:
                            </label>
                            <input
                              type="text"
                              inputMode="numeric"
                              value={kgGirlsNonSaudi}
                              onKeyDown={handleNumericKeyDown}
                              onChange={(e) => setKgGirlsNonSaudi(toOnlyDigits(e.target.value))}
                              placeholder="اكتب العدد..."
                              className="w-full py-1.5 px-3 bg-white border border-slate-300 rounded-lg text-xs sm:text-sm font-bold text-slate-900 text-center font-mono focus:outline-none focus:ring-2 focus:ring-pink-500"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* حالة المراحل الأخرى (ابتدائي، متوسط، ثانوي) */
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-700">مدخل الطلاب:</span>
                        <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-100">
                          <button
                            type="button"
                            onClick={() => setStudentType('بنين')}
                            className={`px-3 py-1 text-xs font-bold rounded-md transition-all cursor-pointer ${
                              studentType === 'بنين'
                                ? 'bg-blue-600 text-white shadow-xs'
                                : 'text-slate-600 hover:text-slate-900'
                            }`}
                          >
                            بنين
                          </button>
                          <button
                            type="button"
                            onClick={() => setStudentType('بنات')}
                            className={`px-3 py-1 text-xs font-bold rounded-md transition-all cursor-pointer ${
                              studentType === 'بنات'
                                ? 'bg-pink-600 text-white shadow-xs'
                                : 'text-slate-600 hover:text-slate-900'
                            }`}
                          >
                            بنات
                          </button>
                        </div>
                      </div>

                      <div className="text-xs font-bold text-slate-500">
                        <span>القسم الحالي: </span>
                        <span className="text-slate-800 font-black">{section}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      {/* عدد الطلاب سعودي */}
                      <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                        <label className="flex items-center justify-between text-[11px] sm:text-xs font-bold text-slate-700 mb-1">
                          <span className="flex items-center gap-1">
                            <UserCheck size={13} className="text-emerald-600" />
                            <span>عدد الطلاب (سعودي):</span>
                          </span>
                        </label>
                        <input
                          type="text"
                          inputMode="numeric"
                          value={saudiCount}
                          onKeyDown={handleNumericKeyDown}
                          onChange={(e) => setSaudiCount(toOnlyDigits(e.target.value))}
                          placeholder="اكتب عدد الطلاب السعوديين..."
                          className="w-full py-1.5 px-3 bg-white border border-slate-300 rounded-lg text-xs sm:text-sm font-bold text-slate-900 text-center font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                      </div>

                      {/* عدد الطلاب غير سعودي */}
                      <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                        <label className="flex items-center justify-between text-[11px] sm:text-xs font-bold text-slate-700 mb-1">
                          <span className="flex items-center gap-1">
                            <UserX size={13} className="text-amber-600" />
                            <span>عدد الطلاب (غير سعودي):</span>
                          </span>
                        </label>
                        <input
                          type="text"
                          inputMode="numeric"
                          value={nonSaudiCount}
                          onKeyDown={handleNumericKeyDown}
                          onChange={(e) => setNonSaudiCount(toOnlyDigits(e.target.value))}
                          placeholder="اكتب عدد الطلاب غير السعوديين..."
                          className="w-full py-1.5 px-3 bg-white border border-slate-300 rounded-lg text-xs sm:text-sm font-bold text-slate-900 text-center font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* شريط الإجمالي الحي قبل الحفظ */}
                <div className="bg-emerald-50/70 border border-emerald-200 p-2.5 rounded-xl flex flex-wrap items-center justify-between gap-2 text-xs font-bold text-emerald-900">
                  <div className="flex items-center gap-2">
                    <Calculator size={15} className="text-emerald-600" />
                    <span>المعاينة المباشرة للصف:</span>
                    <span className="font-black text-slate-900 bg-white px-2 py-0.5 rounded-md border border-emerald-200">
                      {grade} ({stage})
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span>عدد الفصول: <strong className="font-mono text-emerald-950">{classCount}</strong></span>
                    <span>•</span>
                    <span>سعودي: <strong className="font-mono text-emerald-950">{currentCalculatedTotals.saudi}</strong></span>
                    <span>•</span>
                    <span>غير سعودي: <strong className="font-mono text-emerald-950">{currentCalculatedTotals.nonSaudi}</strong></span>
                    <span>•</span>
                    <span className="bg-emerald-600 text-white px-2.5 py-0.5 rounded-md shadow-xs">
                      إجمالي الطلاب: {currentCalculatedTotals.total} (معدل: {currentCalculatedTotals.avg} طالب/فصل)
                    </span>
                  </div>
                </div>
              </div>

              {/* أزرار الحفظ والتحديث */}
              <div className="flex flex-wrap items-center justify-end gap-2.5 pt-1">
                {selectedRecord ? (
                  <>
                    <button
                      type="button"
                      onClick={handleResetForm}
                      className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer"
                    >
                      إلغاء التعديل
                    </button>
                    <button
                      type="button"
                      onClick={handleUpdate}
                      disabled={isSaving}
                      className="flex items-center gap-1.5 px-6 py-2 bg-amber-600 hover:bg-amber-700 active:scale-95 text-white rounded-xl text-xs sm:text-sm font-bold transition-all shadow-md shadow-amber-600/20 cursor-pointer"
                    >
                      <Save size={15} />
                      <span>{isSaving ? 'جاري التحديث...' : 'تحديث بيانات الصف'}</span>
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={handleResetForm}
                      className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer"
                    >
                      تفريغ الحقول
                    </button>
                    <button
                      type="submit"
                      disabled={isSaving}
                      className="flex items-center gap-1.5 px-6 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-xl text-xs sm:text-sm font-bold transition-all shadow-md shadow-emerald-600/20 cursor-pointer"
                    >
                      <Save size={15} />
                      <span>{isSaving ? 'جاري الحفظ...' : 'حفظ بيانات الصف والفصول'}</span>
                    </button>
                  </>
                )}
              </div>
            </form>

            {/* جدول وسجل البيانات المسجلة بالكامل مع صلاحية التحديث والحذف الفوري */}
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
              <div className="p-3 bg-slate-100/80 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <School size={16} className="text-emerald-700" />
                  <h3 className="text-xs sm:text-sm font-black text-slate-800">
                    سجل الفصول والصفوف المسجلة ({allRecords.length})
                  </h3>
                  <span className="text-[11px] font-bold text-slate-500 bg-white px-2 py-0.5 rounded-md border border-slate-200">
                    اضغط «تعديل» لأي صف لتحديث بياناته فوراً
                  </span>
                </div>
              </div>

              {allRecords.length === 0 ? (
                <div className="p-8 text-center text-slate-400 space-y-2">
                  <BarChart3 size={36} className="mx-auto opacity-30 text-emerald-600" />
                  <p className="text-xs sm:text-sm font-bold">لا توجد بيانات صفوف مسجلة حتى الآن.</p>
                  <p className="text-xs text-slate-400">استخدم النموذج أعلاه لإدخال إحصاء الصفوف وحفظها.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-right border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                        <th className="p-2.5">المسار</th>
                        <th className="p-2.5">القسم</th>
                        <th className="p-2.5">المرحلة</th>
                        <th className="p-2.5">الصف</th>
                        <th className="p-2.5">مسار الثانوي</th>
                        <th className="p-2.5 text-center">الفصول</th>
                        <th className="p-2.5 text-center">الطلاب (بنين/بنات)</th>
                        <th className="p-2.5 text-center">سعودي</th>
                        <th className="p-2.5 text-center">غير سعودي</th>
                        <th className="p-2.5 text-center bg-emerald-50/50">الإجمالي</th>
                        <th className="p-2.5 text-center">الإجراءات</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {allRecords.map((rec, index) => {
                        const isCurrentEditing = selectedRecord?.id === rec.id;
                        return (
                          <tr 
                            key={rec.id || index}
                            className={`hover:bg-slate-50/80 transition-colors font-bold ${
                              isCurrentEditing ? 'bg-amber-50/70 border-l-4 border-amber-500' : ''
                            }`}
                          >
                            <td className="p-2.5 text-slate-700">{rec.track}</td>
                            <td className="p-2.5">
                              <span className={`px-2 py-0.5 rounded-md text-[11px] ${
                                rec.section === 'بنين' ? 'bg-blue-100 text-blue-800' : 'bg-pink-100 text-pink-800'
                              }`}>
                                {rec.section}
                              </span>
                            </td>
                            <td className="p-2.5 text-slate-800">{rec.stage}</td>
                            <td className="p-2.5 font-black text-slate-900">{rec.grade}</td>
                            <td className="p-2.5 text-slate-600">
                              {rec.secondaryTrack ? (
                                <span className="text-[11px] bg-sky-50 text-sky-800 px-2 py-0.5 rounded border border-sky-200">
                                  {rec.secondaryTrack}
                                </span>
                              ) : (
                                <span className="text-slate-300">—</span>
                              )}
                            </td>
                            <td className="p-2.5 text-center font-mono text-slate-800">{rec.classCount}</td>
                            <td className="p-2.5 text-center text-slate-600">
                              {rec.stage === 'تمهيدي' ? (
                                <span className="text-[11px]">بنين: {(rec.kgBoysSaudi || 0) + (rec.kgBoysNonSaudi || 0)} | بنات: {(rec.kgGirlsSaudi || 0) + (rec.kgGirlsNonSaudi || 0)}</span>
                              ) : (
                                <span>{rec.studentType || rec.section}</span>
                              )}
                            </td>
                            <td className="p-2.5 text-center font-mono text-emerald-700">{rec.saudiCount}</td>
                            <td className="p-2.5 text-center font-mono text-amber-700">{rec.nonSaudiCount}</td>
                            <td className="p-2.5 text-center font-mono font-black text-emerald-900 bg-emerald-50/50">
                              {rec.totalStudents}
                            </td>
                            <td className="p-2.5 text-center">
                              <div className="flex items-center justify-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => populateRecordData(rec)}
                                  className="p-1.5 text-emerald-700 hover:text-white hover:bg-emerald-600 rounded-lg transition-all cursor-pointer"
                                  title="تعديل هذا الصف"
                                >
                                  <Edit3 size={13} />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setRecordToDelete(rec)}
                                  className="p-1.5 text-rose-600 hover:text-white hover:bg-rose-600 rounded-lg transition-all cursor-pointer"
                                  title="حذف هذا الصف"
                                >
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

          </div>
        </div>

        {/* 3. شريط الأزرار السفلي المثبت */}
        <div className="bg-slate-50 border-t border-slate-200 px-4 sm:px-6 py-2.5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
            <span>المجمع: <strong className="text-slate-800">{complexName}</strong></span>
            <span>•</span>
            <span>العام الدراسي: <strong className="text-slate-800">{academicYear}</strong></span>
          </div>

          <button
            type="button"
            onClick={onBack}
            className="px-5 py-1.5 bg-slate-700 hover:bg-slate-800 active:scale-95 text-white rounded-xl text-xs sm:text-sm font-bold transition-all shadow-xs cursor-pointer"
          >
            إغلاق
          </button>
        </div>

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
