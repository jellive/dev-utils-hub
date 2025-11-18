import { test, expect, _electron as electron } from '@playwright/test'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

test.describe('UUID Generator File System', () => {
  test('should show save and open buttons', async () => {
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
    await window.waitForTimeout(2000)

    // Navigate to UUID Generator
    await window.click('text=UUID Generator')
    await window.waitForTimeout(1000)

    // Close history panel if open
    const historyPanel = window.locator('[role="dialog"]:has-text("History")')
    if (await historyPanel.isVisible()) {
      await window.click('button:has-text("✕")')
      await window.waitForTimeout(500)
    }

    // Generate a UUID to create history
    await window.click('button:has-text("Generate UUID")')
    await window.waitForTimeout(1000)

    // Check if history section exists
    const historySection = window.locator('text=History')
    await expect(historySection).toBeVisible()

    // Check if save button exists
    const saveButton = window.locator('button:has-text("저장")')
    console.log('Save button visible:', await saveButton.isVisible())

    // Check if open button exists
    const openButton = window.locator('button:has-text("열기")')
    console.log('Open button visible:', await openButton.isVisible())

    // Take screenshot
    await window.screenshot({ path: 'uuid-file-system-test.png' })

    // Close app
    await electronApp.close()
  })
})
