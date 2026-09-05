'use client';
// Mapa interactivo de proyectos (MapLibre + OpenStreetMap, sin API key)
import { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import { Project } from '@/lib/types';

interface Props {
  projects: Project[];
  onOpen: (id: number) => void;
}

const DEFAULT_CENTER: [number, number] = [-77.0369, -12.0464]; // Lima

const DEMO = 'https://demotiles.maplibre.org/style.json';

export default function ProjectsMap({ projects, onOpen }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);

  const renderMarkers = (m: maplibregl.Map) => {
    markersRef.current.forEach((mk) => mk.remove());
    markersRef.current = [];

    const geo = (projects || []).filter((p) => Number(p.latitude) && Number(p.longitude));
    const missing = (projects || []).filter((p) => !(Number(p.latitude) && Number(p.longitude)) && p.location);

    if (!geo.length && !missing.length) return;

    if (missing.length) {
      // Respaldo: dirección escrita -> geocode al vuelo (no modifica BD)
      missing.forEach((p) => {
        fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=pe&q=${encodeURIComponent(p.location || '')}`, { headers: { 'User-Agent': 'CRM-Inmobiliario/1.0 (web)' } })
          .then((r) => r.json())
          .then((list) => {
            const hit = Array.isArray(list) && list[0];
            if (!hit || !map.current) return;

            const el = document.createElement('div');
            el.style.cssText = 'width:32px;height:32px;border-radius:50%;background:#F59E0B;border:3px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,.3);display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700;font-size:13px;cursor:pointer';
            el.textContent = String(p.name?.charAt(0) || '').toUpperCase();
            const mk = new maplibregl.Marker({ element: el })
              .setLngLat([Number(hit.lon), Number(hit.lat)])
              .setPopup(new maplibregl.Popup({ offset: 30 }).setHTML(`<b>${p.name}</b><br/>${p.location}<br/><a href="/projects/${p.id}" style="color:#E30620">Ver</a>`))
              .addTo(map.current!);
            markersRef.current.push(mk);
            map.current!.flyTo({ center: [Number(hit.lon), Number(hit.lat)], zoom: 12 });
          })
          .catch(() => {});
      });
    }

    const content = (p: Project) => `
      <div style="min-width:220px; font-family:inherit">
        ${p.coverImageUrl ? `<img src="${p.coverImageUrl}" style="width:100%;height:96px;object-fit:cover;border-radius:10px" />` : '<div style="height:96px;background:#f3f4f6;border-radius:10px"></div>'}
        <div style="font-size:15px;font-weight:700;color:#171717;margin-top:8px">${p.name}</div>
        <div style="font-size:12px;color:#6b7280;margin:2px 0 8px">${p.location || ''}</div>
        <a href="/projects/${p.id}" style="display:inline-block;background:#E30620;color:#fff;padding:6px 12px;border-radius:8px;text-decoration:none;font-size:13px;font-weight:600">Ver proyecto y plano</a>
      </div>`;

    geo.forEach((p) => {
      const el = document.createElement('div');
      el.style.cssText = 'width:34px;height:34px;border-radius:50%;background:#E30620;border:3px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,.3);display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700;font-size:13px;cursor:pointer;z-index:2';
      el.textContent = String(p.name?.charAt(0) || 'P').toUpperCase();
      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([Number(p.longitude), Number(p.latitude)])
        .setPopup(new maplibregl.Popup({ offset: 30, closeButton: false }).setHTML(content(p)))
        .addTo(m);
      const popup = marker.getPopup();
      el.onclick = () => popup?.addTo(m);
      markersRef.current.push(marker);
    });

    if (geo.length > 1) {
      const bounds = new maplibregl.LngLatBounds();
      geo.forEach((p) => bounds.extend([Number(p.longitude), Number(p.latitude)]));
      m.fitBounds(bounds, { padding: 64, maxZoom: 12 });
    } else if (geo.length === 1) {
      m.flyTo({ center: [Number(geo[0].longitude), Number(geo[0].latitude)], zoom: 13 });
    }
  };

  useEffect(() => {
    if (!ref.current || map.current) return;
    const m = new maplibregl.Map({
      container: ref.current,
      style: DEMO,
      center: DEFAULT_CENTER,
      zoom: 5,
    });
    m.dragPan && m.setMaxZoom(18);
    m.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-left');
    m.on('load', () => { m.resize(); renderMarkers(m); });
    map.current = m;
    // Asegurar que los marcadores se dibujen aunque el estilo/tiles tarde en emitir "load".
    setTimeout(() => renderMarkers(m), 800);
    return () => { map.current?.remove(); map.current = null; markersRef.current = []; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const m = map.current;
    if (!m) return;
    if (m.loaded()) renderMarkers(m);
    else m.once('load', () => renderMarkers(m));
  }, [projects]);

  return (
    <div className="flex w-full h-full min-h-[420px] gap-2">
      {/* Lista lateral: proyectos siempre visibles para moverse/abrir */}
      <div className="w-56 shrink-0 rounded-xl border bg-white p-2 overflow-y-auto space-y-2" style={{ borderColor: '#E5E7EB' }}>
        {projects.length === 0 && <p className="text-xs text-slate-400 p-1">Sin proyectos</p>}
        {projects.map((p) => (
          <button key={p.id} onClick={() => onOpen(p.id)} className="w-full text-left rounded-lg p-2 hover:bg-slate-50 border" style={{ borderColor: '#F0F1F3' }}>
            <div className="text-sm font-semibold truncate">{p.name}</div>
            <div className="text-[11px] text-slate-500 truncate">{p.location || 'sin dirección'}</div>
            <div className="text-[10px] mt-1" style={{ color: Number(p.latitude) && Number(p.longitude) ? '#067a46' : '#b45309' }}>{Number(p.latitude) ? '✓ ubicación' : 'pendiente ubicación'}</div>
          </button>
        ))}
      </div>
      {/* Ventana de mapa */}
      <div className="relative flex-1 min-w-0 rounded-xl overflow-hidden border" style={{ borderColor: '#E5E7EB' }}>
        <div ref={ref} className="absolute inset-0" />
        {projects.length > 0 && !projects.some((p) => Number(p.latitude)) && (
          <p className="absolute bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-black/70 text-white text-[11px] px-3 py-1">Los proyectos sin lat/long se listan a la izquierda; edítalos para ubicarlos en el mapa.</p>
        )}
      </div>
    </div>
  );
}