'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase, Reclamo } from '@/lib/supabase'
import Sidebar from '@/components/Sidebar'

function Badge({ estado }: { estado: string }) {
  const styles: Record<string, string> = {
    pendiente: 'bg-amber-100 text-amber-800',
    revision: 'bg-blue-100 text-blue-800',
    resuelto: 'bg-green-100 text-green-800',
    rechazado: 'bg-red-100 text-red-800',
  }
  const labels: Record<string, string> = {
    pendiente: 'Pendiente', revision: 'En revisión', resuelto: 'Resuelto', rechazado: 'No procedente'
  }
  return <span className={`inline-flex px-2 py-1 rounded-full text-xs font-semibold ${styles[estado] || styles.pendiente}`}>{labels[estado] || estado}</span>
}

export default function AlumnoPage() {
  const router = useRouter()
  const [panel, setPanel] = useState('lista')
  const [reclamos, setReclamos] = useState<Reclamo[]>([])
  const [selected, setSelected] = useState<Reclamo | null>(null)
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [form, setForm] = useState({ curso: '', tipo: '', nota: '', motivo: '', descripcion: '' })

  useEffect(() => {
    if (!localStorage.getItem('role')) { router.push('/'); return }
    load()
    const ch = supabase.channel('al-rt')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reclamos' }, load)
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [])

  async function load() {
    setLoading(true)
    const { data } = await supabase.from('reclamos').select('*').eq('alumno_codigo', '20220847').order('created_at', { ascending: false })
    setReclamos(data || [])
    setLoading(false)
  }

  async function enviar() {
    if (!form.curso || !form.tipo || !form.nota || !form.motivo || !form.descripcion) return alert('Completa todos los campos')
    setSending(true)
    const { error } = await supabase.from('reclamos').insert([{
      alumno_nombre: 'Fabrizio Morales', alumno_codigo: '20220847',
      curso: form.curso, tipo_evaluacion: form.tipo, nota_actual: parseFloat(form.nota),
      motivo: form.motivo, descripcion: form.descripcion, estado: 'pendiente', docente: 'Prof. Ramírez',
    }])
    setSending(false)
    if (error) return alert('Error: ' + error.message)
    setForm({ curso: '', tipo: '', nota: '', motivo: '', descripcion: '' })
    load()
    setPanel('lista')
  }

  const proc = reclamos.filter(r => r.estado === 'pendiente' || r.estado === 'revision').length

  return (
    <div className="flex min-h-screen">
      <div className="hidden md:flex md:flex-col md:fixed md:top-0 md:left-0 md:bottom-0 md:w-52">
        <Sidebar role="alumno" name="Fabrizio Morales" initials="FM" activePanel={panel} onNav={setPanel} />
      </div>
      <main className="flex-1 md:ml-52 flex flex-col">
        <header className="bg-white border-b border-gray-100 px-5 h-12 flex items-center justify-between sticky top-0 z-10 shadow-sm">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-gray-400">GradingUP</span><span className="text-gray-300">›</span>
            <span className="font-medium">{panel === 'lista' ? 'Mis reclamos' : panel === 'nuevo' ? 'Nuevo reclamo' : 'Detalle'}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 text-xs font-medium text-green-600">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />En vivo
            </div>
            <span className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full font-medium">2026-1</span>
          </div>
        </header>
        <div className="p-5 flex-1">
          {panel === 'lista' && (
            <div>
              <div className="flex items-start justify-between mb-5 flex-wrap gap-3">
                <div><h1 className="text-xl font-bold">Mis reclamos</h1><p className="text-gray-500 text-sm mt-0.5">Tiempo real · Ciclo 2026-1</p></div>
                <button onClick={() => setPanel('nuevo')} className="text-white text-sm font-medium px-4 py-2 rounded-lg" style={{background:'#002D62'}}>+ Nuevo reclamo</button>
              </div>
              <div className="grid grid-cols-3 gap-3 mb-5">
                {[['Total', reclamos.length, '#3B82F6'], ['En proceso', proc, '#C9A84C'], ['Resueltos', reclamos.filter(r=>r.estado==='resuelto').length, '#10B981']].map(([l,n,c]) => (
                  <div key={String(l)} className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm" style={{borderTop:`3px solid ${c}`}}>
                    <p className="text-xs text-gray-500 uppercase tracking-wider">{l}</p>
                    <p className="text-3xl font-bold mt-1" style={{color:'#002D62'}}>{n}</p>
                  </div>
                ))}
              </div>
              {loading ? <p className="text-center text-gray-400 py-10">Cargando...</p> : reclamos.length === 0 ? (
                <div className="bg-white rounded-xl border border-gray-100 p-12 text-center shadow-sm">
                  <p className="text-4xl mb-3">📋</p>
                  <h3 className="font-semibold text-gray-700 mb-1">Sin reclamos todavía</h3>
                  <p className="text-gray-400 text-sm">Envía uno y aparece aquí en tiempo real</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {reclamos.map(r => (
                    <div key={r.id} onClick={() => { setSelected(r); setPanel('detalle') }}
                      className="bg-white rounded-xl border border-gray-100 p-4 cursor-pointer hover:shadow-md transition-all shadow-sm"
                      style={{borderLeft:`4px solid ${r.estado==='resuelto'?'#10B981':r.estado==='rechazado'?'#EF4444':r.estado==='revision'?'#3B82F6':'#C9A84C'}`}}>
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="text-[10px] text-gray-400 font-mono">#{String(r.id).split('-')[0].toUpperCase()}</p>
                          <p className="font-semibold text-sm">{r.curso}</p>
                        </div>
                        <Badge estado={r.estado} />
                      </div>
                      <div className="flex gap-3 text-xs text-gray-500">
                        <span>{new Date(r.created_at).toLocaleDateString('es-PE',{day:'numeric',month:'short'})}</span>
                        <span>{r.tipo_evaluacion}</span>
                        <span>{r.motivo}</span>
                      </div>
                      {r.estado === 'resuelto' && r.nota_nueva && (
                        <div className="mt-3 flex items-center gap-2 bg-green-50 rounded-lg px-3 py-2">
                          <span className="text-lg font-bold text-gray-400 line-through">{r.nota_actual}</span>
                          <span className="text-gray-400">→</span>
                          <span className="text-lg font-bold text-green-600">{r.nota_nueva}</span>
                          <span className="bg-green-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">+{(r.nota_nueva - r.nota_actual).toFixed(1)} pts</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          {panel === 'nuevo' && (
            <div className="max-w-xl">
              <button onClick={() => setPanel('lista')} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 mb-5">← Volver</button>
              <div className="mb-5"><h1 className="text-xl font-bold">Nuevo reclamo</h1><p className="text-gray-500 text-sm mt-0.5">Tu solicitud llega a DAAR al instante</p></div>
              <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 mb-5 text-sm text-blue-700">
                ℹ️ Plazo: <strong>5 días útiles</strong> desde publicación de notas. Vence <strong>9 jun 2026</strong>.
              </div>
              <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Curso *</label>
                  <select className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none" value={form.curso} onChange={e => setForm({...form, curso:e.target.value})}>
                    <option value="">Selecciona...</option>
                    <option>Estadística para Negocios II</option>
                    <option>Microeconomía Avanzada</option>
                    <option>Finanzas Corporativas</option>
                    <option>Derecho Empresarial</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Tipo *</label>
                    <select className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none" value={form.tipo} onChange={e => setForm({...form, tipo:e.target.value})}>
                      <option value="">Selecciona...</option>
                      <option>Examen Parcial</option><option>Examen Final</option><option>Práctica calificada</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Nota publicada *</label>
                    <input className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none" type="number" min="0" max="20" step="0.5" placeholder="0–20" value={form.nota} onChange={e => setForm({...form, nota:e.target.value})} />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Motivo *</label>
                  <select className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none" value={form.motivo} onChange={e => setForm({...form, motivo:e.target.value})}>
                    <option value="">Selecciona...</option>
                    <option>Pregunta mal calificada</option>
                    <option>Error en suma de puntos</option>
                    <option>Respuesta correcta no considerada</option>
                    <option>No se aplicó el criterio del solucionario</option>
                    <option>Otro</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Descripción *</label>
                  <textarea className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none h-24 resize-none" placeholder="Explica tu reclamo..." value={form.descripcion} onChange={e => setForm({...form, descripcion:e.target.value})} />
                </div>
                <div className="flex gap-3 pt-2 border-t border-gray-100">
                  <button onClick={() => setPanel('lista')} className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50">Cancelar</button>
                  <button onClick={enviar} disabled={sending} className="flex-1 py-2 rounded-lg text-sm font-medium text-white" style={{background:'#002D62'}}>
                    {sending ? 'Enviando...' : 'Enviar reclamo a DAAR'}
                  </button>
                </div>
              </div>
            </div>
          )}
          {panel === 'detalle' && selected && (
            <div className="max-w-2xl">
              <button onClick={() => setPanel('lista')} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 mb-5">← Volver</button>
              <div className="flex items-start justify-between mb-5 flex-wrap gap-3">
                <div><h1 className="text-xl font-bold">{selected.curso}</h1><p className="text-gray-500 text-xs font-mono">#{String(selected.id).split('-')[0].toUpperCase()} · {selected.tipo_evaluacion}</p></div>
                <Badge estado={selected.estado} />
              </div>
              <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm mb-4">
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div><p className="text-xs text-gray-500">Nota publicada</p><p className="font-semibold mt-0.5">{selected.nota_actual}/20</p></div>
                  <div><p className="text-xs text-gray-500">Motivo</p><p className="font-semibold mt-0.5">{selected.motivo}</p></div>
                  <div><p className="text-xs text-gray-500">Docente</p><p className="font-semibold mt-0.5">{selected.docente}</p></div>
                  <div><p className="text-xs text-gray-500">Enviado</p><p className="font-semibold mt-0.5">{new Date(selected.created_at).toLocaleDateString('es-PE',{day:'numeric',month:'short',year:'numeric'})}</p></div>
                </div>
                <div className="bg-gray-50 border-l-4 rounded-r-lg p-3 text-sm text-gray-700 leading-relaxed" style={{borderLeftColor:'#C9A84C'}}>{selected.descripcion}</div>
              </div>
              {selected.estado === 'resuelto' && selected.nota_nueva && (
                <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Resolución del docente</p>
                  <div className="flex items-center gap-3 bg-green-50 rounded-xl p-4 mb-3">
                    <span className="text-2xl font-bold text-gray-400 line-through">{selected.nota_actual}</span>
                    <span className="text-gray-400 text-lg">→</span>
                    <span className="text-2xl font-bold text-green-600">{selected.nota_nueva}</span>
                    <span className="bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full">+{(selected.nota_nueva - selected.nota_actual).toFixed(1)} pts</span>
                  </div>
                  {selected.resolucion && <div className="bg-gray-50 border-l-4 border-green-500 rounded-r-lg p-3 text-sm text-gray-700 mb-4">{selected.resolucion}</div>}
                  <div className="rounded-xl p-4" style={{background:'#002D62'}}>
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-xs font-bold px-2 py-0.5 rounded" style={{background:'#C9A84C',color:'#001535'}}>PC</span>
                      <span className="text-white font-semibold text-sm">Power Campus · Registro oficial</span>
                    </div>
                    {[['Alumno', selected.alumno_nombre],['Curso', selected.curso],['Nota anterior', String(selected.nota_actual)],['Nota actualizada', selected.nota_nueva + ' ✓']].map(([k,v]) => (
                      <div key={k} className="flex justify-between py-1.5 border-b border-white/10 last:border-0 text-xs">
                        <span className="text-white/50">{k}</span>
                        <span className={k === 'Nota actualizada' ? 'font-bold' : 'text-white font-medium'} style={k === 'Nota actualizada' ? {color:'#C9A84C'} : {}}>{v}</span>
                      </div>
                    ))}
                    <div className="mt-3 rounded-lg p-2 text-xs font-medium" style={{background:'rgba(13,122,69,0.2)',color:'#5DD4A0'}}>✓ Cambio registrado en Power Campus</div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}