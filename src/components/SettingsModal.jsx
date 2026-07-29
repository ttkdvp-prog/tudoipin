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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="glass-modal w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl border border-slate-700">
        {/* Header */}
        <div className="bg-slate-800/80 px-6 py-4 flex items-center justify-between border-b border-slate-700">
          <div className="flex items-center space-x-2">
            <Settings className="w-5 h-5 text-cyan-400" />
            <h3 className="text-base font-bold text-white">Cấu Hình Đồng Bộ Google Apps Script</h3>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          <p className="text-xs text-slate-300 leading-relaxed">
            Nhập Web App URL sau khi bạn đã triển khai ứng dụng web trên <strong>Google Apps Script</strong> để đồng bộ tiến độ thời gian thực.
          </p>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300 flex items-center">
              <Link className="w-3.5 h-3.5 mr-1 text-cyan-400" /> Apps Script Web App URL
            </label>
            <input
              type="text"
              placeholder="https://script.google.com/macros/s/AKfycb.../exec"
              value={gasUrl}
              onChange={(e) => setGasUrl(e.target.value)}
              className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>

          {statusMessage && (
            <div className={`p-3 rounded-lg text-xs font-medium flex items-center space-x-2 ${
              statusMessage.type === 'success' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
            }`}>
              {statusMessage.type === 'success' ? <CheckCircle className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
              <span>{statusMessage.text}</span>
            </div>
          )}

          <div className="flex items-center justify-between pt-2">
            <button
              onClick={handleTestConnection}
              disabled={testing}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg border border-slate-700 flex items-center space-x-1 transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${testing ? 'animate-spin' : ''}`} />
              <span>{testing ? 'Đang kiểm tra...' : 'Kiểm tra kết nối'}</span>
            </button>

            <div className="flex space-x-2">
              <button
                onClick={onClose}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg"
              >
                Hủy
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold rounded-lg shadow-md shadow-cyan-500/20"
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
