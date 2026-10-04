import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Check, AlertCircle, Settings, Edit3, Search } from 'lucide-react';

export interface OptionManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  options: string[];
  onAddOption: (newOption: string) => void;
  onDeleteOption: (optionToDelete: string) => void;
  onEditOption?: (oldOption: string, newOption: string) => void;
  accentColor?: 'blue' | 'indigo' | 'emerald' | 'teal' | 'violet' | 'amber';
}

export const OptionManagerModal: React.FC<OptionManagerModalProps> = ({
  isOpen,
  onClose,
  title,
  options,
  onAddOption,
  onDeleteOption,
  onEditOption,
  accentColor = 'blue'
}) => {
  const [newOptionText, setNewOptionText] = useState('');
  const [searchFilter, setSearchFilter] = useState('');
  const [editingOption, setEditingOption] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setNewOptionText('');
      setSearchFilter('');
      setEditingOption(null);
      setEditingText('');
      setError(null);
      setSuccess(null);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        if (editingOption) {
          setEditingOption(null);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, editingOption, onClose]);

  if (!isOpen) return null;

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newOptionText.trim();
    if (!trimmed) {
      setError('يرجى كتابة اسم الخيار أولاً');
      return;
    }
    if (options.some(opt => opt.trim().toLowerCase() === trimmed.toLowerCase())) {
      setError('هذا الخيار موجود بالفعل في القائمة');
      return;
    }

    onAddOption(trimmed);
    setNewOptionText('');
    setError(null);
    setSuccess(`تمت إضافة «${trimmed}» بنجاح!`);
    setTimeout(() => setSuccess(null), 2500);
  };

  const handleDelete = (opt: string) => {
    if (options.length <= 1) {
      setError('يجب الإبقاء على خيار واحد على الأقل في القائمة');
      return;
    }
    onDeleteOption(opt);
    setError(null);
    setSuccess(`تم حذف «${opt}» بنجاح`);
    setTimeout(() => setSuccess(null), 2500);
  };

  const handleStartEdit = (opt: string) => {
    setEditingOption(opt);
    setEditingText(opt);
    setError(null);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingOption) return;
    const trimmed = editingText.trim();
    if (!trimmed) {
      setError('لا يمكن أن يكون اسم الخيار فارغاً');
      return;
    }
    if (trimmed !== editingOption && options.some(opt => opt.trim().toLowerCase() === trimmed.toLowerCase())) {
      setError('يوجد خيار آخر بنفس هذا الاسم');
      return;
    }

    if (onEditOption && trimmed !== editingOption) {
      onEditOption(editingOption, trimmed);
      setSuccess(`تم تعديل الخيار إلى «${trimmed}» بنجاح`);
      setTimeout(() => setSuccess(null), 2500);
    }
    setEditingOption(null);
    setEditingText('');
    setError(null);
  };

  // ألوان وتنسيقات ديناميكية حسب نوع الحقل
  const getColorClasses = () => {
    switch (accentColor) {
      case 'indigo':
        return {
          headerBg: 'bg-indigo-50 text-indigo-700 border-indigo-100',
          btnPrimary: 'bg-indigo-600 hover:bg-indigo-700 active:scale-95',
          ring: 'focus:ring-indigo-500'
        };
      case 'emerald':
        return {
          headerBg: 'bg-emerald-50 text-emerald-700 border-emerald-100',
          btnPrimary: 'bg-emerald-600 hover:bg-emerald-700 active:scale-95',
          ring: 'focus:ring-emerald-500'
        };
      case 'teal':
        return {
          headerBg: 'bg-teal-50 text-teal-700 border-teal-100',
          btnPrimary: 'bg-teal-600 hover:bg-teal-700 active:scale-95',
          ring: 'focus:ring-teal-500'
        };
      case 'violet':
        return {
          headerBg: 'bg-violet-50 text-violet-700 border-violet-100',
          btnPrimary: 'bg-violet-600 hover:bg-violet-700 active:scale-95',
          ring: 'focus:ring-violet-500'
        };
      case 'amber':
        return {
          headerBg: 'bg-amber-50 text-amber-700 border-amber-100',
          btnPrimary: 'bg-amber-600 hover:bg-amber-700 active:scale-95',
          ring: 'focus:ring-amber-500'
        };
      default:
        return {
          headerBg: 'bg-blue-50 text-blue-700 border-blue-100',
          btnPrimary: 'bg-blue-600 hover:bg-blue-700 active:scale-95',
          ring: 'focus:ring-blue-500'
        };
    }
  };

  const { headerBg, btnPrimary, ring } = getColorClasses();

  const filteredOptions = searchFilter.trim()
    ? options.filter(opt => opt.toLowerCase().includes(searchFilter.trim().toLowerCase()))
    : options;

  return (
    <div 
      className="fixed inset-0 z-[120] bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150"
      dir="rtl"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-3xl p-5 sm:p-6 max-w-lg w-full shadow-2xl border border-slate-200 space-y-4 animate-in zoom-in-95 duration-150 text-slate-800">
        
        {/* رأس النافذة */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-xl border ${headerBg}`}>
              <Settings size={18} />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900">
                إدارة خيارات: {title}
              </h3>
              <p className="text-[11px] text-slate-500 font-bold">
                إضافة خيارات جديدة أو حذف وتعديل الخيارات الحالية ({options.length} خياراً)
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-all cursor-pointer"
            title="إغلاق (Esc)"
          >
            <X size={18} />
          </button>
        </div>

        {/* رسائل التنبيه والنجاح */}
        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold px-3 py-2 rounded-xl flex items-center gap-1.5 animate-in fade-in">
            <AlertCircle size={14} className="text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold px-3 py-2 rounded-xl flex items-center gap-1.5 animate-in fade-in">
            <Check size={14} className="text-emerald-600 shrink-0" />
            <span>{success}</span>
          </div>
        )}

        {/* نموذج إضافة خيار جديد */}
        <form onSubmit={handleAdd} className="flex items-center gap-2">
          <input
            type="text"
            value={newOptionText}
            onChange={(e) => {
              setNewOptionText(e.target.value);
              if (error) setError(null);
            }}
            placeholder={`اكتب اسم ${title} الجديد لإضافته...`}
            className={`flex-1 py-2 px-3 bg-slate-50 hover:bg-white focus:bg-white border border-slate-300 rounded-xl text-xs sm:text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 ${ring} transition-all`}
          />
          <button
            type="submit"
            className={`flex items-center gap-1 px-4 py-2 ${btnPrimary} text-white font-bold text-xs sm:text-sm rounded-xl shadow-xs transition-all cursor-pointer shrink-0`}
          >
            <Plus size={15} />
            <span>إضافة</span>
          </button>
        </form>

        {/* شريط البحث في الخيارات إذا كانت أكثر من 6 خيارات */}
        {options.length > 6 && (
          <div className="relative">
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="بحث في القائمة..."
              className="w-full py-1.5 pr-8 pl-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 focus:outline-none focus:bg-white focus:border-slate-400 transition-all"
            />
            <Search size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            {searchFilter && (
              <button
                type="button"
                onClick={() => setSearchFilter('')}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X size={12} />
              </button>
            )}
          </div>
        )}

        {/* قائمة الخيارات الحالية مع إمكانية التعديل والحذف */}
        <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
          <div className="text-[11px] font-bold text-slate-500 mb-1 px-1 flex justify-between items-center">
            <span>الخيارات الحالية:</span>
            <span>اضغط القلم للتعديل أو السلة للحذف</span>
          </div>

          {filteredOptions.length === 0 ? (
            <div className="p-4 text-center text-slate-400 text-xs font-bold">
              لا توجد خيارات تطابق "{searchFilter}"
            </div>
          ) : (
            filteredOptions.map((opt) => (
              <div
                key={opt}
                className="flex items-center justify-between p-2.5 bg-slate-50 hover:bg-slate-100/90 rounded-xl border border-slate-200/80 transition-all text-xs font-bold"
              >
                {editingOption === opt ? (
                  <form onSubmit={handleSaveEdit} className="flex-1 flex items-center gap-2">
                    <input
                      type="text"
                      autoFocus
                      value={editingText}
                      onChange={(e) => setEditingText(e.target.value)}
                      className="flex-1 py-1 px-2.5 bg-white border border-blue-400 rounded-lg text-xs font-bold text-slate-900 focus:outline-none ring-2 ring-blue-100"
                    />
                    <button
                      type="submit"
                      className="p-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-all cursor-pointer"
                      title="حفظ التعديل"
                    >
                      <Check size={13} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingOption(null)}
                      className="p-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg transition-all cursor-pointer"
                      title="إلغاء التعديل"
                    >
                      <X size={13} />
                    </button>
                  </form>
                ) : (
                  <>
                    <span className="text-slate-800 break-words flex-1 pr-1">{opt}</span>

                    <div className="flex items-center gap-1 shrink-0">
                      {onEditOption && (
                        <button
                          type="button"
                          onClick={() => handleStartEdit(opt)}
                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                          title={`تعديل اسم "${opt}"`}
                        >
                          <Edit3 size={13} />
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => handleDelete(opt)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        title={`حذف "${opt}"`}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))
          )}
        </div>

        {/* زر الإغلاق والإنهاء */}
        <div className="pt-2 border-t border-slate-100 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer shadow-xs active:scale-[0.99]"
          >
            تم الحفظ وإغلاق
          </button>
        </div>

      </div>
    </div>
  );
};
