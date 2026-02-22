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
    <div className="h-[calc(100vh-72px)] w-full p-4 grid grid-cols-1 lg:grid-cols-2 gap-4 overflow-hidden">

      {/* LEFT: Waiting Column */}
      <div className="flex flex-col h-full bg-white dark:bg-gray-800 rounded-2xl shadow-lg ring-1 ring-gray-200 dark:ring-gray-700 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
          <div className="flex items-center gap-2.5">
            <div className="w-1.5 h-6 rounded-full bg-red-500"></div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">대기 메모</h2>
          </div>
          <span className="text-base font-semibold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-2.5 py-1 rounded-lg">
            {waitingPatients.length}
          </span>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-2.5 no-scrollbar">
          {waitingPatients.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-300 dark:text-gray-600">
              <span className="material-icons-round text-5xl">edit_note</span>
              <p className="text-base mt-2 font-medium">대기 중인 메모가 없습니다</p>
            </div>
          ) : (
            waitingPatients.map(p => (
              <div
                key={p.id}
                onClick={() => onUpdateStatus(p.id, 'in-progress')}
                className="cursor-pointer transition-all hover:bg-gray-50 dark:hover:bg-gray-700/50 active:scale-[0.98] bg-white dark:bg-gray-700/30 ring-1 ring-gray-100 dark:ring-gray-600 p-4 rounded-xl flex justify-between items-center group"
              >
                <div className="flex flex-col min-w-0">
                  <span className="text-2xl font-bold text-gray-900 dark:text-white mb-0.5 truncate">{p.name}</span>
                  <span className="text-lg font-medium text-brand-600 dark:text-brand-400 truncate">{p.treatment}</span>
                </div>
                <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-600 flex items-center justify-center group-hover:bg-brand-500 group-hover:text-white transition-colors text-gray-400 dark:text-gray-300 ml-3 flex-shrink-0">
                   <span className="material-icons-round text-xl">arrow_forward</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* RIGHT: In Progress Column */}
      <div className="flex flex-col h-full bg-white dark:bg-gray-800 rounded-2xl shadow-lg ring-1 ring-gray-200 dark:ring-gray-700 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
          <div className="flex items-center gap-2.5">
            <div className="w-1.5 h-6 rounded-full bg-green-500"></div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">메모 확인</h2>
          </div>
          <span className="text-base font-semibold text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-2.5 py-1 rounded-lg">
            {activePatients.length}
          </span>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-2.5 no-scrollbar">
           {activePatients.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-300 dark:text-gray-600">
              <span className="material-icons-round text-5xl">check_circle_outline</span>
              <p className="text-base mt-2 font-medium">확인 중인 메모가 없습니다</p>
            </div>
          ) : (
            activePatients.map(p => (
              <div
                key={p.id}
                className="bg-green-600 text-white p-4 rounded-xl shadow-md flex justify-between items-center"
              >
                {/* Content - Click to Complete */}
                <div
                  onClick={() => onUpdateStatus(p.id, 'done')}
                  className="flex-1 cursor-pointer hover:opacity-90 transition-opacity min-w-0"
                >
                  <div className="flex flex-col">
                    <span className="text-2xl font-bold mb-0.5 truncate">{p.name}</span>
                    <span className="text-lg font-medium text-green-100 truncate">{p.treatment}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 ml-3 flex-shrink-0">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onUpdateStatus(p.id, 'waiting');
                    }}
                    className="p-2 rounded-lg bg-white/15 hover:bg-white/25 text-white/80 hover:text-white transition-colors"
                    title="대기로 되돌리기"
                  >
                    <span className="material-icons-round text-xl">undo</span>
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onUpdateStatus(p.id, 'done');
                    }}
                    className="p-2 rounded-lg bg-white/15 hover:bg-white/25 text-white transition-colors"
                    title="완료 처리"
                  >
                     <span className="material-icons-round text-xl">done_all</span>
                  </button>
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
