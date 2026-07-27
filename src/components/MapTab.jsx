import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { MapPin, Zap, Wrench, AlertTriangle, Phone } from 'lucide-react';

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
  // Filter stations with valid coordinates
  const validStations = stations.filter(s => s.lat && s.lng && !isNaN(s.lat) && !isNaN(s.lng));

  // Default map center (Phú Thọ / Hòa Bình area)
  const defaultCenter = [21.0, 105.3];

  return (
    <div className="space-y-4">
      {/* Top Controls Bar */}
      <div className="glass-card rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center">
            <MapPin className="w-4 h-4 mr-2 text-cyan-400" />
            Bản Đồ Vị Trí Trạm Tủ Đổi Pin ({validStations.length} Trạm Có Tọa Độ)
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Nhấp vào từng ghim vị trí để xem chi tiết trạm, tổ hạ tầng và tình trạng điện lực.
          </p>
        </div>

        {/* Legend */}
        <div className="flex items-center space-x-3 text-xs bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700">
          <span className="flex items-center text-emerald-400 font-medium">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 mr-1.5"></span> Đã hoàn thành
          </span>
          <span className="flex items-center text-amber-400 font-medium">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 mr-1.5"></span> Chờ EVN/HĐ
          </span>
          <span className="flex items-center text-rose-400 font-medium">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 mr-1.5"></span> Có vướng mắc
          </span>
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
                        {station.to_ht}
                      </span>
                    </div>

                    <h4 className="text-xs font-bold text-white">{station.ten_co_so}</h4>
                    <p className="text-[11px] text-slate-300">{station.dia_chi || station.dia_ban}</p>

                    <div className="text-[11px] text-slate-300 space-y-1">
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
                      Xem chi tiết trạm
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
