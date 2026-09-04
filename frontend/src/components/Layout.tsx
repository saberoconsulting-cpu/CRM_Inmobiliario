'use client';
import { useEffect, useState, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { clearSession, getSessionUser } from '@/lib/api';
import { User, UserRole } from '@/lib/types';

// Navegación lateral según rol
import {
  FiHome, FiMap, FiLayers, FiUsers, FiTag, FiCreditCard, FiPieChart,
  FiVolume2, FiAward, FiUserCheck, FiSettings, FiUser, FiLogOut, FiBell,
} from 'react-icons/fi';

interface NavItem { href: string; label: string; icon: JSX.Element; roles: UserRole[] }

const NAV: NavItem[] = [
  { href: '/dashboard', label: 'Inicio', icon: <FiHome />, roles: ['superadmin', 'admin', 'agent'] },
  { href: '/projects', label: 'Proyectos', icon: <FiMap />, roles: ['superadmin', 'admin', 'agent'] },
  { href: '/lots', label: 'Lotes', icon: <FiLayers />, roles: ['superadmin', 'admin', 'agent'] },
  { href: '/clients', label: 'Clientes y leads', icon: <FiUsers />, roles: ['superadmin', 'admin', 'agent'] },
  { href: '/sales', label: 'Ventas', icon: <FiTag />, roles: ['superadmin', 'admin', 'agent'] },
  { href: '/payments', label: 'Pagos', icon: <FiCreditCard />, roles: ['superadmin', 'admin', 'agent'] },
  { href: '/finances', label: 'Finanzas', icon: <FiPieChart />, roles: ['superadmin', 'admin'] },
  { href: '/campaigns', label: 'Campañas', icon: <FiVolume2 />, roles: ['superadmin', 'admin'] },
  { href: '/agents', label: 'Agentes', icon: <FiAward />, roles: ['superadmin', 'admin'] },
  { href: '/users', label: 'Usuarios', icon: <FiUserCheck />, roles: ['superadmin', 'admin'] },
  { href: '/settings', label: 'Configuración', icon: <FiSettings />, roles: ['superadmin'] },
];

export default function Layout({ children, title }: { children: ReactNode; title?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const u = getSessionUser();
    if (!u) { router.push('/login'); return; }
    setUser(u);
  }, [router]);

  if (!user) return null;

  const canManage = user.role === 'superadmin' || user.role === 'admin';
  const visible = NAV.filter((n) => n.roles.includes(user.role));
  const LOGO = user.name?.trim()?.charAt(0)?.toUpperCase() || user.email?.charAt(0)?.toUpperCase() || 'U';

  function isActive(h: string) {
    return pathname === h || pathname.startsWith(h + '/');
  }
  function logout() { clearSession(); router.push('/login'); }

  return (
    <div className="flex h-screen overflow-hidden bg-canvas">
      {/* Sidebar blanca, ítem activo rojo */}
      <aside className={`${open ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 fixed md:static inset-y-0 left-0 w-60 bg-white border-r z-30 flex flex-col transition-transform`} style={{ borderColor: '#E5E7EB', width: 240 }}>
        <div className="h-14 px-5 flex items-center gap-2.5 border-b shrink-0" style={{ borderColor: '#F0F1F3' }}>
          <span className="bg-brand-gradient w-8 h-8 rounded-md text-white font-bold grid place-items-center" style={{ fontSize: 14 }}>IN</span>
          <span className="font-semibold text-[15px]" style={{ color: '#171717' }}>Inmobiliario CRM</span>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <ul className="space-y-0.5">
            {visible.map((n) => {
              const active = isActive(n.href);
              return (
                <li key={n.href}>
                  <button onClick={() => { router.push(n.href); setOpen(false); }}
                    className={`w-full flex items-center gap-3 rounded-lg px-3 text-sm transition-colors ${active ? 'bg-[#E30620] text-white' : 'text-[#374151] hover:bg-[#F3F4F6]'}`}
                    style={{ height: 38, fontWeight: active ? 600 : 500 }}>
                    <span style={{ fontSize: 16 }}>{n.icon}</span>{n.label}
                  </button>
                </li>
              );
            })}
          </ul>
          <div className="mt-4 mb-1.5 px-3 pt-3 border-t" style={{ borderColor: '#F0F1F3' }}>
            <p className="text-[11px] font-semibold tracking-wide" style={{ color: '#9AA1AB' }}>CUENTA</p>
          </div>
          <button onClick={() => { router.push('/profile'); setOpen(false); }}
            className={`w-full flex items-center gap-3 rounded-lg px-3 text-sm ${isActive('/profile') ? 'bg-[#E30620] text-white' : 'text-[#374151] hover:bg-[#F3F4F6]'}`}
            style={{ height: 38, fontWeight: 500 }}>
            <span style={{ fontSize: 16 }}><FiUser /></span>Perfil
          </button>
        </nav>

        <div className="px-3 py-3 border-t space-y-2 shrink-0" style={{ borderColor: '#F0F1F3' }}>
          <div className="flex items-center gap-2.5 px-2">
            <span className="w-8 h-8 rounded-full bg-softred text-[#E30620] font-semibold grid place-items-center" style={{ fontSize: 13 }}>{LOGO}</span>
            <span className="min-w-0 flex-1">
              <span className="block text-[13px] font-semibold truncate" style={{ color: '#171717' }}>{user.name}</span>
              <span className="block text-[11px] capitalize" style={{ color: '#6B7280' }}>{user.role === 'agent' ? 'Agente comercial' : user.role}</span>
            </span>
          </div>
          <button onClick={logout} className="w-full flex items-center gap-3 rounded-lg px-3 text-sm text-[#6B7280] hover:text-[#E30620] hover:bg-[#F3F4F6]" style={{ height: 34 }}>
            <span style={{ fontSize: 16 }}><FiLogOut /></span>Cerrar sesión
          </button>
        </div>
      </aside>

      {open && <div className="fixed inset-0 bg-black/25 z-20 md:hidden" onClick={() => setOpen(false)} />}

      {/* Área principal */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 bg-white border-b px-5 flex items-center gap-4 sticky top-0 z-10 shrink-0" style={{ borderColor: '#E5E7EB' }}>
          <button className="md:hidden text-[#374151]" onClick={() => setOpen(true)} aria-label="Abrir menú">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M3 12h18M3 18h18"/></svg>
          </button>
          <div className="flex-1 min-w-0">
            {title && <h1 className="truncate" style={{ fontSize: 17 }}>{title}</h1>}
          </div>
          {canManage && (
            <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-softred text-[#E30620] px-3" style={{ height: 28, fontSize: 12 }}>
              <span className="w-1.5 h-1.5 rounded-full bg-[#E30620]" /> Acceso de administración
            </span>
          )}
          <button className="p-1 text-[#6B7280] hover:text-[#171717]" aria-label="Notificaciones"><FiBell style={{ fontSize: 17 }} /></button>
        </header>
        <main className="flex-1 overflow-y-auto p-5 md:p-6 bg-canvas">{children}</main>
      </div>
    </div>
  );
}
