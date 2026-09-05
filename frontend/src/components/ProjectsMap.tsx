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
const TILE_URL = 'https://tiles.openfreemap.org/styles/liberty'; // calles/OSM gratuitas

export default function ProjectsMap({ projects, onOpen }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);

  useEffect(() => {
    if (!ref.current || map.current) return;
    const m = new maplibregl.Map({
      container: ref.current,
      style: TILE_URL,
      center: DEFAULT_CENTER,
      zoom: 6,
      attributionControl: false,
    });
    m.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-left');
    map.current = m;
    return () => { map.current?.remove(); map.current = null; };
  }, []);

  useEffect(() => {
    const m = map.current;
    if (!m) return;
    // eliminar marcadores previos
    (m as any)._crmMarkers?.forEach((mk: maplibregl.Marker) => mk.remove());
    const markers: maplibregl.Marker[] = [];
    const geo: Project[] = projects.filter((p) => p.latitude != null && p.longitude != null);

    const content = (p: Project) => `
      <div style="min-width:220px; font-family:inherit">
        ${p.coverImageUrl ? `<img src="${p.coverImageUrl}" style="width:100%;height:96px;object-fit:cover;border-radius:10px" />` : '<div style="height:96px;background:#f3f4f6;border-radius:10px"></div>'}
        <div style="font-size:15px;font-weight:700;color:#171717;margin-top:8px">${p.name}</div>
        <div style="font-size:12px;color:#6b7280;margin:2px 0 8px">${p.location || ''}</div>
        <a href="/projects/${p.id}" style="display:inline-block;background:#E30620;color:#fff;padding:6px 12px;border-radius:8px;text-decoration:none;font-size:13px;font-weight:600">Ver proyecto y plano</a>
      </div>`;

    geo.forEach((p) => {
      const el = document.createElement('div');
      el.style.cssText = 'width:34px;height:34px;border-radius:50%;background:#E30620;border:3px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,.3);display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700;font-size:13px;cursor:pointer';
      el.textContent = String(p.name?.charAt(0) || 'P').toUpperCase();
      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([Number(p.longitude), Number(p.latitude)])
        .setPopup(new maplibregl.Popup({ offset: 30, closeButton: false }).setHTML(content(p)))
        .addTo(m);
      const popup = marker.getPopup();
      el.onclick = () => popup?.addTo(m);
      markers.push(marker);
    });

    (m as any)._crmMarkers = markers;
    if (geo.length > 0) {
      const bounds = new maplibregl.LngLatBounds();
      geo.forEach((p) => bounds.extend([Number(p.longitude), Number(p.latitude)]));
      m.fitBounds(bounds, { padding: 64, maxZoom: 12 });
    }
  }, [projects]);

  return <div ref={ref} className="w-full h-[72vh] rounded-2xl overflow-hidden border" style={{ borderColor: '#E5E7EB' }} />;
}