# Deployment Guide

## Prerequisites

Before deploying, ensure you have:
- [Vercel Account](https://vercel.com/signup)
- [Vercel CLI](https://vercel.com/cli) installed
- [Groq API Key](https://console.groq.com/keys)
- Git repository connected to GitHub

## Environment Setup

### Required Secrets

Configure the following in your deployment platform:

#### Vercel Dashboard
Go to `Project Settings > Environment Variables` and add:

| Variable | Environment | Description |
|----------|-------------|-------------|
| `GROQ_API_KEY` | Production, Preview, Development | Your Groq API key |
| `AI_MODEL` | Production, Preview | Model to use (optional, defaults to `openai/gpt-oss-20b`) |

#### GitHub Actions (for CI/CD)
Go to `Repository Settings > Secrets and variables > Actions` and add:

| Secret | Description |
|--------|-------------|
| `VERCEL_TOKEN` | [Vercel Personal Access Token](https://vercel.com/account/tokens) |
| `VERCEL_ORG_ID` | Found in `.vercel/project.json` or Vercel team settings |
| `VERCEL_PROJECT_ID` | Found in `.vercel/project.json` or project settings |

## Deployment Methods

### Method 1: Automatic via GitHub Actions (Recommended)

1. Set up all secrets as above
2. Push to `main` branch - production deployment triggers automatically
3. Open a PR - preview deployment triggers with URL comment

### Method 2: Vercel CLI

```bash
# Install CLI globally
npm install -g vercel

# Login
vercel login

# Link project (first time)
vercel link

# Deploy preview
vercel

# Deploy production
vercel --prod
```

### Method 3: Vercel Dashboard

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your GitHub repository
3. Configure build settings (auto-detected)
4. Add environment variables
5. Click Deploy

## Build Configuration

Vercel auto-detects the configuration from:
- `package.json` - build scripts
- `vercel.json` - routing and function settings
- `vite.config.ts` - build configuration

### Build Settings
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`
- **Development Command**: `npm run dev`

## Post-Deployment Checklist

- [ ] Verify environment variables are set correctly
- [ ] Test API endpoints (`/api/health`, `/api/stories`, `/api/about`)
- [ ] Test AI assistant functionality
- [ ] Check security headers
- [ ] Verify custom domain (if configured)
- [ ] Test on mobile devices
- [ ] Run Lighthouse audit
- [ ] Check error tracking

## Monitoring & Maintenance

### Health Checks
- `GET /api/health` - Server health status
- Monitor Vercel function logs
- Check for errors in Vercel dashboard

### Performance
- Use Vercel Analytics
- Monitor Core Web Vitals
- Check bundle size regularly

### Updates
```bash
# Update dependencies
npm update

# Check for vulnerabilities
npm audit

# Fix vulnerabilities
npm audit fix
```

## Troubleshooting

### Build Fails
- Check TypeScript errors: `npm run lint`
- Verify all dependencies installed
- Check environment variables

### API Errors
- Verify `GROQ_API_KEY` is set correctly
- Check function logs in Vercel dashboard
- Ensure rate limits not exceeded

### 404 on Routes
- Verify `vercel.json` routes configuration
- Check SPA fallback is configured

## Rollback

In Vercel dashboard:
1. Go to Deployments
2. Find previous successful deployment
3. Click "..." menu > Promote to Production

Or via CLI:
```bash
vercel rollback
```
