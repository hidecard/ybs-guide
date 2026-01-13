import React, { useEffect, useMemo, useState } from 'react';
import { MapContainer, TileLayer, Polyline, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { YBS_ROUTES } from '../data/busData';

type RouteShape = { id: string; color?: string; coords: [number, number][] };

const MapPage: React.FC = () => {
  const [shapes, setShapes] = useState<RouteShape[]>([]);
  const [visible, setVisible] = useState<Record<string, boolean>>({});

  useEffect(() => {
    let mounted = true;
    const ids = YBS_ROUTES.map(r => r.id);
    Promise.all(ids.map(id => fetch(`/data/routes/route${id}.json`).then(r => r.ok ? r.json() : null).catch(() => null))).then(results => {
      if (!mounted) return;
      const out: RouteShape[] = [];
      results.forEach((j, i) => {
        if (!j) return;
        const coordsArr: any[] = j?.shape?.geometry?.coordinates || j?.geometry?.coordinates || [];
        const converted = coordsArr.map((p: any[]) => [parseFloat(p[1]), parseFloat(p[0])]);
        if (converted.length) out.push({ id: String(ids[i]), color: (j.color && `#${j.color}`) || undefined, coords: converted });
      });
      setShapes(out);
      const vis: Record<string, boolean> = {};
      out.forEach(s => { vis[s.id] = true; });
      setVisible(vis);
    });
    return () => { mounted = false; };
  }, []);

  const center = useMemo(() => {
    // default Yangon-ish center
    return [16.86, 96.19] as [number, number];
  }, []);

  const toggle = (id: string) => setVisible(v => ({ ...v, [id]: !v[id] }));

  const routeColor = (r: RouteShape) => r.color || '#f6e05e';

  return (
    <div className="animate-fadeIn">
      <div className="flex gap-6">
        <aside className="w-64 glass p-4 rounded-2xl border border-white/10 max-h-[80vh] overflow-y-auto">
          <h3 className="font-black uppercase text-sm">Routes</h3>
          <div className="mt-4 space-y-2">
            {shapes.map(s => (
              <div key={s.id} className="flex items-center justify-between">
                <label className="flex items-center gap-3 text-sm">
                  <input type="checkbox" checked={!!visible[s.id]} onChange={() => toggle(s.id)} />
                  <span className="font-bold">Line {s.id}</span>
                </label>
                <div style={{ width: 18, height: 10, background: routeColor(s), borderRadius: 4 }} />
              </div>
            ))}
          </div>
        </aside>

        <div className="flex-1 rounded-2xl overflow-hidden border border-white/10">
          <MapContainer center={center} zoom={12} style={{ height: '80vh', width: '100%' }}>
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            {shapes.map(s => visible[s.id] && (
              <Polyline key={s.id} positions={s.coords} color={routeColor(s)} weight={3} opacity={0.8} />
            ))}
            {shapes.map(s => visible[s.id] && s.coords.length > 0 && (
              <Marker key={`m-${s.id}`} position={s.coords[Math.floor(s.coords.length/2)] as [number, number]}>
                <Popup>Line {s.id}</Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
      </div>
    </div>
  );
};

export default MapPage;
