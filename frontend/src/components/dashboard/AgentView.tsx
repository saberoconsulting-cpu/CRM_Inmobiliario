'use client';
import { StatCard } from '@/components/ui';
import { AgentDashboard } from '@/lib/dboard';
import { formatMoney, formatDate } from '@/lib/types';

export default function AgentView({ d }: { d: AgentDashboard | null }) {
  if (!d) return <p className="text-slate-400">Sin datos</p>;
  const prog = Math.min(d.cards.progressLots, 100);
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Ventas del mes" value={d.cards.salesMonth} />
        <StatCard label="Ingresos generados" value={formatMoney(d.cards.salesAmount)} />
        <StatCard label="Comisiones del mes" value={formatMoney(d.cards.commissionMonth)} />
        <StatCard label="Lotes vendidos" value={d.cards.lotsSold} />
      </div>
      <div className="card">
        <h3 className="font-semibold mb-2">Mi meta mensual de lotes</h3>
        <div className="text-3xl font-bold mb-2">{d.cards.goalLots>0 ? `${Math.min(d.cards.salesMonth,d.cards.goalLots)} / ${d.cards.goalLots} (${d.cards.progressLots}%)` : `${d.cards.salesMonth} vendidos`}</div>
        <div className="h-3 bg-slate-100 rounded-full overflow-hidden"><div className="h-full bg-brand-600" style={{ width: prog + '%' }} /></div>
        <p className="text-xs text-slate-400 mt-1">Meta en monto: {formatMoney(d.cards.goalAmount)} · Comisiones acumuladas {formatMoney(d.cards.commissionMonth)}</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="card"><h3 className="font-semibold mb-2">Mis leads ({d.leads.length})</h3>
          <ul className="divide-y text-sm">{d.leads.map((c:any)=>(
            <li key={c.id} className="py-2 flex justify-between"><span className="text-slate-700">{c.full_name}</span><span className="badge bg-slate-100 text-slate-600 capitalize">{c.pipeline_status}</span></li>))}
          {!d.leads.length && <li className="text-slate-400 py-2">Sin leads asignados</li>}</ul></div>
        <div className="card"><h3 className="font-semibold mb-2">Próximas cuotas ({d.upcoming.length})</h3>
          <ul className="divide-y text-sm">{d.upcoming.map((p:any)=>(
            <li key={p.id} className="py-2 flex justify-between"><span className="capitalize text-slate-700">{p.type}</span><b>{formatMoney(p.amount)} · {formatDate(p.due_date)}</b></li>))}
          {!d.upcoming.length && <li className="text-slate-400 py-2">Sin cuotas pendientes</li>}</ul></div>
      </div>
    </div>
  );
}
