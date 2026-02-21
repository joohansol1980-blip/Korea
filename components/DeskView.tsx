import React, { useState } from 'react';
import { Patient } from '../types';
import { parseTreatmentText } from '../services/geminiService';

interface DeskViewProps {
  patients: Patient[];
  onAddPatient: (name: string, treatment: string) => Promise<void>;
  onUpdateStatus: (id: string, status: Patient['status']) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  geminiApiKey: string;
}

const DeskView: React.FC<DeskViewProps> = ({ patients, onAddPatient, onUpdateStatus, onDelete, geminiApiKey }) => {
  const [inputText, setInputText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Manual inputs for fallback
  const [manualName, setManualName] = useState('');
  const [manualTreatment, setManualTreatment] = useState('');
  const [showManual, setShowManual] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (showManual) {
      if (!manualName.trim() || !manualTreatment.trim()) return;
      await onAddPatient(manualName, manualTreatment);
      setManualName('');
      setManualTreatment('');
      return;
    }

    if (!inputText.trim()) return;

    setIsProcessing(true);
    try {
      let name = inputText;
      let treatment = "접수/대기"; // Default content if none provided

      // Attempt AI parsing if API key exists
      if (geminiApiKey) {
        const result = await parseTreatmentText(inputText, geminiApiKey);
        if (result) {
          name = result.name;
          treatment = result.treatment;
        } else {
           // Simple fallback splitting if AI fails or returns null
           const parts = inputText.split(' ');
           if (parts.length > 1) {
             name = parts[0];
             treatment = parts.slice(1).join(' ');
           }
        }
      } else {
        // No API Key, simple split logic
        const parts = inputText.split(' ');
        if (parts.length > 1) {
          name = parts[0];
          treatment = parts.slice(1).join(' ');
        }
      }

      await onAddPatient(name, treatment);
      setInputText('');
    } catch (error) {
      console.error("Add failed", error);
      alert("추가 실패. 다시 시도해주세요.");
    } finally {
      setIsProcessing(false);
    }
  };

  const waitingPatients = patients.filter(p => p.status === 'waiting');
  const activePatients = patients.filter(p => p.status === 'in-progress');

  return (
    <div className="max-w-4xl mx-auto w-full p-4 pb-24">
      {/* Input Section */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 mb-8 border border-gray-200 dark:border-gray-700">
        <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <span className="material-icons-round text-brand-500">edit_note</span>
              메모 입력 (Desk)
            </h2>
            <button 
              type="button" 
              onClick={() => setShowManual(!showManual)}
              className="text-xs text-brand-600 hover:text-brand-700 dark:text-brand-400 font-semibold"
            >
              {showManual ? '간편 입력 모드' : '수동 입력 모드'}
            </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {showManual ? (
            <div className="grid grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="이름 (예: 김진표)"
                value={manualName}
                onChange={(e) => setManualName(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 focus:ring-2 focus:ring-brand-500 outline-none"
              />
              <input
                type="text"
                placeholder="내용 (예: 4시로 변경)"
                value={manualTreatment}
                onChange={(e) => setManualTreatment(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 focus:ring-2 focus:ring-brand-500 outline-none"
              />
            </div>
          ) : (
            <div className="relative">
              <input
                type="text"
                placeholder="예: 김진표 충격파, 이지성 5시 변경 (이름과 내용을 띄어쓰기로 입력)"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                disabled={isProcessing}
                className="w-full px-5 py-4 text-lg rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 focus:ring-2 focus:ring-brand-500 outline-none transition-all shadow-inner placeholder-gray-400 dark:placeholder-gray-500"
              />
              {isProcessing && (
                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                   <div className="animate-spin h-5 w-5 border-2 border-brand-500 border-t-transparent rounded-full"></div>
                </div>
              )}
            </div>
          )}
          
          <button
            type="submit"
            disabled={isProcessing || (showManual ? (!manualName || !manualTreatment) : !inputText)}
            className="w-full py-4 bg-blue-400 hover:bg-blue-500 dark:bg-brand-600 dark:hover:bg-brand-700 disabled:bg-gray-300 dark:disabled:bg-gray-700 text-black dark:text-white font-bold text-lg rounded-xl shadow-lg shadow-blue-400/30 dark:shadow-brand-500/30 transition-all active:scale-[0.98]"
          >
            {isProcessing ? '처리 중...' : '메모 전달하기'}
          </button>
        </form>
      </div>

      {/* List Section */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Waiting List */}
        <div className="space-y-4">
          <h3 className="font-bold text-gray-600 dark:text-gray-400 uppercase text-sm tracking-wider flex items-center gap-2 px-1">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-sm"></span>
            대기 환자 / 메모 ({waitingPatients.length})
          </h3>
          {waitingPatients.length === 0 && (
             <p className="text-gray-400 text-sm italic py-4 px-1">대기 중인 메모가 없습니다.</p>
          )}
          <div className="space-y-3">
            {waitingPatients.map(p => (
              <div key={p.id} className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-md border-2 border-gray-300 dark:border-gray-700 flex justify-between items-center group hover:border-brand-400 dark:hover:border-gray-600 transition-colors">
                <div>
                  <div className="text-lg font-bold text-gray-900 dark:text-white">{p.name}</div>
                  <div className="text-brand-700 dark:text-brand-400 font-medium">{p.treatment}</div>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => onUpdateStatus(p.id, 'in-progress')}
                    className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-300 transition-colors border border-blue-100 dark:border-transparent"
                    title="확인 중으로 이동"
                  >
                    <span className="material-icons-round text-xl">play_arrow</span>
                  </button>
                  <button 
                    onClick={() => onDelete(p.id)}
                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    title="삭제"
                  >
                    <span className="material-icons-round text-xl">close</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* In Progress List */}
        <div className="space-y-4">
          <h3 className="font-bold text-gray-600 dark:text-gray-400 uppercase text-sm tracking-wider flex items-center gap-2 px-1">
            <span className="w-2.5 h-2.5 rounded-full bg-green-500 shadow-sm"></span>
            메모 확인 ({activePatients.length})
          </h3>
          {activePatients.length === 0 && (
             <p className="text-gray-400 text-sm italic py-4 px-1">확인 중인 메모가 없습니다.</p>
          )}
          <div className="space-y-3">
            {activePatients.map(p => (
              <div key={p.id} className="bg-green-50 dark:bg-green-900/10 p-4 rounded-xl shadow-sm border-2 border-green-300 dark:border-green-900/30 flex justify-between items-center">
                <div>
                  <div className="text-lg font-bold text-gray-900 dark:text-white">{p.name}</div>
                  <div className="text-green-700 dark:text-green-400 font-medium">{p.treatment}</div>
                </div>
                <div className="flex gap-2">
                  <button 
                      onClick={() => onUpdateStatus(p.id, 'waiting')}
                      className="p-2 text-amber-600 bg-amber-50 hover:bg-amber-100 dark:text-amber-400 dark:bg-amber-900/20 dark:hover:bg-amber-900/30 rounded-lg transition-colors border border-amber-100 dark:border-transparent"
                      title="대기로 되돌리기"
                    >
                      <span className="material-icons-round text-xl">undo</span>
                  </button>
                  <button 
                      onClick={() => onUpdateStatus(p.id, 'done')}
                      className="px-4 py-2 bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-bold text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors"
                    >
                      완료
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeskView;