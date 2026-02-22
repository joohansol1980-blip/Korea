import { useEffect, useCallback, useRef, useState } from 'react';
import { AppSettings } from '../types';

export const useNotifications = (settings: AppSettings) => {
  const [badgeCount, setBadgeCount] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Request notification permission on mount
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    // Initialize Audio (simple beep)
    try {
      const audioCtx = new AudioContext();
      const buffer = audioCtx.createBuffer(1, audioCtx.sampleRate * 0.3, audioCtx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < buffer.length; i++) {
        data[i] = Math.sin(2 * Math.PI * 880 * (i / audioCtx.sampleRate)) * Math.exp(-3 * i / buffer.length);
      }
      audioRef.current = { audioCtx, buffer } as any;
    } catch (e) {
      console.warn("Audio init failed", e);
    }

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

  const playSound = useCallback(() => {
    try {
      const ref = audioRef.current as any;
      if (ref?.audioCtx && ref?.buffer) {
        const source = ref.audioCtx.createBufferSource();
        source.buffer = ref.buffer;
        source.connect(ref.audioCtx.destination);
        source.start();
      }
    } catch (e) {
      console.warn("Audio play failed", e);
    }
  }, []);

  const triggerNotification = useCallback((message: string, _type: 'info' | 'success' | 'alert' = 'info') => {
    // Only show system notification when window is hidden (minimized/background tab)
    if (document.visibilityState === 'hidden') {
      // 1. Sound
      playSound();

      // 2. System Desktop Notification (stays until user clicks)
      if ('Notification' in window && Notification.permission === 'granted') {
        try {
          const notification = new Notification("PhysioFlow 메모 알림", {
            body: message,
            icon: '/vite.svg',
            requireInteraction: true, // Stays until user clicks
            silent: false,
          });

          // Click notification → focus the app window
          notification.onclick = () => {
            window.focus();
            notification.close();
          };
        } catch (e) {
          console.error("System notification failed", e);
        }
      }

      // 3. Update App Badge
      if ('setAppBadge' in navigator) {
        setBadgeCount(prev => {
          const newCount = prev + 1;
          (navigator as any).setAppBadge(newCount).catch((e: any) => console.log("Badge error", e));
          return newCount;
        });
      }
    }
  }, [playSound]);

  return {
    triggerNotification
  };
};