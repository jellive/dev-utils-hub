import { test, expect, _electron as electron, ElectronApplication, Page } from '@playwright/test'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

let electronApp: ElectronApplication
let page: Page

test.beforeAll(async () => {
  // Launch Electron app
  electronApp = await electron.launch({
    args: [join(__dirname, '../dist-electron/main/index.cjs')],
    env: {
      ...process.env,
      NODE_ENV: 'test'
    }
  })

  // Get the first window
  page = await electronApp.firstWindow()
  await page.waitForLoadState('domcontentloaded')
})

test.afterAll(async () => {
  await electronApp.close()
})

test.describe('UUID Generator History Integration', () => {
  test('should save generated UUID to history and display in sidebar', async () => {
    // Navigate to UUID Generator
    await page.click('text=UUID')
    await page.waitForTimeout(500)

    // Generate a UUID
    await page.click('button:has-text("UUID 생성")')
    await page.waitForTimeout(500)

    // Get the generated UUID from the input field
    const uuidInput = page.locator('[data-testid="current-uuid"]')
    const generatedUUID = await uuidInput.inputValue()

    expect(generatedUUID).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i)
    console.log('Generated UUID:', generatedUUID)

    // Open history sidebar
    await page.click('button:has-text("기록")')
    await page.waitForTimeout(500)

    // Check if history sidebar is visible
    const historySidebar = page.locator('div:has-text("History")').first()
    await expect(historySidebar).toBeVisible()

    // Check if the generated UUID appears in the history list
    const historyItem = page.locator(`text=${generatedUUID}`).first()
    await expect(historyItem).toBeVisible({ timeout: 5000 })

    console.log('✅ UUID found in history sidebar')
  })

  test('should display multiple UUIDs in history', async () => {
    // Navigate to UUID Generator
    await page.click('text=UUID')
    await page.waitForTimeout(500)

    // Generate 3 UUIDs
    const uuids: string[] = []
    for (let i = 0; i < 3; i++) {
      await page.click('button:has-text("UUID 생성")')
      await page.waitForTimeout(300)

      const uuidInput = page.locator('[data-testid="current-uuid"]')
      const uuid = await uuidInput.inputValue()
      uuids.push(uuid)
      console.log(`Generated UUID ${i + 1}:`, uuid)
    }

    // Open history sidebar
    await page.click('button:has-text("기록")')
    await page.waitForTimeout(500)

    // Verify all UUIDs appear in history
    for (const uuid of uuids) {
      const historyItem = page.locator(`text=${uuid}`).first()
      await expect(historyItem).toBeVisible({ timeout: 5000 })
    }

    console.log('✅ All 3 UUIDs found in history sidebar')
  })

  test('should show timestamp for history entries', async () => {
    // Navigate to UUID Generator
    await page.click('text=UUID')
    await page.waitForTimeout(500)

    // Open history sidebar
    await page.click('button:has-text("기록")')
    await page.waitForTimeout(500)

    // Check for timestamp indicators (e.g., "Just now", "8m ago")
    const timestamps = page.locator('text=/Just now|\\d+[smhd] ago/')
    const count = await timestamps.count()

    expect(count).toBeGreaterThan(0)
    console.log(`✅ Found ${count} timestamp(s) in history`)
  })

  test('should allow clicking history item to load UUID', async () => {
    // Navigate to UUID Generator
    await page.click('text=UUID')
    await page.waitForTimeout(500)

    // Generate a UUID
    await page.click('button:has-text("UUID 생성")')
    await page.waitForTimeout(500)

    const uuidInput = page.locator('[data-testid="current-uuid"]')
    const originalUUID = await uuidInput.inputValue()

    // Generate another UUID to change the current value
    await page.click('button:has-text("UUID 생성")')
    await page.waitForTimeout(500)

    // Open history sidebar
    await page.click('button:has-text("기록")')
    await page.waitForTimeout(500)

    // Click on the first UUID in history
    const firstHistoryItem = page.locator(`text=${originalUUID}`).first()
    await firstHistoryItem.click()
    await page.waitForTimeout(300)

    // Verify the UUID was loaded back
    const loadedUUID = await uuidInput.inputValue()
    expect(loadedUUID).toBe(originalUUID)

    console.log('✅ History item click loaded UUID correctly')
  })

  test('should support search in history', async () => {
    // Navigate to UUID Generator
    await page.click('text=UUID')
    await page.waitForTimeout(500)

    // Open history sidebar
    await page.click('button:has-text("기록")')
    await page.waitForTimeout(500)

    // Get the first UUID from history
    const firstUUID = await page.locator('[class*="font-mono"]').first().textContent()

    if (firstUUID) {
      // Search for first 8 characters of the UUID
      const searchTerm = firstUUID.substring(0, 8)
      const searchInput = page.locator('input[placeholder*="Search"]')
      await searchInput.fill(searchTerm)
      await page.waitForTimeout(500)

      // Verify filtered results contain the search term
      const historyItems = page.locator('[class*="font-mono"]')
      const count = await historyItems.count()

      expect(count).toBeGreaterThan(0)

      // Verify all visible items contain the search term
      for (let i = 0; i < count; i++) {
        const text = await historyItems.nth(i).textContent()
        expect(text?.toLowerCase()).toContain(searchTerm.toLowerCase())
      }

      console.log(`✅ Search filtered to ${count} result(s)`)
    }
  })
})
