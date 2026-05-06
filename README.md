# Future You Mirror

> See the skin you'll have — and the one you could.

Hackathon MVP for the **Perfect Corp × Pegasus Startup World Cup**. Upload a selfie → Perfect Corp **AI Skin Analysis** (concerns + skin age) plus **AI Aging** (timeline of renders) → **AI Skin Simulation** for the “with care” portrait → cinematic **morph** and **skin-age reveal** → split **with / without care** mirror with lifestyle sliders → **insights**, optional **climate** context, **privacy** ledger, and a **shareable story card**.

**Live:** [future-you-mirror.vercel.app](https://future-you-mirror.vercel.app/)

---

## Highlights


| Feature        | Notes                                                                                                  |
| -------------- | ------------------------------------------------------------------------------------------------------ |
| Mirror journey | Steps: consent → capture → loading → morph → reveal → split → insights → share (`app/mirror/page.tsx`) |
| Demo mode      | `**/mirror?demo=true`** — skips live APIs and loads `**public/sample.json**`                           |
| Export         | 1080×1920 PNG from `**/api/share-card**` (see APIs below)                                              |
| Climate        | `**/api/climate**` (edge) uses Vercel geo + Open‑Meteo; no external API keys                           |


---

## Setup

```bash
npm install
```

Create `**.env.local**` in the project root with the variables below (never commit secrets).

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Environment variables


| Variable                     | Purpose                                                                                                           |
| ---------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `PERFECT_CORP_CLIENT_ID`     | From Perfect Corp console                                                                                         |
| `PERFECT_CORP_CLIENT_SECRET` | **RSA public key PEM** body used for RSA encryption (despite the name, it is **not** an OAuth-style secret token) |
| `PERFECT_CORP_API_BASE`      | Auth / handshake host (default `**https://yce-api-01.perfectcorp.com`**)                                          |
| `PERFECT_CORP_DATA_BASE`     | Tasks + file uploads (default `**https://yce-api-01.makeupar.com**`)                                              |


On Vercel, set these under **Project → Settings → Environment Variables** for Preview and Production.

---

## Scripts


| Command         | Purpose                 |
| --------------- | ----------------------- |
| `npm run dev`   | Dev server (Turbopack)  |
| `npm run build` | Production build        |
| `npm run start` | Serve production output |
| `npm run lint`  | ESLint                  |


---

## Deploy (Vercel)

Push your release branch — e.g. `**main`** — with the env vars configured on the dashboard.

```bash
git push origin main
```

---

## Stack (snapshot)


| Layer        | Choices in this repo                                                                                                                                  |
| ------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| App          | **Next.js 16.2.x** · App Router · **React 19** · TypeScript (**strict**)                                                                              |
| Styling      | **Tailwind CSS v4** via `@tailwindcss/postcss`; theme tokens in `**app/globals.css`** (there is **no** `tailwind.config.ts`)                          |
| Components   | Editorial UI built in TSX + Tailwind/`style` pairs; primitives use `**@base-ui/react`** and icons may use `**lucide-react**` — **not** shadcn/ui      |
| Client state | **Zustand** (`lib/store.ts`) — plain in-memory store (no persisted `sessionStorage` middleware in code)                                               |
| Motion       | **Framer Motion** for step transitions and landing entrances                                                                                          |
| Images       | **sharp** preprocessing (`lib/image-utils.ts`), Perfect Corp uploads, **memory + disk cache** (`lib/cache.ts`, `.cache/` gitignored for dev fixtures) |


---

## HTTP routes


| Route                          | Purpose                                                                                                                                         |
| ------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `POST /api/analyze`            | Multipart field `**image`** → `{ skin, aging, meta }`                                                                                           |
| `POST /api/simulate`           | JSON `sourceUrl` + intensity fields → `{ imageUrl }`                                                                                            |
| `GET` / `POST /api/share-card` | Returns **PNG** `ImageResponse` (edge). Use `**POST` + JSON body** when presigned image URLs would make the query string too long for `**GET`** |
| `GET /api/climate`             | Edge‑friendly snippet for insights card                                                                                                         |


Docs also reference `**/privacy**`, `**/opengraph-image**`, and `**/**`.

---

## Project notes & handoff

- **Security:** see global headers in `next.config.ts` (camera limited to **self**, frame deny, etc.).
- **Operational detail** (Perfect Corp quirks, caching / credits, file map, UX rules): if you maintain a `**References/HANDOFF.md`** locally, paste it into new collaborator chats — this repo keeps that folder ignored in some workspaces.

