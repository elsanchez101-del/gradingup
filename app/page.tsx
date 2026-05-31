'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

const METRICS = [
  { label: 'Reclamos activos', value: '24' },
  { label: 'Tiempo promedio', value: '1.8 días' },
  { label: 'Precisión IA', value: '91%' },
  { label: 'Tasa de resolución', value: '66%' },
]

const ROLES = [
  { val: 'alumno', label: 'Alumno', sub: 'Fabrizio Morales · 20220847' },
  { val: 'docente', label: 'Docente', sub: 'Prof. C. Ramírez · Estadística' },
  { val: 'admin', label: 'Admin DAAR', sub: 'Administración académica' },
]

export default function Login() {
  const [role, setRole] = useState('alumno')
  const router = useRouter()

  function login(r?: string) {
    const selected = r || role
    localStorage.setItem('role', selected)
    router.push('/' + selected)
  }

  return (
    <div className="min-h-screen flex">
      {/* Panel izquierdo — azul marino */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12" style={{ background: '#002D62' }}>
        <div>
          <p className="text-xs font-semibold tracking-widest uppercase mb-10" style={{ color: 'rgba(255,255,255,0.4)' }}>
            Universidad del Pacífico · DAAR
          </p>
          <h1 className="text-7xl font-black text-white leading-none tracking-tight mb-4">
            Grading<span style={{ opacity: 0.5 }}>UP</span>
          </h1>
          <p className="text-sm font-light" style={{ color: 'rgba(255,255,255,0.45)' }}>
            Gestión digital de reclamos de exámenes
          </p>
        </div>

        <div>
          <p className="text-[11px] font-semibold uppercase tracking-widest mb-4" style={{ color: 'rgba(255,255,255,0.35)' }}>
            Métricas · Ciclo 2026-1
          </p>
          <div className="grid grid-cols-2 gap-3">
            {METRICS.map(m => (
              <div
                key={m.label}
                className="rounded-xl p-5"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}
              >
                <p className="text-xs mb-2" style={{ color: 'rgba(255,255,255,0.4)' }}>{m.label}</p>
                <p className="text-3xl font-bold text-white">{m.value}</p>
              </div>
            ))}
          </div>
          <p className="text-[11px] mt-6" style={{ color: 'rgba(255,255,255,0.2)' }}>
            Tiempo real · Supabase
          </p>
        </div>
      </div>

      {/* Panel derecho — blanco */}
      <div className="flex-1 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-sm">
          {/* Logo móvil */}
          <div className="lg:hidden mb-10">
            <h1 className="text-4xl font-black tracking-tight" style={{ color: '#002D62' }}>GradingUP</h1>
            <p className="text-sm text-gray-400 mt-1">Universidad del Pacífico · DAAR</p>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900">Bienvenido</h2>
            <p className="text-sm text-gray-400 mt-1">Selecciona tu rol para continuar</p>
          </div>

          <div className="space-y-2 mb-6">
            {ROLES.map(r => (
              <button
                key={r.val}
                onClick={() => setRole(r.val)}
                className="w-full p-4 rounded-xl text-left transition-all"
                style={{
                  border: role === r.val ? '2px solid #002D62' : '2px solid #e5e7eb',
                  background: role === r.val ? 'rgba(0,45,98,0.04)' : 'white',
                }}
              >
                <p className="text-sm font-semibold" style={{ color: role === r.val ? '#002D62' : '#374151' }}>
                  {r.label}
                </p>
                <p className="text-xs mt-0.5 text-gray-400">{r.sub}</p>
              </button>
            ))}
          </div>

          <button
            onClick={() => login()}
            className="w-full py-3.5 rounded-xl font-semibold text-sm text-white transition-all hover:opacity-90"
            style={{ background: '#002D62' }}
          >
            Ingresar al sistema
          </button>

          <p className="text-center text-gray-300 text-xs mt-8">Ciclo 2026-1 · Sistema DAAR</p>
        </div>
      </div>
    </div>
  )
}
