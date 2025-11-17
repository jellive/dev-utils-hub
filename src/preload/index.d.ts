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
    }
  }
}
