import { getUsers, loginUser, addUser, updateUser, deleteUser, saveExcelToFirestore, loadExcelFromFirestore } from './lib/api';
import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import * as XLSX from 'xlsx';
import { 
  Save, Calendar, Building2, UserSquare2, 
  Building, GraduationCap, Users, Briefcase, UserCog, HeartHandshake, FileText,
  BarChart, PieChart, Maximize, BatteryCharging, LineChart, Users2, Wallet,
  Activity, LayoutGrid, TrendingUp, Gamepad2, ArrowRight, Trash2, Info, Flame, Settings,
  ChevronDown, Undo2, PaintBucket, Type, Combine, X, Eraser, Grid3X3, Columns, Rows, Image as ImageIcon,
  Shapes, Circle, Square, Triangle, ArrowLeft, ArrowUp, ArrowDown, Star,
  Bold, AlignLeft, AlignCenter, AlignRight, Plus, Minus, ZoomIn, ZoomOut, ChevronUp, Split, Eye, EyeOff, Edit2, Check, Search, Minimize2, Sparkles,
  Mail, Globe, BookOpen, Award, Landmark, CreditCard, Copy
} from 'lucide-react';

interface ActiveSheetData {
  title: string;
  data: any[][];
  merges: XLSX.Range[];
  colWidths?: Record<number, number>;
  rowHeights?: Record<number, number>;
  colors: Record<string, { 
    bg?: string, 
    text?: string, 
    border?: string, 
    image?: string, 
    shape?: string,
    bold?: boolean,
    fontSize?: number,
    textAlign?: 'left' | 'center' | 'right'
  }>;
}

const CLASSERA_OPTIONS = [
  { 
    label: 'ممارس', 
    dotColor: 'bg-emerald-500', 
    textColor: 'text-emerald-700', 
    activeBg: 'bg-emerald-50', 
    hoverBg: 'hover:bg-emerald-50', 
    borderColor: 'border-emerald-300', 
    ringColor: 'ring-emerald-400',
    badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300' 
  },
  { 
    label: 'متقدم', 
    dotColor: 'bg-blue-500', 
    textColor: 'text-blue-700', 
    activeBg: 'bg-blue-50', 
    hoverBg: 'hover:bg-blue-50', 
    borderColor: 'border-blue-300', 
    ringColor: 'ring-blue-400',
    badgeClass: 'bg-blue-100 text-blue-800 border-blue-300' 
  },
  { 
    label: 'خبير', 
    dotColor: 'bg-purple-500', 
    textColor: 'text-purple-700', 
    activeBg: 'bg-purple-50', 
    hoverBg: 'hover:bg-purple-50', 
    borderColor: 'border-purple-300', 
    ringColor: 'ring-purple-400',
    badgeClass: 'bg-purple-100 text-purple-800 border-purple-300' 
  },
  { 
    label: 'محترف', 
    dotColor: 'bg-amber-500', 
    textColor: 'text-amber-700', 
    activeBg: 'bg-amber-50', 
    hoverBg: 'hover:bg-amber-50', 
    borderColor: 'border-amber-300', 
    ringColor: 'ring-amber-400',
    badgeClass: 'bg-amber-100 text-amber-800 border-amber-300' 
  }
];

const SECTION_OPTIONS = [
  { label: 'بنين', icon: '👦', dotColor: 'bg-blue-500', textColor: 'text-blue-700', activeBg: 'bg-blue-50', hoverBg: 'hover:bg-blue-50', borderColor: 'border-blue-300', ringColor: 'ring-blue-400', badgeClass: 'bg-blue-100 text-blue-800 border-blue-300' },
  { label: 'بنات', icon: '👧', dotColor: 'bg-pink-500', textColor: 'text-pink-700', activeBg: 'bg-pink-50', hoverBg: 'hover:bg-pink-50', borderColor: 'border-pink-300', ringColor: 'ring-pink-400', badgeClass: 'bg-pink-100 text-pink-800 border-pink-300' },
];

const STAGE_OPTIONS = [
  { label: 'KG1', dotColor: 'bg-fuchsia-500', textColor: 'text-fuchsia-700', activeBg: 'bg-fuchsia-50', hoverBg: 'hover:bg-fuchsia-50', borderColor: 'border-fuchsia-300', ringColor: 'ring-fuchsia-400', badgeClass: 'bg-fuchsia-100 text-fuchsia-800 border-fuchsia-300' },
  { label: 'KG2', dotColor: 'bg-purple-500', textColor: 'text-purple-700', activeBg: 'bg-purple-50', hoverBg: 'hover:bg-purple-50', borderColor: 'border-purple-300', ringColor: 'ring-purple-400', badgeClass: 'bg-purple-100 text-purple-800 border-purple-300' },
  { label: 'إبتدائي', dotColor: 'bg-emerald-500', textColor: 'text-emerald-700', activeBg: 'bg-emerald-50', hoverBg: 'hover:bg-emerald-50', borderColor: 'border-emerald-300', ringColor: 'ring-emerald-400', badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
  { label: 'متوسط', dotColor: 'bg-amber-500', textColor: 'text-amber-700', activeBg: 'bg-amber-50', hoverBg: 'hover:bg-amber-50', borderColor: 'border-amber-300', ringColor: 'ring-amber-400', badgeClass: 'bg-amber-100 text-amber-800 border-amber-300' },
  { label: 'ثانوي', dotColor: 'bg-blue-500', textColor: 'text-blue-700', activeBg: 'bg-blue-50', hoverBg: 'hover:bg-blue-50', borderColor: 'border-blue-300', ringColor: 'ring-blue-400', badgeClass: 'bg-blue-100 text-blue-800 border-blue-300' },
];

const QUOTA_OPTIONS = Array.from({ length: 35 }, (_, i) => i + 1);

const NATIONALITY_OPTIONS = [
  { label: 'سعودي', flag: '🇸🇦', dotColor: 'bg-emerald-500', textColor: 'text-emerald-700', activeBg: 'bg-emerald-50', hoverBg: 'hover:bg-emerald-50', borderColor: 'border-emerald-300', ringColor: 'ring-emerald-400', badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
  { label: 'مصري', flag: '🇪🇬', dotColor: 'bg-amber-500', textColor: 'text-amber-700', activeBg: 'bg-amber-50', hoverBg: 'hover:bg-amber-50', borderColor: 'border-amber-300', ringColor: 'ring-amber-400', badgeClass: 'bg-amber-100 text-amber-800 border-amber-300' },
  { label: 'سوري', flag: '🇸🇾', dotColor: 'bg-blue-500', textColor: 'text-blue-700', activeBg: 'bg-blue-50', hoverBg: 'hover:bg-blue-50', borderColor: 'border-blue-300', ringColor: 'ring-blue-400', badgeClass: 'bg-blue-100 text-blue-800 border-blue-300' },
  { label: 'سوداني', flag: '🇸🇩', dotColor: 'bg-orange-500', textColor: 'text-orange-700', activeBg: 'bg-orange-50', hoverBg: 'hover:bg-orange-50', borderColor: 'border-orange-300', ringColor: 'ring-orange-400', badgeClass: 'bg-orange-100 text-orange-800 border-orange-300' },
  { label: 'أردني', flag: '🇯🇴', dotColor: 'bg-red-500', textColor: 'text-red-700', activeBg: 'bg-red-50', hoverBg: 'hover:bg-red-50', borderColor: 'border-red-300', ringColor: 'ring-red-400', badgeClass: 'bg-red-100 text-red-800 border-red-300' },
];

const PALETTE = [
  '#ffffff', '#f8fafc', '#f1f5f9', '#e2e8f0', '#cbd5e1', '#94a3b8', '#64748b', '#475569', '#334155', '#1e293b', '#0f172a', // رمادي
  '#fca5a5', '#f87171', '#ef4444', '#dc2626', '#991b1b', // أحمر
  '#fdba74', '#fb923c', '#f97316', '#ea580c', '#9a3412', // برتقالي
  '#fcd34d', '#fbbf24', '#f59e0b', '#d97706', '#92400e', // أصفر/عنبري
  '#bef264', '#a3e635', '#84cc16', '#65a30d', '#3f6212', // أخضر ليموني
  '#86efac', '#4ade80', '#22c55e', '#16a34a', '#14532d', // أخضر
  '#67e8f9', '#22d3ee', '#06b6d4', '#0891b2', '#164e63', // سماوي
  '#93c5fd', '#60a5fa', '#3b82f6', '#2563eb', '#1e3a8a', // أزرق
  '#c4b5fd', '#a78bfa', '#8b5cf6', '#7c3aed', '#4c1d95', // بنفسجي
  '#f9a8d4', '#f472b6', '#ec4899', '#db2777', '#831843'  // وردي
];

const cleanAndDeduplicateOptions = (items: string[], blacklist: string[] = []): string[] => {
  const normalize = (s: string) => {
    let t = s
      .trim()
      .replace(/[أإآٱ]/g, 'ا')
      .replace(/ة/g, 'ه')
      .replace(/[ىيئ]/g, 'ي')
      .replace(/[ـ]/g, '')
      .replace(/\s+/g, ' ')
      .toLowerCase();
    
    // Normalize common dialect / spelling variations
    if (t === 'تربيه رياضه' || t === 'تربيه رياضيه') t = 'تربيه رياضيه';
    if (t === 'حاسب' || t === 'حاسب الي') t = 'حاسب الي';
    if (t === 'اصول دين' || t === 'اصول دين ودعوه') t = 'اصول دين ودعوه';
    if (t === 'خدمه اجتماعيه' || t === 'خدمه اجتماعه') t = 'خدمه اجتماعيه';
    if (t === 'دراسات اسلاميه' || t === 'دراسات اسلامية') t = 'دراسات اسلاميه';
    if (t === 'بكالوريوس التربيه النوعيه' || t === 'بكالوريوس تربيه نوعيه') t = 'بكالوريوس تربيه نوعيه';
    return t;
  };

  const canonicalMap = new Map<string, string>();

  for (const raw of items) {
    if (!raw) continue;
    const str = String(raw).trim();
    if (!str || str.length < 2) continue;
    if (/^\d+$/.test(str)) continue;
    if (blacklist.some(b => str.includes(b))) continue;

    const norm = normalize(str);
    if (!canonicalMap.has(norm)) {
      canonicalMap.set(norm, str);
    } else {
      const current = canonicalMap.get(norm)!;
      // Prefer version with proper Arabic orthography (hamza, taa marbuta)
      const scoreStr = (str.match(/[أإآة]/g) || []).length;
      const scoreCur = (current.match(/[أإآة]/g) || []).length;
      if (scoreStr > scoreCur) {
        canonicalMap.set(norm, str);
      }
    }
  }

  return Array.from(canonicalMap.values()).sort((a, b) => a.localeCompare(b, 'ar'));
};

function InCellEmailEditor({
  initialValue,
  onSave,
  onCancel
}: {
  initialValue: string;
  onSave: (val: string) => void;
  onCancel: () => void;
}) {
  const [val, setVal] = useState(initialValue);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isReadyRef = useRef(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      isReadyRef.current = true;
      if (inputRef.current) {
        inputRef.current.focus();
        const len = inputRef.current.value.length;
        inputRef.current.setSelectionRange(len, len);
      }
    }, 50);
    return () => clearTimeout(timer);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let text = e.target.value;
    if (text.includes('@') && !text.includes('@altanmiyah.edu.sa')) {
      const atIdx = text.lastIndexOf('@');
      const prefix = text.slice(0, atIdx);
      text = `${prefix}@altanmiyah.edu.sa`;
    }
    setVal(text);
  };

  const handleBlur = (e: React.FocusEvent) => {
    if (!isReadyRef.current) return;
    const related = e.relatedTarget as Node | null;
    if (containerRef.current && related && containerRef.current.contains(related)) {
      return;
    }
    onSave(val);
  };

  return (
    <div 
      ref={containerRef}
      className="relative w-full min-w-[210px] flex items-center justify-center p-1 z-50 bg-white"
      onMouseDown={(e) => e.stopPropagation()}
      onMouseUp={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
      onDoubleClick={(e) => e.stopPropagation()}
    >
      <input
        ref={inputRef}
        type="text"
        dir="ltr"
        value={val}
        onChange={handleChange}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            onSave(val);
          } else if (e.key === 'Escape') {
            e.preventDefault();
            onCancel();
          }
        }}
        onBlur={handleBlur}
        className="w-full text-left font-mono px-2.5 py-1 text-xs md:text-sm font-bold bg-white text-blue-900 border-2 border-blue-600 rounded-lg shadow-xl focus:outline-none focus:ring-2 focus:ring-blue-400"
        placeholder="user@altanmiyah.edu.sa"
      />
      {/* Autocomplete helper pill */}
      <div 
        className="email-helper-btn absolute top-full mt-1.5 flex items-center gap-1.5 bg-white border border-blue-300 rounded-xl shadow-2xl p-1.5 z-50 text-xs font-sans animate-in fade-in zoom-in-95"
        onMouseDown={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
      >
        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
            let prefix = val.trim();
            if (prefix.includes('@')) {
              prefix = prefix.split('@')[0];
            }
            const full = `${prefix}@altanmiyah.edu.sa`;
            setVal(full);
            onSave(full);
          }}
          className="px-2.5 py-1 text-xs font-black bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg border border-blue-200 flex items-center gap-1 transition-colors cursor-pointer"
        >
          <Mail size={13} className="text-blue-500" />
          <span>إكمال: @altanmiyah.edu.sa</span>
        </button>
        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onSave(val);
          }}
          className="p-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors cursor-pointer"
          title="حفظ التعديل"
        >
          <Check size={14} />
        </button>
        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onCancel();
          }}
          className="p-1 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg transition-colors cursor-pointer"
          title="إلغاء"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}

const BANK_OPTIONS = [
  'بنك الإنماء',
  'بنك الراجحي',
  'بنك الأهلي'
];

function InCellIbanEditor({
  initialValue,
  onSave,
  onCancel
}: {
  initialValue: string;
  onSave: (val: string) => void;
  onCancel: () => void;
}) {
  const getCleanIban = (raw: string) => {
    const digits = (raw || '').toUpperCase().replace(/^SA/i, '').replace(/[^0-9]/g, '').slice(0, 22);
    return `SA${digits}`;
  };

  const [val, setVal] = useState(() => getCleanIban(initialValue));
  const [copied, setCopied] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isReadyRef = useRef(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      isReadyRef.current = true;
      if (inputRef.current) {
        inputRef.current.focus();
        const len = inputRef.current.value.length;
        inputRef.current.setSelectionRange(len, len);
      }
    }, 50);
    return () => clearTimeout(timer);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let raw = e.target.value.toUpperCase();
    if (!raw.startsWith('SA')) {
      const digitsOnly = raw.replace(/[^0-9]/g, '').slice(0, 22);
      raw = `SA${digitsOnly}`;
    } else {
      const digitsOnly = raw.slice(2).replace(/[^0-9]/g, '').slice(0, 22);
      raw = `SA${digitsOnly}`;
    }
    setVal(raw);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      onSave(val);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onCancel();
    } else if (e.key === 'Backspace') {
      const el = inputRef.current;
      if (el && el.selectionStart !== null && el.selectionStart <= 2 && el.selectionEnd !== null && el.selectionEnd <= 2) {
        e.preventDefault();
      }
    }
  };

  const handleBlur = (e: React.FocusEvent) => {
    if (!isReadyRef.current) return;
    const related = e.relatedTarget as Node | null;
    if (containerRef.current && related && containerRef.current.contains(related)) {
      return;
    }
    onSave(val);
  };

  return (
    <div 
      ref={containerRef}
      className="relative w-full min-w-[260px] flex items-center justify-center p-1 z-50 bg-white rounded-lg shadow-xl border-2 border-emerald-500"
      onMouseDown={(e) => e.stopPropagation()}
      onMouseUp={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
      onDoubleClick={(e) => e.stopPropagation()}
    >
      <div className="w-full flex items-center bg-slate-50 rounded-lg overflow-hidden border border-slate-200 focus-within:ring-2 focus-within:ring-emerald-400">
        <input
          ref={inputRef}
          type="text"
          dir="ltr"
          value={val}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          className="flex-1 text-left font-mono px-3 py-1.5 text-xs md:text-sm font-black bg-white text-slate-900 focus:outline-none tracking-widest"
          placeholder="SA0000000000000000000000"
        />
        <div className="flex items-center px-1.5 gap-1 bg-white border-r border-slate-200 shrink-0">
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
              navigator.clipboard.writeText(val);
              setCopied(true);
              setTimeout(() => setCopied(false), 1500);
            }}
            className="p-1 hover:bg-emerald-50 text-emerald-700 rounded transition-colors cursor-pointer"
            title="نسخ الآيبان كاملاً مع SA"
          >
            {copied ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
          </button>
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onSave(val);
            }}
            className="p-1 hover:bg-emerald-100 text-emerald-600 rounded transition-colors cursor-pointer"
            title="حفظ التعديل (Enter)"
          >
            <Check size={14} />
          </button>
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onCancel();
            }}
            className="p-1 hover:bg-rose-100 text-rose-600 rounded transition-colors cursor-pointer"
            title="إلغاء (Escape)"
          >
            <X size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}

function InCellGeneralEditor({
  initialValue,
  onSave,
  onCancel,
  bold,
  align
}: {
  initialValue: string;
  onSave: (val: string) => void;
  onCancel: () => void;
  bold?: boolean;
  align?: string;
}) {
  const [val, setVal] = useState(initialValue);
  const inputRef = useRef<HTMLInputElement>(null);
  const isReadyRef = useRef(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      isReadyRef.current = true;
      if (inputRef.current) {
        inputRef.current.focus();
        inputRef.current.select();
      }
    }, 50);
    return () => clearTimeout(timer);
  }, []);

  const handleBlur = (e: React.FocusEvent) => {
    if (!isReadyRef.current) return;
    const related = e.relatedTarget as HTMLElement | null;
    if (related && related.closest('.in-cell-general-editor')) return;
    onSave(val);
  };

  return (
    <div 
      className="in-cell-general-editor relative w-full h-full min-h-[36px] flex items-center justify-center p-0.5 z-50 bg-white rounded"
      onMouseDown={(e) => e.stopPropagation()}
      onMouseUp={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
      onDoubleClick={(e) => e.stopPropagation()}
    >
      <div className="relative w-full flex items-center">
        <input
          ref={inputRef}
          type="text"
          value={val}
          onChange={(e) => setVal(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              onSave(val);
            } else if (e.key === 'Escape') {
              e.preventDefault();
              onCancel();
            }
          }}
          onBlur={handleBlur}
          style={{
            fontWeight: bold ? '900' : undefined,
            textAlign: (align as any) || undefined
          }}
          className="w-full text-center px-2 py-1.5 text-xs md:text-sm font-bold bg-white text-slate-900 border-2 border-blue-600 rounded-lg shadow-xl focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
        {/* Floating action buttons to confirm or cancel */}
        <div 
          className="absolute -top-7 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-white border border-slate-300 shadow-md rounded-md px-1.5 py-0.5 z-50 animate-in fade-in"
          onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
        >
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onSave(val);
            }}
            className="p-1 hover:bg-emerald-50 text-emerald-600 rounded cursor-pointer"
            title="حفظ التعديل (Enter)"
          >
            <Check size={13} />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onCancel();
            }}
            className="p-1 hover:bg-rose-50 text-rose-600 rounded cursor-pointer"
            title="إلغاء (Escape)"
          >
            <X size={13} />
          </button>
        </div>
      </div>
    </div>
  );
}

function App() {
  // Authentication states
  const [user, setUser] = useState<{username: string, role: string, complex?: string} | null>(null);
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  const COMPLEXES_LIST = [
    'دار القلم', 'رائدة السلام', 'رحاب المعرفة', 'أضواء الرياض النهضة',
    'أضواء الرياض القادسية', 'المدينة الأكاديمية', 'أسراري', 'السفراء',
    'دار البرائة', 'أجيال ينبع', 'نبع المعرفة', 'منارات ينبع',
    'دار الثقافة', 'نبع المواهب', 'العزيزية بالخبر'
  ];

  const COMPLEX_LOGOS: Record<string, string> = {
    'كل المجمعات': '/1000099843-removebg-preview.png',
    'دار القلم': '/1000099845-removebg-preview.png',
    'رحاب المعرفة': '/1000106495-removebg-preview.png',
    'أسراري': '/1000106498-removebg-preview.png',
    'السفراء': '/1000106499-removebg-preview.png',
    'المدينة الأكاديمية': '/1000106500-removebg-preview.png',
    'دار البرائة': '/1000106501-removebg-preview.png',
    'أضواء الرياض النهضة': '/1000106502-removebg-preview.png',
    'أضواء الرياض القادسية': '/1000106502-removebg-preview.png',
    'رائدة السلام': '/1000106503-removebg-preview.png',
    'نبع المعرفة': '/1000106504-removebg-preview.png',
    'منارات ينبع': '/1000106505-removebg-preview.png',
    'أجيال ينبع': '/1000106506-removebg-preview.png',
    'دار الثقافة': '/1000106507-removebg-preview.png',
    'نبع المواهب': '/1000106508-removebg-preview.png',
    'العزيزية بالخبر': '/1000106509-removebg-preview.png'
  };

  const [showSettings, setShowSettings] = useState(false);
  const [settingsTab, setSettingsTab] = useState<'profile' | 'users'>('profile');
  const [editUsername, setEditUsername] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [addUsername, setAddUsername] = useState('');
  const [addPassword, setAddPassword] = useState('');
  const [addComplex, setAddComplex] = useState(COMPLEXES_LIST[0]);
  const [settingsMessage, setSettingsMessage] = useState({ type: '', text: '' });

  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [visiblePasswords, setVisiblePasswords] = useState<Set<string>>(new Set());
  const [editingUsername, setEditingUsername] = useState<string | null>(null);
  const [editUserForm, setEditUserForm] = useState({ username: '', password: '', complex: '' });

  // حالات تخزين اختيارات المستخدم
  const [academicYear, setAcademicYear] = useState('2026/2027');
  const [complexName, setComplexName] = useState('كل المجمعات');
  const [pathName, setPathName] = useState('كل المسارات');
  const [dataStatus, setDataStatus] = useState('الكل');
  
  // حالة اختيار الفئة (بيانات أو تقارير)
  const [selectedCategory, setSelectedCategory] = useState<'بيانات' | 'تقارير' | null>(null);
  
  // حالة تخزين البيانات بعد الضغط على حفظ لعرضها
  const [savedData, setSavedData] = useState<{ complex: string; year: string; path: string } | null>(null);

  useEffect(() => {
    if (user && user.role !== 'admin' && user.complex) {
      setComplexName(user.complex);
    }
  }, [user]);

  // حالة عرض جدول الإكسيل
  const [activeSheet, setActiveSheet] = useState<ActiveSheetData | null>(null);
  const [isLoadingExcel, setIsLoadingExcel] = useState(false);
  
  // حالة حفظ التعديلات الشاملة
  const [modifiedSheets, setModifiedSheets] = useState<Record<string, ActiveSheetData>>({});
  
  // حالات التعديلات والتحكم
  const [history, setHistory] = useState<ActiveSheetData[]>([]);
  const [selectedCells, setSelectedCells] = useState<Set<string>>(new Set());
  const [menuRow, setMenuRow] = useState<number | null>(null);
  const [menuCol, setMenuCol] = useState<number | null>(null);
  const [dragStart, setDragStart] = useState<{r: number, c: number, type: 'cell'|'col'|'row'} | null>(null);
  const [dragSnapshot, setDragSnapshot] = useState<Set<string>>(new Set());
  const [showShapesMenu, setShowShapesMenu] = useState(false);
  const [showBorderMenu, setShowBorderMenu] = useState(false);
  const [classeraPicker, setClasseraPicker] = useState<{ r: number, c: number, top: number, bottom: number, left: number, right: number } | null>(null);
  const [licensePicker, setLicensePicker] = useState<{ r: number, c: number, top: number, bottom: number, left: number, right: number } | null>(null);
  const [sectionPicker, setSectionPicker] = useState<{ r: number, c: number, top: number, bottom: number, left: number, right: number } | null>(null);
  const [stagePicker, setStagePicker] = useState<{ r: number, c: number, top: number, bottom: number, left: number, right: number } | null>(null);
  const [quotaPicker, setQuotaPicker] = useState<{ r: number, c: number, top: number, bottom: number, left: number, right: number } | null>(null);
  const [nationalityPicker, setNationalityPicker] = useState<{ r: number, c: number, top: number, bottom: number, left: number, right: number } | null>(null);
  const [specializationPicker, setSpecializationPicker] = useState<{ r: number, c: number, top: number, bottom: number, left: number, right: number } | null>(null);
  const [subjectPicker, setSubjectPicker] = useState<{ r: number, c: number, top: number, bottom: number, left: number, right: number } | null>(null);
  const [bankPicker, setBankPicker] = useState<{ r: number, c: number, top: number, bottom: number, left: number, right: number } | null>(null);
  const [qualificationPicker, setQualificationPicker] = useState<{ r: number, c: number, top: number, bottom: number, left: number, right: number } | null>(null);
  const [jobPicker, setJobPicker] = useState<{ r: number, c: number, top: number, bottom: number, left: number, right: number } | null>(null);
  const [affiliationPicker, setAffiliationPicker] = useState<{ r: number, c: number, top: number, bottom: number, left: number, right: number } | null>(null);
  const [editingCell, setEditingCell] = useState<{ r: number, c: number, value: string } | null>(null);
  const [customNationalityInput, setCustomNationalityInput] = useState('');
  const [customSpecializationInput, setCustomSpecializationInput] = useState('');
  const [customSubjectInput, setCustomSubjectInput] = useState('');
  const [customBankInput, setCustomBankInput] = useState('');
  const [customJobInput, setCustomJobInput] = useState('');
  const [customQualificationInput, setCustomQualificationInput] = useState('');
  const [customBankOptions, setCustomBankOptions] = useState<string[]>([]);
  const [customSubjectOptions, setCustomSubjectOptions] = useState<string[]>([]);
  const [customJobOptions, setCustomJobOptions] = useState<string[]>([]);
  const [copiedCellKey, setCopiedCellKey] = useState<string | null>(null);
  const [pickerSearchQuery, setPickerSearchQuery] = useState('');
  const [activeReportCategory, setActiveReportCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sheetSearchQuery, setSheetSearchQuery] = useState('');

  const [resizing, setResizing] = useState<{type: 'col' | 'row', index: number, startPos: number, startSize: number} | null>(null);
  const [zoom, setZoom] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isToolbarCollapsed, setIsToolbarCollapsed] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const tableContentRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);
  const scrollAnimationRef = useRef<number>(0);
  const lastMousePosRef = useRef({ x: 0, y: 0 });
  const dragStartRef = useRef(dragStart);
  const dragSnapshotRef = useRef(dragSnapshot);
  const selectedCellsRef = useRef(selectedCells);
  const activeSheetRef = useRef(activeSheet);

  useEffect(() => { dragStartRef.current = dragStart; }, [dragStart]);
  useEffect(() => { dragSnapshotRef.current = dragSnapshot; }, [dragSnapshot]);
  useEffect(() => { selectedCellsRef.current = selectedCells; }, [selectedCells]);
  useEffect(() => { activeSheetRef.current = activeSheet; }, [activeSheet]);

  const autoScroll = () => {
    if (isDraggingRef.current && scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const rect = container.getBoundingClientRect();
      const { x, y } = lastMousePosRef.current;
      
      const scrollSpeed = 15;
      const threshold = 50; 
      
      // Scroll vertically
      if (y < rect.top + threshold) {
        container.scrollTop -= scrollSpeed;
      } else if (y > rect.bottom - threshold) {
        container.scrollTop += scrollSpeed;
      }
      
      // Scroll horizontally (RTL logic)
      if (x < rect.left + threshold) {
        container.scrollLeft -= scrollSpeed; 
      } else if (x > rect.right - threshold) {
        container.scrollLeft += scrollSpeed;
      }
      
      scrollAnimationRef.current = requestAnimationFrame(autoScroll);
    }
  };

  // إغلاق القوائم عند النقر خارجها وإنهاء السحب
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      // إغلاق قوائم الصفوف والأعمدة
      setMenuRow(null);
      setMenuCol(null);
      
      // إغلاق قائمة الأشكال إذا نقر خارجها
      const target = e.target as HTMLElement;
      if (!target.closest('.shapes-menu-container')) {
        setShowShapesMenu(false);
      }
      if (!target.closest('.border-menu-container')) {
        setShowBorderMenu(false);
      }
    };
    
    const handleMouseUp = () => {
      setDragStart(null);
      setDragSnapshot(new Set());
      isDraggingRef.current = false;
      cancelAnimationFrame(scrollAnimationRef.current);
    };

    const handleMouseMove = (e: MouseEvent) => {
      lastMousePosRef.current = { x: e.clientX, y: e.clientY };
      
      if (isDraggingRef.current) {
        // Find cell and select
        const target = document.elementFromPoint(e.clientX, e.clientY);
        const td = target?.closest('td');
        if (td) {
          const r = td.getAttribute('data-row');
          const c = td.getAttribute('data-col');
          if (r != null && c != null) {
            // We can dispatch a custom event or let standard React onMouseEnter handle it
            // but standard React might not fire if only scrolling happens. Let's just dispatch a MouseEvent
            // Actually, manual selection logic here is best:
            const rIndex = parseInt(r);
            const cIndex = parseInt(c);
            
            const start = dragStartRef.current;
            if (start && start.type === 'cell') {
              const minR = Math.min(start.r, rIndex);
              const maxR = Math.max(start.r, rIndex);
              const minC = Math.min(start.c, cIndex);
              const maxC = Math.max(start.c, cIndex);
              
              const newSet = new Set(dragSnapshotRef.current);
              for (let row = minR; row <= maxR; row++) {
                for (let col = minC; col <= maxC; col++) {
                  newSet.add(`${row},${col}`);
                }
              }
              setSelectedCells(newSet);
            }
          }
        }
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') return;

      if ((e.ctrlKey || e.metaKey) && (e.key.toLowerCase() === 'z' || e.code === 'KeyZ')) {
        e.preventDefault();
        setHistory(prev => {
          if (prev.length > 0) {
            const previousState = prev[prev.length - 1];
            setActiveSheet(previousState);
            return prev.slice(0, -1);
          }
          return prev;
        });
      } else if (e.key === 'Enter' || e.key === 'F2') {
        const curSelected = selectedCellsRef.current;
        const curSheet = activeSheetRef.current;
        if (curSelected.size === 1 && curSheet) {
          const firstKey = String(Array.from(curSelected)[0] || '');
          const [r, c] = firstKey.split(',').map(Number);
          e.preventDefault();
          closeAllPickers();
          setEditingCell({
            r,
            c,
            value: String(curSheet.data[r]?.[c] ?? '')
          });
        }
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        const curSelected = selectedCellsRef.current;
        const curSheet = activeSheetRef.current;
        if (curSelected.size > 0 && curSheet) {
          e.preventDefault();
          setHistory(prev => [...prev, curSheet]);
          const newData = curSheet.data.map(row => [...row]);
          curSelected.forEach(key => {
            const [r, c] = String(key).split(',').map(Number);
            if (newData[r] && newData[r][c] !== undefined) {
              newData[r][c] = '';
            }
          });
          const updated = { ...curSheet, data: newData };
          setActiveSheet(updated);
          setModifiedSheets(prev => ({ ...prev, [curSheet.title]: updated }));
        }
      } else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
        const curSelected = selectedCellsRef.current;
        const curSheet = activeSheetRef.current;
        if (curSelected.size === 1 && curSheet) {
          const firstKey = String(Array.from(curSelected)[0] || '');
          const [r, c] = firstKey.split(',').map(Number);
          closeAllPickers();
          setEditingCell({
            r,
            c,
            value: e.key
          });
        }
      }
    };
    
    window.addEventListener('click', handleClickOutside);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('click', handleClickOutside);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('keydown', handleKeyDown);
      cancelAnimationFrame(scrollAnimationRef.current);
    };
  }, []);

  // Update isDragging reference when dragStart changes
  useEffect(() => {
    if (dragStart) {
      isDraggingRef.current = true;
      cancelAnimationFrame(scrollAnimationRef.current);
      scrollAnimationRef.current = requestAnimationFrame(autoScroll);
    } else {
      isDraggingRef.current = false;
      cancelAnimationFrame(scrollAnimationRef.current);
    }
  }, [dragStart]);

  useEffect(() => {
    if (!resizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      // For RTL, dragging left reduces clientX, which should increase width
      const diff = resizing.type === 'col' 
        ? resizing.startPos - e.clientX
        : e.clientY - resizing.startPos;

      const newSize = Math.max(resizing.type === 'col' ? 30 : 20, resizing.startSize + diff);
      
      setActiveSheet(prev => {
        if (!prev) return prev;
        if (resizing.type === 'col') {
          return { ...prev, colWidths: { ...(prev.colWidths || {}), [resizing.index]: newSize } };
        } else {
          return { ...prev, rowHeights: { ...(prev.rowHeights || {}), [resizing.index]: newSize } };
        }
      });
    };

    const handleMouseUp = () => {
      setResizing(null);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [resizing]);

  const handleInsertShape = (shapeId: string) => {
    if (!activeSheet || selectedCells.size === 0) return;
    setHistory(prev => [...prev, activeSheet]);
    const newColors = { ...activeSheet.colors };
    selectedCells.forEach(key => {
      if (shapeId === '') {
        const { shape, ...rest } = newColors[key] || {};
        newColors[key] = rest;
      } else {
        newColors[key] = { ...newColors[key], shape: shapeId };
      }
    });
    setActiveSheet({ ...activeSheet, colors: newColors });
    setShowShapesMenu(false);
  };

  const loadSheetData = async (title: string, sheetName: string) => {
    // التحقق مما إذا كان الشيت معدل مسبقاً ومحفوظ محلياً
    if (modifiedSheets[title]) {
      const cached = modifiedSheets[title];
      const hasFemale = cached.data?.some((r: any[]) => r && r.some((c: any) => String(c).includes('أثير محمد بن سعد الحربي')));
      const hasSectionCol = cached.data?.[2]?.some((c: any) => String(c).trim() === 'القسم');
      const hasIbanCol = cached.data?.some((r: any[]) => r && r.some((c: any) => String(c || '').trim() === 'IBANالبنكي'));
      const isTeacherCard = title === 'بيانات الكادر التعليمي' || title === 'بيانات المعلمين' || title === 'المعلمين';
      const isTeacherValid = !isTeacherCard || (hasFemale && hasSectionCol && hasIbanCol);

      const hasAdminData = cached.data?.some((r: any[]) => r && r.some((c: any) => String(c).includes('عمرو عبدالتواب عطا'))) &&
                           cached.data?.some((r: any[]) => r && r.some((c: any) => String(c).includes('ريما فهد القحطاني')));
      const hasAffiliationCol = cached.data?.some((r: any[]) => r && r.some((c: any) => String(c || '').trim() === 'تبعية الموظف'));
      const isAdminCard = title === 'بيانات الكادر الإداري' || title === 'ادارة المجمع' || title === 'إدارة المجمع';
      const isAdminValid = !isAdminCard || (hasAdminData && hasIbanCol && hasAffiliationCol);

      if (isTeacherValid && isAdminValid) {
        setHistory([]);
        setSelectedCells(new Set());
        setMenuRow(null);
        setMenuCol(null);
        setZoom(1);
        setSheetSearchQuery('');
        setActiveSheet({ ...cached });
        return;
      }
    }

    try {
      setIsLoadingExcel(true);
      
      let arrayBuffer = await loadExcelFromFirestore();
      if (!arrayBuffer) {
        const response = await fetch('/data.xlsx');
        arrayBuffer = await response.arrayBuffer();
      }

      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      
      if (!workbook.SheetNames.includes(sheetName)) {
        alert(`عذراً، الشيت "${sheetName}" غير موجود في الملف.`);
        setIsLoadingExcel(false);
        return;
      }

      const worksheet = workbook.Sheets[sheetName];
      const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: "", raw: false }) as any[][];
      
      let maxCols = 0;
      rawData.forEach(row => { if (row.length > maxCols) maxCols = row.length; });
      const normalizedData = rawData.map(row => {
        const newRow = [...row];
        while (newRow.length < maxCols) newRow.push("");
        return newRow;
      });

      let merges = [...(worksheet['!merges'] || [])];

      // التأكد من تضمين بيانات المعلمات تحت بيانات المعلمين في نفس الجدول (الكادر التعليمي)
      if ((title === 'بيانات الكادر التعليمي' || title === 'بيانات المعلمين' || sheetName === 'المعلمين') && workbook.Sheets['المعلمات']) {
        const alreadyHasFemale = normalizedData.some(row => 
          row && row.some(cell => String(cell).includes('أثير محمد بن سعد الحربي'))
        );

        if (!alreadyHasFemale) {
          const wsF = workbook.Sheets['المعلمات'];
          const rawDataF = XLSX.utils.sheet_to_json(wsF, { header: 1, defval: "", raw: false }) as any[][];
          const femaleTeachers = rawDataF.slice(3, 28);

          const femaleHeaderRow = new Array(maxCols).fill("");
          femaleHeaderRow[0] = "";
          femaleHeaderRow[1] = "معلمات";
          femaleHeaderRow[2] = "بيانات  المعلمات ( جميع المراحل )";

          const mappedFemale = femaleTeachers.map((row, idx) => {
            const newRow = new Array(maxCols).fill("");
            newRow[0] = row[0] || (idx + 1);
            newRow[1] = row[1];
            newRow[2] = row[2];
            newRow[3] = row[3];
            newRow[4] = row[4];
            newRow[5] = row[5];
            newRow[6] = row[6];
            newRow[7] = row[7];
            newRow[8] = row[8];
            newRow[9] = row[9];
            newRow[10] = row[10];
            newRow[11] = "";
            newRow[12] = row[11];
            newRow[13] = "";
            newRow[14] = row[12];
            return newRow;
          });

          let insertIdx = normalizedData.findIndex((r, idx) => idx > 3 && (!r[2] || String(r[6]).includes('المرحلة') || String(r[7]).includes('المرحلة')));
          if (insertIdx === -1) insertIdx = normalizedData.length;

          // إضافة دمج شريط عنوان المعلمات
          merges.push({
            s: { c: 2, r: insertIdx },
            e: { c: Math.min(14, maxCols - 1), r: insertIdx }
          });

          normalizedData.splice(insertIdx, 0, femaleHeaderRow, ...mappedFemale);
        }
      }

      // التأكد من وجود عامود "القسم" بعد عامود الاسم في الكادر التعليمي
      if (title === 'بيانات الكادر التعليمي' || title === 'بيانات المعلمين' || sheetName === 'المعلمين') {
        const headerRowIdx = 2;
        if (normalizedData[headerRowIdx]) {
          const hasSectionCol = normalizedData[headerRowIdx].some(c => String(c || '').trim() === 'القسم');
          if (!hasSectionCol) {
            let nameColIdx = normalizedData[headerRowIdx].findIndex(c => String(c || '').includes('اسم'));
            if (nameColIdx === -1) nameColIdx = 2;
            const insertColIdx = nameColIdx + 1; // مباشرة بعد عامود الاسم

            // تحديث الدمج للأعمدة التي بعد عامود الاسم
            merges = merges.map(m => {
              let s = { ...m.s };
              let e = { ...m.e };
              if (s.c >= insertColIdx) s.c++;
              if (e.c >= insertColIdx) e.c++;
              return { s, e };
            });

            // تحديد مؤشر شريط عنوان المعلمات إن وُجد
            const femaleHeaderIndex = normalizedData.findIndex(r => r && (String(r[1] || '') === 'معلمات' || String(r[2] || '').includes('بيانات  المعلمات')));

            normalizedData.forEach((row, rIdx) => {
              if (rIdx < headerRowIdx) {
                row.splice(insertColIdx, 0, "");
              } else if (rIdx === headerRowIdx) {
                row.splice(insertColIdx, 0, "القسم");
              } else if (femaleHeaderIndex !== -1 && rIdx === femaleHeaderIndex) {
                row.splice(insertColIdx, 0, "");
              } else {
                const hasRowData = row.some((c, idx) => idx !== 0 && c !== "");
                if (!hasRowData) {
                  row.splice(insertColIdx, 0, "");
                } else if (femaleHeaderIndex !== -1 && rIdx > femaleHeaderIndex) {
                  row.splice(insertColIdx, 0, "بنات");
                } else {
                  row.splice(insertColIdx, 0, "بنين");
                }
              }
            });
          }
        }
      }

      // التأكد من تضمين بيانات الإداريين والإداريات تحت بيانات إدارة المجمع في نفس الجدول (الكادر الإداري)
      if ((title === 'بيانات الكادر الإداري' || title === 'ادارة المجمع' || title === 'إدارة المجمع' || sheetName === 'إدارة المجمع') && (workbook.Sheets['اداريين دار القلم'] || workbook.Sheets['اداريات دار القلم'])) {
        const alreadyHasAdmins = normalizedData.some(row => 
          row && row.some(cell => String(cell).includes('عمرو عبدالتواب عطا'))
        );

        if (!alreadyHasAdmins) {
          // تحديث عنوان الشيت الرئيسي في الصف الأول ورؤوس الأعمدة
          if (normalizedData[0]) {
            normalizedData[0][0] = "";
            normalizedData[0][1] = "بيانات الكادر الإداري";
          }
          if (normalizedData[1]) {
            if (normalizedData[1][1] === "اسم الموظفة رباعي") {
              normalizedData[1][1] = "اسم الموظف / الموظفة رباعي";
            }
            if (normalizedData[1][10] === "رخصة") {
              normalizedData[1][10] = "الرخصة المهنية";
            }
          }

          // تصفية صفوف إدارة المجمع لإزالة أي صفوف فارغة في النهاية
          const mgmtRows = normalizedData.slice(2).filter(row => row.some(c => c !== ""));
          
          // شريط عنوان إدارة المجمع
          const mgmtHeaderRow = new Array(maxCols).fill("");
          mgmtHeaderRow[0] = "إدارة";
          mgmtHeaderRow[1] = "إدارة المجمع";

          const mergedRows: any[][] = [
            normalizedData[0],
            normalizedData[1],
            mgmtHeaderRow,
            ...mgmtRows
          ];

          // إعادة بناء الدمج
          const newMerges: XLSX.Range[] = [
            { s: { c: 1, r: 0 }, e: { c: Math.min(10, maxCols - 1), r: 0 } },
            { s: { c: 1, r: 2 }, e: { c: Math.min(10, maxCols - 1), r: 2 } }
          ];

          // 1. إضافة بيانات الإداريين (قسم البنين)
          if (workbook.Sheets['اداريين دار القلم']) {
            const wsM = workbook.Sheets['اداريين دار القلم'];
            const rawM = XLSX.utils.sheet_to_json(wsM, { header: 1, defval: "", raw: false }) as any[][];
            const maleAdmins = rawM.filter((r, idx) => {
              const jobNum = r[1];
              const name = r[2];
              return (typeof jobNum === "number" || (typeof jobNum === "string" && /^\d+$/.test(jobNum.trim()))) && name && typeof name === "string" && idx < 22;
            });

            const maleHeaderRow = new Array(maxCols).fill("");
            maleHeaderRow[0] = "إداريين";
            maleHeaderRow[1] = "بيانات الإداريين (قسم البنين)";

            const mappedMale = maleAdmins.map(row => {
              const newRow = new Array(maxCols).fill("");
              for (let c = 0; c <= 10; c++) {
                newRow[c] = row[c + 1] !== undefined ? row[c + 1] : "";
              }
              return newRow;
            });

            const maleHeaderIdx = mergedRows.length;
            newMerges.push({
              s: { c: 1, r: maleHeaderIdx },
              e: { c: Math.min(10, maxCols - 1), r: maleHeaderIdx }
            });

            mergedRows.push(maleHeaderRow, ...mappedMale);
          }

          // 2. إضافة بيانات الإداريات (قسم البنات)
          if (workbook.Sheets['اداريات دار القلم']) {
            const wsF = workbook.Sheets['اداريات دار القلم'];
            const rawF = XLSX.utils.sheet_to_json(wsF, { header: 1, defval: "", raw: false }) as any[][];
            const femaleAdmins = rawF.filter((r, idx) => {
              const jobNum = r[1];
              const name = r[2];
              return (typeof jobNum === "number" || (typeof jobNum === "string" && /^\d+$/.test(jobNum.trim()))) && name && typeof name === "string" && idx < 25;
            });

            const femaleHeaderRow = new Array(maxCols).fill("");
            femaleHeaderRow[0] = "إداريات";
            femaleHeaderRow[1] = "بيانات الإداريات (قسم البنات)";

            const mappedFemale = femaleAdmins.map(row => {
              const newRow = new Array(maxCols).fill("");
              for (let c = 0; c <= 10; c++) {
                newRow[c] = row[c + 1] !== undefined ? row[c + 1] : "";
              }
              return newRow;
            });

            const femaleHeaderIdx = mergedRows.length;
            newMerges.push({
              s: { c: 1, r: femaleHeaderIdx },
              e: { c: Math.min(10, maxCols - 1), r: femaleHeaderIdx }
            });

            mergedRows.push(femaleHeaderRow, ...mappedFemale);
          }

          normalizedData.length = 0;
          normalizedData.push(...mergedRows);
          merges = newMerges;
        }
      }
      
      // التأكد من وجود عامود "تبعية الموظف" بجانب عامود اسم الموظف في الكادر الإداري
      if (title === 'بيانات الكادر الإداري' || title === 'ادارة المجمع' || title === 'إدارة المجمع' || sheetName === 'إدارة المجمع') {
        const headerRowIdx = 1;
        if (normalizedData[headerRowIdx]) {
          const hasAffiliationCol = normalizedData[headerRowIdx].some(c => String(c || '').trim() === 'تبعية الموظف');
          if (!hasAffiliationCol) {
            let nameColIdx = normalizedData[headerRowIdx].findIndex(c => String(c || '').includes('اسم'));
            if (nameColIdx === -1) nameColIdx = 1;
            const insertColIdx = nameColIdx + 1; // مباشرة بجانب عامود اسم الموظف

            // تحديث الدمج للأعمدة التي بعد عامود الاسم
            merges = merges.map(m => {
              let s = { ...m.s };
              let e = { ...m.e };
              if (s.c >= insertColIdx) s.c++;
              if (e.c >= insertColIdx) e.c++;
              return { s, e };
            });

            // تحديد مؤشرات فواصل الأقسام (إدارة المجمع / بنين / بنات)
            const maleAdminHeaderIdx = normalizedData.findIndex(r => r && (String(r[0] || '') === 'إداريين' || String(r[1] || '').includes('قسم البنين')));
            const femaleAdminHeaderIdx = normalizedData.findIndex(r => r && (String(r[0] || '') === 'إداريات' || String(r[1] || '').includes('قسم البنات')));

            normalizedData.forEach((row, rIdx) => {
              if (rIdx < headerRowIdx) {
                row.splice(insertColIdx, 0, "");
              } else if (rIdx === headerRowIdx) {
                row.splice(insertColIdx, 0, "تبعية الموظف");
              } else if ((maleAdminHeaderIdx !== -1 && rIdx === maleAdminHeaderIdx) || (femaleAdminHeaderIdx !== -1 && rIdx === femaleAdminHeaderIdx) || (rIdx === 2 && String(row[0] || '') === 'إدارة')) {
                row.splice(insertColIdx, 0, "");
              } else {
                const hasRowData = row.some((c, idx) => idx !== 0 && c !== "");
                if (!hasRowData) {
                  row.splice(insertColIdx, 0, "");
                } else if (femaleAdminHeaderIdx !== -1 && rIdx > femaleAdminHeaderIdx) {
                  row.splice(insertColIdx, 0, "إداري بنات");
                } else if (maleAdminHeaderIdx !== -1 && rIdx > maleAdminHeaderIdx) {
                  row.splice(insertColIdx, 0, "إداري بنين");
                } else {
                  row.splice(insertColIdx, 0, "إدارة المجمع");
                }
              }
            });
          }
        }
      }

      // التأكد من وجود عامود "IBANالبنكي" وعامود "البنك" مباشرة بعد اسم الموظف
      let empHeaderIdx = -1;
      for (let r = 0; r < Math.min(5, normalizedData.length); r++) {
        if (normalizedData[r] && normalizedData[r].some(c => {
          const s = String(c || '').trim();
          return s.includes('اسم الموظف') || s.includes('اسم الموظفة') || s === 'اسم الموظف رباعي';
        })) {
          empHeaderIdx = r;
          break;
        }
      }
      if (empHeaderIdx === -1) {
        for (let r = 0; r < Math.min(5, normalizedData.length); r++) {
          if (normalizedData[r] && normalizedData[r].some(c => String(c || '').trim().includes('اسم'))) {
            empHeaderIdx = r;
            break;
          }
        }
      }

      if (empHeaderIdx !== -1 && normalizedData[empHeaderIdx]) {
        const hasIbanCol = normalizedData[empHeaderIdx].some(c => {
          const s = String(c || '').trim();
          return s === 'IBANالبنكي' || s === 'IBAN البنكي' || s === 'IBAN' || s === 'الايبان';
        });

        if (!hasIbanCol) {
          let nameColIdx = normalizedData[empHeaderIdx].findIndex(c => String(c || '').trim().includes('اسم'));
          if (nameColIdx === -1) nameColIdx = 2;

          let insertColIdx = nameColIdx + 1;
          // إذا كان عامود القسم أو تبعية الموظف موجوداً مباشرة بعد الاسم، نضع الآيبان والبنك بعده
          if (normalizedData[empHeaderIdx][insertColIdx] && (
            String(normalizedData[empHeaderIdx][insertColIdx]).trim() === 'القسم' ||
            String(normalizedData[empHeaderIdx][insertColIdx]).trim() === 'تبعية الموظف'
          )) {
            insertColIdx = nameColIdx + 2;
          }

          // تحديث الدمج للأعمدة
          merges = merges.map(m => {
            let s = { ...m.s };
            let e = { ...m.e };
            if (s.c >= insertColIdx) s.c += 2;
            if (e.c >= insertColIdx) e.c += 2;
            return { s, e };
          });

          normalizedData.forEach((row, rIdx) => {
            if (rIdx < empHeaderIdx) {
              row.splice(insertColIdx, 0, "", "");
            } else if (rIdx === empHeaderIdx) {
              row.splice(insertColIdx, 0, "IBANالبنكي", "البنك");
            } else {
              const rowStr = row.map(c => String(c || '')).join(' ');
              const isSubHeader = rowStr.includes("بيانات  المعلمات") || rowStr.includes("بيانات المعلمات") || rowStr.includes("بيانات الإداريين") || rowStr.includes("بيانات  الإداريات") || rowStr.includes("إدارة المجمع");
              const hasRowData = row.some((c, idx) => idx !== 0 && c !== "");

              if (isSubHeader || !hasRowData) {
                row.splice(insertColIdx, 0, "", "");
              } else {
                row.splice(insertColIdx, 0, "SA", "");
              }
            }
          });
        } else {
          // إذا كان عامود الآيبان موجوداً، التأكد من أن كل خلايا صفوف الموظفين تبدأ بـ SA
          const ibanIdx = normalizedData[empHeaderIdx].findIndex(c => {
            const s = String(c || '').trim();
            return s === 'IBANالبنكي' || s === 'IBAN البنكي' || s === 'IBAN';
          });
          if (ibanIdx !== -1) {
            for (let r = empHeaderIdx + 1; r < normalizedData.length; r++) {
              const row = normalizedData[r];
              if (!row) continue;
              const rowStr = row.map(c => String(c || '')).join(' ');
              const isSubHeader = rowStr.includes("بيانات  المعلمات") || rowStr.includes("بيانات المعلمات") || rowStr.includes("بيانات الإداريين") || rowStr.includes("بيانات  الإداريات") || rowStr.includes("إدارة المجمع");
              const hasRowData = row.some((c, idx) => idx !== 0 && c !== "");
              if (hasRowData && !isSubHeader && (!row[ibanIdx] || row[ibanIdx] === '')) {
                row[ibanIdx] = "SA";
              }
            }
          }
        }
      }

      // تصفير جميع الحالات عند فتح شيت جديد
      setHistory([]);
      setSelectedCells(new Set());
      setMenuRow(null);
      setMenuCol(null);
      setZoom(1);
      setSheetSearchQuery('');
      setActiveSheet({ title, data: normalizedData, merges, colors: {} });
    } catch (error) {
      console.error("Error loading Excel file:", error);
      alert("حدث خطأ أثناء قراءة ملف الإكسيل. تأكد من وجوده في المسار الصحيح.");
    } finally {
      setIsLoadingExcel(false);
    }
  };

  const deleteRow = (rIndex: number) => {
    if (!activeSheet) return;
    setHistory(prev => [...prev, activeSheet]);
    const newData = [...activeSheet.data];
    newData.splice(rIndex, 1);
    
    const newMerges = activeSheet.merges.map(m => {
      let s = { ...m.s }; let e = { ...m.e };
      if (rIndex < s.r) s.r--;
      if (rIndex <= e.r && rIndex > s.r) e.r--;
      if (rIndex === e.r && s.r === e.r) return null; // حذف الدمج إذا تم حذف الصف بالكامل
      if (rIndex === s.r) { if (s.r === e.r) return null; e.r--; }
      return { s, e };
    }).filter(Boolean) as XLSX.Range[];
    
    setActiveSheet({ ...activeSheet, data: newData, merges: newMerges });
    setMenuRow(null);
  };

  const insertRow = (rIndex: number, offset: number) => {
    if (!activeSheet) return;
    setHistory(prev => [...prev, activeSheet]);
    const newData = [...activeSheet.data];
    const newRow = new Array(newData[0]?.length || 1).fill("");
    newData.splice(rIndex + offset, 0, newRow);
    
    const newMerges = activeSheet.merges.map(m => {
      let s = { ...m.s }; let e = { ...m.e };
      if (s.r >= rIndex + offset) s.r++;
      if (e.r >= rIndex + offset) e.r++;
      return { s, e };
    });
    
    setActiveSheet({ ...activeSheet, data: newData, merges: newMerges });
    setMenuRow(null);
  };

  const deleteCol = (cIndex: number) => {
    if (!activeSheet) return;
    setHistory(prev => [...prev, activeSheet]);
    const newData = activeSheet.data.map(row => {
      const newRow = [...row];
      newRow.splice(cIndex, 1);
      return newRow;
    });
    
    const newMerges = activeSheet.merges.map(m => {
      let s = { ...m.s }; let e = { ...m.e };
      if (cIndex < s.c) s.c--;
      if (cIndex <= e.c && cIndex > s.c) e.c--;
      if (cIndex === e.c && s.c === e.c) return null; 
      if (cIndex === s.c) { if (s.c === e.c) return null; e.c--; }
      return { s, e };
    }).filter(Boolean) as XLSX.Range[];
    
    setActiveSheet({ ...activeSheet, data: newData, merges: newMerges });
    setMenuCol(null);
  };

  const insertCol = (cIndex: number, offset: number) => {
    if (!activeSheet) return;
    setHistory(prev => [...prev, activeSheet]);
    const newData = activeSheet.data.map(row => {
      const newRow = [...row];
      newRow.splice(cIndex + offset, 0, "");
      return newRow;
    });
    
    const newMerges = activeSheet.merges.map(m => {
      let s = { ...m.s }; let e = { ...m.e };
      if (s.c >= cIndex + offset) s.c++;
      if (e.c >= cIndex + offset) e.c++;
      return { s, e };
    });
    
    setActiveSheet({ ...activeSheet, data: newData, merges: newMerges });
    setMenuCol(null);
  };

  const handleUndo = () => {
    if (history.length > 0) {
      const previousState = history[history.length - 1];
      setActiveSheet(previousState);
      setHistory(prev => prev.slice(0, -1));
      // لا نحذف التحديد (selectedCells) ليبقى الشريط العائم ظاهراً
    }
  };

  const isTeacherSheet = activeSheet?.title === 'بيانات الكادر التعليمي' || activeSheet?.title === 'بيانات المعلمين' || activeSheet?.title === 'المعلمين';

  const classeraColIndex = React.useMemo(() => {
    if (!activeSheet) return -1;
    for (let r = 0; r < Math.min(5, activeSheet.data.length); r++) {
      const row = activeSheet.data[r];
      if (row) {
        const idx = row.findIndex(c => String(c || '').trim() === 'كلاسيرا' || String(c || '').includes('كلاسيرا'));
        if (idx !== -1) return idx;
      }
    }
    if (isTeacherSheet) {
      const hasSec = activeSheet.data?.[2]?.some(c => String(c || '').trim() === 'القسم');
      return hasSec ? 14 : 13;
    }
    return -1;
  }, [activeSheet, isTeacherSheet]);

  const isClasseraCell = (rIdx: number, cIdx: number) => {
    if (!activeSheet || classeraColIndex === -1 || cIdx !== classeraColIndex) return false;
    if (rIdx < 3) return false;
    const row = activeSheet.data[rIdx];
    if (!row) return false;
    const hasRowContent = row.some((c, idx) => idx !== cIdx && c !== "" && c != null);
    if (!hasRowContent) return false;
    const rowStr = row.map(c => String(c || "")).join(" ");
    if (rowStr.includes("بيانات  المعلمات") || rowStr.includes("بيانات المعلمات") || rowStr.includes("بيانات الإداريين")) {
      return false;
    }
    return true;
  };

  const licenseColIndex = React.useMemo(() => {
    if (!activeSheet) return -1;
    for (let r = 0; r < Math.min(5, activeSheet.data.length); r++) {
      const row = activeSheet.data[r];
      if (row) {
        const idx = row.findIndex(c => {
          const s = String(c || '').trim();
          return s === 'الرخصة المهنية' || s === 'رخصة مهنية' || s === 'الرخصة' || s.includes('الرخصة المهنية') || s.includes('الرخصة');
        });
        if (idx !== -1) return idx;
      }
    }
    if (isTeacherSheet) {
      const hasSec = activeSheet.data?.[2]?.some(c => String(c || '').trim() === 'القسم');
      return hasSec ? 13 : 12;
    }
    return -1;
  }, [activeSheet, isTeacherSheet]);

  const isLicenseCell = (rIdx: number, cIdx: number) => {
    if (!activeSheet || licenseColIndex === -1 || cIdx !== licenseColIndex) return false;
    if (rIdx < 3) return false;
    const row = activeSheet.data[rIdx];
    if (!row) return false;
    const hasRowContent = row.some((c, idx) => idx !== cIdx && c !== "" && c != null);
    if (!hasRowContent) return false;
    const rowStr = row.map(c => String(c || "")).join(" ");
    if (rowStr.includes("بيانات  المعلمات") || rowStr.includes("بيانات المعلمات") || rowStr.includes("بيانات الإداريين")) {
      return false;
    }
    return true;
  };

  const handleSelectLicenseOption = (rIndex: number, cIndex: number, option: string | number) => {
    if (!activeSheet) return;
    setHistory(prev => [...prev, activeSheet]);

    const newData = activeSheet.data.map(row => [...row]);
    const targetKeys = new Set<string>();
    if (selectedCells.has(`${rIndex},${cIndex}`)) {
      selectedCells.forEach(key => {
        const [r, c] = key.split(',').map(Number);
        if (c === cIndex && isLicenseCell(r, c)) {
          targetKeys.add(key);
        }
      });
    }
    if (targetKeys.size === 0) {
      targetKeys.add(`${rIndex},${cIndex}`);
    }

    targetKeys.forEach(key => {
      const [r, c] = key.split(',').map(Number);
      if (newData[r] && newData[r][c] !== undefined) {
        newData[r][c] = option;
      }
    });

    const updatedSheet = { ...activeSheet, data: newData };
    setActiveSheet(updatedSheet);
    setModifiedSheets(prev => ({ ...prev, [activeSheet.title]: updatedSheet }));
    setLicensePicker(null);
  };

  const handleSelectClasseraOption = (rIndex: number, cIndex: number, option: string) => {
    if (!activeSheet) return;
    setHistory(prev => [...prev, activeSheet]);

    const newData = activeSheet.data.map(row => [...row]);
    const targetKeys = new Set<string>();
    if (selectedCells.has(`${rIndex},${cIndex}`)) {
      selectedCells.forEach(key => {
        const [r, c] = key.split(',').map(Number);
        if (c === cIndex && isClasseraCell(r, c)) {
          targetKeys.add(key);
        }
      });
    }
    if (targetKeys.size === 0) {
      targetKeys.add(`${rIndex},${cIndex}`);
    }

    targetKeys.forEach(key => {
      const [r, c] = key.split(',').map(Number);
      if (newData[r] && newData[r][c] !== undefined) {
        newData[r][c] = option;
      }
    });

    const updatedSheet = { ...activeSheet, data: newData };
    setActiveSheet(updatedSheet);
    setModifiedSheets(prev => ({ ...prev, [activeSheet.title]: updatedSheet }));
    setClasseraPicker(null);
  };

  const applyClasseraToSelection = (option: string) => {
    if (!activeSheet || selectedCells.size === 0) return;
    setHistory(prev => [...prev, activeSheet]);

    const newData = activeSheet.data.map(row => [...row]);
    selectedCells.forEach(key => {
      const [r, c] = key.split(',').map(Number);
      if (c === classeraColIndex && isClasseraCell(r, c) && newData[r]) {
        newData[r][c] = option;
      }
    });

    const updatedSheet = { ...activeSheet, data: newData };
    setActiveSheet(updatedSheet);
    setModifiedSheets(prev => ({ ...prev, [activeSheet.title]: updatedSheet }));
  };

  const sectionColIndex = React.useMemo(() => {
    if (!activeSheet) return -1;
    for (let r = 0; r < Math.min(5, activeSheet.data.length); r++) {
      const row = activeSheet.data[r];
      if (row) {
        const idx = row.findIndex(c => String(c || '').trim() === 'القسم' || String(c || '').includes('القسم'));
        if (idx !== -1) return idx;
      }
    }
    return -1;
  }, [activeSheet]);

  const isSectionCell = (rIdx: number, cIdx: number) => {
    if (!activeSheet || sectionColIndex === -1 || cIdx !== sectionColIndex) return false;
    if (rIdx < 3) return false;
    const row = activeSheet.data[rIdx];
    if (!row) return false;
    const hasRowContent = row.some((c, idx) => idx !== cIdx && c !== "" && c != null);
    if (!hasRowContent) return false;
    const rowStr = row.map(c => String(c || "")).join(" ");
    if (rowStr.includes("بيانات  المعلمات") || rowStr.includes("بيانات المعلمات") || rowStr.includes("بيانات الإداريين")) {
      return false;
    }
    return true;
  };

  const handleSelectSectionOption = (rIndex: number, cIndex: number, option: string) => {
    if (!activeSheet) return;
    setHistory(prev => [...prev, activeSheet]);

    const newData = activeSheet.data.map(row => [...row]);
    const targetKeys = new Set<string>();
    if (selectedCells.has(`${rIndex},${cIndex}`)) {
      selectedCells.forEach(key => {
        const [r, c] = key.split(',').map(Number);
        if (c === cIndex && isSectionCell(r, c)) {
          targetKeys.add(key);
        }
      });
    }
    if (targetKeys.size === 0) {
      targetKeys.add(`${rIndex},${cIndex}`);
    }

    targetKeys.forEach(key => {
      const [r, c] = key.split(',').map(Number);
      if (newData[r] && newData[r][c] !== undefined) {
        newData[r][c] = option;
      }
    });

    const updatedSheet = { ...activeSheet, data: newData };
    setActiveSheet(updatedSheet);
    setModifiedSheets(prev => ({ ...prev, [activeSheet.title]: updatedSheet }));
    setSectionPicker(null);
  };

  const stageColIndex = React.useMemo(() => {
    if (!activeSheet) return -1;
    for (let r = 0; r < Math.min(5, activeSheet.data.length); r++) {
      const row = activeSheet.data[r];
      if (row) {
        const idx = row.findIndex(c => {
          const s = String(c || '').trim();
          return s === 'المرحلة' || s.includes('المرحلة');
        });
        if (idx !== -1) return idx;
      }
    }
    return -1;
  }, [activeSheet]);

  const isStageCell = (rIdx: number, cIdx: number) => {
    if (!activeSheet || stageColIndex === -1 || cIdx !== stageColIndex) return false;
    if (rIdx < 3) return false;
    const row = activeSheet.data[rIdx];
    if (!row) return false;
    const hasRowContent = row.some((c, idx) => idx !== cIdx && c !== "" && c != null);
    if (!hasRowContent) return false;
    const rowStr = row.map(c => String(c || "")).join(" ");
    if (rowStr.includes("بيانات  المعلمات") || rowStr.includes("بيانات المعلمات") || rowStr.includes("بيانات الإداريين")) {
      return false;
    }
    return true;
  };

  const handleSelectStageOption = (rIndex: number, cIndex: number, option: string) => {
    if (!activeSheet) return;
    setHistory(prev => [...prev, activeSheet]);

    const newData = activeSheet.data.map(row => [...row]);
    const targetKeys = new Set<string>();
    if (selectedCells.has(`${rIndex},${cIndex}`)) {
      selectedCells.forEach(key => {
        const [r, c] = key.split(',').map(Number);
        if (c === cIndex && isStageCell(r, c)) {
          targetKeys.add(key);
        }
      });
    }
    if (targetKeys.size === 0) {
      targetKeys.add(`${rIndex},${cIndex}`);
    }

    targetKeys.forEach(key => {
      const [r, c] = key.split(',').map(Number);
      if (newData[r] && newData[r][c] !== undefined) {
        newData[r][c] = option;
      }
    });

    const updatedSheet = { ...activeSheet, data: newData };
    setActiveSheet(updatedSheet);
    setModifiedSheets(prev => ({ ...prev, [activeSheet.title]: updatedSheet }));
    setStagePicker(null);
  };

  const quotaColIndex = React.useMemo(() => {
    if (!activeSheet) return -1;
    for (let r = 0; r < Math.min(5, activeSheet.data.length); r++) {
      const row = activeSheet.data[r];
      if (row) {
        const idx = row.findIndex(c => {
          const s = String(c || '').trim();
          return s === 'نصاب المعلم' || s === 'النصاب' || s.includes('نصاب');
        });
        if (idx !== -1) return idx;
      }
    }
    return -1;
  }, [activeSheet]);

  const isQuotaCell = (rIdx: number, cIdx: number) => {
    if (!activeSheet || quotaColIndex === -1 || cIdx !== quotaColIndex) return false;
    if (rIdx < 3) return false;
    const row = activeSheet.data[rIdx];
    if (!row) return false;
    const hasRowContent = row.some((c, idx) => idx !== cIdx && c !== "" && c != null);
    if (!hasRowContent) return false;
    const rowStr = row.map(c => String(c || "")).join(" ");
    if (rowStr.includes("بيانات  المعلمات") || rowStr.includes("بيانات المعلمات") || rowStr.includes("بيانات الإداريين")) {
      return false;
    }
    return true;
  };

  const handleSelectQuotaOption = (rIndex: number, cIndex: number, option: number | string) => {
    if (!activeSheet) return;
    setHistory(prev => [...prev, activeSheet]);

    const newData = activeSheet.data.map(row => [...row]);
    const targetKeys = new Set<string>();
    if (selectedCells.has(`${rIndex},${cIndex}`)) {
      selectedCells.forEach(key => {
        const [r, c] = key.split(',').map(Number);
        if (c === cIndex && isQuotaCell(r, c)) {
          targetKeys.add(key);
        }
      });
    }
    if (targetKeys.size === 0) {
      targetKeys.add(`${rIndex},${cIndex}`);
    }

    targetKeys.forEach(key => {
      const [r, c] = key.split(',').map(Number);
      if (newData[r] && newData[r][c] !== undefined) {
        newData[r][c] = option;
      }
    });

    const updatedSheet = { ...activeSheet, data: newData };
    setActiveSheet(updatedSheet);
    setModifiedSheets(prev => ({ ...prev, [activeSheet.title]: updatedSheet }));
    setQuotaPicker(null);
  };

  const closeAllPickers = () => {
    setClasseraPicker(null);
    setLicensePicker(null);
    setSectionPicker(null);
    setStagePicker(null);
    setQuotaPicker(null);
    setNationalityPicker(null);
    setSpecializationPicker(null);
    setQualificationPicker(null);
    setSubjectPicker(null);
    setBankPicker(null);
    setJobPicker(null);
    setAffiliationPicker(null);
    setCustomNationalityInput('');
    setCustomSpecializationInput('');
    setCustomQualificationInput('');
    setCustomSubjectInput('');
    setCustomBankInput('');
    setCustomJobInput('');
    setPickerSearchQuery('');
  };

  const headerRowIndex = React.useMemo(() => {
    if (!activeSheet) return 2;
    for (let r = 0; r < Math.min(5, activeSheet.data.length); r++) {
      const row = activeSheet.data[r];
      if (row && row.some((c: any) => {
        const s = String(c || '').trim();
        return s === 'اسم الموظف رباعي' || s === 'اسم الموظفة رباعي' || s === 'رقم الهوية' || s === 'الإيميل' || s === 'الايميل' || s === 'التخصص' || s === 'الوظيفة ' || s === 'الوظيفة';
      })) {
        return r;
      }
    }
    return 2;
  }, [activeSheet]);

  const commitCellEdit = (r: number, c: number, value: string) => {
    if (!activeSheet) return;
    const oldVal = String(activeSheet.data[r]?.[c] ?? '');
    if (oldVal === value) {
      setEditingCell(null);
      return;
    }
    setHistory(prev => [...prev, activeSheet]);
    const newData = activeSheet.data.map(row => [...row]);
    if (newData[r]) {
      newData[r][c] = value;
    }
    const updatedSheet = { ...activeSheet, data: newData };
    setActiveSheet(updatedSheet);
    setModifiedSheets(prev => ({ ...prev, [activeSheet.title]: updatedSheet }));
    setEditingCell(null);
  };

  const nationalityColIndex = React.useMemo(() => {
    if (!activeSheet) return -1;
    for (let r = 0; r < Math.min(5, activeSheet.data.length); r++) {
      const row = activeSheet.data[r];
      if (row) {
        const idx = row.findIndex(c => {
          const s = String(c || '').trim();
          return s === 'الجنسية' || s.includes('الجنسية');
        });
        if (idx !== -1) return idx;
      }
    }
    return -1;
  }, [activeSheet]);

  const isNationalityCell = (rIdx: number, cIdx: number) => {
    if (!activeSheet || nationalityColIndex === -1 || cIdx !== nationalityColIndex) return false;
    if (rIdx <= headerRowIndex) return false;
    const row = activeSheet.data[rIdx];
    if (!row) return false;
    const hasRowContent = row.some((c, idx) => idx !== cIdx && c !== "" && c != null);
    if (!hasRowContent) return false;
    const rowStr = row.map(c => String(c || "")).join(" ");
    if (rowStr.includes("بيانات  المعلمات") || rowStr.includes("بيانات المعلمات") || rowStr.includes("بيانات الإداريين")) {
      return false;
    }
    return true;
  };

  const handleSelectNationalityOption = (rIndex: number, cIndex: number, option: string) => {
    if (!activeSheet) return;
    setHistory(prev => [...prev, activeSheet]);

    const newData = activeSheet.data.map(row => [...row]);
    const targetKeys = new Set<string>();
    if (selectedCells.has(`${rIndex},${cIndex}`)) {
      selectedCells.forEach(key => {
        const [r, c] = key.split(',').map(Number);
        if (c === cIndex && isNationalityCell(r, c)) {
          targetKeys.add(key);
        }
      });
    }
    if (targetKeys.size === 0) {
      targetKeys.add(`${rIndex},${cIndex}`);
    }

    targetKeys.forEach(key => {
      const [r, c] = key.split(',').map(Number);
      if (newData[r] && newData[r][c] !== undefined) {
        newData[r][c] = option;
      }
    });

    const updatedSheet = { ...activeSheet, data: newData };
    setActiveSheet(updatedSheet);
    setModifiedSheets(prev => ({ ...prev, [activeSheet.title]: updatedSheet }));
    setNationalityPicker(null);
    setCustomNationalityInput('');
  };

  const specializationColIndex = React.useMemo(() => {
    if (!activeSheet) return -1;
    for (let r = 0; r < Math.min(5, activeSheet.data.length); r++) {
      const row = activeSheet.data[r];
      if (row) {
        const idx = row.findIndex(c => {
          const s = String(c || '').trim();
          return s === 'التخصص' || s.includes('التخصص');
        });
        if (idx !== -1) return idx;
      }
    }
    return -1;
  }, [activeSheet]);

  const isSpecializationCell = (rIdx: number, cIdx: number) => {
    if (!activeSheet || specializationColIndex === -1 || cIdx !== specializationColIndex) return false;
    if (rIdx <= headerRowIndex) return false;
    const row = activeSheet.data[rIdx];
    if (!row) return false;
    const hasRowContent = row.some((c, idx) => idx !== cIdx && c !== "" && c != null);
    if (!hasRowContent) return false;
    const rowStr = row.map(c => String(c || "")).join(" ");
    if (rowStr.includes("بيانات  المعلمات") || rowStr.includes("بيانات المعلمات") || rowStr.includes("بيانات الإداريين")) {
      return false;
    }
    return true;
  };

  const specializationOptions = React.useMemo(() => {
    if (!activeSheet || specializationColIndex === -1) return [];
    const items: string[] = [];
    for (let r = 0; r < activeSheet.data.length; r++) {
      const row = activeSheet.data[r];
      if (!row) continue;
      const val = row[specializationColIndex];
      if (val) items.push(String(val));
    }
    const defaultSpecs = [
      'لغة عربية', 'رياضيات', 'علوم', 'لغة إنجليزية', 'دراسات إسلامية',
      'حاسب آلي', 'اجتماعيات', 'تربية بدنية', 'تربية فنية', 'رياض أطفال',
      'فيزياء', 'كيمياء', 'أحياء', 'علم نفس', 'أصول دين ودعوة', 'شريعة إسلامية',
      'تكنولوجيا معلومات', 'تربية نوعية', 'علم أرض'
    ];
    const blacklist = ['غير سعودي', 'سعودي', 'التخصص', 'المؤهل', 'المعلمين', 'المعلمات', 'الإداريين', 'ادارة', 'بيانات', 'عدد'];
    return cleanAndDeduplicateOptions([...items, ...defaultSpecs], blacklist);
  }, [activeSheet, specializationColIndex]);

  const handleSelectSpecializationOption = (rIndex: number, cIndex: number, option: string) => {
    if (!activeSheet) return;
    setHistory(prev => [...prev, activeSheet]);

    const newData = activeSheet.data.map(row => [...row]);
    const targetKeys = new Set<string>();
    if (selectedCells.has(`${rIndex},${cIndex}`)) {
      selectedCells.forEach(key => {
        const [r, c] = key.split(',').map(Number);
        if (c === cIndex && isSpecializationCell(r, c)) {
          targetKeys.add(key);
        }
      });
    }
    if (targetKeys.size === 0) {
      targetKeys.add(`${rIndex},${cIndex}`);
    }

    targetKeys.forEach(key => {
      const [r, c] = key.split(',').map(Number);
      if (newData[r] && newData[r][c] !== undefined) {
        newData[r][c] = option;
      }
    });

    const updatedSheet = { ...activeSheet, data: newData };
    setActiveSheet(updatedSheet);
    setModifiedSheets(prev => ({ ...prev, [activeSheet.title]: updatedSheet }));
    setSpecializationPicker(null);
    setCustomSpecializationInput('');
    setPickerSearchQuery('');
  };

  const qualificationColIndex = React.useMemo(() => {
    if (!activeSheet) return -1;
    for (let r = 0; r < Math.min(5, activeSheet.data.length); r++) {
      const row = activeSheet.data[r];
      if (row) {
        const idx = row.findIndex(c => {
          const s = String(c || '').trim();
          return s === 'المؤهل' || s.includes('المؤهل');
        });
        if (idx !== -1) return idx;
      }
    }
    return -1;
  }, [activeSheet]);

  const isQualificationCell = (rIdx: number, cIdx: number) => {
    if (!activeSheet || qualificationColIndex === -1 || cIdx !== qualificationColIndex) return false;
    if (rIdx <= headerRowIndex) return false;
    const row = activeSheet.data[rIdx];
    if (!row) return false;
    const hasRowContent = row.some((c, idx) => idx !== cIdx && c !== "" && c != null);
    if (!hasRowContent) return false;
    const rowStr = row.map(c => String(c || "")).join(" ");
    if (rowStr.includes("بيانات  المعلمات") || rowStr.includes("بيانات المعلمات") || rowStr.includes("بيانات الإداريين")) {
      return false;
    }
    return true;
  };

  const qualificationOptions = React.useMemo(() => {
    if (!activeSheet || qualificationColIndex === -1) return [];
    const items: string[] = [];
    for (let r = 0; r < activeSheet.data.length; r++) {
      const row = activeSheet.data[r];
      if (!row) continue;
      const val = row[qualificationColIndex];
      if (val) items.push(String(val));
    }
    const defaultQuals = [
      'بكالوريوس', 'بكالوريوس تربية', 'بكالوريوس علوم وتربية', 'بكالوريوس خدمة اجتماعية',
      'بكالوريوس تربية رياضية', 'بكالوريوس تربية نوعية', 'بكالوريوس دار علوم',
      'ليسانس آداب', 'ليسانس آداب وتربية', 'ليسانس أزهر', 'ماجستير', 'دكتوراه', 'دبلوم'
    ];
    const blacklist = ['غير سعودي', 'سعودي', 'التخصص', 'المؤهل', 'المعلمين', 'المعلمات', 'الإداريين', 'ادارة', 'بيانات', 'عدد'];
    return cleanAndDeduplicateOptions([...items, ...defaultQuals], blacklist);
  }, [activeSheet, qualificationColIndex]);

  const handleSelectQualificationOption = (rIndex: number, cIndex: number, option: string) => {
    if (!activeSheet) return;
    setHistory(prev => [...prev, activeSheet]);

    const newData = activeSheet.data.map(row => [...row]);
    const targetKeys = new Set<string>();
    if (selectedCells.has(`${rIndex},${cIndex}`)) {
      selectedCells.forEach(key => {
        const [r, c] = key.split(',').map(Number);
        if (c === cIndex && isQualificationCell(r, c)) {
          targetKeys.add(key);
        }
      });
    }
    if (targetKeys.size === 0) {
      targetKeys.add(`${rIndex},${cIndex}`);
    }

    targetKeys.forEach(key => {
      const [r, c] = key.split(',').map(Number);
      if (newData[r] && newData[r][c] !== undefined) {
        newData[r][c] = option;
      }
    });

    const updatedSheet = { ...activeSheet, data: newData };
    setActiveSheet(updatedSheet);
    setModifiedSheets(prev => ({ ...prev, [activeSheet.title]: updatedSheet }));
    setQualificationPicker(null);
    setCustomQualificationInput('');
    setPickerSearchQuery('');
  };

  const subjectColIndex = React.useMemo(() => {
    if (!activeSheet) return -1;
    for (let r = 0; r < Math.min(5, activeSheet.data.length); r++) {
      const row = activeSheet.data[r];
      if (row) {
        const idx = row.findIndex(c => {
          const s = String(c || '').trim();
          return s === 'مادة التدريس' || s.includes('مادة التدريس');
        });
        if (idx !== -1) return idx;
      }
    }
    return -1;
  }, [activeSheet]);

  const isSubjectCell = (rIdx: number, cIdx: number) => {
    if (!activeSheet || subjectColIndex === -1 || cIdx !== subjectColIndex) return false;
    if (rIdx <= headerRowIndex) return false;
    const row = activeSheet.data[rIdx];
    if (!row) return false;
    const hasRowContent = row.some((c, idx) => idx !== cIdx && c !== "" && c != null);
    if (!hasRowContent) return false;
    const rowStr = row.map(c => String(c || "")).join(" ");
    if (rowStr.includes("بيانات  المعلمات") || rowStr.includes("بيانات المعلمات") || rowStr.includes("بيانات الإداريين")) {
      return false;
    }
    return true;
  };

  const subjectOptions = React.useMemo(() => {
    const items: string[] = [];
    if (activeSheet && subjectColIndex !== -1) {
      for (let r = 0; r < activeSheet.data.length; r++) {
        const row = activeSheet.data[r];
        if (!row) continue;
        const val = row[subjectColIndex];
        if (val) items.push(String(val).trim());
      }
    }
    const blacklist = ['غير سعودي', 'سعودي', 'مادة التدريس', 'المادة', 'التخصص', 'المؤهل', 'المعلمين', 'المعلمات', 'الإداريين', 'ادارة', 'بيانات', 'عدد'];
    return cleanAndDeduplicateOptions([...items, ...customSubjectOptions], blacklist);
  }, [activeSheet, subjectColIndex, customSubjectOptions]);

  const handleSelectSubjectOption = (rIndex: number, cIndex: number, option: string) => {
    if (!activeSheet) return;
    setHistory(prev => [...prev, activeSheet]);

    const newData = activeSheet.data.map(row => [...row]);
    const targetKeys = new Set<string>();
    if (selectedCells.has(`${rIndex},${cIndex}`)) {
      selectedCells.forEach(key => {
        const [r, c] = key.split(',').map(Number);
        if (c === cIndex && isSubjectCell(r, c)) {
          targetKeys.add(key);
        }
      });
    }
    if (targetKeys.size === 0) {
      targetKeys.add(`${rIndex},${cIndex}`);
    }

    targetKeys.forEach(key => {
      const [r, c] = key.split(',').map(Number);
      if (newData[r] && newData[r][c] !== undefined) {
        newData[r][c] = option;
      }
    });

    const updatedSheet = { ...activeSheet, data: newData };
    setActiveSheet(updatedSheet);
    setModifiedSheets(prev => ({ ...prev, [activeSheet.title]: updatedSheet }));
    setSubjectPicker(null);
    setCustomSubjectInput('');
    setPickerSearchQuery('');
  };

  const ibanColIndex = React.useMemo(() => {
    if (!activeSheet) return -1;
    for (let r = 0; r < Math.min(5, activeSheet.data.length); r++) {
      const row = activeSheet.data[r];
      if (row) {
        const idx = row.findIndex(c => {
          const s = String(c || '').trim();
          return s === 'IBANالبنكي' || s === 'IBAN البنكي' || s === 'IBAN' || s === 'الايبان' || s === 'الآيبان' || s.includes('IBAN') || s.includes('ايبان');
        });
        if (idx !== -1) return idx;
      }
    }
    return -1;
  }, [activeSheet]);

  const isIbanCell = (rIdx: number, cIdx: number) => {
    if (!activeSheet) return false;
    if (rIdx <= headerRowIndex) return false;
    if (ibanColIndex === -1 || cIdx !== ibanColIndex) return false;
    const row = activeSheet.data[rIdx];
    if (!row) return false;
    const rowStr = row.map(c => String(c || "")).join(" ");
    if (rowStr.includes("بيانات  المعلمات") || rowStr.includes("بيانات المعلمات") || rowStr.includes("بيانات الإداريين")) {
      return false;
    }
    return true;
  };

  const bankColIndex = React.useMemo(() => {
    if (!activeSheet) return -1;
    for (let r = 0; r < Math.min(5, activeSheet.data.length); r++) {
      const row = activeSheet.data[r];
      if (row) {
        const idx = row.findIndex(c => {
          const s = String(c || '').trim();
          return s === 'البنك' || (s.includes('البنك') && !s.includes('IBAN') && !s.includes('ايبان'));
        });
        if (idx !== -1) return idx;
      }
    }
    return -1;
  }, [activeSheet]);

  const isBankCell = (rIdx: number, cIdx: number) => {
    if (!activeSheet || bankColIndex === -1 || cIdx !== bankColIndex) return false;
    if (rIdx <= headerRowIndex) return false;
    const row = activeSheet.data[rIdx];
    if (!row) return false;
    const hasRowContent = row.some((c, idx) => idx !== cIdx && c !== "" && c != null);
    if (!hasRowContent) return false;
    const rowStr = row.map(c => String(c || "")).join(" ");
    if (rowStr.includes("بيانات  المعلمات") || rowStr.includes("بيانات المعلمات") || rowStr.includes("بيانات الإداريين")) {
      return false;
    }
    return true;
  };

  const bankOptions = React.useMemo(() => {
    if (!activeSheet || bankColIndex === -1) return [...BANK_OPTIONS, ...customBankOptions];
    const items: string[] = [];
    for (let r = 0; r < activeSheet.data.length; r++) {
      const row = activeSheet.data[r];
      if (!row) continue;
      const val = row[bankColIndex];
      if (val) items.push(String(val));
    }
    const blacklist = ['البنك', 'IBAN', 'IBANالبنكي', 'بيانات', 'المعلمات', 'المعلمين', 'الإداريين'];
    return cleanAndDeduplicateOptions([...BANK_OPTIONS, ...customBankOptions, ...items], blacklist);
  }, [activeSheet, bankColIndex, customBankOptions]);

  const handleSelectBankOption = (rIndex: number, cIndex: number, option: string) => {
    if (!activeSheet) return;
    setHistory(prev => [...prev, activeSheet]);

    const newData = activeSheet.data.map(row => [...row]);
    const targetKeys = new Set<string>();
    if (selectedCells.has(`${rIndex},${cIndex}`)) {
      selectedCells.forEach(key => {
        const [r, c] = key.split(',').map(Number);
        if (c === cIndex && isBankCell(r, c)) {
          targetKeys.add(key);
        }
      });
    }
    if (targetKeys.size === 0) {
      targetKeys.add(`${rIndex},${cIndex}`);
    }

    targetKeys.forEach(key => {
      const [r, c] = key.split(',').map(Number);
      if (newData[r] && newData[r][c] !== undefined) {
        newData[r][c] = option;
      }
    });

    const updatedSheet = { ...activeSheet, data: newData };
    setActiveSheet(updatedSheet);
    setModifiedSheets(prev => ({ ...prev, [activeSheet.title]: updatedSheet }));
    setBankPicker(null);
    setCustomBankInput('');
    setPickerSearchQuery('');
  };

  const jobColIndex = React.useMemo(() => {
    if (!activeSheet) return -1;
    for (let r = 0; r < Math.min(5, activeSheet.data.length); r++) {
      const row = activeSheet.data[r];
      if (row) {
        const idx = row.findIndex(c => {
          const s = String(c || '').trim();
          return s === 'الوظيفة' || s.includes('الوظيفة');
        });
        if (idx !== -1) return idx;
      }
    }
    return -1;
  }, [activeSheet]);

  const isJobCell = (rIdx: number, cIdx: number) => {
    if (!activeSheet || jobColIndex === -1 || cIdx !== jobColIndex) return false;
    if (rIdx <= headerRowIndex) return false;
    const row = activeSheet.data[rIdx];
    if (!row) return false;
    const hasRowContent = row.some((c, idx) => idx !== cIdx && c !== "" && c != null);
    if (!hasRowContent) return false;
    const rowStr = row.map(c => String(c || "")).join(" ");
    if (rowStr.includes("بيانات  المعلمات") || rowStr.includes("بيانات المعلمات") || rowStr.includes("بيانات الإداريين") || rowStr.includes("بيانات  الإداريات") || rowStr.includes("إدارة المجمع")) {
      return false;
    }
    return true;
  };

  const jobOptions = React.useMemo(() => {
    const items: string[] = [];
    if (activeSheet && jobColIndex !== -1) {
      for (let r = 0; r < activeSheet.data.length; r++) {
        const row = activeSheet.data[r];
        if (!row) continue;
        const val = row[jobColIndex];
        if (val) {
          const s = String(val).trim();
          if (s && s !== 'الوظيفة' && s !== '0') items.push(s);
        }
      }
    }
    const defaultJobs = [
      'مدير', 'مديرة', 'مدير مرحلة', 'وكيل', 'وكيلة', 'سكرتير', 'سكرتيرة',
      'مشرف مقيم', 'موجه طلابي', 'موجهة طلابية', 'رائد نشاط', 'رائدة نشاط',
      'مساعد اداري', 'مساعدة إدارية', 'محضرة مختبر', 'أمين مصادر', 'محاسب', 'حارس', 'مراسل'
    ];
    const blacklist = ['الوظيفة', 'بيانات', 'المعلمات', 'المعلمين', 'الإداريين', 'الإداريات', 'إدارة', 'عدد', '0', 'null', 'undefined'];
    return cleanAndDeduplicateOptions([...items, ...customJobOptions, ...defaultJobs], blacklist);
  }, [activeSheet, jobColIndex, customJobOptions]);

  const handleSelectJobOption = (rIndex: number, cIndex: number, option: string) => {
    if (!activeSheet) return;
    setHistory(prev => [...prev, activeSheet]);

    const newData = activeSheet.data.map(row => [...row]);
    const targetKeys = new Set<string>();
    if (selectedCells.has(`${rIndex},${cIndex}`)) {
      selectedCells.forEach(key => {
        const [r, c] = key.split(',').map(Number);
        if (c === cIndex && isJobCell(r, c)) {
          targetKeys.add(key);
        }
      });
    }
    if (targetKeys.size === 0) {
      targetKeys.add(`${rIndex},${cIndex}`);
    }

    targetKeys.forEach(key => {
      const [r, c] = key.split(',').map(Number);
      if (newData[r] && newData[r][c] !== undefined) {
        newData[r][c] = option;
      }
    });

    const updatedSheet = { ...activeSheet, data: newData };
    setActiveSheet(updatedSheet);
    setModifiedSheets(prev => ({ ...prev, [activeSheet.title]: updatedSheet }));
    setJobPicker(null);
    setCustomJobInput('');
    setPickerSearchQuery('');
  };

  const affiliationColIndex = React.useMemo(() => {
    if (!activeSheet) return -1;
    for (let r = 0; r < Math.min(5, activeSheet.data.length); r++) {
      const row = activeSheet.data[r];
      if (row) {
        const idx = row.findIndex(c => {
          const s = String(c || '').trim();
          return s === 'تبعية الموظف' || s.includes('تبعية');
        });
        if (idx !== -1) return idx;
      }
    }
    return -1;
  }, [activeSheet]);

  const isAffiliationCell = (rIdx: number, cIdx: number) => {
    if (!activeSheet || affiliationColIndex === -1 || cIdx !== affiliationColIndex) return false;
    if (rIdx <= headerRowIndex) return false;
    const row = activeSheet.data[rIdx];
    if (!row) return false;
    const hasRowContent = row.some((c, idx) => idx !== cIdx && c !== "" && c != null);
    if (!hasRowContent) return false;
    const rowStr = row.map(c => String(c || "")).join(" ");
    if (rowStr.includes("بيانات  المعلمات") || rowStr.includes("بيانات المعلمات") || rowStr.includes("بيانات الإداريين") || rowStr.includes("بيانات  الإداريات") || rowStr.includes("إدارة المجمع")) {
      return false;
    }
    return true;
  };

  const AFFILIATION_OPTIONS = ['إدارة المجمع', 'إداري بنين', 'إداري بنات'];

  const handleSelectAffiliationOption = (rIndex: number, cIndex: number, option: string) => {
    if (!activeSheet) return;
    setHistory(prev => [...prev, activeSheet]);

    const newData = activeSheet.data.map(row => [...row]);
    const targetKeys = new Set<string>();
    if (selectedCells.has(`${rIndex},${cIndex}`)) {
      selectedCells.forEach(key => {
        const [r, c] = key.split(',').map(Number);
        if (c === cIndex && isAffiliationCell(r, c)) {
          targetKeys.add(key);
        }
      });
    }
    if (targetKeys.size === 0) {
      targetKeys.add(`${rIndex},${cIndex}`);
    }

    targetKeys.forEach(key => {
      const [r, c] = key.split(',').map(Number);
      if (newData[r] && newData[r][c] !== undefined) {
        newData[r][c] = option;
      }
    });

    const updatedSheet = { ...activeSheet, data: newData };
    setActiveSheet(updatedSheet);
    setModifiedSheets(prev => ({ ...prev, [activeSheet.title]: updatedSheet }));
    setAffiliationPicker(null);
  };

  const emailColIndex = React.useMemo(() => {
    if (!activeSheet) return -1;
    for (let r = 0; r < Math.min(5, activeSheet.data.length); r++) {
      const row = activeSheet.data[r];
      if (row) {
        const idx = row.findIndex(c => {
          const s = String(c || '').trim();
          return s === 'الإيميل' || s === 'الايميل' || s.includes('الإيميل') || s.includes('الايميل') || s.includes('البريد');
        });
        if (idx !== -1) return idx;
      }
    }
    return -1;
  }, [activeSheet]);

  const isEmailCell = (rIdx: number, cIdx: number) => {
    if (!activeSheet) return false;
    if (rIdx <= headerRowIndex) return false;
    // Strictly restrict email cell behavior to the email column only
    if (emailColIndex === -1 || cIdx !== emailColIndex) return false;
    const row = activeSheet.data[rIdx];
    if (!row) return false;
    const rowStr = row.map(c => String(c || "")).join(" ");
    if (rowStr.includes("بيانات  المعلمات") || rowStr.includes("بيانات المعلمات") || rowStr.includes("بيانات الإداريين")) {
      return false;
    }
    return true;
  };

  const saveEmailValue = (rIndex: number, cIndex: number, value: string) => {
    if (!activeSheet) return;
    setHistory(prev => [...prev, activeSheet]);

    const newData = activeSheet.data.map(row => [...row]);
    const targetKeys = new Set<string>();
    if (selectedCells.has(`${rIndex},${cIndex}`)) {
      selectedCells.forEach(key => {
        const [r, c] = key.split(',').map(Number);
        if (c === cIndex && isEmailCell(r, c)) {
          targetKeys.add(key);
        }
      });
    }
    if (targetKeys.size === 0) {
      targetKeys.add(`${rIndex},${cIndex}`);
    }

    targetKeys.forEach(key => {
      const [r, c] = key.split(',').map(Number);
      if (newData[r] && newData[r][c] !== undefined) {
        newData[r][c] = value;
      }
    });

    const updatedSheet = { ...activeSheet, data: newData };
    setActiveSheet(updatedSheet);
    setModifiedSheets(prev => ({ ...prev, [activeSheet.title]: updatedSheet }));
    setEditingCell(null);
  };

  const handleMouseDown = (rIndex: number, cIndex: number, e: React.MouseEvent) => {
    if (e.button !== 0) return;
    e.stopPropagation();
    setDragStart({ r: rIndex, c: cIndex, type: 'cell' });
    
    const cellKey = `${rIndex},${cIndex}`;
    if (e.ctrlKey || e.metaKey || e.shiftKey) {
      setSelectedCells(prev => {
        const newSet = new Set(prev);
        if (newSet.has(cellKey)) newSet.delete(cellKey);
        else newSet.add(cellKey);
        setDragSnapshot(newSet);
        return newSet;
      });
    } else {
      setDragSnapshot(new Set());
      setSelectedCells(new Set([cellKey]));
    }

    if (isClasseraCell(rIndex, cIndex)) {
      closeAllPickers();
      const targetEl = (e.target as HTMLElement).closest('td') || (e.currentTarget as HTMLElement);
      const rect = targetEl.getBoundingClientRect();
      setClasseraPicker({
        r: rIndex,
        c: cIndex,
        top: rect.top,
        bottom: rect.bottom,
        left: rect.left,
        right: rect.right
      });
    } else if (isLicenseCell(rIndex, cIndex)) {
      closeAllPickers();
      const targetEl = (e.target as HTMLElement).closest('td') || (e.currentTarget as HTMLElement);
      const rect = targetEl.getBoundingClientRect();
      setLicensePicker({
        r: rIndex,
        c: cIndex,
        top: rect.top,
        bottom: rect.bottom,
        left: rect.left,
        right: rect.right
      });
    } else if (isSectionCell(rIndex, cIndex)) {
      closeAllPickers();
      const targetEl = (e.target as HTMLElement).closest('td') || (e.currentTarget as HTMLElement);
      const rect = targetEl.getBoundingClientRect();
      setSectionPicker({
        r: rIndex,
        c: cIndex,
        top: rect.top,
        bottom: rect.bottom,
        left: rect.left,
        right: rect.right
      });
    } else if (isStageCell(rIndex, cIndex)) {
      closeAllPickers();
      const targetEl = (e.target as HTMLElement).closest('td') || (e.currentTarget as HTMLElement);
      const rect = targetEl.getBoundingClientRect();
      setStagePicker({
        r: rIndex,
        c: cIndex,
        top: rect.top,
        bottom: rect.bottom,
        left: rect.left,
        right: rect.right
      });
    } else if (isQuotaCell(rIndex, cIndex)) {
      closeAllPickers();
      const targetEl = (e.target as HTMLElement).closest('td') || (e.currentTarget as HTMLElement);
      const rect = targetEl.getBoundingClientRect();
      setQuotaPicker({
        r: rIndex,
        c: cIndex,
        top: rect.top,
        bottom: rect.bottom,
        left: rect.left,
        right: rect.right
      });
    } else if (isNationalityCell(rIndex, cIndex)) {
      closeAllPickers();
      const targetEl = (e.target as HTMLElement).closest('td') || (e.currentTarget as HTMLElement);
      const rect = targetEl.getBoundingClientRect();
      setNationalityPicker({
        r: rIndex,
        c: cIndex,
        top: rect.top,
        bottom: rect.bottom,
        left: rect.left,
        right: rect.right
      });
    } else if (isSpecializationCell(rIndex, cIndex)) {
      closeAllPickers();
      const targetEl = (e.target as HTMLElement).closest('td') || (e.currentTarget as HTMLElement);
      const rect = targetEl.getBoundingClientRect();
      setSpecializationPicker({
        r: rIndex,
        c: cIndex,
        top: rect.top,
        bottom: rect.bottom,
        left: rect.left,
        right: rect.right
      });
    } else if (isSubjectCell(rIndex, cIndex)) {
      closeAllPickers();
      const targetEl = (e.target as HTMLElement).closest('td') || (e.currentTarget as HTMLElement);
      const rect = targetEl.getBoundingClientRect();
      setSubjectPicker({
        r: rIndex,
        c: cIndex,
        top: rect.top,
        bottom: rect.bottom,
        left: rect.left,
        right: rect.right
      });
    } else if (isBankCell(rIndex, cIndex)) {
      closeAllPickers();
      const targetEl = (e.target as HTMLElement).closest('td') || (e.currentTarget as HTMLElement);
      const rect = targetEl.getBoundingClientRect();
      setBankPicker({
        r: rIndex,
        c: cIndex,
        top: rect.top,
        bottom: rect.bottom,
        left: rect.left,
        right: rect.right
      });
    } else if (isQualificationCell(rIndex, cIndex)) {
      closeAllPickers();
      const targetEl = (e.target as HTMLElement).closest('td') || (e.currentTarget as HTMLElement);
      const rect = targetEl.getBoundingClientRect();
      setQualificationPicker({
        r: rIndex,
        c: cIndex,
        top: rect.top,
        bottom: rect.bottom,
        left: rect.left,
        right: rect.right
      });
    } else if (isJobCell(rIndex, cIndex)) {
      closeAllPickers();
      const targetEl = (e.target as HTMLElement).closest('td') || (e.currentTarget as HTMLElement);
      const rect = targetEl.getBoundingClientRect();
      setJobPicker({
        r: rIndex,
        c: cIndex,
        top: rect.top,
        bottom: rect.bottom,
        left: rect.left,
        right: rect.right
      });
    } else if (isAffiliationCell(rIndex, cIndex)) {
      closeAllPickers();
      const targetEl = (e.target as HTMLElement).closest('td') || (e.currentTarget as HTMLElement);
      const rect = targetEl.getBoundingClientRect();
      setAffiliationPicker({
        r: rIndex,
        c: cIndex,
        top: rect.top,
        bottom: rect.bottom,
        left: rect.left,
        right: rect.right
      });
    } else if (isIbanCell(rIndex, cIndex) || isEmailCell(rIndex, cIndex)) {
      closeAllPickers();
      if (editingCell && (editingCell.r !== rIndex || editingCell.c !== cIndex)) {
        commitCellEdit(editingCell.r, editingCell.c, editingCell.value);
      }
    } else {
      closeAllPickers();
      if (editingCell && (editingCell.r !== rIndex || editingCell.c !== cIndex)) {
        commitCellEdit(editingCell.r, editingCell.c, editingCell.value);
      }
    }
  };

  const handleMouseEnter = (rIndex: number, cIndex: number) => {
    if (dragStart && dragStart.type === 'cell') {
      const minR = Math.min(dragStart.r, rIndex);
      const maxR = Math.max(dragStart.r, rIndex);
      const minC = Math.min(dragStart.c, cIndex);
      const maxC = Math.max(dragStart.c, cIndex);
      
      const newSet = new Set(dragSnapshot);
      for (let r = minR; r <= maxR; r++) {
        for (let c = minC; c <= maxC; c++) {
          newSet.add(`${r},${c}`);
        }
      }
      setSelectedCells(newSet);
    }
  };

  const handleColMouseDown = (cIndex: number, e: React.MouseEvent) => {
    if (e.button !== 0 || !activeSheet) return;
    e.stopPropagation();
    setDragStart({ r: 0, c: cIndex, type: 'col' });
    
    if (e.ctrlKey || e.metaKey || e.shiftKey) {
      setSelectedCells(prev => {
        const newSet = new Set(prev);
        activeSheet.data.forEach((_, r) => newSet.add(`${r},${cIndex}`));
        setDragSnapshot(newSet);
        return newSet;
      });
    } else {
      const newSet = new Set<string>();
      activeSheet.data.forEach((_, r) => newSet.add(`${r},${cIndex}`));
      setDragSnapshot(new Set());
      setSelectedCells(newSet);
    }
  };

  const handleColMouseEnter = (cIndex: number) => {
    if (dragStart && dragStart.type === 'col' && activeSheet) {
      const minC = Math.min(dragStart.c, cIndex);
      const maxC = Math.max(dragStart.c, cIndex);
      const newSet = new Set(dragSnapshot);
      activeSheet.data.forEach((_, r) => {
        for (let c = minC; c <= maxC; c++) newSet.add(`${r},${c}`);
      });
      setSelectedCells(newSet);
    }
  };

  const handleRowMouseDown = (rIndex: number, e: React.MouseEvent) => {
    if (e.button !== 0 || !activeSheet) return;
    e.stopPropagation();
    setDragStart({ r: rIndex, c: 0, type: 'row' });
    
    if (e.ctrlKey || e.metaKey || e.shiftKey) {
      setSelectedCells(prev => {
        const newSet = new Set(prev);
        activeSheet.data[rIndex].forEach((_, c) => newSet.add(`${rIndex},${c}`));
        setDragSnapshot(newSet);
        return newSet;
      });
    } else {
      const newSet = new Set<string>();
      activeSheet.data[rIndex].forEach((_, c) => newSet.add(`${rIndex},${c}`));
      setDragSnapshot(new Set());
      setSelectedCells(newSet);
    }
  };

  const handleRowMouseEnter = (rIndex: number) => {
    if (dragStart && dragStart.type === 'row' && activeSheet) {
      const minR = Math.min(dragStart.r, rIndex);
      const maxR = Math.max(dragStart.r, rIndex);
      const newSet = new Set(dragSnapshot);
      for (let r = minR; r <= maxR; r++) {
        activeSheet.data[r].forEach((_, c) => newSet.add(`${r},${c}`));
      }
      setSelectedCells(newSet);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeSheet || selectedCells.size === 0) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setHistory(prev => [...prev, activeSheet]);
      const newColors = { ...activeSheet.colors };
      selectedCells.forEach(key => {
        newColors[key] = { ...newColors[key], image: base64 };
      });
      setActiveSheet({ ...activeSheet, colors: newColors });
    };
    reader.readAsDataURL(file);
    // Reset file input
    e.target.value = '';
  };

  const clearSelectedContent = () => {
    if (!activeSheet || selectedCells.size === 0) return;
    setHistory(prev => [...prev, activeSheet]);
    const newData = activeSheet.data.map(row => [...row]);
    selectedCells.forEach(key => {
      const [r, c] = key.split(',').map(Number);
      if (newData[r] && newData[r][c] !== undefined) {
        newData[r][c] = "";
      }
    });
    setActiveSheet({ ...activeSheet, data: newData });
  };

  const deleteSelectedColsStructurally = () => {
    if (!activeSheet || selectedCells.size === 0) return;
    setHistory(prev => [...prev, activeSheet]);
    
    const colsToDelete = new Set<number>();
    selectedCells.forEach(key => colsToDelete.add(Number(key.split(',')[1])));
    const sortedCols = Array.from(colsToDelete).sort((a, b) => b - a);
    
    let newData = activeSheet.data.map(row => [...row]);
    let newMerges = [...activeSheet.merges];
    
    sortedCols.forEach(cIndex => {
       newData = newData.map(row => { row.splice(cIndex, 1); return row; });
       newMerges = newMerges.map(m => {
          let s = { ...m.s }; let e = { ...m.e };
          if (cIndex < s.c) s.c--;
          if (cIndex <= e.c && cIndex > s.c) e.c--;
          if (cIndex === e.c && s.c === e.c) return null; 
          if (cIndex === s.c) { if (s.c === e.c) return null; e.c--; }
          return { s, e };
        }).filter(Boolean) as XLSX.Range[];
    });
    
    setActiveSheet({ ...activeSheet, data: newData, merges: newMerges });
    setSelectedCells(new Set());
  };

  const deleteSelectedRowsStructurally = () => {
    if (!activeSheet || selectedCells.size === 0) return;
    setHistory(prev => [...prev, activeSheet]);
    
    const rowsToDelete = new Set<number>();
    selectedCells.forEach(key => rowsToDelete.add(Number(key.split(',')[0])));
    const sortedRows = Array.from(rowsToDelete).sort((a, b) => b - a);
    
    let newData = [...activeSheet.data];
    let newMerges = [...activeSheet.merges];
    
    sortedRows.forEach(rIndex => {
       newData.splice(rIndex, 1);
       newMerges = newMerges.map(m => {
          let s = { ...m.s }; let e = { ...m.e };
          if (rIndex < s.r) s.r--;
          if (rIndex <= e.r && rIndex > s.r) e.r--;
          if (rIndex === e.r && s.r === e.r) return null;
          if (rIndex === s.r) { if (s.r === e.r) return null; e.r--; }
          return { s, e };
        }).filter(Boolean) as XLSX.Range[];
    });
    
    setActiveSheet({ ...activeSheet, data: newData, merges: newMerges });
    setSelectedCells(new Set());
  };

  const handleBorder = (action: 'add' | 'remove') => {
    if (!activeSheet || selectedCells.size === 0) return;
    setHistory(prev => [...prev, activeSheet]);
    
    const newColors = { ...activeSheet.colors };
    selectedCells.forEach(key => {
      newColors[key] = { ...newColors[key], border: action === 'add' ? '2px solid #1e293b' : undefined };
    });
    
    setActiveSheet({ ...activeSheet, colors: newColors });
    setShowBorderMenu(false);
  };

  const handleBold = () => {
    if (!activeSheet || selectedCells.size === 0) return;
    setHistory(prev => [...prev, activeSheet]);
    
    const newColors = { ...activeSheet.colors };
    let isBold = false;
    const firstKey = Array.from(selectedCells)[0] as string;
    if (newColors[firstKey]?.bold) isBold = true;

    selectedCells.forEach(key => {
      newColors[key] = { ...newColors[key], bold: !isBold };
    });
    
    setActiveSheet({ ...activeSheet, colors: newColors });
  };

  const handleFontSize = (delta: number) => {
    if (!activeSheet || selectedCells.size === 0) return;
    setHistory(prev => [...prev, activeSheet]);
    
    const newColors = { ...activeSheet.colors };
    selectedCells.forEach(key => {
      const currentSize = newColors[key]?.fontSize || 16; // default 16px
      const newSize = Math.max(10, Math.min(72, currentSize + delta));
      newColors[key] = { ...newColors[key], fontSize: newSize };
    });
    
    setActiveSheet({ ...activeSheet, colors: newColors });
  };

  const handleAlign = (align: 'left' | 'center' | 'right') => {
    if (!activeSheet || selectedCells.size === 0) return;
    setHistory(prev => [...prev, activeSheet]);
    
    const newColors = { ...activeSheet.colors };
    selectedCells.forEach(key => {
      newColors[key] = { ...newColors[key], textAlign: align };
    });
    
    setActiveSheet({ ...activeSheet, colors: newColors });
  };

  const clearColContent = (cIndex: number) => {
    if (!activeSheet) return;
    setHistory(prev => [...prev, activeSheet]);
    const newData = activeSheet.data.map(row => {
      const newRow = [...row];
      newRow[cIndex] = "";
      return newRow;
    });
    setActiveSheet({ ...activeSheet, data: newData });
    setMenuCol(null);
  };

  const clearRowContent = (rIndex: number) => {
    if (!activeSheet) return;
    setHistory(prev => [...prev, activeSheet]);
    const newData = [...activeSheet.data];
    newData[rIndex] = new Array(newData[rIndex].length).fill("");
    setActiveSheet({ ...activeSheet, data: newData });
    setMenuRow(null);
  };

  const selectFullCol = (cIndex: number) => {
    if (!activeSheet) return;
    const newSet = new Set(selectedCells);
    activeSheet.data.forEach((_, rIdx) => newSet.add(`${rIdx},${cIndex}`));
    setSelectedCells(newSet);
    setMenuCol(null);
  };

  const selectFullRow = (rIndex: number) => {
    if (!activeSheet) return;
    const newSet = new Set(selectedCells);
    activeSheet.data[rIndex].forEach((_, cIdx) => newSet.add(`${rIndex},${cIdx}`));
    setSelectedCells(newSet);
    setMenuRow(null);
  };

  const handleMerge = () => {
    if (!activeSheet || selectedCells.size < 2) return;
    setHistory(prev => [...prev, activeSheet]);

    let minR = Infinity, maxR = -Infinity, minC = Infinity, maxC = -Infinity;
    selectedCells.forEach(key => {
      const [r, c] = key.split(',').map(Number);
      if (r < minR) minR = r;
      if (r > maxR) maxR = r;
      if (c < minC) minC = c;
      if (c > maxC) maxC = c;
    });

    // إزالة الدمج القديم الذي يتقاطع مع الدمج الجديد
    const newMerges = activeSheet.merges.filter(m => {
      const intersect = !(m.e.r < minR || m.s.r > maxR || m.e.c < minC || m.s.c > maxC);
      return !intersect;
    });

    newMerges.push({ s: { r: minR, c: minC }, e: { r: maxR, c: maxC } });
    setActiveSheet({ ...activeSheet, merges: newMerges });
    setSelectedCells(new Set());
  };

  const handleUnmerge = () => {
    if (!activeSheet || selectedCells.size === 0) return;
    setHistory(prev => [...prev, activeSheet]);

    let minR = Infinity, maxR = -Infinity, minC = Infinity, maxC = -Infinity;
    selectedCells.forEach(key => {
      const [r, c] = key.split(',').map(Number);
      if (r < minR) minR = r;
      if (r > maxR) maxR = r;
      if (c < minC) minC = c;
      if (c > maxC) maxC = c;
    });

    const newMerges = activeSheet.merges.filter(m => {
      const intersect = !(m.e.r < minR || m.s.r > maxR || m.e.c < minC || m.s.c > maxC);
      return !intersect;
    });

    setActiveSheet({ ...activeSheet, merges: newMerges });
  };

  const handleColor = (type: 'bg' | 'text', color: string) => {
    if (!activeSheet || selectedCells.size === 0) return;
    setHistory(prev => [...prev, activeSheet]);
    
    const newColors = { ...activeSheet.colors };
    selectedCells.forEach(key => {
      newColors[key] = { ...newColors[key], [type]: color };
    });
    
    setActiveSheet({ ...activeSheet, colors: newColors });
  };

  const handleSave = () => {
    setSavedData({
      complex: complexName,
      year: academicYear,
      path: pathName
    });
  };

  const handleSaveToOriginal = async () => {
    if (!activeSheet) return;
    try {
      // 1. Get original file
      
      let arrayBuffer = await loadExcelFromFirestore();
      if (!arrayBuffer) {
        const response = await fetch('/data.xlsx');
        arrayBuffer = await response.arrayBuffer();
      }

      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      
      const allCards = [
        { name: 'بيانات الكادر الإداري', sheetName: 'إدارة المجمع' },
        { name: 'ادارة المجمع', sheetName: 'إدارة المجمع' },
        { name: 'إدارة المجمع', sheetName: 'إدارة المجمع' },
        { name: 'بيانات الكادر التعليمي', sheetName: 'المعلمين' },
        { name: 'بيانات المعلمين', sheetName: 'المعلمين' },
        { name: 'بيانات الإداريين', sheetName: 'اداريين دار القلم' },
        { name: 'بيانات الإداريات', sheetName: 'اداريات دار القلم' },
        { name: 'الخدمات المساندة', sheetName: 'الخدمات المساندة' },
        { name: 'إحصاء الفصول والطلاب', sheetName: 'إحصاء الطلاب' },
        { name: 'إحصاء التخصصات', sheetName: 'إحصاء التخصصات' },
        { name: 'مساحات الفصول', sheetName: 'مساحات الفصول' },
        { name: 'الطاقة الاستيعابية', sheetName: 'الطاقة الاستيعابية' },
        { name: 'الإحصاء العام للمجمع', sheetName: 'الإحصاء العام للمجمع' },
        { name: 'العهدة المالية', sheetName: 'العهدة المالية' },
        { name: 'المقاعد الشاغرة', sheetName: 'شواغر دار القلم' },
        { name: 'ترتيب القدرات والتحصيلي', sheetName: 'القدرات والتحصيلي' },
        { name: 'النشاط', sheetName: 'نشاط بنين ف٢' },
        { name: 'بيانات المرافق', sheetName: 'مساحات الفصول' },
        { name: 'مقارنة النمو', sheetName: 'مقارنة النمو' },
        { name: 'STR / SAR / SSR / SER', sheetName: 'مؤشرات المجمع' },
        { name: 'اسناد بنين ف1', sheetName: 'اسناد بنين ف١' },
        { name: 'اسناد البنات ف1', sheetName: 'اسناد البنات ف١' },
        { name: 'قدرات وتحصيلي', sheetName: 'القدرات والتحصيلي' },
        { name: 'قدرات', sheetName: 'القدرات والتحصيلي' },
        { name: 'تحصيلي', sheetName: 'القدرات والتحصيلي' },
        { name: 'الجميع', sheetName: 'القدرات والتحصيلي' },
        { name: 'نافس', sheetName: 'نافس' },
        { name: 'تقارير المبنى', sheetName: 'تقارير المبنى' },
        { name: 'الرخصة المهنية', sheetName: 'الرخصة المهنية' },
        { name: 'الطلاب والفصول', sheetName: 'إحصاء الطلاب' },
        { name: 'اسناد المعلمين', sheetName: 'اسناد بنين ف١' },
        { name: 'اسناد المعلمات', sheetName: 'اسناد البنات ف١' }
      ];

      const originalSheetName = allCards.find(c => c.name === activeSheet.title)?.sheetName;
      if (originalSheetName && workbook.Sheets[originalSheetName]) {
        // Create new sheet from data
        const newWorksheet = XLSX.utils.aoa_to_sheet(activeSheet.data);
        newWorksheet['!merges'] = activeSheet.merges;
        
        // Retain col widths
        if (activeSheet.colWidths) {
          const maxCol = Math.max(...Object.keys(activeSheet.colWidths).map(Number));
          const cols = [];
          for(let i=0; i<=maxCol; i++) {
            cols.push(activeSheet.colWidths[i] ? { wpx: activeSheet.colWidths[i] } : { wpx: 80 });
          }
          newWorksheet['!cols'] = cols;
        }

        // Replace sheet in workbook
        workbook.Sheets[originalSheetName] = newWorksheet;
        
        // Write to array buffer
        const outBuffer = XLSX.write(workbook, { type: 'array', bookType: 'xlsx' });
        
        // Post to server to save directly
        const saveRes = await saveExcelToFirestore(outBuffer);
        if (saveRes.success) {
          alert('تم الحفظ في الملف الأصلي بنجاح!');
          // Update local state modified sheets as well just in case
          setModifiedSheets(prev => ({ ...prev, [activeSheet.title]: activeSheet }));
        } else {
          throw new Error('Server returned ' + 400);
        }
      } else {
        alert('لم يتم العثور على اسم الشيت الأصلي للحفظ!');
      }
    } catch (e) {
      console.error(e);
      alert('حدث خطأ أثناء الحفظ في الملف الأصلي.');
    }
  };

  const whiteCards = [
    { name: 'بيانات الكادر الإداري', sheetName: 'إدارة المجمع', icon: Building },
    { name: 'بيانات الكادر التعليمي', sheetName: 'المعلمين', icon: GraduationCap },
    { name: 'الخدمات المساندة', sheetName: 'الخدمات المساندة', icon: HeartHandshake },
    { name: 'إحصاء الفصول والطلاب', sheetName: 'إحصاء الطلاب', icon: BarChart },
    { name: 'مساحات الفصول', sheetName: 'مساحات الفصول', icon: Maximize },
    { name: 'العهدة المالية', sheetName: 'العهدة المالية', icon: Wallet },
    { name: 'النشاط', sheetName: 'نشاط بنين ف٢', icon: Gamepad2 },
    { name: 'بيانات المرافق', sheetName: 'مساحات الفصول', icon: Building2 },
    { name: 'اسناد بنين ف1', sheetName: 'اسناد بنين ف١', icon: Users },
    { name: 'اسناد البنات ف1', sheetName: 'اسناد البنات ف١', icon: Users },
    { name: 'قدرات وتحصيلي', sheetName: 'القدرات والتحصيلي', icon: TrendingUp },
    { name: 'نافس', sheetName: 'نافس', icon: Activity },
  ];

  const blueCards = [
    { 
      name: 'تقارير الأداء الأكاديمي', sheetName: 'تقارير الأداء الأكاديمي', icon: GraduationCap,
      bgClass: 'bg-gradient-to-br from-indigo-500 to-indigo-600',
      borderClass: 'border-indigo-400/50',
      hoverClass: 'hover:shadow-indigo-500/40 hover:-translate-y-2 hover:scale-[1.02]',
      ringClass: 'ring-indigo-400',
      iconHoverText: 'group-hover:text-indigo-600'
    },
    { 
      name: 'تقارير الموظفين', sheetName: 'تقارير الموظفين', icon: Users,
      bgClass: 'bg-gradient-to-br from-emerald-500 to-emerald-600',
      borderClass: 'border-emerald-400/50',
      hoverClass: 'hover:shadow-emerald-500/40 hover:-translate-y-2 hover:scale-[1.02]',
      ringClass: 'ring-emerald-400',
      iconHoverText: 'group-hover:text-emerald-600'
    },
    { 
      name: 'تقارير إحصائية', sheetName: 'تقارير إحصائية', icon: PieChart,
      bgClass: 'bg-gradient-to-br from-amber-500 to-orange-500',
      borderClass: 'border-amber-400/50',
      hoverClass: 'hover:shadow-amber-500/40 hover:-translate-y-2 hover:scale-[1.02]',
      ringClass: 'ring-amber-400',
      iconHoverText: 'group-hover:text-orange-600'
    },
    { 
      name: 'تقارير المؤشرات', sheetName: 'مؤشرات المجمع', icon: Activity,
      bgClass: 'bg-gradient-to-br from-rose-500 to-rose-600',
      borderClass: 'border-rose-400/50',
      hoverClass: 'hover:shadow-rose-500/40 hover:-translate-y-2 hover:scale-[1.02]',
      ringClass: 'ring-rose-400',
      iconHoverText: 'group-hover:text-rose-600'
    },
    { 
      name: 'تقارير النشاط', sheetName: 'نشاط بنين ف٢', icon: Flame,
      bgClass: 'bg-gradient-to-br from-orange-500 to-red-500',
      borderClass: 'border-orange-400/50',
      hoverClass: 'hover:shadow-orange-500/40 hover:-translate-y-2 hover:scale-[1.02]',
      ringClass: 'ring-orange-400',
      iconHoverText: 'group-hover:text-red-600'
    },
    { 
      name: 'تقارير فنية', sheetName: 'تقارير فنية', icon: Settings,
      bgClass: 'bg-gradient-to-br from-cyan-500 to-blue-500',
      borderClass: 'border-cyan-400/50',
      hoverClass: 'hover:shadow-cyan-500/40 hover:-translate-y-2 hover:scale-[1.02]',
      ringClass: 'ring-cyan-400',
      iconHoverText: 'group-hover:text-cyan-600'
    },
    { 
      name: 'تقارير المبنى', sheetName: 'تقارير المبنى', icon: Building2,
      bgClass: 'bg-gradient-to-br from-violet-500 to-fuchsia-600',
      borderClass: 'border-violet-400/50',
      hoverClass: 'hover:shadow-violet-500/40 hover:-translate-y-2 hover:scale-[1.02]',
      ringClass: 'ring-violet-400',
      iconHoverText: 'group-hover:text-fuchsia-600'
    },
  ];

  const reportSubCards: Record<string, { name: string, sheetName: string, icon: any }[]> = {
    'تقارير المبنى': [
      { name: 'مرافق', sheetName: 'مساحات الفصول', icon: Building2 },
      { name: 'طاقة استيعابية', sheetName: 'الطاقة الاستيعابية', icon: BatteryCharging },
      { name: 'مساحة الفصول', sheetName: 'مساحات الفصول', icon: Maximize }
    ],
    'تقارير الأداء الأكاديمي': [
      { name: 'قدرات', sheetName: 'القدرات والتحصيلي', icon: TrendingUp },
      { name: 'تحصيلي', sheetName: 'القدرات والتحصيلي', icon: TrendingUp },
      { name: 'نافس', sheetName: 'نافس', icon: Activity },
      { name: 'الجميع', sheetName: 'القدرات والتحصيلي', icon: Users2 }
    ],
    'تقارير إحصائية': [
      { name: 'الطلاب والفصول', sheetName: 'إحصاء الطلاب', icon: Users },
      { name: 'الرخصة المهنية', sheetName: 'الرخصة المهنية', icon: FileText },
      { name: 'احصاء التخصصات', sheetName: 'إحصاء التخصصات', icon: PieChart },
      { name: 'مقاعد شاغرة', sheetName: 'شواغر دار القلم', icon: LayoutGrid },
      { name: 'الاحصاء العام للمجمع', sheetName: 'الإحصاء العام للمجمع', icon: LineChart },
      { name: 'مقارنة نمو الطلاب', sheetName: 'مقارنة النمو', icon: TrendingUp }
    ],
    'تقارير فنية': [
      { name: 'اسناد المعلمين', sheetName: 'اسناد بنين ف١', icon: UserSquare2 },
      { name: 'اسناد المعلمات', sheetName: 'اسناد البنات ف١', icon: Users }
    ]
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  const getColLetter = (index: number) => {
    let letter = '';
    let temp = index;
    while (temp >= 0) {
      letter = String.fromCharCode(65 + (temp % 26)) + letter;
      temp = Math.floor(temp / 26) - 1;
    }
    return letter;
  };

  const renderTable = () => {
    if (!activeSheet) return null;

    const skipMap = new Set<string>();
    const mergeMap = new Map<string, {rowSpan: number, colSpan: number}>();
    
    activeSheet.merges.forEach(m => {
      mergeMap.set(`${m.s.r},${m.s.c}`, {
        rowSpan: m.e.r - m.s.r + 1,
        colSpan: m.e.c - m.s.c + 1
      });
      for (let R = m.s.r; R <= m.e.r; ++R) {
        for (let C = m.s.c; C <= m.e.c; ++C) {
          if (R !== m.s.r || C !== m.s.c) {
            skipMap.add(`${R},${C}`);
          }
        }
      }
    });

    return (
      <div 
        ref={scrollContainerRef}
        className="flex-1 min-h-0 w-full overflow-auto rounded-xl border border-slate-300 shadow-sm bg-white custom-scrollbar relative"
        style={{ scrollBehavior: 'auto' }}
      >
        <div 
          ref={tableContentRef}
          style={{ 
            transform: zoom !== 1 ? `scale(${zoom})` : undefined, 
            transformOrigin: 'top right', 
            width: zoom > 1 ? `${zoom * 100}%` : '100%',
            minWidth: '100%'
          }}
        >
          <table 
            className="text-sm md:text-base text-center border-collapse w-full min-w-full" 
            style={{ tableLayout: activeSheet.colWidths && Object.keys(activeSheet.colWidths).length > 0 ? 'fixed' : 'auto' }}
          >
            <tbody>
              {/* صف أزرار التحكم بالأعمدة (رؤوس الأعمدة A, B, C...) */}
              <tr>
                <td className="p-2 border border-slate-300 bg-slate-200 w-16 min-w-[4rem] sticky top-0 right-0 z-30 shadow-[inset_-1px_-1px_0_#cbd5e1]"></td>
                {activeSheet.data[0]?.map((_, colIdx) => (
                  <td 
                    key={`del-c-${colIdx}`} 
                    onMouseDown={(e) => handleColMouseDown(colIdx, e)}
                    onMouseEnter={() => handleColMouseEnter(colIdx)}
                    style={{ width: activeSheet.colWidths?.[colIdx] ? `${activeSheet.colWidths[colIdx]}px` : undefined }}
                    className="p-2 border border-slate-300 bg-slate-200 text-center relative font-bold text-slate-700 cursor-pointer select-none hover:bg-slate-300 transition-colors group sticky top-0 z-20 shadow-[inset_0_-1px_0_#cbd5e1]"
                  >
                  <div 
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      if (activeSheet) {
                        setHistory(prev => [...prev, activeSheet]);
                        const td = (e.target as HTMLElement).closest('td');
                        const startSize = activeSheet.colWidths?.[colIdx] || td?.offsetWidth || 100;
                        setResizing({ type: 'col', index: colIdx, startPos: e.clientX, startSize });
                      }
                    }}
                    onDoubleClick={(e) => {
                      e.stopPropagation();
                      if (activeSheet) {
                        let maxW = 50;
                        activeSheet.data.forEach(row => {
                           const val = row[colIdx];
                           if (val) {
                             const len = String(val).length * 9 + 24;
                             if (len > maxW) maxW = len;
                           }
                        });
                        setHistory(prev => [...prev, activeSheet]);
                        setActiveSheet({
                          ...activeSheet,
                          colWidths: { ...(activeSheet.colWidths || {}), [colIdx]: Math.min(maxW, 600) }
                        });
                      }
                    }}
                    className="absolute left-0 top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-blue-500 opacity-0 group-hover:opacity-100 transition-all z-20"
                  />
                  <div className="flex items-center justify-center gap-2">
                    <span>{getColLetter(colIdx)}</span>
                    <button 
                      onClick={(e) => { e.stopPropagation(); setMenuCol(menuCol === colIdx ? null : colIdx); setMenuRow(null); }}
                      className="text-slate-500 hover:text-blue-600 hover:bg-slate-400 p-0.5 rounded transition-colors opacity-0 group-hover:opacity-100"
                      title="خيارات العمود"
                    >
                      <ChevronDown size={14} />
                    </button>
                  </div>
                  {menuCol === colIdx && (
                    <div className="absolute top-full right-0 mt-1 bg-white border border-slate-200 shadow-xl rounded-lg z-50 w-48 overflow-hidden flex flex-col">
                      <button 
                        onClick={() => selectFullCol(colIdx)}
                        className="px-3 py-2 text-slate-700 hover:bg-slate-100 text-right text-sm font-bold border-b border-slate-100"
                      >
                        تحديد كل خلايا العمود
                      </button>
                      <button 
                        onClick={() => insertCol(colIdx, 1)}
                        className="px-3 py-2 text-slate-700 hover:bg-slate-100 text-right text-sm font-bold border-b border-slate-100"
                      >
                        إدراج عمود لليسار
                      </button>
                      <button 
                        onClick={() => insertCol(colIdx, 0)}
                        className="px-3 py-2 text-slate-700 hover:bg-slate-100 text-right text-sm font-bold border-b border-slate-100"
                      >
                        إدراج عمود لليمين
                      </button>
                      <button 
                        onClick={() => clearColContent(colIdx)}
                        className="flex items-center gap-2 px-3 py-2 text-amber-600 hover:bg-amber-50 text-right text-sm w-full font-bold border-b border-slate-100"
                      >
                        مسح المحتوى
                      </button>
                      <button 
                        onClick={() => deleteCol(colIdx)}
                        className="flex items-center gap-2 px-3 py-2 text-red-600 hover:bg-red-50 text-right text-sm w-full font-bold"
                      >
                        حذف العمود
                      </button>
                    </div>
                  )}
                </td>
              ))}
            </tr>
            
            {activeSheet.data.map((row, rowIdx) => (
              <tr key={rowIdx} style={{ height: activeSheet.rowHeights?.[rowIdx] ? `${activeSheet.rowHeights[rowIdx]}px` : undefined }} className={`border-b border-slate-200 transition-colors ${rowIdx === 0 ? 'bg-blue-600 text-white font-bold' : 'hover:bg-blue-50 even:bg-slate-50'}`}>
                {/* زر تحكم الصف (أرقام الصفوف 1, 2, 3...) */}
                <td 
                  className="p-2 border border-slate-300 bg-slate-200 text-center w-16 min-w-[4rem] relative font-bold text-slate-700 cursor-pointer select-none hover:bg-slate-300 transition-colors group sticky right-0 z-20 shadow-[inset_1px_0_0_#cbd5e1]"
                  onMouseDown={(e) => handleRowMouseDown(rowIdx, e)}
                  onMouseEnter={() => handleRowMouseEnter(rowIdx)}
                >
                  <div 
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      if (activeSheet) {
                        setHistory(prev => [...prev, activeSheet]);
                        const td = (e.target as HTMLElement).closest('td');
                        const startSize = activeSheet.rowHeights?.[rowIdx] || td?.offsetHeight || 30;
                        setResizing({ type: 'row', index: rowIdx, startPos: e.clientY, startSize });
                      }
                    }}
                    className="absolute left-0 right-0 bottom-0 h-1.5 cursor-row-resize hover:bg-blue-500 opacity-0 group-hover:opacity-100 transition-all z-20"
                  />
                  <div className="flex items-center justify-center gap-2">
                    <span>{rowIdx + 1}</span>
                    <button 
                      onClick={(e) => { e.stopPropagation(); setMenuRow(menuRow === rowIdx ? null : rowIdx); setMenuCol(null); }}
                      className="text-slate-500 hover:text-blue-600 hover:bg-slate-400 p-0.5 rounded transition-colors opacity-0 group-hover:opacity-100"
                      title="خيارات الصف"
                    >
                      <ChevronDown size={14} />
                    </button>
                  </div>
                  {menuRow === rowIdx && (
                    <div className="absolute top-full right-0 mt-1 bg-white border border-slate-200 shadow-xl rounded-lg z-50 w-48 overflow-hidden flex flex-col">
                      <button 
                        onClick={() => selectFullRow(rowIdx)}
                        className="px-3 py-2 text-slate-700 hover:bg-slate-100 text-right text-sm font-bold border-b border-slate-100"
                      >
                        تحديد كل خلايا الصف
                      </button>
                      <button 
                        onClick={() => insertRow(rowIdx, 0)}
                        className="px-3 py-2 text-slate-700 hover:bg-slate-100 text-right text-sm font-bold border-b border-slate-100"
                      >
                        إدراج صف لأعلى
                      </button>
                      <button 
                        onClick={() => insertRow(rowIdx, 1)}
                        className="px-3 py-2 text-slate-700 hover:bg-slate-100 text-right text-sm font-bold border-b border-slate-100"
                      >
                        إدراج صف لأسفل
                      </button>
                      <button 
                        onClick={() => clearRowContent(rowIdx)}
                        className="flex items-center gap-2 px-3 py-2 text-amber-600 hover:bg-amber-50 text-right text-sm w-full font-bold border-b border-slate-100"
                      >
                        مسح المحتوى
                      </button>
                      <button 
                        onClick={() => deleteRow(rowIdx)}
                        className="flex items-center gap-2 px-3 py-2 text-red-600 hover:bg-red-50 text-right text-sm w-full font-bold"
                      >
                        حذف الصف
                      </button>
                    </div>
                  )}
                </td>
                
                {row.map((cell, colIdx) => {
                  if (skipMap.has(`${rowIdx},${colIdx}`)) return null;
                  
                  const cellKey = `${rowIdx},${colIdx}`;
                  const isSelected = selectedCells.has(cellKey);
                  const cellColor = activeSheet.colors?.[cellKey] || {};
                  
                  const merge = mergeMap.get(cellKey);
                  const rowSpan = merge ? merge.rowSpan : 1;
                  const colSpan = merge ? merge.colSpan : 1;
                  
                  // تصميم الخلية يعتمد على التحديد واللون المخصص والصف الأول والبحث
                  let defaultClasses = "border border-slate-300 px-3 py-2.5 md:px-4 md:py-3 cursor-pointer select-none transition-all duration-150 relative ";
                  
                  const isFemaleSubheader = String(cell || "").includes("بيانات  المعلمات") || String(cell || "").includes("بيانات المعلمات");
                  const isFemaleBadge = cell === "معلمات";
                  const isAdminSubheader = String(cell || "").includes("بيانات الإداريين") || String(cell || "").includes("بيانات الإداريات") || String(cell || "") === "إدارة المجمع";
                  const isAdminBadge = cell === "إداريين" || cell === "إداريات" || cell === "إدارة";

                  if (rowIdx === 0) {
                    defaultClasses += "text-base md:text-lg font-bold bg-blue-50 text-blue-950 ";
                  } else if (isFemaleSubheader) {
                    defaultClasses += "text-base md:text-lg font-bold bg-purple-50 text-purple-950 border-purple-200 shadow-sm ";
                  } else if (isFemaleBadge) {
                    defaultClasses += "text-sm font-bold bg-purple-100 text-purple-800 ";
                  } else if (isAdminSubheader) {
                    defaultClasses += "text-base md:text-lg font-bold bg-emerald-50 text-emerald-950 border-emerald-200 shadow-sm ";
                  } else if (isAdminBadge) {
                    defaultClasses += "text-sm font-bold bg-emerald-100 text-emerald-800 ";
                  } else {
                    defaultClasses += "text-sm md:text-base font-medium ";
                  }

                  const isSearchMatch = Boolean(
                    sheetSearchQuery.trim() && 
                    String(cell || "").toLowerCase().includes(sheetSearchQuery.trim().toLowerCase())
                  );

                  if (isSelected) {
                    defaultClasses += "ring-2 ring-inset ring-blue-500 bg-blue-100 shadow-[inset_0_0_0_2px_rgba(59,130,246,0.5)] text-slate-800 ";
                  } else if (isSearchMatch) {
                    defaultClasses += "bg-amber-100 ring-2 ring-inset ring-amber-400 font-bold text-amber-950 ";
                  } else if (rowIdx !== 0 && !cellColor.bg && !isFemaleSubheader && !isFemaleBadge && !isAdminSubheader && !isAdminBadge) {
                    defaultClasses += "text-slate-800 hover:bg-blue-50/60 even:bg-slate-50/70 ";
                  }

                  return (
                    <td 
                      key={colIdx} 
                      data-row={rowIdx}
                      data-col={colIdx}
                      rowSpan={rowSpan} 
                      colSpan={colSpan}
                      onMouseDown={(e) => handleMouseDown(rowIdx, colIdx, e)}
                      onMouseEnter={() => handleMouseEnter(rowIdx, colIdx)}
                      onDoubleClick={(e) => {
                        e.stopPropagation();
                        closeAllPickers();
                        setEditingCell({
                          r: rowIdx,
                          c: colIdx,
                          value: String(cell ?? '')
                        });
                      }}
                      style={{ 
                        backgroundColor: cellColor.bg || undefined,
                        color: cellColor.text || undefined,
                        border: cellColor.border || undefined,
                        fontWeight: cellColor.bold ? '900' : undefined,
                        fontSize: cellColor.fontSize ? `${cellColor.fontSize}px` : undefined,
                        textAlign: cellColor.textAlign || undefined,
                      }}
                      className={defaultClasses}
                    >
                      {/* Column resizer */}
                      <div 
                        onMouseDown={(e) => {
                          e.stopPropagation();
                          if (activeSheet) {
                            setHistory(prev => [...prev, activeSheet]);
                            const td = (e.target as HTMLElement).closest('td');
                            const startSize = activeSheet.colWidths?.[colIdx] || td?.offsetWidth || 100;
                            setResizing({ type: 'col', index: colIdx, startPos: e.clientX, startSize });
                          }
                        }}
                        className="absolute left-0 top-0 bottom-0 w-2 cursor-col-resize hover:bg-blue-500 opacity-0 hover:opacity-100 transition-all z-10"
                      />
                      {/* Row resizer */}
                      <div 
                        onMouseDown={(e) => {
                          e.stopPropagation();
                          if (activeSheet) {
                            setHistory(prev => [...prev, activeSheet]);
                            const td = (e.target as HTMLElement).closest('td');
                            const startSize = activeSheet.rowHeights?.[rowIdx] || td?.offsetHeight || 30;
                            setResizing({ type: 'row', index: rowIdx, startPos: e.clientY, startSize });
                          }
                        }}
                        className="absolute left-0 right-0 bottom-0 h-2 cursor-row-resize hover:bg-blue-500 opacity-0 hover:opacity-100 transition-all z-10"
                      />
                      {cellColor.image && (
                        <div className="w-full flex justify-center mb-1 pointer-events-none select-none">
                          <img src={cellColor.image} alt="شكل" className="max-h-16 object-contain rounded" />
                        </div>
                      )}
                      {cellColor.shape && (
                        <div className="w-full flex justify-center mb-1 pointer-events-none select-none" style={{ color: cellColor.text || '#334155' }}>
                          {cellColor.shape === 'circle' && <Circle size={28} strokeWidth={2.5} />}
                          {cellColor.shape === 'square' && <Square size={28} strokeWidth={2.5} />}
                          {cellColor.shape === 'triangle' && <Triangle size={28} strokeWidth={2.5} />}
                          {cellColor.shape === 'star' && <Star size={28} strokeWidth={2.5} />}
                          {cellColor.shape === 'arrow-right' && <ArrowRight size={28} strokeWidth={2.5} />}
                          {cellColor.shape === 'arrow-left' && <ArrowLeft size={28} strokeWidth={2.5} />}
                          {cellColor.shape === 'arrow-up' && <ArrowUp size={28} strokeWidth={2.5} />}
                          {cellColor.shape === 'arrow-down' && <ArrowDown size={28} strokeWidth={2.5} />}
                        </div>
                      )}
                      {editingCell && editingCell.r === rowIdx && editingCell.c === colIdx ? (
                        isIbanCell(rowIdx, colIdx) ? (
                          <InCellIbanEditor
                            initialValue={editingCell.value}
                            onSave={(val) => commitCellEdit(rowIdx, colIdx, val)}
                            onCancel={() => setEditingCell(null)}
                          />
                        ) : isEmailCell(rowIdx, colIdx) ? (
                          <InCellEmailEditor
                            initialValue={editingCell.value}
                            onSave={(val) => commitCellEdit(rowIdx, colIdx, val)}
                            onCancel={() => setEditingCell(null)}
                          />
                        ) : (
                          <InCellGeneralEditor
                            initialValue={editingCell.value}
                            onSave={(val) => commitCellEdit(rowIdx, colIdx, val)}
                            onCancel={() => setEditingCell(null)}
                            bold={cellColor.bold}
                            align={cellColor.textAlign}
                          />
                        )
                      ) : isClasseraCell(rowIdx, colIdx) ? (
                        <div className="w-full flex items-center justify-center gap-1.5 py-1 pointer-events-none select-none">
                          {(() => {
                            const strVal = String(cell || '').trim();
                            const currentOpt = CLASSERA_OPTIONS.find(o => o.label === strVal);
                            if (currentOpt) {
                              return (
                                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs md:text-sm font-extrabold shadow-sm border ${currentOpt.badgeClass}`}>
                                  <span className={`w-2 h-2 rounded-full ${currentOpt.dotColor}`} />
                                  <span>{currentOpt.label}</span>
                                  <ChevronDown size={13} className="opacity-60" />
                                </span>
                              );
                            } else if (strVal) {
                              return (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs md:text-sm font-bold bg-slate-100 text-slate-700 border border-slate-300">
                                  <span>{strVal}</span>
                                  <ChevronDown size={13} className="opacity-60" />
                                </span>
                              );
                            } else {
                              return (
                                <span className="inline-flex items-center gap-1 text-slate-400 group-hover:text-blue-600 text-xs font-semibold px-2 py-1 rounded-md transition-colors border border-dashed border-slate-300 bg-slate-50/70">
                                  <span>اختر</span>
                                  <ChevronDown size={13} className="text-slate-400" />
                                </span>
                              );
                            }
                          })()}
                        </div>
                      ) : isLicenseCell(rowIdx, colIdx) ? (
                        <div className="w-full flex items-center justify-center gap-1.5 py-1 pointer-events-none select-none">
                          {(() => {
                            const strVal = String(cell != null ? cell : '').trim();
                            if (strVal === '1') {
                              return (
                                <span className="inline-flex items-center justify-center gap-1.5 px-3 py-1 rounded-full text-xs md:text-sm font-extrabold shadow-sm bg-emerald-100 text-emerald-800 border border-emerald-300">
                                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                                  <span>1</span>
                                  <ChevronDown size={13} className="opacity-60" />
                                </span>
                              );
                            } else if (strVal === '0') {
                              return (
                                <span className="inline-flex items-center justify-center gap-1.5 px-3 py-1 rounded-full text-xs md:text-sm font-bold shadow-sm bg-slate-100 text-slate-700 border border-slate-300">
                                  <span className="w-2 h-2 rounded-full bg-slate-400" />
                                  <span>0</span>
                                  <ChevronDown size={13} className="opacity-60" />
                                </span>
                              );
                            } else if (strVal !== '') {
                              return (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
                                  <span>{strVal}</span>
                                  <ChevronDown size={13} className="opacity-60" />
                                </span>
                              );
                            } else {
                              return (
                                <span className="inline-flex items-center gap-1 text-slate-400 group-hover:text-blue-600 text-xs font-semibold px-2 py-1 rounded-md transition-colors border border-dashed border-slate-300 bg-slate-50/70">
                                  <span>اختر</span>
                                  <ChevronDown size={13} className="text-slate-400" />
                                </span>
                              );
                            }
                          })()}
                        </div>
                      ) : isSectionCell(rowIdx, colIdx) ? (
                        <div className="w-full flex items-center justify-center gap-1.5 py-1 pointer-events-none select-none">
                          {(() => {
                            const strVal = String(cell != null ? cell : '').trim();
                            const currentOpt = SECTION_OPTIONS.find(o => o.label === strVal);
                            if (currentOpt) {
                              return (
                                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs md:text-sm font-extrabold shadow-sm border ${currentOpt.badgeClass}`}>
                                  <span className={`w-2 h-2 rounded-full ${currentOpt.dotColor}`} />
                                  <span>{currentOpt.label}</span>
                                  <ChevronDown size={13} className="opacity-60" />
                                </span>
                              );
                            } else if (strVal !== '') {
                              return (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs md:text-sm font-bold bg-slate-100 text-slate-700 border border-slate-300">
                                  <span>{strVal}</span>
                                  <ChevronDown size={13} className="opacity-60" />
                                </span>
                              );
                            } else {
                              return (
                                <span className="inline-flex items-center gap-1 text-slate-400 group-hover:text-blue-600 text-xs font-semibold px-2 py-1 rounded-md transition-colors border border-dashed border-slate-300 bg-slate-50/70">
                                  <span>اختر</span>
                                  <ChevronDown size={13} className="text-slate-400" />
                                </span>
                              );
                            }
                          })()}
                        </div>
                      ) : isStageCell(rowIdx, colIdx) ? (
                        <div className="w-full flex items-center justify-center gap-1.5 py-1 pointer-events-none select-none">
                          {(() => {
                            const strVal = String(cell != null ? cell : '').trim();
                            const normalizedStage = (strVal === 'ابتدائي' || strVal === 'إبتدائي') ? 'إبتدائي' : strVal;
                            const currentOpt = STAGE_OPTIONS.find(o => o.label === normalizedStage);
                            if (currentOpt) {
                              return (
                                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs md:text-sm font-extrabold shadow-sm border ${currentOpt.badgeClass}`}>
                                  <span className={`w-2 h-2 rounded-full ${currentOpt.dotColor}`} />
                                  <span>{currentOpt.label}</span>
                                  <ChevronDown size={13} className="opacity-60" />
                                </span>
                              );
                            } else if (strVal !== '') {
                              return (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs md:text-sm font-bold bg-slate-100 text-slate-700 border border-slate-300">
                                  <span>{strVal}</span>
                                  <ChevronDown size={13} className="opacity-60" />
                                </span>
                              );
                            } else {
                              return (
                                <span className="inline-flex items-center gap-1 text-slate-400 group-hover:text-blue-600 text-xs font-semibold px-2 py-1 rounded-md transition-colors border border-dashed border-slate-300 bg-slate-50/70">
                                  <span>اختر</span>
                                  <ChevronDown size={13} className="text-slate-400" />
                                </span>
                              );
                            }
                          })()}
                        </div>
                      ) : isQuotaCell(rowIdx, colIdx) ? (
                        <div className="w-full flex items-center justify-center gap-1.5 py-1 pointer-events-none select-none">
                          {(() => {
                            const strVal = String(cell != null ? cell : '').trim();
                            if (strVal !== '') {
                              return (
                                <span className="inline-flex items-center justify-center gap-1 px-3 py-1 rounded-full text-xs md:text-sm font-black bg-indigo-50 text-indigo-700 border border-indigo-200 shadow-sm">
                                  <span>{strVal}</span>
                                  <ChevronDown size={12} className="opacity-60" />
                                </span>
                              );
                            } else {
                              return (
                                <span className="inline-flex items-center gap-1 text-slate-400 group-hover:text-blue-600 text-xs font-semibold px-2 py-1 rounded-md transition-colors border border-dashed border-slate-300 bg-slate-50/70">
                                  <span>اختر</span>
                                  <ChevronDown size={13} className="text-slate-400" />
                                </span>
                              );
                            }
                          })()}
                        </div>
                      ) : isNationalityCell(rowIdx, colIdx) ? (
                        <div className="w-full flex items-center justify-center gap-1.5 py-1 pointer-events-none select-none">
                          {(() => {
                            const strVal = String(cell != null ? cell : '').trim();
                            const currentOpt = NATIONALITY_OPTIONS.find(o => o.label === strVal);
                            if (currentOpt) {
                              return (
                                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs md:text-sm font-extrabold shadow-sm border ${currentOpt.badgeClass}`}>
                                  <span>{currentOpt.flag}</span>
                                  <span>{currentOpt.label}</span>
                                  <ChevronDown size={13} className="opacity-60" />
                                </span>
                              );
                            } else if (strVal !== '') {
                              return (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs md:text-sm font-bold bg-slate-100 text-slate-700 border border-slate-300">
                                  <Globe size={13} className="text-slate-500" />
                                  <span>{strVal}</span>
                                  <ChevronDown size={13} className="opacity-60" />
                                </span>
                              );
                            } else {
                              return (
                                <span className="inline-flex items-center gap-1 text-slate-400 group-hover:text-blue-600 text-xs font-semibold px-2 py-1 rounded-md transition-colors border border-dashed border-slate-300 bg-slate-50/70">
                                  <span>اختر</span>
                                  <ChevronDown size={13} className="text-slate-400" />
                                </span>
                              );
                            }
                          })()}
                        </div>
                      ) : isSpecializationCell(rowIdx, colIdx) ? (
                        <div className="w-full flex items-center justify-center gap-1.5 py-1 pointer-events-none select-none">
                          {(() => {
                            const strVal = String(cell != null ? cell : '').trim();
                            if (strVal !== '') {
                              return (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs md:text-sm font-bold bg-sky-50 text-sky-800 border border-sky-200 shadow-sm">
                                  <BookOpen size={13} className="text-sky-600" />
                                  <span>{strVal}</span>
                                  <ChevronDown size={12} className="opacity-60" />
                                </span>
                              );
                            } else {
                              return (
                                <span className="inline-flex items-center gap-1 text-slate-400 group-hover:text-blue-600 text-xs font-semibold px-2 py-1 rounded-md transition-colors border border-dashed border-slate-300 bg-slate-50/70">
                                  <span>اختر</span>
                                  <ChevronDown size={13} className="text-slate-400" />
                                </span>
                              );
                            }
                          })()}
                        </div>
                      ) : isQualificationCell(rowIdx, colIdx) ? (
                        <div className="w-full flex items-center justify-center gap-1.5 py-1 pointer-events-none select-none">
                          {(() => {
                            const strVal = String(cell != null ? cell : '').trim();
                            if (strVal !== '') {
                              return (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs md:text-sm font-bold bg-teal-50 text-teal-800 border border-teal-200 shadow-sm">
                                  <Award size={13} className="text-teal-600" />
                                  <span>{strVal}</span>
                                  <ChevronDown size={12} className="opacity-60" />
                                </span>
                              );
                            } else {
                              return (
                                <span className="inline-flex items-center gap-1 text-slate-400 group-hover:text-blue-600 text-xs font-semibold px-2 py-1 rounded-md transition-colors border border-dashed border-slate-300 bg-slate-50/70">
                                  <span>اختر</span>
                                  <ChevronDown size={13} className="text-slate-400" />
                                </span>
                              );
                            }
                          })()}
                        </div>
                      ) : isSubjectCell(rowIdx, colIdx) ? (
                        <div className="w-full flex items-center justify-center gap-1.5 py-1 pointer-events-none select-none">
                          {(() => {
                            const strVal = String(cell != null ? cell : '').trim();
                            if (strVal !== '') {
                              return (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs md:text-sm font-bold bg-violet-50 text-violet-900 border border-violet-200 shadow-sm">
                                  <GraduationCap size={13} className="text-violet-600" />
                                  <span>{strVal}</span>
                                  <ChevronDown size={12} className="opacity-60" />
                                </span>
                              );
                            } else {
                              return (
                                <span className="inline-flex items-center gap-1 text-slate-400 group-hover:text-blue-600 text-xs font-semibold px-2 py-1 rounded-md transition-colors border border-dashed border-slate-300 bg-slate-50/70">
                                  <span>اختر</span>
                                  <ChevronDown size={13} className="text-slate-400" />
                                </span>
                              );
                            }
                          })()}
                        </div>
                      ) : isBankCell(rowIdx, colIdx) ? (
                        <div className="w-full flex items-center justify-center gap-1.5 py-1 pointer-events-none select-none">
                          {(() => {
                            const strVal = String(cell != null ? cell : '').trim();
                            if (strVal !== '') {
                              return (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs md:text-sm font-bold bg-amber-50 text-amber-900 border border-amber-300 shadow-sm">
                                  <Landmark size={13} className="text-amber-700" />
                                  <span>{strVal}</span>
                                  <ChevronDown size={12} className="opacity-60" />
                                </span>
                              );
                            } else {
                              return (
                                <span className="inline-flex items-center gap-1 text-slate-400 group-hover:text-blue-600 text-xs font-semibold px-2 py-1 rounded-md transition-colors border border-dashed border-slate-300 bg-slate-50/70">
                                  <Landmark size={12} />
                                  <span>اختر البنك</span>
                                  <ChevronDown size={13} className="text-slate-400" />
                                </span>
                              );
                            }
                          })()}
                        </div>
                      ) : isJobCell(rowIdx, colIdx) ? (
                        <div className="w-full flex items-center justify-center gap-1.5 py-1 pointer-events-none select-none">
                          {(() => {
                            const strVal = String(cell != null ? cell : '').trim();
                            if (strVal !== '' && strVal !== '0') {
                              return (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs md:text-sm font-bold bg-indigo-50 text-indigo-900 border border-indigo-200 shadow-sm">
                                  <Briefcase size={13} className="text-indigo-600" />
                                  <span>{strVal}</span>
                                  <ChevronDown size={12} className="opacity-60" />
                                </span>
                              );
                            } else {
                              return (
                                <span className="inline-flex items-center gap-1 text-slate-400 group-hover:text-blue-600 text-xs font-semibold px-2 py-1 rounded-md transition-colors border border-dashed border-slate-300 bg-slate-50/70">
                                  <Briefcase size={12} />
                                  <span>اختر الوظيفة</span>
                                  <ChevronDown size={13} className="text-slate-400" />
                                </span>
                              );
                            }
                          })()}
                        </div>
                      ) : isAffiliationCell(rowIdx, colIdx) ? (
                        <div className="w-full flex items-center justify-center gap-1.5 py-1 pointer-events-none select-none">
                          {(() => {
                            const strVal = String(cell != null ? cell : '').trim();
                            if (strVal === 'إدارة المجمع') {
                              return (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs md:text-sm font-bold bg-blue-100 text-blue-900 border border-blue-300 shadow-sm">
                                  <Building2 size={13} className="text-blue-700" />
                                  <span>إدارة المجمع</span>
                                  <ChevronDown size={12} className="opacity-60" />
                                </span>
                              );
                            } else if (strVal === 'إداري بنين') {
                              return (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs md:text-sm font-bold bg-emerald-100 text-emerald-900 border border-emerald-300 shadow-sm">
                                  <Users size={13} className="text-emerald-700" />
                                  <span>إداري بنين</span>
                                  <ChevronDown size={12} className="opacity-60" />
                                </span>
                              );
                            } else if (strVal === 'إداري بنات') {
                              return (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs md:text-sm font-bold bg-rose-100 text-rose-900 border border-rose-300 shadow-sm">
                                  <Users size={13} className="text-rose-700" />
                                  <span>إداري بنات</span>
                                  <ChevronDown size={12} className="opacity-60" />
                                </span>
                              );
                            } else if (strVal !== '') {
                              return (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs md:text-sm font-bold bg-slate-100 text-slate-800 border border-slate-300 shadow-sm">
                                  <span>{strVal}</span>
                                  <ChevronDown size={12} className="opacity-60" />
                                </span>
                              );
                            } else {
                              return (
                                <span className="inline-flex items-center gap-1 text-slate-400 group-hover:text-blue-600 text-xs font-semibold px-2 py-1 rounded-md transition-colors border border-dashed border-slate-300 bg-slate-50/70">
                                  <span>اختر التبعية</span>
                                  <ChevronDown size={13} className="text-slate-400" />
                                </span>
                              );
                            }
                          })()}
                        </div>
                      ) : isIbanCell(rowIdx, colIdx) ? (
                        <div 
                          onClick={(e) => {
                            e.stopPropagation();
                            closeAllPickers();
                            setEditingCell({ r: rowIdx, c: colIdx, value: String(cell ?? 'SA') });
                          }}
                          className="w-full flex items-center justify-center gap-1.5 py-1 px-1 select-none group/iban cursor-pointer relative"
                          title="انقر لتعديل رقم الآيبان"
                        >
                          {(() => {
                            const strVal = String(cell != null ? cell : '').trim();
                            const digitsOnly = strVal.replace(/^SA/i, '').replace(/\s+/g, '');
                            const fullIban = `SA${digitsOnly}`;
                            const isCellCopied = copiedCellKey === `${rowIdx},${colIdx}`;

                            return (
                              <div className="flex items-center gap-1.5">
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs md:text-sm font-mono font-bold text-emerald-950 bg-emerald-50 border border-emerald-300 shadow-sm group-hover/iban:border-emerald-500 transition-colors" dir="ltr">
                                  <span className="text-emerald-700 font-black">SA</span>
                                  {digitsOnly ? (
                                    <span className="tracking-wider">{digitsOnly}</span>
                                  ) : (
                                    <span className="text-slate-400 font-sans text-xs">أدخل الأرقام</span>
                                  )}
                                </span>

                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    navigator.clipboard.writeText(fullIban);
                                    setCopiedCellKey(`${rowIdx},${colIdx}`);
                                    setTimeout(() => setCopiedCellKey(null), 1500);
                                  }}
                                  className={`p-1 rounded transition-all cursor-pointer ${
                                    isCellCopied
                                      ? 'bg-emerald-600 text-white shadow-sm'
                                      : 'bg-white hover:bg-emerald-100 text-emerald-700 border border-emerald-200 opacity-60 group-hover/iban:opacity-100'
                                  }`}
                                  title="نسخ الآيبان كاملاً مع SA"
                                >
                                  {isCellCopied ? <Check size={12} /> : <Copy size={12} />}
                                </button>

                                {isCellCopied && (
                                  <span className="absolute -top-7 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] font-sans font-bold px-2 py-0.5 rounded-md shadow-md z-30 pointer-events-none animate-in fade-in">
                                    تم نسخ الآيبان مع SA!
                                  </span>
                                )}
                              </div>
                            );
                          })()}
                        </div>
                      ) : isEmailCell(rowIdx, colIdx) ? (
                        <div 
                          onClick={(e) => {
                            e.stopPropagation();
                            closeAllPickers();
                            setEditingCell({ r: rowIdx, c: colIdx, value: String(cell ?? '') });
                          }}
                          className="w-full flex items-center justify-center gap-1.5 py-1 select-none group/email cursor-pointer"
                        >
                          {(() => {
                            const strVal = String(cell != null ? cell : '').trim();
                            if (strVal !== '') {
                              return (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs md:text-sm font-mono text-blue-800 bg-blue-50/70 border border-blue-200 hover:bg-blue-100 hover:border-blue-400 transition-colors" dir="ltr">
                                  <Mail size={12} className="text-blue-500 shrink-0" />
                                  <span className="truncate max-w-[200px]">{strVal}</span>
                                  <Edit2 size={11} className="text-blue-500 opacity-60 group-hover/email:opacity-100 transition-opacity" />
                                </span>
                              );
                            } else {
                              return (
                                <span className="inline-flex items-center gap-1 text-slate-400 group-hover:text-blue-600 text-xs font-semibold px-2 py-1 rounded-md transition-colors border border-dashed border-slate-300 bg-slate-50/70 hover:bg-blue-50/50">
                                  <Mail size={12} />
                                  <span>أدخل الإيميل</span>
                                  <Edit2 size={11} className="text-slate-400" />
                                </span>
                              );
                            }
                          })()}
                        </div>
                      ) : (
                        <div 
                          onClick={(e) => {
                            e.stopPropagation();
                            closeAllPickers();
                            setEditingCell({ r: rowIdx, c: colIdx, value: String(cell ?? '') });
                          }}
                          className="w-full h-full min-h-[26px] flex items-center justify-center group/cell relative cursor-pointer"
                          title="انقر أو انقر مرتين للتحرير المباشر"
                        >
                          <span className="truncate">{cell}</span>
                          {isSelected && selectedCells.size === 1 && (
                            <button
                              type="button"
                              onMouseDown={(e) => e.stopPropagation()}
                              onClick={(e) => {
                                e.stopPropagation();
                                closeAllPickers();
                                setEditingCell({ r: rowIdx, c: colIdx, value: String(cell ?? '') });
                              }}
                              className="absolute left-1 flex items-center gap-1 px-1.5 py-0.5 rounded bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-200 shadow-sm text-[11px] font-bold transition-all z-20"
                              title="تعديل الخلية"
                            >
                              <Edit2 size={11} />
                              <span>تعديل</span>
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
            {activeSheet.data.length === 0 && (
              <tr>
                <td colSpan={100} className="px-6 py-12 text-center text-slate-500 font-bold text-lg">
                  لا توجد بيانات متاحة في هذا الشيت أو تم حذفها بالكامل
                </td>
              </tr>
            )}
          </tbody>
        </table>
        </div>

        {/* نافذة الخيارات المباشرة المنبثقة فوق الخلية فور الضغط عليها */}
        {classeraPicker && activeSheet && (
          <div 
            className="fixed inset-0 z-[9999] bg-black/10 backdrop-blur-[0.5px]"
            onClick={(e) => {
              e.stopPropagation();
              setClasseraPicker(null);
            }}
            onMouseDown={(e) => {
              e.stopPropagation();
            }}
          >
            <div 
              className="fixed bg-white rounded-2xl shadow-2xl border-2 border-blue-400 p-3 min-w-[220px] text-right font-sans ring-4 ring-blue-500/10 z-[10000] animate-in fade-in zoom-in-95 duration-100"
              style={{
                top: classeraPicker.bottom + 235 > window.innerHeight 
                  ? Math.max(10, classeraPicker.top - 235) 
                  : classeraPicker.bottom + 4,
                right: Math.max(12, Math.min(window.innerWidth - 240, window.innerWidth - classeraPicker.right)),
              }}
              onClick={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-2">
                <div className="flex items-center gap-1.5 text-xs font-black text-blue-950">
                  <Sparkles size={14} className="text-amber-500" />
                  <span>اختر مستوى كلاسيرا</span>
                </div>
                <button 
                  type="button"
                  onClick={() => setClasseraPicker(null)}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  <X size={14} />
                </button>
              </div>

              <div className="flex flex-col gap-1.5">
                {CLASSERA_OPTIONS.map((opt) => {
                  const cellVal = String(activeSheet.data[classeraPicker.r]?.[classeraPicker.c] || '').trim();
                  const isSelected = cellVal === opt.label;
                  return (
                    <button
                      type="button"
                      key={opt.label}
                      onClick={() => handleSelectClasseraOption(classeraPicker.r, classeraPicker.c, opt.label)}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-bold transition-all border ${
                        isSelected 
                          ? `${opt.activeBg} ${opt.textColor} ${opt.borderColor} shadow-sm ring-2 ${opt.ringColor}`
                          : `bg-slate-50 hover:${opt.hoverBg} text-slate-700 hover:${opt.textColor} border-slate-200 hover:${opt.borderColor}`
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className={`w-3 h-3 rounded-full ${opt.dotColor}`} />
                        <span>{opt.label}</span>
                      </div>
                      {isSelected && <Check size={16} className={opt.textColor} />}
                    </button>
                  );
                })}
              </div>

              {activeSheet.data[classeraPicker.r]?.[classeraPicker.c] && (
                <div className="border-t border-slate-100 pt-2 mt-2">
                  <button
                    type="button"
                    onClick={() => handleSelectClasseraOption(classeraPicker.r, classeraPicker.c, "")}
                    className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <Eraser size={13} />
                    <span>مسح القيمة</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* نافذة خيارات الرخصة المهنية (0 أو 1) المنبثقة مباشرة فوق الخلية */}
        {licensePicker && activeSheet && (
          <div 
            className="fixed inset-0 z-[9999] bg-black/10 backdrop-blur-[0.5px]"
            onClick={(e) => {
              e.stopPropagation();
              setLicensePicker(null);
            }}
            onMouseDown={(e) => {
              e.stopPropagation();
            }}
          >
            <div 
              className="fixed bg-white rounded-2xl shadow-2xl border-2 border-emerald-500 p-3.5 min-w-[210px] text-right font-sans ring-4 ring-emerald-500/10 z-[10000] animate-in fade-in zoom-in-95 duration-100"
              style={{
                top: licensePicker.bottom + 190 > window.innerHeight 
                  ? Math.max(10, licensePicker.top - 190) 
                  : licensePicker.bottom + 4,
                right: Math.max(12, Math.min(window.innerWidth - 230, window.innerWidth - licensePicker.right)),
              }}
              onClick={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-3">
                <div className="flex items-center gap-1.5 text-xs font-black text-slate-800">
                  <FileText size={15} className="text-emerald-600" />
                  <span>الرخصة المهنية</span>
                </div>
                <button 
                  type="button"
                  onClick={() => setLicensePicker(null)}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  <X size={14} />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                {/* خيار 1 */}
                <button
                  type="button"
                  onClick={() => handleSelectLicenseOption(licensePicker.r, licensePicker.c, 1)}
                  className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 font-black transition-all ${
                    String(activeSheet.data[licensePicker.r]?.[licensePicker.c]).trim() === '1'
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-800 shadow-md ring-2 ring-emerald-400/40'
                      : 'bg-slate-50 hover:bg-emerald-50 border-slate-200 hover:border-emerald-300 text-slate-700 hover:text-emerald-700'
                  }`}
                >
                  <span className="text-2xl font-black mb-0.5 text-emerald-700">1</span>
                  <span className="text-[11px] font-bold text-emerald-800">حاصل</span>
                </button>

                {/* خيار 0 */}
                <button
                  type="button"
                  onClick={() => handleSelectLicenseOption(licensePicker.r, licensePicker.c, 0)}
                  className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 font-black transition-all ${
                    String(activeSheet.data[licensePicker.r]?.[licensePicker.c]).trim() === '0'
                      ? 'bg-slate-100 border-slate-500 text-slate-800 shadow-md ring-2 ring-slate-400/40'
                      : 'bg-slate-50 hover:bg-slate-100 border-slate-200 hover:border-slate-300 text-slate-700'
                  }`}
                >
                  <span className="text-2xl font-black mb-0.5 text-slate-700">0</span>
                  <span className="text-[11px] font-bold text-slate-600">غير حاصل</span>
                </button>
              </div>

              {activeSheet.data[licensePicker.r]?.[licensePicker.c] !== "" && activeSheet.data[licensePicker.r]?.[licensePicker.c] != null && (
                <div className="border-t border-slate-100 pt-2 mt-2.5">
                  <button
                    type="button"
                    onClick={() => handleSelectLicenseOption(licensePicker.r, licensePicker.c, "")}
                    className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <Eraser size={13} />
                    <span>مسح القيمة</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* نافذة خيارات القسم (بنين أو بنات) المنبثقة مباشرة فوق الخلية */}
        {sectionPicker && activeSheet && (
          <div 
            className="fixed inset-0 z-[9999] bg-black/10 backdrop-blur-[0.5px]"
            onClick={(e) => {
              e.stopPropagation();
              setSectionPicker(null);
            }}
            onMouseDown={(e) => {
              e.stopPropagation();
            }}
          >
            <div 
              className="fixed bg-white rounded-2xl shadow-2xl border-2 border-blue-500 p-3.5 min-w-[210px] text-right font-sans ring-4 ring-blue-500/10 z-[10000] animate-in fade-in zoom-in-95 duration-100"
              style={{
                top: sectionPicker.bottom + 190 > window.innerHeight 
                  ? Math.max(10, sectionPicker.top - 190) 
                  : sectionPicker.bottom + 4,
                right: Math.max(12, Math.min(window.innerWidth - 230, window.innerWidth - sectionPicker.right)),
              }}
              onClick={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-3">
                <div className="flex items-center gap-1.5 text-xs font-black text-slate-800">
                  <Users size={15} className="text-blue-600" />
                  <span>القسم</span>
                </div>
                <button 
                  type="button"
                  onClick={() => setSectionPicker(null)}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  <X size={14} />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                {SECTION_OPTIONS.map(opt => {
                  const cellVal = String(activeSheet.data[sectionPicker.r]?.[sectionPicker.c] || '').trim();
                  const isSelected = cellVal === opt.label;
                  return (
                    <button
                      type="button"
                      key={opt.label}
                      onClick={() => handleSelectSectionOption(sectionPicker.r, sectionPicker.c, opt.label)}
                      className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 font-black transition-all ${
                        isSelected
                          ? `${opt.activeBg} ${opt.borderColor} ${opt.textColor} shadow-md ring-2 ${opt.ringColor}`
                          : `bg-slate-50 hover:${opt.hoverBg} border-slate-200 hover:${opt.borderColor} text-slate-700 hover:${opt.textColor}`
                      }`}
                    >
                      <span className="text-2xl mb-0.5">{opt.icon}</span>
                      <span className="text-xs font-black">{opt.label}</span>
                    </button>
                  );
                })}
              </div>

              {activeSheet.data[sectionPicker.r]?.[sectionPicker.c] && (
                <div className="border-t border-slate-100 pt-2 mt-2.5">
                  <button
                    type="button"
                    onClick={() => handleSelectSectionOption(sectionPicker.r, sectionPicker.c, "")}
                    className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <Eraser size={13} />
                    <span>مسح القيمة</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* نافذة خيارات المرحلة المنبثقة مباشرة فوق الخلية */}
        {stagePicker && activeSheet && (
          <div 
            className="fixed inset-0 z-[9999] bg-black/10 backdrop-blur-[0.5px]"
            onClick={(e) => {
              e.stopPropagation();
              setStagePicker(null);
            }}
            onMouseDown={(e) => {
              e.stopPropagation();
            }}
          >
            <div 
              className="fixed bg-white rounded-2xl shadow-2xl border-2 border-emerald-500 p-3 min-w-[210px] text-right font-sans ring-4 ring-emerald-500/10 z-[10000] animate-in fade-in zoom-in-95 duration-100"
              style={{
                top: stagePicker.bottom + 270 > window.innerHeight 
                  ? Math.max(10, stagePicker.top - 270) 
                  : stagePicker.bottom + 4,
                right: Math.max(12, Math.min(window.innerWidth - 230, window.innerWidth - stagePicker.right)),
              }}
              onClick={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-2">
                <div className="flex items-center gap-1.5 text-xs font-black text-slate-800">
                  <GraduationCap size={15} className="text-emerald-600" />
                  <span>المرحلة الدراسية</span>
                </div>
                <button 
                  type="button"
                  onClick={() => setStagePicker(null)}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  <X size={14} />
                </button>
              </div>

              <div className="flex flex-col gap-1.5">
                {STAGE_OPTIONS.map(opt => {
                  const cellVal = String(activeSheet.data[stagePicker.r]?.[stagePicker.c] || '').trim();
                  const isSelected = cellVal === opt.label || (opt.label === 'إبتدائي' && cellVal === 'ابتدائي');
                  return (
                    <button
                      type="button"
                      key={opt.label}
                      onClick={() => handleSelectStageOption(stagePicker.r, stagePicker.c, opt.label)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs md:text-sm font-bold transition-all border ${
                        isSelected
                          ? `${opt.activeBg} ${opt.textColor} ${opt.borderColor} shadow-sm ring-2 ${opt.ringColor}`
                          : `bg-slate-50 hover:${opt.hoverBg} text-slate-700 hover:${opt.textColor} border-slate-200 hover:${opt.borderColor}`
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className={`w-2.5 h-2.5 rounded-full ${opt.dotColor}`} />
                        <span>{opt.label}</span>
                      </div>
                      {isSelected && <Check size={16} className={opt.textColor} />}
                    </button>
                  );
                })}
              </div>

              {activeSheet.data[stagePicker.r]?.[stagePicker.c] && (
                <div className="border-t border-slate-100 pt-2 mt-2">
                  <button
                    type="button"
                    onClick={() => handleSelectStageOption(stagePicker.r, stagePicker.c, "")}
                    className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <Eraser size={13} />
                    <span>مسح القيمة</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* نافذة خيارات نصاب المعلم (1 إلى 35) المنبثقة مباشرة فوق الخلية */}
        {quotaPicker && activeSheet && (
          <div 
            className="fixed inset-0 z-[9999] bg-black/10 backdrop-blur-[0.5px]"
            onClick={(e) => {
              e.stopPropagation();
              setQuotaPicker(null);
            }}
            onMouseDown={(e) => {
              e.stopPropagation();
            }}
          >
            <div 
              className="fixed bg-white rounded-2xl shadow-2xl border-2 border-indigo-500 p-3 min-w-[280px] max-w-[320px] text-right font-sans ring-4 ring-indigo-500/10 z-[10000] animate-in fade-in zoom-in-95 duration-100"
              style={{
                top: quotaPicker.bottom + 270 > window.innerHeight 
                  ? Math.max(10, quotaPicker.top - 270) 
                  : quotaPicker.bottom + 4,
                right: Math.max(12, Math.min(window.innerWidth - 300, window.innerWidth - quotaPicker.right)),
              }}
              onClick={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-2">
                <div className="flex items-center gap-1.5 text-xs font-black text-slate-800">
                  <Activity size={15} className="text-indigo-600" />
                  <span>نصاب المعلم (1 إلى 35)</span>
                </div>
                <button 
                  type="button"
                  onClick={() => setQuotaPicker(null)}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  <X size={14} />
                </button>
              </div>

              <div className="grid grid-cols-7 gap-1.5 p-1 max-h-56 overflow-y-auto custom-scrollbar">
                {QUOTA_OPTIONS.map(num => {
                  const cellVal = String(activeSheet.data[quotaPicker.r]?.[quotaPicker.c] || '').trim();
                  const isSelected = cellVal === String(num);
                  return (
                    <button
                      type="button"
                      key={num}
                      onClick={() => handleSelectQuotaOption(quotaPicker.r, quotaPicker.c, num)}
                      className={`h-8 rounded-lg font-black text-xs md:text-sm flex items-center justify-center transition-all border ${
                        isSelected
                          ? 'bg-indigo-600 text-white border-indigo-700 shadow-md ring-2 ring-indigo-400'
                          : 'bg-slate-50 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 border-slate-200'
                      }`}
                    >
                      {num}
                    </button>
                  );
                })}
              </div>

              {activeSheet.data[quotaPicker.r]?.[quotaPicker.c] !== "" && activeSheet.data[quotaPicker.r]?.[quotaPicker.c] != null && (
                <div className="border-t border-slate-100 pt-2 mt-2">
                  <button
                    type="button"
                    onClick={() => handleSelectQuotaOption(quotaPicker.r, quotaPicker.c, "")}
                    className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <Eraser size={13} />
                    <span>مسح القيمة</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* نافذة خيارات الجنسية المنبثقة مباشرة فوق الخلية */}
        {nationalityPicker && activeSheet && (
          <div 
            className="fixed inset-0 z-[9999] bg-black/10 backdrop-blur-[0.5px]"
            onClick={(e) => {
              e.stopPropagation();
              setNationalityPicker(null);
            }}
            onMouseDown={(e) => {
              e.stopPropagation();
            }}
          >
            <div 
              className="fixed bg-white rounded-2xl shadow-2xl border-2 border-emerald-500 p-3.5 min-w-[240px] max-w-[280px] text-right font-sans ring-4 ring-emerald-500/10 z-[10000] animate-in fade-in zoom-in-95 duration-100"
              style={{
                top: nationalityPicker.bottom + 290 > window.innerHeight 
                  ? Math.max(10, nationalityPicker.top - 290) 
                  : nationalityPicker.bottom + 4,
                right: Math.max(12, Math.min(window.innerWidth - 260, window.innerWidth - nationalityPicker.right)),
              }}
              onClick={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-2.5">
                <div className="flex items-center gap-1.5 text-xs font-black text-slate-800">
                  <Globe size={15} className="text-emerald-600" />
                  <span>الجنسية</span>
                </div>
                <button 
                  type="button"
                  onClick={() => setNationalityPicker(null)}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  <X size={14} />
                </button>
              </div>

              <div className="flex flex-col gap-1.5">
                {NATIONALITY_OPTIONS.map(opt => {
                  const cellVal = String(activeSheet.data[nationalityPicker.r]?.[nationalityPicker.c] || '').trim();
                  const isSelected = cellVal === opt.label;
                  return (
                    <button
                      type="button"
                      key={opt.label}
                      onClick={() => handleSelectNationalityOption(nationalityPicker.r, nationalityPicker.c, opt.label)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs md:text-sm font-bold transition-all border ${
                        isSelected
                          ? `${opt.activeBg} ${opt.textColor} ${opt.borderColor} shadow-sm ring-2 ${opt.ringColor}`
                          : `bg-slate-50 hover:${opt.hoverBg} text-slate-700 hover:${opt.textColor} border-slate-200 hover:${opt.borderColor}`
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{opt.flag}</span>
                        <span>{opt.label}</span>
                      </div>
                      {isSelected && <Check size={16} className={opt.textColor} />}
                    </button>
                  );
                })}
              </div>

              {/* خيار إدخال جنسية يدوي خاص بالمسؤول فقط */}
              {user?.role === 'admin' && (
                <div className="border-t border-slate-200 pt-2.5 mt-2.5">
                  <div className="text-[11px] font-bold text-blue-900 mb-1.5 flex items-center gap-1">
                    <UserCog size={13} className="text-blue-600" />
                    <span>كتابة يدوي (خاص بالمسؤول):</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="text"
                      value={customNationalityInput}
                      onChange={(e) => setCustomNationalityInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && customNationalityInput.trim()) {
                          handleSelectNationalityOption(nationalityPicker.r, nationalityPicker.c, customNationalityInput.trim());
                        }
                      }}
                      placeholder="اكتب أي جنسية..."
                      className="flex-1 px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (customNationalityInput.trim()) {
                          handleSelectNationalityOption(nationalityPicker.r, nationalityPicker.c, customNationalityInput.trim());
                        }
                      }}
                      disabled={!customNationalityInput.trim()}
                      className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition-colors"
                    >
                      حفظ
                    </button>
                  </div>
                </div>
              )}

              {activeSheet.data[nationalityPicker.r]?.[nationalityPicker.c] && (
                <div className="border-t border-slate-100 pt-2 mt-2">
                  <button
                    type="button"
                    onClick={() => handleSelectNationalityOption(nationalityPicker.r, nationalityPicker.c, "")}
                    className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <Eraser size={13} />
                    <span>مسح القيمة</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* نافذة خيارات التخصص المنبثقة مباشرة فوق الخلية */}
        {specializationPicker && activeSheet && (
          <div 
            className="fixed inset-0 z-[9999] bg-black/10 backdrop-blur-[0.5px]"
            onClick={(e) => {
              e.stopPropagation();
              setSpecializationPicker(null);
            }}
            onMouseDown={(e) => {
              e.stopPropagation();
            }}
          >
            <div 
              className="fixed bg-white rounded-2xl shadow-2xl border-2 border-sky-500 p-3 min-w-[260px] max-w-[320px] text-right font-sans ring-4 ring-sky-500/10 z-[10000] animate-in fade-in zoom-in-95 duration-100"
              style={{
                top: specializationPicker.bottom + 320 > window.innerHeight 
                  ? Math.max(10, specializationPicker.top - 320) 
                  : specializationPicker.bottom + 4,
                right: Math.max(12, Math.min(window.innerWidth - 290, window.innerWidth - specializationPicker.right)),
              }}
              onClick={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-2">
                <div className="flex items-center gap-1.5 text-xs font-black text-slate-800">
                  <BookOpen size={15} className="text-sky-600" />
                  <span>التخصص</span>
                </div>
                <button 
                  type="button"
                  onClick={() => setSpecializationPicker(null)}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  <X size={14} />
                </button>
              </div>

              {/* بحث سريع داخل التخصصات */}
              <div className="relative mb-2">
                <input
                  type="text"
                  value={pickerSearchQuery}
                  onChange={(e) => setPickerSearchQuery(e.target.value)}
                  placeholder="ابحث في التخصصات..."
                  className="w-full pl-2 pr-7 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-400"
                />
                <Search size={13} className="absolute right-2 top-2.5 text-slate-400" />
              </div>

              <div className="flex flex-col gap-1 max-h-48 overflow-y-auto custom-scrollbar p-0.5">
                {specializationOptions
                  .filter(spec => !pickerSearchQuery.trim() || spec.toLowerCase().includes(pickerSearchQuery.trim().toLowerCase()))
                  .map(spec => {
                    const cellVal = String(activeSheet.data[specializationPicker.r]?.[specializationPicker.c] || '').trim();
                    const isSelected = cellVal === spec;
                    return (
                      <button
                        type="button"
                        key={spec}
                        onClick={() => handleSelectSpecializationOption(specializationPicker.r, specializationPicker.c, spec)}
                        className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                          isSelected
                            ? 'bg-sky-50 text-sky-800 border-sky-300 shadow-sm ring-1 ring-sky-400'
                            : 'bg-slate-50 hover:bg-sky-50 text-slate-700 hover:text-sky-800 border-slate-100 hover:border-sky-200'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-sky-500" />
                          <span>{spec}</span>
                        </div>
                        {isSelected && <Check size={14} className="text-sky-600" />}
                      </button>
                    );
                  })}
              </div>

              {/* خيار إدخال تخصص يدوي خاص بالمسؤول فقط */}
              {user?.role === 'admin' && (
                <div className="border-t border-slate-200 pt-2 mt-2">
                  <div className="text-[11px] font-bold text-blue-900 mb-1 flex items-center gap-1">
                    <UserCog size={13} className="text-blue-600" />
                    <span>كتابة تخصص يدوي (خاص بالمسؤول):</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="text"
                      value={customSpecializationInput}
                      onChange={(e) => setCustomSpecializationInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && customSpecializationInput.trim()) {
                          handleSelectSpecializationOption(specializationPicker.r, specializationPicker.c, customSpecializationInput.trim());
                        }
                      }}
                      placeholder="اكتب التخصص..."
                      className="flex-1 px-2 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-400 bg-white"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (customSpecializationInput.trim()) {
                          handleSelectSpecializationOption(specializationPicker.r, specializationPicker.c, customSpecializationInput.trim());
                        }
                      }}
                      disabled={!customSpecializationInput.trim()}
                      className="px-2.5 py-1.5 bg-sky-600 hover:bg-sky-700 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition-colors"
                    >
                      حفظ
                    </button>
                  </div>
                </div>
              )}

              {activeSheet.data[specializationPicker.r]?.[specializationPicker.c] && (
                <div className="border-t border-slate-100 pt-2 mt-2">
                  <button
                    type="button"
                    onClick={() => handleSelectSpecializationOption(specializationPicker.r, specializationPicker.c, "")}
                    className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <Eraser size={13} />
                    <span>مسح القيمة</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* نافذة خيارات المؤهل المنبثقة مباشرة فوق الخلية */}
        {qualificationPicker && activeSheet && (
          <div 
            className="fixed inset-0 z-[9999] bg-black/10 backdrop-blur-[0.5px]"
            onClick={(e) => {
              e.stopPropagation();
              setQualificationPicker(null);
            }}
            onMouseDown={(e) => {
              e.stopPropagation();
            }}
          >
            <div 
              className="fixed bg-white rounded-2xl shadow-2xl border-2 border-teal-500 p-3 min-w-[260px] max-w-[320px] text-right font-sans ring-4 ring-teal-500/10 z-[10000] animate-in fade-in zoom-in-95 duration-100"
              style={{
                top: qualificationPicker.bottom + 320 > window.innerHeight 
                  ? Math.max(10, qualificationPicker.top - 320) 
                  : qualificationPicker.bottom + 4,
                right: Math.max(12, Math.min(window.innerWidth - 290, window.innerWidth - qualificationPicker.right)),
              }}
              onClick={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-2">
                <div className="flex items-center gap-1.5 text-xs font-black text-slate-800">
                  <Award size={15} className="text-teal-600" />
                  <span>المؤهل العلمي</span>
                </div>
                <button 
                  type="button"
                  onClick={() => setQualificationPicker(null)}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  <X size={14} />
                </button>
              </div>

              {/* بحث سريع داخل المؤهلات */}
              <div className="relative mb-2">
                <input
                  type="text"
                  value={pickerSearchQuery}
                  onChange={(e) => setPickerSearchQuery(e.target.value)}
                  placeholder="ابحث في المؤهلات..."
                  className="w-full pl-2 pr-7 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-400"
                />
                <Search size={13} className="absolute right-2 top-2.5 text-slate-400" />
              </div>

              <div className="flex flex-col gap-1 max-h-48 overflow-y-auto custom-scrollbar p-0.5">
                {qualificationOptions
                  .filter(qual => !pickerSearchQuery.trim() || qual.toLowerCase().includes(pickerSearchQuery.trim().toLowerCase()))
                  .map(qual => {
                    const cellVal = String(activeSheet.data[qualificationPicker.r]?.[qualificationPicker.c] || '').trim();
                    const isSelected = cellVal === qual;
                    return (
                      <button
                        type="button"
                        key={qual}
                        onClick={() => handleSelectQualificationOption(qualificationPicker.r, qualificationPicker.c, qual)}
                        className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                          isSelected
                            ? 'bg-teal-50 text-teal-800 border-teal-300 shadow-sm ring-1 ring-teal-400'
                            : 'bg-slate-50 hover:bg-teal-50 text-slate-700 hover:text-teal-800 border-slate-100 hover:border-teal-200'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-teal-500" />
                          <span>{qual}</span>
                        </div>
                        {isSelected && <Check size={14} className="text-teal-600" />}
                      </button>
                    );
                  })}
              </div>

              {/* خيار إدخال مؤهل يدوي خاص بالمسؤول فقط */}
              {user?.role === 'admin' && (
                <div className="border-t border-slate-200 pt-2 mt-2">
                  <div className="text-[11px] font-bold text-blue-900 mb-1 flex items-center gap-1">
                    <UserCog size={13} className="text-blue-600" />
                    <span>كتابة مؤهل يدوي (خاص بالمسؤول):</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="text"
                      value={customQualificationInput}
                      onChange={(e) => setCustomQualificationInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && customQualificationInput.trim()) {
                          handleSelectQualificationOption(qualificationPicker.r, qualificationPicker.c, customQualificationInput.trim());
                        }
                      }}
                      placeholder="اكتب المؤهل..."
                      className="flex-1 px-2 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-400 bg-white"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (customQualificationInput.trim()) {
                          handleSelectQualificationOption(qualificationPicker.r, qualificationPicker.c, customQualificationInput.trim());
                        }
                      }}
                      disabled={!customQualificationInput.trim()}
                      className="px-2.5 py-1.5 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition-colors"
                    >
                      حفظ
                    </button>
                  </div>
                </div>
              )}

              {activeSheet.data[qualificationPicker.r]?.[qualificationPicker.c] && (
                <div className="border-t border-slate-100 pt-2 mt-2">
                  <button
                    type="button"
                    onClick={() => handleSelectQualificationOption(qualificationPicker.r, qualificationPicker.c, "")}
                    className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <Eraser size={13} />
                    <span>مسح القيمة</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* نافذة خيارات مادة التدريس المنبثقة مباشرة فوق الخلية */}
        {subjectPicker && activeSheet && (
          <div 
            className="fixed inset-0 z-[9999] bg-black/10 backdrop-blur-[0.5px]"
            onClick={(e) => {
              e.stopPropagation();
              setSubjectPicker(null);
            }}
            onMouseDown={(e) => {
              e.stopPropagation();
            }}
          >
            <div 
              className="fixed bg-white rounded-2xl shadow-2xl border-2 border-violet-500 p-3 min-w-[260px] max-w-[320px] text-right font-sans ring-4 ring-violet-500/10 z-[10000] animate-in fade-in zoom-in-95 duration-100"
              style={{
                top: subjectPicker.bottom + 320 > window.innerHeight 
                  ? Math.max(10, subjectPicker.top - 320) 
                  : subjectPicker.bottom + 4,
                right: Math.max(12, Math.min(window.innerWidth - 290, window.innerWidth - subjectPicker.right)),
              }}
              onClick={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-2">
                <div className="flex items-center gap-1.5 text-xs font-black text-slate-800">
                  <GraduationCap size={15} className="text-violet-600" />
                  <span>مادة التدريس</span>
                </div>
                <button 
                  type="button"
                  onClick={() => setSubjectPicker(null)}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  <X size={14} />
                </button>
              </div>

              {/* بحث سريع داخل مواد التدريس */}
              <div className="relative mb-2">
                <input
                  type="text"
                  value={pickerSearchQuery}
                  onChange={(e) => setPickerSearchQuery(e.target.value)}
                  placeholder="ابحث في مواد التدريس..."
                  className="w-full pl-2 pr-7 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-400"
                />
                <Search size={13} className="absolute right-2 top-2.5 text-slate-400" />
              </div>

              <div className="flex flex-col gap-1 max-h-48 overflow-y-auto custom-scrollbar p-0.5">
                {subjectOptions
                  .filter(subj => !pickerSearchQuery.trim() || subj.toLowerCase().includes(pickerSearchQuery.trim().toLowerCase()))
                  .map(subj => {
                    const cellVal = String(activeSheet.data[subjectPicker.r]?.[subjectPicker.c] || '').trim();
                    const isSelected = cellVal === subj;
                    return (
                      <button
                        type="button"
                        key={subj}
                        onClick={() => handleSelectSubjectOption(subjectPicker.r, subjectPicker.c, subj)}
                        className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs font-bold transition-all border cursor-pointer ${
                          isSelected
                            ? 'bg-violet-50 text-violet-900 border-violet-300 shadow-sm ring-1 ring-violet-400'
                            : 'bg-slate-50 hover:bg-violet-50 text-slate-700 hover:text-violet-900 border-slate-100 hover:border-violet-200'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-violet-500" />
                          <span>{subj}</span>
                        </div>
                        {isSelected && <Check size={14} className="text-violet-600" />}
                      </button>
                    );
                  })}
                {subjectOptions.length === 0 && (
                  <div className="text-center py-4 text-xs text-slate-400">
                    لا توجد خيارات حالية
                  </div>
                )}
              </div>

              {/* خيار إدخال مادة يدوية خاص بالمسؤول فقط */}
              {user?.role === 'admin' && (
                <div className="border-t border-slate-200 pt-2 mt-2">
                  <div className="text-[11px] font-bold text-blue-900 mb-1 flex items-center gap-1">
                    <UserCog size={13} className="text-blue-600" />
                    <span>إضافة مادة جديدة (خاص بالمسؤول):</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="text"
                      value={customSubjectInput}
                      onChange={(e) => setCustomSubjectInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && customSubjectInput.trim()) {
                          const newSubj = customSubjectInput.trim();
                          setCustomSubjectOptions(prev => prev.includes(newSubj) ? prev : [...prev, newSubj]);
                          handleSelectSubjectOption(subjectPicker.r, subjectPicker.c, newSubj);
                        }
                      }}
                      placeholder="اكتب اسم المادة..."
                      className="flex-1 px-2 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-400 bg-white"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (customSubjectInput.trim()) {
                          const newSubj = customSubjectInput.trim();
                          setCustomSubjectOptions(prev => prev.includes(newSubj) ? prev : [...prev, newSubj]);
                          handleSelectSubjectOption(subjectPicker.r, subjectPicker.c, newSubj);
                        }
                      }}
                      disabled={!customSubjectInput.trim()}
                      className="px-2.5 py-1.5 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
                    >
                      إضافة
                    </button>
                  </div>
                </div>
              )}

              {activeSheet.data[subjectPicker.r]?.[subjectPicker.c] && (
                <div className="border-t border-slate-100 pt-2 mt-2">
                  <button
                    type="button"
                    onClick={() => handleSelectSubjectOption(subjectPicker.r, subjectPicker.c, "")}
                    className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                  >
                    <Eraser size={13} />
                    <span>مسح القيمة</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* نافذة خيارات البنك المنبثقة مباشرة فوق الخلية */}
        {bankPicker && activeSheet && (
          <div 
            className="fixed inset-0 z-[9999] bg-black/10 backdrop-blur-[0.5px]"
            onClick={(e) => {
              e.stopPropagation();
              setBankPicker(null);
            }}
            onMouseDown={(e) => {
              e.stopPropagation();
            }}
          >
            <div 
              className="fixed bg-white rounded-2xl shadow-2xl border-2 border-amber-500 p-3 min-w-[260px] max-w-[320px] text-right font-sans ring-4 ring-amber-500/10 z-[10000] animate-in fade-in zoom-in-95 duration-100"
              style={{
                top: bankPicker.bottom + 300 > window.innerHeight 
                  ? Math.max(10, bankPicker.top - 300) 
                  : bankPicker.bottom + 4,
                right: Math.max(12, Math.min(window.innerWidth - 290, window.innerWidth - bankPicker.right)),
              }}
              onClick={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-2">
                <div className="flex items-center gap-1.5 text-xs font-black text-slate-800">
                  <Landmark size={15} className="text-amber-600" />
                  <span>اسم البنك</span>
                </div>
                <button 
                  type="button"
                  onClick={() => setBankPicker(null)}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  <X size={14} />
                </button>
              </div>

              {/* بحث سريع داخل البنوك */}
              <div className="relative mb-2">
                <input
                  type="text"
                  value={pickerSearchQuery}
                  onChange={(e) => setPickerSearchQuery(e.target.value)}
                  placeholder="ابحث في البنوك..."
                  className="w-full pl-2 pr-7 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
                <Search size={13} className="absolute right-2 top-2.5 text-slate-400" />
              </div>

              <div className="flex flex-col gap-1 max-h-48 overflow-y-auto custom-scrollbar p-0.5">
                {bankOptions
                  .filter(bank => !pickerSearchQuery.trim() || bank.toLowerCase().includes(pickerSearchQuery.trim().toLowerCase()))
                  .map(bank => {
                    const cellVal = String(activeSheet.data[bankPicker.r]?.[bankPicker.c] || '').trim();
                    const isSelected = cellVal === bank;
                    return (
                      <button
                        type="button"
                        key={bank}
                        onClick={() => handleSelectBankOption(bankPicker.r, bankPicker.c, bank)}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs md:text-sm font-bold transition-all border cursor-pointer ${
                          isSelected
                            ? 'bg-amber-50 text-amber-900 border-amber-300 shadow-sm ring-1 ring-amber-400'
                            : 'bg-slate-50 hover:bg-amber-50 text-slate-700 hover:text-amber-900 border-slate-100 hover:border-amber-200'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <Landmark size={13} className="text-amber-600" />
                          <span>{bank}</span>
                        </div>
                        {isSelected && <Check size={14} className="text-amber-600" />}
                      </button>
                    );
                  })}
              </div>

              {/* خيار إدخال بنك جديد خاص بالمسؤول فقط */}
              {user?.role === 'admin' && (
                <div className="border-t border-slate-200 pt-2.5 mt-2.5">
                  <div className="text-[11px] font-bold text-blue-900 mb-1 flex items-center gap-1">
                    <UserCog size={13} className="text-blue-600" />
                    <span>إضافة اسم بنك جديد (خاص بالمسؤول):</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="text"
                      value={customBankInput}
                      onChange={(e) => setCustomBankInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && customBankInput.trim()) {
                          const newBank = customBankInput.trim();
                          setCustomBankOptions(prev => prev.includes(newBank) ? prev : [...prev, newBank]);
                          handleSelectBankOption(bankPicker.r, bankPicker.c, newBank);
                        }
                      }}
                      placeholder="اكتب اسم البنك الجديد..."
                      className="flex-1 px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (customBankInput.trim()) {
                          const newBank = customBankInput.trim();
                          setCustomBankOptions(prev => prev.includes(newBank) ? prev : [...prev, newBank]);
                          handleSelectBankOption(bankPicker.r, bankPicker.c, newBank);
                        }
                      }}
                      disabled={!customBankInput.trim()}
                      className="px-2.5 py-1.5 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
                    >
                      إضافة
                    </button>
                  </div>
                </div>
              )}

              {activeSheet.data[bankPicker.r]?.[bankPicker.c] && (
                <div className="border-t border-slate-100 pt-2 mt-2">
                  <button
                    type="button"
                    onClick={() => handleSelectBankOption(bankPicker.r, bankPicker.c, "")}
                    className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                  >
                    <Eraser size={13} />
                    <span>مسح القيمة</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* نافذة خيارات الوظيفة المنبثقة مباشرة فوق الخلية */}
        {jobPicker && activeSheet && (
          <div 
            className="fixed inset-0 z-[9999] bg-black/10 backdrop-blur-[0.5px]"
            onClick={(e) => {
              e.stopPropagation();
              setJobPicker(null);
            }}
            onMouseDown={(e) => {
              e.stopPropagation();
            }}
          >
            <div 
              className="fixed bg-white rounded-2xl shadow-2xl border-2 border-indigo-500 p-3 min-w-[260px] max-w-[320px] text-right font-sans ring-4 ring-indigo-500/10 z-[10000] animate-in fade-in zoom-in-95 duration-100"
              style={{
                top: jobPicker.bottom + 300 > window.innerHeight 
                  ? Math.max(10, jobPicker.top - 300) 
                  : jobPicker.bottom + 4,
                right: Math.max(12, Math.min(window.innerWidth - 290, window.innerWidth - jobPicker.right)),
              }}
              onClick={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-2">
                <div className="flex items-center gap-1.5 text-xs font-black text-slate-800">
                  <Briefcase size={15} className="text-indigo-600" />
                  <span>الوظيفة</span>
                </div>
                <button 
                  type="button"
                  onClick={() => setJobPicker(null)}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  <X size={14} />
                </button>
              </div>

              {/* بحث سريع داخل الوظائف */}
              <div className="relative mb-2">
                <input
                  type="text"
                  value={pickerSearchQuery}
                  onChange={(e) => setPickerSearchQuery(e.target.value)}
                  placeholder="ابحث في الوظائف..."
                  className="w-full pl-2 pr-7 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
                <Search size={13} className="absolute right-2 top-2.5 text-slate-400" />
              </div>

              <div className="flex flex-col gap-1 max-h-48 overflow-y-auto custom-scrollbar p-0.5">
                {jobOptions
                  .filter(job => !pickerSearchQuery.trim() || job.toLowerCase().includes(pickerSearchQuery.trim().toLowerCase()))
                  .map(job => {
                    const cellVal = String(activeSheet.data[jobPicker.r]?.[jobPicker.c] || '').trim();
                    const isSelected = cellVal === job;
                    return (
                      <button
                        type="button"
                        key={job}
                        onClick={() => handleSelectJobOption(jobPicker.r, jobPicker.c, job)}
                        className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs font-bold transition-all border cursor-pointer ${
                          isSelected
                            ? 'bg-indigo-50 text-indigo-900 border-indigo-300 shadow-sm ring-1 ring-indigo-400'
                            : 'bg-slate-50 hover:bg-indigo-50 text-slate-700 hover:text-indigo-900 border-slate-100 hover:border-indigo-200'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                          <span>{job}</span>
                        </div>
                        {isSelected && <Check size={14} className="text-indigo-600" />}
                      </button>
                    );
                  })}
              </div>

              {/* حقل إضافة وظيفة جديدة للمسؤول */}
              {user.role === 'admin' && (
                <div className="border-t border-slate-100 pt-2.5 mt-2">
                  <div className="text-[11px] font-bold text-slate-600 mb-1.5">إضافة وظيفة جديدة:</div>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="text"
                      value={customJobInput}
                      onChange={(e) => setCustomJobInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && customJobInput.trim()) {
                          const newJob = customJobInput.trim();
                          setCustomJobOptions(prev => prev.includes(newJob) ? prev : [...prev, newJob]);
                          handleSelectJobOption(jobPicker.r, jobPicker.c, newJob);
                        }
                      }}
                      placeholder="اكتب اسم الوظيفة الجديدة..."
                      className="flex-1 px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (customJobInput.trim()) {
                          const newJob = customJobInput.trim();
                          setCustomJobOptions(prev => prev.includes(newJob) ? prev : [...prev, newJob]);
                          handleSelectJobOption(jobPicker.r, jobPicker.c, newJob);
                        }
                      }}
                      disabled={!customJobInput.trim()}
                      className="px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
                    >
                      إضافة
                    </button>
                  </div>
                </div>
              )}

              {activeSheet.data[jobPicker.r]?.[jobPicker.c] && (
                <div className="border-t border-slate-100 pt-2 mt-2">
                  <button
                    type="button"
                    onClick={() => handleSelectJobOption(jobPicker.r, jobPicker.c, "")}
                    className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                  >
                    <Eraser size={13} />
                    <span>مسح القيمة</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* نافذة خيارات تبعية الموظف المنبثقة مباشرة فوق الخلية */}
        {affiliationPicker && activeSheet && (
          <div 
            className="fixed inset-0 z-[9999] bg-black/10 backdrop-blur-[0.5px]"
            onClick={(e) => {
              e.stopPropagation();
              setAffiliationPicker(null);
            }}
            onMouseDown={(e) => {
              e.stopPropagation();
            }}
          >
            <div 
              className="fixed bg-white rounded-2xl shadow-2xl border-2 border-blue-500 p-3 min-w-[260px] max-w-[300px] text-right font-sans ring-4 ring-blue-500/10 z-[10000] animate-in fade-in zoom-in-95 duration-100"
              style={{
                top: affiliationPicker.bottom + 250 > window.innerHeight 
                  ? Math.max(10, affiliationPicker.top - 250) 
                  : affiliationPicker.bottom + 4,
                right: Math.max(12, Math.min(window.innerWidth - 270, window.innerWidth - affiliationPicker.right)),
              }}
              onClick={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-2">
                <div className="flex items-center gap-1.5 text-xs font-black text-slate-800">
                  <Building2 size={15} className="text-blue-600" />
                  <span>تبعية الموظف</span>
                </div>
                <button 
                  type="button"
                  onClick={() => setAffiliationPicker(null)}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  <X size={14} />
                </button>
              </div>

              <div className="flex flex-col gap-1.5 p-0.5">
                {AFFILIATION_OPTIONS.map(opt => {
                  const cellVal = String(activeSheet.data[affiliationPicker.r]?.[affiliationPicker.c] || '').trim();
                  const isSelected = cellVal === opt;
                  
                  let badgeColors = 'bg-blue-50 hover:bg-blue-100 text-blue-900 border-blue-200';
                  let Icon = Building2;
                  if (opt === 'إداري بنين') {
                    badgeColors = 'bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border-emerald-200';
                    Icon = Users;
                  } else if (opt === 'إداري بنات') {
                    badgeColors = 'bg-rose-50 hover:bg-rose-100 text-rose-900 border-rose-200';
                    Icon = Users;
                  }

                  return (
                    <button
                      type="button"
                      key={opt}
                      onClick={() => handleSelectAffiliationOption(affiliationPicker.r, affiliationPicker.c, opt)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs md:text-sm font-bold transition-all border cursor-pointer ${
                        isSelected
                          ? `${badgeColors} ring-2 ring-blue-500 shadow-sm font-black`
                          : badgeColors
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Icon size={16} />
                        <span>{opt}</span>
                      </div>
                      {isSelected && <Check size={16} className="text-blue-600" />}
                    </button>
                  );
                })}
              </div>

              {activeSheet.data[affiliationPicker.r]?.[affiliationPicker.c] && (
                <div className="border-t border-slate-100 pt-2 mt-2">
                  <button
                    type="button"
                    onClick={() => handleSelectAffiliationOption(affiliationPicker.r, affiliationPicker.c, "")}
                    className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                  >
                    <Eraser size={13} />
                    <span>مسح القيمة</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setLoginError('');
    try {
      
      const data = await loginUser(loginUsername, loginPassword);
      if (data.success) {

        setUser({ username: data.username, role: data.role, complex: data.complex });
        setSelectedCategory(null);
        const initialComplex = data.role === 'admin' ? 'كل المجمعات' : (data.complex || 'دار القلم');
        setComplexName(initialComplex);
        setSavedData({
          complex: initialComplex,
          year: academicYear,
          path: pathName
        });
      } else {
        setLoginError(data.error || 'خطأ في تسجيل الدخول');
      }
    } catch (err) {
      setLoginError('تعذر الاتصال بالخادم');
    } finally {
      setIsLoggingIn(false);
    }
  };

  
  const handleChangeCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    setSettingsMessage({ type: '', text: '' });
    try {
      const data = await updateUser(user!.username, editUsername || undefined, editPassword || undefined, undefined);
      if (data.success) {
        setSettingsMessage({ type: 'success', text: 'تم تحديث البيانات بنجاح، سيتم تسجيل خروجك' });
        setTimeout(() => setUser(null), 2000);
      } else {
        setSettingsMessage({ type: 'error', text: data.error || 'حدث خطأ' });
      }
    } catch (err) {
      setSettingsMessage({ type: 'error', text: 'تعذر الاتصال بالخادم' });
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setSettingsMessage({ type: '', text: '' });
    try {
      const data = await addUser(addUsername, addPassword, 'user', addComplex);
      if (data.success) {
        setSettingsMessage({ type: 'success', text: 'تم إضافة المستخدم بنجاح' });
        setAddUsername('');
        setAddPassword('');
        setAddComplex(COMPLEXES_LIST[0]);
        fetchUsers();
      } else {
        setSettingsMessage({ type: 'error', text: data.error || 'حدث خطأ' });
      }
    } catch (err) {
      setSettingsMessage({ type: 'error', text: 'تعذر الاتصال بالخادم' });
    }
  };

  const fetchUsers = async () => {

    try {
      const data = await getUsers();
      setAllUsers(data);
      } catch (err) {
      console.error('Error fetching users:', err);
    }
  };

  useEffect(() => {
    if (showSettings && settingsTab === 'users' && user?.role === 'admin') {
      fetchUsers();
    }
  }, [showSettings, settingsTab, user]);

  const handleDeleteUser = async (username: string) => {
    if (!window.confirm(`هل أنت متأكد من حذف المستخدم "${username}"؟`)) return;
    try {
      
      const res = await deleteUser(username);
      if (res.success) {
        fetchUsers();
      } else {
        
        alert(res.error || 'حدث خطأ أثناء الحذف');
      }
    } catch (err) {
      alert('تعذر الاتصال بالخادم');
    }
  };

  const handleSaveEditUser = async (oldUsername: string) => {
    try {
      const res = await updateUser(oldUsername, editUserForm.username, editUserForm.password, editUserForm.complex);
      const data = res;
      
      if (res.success) {
        setEditingUsername(null);
        fetchUsers();
      } else {
        
        alert(data.error || 'حدث خطأ');
      }
    } catch (err) {
      alert('تعذر الاتصال بالخادم');
    }
  };

  const togglePasswordVisibility = (username: string) => {
    const newSet = new Set(visiblePasswords);
    if (newSet.has(username)) {
      newSet.delete(username);
    } else {
      newSet.add(username);
    }
    setVisiblePasswords(newSet);
  };

  if (!user) {
    return (
      <div id="login-container" className="min-h-screen flex flex-col justify-center items-center p-4 font-sans dir-rtl text-right relative bg-slate-900/10 backdrop-blur-[1px]" dir="rtl">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/95 backdrop-blur-md p-8 sm:p-10 rounded-[2rem] shadow-2xl w-full max-w-md border border-white/80 flex flex-col items-center relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-blue-500 to-emerald-400"></div>
          
          <img src="/1000099843-removebg-preview.png" alt="التنمية المتكاملة" className="h-32 object-contain mb-8 drop-shadow-sm" />
          <h1 className="text-2xl font-bold text-slate-800 mb-6 text-center">تسجيل الدخول للنظام</h1>
          
          {loginError && (
            <div className="bg-red-50 text-red-600 p-4 rounded-xl w-full mb-6 text-sm border border-red-100 font-medium text-center">
              {loginError}
            </div>
          )}

          <form onSubmit={handleLogin} className="w-full flex flex-col gap-5">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">اسم المستخدم</label>
              <div className="relative">
                <input 
                  type="text" 
                  value={loginUsername}
                  onChange={e => setLoginUsername(e.target.value)}
                  className="w-full pl-4 pr-12 py-3.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 focus:bg-white transition-all text-slate-800 font-medium"
                  placeholder="أدخل اسم المستخدم"
                  required
                />
                <UserSquare2 className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">كلمة المرور</label>
              <div className="relative">
                <input 
                  type={showLoginPassword ? "text" : "password"} 
                  value={loginPassword}
                  onChange={e => setLoginPassword(e.target.value)}
                  className="w-full pl-12 pr-12 py-3.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 focus:bg-white transition-all text-slate-800 font-medium"
                  placeholder="أدخل كلمة المرور"
                  required
                />
                <Briefcase className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <button 
                  type="button"
                  onClick={() => setShowLoginPassword(!showLoginPassword)}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
                >
                  {showLoginPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <button 
              type="submit" 
              disabled={isLoggingIn}
              className="w-full mt-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 px-4 rounded-xl shadow-md hover:shadow-lg active:scale-[0.98] transition-all disabled:opacity-70 flex items-center justify-center gap-2"
            >
              {isLoggingIn ? 'جاري التحقق...' : (
                <>
                  دخول للنظام
                  <ArrowLeft size={20} />
                </>
              )}
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

  return (
    <div id="main-app-container" className="min-h-screen flex flex-col bg-slate-50/80 backdrop-blur-[1.5px] text-slate-800 font-sans p-3 sm:p-6 md:p-12 relative" dir="rtl">
      {/* لوحة الإعدادات */}
      {showSettings && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col">
            <div className="p-4 border-b flex justify-between items-center bg-slate-50">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <UserCog size={20} className="text-blue-600" />
                إعدادات النظام
              </h2>
              <button onClick={() => setShowSettings(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <X size={24} />
              </button>
            </div>
            
            <div className="flex border-b">
              <button 
                onClick={() => setSettingsTab('profile')}
                className={`flex-1 py-3 text-sm font-bold border-b-2 transition-all ${settingsTab === 'profile' ? 'border-blue-500 text-blue-600 bg-blue-50/50' : 'border-transparent text-slate-500 hover:bg-slate-50'}`}
              >
                تغيير بياناتي
              </button>
              {user.role === 'admin' && (
                <button 
                  onClick={() => setSettingsTab('users')}
                  className={`flex-1 py-3 text-sm font-bold border-b-2 transition-all ${settingsTab === 'users' ? 'border-blue-500 text-blue-600 bg-blue-50/50' : 'border-transparent text-slate-500 hover:bg-slate-50'}`}
                >
                  إضافة مستخدم جديد
                </button>
              )}
            </div>

            <div className="p-6">
              {settingsMessage.text && (
                <div className={`p-3 rounded-lg mb-4 text-sm font-bold text-center ${settingsMessage.type === 'success' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-red-50 text-red-600 border border-red-100'}`}>
                  {settingsMessage.text}
                </div>
              )}

              {settingsTab === 'profile' && (
                <form onSubmit={handleChangeCredentials} className="flex flex-col gap-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">اسم المستخدم الجديد</label>
                    <input 
                      type="text" 
                      value={editUsername}
                      onChange={e => setEditUsername(e.target.value)}
                      className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 bg-slate-50 focus:bg-white transition-all text-slate-800"
                      placeholder="اتركه فارغاً إذا لم ترغب بتغييره"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">كلمة المرور الجديدة</label>
                    <input 
                      type="password" 
                      value={editPassword}
                      onChange={e => setEditPassword(e.target.value)}
                      className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 bg-slate-50 focus:bg-white transition-all text-slate-800"
                      placeholder="اتركه فارغاً إذا لم ترغب بتغييرها"
                    />
                  </div>
                  <button type="submit" className="mt-2 w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-all shadow-md active:scale-[0.98]">
                    حفظ التعديلات
                  </button>
                </form>
              )}

              {settingsTab === 'users' && user.role === 'admin' && (
                <div className="flex flex-col gap-6">
                  <form onSubmit={handleAddUser} className="flex flex-col gap-4">
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-1">اسم المستخدم</label>
                      <input 
                        type="text" 
                        value={addUsername}
                        onChange={e => setAddUsername(e.target.value)}
                        className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 bg-slate-50 focus:bg-white transition-all text-slate-800"
                        placeholder="أدخل اسم المستخدم"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-1">كلمة المرور</label>
                      <input 
                        type="password" 
                        value={addPassword}
                        onChange={e => setAddPassword(e.target.value)}
                        className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 bg-slate-50 focus:bg-white transition-all text-slate-800"
                        placeholder="أدخل كلمة المرور"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-1">المجمع التابع له</label>
                      <select 
                        value={addComplex}
                        onChange={e => setAddComplex(e.target.value)}
                        className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 bg-slate-50 focus:bg-white transition-all text-slate-800"
                      >
                        {COMPLEXES_LIST.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    <button type="submit" className="mt-2 w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl transition-all shadow-md active:scale-[0.98]">
                      إضافة المستخدم
                    </button>
                  </form>

                  <hr className="border-slate-200" />

                  <div>
                    <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                      <Users size={18} className="text-blue-600" />
                      قائمة المستخدمين
                    </h3>
                    <div className="flex flex-col gap-3 max-h-60 overflow-y-auto pr-2">
                      {allUsers.map(u => (
                        <div key={u.username} className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl">
                          {editingUsername === u.username ? (
                            <div className="flex-1 flex gap-2">
                              <input 
                                value={editUserForm.username} 
                                onChange={e => setEditUserForm({ ...editUserForm, username: e.target.value })} 
                                className="flex-1 p-2 rounded-lg border border-slate-300 text-sm" 
                                placeholder="الاسم" 
                              />
                              <input 
                                value={editUserForm.password} 
                                onChange={e => setEditUserForm({ ...editUserForm, password: e.target.value })} 
                                className="flex-1 p-2 rounded-lg border border-slate-300 text-sm" 
                                placeholder="كلمة المرور" 
                              />
                              <select
                                value={editUserForm.complex}
                                onChange={e => setEditUserForm({ ...editUserForm, complex: e.target.value })}
                                className="flex-1 p-2 rounded-lg border border-slate-300 text-sm"
                              >
                                {COMPLEXES_LIST.map(c => <option key={c} value={c}>{c}</option>)}
                              </select>
                              <button onClick={() => handleSaveEditUser(u.username)} className="p-2 bg-emerald-100 text-emerald-600 rounded-lg hover:bg-emerald-200">
                                <Check size={16}/>
                              </button>
                              <button onClick={() => setEditingUsername(null)} className="p-2 bg-slate-200 text-slate-600 rounded-lg hover:bg-slate-300">
                                <X size={16}/>
                              </button>
                            </div>
                          ) : (
                            <div className="flex-1 flex items-center justify-between">
                              <div className="flex flex-col">
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-slate-700">{u.username}</span>
                                  {u.role === 'admin' && <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">أدمن</span>}
                                  {u.complex && <span className="text-xs bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">{u.complex}</span>}
                                </div>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className="text-sm font-mono bg-slate-200 px-2 py-0.5 rounded text-slate-600 tracking-wider">
                                    {visiblePasswords.has(u.username) ? u.password : '••••••••'}
                                  </span>
                                  <button onClick={() => togglePasswordVisibility(u.username)} className="text-slate-400 hover:text-slate-600">
                                    {visiblePasswords.has(u.username) ? <EyeOff size={14}/> : <Eye size={14}/>}
                                  </button>
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <button 
                                  onClick={() => { 
                                    setEditingUsername(u.username); 
                                    setEditUserForm({username: u.username, password: u.password, complex: u.complex || COMPLEXES_LIST[0]}); 
                                  }} 
                                  className="p-1.5 text-blue-500 hover:bg-blue-100 rounded-lg transition-colors"
                                  title="تعديل"
                                >
                                  <Edit2 size={16}/>
                                </button>
                                {u.username !== user.username && (
                                  <button 
                                    onClick={() => handleDeleteUser(u.username)} 
                                    className="p-1.5 text-red-500 hover:bg-red-100 rounded-lg transition-colors"
                                    title="حذف"
                                  >
                                    <Trash2 size={16}/>
                                  </button>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                      {allUsers.length === 0 && (
                        <div className="text-center text-slate-500 py-4 text-sm font-medium">
                          لا يوجد مستخدمين آخرين
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto space-y-6 md:space-y-8 flex-1 w-full flex flex-col">
        
        {/* الترويسة والشعارات */}
        <header className="relative w-full flex flex-col gap-4 md:gap-6">
          <div className="w-full flex justify-end">
            <button 
              onClick={() => setShowSettings(true)}
              className="bg-white border border-blue-200 hover:bg-blue-50 text-blue-700 px-4 py-2.5 rounded-xl flex items-center gap-2 shadow-sm transition-all font-bold text-sm"
            >
              <UserCog size={18} />
              الإعدادات
            </button>
            <button 
              onClick={() => {
                setUser(null);
                setSelectedCategory(null);
                setSavedData(null);
                setActiveSheet(null);
              }}
              className="bg-white border border-red-200 hover:bg-red-50 text-red-600 px-4 py-2.5 rounded-xl flex items-center gap-2 shadow-sm transition-all font-bold text-sm mr-2"
            >
              تسجيل الخروج
            </button>
          </div>
          <div className="bg-white border-2 border-blue-500 rounded-2xl md:rounded-3xl px-2 sm:px-6 md:px-10 py-2 shadow-md shadow-blue-900/5 w-full flex flex-row justify-center items-center overflow-hidden relative">
            <div className="flex justify-center items-center min-w-0">
              {user.role === 'admin' ? (
                <img src="/1000099843-removebg-preview.png" alt="التنمية المتكاملة" className="h-16 sm:h-24 md:h-36 lg:h-48 xl:h-[22rem] w-auto object-contain flex-shrink-0 -my-2 sm:-my-4 md:-my-6" />
              ) : (
                <img src={COMPLEX_LOGOS[user.complex || ''] || '/1000099845-removebg-preview.png'} alt={user.complex} className="h-16 sm:h-24 md:h-36 lg:h-48 xl:h-[22rem] w-auto object-contain flex-shrink-0 -my-2 sm:-my-4 md:-my-6" />
              )}
            </div>
          </div>
        </header>

        {/* مساحة العمل */}
        <main className="flex-1 flex flex-col w-full space-y-8">
          
          {/* لوحة الاختيارات (الفلاتر) */}
          <div className="bg-white p-4 md:p-6 rounded-2xl shadow-sm border border-blue-100 flex flex-col md:flex-row items-end gap-4 w-full">
            
            {/* العام الدراسي */}
            <div className="flex-1 w-full">
              <label className="flex items-center gap-2 text-sm font-bold text-blue-900 mb-2">
                <Calendar size={16} className="text-blue-500" />
                العام الدراسي
              </label>
              <select 
                value={academicYear}
                onChange={(e) => setAcademicYear(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all cursor-pointer text-slate-700"
              >
                <option value="2026/2027">2026/2027</option>
                <option value="2027/2028">2027/2028</option>
                <option value="2028/2029">2028/2029</option>
                <option value="2029/2030">2029/2030</option>
              </select>
            </div>

            {/* المسار */}
            <div className="flex-1 w-full">
              <label className="flex items-center gap-2 text-sm font-bold text-blue-900 mb-2">
                <GraduationCap size={16} className="text-blue-500" />
                المسار
              </label>
              <select 
                value={pathName}
                onChange={(e) => setPathName(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all cursor-pointer text-slate-700"
              >
                <option value="كل المسارات">كل المسارات</option>
                <option value="أهلي">أهلي</option>
                <option value="دولي">دولي</option>
                <option value="دبلومة أمريكية">دبلومة أمريكية</option>
                <option value="نون">نون</option>
                <option value="مصري">مصري</option>
                <option value="تربية خاصة">تربية خاصة</option>
                <option value="فرنسي">فرنسي</option>
              </select>
            </div>

            {/* اختيار اسم المجمع */}
            <div className="flex-1 w-full">
              <label className="flex items-center gap-2 text-sm font-bold text-blue-900 mb-2">
                <Building2 size={16} className="text-blue-500" />
                اختيار اسم المجمع
              </label>
              <select 
                value={complexName}
                onChange={(e) => setComplexName(e.target.value)}
                disabled={user.role !== 'admin'}
                className={`w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-slate-700 ${user.role !== 'admin' ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer'}`}
              >
                {user.role === 'admin' && <option value="كل المجمعات">كل المجمعات</option>}
                {COMPLEXES_LIST.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            {/* بيانات (حالة العمل) */}
            <div className="flex-1 w-full">
              <label className="flex items-center gap-2 text-sm font-bold text-blue-900 mb-2">
                <UserSquare2 size={16} className="text-blue-500" />
                بيانات
              </label>
              <select 
                value={dataStatus}
                onChange={(e) => setDataStatus(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all cursor-pointer text-slate-700"
              >
                <option value="الكل">الكل</option>
                <option value="على رأس العمل">على رأس العمل</option>
                <option value="ترك العمل">ترك العمل</option>
              </select>
            </div>

            {/* زر الحفظ */}
            <div className="w-full md:w-auto flex flex-col gap-2">
              <button 
                onClick={handleSave}
                className="w-full flex items-center justify-center gap-2 px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all shadow-md hover:shadow-lg active:scale-95"
              >
                OK
              </button>
              {Object.keys(modifiedSheets).length > 0 && (
                <button 
                  onClick={async () => {
                    try {
                      // جلب الملف الأصلي
                      
      let arrayBuffer = await loadExcelFromFirestore();
      if (!arrayBuffer) {
        const response = await fetch('/data.xlsx');
        arrayBuffer = await response.arrayBuffer();
      }

                      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
                      
                      // استبدال الشيتات المعدلة في الملف الأصلي
                      Object.entries(modifiedSheets).forEach(([title, sheetData]: [string, any]) => {
                        // تحديد اسم الشيت الأصلي
                        const allCards = [...whiteCards, ...blueCards, 
                          { name: 'بيانات الكادر الإداري', sheetName: 'إدارة المجمع' },
                          { name: 'ادارة المجمع', sheetName: 'إدارة المجمع' },
                          { name: 'إدارة المجمع', sheetName: 'إدارة المجمع' },
                          { name: 'بيانات الإداريين', sheetName: 'اداريين دار القلم' },
                          { name: 'بيانات الإداريات', sheetName: 'اداريات دار القلم' },
                          { name: 'بيانات المعلمين', sheetName: 'المعلمين' },
                          { name: 'ترتيب القدرات والتحصيلي', sheetName: 'القدرات والتحصيلي' },
                          { name: 'قدرات', sheetName: 'القدرات والتحصيلي' },
                          { name: 'تحصيلي', sheetName: 'القدرات والتحصيلي' },
                          { name: 'الجميع', sheetName: 'القدرات والتحصيلي' },
                          { name: 'الرخصة المهنية', sheetName: 'الرخصة المهنية' },
                          { name: 'الطلاب والفصول', sheetName: 'إحصاء الطلاب' },
                          { name: 'اسناد المعلمين', sheetName: 'اسناد بنين ف١' },
                          { name: 'اسناد المعلمات', sheetName: 'اسناد البنات ف١' },
                        ];
                        
                        const originalSheetName = allCards.find(c => c.name === title)?.sheetName;
                        if (originalSheetName && workbook.Sheets[originalSheetName]) {
                          // إنشاء شيت جديد بناءً على الداتا المعدلة
                          const newWorksheet = XLSX.utils.aoa_to_sheet(sheetData.data);
                          // استرجاع الدمج
                          newWorksheet['!merges'] = sheetData.merges;
                          // استبدال الشيت في الملف
                          workbook.Sheets[originalSheetName] = newWorksheet;
                        }
                      });
                      
                      // تصدير وتنزيل الملف الجديد
                      XLSX.writeFile(workbook, 'data.xlsx');
                      alert("تم تصدير ملف الإكسيل بنجاح!");
                    } catch (error) {
                      console.error("Export error:", error);
                      alert("حدث خطأ أثناء التصدير.");
                    }
                  }}
                  className="w-full flex items-center justify-center gap-2 px-8 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-all shadow-md hover:shadow-lg active:scale-95"
                >
                  <Save size={18} />
                  تصدير إكسيل
                </button>
              )}
            </div>

          </div>

          {/* منطقة العرض بعد الحفظ (اللوحة الرئيسية) */}
          {savedData && !activeSheet && (
            <motion.div 
              variants={containerVariants}
              initial="hidden"
              animate="show"
              className="flex flex-col w-full mt-4 pb-12"
            >
              
              {/* البيانات المختارة (فوق البطاقات) */}
              <motion.div variants={itemVariants} className="w-full flex flex-col items-center justify-center bg-white rounded-2xl shadow-sm border border-blue-100 p-8 mb-8">
                {savedData.complex === 'كل المجمعات' ? (
                  <img 
                    src="/1000099843-removebg-preview.png" 
                    alt="التنمية المتكاملة" 
                    className="h-28 md:h-44 w-auto object-contain mb-6 drop-shadow-sm" 
                  />
                ) : (
                  <img 
                    src={COMPLEX_LOGOS[savedData.complex] || '/1000099845-removebg-preview.png'} 
                    alt={savedData.complex} 
                    className="h-28 md:h-44 w-auto object-contain mb-6 drop-shadow-sm" 
                  />
                )}
                <h2 className="text-3xl md:text-5xl font-extrabold text-blue-950 mb-4 text-center">
                  {savedData.complex}
                </h2>
                <div className="flex flex-wrap gap-4 items-center justify-center">
                  <div className="inline-flex items-center justify-center bg-blue-100 text-blue-800 px-6 py-2 rounded-full text-lg md:text-xl font-bold shadow-sm border border-blue-200">
                    العام الدراسي: {savedData.year}
                  </div>
                  <div className="inline-flex items-center justify-center bg-emerald-100 text-emerald-800 px-6 py-2 rounded-full text-lg md:text-xl font-bold shadow-sm border border-emerald-200">
                    المسار: {savedData.path}
                  </div>
                </div>
              </motion.div>

              {/* شرط عرض البيانات */}
              {(savedData.complex === 'دار القلم' || (user?.role === 'admin' && savedData.complex === 'كل المجمعات')) && savedData.year === '2026/2027' ? (
                <>
                  {/* أزرار اختيار الفئة (بيانات أو تقارير) */}
                  <div className="flex flex-row justify-center gap-4 md:gap-6 mb-8 w-full max-w-2xl mx-auto">
                    <button
                      onClick={() => setSelectedCategory(prev => prev === 'بيانات' ? null : 'بيانات')}
                      className={`flex-1 py-4 md:py-6 rounded-2xl font-bold text-xl md:text-2xl shadow-md transition-all duration-300 flex flex-col items-center justify-center gap-3 ${
                        selectedCategory === 'بيانات'
                          ? 'bg-blue-600 text-white border-2 border-blue-700 scale-105 shadow-lg'
                          : 'bg-white text-blue-700 border-2 border-slate-200 hover:bg-blue-50 hover:-translate-y-1'
                      }`}
                    >
                      <LayoutGrid size={36} className={selectedCategory === 'بيانات' ? 'animate-bounce' : ''} />
                      بيانات
                    </button>
                    <button
                      onClick={() => setSelectedCategory(prev => prev === 'تقارير' ? null : 'تقارير')}
                      className={`flex-1 py-4 md:py-6 rounded-2xl font-bold text-xl md:text-2xl shadow-md transition-all duration-300 flex flex-col items-center justify-center gap-3 ${
                        selectedCategory === 'تقارير'
                          ? 'bg-blue-600 text-white border-2 border-blue-700 scale-105 shadow-lg'
                          : 'bg-white text-blue-700 border-2 border-slate-200 hover:bg-blue-50 hover:-translate-y-1'
                      }`}
                    >
                      <PieChart size={36} className={selectedCategory === 'تقارير' ? 'animate-bounce' : ''} />
                      تقارير
                    </button>
                  </div>

                  {selectedCategory ? (
                    <div className="w-full max-w-2xl mx-auto mb-6 relative">
                      <input
                        type="text"
                        placeholder={`ابحث في ${selectedCategory === 'بيانات' ? 'بطاقات البيانات' : 'التقارير'}...`}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full px-5 py-4 pl-12 rounded-2xl border-2 border-slate-200 bg-white text-slate-800 focus:outline-none focus:border-blue-500 shadow-sm transition-colors text-right"
                        dir="rtl"
                      />
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={24} />
                    </div>
                  ) : (
                    <div className="text-center py-6 px-4 text-slate-500 font-medium bg-blue-50/60 rounded-2xl border border-blue-100 max-w-xl mx-auto mb-8">
                      <p className="text-base md:text-lg">اضغط على زر <span className="font-bold text-blue-700">«بيانات»</span> أو <span className="font-bold text-blue-700">«تقارير»</span> لعرض البطاقات</p>
                    </div>
                  )}

                  {/* القوائم المربعة - أفقية (البيضاء فوق والزرقاء تحت) */}
                  <div className="flex flex-col gap-6 md:gap-8 w-full mb-12">
                    
                    {/* صف البطاقات البيضاء */}
                    {selectedCategory === 'بيانات' && (
                      <motion.div 
                        variants={containerVariants}
                        initial="hidden"
                        animate="show"
                        className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3 md:gap-4 lg:gap-5 w-full"
                      >
                        {whiteCards.filter(card => card.name.includes(searchQuery)).map((card, idx) => (
                          <motion.button 
                            onClick={() => loadSheetData(card.name, card.sheetName)}
                            variants={itemVariants}
                            key={idx}
                            className="flex flex-col items-center justify-center gap-2 lg:gap-3 p-2 lg:p-4 bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-xl hover:shadow-blue-500/15 hover:border-blue-300 hover:-translate-y-2 hover:scale-[1.02] transition-all duration-300 group aspect-square text-center w-full relative z-10"
                          >
                            <div className="p-2 lg:p-3 bg-slate-50 text-blue-600 rounded-xl lg:rounded-2xl group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300 shadow-inner">
                              <card.icon className="w-7 h-7 lg:w-9 lg:h-9 opacity-90 drop-shadow-sm" />
                            </div>
                            <span className="text-xs lg:text-sm font-bold text-slate-700 leading-snug group-hover:text-blue-700 px-1">
                              {card.name}
                            </span>
                          </motion.button>
                        ))}
                      </motion.div>
                    )}

                    {/* صف البطاقات الزرقاء */}
                    {selectedCategory === 'تقارير' && (
                      <div className="w-full">
                        {activeReportCategory && (
                          <div className="mb-6 flex justify-start">
                            <button
                              onClick={() => setActiveReportCategory(null)}
                              className="flex items-center gap-2 px-4 py-2 bg-white text-slate-700 rounded-xl border border-slate-200 shadow-sm hover:bg-slate-50 transition-colors font-bold group"
                            >
                              <ArrowRight size={20} className="group-hover:-translate-x-1 transition-transform" />
                              <span>رجوع للتقارير الرئيسية</span>
                            </button>
                          </div>
                        )}
                        <motion.div 
                          variants={containerVariants}
                          initial="hidden"
                          animate="show"
                          key={activeReportCategory || 'main'}
                          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3 md:gap-4 lg:gap-5 w-full"
                        >
                          {!activeReportCategory ? (
                            blueCards.filter(card => {
                              if (card.name.includes(searchQuery)) return true;
                              const subCards = reportSubCards[card.name];
                              if (subCards && subCards.some(sub => sub.name.includes(searchQuery))) return true;
                              return false;
                            }).map((card, idx) => (
                              <motion.button 
                                key={idx}
                                onClick={() => {
                                  if (reportSubCards[card.name]) {
                                    setActiveReportCategory(card.name);
                                  } else {
                                    loadSheetData(card.name, card.sheetName);
                                  }
                                }}
                                variants={itemVariants}
                                className={`flex flex-col items-center justify-center gap-2 lg:gap-3 p-2 lg:p-4 ${card.bgClass} rounded-2xl border ${card.borderClass} shadow-md transition-all duration-300 group aspect-square text-center w-full relative z-10 ${card.hoverClass}`}
                              >
                                <div className={`p-2 lg:p-3 bg-white/20 text-white rounded-xl lg:rounded-2xl backdrop-blur-sm group-hover:bg-white ${card.iconHoverText} transition-colors duration-300 shadow-inner`}>
                                  <card.icon className="w-7 h-7 lg:w-9 lg:h-9 opacity-100 drop-shadow-sm" />
                                </div>
                                <span className="text-xs lg:text-sm font-bold text-white leading-snug px-1">
                                  {card.name}
                                </span>
                              </motion.button>
                            ))
                          ) : (
                            reportSubCards[activeReportCategory]?.filter(subCard => subCard.name.includes(searchQuery)).map((subCard, idx) => {
                              const parentCard = blueCards.find(c => c.name === activeReportCategory);
                              const bgClass = parentCard?.bgClass || 'bg-blue-600';
                              const borderClass = parentCard?.borderClass || 'border-blue-700';
                              const hoverClass = parentCard?.hoverClass || 'hover:-translate-y-2';
                              const iconHoverText = parentCard?.iconHoverText || 'group-hover:text-blue-600';

                              return (
                                <motion.button 
                                  key={idx}
                                  onClick={() => loadSheetData(subCard.name, subCard.sheetName)}
                                  variants={itemVariants}
                                  className={`flex flex-col items-center justify-center gap-2 lg:gap-3 p-2 lg:p-4 ${bgClass} rounded-2xl border ${borderClass} shadow-md transition-all duration-300 group aspect-square text-center w-full relative z-10 ${hoverClass}`}
                                >
                                  <div className={`p-2 lg:p-3 bg-white/20 text-white rounded-xl lg:rounded-2xl backdrop-blur-sm group-hover:bg-white ${iconHoverText} transition-colors duration-300 shadow-inner`}>
                                    <subCard.icon className="w-7 h-7 lg:w-9 lg:h-9 opacity-100 drop-shadow-sm" />
                                  </div>
                                  <span className="text-xs lg:text-sm font-bold text-white leading-snug px-1">
                                    {subCard.name}
                                  </span>
                                </motion.button>
                              );
                            })
                          )}
                        </motion.div>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <motion.div variants={itemVariants} className="w-full bg-white rounded-2xl shadow-sm border border-slate-200 p-12 text-center">
                  <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-400">
                    <LayoutGrid size={48} />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-700 mb-2">لا توجد بيانات متاحة</h3>
                  <p className="text-slate-500 text-lg">
                    عذراً، البيانات المتوفرة حالياً مخصصة فقط لـ <strong>مجمع دار القلم</strong> للعام الدراسي <strong>2026/2027</strong>.
                  </p>
                </motion.div>
              )}

            </motion.div>
          )}

          {/* منطقة عرض جدول الإكسيل - شاشة كاملة تأخذ كامل طول وعرض الموقع */}
          {activeSheet && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="fixed inset-0 z-50 bg-slate-100 flex flex-col w-screen h-screen overflow-hidden p-2 sm:p-4 md:p-5 m-0 rounded-none"
            >
              <div className="flex flex-col lg:flex-row justify-between items-center mb-3 gap-3 bg-white p-3.5 md:p-4 rounded-xl border border-slate-200 shadow-sm shrink-0">
                <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl border border-blue-100 shadow-sm">
                      <FileText size={26} />
                    </div>
                    <div>
                      <h2 className="text-xl md:text-2xl font-black text-slate-800 leading-tight">
                        {activeSheet.title}
                      </h2>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs bg-blue-50 text-blue-700 font-bold px-2.5 py-0.5 rounded-full border border-blue-100">
                          {user.complex || complexName}
                        </span>
                        <span className="text-xs bg-emerald-50 text-emerald-700 font-bold px-2.5 py-0.5 rounded-full border border-emerald-100">
                          {academicYear}
                        </span>
                        <span className="text-xs bg-slate-100 text-slate-600 font-bold px-2.5 py-0.5 rounded-full">
                          {activeSheet.data.length} صف × {activeSheet.data[0]?.length || 0} عمود
                        </span>
                      </div>
                    </div>
                  </div>

                  {history.length > 0 && (
                    <button 
                      onClick={handleUndo}
                      className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-all mr-2"
                      title="تراجع عن آخر تعديل"
                    >
                      <Undo2 size={15} />
                      تراجع
                    </button>
                  )}
                </div>

                {/* شريط البحث السريع والتحكم في العرض وأزرار الحفظ والرجوع */}
                <div className="flex flex-wrap items-center justify-between lg:justify-end gap-3 w-full lg:w-auto">
                  {/* بحث في الجدول */}
                  <div className="relative flex-1 sm:w-64 max-w-xs">
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input 
                      type="text"
                      value={sheetSearchQuery}
                      onChange={(e) => setSheetSearchQuery(e.target.value)}
                      placeholder="بحث سريع في بيانات الجدول..."
                      className="w-full pr-9 pl-7 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-slate-800 transition-all"
                    />
                    {sheetSearchQuery && (
                      <button 
                        onClick={() => setSheetSearchQuery('')}
                        className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>

                  {/* Zoom Controls */}
                  <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1 border border-slate-200 shadow-sm">
                    <button 
                      onClick={() => setZoom(prev => Math.min(Number((prev + 0.1).toFixed(1)), 2))} 
                      className="p-1.5 hover:bg-white rounded-lg text-slate-700 transition-colors shadow-sm" 
                      title="تكبير العرض"
                    >
                      <ZoomIn size={16} />
                    </button>
                    <button 
                      onClick={() => setZoom(1)} 
                      className="text-slate-700 text-xs font-bold px-2 py-1 hover:bg-white rounded-lg transition-colors"
                      title="إعادة ضبط الحجم الطبيعي 100%"
                    >
                      {Math.round(zoom * 100)}%
                    </button>
                    <button 
                      onClick={() => setZoom(prev => Math.max(Number((prev - 0.1).toFixed(1)), 0.5))} 
                      className="p-1.5 hover:bg-white rounded-lg text-slate-700 transition-colors shadow-sm" 
                      title="تصغير العرض"
                    >
                      <ZoomOut size={16} />
                    </button>
                  </div>

                  {/* زر تبديل شريط أدوات التنسيق */}
                  <button 
                    onClick={() => {
                      if (selectedCells.size === 0 && activeSheet) {
                        setSelectedCells(new Set(['2,1']));
                      }
                      setIsToolbarCollapsed(prev => !prev);
                    }}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all border shadow-sm ${
                      !isToolbarCollapsed && selectedCells.size > 0
                        ? 'bg-blue-50 text-blue-700 border-blue-200'
                        : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
                    }`}
                    title="إظهار / إخفاء شريط أدوات التنسيق (دمج، ألوان، حدود)"
                  >
                    <Combine size={15} className="text-blue-600" />
                    <span className="hidden sm:inline">أدوات التنسيق</span>
                  </button>

                  <button 
                    onClick={handleSaveToOriginal}
                    className="flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs md:text-sm font-bold shadow-sm hover:shadow-md transition-all"
                  >
                    <Save size={16} />
                    حفظ التعديلات
                  </button>

                  {/* زر الرجوع البارز */}
                  <button 
                    onClick={() => {
                      setActiveSheet(null);
                      setSheetSearchQuery('');
                      setZoom(1);
                    }}
                    className="flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs md:text-sm font-bold shadow-md hover:shadow-lg transition-all"
                  >
                    <span>رجوع للوحة التحكم</span>
                    <ArrowRight size={17} />
                  </button>
                </div>
              </div>

              {/* شريط الأدوات (يظهر عند تحديد خلايا أو عند تفعيله) */}
              {selectedCells.size > 0 && (
                isToolbarCollapsed ? (
                  <div className="w-full flex justify-center -mt-2 -mb-2 z-30 relative pointer-events-auto">
                    <button 
                      onClick={() => setIsToolbarCollapsed(false)} 
                      className="bg-white/95 hover:bg-white text-slate-600 hover:text-blue-600 rounded-full p-1 px-3 shadow-sm border border-slate-200/90 transition-all flex items-center gap-1 cursor-pointer hover:shadow hover:scale-105 active:scale-95" 
                      title="إظهار شريط أدوات التنسيق (دمج، ألوان، حدود)"
                    >
                      <ChevronDown size={14} className="text-blue-600" />
                      <span className="text-[11px] font-bold text-slate-600">أدوات التنسيق ({selectedCells.size})</span>
                    </button>
                  </div>
                ) : (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-slate-800 text-white rounded-xl px-4 py-2.5 mb-2 flex flex-wrap items-center gap-4 shadow-md sticky top-1 z-20 border border-slate-700 shrink-0"
                  >
                    <button 
                      onClick={() => setIsToolbarCollapsed(true)} 
                      className="hover:bg-slate-700 p-1.5 rounded-lg transition-colors text-slate-200 flex items-center justify-center border-l border-slate-600 pl-3 cursor-pointer" 
                      title="إخفاء شريط الأدوات لتوسيع مساحة الرؤية"
                    >
                      <ChevronUp size={18} />
                    </button>
                      <div className="flex items-center gap-2 border-l border-slate-600 pl-4">
                        <span className="text-sm font-bold bg-slate-700 px-2 py-1 rounded-md text-blue-200">{selectedCells.size}</span>
                        <span className="text-sm font-medium">خلايا محددة</span>
                        <button 
                          onClick={() => setSelectedCells(new Set())}
                          className="ml-2 hover:bg-slate-700 p-1 rounded transition-colors"
                          title="إلغاء التحديد"
                        >
                          <X size={16} />
                        </button>
                      </div>

                      <div className="flex items-center gap-2 border-l border-slate-600 pl-4">
                        <button 
                          onClick={handleUndo}
                          disabled={history.length === 0}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors text-sm font-bold ${history.length === 0 ? 'text-slate-500 cursor-not-allowed' : 'hover:bg-slate-700 text-white'}`}
                          title="تراجع"
                        >
                          <Undo2 size={16} />
                          تراجع
                        </button>
                    
                    <div className="relative flex items-center border-menu-container">
                      <button 
                        onClick={() => setShowBorderMenu(!showBorderMenu)}
                        className="flex items-center gap-1.5 hover:bg-slate-700 px-3 py-1.5 rounded-lg transition-colors text-sm font-bold text-slate-200"
                        title="حدود الخلايا"
                      >
                        <LayoutGrid size={16} />
                        حدود
                      </button>
                      {showBorderMenu && (
                        <div className="absolute top-full mt-2 right-0 bg-slate-800 border border-slate-600 rounded-lg p-2 flex flex-col gap-1 shadow-xl z-50 w-36">
                          <button onClick={() => handleBorder('add')} className="px-3 py-2 text-right hover:bg-slate-700 rounded text-slate-200 text-sm font-bold">إضافة حدود</button>
                          <button onClick={() => handleBorder('remove')} className="px-3 py-2 text-right hover:bg-slate-700 rounded text-red-400 text-sm font-bold">إزالة الحدود</button>
                        </div>
                      )}
                    </div>

                    {/* أزرار التنسيق */}
                    <div className="flex items-center gap-1 bg-slate-700/50 rounded-lg p-1">
                      {(() => {
                        let isSelectionBold = false;
                        if (selectedCells.size > 0 && activeSheet) {
                          const firstKey = Array.from(selectedCells)[0] as string;
                          isSelectionBold = !!activeSheet.colors?.[firstKey]?.bold;
                        }
                        return (
                          <button onClick={handleBold} className={`p-1.5 rounded transition-colors ${isSelectionBold ? 'bg-blue-600 text-white shadow-inner' : 'hover:bg-slate-600 text-slate-200'}`} title="عريض (Bold)">
                            <Bold size={16} />
                          </button>
                        );
                      })()}
                      <div className="w-px h-4 bg-slate-600 mx-1"></div>
                      <button onClick={() => handleFontSize(2)} className="p-1.5 hover:bg-slate-600 rounded text-slate-200 flex items-center gap-0.5" title="تكبير الخط">
                        <Type size={16} /><Plus size={12} />
                      </button>
                      <button onClick={() => handleFontSize(-2)} className="p-1.5 hover:bg-slate-600 rounded text-slate-200 flex items-center gap-0.5" title="تصغير الخط">
                        <Type size={16} /><Minus size={12} />
                      </button>
                      <div className="w-px h-4 bg-slate-600 mx-1"></div>
                      <button onClick={() => handleAlign('right')} className="p-1.5 hover:bg-slate-600 rounded text-slate-200" title="محاذاة لليمين">
                        <AlignRight size={16} />
                      </button>
                      <button onClick={() => handleAlign('center')} className="p-1.5 hover:bg-slate-600 rounded text-slate-200" title="محاذاة للوسط">
                        <AlignCenter size={16} />
                      </button>
                      <button onClick={() => handleAlign('left')} className="p-1.5 hover:bg-slate-600 rounded text-slate-200" title="محاذاة لليسار">
                        <AlignLeft size={16} />
                      </button>
                    </div>

                    <button 
                      onClick={clearSelectedContent}
                      className="flex items-center gap-1.5 hover:bg-slate-700 px-3 py-1.5 rounded-lg transition-colors text-sm font-bold text-amber-400"
                      title="مسح المحتوى"
                    >
                      <Eraser size={16} />
                      مسح
                    </button>
                    <label 
                      className="flex items-center gap-1.5 hover:bg-slate-700 px-3 py-1.5 rounded-lg transition-colors text-sm font-bold text-green-400 cursor-pointer"
                      title="إضافة صورة أو شكل"
                    >
                      <ImageIcon size={16} />
                      صورة
                      <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                    </label>
                    <div className="relative flex items-center shapes-menu-container">
                      <button 
                        onClick={() => setShowShapesMenu(!showShapesMenu)}
                        className="flex items-center gap-1.5 hover:bg-slate-700 px-3 py-1.5 rounded-lg transition-colors text-sm font-bold text-pink-400"
                        title="إضافة شكل هندسي"
                      >
                        <Shapes size={16} />
                        أشكال
                      </button>
                      {showShapesMenu && (
                        <div className="absolute top-full mt-2 right-0 bg-slate-800 border border-slate-600 rounded-lg p-2 flex gap-1.5 shadow-xl z-50">
                          <button onClick={() => handleInsertShape('circle')} className="p-1.5 hover:bg-slate-700 rounded text-slate-200" title="دائرة"><Circle size={20} /></button>
                          <button onClick={() => handleInsertShape('square')} className="p-1.5 hover:bg-slate-700 rounded text-slate-200" title="مربع"><Square size={20} /></button>
                          <button onClick={() => handleInsertShape('triangle')} className="p-1.5 hover:bg-slate-700 rounded text-slate-200" title="مثلث"><Triangle size={20} /></button>
                          <button onClick={() => handleInsertShape('star')} className="p-1.5 hover:bg-slate-700 rounded text-slate-200" title="نجمة"><Star size={20} /></button>
                          <button onClick={() => handleInsertShape('arrow-up')} className="p-1.5 hover:bg-slate-700 rounded text-slate-200" title="سهم لأعلى"><ArrowUp size={20} /></button>
                          <button onClick={() => handleInsertShape('arrow-down')} className="p-1.5 hover:bg-slate-700 rounded text-slate-200" title="سهم لأسفل"><ArrowDown size={20} /></button>
                          <button onClick={() => handleInsertShape('arrow-right')} className="p-1.5 hover:bg-slate-700 rounded text-slate-200" title="سهم لليمين"><ArrowRight size={20} /></button>
                          <button onClick={() => handleInsertShape('arrow-left')} className="p-1.5 hover:bg-slate-700 rounded text-slate-200" title="سهم لليسار"><ArrowLeft size={20} /></button>
                          <div className="w-px h-6 bg-slate-600 mx-1 self-center"></div>
                          <button onClick={() => handleInsertShape('')} className="p-1.5 hover:bg-slate-700 rounded text-red-400" title="إزالة الشكل"><Eraser size={20} /></button>
                        </div>
                      )}
                    </div>
                    <button 
                      onClick={deleteSelectedColsStructurally}
                      className="flex items-center gap-1.5 hover:bg-slate-700 px-3 py-1.5 rounded-lg transition-colors text-sm font-bold text-red-400"
                      title="حذف الأعمدة المحددة بالكامل"
                    >
                      <Columns size={16} />
                      حذف أعمدة
                    </button>
                    <button 
                      onClick={deleteSelectedRowsStructurally}
                      className="flex items-center gap-1.5 hover:bg-slate-700 px-3 py-1.5 rounded-lg transition-colors text-sm font-bold text-red-400"
                      title="حذف الصفوف المحددة بالكامل"
                    >
                      <Rows size={16} />
                      حذف صفوف
                    </button>
                    <button 
                      onClick={handleMerge}
                      disabled={selectedCells.size < 2}
                      className="flex items-center gap-1.5 hover:bg-slate-700 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-bold"
                    >
                      <Combine size={16} />
                      دمج
                    </button>
                    <button 
                      onClick={handleUnmerge}
                      disabled={selectedCells.size === 0}
                      className="flex items-center gap-1.5 hover:bg-slate-700 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-bold"
                      title="فك الدمج"
                    >
                      <Split size={16} />
                      فك الدمج
                    </button>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-1 text-sm font-bold text-slate-300">
                        <PaintBucket size={14} /> لون الخلفية
                      </div>
                      <div className="flex gap-1 flex-wrap max-w-[280px] max-h-16 overflow-y-auto custom-scrollbar p-1">
                        {PALETTE.map(c => (
                          <button 
                            key={`bg-${c}`} 
                            onClick={() => handleColor('bg', c)} 
                            className="w-5 h-5 rounded border border-slate-600 hover:scale-110 transition-transform shrink-0" 
                            style={{backgroundColor: c}}
                            title={c}
                          />
                        ))}
                      </div>
                    </div>

                    <div className="flex flex-col gap-1 border-r border-slate-600 pr-4">
                      <div className="flex items-center gap-1 text-sm font-bold text-slate-300">
                        <Type size={14} /> لون النص
                      </div>
                      <div className="flex gap-1 flex-wrap max-w-[280px] max-h-16 overflow-y-auto custom-scrollbar p-1">
                        {PALETTE.map(c => (
                          <button 
                            key={`text-${c}`} 
                            onClick={() => handleColor('text', c)} 
                            className="w-5 h-5 rounded border border-slate-600 hover:scale-110 transition-transform shrink-0" 
                            style={{backgroundColor: c}}
                            title={c}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                  </motion.div>
                )
              )}

              {renderTable()}
            </motion.div>
          )}

        </main>

      </div>

      {/* التذييل */}
      <footer className="mt-12 text-center text-slate-500 text-sm space-y-1 pb-4">
        <p>برمجة وتطوير محمود مصري - أخصائي تكنولوجيا التعليم بمدارس دار القلم</p>
        <p dir="ltr">Created by Mahmoud Masry - Educational Technology Specialist at Dar Al-Qalam Schools</p>
      </footer>
    </div>
  );
}

export default App;
