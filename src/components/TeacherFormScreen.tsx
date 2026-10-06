import React, { useState, useEffect, useRef } from 'react';
import { 
  GraduationCap, Save, User, Hash, Globe, Users, 
  CreditCard, Phone, Award, BookOpen, FileCheck, Sparkles, 
  Mail, Landmark, Calendar, Check, Copy, X, Trash2, Edit3, 
  AlertCircle, Search, Briefcase, Plus, Compass, ArrowLeftRight
} from 'lucide-react';
import { 
  TeacherRecord, 
  saveTeacherToFirestore, 
  getTeachersFromFirestore, 
  deleteTeacherFromFirestore,
  updateTeacherInFirestore
} from '../lib/api';
import { DatePickerField } from './DatePickerField';
import { OptionManagerModal } from './OptionManagerModal';
import { ManagedSelectField } from './ManagedSelectField';
import { TransferModal } from './TransferModal';
import { arabicIncludes } from '../lib/arabicUtils';
import {
  DEFAULT_NATIONALITIES,
  DEFAULT_TEACHER_SECTIONS,
  DEFAULT_TRACKS,
  DEFAULT_TEACHER_STAGES,
  DEFAULT_TEACHER_JOBS,
  DEFAULT_QUOTAS,
  DEFAULT_TEACHER_QUALIFICATIONS,
  DEFAULT_TEACHER_SPECIALIZATIONS,
  DEFAULT_SUBJECTS,
  DEFAULT_LICENSES,
  DEFAULT_CLASSERA_LEVELS,
  DEFAULT_BANKS,
  loadCustomOptions,
  saveCustomOptions,
  fetchCustomOptionsFromFirestore
} from '../lib/customOptions';

interface TeacherFormScreenProps {
  onBack: () => void;
  academicYear: string;
  complexName: string;
  isAdmin?: boolean;
}

interface LoadedTeacher extends TeacherRecord {
  source: 'firestore' | 'local';
}

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

type OptionFieldKey = 
  | 'nationality' 
  | 'section' 
  | 'track'
  | 'stage' 
  | 'job' 
  | 'quota' 
  | 'qualification' 
  | 'specialization' 
  | 'subject' 
  | 'license' 
  | 'classera' 
  | 'bank';

export const TeacherFormScreen: React.FC<TeacherFormScreenProps> = ({
  onBack,
  academicYear,
  complexName,
  isAdmin = true
}) => {
  // خيارات كافة المدخلات القابلة للتخصيص من قبل الأدمن (إضافة / تعديل / حذف)
  const [nationalityOptions, setNationalityOptions] = useState<string[]>(() => 
    loadCustomOptions('custom_nationalities_v1', DEFAULT_NATIONALITIES)
  );
  const [sectionOptions, setSectionOptions] = useState<string[]>(() => 
    loadCustomOptions('custom_teacher_sections_v1', DEFAULT_TEACHER_SECTIONS)
  );
  const [trackOptions, setTrackOptions] = useState<string[]>(() => 
    loadCustomOptions('custom_tracks_v1', DEFAULT_TRACKS)
  );
  const [stageOptions, setStageOptions] = useState<string[]>(() => 
    loadCustomOptions('custom_teacher_stages_v1', DEFAULT_TEACHER_STAGES)
  );
  const [jobOptions, setJobOptions] = useState<string[]>(() => 
    loadCustomOptions('custom_teacher_jobs_v1', DEFAULT_TEACHER_JOBS)
  );
  const [quotaOptions, setQuotaOptions] = useState<string[]>(() => 
    loadCustomOptions('custom_teacher_quotas_v1', DEFAULT_QUOTAS)
  );
  const [qualificationOptions, setQualificationOptions] = useState<string[]>(() => 
    loadCustomOptions('custom_teacher_qualifications_v1', DEFAULT_TEACHER_QUALIFICATIONS)
  );
  const [specializationOptions, setSpecializationOptions] = useState<string[]>(() => 
    loadCustomOptions('custom_teacher_specializations_v1', DEFAULT_TEACHER_SPECIALIZATIONS)
  );
  const [subjectOptions, setSubjectOptions] = useState<string[]>(() => 
    loadCustomOptions('custom_teacher_subjects_v1', DEFAULT_SUBJECTS)
  );
  const [licenseOptions, setLicenseOptions] = useState<string[]>(() => 
    loadCustomOptions('custom_teacher_licenses_v1', DEFAULT_LICENSES)
  );
  const [classeraOptions, setClasseraOptions] = useState<string[]>(() => 
    loadCustomOptions('custom_teacher_classeras_v1', DEFAULT_CLASSERA_LEVELS)
  );
  const [bankOptions, setBankOptions] = useState<string[]>(() => 
    loadCustomOptions('custom_banks_v1', DEFAULT_BANKS)
  );

  // مزامنة الخيارات مع فايربيس في الخلفية
  useEffect(() => {
    fetchCustomOptionsFromFirestore('custom_nationalities_v1', DEFAULT_NATIONALITIES).then(setNationalityOptions);
    fetchCustomOptionsFromFirestore('custom_teacher_sections_v1', DEFAULT_TEACHER_SECTIONS).then(setSectionOptions);
    fetchCustomOptionsFromFirestore('custom_tracks_v1', DEFAULT_TRACKS).then(setTrackOptions);
    fetchCustomOptionsFromFirestore('custom_teacher_stages_v1', DEFAULT_TEACHER_STAGES).then(setStageOptions);
    fetchCustomOptionsFromFirestore('custom_teacher_jobs_v1', DEFAULT_TEACHER_JOBS).then(setJobOptions);
    fetchCustomOptionsFromFirestore('custom_teacher_quotas_v1', DEFAULT_QUOTAS).then(setQuotaOptions);
    fetchCustomOptionsFromFirestore('custom_teacher_qualifications_v1', DEFAULT_TEACHER_QUALIFICATIONS).then(setQualificationOptions);
    fetchCustomOptionsFromFirestore('custom_teacher_specializations_v1', DEFAULT_TEACHER_SPECIALIZATIONS).then(setSpecializationOptions);
    fetchCustomOptionsFromFirestore('custom_teacher_subjects_v1', DEFAULT_SUBJECTS).then(setSubjectOptions);
    fetchCustomOptionsFromFirestore('custom_teacher_licenses_v1', DEFAULT_LICENSES).then(setLicenseOptions);
    fetchCustomOptionsFromFirestore('custom_teacher_classeras_v1', DEFAULT_CLASSERA_LEVELS).then(setClasseraOptions);
    fetchCustomOptionsFromFirestore('custom_banks_v1', DEFAULT_BANKS).then(setBankOptions);
  }, []);

  // الحقول المطلوبة للكادر التعليمي
  const [jobNum, setJobNum] = useState('');
  const [name, setName] = useState('');
  const [nationality, setNationality] = useState(nationalityOptions[0] || 'سعودي');
  const [section, setSection] = useState(sectionOptions[0] || 'بنين');
  const [track, setTrack] = useState(trackOptions[0] || 'أهلي');
  const [stage, setStage] = useState(stageOptions[0] || 'ابتدائي');
  const [jobTitle, setJobTitle] = useState(jobOptions[0] || 'معلم');
  const [nationalId, setNationalId] = useState('');
  const [phone, setPhone] = useState('');
  const [quota, setQuota] = useState('24');
  const [qualification, setQualification] = useState(qualificationOptions[0] || 'بكالوريوس');
  const [specialization, setSpecialization] = useState(specializationOptions[0] || 'رياضيات');
  const [subject, setSubject] = useState(subjectOptions[0] || 'رياضيات');
  const [license, setLicense] = useState(licenseOptions[0] || '1');
  const [classera, setClassera] = useState(classeraOptions[0] || 'ممارس');
  const [email, setEmail] = useState('');
  const [ibanDigits, setIbanDigits] = useState('');
  const [bank, setBank] = useState(bankOptions[0] || 'مصرف الراجحي');
  const [startDate, setStartDate] = useState('');

  // حالة نافذة إدارة الخيارات للأدمن
  const [optionManager, setOptionManager] = useState<{
    isOpen: boolean;
    fieldKey: OptionFieldKey | '';
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
    fieldKey: OptionFieldKey,
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

  const applyOptionsUpdate = (key: OptionFieldKey, newOpts: string[]) => {
    let storageKey = '';
    switch (key) {
      case 'nationality':
        setNationalityOptions(newOpts);
        storageKey = 'custom_nationalities_v1';
        break;
      case 'section':
        setSectionOptions(newOpts);
        storageKey = 'custom_teacher_sections_v1';
        break;
      case 'track':
        setTrackOptions(newOpts);
        storageKey = 'custom_tracks_v1';
        break;
      case 'stage':
        setStageOptions(newOpts);
        storageKey = 'custom_teacher_stages_v1';
        break;
      case 'job':
        setJobOptions(newOpts);
        storageKey = 'custom_teacher_jobs_v1';
        break;
      case 'quota':
        setQuotaOptions(newOpts);
        storageKey = 'custom_teacher_quotas_v1';
        break;
      case 'qualification':
        setQualificationOptions(newOpts);
        storageKey = 'custom_teacher_qualifications_v1';
        break;
      case 'specialization':
        setSpecializationOptions(newOpts);
        storageKey = 'custom_teacher_specializations_v1';
        break;
      case 'subject':
        setSubjectOptions(newOpts);
        storageKey = 'custom_teacher_subjects_v1';
        break;
      case 'license':
        setLicenseOptions(newOpts);
        storageKey = 'custom_teacher_licenses_v1';
        break;
      case 'classera':
        setClasseraOptions(newOpts);
        storageKey = 'custom_teacher_classeras_v1';
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

    // تحديث القيمة المختارة بالخيار المضاف
    switch (optionManager.fieldKey) {
      case 'nationality': setNationality(newOpt); break;
      case 'section': setSection(newOpt); break;
      case 'track': setTrack(newOpt); break;
      case 'stage': setStage(newOpt); break;
      case 'job': setJobTitle(newOpt); break;
      case 'quota': setQuota(newOpt); break;
      case 'qualification': setQualification(newOpt); break;
      case 'specialization': setSpecialization(newOpt); break;
      case 'subject': setSubject(newOpt); break;
      case 'license': setLicense(newOpt); break;
      case 'classera': setClassera(newOpt); break;
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
      case 'track': if (track === optToDelete) setTrack(fallback); break;
      case 'stage': if (stage === optToDelete) setStage(fallback); break;
      case 'job': if (jobTitle === optToDelete) setJobTitle(fallback); break;
      case 'quota': if (quota === optToDelete) setQuota(fallback); break;
      case 'qualification': if (qualification === optToDelete) setQualification(fallback); break;
      case 'specialization': if (specialization === optToDelete) setSpecialization(fallback); break;
      case 'subject': if (subject === optToDelete) setSubject(fallback); break;
      case 'license': if (license === optToDelete) setLicense(fallback); break;
      case 'classera': if (classera === optToDelete) setClassera(fallback); break;
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
      case 'track': if (track === oldOpt) setTrack(newOpt); break;
      case 'stage': if (stage === oldOpt) setStage(newOpt); break;
      case 'job': if (jobTitle === oldOpt) setJobTitle(newOpt); break;
      case 'quota': if (quota === oldOpt) setQuota(newOpt); break;
      case 'qualification': if (qualification === oldOpt) setQualification(newOpt); break;
      case 'specialization': if (specialization === oldOpt) setSpecialization(newOpt); break;
      case 'subject': if (subject === oldOpt) setSubject(newOpt); break;
      case 'license': if (license === oldOpt) setLicense(newOpt); break;
      case 'classera': if (classera === oldOpt) setClassera(newOpt); break;
      case 'bank': if (bank === oldOpt) setBank(newOpt); break;
    }
  };

  // حالات البحث والمعلم المحدد
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState<LoadedTeacher | null>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // حالة تأكيد الحذف كنافذة منبثقة آمنة داخلية
  const [teacherToDelete, setTeacherToDelete] = useState<LoadedTeacher | null>(null);

  // حالة طلب نقل المعلم لمجمع آخر
  const [employeeToTransfer, setEmployeeToTransfer] = useState<LoadedTeacher | null>(null);

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
        const filtered = (complexName === 'كل المجمعات')
          ? merged
          : merged.filter(t => t.complexName === complexName || (!t.complexName && complexName === 'دار القلم'));
        setAllTeachers(filtered);
        safeSetStorage(STORAGE_KEY, JSON.stringify(merged));
      } catch (err) {
        console.warn('Firestore fallback to local storage:', err);
        const filteredLocal = (complexName === 'كل المجمعات')
          ? localList
          : localList.filter(t => t.complexName === complexName || (!t.complexName && complexName === 'دار القلم'));
        setAllTeachers(filteredLocal);
      }
    } catch (e) {
      console.error('Error fetching registered teachers:', e);
    }
  };

  useEffect(() => {
    fetchAllTeachers();
  }, []);

  // نتائج البحث المفلترة بالاسم أو الرقم الوظيفي مع مراعاة كافة الفروق الإملائية
  const searchResults = React.useMemo(() => {
    const q = searchQuery.trim();
    if (!q) return [];
    return allTeachers.filter(t => 
      arabicIncludes(t.name, q) || 
      arabicIncludes(t.jobNum, q) ||
      arabicIncludes(t.nationalId, q) ||
      arabicIncludes(t.subject, q) ||
      arabicIncludes(t.specialization, q) ||
      arabicIncludes(t.track, q) ||
      arabicIncludes(t.stage, q) ||
      arabicIncludes(t.jobTitle, q)
    ).slice(0, 15);
  }, [searchQuery, allTeachers]);

  // تعبئة النموذج ببيانات المعلم المحدد للتعديل
  const populateTeacherData = (teacher: LoadedTeacher) => {
    setSelectedTeacher(teacher);
    setJobNum(teacher.jobNum || '');
    setName(teacher.name || '');
    setNationality(teacher.nationality || 'سعودي');
    setSection(teacher.section || 'بنين');
    setTrack(teacher.track || trackOptions[0] || 'أهلي');
    setStage(teacher.stage || stageOptions[0] || 'ابتدائي');
    setJobTitle(teacher.jobTitle || jobOptions[0] || 'معلم');
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
    setNationality(nationalityOptions[0] || 'سعودي');
    setSection(sectionOptions[0] || 'بنين');
    setTrack(trackOptions[0] || 'أهلي');
    setStage(stageOptions[0] || 'ابتدائي');
    setJobTitle(jobOptions[0] || 'معلم');
    setNationalId('');
    setPhone('');
    setQuota(quotaOptions.includes('24') ? '24' : (quotaOptions[0] || '24'));
    setQualification(qualificationOptions[0] || 'بكالوريوس');
    setSpecialization(specializationOptions[0] || 'رياضيات');
    setSubject(subjectOptions[0] || 'رياضيات');
    setLicense(licenseOptions[0] || '1');
    setClassera(classeraOptions[0] || 'ممارس');
    setEmail('');
    setIbanDigits('');
    setBank(bankOptions[0] || 'مصرف الراجحي');
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
      complexName,
      academicYear,
      jobNum: jobNum.trim(),
      name: name.trim(),
      nationality: nationality.trim(),
      section: section.trim(),
      track: track.trim(),
      stage: stage.trim(),
      jobTitle: jobTitle.trim(),
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
      complexName: selectedTeacher.complexName || complexName,
      academicYear: selectedTeacher.academicYear || academicYear,
      jobNum: jobNum.trim(),
      name: name.trim(),
      nationality: nationality.trim(),
      section: section.trim(),
      track: track.trim(),
      stage: stage.trim(),
      jobTitle: jobTitle.trim(),
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

                        {/* وتحته تعديل أو حذف أو نقل */}
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
                            onClick={() => setEmployeeToTransfer(teacher)}
                            className="flex items-center gap-1 px-3 py-1 bg-amber-50 hover:bg-amber-100 active:scale-95 text-amber-800 border border-amber-300 rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer"
                            title="نقل المعلم إلى مجمع آخر"
                          >
                            <ArrowLeftRight size={12} />
                            <span>نقل</span>
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

              {/* 3. الجنسية (خلية اختيارات مع إدارة للأدمن) */}
              <ManagedSelectField
                label="الجنسية"
                icon={<Globe size={13} className="text-blue-600" />}
                value={nationality}
                onChange={setNationality}
                options={nationalityOptions}
                onManageOptions={() => openOptionManager('nationality', 'الجنسية', nationalityOptions, 'blue')}
                isAdmin={isAdmin}
                accentColor="blue"
              />

              {/* 4. القسم (اختيارات مع إدارة للأدمن) */}
              <ManagedSelectField
                label="القسم"
                icon={<Users size={13} className="text-indigo-600" />}
                value={section}
                onChange={setSection}
                options={sectionOptions}
                onManageOptions={() => openOptionManager('section', 'القسم', sectionOptions, 'indigo')}
                isAdmin={isAdmin}
                accentColor="indigo"
              />

              {/* 5. المسار (مشترك بين الكادر التعليمي والإداري مع إدارة للأدمن) */}
              <ManagedSelectField
                label="المسار"
                icon={<Compass size={13} className="text-sky-600" />}
                value={track}
                onChange={setTrack}
                options={trackOptions}
                onManageOptions={() => openOptionManager('track', 'المسار', trackOptions, 'blue')}
                isAdmin={isAdmin}
                accentColor="blue"
              />

              {/* 6. المرحلة (تحت القسم مباشرة مع إمكانية إدارة الخيارات للأدمن) */}
              <ManagedSelectField
                label="المرحلة"
                icon={<BookOpen size={13} className="text-blue-600" />}
                value={stage}
                onChange={setStage}
                options={stageOptions}
                onManageOptions={() => openOptionManager('stage', 'المرحلة', stageOptions, 'blue')}
                isAdmin={isAdmin}
                accentColor="blue"
              />

              {/* 7. الوظيفة (تحت القسم مباشرة مع إمكانية إدارة الخيارات للأدمن) */}
              <ManagedSelectField
                label="الوظيفة"
                icon={<Briefcase size={13} className="text-blue-600" />}
                value={jobTitle}
                onChange={setJobTitle}
                options={jobOptions}
                onManageOptions={() => openOptionManager('job', 'الوظيفة', jobOptions, 'blue')}
                isAdmin={isAdmin}
                accentColor="blue"
              />

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

              {/* 7. نصاب المعلم (الحصص من 1 إلى 35 مع إدارة للأدمن) */}
              <ManagedSelectField
                label="نصاب المعلم (1 إلى 35)"
                icon={<GraduationCap size={13} className="text-teal-600" />}
                value={quota}
                onChange={setQuota}
                options={quotaOptions}
                formatOptionLabel={(q) => `${q} حصة`}
                onManageOptions={() => openOptionManager('quota', 'نصاب المعلم', quotaOptions, 'teal')}
                isAdmin={isAdmin}
                accentColor="teal"
              />

              {/* 8. المؤهل (خلية اختيارات مع إدارة للأدمن) */}
              <ManagedSelectField
                label="المؤهل"
                icon={<Award size={13} className="text-teal-600" />}
                value={qualification}
                onChange={setQualification}
                options={qualificationOptions}
                onManageOptions={() => openOptionManager('qualification', 'المؤهل', qualificationOptions, 'teal')}
                isAdmin={isAdmin}
                accentColor="teal"
              />

              {/* 9. التخصص (خلية اختيارات مع إدارة للأدمن) */}
              <ManagedSelectField
                label="التخصص"
                icon={<BookOpen size={13} className="text-teal-600" />}
                value={specialization}
                onChange={setSpecialization}
                options={specializationOptions}
                onManageOptions={() => openOptionManager('specialization', 'التخصص', specializationOptions, 'teal')}
                isAdmin={isAdmin}
                accentColor="teal"
              />

              {/* 10. مادة التدريس (خلية اختيارات مع إدارة للأدمن) */}
              <ManagedSelectField
                label="مادة التدريس"
                icon={<BookOpen size={13} className="text-violet-600" />}
                value={subject}
                onChange={setSubject}
                options={subjectOptions}
                onManageOptions={() => openOptionManager('subject', 'مادة التدريس', subjectOptions, 'violet')}
                isAdmin={isAdmin}
                accentColor="violet"
              />

              {/* 11. الرخصة المهنية (اختيارات مع إدارة للأدمن) */}
              <ManagedSelectField
                label="الرخصة المهنية"
                icon={<FileCheck size={13} className="text-emerald-600" />}
                value={license}
                onChange={setLicense}
                options={licenseOptions}
                onManageOptions={() => openOptionManager('license', 'الرخصة المهنية', licenseOptions, 'emerald')}
                isAdmin={isAdmin}
                accentColor="emerald"
              />

              {/* 12. كلاسيرا (اختيارات مع إدارة للأدمن) */}
              <ManagedSelectField
                label="كلاسيرا"
                icon={<Sparkles size={13} className="text-amber-500" />}
                value={classera}
                onChange={setClassera}
                options={classeraOptions}
                onManageOptions={() => openOptionManager('classera', 'كلاسيرا', classeraOptions, 'amber')}
                isAdmin={isAdmin}
                accentColor="amber"
              />

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

              {/* 15. البنك (خلية اختيارات مع إدارة للأدمن) */}
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
                  dropUp={true}
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

      {/* نافذة طلب نقل المعلم لمجمع آخر */}
      <TransferModal
        isOpen={!!employeeToTransfer}
        onClose={() => setEmployeeToTransfer(null)}
        employee={employeeToTransfer}
        employeeType="teacher"
        currentComplex={complexName}
        onTransferSuccess={(targetComplex, empName) => {
          setSuccessMessage(`تم إرسال طلب نقل المعلم (${empName}) إلى (${targetComplex}) بنجاح.`);
          setTimeout(() => setSuccessMessage(null), 5000);
        }}
      />

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
