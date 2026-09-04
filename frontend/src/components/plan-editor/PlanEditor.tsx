'use client';
import { useEffect, useRef, useState, useCallback } from 'react';
import { api, uploadFile } from '@/lib/api';
import { Block, Lot, Point, formatMoney } from '@/lib/types';
import { Modal as _m, toast, Field } from '@/components/ui';

const SVG_W = 1000;
const SVG_H = 800;

export default function PlanEditor({ projectId }: { projectId: number }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [imgUrl, setImgUrl] = useState('');
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [lots, setLots] = useState<Lot[]>([]);
  const [status, setStatus] = useState('draft');
  const [mode, setMode] = useState<'none' | 'block' | 'lot'>('none');
  const [draft, setDraft] = useState<Point[]>([]);
  const [selectedBlk, setSelectedBlk] = useState<number | null>(null);
  const [lotInfo, setLotInfo] = useState<{ code: string; area: number; price: number }>({ code: '', area: 0, price: 0 });
  const dim = useRef({ w: SVG_W, h: SVG_H });

  const load = useCallback(async () => {
    try {
      const pl = await api.get<any>(`/plan/project/${projectId}`).catch(() => ({ plan: { status: 'draft' }, blocks: [], lots: [] }));
      setImgUrl(pl.plan?.imageUrl || '');
      setStatus(pl.plan?.status || 'draft');
      setBlocks(pl.blocks || []);
      setLots(pl.lots || []);
      dim.current = { w: Number(pl.plan?.imageWidth || SVG_W), h: Number(pl.plan?.imageHeight || SVG_H) };
    } catch (e: any) { toast(e.message, 'err'); }
  }, [projectId]);
  useEffect(() => { load(); }, [load]);

  const toSvg = (e: any): Point => {
    const rect = svgRef.current!.getBoundingClientRect();
    return { x: (e.clientX - rect.left) / rect.width * SVG_W, y: (e.clientY - rect.top) / rect.height * SVG_H };
  };

  const imgScale = Math.min(SVG_W / dim.current.w, SVG_H / dim.current.h);
  const imgW = dim.current.w * imgScale;
  const imgH = dim.current.h * imgScale;
  const imgX = (SVG_W - imgW) / 2;
  const imgY = (SVG_H - imgH) / 2;

  const addNode = (e: any) => { if (mode !== 'none') setDraft((p) => [...p, toSvg(e)]); };
  const closeShape = () => { if (draft.length < 3) return toast('Dibuja al menos 3 puntos', 'err'); setMode('none'); };

  async function uploadImage(file: File) {
    try { const r = await uploadFile(`/plan/image/${projectId}`, file); toast('Imagen del plano subida'); setImgUrl(r?.imageUrl || URL.createObjectURL(file)); }
    catch (e: any) { toast(e.message, 'err'); }
  }

  async function saveBlock() {
    if (draft.length < 3) return toast('Dibuja una manzana (3+ puntos)', 'err');
    const name = prompt('Nombre de la manzana (A, B, C…):', String.fromCharCode(65 + blocks.length)) || 'A';
    try {
      await api.post(`/plan/block/${projectId}`, { name, points: draft });
      toast('Manzana guardada'); setDraft([]); load();
    } catch (e: any) { toast(e.message, 'err'); }
  }

  async function saveLot(block: Block | null) {
    if (draft.length < 3) return toast('Dibuja el lote (3+ puntos)', 'err');
    if (!block) return toast('Primero crea/elige la manzana contenedora', 'err');
    if (!lotInfo.code) return toast('Indica el código del lote', 'err');
    try {
      await api.post(`/plan/lot/${projectId}`, { code: lotInfo.code, blockId: block.id, points: draft, areaM2: Number(lotInfo.area) || 0, price: Number(lotInfo.price) || 0, status: 'disponible' });
      toast('Lote guardado'); setDraft([]); setLotInfo({ code: '', area: 0, price: 0 }); load();
    } catch (e: any) { toast(e.message, 'err'); }
  }

  async function renameBlock(b: Block) {
    const name = prompt('Nuevo nombre de la manzana:', b.name);
    if (!name || name === b.name) return;
    try { await api.post(`/plan/block/update/${b.id}`, { name }); toast('Renombrado'); load(); } catch (e: any) { toast(e.message, 'err'); }
  }
  async function delBlock(b: Block) {
    if (!confirm(`Eliminar manzana ${b.name}? Sus lotes no se borran, quedan sin manzana.`)) return;
    try { await api.post(`/plan/block/delete/${b.id}`); toast('Manzana eliminada'); load(); } catch (e: any) { toast(e.message, 'err'); }
  }
  async function dupBlock(b: Block) {
    try { await api.post(`/plan/block/duplicate/${b.id}`); toast('Manzana duplicada'); load(); } catch (e: any) { toast(e.message, 'err'); }
  }
  async function delLot(l: Lot) {
    if (!confirm(`Eliminar lote ${l.code}?`)) return;
    try { await api.post(`/plan/lot/delete/${l.id}`); toast('Lote eliminado'); load(); } catch (e: any) { toast(e.message, 'err'); }
  }
  async function setStatusP(s: string) {
    try { await api.post(`/plan/update/${projectId}`, { status: s }); setStatus(s); toast(s === 'published' ? 'Plano publicado (visible en el proyecto)' : 'Guardado como borrador'); load(); }
    catch (e: any) { toast(e.message, 'err'); }
  }

  const centroid = (pts: Point[]) => pts.reduce((a, p) => ({ x: a.x + p.x / pts.length, y: a.y + p.y / pts.length }), { x: 0, y: 0 });
  const inBlk = (b: Block, p: Point) => {
    let inside = false;
    for (let i = 0, j = b.points.length - 1; i < b.points.length; j = i++) {
      const xi = b.points[i].x, yi = b.points[i].y, xj = b.points[j].x, yj = b.points[j].y;
      const inter = yi > p.y !== yj > p.y && p.x < ((xj - xi) * (p.y - yi)) / (yj - yi) + xi;
      if (inter) inside = !inside;
    }
    return inside;
  };

  return (
    <div className="space-y-4">
      <div className="card">
        <div className="flex flex-wrap items-center gap-2 justify-between">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold mr-2">Editor de plano</h3>
            {status === 'published' ? <span className="badge" style={{ background: '#EAF7EE', color: '#125A3B' }}>Publicado</span> : <span className="badge" style={{ background: '#FFF6E4', color: '#B45309' }}>Borrador</span>}
          </div>
          <div className="flex flex-wrap gap-2">
            <label className="btn-neutral cursor-pointer"><input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && uploadImage(e.target.files[0])} />Subir imagen</label>
            {status === 'published'
              ? <button className="btn-neutral" onClick={() => setStatusP('draft')}>Borrador</button>
              : <button className="btn-primary" onClick={() => setStatusP('published')}>Publicar</button>}
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <button className={mode === 'block' ? 'btn-primary' : 'btn-outline'} onClick={() => setMode(mode === 'block' ? 'none' : 'block')}>Manzana</button>
          <button className={mode === 'lot' ? 'btn-primary' : 'btn-outline'} onClick={() => setMode(mode === 'lot' ? 'none' : 'lot')}>Lote</button>
          <button className="btn-neutral" onClick={() => { setDraft([]); setMode('none'); }}>Limpiar</button>
          <span className="text-xs self-center" style={{ color: '#6B7280' }}>{mode !== 'none' ? `Clic sobre el plano para añadir ${draft.length} puntos y luego guarda.` : 'Elige herramienta y haz clic en el plano.'}</span>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 card overflow-hidden !p-0 relative bg-slate-100" style={{ aspectRatio: '1000 / 800' }}>
          <svg ref={svgRef} viewBox={`0 0 ${SVG_W} ${SVG_H}`} className="w-full h-full cursor-crosshair" onClick={addNode}>
            {imgUrl && <image href={imgUrl} x={imgX} y={imgY} width={imgW} height={imgH} preserveAspectRatio="xMidYMid meet" />}
            {blocks.map((b) => { const c = centroid(b.points);
              const tone = ['rgba(250,204,21,0.18)', 'rgba(96,165,250,0.16)', 'rgba(52,211,153,0.16)', 'rgba(192,132,252,0.16)', 'rgba(251,146,60,0.16)'];
              const t = tone[b.id % tone.length];
              const hi = selectedBlk === b.id && mode === 'none';
              return (
              <g key={b.id} onClick={(e) => { if (mode === 'none') { e.stopPropagation(); setSelectedBlk(selectedBlk === b.id ? null : b.id); } }} style={{ pointerEvents: mode === 'lot' ? 'none' : 'auto' }}>
                <polygon points={b.points.map((p) => `${p.x},${p.y}`).join(' ')} fill={hi ? 'rgba(227,6,32,0.25)' : t} stroke={hi ? '#E30620' : '#64748b'} strokeWidth={hi ? 2.5 : 1.2} />
                <text x={c.x} y={c.y} fontSize={24} fontWeight={700} textAnchor="middle" dominantBaseline="central" fill="#334155">{b.name}</text>
              </g>
            ); })}
            {lots.map((lt) => { const c = centroid(lt.points); return (
              <g key={lt.id} onClick={(e) => e.stopPropagation()} style={{ pointerEvents: 'all' }}>
                <polygon points={lt.points.map((p) => `${p.x},${p.y}`).join(' ')} fill="#cbd5e1" fillOpacity={0.55} stroke="#94a3b8" strokeWidth={1} />
                <text x={c.x} y={c.y - 4} fontSize={11} textAnchor="middle" fontWeight={600}>{lt.code}</text>
                <text x={c.x} y={c.y + 8} fontSize={8} textAnchor="middle">{lt.areaM2} m²</text>
              </g>
            ); })}
            {draft.length > 0 && <polygon points={draft.map((p) => `${p.x},${p.y}`).join(' ')} fill="rgba(227,6,32,0.25)" stroke="#E30620" strokeWidth={2} />}
            {draft.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r={5} fill="#E30620" stroke="#fff" strokeWidth={1.5} />)}
          </svg>
          {!imgUrl && <div className="absolute inset-0 grid place-items-center text-sm" style={{ color: '#6B7280' }}>Sube la imagen del plano para dibujar sobre ella.</div>}
        </div>
        <div className="space-y-4">
          {mode !== 'none' && (
            <div className="card">
              <h4 className="font-semibold mb-3">Guardar {mode === 'block' ? 'manzana' : 'lote'}</h4>
              {mode === 'block' ? (
                <button className="btn-primary w-full" onClick={saveBlock}>Guardar manzana ({draft.length} pts)</button>
              ) : (
                <>
                  <Field label="Manzana contenedora">
                    <select className="input" value={selectedBlk || ''} onChange={(e) => setSelectedBlk(Number(e.target.value))}><option value="">Selecciona…</option>{blocks.map((b) => <option key={b.id} value={b.id}>Manzana {b.name}</option>)}</select>
                  </Field>
                  <Field label="Código del lote *"><input className="input" value={lotInfo.code} onChange={(e) => setLotInfo({ ...lotInfo, code: e.target.value })} placeholder="A-01" /></Field>
                  <div className="grid grid-cols-2 gap-2">
                    <Field label="Área m²"><input type="number" className="input" value={lotInfo.area || ''} onChange={(e) => setLotInfo({ ...lotInfo, area: Number(e.target.value) })} /></Field>
                    <Field label="Precio S/"><input type="number" className="input" value={lotInfo.price || ''} onChange={(e) => setLotInfo({ ...lotInfo, price: Number(e.target.value) })} /></Field>
                  </div>
                  <button className="btn-primary w-full" onClick={() => saveLot(blocks.find((x) => x.id === selectedBlk) || null)}>Guardar lote</button>
                </>
              )}
              <button className="btn-neutral w-full mt-2" onClick={closeShape}>Cerrar forma</button>
            </div>
          )}
          <div className="card">
            <h4 className="font-semibold mb-2">Manzanas ({blocks.length})</h4>
            <ul className="space-y-1 text-sm">
              {blocks.map((b) => (
                <li key={b.id} className="flex items-center justify-between rounded px-1 py-1" style={{ background: selectedBlk === b.id ? '#FFF1F3' : 'transparent' }}>
                  <button onClick={() => setSelectedBlk(selectedBlk === b.id ? null : b.id)} className="font-medium text-left min-w-0 truncate">Manzana {b.name} <span style={{ color: '#94a3b8' }}>({lots.filter((x) => x.blockId === b.id).length} lotes)</span></button>
                  <span className="flex gap-1 shrink-0">
                    <button className="btn-neutral !h-6 !px-2 text-xs" onClick={() => renameBlock(b)}>Nombrar</button>
                    <button className="btn-neutral !h-6 !px-2 text-xs" onClick={() => dupBlock(b)}>Duplicar</button>
                    <button className="btn-danger !h-6 !px-2 text-xs" onClick={() => delBlock(b)}>Eliminar</button>
                  </span>
                </li>
              ))}
            </ul>
          </div>
          <div className="card">
            <h4 className="font-semibold mb-2">Lotes ({lots.length})</h4>
            <ul className="space-y-1 text-sm max-h-56 overflow-auto">
              {lots.map((l) => (
                <li key={l.id} className="flex items-center justify-between rounded px-1 py-1">
                  <span className="font-medium">{l.code} <span style={{ color: '#94a3b8' }}>{l.areaM2} m² · {formatMoney(l.price)}</span></span>
                  <button className="btn-danger !h-6 !px-2 text-xs shrink-0" onClick={() => delLot(l)}>Eliminar</button>
                </li>
              ))}
              {lots.length === 0 && <li className="text-xs" style={{ color: '#94a3b8' }}>Aún no hay lotes.</li>}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}


