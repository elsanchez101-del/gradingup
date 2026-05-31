'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

type Props = {
  role: string
  name: string
  initials: string
  activePanel: string
  onNav: (panel: string) => void
}

export default function Sidebar({ role, name, initials, activePanel, onNav }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)

  const roleLabel = role === 'alumno' ? 'Alumno' : role === 'docente' ? 'Docente' : 'Admin'

  const navItems = {
    alumno: [
      { id: 'lista', label: 'Mis reclamos' },
      { id: 'nuevo', label: 'Nuevo reclamo' },
    ],
    docente: [
      { id: 'reclamos', label: 'Reclamos' },
      { id: 'scan', label: 'Escanear examen' },
    ],
    admin: [
      { id: 'panel', label: 'Panel general' },
      { id: 'todos', label: 'Todos los reclamos' },
    ],
  }

  const SidebarContent = () => (
    <aside className="w-52 flex flex-col h-full" style={{ background: '#002D62' }}>
      <div className="p-4 flex items-center gap-2.5" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black flex-shrink-0"
          style={{ background: 'rgba(255,255,255,0.12)', color: 'white' }}
        >
          UP
        </div>
        <div>
          <p className="text-white text-xs font-bold">GradingUP</p>
          <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.3)' }}>DAAR · Pregrado</p>
        </div>
      </div>

      <div className="p-3 flex items-center gap-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
        <div
          className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
          style={{ background: 'rgba(255,255,255,0.1)', color: 'white' }}
        >
          {initials}
        </div>
        <div className="min-w-0">
          <p className="text-white text-xs font-medium truncate">{name}</p>
          <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.3)' }}>{roleLabel.toLowerCase()}</p>
        </div>
        <span
          className="ml-auto text-[9px] font-semibold px-1.5 py-0.5 rounded flex-shrink-0"
          style={{ background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.7)' }}
        >
          {roleLabel}
        </span>
      </div>

      <nav className="p-2 flex-1">
        <p className="text-[9px] font-semibold uppercase tracking-widest px-2 py-2" style={{ color: 'rgba(255,255,255,0.2)' }}>
          Principal
        </p>
        {(navItems[role as keyof typeof navItems] || []).map(item => (
          <button
            key={item.id}
            onClick={() => { onNav(item.id); setOpen(false) }}
            className="w-full flex items-center px-3 py-2.5 rounded-lg text-xs transition-all text-left"
            style={{
              background: activePanel === item.id ? 'rgba(255,255,255,0.1)' : 'transparent',
              color: activePanel === item.id ? 'white' : 'rgba(255,255,255,0.45)',
              borderLeft: activePanel === item.id ? '2px solid white' : '2px solid transparent',
              fontWeight: activePanel === item.id ? 600 : 400,
            }}
          >
            {item.label}
          </button>
        ))}
      </nav>

      <div className="p-3" style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
        <button
          onClick={() => { localStorage.removeItem('role'); router.push('/') }}
          className="text-xs transition-colors"
          style={{ color: 'rgba(255,255,255,0.3)' }}
          onMouseEnter={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.6)')}
          onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.3)')}
        >
          Cerrar sesión
        </button>
      </div>
    </aside>
  )

  return (
    <>
      <div className="hidden md:flex md:flex-col h-full">
        <SidebarContent />
      </div>

      <button
        onClick={() => setOpen(!open)}
        className="md:hidden fixed top-3 left-3 z-[100] w-8 h-8 flex items-center justify-center rounded-lg"
        style={{ background: '#002D62' }}
        aria-label={open ? 'Cerrar menú' : 'Abrir menú'}
      >
        {open ? (
          <span className="text-white font-light text-xl leading-none">×</span>
        ) : (
          <div className="flex flex-col gap-1">
            <span className="block w-4 h-0.5 rounded bg-white" />
            <span className="block w-4 h-0.5 rounded bg-white" />
            <span className="block w-4 h-0.5 rounded bg-white" />
          </div>
        )}
      </button>

      {open && (
        <div
          className="md:hidden fixed inset-0 z-40"
          onClick={() => setOpen(false)}
          style={{ background: 'rgba(0,0,0,0.4)' }}
        >
          <div className="h-full w-52" onClick={e => e.stopPropagation()}>
            <SidebarContent />
          </div>
        </div>
      )}
    </>
  )
}
