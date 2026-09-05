'use client';
import { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import { Toaster, toast, StatusBadge, EmptyState } from '@/components/ui';
import { api } from '@/lib/api';
import LotDetailModal from '@/components/LotDetailModal';
import { PaginationBar } from '@/components/PaginationBar';
import { Lot, formatMoney, LOT_STATUS_LABEL, LOT_STATUS_COLOR } from '@/lib/types';

export default function LotesPage() {
  const [lots, setLots] = useState<Lot[]>([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [proyectos, setProyectos] = useState<any[]>([]);
  const [project, setProject] = useState('');
  const [selected, setSelected] = useState<number | null>(null);
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

  return (
    <Layout title="Lotes">
      <Toaster />
      <LotDetailModal lotId={selected} onClose={() => setSelected(null)} onChanged={load} />


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
                <td className="td-base text-right"><button className="btn-secondary text-xs" onClick={() => setSelected(l.id)}>Ver ficha</button></td>
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
