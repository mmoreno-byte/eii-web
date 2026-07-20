<template>
  <div class="calendario-container">
    <h3>📅 Registro de Hoy</h3>

    <!-- Resumen ejecutivo -->
    <div v-if="registros.length > 0" class="resumen-ejecutivo">
      <h4>📊 Resumen de la semana</h4>
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
          <span class="stat-valor">{{ deposicionesMedia }}</span>
          <span class="stat-etiqueta">Deposiciones/día</span>
        </div>
        <div class="stat">
          <span class="stat-valor">{{ totalRegistros }}</span>
          <span class="stat-etiqueta">Días registrados</span>
        </div>
      </div>
    </div>
    
    <form @submit.prevent="guardarRegistro" class="form-grid">
      <div class="form-group">
        <label>Nº deposiciones</label>
        <input v-model="nuevoRegistro.deposiciones" type="number" required />
      </div>
      
      <div class="form-group">
        <label>Tipo Bristol</label>
        <select v-model="nuevoRegistro.tipoBristol" required>
          <option value="">Selecciona</option>
          <option v-for="n in 7" :key="n" :value="n">{{ n }}</option>
        </select>
      </div>
      
      <div class="form-group">
        <label>Dolor (1-10)</label>
        <input v-model="nuevoRegistro.dolor" type="number" min="1" max="10" required />
      </div>
      
      <div class="form-group">
        <label>Estrés (1-10)</label>
        <input v-model="nuevoRegistro.estres" type="number" min="1" max="10" required />
      </div>
      
      <div class="form-group">
        <label>Horas de sueño</label>
        <input v-model="nuevoRegistro.sueño" type="number" step="0.5" required />
      </div>
      
      <div class="form-group full-width">
        <label>Notas (ej. comida, evento...)</label>
        <input v-model="nuevoRegistro.notas" placeholder="Opcional" />
      </div>
      
      <button type="submit" class="btn-guardar">Guardar Registro</button>
    </form>

    <div class="lista-registros">
      <h4>📋 Últimos 7 días</h4>
      <p v-if="registros.length === 0" class="vacio">Todavía no hay registros. ¡Empieza hoy!</p>
      
      <ul v-else>
        <li v-for="(r, i) in registros.slice(-7).reverse()" :key="i">
          <div class="registro-header">
            <span class="fecha">{{ r.fecha }}</span>
            <span class="badges">
              <span class="badge">Dep: {{ r.deposiciones }}</span>
              <span class="badge">Bristol: {{ r.tipoBristol }}</span>
              <span class="badge">Dolor: {{ r.dolor }}/10</span>
              <span class="badge">Estrés: {{ r.estres }}/10</span>
              <span class="badge">🛌 {{ r.sueño }}h</span>
            </span>
          </div>
          <div v-if="r.notas" class="notas">📝 {{ r.notas }}</div>
        </li>
      </ul>
      
      <button v-if="registros.length > 0" @click="borrarDatos" class="btn-borrar">
        🗑️ Borrar todos los datos
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';

const registros = ref([]);
const nuevoRegistro = ref({
  deposiciones: '',
  tipoBristol: '',
  dolor: '',
  estres: '',
  sueño: '',
  notas: ''
});

// Propiedades computadas para el resumen
const totalRegistros = computed(() => registros.value.length);

const dolorMedio = computed(() => {
  if (registros.value.length === 0) return 0;
  const total = registros.value.reduce((sum, r) => sum + Number(r.dolor), 0);
  return (total / registros.value.length).toFixed(1);
});

const estresMedio = computed(() => {
  if (registros.value.length === 0) return 0;
  const total = registros.value.reduce((sum, r) => sum + Number(r.estres), 0);
  return (total / registros.value.length).toFixed(1);
});

const deposicionesMedia = computed(() => {
  if (registros.value.length === 0) return 0;
  const total = registros.value.reduce((sum, r) => sum + Number(r.deposiciones), 0);
  return (total / registros.value.length).toFixed(1);
});

const guardarRegistro = () => {
  const registro = {
    fecha: new Date().toISOString().split('T')[0],
    ...nuevoRegistro.value
  };
  registros.value = [...registros.value, registro];
  localStorage.setItem('registrosEII', JSON.stringify(registros.value));
  nuevoRegistro.value = { deposiciones: '', tipoBristol: '', dolor: '', estres: '', sueño: '', notas: '' };
};

const borrarDatos = () => {
  if (confirm('¿Borrar todos los registros?')) {
    localStorage.removeItem('registrosEII');
    registros.value = [];
  }
};

onMounted(() => {
  const datos = localStorage.getItem('registrosEII');
  if (datos) registros.value = JSON.parse(datos);
});
</script>

<style scoped>
.calendario-container {
  background: #ffffff;
  border-radius: 24px;
  padding: 2rem;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.06);
  border: 1px solid rgba(230, 126, 34, 0.08);
  margin: 2rem 0;
}

.calendario-container h3 {
  font-size: 1.5rem;
  font-weight: 700;
  color: #1A3C4A;
  margin-bottom: 1.5rem;
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}

.form-group label {
  font-size: 0.85rem;
  font-weight: 600;
  color: #1A3C4A;
}

.form-group input,
.form-group select {
  padding: 0.75rem 1rem;
  border: 2px solid #e9ecef;
  border-radius: 12px;
  font-size: 1rem;
  transition: all 0.2s ease;
  background: #f8f9fa;
  color: #1A3C4A;
  font-family: inherit;
}

.form-group input:focus,
.form-group select:focus {
  outline: none;
  border-color: #E67E22;
  background: #ffffff;
  box-shadow: 0 0 0 4px rgba(230, 126, 34, 0.1);
}

.full-width {
  grid-column: 1 / -1;
}

.btn-guardar {
  grid-column: 1 / -1;
  background: #E67E22;
  color: white;
  border: none;
  padding: 0.9rem;
  border-radius: 12px;
  font-size: 1.1rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;
  font-family: inherit;
  letter-spacing: 0.5px;
  margin-top: 0.5rem;
}

.btn-guardar:hover {
  background: #D35400;
  transform: scale(1.02);
  box-shadow: 0 8px 20px rgba(230, 126, 34, 0.3);
}

.lista-registros {
  margin-top: 2.5rem;
  border-top: 2px dashed #e9ecef;
  padding-top: 1.5rem;
}

.lista-registros h4 {
  font-size: 1.2rem;
  font-weight: 700;
  color: #1A3C4A;
  margin-bottom: 1rem;
}

.vacio {
  color: #888;
  font-style: italic;
}

.lista-registros ul {
  list-style: none;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.lista-registros li {
  background: #f8f9fa;
  padding: 0.75rem 1rem;
  border-radius: 12px;
  border-left: 4px solid #E67E22;
}

.registro-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.fecha {
  font-weight: 700;
  color: #1A3C4A;
}

.badges {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.badge {
  background: white;
  padding: 0.2rem 0.6rem;
  border-radius: 20px;
  font-size: 0.8rem;
  border: 1px solid #e9ecef;
}

.notas {
  margin-top: 0.3rem;
  color: #6c757d;
  font-size: 0.85rem;
  font-style: italic;
  width: 100%;
}

.btn-borrar {
  background: #e74c3c;
  color: white;
  border: none;
  padding: 0.5rem 1.2rem;
  border-radius: 20px;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s ease;
  font-family: inherit;
  margin-top: 1rem;
}

.btn-borrar:hover {
  background: #c0392b;
  transform: scale(0.98);
}

/* Resumen ejecutivo */
.resumen-ejecutivo {
  background: #f8f9fa;
  border-radius: 16px;
  padding: 1.2rem 1.5rem;
  margin-bottom: 2rem;
  border: 1px solid rgba(230, 126, 34, 0.1);
}

.resumen-ejecutivo h4 {
  font-size: 0.9rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: #6c757d;
  margin-bottom: 0.8rem;
}

.estadisticas {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
  gap: 1rem;
}

.stat {
  text-align: center;
}

.stat-valor {
  display: block;
  font-size: 1.8rem;
  font-weight: 800;
  color: #1A3C4A;
}

.stat-etiqueta {
  font-size: 0.8rem;
  color: #6c757d;
}
</style>