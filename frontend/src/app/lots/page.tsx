'use client';
import { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import { Toaster, toast, StatusBadge, EmptyState } from '@/components/ui';
import { api } from '@/lib/api';
import LotDetailModal from '@/components/LotDetailModal';
import FloatingWindow from '@/components/FloatingWindow';
import { PaginationBar } from '@/components/PaginationBar';
import { Lot, formatMoney, LOT_STATUS_LABEL, LOT_STATUS_COLOR } from '@/lib/types';

export default function LotesPage() {
  const [lots, setLots] = useState<Lot[]>([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [proyectos, setProyectos] = useState<any[]>([]);
  const [project, setProject] = useState('');
  const [selected, setSelected] = useState<number | null>(null);
  const [windows, setWindows] = useState<{ id: number; lotId: number; x: number; y: number }[]>([]);
  const [topId, setTopId] = useState<number>(0);
  const [buscar, setBuscar] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [meta, setMeta] = useState({ total: 0, totalPages: 1 });

  async function load() {
    const q = new URLSearchParams();
    if (statusFilter) q.set('status', statusFilter);
    if (search) q.set('search', search);
    if (project) q.set('projectId', project);
    q.set('page', String(page));
    q.set('limit', String(limit));
    try {
      const d = await api.get<any>(`/lots?${q.toString()}`);
      const rows: Lot[] = Array.isArray(d) ? d : (d?.items || []);
      setLots(rows);
      setMeta({ total: Number(d?.total ?? rows.length), totalPages: Number(d?.totalPages ?? Math.max(1, Math.ceil((d?.total ?? rows.length) / limit))) });
    } catch (e: any) { toast(e.message, 'err'); }
  }
  useEffect(() => { load(); }, [statusFilter, search, project, page, limit]);
  useEffect(() => { api.get<any>('/projects').then((d) => setProyectos(Array.isArray(d) ? d : ((d as any)?.items || []))).catch(() => {}); }, []);
  useEffect(() => { setPage(1); }, [statusFilter, search, project]);

  const openWindow = (lotId: number) => {
    const existing = windows.find((w) => w.lotId === lotId);
    if (existing) { setTopId(existing.id); return; }
    const id = Date.now() % 100000 + Math.floor(Math.random() * 999);
    const n = windows.length;
    setWindows((p) => [...p, { id, lotId, x: 130 + (n % 6) * 44, y: 90 + (n % 5) * 42 }]);
    setTopId(id);
  };
  const closeWindow = (id: number) => setWindows((p) => p.filter((w) => w.id !== id));
  const moveWindow = (id: number, x: number, y: number) =>
    setWindows((p) => p.map((w) => (w.id === id ? { ...w, x, y } : w)));

  return (
    <Layout title="Lotes">
      <Toaster />
      <LotDetailModal lotId={selected} onClose={() => setSelected(null)} onChanged={load} />

      {windows.map((w) => {
        const l = lots.find((x) => x.id === w.lotId);
        return (
          <FloatingWindow key={w.id}
            title={l ? `Lote ${l.code} · ${LOT_STATUS_LABEL[l.status]}` : 'Lote'}
            x={w.x} y={w.y} focused={topId === w.id}
            setPos={(p) => moveWindow(w.id, p.x, p.y)}
            onClose={() => closeWindow(w.id)}
            bringToFront={() => setTopId(w.id)}>
            {l && (
              <div className="w-72">
                <div className="text-sm"><div className="font-semibold text-base">{l.code}</div>
                  <div>Precio: <b>{formatMoney(l.price)}</b></div>
                  <div className="text-slate-500">Área: {l.areaM2} m²</div>
                  <div className="mt-1"><span className="badge" style={{ backgroundColor: LOT_STATUS_COLOR[l.status] + '22', color: LOT_STATUS_COLOR[l.status] }}>{LOT_STATUS_LABEL[l.status]}</span></div>
                </div>
                <div className="flex gap-2 mt-3">
                  <button className="btn-primary flex-1 text-xs" onClick={() => setSelected(l.id)}>Abrir ficha completa</button>
                </div>
              </div>
            )}
          </FloatingWindow>
        );
      })}  

      <div className="card mb-4 flex flex-wrap gap-3 items-end">
        <div className="flex-1 min-w-48"><label className="label">Buscar por código</label>
          <input className="input" value={buscar} onChange={(e)=>setBuscar(e.target.value)} onKeyDown={(e)=>{ if(e.key==='Enter') setSearch(buscar); }} placeholder="Ej: A-01" />
        </div>
        <div className="min-w-40"><label className="label">Proyecto</label>
          <select className="input" value={project} onChange={(e)=>setProject(e.target.value)}>
            <option value="">Todos</option>
            {proyectos.map((p:any)=>(<option key={p.id} value={p.id}>{p.name}</option>))}
          </select>
        </div>
        <div className="min-w-44"><label className="label">Estado</label>
          <select className="input" value={statusFilter} onChange={(e)=>setStatusFilter(e.target.value)}>
            <option value="">Todos</option>
            {Object.entries(LOT_STATUS_LABEL).map(([k,v])=>(<option key={k} value={k}>{v}</option>))}
          </select>
        </div>
        <button className="btn-secondary" onClick={()=>{setBuscar('');setSearch('');setStatusFilter('');setProject('');}}>Limpiar</button>
      </div>

      <div className="card overflow-auto">
        <table className="table-base">
          <thead><tr>
            <th className="th-base">Código</th><th className="th-base">Proyecto</th><th className="th-base">Área m²</th>
            <th className="th-base">Precio</th><th className="th-base">Estado</th><th className="th-base"></th>
          </tr></thead>
          <tbody className="divide-y divide-slate-100">
            {lots.map((l)=>(
              <tr key={l.id} className="hover:bg-slate-50">
                <td className="td-base font-medium">{l.code}</td>
                <td className="td-base">{l.projectId}</td>
                <td className="td-base">{l.areaM2}</td>
                <td className="td-base">{formatMoney(l.price)}</td>
                <td className="td-base"><span className="badge" style={{backgroundColor:LOT_STATUS_COLOR[l.status]+'22', color:LOT_STATUS_COLOR[l.status]}}>{LOT_STATUS_LABEL[l.status]}</span></td>
                <td className="td-base text-right"><button className="btn-secondary text-xs" onClick={() => openWindow(l.id)}>Ver ficha</button></td>
              </tr>
            ))}
          </tbody>
        </table>
        {lots.length===0 && <EmptyState text="No se encontraron lotes con los filtros" />}
        <div className="p-4">
          <PaginationBar label="Lotes" page={page} totalPages={meta.totalPages} total={meta.total} limit={limit} setPage={setPage} setLimit={setLimit} />
        </div>
      </div>
    </Layout>
  );
}
