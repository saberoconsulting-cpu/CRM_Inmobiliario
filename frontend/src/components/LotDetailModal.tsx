'use client';
import { useEffect, useState } from 'react';
import { Modal, toast, StatusBadge, Field } from './ui';
import { api } from '@/lib/api';
import { LOT_STATUS_COLOR, LOT_STATUS_LABEL, LotStatus, formatMoney, formatDate } from '@/lib/types';

type Row = { id: number; lotId: number; fromStatus: string; toStatus: string; createdAt: string; type?: string; amount?: string|number; paidAt?: string }

export default function LotDetailModal({ lotId, onClose, onChanged }: {
  lotId: number | null; onClose: () => void; onChanged?: () => void;
}) {
  const [lot, setLot] = useState<any>(null);
  const [history, setHistory] = useState<Row[]>([]);
  const [payments, setPayments] = useState<Row[]>([]);
  const [amount, setAmount] = useState(0);
  const [payType, setPayType] = useState('reserva');
  const [working, setWorking] = useState(false);

  async function load() {
    if (!lotId) return;
    try { const d = await api.get<any>(`/lots/${lotId}`); setLot(d.lot); setHistory(d.history||[]); setPayments(d.payments||[]); }
    catch (e:any){ toast(e.message,'err'); }
  }
  useEffect(() => { setLot(null); setHistory([]); setPayments([]); if (lotId) load(); }, [lotId]);

  async function registerPayment() {
    if (!lot || !amount) return toast('Ingresa monto', 'err');
    setWorking(true);
    try {
      await api.post('/payments', { projectId: lot.projectId, lotId: lot.id, type: payType, amount });
      toast('Pago registrado'); await load(); onChanged?.();
    } catch (e:any){ toast(e.message,'err'); } finally { setWorking(false); }
  }
  async function changeStatus(to: string) {
    if (!lot) return;
    setWorking(true);
    try { await api.post(`/plan/lot/status/${lot.id}`, { status: to }); toast('Estado actualizado'); await load(); onChanged?.(); }
    catch (e:any){ toast(e.message,'err'); } finally { setWorking(false); }
  }

  const statusColor = lot ? ((LOT_STATUS_COLOR as any)[lot.status] || '#64748b') : '#64748b';

  if (!lotId) return null;
  return (
    <Modal open={!!lot} onClose={onClose} title={lot ? `Lote ${lot.code}` : ''} width="max-w-2xl">
      {lot && (
        <div className="space-y-5">
          {/* Cabecera de estado dinámica — se repinta cuando el lote cambia de estado */}
          <div className="rounded-2xl px-4 py-4 text-white shadow-sm" style={{ background: statusColor }}>
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <div className="text-[11px] uppercase tracking-wider opacity-80">Estado actual del lote {lot.code}</div>
                <div className="text-2xl font-bold capitalize -mt-0.5">{LOT_STATUS_LABEL[lot.status as LotStatus] || lot.status}</div>
              </div>
              <div className="text-right">
                <div className="text-[11px] uppercase tracking-wider opacity-80">{lot.areaM2} m²</div>
                <div className="text-xl font-extrabold">{formatMoney(lot.price)}</div>
              </div>
            </div>
          </div>
          <div className="border-t pt-4">
            <h4 className="font-semibold text-sm text-slate-700 mb-2">Registrar pago</h4>
            <div className="flex gap-2 items-end flex-wrap">
              <div className="flex-1 min-w-32">
                <Field label="Tipo"><select value={payType} onChange={(e) => setPayType(e.target.value)} className="input">
                  <option value="reserva">Reserva</option><option value="adelanto">Adelanto</option>
                  <option value="primera_cuota">Primera cuota</option><option value="cuota">Cuota</option>
                </select></Field>
              </div>
              <div className="flex-1 min-w-32">
                <Field label="Monto (S/)"><input type="number" value={amount} onChange={(e) => setAmount(Number(e.target.value))} className="input" /></Field>
              </div>
              <button onClick={registerPayment} disabled={working} className="btn-primary shrink-0">{working ? '…' : 'Registrar pago'}</button>
            </div>
          </div>
          <div className="border-t pt-4">
            <h4 className="font-semibold text-sm text-slate-700 mb-2">Cambiar estado</h4>
            <div className="flex flex-wrap gap-2">
              {(['disponible','reservado','adelanto','primera_cuota'] as LotStatus[]).map((s) => lot.status !== s && (
                <button key={s} onClick={() => changeStatus(s)} disabled={working} className="btn-secondary">→ {LOT_STATUS_LABEL[s]}</button>
              ))}
            </div>
          </div>
          <div className="border-t pt-4">
            <h4 className="font-semibold text-sm text-slate-700 mb-2">Pagos</h4>
            <PagosTable rows={payments} />
          </div>
          <div className="border-t pt-4">
            <h4 className="font-semibold text-sm text-slate-700 mb-2">Historial de estados</h4>
            <ul className="space-y-1 text-sm">
              {history.map((h) => (
                <li key={h.id as any} className="flex items-center gap-2"><StatusBadge status={h.fromStatus||''}/> → <StatusBadge status={h.toStatus}/><span className="text-slate-400 text-xs">{formatDate(h.createdAt)}</span></li>
              ))}
              {history.length===0 && <li className="text-slate-400">Sin cambios</li>}
            </ul>
          </div>
        </div>
      )}
    </Modal>
  );
}

export function PagosTable({ rows }: { rows: Row[] }) {
  return (
    <div className="overflow-auto">
      <table className="table-base">
        <thead><tr><th className="th-base">Tipo</th><th className="th-base">Monto</th><th className="th-base">Estado</th><th className="th-base">Fecha</th></tr></thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((p) => (
            <tr key={p.id}><td className="td-base capitalize">{p.type||''}</td><td className="td-base">{formatMoney(p.amount)}</td><td className="td-base"><StatusBadge status={(p as any).status||''}/></td><td className="td-base">{formatDate((p as any).paidAt||(p as any).createdAt||'')}</td></tr>
          ))}
          {rows.length===0 && <tr><td className="td-base text-slate-400" colSpan={4}>Sin pagos</td></tr>}
        </tbody>
      </table>
    </div>
  );
}
