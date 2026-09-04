'use client';
import { useEffect, useState, useCallback } from 'react';
import Layout from '@/components/Layout';
import { Toaster, toast, Field, EmptyState, StatCard } from '@/components/ui';
import { api } from '@/lib/api';
import { formatMoney, formatDate } from '@/lib/types';

type P = { id: number; projectId: number; lotId: number; type: string; amount: string; dueDate?: string | null; paidAt?: string | null; status: string };
const TYPE_LABEL: any = { reserva: 'Reserva', adelanto: 'Adelanto', primera_cuota: 'Primera cuota', cuota: 'Cuota' };
const BADGE: any = { pagado: ['#EAF7EE', '#257849'], pendiente: ['#FFF6E4', '#B45309'], vencido: ['#FFF1F3', '#A90318'] };

export default function PaymentsPage() {
  const [rows, setRows] = useState<P[]>([]);
  const [status, setStatus] = useState('');
  const [overdue, setOverdue] = useState<P[]>([]);
  const [loading, setLoading] = useState(true);
  const [lots, setLots] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [lotId, setLotId] = useState(0);
  const [amount, setAmount] = useState(0);
  const [dueDate, setDueDate] = useState('');
  const [payType, setPayType] = useState('reserva');
  const [note, setNote] = useState('');

  const load = useCallback(async () => {
    try {
      const q = new URLSearchParams();
      if (status) q.set('status', status);
      const res = await api.get<P[]>(q.toString() ? `/payments?${q}` : '/payments');
      setRows(res || []);
    } catch (e: any) { toast(e.message, 'err'); } finally { setLoading(false); }
  }, [status]);

  useEffect(() => {
    load();
    api.get<{ overdue: P[] }>('/payments/alerts').then((a) => setOverdue(a?.overdue || [])).catch(() => setOverdue([]));
    api.get<any[]>('/lots').then(setLots).catch(() => {});
  }, [load]);

  async function registrar() {
    if (!lotId) return toast('Selecciona un lote', 'err');
    if (!amount) return toast('Ingresa monto', 'err');
    try {
      const lot = lots.find((l) => l.id === Number(lotId));
      await api.post('/payments', { projectId: lot?.projectId || 1, lotId: Number(lotId), clientId: lot?.clientId || undefined, agentId: lot?.agentId || undefined, type: payType, amount, dueDate: dueDate || undefined, note: note || undefined });
      toast('Pago registrado');
      setOpen(false); setAmount(0); setDueDate(''); setNote(''); setLotId(0);
      load();
    } catch (e: any) { toast(e.message, 'err'); }
  }

  const st = (p: P) => { const bg = BADGE[p.status] || ['#eaedf1', '#6b7280']; return <span className="badge" style={{ background: bg[0], color: bg[1] }}>{p.status}</span>; };

  return (
    <Layout title="Pagos e ingresos">
      <Toaster />
      <div className="space-y-5">
        {overdue.length > 0 && (
          <div className="rounded-lg border px-3 py-2 text-sm" style={{ background: '#FFF1F3', borderColor: '#FCB7C0', color: '#A90318' }}>
            <b>{overdue.length}</b> cuotas vencidas detectadas. Regístralas para actualizar la cartera.
          </div>
        )}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Registrados" value={rows.length} />
          <StatCard label="Pagados" value={rows.filter((r) => r.status === 'pagado').length} color="#257849" />
          <StatCard label="Pendientes" value={rows.filter((r) => r.status === 'pendiente').length} color="#B45309" />
          <StatCard label="Vencidos" value={rows.filter((r) => r.status === 'vencido').length} color="#A90318" />
        </div>
        <div className="card">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="font-semibold">Historial de pagos</h3>
            <div className="flex flex-wrap gap-2">
              <select className="input !w-auto" value={status} onChange={(e) => setStatus(e.target.value)}>
                <option value="">Estado: todos</option>
                <option value="pagado">Pagado</option>
                <option value="pendiente">Pendiente</option>
                <option value="vencido">Vencido</option>
              </select>
              <button className="btn-primary" onClick={() => setOpen(true)}>Registrar pago</button>
            </div>
          </div>
        </div>
        <div className="card p-0 overflow-auto">
          {loading ? <p className="p-4 text-slate-400">Cargando…</p>
            : rows.length === 0 ? <EmptyState text="No hay pagos con esos filtros." />
            : (
            <table className="table-base">
              <thead><tr>
                <th className="th-base">Tipo</th><th className="th-base">Lote</th><th className="th-base">Monto</th>
                <th className="th-base">Estado</th><th className="th-base">Vence</th><th className="th-base">Pagado</th>
              </tr></thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((p) => (
                  <tr key={p.id}>
                    <td className="td-base capitalize">{TYPE_LABEL[p.type] || p.type}</td>
                    <td className="td-base font-medium">Lote {p.lotId}</td>
                    <td className="td-base">{formatMoney(p.amount)}</td>
                    <td className="td-base">{st(p)}</td>
                    <td className="td-base">{formatDate(p.dueDate)}</td>
                    <td className="td-base">{formatDate(p.paidAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            )}
        </div>
      </div>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />
          <div className="relative bg-white rounded-2xl w-full max-w-md p-6">
            <h3 className="font-semibold mb-5" style={{ fontSize: 17 }}>Registrar pago</h3>
            <Field label="Lote">
              <select className="input" value={lotId} onChange={(e) => setLotId(Number(e.target.value))}>
                <option value={0}>Selecciona…</option>
                {lots.map((l: any) => <option key={l.id} value={l.id}>Lote {l.code} — {formatMoney(l.price)}</option>)}
              </select>
            </Field>
            <Field label="Tipo">
              <select className="input" value={payType} onChange={(e) => setPayType(e.target.value)}>
                <option value="reserva">Reserva</option><option value="adelanto">Adelanto</option>
                <option value="primera_cuota">Primera cuota</option><option value="cuota">Cuota</option>
              </select>
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Monto (S/)"><input type="number" className="input" value={amount} onChange={(e) => setAmount(Number(e.target.value))} /></Field>
              <Field label="Vence (opc.)"><input type="date" className="input" value={dueDate} onChange={(e) => setDueDate(e.target.value)} /></Field>
            </div>
            <Field label="Nota (opcional)"><input className="input" value={note} onChange={(e) => setNote(e.target.value)} /></Field>
            <div className="flex justify-end gap-2 pt-2">
              <button className="btn-neutral" onClick={() => setOpen(false)}>Cancelar</button>
              <button className="btn-primary" onClick={registrar}>Registrar pago</button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}

