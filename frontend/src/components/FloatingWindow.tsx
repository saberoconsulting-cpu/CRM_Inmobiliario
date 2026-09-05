'use client';
// Ventana flotante arrastrable estilo Windows (mantiene z-index/z superior según apertura)
import { ReactNode, useEffect, useRef, useState } from 'react';

interface Props {
  title: string;
  onClose: () => void;
  bringToFront: () => void;
  focused: boolean;
  children: ReactNode;
  width?: number;
  x: number;
  y: number;
  setPos: (p: { x: number; y: number }) => void;
}

export default function FloatingWindow({ title, onClose, bringToFront, focused, children, width = 620, x, y, setPos }: Props) {
  const drag = useRef<{ dx: number; dy: number } | null>(null);
  return (
    <div
      className="fixed z-40 bg-white rounded-xl border shadow-2xl flex flex-col overflow-hidden"
      style={{ left: x, top: y, width, zIndex: focused ? 1000 : 950 }}
      onMouseDown={bringToFront}
    >
      <div
        className="flex items-center justify-between px-3 h-9 bg-slate-800 text-white cursor-move select-none"
        onMouseDown={(e) => {
          drag.current = { dx: e.clientX - x, dy: e.clientY - y };
          const move = (ev: MouseEvent) => {
            if (!drag.current) return;
            setPos({ x: ev.clientX - drag.current.dx, y: ev.clientY - drag.current.dy });
          };
          const up = () => { drag.current = null; window.removeEventListener('pointermove', move as any); window.removeEventListener('pointerup', up); };
          window.addEventListener('pointermove', move as any);
          window.addEventListener('pointerup', up);
        }}
      >
        <span className="text-sm font-semibold truncate">{title}</span>
        <button className="text-white/80 hover:text-white px-1" onClick={onClose} aria-label="Cerrar">✕</button>
      </div>
      <div className="overflow-auto p-3 bg-white">{children}</div>
    </div>
  );
}
