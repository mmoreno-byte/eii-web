<template>
  <div class="bristol-container">
    <h3>🚽 Escala de Bristol — Referencia rápida</h3>
    <p class="bristol-intro">
      La <strong>Escala de Bristol</strong> clasifica la forma de las heces en 7 tipos.
      Es la forma más sencilla de comunicar a tu médico cómo son tus deposiciones
      sin entrar en detalles incómodos. <em>Los tipos 3 y 4 se consideran "ideales".</em>
    </p>

    <div class="bristol-grid">
      <div
        v-for="tipo in tipos"
        :key="tipo.id"
        class="bristol-card"
        :class="{ 'bristol-card-activo': tipoActivo === tipo.id }"
        @click="tipoActivo = tipoActivo === tipo.id ? null : tipo.id"
      >
        <div class="bristol-visual" :style="{ background: tipo.color }">
          <span class="bristol-numero">{{ tipo.id }}</span>
          <span class="bristol-icono">{{ tipo.icono }}</span>
        </div>
        <div class="bristol-info">
          <h4>{{ tipo.titulo }}</h4>
          <p class="bristol-desc">{{ tipo.descripcion }}</p>
          <span class="bristol-tag" :style="{ color: tipo.color, borderColor: tipo.color }">
            {{ tipo.etiqueta }}
          </span>
        </div>
      </div>
    </div>

    <div class="bristol-leyenda">
      <p>
        💡 <strong>Consejo:</strong> apunta el tipo Bristol cada día en tu registro.
        Es uno de los primeros datos que tu digestólogo te va a preguntar.
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const tipoActivo = ref(null)

// Descripciones adaptadas de la escala original de Heaton & O'Donnell (1997),
// usadas universalmente en práctica clínica.
const tipos = [
  {
    id: 1,
    titulo: 'Trozos duros separados',
    descripcion: 'Como nueces. Difíciles de expulsar. Estreñimiento severo.',
    etiqueta: 'Estreñimiento severo',
    color: 'var(--bristol-1)',
    icono: '🥜'
  },
  {
    id: 2,
    titulo: 'En forma de salchicha pero grumosa',
    descripcion: 'Con bultos irregulares. Dura y compacta.',
    etiqueta: 'Estreñimiento leve',
    color: 'var(--bristol-2)',
    icono: '🌭'
  },
  {
    id: 3,
    titulo: 'En forma de salchicha con grietas',
    descripcion: 'Con fisuras en la superficie. Forma adecuada.',
    etiqueta: 'Normal-bajo',
    color: 'var(--bristol-3)',
    icono: '🥖'
  },
  {
    id: 4,
    titulo: 'Lisa y suave, como una serpiente',
    descripcion: 'Blanda, sin grietas, bien formada. La forma ideal.',
    etiqueta: 'Normal-ideal',
    color: 'var(--bristol-4)',
    icono: '🐍'
  },
  {
    id: 5,
    titulo: 'Trozos blandos con bordes definidos',
    descripcion: 'Esferas blandas, fáciles de expulsar.',
    etiqueta: 'Diarrea leve',
    color: 'var(--bristol-5)',
    icono: '🟢'
  },
  {
    id: 6,
    titulo: 'Trozos blandos, bordes irregulares',
    descripcion: 'Pastosa, con restos. No llega a ser diarrea.',
    etiqueta: 'Diarrea leve',
    color: 'var(--bristol-6)',
    icono: '💧'
  },
  {
    id: 7,
    titulo: 'Acuosa, sin piezas sólidas',
    descripcion: 'Líquida, sin forma. Diarrea.',
    etiqueta: 'Diarrea severa',
    color: 'var(--bristol-7)',
    icono: '💦'
  }
]

defineExpose({ tipos })
</script>

<style scoped>
.bristol-container {
  background: var(--brand-tarjeta);
  border-radius: 20px;
  padding: 1.75rem 1.75rem 1.25rem;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.06);
  border: 1px solid var(--brand-borde-suave);
  margin: 1.5rem 0;
}
.bristol-container h3 {
  color: var(--brand-petroleo);
  font-weight: 800;
  font-size: 1.4rem;
  margin: 0 0 0.6rem 0;
}
.bristol-intro {
  color: var(--brand-texto-secundario);
  font-size: 0.95rem;
  line-height: 1.55;
  margin-bottom: 1.25rem;
}
.bristol-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 0.85rem;
  margin-bottom: 1rem;
}
.bristol-card {
  display: flex;
  align-items: center;
  gap: 0.85rem;
  padding: 0.75rem;
  border: 2px solid var(--brand-borde);
  border-radius: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
  background: #FBFCFD;
}
.bristol-card:hover {
  border-color: var(--brand-naranja);
  transform: translateY(-2px);
  box-shadow: 0 6px 18px rgba(230, 126, 34, 0.12);
}
.bristol-card-activo {
  border-color: var(--brand-naranja);
  background: rgba(230, 126, 34, 0.06);
  transform: translateY(-2px);
  box-shadow: 0 6px 18px rgba(230, 126, 34, 0.18);
}
.bristol-visual {
  width: 56px;
  height: 56px;
  border-radius: 14px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  color: #fff;
  font-weight: 800;
  box-shadow: inset 0 -3px 0 rgba(0,0,0,0.12);
}
.bristol-numero { font-size: 1.4rem; line-height: 1; }
.bristol-icono { font-size: 1rem; line-height: 1; margin-top: 2px; }
.bristol-info { flex: 1; min-width: 0; }
.bristol-info h4 {
  color: var(--brand-petroleo);
  font-size: 0.9rem;
  font-weight: 700;
  margin: 0 0 0.2rem 0;
  line-height: 1.2;
}
.bristol-desc {
  color: var(--brand-texto-secundario);
  font-size: 0.78rem;
  line-height: 1.35;
  margin: 0 0 0.4rem 0;
}
.bristol-tag {
  display: inline-block;
  font-size: 0.7rem;
  font-weight: 700;
  padding: 0.15rem 0.55rem;
  border: 1.5px solid;
  border-radius: 20px;
  background: #fff;
}
.bristol-leyenda {
  margin-top: 0.5rem;
  padding: 0.8rem 1rem;
  background: rgba(46, 139, 87, 0.07);
  border-left: 4px solid var(--brand-exito);
  border-radius: 0 10px 10px 0;
  font-size: 0.88rem;
  color: var(--brand-petroleo);
}
.bristol-leyenda p { margin: 0; line-height: 1.5; }

@media (max-width: 540px) {
  .bristol-grid { grid-template-columns: 1fr; }
}
</style>
