<template>
  <div class="calendario-container">
    <!-- Encabezado y navegación del mes -->
    <div class="cal-header">
      <h3>📅 Tu Mes en Órbita</h3>
      <div class="cal-nav">
        <button class="cal-nav-btn" @click="cambiarMes(-1)" aria-label="Mes anterior">‹</button>
        <span class="cal-mes-actual">{{ nombreMes }}</span>
        <button class="cal-nav-btn" @click="cambiarMes(1)" aria-label="Mes siguiente">›</button>
        <button class="cal-hoy-btn" @click="irAHoy">Hoy</button>
      </div>
    </div>

    <!-- Resumen ejecutivo del mes -->
    <div v-if="registrosMes.length > 0" class="resumen-ejecutivo">
      <h4>📊 Resumen del mes</h4>
      <div class="estadisticas">
        <div class="stat">
          <span class="stat-valor">{{ dolorMedio }}</span>
          <span class="stat-etiqueta">Dolor medio</span>
        </div>
        <div class="stat">
          <span class="stat-valor">{{ estresMedio }}</span>
          <span class="stat-etiqueta">Estrés medio</span>
        </div>
        <div class="stat">
          <span class="stat-valor">{{ deposicionesTotal }}</span>
          <span class="stat-etiqueta">Deposiciones totales</span>
        </div>
        <div class="stat">
          <span class="stat-valor">{{ sueñoMedio }}h</span>
          <span class="stat-etiqueta">Sueño medio</span>
        </div>
        <div class="stat">
          <span class="stat-valor">{{ totalRegistros }}/{{ diasDelMes }}</span>
          <span class="stat-etiqueta">Días registrados</span>
        </div>
      </div>
    </div>

    <!-- Formulario de registro rápido -->
    <details class="form-toggle" open>
      <summary>➕ Registrar día (click para abrir/cerrar)</summary>
      <form @submit.prevent="guardarRegistro" class="form-grid">
        <div class="campo-eii">
          <label>Fecha</label>
          <input v-model="nuevoRegistro.fecha" type="date" required />
        </div>
        <div class="campo-eii">
          <label>Nº deposiciones</label>
          <input v-model="nuevoRegistro.deposiciones" type="number" min="0" required />
        </div>
        <div class="campo-eii">
          <label>Tipo Bristol</label>
          <select v-model="nuevoRegistro.tipoBristol" required>
            <option value="">Selecciona</option>
            <option v-for="n in 7" :key="n" :value="n">{{ n }}</option>
          </select>
        </div>
        <div class="campo-eii">
          <label>Dolor (1-10)</label>
          <input v-model="nuevoRegistro.dolor" type="number" min="1" max="10" required />
        </div>
        <div class="campo-eii">
          <label>Estrés (1-10)</label>
          <input v-model="nuevoRegistro.estres" type="number" min="1" max="10" required />
        </div>
        <div class="campo-eii">
          <label>Horas de sueño</label>
          <input v-model="nuevoRegistro.sueño" type="number" min="0" step="0.5" required />
        </div>
        <div class="campo-eii full-width">
          <label>Notas (comida, evento, síntoma...)</label>
          <input v-model="nuevoRegistro.notas" placeholder="Opcional" />
        </div>
        <button type="submit" class="btn-cta full-width">
          💾 Guardar registro
        </button>
      </form>
    </details>

    <!-- Grid del mes -->
    <div class="mes-grid">
      <div v-for="d in ['L','M','X','J','V','S','D']" :key="d" class="dia-semana">{{ d }}</div>
      <div
        v-for="(celda, i) in celdasMes"
        :key="i"
        class="celda-dia"
        :class="{
          'celda-vacia': !celda,
          'celda-fuera': celda && celda.fuera,
          'celda-registrada': celda && celda.registro,
          'celda-seleccionada': celda && celda.fecha === fechaSeleccionada
        }"
        :style="celda && celda.registro ? { borderLeftColor: colorPorDolor(celda.registro.dolor) } : {}"
        @click="celda && celda.fecha ? seleccionarDia(celda.fecha) : null"
      >
        <template v-if="celda">
          <div class="celda-numero" :class="{ 'celda-hoy': celda.hoy }">{{ celda.dia }}</div>
          <div v-if="celda.registro" class="celda-indicadores">
            <span class="indicador" :title="`Dolor ${celda.registro.dolor}/10`" :style="{ background: colorPorDolor(celda.registro.dolor) }">D {{ celda.registro.dolor }}</span>
            <span class="indicador" :title="`${celda.registro.deposiciones} deposiciones, Bristol ${celda.registro.tipoBristol}`">B {{ celda.registro.tipoBristol }}</span>
          </div>
          <div v-if="celda.registro && celda.registro.notas" class="celda-nota" :title="celda.registro.notas">📝</div>
        </template>
      </div>
    </div>

    <!-- Leyenda del grid -->
    <div class="leyenda-grid">
      <span class="leyenda-item">
        <span class="cuadro" style="background:#2E8B57"></span> Dolor bajo
      </span>
      <span class="leyenda-item">
        <span class="cuadro" style="background:#E6A623"></span> Dolor medio
      </span>
      <span class="leyenda-item">
        <span class="cuadro" style="background:#C0392B"></span> Dolor alto
      </span>
      <span class="leyenda-item">
        <span class="cuadro cuadro-vacio" style="background:#fff;border:1px dashed #999"></span> Sin registro
      </span>
    </div>

    <!-- Detalle del día seleccionado -->
    <div v-if="registroSeleccionado" class="detalle-dia tarjeta-eii" style="margin-top:1.5rem">
      <h4>📌 {{ formatearFechaLarga(fechaSeleccionada) }}</h4>
      <div class="detalle-grid">
        <div><strong>Deposiciones:</strong> {{ registroSeleccionado.deposiciones }}</div>
        <div><strong>Bristol:</strong> {{ registroSeleccionado.tipoBristol }}</div>
        <div><strong>Dolor:</strong> {{ registroSeleccionado.dolor }}/10</div>
        <div><strong>Estrés:</strong> {{ registroSeleccionado.estres }}/10</div>
        <div><strong>Sueño:</strong> {{ registroSeleccionado.sueño }}h</div>
      </div>
      <p v-if="registroSeleccionado.notas" class="detalle-notas">📝 {{ registroSeleccionado.notas }}</p>
      <div class="detalle-acciones">
        <button class="btn-peligro" @click="borrarRegistro(fechaSeleccionada)">🗑️ Borrar este día</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, inject, onMounted } from 'vue'
import { REGISTROS_KEY } from '../theme/index.js'

const registros = inject(REGISTROS_KEY)
if (!registros) {
  throw new Error('Calendario.vue necesita el provider de registros (theme/index.js)')
}
const fechaSeleccionada = ref(null)

const hoy = new Date()
const mesActual = ref(hoy.getMonth())
const anioActual = ref(hoy.getFullYear())

const nuevoRegistro = ref({
  fecha: hoy.toISOString().split('T')[0],
  deposiciones: '',
  tipoBristol: '',
  dolor: '',
  estres: '',
  sueño: '',
  notas: ''
})

const STORAGE_KEY = 'registrosEII'

const nombreMes = computed(() => {
  const meses = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
  return `${meses[mesActual.value]} ${anioActual.value}`
})

const diasDelMes = computed(() => new Date(anioActual.value, mesActual.value + 1, 0).getDate())

const registrosMes = computed(() => {
  const prefijo = `${anioActual.value}-${String(mesActual.value + 1).padStart(2, '0')}`
  return registros.value.filter(r => r.fecha && r.fecha.startsWith(prefijo))
})

// Estadísticas del mes
const dolorMedio = computed(() => promedio(registrosMes.value, 'dolor'))
const estresMedio = computed(() => promedio(registrosMes.value, 'estres'))
const sueñoMedio = computed(() => {
  const m = promedio(registrosMes.value, 'sueño')
  return m === '—' ? m : m
})
const deposicionesTotal = computed(() =>
  registrosMes.value.reduce((s, r) => s + Number(r.deposiciones || 0), 0)
)
const totalRegistros = computed(() => registrosMes.value.length)

function promedio(lista, campo) {
  if (lista.length === 0) return '—'
  const t = lista.reduce((s, r) => s + Number(r[campo] || 0), 0)
  return (t / lista.length).toFixed(1)
}

// Celdas del mes con offset para que empiece en lunes
const celdasMes = computed(() => {
  const celdas = []
  const primerDia = new Date(anioActual.value, mesActual.value, 1)
  // Ajuste para que la semana empiece en lunes (0=domingo → 6, 1=lunes → 0)
  const offset = (primerDia.getDay() + 6) % 7
  for (let i = 0; i < offset; i++) celdas.push(null)

  for (let d = 1; d <= diasDelMes.value; d++) {
    const fecha = `${anioActual.value}-${String(mesActual.value + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    const registro = registros.value.find(r => r.fecha === fecha) || null
    const hoyStr = hoy.toISOString().split('T')[0]
    celdas.push({
      dia: d,
      fecha,
      registro,
      hoy: fecha === hoyStr,
      fuera: false
    })
  }
  return celdas
})

const registroSeleccionado = computed(() => {
  if (!fechaSeleccionada.value) return null
  return registros.value.find(r => r.fecha === fechaSeleccionada.value) || null
})

function colorPorDolor(d) {
  const n = Number(d)
  if (n <= 3) return '#2E8B57'   // verde
  if (n <= 6) return '#E6A623'   // ámbar
  return '#C0392B'                // rojo
}

function cambiarMes(delta) {
  let m = mesActual.value + delta
  let y = anioActual.value
  if (m < 0) { m = 11; y-- }
  if (m > 11) { m = 0; y++ }
  mesActual.value = m
  anioActual.value = y
}
function irAHoy() {
  mesActual.value = hoy.getMonth()
  anioActual.value = hoy.getFullYear()
  fechaSeleccionada.value = hoy.toISOString().split('T')[0]
}
function seleccionarDia(fecha) {
  // Si la celda tiene registro, lo carga; si no, abre el form con esa fecha
  fechaSeleccionada.value = fecha
  if (!registros.value.find(r => r.fecha === fecha)) {
    nuevoRegistro.value.fecha = fecha
  }
  // scroll al detalle
  setTimeout(() => {
    const el = document.querySelector('.detalle-dia')
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }, 50)
}

function formatearFechaLarga(fecha) {
  if (!fecha) return ''
  const [y, m, d] = fecha.split('-')
  const meses = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre']
  return `${parseInt(d)} de ${meses[parseInt(m) - 1]} de ${y}`
}

function guardarRegistro() {
  const r = { ...nuevoRegistro.value }
  // Reemplaza si ya existe esa fecha
  const idx = registros.value.findIndex(x => x.fecha === r.fecha)
  if (idx >= 0) {
    registros.value[idx] = r
  } else {
    registros.value = [...registros.value, r].sort((a, b) => a.fecha.localeCompare(b.fecha))
  }
  fechaSeleccionada.value = r.fecha
  // Reset suave
  nuevoRegistro.value = {
    fecha: hoy.toISOString().split('T')[0],
    deposiciones: '', tipoBristol: '', dolor: '', estres: '', sueño: '', notas: ''
  }
}

function borrarRegistro(fecha) {
  if (!confirm(`¿Borrar el registro del ${fecha}?`)) return
  registros.value = registros.value.filter(r => r.fecha !== fecha)
  fechaSeleccionada.value = null
}

onMounted(() => {
  // La persistencia la gestiona useRegistrosEII (inyectado desde el theme).
})

defineExpose({ registros })
</script>

<style scoped>
.calendario-container {
  background: var(--brand-tarjeta);
  border-radius: 24px;
  padding: 2rem;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.06);
  border: 1px solid var(--brand-borde-suave);
  margin: 2rem 0;
}

.cal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
  margin-bottom: 1.25rem;
}
.cal-header h3 {
  font-size: 1.5rem;
  font-weight: 800;
  color: var(--brand-petroleo);
  margin: 0;
}
.cal-nav {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: #FBFCFD;
  padding: 0.35rem 0.6rem;
  border-radius: 14px;
  border: 1px solid var(--brand-borde);
}
.cal-nav-btn {
  width: 32px;
  height: 32px;
  border-radius: 10px;
  border: none;
  background: var(--brand-naranja);
  color: #fff;
  font-size: 1.2rem;
  font-weight: 800;
  cursor: pointer;
  font-family: inherit;
  transition: all 0.15s ease;
}
.cal-nav-btn:hover { background: var(--brand-naranja-hover); }
.cal-mes-actual {
  font-weight: 700;
  color: var(--brand-petroleo);
  min-width: 140px;
  text-align: center;
  text-transform: capitalize;
}
.cal-hoy-btn {
  background: var(--brand-petroleo);
  color: #fff;
  border: none;
  padding: 0.4rem 0.85rem;
  border-radius: 10px;
  font-weight: 700;
  font-size: 0.85rem;
  cursor: pointer;
  font-family: inherit;
  margin-left: 0.3rem;
}
.cal-hoy-btn:hover { background: #0F2A35; }

/* Resumen */
.resumen-ejecutivo {
  background: linear-gradient(135deg, rgba(230,126,34,0.06), rgba(46,139,87,0.04));
  border-radius: 16px;
  padding: 1.2rem 1.5rem;
  margin-bottom: 1.5rem;
  border: 1px solid var(--brand-borde-suave);
}
.resumen-ejecutivo h4 {
  font-size: 0.85rem;
  text-transform: uppercase;
  letter-spacing: 0.6px;
  color: var(--brand-texto-secundario);
  margin: 0 0 0.8rem 0;
  font-weight: 700;
}
.estadisticas {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(110px, 1fr));
  gap: 1rem;
}
.stat { text-align: center; }
.stat-valor {
  display: block;
  font-size: 1.6rem;
  font-weight: 800;
  color: var(--brand-petroleo);
  line-height: 1.1;
}
.stat-etiqueta {
  font-size: 0.75rem;
  color: var(--brand-texto-secundario);
}

/* Form */
.form-toggle {
  background: #FBFCFD;
  border: 1px solid var(--brand-borde);
  border-radius: 14px;
  padding: 0.9rem 1.1rem;
  margin-bottom: 1.5rem;
}
.form-toggle > summary {
  cursor: pointer;
  font-weight: 700;
  color: var(--brand-petroleo);
  list-style: none;
  user-select: none;
}
.form-toggle > summary::-webkit-details-marker { display: none; }
.form-toggle > summary::before {
  content: '📝 ';
  margin-right: 0.3rem;
}
.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.85rem;
  margin-top: 1rem;
}
.full-width { grid-column: 1 / -1; }

/* Grid del mes */
.mes-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 6px;
  margin: 1.25rem 0 0.5rem;
}
.dia-semana {
  text-align: center;
  font-size: 0.75rem;
  font-weight: 800;
  color: var(--brand-texto-secundario);
  letter-spacing: 0.5px;
  text-transform: uppercase;
  padding-bottom: 0.3rem;
}
.celda-dia {
  aspect-ratio: 1;
  background: #FBFCFD;
  border: 1px solid var(--brand-borde);
  border-left: 4px solid transparent;
  border-radius: 10px;
  padding: 0.35rem;
  font-size: 0.75rem;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  cursor: pointer;
  transition: all 0.15s ease;
  position: relative;
  overflow: hidden;
}
.celda-dia:hover:not(.celda-vacia):not(.celda-fuera) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(230,126,34,0.18);
  border-color: var(--brand-naranja);
}
.celda-vacia {
  background: transparent;
  border: 1px dashed transparent;
  cursor: default;
}
.celda-fuera {
  background: #F1F3F5;
  opacity: 0.5;
  cursor: default;
}
.celda-seleccionada {
  background: rgba(230,126,34,0.12);
  border-color: var(--brand-naranja);
  box-shadow: 0 0 0 3px rgba(230,126,34,0.18);
}
.celda-numero {
  font-weight: 700;
  color: var(--brand-petroleo);
  font-size: 0.85rem;
}
.celda-hoy {
  background: var(--brand-naranja);
  color: #fff;
  padding: 0.05rem 0.4rem;
  border-radius: 8px;
  display: inline-block;
  align-self: flex-start;
}
.celda-indicadores {
  display: flex;
  flex-wrap: wrap;
  gap: 2px;
  margin-top: auto;
}
.indicador {
  font-size: 0.65rem;
  font-weight: 700;
  color: #fff;
  padding: 0.05rem 0.3rem;
  border-radius: 6px;
  background: var(--brand-petroleo);
}
.celda-nota {
  position: absolute;
  top: 0.25rem;
  right: 0.3rem;
  font-size: 0.7rem;
}

/* Leyenda */
.leyenda-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  font-size: 0.78rem;
  color: var(--brand-texto-secundario);
  padding: 0.5rem 0 1rem;
  border-top: 1px dashed var(--brand-borde);
  margin-top: 0.75rem;
}
.leyenda-item { display: flex; align-items: center; gap: 0.4rem; }
.cuadro {
  width: 14px; height: 14px; border-radius: 4px; display: inline-block;
}

/* Detalle del día */
.detalle-dia h4 { margin-top: 0; }
.detalle-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 0.5rem 1rem;
  font-size: 0.95rem;
  color: var(--brand-petroleo);
}
.detalle-notas {
  margin: 0.75rem 0 0;
  padding: 0.6rem 0.8rem;
  background: rgba(230,126,34,0.08);
  border-left: 3px solid var(--brand-naranja);
  border-radius: 0 8px 8px 0;
  font-style: italic;
  color: var(--brand-petroleo);
}
.detalle-acciones { margin-top: 1rem; display: flex; gap: 0.5rem; }

@media (max-width: 640px) {
  .form-grid { grid-template-columns: 1fr; }
  .mes-grid { gap: 4px; }
  .celda-numero { font-size: 0.75rem; }
  .indicador { font-size: 0.6rem; }
}
</style>
