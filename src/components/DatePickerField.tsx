import React, { useState, useEffect, useRef } from 'react';
import { Calendar, ChevronRight, ChevronLeft, X, Check } from 'lucide-react';

interface DatePickerFieldProps {
  value: string;
  onChange: (val: string) => void;
  accentColor?: 'blue' | 'indigo';
}

const MONTHS_AR = [
  'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
  'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
];

const DAYS_AR = ['أحد', 'إثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت'];

// سنوات من 1980 حتى 2035
const YEARS = Array.from({ length: 56 }, (_, i) => 1980 + i);

export const DatePickerField: React.FC<DatePickerFieldProps> = ({
  value,
  onChange,
  accentColor = 'blue'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // استخراج السنة والشهر واليوم من القيمة الحالية إن وجدت، أو التاريخ الحالي
  const initialDate = React.useMemo(() => {
    if (value && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
      const [y, m, d] = value.split('-').map(Number);
      return { year: y, month: m - 1, day: d };
    }
    const today = new Date();
    return { year: today.getFullYear(), month: today.getMonth(), day: today.getDate() };
  }, [value]);

  const [viewYear, setViewYear] = useState<number>(initialDate.year);
  const [viewMonth, setViewMonth] = useState<number>(initialDate.month);

  // تحديث العرض عندما تتغير القيمة خارجياً
  useEffect(() => {
    if (value && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
      const [y, m] = value.split('-').map(Number);
      setViewYear(y);
      setViewMonth(m - 1);
    }
  }, [value]);

  // إغلاق التقويم عند النقر خارج العنصر
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // إغلاق عند الضغط على Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // حساب الأيام في الشهر المحدد
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay(); // 0 = الأحد

  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(prev => prev - 1);
    } else {
      setViewMonth(prev => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(prev => prev + 1);
    } else {
      setViewMonth(prev => prev + 1);
    }
  };

  const handleSelectDay = (day: number) => {
    const m = String(viewMonth + 1).padStart(2, '0');
    const d = String(day).padStart(2, '0');
    const formatted = `${viewYear}-${m}-${d}`;
    onChange(formatted);
    setIsOpen(false);
  };

  const handleSelectToday = () => {
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');
    const formatted = `${y}-${m}-${d}`;
    setViewYear(y);
    setViewMonth(today.getMonth());
    onChange(formatted);
    setIsOpen(false);
  };

  const isSelected = (day: number) => {
    if (!value) return false;
    const m = String(viewMonth + 1).padStart(2, '0');
    const d = String(day).padStart(2, '0');
    return value === `${viewYear}-${m}-${d}`;
  };

  const isToday = (day: number) => {
    const today = new Date();
    return (
      today.getFullYear() === viewYear &&
      today.getMonth() === viewMonth &&
      today.getDate() === day
    );
  };

  const isIndigo = accentColor === 'indigo';
  const borderFocusClass = isIndigo 
    ? 'focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-100' 
    : 'focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100';
  const iconColorClass = isIndigo ? 'text-indigo-600' : 'text-blue-600';
  const btnSelectClass = isIndigo 
    ? 'bg-indigo-600 text-white font-bold' 
    : 'bg-blue-600 text-white font-bold';

  return (
    <div ref={containerRef} className="relative w-full" dir="rtl">
      {/* حقل الإدخال المعروض */}
      <div 
        onClick={() => setIsOpen(prev => !prev)}
        className={`flex items-center bg-slate-50 hover:bg-white focus-within:bg-white border border-slate-300 rounded-lg overflow-hidden py-1.5 px-3 transition-all cursor-pointer min-h-[34px] ${borderFocusClass}`}
      >
        <span 
          className={`flex-1 text-xs sm:text-sm font-bold select-none text-right font-mono ${
            value ? 'text-slate-900' : 'text-slate-400'
          }`}
        >
          {value || ''}
        </span>

        <div className="flex items-center gap-1 shrink-0 mr-1.5">
          {value && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onChange('');
              }}
              className="p-0.5 text-slate-400 hover:text-rose-600 rounded transition-colors cursor-pointer"
              title="مسح التاريخ"
            >
              <X size={13} />
            </button>
          )}

          <Calendar size={15} className={`${iconColorClass} pointer-events-none`} />
        </div>
      </div>

      {/* نافذة التقويم المنبثقة التفاعلية */}
      {isOpen && (
        <div 
          className="absolute top-full mt-1.5 right-0 z-50 bg-white rounded-2xl shadow-2xl border border-slate-200 p-3 w-72 sm:w-80 animate-in fade-in zoom-in-95 duration-100 text-slate-800 select-none"
          onClick={(e) => e.stopPropagation()}
        >
          {/* شريط التحكم في الشهر والسنة */}
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-1 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              title="الشهر السابق"
            >
              <ChevronRight size={18} />
            </button>

            <div className="flex items-center gap-1.5">
              {/* اختيار الشهر */}
              <select
                value={viewMonth}
                onChange={(e) => setViewMonth(Number(e.target.value))}
                className="text-xs font-bold text-slate-800 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-md px-1.5 py-1 focus:outline-none cursor-pointer"
              >
                {MONTHS_AR.map((m, idx) => (
                  <option key={m} value={idx}>{m}</option>
                ))}
              </select>

              {/* اختيار السنة */}
              <select
                value={viewYear}
                onChange={(e) => setViewYear(Number(e.target.value))}
                className="text-xs font-bold font-mono text-slate-800 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-md px-1.5 py-1 focus:outline-none cursor-pointer"
              >
                {YEARS.map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={handleNextMonth}
              className="p-1 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              title="الشهر التالي"
            >
              <ChevronLeft size={18} />
            </button>
          </div>

          {/* أسماء أيام الأسبوع */}
          <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-slate-400 mb-1">
            {DAYS_AR.map(d => (
              <span key={d} className="py-0.5">{d}</span>
            ))}
          </div>

          {/* شبكة الأيام */}
          <div className="grid grid-cols-7 gap-1 text-center font-mono text-xs">
            {/* خانات فارغة لأيام الأسبوع قبل بداية الشهر */}
            {Array.from({ length: firstDayOfWeek }).map((_, idx) => (
              <span key={`empty-${idx}`} className="h-7 w-7" />
            ))}

            {/* أيام الشهر */}
            {Array.from({ length: daysInMonth }).map((_, idx) => {
              const day = idx + 1;
              const selected = isSelected(day);
              const today = isToday(day);

              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => handleSelectDay(day)}
                  className={`h-7 w-7 sm:h-8 sm:w-8 mx-auto flex items-center justify-center rounded-lg font-bold transition-all cursor-pointer ${
                    selected
                      ? btnSelectClass + ' shadow-sm scale-105'
                      : today
                      ? 'border border-blue-400 text-blue-600 bg-blue-50/50 hover:bg-blue-100'
                      : 'hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  {day}
                </button>
              );
            })}
          </div>

          {/* أزرار سريعة أسفل التقويم */}
          <div className="flex items-center justify-between pt-2.5 mt-2 border-t border-slate-100 text-xs">
            <button
              type="button"
              onClick={handleSelectToday}
              className={`font-bold flex items-center gap-1 hover:underline cursor-pointer ${iconColorClass}`}
            >
              <Check size={12} />
              <span>اليوم</span>
            </button>

            {value && (
              <button
                type="button"
                onClick={() => {
                  onChange('');
                  setIsOpen(false);
                }}
                className="text-slate-400 hover:text-rose-600 font-bold transition-colors cursor-pointer"
              >
                مسح القيمة
              </button>
            )}

            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-slate-500 hover:text-slate-800 font-bold px-2 py-0.5 rounded hover:bg-slate-100 cursor-pointer"
            >
              إغلاق
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
