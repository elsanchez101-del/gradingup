'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function Login() {
  const [role, setRole] = useState('alumno')
  const router = useRouter()

  function login(r?: string) {
    const selected = r || role
    localStorage.setItem('role', selected)
    router.push('/' + selected)
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{background:'linear-gradient(135deg,#001535,#002D62)'}}>
      <div className="w-full max-w-sm">
        <div className="mb-8">
          <p className="text-xs font-bold tracking-widest uppercase mb-3" style={{color:'#C9A84C'}}>
            Universidad del Pacífico · DAAR
          </p>
          <h1 className="text-5xl font-black text-white leading-none">
            Grading<span style={{color:'#C9A84C'}}>UP</span>
          </h1>
          <p className="text-sm text-white/40 mt-2 font-light">Gestión digital de reclamos de exámenes</p>
        </div>
        <div className="rounded-2xl p-6" style={{background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.08)'}}>
          <p className="text-xs text-white/40 uppercase tracking-wider mb-3 font-semibold">Selecciona tu rol</p>
          <div className="space-y-2 mb-5">
            {[
              {val:'alumno', label:'👤 Alumno', sub:'Fabrizio Morales · 20220847'},
              {val:'docente', label:'👨‍🏫 Docente', sub:'Prof. C. Ramírez · Estadística'},
              {val:'admin', label:'🏢 Admin DAAR', sub:'Administración académica'},
            ].map(r => (
              <button key={r.val} onClick={() => setRole(r.val)}
                className="w-full p-3 rounded-xl text-left transition-all"
                style={{
                  border: role === r.val ? '1px solid #C9A84C' : '1px solid rgba(255,255,255,0.08)',
                  background: role === r.val ? 'rgba(201,168,76,0.08)' : 'transparent',
                }}>
                <p className="text-sm font-semibold" style={{color: role === r.val ? '#C9A84C' : 'white'}}>{r.label}</p>
                <p className="text-xs mt-0.5 text-white/40">{r.sub}</p>
              </button>
            ))}
          </div>
          <button onClick={() => login()}
            className="w-full py-3 rounded-xl font-bold text-sm transition-all hover:-translate-y-0.5"
            style={{background:'#C9A84C', color:'#001535'}}>
            Ingresar al sistema →
          </button>
        </div>
      </div>
    </div>
  )
}