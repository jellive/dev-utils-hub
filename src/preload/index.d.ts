import { ElectronAPI } from '@electron-toolkit/preload'

interface PlatformInfo {
  platform: NodeJS.Platform
  arch: string
  version: string
  versions: NodeJS.ProcessVersions
}

declare global {
  interface Window {
    electron: ElectronAPI
    api: {
      ping: () => Promise<string>
      getAppVersion: () => Promise<string>
      getPlatformInfo: () => Promise<PlatformInfo>
      settings: {
        get: <T = any>(key: string) => Promise<T>
        set: (key: string, value: any) => Promise<boolean>
        getAll: () => Promise<Record<string, any>>
        reset: () => Promise<boolean>
        delete: (key: string) => Promise<boolean>
      }
    }
  }
}
