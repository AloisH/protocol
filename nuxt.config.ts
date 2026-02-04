import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
// https://nuxt.com/docs/api/configuration/nuxt-config
import vue from '@vitejs/plugin-vue';

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineNuxtConfig({
  // Workaround: @nuxt/fonts leaves zombie esbuild process
  // https://github.com/nuxt/nuxt/issues/33987

  modules: [
    '@nuxt/ui',
    '@nuxt/image',
    '@nuxt/test-utils/module',
    'nuxt-security',
    '@nuxtjs/sitemap',
    'nuxt-og-image',
    '@vite-pwa/nuxt',
  ],

  // Auto-import components from nested feature directories
  components: [
    {
      path: '~/components',
      pathPrefix: false, // Don't prefix nested components with parent dir
    },
  ],

  // Auto-import composables from nested feature directories
  imports: {
    dirs: [
      'composables', // Root composables
      'composables/**', // Nested composables (auth/, todo/, org/)
    ],
  },

  devtools: {
    enabled: true,
  },

  css: ['~/assets/css/main.css'],

  // Sitemap configuration
  site: {
    url: process.env.APP_URL || 'http://localhost:3000',
  },

  runtimeConfig: {
    public: {
      appUrl: process.env.APP_URL || 'http://localhost:3000',
    },
  },

  alias: {
    '#shared': resolve(__dirname, './shared'),
  },

  routeRules: {
    // Disable prerendering - Protocol is fully client-side PWA
    // '/': { prerender: true },
    // '/legal/**': { prerender: true },
    // '/contact': { prerender: true },
  },

  compatibilityDate: '2025-01-15',
  nitro: {
    rollupConfig: {
      plugins: [vue()],
      external: [/\.wasm$/],
    },
    experimental: {
      wasm: true,
    },
    prerender: false,
  },

  vite: {
    server: {
      fs: {
        allow: [__dirname],
        strict: false,
      },
      headers: {
        'Cache-Control': 'no-store',
      },
    },
    optimizeDeps: {
      exclude: [],
    },
  },

  typescript: {
    tsConfig: {
      include: ['./shared/**/*.ts', './server/testing/**/*.ts'],
      compilerOptions: {
        strictNullChecks: true,
      },
    },
  },
  hooks: {
    close: (nuxt) => {
      if (!nuxt.options._prepare)
        process.exit(0);
    },
  },
  // Image optimization
  image: {
    format: ['avif', 'webp'],
    quality: 80,
  },

  // OG Image generation
  ogImage: {
    defaults: {
      component: 'NuxtSeo',
      width: 1200,
      height: 630,
    },
  },

  // Security headers
  security: {
    // Disable rate limiter in dev
    rateLimiter: process.env.NODE_ENV !== 'production' ? false : undefined,
    headers: {
      contentSecurityPolicy: {
        'default-src': ['\'self\''],
        'script-src': [
          '\'self\'',
          '\'nonce-{{nonce}}\'',
          '\'strict-dynamic\'',
          // Vue runtime needs eval in dev mode
          ...(process.env.NODE_ENV !== 'production' ? ['\'unsafe-eval\''] : []),
        ],
        'style-src': ['\'self\'', '\'unsafe-inline\''], // Nuxt UI requires inline styles
        'img-src': ['\'self\'', 'data:', 'https:'],
        'font-src': ['\'self\''],
        'connect-src': ['\'self\''],
        'frame-ancestors': ['\'none\''],
        'base-uri': ['\'self\''],
        'form-action': ['\'self\''],
      },
      xFrameOptions: 'DENY',
      xContentTypeOptions: 'nosniff',
      referrerPolicy: 'strict-origin-when-cross-origin',
      permissionsPolicy: {
        camera: [],
        microphone: [],
        geolocation: [],
      },
    },
    // HSTS only in production (requires HTTPS)
    strict: process.env.NODE_ENV === 'production',
  },
  sitemap: {
    exclude: [],
  },

  pwa: {
    manifest: {
      name: 'Protocol',
      short_name: 'Protocol',
      description: 'Personal routine tracking PWA. Set up and monitor daily, weekly, monthly, or yearly protocols.',
      theme_color: '#10b981',
      background_color: '#000000',
      display: 'standalone',
      scope: '/',
      start_url: '/',
      icons: [
        {
          src: '/icon-192x192.png',
          sizes: '192x192',
          type: 'image/png',
          purpose: 'any',
        },
        {
          src: '/icon-512x512.png',
          sizes: '512x512',
          type: 'image/png',
          purpose: 'any',
        },
        {
          src: '/icon-512x512.png',
          sizes: '512x512',
          type: 'image/png',
          purpose: 'maskable',
        },
      ],
    },
    workbox: {
      globPatterns: ['**/*.{js,css,html,png,svg,ico}'],
      navigateFallback: '/',
      navigateFallbackDenylist: [/^\/api\//, /^\/__/],
    },
    strategies: 'injectManifest',
    filename: 'sw.ts',
  },
});
