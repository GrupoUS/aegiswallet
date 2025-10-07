import react from '@vitejs/plugin-react'
import path from 'path'
import { defineConfig } from 'vite'

export default defineConfig(({ mode }) => {
  const isProduction = mode === 'production'

  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
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
            // Vendor chunks
            if (id.includes('react') || id.includes('react-dom')) {
              return 'react-vendor'
            }

            // Router chunk
            if (id.includes('@tanstack/react-router')) {
              return 'router'
            }

            // Query chunk
            if (id.includes('@tanstack/react-query')) {
              return 'query'
            }

            // tRPC chunk
            if (id.includes('@trpc')) {
              return 'trpc'
            }

            // UI components - split by library
            if (id.includes('@radix-ui')) {
              return 'radix-ui'
            }

            if (id.includes('lucide-react')) {
              return 'icons'
            }

            // Charts and visualization
            if (id.includes('recharts')) {
              return 'charts'
            }

            // Date handling
            if (id.includes('date-fns')) {
              return 'date-utils'
            }

            // Forms
            if (id.includes('react-hook-form') || id.includes('@hookform')) {
              return 'forms'
            }

            // Voice and speech
            if (id.includes('speech') || id.includes('voice') || id.includes('audio')) {
              return 'voice'
            }

            // Calendar components
            if (id.includes('calendar') || id.includes('react-day-picker')) {
              return 'calendar'
            }

            // DnD (drag and drop)
            if (id.includes('@dnd-kit')) {
              return 'dnd'
            }

            // Motion/animation
            if (id.includes('motion')) {
              return 'animation'
            }

            // Theme
            if (id.includes('next-themes')) {
              return 'theme'
            }

            // Everything else
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
      ],
    },
  }
})
