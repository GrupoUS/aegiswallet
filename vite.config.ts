import react from '@vitejs/plugin-react'
import path from 'path'
import fs from 'fs'
import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'

const rawAliases = JSON.parse(fs.readFileSync(path.resolve(__dirname, 'aliases.json'), 'utf-8'));
// Remove es-toolkit aliases since directory has been deleted
const esToolkitAliases = {};

export default defineConfig(({ mode }) => {
  const isProduction = mode === 'production'

  return {
    build: {
      chunkSizeWarningLimit: 1000,
      emptyOutDir: true,
      minify: isProduction ? 'terser' : false,
      outDir: 'dist',
      rollupOptions: {
        output: {
          manualChunks: {
            // Core React libraries - keep together to avoid initialization issues
            'react-vendor': ['react', 'react-dom', 'scheduler', 'react-is'],
            // TanStack libraries
            'tanstack': ['@tanstack/react-router', '@tanstack/react-query'],
            // Supabase
            'supabase': ['@supabase/supabase-js'],
            // UI libraries
            'ui-libraries': ['@radix-ui/react-slot', 'class-variance-authority', 'clsx', 'tailwind-merge'],
            // Forms
            'forms': ['react-hook-form', '@hookform/resolvers', 'zod'],
            // Date utilities
            'date-utils': ['date-fns'],
            // Charts
            'charts': ['recharts'],
          },
        },
      },
      sourcemap: !isProduction,
    }, define: {
      ...(!isProduction && {
        __DEV__: true,
      }),
    }, optimizeDeps: {
      exclude: [
        // Exclude heavy dependencies from pre-bundling
        'speech-recognition-polyfill',
      ], include: [
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
        'react-is',
        'use-sync-external-store',
        'eventemitter3',
      ],
    }, plugins: [react(), tailwindcss()], resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
        ...esToolkitAliases,
      },
    },       server: {
      host: true,
      port: 8080,
      proxy: {
        '/api': {
          changeOrigin: true, target: 'http://localhost:3000',
        },
      },
    },
  }
})
