<template>
  <div class="pdf-container">
    <h3>📄 Calendario mensual en PDF</h3>
    <p class="pdf-intro">
      Genera un PDF imprimible con los 31 días del mes, listo para llevar a la consulta.
      Se rellena automáticamente con tus registros (si los tienes) y deja huecos para
      los días que aún no has apuntado.
    </p>

    <div class="pdf-controles">
      <div class="campo-eii">
        <label>Mes del PDF</label>
        <select v-model="mesPdf">
          <option v-for="m in mesesDisponibles" :key="m.value" :value="m.value">{{ m.label }}</option>
        </select>
      </div>
      <button class="btn-cta" :disabled="generando" @click="generarPDF">
        <span v-if="generando">⏳ Generando…</span>
        <span v-else>📥 Descargar PDF</span>
      </button>
    </div>

    <div v-if="ultimoArchivo" class="pdf-ok">
      ✅ PDF generado: <a :href="ultimoArchivo" :download="ultimoNombre">descargar de nuevo</a>
    </div>

    <div class="nota-eii">
      💡 El PDF incluye tu encabezado, la tabla con 6 columnas
      <strong>(fecha, deposiciones, dolor, estrés, sueño, notas)</strong>,
      la escala Bristol de referencia y el pie
      <em>"El control empieza por registrar"</em>. Todo en los colores de tu web.
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'

const props = defineProps({
  registros: { type: Array, default: () => [] }
})

const mesPdf = ref(null)
const generando = ref(false)
const ultimoArchivo = ref(null)
const ultimoNombre = ref('')
const listo = ref(false)
const jspdfMod = ref(null) // se carga lazy en cliente

onMounted(async () => {
  // Carga lazy para no romper el SSR de VitePress
  try {
    const jsPDF = (await import('jspdf')).jsPDF || (await import('jspdf')).default
    const autoTable = (await import('jspdf-autotable')).default
    jspdfMod.value = { jsPDF, autoTable }
    listo.value = true
  } catch (e) {
    console.error('No se pudo cargar jsPDF', e)
  }
})

const WEB_URL = 'https://eii-web.pages.dev'

// Paleta en hex para el PDF (no se pueden usar CSS vars aquí)
const COLOR_NARANJA = [230, 126, 34]
const COLOR_NARANJA_HOVER = [211, 84, 0]
const COLOR_PETROLEO = [26, 60, 74]
const COLOR_TEXTO = [90, 107, 117]
const COLOR_BORDE = [220, 224, 228]
const COLOR_TEXTO_CLARO = [255, 255, 255]
const COLOR_VERDE = [46, 139, 87]
const COLOR_ROJO = [192, 57, 43]
const COLOR_AMARILLO = [212, 160, 23]

const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
const MESES_CORTOS = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']

function hexToRgb(hex) {
  const h = hex.replace('#', '')
  return [parseInt(h.substring(0,2),16), parseInt(h.substring(2,4),16), parseInt(h.substring(4,6),16)]
}

const mesesDisponibles = computed(() => {
  const set = new Set()
  props.registros.forEach(r => {
    if (r.fecha) set.add(r.fecha.substring(0, 7))
  })
  const hoy = new Date()
  set.add(`${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}`)
  const lista = Array.from(set).sort().reverse()
  return lista.map(v => {
    const [y, m] = v.split('-')
    return { value: v, label: `${MESES[parseInt(m) - 1]} ${y}`, y: parseInt(y), m: parseInt(m) }
  })
})

function rgbArr(color) {
  return Array.isArray(color) ? color : hexToRgb(color)
}

function colorBristol(tipo) {
  if (!tipo) return null
  return [
    [160,64,0], [184,101,26], [212,160,23], [127,176,105],
    [91,168,160], [230,126,34], [192,57,43]
  ][Number(tipo) - 1] || null
}

function colorDolor(valor) {
  const n = Number(valor)
  if (n <= 3) return COLOR_VERDE
  if (n <= 6) return COLOR_AMARILLO
  return COLOR_ROJO
}

async function generarPDF() {
  if (!listo.value) {
    alert('El generador aún se está cargando. Espera un segundo y vuelve a intentarlo.')
    return
  }
  generando.value = true
  try {
    const { jsPDF, autoTable } = jspdfMod.value
    const [y, m] = mesPdf.value.split('-').map(Number)
    const nombreMes = MESES[m - 1]
    const diasTotales = new Date(y, m, 0).getDate()
    const doc = new jsPDF({ unit: 'mm', format: 'a4' })

    const pageW = doc.internal.pageSize.getWidth()
    const pageH = doc.internal.pageSize.getHeight()
    const margin = 14

    // ============== ENCABEZADO ==============
    // Banda naranja
    doc.setFillColor(...COLOR_NARANJA)
    doc.rect(0, 0, pageW, 32, 'F')

    // Logo textual: isotipo cuadrado + nombre
    doc.setFillColor(...COLOR_PETROLEO)
    doc.roundedRect(margin, 8, 16, 16, 3, 3, 'F')
    doc.setTextColor(...COLOR_NARANJA)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(14)
    doc.text('EII', margin + 3, 19)

    doc.setTextColor(...COLOR_TEXTO_CLARO)
    doc.setFontSize(18)
    doc.setFont('helvetica', 'bold')
    doc.text('Mi Intestino en Órbita', margin + 21, 16)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.text('Centro de Control para Guerreros Invisibles', margin + 21, 22)

    // Fecha de generación arriba a la derecha
    doc.setFontSize(8)
    doc.text(`Generado: ${new Date().toLocaleDateString('es-ES')}`, pageW - margin, 14, { align: 'right' })
    doc.text(WEB_URL, pageW - margin, 19, { align: 'right' })

    // ============== TÍTULO ==============
    doc.setTextColor(...COLOR_PETROLEO)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(16)
    doc.text('Calendario de síntomas', pageW / 2, 44, { align: 'center' })
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(11)
    doc.setTextColor(...COLOR_TEXTO)
    doc.text(`Registro diario — ${nombreMes} ${y}`, pageW / 2, 51, { align: 'center' })

    // Línea separadora
    doc.setDrawColor(...COLOR_NARANJA)
    doc.setLineWidth(0.6)
    doc.line(margin + 30, 55, pageW - margin - 30, 55)

    // ============== TABLA PRINCIPAL ==============
    const registrosMes = props.registros.filter(r => r.fecha && r.fecha.startsWith(mesPdf.value))
    const body = []
    for (let d = 1; d <= 31; d++) {
      const fecha = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`
      const r = registrosMes.find(x => x.fecha === fecha)
      const dentro = d <= diasTotales
      body.push([
        dentro ? `${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}` : '—',
        r ? String(r.deposiciones ?? '') : '',
        r ? String(r.dolor ?? '') : '',
        r ? String(r.estres ?? '') : '',
        r ? String(r.sueño ?? '') : '',
        r ? (r.notas || '') : ''
      ])
    }

    autoTable(doc, {
      startY: 60,
      head: [['Fecha', 'Deposiciones', 'Dolor (1-10)', 'Estrés (1-10)', 'Sueño (h)', 'Notas']],
      body,
      theme: 'grid',
      margin: { left: margin, right: margin },
      styles: {
        font: 'helvetica',
        fontSize: 9,
        cellPadding: 3,
        lineColor: COLOR_BORDE,
        lineWidth: 0.2,
        textColor: COLOR_PETROLEO,
        valign: 'middle'
      },
      headStyles: {
        fillColor: COLOR_NARANJA,
        textColor: COLOR_TEXTO_CLARO,
        fontStyle: 'bold',
        fontSize: 9.5,
        halign: 'center'
      },
      columnStyles: {
        0: { cellWidth: 22, halign: 'center', fontStyle: 'bold' },
        1: { cellWidth: 24, halign: 'center' },
        2: { cellWidth: 22, halign: 'center' },
        3: { cellWidth: 22, halign: 'center' },
        4: { cellWidth: 20, halign: 'center' },
        5: { cellWidth: 'auto', halign: 'left' }
      },
      didParseCell: (data) => {
        if (data.section === 'body' && data.column.index === 2) {
          const val = data.cell.raw
          if (val && val !== '') {
            const n = Number(val)
            if (!isNaN(n)) {
              if (n <= 3) data.cell.styles.textColor = COLOR_VERDE
              else if (n <= 6) data.cell.styles.textColor = COLOR_AMARILLO
              else data.cell.styles.textColor = COLOR_ROJO
              data.cell.styles.fontStyle = 'bold'
            }
          }
        }
        if (data.section === 'body' && data.row.index >= diasTotales) {
          data.cell.styles.fillColor = [248, 245, 240]
          data.cell.styles.textColor = [200, 200, 200]
        }
      },
      didDrawPage: () => {
        // Pie en cada página
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

    // ============== PÁGINA 2: ESCALA BRISTOL ==============
    doc.addPage()

    // Banda superior
    doc.setFillColor(...COLOR_NARANJA)
    doc.rect(0, 0, pageW, 18, 'F')
    doc.setTextColor(...COLOR_TEXTO_CLARO)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(13)
    doc.text('Escala de Bristol — Referencia', margin, 12)

    doc.setTextColor(...COLOR_PETROLEO)
    doc.setFontSize(11)
    doc.setFont('helvetica', 'normal')
    doc.text(
      'La Escala de Bristol clasifica la forma de las heces en 7 tipos. Es la forma estándar',
      margin, 28
    )
    doc.text(
      'de comunicar a tu médico cómo son tus deposiciones. Los tipos 3 y 4 son "ideales".',
      margin, 34
    )

    // Tabla Bristol
    const bristol = [
      ['1', 'Trozos duros separados', 'Como nueces. Difíciles de expulsar.', 'Estreñimiento severo', [160,64,0]],
      ['2', 'En forma de salchicha pero grumosa', 'Con bultos irregulares. Dura y compacta.', 'Estreñimiento leve', [184,101,26]],
      ['3', 'En forma de salchicha con grietas', 'Con fisuras en la superficie. Forma adecuada.', 'Normal', [212,160,23]],
      ['4', 'Lisa y suave, como una serpiente', 'Blanda, sin grietas, bien formada.', 'Normal (ideal)', [127,176,105]],
      ['5', 'Trozos blandos con bordes definidos', 'Esferas blandas, fáciles de expulsar.', 'Diarrea leve', [91,168,160]],
      ['6', 'Trozos blandos, bordes irregulares', 'Pastosa, con restos. No llega a diarrea.', 'Diarrea leve', [230,126,34]],
      ['7', 'Acuosa, sin piezas sólidas', 'Líquida, sin forma. Diarrea.', 'Diarrea severa', [192,57,43]]
    ]

    autoTable(doc, {
      startY: 42,
      head: [['Tipo', 'Descripción', 'Detalle', 'Categoría']],
      body: bristol.map(b => [b[0], b[1], b[2], b[3]]),
      theme: 'grid',
      margin: { left: margin, right: margin },
      styles: {
        font: 'helvetica',
        fontSize: 9,
        cellPadding: 3.5,
        lineColor: COLOR_BORDE,
        lineWidth: 0.2,
        textColor: COLOR_PETROLEO,
        valign: 'middle'
      },
      headStyles: {
        fillColor: COLOR_PETROLEO,
        textColor: COLOR_TEXTO_CLARO,
        fontStyle: 'bold'
      },
      columnStyles: {
        0: { cellWidth: 18, halign: 'center' },
        1: { cellWidth: 55 },
        2: { cellWidth: 70 },
        3: { cellWidth: 'auto', fontStyle: 'bold' }
      },
      didParseCell: (data) => {
        if (data.section === 'body' && data.column.index === 0) {
          const color = bristol[data.row.index][4]
          data.cell.styles.fillColor = color
          data.cell.styles.textColor = COLOR_TEXTO_CLARO
          data.cell.styles.fontStyle = 'bold'
          data.cell.styles.fontSize = 12
        }
        if (data.section === 'body' && data.column.index === 3) {
          data.cell.styles.textColor = bristol[data.row.index][4]
        }
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

    // Disclaimer
    const finalY = doc.lastAutoTable.finalY + 10
    doc.setFontSize(8)
    doc.setTextColor(...COLOR_TEXTO)
    doc.setFont('helvetica', 'italic')
    const disclaimer = 'Documento generado por "Mi Intestino en Órbita". No constituye consejo médico. Consulta siempre con tu especialista.'
    const lines = doc.splitTextToSize(disclaimer, pageW - margin * 2)
    doc.text(lines, margin, finalY)

    // Guardar
    const filename = `eii-calendario-${nombreMes.toLowerCase()}-${y}.pdf`
    doc.save(filename)

    // Guardar URL por si quiere re-descargar
    if (ultimoArchivo.value) URL.revokeObjectURL(ultimoArchivo.value)
    const blob = doc.output('blob')
    ultimoArchivo.value = URL.createObjectURL(blob)
    ultimoNombre.value = filename
  } catch (err) {
    console.error(err)
    alert('Error al generar el PDF: ' + err.message)
  } finally {
    generando.value = false
  }
}

// Inicializar mes por defecto al primer registro disponible
if (mesesDisponibles.value.length) {
  mesPdf.value = mesesDisponibles.value[0].value
}
</script>

<style scoped>
.pdf-container {
  background: var(--brand-tarjeta);
  border-radius: 20px;
  padding: 1.75rem;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.06);
  border: 1px solid var(--brand-borde-suave);
  margin: 1.5rem 0;
}
.pdf-container h3 {
  color: var(--brand-petroleo);
  font-weight: 800;
  font-size: 1.4rem;
  margin: 0 0 0.5rem 0;
}
.pdf-intro {
  color: var(--brand-texto-secundario);
  font-size: 0.95rem;
  line-height: 1.55;
  margin-bottom: 1.25rem;
}
.pdf-controles {
  display: flex;
  gap: 0.75rem;
  align-items: flex-end;
  flex-wrap: wrap;
}
.pdf-controles .campo-eii { flex: 1; min-width: 200px; }
.pdf-controles .btn-cta { white-space: nowrap; }
.pdf-ok {
  margin-top: 1rem;
  padding: 0.75rem 1rem;
  background: rgba(46,139,87,0.1);
  border-left: 4px solid var(--brand-exito);
  border-radius: 0 10px 10px 0;
  font-size: 0.92rem;
}
.pdf-ok a { color: var(--brand-naranja-hover); font-weight: 700; }
</style>
