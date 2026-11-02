import { supabase } from '@/lib/supabase'

/**
 * Persistencia de la configuración del centro.
 * Con Supabase usa la tabla `business_settings` (una sola fila, solo admin).
 * Sin Supabase (modo demostración) guarda en localStorage.
 *
 * Los formularios usan nombres en español (ver data/settingsSections.js);
 * acá se traducen a las columnas de la base.
 */

const STORAGE_KEY = 'beautyflow.settings'

/** Campo del formulario -> columna de texto. */
const COLUMNS = {
  nombre: 'owner_name',
  profesion: 'owner_profession',
  matricula: 'owner_license',
  razonSocial: 'legal_name',
  cuit: 'cuit',
  condicionFiscal: 'tax_condition',
  telefono: 'phone',
  whatsapp: 'whatsapp',
  email: 'email',
  nombreComercial: 'business_name',
  direccion: 'address',
  descripcion: 'description',
  colorPrincipal: 'primary_color',
  colorSecundario: 'secondary_color',
}

/** Columna jsonb -> campos del formulario que contiene. */
const JSON_GROUPS = {
  opening_hours: ['apertura', 'cierre', 'descansoInicio', 'descansoFin', 'diasAtencion'],
  booking_rules: ['requiereSena', 'porcentajeSena', 'horasCancelacion', 'permiteReprogramar'],
  payment_options: ['mercadoPago', 'transferencia', 'cbuAlias', 'efectivo'],
  notification_rules: ['notifWhatsapp', 'notifEmail', 'horasRecordatorio'],
}

const BOOLEAN_FIELDS = new Set([
  'requiereSena',
  'permiteReprogramar',
  'mercadoPago',
  'transferencia',
  'efectivo',
  'notifWhatsapp',
  'notifEmail',
])
const NUMBER_FIELDS = new Set(['porcentajeSena', 'horasCancelacion', 'horasRecordatorio'])
const COLOR_DEFAULTS = { colorPrincipal: '#1F4638', colorSecundario: '#C7AD97' }

/**
 * @typedef {Record<string, any>} SettingsValues
 * @typedef {{ id: string | null, values: SettingsValues, error: string | null }} LoadResult
 * @typedef {{ id: string | null, error: string | null }} SaveResult
 */

/**
 * Convierte la fila de la base en valores de formulario.
 * @param {Record<string, any>} row
 * @returns {SettingsValues}
 */
export function rowToValues(row) {
  /** @type {SettingsValues} */
  const values = {}
  for (const [field, column] of Object.entries(COLUMNS)) {
    values[field] = row[column] ?? ''
  }
  for (const column of Object.keys(JSON_GROUPS)) {
    Object.assign(values, row[column] ?? {})
  }
  return values
}

/**
 * Convierte los valores del formulario en la fila a guardar.
 * Los textos vacíos pasan a `null` (el CUIT vacío rompería su restricción).
 * @param {SettingsValues} values
 */
export function valuesToRow(values) {
  /** @type {Record<string, any>} */
  const row = {}

  for (const [field, column] of Object.entries(COLUMNS)) {
    const raw = typeof values[field] === 'string' ? values[field].trim() : values[field]
    row[column] = raw === undefined || raw === '' ? (COLOR_DEFAULTS[/** @type {keyof typeof COLOR_DEFAULTS} */ (field)] ?? null) : raw
  }

  for (const [column, fields] of Object.entries(JSON_GROUPS)) {
    /** @type {Record<string, any>} */
    const group = {}
    for (const field of fields) {
      const raw = values[field]
      if (BOOLEAN_FIELDS.has(field)) group[field] = Boolean(raw)
      else if (NUMBER_FIELDS.has(field)) group[field] = raw === '' || raw == null ? null : Number(raw)
      else group[field] = typeof raw === 'string' ? raw.trim() : (raw ?? '')
    }
    row[column] = group
  }

  return row
}

/** @returns {SettingsValues} */
function readLocal() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')
  } catch {
    return {}
  }
}

/**
 * Carga la configuración guardada.
 * @returns {Promise<LoadResult>}
 */
export async function loadSettings() {
  if (!supabase) return { id: null, values: readLocal(), error: null }

  const { data, error } = await supabase.from('business_settings').select('*').limit(1).maybeSingle()
  if (error) return { id: null, values: {}, error: error.message }
  return { id: data?.id ?? null, values: data ? rowToValues(data) : {}, error: null }
}

/**
 * Guarda la configuración (crea la fila la primera vez, luego la actualiza).
 * @param {string | null} id
 * @param {SettingsValues} values
 * @returns {Promise<SaveResult>}
 */
export async function saveSettings(id, values) {
  if (!supabase) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(values))
    return { id: null, error: null }
  }

  const row = valuesToRow(values)
  const query = id
    ? supabase.from('business_settings').update(row).eq('id', id)
    : supabase.from('business_settings').insert(row)

  const { data, error } = await query.select('id').single()
  if (error) {
    // PGRST116: no se afectó ninguna fila (RLS bloqueó el guardado).
    const message =
      error.code === 'PGRST116' ? 'No tenés permiso para guardar la configuración.' : error.message
    return { id, error: message }
  }
  return { id: data.id, error: null }
}
