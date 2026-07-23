# Echo — Photography Portfolio

Minimalist photography portfolio built with [Astro](https://astro.build) + [Tailwind CSS](https://tailwindcss.com), deployed for free on [Vercel](https://vercel.com).

## Adding photos

**Option A — the /admin page (no coding):**
Visit `/admin` on the live site, enter the admin password, upload photos, set a
title/category/size for each, and hit Publish. Everything goes out as a single
commit and the site rebuilds automatically in about a minute.

**Option B — by hand:**
1. Drop your exported JPG/PNG into `public/images/<category>/`, e.g.:
   ```
   public/images/film/coastal-road.jpg
   ```
2. Open `src/data/photos.ts` and add an entry:
   ```ts
   { id: "coastal-road", title: "Coastal Road, Ektar", category: "film", image: "/images/film/coastal-road.jpg" }
   ```
   - `category` is one of `"bw"`, `"color"`, `"film"`.
   - `size` is optional: `"square"` (default), `"wide"`, or `"tall"`.
3. Commit and push to `main` — Vercel rebuilds and deploys automatically.

## Local development

1. Install dependencies:
   ```bash
   npm install
   ```
2. (Optional — only needed to test the /admin page locally) copy `.env.example`
   to `.env` and fill in `GITHUB_TOKEN`, `GITHUB_OWNER`, `GITHUB_REPO`,
   `ADMIN_PASSWORD`. Not needed if you're just editing pages/styles or adding
   photos by hand.
3. Run the dev server:
   ```bash
   npm run dev
   ```
4. Visit `http://localhost:4321`. Changes to any file hot-reload instantly.

## Making changes locally and publishing them

```bash
git pull origin main       # get the latest version
# ...edit files, add photos, etc...
git add -A
git commit -m "describe what changed"
git push origin main       # Vercel auto-deploys this
```

## Build

```bash
npm run build
npm run preview
```

## Environment variables (Vercel)

Set these under **Project Settings → Environment Variables** for the `/admin`
upload page to work in production:

| Name | Value |
|---|---|
| `GITHUB_TOKEN` | Fine-grained GitHub PAT scoped to this repo, with Contents: Read and write |
| `GITHUB_OWNER` | `jericho161616` |
| `GITHUB_REPO` | `moments_portfolio` |
| `ADMIN_PASSWORD` | A password only you know |

Redeploy after adding/changing env vars for them to take effect.
