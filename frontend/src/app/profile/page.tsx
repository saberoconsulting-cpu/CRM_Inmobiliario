'use client';
import { useState, useEffect, FormEvent } from 'react';
import Layout from '@/components/Layout';
import { Toaster, toast } from '@/components/ui';
import { api, getSessionUser } from '@/lib/api';

export default function ProfilePage() {
  const [me, setMe] = useState<any>(null);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api.get<any>('/auth/profile').then(setMe).catch((e) => toast(e.message, 'err'));
  }, []);

  async function onChangePass(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await api.post('/auth/change-password', { currentPassword, newPassword });
      toast('Contraseña actualizada');
      setCurrentPassword(''); setNewPassword('');
    } catch (err: any) { toast(err.message, 'err'); } finally { setBusy(false); }
  }

  return (
    <Layout title="Mi perfil">
      <Toaster />
      <div className="max-w-xl space-y-5">
        <div className="card flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-brand-600 text-white flex items-center justify-center text-2xl font-bold uppercase">
            {me?.name?.charAt(0)}
          </div>
          <div>
            <div className="text-lg font-semibold">{me?.name}</div>
            <div className="text-sm text-slate-500">{me?.email}</div>
            <div className="text-xs mt-1"><span className="badge bg-brand-100 text-brand-700 capitalize">{me?.role}</span> {' '} {me?.status === 'active' ? 'Activo' : 'Inactivo'}</div>
          </div>
        </div>

        {me?.role === 'agent' && (
          <div className="card grid grid-cols-3 gap-3">
            <div><div className="label">Comisión</div><b>{me?.commissionRate ?? 0}%</b></div>
            <div><div className="label">Meta lotes/mes</div><b>{me?.monthlyGoalLots || 0}</b></div>
            <div><div className="label">Meta S/ /mes</div><b>{Number(me?.monthlyGoalAmount||0).toLocaleString()}</b></div>
          </div>
        )}

        <div className="card">
          <h3 className="font-semibold mb-4">Cambiar contraseña</h3>
          <form onSubmit={onChangePass}>
            <div className="mb-3"><label className="label">Contraseña actual</label>
              <input type="password" className="input" value={currentPassword} onChange={(e)=>setCurrentPassword(e.target.value)} required />
            </div>
            <div className="mb-4"><label className="label">Nueva contraseña</label>
              <input type="password" className="input" value={newPassword} onChange={(e)=>setNewPassword(e.target.value)} required minLength={6} />
            </div>
            <button className="btn-primary" disabled={busy}>{busy ? 'Guardando…' : 'Actualizar contraseña'}</button>
          </form>
        </div>
      </div>
    </Layout>
  );
}
