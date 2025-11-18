import { test, expect, _electron as electron } from '@playwright/test'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

test.describe('UUID Generator Screenshot', () => {
  test('capture full page screenshot', async () => {
    // Launch Electron app
    const electronApp = await electron.launch({
      args: [path.join(__dirname, '../dist-electron/main/index.js')],
      env: {
        ...process.env,
        NODE_ENV: 'production'
      }
    })

    // Get the first window
    const window = await electronApp.firstWindow()

    // Wait for app to load
    await window.waitForLoadState('domcontentloaded')
    await window.waitForTimeout(3000)

    // Navigate to UUID Generator
    await window.click('text=UUID Generator')
    await window.waitForTimeout(2000)

    // Generate a UUID first
    await window.click('button:has-text("Generate UUID")')
    await window.waitForTimeout(1000)

    // Take full page screenshot
    await window.screenshot({
      path: 'uuid-full-page.png',
      fullPage: true
    })

    console.log('Screenshot saved to uuid-full-page.png')

    // Close app
    await electronApp.close()
  })
})
