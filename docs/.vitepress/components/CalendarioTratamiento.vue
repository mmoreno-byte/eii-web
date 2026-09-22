<template>
  <div class="tarjeta-eii tratamiento-container">
    <h3>💊 Calendario de tratamiento</h3>
    <p class="tratamiento-intro">
      Elige tu medicación y frecuencia: calculamos automáticamente cuándo te toca cada dosis,
      te lo enseñamos en un calendario y te lo llevas en PDF o directo a tu móvil.
    </p>

    <form class="form-grid" @submit.prevent="calcular">
      <div class="campo-eii">
        <label>Medicamento</label>
        <select v-model="medicamento" required>
          <option value="" disabled>Selecciona un medicamento</option>
          <option v-for="m in MEDICAMENTOS" :key="m" :value="m">{{ m }}</option>
          <option value="Otro">Otro (especificar)</option>
        </select>
      </div>

      <div v-if="medicamento === 'Otro'" class="campo-eii">
        <label>Especifica cuál</label>
        <input v-model="medicamentoOtro" type="text" placeholder="Nombre del medicamento" required />
      </div>

      <div class="campo-eii">
        <label>Frecuencia</label>
        <select v-model="frecuenciaSel" required>
          <option value="" disabled>Selecciona una frecuencia</option>
          <option v-for="f in FRECUENCIAS" :key="f.value" :value="f.value">{{ f.label }}</option>
          <option value="personalizada">Personalizada</option>
        </select>
      </div>

      <div v-if="frecuenciaSel === 'personalizada'" class="campo-eii">
        <label>Cada cuántas semanas</label>
        <input v-model="frecuenciaPersonalizada" type="number" min="1" step="1" placeholder="Ej. 5" required />
      </div>

      <div class="campo-eii">
        <label>Fecha de inicio (tu próxima o última dosis)</label>
        <input v-model="fechaInicio" type="date" required />
      </div>

      <button type="submit" class="btn-cta full-width">📊 Calcular calendario</button>
    </form>

    <template v-if="calculado && frecuenciaSemanasNum">
      <!-- Próxima dosis -->
      <div v-if="proximaDosis" class="proxima-dosis-card">
        <span class="proxima-dosis-etiqueta">💉 Tu próxima dosis</span>
        <span class="proxima-dosis-fecha">{{ formatearFechaLarga(proximaDosis) }}</span>
        <span class="proxima-dosis-cuenta">{{ textoCuentaAtras }}</span>
      </div>

      <!-- Chips de próximas dosis -->
      <div v-if="proximasDosisChips.length" class="chips-dosis">
        <span v-for="f in proximasDosisChips" :key="f" class="chip-dosis">
          {{ formatearFechaCorta(f) }}
        </span>
      </div>

      <!-- Controles de descarga -->
      <div class="tratamiento-acciones">
        <button class="btn-cta" :disabled="generandoPdf" @click="descargarPDF">
          <span v-if="generandoPdf">⏳ Generando…</span>
          <span v-else>📥 Descargar PDF</span>
        </button>
        <button class="btn-secundario" @click="descargarICS">
          📆 Añadir a mi calendario (.ics)
        </button>
        <button class="btn-secundario" @click="mostrar12Meses = !mostrar12Meses">
          {{ mostrar12Meses ? 'Ver 6 meses' : 'Ver 12 meses' }}
        </button>
      </div>

      <!-- Calendario mes a mes -->
      <div v-for="bloque in mesesGrid" :key="`${bloque.anio}-${bloque.mes}`" class="mes-bloque">
        <h4>{{ bloque.nombre }} {{ bloque.anio }}</h4>
        <div class="mes-grid">
          <div v-for="d in ['L','M','X','J','V','S','D']" :key="d" class="dia-semana">{{ d }}</div>
          <div
            v-for="(celda, i) in bloque.celdas"
            :key="i"
            class="celda-dia"
            :class="{ 'celda-vacia': !celda, 'celda-dosis': celda && celda.esDosis }"
          >
            <template v-if="celda">
              <div class="celda-numero" :class="{ 'celda-hoy': celda.hoy }">{{ celda.dia }}</div>
              <div v-if="celda.esDosis" class="celda-indicador-dosis" title="Dosis programada">💉</div>
            </template>
          </div>
        </div>
      </div>

      <div class="nota-eii">
        💡 Este calendario es orientativo: lo calculamos a partir de la fecha y frecuencia que indiques.
        No sustituye la pauta de tu médico o enfermera de EII — confirma siempre cualquier cambio de
        dosis o fecha con tu equipo.
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'

const MEDICAMENTOS = ['Infliximab', 'Adalimumab', 'Golimumab', 'Vedolizumab', 'Ustekinumab', 'Risankizumab', 'Mirikizumab']
const FRECUENCIAS = [
  { value: 1, label: 'Cada semana' },
  { value: 2, label: 'Cada 2 semanas' },
  { value: 3, label: 'Cada 3 semanas' },
  { value: 4, label: 'Cada 4 semanas' },
  { value: 6, label: 'Cada 6 semanas' },
  { value: 8, label: 'Cada 8 semanas' },
  { value: 10, label: 'Cada 10 semanas' },
  { value: 12, label: 'Cada 12 semanas' },
]
const NOMBRES_MES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
const NOMBRES_MES_CORTO = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic']
const STORAGE_KEY = 'tratamientoEII'

function hoyISO() {
  return new Date().toISOString().split('T')[0]
}

const medicamento = ref('')
const medicamentoOtro = ref('')
const frecuenciaSel = ref('')
const frecuenciaPersonalizada = ref('')
const fechaInicio = ref(hoyISO())
const mostrar12Meses = ref(false)
const calculado = ref(false)
const generandoPdf = ref(false)
const jspdfMod = ref(null)
const listoPdf = ref(false)

onMounted(async () => {
  try {
    const datos = localStorage.getItem(STORAGE_KEY)
    if (datos) {
      const g = JSON.parse(datos)
      medicamento.value = g.medicamento || ''
      medicamentoOtro.value = g.medicamentoOtro || ''
      frecuenciaSel.value = g.frecuenciaSel || ''
      frecuenciaPersonalizada.value = g.frecuenciaPersonalizada || ''
      fechaInicio.value = g.fechaInicio || hoyISO()
      if (medicamento.value && frecuenciaSel.value && fechaInicio.value) calculado.value = true
    }
  } catch (e) {
    console.warn('CalendarioTratamiento: no se pudo cargar la config guardada', e)
  }

  try {
    const jsPDF = (await import('jspdf')).jsPDF || (await import('jspdf')).default
    const autoTable = (await import('jspdf-autotable')).default
    jspdfMod.value = { jsPDF, autoTable }
    listoPdf.value = true
  } catch (e) {
    console.error('No se pudo cargar jsPDF', e)
  }
})

watch([medicamento, medicamentoOtro, frecuenciaSel, frecuenciaPersonalizada, fechaInicio], () => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      medicamento: medicamento.value,
      medicamentoOtro: medicamentoOtro.value,
      frecuenciaSel: frecuenciaSel.value,
      frecuenciaPersonalizada: frecuenciaPersonalizada.value,
      fechaInicio: fechaInicio.value,
    }))
  } catch (e) {
    console.warn('CalendarioTratamiento: no se pudo guardar la config', e)
  }
})

const nombreMedicamento = computed(() => medicamento.value === 'Otro' ? medicamentoOtro.value : medicamento.value)

const frecuenciaSemanasNum = computed(() => {
  if (frecuenciaSel.value === 'personalizada') return Number(frecuenciaPersonalizada.value) || 0
  return Number(frecuenciaSel.value) || 0
})

function calcular() {
  calculado.value = true
}

function sumarDias(fechaISO, dias) {
  const [y, m, d] = fechaISO.split('-').map(Number)
  const dt = new Date(y, m - 1, d)
  dt.setDate(dt.getDate() + dias)
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`
}

const mesesAMostrar = computed(() => mostrar12Meses.value ? 12 : 6)

const fechasDosis = computed(() => {
  if (!calculado.value || !fechaInicio.value || !frecuenciaSemanasNum.value) return []
  const fin = sumarDias(fechaInicio.value, mesesAMostrar.value * 31)
  const fechas = []
  let actual = fechaInicio.value
  let salvaguarda = 0
  while (actual <= fin && salvaguarda < 200) {
    fechas.push(actual)
    actual = sumarDias(actual, frecuenciaSemanasNum.value * 7)
    salvaguarda++
  }
  return fechas
})

const proximaDosis = computed(() => fechasDosis.value.find(f => f >= hoyISO()) || null)

const proximasDosisChips = computed(() => fechasDosis.value.filter(f => f >= hoyISO()).slice(0, 6))

const textoCuentaAtras = computed(() => {
  if (!proximaDosis.value) return ''
  const hoy = new Date()
  const [y, m, d] = proximaDosis.value.split('-').map(Number)
  const objetivo = new Date(y, m - 1, d)
  const dias = Math.round((objetivo - new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate())) / 86400000)
  if (dias === 0) return 'Es hoy'
  if (dias === 1) return 'Es mañana'
  return `En ${dias} días`
})

function celdasDelMes(anio, mes, dosisSet) {
  const celdas = []
  const primerDia = new Date(anio, mes, 1)
  const offset = (primerDia.getDay() + 6) % 7
  for (let i = 0; i < offset; i++) celdas.push(null)
  const diasDelMes = new Date(anio, mes + 1, 0).getDate()
  const hoyStr = hoyISO()
  for (let d = 1; d <= diasDelMes; d++) {
    const fecha = `${anio}-${String(mes + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    celdas.push({ dia: d, fecha, esDosis: dosisSet.has(fecha), hoy: fecha === hoyStr })
  }
  return celdas
}

const mesesGrid = computed(() => {
  if (!calculado.value || !frecuenciaSemanasNum.value) return []
  const [y0, m0] = fechaInicio.value.split('-').map(Number)
  const dosisSet = new Set(fechasDosis.value)
  const bloques = []
  for (let i = 0; i < mesesAMostrar.value; i++) {
    const mIdx = (m0 - 1) + i
    const anio = y0 + Math.floor(mIdx / 12)
    const mes = ((mIdx % 12) + 12) % 12
    bloques.push({ anio, mes, nombre: NOMBRES_MES[mes], celdas: celdasDelMes(anio, mes, dosisSet) })
  }
  return bloques
})

function formatearFechaLarga(fecha) {
  const [y, m, d] = fecha.split('-')
  return `${parseInt(d)} de ${NOMBRES_MES[parseInt(m) - 1].toLowerCase()} de ${y}`
}
function formatearFechaCorta(fecha) {
  const [y, m, d] = fecha.split('-')
  return `${parseInt(d)} ${NOMBRES_MES_CORTO[parseInt(m) - 1]}`
}

function escaparICS(texto) {
  return String(texto).replace(/\\/g, '\\\\').replace(/,/g, '\\,').replace(/;/g, '\\;')
}

function descargarICS() {
  const ahora = new Date()
  const stamp = ahora.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
  let ics = 'BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//Mi Intestino en Orbita//Calendario Tratamiento//ES\r\nCALSCALE:GREGORIAN\r\n'
  fechasDosis.value.forEach((fecha, i) => {
    const dt = fecha.replace(/-/g, '')
    ics += 'BEGIN:VEVENT\r\n'
    ics += `UID:eii-tratamiento-${dt}-${i}@eii-web.pages.dev\r\n`
    ics += `DTSTAMP:${stamp}\r\n`
    ics += `DTSTART;VALUE=DATE:${dt}\r\n`
    ics += `SUMMARY:${escaparICS('💉 Dosis de ' + nombreMedicamento.value)}\r\n`
    ics += `DESCRIPTION:${escaparICS('Recordatorio generado por Mi Intestino en Orbita. No sustituye la pauta de tu equipo medico.')}\r\n`
    ics += 'BEGIN:VALARM\r\nTRIGGER:-P1D\r\nACTION:DISPLAY\r\nDESCRIPTION:Mañana toca tu dosis\r\nEND:VALARM\r\n'
    ics += 'END:VEVENT\r\n'
  })
  ics += 'END:VCALENDAR\r\n'

  const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'calendario-tratamiento-eii.ics'
  a.click()
  URL.revokeObjectURL(url)
}

const COLOR_NARANJA = [230, 126, 34]
const COLOR_PETROLEO = [26, 60, 74]
const COLOR_TEXTO = [90, 107, 117]
const COLOR_BORDE = [220, 224, 228]
const COLOR_TEXTO_CLARO = [255, 255, 255]
const WEB_URL = 'https://eii-web.pages.dev'

async function descargarPDF() {
  if (!listoPdf.value) {
    alert('El generador aún se está cargando. Espera un segundo y vuelve a intentarlo.')
    return
  }
  generandoPdf.value = true
  try {
    const { jsPDF, autoTable } = jspdfMod.value
    const doc = new jsPDF({ unit: 'mm', format: 'a4' })
    const pageW = doc.internal.pageSize.getWidth()
    const pageH = doc.internal.pageSize.getHeight()
    const margin = 14

    doc.setFillColor(...COLOR_NARANJA)
    doc.rect(0, 0, pageW, 32, 'F')
    doc.setFillColor(...COLOR_PETROLEO)
    doc.roundedRect(margin, 8, 16, 16, 3, 3, 'F')
    doc.setTextColor(...COLOR_NARANJA)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(14)
    doc.text('EII', margin + 3, 19)
    doc.setTextColor(...COLOR_TEXTO_CLARO)
    doc.setFontSize(18)
    doc.text('Mi Intestino en Órbita', margin + 21, 16)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.text('Centro de Control para Guerreros Invisibles', margin + 21, 22)
    doc.setFontSize(8)
    doc.text(`Generado: ${new Date().toLocaleDateString('es-ES')}`, pageW - margin, 14, { align: 'right' })
    doc.text(WEB_URL, pageW - margin, 19, { align: 'right' })

    doc.setTextColor(...COLOR_PETROLEO)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(16)
    doc.text('Calendario de tratamiento', pageW / 2, 44, { align: 'center' })
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(11)
    doc.setTextColor(...COLOR_TEXTO)
    doc.text(`${nombreMedicamento.value} — ${FRECUENCIAS.find(f => f.value === frecuenciaSel.value)?.label || `Cada ${frecuenciaSemanasNum.value} semanas`}`, pageW / 2, 51, { align: 'center' })

    doc.setDrawColor(...COLOR_NARANJA)
    doc.setLineWidth(0.6)
    doc.line(margin + 30, 55, pageW - margin - 30, 55)

    const hoyStr = hoyISO()
    const body = fechasDosis.value.map((f, i) => {
      const [y, m, d] = f.split('-').map(Number)
      const diaSemana = new Date(y, m - 1, d).toLocaleDateString('es-ES', { weekday: 'long' })
      return [
        String(i + 1),
        `${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}/${y}`,
        diaSemana.charAt(0).toUpperCase() + diaSemana.slice(1),
        f < hoyStr ? 'Pasada' : (f === hoyStr ? 'Hoy' : '—')
      ]
    })

    autoTable(doc, {
      startY: 60,
      head: [['#', 'Fecha', 'Día', 'Estado']],
      body,
      theme: 'grid',
      margin: { left: margin, right: margin },
      styles: { font: 'helvetica', fontSize: 9, cellPadding: 3, lineColor: COLOR_BORDE, lineWidth: 0.2, textColor: COLOR_PETROLEO, valign: 'middle' },
      headStyles: { fillColor: COLOR_NARANJA, textColor: COLOR_TEXTO_CLARO, fontStyle: 'bold', halign: 'center' },
      columnStyles: {
        0: { cellWidth: 14, halign: 'center' },
        1: { cellWidth: 32, halign: 'center', fontStyle: 'bold' },
        2: { cellWidth: 40 },
        3: { cellWidth: 'auto', halign: 'center' }
      },
      didDrawPage: () => {
        const footerY = pageH - 10
        doc.setDrawColor(...COLOR_NARANJA)
        doc.setLineWidth(0.3)
        doc.line(margin, footerY - 5, pageW - margin, footerY - 5)
        doc.setFont('helvetica', 'italic')
        doc.setFontSize(9)
        doc.setTextColor(...COLOR_PETROLEO)
        doc.text('"El control empieza por registrar"', pageW / 2, footerY, { align: 'center' })
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(7.5)
        doc.setTextColor(...COLOR_TEXTO)
        doc.text(`Descarga más recursos en ${WEB_URL}`, pageW / 2, footerY + 4, { align: 'center' })
      }
    })

    const finalY = doc.lastAutoTable.finalY + 10
    doc.setFontSize(8)
    doc.setTextColor(...COLOR_TEXTO)
    doc.setFont('helvetica', 'italic')
    const disclaimer = 'Calendario orientativo generado por "Mi Intestino en Órbita" a partir de la fecha y frecuencia indicadas. No sustituye la pauta de tu médico o enfermera de EII: confirma siempre cualquier cambio con tu equipo.'
    doc.text(doc.splitTextToSize(disclaimer, pageW - margin * 2), margin, finalY)

    doc.save(`eii-tratamiento-${nombreMedicamento.value.toLowerCase().replace(/\s+/g, '-')}.pdf`)
  } catch (err) {
    console.error(err)
    alert('Error al generar el PDF: ' + err.message)
  } finally {
    generandoPdf.value = false
  }
}
</script>

<style scoped>
.tratamiento-intro {
  color: var(--brand-texto-secundario);
  font-size: 0.95rem;
  line-height: 1.55;
  margin-bottom: 1.25rem;
}
.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.85rem;
  margin-bottom: 1.5rem;
}
.full-width { grid-column: 1 / -1; }

.proxima-dosis-card {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 0.6rem;
  background: linear-gradient(135deg, rgba(230,126,34,0.12), rgba(26,60,74,0.06));
  border: 1px solid var(--brand-borde-suave);
  border-radius: 16px;
  padding: 1.1rem 1.4rem;
  margin-bottom: 1rem;
}
.proxima-dosis-etiqueta {
  font-size: 0.8rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--brand-texto-secundario);
  flex-basis: 100%;
}
.proxima-dosis-fecha {
  font-size: 1.3rem;
  font-weight: 800;
  color: var(--brand-petroleo);
}
.proxima-dosis-cuenta {
  font-size: 0.9rem;
  font-weight: 700;
  color: var(--brand-naranja-hover);
  background: rgba(230,126,34,0.14);
  padding: 0.15rem 0.7rem;
  border-radius: 999px;
}

.chips-dosis {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 1.25rem;
}
.chip-dosis {
  background: var(--brand-petroleo);
  color: #fff;
  font-size: 0.8rem;
  font-weight: 700;
  padding: 0.3rem 0.75rem;
  border-radius: 999px;
  text-transform: capitalize;
}

.tratamiento-acciones {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
}

.mes-bloque { margin-top: 1.5rem; }
.mes-bloque h4 {
  color: var(--brand-petroleo);
  font-weight: 700;
  font-size: 1.05rem;
  margin: 0 0 0.6rem 0;
  text-transform: capitalize;
}
.mes-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 6px;
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
  border-radius: 10px;
  padding: 0.35rem;
  font-size: 0.75rem;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  position: relative;
}
.celda-vacia { background: transparent; border: 1px dashed transparent; }
.celda-numero {
  font-weight: 700;
  color: var(--brand-petroleo);
  font-size: 0.85rem;
}
.celda-hoy {
  background: var(--brand-petroleo);
  color: #fff;
  padding: 0.05rem 0.4rem;
  border-radius: 8px;
  display: inline-block;
  align-self: flex-start;
}
.celda-dosis {
  border-color: var(--brand-naranja);
  background: rgba(230,126,34,0.1);
}
.celda-indicador-dosis {
  align-self: flex-end;
  font-size: 0.9rem;
  line-height: 1;
}

@media (max-width: 640px) {
  .form-grid { grid-template-columns: 1fr; }
  .mes-grid { gap: 4px; }
  .celda-numero { font-size: 0.75rem; }
}
</style>
