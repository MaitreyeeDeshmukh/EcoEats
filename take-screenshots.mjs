import puppeteer from 'puppeteer'
import { mkdir } from 'fs/promises'
import { resolve } from 'path'

const SCREENSHOTS_DIR = resolve('./screenshots')
const BASE_URL = 'http://localhost:5173'
const VIEWPORT = { width: 390, height: 844 }

await mkdir(SCREENSHOTS_DIR, { recursive: true })

const browser = await puppeteer.launch({
  headless: 'new',
  args: ['--no-sandbox', '--disable-setuid-sandbox'],
})

const page = await browser.newPage()
await page.setViewport(VIEWPORT)

// ── 1. Splash screen ──────────────────────────────────────────────────────────
console.log('Taking splash screen screenshot...')
await page.goto(BASE_URL + '/?nodemo', { waitUntil: 'domcontentloaded' })
await page.waitForSelector('.bg-forest-700', { timeout: 3000 }).catch(() => {})
await page.screenshot({ path: `${SCREENSHOTS_DIR}/01-splash.png` })
console.log('  saved: 01-splash.png')

// ── 2. Auth screen (nodemo → no user, shows sign-in form after splash) ────────
console.log('Taking auth screen screenshot...')
await page.goto(BASE_URL + '/?nodemo', { waitUntil: 'networkidle0' })
await new Promise(r => setTimeout(r, 2500)) // wait past 2s splash animation
await page.screenshot({ path: `${SCREENSHOTS_DIR}/02-auth.png` })
console.log('  saved: 02-auth.png')

// ── 3. Feed — demo mode (default URL, demo user auto-logged in) ───────────────
console.log('Taking feed screenshot...')
await page.goto(BASE_URL, { waitUntil: 'networkidle0' })
await new Promise(r => setTimeout(r, 2500)) // wait past splash
await page.screenshot({ path: `${SCREENSHOTS_DIR}/03-feed.png` })
console.log('  saved: 03-feed.png')

// ── 4. Feed — scrolled to show all 3 cards ────────────────────────────────────
console.log('Taking feed (full scroll) screenshot...')
await page.evaluate(() => {
  const main = document.querySelector('main')
  if (main) main.querySelector('[class*="overflow-y-auto"]')?.scrollBy(0, 300)
})
await new Promise(r => setTimeout(r, 300))
await page.screenshot({ path: `${SCREENSHOTS_DIR}/04-feed-scrolled.png` })
console.log('  saved: 04-feed-scrolled.png')

await browser.close()

console.log('\nAll screenshots saved to:', SCREENSHOTS_DIR)
