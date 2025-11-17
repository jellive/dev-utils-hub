declare module 'electron-localshortcut' {
  import { BrowserWindow } from 'electron'

  export function register(
    window: BrowserWindow | BrowserWindow[],
    accelerator: string | string[],
    callback: () => void
  ): void

  export function unregister(window: BrowserWindow | BrowserWindow[], accelerator: string | string[]): void

  export function unregisterAll(window: BrowserWindow | BrowserWindow[]): void

  export function isRegistered(window: BrowserWindow, accelerator: string): boolean

  export function enableAll(window: BrowserWindow): void

  export function disableAll(window: BrowserWindow): void
}
