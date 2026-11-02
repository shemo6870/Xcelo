import React, { useState, useEffect } from 'react';
import { 
  Printer, Check, X, ChevronDown, 
  Save, Plus, Trash2, RotateCcw, 
  Clock, FileSpreadsheet, Filter, Edit3, BookOpen
} from 'lucide-react';
import { ManagedSelectField } from './ManagedSelectField';
import { OptionManagerModal } from './OptionManagerModal';
import { 
  loadCustomOptions, 
  saveCustomOptions, 
  fetchCustomOptionsFromFirestore 
} from '../lib/customOptions';
import { 
  TimetableDailyPeriodsRecord, 
  saveDailyPeriodsToFirestore,
  saveSubjectQuotaToFirestore,
  getSubjectQuotaFromFirestore
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

// خيارات نظام التعليم (نفس اختيارات المسارات: أهلي، دولي، دبلومة أمريكية...)
export const STUDY_SYSTEM_OPTIONS = [
  'أهلي',
  'دولي',
  'دبلومة أمريكية',
  'نون',
  'مصري',
  'فرنسي',
  'عالمي',
  'تربية خاصة',
  'تحفيظ قرآن'
];

// خيارات المرحلة (ابتدائي، متوسط، ثانوي)
export const STAGE_OPTIONS = [
  'ابتدائي',
  'متوسط',
  'ثانوي'
];

// صفوف كل مرحلة دراسية
export const STAGE_GRADES_MAP: Record<string, string[]> = {
  'ابتدائي': [
    'الأول الابتدائي',
    'الثاني الابتدائي',
    'الثالث الابتدائي',
    'الرابع الابتدائي',
    'الخامس الابتدائي',
    'السادس الابتدائي'
  ],
  'متوسط': [
    'الأول المتوسط',
    'الثاني المتوسط',
    'الثالث المتوسط'
  ],
  'ثانوي': [
    'الأول الثانوي',
    'الثاني الثانوي',
    'الثالث الثانوي'
  ]
};

// مسارات المرحلة الثانوية التخصصية (تظهر عند اختيار ثاني ثانوي أو ثالث ثانوي)
export const SECONDARY_TRACK_OPTIONS = [
  'مسار عام',
  'مسار علوم الحاسب والهندسة',
  'مسار الصحة والحياة',
  'مسار إدارة الأعمال',
  'مسار شرعي'
];

// خيارات الفصل الدراسي (الفصل الدراسي الأول أو الثاني)
export const SEMESTER_OPTIONS = [
  'الفصل الدراسي الأول',
  'الفصل الدراسي الثاني'
];

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

// المواد تبدأ فارغة لتتم إضافتها وتخصيصها يدوياً لكل صف وفق رغبة المستخدم
export const getDefaultSubjectsForSelection = (
  _system: string,
  _stage: string,
  _grade: string,
  _track: string,
  _semester: string
): SubjectQuotaItem[] => {
  return [];
};

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
  // حالات شاشة نصاب الحصص للمواد (وفق طلب المستخدم مع دعم كامل لصلاحيات الأدمن)
  // ==========================================
  // 1. خيارات نظام التعليم
  const [studySystemOptions, setStudySystemOptions] = useState<string[]>(() => 
    loadCustomOptions('custom_study_systems_v1', STUDY_SYSTEM_OPTIONS)
  );
  const [studySystem, setStudySystem] = useState<string>(() => 
    studySystemOptions[0] || 'أهلي'
  );

  // 2. خيارات المراحل
  const [stageOptions, setStageOptions] = useState<string[]>(() => 
    loadCustomOptions('custom_assignment_stages_v1', STAGE_OPTIONS)
  );
  const [selectedStage, setSelectedStage] = useState<string>(() => 
    stageOptions[0] || 'ابتدائي'
  );

  // 3. خريطة الصفوف لكل مرحلة (قابلة للإضافة والتعديل والحذف للأدمن)
  const [stageGradesMap, setStageGradesMap] = useState<Record<string, string[]>>(() => {
    try {
      const raw = localStorage.getItem('custom_stage_grades_map_v1');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') return { ...STAGE_GRADES_MAP, ...parsed };
      }
    } catch {}
    return STAGE_GRADES_MAP;
  });

  // الصفوف المتاحة للمرحلة الحالية
  const currentAvailableGrades = stageGradesMap[selectedStage] || STAGE_GRADES_MAP[selectedStage] || [];

  const [selectedGrade, setSelectedGrade] = useState<string>(() => {
    const list = stageGradesMap[selectedStage] || STAGE_GRADES_MAP[selectedStage] || [];
    return list[0] || 'الأول الابتدائي';
  });

  // 4. خيارات المسار الثانوي
  const [secondaryTrackOptions, setSecondaryTrackOptions] = useState<string[]>(() => 
    loadCustomOptions('custom_secondary_tracks_v1', SECONDARY_TRACK_OPTIONS)
  );
  const [secondaryTrack, setSecondaryTrack] = useState<string>(() => 
    secondaryTrackOptions[0] || 'مسار عام'
  );

  // 5. خيارات الفصل الدراسي
  const [semesterOptions, setSemesterOptions] = useState<string[]>(() => 
    loadCustomOptions('custom_semesters_v1', SEMESTER_OPTIONS)
  );
  const [selectedSemester, setSelectedSemester] = useState<string>(() => 
    semesterOptions[0] || 'الفصل الدراسي الأول'
  );

  // مزامنة الخيارات مع فايربيس في الخلفية لضمان تطابق الأجهزة
  useEffect(() => {
    fetchCustomOptionsFromFirestore('custom_study_systems_v1', STUDY_SYSTEM_OPTIONS).then(setStudySystemOptions);
    fetchCustomOptionsFromFirestore('custom_assignment_stages_v1', STAGE_OPTIONS).then(setStageOptions);
    fetchCustomOptionsFromFirestore('custom_secondary_tracks_v1', SECONDARY_TRACK_OPTIONS).then(setSecondaryTrackOptions);
    fetchCustomOptionsFromFirestore('custom_semesters_v1', SEMESTER_OPTIONS).then(setSemesterOptions);
    
    try {
      const raw = localStorage.getItem('custom_stage_grades_map_v1');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') {
          setStageGradesMap(prev => ({ ...prev, ...parsed }));
        }
      }
    } catch {}
  }, []);

  // هل يظهر حقل المسار التخصصي؟
  const isSecondaryTrackVisible = 
    selectedStage === 'ثانوي' && 
    (selectedGrade.includes('الثاني') || selectedGrade.includes('الثالث') || selectedGrade.includes('ثاني ثانوي') || selectedGrade.includes('ثالث ثانوي'));

  // قائمة المواد المعروضة للاختيار الحالي تبدأ فارغة لتضاف وتعدل يدوياً
  const [subjectsList, setSubjectsList] = useState<SubjectQuotaItem[]>([]);
  
  // حالة تعديل مادة
  const [editingSubject, setEditingSubject] = useState<SubjectQuotaItem | null>(null);
  const [showAddSubjectModal, setShowAddSubjectModal] = useState(false);
  const [newSubjectName, setNewSubjectName] = useState('');
  const [newSubjectPeriods, setNewSubjectPeriods] = useState<number>(3);

  // حالة نافذة إدارة الخيارات للأدمن
  type AssignmentOptionField = 'studySystem' | 'stage' | 'grade' | 'secondaryTrack' | 'semester';

  const [optionManager, setOptionManager] = useState<{
    isOpen: boolean;
    fieldKey: AssignmentOptionField | '';
    title: string;
    options: string[];
    accentColor: 'blue' | 'indigo' | 'emerald' | 'teal' | 'violet' | 'amber';
  }>({
    isOpen: false,
    fieldKey: '',
    title: '',
    options: [],
    accentColor: 'blue'
  });

  const openOptionManager = (
    fieldKey: AssignmentOptionField,
    title: string,
    options: string[],
    accentColor: 'blue' | 'indigo' | 'emerald' | 'teal' | 'violet' | 'amber' = 'blue'
  ) => {
    setOptionManager({
      isOpen: true,
      fieldKey,
      title,
      options,
      accentColor
    });
  };

  const handleAddOption = (newOpt: string) => {
    const key = optionManager.fieldKey;
    if (!key) return;

    if (key === 'studySystem') {
      const updated = [...studySystemOptions, newOpt];
      setStudySystemOptions(updated);
      saveCustomOptions('custom_study_systems_v1', updated);
      setStudySystem(newOpt);
      loadSubjectsForCurrentSelection(newOpt, selectedStage, selectedGrade, secondaryTrack, selectedSemester, true);
    } else if (key === 'stage') {
      const updated = [...stageOptions, newOpt];
      setStageOptions(updated);
      saveCustomOptions('custom_assignment_stages_v1', updated);
      if (!stageGradesMap[newOpt]) {
        const updatedMap = { ...stageGradesMap, [newOpt]: [`الأول ${newOpt}`] };
        setStageGradesMap(updatedMap);
        try {
          localStorage.setItem('custom_stage_grades_map_v1', JSON.stringify(updatedMap));
        } catch {}
      }
      setSelectedStage(newOpt);
      const firstGrd = (stageGradesMap[newOpt] || [`الأول ${newOpt}`])[0];
      setSelectedGrade(firstGrd);
      loadSubjectsForCurrentSelection(studySystem, newOpt, firstGrd, secondaryTrack, selectedSemester, true);
    } else if (key === 'grade') {
      const currentGrades = stageGradesMap[selectedStage] || STAGE_GRADES_MAP[selectedStage] || [];
      const updatedGrades = [...currentGrades, newOpt];
      const updatedMap = { ...stageGradesMap, [selectedStage]: updatedGrades };
      setStageGradesMap(updatedMap);
      try {
        localStorage.setItem('custom_stage_grades_map_v1', JSON.stringify(updatedMap));
      } catch {}
      setSelectedGrade(newOpt);
      loadSubjectsForCurrentSelection(studySystem, selectedStage, newOpt, secondaryTrack, selectedSemester, true);
    } else if (key === 'secondaryTrack') {
      const updated = [...secondaryTrackOptions, newOpt];
      setSecondaryTrackOptions(updated);
      saveCustomOptions('custom_secondary_tracks_v1', updated);
      setSecondaryTrack(newOpt);
      loadSubjectsForCurrentSelection(studySystem, selectedStage, selectedGrade, newOpt, selectedSemester, true);
    } else if (key === 'semester') {
      const updated = [...semesterOptions, newOpt];
      setSemesterOptions(updated);
      saveCustomOptions('custom_semesters_v1', updated);
      setSelectedSemester(newOpt);
      loadSubjectsForCurrentSelection(studySystem, selectedStage, selectedGrade, secondaryTrack, newOpt, true);
    }

    setOptionManager(prev => ({
      ...prev,
      options: [...prev.options, newOpt]
    }));
  };

  const handleDeleteOption = (optToDelete: string) => {
    const key = optionManager.fieldKey;
    if (!key) return;

    if (key === 'studySystem') {
      const updated = studySystemOptions.filter(o => o !== optToDelete);
      setStudySystemOptions(updated);
      saveCustomOptions('custom_study_systems_v1', updated);
      if (studySystem === optToDelete && updated.length > 0) {
        setStudySystem(updated[0]);
        loadSubjectsForCurrentSelection(updated[0], selectedStage, selectedGrade, secondaryTrack, selectedSemester, true);
      }
    } else if (key === 'stage') {
      const updated = stageOptions.filter(o => o !== optToDelete);
      setStageOptions(updated);
      saveCustomOptions('custom_assignment_stages_v1', updated);
      if (selectedStage === optToDelete && updated.length > 0) {
        handleStageChange(updated[0]);
      }
    } else if (key === 'grade') {
      const currentGrades = stageGradesMap[selectedStage] || STAGE_GRADES_MAP[selectedStage] || [];
      const updatedGrades = currentGrades.filter(o => o !== optToDelete);
      const updatedMap = { ...stageGradesMap, [selectedStage]: updatedGrades };
      setStageGradesMap(updatedMap);
      try {
        localStorage.setItem('custom_stage_grades_map_v1', JSON.stringify(updatedMap));
      } catch {}
      if (selectedGrade === optToDelete && updatedGrades.length > 0) {
        setSelectedGrade(updatedGrades[0]);
        loadSubjectsForCurrentSelection(studySystem, selectedStage, updatedGrades[0], secondaryTrack, selectedSemester, true);
      }
    } else if (key === 'secondaryTrack') {
      const updated = secondaryTrackOptions.filter(o => o !== optToDelete);
      setSecondaryTrackOptions(updated);
      saveCustomOptions('custom_secondary_tracks_v1', updated);
      if (secondaryTrack === optToDelete && updated.length > 0) {
        setSecondaryTrack(updated[0]);
        loadSubjectsForCurrentSelection(studySystem, selectedStage, selectedGrade, updated[0], selectedSemester, true);
      }
    } else if (key === 'semester') {
      const updated = semesterOptions.filter(o => o !== optToDelete);
      setSemesterOptions(updated);
      saveCustomOptions('custom_semesters_v1', updated);
      if (selectedSemester === optToDelete && updated.length > 0) {
        setSelectedSemester(updated[0]);
        loadSubjectsForCurrentSelection(studySystem, selectedStage, selectedGrade, secondaryTrack, updated[0], true);
      }
    }

    setOptionManager(prev => ({
      ...prev,
      options: prev.options.filter(o => o !== optToDelete)
    }));
  };

  const handleEditOption = (oldOpt: string, newOpt: string) => {
    const key = optionManager.fieldKey;
    if (!key) return;

    if (key === 'studySystem') {
      const updated = studySystemOptions.map(o => o === oldOpt ? newOpt : o);
      setStudySystemOptions(updated);
      saveCustomOptions('custom_study_systems_v1', updated);
      if (studySystem === oldOpt) {
        setStudySystem(newOpt);
        loadSubjectsForCurrentSelection(newOpt, selectedStage, selectedGrade, secondaryTrack, selectedSemester, true);
      }
    } else if (key === 'stage') {
      const updated = stageOptions.map(o => o === oldOpt ? newOpt : o);
      setStageOptions(updated);
      saveCustomOptions('custom_assignment_stages_v1', updated);
      const gradesForOld = stageGradesMap[oldOpt] || STAGE_GRADES_MAP[oldOpt] || [];
      const updatedMap = { ...stageGradesMap, [newOpt]: gradesForOld };
      delete updatedMap[oldOpt];
      setStageGradesMap(updatedMap);
      try {
        localStorage.setItem('custom_stage_grades_map_v1', JSON.stringify(updatedMap));
      } catch {}
      if (selectedStage === oldOpt) {
        setSelectedStage(newOpt);
      }
    } else if (key === 'grade') {
      const currentGrades = stageGradesMap[selectedStage] || STAGE_GRADES_MAP[selectedStage] || [];
      const updatedGrades = currentGrades.map(o => o === oldOpt ? newOpt : o);
      const updatedMap = { ...stageGradesMap, [selectedStage]: updatedGrades };
      setStageGradesMap(updatedMap);
      try {
        localStorage.setItem('custom_stage_grades_map_v1', JSON.stringify(updatedMap));
      } catch {}
      if (selectedGrade === oldOpt) {
        setSelectedGrade(newOpt);
        loadSubjectsForCurrentSelection(studySystem, selectedStage, newOpt, secondaryTrack, selectedSemester, true);
      }
    } else if (key === 'secondaryTrack') {
      const updated = secondaryTrackOptions.map(o => o === oldOpt ? newOpt : o);
      setSecondaryTrackOptions(updated);
      saveCustomOptions('custom_secondary_tracks_v1', updated);
      if (secondaryTrack === oldOpt) {
        setSecondaryTrack(newOpt);
        loadSubjectsForCurrentSelection(studySystem, selectedStage, selectedGrade, newOpt, selectedSemester, true);
      }
    } else if (key === 'semester') {
      const updated = semesterOptions.map(o => o === oldOpt ? newOpt : o);
      setSemesterOptions(updated);
      saveCustomOptions('custom_semesters_v1', updated);
      if (selectedSemester === oldOpt) {
        setSelectedSemester(newOpt);
        loadSubjectsForCurrentSelection(studySystem, selectedStage, selectedGrade, secondaryTrack, newOpt, true);
      }
    }

    setOptionManager(prev => ({
      ...prev,
      options: prev.options.map(o => o === oldOpt ? newOpt : o)
    }));
  };

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
  
  // مفتاح التخزين الخاص بنصاب المواد المرتبط بالاختيارات النشطة فقط
  const getSubjectsStorageKey = (
    sys: string,
    stg: string,
    grd: string,
    trk: string,
    sem: string
  ) => {
    const trackSegment = (stg === 'ثانوي' && (grd.includes('الثاني') || grd.includes('الثالث'))) ? trk : 'none';
    return `assignments_quota_${complexName}_${academicYear}_${sys}_${stg}_${grd}_${trackSegment}_${sem}`
      .replace(/\s+/g, '_');
  };

  const currentQuotaStorageKey = getSubjectsStorageKey(
    studySystem,
    selectedStage,
    selectedGrade,
    secondaryTrack,
    selectedSemester
  );

  // تحميل واسترجاع المواد المرتبطة بالاختيارات الحالية
  const loadSubjectsForCurrentSelection = async (
    sys = studySystem,
    stg = selectedStage,
    grd = selectedGrade,
    trk = secondaryTrack,
    sem = selectedSemester,
    silent = false
  ) => {
    const key = getSubjectsStorageKey(sys, stg, grd, trk, sem);
    try {
      const saved = localStorage.getItem(key);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setSubjectsList(parsed);
          if (!silent && parsed.length > 0) {
            setSuccessToast(`تم تحميل نصاب مواد (${grd} - ${stg})`);
            setTimeout(() => setSuccessToast(null), 3000);
          }
          return;
        }
      }

      // البحث في قاعدة بيانات فايربيس للمزامنة
      const remote = await getSubjectQuotaFromFirestore(key);
      if (remote && Array.isArray(remote)) {
        setSubjectsList(remote);
        try { localStorage.setItem(key, JSON.stringify(remote)); } catch {}
        if (!silent && remote.length > 0) {
          setSuccessToast(`تم استرجاع نصاب مواد (${grd} - ${stg})`);
          setTimeout(() => setSuccessToast(null), 3000);
        }
        return;
      }
    } catch (e) {
      console.warn('Error loading subjects:', e);
    }

    // إذا لم تكن هناك مواد محفوظة، تبدأ القائمة فارغة ليضيفها المستخدم يدوياً
    setSubjectsList([]);
  };

  // عند فتح الشاشة للمرة الأولى
  useEffect(() => {
    loadSubjectsForCurrentSelection(studySystem, selectedStage, selectedGrade, secondaryTrack, selectedSemester, true);
  }, []);

  // تفريغ كاش الحصص اليومية
  useEffect(() => {
    try {
      localStorage.removeItem(storageKey);
    } catch {}
    setDays(DEFAULT_DAYS);
    setRows(DEFAULT_ROWS);
  }, [storageKey]);

  // عند تغيير المرحلة: يتم تحديث الصفوف تلقائياً للصف الأول من المرحلة
  const handleStageChange = (newStage: string) => {
    setSelectedStage(newStage);
    const availableGrades = stageGradesMap[newStage] || STAGE_GRADES_MAP[newStage] || [];
    const newGrade = availableGrades[0] || '';
    setSelectedGrade(newGrade);
    
    // تحميل مواد الاختيار الجديد فوراً
    loadSubjectsForCurrentSelection(studySystem, newStage, newGrade, secondaryTrack, selectedSemester, true);
  };

  // عند تغيير الصف: إذا تم التبديل إلى ثاني ثانوي
  const handleGradeChange = (newGrade: string) => {
    setSelectedGrade(newGrade);
    loadSubjectsForCurrentSelection(studySystem, selectedStage, newGrade, secondaryTrack, selectedSemester, true);
  };

  // حساب إجمالي نصاب المواد المعروضة
  const totalSubjectPeriods = subjectsList.reduce((sum, item) => sum + (Number(item.periods) || 0), 0);

  // تنفيذ البحث عند الضغط على زر "ابحث"
  const handleSearchSubjects = () => {
    loadSubjectsForCurrentSelection(studySystem, selectedStage, selectedGrade, secondaryTrack, selectedSemester, false);
  };

  // إعادة تعيين حقول البحث للقيم الافتراضية (الصف الأول الابتدائي افتراضياً)
  const handleResetSearch = () => {
    const defSys = studySystemOptions[0] || 'أهلي';
    const defStg = stageOptions[0] || 'ابتدائي';
    const defGrades = stageGradesMap[defStg] || STAGE_GRADES_MAP[defStg] || [];
    const defGrd = defGrades[0] || 'الأول الابتدائي';
    const defTrk = secondaryTrackOptions[0] || 'مسار عام';
    const defSem = semesterOptions[0] || 'الفصل الدراسي الأول';

    setStudySystem(defSys);
    setSelectedStage(defStg);
    setSelectedGrade(defGrd);
    setSecondaryTrack(defTrk);
    setSelectedSemester(defSem);
    loadSubjectsForCurrentSelection(defSys, defStg, defGrd, defTrk, defSem, false);
  };

  // حفظ تعديل نصاب مادة (تعديل الاسم والحصص للأدمن)
  const handleSaveSubjectEdit = () => {
    if (!editingSubject) return;
    const finalName = editingSubject.name.trim() || 'مادة';
    const finalPeriods = Number(editingSubject.periods) || 0;
    const updated = subjectsList.map(sub => 
      sub.id === editingSubject.id ? { ...sub, name: finalName, periods: finalPeriods } : sub
    );
    setSubjectsList(updated);
    try {
      localStorage.setItem(currentQuotaStorageKey, JSON.stringify(updated));
      saveSubjectQuotaToFirestore(currentQuotaStorageKey, updated);
    } catch {}
    setEditingSubject(null);
    setSuccessToast(`تم تحديث مادة (${finalName}) بنجاح`);
    setTimeout(() => setSuccessToast(null), 3000);
  };

  // إضافة مادة جديدة لنصاب المواد (مرتبطة بالاختيارات الحالية فقط)
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
      localStorage.setItem(currentQuotaStorageKey, JSON.stringify(updated));
      saveSubjectQuotaToFirestore(currentQuotaStorageKey, updated);
    } catch {}
    setNewSubjectName('');
    setShowAddSubjectModal(false);
    setSuccessToast(`تمت إضافة مادة (${newItem.name}) بنجاح لهذا الصف`);
    setTimeout(() => setSuccessToast(null), 3000);
  };

  // حذف مادة من نصاب المواد الحالي فقط
  const handleDeleteSubject = (id: string, name: string) => {
    if (window.confirm(`هل أنت متأكد من حذف مادة (${name}) من نصاب ${selectedGrade}؟`)) {
      const updated = subjectsList.filter(s => s.id !== id);
      setSubjectsList(updated);
      try {
        localStorage.setItem(currentQuotaStorageKey, JSON.stringify(updated));
        saveSubjectQuotaToFirestore(currentQuotaStorageKey, updated);
      } catch {}
      setSuccessToast(`تم حذف مادة (${name})`);
      setTimeout(() => setSuccessToast(null), 3000);
    }
  };

  // استعادة النصاب الافتراضي للمواد للاختيارات الحالية فقط
  const handleResetSubjectsDefault = () => {
    if (window.confirm(`هل تريد تفريغ وإعادة ضبط مواد (${selectedGrade} - ${selectedStage})؟`)) {
      setSubjectsList([]);
      try {
        localStorage.removeItem(currentQuotaStorageKey);
        saveSubjectQuotaToFirestore(currentQuotaStorageKey, []);
      } catch {}
      setSuccessToast('تم تفريغ قائمة المواد');
      setTimeout(() => setSuccessToast(null), 3000);
    }
  };

  // حفظ نصاب المواد للاختيارات الحالية (يعمل عبر زر الحفظ السفلي الموحد)
  const handleSaveSubjects = async () => {
    setIsSaving(true);
    try {
      localStorage.setItem(currentQuotaStorageKey, JSON.stringify(subjectsList));
      await saveSubjectQuotaToFirestore(currentQuotaStorageKey, subjectsList);
      setSuccessToast(`تم حفظ نصاب مواد (${selectedGrade} - ${selectedStage}) بنجاح!`);
      setTimeout(() => setSuccessToast(null), 3500);
    } catch (e) {
      console.warn(e);
      setSuccessToast(`تم حفظ نصاب مواد (${selectedGrade} - ${selectedStage}) محلياً`);
      setTimeout(() => setSuccessToast(null), 3500);
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
        if (e.target === e.currentTarget && !showAddGradeModal && !isPrintModalOpen && !editingSubject && !showAddSubjectModal) {
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
                    <span className="text-purple-700 font-extrabold">{selectedStage} - {selectedGrade} ({totalSubjectPeriods} حصة)</span>
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
          {/* تبويب: "نصاب الحصص للمواد" (معدل بدقة وفق طلب المستخدم) */}
          {/* ======================================================== */}
          {activeSubTab === 'نصاب الحصص للمواد' && (
            <div className="space-y-3.5 animate-in fade-in duration-150">
              
              {/* قسم: حقول البحث */}
              <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs space-y-4">
                
                {/* عنوان حقول البحث مع أيقونة الفلتر */}
                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                  <div className="flex items-center gap-2 text-slate-900 font-black text-sm">
                    <Filter size={16} className="text-slate-700" />
                    <span>حقول البحث وتصفية نصاب المواد</span>
                  </div>
                  <span className="text-[11px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-lg border border-purple-200">
                    {selectedStage} • {selectedGrade}
                  </span>
                </div>

                {/* شبكة حقول البحث المتكيفة مع اختيارات المسار والمرحلة والصف والفصل مدعومة بإدارة الخيارات للأدمن */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-3.5">
                  
                  {/* 1. نظام التعليم (نفس اختيارات المسار: أهلي، دولي، دبلومة أمريكية...) */}
                  <ManagedSelectField
                    label="نظام التعليم"
                    required
                    value={studySystem}
                    onChange={(val) => {
                      setStudySystem(val);
                      loadSubjectsForCurrentSelection(val, selectedStage, selectedGrade, secondaryTrack, selectedSemester, true);
                    }}
                    options={studySystemOptions}
                    onManageOptions={() => openOptionManager('studySystem', 'نظام التعليم', studySystemOptions, 'blue')}
                    isAdmin={isAdmin}
                    accentColor="blue"
                  />

                  {/* 2. المرحلة (ابتدائي، متوسط، ثانوي) */}
                  <ManagedSelectField
                    label="المرحلة"
                    required
                    value={selectedStage}
                    onChange={(val) => handleStageChange(val)}
                    options={stageOptions}
                    onManageOptions={() => openOptionManager('stage', 'المرحلة الدراسية', stageOptions, 'emerald')}
                    isAdmin={isAdmin}
                    accentColor="emerald"
                  />

                  {/* 3. الصف (مرتبط بالمرحلة المختارة فقط) */}
                  <ManagedSelectField
                    label={`الصف (${selectedStage})`}
                    required
                    value={selectedGrade}
                    onChange={(val) => handleGradeChange(val)}
                    options={currentAvailableGrades}
                    onManageOptions={() => openOptionManager('grade', `صفوف مرحلة (${selectedStage})`, currentAvailableGrades, 'indigo')}
                    isAdmin={isAdmin}
                    accentColor="indigo"
                  />

                  {/* 4. المسار (يظهر فقط عند اختيار ثاني ثانوي أو ثالث ثانوي) */}
                  {isSecondaryTrackVisible && (
                    <div className="animate-in fade-in zoom-in-95 duration-150">
                      <ManagedSelectField
                        label="المسار"
                        required
                        value={secondaryTrack}
                        onChange={(val) => {
                          setSecondaryTrack(val);
                          loadSubjectsForCurrentSelection(studySystem, selectedStage, selectedGrade, val, selectedSemester, true);
                        }}
                        options={secondaryTrackOptions}
                        onManageOptions={() => openOptionManager('secondaryTrack', 'المسار الثانوي', secondaryTrackOptions, 'violet')}
                        isAdmin={isAdmin}
                        accentColor="violet"
                      />
                    </div>
                  )}

                  {/* 5. الفصل الدراسي (الفصل الدراسي الأول أو الثاني) */}
                  <ManagedSelectField
                    label="الفصل الدراسي"
                    required
                    value={selectedSemester}
                    onChange={(val) => {
                      setSelectedSemester(val);
                      loadSubjectsForCurrentSelection(studySystem, selectedStage, selectedGrade, secondaryTrack, val, true);
                    }}
                    options={semesterOptions}
                    onManageOptions={() => openOptionManager('semester', 'الفصل الدراسي', semesterOptions, 'amber')}
                    isAdmin={isAdmin}
                    accentColor="amber"
                  />

                </div>

                {/* نص حقول إجبارية على اليمين */}
                <div className="text-[11px] font-bold text-slate-500 pt-1 flex items-center justify-between">
                  <span>(*) حقول إجبارية.</span>
                  <span className="text-slate-500">
                    يتم استعراض المواد المخصصة تلقائياً فور تعديل أي خيار أو النقر على «ابحث».
                  </span>
                </div>

                {/* زرا البحث والعودة بالمنتصف */}
                <div className="flex items-center justify-center gap-2.5 pt-1">
                  <button
                    type="button"
                    onClick={handleSearchSubjects}
                    className="px-8 py-2 bg-[#0f172a] hover:bg-slate-800 text-white rounded-xl text-xs sm:text-sm font-black shadow-xs transition-all cursor-pointer flex items-center gap-2"
                  >
                    <span>ابحث</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleResetSearch}
                    className="px-8 py-2 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 rounded-xl text-xs sm:text-sm font-bold shadow-2xs transition-all cursor-pointer"
                  >
                    إعادة ضبط
                  </button>
                </div>

              </div>

              {/* تم حذف بنر "لعرض صفحة قابلة للطباعة انقر هنا" بالكامل وفق طلب المستخدم */}

              {/* جدول نصاب الحصص للمواد الخاصة بالاختيارات فقط */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                
                {/* شريط حالة المواد الحالية */}
                <div className="bg-slate-50/90 border-b border-slate-200 px-4 py-2.5 flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2 text-xs font-black text-slate-800">
                    <BookOpen size={15} className="text-purple-600" />
                    <span>مواد ({selectedGrade} - {selectedStage})</span>
                    <span className="text-slate-400">•</span>
                    <span className="text-slate-600 font-bold">{studySystem}</span>
                    <span className="text-slate-400">•</span>
                    <span className="text-slate-600 font-bold">{selectedSemester}</span>
                    {isSecondaryTrackVisible && (
                      <>
                        <span className="text-slate-400">•</span>
                        <span className="text-purple-700 font-bold bg-purple-100/60 px-2 py-0.5 rounded-md border border-purple-200">
                          {secondaryTrack}
                        </span>
                      </>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-black text-slate-700 ml-2">
                      مجموع الحصص: <span className="text-purple-700 font-black text-sm">{totalSubjectPeriods}</span> حصة
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setNewSubjectName('');
                        setNewSubjectPeriods(3);
                        setShowAddSubjectModal(true);
                      }}
                      className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                      title="إضافة مادة دراسية جديدة لهذا الصف"
                    >
                      <Plus size={14} />
                      <span>إضافة مادة</span>
                    </button>
                  </div>
                </div>

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
                      {subjectsList.length === 0 ? (
                        <tr>
                          <td colSpan={3} className="py-12 text-center">
                            <div className="flex flex-col items-center justify-center gap-2 text-slate-400">
                              <BookOpen size={36} className="text-slate-300 stroke-[1.5]" />
                              <p className="font-bold text-slate-700 text-sm">
                                لا توجد مواد مضافة حالياً لـ ({selectedGrade})
                              </p>
                              <p className="text-xs text-slate-500 max-w-md">
                                أضف المواد الدراسية الخاصة بهذا الصف وعدد حصصها يدوياً بالضغط على زر «إضافة مادة».
                              </p>
                              <button
                                type="button"
                                onClick={() => {
                                  setNewSubjectName('');
                                  setNewSubjectPeriods(3);
                                  setShowAddSubjectModal(true);
                                }}
                                className="mt-2 px-4 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                              >
                                <Plus size={14} />
                                <span>إضافة أول مادة</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        subjectsList.map((item) => (
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

                            {/* خيارات: رابط تعديل وحذف */}
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
                        ))
                      )}
                    </tbody>

                    {/* تذييل الجدول بإجمالي الحصص */}
                    <tfoot>
                      <tr className="bg-slate-50/90 border-t-2 border-slate-200 text-xs sm:text-sm font-black text-slate-900">
                        <td className="py-3 px-5">
                          إجمالي نصاب المواد لـ ({selectedGrade})
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className={`inline-block px-3 py-1 rounded-lg text-sm ${
                            totalSubjectPeriods >= 30 && totalSubjectPeriods <= 35
                              ? 'bg-emerald-100 text-emerald-900 border border-emerald-300' 
                              : 'bg-amber-100 text-amber-900 border border-amber-300'
                          }`}>
                            {totalSubjectPeriods} حصة
                          </span>
                        </td>
                        <td className="py-3 px-5 text-center text-slate-400 font-bold text-xs">
                          {totalSubjectPeriods === 33 ? 'مطابق للخطة (33)' : `الإجمالي: ${totalSubjectPeriods} حصة`}
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
              
              {/* بنر: لعرض صفحة قابلة للطباعة، انقر هنا في الحصص اليومية */}
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
            <div className="text-xs sm:text-sm font-bold text-slate-800 flex items-center gap-2.5 order-2 sm:order-1 flex-wrap">
              <span>المواد: {subjectsList.length}</span>
              <button
                type="button"
                onClick={() => setShowAddSubjectModal(true)}
                className="text-xs text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1 cursor-pointer bg-blue-50 px-2 py-1 rounded-lg border border-blue-200 hover:bg-blue-100 transition-colors"
              >
                <Plus size={13} />
                <span>إضافة مادة لـ {selectedGrade}</span>
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
              {isAdmin ? (
                <input
                  type="text"
                  value={editingSubject.name}
                  onChange={(e) => setEditingSubject({ ...editingSubject, name: e.target.value })}
                  placeholder="اسم المادة..."
                  className="w-full py-2 px-3 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              ) : (
                <div className="text-sm font-black text-slate-900 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                  {editingSubject.name}
                </div>
              )}
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

      {/* نافذة إضافة مادة جديدة (مرتبطة بالخيارات المحددة فقط) */}
      {showAddSubjectModal && (
        <div className="fixed inset-0 z-60 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-2xl border border-slate-200 space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <div>
                <h3 className="text-sm font-black text-slate-900">إضافة مادة دراسية جديدة</h3>
                <p className="text-[11px] text-purple-700 font-bold mt-0.5">
                  خاصة بـ: {selectedGrade} ({selectedStage}) • {studySystem} • {selectedSemester}
                  {isSecondaryTrackVisible && ` • ${secondaryTrack}`}
                </p>
              </div>
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
                placeholder="مثال: مادة إضافية أو مهارات رقمية"
                className="w-full py-2 px-3 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">عدد الحصص الأسبوعية:</label>
              <input
                type="number"
                min={1}
                max={30}
                value={newSubjectPeriods}
                onChange={(e) => setNewSubjectPeriods(parseInt(e.target.value, 10) || 1)}
                className="w-full py-2 px-3 bg-slate-50 border border-slate-300 rounded-xl text-center text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
              />
            </div>

            <div className="text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
              ملاحظة: ستتم إضافة هذه المادة فقط ضمن نصاب <span className="font-bold text-slate-800">«{selectedGrade}»</span> دون التأثير على بقية الصفوف أو المراحل.
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

      {/* نافذة إدارة الخيارات للأدمن (إضافة، تعديل، حذف لكافة الحقول) */}
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
