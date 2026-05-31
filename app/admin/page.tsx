'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase, Reclamo } from '@/lib/supabase'
import Sidebar from '@/components/Sidebar'

function Badge({ estado }: { estado: string }) {
  const styles: Record<string,string> = { pendiente:'bg-amber-100 text-amber-800', revision:'bg-blue-100 text-blue-800', resuelto:'bg-green-100 text-green-800', rechazado:'bg-red-100 text-red-800' }
  const labels: Record<string,string> = { pendiente:'Pendiente', revision:'En revisión', resuelto:'Resuelto', rechazado:'No procedente' }
  return <span className={`inline-flex px-2 py-1 rounded-full text-xs font-semibold ${styles[estado]||styles.pendiente}`}>{labels[estado]||estado}</span>
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
        <header className="bg-white border-b border-gray-100 px-5 h-12 flex items-center justify-between sticky top-0 z-10 shadow-sm">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-gray-400">GradingUP</span><span className="text-gray-300">›</span>
            <span className="font-medium">{panel === 'panel' ? 'Panel general' : 'Todos los reclamos'}</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs font-medium text-green-600">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />En vivo · Supabase
          </div>
        </header>
        <div className="p-5 flex-1">
          {panel === 'panel' && (
            <div>
              <div className="mb-5"><h1 className="text-xl font-bold">Panel general</h1><p className="text-gray-500 text-sm mt-0.5">Tiempo real · Ciclo 2026-1</p></div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
                {[['Total', reclamos.length, '#3B82F6'],['Pendientes', pend, '#C9A84C'],['Resueltos', res, '#10B981'],['Exámenes', examenes.length, '#8B5CF6']].map(([l,n,c]) => (
                  <div key={String(l)} className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm" style={{borderTop:`3px solid ${c}`}}>
                    <p className="text-xs text-gray-500 uppercase tracking-wider">{l}</p>
                    <p className="text-3xl font-bold mt-1" style={{color:'#002D62'}}>{n}</p>
                  </div>
                ))}
              </div>
              <div className="grid md:grid-cols-2 gap-4 mb-4">
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
                  <div className="px-5 py-4 border-b border-gray-100"><h3 className="font-semibold text-sm">Actividad reciente</h3></div>
                  <div className="p-4">
                    {loading ? <p className="text-gray-400 text-sm text-center py-4">Cargando...</p> : reclamos.length === 0 ? <p className="text-gray-400 text-sm text-center py-4">Sin reclamos</p> : (
                      <div className="space-y-2">
                        {reclamos.slice(0,6).map(r => (
                          <div key={r.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                            <div><p className="text-xs font-medium">{r.alumno_nombre}</p><p className="text-[10px] text-gray-400">{r.curso}</p></div>
                            <Badge estado={r.estado} />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
                  <div className="px-5 py-4 border-b border-gray-100"><h3 className="font-semibold text-sm">Métricas</h3></div>
                  <div className="p-4 space-y-3">
                    {[['Recepción → Asignación','0 min (auto)','100','#10B981'],['Resolución promedio','1.8 días','36','#002D62'],['Tasa de procedencia','34%','34','#C9A84C'],['Precisión IA','91%','91','#8B5CF6']].map(([l,v,p,c]) => (
                      <div key={String(l)}>
                        <div className="flex justify-between text-xs mb-1"><span className="text-gray-500">{l}</span><strong style={{color:c as string}}>{v}</strong></div>
                        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden"><div className="h-full rounded-full" style={{width:`${p}%`,background:c as string}} /></div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              {examenes.length > 0 && (
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
                  <div className="px-5 py-4 border-b border-gray-100"><h3 className="font-semibold text-sm">Exámenes subidos</h3></div>
                  <div className="p-4 space-y-2">
                    {examenes.slice(0,3).map(e => (
                      <div key={e.id} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                        {e.foto_url ? <img src={e.foto_url} className="w-10 h-10 object-cover rounded-lg" alt="" /> : <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400">📄</div>}
                        <div><p className="text-xs font-medium">{e.curso}</p><p className="text-[10px] text-gray-400">{e.tipo} · {e.fecha}</p></div>
                        <span className="ml-auto text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full font-semibold">✓</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          {panel === 'todos' && (
            <div>
              <div className="mb-5"><h1 className="text-xl font-bold">Todos los reclamos</h1><p className="text-gray-500 text-sm mt-0.5">Supabase en vivo</p></div>
              <div className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm">
                {loading ? <p className="text-center text-gray-400 py-10">Cargando...</p> : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead><tr className="bg-gray-50 border-b border-gray-100">
                        {['ID','Alumno','Curso','Estado','Power Campus'].map(h => (
                          <th key={h} className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">{h}</th>
                        ))}
                      </tr></thead>
                      <tbody>
                        {reclamos.map(r => (
                          <tr key={r.id} className="border-b border-gray-50 hover:bg-gray-50">
                            <td className="px-4 py-3 text-xs font-mono text-gray-500">#{String(r.id).split('-')[0].toUpperCase()}</td>
                            <td className="px-4 py-3 text-sm font-medium">{r.alumno_nombre}</td>
                            <td className="px-4 py-3 text-sm text-gray-600">{r.curso}</td>
                            <td className="px-4 py-3"><Badge estado={r.estado} /></td>
                            <td className="px-4 py-3">
                              {r.estado === 'resuelto' ? <span className="text-xs bg-green-50 text-green-700 px-2 py-1 rounded-full font-medium">✓ {r.nota_nueva || ''}</span> : <span className="text-xs text-gray-400">—</span>}
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