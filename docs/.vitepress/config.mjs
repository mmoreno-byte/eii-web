import { defineConfig } from 'vitepress'

export default defineConfig({
  title: "Mi Intestino en Órbita",
  description: "Centro de Control para Guerreros Invisibles",
  lang: 'es-ES',
  
  themeConfig: {
    nav: [
      { text: 'Inicio', link: '/' },
      { text: 'Mi Tablero', link: '/tablero' },
      { text: 'Guerra Invisible', link: '/guerra-invisible' },
      { text: 'Recursos', link: '/recursos' },
      { text: 'Parte de Guerra', link: '/parte-de-guerra' }
    ],
    socialLinks: [
      { icon: 'github', link: 'https://github.com/tu-usuario/eii-web' }
    ],
    footer: {
      message: 'Esto no es consejo médico. Siempre consulta a tu especialista.',
      copyright: '© 2026 - Construido con ❤️ desde la trinchera'
    }
  }
})