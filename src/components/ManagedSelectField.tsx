import React from 'react';
import { Plus } from 'lucide-react';

export interface ManagedSelectFieldProps {
  label: string;
  icon?: React.ReactNode;
  required?: boolean;
  value: string;
  onChange: (value: string) => void;
  options: string[];
  onManageOptions: () => void;
  isAdmin?: boolean;
  accentColor?: 'blue' | 'indigo' | 'emerald' | 'teal' | 'violet' | 'amber';
  formatOptionLabel?: (opt: string) => string;
  id?: string;
  dir?: 'rtl' | 'ltr';
  containerClassName?: string;
}

export const ManagedSelectField: React.FC<ManagedSelectFieldProps> = ({
  label,
  icon,
  required = false,
  value,
  onChange,
  options,
  onManageOptions,
  isAdmin = false,
  accentColor = 'blue',
  formatOptionLabel,
  id,
  dir = 'rtl',
  containerClassName = ''
}) => {
  const getBadgeClasses = () => {
    switch (accentColor) {
      case 'indigo':
        return 'text-indigo-700 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200/60';
      case 'emerald':
        return 'text-emerald-700 hover:text-emerald-900 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/60';
      case 'teal':
        return 'text-teal-700 hover:text-teal-900 bg-teal-50 hover:bg-teal-100 border border-teal-200/60';
      case 'violet':
        return 'text-violet-700 hover:text-violet-900 bg-violet-50 hover:bg-violet-100 border border-violet-200/60';
      case 'amber':
        return 'text-amber-800 hover:text-amber-950 bg-amber-50 hover:bg-amber-100 border border-amber-200/60';
      default:
        return 'text-blue-700 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 border border-blue-200/60';
    }
  };

  const getFocusClasses = () => {
    switch (accentColor) {
      case 'indigo':
        return 'focus:ring-indigo-500 focus:border-indigo-500';
      case 'emerald':
        return 'focus:ring-emerald-500 focus:border-emerald-500';
      case 'teal':
        return 'focus:ring-teal-500 focus:border-teal-500';
      case 'violet':
        return 'focus:ring-violet-500 focus:border-violet-500';
      case 'amber':
        return 'focus:ring-amber-500 focus:border-amber-500';
      default:
        return 'focus:ring-blue-500 focus:border-blue-500';
    }
  };

  const badgeClass = getBadgeClasses();
  const focusClass = getFocusClasses();

  return (
    <div className={containerClassName}>
      <label className="flex items-center justify-between text-[11px] sm:text-xs font-bold text-slate-700 mb-0.5">
        <div className="flex items-center gap-1">
          {icon}
          <span>{label}:</span>
          {required && <span className="text-red-500">*</span>}
        </div>
        {isAdmin && (
          <button
            type="button"
            onClick={onManageOptions}
            className={`text-[10px] ${badgeClass} px-1.5 py-0.5 rounded-md font-bold flex items-center gap-0.5 transition-all cursor-pointer`}
            title={`إضافة أو حذف خيارات «${label}»`}
          >
            <Plus size={10} />
            <span>إدارة الخيارات</span>
          </button>
        )}
      </label>

      <select
        id={id}
        dir={dir}
        value={value}
        onChange={(e) => {
          if (e.target.value === '__ADD_NEW__') {
            onManageOptions();
          } else {
            onChange(e.target.value);
          }
        }}
        className={`w-full py-1.5 px-3 bg-slate-50 hover:bg-white focus:bg-white border border-slate-300 rounded-lg text-xs sm:text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 ${focusClass} transition-all cursor-pointer`}
      >
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {formatOptionLabel ? formatOptionLabel(opt) : opt}
          </option>
        ))}
        {isAdmin && (
          <option value="__ADD_NEW__" className="text-blue-700 font-bold bg-blue-50">
            + إدارة / إضافة خيار جديد...
          </option>
        )}
      </select>
    </div>
  );
};
