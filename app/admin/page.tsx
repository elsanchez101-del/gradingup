'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase, Reclamo } from '@/lib/supabase'
import Sidebar from '@/components/Sidebar'

function Badge({ estado }: { estado: string }) {
  const configs: Record<string, { bg: string; color: string; border: string }> = {
    pendiente: { bg: 'rgba(0,45,98,0.07)', color: '#002D62', border: 'rgba(0,45,98,0.2)' },
    revision:  { bg: 'rgba(0,45,98,0.14)', color: '#002D62', border: 'rgba(0,45,98,0.3)' },
    resuelto:  { bg: '#002D62',            color: '#ffffff', border: '#002D62' },
    rechazado: { bg: '#f1f5f9',            color: '#64748b', border: '#e2e8f0' },
  }
  const labels: Record<string, string> = {
    pendiente: 'Pendiente', revision: 'En revisión', resuelto: 'Resuelto', rechazado: 'No procedente'
  }
  const cfg = configs[estado] || configs.pendiente
  return (
    <span
      className="inline-flex px-2.5 py-1 rounded-full text-xs font-medium"
      style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}
    >
      {labels[estado] || estado}
    </span>
  )
}

export default function AdminPage() {
  const router = useRouter()
  const [panel, setPanel] = useState('panel')
  const [reclamos, setReclamos] = useState<Reclamo[]>([])
  const [examenes, setExamenes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!localStorage.getItem('role')) { router.push('/'); return }
    load()
    const ch = supabase.channel('adm-rt')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reclamos' }, load)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'examenes' }, load)
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [])

  async function load() {
    setLoading(true)
    const [{ data: r }, { data: e }] = await Promise.all([
      supabase.from('reclamos').select('*').order('created_at', { ascending: false }),
      supabase.from('examenes').select('*').order('created_at', { ascending: false }),
    ])
    setReclamos(r || [])
    setExamenes(e || [])
    setLoading(false)
  }

  const pend = reclamos.filter(r => r.estado === 'pendiente' || r.estado === 'revision').length
  const res = reclamos.filter(r => r.estado === 'resuelto' || r.estado === 'rechazado').length

  return (
    <div className="flex min-h-screen">
      <div className="hidden md:flex md:flex-col md:fixed md:top-0 md:left-0 md:bottom-0 md:w-52">
        <Sidebar role="admin" name="Admin DAAR" initials="DA" activePanel={panel} onNav={setPanel} />
      </div>
      <main className="flex-1 md:ml-52 flex flex-col">
        <header className="bg-white border-b border-gray-100 px-5 h-12 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-gray-300">GradingUP</span>
            <span className="text-gray-200">›</span>
            <span className="font-medium text-gray-700">
              {panel === 'panel' ? 'Panel general' : 'Todos los reclamos'}
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-xs font-medium" style={{ color: '#002D62' }}>
            <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#002D62' }} />
            En vivo · Supabase
          </div>
        </header>

        <div className="p-5 flex-1 bg-gray-50">
          {panel === 'panel' && (
            <div>
              <div className="mb-5">
                <h1 className="text-xl font-bold text-gray-900">Panel general</h1>
                <p className="text-gray-400 text-sm mt-0.5">Tiempo real · Ciclo 2026-1</p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
                {[
                  ['Total', reclamos.length],
                  ['Pendientes', pend],
                  ['Resueltos', res],
                  ['Exámenes', examenes.length],
                ].map(([l, n]) => (
                  <div key={String(l)} className="bg-white rounded-xl border border-gray-100 p-4" style={{ borderTop: '2px solid #002D62' }}>
                    <p className="text-xs text-gray-400 uppercase tracking-wider font-medium">{l}</p>
                    <p className="text-3xl font-bold mt-1" style={{ color: '#002D62' }}>{n}</p>
                  </div>
                ))}
              </div>

              <div className="grid md:grid-cols-2 gap-4 mb-4">
                <div className="bg-white rounded-xl border border-gray-100">
                  <div className="px-5 py-4 border-b border-gray-100">
                    <h3 className="font-semibold text-sm text-gray-900">Actividad reciente</h3>
                  </div>
                  <div className="p-4">
                    {loading ? (
                      <p className="text-gray-400 text-sm text-center py-4">Cargando...</p>
                    ) : reclamos.length === 0 ? (
                      <p className="text-gray-400 text-sm text-center py-4">Sin reclamos</p>
                    ) : (
                      <div className="space-y-1">
                        {reclamos.slice(0, 6).map(r => (
                          <div key={r.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                            <div>
                              <p className="text-xs font-medium text-gray-900">{r.alumno_nombre}</p>
                              <p className="text-[10px] text-gray-400">{r.curso}</p>
                            </div>
                            <Badge estado={r.estado} />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-gray-100">
                  <div className="px-5 py-4 border-b border-gray-100">
                    <h3 className="font-semibold text-sm text-gray-900">Métricas</h3>
                  </div>
                  <div className="p-4 space-y-3">
                    {[
                      ['Recepción → Asignación', '0 min (auto)', 100],
                      ['Resolución promedio', '1.8 días', 36],
                      ['Tasa de procedencia', '34%', 34],
                      ['Precisión IA', '91%', 91],
                    ].map(([l, v, p]) => (
                      <div key={String(l)}>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-gray-400">{l}</span>
                          <strong style={{ color: '#002D62' }}>{v}</strong>
                        </div>
                        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${p}%`, background: '#002D62' }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {examenes.length > 0 && (
                <div className="bg-white rounded-xl border border-gray-100">
                  <div className="px-5 py-4 border-b border-gray-100">
                    <h3 className="font-semibold text-sm text-gray-900">Exámenes subidos</h3>
                  </div>
                  <div className="p-4 space-y-2">
                    {examenes.slice(0, 3).map(e => (
                      <div key={e.id} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                        {e.foto_url ? (
                          <img src={e.foto_url} className="w-10 h-10 object-cover rounded-lg" alt="" />
                        ) : (
                          <div
                            className="w-10 h-10 rounded-lg flex items-center justify-center text-[10px] font-semibold"
                            style={{ background: 'rgba(0,45,98,0.07)', color: '#002D62' }}
                          >
                            EX
                          </div>
                        )}
                        <div>
                          <p className="text-xs font-medium text-gray-900">{e.curso}</p>
                          <p className="text-[10px] text-gray-400">{e.tipo} · {e.fecha}</p>
                        </div>
                        <span
                          className="ml-auto text-xs px-2 py-0.5 rounded-full font-semibold text-white"
                          style={{ background: '#002D62' }}
                        >
                          OK
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {panel === 'todos' && (
            <div>
              <div className="mb-5">
                <h1 className="text-xl font-bold text-gray-900">Todos los reclamos</h1>
                <p className="text-gray-400 text-sm mt-0.5">Supabase en vivo</p>
              </div>
              <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                {loading ? (
                  <p className="text-center text-gray-400 py-10 text-sm">Cargando...</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-100">
                          {['ID', 'Alumno', 'Curso', 'Estado', 'Power Campus'].map(h => (
                            <th
                              key={h}
                              className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-4 py-3"
                              style={{ background: '#fafafa' }}
                            >
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {reclamos.map(r => (
                          <tr key={r.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                            <td className="px-4 py-3 text-xs font-mono text-gray-400">#{String(r.id).split('-')[0].toUpperCase()}</td>
                            <td className="px-4 py-3 text-sm font-medium text-gray-900">{r.alumno_nombre}</td>
                            <td className="px-4 py-3 text-sm text-gray-500">{r.curso}</td>
                            <td className="px-4 py-3"><Badge estado={r.estado} /></td>
                            <td className="px-4 py-3">
                              {r.estado === 'resuelto' ? (
                                <span
                                  className="text-xs px-2 py-1 rounded-full font-medium"
                                  style={{ background: 'rgba(0,45,98,0.08)', color: '#002D62' }}
                                >
                                  {r.nota_nueva || 'Resuelto'}
                                </span>
                              ) : (
                                <span className="text-xs text-gray-300">—</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
