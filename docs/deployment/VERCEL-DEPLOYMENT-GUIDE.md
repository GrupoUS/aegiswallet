# Vercel Deployment Guide

This guide details the deployment process for AegisWallet on the Vercel platform, leveraging the Hono + Vite stack.

## 1. Introduction

AegisWallet is configured for seamless deployment on Vercel, utilizing:
- **Vite** for the frontend build
- **Hono** for the backend API (serverless/edge functions)
- **Vercel CLI** for automated deployment management

## 2. Initial Setup

### Prerequisites
- Vercel Account
- Vercel CLI installed globally
- Bun runtime

### Installation & Linking

1. Install Vercel CLI:
   ```bash
   bun add -g vercel
   ```

2. Login to Vercel:
   ```bash
   vercel login
   ```

3. Link the project to your Vercel account:
   ```bash
   vercel link
   ```

4. Configure Environment Variables:
   ```bash
   bun deploy:vercel:setup
   ```
   This script will guide you through adding necessary variables from your local `.env.local` to Vercel.

## 3. Deployment Process

We provide automated scripts to handle build validation and deployment.

### Preview Deployment
Deploys to a preview URL (e.g., `aegiswallet-git-feature.vercel.app`).
```bash
bun deploy:vercel:preview
```

### Production Deployment
Deploys directly to the production URL.
```bash
bun deploy:vercel:prod
```

### Manual Deployment
If you prefer manual control:
```bash
vercel deploy --prebuilt          # Preview
vercel deploy --prod --prebuilt   # Production
```

## 4. Environment Variables

The following variables are required for the application to function correctly on Vercel. These should be configured via the `deploy:vercel:setup` script or the Vercel Dashboard.

| Variable | Description |
|----------|-------------|
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase public anonymous key |
| `VITE_GOOGLE_CLIENT_ID` | Google OAuth Client ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth Client Secret |
| `GOOGLE_REDIRECT_URI` | OAuth callback URI |
| `TOKENS_ENCRYPTION_KEY` | Key for encrypting sensitive tokens |

## 5. Troubleshooting

### View Logs
To view runtime logs for a specific deployment:
```bash
vercel logs [deployment-url]
```

### Health Check
Verify the backend is running correctly:
```bash
curl https://[your-deployment-url]/health
```

### Rollback
To revert to a previous deployment:
```bash
vercel rollback
```

## 6. CI/CD Integration

Automated deployments are configured via GitHub Actions (`.github/workflows/vercel-deploy.yml`).
- **Push to `main`**: Triggers a Production deployment.
- **Pull Requests**: Triggers a Preview deployment with a comment containing the URL.

## 7. Performance Optimization

- **Edge Runtime**: The Hono server runs on Vercel Edge Functions for low latency.
- **Caching**: Static assets are served with aggressive caching headers (`Cache-Control: public, max-age=31536000, immutable`).
- **Rewrites**: API requests are efficiently routed to the server function via `vercel.json` configuration.

