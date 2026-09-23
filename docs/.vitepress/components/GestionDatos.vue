<template>
  <div class="datos-container">
    <h3>💾 Tus datos, a tu manera</h3>
    <p class="datos-intro">
      Todo se guarda <strong>en este navegador</strong> (localStorage). Te damos
      varias formas de sacarlo para llevarlo contigo: a tu móvil, a tu médico,
      o a otro dispositivo.
    </p>

    <div class="datos-grid">
      <!-- 1. Exportar / Importar JSON -->
      <div class="dato-card">
        <div class="dato-icono">⬇️</div>
        <h4>Archivo JSON</h4>
        <p>Descárgalo a tu dispositivo. Lo puedes archivar, mandar por email o guardar en una nube.</p>
        <div class="dato-acciones">
          <button class="btn-cta" @click="exportarJSON">⬇️ Descargar JSON</button>
          <label class="btn-secundario" style="cursor:pointer">
            ⬆️ Importar
            <input type="file" accept="application/json" @change="importarJSON" hidden />
          </label>
        </div>
      </div>

      <!-- 2. Copiar al portapapeles -->
      <div class="dato-card">
        <div class="dato-icono">📋</div>
        <h4>Copiar al portapapeles</h4>
        <p>Pégalo en un email, nota, WhatsApp o donde quieras. Útil para llevártelo al móvil en un segundo.</p>
        <div class="dato-acciones">
          <button class="btn-cta" @click="copiarPortapapeles">
            {{ copiado ? '✅ Copiado' : '📋 Copiar JSON' }}
          </button>
        </div>
      </div>

      <!-- 3. Enlace compartible (base64) -->
      <div class="dato-card">
        <div class="dato-icono">🔗</div>
        <h4>Enlace con tus datos</h4>
        <p>Genera una URL con tus registros dentro. Ábrela en otro dispositivo para importarlos allí.</p>
        <div class="dato-acciones">
          <button class="btn-cta" @click="generarEnlace">
            {{ enlaceGenerado ? '✅ Enlace listo' : '🔗 Generar enlace' }}
          </button>
        </div>
        <div v-if="enlaceGenerado" class="dato-enlace">
          <input ref="enlaceInput" :value="enlaceGenerado" readonly @focus="$event.target.select()" />
          <button class="btn-peligro" @click="cerrarEnlace">Cerrar</button>
        </div>
      </div>

      <!-- 4. QR para móvil -->
      <div class="dato-card">
        <div class="dato-icono">📱</div>
        <h4>Código QR</h4>
        <p>Escanéalo con la cámara del móvil para abrir la web con tus datos ya cargados.</p>
        <div class="dato-acciones">
          <button class="btn-cta" @click="mostrarQR = !mostrarQR">
            {{ mostrarQR ? 'Ocultar QR' : '📱 Mostrar QR' }}
          </button>
        </div>
        <div v-if="mostrarQR" class="dato-qr">
          <div ref="qrCode" class="qr-box"></div>
          <p class="dato-qr-texto">Apunta con la cámara del móvil</p>
        </div>
      </div>

      <!-- 5. Instalar como app (PWA) -->
      <div class="dato-card dato-card-app">
        <div class="dato-icono">📲</div>
        <h4>Llevarla siempre encima</h4>
        <p>Instálala como app en el móvil o el ordenador. Funciona sin internet y se abre como una app nativa.</p>
        <div class="dato-acciones">
          <button v-if="puedeInstalar" class="btn-cta" @click="instalarApp">
            📲 Instalar app
          </button>
          <button v-else-if="instalada" class="btn-secundario" disabled>
            ✅ Ya instalada
          </button>
          <button v-else class="btn-secundario" disabled>
            💡 Usa "Añadir a pantalla de inicio" en el navegador
          </button>
        </div>
        <p v-if="instalada" class="dato-pista">
          ✨ Ya la tienes instalada. Ábrela desde tu menú de apps.
        </p>
      </div>

      <!-- 6. Borrar todo -->
      <div class="dato-card dato-card-peligro">
        <div class="dato-icono">🗑️</div>
        <h4>Borrar todo</h4>
        <p>Elimina todos los registros de este navegador. No se puede deshacer.</p>
        <div class="dato-acciones">
          <button class="btn-peligro" @click="borrarTodo">🗑️ Borrar todo</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, nextTick, watch } from 'vue'

const props = defineProps({
  registros: { type: Array, default: () => [] }
})

const copiado = ref(false)
const enlaceGenerado = ref('')
const mostrarQR = ref(false)
const puedeInstalar = ref(false)
const instalada = ref(false)
const qrCode = ref(null)
const enlaceInput = ref(null)

let deferredPrompt = null
let qrLib = null
let qrInstance = null

function payload() {
  return {
    app: 'Mi Intestino en Órbita',
    version: 1,
    exportado: new Date().toISOString(),
    registros: props.registros
  }
}

function blobYUrl(data, filename) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

function exportarJSON() {
  const data = payload()
  const fecha = new Date().toISOString().split('T')[0]
  blobYUrl(data, `eii-registros-${fecha}.json`)
}

async function copiarPortapapeles() {
  const texto = JSON.stringify(payload())
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(texto)
    } else {
      // Fallback para navegadores antiguos / no-HTTPS
      const ta = document.createElement('textarea')
      ta.value = texto
      ta.style.position = 'fixed'
      ta.style.opacity = '0'
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
    }
    copiado.value = true
    setTimeout(() => (copiado.value = false), 2500)
  } catch (e) {
    alert('No se pudo copiar. Tu navegador lo bloquea. Usa Descargar JSON.')
  }
}

async function generarEnlace() {
  const json = JSON.stringify(payload())
  // base64 url-safe para que no se rompa en la URL
  const b64 = btoa(unescape(encodeURIComponent(json)))
  const url = `${location.origin}/?datos=${b64}`
  enlaceGenerado.value = url
  await nextTick()
  enlaceInput.value?.select()
}

function cerrarEnlace() {
  enlaceGenerado.value = ''
}

async function generarQR() {
  if (!enlaceGenerado.value) {
    await generarEnlace()
  }
  if (!qrCode.value) return
  // qrcode (lib npm) — carga lazy
  if (!qrLib) {
    const mod = await import('qrcode')
    qrLib = mod.default || mod
  }
  await nextTick()
  const canvas = document.createElement('canvas')
  await qrLib.toCanvas(canvas, enlaceGenerado.value, {
    width: 200,
    margin: 1,
    color: { dark: '#1A3C4A', light: '#FFFFFF' }
  })
  qrCode.value.innerHTML = ''
  qrCode.value.appendChild(canvas)
  qrInstance = { destroy: () => { qrCode.value.innerHTML = '' } }
}

watch(mostrarQR, (v) => {
  if (v) generarQR()
})

async function importarJSON(e) {
  const file = e.target.files?.[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = (ev) => {
    try {
      const data = JSON.parse(ev.target.result)
      const lista = Array.isArray(data) ? data : data.registros
      if (!Array.isArray(lista)) throw new Error('Formato inválido')
      const mapa = new Map(props.registros.map((r) => [r.fecha, r]))
      lista.forEach((r) => { if (r.fecha) mapa.set(r.fecha, r) })
      const ordenados = Array.from(mapa.values()).sort((a, b) => a.fecha.localeCompare(b.fecha))
      // Sustituye en localStorage
      try {
        localStorage.setItem('registrosEII', JSON.stringify(ordenados))
      } catch {}
      alert(`Importados ${lista.length} registros. Recarga la página para verlos.`)
    } catch (err) {
      alert('Archivo inválido: ' + err.message)
    }
  }
  reader.readAsText(file)
  e.target.value = ''
}

function importarDesdeURL(b64) {
  try {
    const json = decodeURIComponent(escape(atob(b64)))
    const data = JSON.parse(json)
    const lista = Array.isArray(data) ? data : data.registros
    if (!Array.isArray(lista)) return
    const existentes = JSON.parse(localStorage.getItem('registrosEII') || '[]')
    const mapa = new Map(existentes.map((r) => [r.fecha, r]))
    lista.forEach((r) => { if (r.fecha) mapa.set(r.fecha, r) })
    const ordenados = Array.from(mapa.values()).sort((a, b) => a.fecha.localeCompare(b.fecha))
    localStorage.setItem('registrosEII', JSON.stringify(ordenados))
    // Limpia la URL para que no se reimporte al recargar
    history.replaceState({}, '', location.pathname)
    return lista.length
  } catch (e) {
    console.warn('No se pudo importar desde URL', e)
    return 0
  }
}

function borrarTodo() {
  if (!confirm('¿Borrar TODOS los registros de este dispositivo?')) return
  if (!confirm('¿Seguro seguro? Piensa en tu médico 😅')) return
  try { localStorage.removeItem('registrosEII') } catch {}
  alert('Registros borrados. Recarga la página.')
}

async function instalarApp() {
  if (!deferredPrompt) {
    alert('Tu navegador no soporta instalación automática. Usa "Añadir a pantalla de inicio" desde el menú del navegador.')
    return
  }
  deferredPrompt.prompt()
  const { outcome } = await deferredPrompt.userChoice
  if (outcome === 'accepted') {
    instalada.value = true
  }
  deferredPrompt = null
  puedeInstalar.value = false
}

function detectarInstalada() {
  // Si la app está corriendo en modo standalone, está instalada
  if (window.matchMedia('(display-mode: standalone)').matches) {
    instalada.value = true
  }
  if (window.navigator.standalone === true) {
    instalada.value = true
  }
}

onMounted(() => {
  // Detectar si hay datos en la URL y cargarlos
  const params = new URLSearchParams(location.search)
  const datos = params.get('datos')
  if (datos) {
    const n = importarDesdeURL(datos)
    if (n) {
      alert(`Se importaron ${n} registros desde el enlace. Recargando…`)
      location.reload()
    }
  }

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault()
    deferredPrompt = e
    puedeInstalar.value = true
  })
  window.addEventListener('appinstalled', () => {
    instalada.value = true
    puedeInstalar.value = false
  })
  detectarInstalada()
})

onBeforeUnmount(() => {
  if (qrInstance && qrInstance.destroy) qrInstance.destroy()
})
</script>

<style scoped>
.datos-container {
  background: var(--brand-tarjeta);
  border-radius: 24px;
  padding: 2rem;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.06);
  border: 1px solid var(--brand-borde-suave);
  margin: 2rem 0;
}
.datos-container h3 {
  color: var(--brand-petroleo);
  font-weight: 800;
  font-size: 1.5rem;
  margin: 0 0 0.5rem 0;
}
.datos-intro {
  color: var(--brand-texto-secundario);
  font-size: 0.95rem;
  line-height: 1.55;
  margin-bottom: 1.5rem;
}

.datos-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 1rem;
}
.dato-card {
  background: #FBFCFD;
  border: 1px solid var(--brand-borde);
  border-radius: 16px;
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
.dato-card-app {
  background: linear-gradient(135deg, rgba(230,126,34,0.1), rgba(26,60,74,0.06));
  border-color: var(--brand-borde-suave);
}
.dato-card-peligro {
  background: rgba(192,57,43,0.04);
  border-color: rgba(192,57,43,0.2);
}
.dato-icono {
  font-size: 2rem;
  line-height: 1;
}
.dato-card h4 {
  color: var(--brand-petroleo);
  font-size: 1.05rem;
  font-weight: 800;
  margin: 0;
}
.dato-card p {
  color: var(--brand-texto-secundario);
  font-size: 0.88rem;
  line-height: 1.5;
  margin: 0;
  flex: 1;
}
.dato-acciones {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 0.5rem;
}
.dato-acciones .btn-cta,
.dato-acciones .btn-secundario,
.dato-acciones .btn-peligro {
  font-size: 0.85rem;
  padding: 0.55rem 0.9rem;
}
.dato-enlace {
  display: flex;
  gap: 0.5rem;
  margin-top: 0.75rem;
  align-items: center;
}
.dato-enlace input {
  flex: 1;
  padding: 0.5rem 0.7rem;
  border: 1px solid var(--brand-borde);
  border-radius: 8px;
  font-family: var(--vp-font-family-mono);
  font-size: 0.75rem;
  background: #fff;
  color: var(--brand-petroleo);
  min-width: 0;
}
.dato-qr {
  margin-top: 0.75rem;
  text-align: center;
}
.qr-box {
  display: inline-block;
  padding: 12px;
  background: #fff;
  border-radius: 12px;
  border: 1px solid var(--brand-borde);
}
.qr-box svg { display: block; }
.dato-qr-texto {
  margin: 0.5rem 0 0;
  font-size: 0.8rem;
  color: var(--brand-texto-secundario);
}
.dato-pista {
  margin: 0.5rem 0 0;
  font-size: 0.8rem;
  color: var(--brand-exito);
}

@media (max-width: 640px) {
  .datos-grid { grid-template-columns: 1fr; }
}
</style>
