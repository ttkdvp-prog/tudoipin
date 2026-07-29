import React, { useState } from 'react';
import { X, Settings, Link, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { getStoredGasUrl, setStoredGasUrl } from '../services/api';

export default function SettingsModal({ onClose, onSaveSuccess }) {
  const [gasUrl, setGasUrl] = useState(getStoredGasUrl());
  const [testing, setTesting] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);

  const handleTestConnection = async () => {
    if (!gasUrl.trim()) {
      setStatusMessage({ type: 'error', text: 'Vui lòng nhập đường dẫn Google Apps Script URL!' });
      return;
    }

    setTesting(true);
    setStatusMessage(null);

    try {
      const pingUrl = gasUrl.includes('?') ? `${gasUrl}&action=ping` : `${gasUrl}?action=ping`;
      const res = await fetch(pingUrl);
      const json = await res.json();

      if (json && json.status === 'ok') {
        setStatusMessage({ type: 'success', text: 'Kết nối thành công tới Apps Script API!' });
      } else {
        setStatusMessage({ type: 'error', text: 'Ứng dụng đã phản hồi nhưng không khớp định dạng.' });
      }
    } catch (err) {
      setStatusMessage({ type: 'error', text: 'Không thể kết nối. Vui lòng kiểm tra quyền truy cập (Anyone) và URL.' });
    } finally {
      setTesting(false);
    }
  };

  const handleSave = () => {
    setStoredGasUrl(gasUrl);
    if (onSaveSuccess) onSaveSuccess();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md animate-fade-in">
      <div className="glass-modal w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl border border-slate-200 bg-white">
        {/* Header */}
        <div className="bg-slate-50 px-6 py-4 flex items-center justify-between border-b border-slate-200">
          <div className="flex items-center space-x-2">
            <Settings className="w-5 h-5 text-violet-600" />
            <h3 className="text-base font-black text-slate-900">Cấu Hình Đồng Bộ Google Apps Script</h3>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-200/60">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          <p className="text-xs text-slate-600 leading-relaxed font-medium">
            Nhập Web App URL sau khi bạn đã triển khai ứng dụng web trên <strong>Google Apps Script</strong> để đồng bộ tiến độ thời gian thực.
          </p>

          <div className="space-y-1.5">
            <label className="text-xs font-extrabold text-slate-700 flex items-center">
              <Link className="w-3.5 h-3.5 mr-1 text-violet-600" /> Apps Script Web App URL
            </label>
            <input
              type="text"
              placeholder="https://script.google.com/macros/s/AKfycb.../exec"
              value={gasUrl}
              onChange={(e) => setGasUrl(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 font-medium"
            />
          </div>

          {statusMessage && (
            <div className={`p-3 rounded-xl text-xs font-bold flex items-center space-x-2 ${
              statusMessage.type === 'success' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 'bg-rose-100 text-rose-800 border border-rose-200'
            }`}>
              {statusMessage.type === 'success' ? <CheckCircle className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
              <span>{statusMessage.text}</span>
            </div>
          )}

          <div className="flex items-center justify-between pt-2">
            <button
              onClick={handleTestConnection}
              disabled={testing}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 flex items-center space-x-1.5 transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${testing ? 'animate-spin' : ''}`} />
              <span>{testing ? 'Đang kiểm tra...' : 'Kiểm tra kết nối'}</span>
            </button>

            <div className="flex space-x-2">
              <button
                onClick={onClose}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl"
              >
                Hủy
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-[#1E1B3A] hover:bg-[#2B274F] text-white text-xs font-bold rounded-xl shadow-xs"
              >
                Lưu URL API
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
