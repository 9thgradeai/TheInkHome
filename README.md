# The Ink Home

An immersive, cinematic spatial publication portal for [The Ink Home](https://medium.com/the-ink-home) on Medium.

## Tech Stack
- **Frontend:** React 19, TypeScript, Vite 6, Tailwind CSS v4, Framer Motion
- **Backend:** Node.js/Express (dev) or Vercel Serverless Functions (prod)
- **AI:** Groq API integration

## Getting Started

### Prerequisites
- Node.js 24.x
- npm

### Installation
```bash
npm install
```

### Environment Variables
Copy `.env.example` to `.env` and configure:
```bash
cp .env.example .env
```

Required variables:
- `GROQ_API_KEY` - Get from [Groq](https://console.groq.com/)

### Development
```bash
npm run dev
```

### Build
```bash
npm run build
```

### Type Check
```bash
npm run lint
```

## Security Notes
- Never commit `.env` files or API keys
- All secrets should be set in your deployment platform's environment variables
- API endpoints have rate limiting and input validation

## Deployment
Deployed on [Vercel](https://vercel.com) at [theinkhome.live](https://theinkhome.live)

## License
Private - All rights reserved
