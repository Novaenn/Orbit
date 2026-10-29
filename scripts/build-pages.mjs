import { spawnSync } from 'node:child_process'
import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'

const root = new URL('../', import.meta.url)
const output = new URL('dist-pages/', root)
const siteBase = '/Orbit/'
const appBase = `${siteBase}app/`

function run(command, args, env = {}) {
  const result = spawnSync(command, args, {
    cwd: fileURLToPath(root),
    env: { ...process.env, ...env },
    stdio: 'inherit',
  })
  if (result.error) throw result.error
  if (result.status !== 0) process.exit(result.status ?? 1)
}

run('npm', ['run', 'build'], { BASE_PATH: appBase, PWA_ID: siteBase })
run(process.execPath, ['landing-page/build.mjs'])

await rm(output, { recursive: true, force: true })
await mkdir(output, { recursive: true })
await cp(new URL('landing-page/dist/', root), output, { recursive: true })
await cp(new URL('dist/', root), new URL('app/', output), { recursive: true })

// Keep the old worker URL available so cached copies of the old app can update.
await cp(new URL('scripts/legacy-sw.js', root), new URL('sw.js', output))

// Installed apps may still fetch the old manifest URL. Resolve its icon paths
// against the new app location while retaining the original manifest identity.
const manifest = JSON.parse(await readFile(new URL('app/manifest.webmanifest', output), 'utf8'))
manifest.icons = manifest.icons.map(icon => ({
  ...icon,
  src: new URL(icon.src, `https://samuelebella.com${appBase}`).pathname,
}))
await writeFile(new URL('manifest.webmanifest', output), JSON.stringify(manifest))
await writeFile(new URL('.nojekyll', output), '')
console.log(`Pages site built: ${siteBase} (landing), ${appBase} (dashboard)`)
