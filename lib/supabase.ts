import { createClient } from '@supabase/supabase-js'
export const supabase = createClient('https://aabvubqntppolhyotkik.supabase.co','sb_publishable_Kbd-1hTOoq61XBooQtGg-w_ohczC4qX')
export type Reclamo = { id: string; alumno_nombre: string; alumno_codigo: string; curso: string; tipo_evaluacion: string; nota_actual: number; motivo: string; descripcion: string; estado: 'pendiente' | 'revision' | 'resuelto' | 'rechazado'; docente: string; nota_nueva?: number; resolucion?: string; created_at: string }
