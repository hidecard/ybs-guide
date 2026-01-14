import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, Popup, useMap, Circle } from 'react-leaflet';
import L from 'leaflet';

// Types
type StopCoord = { lat: number; lng: number; name_en?: string; name_mm?: string; id?: string; type?: 'regular' | 'transfer' | 'terminal' };
type Vehicle = { id: string; posIndex: number; lat: number; lng: number; busId: string };

// Custom Icons
const createStopIcon = (type: 'regular' | 'transfer' | 'terminal' = 'regular') => {
  const colors = {
    regular: '#3b82f6',  // Blue
    transfer: '#a855f7', // Purple
    terminal: '#ef4444'  // Red
  };
  const size = type === 'terminal' ? 20 : type === 'transfer' ? 18 : 14;
  const color = colors[type];
  
  return L.divIcon({
    html: `
      <div style="
        width: ${size}px;
        height: ${size}px;
        background: ${color};
        border: 3px solid white;
        border-radius: 50%;
        box-shadow: 0 2px 8px rgba(0,0,0,0.4);
      "></div>
    `,
    className: '',
    iconSize: [size, size],
    iconAnchor: [size/2, size/2],
  });
};

const defaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

const busIcon = L.divIcon({
  html: `
    <div style="
      width: 40px;
      height: 40px;
      background: linear-gradient(135deg, #f6e05e 0%, #ecc94b 100%);
      border-radius: 50%;
      border: 3px solid white;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 12px rgba(0,0,0,0.4);
    ">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
        <path d="M4 16c0 .88.39 1.67 1 2.22V20c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h8v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1.78c.61-.55 1-1.34 1-2.22V6c0-3.5-3.58-4-8-4s-8 .5-8 4v10zm3.5 1c-.83 0-1.5-.67-1.5-1.5S6.67 14 7.5 14s1.5.67 1.5 1.5S8.33 17 7.5 17zm9 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm1.5-6H6V6h12v5z"/>
      </svg>
    </div>
  `,
  className: '',
  iconSize: [40, 40],
  iconAnchor: [20, 20],
});

const userBusIcon = L.divIcon({
  html: `
    <div style="width:36px;height:36px;background:linear-gradient(135deg,#22c55e 0%,#16a34a 100%);border-radius:50%;border:3px solid white;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 12px rgba(0,0,0,0.35);">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
        <path d="M4 16c0 .88.39 1.67 1 2.22V20c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h8v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1.78c.61-.55 1-1.34 1-2.22V6c0-3.5-3.58-4-8-4s-8 .5-8 4v10zm3.5 1c-.83 0-1.5-.67-1.5-1.5S6.67 14 7.5 14s1.5.67 1.5 1.5S8.33 17 7.5 17zm9 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm1.5-6H6V6h12v5z"/>
      </svg>
    </div>
  `,
  className: '',
  iconSize: [36, 36],
  iconAnchor: [18, 18],
});

// Cluster plugin types (placeholder for future implementation)
interface ClusterGroupProps {
  children: React.ReactNode;
  showCoverageOnHover: boolean;
  zoomToBoundsOnClick: boolean;
  spiderfyOnMaxZoom: boolean;
  disableClusteringAtZoom: number;
}

// Zoom clustering component
const ZoomClusterHandler: React.FC<{ coords: StopCoord[]; zoom: number }> = ({ coords, zoom }) => {
  const map = useMap();
  
  useEffect(() => {
    const currentZoom = map.getZoom();
    // Clustering logic can be enhanced with leaflet.markercluster
  }, [coords, map]);
  
  return null;
};

// Map controller for centering
const MapController: React.FC<{ center: [number, number]; zoom: number }> = ({ center, zoom }) => {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);
  return null;
};

// Helper: determine simulation speed (ms per step) by hour
const getSpeedForHour = (hour: number) => {
  // faster (lower ms) during off-peak, slower during peak
  if (hour >= 7 && hour <= 9) return 1400; // morning peak
  if (hour >= 16 && hour <= 19) return 1800; // evening peak
  return 900; // off-peak
};

const BusMap: React.FC<{ 
  stops: string[]; 
  busId?: string; 
  stopIds?: number[]; 
  live?: boolean;
  showNearest?: boolean;
  timeOfDayMode?: boolean;
  onNearestStopSelect?: (stop: StopCoord) => void;
}> = ({ 
  stops, 
  busId, 
  stopIds, 
  live = false, 
  showNearest = false,
  timeOfDayMode = false,
  onNearestStopSelect 
}) => {
  const [coords, setCoords] = useState<StopCoord[]>([]);
  const [shapeCoords, setShapeCoords] = useState<[number, number][]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [userLocation, setUserLocation] = useState<{lat: number; lng: number} | null>(null);
  const [userError, setUserError] = useState<string | null>(null);
  const animRef = React.useRef<number | null>(null);
  const watchRef = useRef<number | null>(null);
  const [deviceActive, setDeviceActive] = useState(false);
  const [simulationSpeed, setSimulationSpeed] = useState(1500);
  const [isPaused, setIsPaused] = useState(false);
  const [mapZoom, setMapZoom] = useState(13);
  const [nearestStops, setNearestStops] = useState<StopCoord[]>([]);

  // Get route color based on bus ID
  const routeColor = useMemo(() => {
    if (!busId) return '#f6e05e';
    const num = parseInt(busId.replace(/\D/g, '')) || 0;
    const colors = ['#ef4444', '#f97316', '#eab308', '#84cc16', '#22c55e', '#14b8a6', '#06b6d4', '#3b82f6', '#6366f1', '#8b5cf6', '#d946ef', '#f43f5e'];
    return colors[num % colors.length];
  }, [busId]);

  // Determine stop type based on position
  const getStopType = (index: number, total: number): 'regular' | 'transfer' | 'terminal' => {
    if (index === 0 || index === total - 1) return 'terminal';
    return 'regular';
  };

  // Load stops data
  useEffect(() => {
    let mounted = true;
    fetch('/data/stops.tsv')
      .then(r => r.text())
      .then(text => {
        const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
        if (!lines.length) return;
        const headers = lines[0].split('\t').map(h => h.trim());
        const rows = lines.slice(1).map(line => {
          const cols = line.split('\t');
          const obj: any = {};
          headers.forEach((h, i) => { obj[h] = cols[i]; });
          return obj;
        });

        const rowsById = new Map<string, any>();
        const rowsByName = rows.reduce((m: Map<string, any>, r: any) => {
          if (r.id) rowsById.set(String(r.id), r);
          if (r.name_mm) m.set(r.name_mm.toLowerCase().trim(), r);
          if (r.name_en) m.set(r.name_en.toLowerCase().trim(), r);
          return m;
        }, new Map<string, any>());

        const normalize = (s?: string) => (s || '').toLowerCase().trim();

        let matched: StopCoord[] = [];
        if (stopIds && stopIds.length) {
          matched = stopIds.map((id, idx) => {
            const r = rowsById.get(String(id));
            if (r && r.lat && r.lng) return { 
              lat: parseFloat(r.lat), 
              lng: parseFloat(r.lng), 
              name_en: r.name_en, 
              name_mm: r.name_mm, 
              id: r.id,
              type: getStopType(idx, stopIds.length)
            };
            return null;
          }).filter(Boolean) as StopCoord[];
        }

        if (!matched.length) {
          matched = stops.map((stopName, idx) => {
            const target = normalize(stopName);
            const exact = rows.find(r => normalize(r.name_mm) === target || normalize(r.name_en) === target);
            const fuzzy = rows.find(r => normalize(r.name_mm).includes(target) || normalize(r.name_en).includes(target) || target.includes(normalize(r.name_mm)));
            const row = exact || fuzzy || rowsByName.get(target);
            if (row && row.lat && row.lng) {
              return { 
                lat: parseFloat(row.lat), 
                lng: parseFloat(row.lng), 
                name_en: row.name_en, 
                name_mm: row.name_mm, 
                id: row.id,
                type: getStopType(idx, stops.length)
              };
            }
            return null;
          }).filter(Boolean) as StopCoord[];
        }

        if (mounted) setCoords(matched);
      })
      .catch(() => {});
    return () => { mounted = false; };
  }, [stops, stopIds]);

  // Load route shape
  useEffect(() => {
    if (!busId) return;
    let mounted = true;
    (async () => {
      try {
        const idxResp = await fetch('/data/routes-index.json');
        if (!idxResp.ok) return;
        const idx: Record<string, string[]> = await idxResp.json();
        const key = String(busId);
        const variants = idx[key] || idx[String(Number(key))] || [];
        for (const fn of variants) {
          try {
            const r = await fetch(`/data/routes/${fn}`);
            if (!r.ok) continue;
            const j = await r.json();
            const coordsArr: any[] = j?.shape?.geometry?.coordinates || j?.geometry?.coordinates || [];
            if (!coordsArr || !coordsArr.length) continue;
            const converted = coordsArr.map((p: any[]) => [parseFloat(p[1]), parseFloat(p[0])]);
            if (mounted) { setShapeCoords(converted); }
            break;
          } catch (e) { continue; }
        }
      } catch (e) { }
    })();
    return () => { mounted = false; };
  }, [busId]);

  // Live simulation
  useEffect(() => {
    if (!live) {
      setVehicles([]);
      if (animRef.current) { clearInterval(animRef.current); animRef.current = null; }
      return;
    }
    if (!shapeCoords.length) return;
    if (isPaused) return;
    if (deviceActive) return; // device will drive vehicles when active

    const count = Math.max(2, Math.min(8, Math.floor(shapeCoords.length / 30) || 2));
    const initial: Vehicle[] = Array.from({ length: count }).map((_, i) => {
      const posIndex = Math.floor((i / count) * shapeCoords.length);
      const [lat, lng] = shapeCoords[posIndex];
      return { id: `${busId || 'sim'}-${i}`, posIndex, lat, lng, busId: busId || 'sim' };
    });
    setVehicles(initial);

    const step = () => {
      setVehicles(prev => prev.map(v => {
        const nextIndex = (v.posIndex + 1) % shapeCoords.length;
        const [lat, lng] = shapeCoords[nextIndex];
        return { ...v, posIndex: nextIndex, lat, lng };
      }));
    };

    animRef.current = window.setInterval(step, simulationSpeed);
    return () => {
      if (animRef.current) { clearInterval(animRef.current); animRef.current = null; }
    };
  }, [live, shapeCoords, busId, simulationSpeed, isPaused]);

  // Watch device location while live; when available, use device as the live vehicle
  useEffect(() => {
    if (!live) {
      // stop watcher
      if (watchRef.current) { navigator.geolocation.clearWatch(watchRef.current); watchRef.current = null; }
      setDeviceActive(false);
      return;
    }
    if (typeof navigator === 'undefined' || !navigator.geolocation) return;

    // start watcher
    try {
      const id = navigator.geolocation.watchPosition((pos) => {
        const { latitude, longitude } = pos.coords;
        setUserLocation({ lat: latitude, lng: longitude });
        setUserError(null);
        // replace simulation with device vehicle
        setDeviceActive(true);
        if (animRef.current) { clearInterval(animRef.current); animRef.current = null; }
        setVehicles([{ id: `device-0`, posIndex: 0, lat: latitude, lng: longitude, busId: busId || 'device' }]);
      }, (err) => {
        setUserError(err?.message || 'watchPosition failed');
      }, { enableHighAccuracy: true, maximumAge: 2000, timeout: 10000 });
      watchRef.current = id as unknown as number;
    } catch (e) {
      // ignore
    }

    return () => {
      if (watchRef.current) { try { navigator.geolocation.clearWatch(watchRef.current); } catch(e){} watchRef.current = null; }
      setDeviceActive(false);
    };
  }, [live, busId]);

  // Update simulation speed
  useEffect(() => {
    if (live && !isPaused && animRef.current) {
      clearInterval(animRef.current);
      animRef.current = window.setInterval(() => {
        setVehicles(prev => prev.map(v => {
          const nextIndex = (v.posIndex + 1) % shapeCoords.length;
          const [lat, lng] = shapeCoords[nextIndex];
          return { ...v, posIndex: nextIndex, lat, lng };
        }));
      }, simulationSpeed);
    }
  }, [simulationSpeed, live, isPaused, shapeCoords]);

  // Time-of-day simulation with location integration
  useEffect(() => {
    if (!timeOfDayMode) return;
    const updateSpeed = () => {
      const hour = new Date().getHours();
      let speed = getSpeedForHour(hour);
      // Adjust speed based on user location proximity to route
      if (userLocation && nearestStops.length > 0) {
        const nearestDistance = nearestStops[0].distance;
        if (nearestDistance < 500) { // Within 500m of nearest stop
          speed = Math.min(speed * 1.5, 3000); // Slow down simulation when user is close to route
        }
      }
      setSimulationSpeed(speed);
    };
    updateSpeed();
    const interval = setInterval(updateSpeed, 60000); // Update every minute
    return () => clearInterval(interval);
  }, [timeOfDayMode, userLocation, nearestStops]);

  // Center map on user location when time-of-day mode is enabled
  useEffect(() => {
    if (timeOfDayMode && userLocation) {
      setMapZoom(15); // Zoom in closer when centering on user
    }
  }, [timeOfDayMode, userLocation]);

  // User geolocation
  useEffect(() => {
    if (!showNearest) {
      setUserLocation(null);
      setNearestStops([]);
      return;
    }
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setUserError('Geolocation not supported');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setUserLocation({ lat: latitude, lng: longitude });
        setUserError(null);
      },
      (err) => {
        setUserError(err.message);
        setUserLocation(null);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, [showNearest]);

  // Find nearest stops
  useEffect(() => {
    if (!userLocation || !coords.length) return;

    const withDist = coords.map((c, idx) => ({
      ...c,
      distance: Math.sqrt(Math.pow(c.lat - userLocation.lat, 2) + Math.pow(c.lng - userLocation.lng, 2)) * 111000
    })).sort((a, b) => a.distance - b.distance);

    setNearestStops(withDist.slice(0, 5));
  }, [userLocation, coords]);

  // Reset simulation
  const resetSimulation = useCallback(() => {
    if (!shapeCoords.length) return;
    const count = Math.max(2, Math.min(8, Math.floor(shapeCoords.length / 30) || 2));
    const initial: Vehicle[] = Array.from({ length: count }).map((_, i) => {
      const posIndex = Math.floor((i / count) * shapeCoords.length);
      const [lat, lng] = shapeCoords[posIndex];
      return { id: `${busId || 'sim'}-${i}`, posIndex, lat, lng, busId: busId || 'sim' };
    });
    setVehicles(initial);
  }, [shapeCoords, busId]);

  if (!coords.length && !shapeCoords.length && !showNearest) {
    return (
      <div className="h-64 w-full glass p-4 rounded-2xl text-sm text-slate-400 flex items-center justify-center">
        No coordinates found for this route. / လမ်းကြောင်းအတွက် ကိန်းဂဏန်းများ မရှိပါ။
      </div>
    );
  }

  const rawPoly = (shapeCoords.length ? shapeCoords : coords.map(c => [c.lat, c.lng] as [number, number]));
  const poly = rawPoly.filter(p => Array.isArray(p) && isFinite(p[0]) && isFinite(p[1])) as [number, number][];

  if (!poly.length) {
    return (
      <div className="h-64 w-full glass p-4 rounded-2xl text-sm text-slate-400 flex items-center justify-center">
        No valid coordinates available. / မှန်ကန်သော ကိန်းဂဏန်းများ မရနိုင်ပါ။
      </div>
    );
  }

  const center = poly[Math.floor(poly.length / 2)];
  const displayCoords = showNearest && nearestStops.length > 0 ? nearestStops : coords;
  const displayPoly = showNearest && nearestStops.length > 0 
    ? nearestStops.map(c => [c.lat, c.lng] as [number, number])
    : poly;

  return (
    <div className="w-full rounded-2xl overflow-hidden border border-white/10 relative">

      {/* Mobile Bottom Sheet for Nearest Stops */}
      {showNearest && nearestStops.length > 0 && (
        <>
          {/* Mobile Bottom Sheet */}
          <div className="md:hidden absolute bottom-0 left-0 right-0 z-[1000] glass border-t border-white/10 rounded-t-3xl max-h-[60vh] overflow-hidden">
            <div className="p-4 border-b border-white/10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                  <span className="text-sm font-bold text-slate-300">Nearest Stops / အနီးဆုံး မှတ်တိုင်များ</span>
                </div>
                <div className="w-8 h-1 bg-white/20 rounded-full"></div>
              </div>
            </div>
            <div className="p-4 space-y-3 max-h-[calc(60vh-80px)] overflow-y-auto">
              {nearestStops.slice(0, 5).map((stop, idx) => (
                <button
                  key={idx}
                  onClick={() => onNearestStopSelect?.(stop)}
                  className="w-full text-left p-4 rounded-xl hover:bg-white/10 transition-colors active:scale-95 border border-white/5"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-base font-bold text-slate-200 myanmar-font truncate">{stop.name_mm || stop.name_en}</span>
                    <span className="text-sm text-yellow-400 font-bold">{Math.round(stop.distance)}m</span>
                  </div>
                  {stop.id && <span className="text-xs text-slate-500">Stop #{stop.id}</span>}
                </button>
              ))}
              {userError && (
                <div className="mt-3 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-sm text-red-400">{userError}</div>
              )}
            </div>
          </div>

          {/* Desktop Overlay */}
          <div className="hidden md:block absolute bottom-4 left-4 z-[1000] glass p-4 rounded-2xl max-w-[280px]">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
              <span className="text-xs font-bold text-slate-300">Nearest Stops / အနီးဆုံး မှတ်တိုင်များ</span>
            </div>
            <div className="space-y-2 max-h-[150px] overflow-y-auto">
              {nearestStops.slice(0, 5).map((stop, idx) => (
                <button
                  key={idx}
                  onClick={() => onNearestStopSelect?.(stop)}
                  className="w-full text-left p-2 rounded-lg hover:bg-white/10 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-slate-200 myanmar-font truncate">{stop.name_mm || stop.name_en}</span>
                    <span className="text-xs text-yellow-400">{Math.round(stop.distance)}m</span>
                  </div>
                  {stop.id && <span className="text-[10px] text-slate-500">#{stop.id}</span>}
                </button>
              ))}
            </div>
            {userError && (
              <div className="mt-2 text-xs text-red-400">{userError}</div>
            )}
          </div>
        </>
      )}

      {/* Legend removed */}

      <MapContainer
        center={center}
        zoom={mapZoom}
        scrollWheelZoom
        style={{ height: window.innerWidth < 768 ? '60vh' : '320px', width: '100%' }}
        onZoomEnd={(e) => setMapZoom((e.target as any)._zoom)}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <MapController center={center} zoom={mapZoom} />
        
        {/* Route Polyline with color */}
        <Polyline 
          positions={displayPoly} 
          color={routeColor} 
          weight={4} 
          opacity={0.8}
        />
        
        {/* Stops with type-based icons */}
        {displayCoords.map((c, i) => (
          <Marker 
            key={`stop-${i}`} 
            position={[c.lat, c.lng]} 
            icon={createStopIcon(c.type || getStopType(i, displayCoords.length)) as any}
            eventHandlers={{
              click: () => onNearestStopSelect?.(c)
            }}
          >
            <Popup>
              <div className="min-w-[150px]">
                <div style={{ fontWeight: 700 }} className="text-slate-900">{c.name_mm || c.name_en}</div>
                <div className="text-[10px] text-slate-500 mt-1">#{c.id}</div>
                <div className="text-[10px] text-slate-400 mt-1 capitalize">{c.type || getStopType(i, displayCoords.length)}</div>
              </div>
            </Popup>
          </Marker>
        ))}
        
        {/* Live vehicles */}
        {vehicles.map(v => (
          <Marker 
            key={`veh-${v.id}`} 
            position={[v.lat, v.lng]} 
            icon={busIcon as any}
          >
            <Popup>
              <div style={{ fontWeight: 700 }} className="text-slate-900">Bus {v.busId}</div>
              <div className="text-[10px] text-slate-500">Live / အသက်ဝင်</div>
            </Popup>
          </Marker>
        ))}
        
        {/* User location (rendered as a bus-style icon for parity) */}
        {userLocation && (
          <Marker position={[userLocation.lat, userLocation.lng]} icon={userBusIcon as any}>
            <Popup>
              <div style={{ fontWeight: 700 }} className="text-slate-900">You are here / သင့်တည်နေရာ</div>
              <div className="text-[10px] text-slate-500">Device location shown as a bus icon</div>
            </Popup>
          </Marker>
        )}
        
        {/* User location accuracy circle */}
        {userLocation && (
          <Circle 
            center={[userLocation.lat, userLocation.lng]} 
            radius={20} 
            pathOptions={{ color: '#22c55e', fillColor: '#22c55e', fillOpacity: 0.1, weight: 1 }}
          />
        )}
      </MapContainer>
    </div>
  );
};

export default BusMap;

