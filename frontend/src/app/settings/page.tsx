'use client';
import Layout from '@/components/Layout';
import { Toaster, toast } from '@/components/ui';
import { api } from '@/lib/api';
import { useEffect, useState } from 'react';

export default function SettingsPage() {
  const [me, setMe] = useState<any>(null);
  useEffect(() => { api.get<any>('/auth/profile').then(setMe).catch(() => {}); }, []);
  const save = () => toast('Preferencia guardada', 'ok');

  return (
    <Layout title="Configuración">
      <Toaster />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="card">
          <h3 className="font-semibold mb-1">Datos de la empresa</h3>
          <p className="text-sm mb-4" style={{ color: '#6B7280' }}>Identidad mostrada en la aplicación.</p>
          <div className="space-y-4">
            <div><label className="label">Nombre de la inmobiliaria</label><input className="input" defaultValue="Inmobiliaria S.A.C." onChange={save} /></div>
            <div><label className="label">Correo de administración</label><input type="email" className="input" defaultValue={me?.email || ''} onChange={save} /></div>
            <div className="flex items-center gap-3"><label className="label mb-0">Color de marca</label><input type="color" defaultValue="#E30620" className="h-10 w-16 border rounded" onChange={save} /><span className="text-sm" style={{ color: '#6B7280' }}>#E30620</span></div>
          </div>
        </div>
        <div className="card">
          <h3 className="font-semibold mb-2">Preferencias del sistema</h3>
          <p className="text-sm mb-4" style={{ color: '#6B7280' }}>Operación diaria de avisos.</p>
          <label className="flex items-center justify-between py-2 border-b" style={{ borderColor: '#F0F1F3' }}><span className="text-sm">Alertas de cuotas vencidas</span><input type="checkbox" defaultChecked onChange={save} /></label>
          <label className="flex items-center justify-between py-2 border-b" style={{ borderColor: '#F0F1F3' }}><span className="text-sm">Notificar al registrar un pago</span><input type="checkbox" defaultChecked onChange={save} /></label>
          <p className="text-xs mt-4" style={{ color: '#9AA1AB' }}>Estados de lote, comisiones y metas se administran desde Usuarios / Agentes y cada lote.</p>
        </div>
        <div className="card lg:col-span-2">
          <h3 className="font-semibold mb-3">Entorno</h3>
          <div className="grid sm:grid-cols-3 gap-3 text-sm">
            <div className="rounded-lg bg-canvas p-3"><span className="label">Usuario</span>{me?.name || '—'} ({me?.role || ''})</div>
            <div className="rounded-lg bg-canvas p-3"><span className="label">Base de datos</span>crm_inmobiliario · PostgreSQL</div>
            <div className="rounded-lg bg-canvas p-3"><span className="label">Archivos</span>Local /uploads</div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
