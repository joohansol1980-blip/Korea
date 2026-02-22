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

// Parse input text with number+name support
// Examples: "3333 김진료 도수대기" → name: "3333 김진료", treatment: "도수대기"
//           "2343/주한솔 충격파 대기" → name: "2343/주한솔", treatment: "충격파 대기"
//           "김진표 충격파" → name: "김진표", treatment: "충격파"
const parseInputText = (text: string): { name: string; treatment: string } => {
  const trimmed = text.trim();

  // Check if starts with number (e.g., "3333 김진료 도수대기" or "2343/주한솔 충격파")
  const numberPrefixMatch = trimmed.match(/^(\d+[\s/]?\S+)\s+(.+)$/);
  if (numberPrefixMatch) {
    return { name: numberPrefixMatch[1], treatment: numberPrefixMatch[2] };
  }

  // Standard split: first word is name, rest is treatment
  const parts = trimmed.split(' ');
  if (parts.length > 1) {
    return { name: parts[0], treatment: parts.slice(1).join(' ') };
  }

  return { name: trimmed, treatment: '접수/대기' };
};

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
      let treatment = "접수/대기";

      if (geminiApiKey) {
        const result = await parseTreatmentText(inputText, geminiApiKey);
        if (result) {
          name = result.name;
          treatment = result.treatment;
        } else {
          const parsed = parseInputText(inputText);
          name = parsed.name;
          treatment = parsed.treatment;
        }
      } else {
        const parsed = parseInputText(inputText);
        name = parsed.name;
        treatment = parsed.treatment;
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
    <div className="max-w-3xl mx-auto w-full p-4 pb-24">
      {/* Input Section */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm ring-1 ring-gray-200 dark:ring-gray-700 p-5 mb-6">
        <div className="flex justify-between items-center mb-3">
            <h2 className="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <span className="material-icons-round text-brand-500 text-lg">edit_note</span>
              메모 입력
            </h2>
            <button
              type="button"
              onClick={() => setShowManual(!showManual)}
              className="text-xs text-gray-500 hover:text-brand-600 dark:text-gray-400 dark:hover:text-brand-400 font-medium transition-colors"
            >
              {showManual ? '간편 입력' : '수동 입력'}
            </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          {showManual ? (
            <div className="grid grid-cols-2 gap-3">
              <input
                type="text"
                placeholder="이름 (예: 3333 김진표)"
                value={manualName}
                onChange={(e) => setManualName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none text-sm transition-all"
              />
              <input
                type="text"
                placeholder="내용 (예: 4시로 변경)"
                value={manualTreatment}
                onChange={(e) => setManualTreatment(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none text-sm transition-all"
              />
            </div>
          ) : (
            <div className="relative">
              <input
                type="text"
                placeholder="예: 3333 김진표 충격파, 2343/이지성 5시 변경"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                disabled={isProcessing}
                className="w-full px-4 py-3 text-sm rounded-lg bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all placeholder-gray-400 dark:placeholder-gray-500"
              />
              {isProcessing && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                   <div className="animate-spin h-4 w-4 border-2 border-brand-500 border-t-transparent rounded-full"></div>
                </div>
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={isProcessing || (showManual ? (!manualName || !manualTreatment) : !inputText)}
            className="w-full py-2.5 bg-brand-600 hover:bg-brand-700 disabled:bg-gray-300 dark:disabled:bg-gray-700 text-white font-medium text-sm rounded-lg shadow-sm transition-all active:scale-[0.98]"
          >
            {isProcessing ? '처리 중...' : '메모 전달하기'}
          </button>
        </form>
      </div>

      {/* List Section */}
      <div className="grid md:grid-cols-2 gap-5">
        {/* Waiting List */}
        <div className="space-y-3">
          <h3 className="font-medium text-gray-500 dark:text-gray-400 text-xs tracking-wider uppercase flex items-center gap-2 px-1">
            <span className="w-2 h-2 rounded-full bg-red-500"></span>
            대기 ({waitingPatients.length})
          </h3>
          {waitingPatients.length === 0 && (
             <p className="text-gray-400 text-xs py-4 px-1">대기 중인 메모가 없습니다.</p>
          )}
          <div className="space-y-2">
            {waitingPatients.map(p => (
              <div key={p.id} className="bg-white dark:bg-gray-800 p-3.5 rounded-lg shadow-sm ring-1 ring-gray-200 dark:ring-gray-700 flex justify-between items-center group hover:ring-brand-300 dark:hover:ring-gray-600 transition-all">
                <div>
                  <div className="text-sm font-semibold text-gray-900 dark:text-white">{p.name}</div>
                  <div className="text-sm text-brand-600 dark:text-brand-400 font-medium">{p.treatment}</div>
                </div>
                <div className="flex gap-1.5">
                  <button
                    onClick={() => onUpdateStatus(p.id, 'in-progress')}
                    className="p-1.5 text-brand-600 bg-brand-50 rounded-md hover:bg-brand-100 dark:bg-brand-900/20 dark:text-brand-400 dark:hover:bg-brand-900/30 transition-colors"
                    title="확인 중으로 이동"
                  >
                    <span className="material-icons-round text-lg">play_arrow</span>
                  </button>
                  <button
                    onClick={() => onDelete(p.id)}
                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
                    title="삭제"
                  >
                    <span className="material-icons-round text-lg">close</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* In Progress List */}
        <div className="space-y-3">
          <h3 className="font-medium text-gray-500 dark:text-gray-400 text-xs tracking-wider uppercase flex items-center gap-2 px-1">
            <span className="w-2 h-2 rounded-full bg-green-500"></span>
            확인 중 ({activePatients.length})
          </h3>
          {activePatients.length === 0 && (
             <p className="text-gray-400 text-xs py-4 px-1">확인 중인 메모가 없습니다.</p>
          )}
          <div className="space-y-2">
            {activePatients.map(p => (
              <div key={p.id} className="bg-green-50 dark:bg-green-900/10 p-3.5 rounded-lg shadow-sm ring-1 ring-green-200 dark:ring-green-800/30 flex justify-between items-center">
                <div>
                  <div className="text-sm font-semibold text-gray-900 dark:text-white">{p.name}</div>
                  <div className="text-sm text-green-700 dark:text-green-400 font-medium">{p.treatment}</div>
                </div>
                <div className="flex gap-1.5">
                  <button
                      onClick={() => onUpdateStatus(p.id, 'waiting')}
                      className="p-1.5 text-amber-600 bg-amber-50 hover:bg-amber-100 dark:text-amber-400 dark:bg-amber-900/20 dark:hover:bg-amber-900/30 rounded-md transition-colors"
                      title="대기로 되돌리기"
                    >
                      <span className="material-icons-round text-lg">undo</span>
                  </button>
                  <button
                      onClick={() => onUpdateStatus(p.id, 'done')}
                      className="px-3 py-1.5 bg-white dark:bg-gray-800 ring-1 ring-gray-200 dark:ring-gray-700 rounded-md text-xs font-semibold text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors"
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
