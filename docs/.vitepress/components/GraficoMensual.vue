<template>
  <div class="grafico-container">
    <div class="grafico-header">
      <h3>📈 Gráficos del mes</h3>
      <div class="grafico-controles">
        <select v-model="mesGrafico" class="mes-select">
          <option v-for="m in mesesDisponibles" :key="m.value" :value="m.value">{{ m.label }}</option>
        </select>
        <button class="btn-cta" @click="imprimir">🖨️ Vista imprimir</button>
      </div>
    </div>

    <div v-if="registrosMesGrafico.length === 0" class="vacio-grafico">
      <p>📭 No hay registros en {{ mesesDisponibles.find(m => m.value === mesGrafico)?.label }}.</p>
      <p>Empieza a registrar días en el calendario y vuelve aquí a ver tus patrones.</p>
    </div>

    <div v-else class="graficos-wrapper">
      <!-- Resumen numérico para la consulta -->
      <div class="grafico-resumen no-print">
        <div class="resumen-card">
          <span class="rc-valor">{{ dolorMedio }}</span>
          <span class="rc-label">Dolor medio</span>
        </div>
        <div class="resumen-card">
          <span class="rc-valor">{{ estresMedio }}</span>
          <span class="rc-label">Estrés medio</span>
        </div>
        <div class="resumen-card">
          <span class="rc-valor">{{ sueñoMedio }}h</span>
          <span class="rc-label">Sueño medio</span>
        </div>
        <div class="resumen-card">
          <span class="rc-valor">{{ deposicionesTotal }}</span>
          <span class="rc-label">Deposiciones totales</span>
        </div>
        <div class="resumen-card">
          <span class="rc-valor">{{ bristolMasFrecuente }}</span>
          <span class="rc-label">Bristol más frecuente</span>
        </div>
      </div>

      <!-- 4 charts: 2x2 en desktop, stack en móvil -->
      <div class="charts-grid">
        <div class="chart-card">
          <h4>🩺 Dolor abdominal (1-10)</h4>
          <div class="chart-canvas"><canvas ref="chartDolor"></canvas></div>
        </div>
        <div class="chart-card">
          <h4>😰 Estrés percibido (1-10)</h4>
          <div class="chart-canvas"><canvas ref="chartEstres"></canvas></div>
        </div>
        <div class="chart-card">
          <h4>💩 Deposiciones por día</h4>
          <div class="chart-canvas"><canvas ref="chartDepos"></canvas></div>
        </div>
        <div class="chart-card">
          <h4>🛌 Horas de sueño</h4>
          <div class="chart-canvas"><canvas ref="chartSueno"></canvas></div>
        </div>
      </div>

      <div class="nota-eii no-print">
        💡 <strong>Consejo para la consulta:</strong> imprime esta página y llévala al médico.
        Estos gráficos muestran de un vistazo tus peores semanas y los días críticos,
        sin tener que explicar nada con palabras.
      </div>
    </div>

    <!-- Encabezado solo para impresión -->
    <div v-if="registrosMesGrafico.length > 0" class="solo-impresion">
      <h2>Mi Intestino en Órbita</h2>
      <p>Resumen gráfico del mes — generado el {{ fechaGeneracion }}</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'
import {
  Chart, LineController, LineElement, PointElement,
  BarController, BarElement,
  CategoryScale, LinearScale, Tooltip, Legend, Filler
} from 'chart.js'

Chart.register(
  LineController, LineElement, PointElement,
  BarController, BarElement,
  CategoryScale, LinearScale, Tooltip, Legend, Filler
)

// Props: lista de registros compartidos
const props = defineProps({
  registros: { type: Array, default: () => [] }
})

const emit = defineEmits(['mesChange'])

const mesGrafico = ref(null)
const charts = { dolor: null, estres: null, depos: null, sueno: null }
const chartDolor = ref(null)
const chartEstres = ref(null)
const chartDepos = ref(null)
const chartSueno = ref(null)

const COLORES = {
  naranja: '#E67E22',
  naranjaHover: '#D35400',
  petroleo: '#1A3C4A',
  verde: '#2E8B57',
  rojo: '#C0392B',
  mostaza: '#D4A017',
  fondo: 'rgba(230,126,34,0.12)',
  texto: '#5A6B75'
}

const mesesDisponibles = computed(() => {
  const set = new Set()
  props.registros.forEach(r => {
    if (r.fecha) set.add(r.fecha.substring(0, 7))
  })
  // Siempre incluye el mes actual
  const hoy = new Date()
  set.add(`${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}`)
  const lista = Array.from(set).sort().reverse()
  const meses = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
  return lista.map(v => {
    const [y, m] = v.split('-')
    return { value: v, label: `${meses[parseInt(m) - 1]} ${y}` }
  })
})

// Inicializa mesGrafico al primer cambio de registros
watch(mesesDisponibles, (v) => {
  if (!mesGrafico.value && v.length) {
    mesGrafico.value = v[0].value
  }
}, { immediate: true })

const registrosMesGrafico = computed(() => {
  if (!mesGrafico.value) return []
  return props.registros
    .filter(r => r.fecha && r.fecha.startsWith(mesGrafico.value))
    .sort((a, b) => a.fecha.localeCompare(b.fecha))
})

// Cálculos
const dolorMedio = computed(() => promedio('dolor'))
const estresMedio = computed(() => promedio('estres'))
const sueñoMedio = computed(() => promedio('sueño'))
const deposicionesTotal = computed(() =>
  registrosMesGrafico.value.reduce((s, r) => s + Number(r.deposiciones || 0), 0)
)
const bristolMasFrecuente = computed(() => {
  const counts = {}
  registrosMesGrafico.value.forEach(r => {
    if (r.tipoBristol) counts[r.tipoBristol] = (counts[r.tipoBristol] || 0) + 1
  })
  const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]
  return top ? `Tipo ${top[0]}` : '—'
})
function promedio(campo) {
  if (registrosMesGrafico.value.length === 0) return '—'
  const t = registrosMesGrafico.value.reduce((s, r) => s + Number(r[campo] || 0), 0)
  return (t / registrosMesGrafico.value.length).toFixed(1)
}

const fechaGeneracion = new Date().toLocaleDateString('es-ES', {
  day: 'numeric', month: 'long', year: 'numeric'
})

function diasDelMesActual() {
  if (!mesGrafico.value) return []
  const [y, m] = mesGrafico.value.split('-').map(Number)
  const total = new Date(y, m, 0).getDate()
  const dias = []
  for (let d = 1; d <= total; d++) {
    const fecha = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    const reg = registrosMesGrafico.value.find(r => r.fecha === fecha)
    dias.push({ dia: d, reg })
  }
  return dias
}

function destruirCharts() {
  Object.values(charts).forEach(c => c?.destroy && c.destroy())
  charts.dolor = charts.estres = charts.depos = charts.sueno = null
}

function construirCharts() {
  destruirCharts()
  if (registrosMesGrafico.value.length === 0) return
  const dias = diasDelMesActual()
  const labels = dias.map(d => d.dia)
  const dolorData = dias.map(d => d.reg ? Number(d.reg.dolor) : null)
  const estresData = dias.map(d => d.reg ? Number(d.reg.estres) : null)
  const deposData = dias.map(d => d.reg ? Number(d.reg.deposiciones) : null)
  const suenoData = dias.map(d => d.reg ? Number(d.reg.sueño) : null)

  const baseOptions = (yMax) => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: COLORES.petroleo,
        titleFont: { family: 'Nunito', weight: '700' },
        bodyFont: { family: 'Nunito' },
        padding: 10,
        cornerRadius: 8
      }
    },
    scales: {
      x: { grid: { display: false }, ticks: { color: COLORES.texto, font: { family: 'Nunito' } } },
      y: {
        beginAtZero: true,
        max: yMax,
        grid: { color: 'rgba(0,0,0,0.05)' },
        ticks: { color: COLORES.texto, font: { family: 'Nunito' }, stepSize: yMax <= 10 ? 1 : 2 }
      }
    },
    elements: { line: { tension: 0.35 } }
  })

  if (chartDolor.value) {
    charts.dolor = new Chart(chartDolor.value, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: 'Dolor',
          data: dolorData,
          borderColor: COLORES.rojo,
          backgroundColor: 'rgba(192,57,43,0.15)',
          fill: true,
          spanGaps: true,
          borderWidth: 2.5,
          pointRadius: 4,
          pointBackgroundColor: COLORES.rojo
        }]
      },
      options: baseOptions(10)
    })
  }
  if (chartEstres.value) {
    charts.estres = new Chart(chartEstres.value, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: 'Estrés',
          data: estresData,
          borderColor: COLORES.mostaza,
          backgroundColor: 'rgba(212,160,23,0.15)',
          fill: true,
          spanGaps: true,
          borderWidth: 2.5,
          pointRadius: 4,
          pointBackgroundColor: COLORES.mostaza
        }]
      },
      options: baseOptions(10)
    })
  }
  if (chartDepos.value) {
    charts.depos = new Chart(chartDepos.value, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: 'Deposiciones',
          data: deposData,
          backgroundColor: COLORES.naranja,
          borderRadius: 6,
          borderSkipped: false
        }]
      },
      options: baseOptions(Math.max(5, ...deposData.filter(v => v != null), 1))
    })
  }
  if (chartSueno.value) {
    charts.sueno = new Chart(chartSueno.value, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: 'Sueño (h)',
          data: suenoData,
          borderColor: COLORES.verde,
          backgroundColor: 'rgba(46,139,87,0.15)',
          fill: true,
          spanGaps: true,
          borderWidth: 2.5,
          pointRadius: 4,
          pointBackgroundColor: COLORES.verde
        }]
      },
      options: baseOptions(12)
    })
  }
}

watch(mesGrafico, async () => {
  emit('mesChange', mesGrafico.value)
  await nextTick()
  construirCharts()
})
watch(() => props.registros, async () => {
  await nextTick()
  construirCharts()
}, { deep: true })

function imprimir() {
  window.print()
}

onMounted(async () => {
  await nextTick()
  construirCharts()
})
onBeforeUnmount(destruirCharts)

defineExpose({ registros: registrosMesGrafico })
</script>

<style scoped>
.grafico-container {
  background: var(--brand-tarjeta);
  border-radius: 24px;
  padding: 2rem;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.06);
  border: 1px solid var(--brand-borde-suave);
  margin: 2rem 0;
}
.grafico-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
  margin-bottom: 1.5rem;
}
.grafico-header h3 {
  font-size: 1.5rem;
  font-weight: 800;
  color: var(--brand-petroleo);
  margin: 0;
}
.grafico-controles {
  display: flex;
  gap: 0.6rem;
  align-items: center;
  flex-wrap: wrap;
}
.mes-select {
  padding: 0.6rem 0.9rem;
  border: 2px solid var(--brand-borde);
  border-radius: 12px;
  font-family: inherit;
  font-weight: 600;
  color: var(--brand-petroleo);
  background: #FBFCFD;
  cursor: pointer;
}
.mes-select:focus {
  outline: none;
  border-color: var(--brand-naranja);
}

.vacio-grafico {
  text-align: center;
  padding: 3rem 1rem;
  color: var(--brand-texto-secundario);
}
.vacio-grafico p { margin: 0.4rem 0; }

.graficos-wrapper { display: flex; flex-direction: column; gap: 1.5rem; }

.grafico-resumen {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 0.75rem;
}
.resumen-card {
  background: linear-gradient(135deg, rgba(230,126,34,0.08), rgba(46,139,87,0.05));
  border: 1px solid var(--brand-borde-suave);
  border-radius: 14px;
  padding: 0.9rem;
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}
.rc-valor {
  font-size: 1.4rem;
  font-weight: 800;
  color: var(--brand-petroleo);
}
.rc-label {
  font-size: 0.75rem;
  color: var(--brand-texto-secundario);
}

.charts-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.25rem;
}
.chart-card {
  background: #FBFCFD;
  border: 1px solid var(--brand-borde);
  border-radius: 16px;
  padding: 1rem 1.1rem;
}
.chart-card h4 {
  color: var(--brand-petroleo);
  font-size: 0.95rem;
  font-weight: 700;
  margin: 0 0 0.6rem 0;
}
.chart-canvas {
  position: relative;
  height: 220px;
}

.solo-impresion { display: none; }

@media (max-width: 768px) {
  .charts-grid { grid-template-columns: 1fr; }
  .chart-canvas { height: 200px; }
}

/* Impresión */
@media print {
  .solo-impresion {
    display: block;
    text-align: center;
    margin-bottom: 1.5rem;
    border-bottom: 2px solid var(--brand-naranja);
    padding-bottom: 1rem;
  }
  .solo-impresion h2 { color: #1A3C4A; margin: 0 0 0.3rem 0; }
  .solo-impresion p { color: #5A6B75; font-size: 0.85rem; margin: 0; }
  .chart-card { break-inside: avoid; box-shadow: none; }
  .charts-grid { grid-template-columns: 1fr 1fr; gap: 1rem; }
  .chart-canvas { height: 180px; }
}
</style>
