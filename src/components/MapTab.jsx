import React, { useState, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { MapPin, Zap, Wrench, AlertTriangle, Phone, Search, Filter, Layers } from 'lucide-react';

// Fix Leaflet marker icons in React Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom colored SVG icons for map pins
const createCustomIcon = (color) => {
  return L.divIcon({
    className: 'custom-leaflet-pin',
    html: `<div style="
      background-color: ${color};
      width: 24px;
      height: 24px;
      border-radius: 50%;
      border: 2px solid #ffffff;
      box-shadow: 0 0 10px ${color};
      display: flex;
      align-items: center;
      justify-content: center;
    "><div style="width: 8px; height: 8px; background: white; border-radius: 50%;"></div></div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12]
  });
};

const greenIcon = createCustomIcon('#10b981'); // Done
const amberIcon = createCustomIcon('#f59e0b'); // In progress / EVN
const redIcon = createCustomIcon('#ef4444');   // Issue

export default function MapTab({ stations, onSelectStation }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDot, setSelectedDot] = useState('ALL');

  // Dynamic Batch List
  const dotsList = useMemo(() => {
    const set = new Set(stations.map(s => s.dot).filter(Boolean));
    return Array.from(set).sort();
  }, [stations]);

  // Filter stations by search term and batch
  const filteredStations = useMemo(() => {
    return stations.filter(s => {
      const matchSearch = searchTerm === '' ||
        s.ma_tram.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.ten_co_so.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.to_ht.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.dia_chi.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.to_truong.toLowerCase().includes(searchTerm.toLowerCase());

      const matchDot = selectedDot === 'ALL' || s.dot === selectedDot;

      return matchSearch && matchDot;
    });
  }, [stations, searchTerm, selectedDot]);

  // Filter stations with valid coordinates
  const validStations = useMemo(() => {
    return filteredStations.filter(s => s.lat && s.lng && !isNaN(s.lat) && !isNaN(s.lng));
  }, [filteredStations]);

  // Default map center (Phú Thọ / Hòa Bình area)
  const defaultCenter = [21.0, 105.3];

  return (
    <div className="space-y-4">
      {/* Search Bar & Controls Bar */}
      <div className="glass-card rounded-xl p-4 flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Universal Search Input */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm theo Mã trạm, Tổ hạ tầng, Tên địa điểm..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-800/80 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-400 focus:outline-none focus:border-cyan-500"
          />
        </div>

        {/* Dynamic Đợt Filter & Legend */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
          <div className="flex items-center space-x-1.5 bg-slate-800/80 border border-slate-700 rounded-lg px-3 py-1.5">
            <Layers className="w-3.5 h-3.5 text-cyan-400" />
            <select
              value={selectedDot}
              onChange={(e) => setSelectedDot(e.target.value)}
              className="bg-transparent text-xs text-slate-200 font-medium focus:outline-none cursor-pointer"
            >
              <option value="ALL" className="bg-slate-900">Tất cả các đợt ({dotsList.length} đợt)</option>
              {dotsList.map(d => (
                <option key={d} value={d} className="bg-slate-900">{d}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center space-x-3 text-xs bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700">
            <span className="flex items-center text-emerald-400 font-medium">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 mr-1.5"></span> Đã xong
            </span>
            <span className="flex items-center text-amber-400 font-medium">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 mr-1.5"></span> Chờ EVN
            </span>
            <span className="flex items-center text-rose-400 font-medium">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 mr-1.5"></span> Có vướng mắc
            </span>
          </div>
        </div>
      </div>

      {/* Map Container */}
      <div className="glass-card rounded-xl p-2 h-[550px] relative overflow-hidden">
        <MapContainer center={defaultCenter} zoom={9} scrollWheelZoom={true} className="z-10">
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {validStations.map((station) => {
            let pinIcon = amberIcon;
            const vm = (station.vuong_mac || '').toLowerCase();
            if (vm.includes('đóng điện') || vm.includes('hoàn thành')) {
              pinIcon = greenIcon;
            } else if (vm.includes('vướng') || vm.includes('chưa nhận')) {
              pinIcon = redIcon;
            }

            return (
              <Marker
                key={station.id}
                position={[station.lat, station.lng]}
                icon={pinIcon}
              >
                <Popup>
                  <div className="p-1 max-w-xs space-y-2">
                    <div className="flex items-center justify-between border-b border-slate-700 pb-1">
                      <span className="font-mono font-bold text-xs text-cyan-400">{station.ma_tram}</span>
                      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                        {station.to_ht} • {station.dot}
                      </span>
                    </div>

                    <h4 className="text-xs font-bold text-white">{station.ten_co_so}</h4>
                    <p className="text-[11px] text-slate-300">{station.dia_chi || station.dia_ban}</p>

                    <div className="text-[11px] text-slate-300 space-y-1">
                      <div>⚡ PA Điện: <strong>{station.pa_dien || 'EVN 3P'}</strong></div>
                      <div>⚡ Số tủ: <strong>{station.so_luong_tu} tủ ({station.loai_tu})</strong></div>
                      <div>👤 Phụ trách: <strong>{station.to_truong} ({station.sdt})</strong></div>
                    </div>

                    {station.vuong_mac && (
                      <div className="text-[10px] text-amber-300 bg-amber-500/10 p-1.5 rounded border border-amber-500/30 italic">
                        "{station.vuong_mac}"
                      </div>
                    )}

                    <button
                      onClick={() => onSelectStation(station)}
                      className="w-full mt-2 py-1 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded text-[11px] transition-colors"
                    >
                      Sửa thông số trạm
                    </button>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      </div>
    </div>
  );
}
