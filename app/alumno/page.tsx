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

  const cardBorder = (estado: string) => {
    const map: Record<string, string> = {
      pendiente: 'rgba(0,45,98,0.25)',
      revision: '#002D62',
      resuelto: 'rgba(0,45,98,0.5)',
      rechazado: '#cbd5e1',
    }
    return map[estado] || 'rgba(0,45,98,0.25)'
  }

  return (
    <div className="flex min-h-screen">
      <div className="hidden md:flex md:flex-col md:fixed md:top-0 md:left-0 md:bottom-0 md:w-52">
        <Sidebar role="alumno" name="Fabrizio Morales" initials="FM" activePanel={panel} onNav={setPanel} />
      </div>
      <main className="flex-1 md:ml-52 flex flex-col">
        <header className="bg-white border-b border-gray-100 px-5 h-12 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-gray-300">GradingUP</span>
            <span className="text-gray-200">›</span>
            <span className="font-medium text-gray-700">
              {panel === 'lista' ? 'Mis reclamos' : panel === 'nuevo' ? 'Nuevo reclamo' : 'Detalle'}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs font-medium" style={{ color: '#002D62' }}>
              <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#002D62' }} />
              En vivo
            </div>
            <span
              className="text-xs px-2 py-1 rounded-full font-medium"
              style={{ background: 'rgba(0,45,98,0.07)', color: '#002D62' }}
            >
              2026-1
            </span>
          </div>
        </header>

        <div className="p-5 flex-1 bg-gray-50">
          {panel === 'lista' && (
            <div>
              <div className="flex items-start justify-between mb-5 flex-wrap gap-3">
                <div>
                  <h1 className="text-xl font-bold text-gray-900">Mis reclamos</h1>
                  <p className="text-gray-400 text-sm mt-0.5">Tiempo real · Ciclo 2026-1</p>
                </div>
                <button
                  onClick={() => setPanel('nuevo')}
                  className="text-white text-sm font-medium px-4 py-2 rounded-lg transition-opacity hover:opacity-90"
                  style={{ background: '#002D62' }}
                >
                  Nuevo reclamo
                </button>
              </div>

              <div className="grid grid-cols-3 gap-3 mb-5">
                {[
                  ['Total', reclamos.length],
                  ['En proceso', proc],
                  ['Resueltos', reclamos.filter(r => r.estado === 'resuelto').length],
                ].map(([l, n]) => (
                  <div key={String(l)} className="bg-white rounded-xl border border-gray-100 p-4" style={{ borderTop: '2px solid #002D62' }}>
                    <p className="text-xs text-gray-400 uppercase tracking-wider font-medium">{l}</p>
                    <p className="text-3xl font-bold mt-1" style={{ color: '#002D62' }}>{n}</p>
                  </div>
                ))}
              </div>

              {loading ? (
                <p className="text-center text-gray-400 py-10 text-sm">Cargando...</p>
              ) : reclamos.length === 0 ? (
                <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
                  <h3 className="font-semibold text-gray-700 mb-1">Sin reclamos todavía</h3>
                  <p className="text-gray-400 text-sm">Envía uno y aparece aquí en tiempo real</p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {reclamos.map(r => (
                    <div
                      key={r.id}
                      onClick={() => { setSelected(r); setPanel('detalle') }}
                      className="bg-white rounded-xl border border-gray-100 p-4 cursor-pointer hover:shadow-sm transition-all"
                      style={{ borderLeft: `3px solid ${cardBorder(r.estado)}` }}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="text-[10px] text-gray-400 font-mono">#{String(r.id).split('-')[0].toUpperCase()}</p>
                          <p className="font-semibold text-sm text-gray-900">{r.curso}</p>
                        </div>
                        <Badge estado={r.estado} />
                      </div>
                      <div className="flex gap-3 text-xs text-gray-400">
                        <span>{new Date(r.created_at).toLocaleDateString('es-PE', { day: 'numeric', month: 'short' })}</span>
                        <span>{r.tipo_evaluacion}</span>
                        <span>{r.motivo}</span>
                      </div>
                      {r.estado === 'resuelto' && r.nota_nueva && (
                        <div className="mt-3 flex items-center gap-2 rounded-lg px-3 py-2" style={{ background: 'rgba(0,45,98,0.05)' }}>
                          <span className="text-base font-bold text-gray-300 line-through">{r.nota_actual}</span>
                          <span className="text-gray-300 text-sm">→</span>
                          <span className="text-base font-bold" style={{ color: '#002D62' }}>{r.nota_nueva}</span>
                          <span className="text-xs font-bold px-2 py-0.5 rounded-full text-white" style={{ background: '#002D62' }}>
                            +{(r.nota_nueva - r.nota_actual).toFixed(1)} pts
                          </span>
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
              <button onClick={() => setPanel('lista')} className="flex items-center gap-1 text-sm text-gray-400 hover:text-gray-700 mb-5 transition-colors">
                ← Volver
              </button>
              <div className="mb-5">
                <h1 className="text-xl font-bold text-gray-900">Nuevo reclamo</h1>
                <p className="text-gray-400 text-sm mt-0.5">Tu solicitud llega a DAAR al instante</p>
              </div>
              <div
                className="rounded-lg p-3 mb-5 text-sm"
                style={{ background: 'rgba(0,45,98,0.05)', border: '1px solid rgba(0,45,98,0.12)', color: '#002D62' }}
              >
                Plazo: <strong>5 días útiles</strong> desde publicación de notas. Vence <strong>9 jun 2026</strong>.
              </div>
              <div className="bg-white rounded-xl border border-gray-100 p-5 space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Curso *</label>
                  <select
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-gray-400 bg-white"
                    value={form.curso}
                    onChange={e => setForm({ ...form, curso: e.target.value })}
                  >
                    <option value="">Selecciona...</option>
                    <option>Estadística para Negocios II</option>
                    <option>Microeconomía Avanzada</option>
                    <option>Finanzas Corporativas</option>
                    <option>Derecho Empresarial</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Tipo *</label>
                    <select
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-gray-400 bg-white"
                      value={form.tipo}
                      onChange={e => setForm({ ...form, tipo: e.target.value })}
                    >
                      <option value="">Selecciona...</option>
                      <option>Examen Parcial</option>
                      <option>Examen Final</option>
                      <option>Práctica calificada</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Nota publicada *</label>
                    <input
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-gray-400"
                      type="number" min="0" max="20" step="0.5" placeholder="0–20"
                      value={form.nota}
                      onChange={e => setForm({ ...form, nota: e.target.value })}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Motivo *</label>
                  <select
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-gray-400 bg-white"
                    value={form.motivo}
                    onChange={e => setForm({ ...form, motivo: e.target.value })}
                  >
                    <option value="">Selecciona...</option>
                    <option>Pregunta mal calificada</option>
                    <option>Error en suma de puntos</option>
                    <option>Respuesta correcta no considerada</option>
                    <option>No se aplicó el criterio del solucionario</option>
                    <option>Otro</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Descripción *</label>
                  <textarea
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-gray-400 h-24 resize-none"
                    placeholder="Explica tu reclamo..."
                    value={form.descripcion}
                    onChange={e => setForm({ ...form, descripcion: e.target.value })}
                  />
                </div>
                <div className="flex gap-3 pt-2 border-t border-gray-100">
                  <button
                    onClick={() => setPanel('lista')}
                    className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-500 hover:bg-gray-50 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={enviar}
                    disabled={sending}
                    className="flex-1 py-2 rounded-lg text-sm font-medium text-white transition-opacity disabled:opacity-50"
                    style={{ background: '#002D62' }}
                  >
                    {sending ? 'Enviando...' : 'Enviar reclamo a DAAR'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {panel === 'detalle' && selected && (
            <div className="max-w-2xl">
              <button onClick={() => setPanel('lista')} className="flex items-center gap-1 text-sm text-gray-400 hover:text-gray-700 mb-5 transition-colors">
                ← Volver
              </button>
              <div className="flex items-start justify-between mb-5 flex-wrap gap-3">
                <div>
                  <h1 className="text-xl font-bold text-gray-900">{selected.curso}</h1>
                  <p className="text-gray-400 text-xs font-mono mt-0.5">
                    #{String(selected.id).split('-')[0].toUpperCase()} · {selected.tipo_evaluacion}
                  </p>
                </div>
                <Badge estado={selected.estado} />
              </div>

              <div className="bg-white rounded-xl border border-gray-100 p-5 mb-4">
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div>
                    <p className="text-xs text-gray-400">Nota publicada</p>
                    <p className="font-semibold mt-0.5 text-gray-900">{selected.nota_actual}/20</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Motivo</p>
                    <p className="font-semibold mt-0.5 text-gray-900">{selected.motivo}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Docente</p>
                    <p className="font-semibold mt-0.5 text-gray-900">{selected.docente}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Enviado</p>
                    <p className="font-semibold mt-0.5 text-gray-900">
                      {new Date(selected.created_at).toLocaleDateString('es-PE', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                </div>
                <div
                  className="bg-gray-50 rounded-r-lg p-3 text-sm text-gray-700 leading-relaxed"
                  style={{ borderLeft: '3px solid #002D62' }}
                >
                  {selected.descripcion}
                </div>
              </div>

              {selected.estado === 'resuelto' && selected.nota_nueva && (
                <div className="bg-white rounded-xl border border-gray-100 p-5">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Resolución del docente</p>
                  <div className="flex items-center gap-3 rounded-xl p-4 mb-3" style={{ background: 'rgba(0,45,98,0.05)' }}>
                    <span className="text-2xl font-bold text-gray-300 line-through">{selected.nota_actual}</span>
                    <span className="text-gray-300 text-lg">→</span>
                    <span className="text-2xl font-bold" style={{ color: '#002D62' }}>{selected.nota_nueva}</span>
                    <span className="text-xs font-bold px-2 py-1 rounded-full text-white" style={{ background: '#002D62' }}>
                      +{(selected.nota_nueva - selected.nota_actual).toFixed(1)} pts
                    </span>
                  </div>
                  {selected.resolucion && (
                    <div className="bg-gray-50 rounded-r-lg p-3 text-sm text-gray-700 mb-4" style={{ borderLeft: '3px solid #002D62' }}>
                      {selected.resolucion}
                    </div>
                  )}
                  <div className="rounded-xl p-4" style={{ background: '#002D62' }}>
                    <div className="flex items-center gap-2 mb-3">
                      <span
                        className="text-xs font-bold px-2 py-0.5 rounded text-white"
                        style={{ background: 'rgba(255,255,255,0.15)' }}
                      >
                        PC
                      </span>
                      <span className="text-white font-semibold text-sm">Power Campus · Registro oficial</span>
                    </div>
                    {[
                      ['Alumno', selected.alumno_nombre],
                      ['Curso', selected.curso],
                      ['Nota anterior', String(selected.nota_actual)],
                      ['Nota actualizada', String(selected.nota_nueva)],
                    ].map(([k, v]) => (
                      <div key={k} className="flex justify-between py-1.5 border-b last:border-0 text-xs" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
                        <span style={{ color: 'rgba(255,255,255,0.4)' }}>{k}</span>
                        <span
                          className="font-medium"
                          style={{ color: k === 'Nota actualizada' ? 'rgba(255,255,255,0.9)' : 'white', fontWeight: k === 'Nota actualizada' ? 700 : 500 }}
                        >
                          {v}
                        </span>
                      </div>
                    ))}
                    <div
                      className="mt-3 rounded-lg p-2 text-xs font-medium text-white text-center"
                      style={{ background: 'rgba(255,255,255,0.1)' }}
                    >
                      Cambio registrado en Power Campus
                    </div>
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
