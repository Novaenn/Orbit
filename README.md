<p align="center">
  <img src="public/favicon.svg" alt="Orbit icon" width="96" height="96">
</p>

# Orbit

**Your training, in orbit.**

Orbit is a friendly, local-first dashboard for your running history. Export your activities from
[intervals.icu](https://intervals.icu), load the CSV, and Orbit turns all those numbers into an
easy-to-read picture of your training: weekly volume, fitness and form, race predictions, personal
bests, and trends. There is no account and nothing is uploaded — your data stays in your browser.

## Running it

```bash
npm install
npm run dev       # http://localhost:5173
npm run build     # production build in dist/
```

Open the app and choose the activities CSV exported from intervals.icu. Your imported activities and
race tags are saved in the browser's localStorage.

- **Upload new CSV** is the upload icon in the top app bar.
- **Data details** and **Clear data** are in the ⋮ menu.

## Testing

```bash
npm test          # unit tests
npm run test:e2e  # browser tests (Playwright, uses the installed Chrome)
```

The tests read `i463508_activities.csv` from the project root. That personal export is gitignored, so
place your own intervals.icu export there before running them.

## Project structure

```
src/
  lib/          calculations, no React: CSV parsing, weekly volume, fitness, races,
                predictions, personal bests, summary, insights, formatting, storage
  md/           Material components built on Tailwind: buttons, icon buttons and tooltips,
                cards, chips, toggle buttons, dialog, bottom sheet, menu, snackbar, banner,
                data table and pagination, lists, search field, progress, ripple
  hooks/        data and persistence, theme, navigation (URL hash, transitions, scroll)
  components/   AppShell (top app bar, bottom navigation, rail, drawer), UploadScreen,
                data dialogs, overview/, races/, insights/, activities/
  index.css     Material theme: colour roles, dark theme, type scale, elevation, states, motion
tests/          Playwright browser tests
```

Built with React, Vite, TypeScript, Tailwind CSS, Recharts, PapaParse, date-fns, Roboto, Material
Design Icons, Vitest, and Playwright.

## License

MIT — see [LICENSE](LICENSE).
