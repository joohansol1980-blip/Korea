import React from 'react';
import { Patient } from '../types';

interface BoardViewProps {
  patients: Patient[];
  onUpdateStatus: (id: string, status: Patient['status']) => Promise<void>;
}

const BoardView: React.FC<BoardViewProps> = ({ patients, onUpdateStatus }) => {
  const waitingPatients = patients.filter(p => p.status === 'waiting');
  const activePatients = patients.filter(p => p.status === 'in-progress');

  return (
    <div className="h-[calc(100vh-80px)] w-full p-4 grid grid-cols-1 lg:grid-cols-2 gap-6 overflow-hidden">
      
      {/* LEFT: Waiting Column */}
      <div className="flex flex-col h-full bg-white dark:bg-gray-800 rounded-3xl shadow-2xl border-l-8 border-red-500 overflow-hidden">
        <div className="p-6 bg-red-50 dark:bg-red-900/20 border-b dark:border-gray-700 flex justify-between items-center">
          <h2 className="text-4xl font-black text-gray-900 dark:text-white tracking-tight">대기 환자</h2>
          <span className="text-3xl font-bold text-red-600 dark:text-red-400 bg-white dark:bg-gray-800 px-4 py-2 rounded-xl shadow-sm">
            {waitingPatients.length}
          </span>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
          {waitingPatients.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-400 opacity-50">
              <span className="material-icons-round text-8xl">hotel_class</span>
              <p className="text-2xl mt-4 font-medium">대기 환자가 없습니다</p>
            </div>
          ) : (
            waitingPatients.map(p => (
              <div 
                key={p.id} 
                onClick={() => onUpdateStatus(p.id, 'in-progress')}
                className="cursor-pointer transform transition-all hover:scale-[1.02] active:scale-[0.98] bg-white dark:bg-gray-700 border-2 border-gray-100 dark:border-gray-600 p-6 rounded-2xl shadow-md flex justify-between items-center group"
              >
                <div className="flex flex-col">
                  <span className="text-5xl font-black text-gray-900 dark:text-white mb-2">{p.name}</span>
                  <span className="text-3xl font-bold text-brand-600 dark:text-blue-400">{p.treatment}</span>
                </div>
                <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-600 flex items-center justify-center group-hover:bg-brand-500 group-hover:text-white transition-colors text-gray-400 dark:text-gray-300">
                   <span className="material-icons-round text-4xl">arrow_forward</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* RIGHT: In Progress Column */}
      <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900/50 rounded-3xl shadow-inner border-l-8 border-green-500 overflow-hidden relative">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5 pointer-events-none"></div>
        <div className="p-6 bg-green-50 dark:bg-green-900/20 border-b dark:border-gray-700 flex justify-between items-center relative z-10">
          <h2 className="text-4xl font-black text-gray-900 dark:text-white tracking-tight">치료 중</h2>
          <span className="text-3xl font-bold text-green-600 dark:text-green-400 bg-white dark:bg-gray-800 px-4 py-2 rounded-xl shadow-sm">
            {activePatients.length}
          </span>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar relative z-10">
           {activePatients.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-400 opacity-50">
              <span className="material-icons-round text-8xl">spa</span>
              <p className="text-2xl mt-4 font-medium">치료 중인 환자가 없습니다</p>
            </div>
          ) : (
            activePatients.map(p => (
              <div 
                key={p.id}
                onClick={() => onUpdateStatus(p.id, 'done')}
                className="cursor-pointer bg-green-600 text-white p-8 rounded-2xl shadow-lg shadow-green-900/20 flex justify-between items-center transform transition-all hover:brightness-110"
              >
                <div className="flex flex-col">
                  <span className="text-5xl font-black mb-2">{p.name}</span>
                  <span className="text-3xl font-medium text-green-100">{p.treatment}</span>
                </div>
                <div className="bg-white/20 p-3 rounded-full animate-pulse">
                   <span className="material-icons-round text-4xl">healing</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

    </div>
  );
};

export default BoardView;