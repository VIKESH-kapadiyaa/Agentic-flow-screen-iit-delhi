import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react';
import { useToastStore, type Toast } from '../lib/toastStore';

export const ToastContainer = () => {
  const { toasts, removeToast } = useToastStore();

  return (
    <div className="fixed top-8 right-8 z-[100] flex flex-col gap-3 pointer-events-none">
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
        ))}
      </AnimatePresence>
    </div>
  );
};

const ToastItem = ({ toast, onClose }: { toast: Toast; onClose: () => void }) => {
  const icons = {
    success: <CheckCircle className="text-[#DEF767]" size={18} />,
    error: <XCircle className="text-[#FF6A6A]" size={18} />,
    warning: <AlertCircle className="text-[#FACC15]" size={18} />,
    info: <Info className="text-[#46B1FF]" size={18} />,
  };

  const bgColors = {
    success: 'bg-[#DEF767]/10 border-[#DEF767]/20',
    error: 'bg-[#FF6A6A]/10 border-[#FF6A6A]/20',
    warning: 'bg-[#FACC15]/10 border-[#FACC15]/20',
    info: 'bg-[#46B1FF]/10 border-[#46B1FF]/20',
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 50, scale: 0.9 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
      className={`pointer-events-auto flex items-center gap-4 px-5 py-4 rounded-2xl border backdrop-blur-2xl shadow-2xl min-w-[320px] max-w-[420px] ${bgColors[toast.type]}`}
    >
      <div className="shrink-0">{icons[toast.type]}</div>
      <p className="flex-1 text-sm font-bold text-white leading-tight">
        {toast.message}
      </p>
      <button
        onClick={onClose}
        title="Close notification"
        aria-label="Close notification"
        className="shrink-0 p-1 rounded-lg hover:bg-white/5 text-slate-500 hover:text-white transition-colors"
      >
        <X size={16} />
      </button>
    </motion.div>
  );
};
