'use client';
// src/components/ui.tsx
// Componentes UI reutilizables: estados, tarjetas, modales, toast
import { ReactNode, useState as useReactState } from 'react';
import { LotStatus, LOT_STATUS_LABEL, LOT_STATUS_COLOR } from '@/lib/types';

// Badge de estado de lote con color
export function StatusBadge({ status }: { status: string }) {
  const label = (LOT_STATUS_LABEL as any)[status] || status;
  const color = (LOT_STATUS_COLOR as any)[status] || '#64748b';
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium"
      style={{ backgroundColor: color + '22', color }}>
      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
      {label}
    </span>
  );
}

// Leyenda de colores de estados
export function LegendChips() {
  return (
    <div className="flex flex-wrap gap-3 text-xs">
      {(['disponible', 'reservado', 'adelanto', 'primera_cuota', 'vendido'] as LotStatus[]).map((s) => (
        <span key={s} className="inline-flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: LOT_STATUS_COLOR[s] }} />
          {LOT_STATUS_LABEL[s]}
        </span>
      ))}
    </div>
  );
}

// Tarjeta de estadística con acento superior de marca
export function StatCard({ label, value, color = '#171717', delta, deltaUp, date }: {
  label: string; value: ReactNode; color?: string; delta?: string; deltaUp?: boolean; date?: string;
}) {
  return (
    <div className="card card-kpi">
      <div className="flex items-center justify-between">
        <span className="font-medium" style={{ fontSize: 12, color: '#6B7280' }}>{label}</span>
        <span className="w-1.5 h-1.5 rounded-full bg-[#E30620]" />
      </div>
      <div className="mt-1.5 font-bold" style={{ fontSize: 24, color }}>{value}</div>
      {(delta || date) && (
        <div className="flex items-center gap-2 mt-1">
          {delta && (
            <span className="inline-flex items-center gap-1 text-xs font-semibold" style={{ color: deltaUp ? '#257849' : '#6B7280' }}>
              {deltaUp ? '▲' : '●'} {delta}
            </span>
          )}
          {date && <span className="text-[11px]" style={{ color: '#9AA1AB' }}>{date}</span>}
        </div>
      )}
    </div>
  );
}

// Modal genérico
export function Modal({ open, onClose, title, children, width = 'max-w-lg' }: {
  open: boolean; onClose: () => void; title: string; children: ReactNode; width?: string;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className={`relative bg-white rounded-2xl shadow-2xl w-full ${width} max-h-[90vh] flex flex-col`}>
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <h3 className="font-semibold text-slate-800">{title}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl leading-none" aria-label="Cerrar">✕</button>
        </div>
        <div className="overflow-y-auto p-5">{children}</div>
      </div>
    </div>
  );
}

// Toast global simple
let toastFn: (msg: string, type?: 'ok' | 'err') => void = () => {};
export function toast(msg: string, type: 'ok' | 'err' = 'ok') { toastFn(msg, type); }

export function Toaster() {
  const [items, setItems] = useReactState<{ id: number; msg: string; type: 'ok' | 'err' }[]>([]);
  toastFn = (msg, type = 'ok') => {
    const id = Date.now() + Math.random();
    setItems((prev) => [...prev, { id, msg, type }]);
    setTimeout(() => setItems((prev) => prev.filter((x) => x.id !== id)), 3500);
  };
  return (
    <div className="fixed top-4 right-4 z-[60] space-y-2">
      {items.map((t) => (
        <div key={t.id} className={`toast-in px-4 py-2 rounded-lg shadow-lg text-sm font-medium text-white ${t.type === 'ok' ? 'bg-emerald-600' : 'bg-red-600'}`}>
          {t.msg}
        </div>
      ))}
    </div>
  );
}

// Campo de formulario reutilizable
export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="mb-3">
      <label className="label">{label}</label>
      {children}
    </div>
  );
}

// Tabla simple (envoltorio)
export function EmptyState({ text }: { text: string }) {
  return <div className="text-center py-10 text-slate-400 text-sm">{text}</div>;
}
