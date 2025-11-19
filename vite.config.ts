import react from '@vitejs/plugin-react'
import path from 'path'
import fs from 'fs'
import { defineConfig } from 'vite'

const esToolkitAliases = JSON.parse(fs.readFileSync(path.resolve(__dirname, 'aliases.json'), 'utf-8'));

export default defineConfig(({ mode }) => {
  const isProduction = mode === 'production'

  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
        ...esToolkitAliases,
      },
    },
    server: {
      host: true,
      port: 8080,
      proxy: {
        '/trpc': {
          target: 'http://localhost:3000',
          changeOrigin: true,
        },
        '/api': {
          target: 'http://localhost:3000',
          changeOrigin: true,
        },
      },
    },
    build: {
      outDir: 'dist',
      emptyOutDir: true,
      sourcemap: !isProduction,
      minify: isProduction ? 'terser' : false,
      rollupOptions: {
        output: {
          manualChunks: (id) => {
            // Core React libraries
            if (id.includes('react') || id.includes('react-dom')) {
              return 'react-core'
            }

            // TanStack libraries (router, query)
            if (id.includes('@tanstack')) {
              return 'tanstack'
            }

            // tRPC libraries
            if (id.includes('@trpc')) {
              return 'trpc'
            }

            // Supabase libraries
            if (id.includes('@supabase')) {
              return 'supabase'
            }

            // UI libraries (radix, lucide)
            if (id.includes('@radix-ui') || id.includes('lucide-react')) {
              return 'ui-libraries'
            }

            // Forms and validation
            if (id.includes('react-hook-form') || id.includes('@hookform') || id.includes('zod')) {
              return 'forms'
            }

            // Voice and speech features
            if (id.includes('speech') || id.includes('voice') || id.includes('audio')) {
              return 'voice-features'
            }

            // Charts and visualization
            if (id.includes('recharts') || id.includes('d3')) {
              return 'charts'
            }

            // Date and time utilities
            if (id.includes('date-fns') || id.includes('dayjs')) {
              return 'date-utils'
            }

            // Animation and motion
            if (id.includes('motion') || id.includes('framer-motion')) {
              return 'animation'
            }

            // Everything else from node_modules
            if (id.includes('node_modules')) {
              return 'vendor'
            }
          },
        },
      },
      chunkSizeWarningLimit: 1000,
    },
    define: {
      ...(!isProduction && {
        __DEV__: true,
      }),
    },
    optimizeDeps: {
      include: [
        'react',
        'react-dom',
        '@tanstack/react-router',
        '@tanstack/react-query',
        '@trpc/server',
        '@trpc/client',
        '@trpc/react-query',
        '@supabase/supabase-js',
        '@radix-ui/react-dialog',
        '@radix-ui/react-dropdown-menu',
        '@radix-ui/react-select',
        'lucide-react',
        'react-hook-form',
        '@hookform/resolvers',
        'zod',
        'date-fns',
        'es-toolkit/compat',
        'react-is',
        'use-sync-external-store',
        'eventemitter3',
      ],
      exclude: [
        // Exclude heavy dependencies from pre-bundling
        'framer-motion',
        'speech-recognition-polyfill',
      ],
    },
  }
})
