// src/components/tools/SentryToolkit/stores/sentryStore.ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type {
  DSNHistory,
  EventTemplate,
  ReleaseTemplate,
  EventBuilderOptions,
  ReleaseConfig,
} from '../types'

interface SentryStore {
  // DSN 히스토리
  dsnHistory: DSNHistory[]
  addDSN: (dsn: string, alias?: string) => void
  removeDSN: (dsn: string) => void
  clearDSNHistory: () => void

  // 현재 선택된 DSN
  currentDSN: string | null
  setCurrentDSN: (dsn: string) => void

  // 이벤트 템플릿
  eventTemplates: EventTemplate[]
  saveEventTemplate: (name: string, config: EventBuilderOptions) => void
  loadEventTemplate: (name: string) => EventBuilderOptions | null
  deleteEventTemplate: (name: string) => void

  // 릴리스 템플릿
  releaseTemplates: ReleaseTemplate[]
  saveReleaseTemplate: (name: string, config: ReleaseConfig) => void
  loadReleaseTemplate: (name: string) => ReleaseConfig | null
  deleteReleaseTemplate: (name: string) => void

  // 설정
  settings: {
    maskPublicKey: boolean
    maxHistoryItems: number
    defaultEnvironment: string
  }
  updateSettings: (settings: Partial<SentryStore['settings']>) => void
}

export const useSentryStore = create<SentryStore>()(
  persist(
    (set, get) => ({
      // DSN 히스토리
      dsnHistory: [],
      addDSN: (dsn, alias) => {
        const { dsnHistory, settings } = get()
        const newEntry: DSNHistory = {
          dsn,
          timestamp: Date.now(),
          alias,
        }
        const updated = [newEntry, ...dsnHistory].slice(
          0,
          settings.maxHistoryItems
        )
        set({ dsnHistory: updated })
      },
      removeDSN: (dsn) => {
        const { dsnHistory } = get()
        set({ dsnHistory: dsnHistory.filter((h) => h.dsn !== dsn) })
      },
      clearDSNHistory: () => set({ dsnHistory: [] }),

      // 현재 선택된 DSN
      currentDSN: null,
      setCurrentDSN: (dsn) => set({ currentDSN: dsn }),

      // 이벤트 템플릿
      eventTemplates: [],
      saveEventTemplate: (name, config) => {
        const { eventTemplates } = get()
        const updated = [
          ...eventTemplates.filter((t) => t.name !== name),
          { name, config },
        ]
        set({ eventTemplates: updated })
      },
      loadEventTemplate: (name) => {
        const { eventTemplates } = get()
        return eventTemplates.find((t) => t.name === name)?.config || null
      },
      deleteEventTemplate: (name) => {
        const { eventTemplates } = get()
        set({ eventTemplates: eventTemplates.filter((t) => t.name !== name) })
      },

      // 릴리스 템플릿
      releaseTemplates: [],
      saveReleaseTemplate: (name, config) => {
        const { releaseTemplates } = get()
        const updated = [
          ...releaseTemplates.filter((t) => t.name !== name),
          { name, config },
        ]
        set({ releaseTemplates: updated })
      },
      loadReleaseTemplate: (name) => {
        const { releaseTemplates } = get()
        return releaseTemplates.find((t) => t.name === name)?.config || null
      },
      deleteReleaseTemplate: (name) => {
        const { releaseTemplates } = get()
        set({
          releaseTemplates: releaseTemplates.filter((t) => t.name !== name),
        })
      },

      // 설정
      settings: {
        maskPublicKey: false,
        maxHistoryItems: 10,
        defaultEnvironment: 'development',
      },
      updateSettings: (newSettings) => {
        const { settings } = get()
        set({ settings: { ...settings, ...newSettings } })
      },
    }),
    {
      name: 'sentry-toolkit-storage',
      partialize: (state) => ({
        dsnHistory: state.dsnHistory,
        eventTemplates: state.eventTemplates,
        releaseTemplates: state.releaseTemplates,
        settings: state.settings,
      }),
    }
  )
)
