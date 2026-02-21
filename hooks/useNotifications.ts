import { useState, useEffect, useCallback, useRef } from 'react';
import { AppSettings } from '../types';

// Simple "Ding" sound in Base64
const CHIME_SOUND = "data:audio/mp3;base64,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";

export const useNotifications = (settings: AppSettings) => {
  const [notification, setNotification] = useState<{ message: string; type: 'info' | 'success' | 'alert'; isVisible: boolean }>({
    message: '',
    type: 'info',
    isVisible: false,
  });
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [badgeCount, setBadgeCount] = useState(0);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Initialize Audio
    audioRef.current = new Audio(CHIME_SOUND);
    audioRef.current.volume = 0.5;

    // Clear badge on focus
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        setBadgeCount(0);
        if ('clearAppBadge' in navigator) {
          (navigator as any).clearAppBadge().catch((e: any) => console.log("Clear badge error", e));
        }
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleVisibilityChange);
    };
  }, []);

  const triggerNotification = useCallback((message: string, type: 'info' | 'success' | 'alert' = 'info') => {
    // 1. In-App Toast
    setNotification({ message, type, isVisible: true });
    
    // 2. Sound
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(e => console.warn("Audio play blocked", e));
    }

    // 3. System Desktop Notification (Even if minimized)
    if (settings.enableSystemNotifications && 'Notification' in window && Notification.permission === 'granted') {
      try {
         // Create system notification
         new Notification("PhysioFlow 메모 알림", {
           body: message,
           icon: '/vite.svg', 
           tag: 'physioflow-update', 
           silent: true // We play our own sound via Audio API
         });
      } catch (e) {
        console.error("System notification failed", e);
      }
    }

    // 4. Update App Badge (Menu bar / Taskbar count)
    if (document.visibilityState === 'hidden' && 'setAppBadge' in navigator) {
      setBadgeCount(prev => {
        const newCount = prev + 1;
        (navigator as any).setAppBadge(newCount).catch((e: any) => console.log("Badge error", e));
        return newCount;
      });
    }

  }, [settings.enableSystemNotifications]);

  const closeNotification = () => {
    setNotification(prev => ({ ...prev, isVisible: false }));
  };

  return {
    notification,
    triggerNotification,
    closeNotification
  };
};