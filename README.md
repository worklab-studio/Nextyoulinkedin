## Nextyou LinkedIn Writer (Next.js + shadcn/ui)

Modern LinkedIn content studio with AI-assisted writing, editable prompts, and a scheduling calendar. The OpenAI API key is loaded from environment variables so nothing sensitive touches the browser.

## 1. Prerequisites

- Node.js 18+ (Next.js 16 requirement)
- An OpenAI API key with access to `gpt-4o-mini`
- npm (or yarn/pnpm/bun if you prefer)

## 2. Environment Variables

Copy the example file and add your real key:

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```
OPENAI_API_KEY=sk-your-key-here
```

## 3. Install & Run

```bash
npm install
npm run dev
```

Visit http://localhost:3000 to use the studio.

## 4. Quality & Production Builds

- `npm run lint` – static analysis
- `npm run build` – production build (runs lint automatically)
- `npm start` – run the compiled build locally

## 5. Deploying to Vercel

1. Push this folder to GitHub (or connect directly through the Vercel CLI).
2. In Vercel Project Settings → Environment Variables, add `OPENAI_API_KEY`.
3. Deploy. The `/api/generate` route automatically proxies requests to OpenAI using the server-side key.

## 6. Project Structure

- `src/app/page.tsx` – main UI (profiles, prompts, chat, calendar)
- `src/app/api/generate/route.ts` – serverless endpoint wrapping OpenAI
- `src/components/ui/*` – shadcn/ui primitives
- `src/components/theme-provider.tsx` – theme + Sonner toast wiring

Happy shipping! 🎉
