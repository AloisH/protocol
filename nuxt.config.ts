import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
// https://nuxt.com/docs/api/configuration/nuxt-config
import vue from '@vitejs/plugin-vue';

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineNuxtConfig({
  // Workaround: @nuxt/fonts leaves zombie esbuild process
  // https://github.com/nuxt/nuxt/issues/33987

  modules: [
    '@nuxt/content',
    '@nuxt/ui',
    '@nuxt/image',
    '@nuxt/test-utils/module',
    'nuxt-security',
    '@nuxtjs/sitemap',
    'nuxt-og-image',
    // '@scalar/nuxt', // TODO: fix build issue with @scalar/helpers
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
    databaseUrl: process.env.DATABASE_URL,
    authSecret: process.env.AUTH_SECRET,
    githubClientId: process.env.GITHUB_CLIENT_ID,
    githubClientSecret: process.env.GITHUB_CLIENT_SECRET,
    googleClientId: process.env.GOOGLE_CLIENT_ID,
    googleClientSecret: process.env.GOOGLE_CLIENT_SECRET,
    resendApiKey: process.env.RESEND_API_KEY,
    resendFromEmail: process.env.RESEND_FROM_EMAIL,
    public: {
      appUrl: process.env.APP_URL || 'http://localhost:3000',
      oauthGithubEnabled: !!process.env.GITHUB_CLIENT_ID && !!process.env.GITHUB_CLIENT_SECRET,
      oauthGoogleEnabled: !!process.env.GOOGLE_CLIENT_ID && !!process.env.GOOGLE_CLIENT_SECRET,
      authCallbackUrl: '/org/select',
      publicRoutes: [
        '/',
        '/auth/login',
        '/auth/register',
        '/auth/verify-email',
        '/auth/forgot-password',
        '/auth/forgot-password-sent',
        '/auth/reset-password',
        '/auth/magic-link',
        '/auth/magic-link-sent',
        '/api/auth/verify-email',
        '/blog',
        '/blog/*',
        '/docs',
        '/docs/*',
        '/legal/privacy',
        '/legal/terms',
        '/changelog',
        '/changelog/*',
        '/contact',
      ],
    },
  },

  alias: {
    '#shared': resolve(__dirname, './shared'),
  },

  routeRules: {
    '/': { prerender: true },
    '/blog': { prerender: true },
    // ISR only in production (causes payload 404s in dev)
    '/blog/**': process.env.NODE_ENV === 'production' ? { isr: 3600 } : {},
    '/docs': { prerender: true },
    '/docs/**': process.env.NODE_ENV === 'production' ? { isr: 3600 } : {},
    '/changelog': { prerender: true },
    '/legal/**': { prerender: true },
    '/contact': { prerender: true },
    // Protected routes - skip prerender
    '/admin/**': { prerender: false },
    '/onboarding/**': { prerender: false },
    '/profile/**': { prerender: false },
    '/org/**': { prerender: false },
  },

  compatibilityDate: '2025-01-15',
  nitro: {
    rollupConfig: {
      plugins: [vue()],
      external: [/^@prisma\//, /\.wasm$/],
    },
    experimental: {
      wasm: true,
      openAPI: true,
    },
    openAPI: {
      meta: {
        title: 'Bistro API',
        description: 'Nuxt 4 SaaS boilerplate API',
        version: '1.0.0',
      },
      ui: {
        scalar: {
          route: '/api-docs',
        },
      },
    },
    prerender: {
      crawlLinks: true,
      routes: ['/', '/blog', '/docs', '/rss.xml'],
    },
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
      exclude: ['@prisma/client', '@prisma/adapter-pg'],
    },
    resolve: {
      alias: {
        '.prisma/client/index-browser': './node_modules/@prisma/client/index-browser.js',
      },
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
    exclude: ['/auth/**', '/admin/**', '/org/**', '/api/**', '/onboarding/**'],
    sources: ['/api/__sitemap__/urls'],
  },
});
