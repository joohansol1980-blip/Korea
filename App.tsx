import React, { useState, useEffect, useCallback } from 'react';
import { Patient, AppSettings, ViewMode } from './types';
import DeskView from './components/DeskView';
import BoardView from './components/BoardView';
import SettingsModal from './components/SettingsModal';
import { initSupabase, getSupabaseClient, getLocalPatients, saveLocalPatients } from './services/supabaseService';
import { RealtimeChannel } from '@supabase/supabase-js';

const DEFAULT_SETTINGS: AppSettings = {
  supabaseUrl: 'https://lvxusbagwcovuxwfdxld.supabase.co',
  supabaseKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx2eHVzYmFnd2NvdnV4d2ZkeGxkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEwMDUxODYsImV4cCI6MjA4NjU4MTE4Nn0.Q6TgvcxBCK6WQn1x_00XXnYaMPUIZ3-Jv9vja7cRysI',
  geminiApiKey: '',
  useSupabase: true,
};

function App() {
  // --- State ---
  const [patients, setPatients] = useState<Patient[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>(ViewMode.DESK);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isSupabaseConnected, setIsSupabaseConnected] = useState(false);

  // --- Initialization ---
  useEffect(() => {
    // Load Settings
    const savedSettings = localStorage.getItem('app_settings');
    if (savedSettings) {
      const parsed = JSON.parse(savedSettings);
      
      // Auto-fill defaults if missing (Migration for existing users)
      if (!parsed.supabaseUrl) parsed.supabaseUrl = DEFAULT_SETTINGS.supabaseUrl;
      if (!parsed.supabaseKey) parsed.supabaseKey = DEFAULT_SETTINGS.supabaseKey;
      // If we have credentials but useSupabase is undefined, default to true
      if (parsed.useSupabase === undefined) parsed.useSupabase = true;

      setSettings(parsed);
    } else {
      setSettings(DEFAULT_SETTINGS);
    }

    // Load Theme
    if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
    } else {
      setIsDarkMode(false);
      document.documentElement.classList.remove('dark');
    }

    // Load Local Data initially
    setPatients(getLocalPatients());
  }, []);

  // --- Supabase Connection & Subscription ---
  useEffect(() => {
    let channel: RealtimeChannel | null = null;

    const connectSupabase = async () => {
      if (settings.useSupabase && settings.supabaseUrl && settings.supabaseKey) {
        const success = initSupabase(settings.supabaseUrl, settings.supabaseKey);
        setIsSupabaseConnected(success);

        if (success) {
          const supabase = getSupabaseClient();
          if (supabase) {
            // Fetch Initial Data
            const { data, error } = await supabase
              .from('patients')
              .select('*')
              .order('created_at', { ascending: true });
            
            if (!error && data) {
              setPatients(data as Patient[]);
            }

            // Realtime Subscription
            channel = supabase
              .channel('schema-db-changes')
              .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'patients' },
                (payload) => {
                  if (payload.eventType === 'INSERT') {
                    setPatients(prev => [...prev, payload.new as Patient]);
                  } else if (payload.eventType === 'UPDATE') {
                    setPatients(prev => prev.map(p => p.id === payload.new.id ? (payload.new as Patient) : p));
                  } else if (payload.eventType === 'DELETE') {
                     setPatients(prev => prev.filter(p => p.id !== payload.old.id));
                  }
                }
              )
              .subscribe();
          }
        }
      } else {
        setIsSupabaseConnected(false);
        setPatients(getLocalPatients()); // Revert to local if Supabase disabled
      }
    };

    connectSupabase();

    return () => {
      const supabase = getSupabaseClient();
      if (channel && supabase) supabase.removeChannel(channel);
    };
  }, [settings.useSupabase, settings.supabaseUrl, settings.supabaseKey]);

  // --- Handlers ---

  const toggleTheme = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    if (newMode) {
      document.documentElement.classList.add('dark');
      localStorage.theme = 'dark';
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.theme = 'light';
    }
  };

  const handleSaveSettings = (newSettings: AppSettings) => {
    setSettings(newSettings);
    localStorage.setItem('app_settings', JSON.stringify(newSettings));
  };

  const addPatient = async (name: string, treatment: string) => {
    const newPatient: Patient = {
      id: crypto.randomUUID(),
      name,
      treatment,
      status: 'waiting',
      created_at: new Date().toISOString()
    };

    if (isSupabaseConnected) {
      const supabase = getSupabaseClient();
      await supabase?.from('patients').insert([
        { 
          // Assuming Supabase auto-generates IDs if omitted, but sending UUID is fine too if configured
          // For simplicity, we send what we have, but usually 'id' is uuid default gen in DB
          name, 
          treatment, 
          status: 'waiting' 
        }
      ]);
    } else {
      const updated = [...patients, newPatient];
      setPatients(updated);
      saveLocalPatients(updated);
    }
  };

  const updateStatus = async (id: string, status: Patient['status']) => {
    if (status === 'done' && !isSupabaseConnected) {
       // Local mode: Delete on done or just move? Let's delete for simplicity in local
       deletePatient(id);
       return;
    }
    
    if (status === 'done' && isSupabaseConnected) {
        // In DB mode, we might want to delete row or mark as done. Let's delete row to keep board clean.
        const supabase = getSupabaseClient();
        await supabase?.from('patients').delete().eq('id', id);
        return;
    }

    if (isSupabaseConnected) {
      const supabase = getSupabaseClient();
      await supabase?.from('patients').update({ status }).eq('id', id);
    } else {
      const updated = patients.map(p => p.id === id ? { ...p, status } : p);
      setPatients(updated);
      saveLocalPatients(updated);
    }
  };

  const deletePatient = async (id: string) => {
    if (isSupabaseConnected) {
      const supabase = getSupabaseClient();
      await supabase?.from('patients').delete().eq('id', id);
    } else {
      const updated = patients.filter(p => p.id !== id);
      setPatients(updated);
      saveLocalPatients(updated);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-md z-40 sticky top-0 transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
             <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center text-white font-bold text-xl shadow-brand-500/50 shadow-lg">P</div>
             <h1 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white hidden sm:block">PhysioFlow</h1>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
             {/* View Toggles */}
             <div className="bg-gray-100 dark:bg-gray-700 p-1 rounded-lg flex">
                <button
                  onClick={() => setViewMode(ViewMode.DESK)}
                  className={`px-3 py-1.5 rounded-md text-sm font-semibold transition-all ${viewMode === ViewMode.DESK ? 'bg-white dark:bg-gray-600 text-brand-600 dark:text-brand-300 shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900'}`}
                >
                  입력 (Desk)
                </button>
                <button
                  onClick={() => setViewMode(ViewMode.BOARD)}
                  className={`px-3 py-1.5 rounded-md text-sm font-semibold transition-all ${viewMode === ViewMode.BOARD ? 'bg-white dark:bg-gray-600 text-brand-600 dark:text-brand-300 shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900'}`}
                >
                  현황판 (Board)
                </button>
             </div>

             {/* Dark Mode */}
             <button 
              onClick={toggleTheme}
              className="p-2 rounded-full text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
             >
               <span className="material-icons-round">{isDarkMode ? 'light_mode' : 'dark_mode'}</span>
             </button>

             {/* Settings */}
             <button 
              onClick={() => setIsSettingsOpen(true)}
              className="p-2 rounded-full text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors relative"
             >
               <span className="material-icons-round">settings</span>
               {settings.useSupabase && isSupabaseConnected && (
                 <span className="absolute top-2 right-2 w-2 h-2 bg-green-500 rounded-full border border-white dark:border-gray-800"></span>
               )}
             </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative overflow-hidden">
        {/* Background Accents */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
           <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-brand-500/5 rounded-full blur-3xl"></div>
           <div className="absolute top-[20%] -right-[10%] w-[30%] h-[30%] bg-purple-500/5 rounded-full blur-3xl"></div>
        </div>

        {viewMode === ViewMode.DESK ? (
          <div className="pt-8">
            <DeskView 
              patients={patients} 
              onAddPatient={addPatient} 
              onUpdateStatus={updateStatus}
              onDelete={deletePatient}
              geminiApiKey={settings.geminiApiKey}
            />
          </div>
        ) : (
          <BoardView 
            patients={patients} 
            onUpdateStatus={updateStatus} 
          />
        )}
      </main>

      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSave={handleSaveSettings}
      />
    </div>
  );
}

export default App;