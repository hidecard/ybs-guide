import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, Popup } from 'react-leaflet';
import L from 'leaflet';

type StopCoord = { lat: number; lng: number; name_en?: string; name_mm?: string; id?: string };

const defaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

const BusMap: React.FC<{ stops: string[]; busId?: string; stopIds?: number[] }> = ({ stops, busId, stopIds }) => {
  const [coords, setCoords] = useState<StopCoord[]>([]);
  const [shapeCoords, setShapeCoords] = useState<[number, number][]>([]);

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
          matched = stopIds.map(id => {
            const r = rowsById.get(String(id));
            if (r && r.lat && r.lng) return { lat: parseFloat(r.lat), lng: parseFloat(r.lng), name_en: r.name_en, name_mm: r.name_mm, id: r.id };
            return null;
          }).filter(Boolean) as StopCoord[];
        }

        if (!matched.length) {
          matched = stops.map(stopName => {
            const target = normalize(stopName);
            const exact = rows.find(r => normalize(r.name_mm) === target || normalize(r.name_en) === target);
            const fuzzy = rows.find(r => normalize(r.name_mm).includes(target) || normalize(r.name_en).includes(target) || target.includes(normalize(r.name_mm)));
            const row = exact || fuzzy || rowsByName.get(target);
            if (row && row.lat && row.lng) return { lat: parseFloat(row.lat), lng: parseFloat(row.lng), name_en: row.name_en, name_mm: row.name_mm, id: row.id };
            return null;
          }).filter(Boolean) as StopCoord[];
        }

        if (mounted) setCoords(matched);
      })
      .catch(() => {});
    return () => { mounted = false; };
  }, [stops]);

  useEffect(() => {
    if (!busId) return;
    let mounted = true;
    fetch(`/data/routes/route${busId}.json`)
      .then(r => r.json())
      .then((j: any) => {
        const coordsArr: any[] = j?.shape?.geometry?.coordinates || j?.geometry?.coordinates || [];
        // route files appear to store [lng, lat] pairs; convert to [lat, lng]
        const converted = coordsArr.map((p: any[]) => [parseFloat(p[1]), parseFloat(p[0])]);
        if (mounted) setShapeCoords(converted);
      })
      .catch(() => {});
    return () => { mounted = false; };
  }, [busId]);

  if (!coords.length && !shapeCoords.length) return (
    <div className="h-64 w-full glass p-4 rounded-2xl text-sm text-slate-400">No coordinates found for this route.</div>
  );

  const rawPoly = (shapeCoords.length ? shapeCoords : coords.map(c => [c.lat, c.lng] as [number, number]));
  const poly = rawPoly.filter(p => Array.isArray(p) && isFinite(p[0]) && isFinite(p[1])) as [number, number][];

  if (!poly.length) return (
    <div className="h-64 w-full glass p-4 rounded-2xl text-sm text-slate-400">No valid coordinates available for this route.</div>
  );

  const center = poly[Math.floor(poly.length / 2)];

  return (
    <div className="w-full rounded-2xl overflow-hidden border border-white/10">
      <MapContainer center={center} zoom={13} scrollWheelZoom style={{ height: 320, width: '100%' }}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <Polyline positions={poly} color="#f6e05e" weight={4} />
        {coords.map((c, i) => (
          <Marker key={i} position={[c.lat, c.lng]} icon={defaultIcon as any}>
            <Popup>
              <div style={{ fontWeight: 700 }}>{c.name_mm || c.name_en}</div>
              <div style={{ fontSize: 12 }}>{c.id}</div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};

export default BusMap;
