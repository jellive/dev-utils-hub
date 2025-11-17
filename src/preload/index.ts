import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Platform information interface
interface PlatformInfo {
  platform: NodeJS.Platform
  arch: string
  version: string
  versions: NodeJS.ProcessVersions
}

// Custom APIs for renderer
const api = {
  // Test IPC communication
  ping: (): Promise<string> => ipcRenderer.invoke('ping'),

  // Get application version
  getAppVersion: (): Promise<string> => ipcRenderer.invoke('get-app-version'),

  // Get platform information
  getPlatformInfo: (): Promise<PlatformInfo> => ipcRenderer.invoke('platform-info')
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}
