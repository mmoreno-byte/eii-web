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

    // PWA: manifest + service worker (solo en cliente)
    if (typeof window !== 'undefined') {
      const link = document.createElement('link')
      link.rel = 'manifest'
      link.href = '/manifest.webmanifest'
      document.head.appendChild(link)

      // Theme color del navegador
      const meta = document.createElement('meta')
      meta.name = 'theme-color'
      meta.content = '#E67E22'
      document.head.appendChild(meta)

      // Apple touch icon (iOS PWA)
      const apple = document.createElement('link')
      apple.rel = 'apple-touch-icon'
      apple.href = '/icons/icon.svg'
      document.head.appendChild(apple)

      // Registrar SW
      if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
          navigator.serviceWorker.register('/sw.js').catch((err) => {
            console.warn('SW no se pudo registrar', err)
          })
        })
      }
    }
  }
}
