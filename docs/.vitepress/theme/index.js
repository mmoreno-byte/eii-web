import DefaultTheme from 'vitepress/theme'
import './custom.css'
import { useRegistrosEII } from './useRegistrosEII.js'

// Clave compartida para inject/provide de los registros
export const REGISTROS_KEY = Symbol.for('eii-registros')

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    // Fuente de verdad única para todos los componentes de la web
    const { registros } = useRegistrosEII()
    app.provide(REGISTROS_KEY, registros)
  }
}
