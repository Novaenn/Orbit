<p align="center">
  <img src="public/favicon.svg" alt="Orbit icon" width="96" height="96">
</p>

# Orbit

Orbit is a local-first dashboard for your running history. Export your activities from
[intervals.icu](https://intervals.icu), load the CSV, and Orbit turns all those numbers into an
easy-to-read picture of your training: weekly volume, fitness and form, race predictions, personal
bests, and trends. There is no account and nothing is uploaded — your data stays in your browser.

## Screenshots

<p align="center">
  <img src="docs/screenshots/overview.webp" alt="Orbit overview showing weekly volume, fitness and form, and the running calendar">
</p>

## Running it

```bash
npm install
npm run dev       # http://localhost:5173
npm run build     # production build in dist/
npm run preview   # serve the production build, including the service worker
```

Open the app and choose the activities CSV exported from intervals.icu. Your imported activities and
race tags are saved in the browser's localStorage.

## Website and deployment

- [Landing page](https://samuelebella.com/Orbit/)
- [Running dashboard](https://samuelebella.com/Orbit/app/)

The existing GitHub Pages workflow builds and deploys both together on pushes to `main`:

```bash
npm run build:pages    # combined static site in dist-pages/
npm run preview:pages  # http://127.0.0.1:4175/Orbit/
npm run test:pages     # build and check both paths, offline use, and migration
```

`npm run dev` and `npm run build` still run/build the dashboard on its own. The Pages build sets
`BASE_PATH=/Orbit/app/` and `PWA_ID=/Orbit/`, copies the landing page to the deployment root and the
dashboard into `app/`, and keeps the old manifest and worker URLs available for existing installs.
The app's manifest keeps its identity while its launch URL and offline scope move to `/Orbit/app/`.

Existing activity data stays available because both paths share the same HTTPS origin and storage
keys. The compatibility worker at `/Orbit/sw.js` replaces the former cached app, moves open app tabs
to the new path, and removes only the former worker's precache. Old home-screen launches are also
forwarded to the dashboard, preserving query strings and selected tabs. The landing page does not
install a service worker for new visitors. Keep the compatibility files in future deployments.

- **Upload new CSV** is the upload icon in the top app bar.
- **Data details** and **Clear data** are in the ⋮ menu.

## Testing

```bash
npm test          # unit tests
npm run test:e2e  # browser tests (Playwright, uses the installed Chrome)
```

The tests read `i463508_activities.csv` from the project root. That personal export is gitignored, so
place your own intervals.icu export there before running them. The browser suite also checks the web
app manifest and an offline reload.


## License

Orbit is free software licensed under the **GNU General Public License v3.0** — see
[LICENSE](LICENSE).

Copyright (C) 2026 Samuele Bella.

You may redistribute and/or modify Orbit under the terms of GPL-3.0. If you distribute a modified
version, you must make the corresponding source available under the same license. There is no
warranty.
