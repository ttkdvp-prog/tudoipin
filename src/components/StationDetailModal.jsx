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
        setMessage({ type: 'success', text: 'Đã lưu & đồng bộ dữ liệu tức thì!' });
        setTimeout(() => {
          onClose();
        }, 1200);
      } else {
        setMessage({ type: 'error', text: res.message || 'Không thể lưu dữ liệu. Kiểm tra lại URL API.' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Lỗi: ' + err.toString() });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md animate-fade-in">
      <div className="glass-modal w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl border border-slate-200 bg-white">
        {/* Modal Header */}
        <div className="bg-slate-50 px-6 py-4 flex items-center justify-between border-b border-slate-200">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-violet-100 text-violet-800 border border-violet-200 font-mono font-black text-sm">
              {station.ma_tram}
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900">{station.ten_co_so}</h3>
              <p className="text-xs text-slate-500 font-medium">{station.dia_chi || station.dia_ban}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
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
              <label className="text-xs font-extrabold text-slate-700 block mb-1">Đợt Triển Khai</label>
              <input
                type="text"
                value={formData.dot}
                onChange={(e) => handleChange('dot', e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:bg-white focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 font-medium"
              />
            </div>

            {/* Tổ HT */}
            <div>
              <label className="text-xs font-extrabold text-slate-700 block mb-1">Tổ Hạ Tầng</label>
              <input
                type="text"
                value={formData.to_ht}
                onChange={(e) => handleChange('to_ht', e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:bg-white focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 font-medium"
              />
            </div>

            {/* Tổ trưởng */}
            <div>
              <label className="text-xs font-extrabold text-slate-700 block mb-1">Tổ Trưởng Phụ Trách</label>
              <input
                type="text"
                value={formData.to_truong}
                onChange={(e) => handleChange('to_truong', e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:bg-white focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 font-medium"
              />
            </div>

            {/* SĐT */}
            <div>
              <label className="text-xs font-extrabold text-slate-700 block mb-1">SĐT Tổ Trưởng</label>
              <input
                type="text"
                value={formData.sdt}
                onChange={(e) => handleChange('sdt', e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:bg-white focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 font-mono font-medium"
              />
            </div>

            {/* Số lượng tủ */}
            <div>
              <label className="text-xs font-extrabold text-slate-700 block mb-1">Số Lượng Tủ Đổi Pin</label>
              <input
                type="number"
                min="1"
                max="10"
                value={formData.so_luong_tu}
                onChange={(e) => handleChange('so_luong_tu', parseInt(e.target.value, 10) || 1)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:bg-white focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 font-medium"
              />
            </div>

            {/* Loại tủ */}
            <div>
              <label className="text-xs font-extrabold text-slate-700 block mb-1">Loại Tủ</label>
              <select
                value={formData.loai_tu}
                onChange={(e) => handleChange('loai_tu', e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:bg-white focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 font-bold"
              >
                <option value="TĐP 6 ngăn">TĐP 6 ngăn</option>
                <option value="TĐP 12 ngăn">TĐP 12 ngăn</option>
                <option value="TĐP 18 ngăn">TĐP 18 ngăn</option>
              </select>
            </div>
          </div>

          {/* Phương án điện */}
          <div>
            <label className="text-xs font-extrabold text-slate-700 block mb-1">Phương Án Cấp Điện</label>
            <input
              type="text"
              value={formData.pa_dien}
              onChange={(e) => handleChange('pa_dien', e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:bg-white focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 font-medium"
            />
          </div>

          {/* Lắp điện */}
          <div>
            <label className="text-xs font-extrabold text-violet-700 block mb-1 flex items-center">
              <Zap className="w-3.5 h-3.5 mr-1 text-violet-600" /> Trạng Thái Lắp Điện (Cột Lắp Điện)
            </label>
            <input
              type="text"
              value={formData.lap_dien}
              onChange={(e) => handleChange('lap_dien', e.target.value)}
              placeholder="Nhập trạng thái lắp điện (ví dụ: Đã lắp xong, Điện lực đã khảo sát và soạn HĐ...)"
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:bg-white focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 font-medium"
            />
          </div>

          {/* Vướng mắc & Ghi chú */}
          <div>
            <label className="text-xs font-extrabold text-orange-700 block mb-1 flex items-center">
              <AlertTriangle className="w-3.5 h-3.5 mr-1 text-orange-600" /> Chi Tiết Vướng Mắc & Ghi Chú Tiến Độ
            </label>
            <textarea
              rows="3"
              value={formData.vuong_mac}
              onChange={(e) => handleChange('vuong_mac', e.target.value)}
              placeholder="Nhập nội dung vướng mắc, trở ngại hoặc tiến độ xử lý..."
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:bg-white focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 font-medium"
            />
          </div>

          {message && (
            <div className={`p-3 rounded-xl text-xs font-bold ${
              message.type === 'success' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 'bg-rose-100 text-rose-800 border border-rose-200'
            }`}>
              {message.text}
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="bg-slate-50 px-6 py-3.5 border-t border-slate-200 flex items-center justify-between">
          <span className="text-[11px] text-slate-500 font-medium">Thay đổi sẽ đồng bộ 2 chiều tức thì về hệ thống</span>
          <div className="flex space-x-2">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors"
            >
              Hủy
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-4 py-2 bg-[#1E1B3A] hover:bg-[#2B274F] text-white font-bold rounded-xl text-xs flex items-center space-x-1.5 transition-all shadow-xs disabled:opacity-50"
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
