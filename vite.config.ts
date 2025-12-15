import path from 'node:path';

import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig(({ mode }) => {
        const isProduction = mode === 'production';

        return {
                build: {
                        chunkSizeWarningLimit: 1000,
                        emptyOutDir: true,
                        minify: isProduction ? 'terser' : false,
                        outDir: 'dist',
                        rollupOptions: {
                                external: [
                                        'pg',
                                        'pg-pool',
                                        'pg-native',
                                        '@neondatabase/serverless',
                                        'drizzle-orm/node-postgres',
                                        'drizzle-orm/neon-http',
                                        'drizzle-orm/neon-serverless',
                                ],
                                output: {
                                        manualChunks: {
                                                // Core React libraries - keep together to avoid initialization issues
                                                'react-vendor': ['react', 'react-dom', 'scheduler', 'react-is'],
                                                // TanStack libraries
                                                tanstack: ['@tanstack/react-router', '@tanstack/react-query'],
                                                // UI libraries
                                                'ui-libraries': [
                                                        '@radix-ui/react-slot',
                                                        'class-variance-authority',
                                                        'clsx',
                                                        'tailwind-merge',
                                                ],
                                                // Forms
                                                forms: ['react-hook-form', '@hookform/resolvers', 'zod'],
                                                // Date utilities
                                                'date-utils': ['date-fns'],
                                                // Charts
                                                charts: ['recharts'],
                                        },
                                },
                        },
                        sourcemap: !isProduction,
                },
                define: {
                        ...(!isProduction && {
                                __DEV__: true,
                        }),
                },
                optimizeDeps: {
                        exclude: [
                                'pg',
                                'pg-pool',
                                'pg-native',
                                '@neondatabase/serverless',
                                'drizzle-orm/node-postgres',
                                'drizzle-orm/neon-http',
                                'drizzle-orm/neon-serverless',
                        ],
                        include: [
                                'react',
                                'react-dom',
                                '@tanstack/react-router',
                                '@tanstack/react-query',
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
                                '@clerk/clerk-react',
                        ],
                },
                plugins: [react(), tailwindcss()],
                resolve: {
                        alias: {
                                '@': path.resolve(__dirname, './src'),
                        },
                        dedupe: ['@clerk/clerk-react', '@clerk/backend', '@clerk/localizations'],
                },
                server: {
                        host: '0.0.0.0',
                        port: 5000,
                        allowedHosts: true,
                        proxy: {
                                '/api': {
                                        changeOrigin: true,
                                        target: 'http://localhost:3000',
                                },
                        },
                },
        };
});
