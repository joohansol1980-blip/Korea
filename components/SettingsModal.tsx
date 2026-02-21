import React, { useState, useEffect } from 'react';
import { AppSettings } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onSave: (newSettings: AppSettings) => void;
}

const SUPABASE_SQL = `-- 1. 테이블 생성
create table if not exists public.patients (
  id uuid not null default gen_random_uuid(),
  created_at timestamp with time zone not null default now(),
  name text not null,
  treatment text not null,
  status text not null,
  primary key (id)
);

-- 2. Realtime 활성화
alter publication supabase_realtime add table public.patients;

-- 3. RLS 정책 설정 (누구나 접근 가능)
alter table public.patients enable row level security;

create policy "Enable all access for anon"
on public.patients for all
using (true)
with check (true);`;

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, settings, onSave }) => {
  const [formData, setFormData] = useState<AppSettings>(settings);
  const [showSql, setShowSql] = useState(false);
  const [copySuccess, setCopySuccess] = useState('');

  useEffect(() => {
    setFormData(settings);
  }, [settings]);

  if (!isOpen) return null;

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    
    // Special handling for System Notifications to request permission
    if (name === 'enableSystemNotifications' && checked) {
      if (!('Notification' in window)) {
        alert("이 브라우저는 데스크탑 알림을 지원하지 않습니다.");
        return;
      }

      if (Notification.permission !== 'granted') {
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
          alert("알림 권한이 거부되었습니다. 브라우저 설정에서 알림을 허용해주세요.");
          return; // Do not toggle checkbox
        }
      }
    }

    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSave = () => {
    onSave(formData);
    onClose();
  };

  const handleCopySql = () => {
    navigator.clipboard.writeText(SUPABASE_SQL).then(() => {
        setCopySuccess('복사 완료!');
        setTimeout(() => setCopySuccess(''), 2000);
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-6 border-b dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">시스템 설정 (Settings)</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            데이터베이스, 알림 및 AI 설정을 관리합니다.
          </p>
        </div>
        
        <div className="p-6 overflow-y-auto space-y-6">
          
          {/* System Notifications Config */}
          <div>
             <div className="flex items-center justify-between">
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    데스크탑 시스템 알림
                    </label>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                    창이 최소화되어 있어도 OS 알림을 받습니다.
                    </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    name="enableSystemNotifications"
                    checked={formData.enableSystemNotifications} 
                    onChange={handleChange}
                    className="sr-only peer" 
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-600"></div>
                </label>
             </div>
          </div>

          <hr className="dark:border-gray-700"/>

          {/* Gemini Config */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Google Gemini API Key
            </label>
            <input
              type="password"
              name="geminiApiKey"
              value={formData.geminiApiKey}
              onChange={handleChange}
              placeholder="AI-..."
              className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 outline-none transition-all"
            />
            <p className="text-xs text-gray-500 mt-1">
              입력 텍스트 자동 파싱을 위해 필요합니다 (예: "김진표 충격파" 자동 분리).
            </p>
          </div>

          <hr className="dark:border-gray-700"/>

          {/* Supabase Config */}
          <div>
             <div className="flex items-center justify-between mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Supabase Database (실시간)
                </label>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    name="useSupabase"
                    checked={formData.useSupabase} 
                    onChange={handleChange}
                    className="sr-only peer" 
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-600"></div>
                </label>
             </div>

             {formData.useSupabase && (
               <div className="space-y-4 animate-fadeIn">
                 <div>
                    <label className="block text-xs uppercase text-gray-500 font-bold mb-1">Project URL</label>
                    <input
                      type="text"
                      name="supabaseUrl"
                      value={formData.supabaseUrl}
                      onChange={handleChange}
                      placeholder="https://xyz.supabase.co"
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 outline-none"
                    />
                 </div>
                 <div>
                    <label className="block text-xs uppercase text-gray-500 font-bold mb-1">Anon / Public Key</label>
                    <input
                      type="password"
                      name="supabaseKey"
                      value={formData.supabaseKey}
                      onChange={handleChange}
                      placeholder="eyJhbGciOiJIUzI1NiIsInR..."
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 outline-none"
                    />
                 </div>
                 <div className="bg-yellow-50 dark:bg-yellow-900/30 p-3 rounded text-xs text-yellow-800 dark:text-yellow-200">
                    Supabase 테이블 이름은 <code>patients</code>여야 하며 RLS 설정이 되어 있어야 합니다.
                 </div>

                 {/* SQL Helper Section */}
                 <div className="pt-2">
                    <button 
                        type="button" 
                        onClick={() => setShowSql(!showSql)}
                        className="text-sm font-semibold text-brand-600 dark:text-brand-400 hover:text-brand-700 flex items-center gap-1"
                    >
                        <span className="material-icons-round text-lg">data_object</span>
                        테이블 생성 SQL 보기 {showSql ? '▲' : '▼'}
                    </button>
                    
                    {showSql && (
                        <div className="mt-2 bg-gray-900 rounded-lg p-3 relative">
                            <button
                                onClick={handleCopySql}
                                className="absolute top-2 right-2 px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded text-xs text-white transition-colors z-10"
                            >
                                {copySuccess || 'SQL 복사'}
                            </button>
                            <pre className="text-[10px] sm:text-xs text-green-400 font-mono overflow-x-auto p-1 leading-relaxed whitespace-pre-wrap break-all">
                                {SUPABASE_SQL}
                            </pre>
                            <p className="text-[10px] text-gray-400 mt-2 border-t border-gray-800 pt-1">
                                Supabase 대시보드 → SQL Editor에 붙여넣고 Run 버튼을 누르세요.
                            </p>
                        </div>
                    )}
                 </div>
               </div>
             )}
          </div>
        </div>

        <div className="p-4 bg-gray-50 dark:bg-gray-900/50 border-t dark:border-gray-700 flex justify-end gap-3">
          <button 
            onClick={onClose}
            className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            취소
          </button>
          <button 
            onClick={handleSave}
            className="px-6 py-2 bg-brand-600 hover:bg-brand-700 text-white font-medium rounded-lg shadow-lg shadow-brand-500/30 transition-all active:scale-95"
          >
            설정 저장
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;