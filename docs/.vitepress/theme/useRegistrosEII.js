import { ref, watch } from 'vue'

const STORAGE_KEY = 'registrosEII'
const registros = ref([])
let inicializado = false

/**
 * useRegistrosEII()
 * Devuelve la lista de registros compartida por todos los componentes de la web.
 * La fuente de verdad vive en localStorage y se sincroniza con la ref reactiva.
 * Los cambios en la ref se persisten automáticamente.
 */
export function useRegistrosEII() {
  if (!inicializado) {
    try {
      const datos = typeof localStorage !== 'undefined' && localStorage.getItem(STORAGE_KEY)
      if (datos) {
        const parsed = JSON.parse(datos)
        if (Array.isArray(parsed)) registros.value = parsed
      }
    } catch (e) {
      console.warn('useRegistrosEII: no se pudieron cargar los registros', e)
    }
    inicializado = true

    watch(
      registros,
      (nuevo) => {
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(nuevo))
        } catch (e) {
          console.warn('useRegistrosEII: no se pudo guardar', e)
        }
      },
      { deep: true }
    )
  }
  return { registros }
}
