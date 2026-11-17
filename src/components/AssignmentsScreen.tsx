import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { 
  Check, X, ChevronDown, ChevronLeft, ChevronRight,
  Save, Plus, Trash2, RotateCcw, 
  Clock, FileSpreadsheet, Filter, Edit3, BookOpen,
  User, Users, AlertCircle, AlertTriangle, UserPlus
} from 'lucide-react';
import { ManagedSelectField } from './ManagedSelectField';
import { OptionManagerModal } from './OptionManagerModal';
import { 
  loadCustomOptions, 
  saveCustomOptions, 
  fetchCustomOptionsFromFirestore,
  DEFAULT_SPECIAL_ED_TRACKS,
  DEFAULT_TEACHER_SECTIONS
} from '../lib/customOptions';
import { 
  TimetableDailyPeriodsRecord, 
  saveDailyPeriodsToFirestore,
  getDailyPeriodsFromFirestore,
  saveSubjectQuotaToFirestore,
  getSubjectQuotaFromFirestore,
  saveDailyTeacherRowsToFirestore,
  getDailyTeacherRowsFromFirestore,
  getAllStaffTeachers,
  TeacherRecord
} from '../lib/api';
import { useBodyScrollLock } from '../hooks/useBodyScrollLock';


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

export interface GradePeriodRow {
  id: string;
  gradeName: string;
  teacherName?: string;
  subject?: string;
  section?: string;
  stage?: string;
  grade?: string;
  isComplementary?: boolean;
  originalStage?: string;
  periods: Record<string, number | '' | string>;
  planPeriods: number;
}

interface SubjectQuotaItem {
  id: string;
  name: string;
  periods: number;
}

export interface TeacherSubjectRelation {
  id: string;
  teacherId?: string;
  teacherName: string;
  subjectSpecialization?: string;
  stage: string;
  grade: string;
  targetQuota: number; // 1 to 35
  assignedSubjectIds: string[];
  isComplementary?: boolean;
  originalStage?: string;
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

// مسارات التربية الخاصة (تظهر عند اختيار تربية خاصة في نظام التعليم)
export const SPECIAL_ED_TRACK_OPTIONS = DEFAULT_SPECIAL_ED_TRACKS;

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

export const getDefaultGradeRowsForStage = (stg: string, gradesMap?: Record<string, string[]>): GradePeriodRow[] => {
  const customList = gradesMap?.[stg] || STAGE_GRADES_MAP[stg] || [];
  
  if (stg === 'متوسط' || stg.includes('متوسط')) {
    const list = customList.length > 0 ? customList : ['الأول المتوسط', 'الثاني المتوسط', 'الثالث المتوسط'];
    return list.map((g, idx) => ({
      id: `grade_m_${idx + 1}`,
      gradeName: g,
      periods: { saturday: '', sunday: 7, monday: 7, tuesday: 7, wednesday: 7, thursday: 7, friday: '' },
      planPeriods: 35
    }));
  }
  
  if (stg === 'ثانوي' || stg.includes('ثانوي')) {
    const list = customList.length > 0 ? customList : ['الأول الثانوي', 'الثاني الثانوي', 'الثالث الثانوي'];
    return list.map((g, idx) => ({
      id: `grade_s_${idx + 1}`,
      gradeName: g,
      periods: { saturday: '', sunday: 7, monday: 7, tuesday: 7, wednesday: 7, thursday: 7, friday: '' },
      planPeriods: 35
    }));
  }
  
  // ابتدائي
  const list = customList.length > 0 ? customList : [
    'الأول الابتدائي', 'الثاني الابتدائي', 'الثالث الابتدائي',
    'الرابع الابتدائي', 'الخامس الابتدائي', 'السادس الابتدائي'
  ];
  return list.map((g, idx) => ({
    id: `grade_p_${idx + 1}`,
    gradeName: g,
    periods: { saturday: '', sunday: 7, monday: 7, tuesday: 7, wednesday: 6, thursday: 6, friday: '' },
    planPeriods: 33
  }));
};

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

// 1. مواد الصفوف الأولية بالابتدائي (أول وثاني وثالث ابتدائي)
export const PRIMARY_EARLY_SUBJECTS: SubjectQuotaItem[] = [
  { id: 'p_e_1', name: 'القرآن الكريم والدراسات الاسلامية', periods: 5 },
  { id: 'p_e_2', name: 'اللغة العربية', periods: 6 },
  { id: 'p_e_3', name: 'الرياضيات', periods: 6 },
  { id: 'p_e_4', name: 'العلوم', periods: 4 },
  { id: 'p_e_5', name: 'اللغة الانجليزية', periods: 3 },
  { id: 'p_e_6', name: 'التربية الفنية', periods: 2 },
  { id: 'p_e_7', name: 'التربية البدنية والدفاع عن النفس', periods: 3 },
  { id: 'p_e_8', name: 'المهارات الحياتية والأسرية', periods: 2 },
  { id: 'p_e_9', name: 'النشاط', periods: 2 }
];

// 2. مواد باقي صفوف الابتدائي (الرابع والخامس والسادس ابتدائي)
export const PRIMARY_UPPER_SUBJECTS: SubjectQuotaItem[] = [
  { id: 'p_u_1', name: 'القرآن الكريم والدراسات الاسلامية', periods: 5 },
  { id: 'p_u_2', name: 'اللغة العربية', periods: 5 },
  { id: 'p_u_3', name: 'الدراسات الاجتماعية', periods: 2 },
  { id: 'p_u_4', name: 'الرياضيات', periods: 5 },
  { id: 'p_u_5', name: 'العلوم', periods: 4 },
  { id: 'p_u_6', name: 'اللغة الانجليزية', periods: 3 },
  { id: 'p_u_7', name: 'المهارات الرقمية', periods: 2 },
  { id: 'p_u_8', name: 'التربية الفنية', periods: 2 },
  { id: 'p_u_9', name: 'التربية البدنية والدفاع عن النفس', periods: 2 },
  { id: 'p_u_10', name: 'المهارات الحياتية والأسرية', periods: 1 },
  { id: 'p_u_11', name: 'النشاط', periods: 2 }
];

// 3. مواد المرحلة المتوسطة
export const MIDDLE_SCHOOL_SUBJECTS: SubjectQuotaItem[] = [
  { id: 'm_1', name: 'القرآن الكريم والدراسات الاسلامية', periods: 5 },
  { id: 'm_2', name: 'اللغة العربية', periods: 4 },
  { id: 'm_3', name: 'الدراسات الاجتماعية', periods: 2 },
  { id: 'm_4', name: 'الرياضيات', periods: 5 },
  { id: 'm_5', name: 'العلوم', periods: 4 },
  { id: 'm_6', name: 'اللغة الانجليزية', periods: 4 },
  { id: 'm_7', name: 'المهارات الرقمية', periods: 2 },
  { id: 'm_8', name: 'التربية الفنية', periods: 2 },
  { id: 'm_9', name: 'التربية البدنية والدفاع عن النفس', periods: 2 },
  { id: 'm_10', name: 'المهارات الحياتية والأسرية', periods: 2 },
  { id: 'm_11', name: 'التفكير الناقد', periods: 2 },
  { id: 'm_12', name: 'النشاط', periods: 2 }
];

// 4. مواد الأول الثانوي فقط
export const SECONDARY_FIRST_GRADE_SUBJECTS: SubjectQuotaItem[] = [
  { id: 's1_1', name: 'القرآن الكريم وتفسيره', periods: 3 },
  { id: 's1_2', name: 'الرياضيات', periods: 4 },
  { id: 's1_3', name: 'اللغة الانجليزية', periods: 3 },
  { id: 's1_4', name: 'الأحياء', periods: 3 },
  { id: 's1_5', name: 'الكيمياء', periods: 3 },
  { id: 's1_6', name: 'الفيزياء', periods: 3 },
  { id: 's1_7', name: 'علم البيئة', periods: 2 },
  { id: 's1_8', name: 'الحديث', periods: 2 },
  { id: 's1_9', name: 'الكفايات اللغوية', periods: 3 },
  { id: 's1_10', name: 'الدراسات الاجتماعية', periods: 2 },
  { id: 's1_11', name: 'المعرفة المالية', periods: 2 },
  { id: 's1_12', name: 'التقنية الرقمية', periods: 2 },
  { id: 's1_13', name: 'التربية الصحية والبدنية', periods: 2 },
  { id: 's1_14', name: 'التربية المهنية', periods: 1 },
  { id: 's1_15', name: 'التفكير الناقد', periods: 2 }
];

// 5. مواد الثاني الثانوي - المسار العام - الفصل الدراسي الأول
export const SECONDARY_2ND_GENERAL_SEM1: SubjectQuotaItem[] = [
  { id: 's2_g1_1', name: 'الرياضيات', periods: 5 },
  { id: 's2_g1_2', name: 'اللغة الإنجليزية', periods: 5 },
  { id: 's2_g1_3', name: 'الكيمياء', periods: 5 },
  { id: 's2_g1_4', name: 'الأحياء', periods: 4 },
  { id: 's2_g1_5', name: 'الفيزياء', periods: 4 },
  { id: 's2_g1_6', name: 'الكفايات اللغوية', periods: 4 },
  { id: 's2_g1_7', name: 'التاريخ', periods: 3 },
  { id: 's2_g1_8', name: 'النشاط', periods: 2 }
];

// 6. مواد الثاني الثانوي - المسار العام - الفصل الدراسي الثاني
export const SECONDARY_2ND_GENERAL_SEM2: SubjectQuotaItem[] = [
  { id: 's2_g2_1', name: 'الرياضيات', periods: 5 },
  { id: 's2_g2_2', name: 'اللغة الإنجليزية', periods: 5 },
  { id: 's2_g2_3', name: 'الكيمياء', periods: 5 },
  { id: 's2_g2_4', name: 'الأحياء', periods: 4 },
  { id: 's2_g2_5', name: 'التوحيد', periods: 2 },
  { id: 's2_g2_6', name: 'التقنية الرقمية', periods: 4 },
  { id: 's2_g2_7', name: 'الفنون', periods: 2 },
  { id: 's2_g2_8', name: 'اللياقة والثقافة الصحية', periods: 3 },
  { id: 's2_g2_9', name: 'النشاط', periods: 2 }
];

// 7. مواد الثالث الثانوي - المسار العام - الفصل الدراسي الأول
export const SECONDARY_3RD_GENERAL_SEM1: SubjectQuotaItem[] = [
  { id: 's3_g1_1', name: 'الرياضيات', periods: 4 },
  { id: 's3_g1_2', name: 'اللغة الإنجليزية', periods: 4 },
  { id: 's3_g1_3', name: 'الكيمياء', periods: 3 },
  { id: 's3_g1_4', name: 'الفيزياء', periods: 5 },
  { id: 's3_g1_5', name: 'علوم الأرض والفضاء', periods: 3 },
  { id: 's3_g1_6', name: 'التقنية الرقمية', periods: 2 },
  { id: 's3_g1_7', name: 'التربية الصحية والبدنية', periods: 3 },
  { id: 's3_g1_8', name: 'البحث ومصادر المعلومات', periods: 2 },
  { id: 's3_g1_9', name: 'المجال الاختياري', periods: 5 },
  { id: 's3_g1_10', name: 'النشاط', periods: 1 }
];

// 8. مواد الثالث الثانوي - المسار العام - الفصل الدراسي الثاني
export const SECONDARY_3RD_GENERAL_SEM2: SubjectQuotaItem[] = [
  { id: 's3_g2_1', name: 'الرياضيات', periods: 4 },
  { id: 's3_g2_2', name: 'اللغة الإنجليزية', periods: 4 },
  { id: 's3_g2_3', name: 'الفيزياء', periods: 5 },
  { id: 's3_g2_4', name: 'علوم الأرض والفضاء', periods: 3 },
  { id: 's3_g2_5', name: 'الفقه', periods: 2 },
  { id: 's3_g2_6', name: 'الدراسات الأدبية', periods: 2 },
  { id: 's3_g2_7', name: 'الدراسات النفسية والاجتماعية', periods: 2 },
  { id: 's3_g2_8', name: 'المواطنة الرقمية', periods: 2 },
  { id: 's3_g2_9', name: 'الجغرافيا', periods: 2 },
  { id: 's3_g2_10', name: 'المهارات الحياتية', periods: 2 },
  { id: 's3_g2_11', name: 'المجال الاختياري', periods: 2 },
  { id: 's3_g2_12', name: 'النشاط', periods: 2 }
];

// 9. مواد الثاني الثانوي - مسار علوم الحاسب والهندسة - الفصل الدراسي الأول (المجموع: 32 حصة)
export const SECONDARY_2ND_CS_ENG_SEM1: SubjectQuotaItem[] = [
  { id: 's2_cs1_1', name: 'الرياضيات', periods: 5 },
  { id: 's2_cs1_2', name: 'اللغة الإنجليزية', periods: 5 },
  { id: 's2_cs1_3', name: 'الكيمياء', periods: 5 },
  { id: 's2_cs1_4', name: 'الأحياء', periods: 4 },
  { id: 's2_cs1_5', name: 'الفيزياء', periods: 4 },
  { id: 's2_cs1_6', name: 'الكفايات اللغوية', periods: 4 },
  { id: 's2_cs1_7', name: 'الهندسة', periods: 3 },
  { id: 's2_cs1_8', name: 'النشاط', periods: 2 }
];

// 10. مواد الثاني الثانوي - مسار علوم الحاسب والهندسة - الفصل الدراسي الثاني (المجموع: 32 حصة)
export const SECONDARY_2ND_CS_ENG_SEM2: SubjectQuotaItem[] = [
  { id: 's2_cs2_1', name: 'الرياضيات', periods: 5 },
  { id: 's2_cs2_2', name: 'اللغة الإنجليزية', periods: 5 },
  { id: 's2_cs2_3', name: 'الكيمياء', periods: 5 },
  { id: 's2_cs2_4', name: 'الأحياء', periods: 4 },
  { id: 's2_cs2_5', name: 'التوحيد', periods: 2 },
  { id: 's2_cs2_6', name: 'علم البيانات', periods: 2 },
  { id: 's2_cs2_7', name: 'إنترنت الأشياء', periods: 4 },
  { id: 's2_cs2_8', name: 'اللياقة والثقافة الصحية', periods: 3 },
  { id: 's2_cs2_9', name: 'النشاط', periods: 2 }
];

// 11. مواد الثالث الثانوي - مسار علوم الحاسب والهندسة - الفصل الدراسي الأول (المجموع: 32 حصة)
export const SECONDARY_3RD_CS_ENG_SEM1: SubjectQuotaItem[] = [
  { id: 's3_cs1_1', name: 'الرياضيات', periods: 4 },
  { id: 's3_cs1_2', name: 'اللغة الإنجليزية', periods: 4 },
  { id: 's3_cs1_3', name: 'الكيمياء', periods: 3 },
  { id: 's3_cs1_4', name: 'الفيزياء', periods: 5 },
  { id: 's3_cs1_5', name: 'علوم الأرض والفضاء', periods: 3 },
  { id: 's3_cs1_6', name: 'الدراسات الأدبية', periods: 2 },
  { id: 's3_cs1_7', name: 'الذكاء الاصطناعي', periods: 2 },
  { id: 's3_cs1_8', name: 'الأمن السيبراني', periods: 2 },
  { id: 's3_cs1_9', name: 'التصميم الهندسي', periods: 3 },
  { id: 's3_cs1_10', name: 'البحث ومصادر المعلومات', periods: 2 },
  { id: 's3_cs1_11', name: 'النشاط', periods: 2 }
];

// 12. مواد الثالث الثانوي - مسار علوم الحاسب والهندسة - الفصل الدراسي الثاني (المجموع: 32 حصة)
export const SECONDARY_3RD_CS_ENG_SEM2: SubjectQuotaItem[] = [
  { id: 's3_cs2_1', name: 'الرياضيات', periods: 4 },
  { id: 's3_cs2_2', name: 'اللغة الإنجليزية', periods: 4 },
  { id: 's3_cs2_3', name: 'الفيزياء', periods: 5 },
  { id: 's3_cs2_4', name: 'علوم الأرض والفضاء', periods: 3 },
  { id: 's3_cs2_5', name: 'الفقه', periods: 2 },
  { id: 's3_cs2_6', name: 'الذكاء الاصطناعي', periods: 3 },
  { id: 's3_cs2_7', name: 'هندسة البرمجيات', periods: 3 },
  { id: 's3_cs2_8', name: 'المهارات الحياتية', periods: 2 },
  { id: 's3_cs2_9', name: 'التربية الصحية والبدنية', periods: 3 },
  { id: 's3_cs2_10', name: 'مشروع التخرج', periods: 2 },
  { id: 's3_cs2_11', name: 'النشاط', periods: 1 }
];

// 13. مواد الثاني الثانوي - مسار الصحة والحياة - الفصل الدراسي الأول (المجموع: 32 حصة)
export const SECONDARY_2ND_HEALTH_SEM1: SubjectQuotaItem[] = [
  { id: 's2_hl1_1', name: 'الرياضيات', periods: 5 },
  { id: 's2_hl1_2', name: 'اللغة الإنجليزية', periods: 5 },
  { id: 's2_hl1_3', name: 'الكيمياء', periods: 5 },
  { id: 's2_hl1_4', name: 'الأحياء', periods: 4 },
  { id: 's2_hl1_5', name: 'الكفايات اللغوية', periods: 4 },
  { id: 's2_hl1_6', name: 'التقنية الرقمية', periods: 4 },
  { id: 's2_hl1_7', name: 'مبادئ العلوم الصحية', periods: 3 },
  { id: 's2_hl1_8', name: 'النشاط', periods: 2 }
];

// 14. مواد الثاني الثانوي - مسار الصحة والحياة - الفصل الدراسي الثاني (المجموع: 32 حصة)
export const SECONDARY_2ND_HEALTH_SEM2: SubjectQuotaItem[] = [
  { id: 's2_hl2_1', name: 'الرياضيات', periods: 5 },
  { id: 's2_hl2_2', name: 'اللغة الإنجليزية', periods: 5 },
  { id: 's2_hl2_3', name: 'الكيمياء', periods: 5 },
  { id: 's2_hl2_4', name: 'الأحياء', periods: 4 },
  { id: 's2_hl2_5', name: 'الفيزياء', periods: 4 },
  { id: 's2_hl2_6', name: 'التوحيد', periods: 2 },
  { id: 's2_hl2_7', name: 'مبادئ العلوم الصحية', periods: 2 },
  { id: 's2_hl2_8', name: 'اللياقة والثقافة الصحية', periods: 3 },
  { id: 's2_hl2_9', name: 'النشاط', periods: 2 }
];

// 15. مواد الثالث الثانوي - مسار الصحة والحياة - الفصل الدراسي الأول (المجموع: 32 حصة)
export const SECONDARY_3RD_HEALTH_SEM1: SubjectQuotaItem[] = [
  { id: 's3_hl1_1', name: 'الرياضيات', periods: 4 },
  { id: 's3_hl1_2', name: 'اللغة الإنجليزية', periods: 4 },
  { id: 's3_hl1_3', name: 'الكيمياء', periods: 3 },
  { id: 's3_hl1_4', name: 'الفيزياء', periods: 5 },
  { id: 's3_hl1_5', name: 'علوم الأرض والفضاء', periods: 3 },
  { id: 's3_hl1_6', name: 'الدراسات الأدبية', periods: 2 },
  { id: 's3_hl1_7', name: 'الرعاية الصحية', periods: 3 },
  { id: 's3_hl1_8', name: 'أنظمة جسم الإنسان', periods: 3 },
  { id: 's3_hl1_9', name: 'الإحصاء', periods: 2 },
  { id: 's3_hl1_10', name: 'البحث ومصادر المعلومات', periods: 2 },
  { id: 's3_hl1_11', name: 'النشاط', periods: 1 }
];

// 16. مواد الثالث الثانوي - مسار الصحة والحياة - الفصل الدراسي الثاني (المجموع: 32 حصة)
export const SECONDARY_3RD_HEALTH_SEM2: SubjectQuotaItem[] = [
  { id: 's3_hl2_1', name: 'الرياضيات', periods: 4 },
  { id: 's3_hl2_2', name: 'اللغة الإنجليزية', periods: 4 },
  { id: 's3_hl2_3', name: 'الفيزياء', periods: 5 },
  { id: 's3_hl2_4', name: 'علوم الأرض والفضاء', periods: 3 },
  { id: 's3_hl2_5', name: 'الفقه', periods: 2 },
  { id: 's3_hl2_6', name: 'الرعاية الصحية', periods: 3 },
  { id: 's3_hl2_7', name: 'أنظمة جسم الإنسان', periods: 2 },
  { id: 's3_hl2_8', name: 'المهارات الحياتية', periods: 2 },
  { id: 's3_hl2_9', name: 'التربية الصحية والبدنية', periods: 3 },
  { id: 's3_hl2_10', name: 'مشروع التخرج', periods: 2 },
  { id: 's3_hl2_11', name: 'النشاط', periods: 2 }
];

// 17. مواد الثاني الثانوي - مسار إدارة الأعمال - الفصل الدراسي الأول (المجموع: 32 حصة)
export const SECONDARY_2ND_BUSINESS_SEM1: SubjectQuotaItem[] = [
  { id: 's2_bs1_1', name: 'اللغة الإنجليزية', periods: 5 },
  { id: 's2_bs1_2', name: 'التوحيد', periods: 2 },
  { id: 's2_bs1_3', name: 'الكفايات اللغوية', periods: 4 },
  { id: 's2_bs1_4', name: 'صناعة القرار في الأعمال', periods: 5 },
  { id: 's2_bs1_5', name: 'مقدمة في الأعمال', periods: 4 },
  { id: 's2_bs1_6', name: 'الإدارة المالية', periods: 3 },
  { id: 's2_bs1_7', name: 'التقنية الرقمية', periods: 4 },
  { id: 's2_bs1_8', name: 'الفنون', periods: 2 },
  { id: 's2_bs1_9', name: 'النشاط', periods: 3 }
];

// 18. مواد الثاني الثانوي - مسار إدارة الأعمال - الفصل الدراسي الثاني (المجموع: 32 حصة)
export const SECONDARY_2ND_BUSINESS_SEM2: SubjectQuotaItem[] = [
  { id: 's2_bs2_1', name: 'اللغة الإنجليزية', periods: 5 },
  { id: 's2_bs2_2', name: 'التفسير', periods: 2 },
  { id: 's2_bs2_3', name: 'الدراسات اللغوية', periods: 3 },
  { id: 's2_bs2_4', name: 'صناعة القرار في الأعمال', periods: 4 },
  { id: 's2_bs2_5', name: 'مقدمة في الأعمال', periods: 3 },
  { id: 's2_bs2_6', name: 'مبادئ الاقتصاد', periods: 3 },
  { id: 's2_bs2_7', name: 'الإدارة المالية', periods: 3 },
  { id: 's2_bs2_8', name: 'التاريخ', periods: 3 },
  { id: 's2_bs2_9', name: 'اللياقة والثقافة الصحية', periods: 3 },
  { id: 's2_bs2_10', name: 'النشاط', periods: 3 }
];

// 19. مواد الثالث الثانوي - مسار إدارة الأعمال - الفصل الدراسي الأول (المجموع: 32 حصة)
export const SECONDARY_3RD_BUSINESS_SEM1: SubjectQuotaItem[] = [
  { id: 's3_bs1_1', name: 'اللغة الإنجليزية', periods: 4 },
  { id: 's3_bs1_2', name: 'الفقه', periods: 2 },
  { id: 's3_bs1_3', name: 'الدراسات الأدبية', periods: 2 },
  { id: 's3_bs1_4', name: 'مبادئ الإدارة', periods: 3 },
  { id: 's3_bs1_5', name: 'إدارة الفعاليات', periods: 4 },
  { id: 's3_bs1_6', name: 'تخطيط الحملات التسويقية', periods: 3 },
  { id: 's3_bs1_7', name: 'مبادئ القانون', periods: 3 },
  { id: 's3_bs1_8', name: 'الإحصاء', periods: 2 },
  { id: 's3_bs1_9', name: 'الجغرافيا', periods: 2 },
  { id: 's3_bs1_10', name: 'التربية الصحية والبدنية', periods: 3 },
  { id: 's3_bs1_11', name: 'البحث ومصادر المعلومات', periods: 2 },
  { id: 's3_bs1_12', name: 'النشاط', periods: 2 }
];

// 20. مواد الثالث الثانوي - مسار إدارة الأعمال - الفصل الدراسي الثاني (المجموع: 32 حصة)
export const SECONDARY_3RD_BUSINESS_SEM2: SubjectQuotaItem[] = [
  { id: 's3_bs2_1', name: 'اللغة الإنجليزية', periods: 4 },
  { id: 's3_bs2_2', name: 'الدراسات النفسية والاجتماعية', periods: 2 },
  { id: 's3_bs2_3', name: 'الدراسات البلاغية والنقدية', periods: 3 },
  { id: 's3_bs2_4', name: 'إدارة الفعاليات', periods: 3 },
  { id: 's3_bs2_5', name: 'تخطيط الحملات التسويقية', periods: 4 },
  { id: 's3_bs2_6', name: 'السكرتارية والإدارة المكتبية', periods: 3 },
  { id: 's3_bs2_7', name: 'مبادئ القانون', periods: 4 },
  { id: 's3_bs2_8', name: 'تطبيقات في القانون', periods: 2 },
  { id: 's3_bs2_9', name: 'المواطنة الرقمية', periods: 2 },
  { id: 's3_bs2_10', name: 'المهارات الحياتية', periods: 2 },
  { id: 's3_bs2_11', name: 'مشروع التخرج', periods: 2 },
  { id: 's3_bs2_12', name: 'النشاط', periods: 1 }
];

// 21. مواد التربية الخاصة - مسار اضطراب طيف التوحد - الصفوف الأولية بالمرحلة الابتدائية (الأول، الثاني، الثالث) - الفصلين الأول والثاني (المجموع: 30 حصة)
export const SPED_AUTISM_PRIMARY_EARLY: SubjectQuotaItem[] = [
  { id: 'sped_aut_pe_1', name: 'مجال التواصل', periods: 5 },
  { id: 'sped_aut_pe_2', name: 'المجال الأكاديمي', periods: 12 },
  { id: 'sped_aut_pe_3', name: 'مجال المهارات الحياتية', periods: 4 },
  { id: 'sped_aut_pe_4', name: 'مجال التربية البدنية والدفاع عن النفس', periods: 4 },
  { id: 'sped_aut_pe_5', name: 'مجال الفنون', periods: 3 },
  { id: 'sped_aut_pe_6', name: 'النشاط', periods: 2 }
];

// 22. مواد التربية الخاصة - مسار اضطراب طيف التوحد - الصفوف العليا بالمرحلة الابتدائية (الرابع، الخامس، السادس) - الفصلين الأول والثاني (المجموع: 30 حصة)
export const SPED_AUTISM_PRIMARY_UPPER: SubjectQuotaItem[] = [
  { id: 'sped_aut_pu_1', name: 'مجال التواصل', periods: 5 },
  { id: 'sped_aut_pu_2', name: 'المجال الأكاديمي', periods: 14 },
  { id: 'sped_aut_pu_3', name: 'مجال المهارات الحياتية', periods: 3 },
  { id: 'sped_aut_pu_4', name: 'مجال التربية البدنية والدفاع عن النفس', periods: 2 },
  { id: 'sped_aut_pu_5', name: 'مجال الفنون', periods: 3 },
  { id: 'sped_aut_pu_6', name: 'مجال المهارات الرقمية', periods: 1 },
  { id: 'sped_aut_pu_7', name: 'النشاط', periods: 2 }
];

// 23. مواد التربية الخاصة - مسار اضطراب طيف التوحد - المرحلة المتوسطة (الأول، الثاني، الثالث المتوسط) - الفصلين الأول والثاني (المجموع: 35 حصة)
export const SPED_AUTISM_MIDDLE: SubjectQuotaItem[] = [
  { id: 'sped_aut_mid_1', name: 'مجال التواصل', periods: 5 },
  { id: 'sped_aut_mid_2', name: 'المجال الأكاديمي', periods: 14 },
  { id: 'sped_aut_mid_3', name: 'مجال المهارات الحياتية', periods: 4 },
  { id: 'sped_aut_mid_4', name: 'مجال التربية البدنية والدفاع عن النفس', periods: 3 },
  { id: 'sped_aut_mid_5', name: 'مجال الفنون', periods: 3 },
  { id: 'sped_aut_mid_6', name: 'مجال المهارات الرقمية', periods: 2 },
  { id: 'sped_aut_mid_7', name: 'النشاط والتدريب المهني', periods: 4 }
];

// 24. مواد التربية الخاصة - مسار اضطراب طيف التوحد - المرحلة التأهيلية / الثانوية (الأول، الثاني، الثالث التأهيلي/الثانوي) - الفصلين الأول والثاني (المجموع: 35 حصة)
export const SPED_AUTISM_SECONDARY_REHAB: SubjectQuotaItem[] = [
  { id: 'sped_aut_sec_1', name: 'مجال التواصل', periods: 3 },
  { id: 'sped_aut_sec_2', name: 'المجال الأكاديمي', periods: 11 },
  { id: 'sped_aut_sec_3', name: 'مجال المهارات الحياتية', periods: 2 },
  { id: 'sped_aut_sec_4', name: 'مجال التربية البدنية والدفاع عن النفس', periods: 3 },
  { id: 'sped_aut_sec_5', name: 'مجال الفنون', periods: 3 },
  { id: 'sped_aut_sec_6', name: 'مجال المهارات الرقمية', periods: 3 },
  { id: 'sped_aut_sec_7', name: 'مجال المهارات المهنية', periods: 5 },
  { id: 'sped_aut_sec_8', name: 'النشاط والتدريب المهني', periods: 5 }
];

// 25. مواد التربية الخاصة - مسار التربية الفكرية - الصفوف الأولية بالمرحلة الابتدائية (الأول، الثاني، الثالث) - الفصلين الأول والثاني (المجموع: 30 حصة)
export const SPED_INTELLECTUAL_PRIMARY_EARLY: SubjectQuotaItem[] = [
  { id: 'sped_int_pe_1', name: 'القرآن الكريم والدراسات الإسلامية', periods: 4 },
  { id: 'sped_int_pe_2', name: 'اللغة العربية', periods: 5 },
  { id: 'sped_int_pe_3', name: 'الرياضيات', periods: 5 },
  { id: 'sped_int_pe_4', name: 'العلوم', periods: 2 },
  { id: 'sped_int_pe_5', name: 'اللغة الإنجليزية', periods: 1 },
  { id: 'sped_int_pe_6', name: 'التربية الفنية', periods: 3 },
  { id: 'sped_int_pe_7', name: 'التربية البدنية والدفاع عن النفس', periods: 4 },
  { id: 'sped_int_pe_8', name: 'المهارات الحياتية والأسرية', periods: 4 },
  { id: 'sped_int_pe_9', name: 'النشاط', periods: 2 }
];

// 26. مواد التربية الخاصة - مسار التربية الفكرية - الصفوف العليا بالمرحلة الابتدائية (الرابع، الخامس، السادس) - الفصلين الأول والثاني (المجموع: 30 حصة)
export const SPED_INTELLECTUAL_PRIMARY_UPPER: SubjectQuotaItem[] = [
  { id: 'sped_int_pu_1', name: 'القرآن الكريم والدراسات الإسلامية', periods: 4 },
  { id: 'sped_int_pu_2', name: 'اللغة العربية', periods: 5 },
  { id: 'sped_int_pu_3', name: 'الدراسات الاجتماعية', periods: 2 },
  { id: 'sped_int_pu_4', name: 'الرياضيات', periods: 5 },
  { id: 'sped_int_pu_5', name: 'العلوم', periods: 2 },
  { id: 'sped_int_pu_6', name: 'اللغة الإنجليزية', periods: 1 },
  { id: 'sped_int_pu_7', name: 'المهارات الرقمية', periods: 1 },
  { id: 'sped_int_pu_8', name: 'التربية الفنية', periods: 3 },
  { id: 'sped_int_pu_9', name: 'التربية البدنية والدفاع عن النفس', periods: 2 },
  { id: 'sped_int_pu_10', name: 'المهارات الحياتية والأسرية', periods: 3 },
  { id: 'sped_int_pu_11', name: 'النشاط', periods: 2 }
];

// 27. مواد التربية الخاصة - مسار التربية الفكرية - المرحلة المتوسطة (الأول، الثاني، الثالث المتوسط) - الفصلين الأول والثاني (المجموع: 35 حصة)
export const SPED_INTELLECTUAL_MIDDLE: SubjectQuotaItem[] = [
  { id: 'sped_int_mid_1', name: 'القرآن الكريم والدراسات الإسلامية', periods: 4 },
  { id: 'sped_int_mid_2', name: 'اللغة العربية', periods: 4 },
  { id: 'sped_int_mid_3', name: 'الدراسات الاجتماعية', periods: 1 },
  { id: 'sped_int_mid_4', name: 'الرياضيات', periods: 4 },
  { id: 'sped_int_mid_5', name: 'العلوم', periods: 4 },
  { id: 'sped_int_mid_6', name: 'اللغة الإنجليزية', periods: 1 },
  { id: 'sped_int_mid_7', name: 'المهارات الرقمية', periods: 2 },
  { id: 'sped_int_mid_8', name: 'التربية الفنية', periods: 3 },
  { id: 'sped_int_mid_9', name: 'التربية البدنية والدفاع عن النفس', periods: 3 },
  { id: 'sped_int_mid_10', name: 'المهارات الحياتية والأسرية', periods: 4 },
  { id: 'sped_int_mid_11', name: 'النشاط والتدريب المهني', periods: 5 }
];

// 28. مواد التربية الخاصة - مسار التربية الفكرية - المرحلة التأهيلية / الثانوية (الأول، الثاني، الثالث التأهيلي/الثانوي) - الفصلين الأول والثاني (المجموع: 35 حصة)
export const SPED_INTELLECTUAL_SECONDARY_REHAB: SubjectQuotaItem[] = [
  { id: 'sped_int_sec_1', name: 'القرآن الكريم والدراسات الإسلامية', periods: 4 },
  { id: 'sped_int_sec_2', name: 'اللغة العربية', periods: 4 },
  { id: 'sped_int_sec_3', name: 'الرياضيات', periods: 5 },
  { id: 'sped_int_sec_4', name: 'اللغة الإنجليزية', periods: 2 },
  { id: 'sped_int_sec_5', name: 'المهارات الرقمية', periods: 4 },
  { id: 'sped_int_sec_6', name: 'التربية الفنية', periods: 3 },
  { id: 'sped_int_sec_7', name: 'التربية البدنية والدفاع عن النفس', periods: 3 },
  { id: 'sped_int_sec_8', name: 'المهارات المهنية', periods: 5 },
  { id: 'sped_int_sec_9', name: 'النشاط والتدريب المهني', periods: 5 }
];

// 29. مواد التربية الخاصة - مسار تعدد الإعاقات - الصفوف الأولية بالمرحلة الابتدائية (الصفوف 1، 2، 3) - الفصلين الأول والثاني (المجموع: 30 حصة)
export const SPED_MULTIPLE_PRIMARY_EARLY: SubjectQuotaItem[] = [
  { id: 'sped_mul_pe_1', name: 'القرآن الكريم والدراسات الإسلامية', periods: 4 },
  { id: 'sped_mul_pe_2', name: 'اللغة العربية', periods: 5 },
  { id: 'sped_mul_pe_3', name: 'الرياضيات', periods: 5 },
  { id: 'sped_mul_pe_4', name: 'العلوم', periods: 2 },
  { id: 'sped_mul_pe_5', name: 'اللغة الإنجليزية', periods: 1 },
  { id: 'sped_mul_pe_6', name: 'التربية الفنية', periods: 3 },
  { id: 'sped_mul_pe_7', name: 'التربية البدنية والدفاع عن النفس', periods: 4 },
  { id: 'sped_mul_pe_8', name: 'المهارات الحياتية والأسرية', periods: 4 },
  { id: 'sped_mul_pe_9', name: 'النشاط', periods: 2 }
];

// 30. مواد التربية الخاصة - مسار تعدد الإعاقات - الصفوف العليا بالمرحلة الابتدائية (الصفوف 4، 5، 6) - الفصلين الأول والثاني (المجموع: 30 حصة)
export const SPED_MULTIPLE_PRIMARY_UPPER: SubjectQuotaItem[] = [
  { id: 'sped_mul_pu_1', name: 'القرآن الكريم والدراسات الإسلامية', periods: 4 },
  { id: 'sped_mul_pu_2', name: 'اللغة العربية', periods: 5 },
  { id: 'sped_mul_pu_3', name: 'الدراسات الاجتماعية', periods: 2 },
  { id: 'sped_mul_pu_4', name: 'الرياضيات', periods: 5 },
  { id: 'sped_mul_pu_5', name: 'العلوم', periods: 2 },
  { id: 'sped_mul_pu_6', name: 'اللغة الإنجليزية', periods: 1 },
  { id: 'sped_mul_pu_7', name: 'المهارات الرقمية', periods: 1 },
  { id: 'sped_mul_pu_8', name: 'التربية الفنية', periods: 3 },
  { id: 'sped_mul_pu_9', name: 'التربية البدنية والدفاع عن النفس', periods: 2 },
  { id: 'sped_mul_pu_10', name: 'المهارات الحياتية والأسرية', periods: 3 },
  { id: 'sped_mul_pu_11', name: 'النشاط', periods: 2 }
];

// 31. مواد التربية الخاصة - مسار تعدد الإعاقات - المرحلة المتوسطة (الأول، الثاني، الثالث المتوسط) - الفصلين الأول والثاني (المجموع: 35 حصة)
export const SPED_MULTIPLE_MIDDLE: SubjectQuotaItem[] = [
  { id: 'sped_mul_mid_1', name: 'القرآن الكريم والدراسات الإسلامية', periods: 4 },
  { id: 'sped_mul_mid_2', name: 'اللغة العربية', periods: 4 },
  { id: 'sped_mul_mid_3', name: 'الدراسات الاجتماعية', periods: 1 },
  { id: 'sped_mul_mid_4', name: 'الرياضيات', periods: 4 },
  { id: 'sped_mul_mid_5', name: 'العلوم', periods: 4 },
  { id: 'sped_mul_mid_6', name: 'اللغة الإنجليزية', periods: 1 },
  { id: 'sped_mul_mid_7', name: 'المهارات الرقمية', periods: 2 },
  { id: 'sped_mul_mid_8', name: 'التربية الفنية', periods: 3 },
  { id: 'sped_mul_mid_9', name: 'التربية البدنية والدفاع عن النفس', periods: 3 },
  { id: 'sped_mul_mid_10', name: 'المهارات الحياتية والأسرية', periods: 4 },
  { id: 'sped_mul_mid_11', name: 'النشاط والتدريب المهني', periods: 5 }
];

// 32. مواد التربية الخاصة - مسار تعدد الإعاقات - المرحلة التأهيلية / الثانوية (الأول، الثاني، الثالث التأهيلي/الثانوي) - الفصلين الأول والثاني (المجموع: 35 حصة)
export const SPED_MULTIPLE_SECONDARY_REHAB: SubjectQuotaItem[] = [
  { id: 'sped_mul_sec_1', name: 'القرآن الكريم والدراسات الإسلامية', periods: 4 },
  { id: 'sped_mul_sec_2', name: 'اللغة العربية', periods: 4 },
  { id: 'sped_mul_sec_3', name: 'الرياضيات', periods: 5 },
  { id: 'sped_mul_sec_4', name: 'اللغة الإنجليزية', periods: 2 },
  { id: 'sped_mul_sec_5', name: 'المهارات الرقمية', periods: 4 },
  { id: 'sped_mul_sec_6', name: 'التربية الفنية', periods: 3 },
  { id: 'sped_mul_sec_7', name: 'التربية البدنية والدفاع عن النفس', periods: 3 },
  { id: 'sped_mul_sec_8', name: 'المهارات المهنية', periods: 5 },
  { id: 'sped_mul_sec_9', name: 'النشاط والتدريب المهني', periods: 5 }
];

// دالة توليد المواد المعتمدة بحسب المرحلة والصف والمسار والفصل وفق طلب المستخدم
export const getDefaultSubjectsForSelection = (
  system: string,
  stage: string,
  grade: string,
  track: string,
  semester: string,
  specialEdTrack?: string
): SubjectQuotaItem[] => {
  // برامج التربية الخاصة
  if (system === 'تربية خاصة' || system.includes('تربية خاصة')) {
    const isMultiple = Boolean(
      specialEdTrack && (
        specialEdTrack.includes('تعدد') || 
        specialEdTrack.includes('إعاق') || 
        specialEdTrack.includes('اعاق')
      )
    );

    // 1. مسار تعدد الإعاقات
    if (isMultiple) {
      // أ. المرحلة الابتدائية
      if (stage === 'ابتدائي') {
        // صفوف أول وثاني وثالث ابتدائي (الصفوف الأولية)
        if (
          grade.includes('الأول') || grade.includes('الثاني') || grade.includes('الثالث') ||
          grade.includes('اول') || grade.includes('ثاني') || grade.includes('ثالث') ||
          grade.includes('1') || grade.includes('2') || grade.includes('3')
        ) {
          return [...SPED_MULTIPLE_PRIMARY_EARLY];
        }
        // صفوف رابع وخامس وسادس ابتدائي (الصفوف العليا)
        return [...SPED_MULTIPLE_PRIMARY_UPPER];
      }

      // ب. المرحلة المتوسطة
      if (stage === 'متوسط') {
        return [...SPED_MULTIPLE_MIDDLE];
      }

      // ج. المرحلة التأهيلية أو الثانوية
      if (stage === 'ثانوي' || stage === 'تأهيلي' || stage.includes('ثانوي') || stage.includes('تأهيل')) {
        return [...SPED_MULTIPLE_SECONDARY_REHAB];
      }

      return [...SPED_MULTIPLE_PRIMARY_EARLY];
    }

    const isIntellectual = Boolean(
      specialEdTrack && (
        specialEdTrack.includes('فكرية') || 
        specialEdTrack.includes('الفكرية') || 
        specialEdTrack.includes('فكريه')
      )
    );

    // 2. مسار التربية الفكرية
    if (isIntellectual) {
      // أ. المرحلة الابتدائية
      if (stage === 'ابتدائي') {
        // صفوف أول وثاني وثالث ابتدائي (الصفوف الأولية)
        if (
          grade.includes('الأول') || grade.includes('الثاني') || grade.includes('الثالث') ||
          grade.includes('اول') || grade.includes('ثاني') || grade.includes('ثالث') ||
          grade.includes('1') || grade.includes('2') || grade.includes('3')
        ) {
          return [...SPED_INTELLECTUAL_PRIMARY_EARLY];
        }
        // صفوف رابع وخامس وسادس ابتدائي (الصفوف العليا)
        return [...SPED_INTELLECTUAL_PRIMARY_UPPER];
      }

      // ب. المرحلة المتوسطة
      if (stage === 'متوسط') {
        return [...SPED_INTELLECTUAL_MIDDLE];
      }

      // ج. المرحلة التأهيلية أو الثانوية
      if (stage === 'ثانوي' || stage === 'تأهيلي' || stage.includes('ثانوي') || stage.includes('تأهيل')) {
        return [...SPED_INTELLECTUAL_SECONDARY_REHAB];
      }

      return [...SPED_INTELLECTUAL_PRIMARY_EARLY];
    }

    const isAutism = 
      !specialEdTrack || 
      specialEdTrack.includes('توحد') || 
      specialEdTrack.includes('طيف') || 
      specialEdTrack.includes('اطراب') || 
      specialEdTrack.includes('اضطراب');

    // 3. مسار اضطراب طيف التوحد
    if (isAutism) {
      // أ. المرحلة الابتدائية
      if (stage === 'ابتدائي') {
        // صفوف أول وثاني وثالث ابتدائي (الصفوف الأولية)
        if (
          grade.includes('الأول') || grade.includes('الثاني') || grade.includes('الثالث') ||
          grade.includes('اول') || grade.includes('ثاني') || grade.includes('ثالث') ||
          grade.includes('1') || grade.includes('2') || grade.includes('3')
        ) {
          return [...SPED_AUTISM_PRIMARY_EARLY];
        }
        // صفوف رابع وخامس وسادس ابتدائي (الصفوف العليا)
        return [...SPED_AUTISM_PRIMARY_UPPER];
      }

      // ب. المرحلة المتوسطة
      if (stage === 'متوسط') {
        return [...SPED_AUTISM_MIDDLE];
      }

      // ج. المرحلة التأهيلية أو الثانوية
      if (stage === 'ثانوي' || stage === 'تأهيلي' || stage.includes('ثانوي') || stage.includes('تأهيل')) {
        return [...SPED_AUTISM_SECONDARY_REHAB];
      }

      return [...SPED_AUTISM_PRIMARY_EARLY];
    }

    return [];
  }

  // 1. المرحلة الابتدائية
  if (stage === 'ابتدائي') {
    // صفوف أول وثاني وثالث ابتدائي
    if (
      grade.includes('الأول') || grade.includes('الثاني') || grade.includes('الثالث') ||
      grade.includes('اول') || grade.includes('ثاني') || grade.includes('ثالث')
    ) {
      return [...PRIMARY_EARLY_SUBJECTS];
    }
    // باقي صفوف الابتدائي (الرابع والخامس والسادس)
    return [...PRIMARY_UPPER_SUBJECTS];
  }

  // 2. المرحلة المتوسطة
  if (stage === 'متوسط') {
    return [...MIDDLE_SCHOOL_SUBJECTS];
  }

  // 3. المرحلة الثانوية
  if (stage === 'ثانوي') {
    // الأول الثانوي
    if (grade.includes('الأول') || grade.includes('أول') || grade.includes('اول')) {
      return [...SECONDARY_FIRST_GRADE_SUBJECTS];
    }

    const isCsEngTrack = Boolean(
      track && (
        track === 'مسار علوم الحاسب والهندسة' ||
        track.includes('علوم الحاسب') ||
        track.includes('الحاسب') ||
        track === 'مسار هندسة'
      )
    );

    const isHealthTrack = Boolean(
      track && (
        track === 'مسار الصحة والحياة' ||
        track.includes('الصحة والحياة') ||
        track.includes('الصحة') ||
        track.includes('صحة وحياة') ||
        track.includes('صحة')
      )
    );

    const isBusinessTrack = Boolean(
      track && (
        track === 'مسار إدارة الأعمال' ||
        track.includes('إدارة الأعمال') ||
        track.includes('ادارة الاعمال') ||
        track.includes('إدارة أعمال') ||
        track.includes('إدارة') ||
        track.includes('ادارة') ||
        track.includes('الأعمال')
      )
    );

    // الثاني الثانوي
    if (grade.includes('الثاني') || grade.includes('ثاني')) {
      // مسار علوم الحاسب والهندسة
      if (isCsEngTrack) {
        if (semester === 'الفصل الدراسي الثاني' || semester.includes('الثاني')) {
          return [...SECONDARY_2ND_CS_ENG_SEM2];
        }
        return [...SECONDARY_2ND_CS_ENG_SEM1];
      }

      // مسار الصحة والحياة
      if (isHealthTrack) {
        if (semester === 'الفصل الدراسي الثاني' || semester.includes('الثاني')) {
          return [...SECONDARY_2ND_HEALTH_SEM2];
        }
        return [...SECONDARY_2ND_HEALTH_SEM1];
      }

      // مسار إدارة الأعمال
      if (isBusinessTrack) {
        if (semester === 'الفصل الدراسي الثاني' || semester.includes('الثاني')) {
          return [...SECONDARY_2ND_BUSINESS_SEM2];
        }
        return [...SECONDARY_2ND_BUSINESS_SEM1];
      }

      // المسار العام
      if (!track || track === 'مسار عام' || track.includes('عام')) {
        if (semester === 'الفصل الدراسي الثاني' || semester.includes('الثاني')) {
          return [...SECONDARY_2ND_GENERAL_SEM2];
        }
        return [...SECONDARY_2ND_GENERAL_SEM1];
      }
    }

    // الثالث الثانوي
    if (grade.includes('الثالث') || grade.includes('ثالث')) {
      // مسار علوم الحاسب والهندسة
      if (isCsEngTrack) {
        if (semester === 'الفصل الدراسي الثاني' || semester.includes('الثاني')) {
          return [...SECONDARY_3RD_CS_ENG_SEM2];
        }
        return [...SECONDARY_3RD_CS_ENG_SEM1];
      }

      // مسار الصحة والحياة
      if (isHealthTrack) {
        if (semester === 'الفصل الدراسي الثاني' || semester.includes('الثاني')) {
          return [...SECONDARY_3RD_HEALTH_SEM2];
        }
        return [...SECONDARY_3RD_HEALTH_SEM1];
      }

      // مسار إدارة الأعمال
      if (isBusinessTrack) {
        if (semester === 'الفصل الدراسي الثاني' || semester.includes('الثاني')) {
          return [...SECONDARY_3RD_BUSINESS_SEM2];
        }
        return [...SECONDARY_3RD_BUSINESS_SEM1];
      }

      // المسار العام
      if (!track || track === 'مسار عام' || track.includes('عام')) {
        if (semester === 'الفصل الدراسي الثاني' || semester.includes('الثاني')) {
          return [...SECONDARY_3RD_GENERAL_SEM2];
        }
        return [...SECONDARY_3RD_GENERAL_SEM1];
      }
    }
  }

  return [];
};

export const AssignmentsScreen: React.FC<AssignmentsScreenProps> = ({
  onBack,
  academicYear,
  complexName,
  isAdmin = false
}) => {
  // منع تمرير الشاشة الرئيسية في الخلفية عند فتح هذه النافذة المنبثقة
  useBodyScrollLock(true);

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

  // 1.5 خيارات مسار التربية الخاصة (اضطراب طيف التوحد، التربية الفكرية، تعدد الإعاقات)
  const [specialEdTrackOptions, setSpecialEdTrackOptions] = useState<string[]>(() => 
    loadCustomOptions('custom_special_ed_tracks_v1', DEFAULT_SPECIAL_ED_TRACKS)
  );
  const [specialEdTrack, setSpecialEdTrack] = useState<string>(() => 
    specialEdTrackOptions[0] || 'اضطراب طيف التوحد'
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
    fetchCustomOptionsFromFirestore('custom_special_ed_tracks_v1', DEFAULT_SPECIAL_ED_TRACKS).then(setSpecialEdTrackOptions);
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

  // هل يظهر حقل مسار التربية الخاصة؟ (عند اختيار نظام التعليم تربية خاصة)
  const isSpecialEdTrackVisible = 
    studySystem === 'تربية خاصة' || 
    studySystem.includes('تربية خاصة');

  // هل يظهر حقل المسار التخصصي؟
  const isSecondaryTrackVisible = 
    !isSpecialEdTrackVisible &&
    selectedStage === 'ثانوي' && 
    (selectedGrade.includes('الثاني') || selectedGrade.includes('الثالث') || selectedGrade.includes('ثاني ثانوي') || selectedGrade.includes('ثالث ثانوي'));

  // قائمة المواد المعروضة للاختيار الحالي يتم تهيئتها بالمواد المعتمدة
  const [subjectsList, setSubjectsList] = useState<SubjectQuotaItem[]>(() => 
    getDefaultSubjectsForSelection(studySystem, selectedStage, selectedGrade, secondaryTrack, selectedSemester, specialEdTrack)
  );
  
  // حالة تعديل مادة
  const [editingSubject, setEditingSubject] = useState<SubjectQuotaItem | null>(null);
  const [showAddSubjectModal, setShowAddSubjectModal] = useState(false);
  const [newSubjectName, setNewSubjectName] = useState('');
  const [newSubjectPeriods, setNewSubjectPeriods] = useState<number>(3);

  // حالة نافذة إدارة الخيارات للأدمن
  type AssignmentOptionField = 'studySystem' | 'specialEdTrack' | 'stage' | 'grade' | 'secondaryTrack' | 'semester' | 'dailySection' | 'relationSection';

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
      loadSubjectsForCurrentSelection(newOpt, selectedStage, selectedGrade, secondaryTrack, selectedSemester, true, specialEdTrack);
    } else if (key === 'specialEdTrack') {
      const updated = [...specialEdTrackOptions, newOpt];
      setSpecialEdTrackOptions(updated);
      saveCustomOptions('custom_special_ed_tracks_v1', updated);
      setSpecialEdTrack(newOpt);
      loadSubjectsForCurrentSelection(studySystem, selectedStage, selectedGrade, secondaryTrack, selectedSemester, true, newOpt);
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
      loadSubjectsForCurrentSelection(studySystem, newOpt, firstGrd, secondaryTrack, selectedSemester, true, specialEdTrack);
    } else if (key === 'grade') {
      const currentGrades = stageGradesMap[selectedStage] || STAGE_GRADES_MAP[selectedStage] || [];
      const updatedGrades = [...currentGrades, newOpt];
      const updatedMap = { ...stageGradesMap, [selectedStage]: updatedGrades };
      setStageGradesMap(updatedMap);
      try {
        localStorage.setItem('custom_stage_grades_map_v1', JSON.stringify(updatedMap));
      } catch {}
      setSelectedGrade(newOpt);
      loadSubjectsForCurrentSelection(studySystem, selectedStage, newOpt, secondaryTrack, selectedSemester, true, specialEdTrack);
    } else if (key === 'secondaryTrack') {
      const updated = [...secondaryTrackOptions, newOpt];
      setSecondaryTrackOptions(updated);
      saveCustomOptions('custom_secondary_tracks_v1', updated);
      setSecondaryTrack(newOpt);
      loadSubjectsForCurrentSelection(studySystem, selectedStage, selectedGrade, newOpt, selectedSemester, true, specialEdTrack);
    } else if (key === 'semester') {
      const updated = [...semesterOptions, newOpt];
      setSemesterOptions(updated);
      saveCustomOptions('custom_semesters_v1', updated);
      setSelectedSemester(newOpt);
      loadSubjectsForCurrentSelection(studySystem, selectedStage, selectedGrade, secondaryTrack, newOpt, true, specialEdTrack);
    } else if (key === 'dailySection') {
      const updated = [...sectionOptions, newOpt];
      setSectionOptions(updated);
      saveCustomOptions('custom_teacher_sections_v1', updated);
      setSelectedDailySection(newOpt);
      loadDailyRowsForSelection(newOpt, selectedStage, selectedGrade, true);
    } else if (key === 'relationSection') {
      const updated = [...sectionOptions, newOpt];
      setSectionOptions(updated);
      saveCustomOptions('custom_teacher_sections_v1', updated);
      setSelectedRelationSection(newOpt);
      loadTeacherRelations(studySystem, selectedStage, selectedGrade, selectedSemester, true, true, newOpt);
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
        loadSubjectsForCurrentSelection(updated[0], selectedStage, selectedGrade, secondaryTrack, selectedSemester, true, specialEdTrack);
      }
    } else if (key === 'specialEdTrack') {
      const updated = specialEdTrackOptions.filter(o => o !== optToDelete);
      setSpecialEdTrackOptions(updated);
      saveCustomOptions('custom_special_ed_tracks_v1', updated);
      if (specialEdTrack === optToDelete && updated.length > 0) {
        setSpecialEdTrack(updated[0]);
        loadSubjectsForCurrentSelection(studySystem, selectedStage, selectedGrade, secondaryTrack, selectedSemester, true, updated[0]);
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
        loadSubjectsForCurrentSelection(studySystem, selectedStage, updatedGrades[0], secondaryTrack, selectedSemester, true, specialEdTrack);
      }
    } else if (key === 'secondaryTrack') {
      const updated = secondaryTrackOptions.filter(o => o !== optToDelete);
      setSecondaryTrackOptions(updated);
      saveCustomOptions('custom_secondary_tracks_v1', updated);
      if (secondaryTrack === optToDelete && updated.length > 0) {
        setSecondaryTrack(updated[0]);
        loadSubjectsForCurrentSelection(studySystem, selectedStage, selectedGrade, updated[0], selectedSemester, true, specialEdTrack);
      }
    } else if (key === 'semester') {
      const updated = semesterOptions.filter(o => o !== optToDelete);
      setSemesterOptions(updated);
      saveCustomOptions('custom_semesters_v1', updated);
      if (selectedSemester === optToDelete && updated.length > 0) {
        setSelectedSemester(updated[0]);
        loadSubjectsForCurrentSelection(studySystem, selectedStage, selectedGrade, secondaryTrack, updated[0], true, specialEdTrack);
      }
    } else if (key === 'dailySection') {
      const updated = sectionOptions.filter(o => o !== optToDelete);
      setSectionOptions(updated);
      saveCustomOptions('custom_teacher_sections_v1', updated);
      if (selectedDailySection === optToDelete && updated.length > 0) {
        setSelectedDailySection(updated[0]);
        loadDailyRowsForSelection(updated[0], selectedStage, selectedGrade, true);
      }
    } else if (key === 'relationSection') {
      const updated = sectionOptions.filter(o => o !== optToDelete);
      setSectionOptions(updated);
      saveCustomOptions('custom_teacher_sections_v1', updated);
      if (selectedRelationSection === optToDelete && updated.length > 0) {
        setSelectedRelationSection(updated[0]);
        loadTeacherRelations(studySystem, selectedStage, selectedGrade, selectedSemester, true, true, updated[0]);
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
        loadSubjectsForCurrentSelection(newOpt, selectedStage, selectedGrade, secondaryTrack, selectedSemester, true, specialEdTrack);
      }
    } else if (key === 'specialEdTrack') {
      const updated = specialEdTrackOptions.map(o => o === oldOpt ? newOpt : o);
      setSpecialEdTrackOptions(updated);
      saveCustomOptions('custom_special_ed_tracks_v1', updated);
      if (specialEdTrack === oldOpt) {
        setSpecialEdTrack(newOpt);
        loadSubjectsForCurrentSelection(studySystem, selectedStage, selectedGrade, secondaryTrack, selectedSemester, true, newOpt);
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
        loadSubjectsForCurrentSelection(studySystem, selectedStage, newOpt, secondaryTrack, selectedSemester, true, specialEdTrack);
      }
    } else if (key === 'secondaryTrack') {
      const updated = secondaryTrackOptions.map(o => o === oldOpt ? newOpt : o);
      setSecondaryTrackOptions(updated);
      saveCustomOptions('custom_secondary_tracks_v1', updated);
      if (secondaryTrack === oldOpt) {
        setSecondaryTrack(newOpt);
        loadSubjectsForCurrentSelection(studySystem, selectedStage, selectedGrade, newOpt, selectedSemester, true, specialEdTrack);
      }
    } else if (key === 'semester') {
      const updated = semesterOptions.map(o => o === oldOpt ? newOpt : o);
      setSemesterOptions(updated);
      saveCustomOptions('custom_semesters_v1', updated);
      if (selectedSemester === oldOpt) {
        setSelectedSemester(newOpt);
        loadSubjectsForCurrentSelection(studySystem, selectedStage, selectedGrade, secondaryTrack, newOpt, true, specialEdTrack);
      }
    } else if (key === 'dailySection') {
      const updated = sectionOptions.map(o => o === oldOpt ? newOpt : o);
      setSectionOptions(updated);
      saveCustomOptions('custom_teacher_sections_v1', updated);
      if (selectedDailySection === oldOpt) {
        setSelectedDailySection(newOpt);
        loadDailyRowsForSelection(newOpt, selectedStage, selectedGrade, true);
      }
    } else if (key === 'relationSection') {
      const updated = sectionOptions.map(o => o === oldOpt ? newOpt : o);
      setSectionOptions(updated);
      saveCustomOptions('custom_teacher_sections_v1', updated);
      if (selectedRelationSection === oldOpt) {
        setSelectedRelationSection(newOpt);
        loadTeacherRelations(studySystem, selectedStage, selectedGrade, selectedSemester, true, true, newOpt);
      }
    }

    setOptionManager(prev => ({
      ...prev,
      options: prev.options.map(o => o === oldOpt ? newOpt : o)
    }));
  };

  // ==========================================
  // حالات شاشة عدد الحصص اليومية (مرتبطة بالقسم والمرحلة والصف ومعلمي الكادر التعليمي)
  // ==========================================
  const [sectionOptions, setSectionOptions] = useState<string[]>(() => 
    loadCustomOptions('custom_teacher_sections_v1', DEFAULT_TEACHER_SECTIONS)
  );
  const [selectedDailySection, setSelectedDailySection] = useState<string>('بنين');
  const [selectedRelationSection, setSelectedRelationSection] = useState<string>('بنين');
  const [selectedDailyStage, setSelectedDailyStage] = useState<string>(() => stageOptions[0] || 'ابتدائي');
  const [days, setDays] = useState<DayOption[]>(DEFAULT_DAYS);
  const [rows, setRows] = useState<GradePeriodRow[]>([]);
  const [registeredStaff, setRegisteredStaff] = useState<TeacherRecord[]>([]);
  const [selectedStaffTeacherId, setSelectedStaffTeacherId] = useState<string>('');

  // حالات العرض والتنبيهات
  const [isSaving, setIsSaving] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [showRelationErrorsModal, setShowRelationErrorsModal] = useState(false);
  const [showAddTeacherModal, setShowAddTeacherModal] = useState(false);
  const [newTeacherName, setNewTeacherName] = useState('');
  const [newTeacherSubject, setNewTeacherSubject] = useState('');
  const [newTeacherQuota, setNewTeacherQuota] = useState<number>(24);

  // حالات المعلم المكمل
  const [showComplementaryModal, setShowComplementaryModal] = useState(false);
  const [complementaryStage, setComplementaryStage] = useState<string>('');
  const [selectedComplementaryTeacherId, setSelectedComplementaryTeacherId] = useState<string>('');
  const [complementaryQuota, setComplementaryQuota] = useState<number>(24);

  // مراجع شريط التمرير الدائم المتزامن لجدول العلاقات التدريسية
  const relationsTopScrollRef = useRef<HTMLDivElement>(null);
  const relationsTopScrollSpacerRef = useRef<HTMLDivElement>(null);
  const relationsTableScrollRef = useRef<HTMLDivElement>(null);
  const relationsTableRef = useRef<HTMLTableElement>(null);
  const isSyncingScrollRef = useRef(false);

  // ==========================================
  // حالات الخطوة 2: العلاقات التدريسية (القسم، نظام التعليم، المرحلة، الصف، وتحديد المواد للمعلمين)
  // ==========================================
  const [teacherRelations, setTeacherRelations] = useState<TeacherSubjectRelation[]>([]);
  const [allGradeRelations, setAllGradeRelations] = useState<Record<string, TeacherSubjectRelation[]>>({});
  const [teacherQuotasMap, setTeacherQuotasMap] = useState<Record<string, number>>({});
  const loadedMasterKeyRef = useRef<string>('');

  const makeGradeKey = (stg = selectedStage, grd = selectedGrade) => `${stg}__${grd}`;

  const sectionMatchesStaff = (staffSection: string | undefined, targetSection: string): boolean => {
    const tSec = (staffSection || '').trim();
    if (!tSec) return true;
    if (targetSection === 'بنين') return tSec === 'بنين' || tSec.includes('بنين');
    if (targetSection === 'بنات') return tSec === 'بنات' || tSec.includes('بنات');
    return tSec === targetSection;
  };

  // مفتاح التخزين للعلاقات التدريسية لكل صف وقسم
  const getRelationsStorageKey = (
    sys = studySystem,
    stg = selectedStage,
    grd = selectedGrade,
    sem = selectedSemester,
    sec = selectedRelationSection
  ) => {
    return `assignments_relations_${complexName}_${academicYear}_${sys}_${sec}_${stg}_${grd}_${sem}`.replace(/\s+/g, '_');
  };

  // مفتاح التخزين الشامل لجميع صفوف المرحلة/النظام/القسم لحساب النصاب التراكمي للمعلم عبر الصفوف
  const getMasterRelationsStorageKey = (
    sys = studySystem,
    sem = selectedSemester,
    sec = selectedRelationSection
  ) => {
    return `assignments_relations_master_${complexName}_${academicYear}_${sys}_${sec}_${sem}`.replace(/\s+/g, '_');
  };

  // ==========================================
  // حالات شاشة عدد الحصص اليومية (الخطوة 1 - مرتبطة بالمرحلة الدراسية)
  // ==========================================
  const [dailyDays, setDailyDays] = useState<DayOption[]>(DEFAULT_DAYS);
  const [dailyRows, setDailyRows] = useState<GradePeriodRow[]>(() =>
    getDefaultGradeRowsForStage(stageOptions[0] || 'ابتدائي', stageGradesMap)
  );

  // مفتاح التخزين لعدد الحصص اليومية المرتبط بالقسم والمرحلة والصف
  const getDailyPeriodsStorageKey = (
    sec = selectedDailySection, 
    stg = selectedStage, 
    grd = selectedGrade
  ) => {
    return `assignments_daily_teachers_${complexName}_${academicYear}_${sec}_${stg}_${grd}`.replace(/\s+/g, '_');
  };
  
  // مفتاح التخزين الخاص بنصاب المواد المرتبط بالاختيارات النشطة فقط
  const getSubjectsStorageKey = (
    sys: string,
    stg: string,
    grd: string,
    trk: string,
    sem: string,
    spTrack = specialEdTrack
  ) => {
    const isSpecial = sys === 'تربية خاصة' || sys.includes('تربية خاصة');
    let trackSegment = 'none';
    if (isSpecial) {
      trackSegment = `sped_${spTrack || 'اضطراب_طيف_التوحد'}`;
    } else if (stg === 'ثانوي' && (grd.includes('الثاني') || grd.includes('الثالث'))) {
      trackSegment = trk;
    }
    return `assignments_quota_${complexName}_${academicYear}_${sys}_${stg}_${grd}_${trackSegment}_${sem}`
      .replace(/\s+/g, '_');
  };

  const currentQuotaStorageKey = getSubjectsStorageKey(
    studySystem,
    selectedStage,
    selectedGrade,
    secondaryTrack,
    selectedSemester,
    specialEdTrack
  );

  // التحقق مما إذا كان الإدخال في الفصل الأول للمرحلة الابتدائية أو المتوسطة (أو التربية الخاصة لكافة المراحل) ليتم حفظ التعديلات للفصل الثاني تلقائياً
  const isSyncToSecondSemester = 
    ((selectedStage === 'ابتدائي' || selectedStage === 'متوسط') || isSpecialEdTrackVisible) && 
    (selectedSemester === 'الفصل الدراسي الأول' || selectedSemester.includes('الأول'));

  const getSecondSemesterQuotaKey = () => {
    return getSubjectsStorageKey(
      studySystem,
      selectedStage,
      selectedGrade,
      secondaryTrack,
      'الفصل الدراسي الثاني',
      specialEdTrack
    );
  };

  // تعديل اسم المادة مباشرة من الجدول
  const handleInlineNameChange = (id: string, newName: string) => {
    setSubjectsList(prev => {
      const updated = prev.map(item => item.id === id ? { ...item, name: newName } : item);
      try {
        localStorage.setItem(currentQuotaStorageKey, JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  // تعديل عدد الحصص مباشرة وسهلاً من الجدول دون الحاجة لفتح نافذة التعديل
  const handleInlinePeriodChange = (id: string, newPeriods: number) => {
    const val = Math.max(0, newPeriods);
    setSubjectsList(prev => {
      const updated = prev.map(item => item.id === id ? { ...item, periods: val } : item);
      try {
        localStorage.setItem(currentQuotaStorageKey, JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  // تحميل واسترجاع المواد المرتبطة بالاختيارات الحالية
  const loadSubjectsForCurrentSelection = async (
    sys = studySystem,
    stg = selectedStage,
    grd = selectedGrade,
    trk = secondaryTrack,
    sem = selectedSemester,
    silent = false,
    spTrack = specialEdTrack
  ) => {
    const key = getSubjectsStorageKey(sys, stg, grd, trk, sem, spTrack);
    try {
      const saved = localStorage.getItem(key);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // استبعاد أي عناصر مؤقتة سابقة لمسار تعدد الإعاقات
          const hasOldPlaceholders = parsed.some(p => p.id && String(p.id).startsWith('sped_gen_'));
          if (hasOldPlaceholders && spTrack && (spTrack.includes('تعدد') || spTrack.includes('إعاق'))) {
            try { localStorage.removeItem(key); } catch {}
          } else {
            setSubjectsList(parsed);
            if (!silent) {
              setSuccessToast(`تم تحميل نصاب مواد (${grd} - ${stg})`);
              setTimeout(() => setSuccessToast(null), 3000);
            }
            return;
          }
        }
      }

      // البحث في قاعدة بيانات فايربيس للمزامنة
      const remote = await getSubjectQuotaFromFirestore(key);
      if (remote && Array.isArray(remote) && remote.length > 0) {
        const hasOldPlaceholders = remote.some(p => p.id && String(p.id).startsWith('sped_gen_'));
        if (hasOldPlaceholders && spTrack && (spTrack.includes('تعدد') || spTrack.includes('إعاق'))) {
          try { localStorage.removeItem(key); } catch {}
        } else {
          setSubjectsList(remote);
          try { localStorage.setItem(key, JSON.stringify(remote)); } catch {}
          if (!silent) {
            setSuccessToast(`تم استرجاع نصاب مواد (${grd} - ${stg})`);
            setTimeout(() => setSuccessToast(null), 3000);
          }
          return;
        }
      }
    } catch (e) {
      console.warn('Error loading subjects:', e);
    }

    // إذا لم تكن هناك مواد محفوظة، نحمل المواد المقررة المعتمدة بحسب المرحلة والصف
    const defaults = getDefaultSubjectsForSelection(sys, stg, grd, trk, sem, spTrack);
    setSubjectsList(defaults);
    if (defaults.length > 0) {
      try {
        localStorage.setItem(key, JSON.stringify(defaults));
        saveSubjectQuotaToFirestore(key, defaults);
      } catch {}
      if (!silent) {
        setSuccessToast(`تم تحميل المواد المقررة لـ (${grd})`);
        setTimeout(() => setSuccessToast(null), 3000);
      }
    } else {
      setSubjectsList([]);
    }
  };

  // عند فتح الشاشة للمرة الأولى
  useEffect(() => {
    loadSubjectsForCurrentSelection(studySystem, selectedStage, selectedGrade, secondaryTrack, selectedSemester, true, specialEdTrack);
  }, []);

  // تحميل واسترجاع المعلمين وحصصهم اليومية للصف والمرحلة والقسم المحددين من الكادر التعليمي فقط
  const loadDailyRowsForSelection = async (
    sec = selectedDailySection, 
    stg = selectedStage, 
    grd = selectedGrade, 
    silent = true
  ) => {
    const dKey = getDailyPeriodsStorageKey(sec, stg, grd);
    
    // 1. جلب كافة المعلمين المسجلين في بطاقة بيانات الكادر التعليمي
    const allStaff = await getAllStaffTeachers(complexName);
    setRegisteredStaff(allStaff);

    // مجموعة بأسماء المعلمين المسجلين لضمان عدم قبول أي اسم خارجي
    const validStaffNames = new Set(allStaff.map(t => (t.name || '').trim()));

    // 2. فحص التخزين المحلي وقاعدة البيانات
    try {
      const saved = localStorage.getItem(dKey);
      if (saved) {
        const parsed: GradePeriodRow[] = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // فلترة المعلمين للتأكد من تسجيلهم في بطاقة بيانات الكادر التعليمي
          const filtered = parsed.filter(p => p.teacherName && validStaffNames.has(p.teacherName.trim()));
          if (filtered.length > 0) {
            setRows(filtered);
            if (!silent) {
              setSuccessToast(`تم استرجاع جدول معلمي (${grd}) - قسم (${sec})`);
              setTimeout(() => setSuccessToast(null), 3000);
            }
            return;
          }
        }
      }

      const remote = await getDailyTeacherRowsFromFirestore(dKey);
      if (remote && Array.isArray(remote) && remote.length > 0) {
        const filteredRemote = remote.filter(p => p.teacherName && validStaffNames.has(p.teacherName.trim()));
        if (filteredRemote.length > 0) {
          setRows(filteredRemote);
          try { localStorage.setItem(dKey, JSON.stringify(filteredRemote)); } catch {}
          if (!silent) {
            setSuccessToast(`تم استرجاع جدول معلمي (${grd}) - قسم (${sec})`);
            setTimeout(() => setSuccessToast(null), 3000);
          }
          return;
        }
      }
    } catch (e) {
      console.warn('Error loading daily teacher periods:', e);
    }

    // 3. إذا لم تكن هناك خطة محفوظة مسبقاً، استخراج المعلمين المسجلين في "بطاقة بيانات الكادر التعليمي" فقط المطابقين للقسم والمرحلة
    const matchingStaff = allStaff.filter(t => {
      const tSec = (t.section || '').trim();
      const secMatches = !tSec || tSec === sec || (sec === 'بنين' && tSec.includes('بنين')) || (sec === 'بنات' && tSec.includes('بنات'));
      const tStg = (t.stage || '').trim();
      const stgMatches = !tStg || tStg === stg || tStg.includes(stg) || stg.includes(tStg);
      return secMatches && stgMatches;
    });

    if (matchingStaff.length > 0) {
      const mappedRows: GradePeriodRow[] = matchingStaff.map((t, idx) => ({
        id: `staff_${t.id || t.jobNum || idx}_${Date.now()}`,
        teacherName: t.name,
        gradeName: t.name,
        subject: t.subject || t.specialization || 'مادة عامة',
        section: sec,
        stage: stg,
        grade: grd,
        planPeriods: Number(t.quota) || 24,
        periods: { saturday: '', sunday: 5, monday: 5, tuesday: 5, wednesday: 5, thursday: 4, friday: '' }
      }));
      setRows(mappedRows);
      try {
        localStorage.setItem(dKey, JSON.stringify(mappedRows));
        saveDailyTeacherRowsToFirestore(dKey, mappedRows);
      } catch {}
      if (!silent) {
        setSuccessToast(`تم تحميل معلّمي (${grd}) من بطاقة بيانات الكادر التعليمي`);
        setTimeout(() => setSuccessToast(null), 3000);
      }
    } else {
      // لا نضيف أي معلم من أي ملف خارجي
      setRows([]);
    }
  };

  // المزامنة التلقائية للعلاقات التدريسية (الخطوة 2) عند تغيير القسم أو نظام التعليم أو المرحلة أو الصف أو الفصل
  useEffect(() => {
    if (currentStep === 2) {
      loadSubjectsForCurrentSelection(studySystem, selectedStage, selectedGrade, secondaryTrack, selectedSemester, true, specialEdTrack);
      const mKey = getMasterRelationsStorageKey(studySystem, selectedSemester, selectedRelationSection);
      const needsRemoteLoad = loadedMasterKeyRef.current !== mKey;
      loadTeacherRelations(studySystem, selectedStage, selectedGrade, selectedSemester, true, needsRemoteLoad, selectedRelationSection);
    }
  }, [currentStep, selectedRelationSection, studySystem, selectedStage, selectedGrade, selectedSemester, secondaryTrack, specialEdTrack]);

  // مزامنة عرض شريط التمرير العلوي مع العرض الفعلي لجدول العلاقات التدريسية
  useEffect(() => {
    if (currentStep !== 2) return;
    const updateWidth = () => {
      if (relationsTableRef.current && relationsTopScrollSpacerRef.current) {
        const w = relationsTableRef.current.scrollWidth;
        if (w > 0) {
          relationsTopScrollSpacerRef.current.style.width = `${w}px`;
        }
      }
    };
    updateWidth();
    const timer = setTimeout(updateWidth, 60);
    let ro: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined' && relationsTableRef.current) {
      ro = new ResizeObserver(updateWidth);
      ro.observe(relationsTableRef.current);
    }
    window.addEventListener('resize', updateWidth);
    return () => {
      clearTimeout(timer);
      ro?.disconnect();
      window.removeEventListener('resize', updateWidth);
    };
  }, [currentStep, subjectsList, teacherRelations, selectedRelationSection, selectedStage, selectedGrade]);

  // تحميل عدد الحصص اليومية (الخطوة 1) للمرحلة المحددة
  useEffect(() => {
    loadDailyPeriods(selectedDailyStage);
  }, []);

  // عند تغيير القسم (بنين / بنات) في تبويب عدد الحصص اليومية
  const handleDailySectionChange = (newSec: string) => {
    setSelectedDailySection(newSec);
    loadDailyRowsForSelection(newSec, selectedStage, selectedGrade, true);
  };

  // عند تغيير المرحلة: يتم تحديث الصفوف تلقائياً للصف الأول من المرحلة
  const handleStageChange = (newStage: string) => {
    setSelectedStage(newStage);
    const availableGrades = stageGradesMap[newStage] || STAGE_GRADES_MAP[newStage] || [];
    const newGrade = availableGrades[0] || '';
    setSelectedGrade(newGrade);
    
    // تحميل مواد ومعلمي الاختيار الجديد فوراً
    loadSubjectsForCurrentSelection(studySystem, newStage, newGrade, secondaryTrack, selectedSemester, true, specialEdTrack);
    if (currentStep === 2) {
      loadTeacherRelations(studySystem, newStage, newGrade, selectedSemester, true, false, selectedRelationSection);
    }
  };

  // عند تغيير الصف: تحديث المواد والمعلمين
  const handleGradeChange = (newGrade: string) => {
    setSelectedGrade(newGrade);
    loadSubjectsForCurrentSelection(studySystem, selectedStage, newGrade, secondaryTrack, selectedSemester, true, specialEdTrack);
    if (currentStep === 2) {
      loadTeacherRelations(studySystem, selectedStage, newGrade, selectedSemester, true, false, selectedRelationSection);
    }
  };

  // حساب إجمالي نصاب المواد المعروضة
  const totalSubjectPeriods = subjectsList.reduce((sum, item) => sum + (Number(item.periods) || 0), 0);

  // تنفيذ البحث عند الضغط على زر "ابحث"
  const handleSearchSubjects = () => {
    loadSubjectsForCurrentSelection(studySystem, selectedStage, selectedGrade, secondaryTrack, selectedSemester, false, specialEdTrack);
  };

  // إعادة تعيين حقول البحث للقيم الافتراضية (الصف الأول الابتدائي افتراضياً)
  const handleResetSearch = () => {
    const defSys = studySystemOptions[0] || 'أهلي';
    const defSpTrk = specialEdTrackOptions[0] || 'اضطراب طيف التوحد';
    const defStg = stageOptions[0] || 'ابتدائي';
    const defGrades = stageGradesMap[defStg] || STAGE_GRADES_MAP[defStg] || [];
    const defGrd = defGrades[0] || 'الأول الابتدائي';
    const defTrk = secondaryTrackOptions[0] || 'مسار عام';
    const defSem = semesterOptions[0] || 'الفصل الدراسي الأول';

    setStudySystem(defSys);
    setSpecialEdTrack(defSpTrk);
    setSelectedStage(defStg);
    setSelectedGrade(defGrd);
    setSecondaryTrack(defTrk);
    setSelectedSemester(defSem);
    loadSubjectsForCurrentSelection(defSys, defStg, defGrd, defTrk, defSem, false, defSpTrk);
  };

  // حفظ تعديل نصاب مادة (تعديل الاسم والحصص للأدمن)
  const handleSaveSubjectEdit = () => {
    if (!editingSubject) return;
    const finalName = editingSubject.name.trim() || 'مادة';
    const finalPeriods = Number(editingSubject.periods) || 0;
    const oldName = editingSubject.name.trim();
    const updated = subjectsList.map(sub => 
      sub.id === editingSubject.id ? { ...sub, name: finalName, periods: finalPeriods } : sub
    );
    setSubjectsList(updated);
    try {
      localStorage.setItem(currentQuotaStorageKey, JSON.stringify(updated));
      saveSubjectQuotaToFirestore(currentQuotaStorageKey, updated);
    } catch {}

    // في المرحلة الابتدائية أو المتوسطة: تزامن تعديل المادة أيضاً مع الفصل الدراسي الثاني إذا كان التعديل في الفصل الأول
    if (isSyncToSecondSemester) {
      try {
        const sem2Key = getSecondSemesterQuotaKey();
        const sem2Raw = localStorage.getItem(sem2Key);
        if (sem2Raw) {
          const sem2List: SubjectQuotaItem[] = JSON.parse(sem2Raw);
          if (Array.isArray(sem2List)) {
            const updatedSem2 = sem2List.map(s => 
              (s.id === editingSubject.id || s.name.trim() === oldName)
                ? { ...s, name: finalName, periods: finalPeriods }
                : s
            );
            localStorage.setItem(sem2Key, JSON.stringify(updatedSem2));
            saveSubjectQuotaToFirestore(sem2Key, updatedSem2);
          }
        }
      } catch (err) {
        console.warn('Error syncing edit to second semester:', err);
      }
    }

    setEditingSubject(null);
    setSuccessToast(`تم تحديث مادة (${finalName}) بنجاح`);
    setTimeout(() => setSuccessToast(null), 3000);
  };

  // إضافة مادة جديدة لنصاب المواد (مع إضافتها تلقائياً للفصل الثاني في الابتدائي والمتوسط)
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

    // طلب المستخدم: عند إدخال المواد يدوياً في الفصل الدراسي الأول يتم إضافتها أيضاً في الفصل الدراسي الثاني في الابتدائي والمتوسط
    if (isSyncToSecondSemester) {
      try {
        const sem2Key = getSecondSemesterQuotaKey();
        let sem2List: SubjectQuotaItem[] = [];
        const rawSem2 = localStorage.getItem(sem2Key);
        if (rawSem2) {
          try {
            const parsed = JSON.parse(rawSem2);
            if (Array.isArray(parsed)) sem2List = parsed;
          } catch {}
        }
        
        // التحقق مما إذا كانت المادة مضافة بالفعل لنفس الاسم لتجنب التكرار الخاطئ
        const existingIdx = sem2List.findIndex(s => s.name.trim() === newItem.name.trim());
        if (existingIdx >= 0) {
          sem2List[existingIdx] = { ...sem2List[existingIdx], periods: newItem.periods };
        } else {
          sem2List.push({
            id: 'sub_s2_' + Date.now(),
            name: newItem.name,
            periods: newItem.periods
          });
        }
        localStorage.setItem(sem2Key, JSON.stringify(sem2List));
        saveSubjectQuotaToFirestore(sem2Key, sem2List);
      } catch (err) {
        console.warn('Error syncing subject to second semester:', err);
      }
    }

    setNewSubjectName('');
    setShowAddSubjectModal(false);
    if (isSyncToSecondSemester) {
      setSuccessToast(`تمت إضافة مادة (${newItem.name}) بنجاح للفصلين الأول والثاني`);
    } else {
      setSuccessToast(`تمت إضافة مادة (${newItem.name}) بنجاح لهذا الصف`);
    }
    setTimeout(() => setSuccessToast(null), 3000);
  };

  // حذف مادة من نصاب المواد الحالي
  const handleDeleteSubject = (id: string, name: string) => {
    if (window.confirm(`هل أنت متأكد من حذف مادة (${name}) من نصاب ${selectedGrade}؟`)) {
      const updated = subjectsList.filter(s => s.id !== id);
      setSubjectsList(updated);
      try {
        localStorage.setItem(currentQuotaStorageKey, JSON.stringify(updated));
        saveSubjectQuotaToFirestore(currentQuotaStorageKey, updated);
      } catch {}

      // في الابتدائي والمتوسط، إذا تم حذف المادة من الفصل الأول، يتم تحديث الفصل الثاني
      if (isSyncToSecondSemester) {
        try {
          const sem2Key = getSecondSemesterQuotaKey();
          const sem2Raw = localStorage.getItem(sem2Key);
          if (sem2Raw) {
            const sem2List: SubjectQuotaItem[] = JSON.parse(sem2Raw);
            if (Array.isArray(sem2List)) {
              const updatedSem2 = sem2List.filter(s => s.id !== id && s.name.trim() !== name.trim());
              localStorage.setItem(sem2Key, JSON.stringify(updatedSem2));
              saveSubjectQuotaToFirestore(sem2Key, updatedSem2);
            }
          }
        } catch {}
      }

      setSuccessToast(`تم حذف مادة (${name})`);
      setTimeout(() => setSuccessToast(null), 3000);
    }
  };

  // استعادة المواد المقررة للاختيارات الحالية
  const handleResetSubjectsDefault = () => {
    if (window.confirm(`هل تريد استعادة المواد المقررة لـ (${selectedGrade} - ${selectedStage})؟`)) {
      const defs = getDefaultSubjectsForSelection(
        studySystem,
        selectedStage,
        selectedGrade,
        secondaryTrack,
        selectedSemester,
        specialEdTrack
      );
      setSubjectsList(defs);
      try {
        localStorage.setItem(currentQuotaStorageKey, JSON.stringify(defs));
        saveSubjectQuotaToFirestore(currentQuotaStorageKey, defs);
      } catch {}
      setSuccessToast('تمت استعادة المواد المقررة بنجاح');
      setTimeout(() => setSuccessToast(null), 3000);
    }
  };

  // حفظ نصاب المواد للاختيارات الحالية (يعمل عبر زر الحفظ السفلي الموحد)
  const handleSaveSubjects = async () => {
    setIsSaving(true);
    try {
      localStorage.setItem(currentQuotaStorageKey, JSON.stringify(subjectsList));
      await saveSubjectQuotaToFirestore(currentQuotaStorageKey, subjectsList);

      // طلب المستخدم: عند الضغط على حفظ في ابتدائي أو متوسط يتم حفظ المواد بالتعديل في الفصل الدراسي الثاني تلقائياً
      if (isSyncToSecondSemester) {
        const sem2Key = getSecondSemesterQuotaKey();
        localStorage.setItem(sem2Key, JSON.stringify(subjectsList));
        await saveSubjectQuotaToFirestore(sem2Key, subjectsList);
        setSuccessToast(`تم حفظ نصاب مواد (${selectedGrade}) بالتعديلات للفصلين الأول والثاني تلقائياً!`);
      } else {
        setSuccessToast(`تم حفظ نصاب مواد (${selectedGrade} - ${selectedStage}) بنجاح!`);
      }
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

  // ========================================================
  // دوال إدارة شاشة عدد الحصص اليومية (الخطوة 1: الإعدادات العامة)
  // ========================================================
  const getDailyStageStorageKey = (stg = selectedDailyStage) => {
    return `assignments_daily_periods_${complexName}_${academicYear}_${stg}`.replace(/\s+/g, '_');
  };

  const loadDailyPeriods = async (stg = selectedDailyStage) => {
    const dKey = getDailyStageStorageKey(stg);
    try {
      const saved = localStorage.getItem(dKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setDailyRows(parsed);
          return;
        }
      }

      const remote = await getDailyPeriodsFromFirestore(complexName, academicYear, stg);
      if (remote && Array.isArray(remote.rows) && remote.rows.length > 0) {
        setDailyRows(remote.rows);
        if (remote.days) {
          setDailyDays(prev => prev.map(d => ({
            ...d,
            enabled: remote.days[d.key] !== undefined ? !!remote.days[d.key] : d.enabled
          })));
        }
        return;
      }
    } catch (e) {
      console.warn('Error loading daily periods:', e);
    }

    setDailyRows(getDefaultGradeRowsForStage(stg, stageGradesMap));
    setDailyDays(DEFAULT_DAYS);
  };

  const handleDailyStageChange = (newStg: string) => {
    setSelectedDailyStage(newStg);
    loadDailyPeriods(newStg);
  };

  const toggleDailyDay = (dayKey: string) => {
    setDailyDays(prev => prev.map(d => d.key === dayKey ? { ...d, enabled: !d.enabled } : d));
  };

  const handleDailyPeriodChange = (rowId: string, dayKey: string, val: string) => {
    const numVal = val === '' ? '' : parseInt(val, 10);
    setDailyRows(prev => {
      const updated = prev.map(r => {
        if (r.id !== rowId) return r;
        const current = r.periods || { saturday: '', sunday: 7, monday: 7, tuesday: 7, wednesday: 6, thursday: 6, friday: '' };
        return {
          ...r,
          periods: { ...current, [dayKey]: numVal }
        };
      });
      try {
        localStorage.setItem(getDailyStageStorageKey(selectedDailyStage), JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const handleDailyPlanPeriodsChange = (rowId: string, val: string) => {
    const numVal = Math.max(0, parseInt(val, 10) || 0);
    setDailyRows(prev => {
      const updated = prev.map(r => r.id === rowId ? { ...r, planPeriods: numVal } : r);
      try {
        localStorage.setItem(getDailyStageStorageKey(selectedDailyStage), JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const handleDeleteDailyRow = (rowId: string, gradeName: string) => {
    if (window.confirm(`هل أنت متأكد من حذف (${gradeName})؟`)) {
      const updated = dailyRows.filter(r => r.id !== rowId);
      setDailyRows(updated);
      try {
        localStorage.setItem(getDailyStageStorageKey(selectedDailyStage), JSON.stringify(updated));
      } catch {}
    }
  };

  const handleResetDailyRows = () => {
    const defaults = getDefaultGradeRowsForStage(selectedDailyStage, stageGradesMap);
    setDailyRows(defaults);
    setDailyDays(DEFAULT_DAYS);
    try {
      localStorage.setItem(getDailyStageStorageKey(selectedDailyStage), JSON.stringify(defaults));
    } catch {}
    setSuccessToast(`تمت استعادة صفوف والحصص اليومية الافتراضية لمرحلة (${selectedDailyStage})`);
    setTimeout(() => setSuccessToast(null), 3000);
  };

  const getDailyRowTotal = (row: GradePeriodRow): number => {
    let total = 0;
    if (!row) return 0;
    const safePeriods = row.periods || { saturday: '', sunday: 7, monday: 7, tuesday: 7, wednesday: 6, thursday: 6, friday: '' };
    dailyDays.forEach(d => {
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

    const dKey = getDailyStageStorageKey(selectedDailyStage);
    try {
      localStorage.setItem(dKey, JSON.stringify(dailyRows));
      const daysRecord = dailyDays.reduce((acc, d) => ({ ...acc, [d.key]: d.enabled }), {} as Record<string, boolean>);
      await saveDailyPeriodsToFirestore({
        complexName,
        academicYear,
        stage: selectedDailyStage,
        days: daysRecord,
        rows: dailyRows.map(r => ({
          id: r.id,
          gradeName: r.gradeName,
          periods: r.periods,
          planPeriods: r.planPeriods
        }))
      });
      setSuccessToast(`تم حفظ عدد الحصص اليومية لمرحلة (${selectedDailyStage}) بنجاح!`);
      setTimeout(() => setSuccessToast(null), 3500);
    } catch (e) {
      console.warn('Error saving daily periods:', e);
      setSuccessToast('تم الحفظ بنجاح محلياً!');
      setTimeout(() => setSuccessToast(null), 3500);
    } finally {
      setIsSaving(false);
    }
  };

  // ========================================================
  // دوال إدارة شاشة العلاقات التدريسية وتوزيع حصص المعلمين (الخطوة 2)
  // ========================================================
  const handlePeriodChange = (rowId: string, dayKey: string, val: string) => {
    const numVal = val === '' ? '' : parseInt(val, 10);
    setRows(prev => {
      const updated = prev.map(row => {
        if (row.id === rowId) {
          const safePeriods = row.periods || { saturday: '', sunday: 5, monday: 5, tuesday: 5, wednesday: 5, thursday: 4, friday: '' };
          return {
            ...row,
            periods: {
              ...safePeriods,
              [dayKey]: numVal
            }
          };
        }
        return row;
      });
      try {
        const dKey = getDailyPeriodsStorageKey(selectedDailySection, selectedStage, selectedGrade);
        localStorage.setItem(dKey, JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const handlePlanPeriodsChange = (rowId: string, val: string) => {
    const num = Math.max(0, parseInt(val, 10) || 0);
    setRows(prev => {
      const updated = prev.map(row => row.id === rowId ? { ...row, planPeriods: num } : row);
      try {
        const dKey = getDailyPeriodsStorageKey(selectedDailySection, selectedStage, selectedGrade);
        localStorage.setItem(dKey, JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const getRowTotal = (row: GradePeriodRow): number => {
    let total = 0;
    if (!row) return 0;
    const safePeriods = row.periods || { saturday: '', sunday: 5, monday: 5, tuesday: 5, wednesday: 5, thursday: 4, friday: '' };
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

  // ========================================================
  // دوال إدارة شاشة العلاقات التدريسية وتوزيع المواد على المعلمين (الخطوة 2)
  // ========================================================
  const isSubjectAssignedToTeacher = (teacher: TeacherSubjectRelation, subject: SubjectQuotaItem): boolean => {
    if (!teacher || !teacher.assignedSubjectIds) return false;
    return teacher.assignedSubjectIds.includes(subject.id) || teacher.assignedSubjectIds.includes(subject.name);
  };

  // جلب مواد أي صف بشكل متزامن من التخزين أو الافتراضي لحساب الإجمالي التراكمي واكتشاف التكرارات بدقة
  const getSubjectsForGradeSync = (
    sys: string,
    stg: string,
    grd: string,
    trk: string,
    sem: string,
    spTrack: string
  ): SubjectQuotaItem[] => {
    if (stg === selectedStage && grd === selectedGrade && subjectsList.length > 0) {
      return subjectsList;
    }
    try {
      const key = getSubjectsStorageKey(sys, stg, grd, trk, sem, spTrack);
      const saved = localStorage.getItem(key);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {}
    return getDefaultSubjectsForSelection(sys, stg, grd, trk, sem, spTrack);
  };

  // دمج معلمي المرحلة والقسم المحدد + المعلمين المكملين مع بياناتهم المحفوظة للصف المحدد
  const buildMergedGradeRelations = (
    stg: string,
    grd: string,
    existingList: TeacherSubjectRelation[],
    staffList: TeacherRecord[],
    quotas: Record<string, number>,
    stageComplementaryList: TeacherSubjectRelation[] = [],
    sec = selectedRelationSection
  ): TeacherSubjectRelation[] => {
    const stageStaff = staffList.filter(t => {
      const secMatches = sectionMatchesStaff(t.section, sec);
      const tStg = (t.stage || '').trim();
      const stgMatches = !tStg || tStg === stg || tStg.includes(stg) || stg.includes(tStg);
      return secMatches && stgMatches;
    });

    const validStageStaffNames = new Set(stageStaff.map(t => t.name.trim()));
    const validAllSectionStaffNames = new Set(
      staffList.filter(t => sectionMatchesStaff(t.section, sec)).map(t => t.name.trim())
    );

    const existingMap = new Map<string, TeacherSubjectRelation>();
    existingList.forEach(item => {
      if (validAllSectionStaffNames.size === 0 || validAllSectionStaffNames.has(item.teacherName.trim())) {
        existingMap.set(item.teacherName.trim(), item);
      }
    });

    const mergedList: TeacherSubjectRelation[] = [];

    stageStaff.forEach((t, idx) => {
      const tName = t.name.trim();
      const existing = existingMap.get(tName);
      const syncedQuota = quotas[tName] || existing?.targetQuota || Math.min(35, Math.max(1, Number(t.quota) || 24));
      if (existing) {
        mergedList.push({
          ...existing,
          stage: stg,
          grade: grd,
          targetQuota: syncedQuota,
          subjectSpecialization: t.subject || t.specialization || existing.subjectSpecialization || 'مادة عامة'
        });
        existingMap.delete(tName);
      } else {
        mergedList.push({
          id: `rel_${t.id || t.jobNum || idx}_${stg}_${grd}`,
          teacherId: t.id || t.jobNum || t.name,
          teacherName: t.name,
          subjectSpecialization: t.subject || t.specialization || 'مادة عامة',
          stage: stg,
          grade: grd,
          targetQuota: syncedQuota,
          assignedSubjectIds: [],
          isComplementary: false
        });
      }
    });

    // إضافة المعلمين المكملين المحفوظين في هذا الصف أو المضافين في هذه المرحلة (بنفس القسم) ليتمكنوا من استكمال نصابهم عبر صفوف المرحلة
    const addedCompNames = new Set<string>();
    existingMap.forEach(item => {
      const tName = item.teacherName.trim();
      if (item.isComplementary && (validAllSectionStaffNames.size === 0 || validAllSectionStaffNames.has(tName)) && !validStageStaffNames.has(tName)) {
        mergedList.push({
          ...item,
          stage: stg,
          grade: grd,
          targetQuota: quotas[tName] || item.targetQuota || 24
        });
        addedCompNames.add(tName);
      }
    });

    stageComplementaryList.forEach(comp => {
      const tName = comp.teacherName.trim();
      if (
        !addedCompNames.has(tName) &&
        !mergedList.some(m => m.teacherName.trim() === tName) &&
        (validAllSectionStaffNames.size === 0 || validAllSectionStaffNames.has(tName))
      ) {
        mergedList.push({
          ...comp,
          id: `comp_${comp.teacherId || tName}_${stg}_${grd}`,
          stage: stg,
          grade: grd,
          targetQuota: quotas[tName] || comp.targetQuota || 24,
          assignedSubjectIds: []
        });
        addedCompNames.add(tName);
      }
    });

    return mergedList;
  };

  // حفظ الخريطة الشاملة للعلاقات محلياً وفي الحالة
  const persistMasterToLocalStorage = (
    nextAllMap: Record<string, TeacherSubjectRelation[]>,
    nextQuotasMap: Record<string, number>,
    sys = studySystem,
    sem = selectedSemester,
    currentGradeKey?: string,
    sec = selectedRelationSection
  ) => {
    try {
      const masterKey = getMasterRelationsStorageKey(sys, sem, sec);
      const records = Object.entries(nextAllMap).map(([gradeKey, relations]) => {
        const [stage, grade] = gradeKey.split('__');
        return { gradeKey, stage, grade, relations };
      });
      localStorage.setItem(masterKey, JSON.stringify({ records, quotas: nextQuotasMap }));
      if (currentGradeKey && nextAllMap[currentGradeKey]) {
        const [stg, grd] = currentGradeKey.split('__');
        const gKey = getRelationsStorageKey(sys, stg, grd, sem, sec);
        localStorage.setItem(gKey, JSON.stringify(nextAllMap[currentGradeKey]));
      }
    } catch {}
  };

  const loadTeacherRelations = async (
    sys = studySystem,
    stg = selectedStage,
    grd = selectedGrade,
    sem = selectedSemester,
    silent = true,
    fetchRemote = false,
    sec = selectedRelationSection
  ) => {
    const masterKey = getMasterRelationsStorageKey(sys, sem, sec);
    const targetGradeKey = makeGradeKey(stg, grd);

    let allStaff = registeredStaff;
    if (allStaff.length === 0 || fetchRemote) {
      allStaff = await getAllStaffTeachers(complexName);
      setRegisteredStaff(allStaff);
    }

    let nextAllMap: Record<string, TeacherSubjectRelation[]> = { ...allGradeRelations };
    let nextQuotas: Record<string, number> = { ...teacherQuotasMap };

    if (fetchRemote || Object.keys(nextAllMap).length === 0 || loadedMasterKeyRef.current !== masterKey) {
      nextAllMap = {};
      nextQuotas = {};

      // 1. القراءة من التخزين المحلي الشامل
      try {
        const savedMaster = localStorage.getItem(masterKey);
        if (savedMaster) {
          const parsed = JSON.parse(savedMaster);
          if (parsed && Array.isArray(parsed.records)) {
            parsed.records.forEach((rec: any) => {
              if (rec && rec.gradeKey && Array.isArray(rec.relations)) {
                nextAllMap[rec.gradeKey] = rec.relations;
              }
            });
          }
          if (parsed && parsed.quotas && typeof parsed.quotas === 'object') {
            nextQuotas = { ...parsed.quotas };
          }
        }
      } catch {}

      // 2. إذا لم تتوفر محلياً، الجلب من فايربيس
      if (Object.keys(nextAllMap).length === 0) {
        try {
          const remoteRows = await getDailyTeacherRowsFromFirestore(masterKey);
          if (remoteRows && Array.isArray(remoteRows)) {
            remoteRows.forEach((rec: any) => {
              if (rec && rec.gradeKey && Array.isArray(rec.relations)) {
                nextAllMap[rec.gradeKey] = rec.relations;
                rec.relations.forEach((r: TeacherSubjectRelation) => {
                  if (r.teacherName && r.targetQuota) {
                    nextQuotas[r.teacherName.trim()] = r.targetQuota;
                  }
                });
              }
            });
          }
        } catch (e) {
          console.warn('Error loading master teacher relations:', e);
        }
      }

      // 3. استيراد أي مفاتيح صفوف فردية محفوظة مسبقاً غير موجودة في الشامل
      for (const stageItem of stageOptions) {
        const gradesOfStage = stageGradesMap[stageItem] || STAGE_GRADES_MAP[stageItem] || [];
        for (const gradeItem of gradesOfStage) {
          const gKeyStr = makeGradeKey(stageItem, gradeItem);
          if (!nextAllMap[gKeyStr]) {
            try {
              const singleKey = getRelationsStorageKey(sys, stageItem, gradeItem, sem, sec);
              const singleSaved = localStorage.getItem(singleKey);
              if (singleSaved) {
                const parsedSingle = JSON.parse(singleSaved);
                if (Array.isArray(parsedSingle) && parsedSingle.length > 0) {
                  nextAllMap[gKeyStr] = parsedSingle;
                  parsedSingle.forEach((r: TeacherSubjectRelation) => {
                    if (r.teacherName && r.targetQuota && !nextQuotas[r.teacherName.trim()]) {
                      nextQuotas[r.teacherName.trim()] = r.targetQuota;
                    }
                  });
                }
              }
            } catch {}
          }
        }
      }

      loadedMasterKeyRef.current = masterKey;
    }

    // جمع المعلمين المكملين المضافين في نفس المرحلة ليستمر ظهورهم في كافة صفوف نفس المرحلة
    const stageComplementaryList: TeacherSubjectRelation[] = [];
    const seenComp = new Set<string>();
    Object.entries(nextAllMap).forEach(([gKey, list]) => {
      const [gStg] = gKey.split('__');
      if (gStg === stg && Array.isArray(list)) {
        list.forEach(item => {
          if (item.isComplementary && !seenComp.has(item.teacherName.trim())) {
            seenComp.add(item.teacherName.trim());
            stageComplementaryList.push(item);
          }
        });
      }
    });

    const existingForGrade = nextAllMap[targetGradeKey] || [];
    const mergedCurrent = buildMergedGradeRelations(
      stg,
      grd,
      existingForGrade,
      allStaff,
      nextQuotas,
      stageComplementaryList,
      sec
    );

    nextAllMap[targetGradeKey] = mergedCurrent;
    mergedCurrent.forEach(r => {
      if (!nextQuotas[r.teacherName.trim()]) {
        nextQuotas[r.teacherName.trim()] = r.targetQuota;
      }
    });

    setTeacherQuotasMap(nextQuotas);
    setAllGradeRelations(nextAllMap);
    setTeacherRelations(mergedCurrent);

    if (!silent) {
      setSuccessToast(`تم تحميل معلّمي قسم (${sec}) لمرحلة (${stg}) وصف (${grd})`);
      setTimeout(() => setSuccessToast(null), 3000);
    }
  };

  // الحساب الشامل للتراكمي والتحقق المباشر للرسائل التنبيهية الثلاث عبر كافة الصفوف
  const relationValidation = useMemo(() => {
    const currentGradeKey = makeGradeKey(selectedStage, selectedGrade);
    const effectiveMap: Record<string, TeacherSubjectRelation[]> = {
      ...allGradeRelations,
      [currentGradeKey]: teacherRelations
    };

    const teacherStatsMap: Record<string, {
      teacherName: string;
      targetQuota: number;
      totalAssigned: number;
      currentGradeAssigned: number;
      otherGradesAssigned: number;
      breakdown: Array<{ stage: string; grade: string; count: number }>;
    }> = {};

    const duplicateSubjectAlerts: Array<{
      gradeKey: string;
      stage: string;
      grade: string;
      subjectId: string;
      subjectName: string;
      teacherNames: string[];
    }> = [];

    const currentGradeDuplicateSubjectIds = new Set<string>();

    Object.entries(effectiveMap).forEach(([gKey, list]) => {
      if (!Array.isArray(list) || list.length === 0) return;
      const [gStg, gGrd] = gKey.split('__');
      if (!gStg || !gGrd) return;

      const gradeSubjects = getSubjectsForGradeSync(
        studySystem,
        gStg,
        gGrd,
        secondaryTrack,
        selectedSemester,
        specialEdTrack
      );

      // 1. فحص تكرار إسناد نفس المادة لأكثر من معلم داخل هذا الصف
      gradeSubjects.forEach(subj => {
        const owners = list.filter(rel => isSubjectAssignedToTeacher(rel, subj));
        if (owners.length > 1) {
          duplicateSubjectAlerts.push({
            gradeKey: gKey,
            stage: gStg,
            grade: gGrd,
            subjectId: subj.id,
            subjectName: subj.name,
            teacherNames: owners.map(o => o.teacherName)
          });
          if (gKey === currentGradeKey) {
            currentGradeDuplicateSubjectIds.add(subj.id);
            currentGradeDuplicateSubjectIds.add(subj.name);
          }
        }
      });

      // 2. تجميع عدد الحصص المسندة لكل معلم عبر الصفوف (كل مادة محددة = حصة واحدة)
      list.forEach(rel => {
        const tName = rel.teacherName.trim();
        const quota = teacherQuotasMap[tName] || rel.targetQuota || 24;
        if (!teacherStatsMap[tName]) {
          teacherStatsMap[tName] = {
            teacherName: rel.teacherName,
            targetQuota: quota,
            totalAssigned: 0,
            currentGradeAssigned: 0,
            otherGradesAssigned: 0,
            breakdown: []
          };
        } else {
          teacherStatsMap[tName].targetQuota = quota;
        }

        let countInGrade = 0;
        if (gradeSubjects.length > 0) {
          countInGrade = gradeSubjects.filter(s => isSubjectAssignedToTeacher(rel, s)).length;
        } else {
          countInGrade = (rel.assignedSubjectIds || []).length;
        }

        teacherStatsMap[tName].totalAssigned += countInGrade;
        if (gKey === currentGradeKey) {
          teacherStatsMap[tName].currentGradeAssigned += countInGrade;
        } else if (countInGrade > 0) {
          teacherStatsMap[tName].otherGradesAssigned += countInGrade;
          teacherStatsMap[tName].breakdown.push({
            stage: gStg,
            grade: gGrd,
            count: countInGrade
          });
        }
      });
    });

    const exceededQuotaAlerts: Array<{ teacherName: string; totalAssigned: number; targetQuota: number }> = [];
    const incompleteQuotaAlerts: Array<{ teacherName: string; totalAssigned: number; targetQuota: number; remaining: number }> = [];
    let totalAssignedOverall = 0;

    Object.values(teacherStatsMap).forEach(stat => {
      totalAssignedOverall += stat.totalAssigned;
      if (stat.totalAssigned > stat.targetQuota) {
        exceededQuotaAlerts.push({
          teacherName: stat.teacherName,
          totalAssigned: stat.totalAssigned,
          targetQuota: stat.targetQuota
        });
      } else if (stat.totalAssigned > 0 && stat.totalAssigned < stat.targetQuota) {
        incompleteQuotaAlerts.push({
          teacherName: stat.teacherName,
          totalAssigned: stat.totalAssigned,
          targetQuota: stat.targetQuota,
          remaining: stat.targetQuota - stat.totalAssigned
        });
      }
    });

    const hasBlockingRelationAlerts =
      exceededQuotaAlerts.length > 0 ||
      duplicateSubjectAlerts.length > 0 ||
      incompleteQuotaAlerts.length > 0;

    return {
      teacherStatsMap,
      exceededQuotaAlerts,
      duplicateSubjectAlerts,
      incompleteQuotaAlerts,
      currentGradeDuplicateSubjectIds,
      hasBlockingRelationAlerts,
      totalAssignedOverall
    };
  }, [allGradeRelations, teacherRelations, teacherQuotasMap, subjectsList, selectedStage, selectedGrade, studySystem, selectedSemester, secondaryTrack, specialEdTrack]);

  const getTeacherAssignedPeriods = (teacher: TeacherSubjectRelation): number => {
    if (!teacher) return 0;
    const stat = relationValidation.teacherStatsMap[teacher.teacherName.trim()];
    if (stat) return stat.totalAssigned;
    if (!teacher.assignedSubjectIds || teacher.assignedSubjectIds.length === 0) return 0;
    return subjectsList.filter(s => isSubjectAssignedToTeacher(teacher, s)).length;
  };

  const handleRelationQuotaChange = (relationId: string, newQuota: number) => {
    const targetTeacher = teacherRelations.find(r => r.id === relationId);
    if (!targetTeacher) return;
    const tName = targetTeacher.teacherName.trim();
    const currentGradeKey = makeGradeKey(selectedStage, selectedGrade);
    const currentAssigned = getTeacherAssignedPeriods(targetTeacher);

    const nextQuotas = {
      ...teacherQuotasMap,
      [tName]: newQuota
    };

    const mergedSource: Record<string, TeacherSubjectRelation[]> = {
      ...allGradeRelations,
      [currentGradeKey]: teacherRelations
    };
    const nextAllMap: Record<string, TeacherSubjectRelation[]> = {};
    Object.entries(mergedSource).forEach(([gKey, list]) => {
      nextAllMap[gKey] = list.map(r => r.teacherName.trim() === tName ? { ...r, targetQuota: newQuota } : r);
    });

    setTeacherQuotasMap(nextQuotas);
    setAllGradeRelations(nextAllMap);
    setTeacherRelations(nextAllMap[currentGradeKey] || []);
    persistMasterToLocalStorage(nextAllMap, nextQuotas, studySystem, selectedSemester, currentGradeKey, selectedRelationSection);
  };

  const handleToggleSubject = (relationId: string, subject: SubjectQuotaItem) => {
    const currentTeacher = teacherRelations.find(r => r.id === relationId);
    if (!currentTeacher) return;

    const currentGradeKey = makeGradeKey(selectedStage, selectedGrade);
    const isCurrentlyAssigned = isSubjectAssignedToTeacher(currentTeacher, subject);

    const updatedCurrentList = teacherRelations.map(r => {
      if (r.id !== relationId) return r;
      if (isCurrentlyAssigned) {
        return {
          ...r,
          assignedSubjectIds: (r.assignedSubjectIds || []).filter(id => id !== subject.id && id !== subject.name)
        };
      } else {
        return {
          ...r,
          assignedSubjectIds: [...(r.assignedSubjectIds || []), subject.id]
        };
      }
    });

    const nextAllMap: Record<string, TeacherSubjectRelation[]> = {
      ...allGradeRelations,
      [currentGradeKey]: updatedCurrentList
    };

    setTeacherRelations(updatedCurrentList);
    setAllGradeRelations(nextAllMap);
    persistMasterToLocalStorage(nextAllMap, teacherQuotasMap, studySystem, selectedSemester, currentGradeKey, selectedRelationSection);
  };

  const handleAddTeacher = () => {
    if (!newTeacherName.trim()) return;

    if (currentStep === 2) {
      if (teacherRelations.some(r => r.teacherName.trim() === newTeacherName.trim())) {
        setSuccessToast(`المعلم (${newTeacherName}) مضاف بالفعل!`);
        setTimeout(() => setSuccessToast(null), 3000);
        return;
      }
      const currentGradeKey = makeGradeKey(selectedStage, selectedGrade);
      const tName = newTeacherName.trim();
      const quotaVal = Math.min(35, Math.max(1, newTeacherQuota || 24));
      const newRelation: TeacherSubjectRelation = {
        id: `rel_${selectedStaffTeacherId || Date.now()}_${Date.now()}`,
        teacherId: selectedStaffTeacherId || newTeacherName,
        teacherName: newTeacherName,
        subjectSpecialization: newTeacherSubject || 'مادة عامة',
        stage: selectedStage,
        grade: selectedGrade,
        targetQuota: quotaVal,
        assignedSubjectIds: [],
        isComplementary: false
      };
      const updated = [...teacherRelations, newRelation];
      const nextQuotas = { ...teacherQuotasMap, [tName]: quotaVal };
      const nextAllMap = { ...allGradeRelations, [currentGradeKey]: updated };
      setTeacherQuotasMap(nextQuotas);
      setAllGradeRelations(nextAllMap);
      setTeacherRelations(updated);
      persistMasterToLocalStorage(nextAllMap, nextQuotas, studySystem, selectedSemester, currentGradeKey, selectedRelationSection);
    } else {
      const newRow: GradePeriodRow = {
        id: `row_${Date.now()}`,
        teacherName: newTeacherName,
        gradeName: `${newTeacherName} (${newTeacherSubject || 'مادة عامة'})`,
        section: selectedDailySection,
        stage: selectedStage,
        planPeriods: 24,
        periods: {
          saturday: '',
          sunday: 5,
          monday: 5,
          tuesday: 5,
          wednesday: 5,
          thursday: 4,
          friday: ''
        }
      };
      setRows(prev => [...prev, newRow]);
    }

    setShowAddTeacherModal(false);
    setSelectedStaffTeacherId('');
    setNewTeacherName('');
    setNewTeacherSubject('');
    setSuccessToast(`تمت إضافة المعلم (${newTeacherName}) بنجاح!`);
    setTimeout(() => setSuccessToast(null), 3000);
  };

  const handleOpenComplementaryModal = () => {
    const otherStages = stageOptions.filter(stg => stg !== selectedStage);
    const initialStage = otherStages[0] || (selectedStage === 'ابتدائي' ? 'متوسط' : 'ابتدائي');
    setComplementaryStage(initialStage);
    setSelectedComplementaryTeacherId('');
    setComplementaryQuota(24);
    setShowComplementaryModal(true);
  };

  const handleAddComplementaryTeacher = () => {
    if (!selectedComplementaryTeacherId) return;
    const found = registeredStaff.find(
      t => (t.id && t.id === selectedComplementaryTeacherId) || t.jobNum === selectedComplementaryTeacherId || t.name === selectedComplementaryTeacherId
    );
    if (!found) return;

    if (teacherRelations.some(r => r.teacherName.trim() === found.name.trim())) {
      setSuccessToast(`المعلم (${found.name}) مضاف بالفعل في هذا الصف!`);
      setTimeout(() => setSuccessToast(null), 3000);
      return;
    }

    const currentGradeKey = makeGradeKey(selectedStage, selectedGrade);
    const tName = found.name.trim();
    const quotaVal = Math.min(35, Math.max(1, complementaryQuota || Number(found.quota) || 24));

    const newRow: TeacherSubjectRelation = {
      id: `comp_${found.id || found.jobNum || Date.now()}_${Date.now()}`,
      teacherId: found.id || found.jobNum || found.name,
      teacherName: found.name,
      subjectSpecialization: found.subject || found.specialization || 'مادة عامة',
      stage: selectedStage,
      grade: selectedGrade,
      isComplementary: true,
      originalStage: complementaryStage,
      targetQuota: quotaVal,
      assignedSubjectIds: []
    };

    const updated = [...teacherRelations, newRow];
    const nextQuotas = { ...teacherQuotasMap, [tName]: quotaVal };
    const nextAllMap = { ...allGradeRelations, [currentGradeKey]: updated };
    setTeacherQuotasMap(nextQuotas);
    setAllGradeRelations(nextAllMap);
    setTeacherRelations(updated);
    persistMasterToLocalStorage(nextAllMap, nextQuotas, studySystem, selectedSemester, currentGradeKey, selectedRelationSection);

    setSelectedComplementaryTeacherId('');
    setShowComplementaryModal(false);
    setSuccessToast(`تمت إضافة المعلم المكمل (${found.name}) من مرحلة (${complementaryStage}) بنجاح! يمكنك الآن تحديد المواد له.`);
    setTimeout(() => setSuccessToast(null), 3500);
  };

  const handleDeleteRelationRow = (relationId: string, teacherName: string) => {
    if (window.confirm(`هل أنت متأكد من إزالة المعلم (${teacherName}) من علاقات مرحلة (${selectedStage})؟`)) {
      const tName = teacherName.trim();
      const currentGradeKey = makeGradeKey(selectedStage, selectedGrade);
      const mergedSource: Record<string, TeacherSubjectRelation[]> = {
        ...allGradeRelations,
        [currentGradeKey]: teacherRelations
      };
      const nextAllMap: Record<string, TeacherSubjectRelation[]> = {};
      Object.entries(mergedSource).forEach(([gKey, list]) => {
        const [gStg] = gKey.split('__');
        if (gStg === selectedStage) {
          nextAllMap[gKey] = list.filter(r => r.teacherName.trim() !== tName && r.id !== relationId);
        } else {
          nextAllMap[gKey] = list;
        }
      });

      setAllGradeRelations(nextAllMap);
      setTeacherRelations(nextAllMap[currentGradeKey] || []);
      persistMasterToLocalStorage(nextAllMap, teacherQuotasMap, studySystem, selectedSemester, currentGradeKey, selectedRelationSection);
      setSuccessToast(`تمت إزالة المعلم (${teacherName})`);
      setTimeout(() => setSuccessToast(null), 3000);
    }
  };

  const handleResetTeacherRelations = () => {
    const currentGradeKey = makeGradeKey(selectedStage, selectedGrade);
    const stageStaff = registeredStaff.filter(t => {
      const secMatches = sectionMatchesStaff(t.section, selectedRelationSection);
      const tStg = (t.stage || '').trim();
      const stgMatches = !tStg || tStg === selectedStage || tStg.includes(selectedStage) || selectedStage.includes(tStg);
      return secMatches && stgMatches;
    });

    const defaults: TeacherSubjectRelation[] = stageStaff.map((t, idx) => {
      const tName = t.name.trim();
      return {
        id: `rel_reset_${t.id || t.jobNum || idx}_${Date.now()}`,
        teacherId: t.id || t.jobNum || t.name,
        teacherName: t.name,
        subjectSpecialization: t.subject || t.specialization || 'مادة عامة',
        stage: selectedStage,
        grade: selectedGrade,
        targetQuota: teacherQuotasMap[tName] || Math.min(35, Math.max(1, Number(t.quota) || 24)),
        assignedSubjectIds: [],
        isComplementary: false
      };
    });

    const nextAllMap = { ...allGradeRelations, [currentGradeKey]: defaults };
    setAllGradeRelations(nextAllMap);
    setTeacherRelations(defaults);
    persistMasterToLocalStorage(nextAllMap, teacherQuotasMap, studySystem, selectedSemester, currentGradeKey, selectedRelationSection);
    setSuccessToast(`تمت استعادة معلّمي قسم (${selectedRelationSection}) لصف (${selectedGrade}) دون إسناد مواد`);
    setTimeout(() => setSuccessToast(null), 3000);
  };

  const handleSaveTeacherRelations = async () => {
    if (relationValidation.hasBlockingRelationAlerts) {
      setShowRelationErrorsModal(true);
      return;
    }

    setIsSaving(true);
    setSuccessToast(null);

    const currentGradeKey = makeGradeKey(selectedStage, selectedGrade);
    const nextAllMap = { ...allGradeRelations, [currentGradeKey]: teacherRelations };
    const masterKey = getMasterRelationsStorageKey(studySystem, selectedSemester, selectedRelationSection);
    const singleKey = getRelationsStorageKey(studySystem, selectedStage, selectedGrade, selectedSemester, selectedRelationSection);

    const records = Object.entries(nextAllMap).map(([gradeKey, relations]) => {
      const [stage, grade] = gradeKey.split('__');
      return { gradeKey, stage, grade, relations };
    });

    try {
      persistMasterToLocalStorage(nextAllMap, teacherQuotasMap, studySystem, selectedSemester, currentGradeKey, selectedRelationSection);
      await saveDailyTeacherRowsToFirestore(masterKey, records);
      await saveDailyTeacherRowsToFirestore(singleKey, teacherRelations);
      setSuccessToast(`تم حفظ العلاقات التدريسية لقسم (${selectedRelationSection}) بنجاح!`);
      setTimeout(() => setSuccessToast(null), 3500);
    } catch (e) {
      console.warn('Firestore error, saved locally:', e);
      setSuccessToast('تم الحفظ بنجاح محلياً!');
      setTimeout(() => setSuccessToast(null), 3500);
    } finally {
      setIsSaving(false);
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

  const modalContent = (
    <div 
      className="fixed inset-0 z-[9999] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-2 sm:p-3 md:p-4 overscroll-contain" 
      dir="rtl"
      onClick={(e) => {
        if (e.target === e.currentTarget && !showAddTeacherModal && !showComplementaryModal && !showRelationErrorsModal && !editingSubject && !showAddSubjectModal) {
          onBack();
        }
      }}
    >
      {/* بطاقة النافذة المنبثقة الرئيسية */}
      <div className="relative w-full max-w-5xl lg:max-w-6xl h-auto max-h-[97vh] bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col justify-between my-auto animate-in fade-in zoom-in-95 duration-150 overscroll-contain">
        
        {/* 1. شريط العنوان العلوي */}
        <div className="bg-white border-b border-slate-200 px-4 sm:px-6 py-2 shadow-xs flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 sm:p-2 bg-blue-50 text-blue-600 rounded-xl border border-blue-100">
              <FileSpreadsheet size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-black text-slate-800">
                  الاسنادات
                </h1>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                  {currentStep === 2 ? 'العلاقات التدريسية' : currentStep === 1 ? activeSubTab : (stepsList.find(s => s.num === currentStep)?.label || activeSubTab)}
                </span>
              </div>
              <div className="flex items-center gap-2 text-[11px] text-slate-500 font-bold">
                <span>{complexName}</span>
                <span>•</span>
                <span>العام الدراسي: {academicYear}</span>
                {currentStep === 2 ? (
                  <>
                    <span>•</span>
                    <span className="text-blue-700 font-extrabold">{selectedRelationSection} • {studySystem} • {selectedStage} - {selectedGrade} ({teacherRelations.length} معلمين)</span>
                  </>
                ) : activeSubTab === 'نصاب الحصص للمواد' ? (
                  <>
                    <span>•</span>
                    <span className="text-blue-700 font-extrabold">{selectedStage} - {selectedGrade} ({totalSubjectPeriods} حصة)</span>
                  </>
                ) : activeSubTab === 'عدد الحصص اليومية' ? (
                  <>
                    <span>•</span>
                    <span className="text-blue-700 font-extrabold">{selectedDailyStage} ({dailyRows.length} صفوف)</span>
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
        <div className={`flex-1 overflow-y-auto px-4 sm:px-6 overscroll-contain custom-scrollbar ${currentStep === 2 ? 'py-2 space-y-2' : 'py-3.5 space-y-3.5'}`}>
          
          {/* شريط الخطوات الأربعة العلوي */}
          <div className={`bg-slate-50/70 rounded-2xl border border-slate-200/90 shadow-xs ${currentStep === 2 ? 'px-3 py-2' : 'p-3 sm:p-4'}`}>
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
                          ? 'border-2 border-blue-600 text-blue-600 bg-white shadow-xs ring-2 ring-blue-100' 
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

          {/* شريط التبويبات الفرعية في الخطوة 1 (الإعدادات العامة) */}
          {currentStep === 1 && (
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
          )}

          {/* شريط الخطوة 2: العلاقات التدريسية */}
          {currentStep === 2 && (
            <div className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 flex items-center justify-between flex-wrap gap-2 animate-in fade-in shadow-2xs">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-blue-600 text-white flex items-center justify-center font-black text-xs shadow-xs shrink-0">
                  2
                </div>
                <h3 className="text-xs sm:text-sm font-black text-slate-900 flex items-center gap-1.5 flex-wrap">
                  <span>العلاقات التدريسية وتوزيع حصص المواد على المعلمين</span>
                  <span className="text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-full">
                    الكادر التعليمي
                  </span>
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className="text-xs text-slate-700 hover:text-slate-900 font-bold bg-slate-50 hover:bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200 transition-colors cursor-pointer shadow-2xs"
              >
                العودة لـ الخطوة 1: الإعدادات العامة ←
              </button>
            </div>
          )}

          {/* ======================================================== */}
          {/* تبويب: "نصاب الحصص للمواد" (خاص بالخطوة 1 فقط - لا يظهر في العلاقات التدريسية) */}
          {/* ======================================================== */}
          {currentStep === 1 && activeSubTab === 'نصاب الحصص للمواد' && (
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
                  
                  {/* 1. نظام التعليم (نفس اختيارات المسار: أهلي، دولي، دبلومة أمريكية، تربية خاصة...) */}
                  <ManagedSelectField
                    label="نظام التعليم"
                    required
                    value={studySystem}
                    onChange={(val) => {
                      setStudySystem(val);
                      loadSubjectsForCurrentSelection(val, selectedStage, selectedGrade, secondaryTrack, selectedSemester, true, specialEdTrack);
                    }}
                    options={studySystemOptions}
                    onManageOptions={() => openOptionManager('studySystem', 'نظام التعليم', studySystemOptions, 'blue')}
                    isAdmin={isAdmin}
                    accentColor="blue"
                  />

                  {/* 1.5 المسار (يظهر فور اختيار تربية خاصة بنظام التعليم) */}
                  {isSpecialEdTrackVisible && (
                    <div className="animate-in fade-in zoom-in-95 duration-150">
                      <ManagedSelectField
                        label="المسار"
                        required
                        value={specialEdTrack}
                        onChange={(val) => {
                          setSpecialEdTrack(val);
                          loadSubjectsForCurrentSelection(studySystem, selectedStage, selectedGrade, secondaryTrack, selectedSemester, true, val);
                        }}
                        options={specialEdTrackOptions}
                        onManageOptions={() => openOptionManager('specialEdTrack', 'مسار التربية الخاصة', specialEdTrackOptions, 'teal')}
                        isAdmin={isAdmin}
                        accentColor="teal"
                      />
                    </div>
                  )}

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

                  {/* 4. المسار (يظهر فقط عند اختيار ثاني ثانوي أو ثالث ثانوي في المسارات العادية) */}
                  {isSecondaryTrackVisible && (
                    <div className="animate-in fade-in zoom-in-95 duration-150">
                      <ManagedSelectField
                        label="المسار"
                        required
                        value={secondaryTrack}
                        onChange={(val) => {
                          setSecondaryTrack(val);
                          loadSubjectsForCurrentSelection(studySystem, selectedStage, selectedGrade, val, selectedSemester, true, specialEdTrack);
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
                      loadSubjectsForCurrentSelection(studySystem, selectedStage, selectedGrade, secondaryTrack, val, true, specialEdTrack);
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
                    {isSpecialEdTrackVisible && (
                      <>
                        <span className="text-slate-400">•</span>
                        <span className="text-teal-700 font-bold bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200">
                          مسار: {specialEdTrack}
                        </span>
                      </>
                    )}
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
                          <span className="flex items-center gap-1.5">
                            <span>المادة</span>
                            <span className="text-[10px] text-blue-600 font-bold bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">تعديل مباشر</span>
                          </span>
                        </th>
                        <th className="py-3 px-4 text-center w-1/4">
                          <span className="flex items-center justify-center gap-1.5">
                            <span>عدد الحصص</span>
                            <span className="text-[10px] text-purple-600 font-bold bg-purple-50 px-1.5 py-0.5 rounded border border-purple-200">(+ / -)</span>
                          </span>
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
                            
                            {/* اسم المادة: إمكانية التعديل المباشر بالجدول */}
                            <td className="py-2 px-3 sm:px-5">
                              <div className="relative flex items-center group/name">
                                <input
                                  type="text"
                                  value={item.name}
                                  onChange={(e) => handleInlineNameChange(item.id, e.target.value)}
                                  placeholder="اسم المادة..."
                                  className="w-full font-bold text-slate-900 bg-transparent hover:bg-slate-100 focus:bg-white border border-transparent hover:border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-xl px-3 py-1.5 text-xs sm:text-sm transition-all outline-none"
                                  title="انقر لتعديل اسم المادة مباشرة"
                                />
                                <Edit3 size={13} className="text-slate-400 opacity-0 group-hover/name:opacity-60 pointer-events-none absolute left-3 shrink-0" />
                              </div>
                            </td>

                            {/* عدد الحصص: زيادة وإنقاص وإدخال مباشر وسهل دون الحاجة لفتح نافذة */}
                            <td className="py-2 px-3 text-center">
                              <div className="inline-flex items-center justify-center gap-1.5 bg-slate-100/80 p-1 rounded-xl border border-slate-200/90 shadow-2xs">
                                <button
                                  type="button"
                                  onClick={() => handleInlinePeriodChange(item.id, (Number(item.periods) || 0) - 1)}
                                  disabled={(Number(item.periods) || 0) <= 0}
                                  className="w-7 h-7 rounded-lg bg-white hover:bg-rose-50 hover:text-rose-600 active:scale-90 text-slate-700 disabled:opacity-30 disabled:pointer-events-none font-black flex items-center justify-center transition-all cursor-pointer border border-slate-200 hover:border-rose-300 text-sm shadow-2xs"
                                  title="تقليل حصة (-)"
                                >
                                  -
                                </button>
                                <input
                                  type="number"
                                  min={0}
                                  max={40}
                                  value={item.periods}
                                  onChange={(e) => handleInlinePeriodChange(item.id, parseInt(e.target.value, 10) || 0)}
                                  className="w-12 py-1 text-center font-black text-slate-900 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                  title="أدخل عدد الحصص مباشرة"
                                />
                                <button
                                  type="button"
                                  onClick={() => handleInlinePeriodChange(item.id, (Number(item.periods) || 0) + 1)}
                                  className="w-7 h-7 rounded-lg bg-white hover:bg-emerald-50 hover:text-emerald-700 active:scale-90 text-slate-700 font-black flex items-center justify-center transition-all cursor-pointer border border-slate-200 hover:border-emerald-300 text-sm shadow-2xs"
                                  title="زيادة حصة (+)"
                                >
                                  +
                                </button>
                              </div>
                            </td>

                            {/* خيارات: رابط تعديل وحذف */}
                            <td className="py-2 px-3 sm:px-5 text-center">
                              <div className="flex items-center justify-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => setEditingSubject(item)}
                                  className="text-xs font-bold text-slate-600 hover:text-blue-700 hover:bg-blue-50 px-2.5 py-1 rounded-lg transition-colors cursor-pointer flex items-center gap-1 border border-transparent hover:border-blue-200"
                                  title="فتح نافذة التعديل"
                                >
                                  <Edit3 size={12} />
                                  <span>تعديل</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteSubject(item.id, item.name)}
                                  className="text-slate-400 hover:text-rose-600 hover:bg-rose-50 p-1.5 rounded-lg transition-all cursor-pointer border border-transparent hover:border-rose-200 active:scale-90"
                                  title="حذف المادة من النصاب"
                                >
                                  <Trash2 size={14} />
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
          {/* تبويب: "عدد الحصص اليومية" (الخطوة 1: الإعدادات العامة) */}
          {/* ======================================================== */}
          {currentStep === 1 && activeSubTab === 'عدد الحصص اليومية' && (
            <div className="space-y-3.5 animate-in fade-in duration-150">
              
              {/* اختيار المرحلة الدراسية لجدول عدد الحصص اليومية */}
              <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex items-center justify-between flex-wrap gap-3">
                <div className="w-full sm:w-72">
                  <ManagedSelectField
                    label="المرحلة الدراسية"
                    required
                    value={selectedDailyStage}
                    onChange={(val) => handleDailyStageChange(val)}
                    options={stageOptions}
                    onManageOptions={() => openOptionManager('stage', 'المرحلة الدراسية', stageOptions, 'emerald')}
                    isAdmin={isAdmin}
                    accentColor="emerald"
                  />
                </div>
                <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
                  <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-3 py-1 rounded-lg font-black">
                    المرحلة: {selectedDailyStage}
                  </span>
                  <span className="bg-slate-100 text-slate-700 border border-slate-200 px-3 py-1 rounded-lg">
                    {dailyRows.length} صفوف
                  </span>
                </div>
              </div>

              {/* الجدول الرئيسي */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-right border-collapse min-w-[850px]">
                    
                    {/* رأس الجدول */}
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-700 text-xs font-bold bg-slate-50 select-none">
                        <th className="py-2.5 px-3 font-black w-64 sm:w-72">الصف / القسم</th>
                        
                        {dailyDays.map((day) => (
                          <th key={day.key} className="py-2.5 px-2 text-center font-bold">
                            <button
                              type="button"
                              onClick={() => toggleDailyDay(day.key)}
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
                        <th className="py-2.5 px-2.5 text-center font-black">نصاب المعلم</th>
                        <th className="py-2.5 px-2 text-center w-10"></th>
                      </tr>
                    </thead>

                    {/* صفوف الجدول */}
                    <tbody className="divide-y divide-slate-100 text-slate-800 text-xs">
                      {dailyRows.map((row) => {
                        const totalPeriods = getDailyRowTotal(row);
                        const isMatching = totalPeriods === row.planPeriods;

                        return (
                          <tr key={row.id} className="hover:bg-slate-50/70 transition-colors">
                            {/* اسم الصف / القسم */}
                            <td className="py-2.5 px-3 font-bold text-slate-900 whitespace-nowrap">
                              {row.gradeName}
                            </td>

                            {/* أعمدة الأيام السبعة */}
                            {dailyDays.map((day) => {
                              const safePeriods = row.periods || { saturday: '', sunday: 7, monday: 7, tuesday: 7, wednesday: 6, thursday: 6, friday: '' };
                              const val = safePeriods[day.key];
                              const isDayEnabled = day.enabled;

                              return (
                                <td key={day.key} className="py-2 px-1.5 text-center">
                                  {isDayEnabled ? (
                                    <div className="relative inline-block w-18 sm:w-20">
                                      <select
                                        value={val !== undefined && val !== '' ? String(val) : ''}
                                        onChange={(e) => handleDailyPeriodChange(row.id, day.key, e.target.value)}
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

                            {/* نصاب المعلم / نصاب الخطة */}
                            <td className="py-2.5 px-2.5 text-center">
                              <input
                                type="number"
                                min={0}
                                max={60}
                                value={row.planPeriods}
                                onChange={(e) => handleDailyPlanPeriodsChange(row.id, e.target.value)}
                                className="w-14 py-0.5 px-1 text-center font-black text-xs sm:text-sm text-slate-900 bg-transparent border border-transparent hover:border-slate-200 focus:border-blue-500 focus:bg-white rounded-lg focus:outline-none transition-all"
                              />
                            </td>

                            {/* زر حذف الصف */}
                            <td className="py-2 px-1 text-center">
                              <button
                                type="button"
                                onClick={() => handleDeleteDailyRow(row.id, row.gradeName)}
                                className="p-1 text-slate-300 hover:text-rose-600 transition-colors rounded cursor-pointer"
                                title="حذف هذا الصف"
                              >
                                <Trash2 size={13} />
                              </button>
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
          {/* الخطوة 2: "العلاقات التدريسية" (نظام التعليم، المرحلة، الصف، وتحديد المواد للمعلمين) */}
          {/* ======================================================== */}
          {currentStep === 2 && (
            <div className="space-y-2 animate-in fade-in duration-150">
              
              {/* قسم تحديد خيارات: القسم ونظام التعليم والمرحلة والصف والفصل */}
              <div className="bg-white rounded-2xl border border-slate-200 p-2.5 sm:p-3 shadow-xs space-y-2">
                <div className="flex items-center justify-between border-b border-slate-100 pb-1.5 flex-wrap gap-2">
                  <div className="flex items-center gap-1.5 text-slate-900 font-black text-xs sm:text-sm">
                    <Filter size={15} className="text-blue-600" />
                    <span>تحديد القسم ونظام التعليم والمرحلة والصف لتوزيع العلاقات التدريسية</span>
                  </div>
                  <span className="text-[11px] font-bold text-slate-700 bg-slate-100 px-2.5 py-0.5 rounded-lg border border-slate-200">
                    {selectedRelationSection} • {studySystem} • {selectedStage} • {selectedGrade} • {selectedSemester}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
                  {/* 0. القسم (بنين / بنات) */}
                  <ManagedSelectField
                    label="القسم"
                    icon={<Users size={13} className="text-indigo-600" />}
                    required
                    value={selectedRelationSection}
                    onChange={(val) => {
                      setSelectedRelationSection(val);
                      loadTeacherRelations(studySystem, selectedStage, selectedGrade, selectedSemester, true, true, val);
                    }}
                    options={sectionOptions}
                    onManageOptions={() => openOptionManager('relationSection', 'خيارات القسم', sectionOptions, 'indigo')}
                    isAdmin={isAdmin}
                    accentColor="indigo"
                  />

                  {/* 1. نظام التعليم */}
                  <ManagedSelectField
                    label="نظام التعليم"
                    required
                    value={studySystem}
                    onChange={(val) => {
                      setStudySystem(val);
                      loadSubjectsForCurrentSelection(val, selectedStage, selectedGrade, secondaryTrack, selectedSemester, true, specialEdTrack);
                      loadTeacherRelations(val, selectedStage, selectedGrade, selectedSemester, true, true, selectedRelationSection);
                    }}
                    options={studySystemOptions}
                    onManageOptions={() => openOptionManager('studySystem', 'خيارات نظام التعليم', studySystemOptions, 'blue')}
                    isAdmin={isAdmin}
                    accentColor="blue"
                  />

                  {/* 2. المرحلة الدراسية */}
                  <ManagedSelectField
                    label="المرحلة الدراسية"
                    required
                    value={selectedStage}
                    onChange={(val) => handleStageChange(val)}
                    options={stageOptions}
                    onManageOptions={() => openOptionManager('stage', 'المرحلة الدراسية', stageOptions, 'emerald')}
                    isAdmin={isAdmin}
                    accentColor="emerald"
                  />

                  {/* 3. الصف الدراسي */}
                  <ManagedSelectField
                    label="الصف الدراسي"
                    required
                    value={selectedGrade}
                    onChange={(val) => handleGradeChange(val)}
                    options={currentAvailableGrades}
                    onManageOptions={() => openOptionManager('grade', `صفوف مرحلة (${selectedStage})`, currentAvailableGrades, 'indigo')}
                    isAdmin={isAdmin}
                    accentColor="indigo"
                  />

                  {/* 4. الفصل الدراسي */}
                  <ManagedSelectField
                    label="الفصل الدراسي"
                    required
                    value={selectedSemester}
                    onChange={(val) => {
                      setSelectedSemester(val);
                      loadSubjectsForCurrentSelection(studySystem, selectedStage, selectedGrade, secondaryTrack, val, true, specialEdTrack);
                      loadTeacherRelations(studySystem, selectedStage, selectedGrade, val, true, true, selectedRelationSection);
                    }}
                    options={semesterOptions}
                    onManageOptions={() => openOptionManager('semester', 'خيارات الفصول الدراسية', semesterOptions, 'amber')}
                    isAdmin={isAdmin}
                    accentColor="amber"
                  />
                </div>

                {/* خيارات إضافية عند اختيار مسار تخصصي أو تربية خاصة */}
                {(isSecondaryTrackVisible || isSpecialEdTrackVisible) && (
                  <div className="pt-2 border-t border-slate-100 flex items-center gap-3 flex-wrap">
                    {isSecondaryTrackVisible && (
                      <div className="w-64">
                        <ManagedSelectField
                          label="مسار المرحلة الثانوية"
                          required
                          value={secondaryTrack}
                          onChange={(val) => {
                            setSecondaryTrack(val);
                            loadSubjectsForCurrentSelection(studySystem, selectedStage, selectedGrade, val, selectedSemester, true, specialEdTrack);
                          }}
                          options={secondaryTrackOptions}
                          onManageOptions={() => openOptionManager('secondaryTrack', 'مسارات المرحلة الثانوية', secondaryTrackOptions, 'teal')}
                          isAdmin={isAdmin}
                          accentColor="teal"
                        />
                      </div>
                    )}
                    {isSpecialEdTrackVisible && (
                      <div className="w-64">
                        <ManagedSelectField
                          label="مسار التربية الخاصة"
                          required
                          value={specialEdTrack}
                          onChange={(val) => {
                            setSpecialEdTrack(val);
                            loadSubjectsForCurrentSelection(studySystem, selectedStage, selectedGrade, secondaryTrack, selectedSemester, true, val);
                          }}
                          options={specialEdTrackOptions}
                          onManageOptions={() => openOptionManager('specialEdTrack', 'مسارات التربية الخاصة', specialEdTrackOptions, 'teal')}
                          isAdmin={isAdmin}
                          accentColor="teal"
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* الجدول الرئيسي: أسماء المعلمين وبجانبهم جدول المواد مع شريط تمرير دائم ظاهر بالأعلى وبالجدول */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
                {/* شريط التمرير الأفقي الدائم في أعلى الجدول (لا يتطلب النزول لأسفل الصفحة) */}
                <div className="bg-slate-100/90 border-b border-slate-200 px-2 py-0.5 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (relationsTableScrollRef.current) {
                        relationsTableScrollRef.current.scrollBy({ left: 220, behavior: 'smooth' });
                      }
                    }}
                    className="p-0.5 bg-white hover:bg-blue-50 text-slate-700 hover:text-blue-700 border border-slate-300 rounded-md transition-colors cursor-pointer shrink-0"
                    title="تمرير الجدول لليمين"
                  >
                    <ChevronRight size={14} />
                  </button>
                  <div
                    ref={relationsTopScrollRef}
                    onScroll={(e) => {
                      if (isSyncingScrollRef.current) return;
                      isSyncingScrollRef.current = true;
                      if (relationsTableScrollRef.current) {
                        relationsTableScrollRef.current.scrollLeft = e.currentTarget.scrollLeft;
                      }
                      requestAnimationFrame(() => { isSyncingScrollRef.current = false; });
                    }}
                    className="flex-1 overflow-x-scroll overflow-y-hidden h-4 [&::-webkit-scrollbar]:h-3 [&::-webkit-scrollbar-track]:bg-slate-200 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-thumb]:bg-slate-400 hover:[&::-webkit-scrollbar-thumb]:bg-slate-500 [&::-webkit-scrollbar-thumb]:rounded-full"
                  >
                    <div ref={relationsTopScrollSpacerRef} className="h-px min-w-[1100px]" />
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (relationsTableScrollRef.current) {
                        relationsTableScrollRef.current.scrollBy({ left: -220, behavior: 'smooth' });
                      }
                    }}
                    className="p-0.5 bg-white hover:bg-blue-50 text-slate-700 hover:text-blue-700 border border-slate-300 rounded-md transition-colors cursor-pointer shrink-0"
                    title="تمرير الجدول لليسار"
                  >
                    <ChevronLeft size={14} />
                  </button>
                </div>

                <div
                  ref={relationsTableScrollRef}
                  onScroll={(e) => {
                    if (isSyncingScrollRef.current) return;
                    isSyncingScrollRef.current = true;
                    if (relationsTopScrollRef.current) {
                      relationsTopScrollRef.current.scrollLeft = e.currentTarget.scrollLeft;
                    }
                    requestAnimationFrame(() => { isSyncingScrollRef.current = false; });
                  }}
                  className="overflow-x-scroll overflow-y-auto min-h-[290px] max-h-[58vh] [&::-webkit-scrollbar]:h-3 [&::-webkit-scrollbar]:w-2.5 [&::-webkit-scrollbar-track]:bg-slate-200 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-thumb]:bg-slate-400 hover:[&::-webkit-scrollbar-thumb]:bg-slate-500 [&::-webkit-scrollbar-thumb]:rounded-full"
                >
                  <table ref={relationsTableRef} className="w-full text-right border-collapse min-w-[850px]">
                    <thead className="sticky top-0 z-20 bg-slate-50 shadow-2xs">
                      <tr className="border-b border-slate-200 text-slate-700 text-xs font-bold bg-slate-50 select-none">
                        <th className="py-2 px-3 font-black w-48 sm:w-56 sticky right-0 bg-slate-50 z-30 shadow-sm">المعلم</th>
                        <th className="py-2 px-2.5 text-center font-black w-24">النصاب (الحصص)</th>
                        <th className="py-2 px-2.5 text-center font-black w-32">المسند حالياً (التراكمي)</th>

                        {/* أعمدة أسماء المواد المرتبطة بالمرحلة والصف (أسماء المواد فقط بدون عدد حصص المواد) */}
                        {subjectsList.map((subject) => (
                          <th key={subject.id} className="py-2 px-2 text-center font-black min-w-[105px] border-r border-slate-100">
                            <span className="text-xs text-slate-800 font-black truncate max-w-[125px] block mx-auto" title={subject.name}>
                              {subject.name}
                            </span>
                          </th>
                        ))}

                        <th className="py-2 px-3 text-center font-black w-28">حالة النصاب</th>
                        <th className="py-2 px-2 text-center w-10"></th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-100 text-slate-800 text-xs">
                      {teacherRelations.length === 0 ? (
                        <tr>
                          <td colSpan={subjectsList.length + 5} className="py-12 text-center text-slate-400">
                            <div className="max-w-md mx-auto space-y-3">
                              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto border border-blue-100">
                                <Users size={24} />
                              </div>
                              <div>
                                <p className="font-black text-sm text-slate-800">
                                  لا يوجد معلمون مسجلون حالياً لقسم ({selectedRelationSection}) في مرحلة ({selectedStage}) بـ «بطاقة بيانات الكادر التعليمي»
                                </p>
                                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                                  يمكنك إضافة معلم مكمل من المراحل الأخرى أو تسجيل المعلمين في بطاقة بيانات الكادر التعليمي.
                                </p>
                              </div>
                              <button
                                type="button"
                                onClick={handleOpenComplementaryModal}
                                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
                              >
                                <UserPlus size={14} />
                                <span>إضافة معلم مكمل لهذا الصف</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        teacherRelations.map((rel) => {
                          const tStat = relationValidation.teacherStatsMap[rel.teacherName.trim()];
                          const assignedPeriods = tStat ? tStat.totalAssigned : getTeacherAssignedPeriods(rel);
                          const currentGradeCount = tStat ? tStat.currentGradeAssigned : subjectsList.filter(s => isSubjectAssignedToTeacher(rel, s)).length;
                          const otherGradesCount = tStat ? tStat.otherGradesAssigned : 0;
                          const breakdownText = tStat && tStat.breakdown.length > 0
                            ? tStat.breakdown.map(b => `${b.grade}: ${b.count}`).join(' • ')
                            : '';

                          const isExceeded = assignedPeriods > rel.targetQuota;
                          const isCompleted = assignedPeriods === rel.targetQuota;
                          const isIncomplete = assignedPeriods > 0 && assignedPeriods < rel.targetQuota;

                          return (
                            <tr 
                              key={rel.id} 
                              className={`transition-colors ${
                                isExceeded ? 'bg-rose-50/50 hover:bg-rose-50' : 'hover:bg-slate-50/70'
                              }`}
                            >
                              {/* 1. اسم المعلم والتخصص */}
                              <td className="py-1.5 px-3 font-black text-slate-900 whitespace-nowrap sticky right-0 bg-white group-hover:bg-slate-50 z-10 shadow-sm">
                                <div className="flex items-center gap-2">
                                  <div className={`w-6 h-6 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 border ${
                                    rel.isComplementary 
                                      ? 'bg-amber-50 text-amber-700 border-amber-200' 
                                      : 'bg-blue-50 text-blue-700 border-blue-100'
                                  }`}>
                                    <User size={12} />
                                  </div>
                                  <div className="min-w-0 leading-tight">
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      <span className="font-black text-slate-900 text-xs truncate max-w-[170px]">
                                        {rel.teacherName}
                                      </span>
                                      {rel.isComplementary && (
                                        <span className="inline-block text-[9px] font-black text-amber-800 bg-amber-100 px-1.5 py-0.2 rounded border border-amber-300">
                                          مكمل ({rel.originalStage})
                                        </span>
                                      )}
                                    </div>
                                    {rel.subjectSpecialization && (
                                      <span className="text-[10px] text-slate-500 font-bold block truncate max-w-[170px]">
                                        {rel.subjectSpecialization}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </td>

                              {/* 2. عدد الحصص المحدد للمعلم (نصاب المعلم: اختيار حتى 35) */}
                              <td className="py-1.5 px-2 text-center">
                                <div className="relative inline-block w-20">
                                  <select
                                    value={rel.targetQuota}
                                    onChange={(e) => handleRelationQuotaChange(rel.id, parseInt(e.target.value, 10) || 24)}
                                    className="w-full appearance-none bg-white border border-slate-300 rounded-lg py-1 pr-2 pl-5 text-xs font-black text-center text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer shadow-2xs hover:border-slate-400"
                                  >
                                    {Array.from({ length: 35 }, (_, i) => i + 1).map(n => (
                                      <option key={n} value={n}>{n} حصة</option>
                                    ))}
                                  </select>
                                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center px-1 text-slate-400">
                                    <ChevronDown size={11} />
                                  </div>
                                </div>
                              </td>

                              {/* 3. الحصص المسندة حالياً (إجمالي كافة الصفوف + تفاصيل الصف الحالي والصفوف الأخرى) */}
                              <td className="py-1.5 px-2 text-center" title={breakdownText ? `تفصيل الصفوف الأخرى: ${breakdownText}` : undefined}>
                                <span className={`inline-block font-black text-xs px-2 py-0.5 rounded-md ${
                                  isExceeded
                                    ? 'text-rose-700 bg-rose-100 border border-rose-300 animate-pulse'
                                    : isCompleted
                                    ? 'text-emerald-700 bg-emerald-100 border border-emerald-300'
                                    : isIncomplete
                                    ? 'text-amber-800 bg-amber-100 border border-amber-300'
                                    : 'text-slate-500 bg-slate-100 border border-slate-200'
                                }`}>
                                  {assignedPeriods} / {rel.targetQuota} حصة
                                </span>
                                {otherGradesCount > 0 && (
                                  <div className="text-[10px] font-bold text-slate-500 mt-0.5 whitespace-nowrap">
                                    هنا: {currentGradeCount} • أخرى: {otherGradesCount}
                                  </div>
                                )}
                              </td>

                              {/* 4. أعمدة المواد: مربع تحديد تحت كل مادة (كل تحديد يعد حصة واحدة من نصاب المعلم) */}
                              {subjectsList.map((subject) => {
                                const isChecked = isSubjectAssignedToTeacher(rel, subject);
                                const isDuplicated =
                                  isChecked &&
                                  (relationValidation.currentGradeDuplicateSubjectIds.has(subject.id) ||
                                    relationValidation.currentGradeDuplicateSubjectIds.has(subject.name));
                                const otherOwner = teacherRelations.find(r => r.id !== rel.id && isSubjectAssignedToTeacher(r, subject));

                                return (
                                  <td key={subject.id} className="py-1.5 px-2 text-center border-r border-slate-100">
                                    <button
                                      type="button"
                                      onClick={() => handleToggleSubject(rel.id, subject)}
                                      className={`w-6 h-6 mx-auto rounded-md border flex items-center justify-center transition-all cursor-pointer ${
                                        isDuplicated
                                          ? 'bg-red-600 border-red-700 text-white shadow-sm ring-2 ring-red-300 animate-pulse'
                                          : isChecked
                                          ? 'bg-blue-600 border-blue-600 text-white shadow-xs hover:bg-blue-700 scale-105'
                                          : otherOwner
                                          ? 'bg-amber-50 border-amber-300 text-amber-600 hover:border-red-400'
                                          : 'bg-white border-slate-300 text-transparent hover:border-blue-400 hover:bg-blue-50/40'
                                      }`}
                                      title={
                                        isDuplicated
                                          ? `تنبيه تكرار: المادة مسندة لأكثر من معلم — انقر لإلغاء التحديد عن ${rel.teacherName}`
                                          : isChecked
                                          ? `محددة للمعلم ${rel.teacherName} (حصة واحدة مسندة) - انقر لإلغاء التحديد`
                                          : otherOwner
                                          ? `مسندة بالفعل للمعلم ${otherOwner.teacherName} — تحديدها سيظهر تنبيه التكرار`
                                          : `تحديد مادة (${subject.name}) للمعلم ${rel.teacherName} (تعد حصة واحدة من أصل ${rel.targetQuota})`
                                      }
                                    >
                                      <Check size={14} strokeWidth={isChecked ? 3.5 : 2} className={isChecked ? 'text-white' : otherOwner ? 'text-amber-500' : 'text-slate-300 opacity-0 hover:opacity-50'} />
                                    </button>
                                  </td>
                                );
                              })}

                              {/* 5. حالة النصاب */}
                              <td className="py-1.5 px-2 text-center whitespace-nowrap">
                                {isExceeded ? (
                                  <span className="inline-flex items-center gap-1 text-[11px] font-black text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                                    <AlertTriangle size={12} className="text-rose-600" />
                                    <span>تجاوز ({assignedPeriods}/{rel.targetQuota})</span>
                                  </span>
                                ) : isCompleted ? (
                                  <span className="inline-flex items-center gap-1 text-[11px] font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                                    <Check size={12} className="text-emerald-600" />
                                    <span>مكتمل ({rel.targetQuota})</span>
                                  </span>
                                ) : isIncomplete ? (
                                  <span className="inline-flex items-center gap-1 text-[11px] font-black text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                                    <AlertCircle size={12} className="text-amber-600" />
                                    <span>غير مكتمل ({assignedPeriods}/{rel.targetQuota})</span>
                                  </span>
                                ) : (
                                  <span className="text-[11px] text-slate-400 font-bold">
                                    غير مسند
                                  </span>
                                )}
                              </td>

                              {/* 6. حذف المعلم (إذا كان مكملاً) */}
                              <td className="py-1.5 px-1 text-center">
                                {rel.isComplementary && (
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteRelationRow(rel.id, rel.teacherName)}
                                    className="p-1 text-slate-300 hover:text-rose-600 transition-colors rounded cursor-pointer"
                                    title="إزالة المعلم المكمل من هذا الصف"
                                  >
                                    <Trash2 size={13} />
                                  </button>
                                )}
                              </td>

                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                {/* شريط الإجراءات تحت جدول العلاقات التدريسية: زر إضافة معلم مكمل */}
                <div className="bg-slate-50 border-t border-slate-200 px-3 py-1.5 flex items-center justify-between flex-wrap gap-2 text-xs">
                  <div className="flex items-center gap-2.5">
                    <button
                      type="button"
                      onClick={handleOpenComplementaryModal}
                      className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all inline-flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
                    >
                      <UserPlus size={14} />
                      <span>إضافة معلم مكمل</span>
                    </button>
                    <span className="text-slate-500 text-[11px] font-medium">
                      (يتيح اختيار معلم من المراحل الأخرى وتحديد عدد حصصه وإسناد المواد له)
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-slate-600 font-bold text-xs">
                    <span>معلمو المرحلة: <strong className="text-slate-900">{teacherRelations.filter(r => !r.isComplementary).length}</strong></span>
                    <span>•</span>
                    <span>معلمون مكملون: <strong className="text-amber-800">{teacherRelations.filter(r => r.isComplementary).length}</strong></span>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* ======================================================== */}
          {/* التبويبات الأخرى في الخطوة 1 */}
          {/* ======================================================== */}
          {currentStep === 1 && activeSubTab !== 'عدد الحصص اليومية' && activeSubTab !== 'نصاب الحصص للمواد' && (
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

          {/* ======================================================== */}
          {/* الخطوة 3 والخطوة 4 */}
          {/* ======================================================== */}
          {currentStep === 3 && (
            <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-3 animate-in fade-in">
              <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
                <Clock size={28} />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-black text-slate-900">توزيع حصص الانتظار وحجز الحصص الاختيارية</h3>
                <p className="text-xs text-slate-500 font-medium max-w-md mx-auto">
                  إعدادات حجز الحصص وتوزيع حصص الانتظار لمعلمي المجمع ({complexName}).
                </p>
              </div>
              <div className="pt-2 flex items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  className="px-4 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold text-xs transition-colors cursor-pointer"
                >
                  الذهاب لـ 2 العلاقات التدريسية
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl font-bold text-xs transition-colors cursor-pointer"
                >
                  الذهاب لـ 1 الإعدادات العامة
                </button>
              </div>
            </div>
          )}

          {currentStep === 4 && (
            <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-3 animate-in fade-in">
              <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
                <FileSpreadsheet size={28} />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-black text-slate-900">جدول الحصص الأسبوعي</h3>
                <p className="text-xs text-slate-500 font-medium max-w-md mx-auto">
                  توليد وعرض جدول الحصص للمجمع بالكامل وفق العلاقات التدريسية ونصاب المواد.
                </p>
              </div>
              <div className="pt-2 flex items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  className="px-4 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold text-xs transition-colors cursor-pointer"
                >
                  مراجعة العلاقات التدريسية
                </button>
              </div>
            </div>
          )}

        </div>

        {/* 3. شريط الأزرار والإحصائيات السفلي المثبت دائماً */}
        <div className="bg-slate-50 border-t border-slate-200 px-4 sm:px-6 py-2.5 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          
          {/* الإحصائيات والأزرار اليسرى حسب الخطوة والتبويب النشط */}
          {currentStep === 2 ? (
            <div className="text-xs sm:text-sm font-bold text-slate-800 flex items-center gap-2.5 order-2 sm:order-1 flex-wrap">
              <span>معلمو الصف: {teacherRelations.length}</span>
              <span>•</span>
              <span>المواد المسندة: {subjectsList.filter(s => teacherRelations.some(r => isSubjectAssignedToTeacher(r, s))).length} من {subjectsList.length}</span>
              <button
                type="button"
                onClick={handleOpenComplementaryModal}
                className="text-xs text-blue-700 hover:text-blue-900 font-bold flex items-center gap-1.5 cursor-pointer bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200 hover:bg-blue-100 transition-colors shadow-2xs mr-1"
              >
                <UserPlus size={13} />
                <span>إضافة معلم مكمل</span>
              </button>
              <button
                type="button"
                onClick={handleResetTeacherRelations}
                className="text-xs text-slate-500 hover:text-slate-800 font-bold flex items-center gap-1 cursor-pointer hover:underline"
                title="استعادة المعلمين الافتراضيين لهذا الصف"
              >
                <RotateCcw size={12} />
                <span>استعادة الافتراضي</span>
              </button>
            </div>
          ) : activeSubTab === 'نصاب الحصص للمواد' ? (
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
          ) : activeSubTab === 'عدد الحصص اليومية' ? (
            <div className="text-xs sm:text-sm font-bold text-slate-800 flex items-center gap-2.5 order-2 sm:order-1 flex-wrap">
              <span>الصفوف: {dailyRows.length}</span>
              <button
                type="button"
                onClick={handleResetDailyRows}
                className="text-xs text-slate-500 hover:text-slate-800 font-bold flex items-center gap-1 cursor-pointer hover:underline"
                title="استعادة الصفوف والحصص اليومية الافتراضية"
              >
                <RotateCcw size={12} />
                <span>استعادة الافتراضي</span>
              </button>
            </div>
          ) : (
            <div className="text-xs sm:text-sm font-bold text-slate-500">
              {activeSubTab}
            </div>
          )}

          {/* أزرار الحفظ والعودة */}
          <div className="flex items-center gap-2.5 order-1 sm:order-2 flex-wrap justify-end">
            <button
              type="button"
              onClick={
                currentStep === 2
                  ? handleSaveTeacherRelations
                  : activeSubTab === 'نصاب الحصص للمواد'
                  ? handleSaveSubjects
                  : handleSaveDailyPeriods
              }
              disabled={isSaving}
              title="حفظ البيانات"
              className="px-6 sm:px-8 py-2 bg-[#0f172a] hover:bg-slate-800 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100 text-white rounded-xl text-xs sm:text-sm font-black shadow-xs transition-all cursor-pointer flex items-center gap-2"
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
        <div className="fixed inset-0 z-60 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overscroll-contain">
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 sm:p-6 shadow-2xl border border-slate-200 space-y-4 animate-in zoom-in-95 overscroll-contain">
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
        <div className="fixed inset-0 z-60 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overscroll-contain">
          <div className="bg-white rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-2xl border border-slate-200 space-y-4 animate-in zoom-in-95 overscroll-contain">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <div>
                <h3 className="text-sm font-black text-slate-900">إضافة مادة دراسية جديدة</h3>
                <p className="text-[11px] text-purple-700 font-bold mt-0.5">
                  خاصة بـ: {selectedGrade} ({selectedStage}) • {studySystem}
                  {isSpecialEdTrackVisible && ` • مسار: ${specialEdTrack}`}
                  {` • ${selectedSemester}`}
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

            {isSyncToSecondSemester ? (
              <div className="text-[11px] text-emerald-800 bg-emerald-50 p-2.5 rounded-xl border border-emerald-200 font-bold flex items-center gap-1.5">
                <Check size={14} className="text-emerald-600 shrink-0" />
                <span>
                  ملاحظة للمرحلة ({selectedStage}): ستتم إضافة هذه المادة تلقائياً في <span className="font-black text-emerald-950">الفصل الدراسي الأول</span> وكذلك <span className="font-black text-emerald-950">الفصل الدراسي الثاني</span>.
                </span>
              </div>
            ) : (
              <div className="text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                ملاحظة: ستتم إضافة هذه المادة فقط ضمن نصاب <span className="font-bold text-slate-800">«{selectedGrade}»</span> دون التأثير على بقية الصفوف أو المراحل.
              </div>
            )}

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

      {/* نافذة إضافة معلم جديد لعدد الحصص اليومية للصف المحدد من الكادر التعليمي فقط */}
      {showAddTeacherModal && (
        <div className="fixed inset-0 z-60 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overscroll-contain">
          <div className="bg-white rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-slate-200 space-y-4 animate-in zoom-in-95 overscroll-contain">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-black text-slate-900">إضافة معلم إلى الصف</h3>
                <p className="text-[11px] text-purple-700 font-bold mt-0.5">
                  خاص بـ: {selectedGrade} ({selectedDailySection} - {selectedStage})
                </p>
              </div>
              <button 
                onClick={() => {
                  setShowAddTeacherModal(false);
                  setSelectedStaffTeacherId('');
                }} 
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {registeredStaff.length === 0 ? (
              <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 text-amber-900 space-y-2 text-xs">
                <div className="font-black text-sm flex items-center gap-1.5">
                  <AlertCircle size={16} className="text-amber-600" />
                  <span>لا توجد بيانات مسجلة في «بطاقة بيانات الكادر التعليمي»</span>
                </div>
                <p className="text-[11px] text-amber-800 leading-relaxed">
                  وفقاً لتعليمات النظام، لا يمكن إضافة أي معلم هنا إلا بعد تسجيله أولاً من خلال 
                  <span className="font-bold underline mx-1">بطاقة بيانات الكادر التعليمي</span>.
                </p>
              </div>
            ) : (
              <>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                    <span>اختر المعلم من الكادر التعليمي المعتمد:</span>
                    <span className="text-[10px] text-purple-600 font-bold">
                      ({registeredStaff.length} معلم مسجل بالكادر)
                    </span>
                  </label>
                  <div className="relative">
                    <select
                      value={selectedStaffTeacherId}
                      onChange={(e) => {
                        const teacherId = e.target.value;
                        setSelectedStaffTeacherId(teacherId);
                        const found = registeredStaff.find(t => (t.id && t.id === teacherId) || t.jobNum === teacherId || t.name === teacherId);
                        if (found) {
                          setNewTeacherName(found.name || '');
                          setNewTeacherSubject(found.subject || found.specialization || 'مادة عامة');
                          setNewTeacherQuota(Number(found.quota) || 24);
                        } else {
                          setNewTeacherName('');
                          setNewTeacherSubject('');
                          setNewTeacherQuota(24);
                        }
                      }}
                      className="w-full appearance-none bg-slate-50 border border-slate-300 rounded-xl py-2.5 pr-3 pl-8 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white cursor-pointer"
                    >
                      <option value="">-- اضغط لاختيار المعلم من الكادر التعليمي --</option>
                      
                      {/* 1. معلمين متطابقين مع القسم والمرحلة */}
                      <optgroup label={`معلمو قسم (${selectedDailySection}) ومرحلة (${selectedStage})`}>
                        {registeredStaff
                          .filter(t => {
                            const secMatches = !t.section || t.section === selectedDailySection || (selectedDailySection === 'بنين' && t.section.includes('بنين')) || (selectedDailySection === 'بنات' && t.section.includes('بنات'));
                            const stgMatches = !t.stage || t.stage === selectedStage || t.stage.includes(selectedStage) || selectedStage.includes(t.stage);
                            return secMatches && stgMatches;
                          })
                          .map(t => (
                            <option key={t.id || t.jobNum || t.name} value={t.id || t.jobNum || t.name}>
                              {t.name} — {t.subject || t.specialization || 'مادة عامة'} (نصاب: {t.quota || 24})
                            </option>
                          ))}
                      </optgroup>

                      {/* 2. باقي معلمي الكادر */}
                      <optgroup label="باقي معلمي الكادر التعليمي">
                        {registeredStaff
                          .filter(t => {
                            const secMatches = !t.section || t.section === selectedDailySection || (selectedDailySection === 'بنين' && t.section.includes('بنين')) || (selectedDailySection === 'بنات' && t.section.includes('بنات'));
                            const stgMatches = !t.stage || t.stage === selectedStage || t.stage.includes(selectedStage) || selectedStage.includes(t.stage);
                            return !(secMatches && stgMatches);
                          })
                          .map(t => (
                            <option key={t.id || t.jobNum || t.name} value={t.id || t.jobNum || t.name}>
                              {t.name} — {t.subject || t.specialization || 'مادة عامة'} ({t.section || 'القسم'} • {t.stage || 'المرحلة'})
                            </option>
                          ))}
                      </optgroup>
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center px-2.5 text-slate-400">
                      <ChevronDown size={14} />
                    </div>
                  </div>
                </div>

                {newTeacherName && (
                  <div className="bg-blue-50/70 border border-blue-100 rounded-2xl p-3.5 space-y-2.5 animate-in fade-in">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                        <User size={14} className="text-blue-600" />
                        {newTeacherName}
                      </span>
                      <span className="text-[10px] font-bold bg-white text-blue-700 px-2 py-0.5 rounded-lg border border-blue-200">
                        {newTeacherSubject || 'مادة عامة'}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 pt-1 border-t border-blue-100">
                      <div>
                        <span className="font-bold text-slate-500">نصاب المعلم الكلي: </span>
                        <span className="font-black text-slate-800">{newTeacherQuota} حصة</span>
                      </div>
                      <div>
                        <span className="font-bold text-slate-500">الصف والقسم: </span>
                        <span className="font-black text-blue-700">{selectedGrade} ({selectedDailySection})</span>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowAddTeacherModal(false);
                  setSelectedStaffTeacherId('');
                }}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handleAddTeacher}
                disabled={!newTeacherName.trim()}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs"
              >
                إضافة المعلم للصف
              </button>
            </div>
          </div>
        </div>
      )}

      {/* نافذة إضافة معلم مكمل من المراحل الباقية فقط (خالية من البنفسجي) */}
      {showComplementaryModal && (
        <div 
          className="fixed inset-0 z-[10000] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 animate-in fade-in"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowComplementaryModal(false);
              setSelectedComplementaryTeacherId('');
            }
          }}
        >
          <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200 w-full max-w-md p-5 sm:p-6 space-y-4 animate-in zoom-in-95 duration-150 text-right" dir="rtl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold border border-blue-100">
                  <UserPlus size={18} />
                </div>
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-black text-slate-900">إضافة معلم مكمل</h4>
                  <p className="text-[11px] text-slate-500 font-medium">
                    قسم: <span className="font-bold text-slate-800">{selectedRelationSection}</span> • للصف: <span className="font-bold text-slate-800">{selectedGrade}</span> • المرحلة الحالية: <span className="font-bold text-slate-800">{selectedStage}</span>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowComplementaryModal(false);
                  setSelectedComplementaryTeacherId('');
                }}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg cursor-pointer transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* 1. اختيار المرحلة من المراحل الباقية فقط */}
            <div className="space-y-1.5">
              <label className="block text-xs font-black text-slate-800">
                1. اختر المرحلة المكمل منها (المراحل الأخرى المتبقية):
              </label>
              {(() => {
                const otherStages = stageOptions.filter(stg => stg !== selectedStage);
                if (otherStages.length === 0) {
                  return (
                    <p className="text-xs text-amber-700 bg-amber-50 p-2.5 rounded-xl border border-amber-200">
                      لا توجد مراحل أخرى متاحة في هذا المجمع.
                    </p>
                  );
                }
                return (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {otherStages.map(stg => {
                      const isSelected = complementaryStage === stg;
                      return (
                        <button
                          key={stg}
                          type="button"
                          onClick={() => {
                            setComplementaryStage(stg);
                            setSelectedComplementaryTeacherId('');
                          }}
                          className={`py-2 px-3 rounded-xl border text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                            isSelected
                              ? 'bg-blue-600 text-white border-blue-600 shadow-xs ring-2 ring-blue-200 ring-offset-1'
                              : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300'
                          }`}
                        >
                          {stg}
                          {isSelected && <Check size={14} />}
                        </button>
                      );
                    })}
                  </div>
                );
              })()}
            </div>

            {/* 2. اختيار المعلم من المرحلة المحددة والقسم المحدد */}
            <div className="space-y-1.5">
              <label className="block text-xs font-black text-slate-800">
                2. اختر المعلم المرتبط بقسم ({selectedRelationSection}) ومرحلة ({complementaryStage || 'المحددة'}):
              </label>
              {(() => {
                const stageStaff = registeredStaff.filter(t => {
                  const secMatches = sectionMatchesStaff(t.section, selectedRelationSection);
                  const tStg = (t.stage || '').trim();
                  const stgMatches = !tStg || tStg === complementaryStage || tStg.includes(complementaryStage) || complementaryStage.includes(tStg);
                  return secMatches && stgMatches;
                });

                const existingTeacherNames = new Set(teacherRelations.map(r => r.teacherName.trim()));
                const availableStaff = stageStaff.filter(t => !existingTeacherNames.has(t.name.trim()));

                if (stageStaff.length === 0) {
                  return (
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-center text-xs text-amber-800 font-medium">
                      لا يوجد معلمون مسجلون في «بطاقة بيانات الكادر التعليمي» لقسم ({selectedRelationSection}) ومرحلة ({complementaryStage}).
                    </div>
                  );
                }

                if (availableStaff.length === 0) {
                  return (
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-center text-xs text-slate-600 font-medium">
                      جميع معلمي مرحلة ({complementaryStage}) مضافون بالفعل لهذا الصف.
                    </div>
                  );
                }

                return (
                  <div className="relative">
                    <select
                      value={selectedComplementaryTeacherId}
                      onChange={(e) => {
                        const val = e.target.value;
                        setSelectedComplementaryTeacherId(val);
                        const t = registeredStaff.find(st => (st.id && st.id === val) || st.jobNum === val || st.name === val);
                        if (t) {
                          const staffQuota = Number(t.quota) || 24;
                          setComplementaryQuota(Math.min(35, Math.max(1, staffQuota)));
                        }
                      }}
                      className="w-full appearance-none bg-slate-50 border border-slate-300 rounded-xl py-2.5 pr-3 pl-8 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white cursor-pointer"
                    >
                      <option value="">-- اضغط لاختيار المعلم المكمل --</option>
                      {availableStaff.map(t => (
                        <option key={t.id || t.jobNum || t.name} value={t.id || t.jobNum || t.name}>
                          {t.name} — {t.subject || t.specialization || 'مادة عامة'} (نصاب: {t.quota || 24})
                        </option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center px-2.5 text-slate-400">
                      <ChevronDown size={14} />
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* معاينة المعلم المختار وتحديد عدد الحصص من 1 إلى 35 */}
            {selectedComplementaryTeacherId && (() => {
              const selectedT = registeredStaff.find(
                t => (t.id && t.id === selectedComplementaryTeacherId) || t.jobNum === selectedComplementaryTeacherId || t.name === selectedComplementaryTeacherId
              );
              if (!selectedT) return null;

              return (
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 space-y-2.5 animate-in fade-in">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                      <User size={14} className="text-blue-600" />
                      {selectedT.name}
                    </span>
                    <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-lg border border-amber-300">
                      مكمل من مرحلة {complementaryStage}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 pt-1 border-t border-slate-200">
                    <div>
                      <span className="font-bold text-slate-500">التخصص / المادة: </span>
                      <span className="font-black text-slate-800">{selectedT.subject || selectedT.specialization || 'مادة عامة'}</span>
                    </div>
                    <div>
                      <span className="font-bold text-slate-500">سيضاف إلى صف: </span>
                      <span className="font-black text-blue-700">{selectedGrade}</span>
                    </div>
                  </div>
                  <div className="pt-2 border-t border-slate-200 flex items-center justify-between gap-2">
                    <label className="text-xs font-black text-slate-800">
                      عدد الحصص المسندة للمعلم (اختر حتى 35):
                    </label>
                    <div className="relative inline-block w-28">
                      <select
                        value={complementaryQuota}
                        onChange={(e) => setComplementaryQuota(parseInt(e.target.value, 10) || 24)}
                        className="w-full appearance-none bg-white border border-slate-300 rounded-lg py-1.5 pr-2.5 pl-6 text-xs font-black text-center text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer shadow-2xs hover:border-slate-400"
                      >
                        {Array.from({ length: 35 }, (_, i) => i + 1).map(n => (
                          <option key={n} value={n}>{n} حصة</option>
                        ))}
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center px-1.5 text-slate-400">
                        <ChevronDown size={12} />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* أزرار الإجراء */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setShowComplementaryModal(false);
                  setSelectedComplementaryTeacherId('');
                }}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handleAddComplementaryTeacher}
                disabled={!selectedComplementaryTeacherId}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs active:scale-95 flex items-center gap-1.5"
              >
                <Check size={14} />
                <span>إضافة المعلم المكمل للصف</span>
              </button>
            </div>
          </div>
        </div>
      )}



      {/* نافذة منبثقة أمام الموقع لعرض رسائل الخطأ والتنبيهات */}
      {showRelationErrorsModal && (
        <div
          className="fixed inset-0 z-[10002] bg-slate-900/65 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in"
          dir="rtl"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowRelationErrorsModal(false);
          }}
        >
          <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl border-2 border-rose-200 w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="bg-rose-50 border-b border-rose-200 px-5 py-3.5 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-rose-600 text-white flex items-center justify-center shadow-xs shrink-0">
                  <AlertTriangle size={20} />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-black text-rose-950">
                    رسائل الخطأ والتنبيهات في العلاقات التدريسية
                  </h3>
                  <p className="text-[11px] font-bold text-rose-800">
                    يرجى معالجة الأخطاء التالية ثم الضغط على «حفظ» مرة أخرى ({selectedRelationSection} • {studySystem} • {selectedStage})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowRelationErrorsModal(false)}
                className="p-1.5 text-rose-500 hover:text-rose-800 hover:bg-rose-100 rounded-lg transition-colors cursor-pointer"
                title="إغلاق"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-4 sm:p-5 overflow-y-auto space-y-3 custom-scrollbar">
              {!relationValidation.hasBlockingRelationAlerts ? (
                <div className="p-4 rounded-xl border border-emerald-300 bg-emerald-50 text-emerald-900 flex items-center gap-2.5 text-sm font-black">
                  <Check size={20} className="text-emerald-600 shrink-0" />
                  <span>تمت معالجة كافة التنبيهات والأخطاء بنجاح! يمكنك الحفظ الآن.</span>
                </div>
              ) : (
                <>
                  {/* 1. تم تخطي عدد الحصص المسندة */}
                  {relationValidation.exceededQuotaAlerts.map((item) => (
                    <div
                      key={`modal_exceed_${item.teacherName}`}
                      className="p-3.5 rounded-xl border-2 border-rose-400 bg-rose-50 text-rose-950 shadow-2xs flex items-start gap-2.5"
                    >
                      <AlertTriangle size={20} className="text-rose-600 shrink-0 mt-0.5" />
                      <div className="space-y-0.5 text-xs sm:text-sm font-black">
                        <div>
                          تم تخطي عدد الحصص المسندة للمعلم ({item.teacherName})!
                        </div>
                        <p className="text-xs font-bold text-rose-800">
                          النصاب المحدد ({item.targetQuota} حصة) ولكن إجمالي الحصص المسندة أصبح ({item.totalAssigned} حصة). يرجى تقليل ({item.totalAssigned - item.targetQuota}) حصة أو زيادة النصاب قبل الحفظ.
                        </p>
                      </div>
                    </div>
                  ))}

                  {/* 2. هذه المادة مسندة لمعلم آخر */}
                  {relationValidation.duplicateSubjectAlerts.map((dup) => (
                    <div
                      key={`modal_dup_${dup.gradeKey}_${dup.subjectId}`}
                      className="p-3.5 rounded-xl border-2 border-red-400 bg-red-50 text-red-950 shadow-2xs flex items-center justify-between gap-3 flex-wrap"
                    >
                      <div className="flex items-start gap-2.5">
                        <AlertTriangle size={20} className="text-red-600 shrink-0 mt-0.5" />
                        <div className="space-y-0.5 text-xs sm:text-sm font-black">
                          <div>
                            هذه المادة ({dup.subjectName} — {dup.grade}) مسندة لمعلم آخر ({dup.teacherNames.join(' ، ')})!
                          </div>
                          <p className="text-xs font-bold text-red-800">
                            لا يمكن إسناد نفس المادة لأكثر من معلم داخل نفس الصف — يرجى إزالة التحديد المكرر قبل الحفظ.
                          </p>
                        </div>
                      </div>
                      {(dup.stage !== selectedStage || dup.grade !== selectedGrade) && (
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedStage(dup.stage);
                            setSelectedGrade(dup.grade);
                            setShowRelationErrorsModal(false);
                          }}
                          className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-black transition-colors cursor-pointer shrink-0"
                        >
                          الانتقال لـ {dup.grade}
                        </button>
                      )}
                    </div>
                  ))}

                  {/* 3. المعلم فلان حصصه غير مكتملة */}
                  {relationValidation.incompleteQuotaAlerts.map((item) => (
                    <div
                      key={`modal_inc_${item.teacherName}`}
                      className="p-3.5 rounded-xl border-2 border-amber-400 bg-amber-50 text-amber-950 shadow-2xs flex items-start gap-2.5"
                    >
                      <AlertCircle size={20} className="text-amber-600 shrink-0 mt-0.5" />
                      <div className="space-y-0.5 text-xs sm:text-sm font-black">
                        <div>
                          المعلم ({item.teacherName}) حصصه غير مكتملة ({item.totalAssigned} من أصل {item.targetQuota} حصة)!
                        </div>
                        <p className="text-xs font-bold text-amber-800">
                          متبقي ({item.remaining} حصة) لإكمال نصاب المعلم — يمكنك اختيار صف آخر من نفس المرحلة وإكمال التحديد قبل الحفظ.
                        </p>
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>

            <div className="bg-slate-50 border-t border-slate-200 px-5 py-3 flex items-center justify-end gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setShowRelationErrorsModal(false)}
                className="px-6 py-2 bg-[#0f172a] hover:bg-slate-800 text-white rounded-xl text-xs font-black transition-all cursor-pointer shadow-xs"
              >
                إغلاق
              </button>
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

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : modalContent;
};
