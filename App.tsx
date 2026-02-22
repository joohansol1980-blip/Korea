import React, { useState } from 'react';
import { ViewMode } from './types';
import DeskView from './components/DeskView';
import BoardView from './components/BoardView';
import SettingsModal from './components/SettingsModal';

// Custom Hooks
import { useSettings } from './hooks/useSettings';
import { useNotifications } from './hooks/useNotifications';
import { usePatients } from './hooks/usePatients';

function App() {
  const [viewMode, setViewMode] = useState<ViewMode>(ViewMode.DESK);

  // Hook: Settings & Theme
  const { 
    settings, 
    isSettingsOpen, 
    setIsSettingsOpen, 
    isDarkMode, 
    toggleTheme, 
    saveSettings 
  } = useSettings();

  // Hook: Notifications (Needs settings for permission check)
  const {
    triggerNotification
  } = useNotifications(settings);

  // Hook: Patients Logic (Needs settings and notifier)
  const { 
    patients, 
    isSupabaseConnected, 
    addPatient, 
    updateStatus, 
    deletePatient 
  } = usePatients(settings, triggerNotification);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-700/50 z-40 sticky top-0 transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
             <div className="w-7 h-7 bg-brand-600 rounded-lg flex items-center justify-center text-white font-bold text-xs shadow-sm">P</div>
             <h1 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white hidden sm:block">PhysioFlow</h1>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
             {/* View Toggles */}
             <div className="bg-gray-100 dark:bg-gray-700 p-1 rounded-lg flex">
                <button
                  onClick={() => setViewMode(ViewMode.DESK)}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${viewMode === ViewMode.DESK ? 'bg-white dark:bg-gray-600 text-brand-600 dark:text-brand-300 shadow-sm ring-1 ring-black/5 dark:ring-white/10' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900'}`}
                >
                  입력 (Desk)
                </button>
                <button
                  onClick={() => setViewMode(ViewMode.BOARD)}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${viewMode === ViewMode.BOARD ? 'bg-white dark:bg-gray-600 text-brand-600 dark:text-brand-300 shadow-sm ring-1 ring-black/5 dark:ring-white/10' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900'}`}
                >
                  현황판 (Board)
                </button>
             </div>

             {/* Reload Button */}
             <button
               onClick={() => window.location.reload()}
               className="p-2 rounded-full text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
               title="새로고침"
             >
               <span className="material-icons-round">refresh</span>
             </button>

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
      <main className="flex-1 flex flex-col overflow-hidden">
        {viewMode === ViewMode.DESK ? (
          <div className="pt-6">
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
        onSave={saveSettings}
      />
    </div>
  );
}

export default App;