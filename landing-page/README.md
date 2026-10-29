# Orbit landing page

A standalone static introduction to Orbit. Built with HTML, CSS, and a small script for mobile navigation and the dashboard screenshot dialog. No dependencies, external fonts, analytics, or build tools are required.

```sh
cd landing-page
npm run dev        # http://127.0.0.1:4174
npm run build      # copy static assets into dist/
npm run preview    # serve dist/ on the same port
```

The production website is deployed with the dashboard from the parent repository. From the repository root, use `npm run build:pages` and `npm run preview:pages` to preview the complete website at `http://127.0.0.1:4175/Orbit/`. GitHub Pages publishes the combined `dist-pages/` artifact on pushes to `main`.

All Get Orbit buttons open `./app/`, which resolves to https://samuelebella.com/Orbit/app/ in production. The source and license links point to GitHub. The canonical and Open Graph URLs use https://samuelebella.com/Orbit/. The standalone landing preview shows its design; the dashboard, compatibility manifest, and installed-app migration are available in the combined preview.

Typography scales up on desktop and large displays; screens up to 800px retain the original font sizes. Small section labels are intentionally omitted.

The dashboard screenshot and logo come from the parent Orbit project. The hero chart is explicitly illustrative. Feature descriptions are based on the existing application and README.

Licensed under GPL-3.0-only, like Orbit. See `LICENSE`.
