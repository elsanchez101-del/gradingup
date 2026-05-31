'use client'
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
  const roleColor = role === 'alumno' ? '#C9A84C' : role === 'docente' ? '#7FB3FF' : '#5DD4A0'
  const roleBg = role === 'alumno' ? 'rgba(201,168,76,0.2)' : role === 'docente' ? 'rgba(26,86,160,0.3)' : 'rgba(13,122,69,0.3)'
  const roleLabel = role === 'alumno' ? 'Alumno' : role === 'docente' ? 'Docente' : 'Admin'

  const navItems = {
    alumno: [
      { id: 'lista', label: 'Mis reclamos', icon: '📋' },
      { id: 'nuevo', label: 'Nuevo reclamo', icon: '➕' },
    ],
    docente: [
      { id: 'reclamos', label: 'Reclamos', icon: '📋' },
      { id: 'scan', label: 'Escanear examen', icon: '📷' },
    ],
    admin: [
      { id: 'panel', label: 'Panel general', icon: '📊' },
      { id: 'todos', label: 'Todos los reclamos', icon: '📋' },
    ],
  }

  return (
    <aside className="w-52 flex flex-col h-full" style={{background:'#002D62'}}>
      <div className="p-4 flex items-center gap-2" style={{borderBottom:'1px solid rgba(255,255,255,0.07)'}}>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black flex-shrink-0" style={{background:'#C9A84C',color:'#001535'}}>UP</div>
        <div><p className="text-white text-xs font-bold">GradingUP</p><p className="text-white/30 text-[10px]">DAAR · Pregrado</p></div>
      </div>
      <div className="p-3 flex items-center gap-2" style={{borderBottom:'1px solid rgba(255,255,255,0.07)'}}>
        <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0" style={{background:roleBg,color:roleColor}}>{initials}</div>
        <div className="min-w-0"><p className="text-white text-xs font-medium truncate">{name}</p><p className="text-white/30 text-[10px]">{roleLabel.toLowerCase()}</p></div>
        <span className="ml-auto text-[9px] font-bold px-1.5 py-0.5 rounded flex-shrink-0" style={{background:roleBg,color:roleColor}}>{roleLabel}</span>
      </div>
      <nav className="p-2 flex-1">
        <p className="text-white/20 text-[9px] uppercase tracking-widest px-2 py-2">Principal</p>
        {(navItems[role as keyof typeof navItems] || []).map(item => (
          <button key={item.id} onClick={() => onNav(item.id)}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs transition-all text-left"
            style={{
              background: activePanel === item.id ? 'rgba(255,255,255,0.08)' : 'transparent',
              color: activePanel === item.id ? 'white' : 'rgba(255,255,255,0.5)',
              borderLeft: activePanel === item.id ? '3px solid #C9A84C' : '3px solid transparent',
            }}>
            <span>{item.icon}</span>{item.label}
          </button>
        ))}
      </nav>
      <div className="p-3" style={{borderTop:'1px solid rgba(255,255,255,0.07)'}}>
        <button onClick={() => { localStorage.removeItem('role'); router.push('/') }}
          className="text-white/30 text-xs hover:text-white/60 transition-colors">
          ← Cerrar sesión
        </button>
      </div>
    </aside>
  )
}