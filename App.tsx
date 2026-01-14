
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { ViewMode, BusRoute } from './types';
import { YBS_ROUTES } from './data/busData';
import { getAIRouteSuggestion, chatWithAI, getDiscoveryInfo, cleanText } from './services/geminiService';
import { submitFeedback, fetchFeedback } from './services/supabaseService';
import BusMap from './components/BusMap';

const ITEMS_PER_PAGE = 12;

const NavItem: React.FC<{ 
  id: ViewMode; 
  active: boolean; 
  label: string; 
  labelMm: string;
  icon: string; 
  onClick: () => void 
}> = ({ id, active, label, labelMm, icon, onClick }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-3 px-5 py-4 rounded-2xl transition-all duration-300 relative group w-full ${
      active ? 'text-yellow-400' : 'text-slate-400 hover:text-slate-200'
    }`}
  >
    <div className={`transition-transform duration-300 ${active ? 'scale-110' : 'group-hover:scale-105'}`}>
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={icon} />
      </svg>
    </div>
    <div className="flex flex-col items-start leading-none">
      <span className="text-[10px] font-black tracking-widest uppercase">{label}</span>
      <span className="text-[11px] font-bold myanmar-font mt-1">{labelMm}</span>
    </div>
    {active && <div className="absolute left-0 w-1.5 h-8 bg-yellow-400 rounded-full glow-yellow"></div>}
  </button>
);

const RouteDetailModal: React.FC<{ bus: BusRoute; onClose: () => void; onRouteChange?: (bus: BusRoute) => void }> = ({ bus, onClose, onRouteChange }) => {
  const [routeStops, setRouteStops] = useState<string[] | null>(null);
  const [routeStopIds, setRouteStopIds] = useState<number[] | null>(null);
  const [liveEnabled, setLiveEnabled] = useState(false);

  useEffect(() => {
    let mounted = true;
    // Try to load route JSON to get ordered stop IDs and prefer that
    fetch(`/data/routes/route${bus.id}.json`).then(r => r.json()).then((j: any) => {
      if (!mounted) return;
      const ids = Array.isArray(j?.stops) ? j.stops.map((s: any) => Number(s)).filter(n => !isNaN(n)) : null;
      setRouteStopIds(ids || null);
      // if we have ids, load stops.tsv to map ids to display names
      if (ids && ids.length) {
        fetch('/data/stops.tsv').then(r => r.text()).then(text => {
          const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
          if (!lines.length) return;
          const headers = lines[0].split('\t').map(h => h.trim());
          const rows = lines.slice(1).map(line => {
            const cols = line.split('\t');
            const obj: any = {};
            headers.forEach((h, i) => { obj[h] = cols[i]; });
            return obj;
          });
          const byId = new Map(rows.map((r: any) => [String(r.id), r]));
          const mapped = ids.map((id: number) => {
            const r = byId.get(String(id));
            return r ? (r.name_mm || r.name_en || String(id)) : String(id);
          });
          setRouteStops(mapped);
        }).catch(() => {
          setRouteStops(null);
        });
      } else {
        setRouteStops(null);
      }
    }).catch(() => {
      setRouteStops(null);
      setRouteStopIds(null);
    });
    return () => { mounted = false; };
  }, [bus.id]);

  const displayStops = routeStops || bus.stops;

  return (
    <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fadeIn">
      <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-xl" onClick={onClose}></div>
      <div className="relative w-full sm:max-w-lg md:max-w-2xl lg:max-w-4xl xl:max-w-5xl h-full sm:h-auto sm:max-h-[95vh] glass sm:rounded-[40px] border-t sm:border border-white/20 shadow-2xl flex flex-col overflow-hidden">
        {/* Mobile Header with Drag Handle */}
        <div className="md:hidden flex justify-center pt-4 pb-2">
          <div className="w-12 h-1.5 bg-white/30 rounded-full"></div>
        </div>

        <div className="p-4 md:p-6 border-b border-white/10 flex justify-between items-center bg-white/5">
          <div className="flex items-center gap-3 md:gap-4">
            <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl flex items-center justify-center text-white font-black text-xl md:text-2xl shadow-xl border border-white/10" style={{ backgroundColor: bus.color || '#3b82f6' }}>
              {bus.id}
            </div>
            <div>
              <h3 className="font-black text-white uppercase tracking-tight italic text-lg md:text-xl">LINE {bus.id} | လိုင်း {bus.id}</h3>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">{bus.operator || 'Yangon Bus Service'}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Route Switcher */}
            {onRouteChange && (
              <div className="flex items-center gap-1 mr-2">
                <button
                  onClick={() => {
                    const currentIndex = YBS_ROUTES.findIndex(r => r.id === bus.id);
                    const prevIndex = currentIndex > 0 ? currentIndex - 1 : YBS_ROUTES.length - 1;
                    onRouteChange(YBS_ROUTES[prevIndex]);
                  }}
                  className="p-2 bg-white/5 rounded-xl text-slate-400 hover:text-yellow-400 transition-colors border border-white/10 active:scale-95"
                  title="Previous Route"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <span className="text-xs text-slate-500 px-2">{YBS_ROUTES.findIndex(r => r.id === bus.id) + 1} / {YBS_ROUTES.length}</span>
                <button
                  onClick={() => {
                    const currentIndex = YBS_ROUTES.findIndex(r => r.id === bus.id);
                    const nextIndex = currentIndex < YBS_ROUTES.length - 1 ? currentIndex + 1 : 0;
                    onRouteChange(YBS_ROUTES[nextIndex]);
                  }}
                  className="p-2 bg-white/5 rounded-xl text-slate-400 hover:text-yellow-400 transition-colors border border-white/10 active:scale-95"
                  title="Next Route"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            )}
            <button onClick={onClose} className="p-3 bg-white/5 rounded-2xl text-slate-400 hover:bg-white/10 transition-colors border border-white/10 active:scale-95">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
        </div>

        {/* Fixed Map Section */}
        <div className="flex-shrink-0 bg-slate-950/95 backdrop-blur-xl border-b border-white/10">
          <div className="p-3 sm:p-4 md:p-6 lg:p-8">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <div className="text-xs sm:text-sm font-bold text-slate-300">Map / မြေပုံ</div>
              <div className="flex items-center gap-2 sm:gap-3">
                <label className="text-[10px] sm:text-xs text-slate-400">Live</label>
                <button onClick={() => setLiveEnabled(prev => !prev)} className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-full text-xs sm:text-sm font-bold transition-all active:scale-95 ${liveEnabled ? 'bg-yellow-400 text-slate-900 shadow-lg' : 'bg-white/5 text-slate-300 border border-white/10'}`}>
                  {liveEnabled ? 'On' : 'Off'}
                </button>
              </div>
            </div>
            <div className="h-48 sm:h-56 md:h-64 lg:h-72 xl:h-80 rounded-xl overflow-hidden border border-white/10">
              <BusMap stops={displayStops} busId={bus.id} stopIds={routeStopIds || undefined} live={liveEnabled} />
            </div>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="p-4 md:p-8 space-y-6">
            {/* Route Stops Timeline */}
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <div className="text-sm font-bold text-slate-300">Route Stops / ရပ်နားများ</div>
              <div className="text-xs text-slate-500">{displayStops.length} stops</div>
            </div>
            <div className="absolute left-[15px] top-12 bottom-2 w-0.5 bg-gradient-to-b from-yellow-400 via-slate-700 to-yellow-400 opacity-30"></div>
            <div className="space-y-4 md:space-y-6">
              {displayStops.map((stop, idx) => (
                <div key={idx} className="flex items-start gap-4 md:gap-6 group">
                  <div className={`relative z-10 w-8 h-8 md:w-8 md:h-8 rounded-full border-2 flex items-center justify-center transition-all ${
                    idx === 0 || idx === displayStops.length - 1 ? 'border-yellow-400 bg-yellow-400/20' : 'border-slate-700 bg-slate-900'
                  }`}>
                    <div className={`w-2.5 h-2.5 rounded-full ${idx === 0 || idx === displayStops.length - 1 ? 'bg-yellow-400 glow-yellow' : 'bg-slate-500'}`}></div>
                  </div>
                  <div className="flex-1 pt-0.5 min-h-[44px] flex items-center">
                    <span className={`myanmar-font text-base md:text-base font-bold transition-colors ${
                      idx === 0 || idx === displayStops.length - 1 ? 'text-yellow-400' : 'text-slate-300'
                    }`}>
                      {stop}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<ViewMode>(ViewMode.EXPLORE);
  const [mapSelectedRouteId, setMapSelectedRouteId] = useState<string | null>(null);
  const [savedTrips, setSavedTrips] = useState<{from: string, to: string}[]>(() => {
    const saved = localStorage.getItem('ybs_saved_trips');
    return saved ? JSON.parse(saved) : [];
  });

  const tabs = [
    { id: ViewMode.EXPLORE, label: 'Explore', labelMm: 'လေ့လာရန်', icon: 'M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 002 2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
    { id: ViewMode.ROUTE_FINDER, label: 'Finder', labelMm: 'ရှာဖွေရန်', icon: 'M13 10V3L4 14h7v7l9-11h-7z' },
    { id: ViewMode.BUS_LIST, label: 'Lines', labelMm: 'လိုင်းများ', icon: 'M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z' },
    // Map view removed
    { id: ViewMode.AI_ASSISTANT, label: 'Assistant', labelMm: 'အေအိုင်', icon: 'M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z' },
    { id: ViewMode.FEEDBACK, label: 'Feedback', labelMm: 'အကြံပြုချက်', icon: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z' },
  ];

  const handleSaveTrip = (trip: {from: string, to: string}) => {
    const newSaved = [trip, ...savedTrips.filter(t => t.from !== trip.from || t.to !== trip.to)].slice(0, 5);
    setSavedTrips(newSaved);
    localStorage.setItem('ybs_saved_trips', JSON.stringify(newSaved));
  };

  const showOnMap = (id: string) => {
    setMapSelectedRouteId(String(id));
    // Map page removed — show bus list instead
    setActiveView(ViewMode.BUS_LIST);
  };

  const renderContent = () => {
    switch (activeView) {
      case ViewMode.EXPLORE: return <ExploreDashboard savedTrips={savedTrips} onSelectSaved={(t) => { localStorage.setItem('ybs_prefill_trip', JSON.stringify(t)); setActiveView(ViewMode.ROUTE_FINDER); }} onShowOnMap={showOnMap} onUseStop={(stopName: string) => { localStorage.setItem('ybs_nearest_from', stopName); setActiveView(ViewMode.ROUTE_FINDER); }} />;
      case ViewMode.BUS_LIST: return <BusList onShowOnMap={showOnMap} />;
      case ViewMode.ROUTE_FINDER: return <RouteFinder onTripSearched={handleSaveTrip} onShowOnMap={showOnMap} />;
      case ViewMode.AI_ASSISTANT: return <AIAssistant />;
      case ViewMode.FEEDBACK: return <Feedback />;
      default: return <ExploreDashboard savedTrips={savedTrips} onSelectSaved={() => {}} onShowOnMap={showOnMap} onUseStop={() => {}} />;
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-slate-950">
      <aside className="hidden lg:flex flex-col w-72 glass border-r border-white/5 p-6 space-y-8 z-30">
        <div className="flex items-center gap-3 px-2">
          <div className="bg-yellow-400 p-2 rounded-xl text-slate-950 glow-yellow">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div className="flex flex-col leading-tight">
            <h1 className="text-xl font-black tracking-tighter uppercase">YBS <span className="text-yellow-400">Ai</span></h1>
            <span className="text-[10px] font-bold myanmar-font text-slate-500 uppercase tracking-widest leading-none mt-1">Intelligent Hub</span>
          </div>
        </div>
        <nav className="flex-1 space-y-2">
          {tabs.map(tab => (
            <NavItem key={tab.id} id={tab.id as any} label={tab.label} labelMm={tab.labelMm} icon={tab.icon} active={activeView === tab.id} onClick={() => setActiveView(tab.id as any)} />
          ))}
        </nav>
      </aside>

      <div className="flex-1 flex flex-col relative overflow-hidden">
        <header className="lg:hidden glass border-b border-white/5 p-5 flex justify-between items-center z-30">
          <div className="flex items-center gap-2">
            <div className="bg-yellow-400 p-1.5 rounded-lg text-slate-950 shadow-lg">
               <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
            </div>
            <div className="flex flex-col leading-none">
              <span className="font-black text-sm uppercase tracking-tight">YBS Ai</span>
              <span className="text-[9px] myanmar-font font-bold text-slate-500 mt-0.5">Transit Intelligence / ဗဟိုချက်</span>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto custom-scrollbar bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-slate-950 pb-24 lg:pb-0">
          <div className="p-4 md:p-10 max-w-6xl mx-auto">
            {renderContent()}
          </div>
        </main>

        <nav className="lg:hidden fixed bottom-6 left-6 right-6 h-20 glass border border-white/10 rounded-3xl flex items-center justify-around px-2 z-[50] shadow-2xl">
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveView(tab.id as any)} className={`flex flex-col items-center gap-1 transition-all ${activeView === tab.id ? 'text-yellow-400' : 'text-slate-500'}`}>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={tab.icon} /></svg>
              <span className="text-[8px] font-black uppercase tracking-widest leading-none">{tab.label}</span>
              <span className="text-[9px] myanmar-font font-bold leading-none">{tab.labelMm}</span>
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
};

const ExploreDashboard: React.FC<{savedTrips: {from: string, to: string}[], onSelectSaved: (trip: {from: string, to: string}) => void; onShowOnMap?: (id:string) => void; onUseStop?: (stopName:string) => void}> = ({savedTrips, onSelectSaved, onShowOnMap, onUseStop}) => {
  const [discovery, setDiscovery] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [findingNearest, setFindingNearest] = useState(false);
  const [nearestError, setNearestError] = useState<string | null>(null);
  const [nearestResults, setNearestResults] = useState<any[] | null>(null);

  useEffect(() => {
    getDiscoveryInfo().then(res => {
      setDiscovery(res);
      setLoading(false);
    });
  }, []);

  const haversineKm = (lat1:number, lon1:number, lat2:number, lon2:number) => {
    const toRad = Math.PI / 180;
    const dLat = (lat2 - lat1) * toRad;
    const dLon = (lon2 - lon1) * toRad;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(lat1*toRad) * Math.cos(lat2*toRad) * Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return 6371 * c;
  };

  const parseStopsTsv = (text: string) => {
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
    if (!lines.length) return [];
    const headers = lines[0].split('\t').map(h => h.trim());
    const rows = lines.slice(1).map(line => {
      const cols = line.split('\t');
      const obj: any = {};
      headers.forEach((h,i) => { obj[h] = cols[i]; });
      return obj;
    });
    return rows;
  };

  const findNearest = () => {
    if (!navigator.geolocation) {
      setNearestError('Geolocation not available in this browser.');
      return;
    }
    setNearestError(null);
    setFindingNearest(true);
    navigator.geolocation.getCurrentPosition(async (pos) => {
      try {
        const { latitude, longitude } = pos.coords;
        const t = await fetch('/data/stops.tsv').then(r => r.text());
        const stops = parseStopsTsv(t);
        const mapped = stops.map((s:any) => ({
          id: s.id,
          lat: parseFloat(s.lat || s.lat || 0),
          lng: parseFloat(s.lng || s.lng || 0),
          name_en: s.name_en || '',
          name_mm: s.name_mm || '',
          distance: 0
        })).filter(s => !isNaN(s.lat) && !isNaN(s.lng));
        mapped.forEach(m => {
          m.distance = haversineKm(latitude, longitude, m.lat, m.lng);
        });
        mapped.sort((a,b) => a.distance - b.distance);
        const top = mapped.slice(0, 5);
        // match routes
        const results = top.map(s => {
          const nameEn = String(s.name_en || '').toLowerCase();
          const nameMm = String(s.name_mm || '').toLowerCase();
          const routes = YBS_ROUTES.filter(r => r.stops.some((st:string) => {
            const stl = st.toLowerCase();
            return (nameMm && stl.includes(nameMm)) || (nameEn && stl.includes(nameEn));
          })).map(r => r.id);
          return { ...s, routes };
        });
        setNearestResults(results);
      } catch (err:any) {
        setNearestError('Failed to load stops data.');
        setNearestResults(null);
      } finally {
        setFindingNearest(false);
      }
    }, (err) => {
      setNearestError('Unable to get location: ' + (err?.message || 'permission denied'));
      setFindingNearest(false);
    }, { enableHighAccuracy: true, timeout: 10000 });
  };

  return (
    <div className="space-y-12 animate-fadeIn">
      <div className="space-y-10">
        {/* Unified Discovery Advisory Panel */}
        <div className="glass p-8 md:p-12 rounded-[48px] border border-white/10 relative overflow-hidden group bg-slate-900/40">
          <div className="absolute top-0 right-0 p-12 opacity-5 group-hover:scale-110 transition-transform">
             <svg className="w-48 h-48 text-yellow-400" fill="currentColor" viewBox="0 0 24 24"><path d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
          </div>
          <div className="flex items-center justify-between gap-4 flex-wrap relative z-10 mb-8 border-b border-white/5 pb-6">
            <div className="flex flex-col gap-2">
              <span className="text-[10px] font-black uppercase tracking-[0.4em] text-yellow-400">Transit Advisory / လမ်းညွှန်ချက်</span>
              <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tighter">Daily <span className="text-yellow-400">Telemetry</span></h2>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={findNearest} className="py-3 px-4 bg-yellow-400 text-slate-900 rounded-2xl font-black">{findingNearest ? 'Locating...' : 'Find Nearest Bus'}</button>
            </div>
          </div>
          
          <div className="relative z-10">
            {loading ? (
              <div className="space-y-8">
                <div className="h-16 loading-shimmer rounded-3xl"></div>
                <div className="h-96 loading-shimmer rounded-3xl opacity-30"></div>
              </div>
            ) : (
              <div className="myanmar-font text-base md:text-lg font-bold text-slate-200 whitespace-pre-wrap leading-relaxed space-y-8 pr-2 max-h-[70vh] overflow-y-auto no-scrollbar">
                {discovery}
              </div>
            )}
          </div>
          {nearestError && (
            <div className="mt-6 glass p-4 rounded-2xl text-sm text-red-300">{nearestError}</div>
          )}

          {nearestResults && (
            <div className="mt-6 space-y-4">
              <h3 className="text-sm font-black uppercase tracking-widest text-yellow-400">Nearest Stops / အနီးဆုံး ရပ်နားများ</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {nearestResults.map((r, i) => (
                  <div key={i} className="glass p-4 rounded-2xl flex items-center justify-between">
                    <div>
                      <div className="font-bold text-white myanmar-font">{r.name_mm || r.name_en}</div>
                      <div className="text-xs text-slate-400">{(r.distance||0).toFixed(2)} km • Routes: {r.routes && r.routes.length ? r.routes.slice(0,6).join(', ') : '—'}</div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <button onClick={() => { onUseStop?.(r.name_mm || r.name_en); }} className="py-2 px-3 bg-yellow-400 rounded-xl font-black text-slate-900 text-xs">Which bus to take?</button>
                      <button onClick={() => { if (r.routes && r.routes[0]) onShowOnMap?.(String(r.routes[0])); }} className="py-2 px-3 bg-white/5 rounded-xl text-xs">Show route</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Remini Section (History) */}
        <div className="space-y-4">
           <h3 className="text-xs font-black uppercase tracking-widest text-slate-500 ml-4 flex items-center gap-2">
             <span className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.6)]"></span>
             Remini: Recent History / လတ်တလော မှတ်တမ်း
           </h3>
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
             {savedTrips.length > 0 ? savedTrips.map((trip, i) => (
               <button 
                 key={i} 
                 onClick={() => onSelectSaved(trip)}
                 className="glass p-6 rounded-[32px] hover:border-yellow-400/50 transition-all group flex items-center justify-between bg-white/5 border border-white/5"
               >
                 <div className="text-left">
                   <div className="flex items-center gap-3 mb-2">
                      <div className="w-2 h-2 rounded-full bg-yellow-400 glow-yellow"></div>
                      <span className="myanmar-font text-sm font-bold truncate max-w-[150px]">{trip.from}</span>
                   </div>
                   <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full border border-yellow-400"></div>
                      <span className="myanmar-font text-sm font-bold truncate max-w-[150px]">{trip.to}</span>
                   </div>
                 </div>
                 <div className="p-3 bg-white/5 rounded-2xl opacity-40 group-hover:opacity-100 transition-all">
                    <svg className="w-6 h-6 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                 </div>
               </button>
             )) : (
               <div className="col-span-full glass p-12 rounded-[48px] text-center opacity-30 border-dashed border-white/10 flex flex-col items-center gap-4">
                  <p className="text-[10px] font-black uppercase tracking-widest">Logs Clear / မှတ်တမ်းမရှိသေးပါ။</p>
               </div>
             )}
           </div>
        </div>
      </div>
    </div>
  );
};

const RouteFinder: React.FC<{onTripSearched?: (trip: {from: string, to: string}) => void; onShowOnMap?: (id: string) => void}> = ({onTripSearched, onShowOnMap}) => {
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [results, setResults] = useState<BusRoute[]>([]);
  const [aiResult, setAiResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedBus, setSelectedBus] = useState<BusRoute | null>(null);

  useEffect(() => {
    // First check if a saved trip was requested to prefill
    const preTrip = localStorage.getItem('ybs_prefill_trip');
    if (preTrip) {
      try {
        const obj = JSON.parse(preTrip);
        if (obj?.from) setFrom(obj.from);
        if (obj?.to) setTo(obj.to);
      } catch (e) {}
      localStorage.removeItem('ybs_prefill_trip');
      return;
    }

    const pre = localStorage.getItem('ybs_nearest_from');
    if (pre) {
      setFrom(pre);
      localStorage.removeItem('ybs_nearest_from');
    }
  }, []);

  const handleSearch = async () => {
    if (!from || !to) return;
    setLoading(true);
    setAiResult(null);
    onTripSearched?.({from, to});

    const f = from.toLowerCase().trim();
    const t = to.toLowerCase().trim();
    const direct = YBS_ROUTES.filter(route => {
      const fromIndex = route.stops.findIndex(s => s.toLowerCase().includes(f));
      const toIndex = route.stops.findIndex(s => s.toLowerCase().includes(t));
      return fromIndex !== -1 && toIndex !== -1 && fromIndex < toIndex;
    });
    setResults(direct);

    const aiSuggestion = await getAIRouteSuggestion(from, to);
    setAiResult(aiSuggestion);
    setLoading(false);
  };

  const handleRouteChange = (newBus: BusRoute) => {
    setSelectedBus(newBus);
  };

  return (
    <div className="space-y-12 animate-fadeIn">
      {selectedBus && <RouteDetailModal bus={selectedBus} onClose={() => setSelectedBus(null)} onRouteChange={handleRouteChange} />}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-10">
        <div className="xl:col-span-2 space-y-8">
          <div className="space-y-2">
            <h2 className="text-4xl font-black tracking-tight uppercase leading-none">Path <span className="text-yellow-400">Finder</span></h2>
            <h3 className="myanmar-font text-2xl font-bold text-slate-300">လမ်းကြောင်း ရှာဖွေပါ</h3>
          </div>
          <div className="space-y-4">
            <div className="group bg-white/5 border border-white/10 p-6 rounded-3xl focus-within:border-yellow-400/50 transition-all">
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Origin / အစမှတ်</label>
              <div className="flex items-center gap-3">
                <div className="w-2.5 h-2.5 rounded-full bg-yellow-400 glow-yellow"></div>
                <input type="text" placeholder="Start Point..." className="bg-transparent border-none outline-none w-full text-lg font-bold myanmar-font text-white" value={from} onChange={(e) => setFrom(e.target.value)} />
              </div>
            </div>
            <div className="flex justify-center -my-6 relative z-10">
               <button onClick={() => { const tmp = from; setFrom(to); setTo(tmp); }} className="bg-slate-900 border border-white/10 p-3 rounded-xl hover:text-yellow-400 transition-all shadow-xl"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" /></svg></button>
            </div>
            <div className="group bg-white/5 border border-white/10 p-6 rounded-3xl focus-within:border-yellow-400/50 transition-all">
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Destination / အဆုံးမှတ်</label>
              <div className="flex items-center gap-3">
                <div className="w-2.5 h-2.5 rounded-full border-2 border-yellow-400"></div>
                <input type="text" placeholder="Destination..." className="bg-transparent border-none outline-none w-full text-lg font-bold myanmar-font text-white" value={to} onChange={(e) => setTo(e.target.value)} />
              </div>
            </div>
            <button onClick={handleSearch} disabled={loading} className="w-full bg-yellow-400 text-slate-950 py-5 rounded-3xl font-black uppercase tracking-widest text-sm hover:brightness-110 active:scale-95 transition-all shadow-xl shadow-yellow-400/20">
              {loading ? 'Analyzing Data...' : 'Calculate Path / လမ်းကြောင်းရှာရန်'}
            </button>
          </div>
        </div>

        <div className="xl:col-span-3 space-y-6">
          {loading ? (
             <div className="space-y-4">{[1,2,3].map(i => <div key={i} className="h-32 glass rounded-3xl loading-shimmer"></div>)}</div>
          ) : results.length > 0 || aiResult ? (
            <div className="space-y-6">
              {aiResult && (
                <div className="glass-bright p-8 rounded-[40px] border border-white/10 space-y-6 relative bg-slate-900/40">
                  <div className="flex items-center gap-3"><div className="h-0.5 w-10 bg-yellow-400"></div><span className="text-[10px] font-black tracking-widest uppercase text-yellow-400">AI Telemetry / အေအိုင် အကြံပြုချက်</span></div>
                  <div className="text-lg myanmar-font font-semibold text-slate-200 whitespace-pre-wrap leading-relaxed">{aiResult}</div>
                </div>
              )}
              <div className="grid grid-cols-1 gap-4">
                {results.map(bus => (
                  <div key={bus.id} className="glass p-6 rounded-3xl group hover:border-yellow-400/40 transition-all flex items-center justify-between bg-white/5">
                    <div className="flex items-center gap-6">
                      <button onClick={() => onShowOnMap?.(bus.id)} className="w-16 h-16 rounded-2xl flex items-center justify-center text-white font-black text-3xl shadow-lg" style={{ backgroundColor: bus.color || '#3b82f6' }}>{bus.id}</button>
                      <div>
                        <h4 className="font-bold text-slate-100 uppercase">Bus {bus.id}</h4>
                        <p className="text-xs text-slate-500 myanmar-font mt-1 truncate max-w-[200px]">{bus.stops[0]} ⇄ {bus.stops[bus.stops.length-1]}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => setSelectedBus(bus)} className="text-yellow-400 p-4 rounded-2xl bg-white/5 hover:bg-yellow-400 hover:text-slate-950 transition-all"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg></button>
                      <button onClick={() => onShowOnMap?.(bus.id)} className="p-3 bg-white/5 rounded-2xl text-slate-300 hover:text-yellow-400 transition-colors border border-white/5">Show on map</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-20 glass rounded-[60px] border-dashed border-white/5 opacity-10">
               <h3 className="text-xl font-bold uppercase tracking-[0.3em] text-slate-800">Telemetry Ready</h3>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const BusList: React.FC<{ onShowOnMap?: (id: string) => void }> = ({ onShowOnMap }) => {
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedBus, setSelectedBus] = useState<BusRoute | null>(null);
  const filteredBuses = useMemo(() => YBS_ROUTES.filter(b => b.id.toLowerCase().includes(search.toLowerCase()) || b.stops.some(s => s.includes(search))), [search]);
  const paginatedBuses = useMemo(() => filteredBuses.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE), [filteredBuses, currentPage]);

  return (
    <div className="space-y-10 animate-fadeIn">
      {selectedBus && <RouteDetailModal bus={selectedBus} onClose={() => setSelectedBus(null)} onRouteChange={(newBus) => setSelectedBus(newBus)} />}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <h2 className="text-4xl font-black tracking-tight uppercase leading-none">System <span className="text-yellow-400">Inventory</span></h2>
          <h3 className="myanmar-font text-2xl font-bold text-slate-300">ယာဉ်လိုင်းများ စာရင်း</h3>
        </div>
        <div className="relative group w-full md:w-96">
          <input type="text" placeholder="Search lines... / ရှာဖွေပါ..." className="w-full glass-bright p-5 pl-12 rounded-2xl outline-none border border-white/10 focus:border-yellow-400/50 transition-all text-sm font-bold myanmar-font text-white" value={search} onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }} />
          <svg className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {paginatedBuses.map(bus => (
          <div key={bus.id} className="glass p-6 rounded-[32px] group hover:border-yellow-400/40 transition-all flex flex-col gap-6 bg-white/5 border border-white/5">
            <div className="flex justify-between items-start">
               <button onClick={() => onShowOnMap?.(bus.id)} className="w-14 h-14 rounded-2xl flex items-center justify-center text-white font-black text-2xl border border-white/10 shadow-lg" style={{ backgroundColor: bus.color || '#3b82f6' }}>{bus.id}</button>
               <span className="px-3 py-1 bg-white/5 rounded-lg text-[8px] font-black uppercase text-slate-500 border border-white/10">{bus.operator || 'YBS'}</span>
            </div>
            <div className="space-y-3">
              <h4 className="font-bold text-slate-100 uppercase tracking-wide text-xs">Route Overview / လမ်းကြောင်းအကျဉ်း</h4>
              <div className="space-y-2">
                 <div className="flex items-center gap-3 text-xs font-bold text-slate-400 myanmar-font"><div className="w-2 h-2 rounded-full bg-yellow-400"></div><span className="truncate">{bus.stops[0]}</span></div>
                 <div className="flex items-center gap-3 text-xs font-bold text-slate-400 myanmar-font"><div className="w-2 h-2 rounded-full border border-yellow-400"></div><span className="truncate">{bus.stops[bus.stops.length-1]}</span></div>
              </div>
            </div>
            <button onClick={() => setSelectedBus(bus)} className="w-full py-4 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 hover:text-yellow-400 hover:border-yellow-400/30 transition-all">View Full Path</button>
          </div>
        ))}
      </div>
      <div className="flex justify-center gap-4 py-10">
         <button disabled={currentPage === 1} onClick={() => setCurrentPage(prev => prev - 1)} className="p-4 glass rounded-2xl disabled:opacity-20 text-slate-300 hover:text-yellow-400 transition-colors border border-white/5"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M15 19l-7-7 7-7" /></svg></button>
         <div className="flex items-center px-6 glass rounded-2xl font-black text-xs tracking-widest text-slate-400 border border-white/5">{currentPage} / {Math.ceil(filteredBuses.length / ITEMS_PER_PAGE)}</div>
         <button disabled={currentPage === Math.ceil(filteredBuses.length / ITEMS_PER_PAGE)} onClick={() => setCurrentPage(prev => prev + 1)} className="p-4 glass rounded-2xl disabled:opacity-20 text-slate-300 hover:text-yellow-400 transition-colors border border-white/5"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 5l7 7-7 7" /></svg></button>
      </div>
    </div>
  );
};

const AIAssistant: React.FC = () => {
  const [messages, setMessages] = useState<{role: 'user' | 'ai', text: string}[]>([
    { role: 'ai', text: 'Neural system active. ကျွန်တော်က YBS AI အကူပါ။ ဘာများကူညီပေးရမလဲ? \n\nHello! I am YBS AI. Ask me about routes, weather, or YBS cards!' }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [puterAvailable, setPuterAvailable] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const checkPuter = () => {
      const p = (window as any).puter;
      if (typeof p !== 'undefined' && p?.ai) {
        setPuterAvailable(true);
      } else {
        setPuterAvailable(false);
      }
    };
    checkPuter();
    const interval = setInterval(checkPuter, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, isTyping]);

  const sendMessage = async () => {
    if (!input.trim() || isTyping) return;
    const userMsg = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsTyping(true);
    const response = await chatWithAI(userMsg);
    setMessages(prev => [...prev, { role: 'ai', text: response || 'Neural interface error. Try again. / စနစ်အတွင်း အမှားအယွင်းရှိနေပါသည်။' }]);
    setIsTyping(false);
  };

  return (
    <div className="max-w-4xl mx-auto flex flex-col h-[calc(100vh-160px)] animate-fadeIn">
      <div className="mb-8 space-y-1">
        <h2 className="text-3xl font-black uppercase tracking-tight">YBS <span className="text-yellow-400">Assistant</span></h2>
        <p className="text-[10px] font-black tracking-widest text-slate-500 uppercase flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span> Grounded Intelligence / အဆင့်မြင့် အချက်အလက်စနစ်
        </p>
        {!puterAvailable && (
          <div className="mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex flex-col gap-4">
            <p className="text-sm text-red-400 font-bold">Puter.js not loaded. Please allow popups for this site. / Puter.js မရှိပါ။ ဤဆိုက်အတွက် popup များကို ခွင့်ပြုပါ။</p>
            <button
              onClick={() => {
                const p = (window as any).puter;
                if (typeof p !== 'undefined' && p?.ui && p.ui.showTerms) {
                  p.ui.showTerms();
                } else if (p?.ai) {
                  p.ai.chat("Hello", { model: 'gemini-3-flash-preview' });
                }
              }}
              className="bg-yellow-400 text-slate-950 px-4 py-2 rounded-xl font-bold text-sm"
            >
              Enable AI / AI ဖွင့်ရန်
            </button>
          </div>
        )}
      </div>
      <div ref={scrollRef} className="flex-1 overflow-y-auto custom-scrollbar space-y-8 pr-4 mb-6 no-scrollbar">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`p-6 rounded-[32px] max-w-[85%] myanmar-font text-base font-medium leading-relaxed border border-white/5 transition-all ${
              m.role === 'user' ? 'bg-yellow-400 text-slate-950 rounded-tr-none border-yellow-300 font-bold shadow-xl shadow-yellow-400/10' : 'glass-bright text-slate-200 rounded-tl-none border-white/10 bg-slate-900/40'
            }`}>
              {m.text}
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex justify-start">
            <div className="glass-bright px-8 py-5 rounded-[32px] rounded-tl-none border border-white/10 flex items-center gap-4 bg-slate-900/40">
              <div className="flex gap-1.5"><div className="w-2 h-2 bg-yellow-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div><div className="w-2 h-2 bg-yellow-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div><div className="w-2 h-2 bg-yellow-400 rounded-full animate-bounce"></div></div>
            </div>
          </div>
        )}
      </div>
      <div className="glass p-3 rounded-[32px] border border-white/10 flex gap-3 focus-within:border-yellow-400/30 transition-all shadow-2xl relative z-[60] bg-slate-900/60">
        <input type="text" placeholder="Message YBS Ai assistant..." className="flex-1 bg-transparent border-none outline-none px-4 text-sm font-bold myanmar-font text-slate-100 placeholder:text-slate-700" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && sendMessage()} />
        <button onClick={sendMessage} disabled={isTyping} className="bg-yellow-400 text-slate-950 p-4 rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-lg shadow-yellow-400/20"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg></button>
      </div>
    </div>
  );
};

const Feedback: React.FC = () => {
  const [username, setUsername] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [feedbacks, setFeedbacks] = useState<any[]>([]);
  const [loadingFeedbacks, setLoadingFeedbacks] = useState(true);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    loadFeedbacks();
  }, []);

  const loadFeedbacks = async () => {
    setLoadingFeedbacks(true);
    const data = await fetchFeedback();
    setFeedbacks(data);
    setLoadingFeedbacks(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description) return;

    setLoading(true);
    const success = await submitFeedback(username, title, description);
    setLoading(false);

    if (success) {
      setUsername('');
      setTitle('');
      setDescription('');
      setShowSuccess(true);
      loadFeedbacks(); // Refresh the list
      // Hide success message after 5 seconds
      setTimeout(() => setShowSuccess(false), 5000);
    } else {
      alert('Failed to submit feedback. Please try again.');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-12 animate-fadeIn">
      <div className="space-y-2">
        <h2 className="text-4xl font-black tracking-tight uppercase leading-none">User <span className="text-yellow-400">Feedback</span></h2>
        <p className="myanmar-font text-2xl font-bold text-slate-300">အကြံပြုချက်များ ပေးပို့ပါ</p>
      </div>

      {/* Feedback Form */}
      <div className="glass p-8 rounded-[40px] border border-white/10 space-y-6">
        <div className="flex items-center gap-3">
          <div className="h-0.5 w-10 bg-yellow-400"></div>
          <span className="text-[10px] font-black tracking-widest uppercase text-yellow-400">Submit Feedback / အကြံပြုချက် ပေးပို့ရန်</span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="group bg-white/5 border border-white/10 p-6 rounded-3xl focus-within:border-yellow-400/50 transition-all">
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Name (Optional) / အမည် (မဖြစ်မနေ မလိုအပ်ပါ)</label>
              <input
                type="text"
                placeholder="Your name..."
                className="bg-transparent border-none outline-none w-full text-lg font-bold myanmar-font text-white placeholder:text-slate-500"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
            <div className="group bg-white/5 border border-white/10 p-6 rounded-3xl focus-within:border-yellow-400/50 transition-all">
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Title / ခေါင်းစဉ်</label>
              <input
                type="text"
                placeholder="Feedback title..."
                className="bg-transparent border-none outline-none w-full text-lg font-bold myanmar-font text-white placeholder:text-slate-500"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>
          </div>
          <div className="group bg-white/5 border border-white/10 p-6 rounded-3xl focus-within:border-yellow-400/50 transition-all">
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Description / အကြောင်းအရာ</label>
            <textarea
              placeholder="Your feedback..."
              rows={4}
              className="bg-transparent border-none outline-none w-full text-lg font-bold myanmar-font text-white placeholder:text-slate-500 resize-none"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-yellow-400 text-slate-950 py-5 rounded-3xl font-black uppercase tracking-widest text-sm hover:brightness-110 active:scale-95 transition-all shadow-xl shadow-yellow-400/20 disabled:opacity-50"
          >
            {loading ? 'Submitting...' : 'Submit Feedback / ပေးပို့ရန်'}
          </button>
        </form>
      </div>

      {/* Feedback List */}
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="h-0.5 w-10 bg-yellow-400"></div>
          <span className="text-[10px] font-black tracking-widest uppercase text-yellow-400">Recent Feedback / လတ်တလော အကြံပြုချက်များ</span>
        </div>

        {loadingFeedbacks ? (
          <div className="space-y-4">
            {[1,2,3].map(i => (
              <div key={i} className="glass p-6 rounded-3xl loading-shimmer"></div>
            ))}
          </div>
        ) : feedbacks.length > 0 ? (
          <div className="space-y-4">
            {feedbacks.map((feedback) => (
              <div key={feedback.id} className="glass p-6 rounded-3xl border border-white/10 space-y-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <h4 className="font-bold text-white text-lg">{feedback.title}</h4>
                    {feedback.username && (
                      <p className="text-sm text-slate-400">By {feedback.username}</p>
                    )}
                  </div>
                  <div className="text-xs text-slate-500">
                    {new Date(feedback.created_at).toLocaleDateString()}
                  </div>
                </div>
                <p className="text-slate-200 myanmar-font leading-relaxed">{feedback.description}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="glass p-12 rounded-[40px] text-center opacity-30 border-dashed border-white/10">
            <p className="text-lg font-bold uppercase tracking-widest text-slate-500">No feedback yet / အကြံပြုချက်မရှိသေးပါ</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
