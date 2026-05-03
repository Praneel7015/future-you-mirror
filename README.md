# Future You Mirror

> See the skin you'll have — and the one you could.

A hackathon MVP for the Perfect Corp × Pegasus Startup World Cup. Upload a selfie → get a skin-age analysis → see your split-screen future self with and without care.

## Setup

```bash
npm install
cp .env.local.example .env.local  # fill in your Perfect Corp keys
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment Variables

```
PERFECT_CORP_CLIENT_ID=       # from Perfect Corp Console
PERFECT_CORP_CLIENT_SECRET=   # RSA public key (PEM format)
PERFECT_CORP_API_BASE=https://yce-api-01.perfectcorp.com
```

Never commit `.env.local`.

## Redeploy to Vercel

```bash
# Push to GitHub, Vercel auto-deploys on push to main.
# Set env vars in: Vercel dashboard → Project → Settings → Environment Variables
git push origin main
```

Vercel project URL: https://future-you-mirror.vercel.app/

## Stack

- Next.js 16 App Router + TypeScript (strict)
- Tailwind CSS v4 + shadcn/ui (warm-mocha theme)
- Zustand (sessionStorage state)
- Framer Motion
- Perfect Corp Skin Analysis + AI Aging APIs

## Demo

Click "Try with sample photo" to bypass the API and see the full experience using pre-cached data.
