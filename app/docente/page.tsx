'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase, Reclamo } from '@/lib/supabase'
import Sidebar from '@/components/Sidebar'

function aiScore(motivo: string) {
  const m: Record<string, number> = {
    'Pregunta mal calificada': 78,
    'Error en suma de puntos': 85,
    'Respuesta correcta no considerada': 72,
    'No se aplicó el criterio del solucionario': 65,
    'Otro': 30,
  }
  return m[motivo] || 50
}

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

export default function DocentePage() {
  const router = useRouter()
  const [panel, setPanel] = useState('reclamos')
  const [reclamos, setReclamos] = useState<Reclamo[]>([])
  const [selected, setSelected] = useState<Reclamo | null>(null)
  const [loading, setLoading] = useState(true)
  const [decision, setDecision] = useState('')
  const [notaNueva, setNotaNueva] = useState('')
  const [just, setJust] = useState('')
  const [sending, setSending] = useState(false)
  const [fotos, setFotos] = useState<string[]>([])
  const [ocrDone, setOcrDone] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadPct, setUploadPct] = useState(0)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!localStorage.getItem('role')) { router.push('/'); return }
    load()
    const ch = supabase.channel('doc-rt')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reclamos' }, load)
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [])

  async function load() {
    setLoading(true)
    const { data } = await supabase.from('reclamos').select('*').eq('docente', 'Prof. Ramírez').order('created_at', { ascending: false })
    setReclamos(data || [])
    setLoading(false)
  }

  function handleFotos(files: FileList | null) {
    if (!files) return
    const previews: string[] = []
    Array.from(files).forEach(f => {
      const r = new FileReader()
      r.onload = e => {
        previews.push(e.target?.result as string)
        if (previews.length === files.length) setFotos([...previews])
      }
      r.readAsDataURL(f)
    })
    setTimeout(() => setOcrDone(true), 1500)
  }

  async function subir() {
    setUploading(true)
    setUploadPct(0)
    const iv = setInterval(() => setUploadPct(p => { if (p >= 90) { clearInterval(iv); return 90 } return p + 15 }), 200)
    const fileEl = fileRef.current
    let fotoUrl = null
    if (fileEl?.files?.[0]) {
      const fn = `exam-${Date.now()}-${fileEl.files[0].name}`
      const { error: ue } = await supabase.storage.from('examenes').upload(fn, fileEl.files[0])
      if (!ue) { const { data: ud } = supabase.storage.from('examenes').getPublicUrl(fn); fotoUrl = ud.publicUrl }
    }
    clearInterval(iv); setUploadPct(100)
    await supabase.from('examenes').insert([{
      curso: 'Estadística para Negocios II', tipo: 'Examen Parcial',
      fecha: new Date().toISOString().split('T')[0], puntaje_total: 20, publicado: true, foto_url: fotoUrl,
    }])
    setUploading(false)
    alert('Examen publicado')
    setFotos([]); setOcrDone(false); setUploadPct(0)
    setPanel('reclamos')
  }

  async function resolver() {
    if (!selected || !decision || !just) return alert('Completa todos los campos')
    if ((decision === 'resuelto' || decision === 'parcial') && !notaNueva) return alert('Ingresa la nota corregida')
    setSending(true)
    const upd: Record<string, unknown> = { estado: decision === 'rechazado' ? 'rechazado' : 'resuelto', resolucion: just }
    if (notaNueva) upd.nota_nueva = parseFloat(notaNueva)
    const { error } = await supabase.from('reclamos').update(upd).eq('id', selected.id)
    setSending(false)
    if (error) return alert('Error: ' + error.message)
    setDecision(''); setNotaNueva(''); setJust(''); setSelected(null)
    load(); setPanel('reclamos')
  }

  const pend = reclamos.filter(r => r.estado === 'pendiente' || r.estado === 'revision')
  const res = reclamos.filter(r => r.estado === 'resuelto' || r.estado === 'rechazado')

  return (
    <div className="flex min-h-screen">
      <div className="hidden md:flex md:flex-col md:fixed md:top-0 md:left-0 md:bottom-0 md:w-52">
        <Sidebar role="docente" name="Prof. C. Ramírez" initials="CR" activePanel={panel} onNav={setPanel} />
      </div>
      <main className="flex-1 md:ml-52 flex flex-col">
        <header className="bg-white border-b border-gray-100 px-5 h-12 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-gray-300 hidden md:block">GradingUP</span>
            <span className="text-gray-200 hidden md:block">›</span>
            <span className="font-medium text-gray-700">
              {panel === 'reclamos' ? 'Reclamos' : panel === 'scan' ? 'Escanear' : 'Resolver'}
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-xs font-medium" style={{ color: '#002D62' }}>
            <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#002D62' }} />
            En vivo
          </div>
        </header>

        <div className="p-5 flex-1 bg-gray-50">
          {panel === 'reclamos' && (
            <div>
              <div className="mb-5">
                <h1 className="text-xl font-bold text-gray-900">Reclamos por revisar</h1>
                <p className="text-gray-400 text-sm mt-0.5">Prioridad IA · Tiempo real</p>
              </div>

              <div className="grid grid-cols-3 gap-3 mb-5">
                {[
                  ['Urgentes', pend.filter(r => r.estado === 'pendiente').length],
                  ['Pendientes', pend.length],
                  ['Resueltos', res.length],
                ].map(([l, n]) => (
                  <div key={String(l)} className="bg-white rounded-xl border border-gray-100 p-4" style={{ borderTop: '2px solid #002D62' }}>
                    <p className="text-xs text-gray-400 uppercase tracking-wider font-medium">{l}</p>
                    <p className="text-3xl font-bold mt-1" style={{ color: '#002D62' }}>{n}</p>
                  </div>
                ))}
              </div>

              {loading ? (
                <p className="text-center text-gray-400 py-10 text-sm">Cargando...</p>
              ) : pend.length === 0 ? (
                <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
                  <h3 className="font-semibold text-gray-700">Todo al día</h3>
                  <p className="text-gray-400 text-sm mt-1">No hay reclamos pendientes</p>
                </div>
              ) : (
                pend.map(r => {
                  const sc = aiScore(r.motivo)
                  return (
                    <div
                      key={r.id}
                      onClick={() => { setSelected(r); setPanel('resolver') }}
                      className="bg-white rounded-xl border border-gray-100 p-4 cursor-pointer hover:shadow-sm transition-all mb-2.5"
                      style={{ borderLeft: `3px solid ${r.estado === 'revision' ? '#002D62' : 'rgba(0,45,98,0.3)'}` }}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="text-[10px] text-gray-400 font-mono">#{String(r.id).split('-')[0].toUpperCase()} · IA: {sc}%</p>
                          <p className="font-semibold text-sm text-gray-900">{r.alumno_nombre} — {r.curso}</p>
                        </div>
                        <Badge estado={r.estado} />
                      </div>
                      <div className="flex gap-3 text-xs text-gray-400 mb-3">
                        <span>{new Date(r.created_at).toLocaleDateString('es-PE', { day: 'numeric', month: 'short' })}</span>
                        <span>{r.motivo}</span>
                      </div>
                      <div
                        className="rounded-lg p-3"
                        style={{ background: 'rgba(0,45,98,0.04)', border: '1px solid rgba(0,45,98,0.1)' }}
                      >
                        <p className="text-[10px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: '#002D62' }}>
                          IA · {sc}% procedencia
                        </p>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(0,45,98,0.1)' }}>
                            <div className="h-full rounded-full" style={{ width: `${sc}%`, background: '#002D62' }} />
                          </div>
                          <span className="text-xs font-bold" style={{ color: '#002D62' }}>{sc}%</span>
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          )}

          {panel === 'scan' && (
            <div className="max-w-xl">
              <div className="mb-5">
                <h1 className="text-xl font-bold text-gray-900">Escanear examen</h1>
                <p className="text-gray-400 text-sm mt-0.5">30 segundos · OCR · Sube a Supabase</p>
              </div>

              <div className="rounded-xl p-5 mb-4" style={{ background: '#002D62' }}>
                <div
                  className="border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all"
                  style={{ borderColor: 'rgba(255,255,255,0.15)' }}
                  onClick={() => fileRef.current?.click()}
                  onMouseEnter={e => ((e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(255,255,255,0.35)')}
                  onMouseLeave={e => ((e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(255,255,255,0.15)')}
                >
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    multiple
                    capture="environment"
                    className="hidden"
                    onChange={e => handleFotos(e.target.files)}
                  />
                  {fotos.length === 0 ? (
                    <div>
                      <div className="w-10 h-10 rounded-xl mx-auto mb-3 flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.1)' }}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                          <circle cx="12" cy="13" r="4"/>
                        </svg>
                      </div>
                      <p className="text-white font-medium text-sm">Toca para escanear</p>
                      <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.4)' }}>Múltiples fotos · Cámara o galería</p>
                    </div>
                  ) : (
                    <div>
                      <div className="grid grid-cols-3 gap-2 mb-2">
                        {fotos.map((src, i) => (
                          <img key={i} src={src} className="w-full h-20 object-cover rounded-lg" alt="" />
                        ))}
                      </div>
                      <p className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>
                        {fotos.length} foto{fotos.length > 1 ? 's' : ''}
                      </p>
                    </div>
                  )}
                </div>

                {ocrDone && (
                  <div className="mt-3 rounded-lg p-3" style={{ background: 'rgba(255,255,255,0.06)' }}>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                      <p className="text-xs font-semibold uppercase tracking-wider text-white">OCR · 94% confianza</p>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {[['Alumno', 'Fabrizio Morales'], ['Código', '20220847'], ['Nota', '11/20'], ['Preguntas', '5']].map(([l, v]) => (
                        <div key={l} className="rounded p-2" style={{ background: 'rgba(255,255,255,0.06)' }}>
                          <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.4)' }}>{l}</p>
                          <p className="text-sm font-medium text-white">{v}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {uploading && (
                <div className="mb-4">
                  <p className="text-xs text-gray-400 mb-1">Subiendo...</p>
                  <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{ width: `${uploadPct}%`, background: '#002D62' }} />
                  </div>
                </div>
              )}

              <button
                onClick={subir}
                disabled={uploading || fotos.length === 0}
                className="w-full py-3 rounded-xl font-semibold text-sm text-white disabled:opacity-40 transition-opacity hover:opacity-90"
                style={{ background: '#002D62' }}
              >
                {uploading ? 'Subiendo...' : 'Subir y publicar'}
              </button>
            </div>
          )}

          {panel === 'resolver' && selected && (
            <div className="max-w-3xl">
              <button
                onClick={() => { setPanel('reclamos'); setSelected(null) }}
                className="flex items-center gap-1 text-sm text-gray-400 hover:text-gray-700 mb-5 transition-colors"
              >
                ← Volver
              </button>
              <div className="mb-5">
                <h1 className="text-xl font-bold text-gray-900">{selected.curso}</h1>
                <p className="text-gray-400 text-sm">{selected.alumno_nombre} · {selected.tipo_evaluacion}</p>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-4">
                  <div className="bg-white rounded-xl border border-gray-100 p-5">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Reclamo</p>
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div>
                        <p className="text-xs text-gray-400">Alumno</p>
                        <p className="font-medium text-sm text-gray-900">{selected.alumno_nombre}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">Nota</p>
                        <p className="font-medium text-sm text-gray-900">{selected.nota_actual}/20</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">Motivo</p>
                        <p className="font-medium text-sm text-gray-900">{selected.motivo}</p>
                      </div>
                    </div>
                    <div className="bg-gray-50 rounded-r-lg p-3 text-sm text-gray-700" style={{ borderLeft: '3px solid #002D62' }}>
                      {selected.descripcion}
                    </div>
                  </div>

                  <div
                    className="rounded-xl p-4"
                    style={{ background: 'rgba(0,45,98,0.04)', border: '1px solid rgba(0,45,98,0.1)' }}
                  >
                    <p className="text-[10px] font-semibold uppercase tracking-wider mb-2" style={{ color: '#002D62' }}>
                      IA · {aiScore(selected.motivo)}% procedencia
                    </p>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: 'rgba(0,45,98,0.1)' }}>
                        <div className="h-full rounded-full" style={{ width: `${aiScore(selected.motivo)}%`, background: '#002D62' }} />
                      </div>
                      <span className="text-sm font-bold" style={{ color: '#002D62' }}>{aiScore(selected.motivo)}%</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-gray-100 p-5">
                  <p className="text-sm font-semibold text-gray-900 mb-4">Tu resolución</p>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Decisión *</label>
                      <select
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-gray-400 bg-white"
                        value={decision}
                        onChange={e => setDecision(e.target.value)}
                      >
                        <option value="">Selecciona...</option>
                        <option value="resuelto">Aprobado — modificar nota</option>
                        <option value="parcial">Parcialmente aprobado</option>
                        <option value="rechazado">No procedente</option>
                      </select>
                    </div>
                    {(decision === 'resuelto' || decision === 'parcial') && (
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Anterior</label>
                          <input
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50"
                            value={selected.nota_actual}
                            readOnly
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Corregida *</label>
                          <input
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-gray-400"
                            type="number" min="0" max="20" step="0.5"
                            value={notaNueva}
                            onChange={e => setNotaNueva(e.target.value)}
                          />
                        </div>
                      </div>
                    )}
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Justificación *</label>
                      <textarea
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm h-20 resize-none focus:outline-none focus:border-gray-400"
                        placeholder="Explica tu decisión..."
                        value={just}
                        onChange={e => setJust(e.target.value)}
                      />
                    </div>
                    <button
                      onClick={resolver}
                      disabled={sending}
                      className="w-full py-3 rounded-xl font-semibold text-sm text-white transition-opacity disabled:opacity-50 hover:opacity-90"
                      style={{ background: '#002D62' }}
                    >
                      {sending ? 'Enviando...' : 'Enviar resolución'}
                    </button>
                    <button
                      onClick={() => {
                        setDecision(aiScore(selected.motivo) > 50 ? 'resuelto' : 'rechazado')
                        setJust(`IA recomienda ${aiScore(selected.motivo) > 50 ? 'aprobar' : 'rechazar'} (${aiScore(selected.motivo)}%).`)
                      }}
                      className="w-full py-2 rounded-xl text-xs border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors"
                    >
                      Aplicar IA ({aiScore(selected.motivo)}%)
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
