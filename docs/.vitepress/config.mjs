import { defineConfig } from 'vitepress'

export default defineConfig({
  title: "Mi Intestino en Órbita",
  description: "Centro de Control para Guerreros Invisibles",
  lang: 'es-ES',

  // Dominio en producción
  cleanUrls: true,

  // Para que VitePress procese dependencias de npm (chart.js, jspdf, vue)
  // y no las inline como archivos externos. Viene por defecto en 1.0.
  vite: {
    optimizeDeps: {
      include: ['chart.js', 'jspdf', 'jspdf-autotable']
    },
    ssr: {
      noExternal: ['chart.js', 'jspdf', 'jspdf-autotable']
    }
  },

  themeConfig: {
    nav: [
      { text: 'Inicio', link: '/' },
      { text: 'Mi Tablero', link: '/tablero' },
      { text: 'Guerra Invisible', link: '/guerra-invisible' },
      { text: 'Recursos', link: '/recursos' },
      { text: 'Parte de Guerra', link: '/parte-de-guerra' }
    ],
    socialLinks: [
      { icon: 'github', link: 'https://github.com/mmorenodev/eii-web' }
    ],
    footer: {
      message: 'Esto no es consejo médico. Siempre consulta a tu especialista.',
      copyright: `© ${new Date().getFullYear()} — Construido con ❤️ desde la trinchera · eii-web.pages.dev`
    }
  }
})
