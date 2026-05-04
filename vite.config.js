import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const isProduction = mode === 'production'

  // Security headers for production
  const securityHeaders = {
    // Prevent XSS attacks
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'geolocation=(self), camera=(), microphone=(), payment=()',
  }

  if (isProduction) {
    securityHeaders['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains; preload'
  }

  // Content Security Policy
  const cspDirectives = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // Required for React
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: blob: https://*.supabase.co https://picsum.photos https://maps.googleapis.com https://lh3.googleusercontent.com",
    "connect-src 'self' https://*.supabase.co https://maps.googleapis.com",
    "frame-src 'self'",
    "base-uri 'self'",
    "form-action 'self'",
    "manifest-src 'self'",
    "worker-src 'self'",
  ]

  if (isProduction) {
    securityHeaders['Content-Security-Policy'] = cspDirectives.join('; ')
  }

  return {
    plugins: [
      react(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg'],
        manifest: {
          name: 'Fomo Markets',
          short_name: 'Fomo',
          description: 'Discover local markets, events and happenings near you',
          theme_color: '#F0EDE6',
          background_color: '#F0EDE6',
          display: 'standalone',
          scope: '/',
          start_url: '/',
          orientation: 'portrait',
          icons: [
            {
              src: '/icon-192x192.svg',
              sizes: '192x192',
              type: 'image/svg+xml',
              purpose: 'any maskable'
            },
            {
              src: '/icon-512x512.svg',
              sizes: '512x512',
              type: 'image/svg+xml',
              purpose: 'any maskable'
            }
          ]
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
          skipWaiting: true,
          clientsClaim: true,
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/.*\.supabase\.co\/.*$/,
              handler: 'NetworkFirst',
              options: {
                cacheName: 'supabase-api-cache',
                expiration: {
                  maxEntries: 100,
                  maxAgeSeconds: 60 * 60 * 24 // 24 hours
                },
                cacheableResponse: {
                  statuses: [0, 200]
                }
              }
            },
            {
              urlPattern: /^https:\/\/picsum\.photos\/.*$/,
              handler: 'CacheFirst',
              options: {
                cacheName: 'images-cache',
                expiration: {
                  maxEntries: 50,
                  maxAgeSeconds: 60 * 60 * 24 * 7 // 7 days
                }
              }
            }
          ]
        }
      })
    ],
    server: {
      port: 3000,
      open: true,
      // Add security headers in development too
      headers: securityHeaders,
      // Proxy Google Places API to avoid CORS
      proxy: {
        '/api/places': {
          target: 'https://maps.googleapis.com',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/places/, '/maps/api/place'),
        },
        '/api/geocode': {
          target: 'https://maps.googleapis.com',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/geocode/, '/maps/api/geocode'),
        }
      }
    },
    build: {
      outDir: 'dist',
      // Minify and optimize for production
      minify: isProduction ? 'terser' : false,
      // Increase chunk size warning limit (default is 500)
      chunkSizeWarningLimit: 1000,
      rollupOptions: {
        output: {
          manualChunks: {
            // Split vendor libraries into separate chunks
            'vendor-react': ['react', 'react-dom'],
            'vendor-supabase': ['@supabase/supabase-js'],
          }
        }
      },
      terserOptions: isProduction ? {
        compress: {
          drop_console: true, // Remove console.log in production
          drop_debugger: true,
          pure_funcs: ['console.log', 'console.info', 'console.debug', 'console.warn']
        },
        mangle: {
          safari10: true
        }
      } : {}
    },
    preview: {
      port: 4173,
      headers: securityHeaders
    }
  }
})
