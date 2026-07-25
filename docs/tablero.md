---
title: Mi Tablero de Control
---

# 📊 Mi Panel de Control

<script setup>
import Calendario from '/.vitepress/components/Calendario.vue'
import GraficoMensual from '/.vitepress/components/GraficoMensual.vue'
import EscalaBristol from '/.vitepress/components/EscalaBristol.vue'
import GeneradorPDF from '/.vitepress/components/GeneradorPDF.vue'
import GestionDatos from '/.vitepress/components/GestionDatos.vue'
import { inject } from 'vue'
import { REGISTROS_KEY } from './.vitepress/theme/index.js'

// El provider viene del theme (useRegistrosEII). Es la única fuente de verdad.
const registros = inject(REGISTROS_KEY)
</script>

<div class="tablero-intro">
  <p>
    Aquí mandas tú. <strong>Registra, observa, lleva a tu médico.</strong>
    Todo se guarda en tu navegador; expórtalo periódicamente para no perder nada
    o instálalo como app en el móvil.
  </p>
</div>

## 🗓️ Calendario

<Calendario />

## 📈 Gráficos mensuales

<GraficoMensual :registros="registros" />

## 🚽 Escala de Bristol (referencia)

<EscalaBristol />

## 📄 Generar PDF para imprimir

<GeneradorPDF :registros="registros" />

## 💾 Tus datos, a tu manera

<GestionDatos :registros="registros" />

---

<div class="nota-eii">
  🩺 <strong>Para tu próxima consulta:</strong> genera el PDF del mes y llega con
  gráficas en la mano. Tu digestólogo te lo va a agradecer.
</div>

<style scoped>
.tablero-intro {
  background: linear-gradient(135deg, rgba(230,126,34,0.08), rgba(26,60,74,0.05));
  border-left: 5px solid var(--brand-naranja);
  padding: 1.1rem 1.4rem;
  border-radius: 0 14px 14px 0;
  margin: 1.5rem 0;
  font-size: 1.02rem;
  color: var(--brand-petroleo);
  line-height: 1.55;
}
.tablero-intro p { margin: 0; }
.tablero-intro strong { color: var(--brand-naranja-oscuro); }
</style>
