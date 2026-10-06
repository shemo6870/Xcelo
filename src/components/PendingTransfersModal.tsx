import React, { useState } from 'react';
import { 
  Bell, Check, X, Building2, User, 
  ArrowLeftRight, Calendar, AlertCircle, FileText, CheckCircle2, XCircle
} from 'lucide-react';
import { TransferRequestRecord } from '../lib/api';

interface PendingTransfersModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentComplex: string;
  isAdmin: boolean;
  pendingRequests: TransferRequestRecord[];
  onApprove: (request: TransferRequestRecord) => Promise<void>;
  onReject: (request: TransferRequestRecord) => Promise<void>;
}

export const PendingTransfersModal: React.FC<PendingTransfersModalProps> = ({
  isOpen,
  onClose,
  currentComplex,
  isAdmin,
  pendingRequests,
  onApprove,
  onReject
}) => {
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  if (!isOpen) return null;

  const getTypeName = (type: string) => {
    switch (type) {
      case 'teacher': return 'الكادر التعليمي (معلم)';
      case 'admin': return 'الكادر الإداري';
      case 'support': return 'الخدمات المساندة';
      default: return 'موظف';
    }
  };

  const handleApprove = async (req: TransferRequestRecord) => {
    setProcessingId(req.id || req.employeeName);
    setActionMessage(null);
    try {
      await onApprove(req);
      setActionMessage({
        type: 'success',
        text: `تمت الموافقة بنجاح ونقل الموظف (${req.employeeName}) إلى مجمع (${req.toComplex}).`
      });
      setTimeout(() => setActionMessage(null), 4000);
    } catch (e) {
      setActionMessage({
        type: 'error',
        text: 'حدث خطأ أثناء معالجة الطلب، يرجى المحاولة مرة أخرى.'
      });
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (req: TransferRequestRecord) => {
    setProcessingId(req.id || req.employeeName);
    setActionMessage(null);
    try {
      await onReject(req);
      setActionMessage({
        type: 'success',
        text: `تم رفض طلب النقل وظل الموظف (${req.employeeName}) في مجمعه السابق (${req.fromComplex}).`
      });
      setTimeout(() => setActionMessage(null), 4000);
    } catch (e) {
      setActionMessage({
        type: 'error',
        text: 'حدث خطأ أثناء رفض الطلب.'
      });
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in" dir="rtl">
      <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95">
        
        {/* شريط العنوان */}
        <div className="bg-white border-b border-slate-200 px-5 sm:px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="relative p-2.5 bg-amber-50 text-amber-600 rounded-2xl border border-amber-200 shadow-inner">
              <Bell size={22} />
              {pendingRequests.length > 0 && (
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-rose-500 rounded-full border-2 border-white" />
              )}
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
                <span>طلبات النقل المعلقة</span>
                <span className="text-xs bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-full border border-amber-200">
                  {pendingRequests.length} طلب
                </span>
              </h2>
              <p className="text-xs text-slate-500 font-bold">
                {isAdmin ? 'عرض كافة طلبات النقل الواردة للمجمعات' : `الطلبات الواردة إلى مجمع: ${currentComplex}`}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* تنبيه الإجراء */}
        {actionMessage && (
          <div className={`mx-5 sm:mx-6 mt-4 p-3 rounded-xl border text-xs sm:text-sm font-bold flex items-center gap-2 animate-in fade-in ${
            actionMessage.type === 'success' 
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
              : 'bg-rose-50 text-rose-800 border-rose-200'
          }`}>
            {actionMessage.type === 'success' ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
            <span>{actionMessage.text}</span>
          </div>
        )}

        {/* محتوى القائمة */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4">
          {pendingRequests.length === 0 ? (
            <div className="p-8 sm:p-12 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 space-y-3">
              <div className="w-14 h-14 bg-amber-50 text-amber-500 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 size={28} />
              </div>
              <h3 className="text-base font-bold text-slate-800">
                لا توجد طلبات نقل معلقة
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto leading-relaxed">
                كافة طلبات النقل تمت معالجتها، أو لم يتم إرسال طلبات نقل جديدة إلى هذا المجمع حالياً.
              </p>
            </div>
          ) : (
            pendingRequests.map(req => {
              const isBusy = processingId === (req.id || req.employeeName);
              return (
                <div 
                  key={req.id || `${req.employeeName}_${req.requestDate}`}
                  className="bg-white border-2 border-slate-200 hover:border-amber-300 rounded-2xl p-4 sm:p-5 shadow-xs hover:shadow-md transition-all space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-base font-black text-slate-900">{req.employeeName}</span>
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                          {getTypeName(req.employeeType)}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-slate-500 font-bold">
                        {req.jobTitle && <span>المسمى: {req.jobTitle}</span>}
                        {req.jobNum && <span>• الرقم الوظيفي: {req.jobNum}</span>}
                        {req.requestDate && (
                          <span>• التاريخ: {new Date(req.requestDate).toLocaleDateString('ar-SA')}</span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 self-start sm:self-auto bg-amber-50 px-2.5 py-1 rounded-xl border border-amber-200 text-xs font-bold text-amber-800">
                      <ArrowLeftRight size={13} />
                      <span>طلب نقل وارد</span>
                    </div>
                  </div>

                  {/* مسار النقل */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-xs">
                    <div>
                      <span className="text-slate-500 font-bold ml-1">من مجمع:</span>
                      <span className="font-black text-slate-800">{req.fromComplex}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 font-bold ml-1">إلى مجمع:</span>
                      <span className="font-black text-emerald-700">{req.toComplex}</span>
                    </div>
                  </div>

                  {/* ملاحظات إن وجدت */}
                  {req.notes && (
                    <div className="text-xs bg-slate-50/80 p-2.5 rounded-xl border border-slate-200 text-slate-600">
                      <strong className="text-slate-700">ملاحظات:</strong> {req.notes}
                    </div>
                  )}

                  {/* أزرار الإجراءات: موافقة أو رفض */}
                  <div className="flex items-center justify-end gap-2.5 pt-2">
                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() => handleReject(req)}
                      className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-rose-50 hover:text-rose-700 text-slate-700 font-bold text-xs sm:text-sm border border-slate-200 hover:border-rose-200 transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                    >
                      <X size={15} />
                      <span>{isBusy ? 'جاري المعالجة...' : 'رفض النقل (البقاء في مجمعه)'}</span>
                    </button>

                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() => handleApprove(req)}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs sm:text-sm shadow-sm transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                    >
                      <Check size={15} />
                      <span>{isBusy ? 'جاري المعالجة...' : 'موافقة على النقل'}</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* أسفل النافذة */}
        <div className="bg-slate-50 border-t border-slate-200 px-5 sm:px-6 py-3 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-white border border-slate-300 text-slate-700 font-bold hover:bg-slate-100 transition-all text-xs sm:text-sm cursor-pointer"
          >
            إغلاق
          </button>
        </div>

      </div>
    </div>
  );
};
