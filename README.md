# Echo — Photography Portfolio

Minimalist photography portfolio built with [Astro](https://astro.build) + [Tailwind CSS](https://tailwindcss.com), deployed for free on [Vercel](https://vercel.com).

## Adding photos

1. Drop your exported JPG/PNG into `public/images/<category>/`, e.g.:
   ```
   public/images/film/coastal-road.jpg
   ```
2. Open `src/data/photos.ts` and either edit an existing entry or add a new one:
   ```ts
   { id: "coastal-road", title: "Coastal Road, Ektar", category: "film", image: "/images/film/coastal-road.jpg" }
   ```
   - `category` is one of `"bw"`, `"color"`, `"film"`.
   - `size` is optional: `"square"` (default), `"wide"`, or `"tall"`.
   - Leave `image` as `null` to keep the placeholder tile.
3. Commit and push — Vercel rebuilds and deploys automatically.

## Local development

```bash
npm install
npm run dev
```

Visit `http://localhost:4321`.

## Build

```bash
npm run build
npm run preview
```

## Deploying to Vercel (free)

1. Push this repo to GitHub (already done if you're reading this from the repo).
2. Go to [vercel.com/new](https://vercel.com/new), import the repo.
3. Framework preset: **Astro** (auto-detected). No environment variables needed.
4. Deploy — every push to `main` redeploys automatically.
