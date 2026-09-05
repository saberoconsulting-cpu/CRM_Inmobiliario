'use client';
import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Layout from '@/components/Layout';
import { Toaster, toast, StatCard, LegendChips, EmptyState } from '@/components/ui';
import { api, getToken, uploadFile } from '@/lib/api';
import { getSocket, disconnectSocket } from '@/lib/socket';
import InteractivePlan from '@/components/interactive-plan/InteractivePlan';
import LotDetailModal from '@/components/LotDetailModal';
import { Block, Lot, formatMoney, LOT_STATUS_LABEL, LOT_STATUS_COLOR } from '@/lib/types';
import { IoLocationSharp } from 'react-icons/io5';

export default function ProjectPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const projectId = Number(params.id);
  const [project, setProject] = useState<any>(null);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [lots, setLots] = useState<Lot[]>([]);
  const [plan, setPlan] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [blockFilter, setBlockFilter] = useState<number | null>(null);
  const [selectedLot, setSelectedLot] = useState<number | null>(null);
  const [canEdit, setCanEdit] = useState(false);

  useEffect(() => {
    let role = 'agent';
    try {
      const meta = typeof window !== 'undefined' ? localStorage.getItem('crm_user') : '';
      role = meta ? (JSON.parse(meta).role || 'agent') : 'agent';
    } catch { /* sin sesión */ }
    setCanEdit(role === 'superadmin' || role === 'admin');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function reemplazarPortada(f?: File) {
    if (!f) return;
    try {
      const p = await uploadFile(`/projects/cover/${projectId}`, f);
      setProject((pr: any | null) => ({ ...(pr || {}), coverImageUrl: p?.coverImageUrl || pr?.coverImageUrl }));
      toast('Imagen de portada actualizada');
    } catch (e: any) { toast(e.message, 'err'); }
  }

  async function borrarProyecto() {
    if (!confirm(`¿Eliminar "${project?.name || 'este proyecto'}"?\nSe quitarán plano, manzanas, lotes, ventas y pagos asociados. Esta acción es irreversible.`)) return;
    try {
      await api.post(`/projects/delete/${projectId}`);
      toast('Proyecto eliminado');
      router.replace('/projects');
    } catch (e: any) { toast(e.message, 'err'); }
  }

  async function loadAll() {
    try {
      const [prj, pl] = await Promise.all([
        api.get<any>(`/projects/${projectId}`),
        api.get<any>(`/plan/project/${projectId}`).catch(() => ({ plan: null, blocks: [], lots: [] })),
      ]);
      setProject(prj);
      setPlan(pl.plan);
      setBlocks(pl.blocks || []);
      setLots(pl.lots || []);
    } catch (e: any) { toast(e.message, 'err'); }
  }

  useEffect(() => {
    if (!projectId) return;
    loadAll();
    const t = getToken();
    if (t) {
      const s = getSocket(t);
      s.on('lot.updated', () => loadAll());
    }
    return () => { const t = getToken(); if (t) getSocket(t).off('lot.updated'); };
  }, [projectId]);

  useEffect(() => {
    if (!projectId) return;
    api.get<any>(`/dashboards/project/${projectId}`).then(setStats).catch(() => {});
  }, [projectId]);

  const visibleLots = blockFilter ? lots.filter((l) => l.blockId === blockFilter) : lots;

  const count = (s: string) => lots.filter((l) => l.status === s).length;

  if (!project) return <Layout title="Cargando…"><Toaster/><p className="text-slate-400">Cargando proyecto…</p></Layout>;

  return (
    <Layout title={project.name}>
      <Toaster />
      <LotDetailModal lotId={selectedLot} onClose={() => setSelectedLot(null)} onChanged={loadAll} />

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <div className="xl:col-span-3 card flex flex-wrap items-center gap-4">
          {project.coverImageUrl && <img src={project.coverImageUrl} className="w-16 h-16 rounded-lg object-cover" alt="" />}
          <div className="flex-1 min-w-40">
            <h2 className="text-xl font-bold">{project.name}</h2>
            <p className="text-slate-500 text-sm flex items-center gap-1"><IoLocationSharp /> {project.location}</p>
            {project.description && <p className="text-xs text-slate-400 mt-1">{project.description}</p>}
          </div>
          {canEdit && (
            <div className="flex flex-col gap-2">
              <label className="btn-neutral !h-8 text-xs cursor-pointer inline-flex items-center gap-1">
                📷 <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ''; reemplazarPortada(f); }} />Actualizar imagen
              </label>
              <button className="btn-danger !h-8 text-xs" onClick={borrarProyecto}>Eliminar proyecto</button>
            </div>
          )}
          <LegendChips />
        </div>

        <StatCard label="Lotes totales" value={lots.length} />
        {(['disponible','reservado','adelanto','primera_cuota','vendido'] as const).map((s) => (
          <StatCard key={s} label={LOT_STATUS_LABEL[s] as any} value={count(s)}
            color={LOT_STATUS_COLOR[s] as any} />
        ))}
        <StatCard label="Ingreso acumulado" value={formatMoney(stats?.cards?.income)} />

        {/* Plano interactivo */}
        <div className="xl:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold">Plano interactivo</h3>
            <div className="flex gap-2">
              <a href={`/projects/${projectId}/plan-editor`} className="btn-primary !h-8 text-xs">Editar plano</a>
              <button className="btn-neutral text-xs" onClick={() => setBlockFilter(null)}>Ver todos</button>
            </div>
          </div>
          <div className="rounded-xl overflow-hidden border border-slate-200" style={{ height: '560px' }}>
            <InteractivePlan
              imageUrl={plan?.imageUrl}
              blocks={blocks}
              lots={lots}
              imageW={plan?.imageWidth || 1000}
              imageH={plan?.imageHeight || 800}
              highlightBlockId={blockFilter}
              onBlockClick={(b) => setBlockFilter(blockFilter === b.id ? null : b.id)}
              onLotClick={(l) => setSelectedLot(l.id)}
              selectedLotId={selectedLot}
            />
          </div>
        </div>

        {/* Tabla de lotes */}
        <div className="flex flex-col gap-4">
          <div className="card flex-1 max-h-[560px] overflow-auto">
            <h3 className="font-semibold mb-3">Lotes {blockFilter ? `(filtrado manzana)` : ''}</h3>
            <table className="table-base">
              <thead><tr>
                <th className="th-base">Código</th><th className="th-base">Área</th>
                <th className="th-base">Precio</th><th className="th-base">Estado</th>
              </tr></thead>
              <tbody className="divide-y divide-slate-100">
                {visibleLots.map((l) => (
                  <tr key={l.id} onClick={() => setSelectedLot(l.id)} className="cursor-pointer hover:bg-slate-50">
                    <td className="td-base font-medium">{l.code}</td>
                    <td className="td-base">{l.areaM2}</td>
                    <td className="td-base">{formatMoney(l.price)}</td>
                    <td className="td-base"><span className="badge" style={{ backgroundColor: LOT_STATUS_COLOR[l.status] + '22', color: LOT_STATUS_COLOR[l.status] }}>{LOT_STATUS_LABEL[l.status]}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
            {visibleLots.length === 0 && <EmptyState text="Sin lotes para mostrar" />}
          </div>
        </div>
      </div>
    </Layout>
  );
}
