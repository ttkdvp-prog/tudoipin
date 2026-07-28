import React, { useState } from 'react';
import { X, MapPin, User, Phone, Wrench, Zap, AlertTriangle, Save, CheckCircle2, RefreshCw } from 'lucide-react';

export default function StationDetailModal({ station, onClose, onUpdateStation }) {
  if (!station) return null;

  // Form state for all station parameters
  const [formData, setFormData] = useState({
    dot: station.dot || '',
    to_ht: station.to_ht || '',
    to_truong: station.to_truong || '',
    sdt: station.sdt || '',
    so_luong_tu: station.so_luong_tu || 2,
    loai_tu: station.loai_tu || 'TĐP 12 ngăn',
    pa_dien: station.pa_dien || 'Điện EVN 3P',
    lap_dien: station.lap_dien || '',
    vuong_mac: station.vuong_mac || ''
  });

  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState(null);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    setMessage(null);

    try {
      const res = await onUpdateStation(station.id || station.ma_tram, formData);
      if (res && res.success !== false) {
        setMessage({ type: 'success', text: 'Đã lưu & đồng bộ tức thì lên Google Sheet!' });
        setTimeout(() => {
          onClose();
        }, 1200);
      } else {
        setMessage({ type: 'error', text: res.message || 'Không thể lưu lên Google Sheet. Kiểm tra lại URL API.' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Lỗi: ' + err.toString() });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="glass-modal w-full max-w-2xl rounded-2xl overflow-hidden shadow-2xl border border-slate-700">
        {/* Modal Header */}
        <div className="bg-slate-800/80 px-6 py-4 flex items-center justify-between border-b border-slate-700">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 font-mono font-black text-sm">
              {station.ma_tram}
            </div>
            <div>
              <h3 className="text-base font-bold text-white">{station.ten_co_so}</h3>
              <p className="text-xs text-slate-400">{station.dia_chi || station.dia_ban}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body: Editable Form */}
        <div className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Grid fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Đợt */}
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">Đợt Triển Khai</label>
              <input
                type="text"
                value={formData.dot}
                onChange={(e) => handleChange('dot', e.target.value)}
                className="w-full p-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-cyan-500"
              />
            </div>

            {/* Tổ HT */}
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">Tổ Hạ Tầng</label>
              <input
                type="text"
                value={formData.to_ht}
                onChange={(e) => handleChange('to_ht', e.target.value)}
                className="w-full p-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-cyan-500"
              />
            </div>

            {/* Tổ trưởng */}
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">Tổ Trưởng Phụ Trách</label>
              <input
                type="text"
                value={formData.to_truong}
                onChange={(e) => handleChange('to_truong', e.target.value)}
                className="w-full p-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-cyan-500"
              />
            </div>

            {/* SĐT */}
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">SĐT Tổ Trưởng</label>
              <input
                type="text"
                value={formData.sdt}
                onChange={(e) => handleChange('sdt', e.target.value)}
                className="w-full p-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-cyan-500 font-mono"
              />
            </div>

            {/* Số lượng tủ */}
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">Số Lượng Tủ Đổi Pin</label>
              <input
                type="number"
                min="1"
                max="10"
                value={formData.so_luong_tu}
                onChange={(e) => handleChange('so_luong_tu', parseInt(e.target.value, 10) || 1)}
                className="w-full p-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-cyan-500"
              />
            </div>

            {/* Loại tủ */}
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">Loại Tủ</label>
              <select
                value={formData.loai_tu}
                onChange={(e) => handleChange('loai_tu', e.target.value)}
                className="w-full p-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-cyan-500"
              >
                <option value="TĐP 6 ngăn">TĐP 6 ngăn</option>
                <option value="TĐP 12 ngăn">TĐP 12 ngăn</option>
                <option value="TĐP 18 ngăn">TĐP 18 ngăn</option>
              </select>
            </div>
          </div>

          {/* Phương án điện */}
          <div>
            <label className="text-xs font-bold text-slate-300 block mb-1">Phương Án Cấp Điện</label>
            <input
              type="text"
              value={formData.pa_dien}
              onChange={(e) => handleChange('pa_dien', e.target.value)}
              className="w-full p-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-cyan-500"
            />
          </div>

          {/* Lắp điện */}
          <div>
            <label className="text-xs font-bold text-cyan-400 block mb-1 flex items-center">
              <Zap className="w-3.5 h-3.5 mr-1 text-cyan-400" /> Trạng Thái Lắp Điện (Cột Lắp Điện)
            </label>
            <input
              type="text"
              value={formData.lap_dien}
              onChange={(e) => handleChange('lap_dien', e.target.value)}
              placeholder="Nhập trạng thái lắp điện (ví dụ: Đã lắp xong, Điện lực đã khảo sát và soạn HĐ...)"
              className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-cyan-200 focus:outline-none focus:border-cyan-500"
            />
          </div>

          {/* Vướng mắc & Ghi chú */}
          <div>
            <label className="text-xs font-bold text-amber-400 block mb-1 flex items-center">
              <AlertTriangle className="w-3.5 h-3.5 mr-1" /> Chi Tiết Vướng Mắc & Ghi Chú Tiến Độ
            </label>
            <textarea
              rows="3"
              value={formData.vuong_mac}
              onChange={(e) => handleChange('vuong_mac', e.target.value)}
              placeholder="Nhập nội dung vướng mắc, trở ngại hoặc tiến độ xử lý..."
              className="w-full p-3 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-amber-500"
            />
          </div>

          {message && (
            <div className={`p-3 rounded-lg text-xs font-medium ${
              message.type === 'success' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
            }`}>
              {message.text}
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="bg-slate-900 px-6 py-3 border-t border-slate-800 flex items-center justify-between">
          <span className="text-[11px] text-slate-400">Thay đổi sẽ đồng bộ 2 chiều tức thì về Google Sheet</span>
          <div className="flex space-x-2">
            <button
              onClick={onClose}
              className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-lg text-xs transition-colors"
            >
              Hủy
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-4 py-1.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold rounded-lg text-xs flex items-center space-x-1.5 transition-all shadow-md shadow-cyan-500/20 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Đang đồng bộ...' : 'Lưu Thay Đổi'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
