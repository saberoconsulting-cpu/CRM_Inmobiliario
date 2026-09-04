'use client';
// src/components/interactive-plan/InteractivePlan.tsx
import { useEffect, useRef, useState } from 'react';
import { Block, Lot, Point, LOT_STATUS_COLOR, LOT_STATUS_LABEL, formatMoney, pointsToString } from '@/lib/types';

interface Props {
  imageUrl?: string | null;
  blocks: Block[];
  lots: Lot[];
  imageW: number;
  imageH: number;
  onBlockClick?: (block: Block) => void;
  onLotClick?: (lot: Lot) => void;
  highlightBlockId?: number | null;
  selectedLotId?: number | null;
  interactive?: boolean;
}

const SVG_W = 1000;
const SVG_H = 800;

export default function InteractivePlan({
  imageUrl, blocks, lots, imageW, imageH,
  onBlockClick, onLotClick, highlightBlockId, selectedLotId, interactive = true,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [t, setT] = useState({ x: 0, y: 0 });
  const [drag, setDrag] = useState<null | { sx: number; sy: number; ox: number; oy: number }>(null);
  const [tooltip, setTooltip] = useState<{ lot: Lot; x: number; y: number } | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const imgScale = Math.min(SVG_W / imageW, SVG_H / imageH);
  const imgW = imageW * imgScale;
  const imgH = imageH * imgScale;
  const imgOffsetX = (SVG_W - imgW) / 2;
  const imgOffsetY = (SVG_H - imgH) / 2;

  useEffect(() => {
    const fit = () => {
      const el = containerRef.current;
      if (!el) return;
      const cw = el.clientWidth || 800;
      const ch = el.clientHeight || 600;
      const s = Math.min(cw / SVG_W, ch / SVG_H);
      setScale(s);
      setT({ x: (cw - SVG_W * s) / 2, y: (ch - SVG_H * s) / 2 });
    };
    fit();
    window.addEventListener('resize', fit);
    return () => window.removeEventListener('resize', fit);
  }, []);

  function zoomAt(clientX: number, clientY: number, factor: number) {
    const rect = svgRef.current!.getBoundingClientRect();
    const px = clientX - rect.left;
    const py = clientY - rect.top;
    const next = Math.min(6, Math.max(0.4, scale * factor));
    const nx = px - ((px - t.x) / scale) * next;
    const ny = py - ((py - t.y) / scale) * next;
    setScale(next);
    setT({ x: nx, y: ny });
  }

  function onWheel(e: any) {
    zoomAt(e.clientX, e.clientY, e.deltaY > 0 ? 1 / 1.2 : 1.2);
  }

  function onPointerDown(e: any) {
    setDrag({ sx: e.clientX, sy: e.clientY, ox: t.x, oy: t.y });
    (e.currentTarget as Element).setPointerCapture?.(e.pointerId);
  }
  function onPointerMove(e: any) {
    if (drag) setT({ x: drag.ox + (e.clientX - drag.sx), y: drag.oy + (e.clientY - drag.sy) });
  }
  function onPointerUp() { setDrag(null); }

  const centroid = (pts: Point[]) =>
    pts.reduce((a, p) => ({ x: a.x + p.x / pts.length, y: a.y + p.y / pts.length }), { x: 0, y: 0 });

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full overflow-hidden rounded-lg select-none touch-none"
      style={{ aspectRatio: `${SVG_W}/${SVG_H}`, background: '#EEEFF1' }}
      onWheel={onWheel}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerLeave={() => { setDrag(null); setTooltip(null); }}
    >
      <svg
        ref={svgRef}
        className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing"
        viewBox={`${-t.x / scale} ${-t.y / scale} ${SVG_W / scale} ${SVG_H / scale}`}
      >
          {imageUrl && (
            <image href={imageUrl} x={imgOffsetX} y={imgOffsetY} width={imgW} height={imgH} preserveAspectRatio="xMidYMid meet" />
          )}

          {blocks.map((b) => {
            const hi = highlightBlockId === b.id;
            return (
              <polygon
                key={`b-${b.id}`}
                points={pointsToString(b.points)}
                fill={hi ? '#FCB7C0' : 'rgba(148,163,184,0.10)'}
                stroke={hi ? '#E30620' : '#CBD5E1'}
                strokeWidth={hi ? 3 : 1.2}
                style={{ cursor: interactive ? 'pointer' : 'default' }}
                onClick={(e) => { e.stopPropagation(); if (interactive && onBlockClick) onBlockClick(b); }}
              />
            );
          })}
          {blocks.map((b) => {
            const c = centroid(b.points);
            return (
              <text key={`bl-${b.id}`} x={c.x} y={c.y - 5} fontSize="26" fontWeight="700" textAnchor="middle" fill="#475569" opacity={0.9} style={{ pointerEvents: 'none' }}>
                {b.name}
              </text>
            );
          })}
          {lots.map((lot) => {
            const color = LOT_STATUS_COLOR[lot.status];
            const sel = selectedLotId === lot.id;
            const dim = highlightBlockId != null && lot.blockId !== highlightBlockId;
            return (
              <g key={`l-${lot.id}`} opacity={dim ? 0.15 : 1}>
                <polygon
                  points={pointsToString(lot.points)}
                  fill={color} fillOpacity={0.6}
                  stroke={sel ? '#171717' : color}
                  strokeWidth={sel ? 3 : 1.4}
                  style={{ cursor: interactive ? 'pointer' : 'default' }}
                  onMouseEnter={(e) => { setTooltip({ lot, x: lot.points[0].x, y: lot.points[0].y }); ((e.currentTarget) as any).style.fillOpacity = '0.85'; }}
                  onMouseLeave={(e) => { setTooltip(null); ((e.currentTarget) as any).style.fillOpacity = '0.6'; }}
                  onClick={(e) => { e.stopPropagation(); if (interactive && onLotClick) onLotClick(lot); }}
                />
                {(() => { const c = centroid(lot.points); return (
                  <text x={c.x} y={c.y + 4} fontSize="12" fontWeight="600" textAnchor="middle" fill="#0f172a" style={{ pointerEvents: 'none' }}>{lot.code}</text>
                ); })()}
              </g>
            );
          })}
          {tooltip && (
            <g pointerEvents="none">
              <rect x={tooltip.lot.points[0].x} y={tooltip.lot.points[0].y - 94} width={190} height={92} rx={8} fill="#0f172a" fillOpacity={0.96} />
              <text x={tooltip.lot.points[0].x + 10} y={tooltip.lot.points[0].y - 74} fontSize="13" fontWeight="700" fill="#fff">{tooltip.lot.code}</text>
              <text x={tooltip.lot.points[0].x + 10} y={tooltip.lot.points[0].y - 56} fontSize="11" fill="#cbd5e1">Área: {tooltip.lot.areaM2} m² · Manz {tooltip.lot.blockId ?? '-'}</text>
              <text x={tooltip.lot.points[0].x + 10} y={tooltip.lot.points[0].y - 40} fontSize="11" fill="#cbd5e1">{formatMoney(tooltip.lot.price)}</text>
              <text x={tooltip.lot.points[0].x + 10} y={tooltip.lot.points[0].y - 24} fontSize="11" fontWeight="700" fill={LOT_STATUS_COLOR[tooltip.lot.status]}>{LOT_STATUS_LABEL[tooltip.lot.status]}</text>
            </g>
          )}
        </svg>

        <div className="absolute top-3 right-3 flex flex-col gap-1.5">
          <button onClick={() => zoomAt(innerWidth / 2, innerHeight / 2, 1.2)} className="bg-white/90 hover:bg-white rounded-lg w-9 h-9 text-slate-700 shadow font-bold text-lg">+</button>
          <button onClick={() => zoomAt(innerWidth / 2, innerHeight / 2, 1 / 1.2)} className="bg-white/90 hover:bg-white rounded-lg w-9 h-9 text-slate-700 shadow font-bold text-lg">−</button>
          <button onClick={() => { const el = containerRef.current; if (el) { const cw = el.clientWidth || 800; const ch = el.clientHeight || 600; const s = Math.min(cw / SVG_W, ch / SVG_H); setScale(s); setT({ x: (cw - SVG_W * s) / 2, y: (ch - SVG_H * s) / 2 }); } }} className="bg-white/90 hover:bg-white rounded-lg w-9 h-9 text-slate-700 shadow font-semibold text-sm" title="Restablecer vista">⟳</button>
        </div>
      </div>
    );
  }
