import React, { useState } from 'react';
import { ArrowLeftRight, Building2, User, Check, X, AlertCircle, FileText, Send } from 'lucide-react';
import { COMPLEXES_LIST } from '../lib/customOptions';
import { TransferRequestRecord, createTransferRequest } from '../lib/api';

interface TransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  employee: {
    id?: string;
    name: string;
    jobNum?: string;
    jobTitle?: string;
    nationalId?: string;
    [key: string]: any;
  } | null;
  employeeType: 'teacher' | 'admin' | 'support';
  currentComplex: string;
  onTransferSuccess: (targetComplex: string, employeeName: string) => void;
}

export const TransferModal: React.FC<TransferModalProps> = ({
  isOpen,
  onClose,
  employee,
  employeeType,
  currentComplex,
  onTransferSuccess
}) => {
  // تصفية المجمعات لاستبعاد المجمع الحالي للموظف
  const availableTargetComplexes = COMPLEXES_LIST.filter(c => c !== currentComplex);
  
  const [targetComplex, setTargetComplex] = useState<string>(availableTargetComplexes[0] || '');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !employee) return null;

  const getTypeName = () => {
    switch (employeeType) {
      case 'teacher': return 'كادر تعليمي (معلم)';
      case 'admin': return 'كادر إداري';
      case 'support': return 'خدمات مساندة';
      default: return 'موظف';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetComplex) {
      setError('يرجى اختيار المجمع المراد النقل إليه');
      return;
    }

    if (targetComplex === currentComplex) {
      setError('لا يمكن النقل إلى نفس المجمع الحالي');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const requestRecord: TransferRequestRecord = {
      employeeId: employee.id || '',
      employeeType,
      employeeName: employee.name,
      jobNum: employee.jobNum || '',
      jobTitle: employee.jobTitle || '',
      nationalId: employee.nationalId || '',
      fromComplex: currentComplex,
      toComplex: targetComplex,
      status: 'pending',
      requestDate: new Date().toISOString(),
      notes: notes.trim() || '',
      fullData: employee
    };

    try {
      // حفظ في فايربيس والحصول على المعرف الحقيقي
      const res = await createTransferRequest(requestRecord);
      const savedId = (res && res.id) ? res.id : ('req_' + Date.now());

      // حفظ نسخة في التخزين المحلي للاسترجاع السريع بمعرف فايربيس الصحيح
      try {
        const rawLocal = localStorage.getItem('transfer_requests_v1');
        const list: TransferRequestRecord[] = rawLocal ? JSON.parse(rawLocal) : [];
        list.push({ ...requestRecord, id: savedId });
        localStorage.setItem('transfer_requests_v1', JSON.stringify(list));
      } catch (locErr) {
        console.warn('Could not save transfer to localStorage:', locErr);
      }

      onTransferSuccess(targetComplex, employee.name);
      onClose();
    } catch (err: any) {
      console.error('Error creating transfer request:', err);
      // في حالة وجود خطأ بالاتصال، نحفظ محلياً أيضاً لضمان استمرارية التجربة
      try {
        const localId = 'req_' + Date.now();
        const rawLocal = localStorage.getItem('transfer_requests_v1');
        const list: TransferRequestRecord[] = rawLocal ? JSON.parse(rawLocal) : [];
        list.push({ ...requestRecord, id: localId });
        localStorage.setItem('transfer_requests_v1', JSON.stringify(list));
        onTransferSuccess(targetComplex, employee.name);
        onClose();
      } catch {
        setError('تعذر إرسال طلب النقل، يرجى المحاولة مرة أخرى');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in" dir="rtl">
      <div className="bg-white rounded-3xl p-5 sm:p-6 max-w-lg w-full shadow-2xl border border-slate-200 space-y-4 animate-in zoom-in-95">
        
        {/* الرأس */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center shadow-inner">
              <ArrowLeftRight size={20} />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-slate-900">
                طلب نقل موظف إلى مجمع آخر
              </h3>
              <p className="text-xs text-slate-500 font-bold">
                {getTypeName()} • {currentComplex}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* بطاقة معلومات الموظف */}
        <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5 space-y-2">
          <div className="flex items-center justify-between text-xs sm:text-sm">
            <span className="text-slate-500 font-bold">اسم الموظف:</span>
            <span className="font-black text-slate-900">{employee.name}</span>
          </div>
          {employee.jobNum && (
            <div className="flex items-center justify-between text-xs sm:text-sm">
              <span className="text-slate-500 font-bold">الرقم الوظيفي:</span>
              <span className="font-bold text-slate-700 font-mono">{employee.jobNum}</span>
            </div>
          )}
          {employee.jobTitle && (
            <div className="flex items-center justify-between text-xs sm:text-sm">
              <span className="text-slate-500 font-bold">المسمى الوظيفي:</span>
              <span className="font-bold text-slate-700">{employee.jobTitle}</span>
            </div>
          )}
          <div className="flex items-center justify-between text-xs sm:text-sm border-t border-slate-200 pt-2">
            <span className="text-slate-500 font-bold">المجمع الحالي:</span>
            <span className="font-black text-blue-700 bg-blue-50 px-2 py-0.5 rounded-lg border border-blue-200">
              {currentComplex}
            </span>
          </div>
        </div>

        {/* تنبيه الخطأ */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs sm:text-sm font-bold text-red-600 flex items-center gap-2">
            <AlertCircle size={16} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* النموذج */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="flex items-center gap-1.5 text-xs sm:text-sm font-bold text-slate-800 mb-1.5">
              <Building2 size={16} className="text-amber-600" />
              <span>اختر المجمع المراد النقل إليه:</span>
              <span className="text-rose-500">*</span>
            </label>
            <select
              value={targetComplex}
              onChange={(e) => setTargetComplex(e.target.value)}
              className="w-full p-2.5 sm:p-3 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all cursor-pointer"
              required
            >
              {availableTargetComplexes.map(comp => (
                <option key={comp} value={comp}>
                  {comp}
                </option>
              ))}
            </select>
            <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
              سيتم إرسال طلب النقل إلى إدارة مجمع <strong className="text-slate-800 font-black">«{targetComplex}»</strong> للموافقة عليه، وسيظل الموظف في مجمعه الحالي حتى تتم الموافقة.
            </p>
          </div>

          <div>
            <label className="flex items-center gap-1.5 text-xs sm:text-sm font-bold text-slate-800 mb-1.5">
              <FileText size={16} className="text-slate-500" />
              <span>ملاحظات أو سبب النقل (اختياري):</span>
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="اكتب أي ملاحظات إضافية بخصوص النقل..."
              rows={2}
              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all resize-none"
            />
          </div>

          {/* أزرار الإجراءات */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold hover:bg-slate-100 transition-all text-xs sm:text-sm cursor-pointer"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 active:scale-95 text-white font-bold transition-all text-xs sm:text-sm cursor-pointer shadow-md shadow-amber-600/25 flex items-center gap-2"
            >
              <Send size={15} />
              <span>{isSubmitting ? 'جاري الإرسال...' : 'إرسال طلب النقل'}</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
