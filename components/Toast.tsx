import React from 'react';

interface ToastProps {
  message: string;
  type?: 'info' | 'success' | 'alert';
  isVisible: boolean;
  onClose: () => void;
}

const Toast: React.FC<ToastProps> = ({ message, type = 'info', isVisible, onClose }) => {
  if (!isVisible) return null;

  let bgColor = 'bg-gray-800 dark:bg-gray-100';
  let textColor = 'text-white dark:text-gray-900';
  let icon = 'notifications_active';

  if (type === 'success') {
    bgColor = 'bg-green-600 dark:bg-green-500';
    textColor = 'text-white';
    icon = 'check_circle';
  } else if (type === 'alert') {
    bgColor = 'bg-brand-600 dark:bg-brand-500';
    textColor = 'text-white';
    icon = 'priority_high';
  }

  return (
    <div className="fixed top-16 left-1/2 transform -translate-x-1/2 z-50 animate-slide-down">
      <div className={`${bgColor} ${textColor} px-5 py-2.5 rounded-xl shadow-lg flex items-center gap-2.5 min-w-[240px] justify-center transition-all duration-200`}>
        <span className="material-icons-round text-lg">{icon}</span>
        <span className="font-medium text-sm">{message}</span>
        <button
          onClick={onClose}
          className="ml-1.5 px-2.5 py-0.5 bg-white/20 hover:bg-white/30 rounded-md text-xs font-medium transition-colors"
        >
          확인
        </button>
      </div>
    </div>
  );
};

export default Toast;
