'use client';
// Mapa estable con MapLibre + tiles OpenStreetMap (style similar a Google Maps).
import { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import { Project } from '@/lib/types';

interface Props { projects: Project[]; onOpen: (id: number) => void; }

const TILE = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
const MA_STYLE: any = {
  version: 8,
  sources: {
    osm: { type: 'raster', tiles: [TILE], tileSize: 256, attribution: '© OpenStreetMap' }
  },
  layers: [
    { id: 'bg', type: 'background', paint: { 'background-color': '#f2efe9' } },
    { id: 'osm', type: 'raster', source: 'osm', minzoom: 0, maxzoom: 19 }
  ]
};

export default function ProjectsMap({ projects, onOpen }: Props) {
  const host = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markers = useRef<maplibregl.Marker[]>([]);

  useEffect(() => {
    if (!host.current || mapRef.current) return;
    try {
      const m = new maplibregl.Map({
        container: host.current,
        style: MA_STYLE,
        center: [-77.0369, -12.0464],
        zoom: 5
      });
      m.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-left');
      mapRef.current = m;
      m.on('load', () => { try { m.resize(); } catch {} draw(); });
      setTimeout(() => { try { mapRef.current?.resize(); draw(); } catch {} }, 900);
    } catch { /* tolerante */ }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { draw(); /* eslint-disable-next-line */ }, [projects]);

  function draw() {
    const m = mapRef.current;
    if (!m) return;
    markers.current.forEach((x) => { try { x.remove(); } catch {} });
    markers.current = [];
    const placed = (projects || []).filter((p) => Number(p.latitude) && Number(p.longitude));
    if (!placed.length) return;

    try {
      if (placed.length === 1) {
        m.flyTo({ center: [Number(placed[0].longitude), Number(placed[0].latitude)], zoom: 15 });
      } else {
        const bounds = new (maplibregl as any).LngLatBounds();
        placed.forEach((p) => bounds.extend([Number(p.longitude), Number(p.latitude)]));
        m.fitBounds(bounds, { padding: 60, maxZoom: 15 });
      }
    } catch {}

    placed.forEach((p) => {
      const el = document.createElement('div');
      el.style.cssText = 'display:flex;align-items:center;justify-content:center;width:38px;height:38px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);background:#E30620;border:3px solid #fff;box-shadow:0 1px 6px rgba(0,0,0,.4);cursor:pointer';
      const inner = document.createElement('span');
      inner.style.cssText = 'transform:rotate(45deg);font-size:14px;color:#fff;font-weight:800';
      inner.textContent = (p.name || 'P').charAt(0).toUpperCase();
      el.appendChild(inner);
      const pop = new maplibregl.Popup({ offset: 15, closeButton: true }).setHTML(
        `${p.coverImageUrl ? `<img src="${p.coverImageUrl}" style="width:150px;height:70px;object-fit:cover;border-radius:8px"/>` : ''}<div style="font-weight:800">${p.name}</div><div style="color:#777;font-size:12px">${p.location || ''}</div><a href="/projects/${p.id}" style="background:#E30620;color:#fff;padding:5px 10px;border-radius:6px;font-size:12px">Ver proyecto →</a>`
      );
      const mk = new maplibregl.Marker({ element: el }).setLngLat([Number(p.longitude), Number(p.latitude)]).setPopup(pop).addTo(m);
      markers.current.push(mk);
      const _ = onOpen; void _; void p;
    });
  }

  return (
    <div className="flex h-full min-h-[440px] gap-2">
      <div className="w-52 shrink-0 rounded-xl border bg-white p-2">
        <p className="px-1 pb-2 text-sm font-bold">Proyectos</p>
        {projects.length === 0 && <p className="px-1 text-xs text-slate-400">Sin proyectos</p>}
        {projects.map((p) => (
          <button key={p.id} onClick={() => onOpen(p.id)} className="mb-1 block w-full rounded-lg border px-2 py-2 text-left hover:bg-slate-50" style={{ borderColor: '#e5e7eb' }}>
            <div className="truncate font-semibold">{p.name}</div>
            <div className="truncate text-[11px] text-slate-500">{p.location || ''}</div>
          </button>
        ))}
      </div>
      <div className="relative min-w-0 flex-1 overflow-hidden rounded-xl border" style={{ borderColor: '#e5e7eb' }}>
        <div ref={host} className="absolute inset-0" />
      </div>
    </div>
  );
}
