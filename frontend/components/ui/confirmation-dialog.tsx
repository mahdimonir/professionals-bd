'use client';

import { AlertTriangle, X } from 'lucide-react';
import { useEffect, useState } from 'react';

interface ConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  type?: 'danger' | 'warning' | 'info';
  confirmText?: string;
  cancelText?: string;
}

export default function ConfirmationDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  type = 'danger',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
}: ConfirmationDialogProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      document.body.style.overflow = 'hidden';
    } else {
      setIsVisible(false);
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen && !isVisible) return null;

  const getTypeStyles = () => {
    switch (type) {
      case 'danger':
        return {
          iconBg: 'bg-red-50 dark:bg-red-500/10',
          iconColor: 'text-red-500',
          buttonBg: 'bg-red-500 hover:bg-red-600',
          borderColor: 'border-red-200 dark:border-red-900',
        };
      case 'warning':
        return {
          iconBg: 'bg-amber-50 dark:bg-amber-500/10',
          iconColor: 'text-amber-500',
          buttonBg: 'bg-amber-500 hover:bg-amber-600',
          borderColor: 'border-amber-200 dark:border-amber-900',
        };
      default:
        return {
          iconBg: 'bg-blue-50 dark:bg-blue-500/10',
          iconColor: 'text-blue-500',
          buttonBg: 'bg-blue-500 hover:bg-blue-600',
          borderColor: 'border-blue-200 dark:border-blue-900',
        };
    }
  };

  const styles = getTypeStyles();

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-200 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />

      {/* Dialog */}
      <div className={`relative w-full max-w-sm bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden transition-all duration-300 transform ${isOpen ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4'}`}>
        <div className="p-8 text-center space-y-6">
          {/* Icon */}
          <div className={`w-16 h-16 mx-auto rounded-2xl ${styles.iconBg} flex items-center justify-center border ${styles.borderColor}`}>
            <AlertTriangle className={`w-8 h-8 ${styles.iconColor}`} />
          </div>

          <div className="space-y-2">
            <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
              {title}
            </h3>
            <p className="text-slate-500 dark:text-slate-400 font-medium text-sm leading-relaxed">
              {message}
            </p>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={onClose}
              className="flex-1 px-6 py-4 rounded-xl font-bold text-xs uppercase tracking-widest text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            >
              {cancelText}
            </button>
            <button
              onClick={() => {
                onConfirm();
                onClose();
              }}
              className={`flex-1 px-6 py-4 rounded-xl font-bold text-xs uppercase tracking-widest text-white transition-all shadow-lg active:scale-95 ${styles.buttonBg}`}
            >
              {confirmText}
            </button>
          </div>
        </div>

        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
