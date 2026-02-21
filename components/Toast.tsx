import React, { useEffect } from 'react';

interface ToastProps {
  message: string;
  type?: 'info' | 'success' | 'alert';
  isVisible: boolean;
  onClose: () => void;
}

const Toast: React.FC<ToastProps> = ({ message, type = 'info', isVisible, onClose }) => {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        onClose();
      }, 3000); // 3 seconds
      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose]);

  if (!isVisible) return null;

  let bgColor = 'bg-gray-800 dark:bg-white';
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
    <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 animate-bounce-in">
      <div className={`${bgColor} ${textColor} px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 min-w-[300px] justify-center transition-all duration-300`}>
        <span className="material-icons-round text-xl">{icon}</span>
        <span className="font-bold text-lg">{message}</span>
      </div>
    </div>
  );
};

export default Toast;