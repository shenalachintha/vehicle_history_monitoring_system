import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';

// Custom colored SVG pin markers
const createPinIcon = (color, label) => {
  return L.divIcon({
    className: 'custom-pin',
    html: `
      <div style="background-color: ${color}; width: 28px; height: 28px; border-radius: 50%; border: 3px solid white; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; color: white;">
        <svg style="width: 14px; height: 14px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/></svg>
      </div>
    `,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });
};

export const FleetMapWidget = ({ vehicles = [] }) => {
  // Default Sri Lanka coordinates centered around Trincomalee / North-East as shown in the mockup
  const defaultCenter = [8.5874, 81.2152];

  const samplePins = [
    { id: 1, reg: 'WP CA 1234', model: 'Toyota Corolla', status: 'MOVING', lat: 8.5874, lng: 81.2152, color: '#10B981', location: 'Trincomalee' },
    { id: 2, reg: 'WP KA 5678', model: 'Honda Civic', status: 'MOVING', lat: 8.4890, lng: 81.1850, color: '#10B981', location: 'Kinniya' },
    { id: 3, reg: 'WP LB 9012', model: 'Nissan Note', status: 'STOPPED', lat: 8.3500, lng: 80.9500, color: '#F59E0B', location: 'Eppawela' },
    { id: 4, reg: 'WP NC 3456', model: 'Isuzu D-Max', status: 'MOVING', lat: 8.8150, lng: 81.0920, color: '#10B981', location: 'Kuchchaveli' },
    { id: 5, reg: 'WP PF 7890', model: 'Suzuki Alto', status: 'OFFLINE', lat: 8.4200, lng: 81.2800, color: '#EF4444', location: 'Kinniya South' },
  ];

  const pins = vehicles.length > 0
    ? vehicles.map(v => ({
        id: v.id,
        reg: v.registrationNo,
        model: `${v.make} ${v.model}`,
        status: v.locationStatus || 'MOVING',
        lat: v.currentLatitude || 8.5874,
        lng: v.currentLongitude || 81.2152,
        color: v.locationStatus === 'STOPPED' ? '#F59E0B' : v.locationStatus === 'OFFLINE' ? '#EF4444' : '#10B981',
        location: v.operationalLocation || 'En Route',
      }))
    : samplePins;

  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-xs flex flex-col justify-between h-[360px]">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-slate-800 text-sm tracking-tight">
          Live Vehicle Locations
        </h3>
      </div>

      {/* Map Container */}
      <div className="w-full flex-1 rounded-xl overflow-hidden relative border border-slate-200/80">
        <MapContainer
          center={defaultCenter}
          zoom={9}
          scrollWheelZoom={false}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {pins.map((pin) => (
            <Marker
              key={pin.id}
              position={[pin.lat, pin.lng]}
              icon={createPinIcon(pin.color, pin.reg)}
            >
              <Popup>
                <div className="p-1">
                  <p className="font-bold text-slate-900 text-xs">{pin.reg}</p>
                  <p className="text-[11px] text-slate-600">{pin.model}</p>
                  <p className="text-[10px] text-slate-400 mt-1">Status: <span className="font-bold">{pin.status}</span></p>
                  <p className="text-[10px] text-slate-400">Near: {pin.location}</p>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 mt-3 text-xs">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
          <span className="font-medium text-slate-600">Moving</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
          <span className="font-medium text-slate-600">Stopped</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
          <span className="font-medium text-slate-600">Offline</span>
        </div>
      </div>
    </div>
  );
};

