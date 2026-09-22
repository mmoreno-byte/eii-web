import { defineConfig } from 'vitepress'

const SITE_URL = 'https://eii-web.pages.dev'
const OG_TITLE = 'Mi Intestino en Órbita — Centro de Control para Guerreros Invisibles'
const OG_DESCRIPTION = 'Deja de adivinar. Empieza a registrar. Ciencia traducida y herramientas reales para pacientes con EII.'

export default defineConfig({
  title: "Mi Intestino en Órbita",
  description: "Centro de Control para Guerreros Invisibles",
  lang: 'es-ES',

  // Dominio en producción
  cleanUrls: true,

  head: [
    ['link', { rel: 'icon', type: 'image/svg+xml', href: '/icons/icon.svg' }],
    ['meta', { property: 'og:type', content: 'website' }],
    ['meta', { property: 'og:site_name', content: 'Mi Intestino en Órbita' }],
    ['meta', { property: 'og:title', content: OG_TITLE }],
    ['meta', { property: 'og:description', content: OG_DESCRIPTION }],
    ['meta', { property: 'og:image', content: `${SITE_URL}/preview.png` }],
    ['meta', { property: 'og:url', content: `${SITE_URL}/` }],
    ['meta', { property: 'og:locale', content: 'es_ES' }],
    ['meta', { name: 'twitter:card', content: 'summary_large_image' }],
    ['meta', { name: 'twitter:title', content: OG_TITLE }],
    ['meta', { name: 'twitter:description', content: OG_DESCRIPTION }],
    ['meta', { name: 'twitter:image', content: `${SITE_URL}/preview.png` }],
  ],

  // Para que VitePress procese dependencias de npm (chart.js, jspdf, qrcode, vue)
  // y no las inline como archivos externos. Viene por defecto en 1.0.
  vite: {
    optimizeDeps: {
      include: ['chart.js', 'jspdf', 'jspdf-autotable', 'qrcode']
    },
    ssr: {
      noExternal: ['chart.js', 'jspdf', 'jspdf-autotable', 'qrcode']
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
      { icon: 'github', link: 'https://github.com/mmoreno-byte/eii-web' }
    ],
    footer: {
      message: 'Esto no es consejo médico. Siempre consulta a tu especialista.',
      copyright: `© ${new Date().getFullYear()} — Construido con ❤️ desde la trinchera · eii-web.pages.dev`
    }
  }
})
