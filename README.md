# Future You Mirror

> See the skin you'll have — and the one you could.

A cinematic skin mirror for the **YouCam API Skin AI & eCommerce VTO Hackathon** (deadline **Nov 2, 2026**). One selfie becomes an aging timeline, a with-care portrait, and plain-language next steps. It is **not medical advice** and **not a dermatologist**.

**Live:** [future-you-mirror.vercel.app](https://future-you-mirror.vercel.app/)

**Judge demo (no API key, no Perfect Corp call):** [future-you-mirror.vercel.app/mirror?demo=true](https://future-you-mirror.vercel.app/mirror?demo=true)

Locally: [http://localhost:3000/mirror?demo=true](http://localhost:3000/mirror?demo=true)

---

## For judges

| Path | What happens |
| --- | --- |
| **Try with sample photo** (`/mirror?demo=true`) | Loads `public/sample.json` and baked portraits in `public/sample-photos/`. The with-care side uses `public/sample-photos/with-care/`. **Perfect Corp is not called.** |
| **Begin the Mirror Test** | Consent, then camera or upload. The photo is sent to Perfect Corp for **AI Skin Analysis**, **AI Aging**, and **AI Skin Simulation** when the server key is set. |
| Insights | Top concerns map to an ingredient and a product *type*. A few named products are labeled examples, not endorsements or a shop. Food notes for acne and inflammation link to AAD and NIH. |
| Privacy / Terms | `/privacy` and `/terms`. Clearing the phone does not delete a Perfect Corp copy. |

YouCam APIs used on the live path: `skin-analysis`, `aging`, `skin-simulation`.

---

## Setup

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Demo mode works with **no** `.env.local`.

---

## Environment variables

Set these on the server only. Never commit them, and never paste them into the repo.

| Variable | Required | Purpose |
| --- | --- | --- |
| `PERFECT_CORP_CLIENT_ID` | Yes, for live readings | Client id from the Perfect Corp / YouCam console |
| `PERFECT_CORP_CLIENT_SECRET` | Yes, for live readings | **RSA public key PEM** body used to build the `id_token`. Despite the name, it is not an OAuth client secret. |
| `PERFECT_CORP_API_BASE` | No | Auth host. Defaults to `https://yce-api-01.perfectcorp.com` |
| `PERFECT_CORP_DATA_BASE` | No | Tasks and file uploads. Defaults to `https://yce-api-01.makeupar.com` |

On Vercel: **Project → Settings → Environment Variables** for Preview and Production, then redeploy.

If the key is missing, rejected, or out of credits (`CreditInsufficiency`), `/api/simulate` returns a JSON error and the split view says the with-care photo was **not** made. It does not pretend a filter is a simulation. A successful live simulation reads `results.url` from the task (the link is valid for about two hours).

### Refresh Perfect Corp credits

The previous credit pack expired. The person who owns the console refreshes it:

1. Register for the hackathon on Devpost and get the redeem code by email.
2. Sign in at the YouCam / Perfect Corp API console.
3. Open **Account → Redeem Code** and enter the code. Units are added there.
4. Copy the **client id** and the **RSA public key** into the four variables above on Vercel. Do not send the key in chat or commit it.
5. Redeploy so the new values are picked up.

Live **Begin the Mirror Test** uses those units. The demo URL does not.

---

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Dev server |
| `npm run build` | Production build |
| `npm run start` | Serve production output |
| `npm run lint` | ESLint |
| `npm test` | Citation, demo-bypass, and URL checks |
| `node scripts/bake-with-care.mjs` | Rebuild sample with-care JPEGs from `public/sample-photos/age-*.jpg` |

---

## HTTP routes

| Route | Purpose |
| --- | --- |
| `POST /api/analyze` | Multipart field `image` → `{ skin, aging, meta }` |
| `POST /api/simulate` | JSON `sourceUrl`. Sample paths and `demo: true` return a baked image and do not call Perfect Corp. Live calls return `{ imageUrl, mode: "live" }` or `{ error, message }`. |
| `GET` / `POST /api/share-card` | 1080×1920 PNG |
| `GET /api/climate` | UV, humidity, and air context. No Perfect Corp key. |

---

## Stack

Next.js 16 App Router, React 19, TypeScript strict, Tailwind CSS v4, Framer Motion, Zustand, sharp. No accounts and no database.
