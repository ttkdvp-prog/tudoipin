import React, { useState } from 'react';
import { X, MapPin, User, Phone, Wrench, Zap, AlertTriangle, Save, CheckCircle2 } from 'lucide-react';
import { updateStationNote } from '../services/api';

export default function StationDetailModal({ station, onClose, onRefreshData }) {
  if (!station) return null;

  const [vuongMacNote, setVuongMacNote] = useState(station.vuong_mac || '');
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState(null);

  const handleSaveNote = async () => {
    setIsSaving(true);
    setMessage(null);
    try {
      const res = await updateStationNote(station.id, vuongMacNote);
      if (res && res.status === 'success') {
        setMessage({ type: 'success', text: 'Đã lưu vướng mắc thành công lên Google Sheet!' });
        if (onRefreshData) onRefreshData();
      } else {
        setMessage({ type: 'error', text: res.message || 'Chưa thể lưu lên Apps Script (Vui lòng kiểm tra URL API).' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Lỗi kết nối: ' + err.toString() });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="glass-modal w-full max-w-2xl rounded-2xl overflow-hidden shadow-2xl border border-slate-700/80">
        {/* Modal Header */}
        <div className="bg-slate-800/80 px-6 py-4 flex items-center justify-between border-b border-slate-700">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 font-mono font-black text-sm">
              {station.ma_tram}
            </div>
            <div>
              <h3 className="text-base font-bold text-white">{station.ten_co_so}</h3>
              <p className="text-xs text-slate-400">{station.dot} • {station.to_ht}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {/* Info Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center mb-1">
                <MapPin className="w-3.5 h-3.5 mr-1 text-cyan-400" /> Vị Trí & Địa Chỉ
              </span>
              <p className="text-xs font-semibold text-slate-200">{station.dia_chi || 'Chưa ghi nhận địa chỉ'}</p>
              <p className="text-xs text-slate-400 mt-0.5">{station.phuong_xa} - {station.dia_ban}</p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center mb-1">
                <User className="w-3.5 h-3.5 mr-1 text-emerald-400" /> Cán Bộ Phụ Trách
              </span>
              <p className="text-xs font-semibold text-slate-200">{station.to_truong || 'Chưa phân công'}</p>
              {station.sdt && (
                <p className="text-xs text-cyan-400 font-mono flex items-center mt-0.5">
                  <Phone className="w-3 h-3 mr-1" /> {station.sdt}
                </p>
              )}
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center mb-1">
                <Wrench className="w-3.5 h-3.5 mr-1 text-purple-400" /> Quy Mô Tủ Đổi Pin
              </span>
              <p className="text-xs font-semibold text-slate-200">{station.so_luong_tu} Tủ ({station.loai_tu})</p>
              <p className="text-xs text-slate-400 mt-0.5">Chiều dài cáp nguồn: ~{station.so_met_day || 30} mét</p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center mb-1">
                <Zap className="w-3.5 h-3.5 mr-1 text-amber-400" /> Phương Án Cấp Điện
              </span>
              <p className="text-xs font-semibold text-slate-200">{station.pa_dien || 'Điện EVN 3P'}</p>
              <p className="text-xs text-slate-400 mt-0.5">Đơn vị: {station.don_vi_phu_trach}</p>
            </div>
          </div>

          {/* Edit Vuong Mac Box */}
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-700/80 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center">
                <AlertTriangle className="w-4 h-4 mr-1.5" /> Ghi Chú & Chi Tiết Vướng Mắc (Đồng Bộ Google Sheet)
              </label>
              <span className="text-[10px] text-slate-400">Có thể chỉnh sửa trực tiếp</span>
            </div>

            <textarea
              rows="3"
              value={vuongMacNote}
              onChange={(e) => setVuongMacNote(e.target.value)}
              placeholder="Nhập nội dung vướng mắc, trở ngại hoặc tiến độ xử lý hiện tại..."
              className="w-full p-3 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
            />

            {message && (
              <div className={`p-2.5 rounded text-xs font-medium ${
                message.type === 'success' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
              }`}>
                {message.text}
              </div>
            )}

            <div className="flex justify-end">
              <button
                onClick={handleSaveNote}
                disabled={isSaving}
                className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 font-bold rounded-lg text-xs flex items-center space-x-1.5 transition-all shadow-md shadow-amber-500/20 disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{isSaving ? 'Đang lưu...' : 'Lưu Thay Đổi Này'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-900 px-6 py-3 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-lg text-xs transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
