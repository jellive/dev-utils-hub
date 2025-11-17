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
  getPlatformInfo: (): Promise<PlatformInfo> => ipcRenderer.invoke('platform-info'),

  // Settings API
  settings: {
    get: <T = any>(key: string): Promise<T> => ipcRenderer.invoke('settings:get', key),
    set: (key: string, value: any): Promise<boolean> => ipcRenderer.invoke('settings:set', key, value),
    getAll: (): Promise<Record<string, any>> => ipcRenderer.invoke('settings:get-all'),
    reset: (): Promise<boolean> => ipcRenderer.invoke('settings:reset'),
    delete: (key: string): Promise<boolean> => ipcRenderer.invoke('settings:delete', key)
  }
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
