import { StateCreator } from 'zustand'
import { Settings } from '../../common/types'
import { enrichRoutes, getStoredSetting, storeSetting } from '../../common/util'
import type { State } from './store'

export type SettingsSlice = {
  settings: Settings
  setSetting: (key: keyof Settings, value: number | undefined) => void
}

export const createSettingsSlice: StateCreator<State, [], [], SettingsSlice> = (
  set,
  get
) => ({
  settings: {
    height: getStoredSetting('height'),
    depth: getStoredSetting('depth'),
    speed: getStoredSetting('speed'),
    consumption: getStoredSetting('consumption'),
  },
  setSetting: (key, value) => {
    storeSetting(key, value)
    set((state) => {
      const settings = { ...state.settings, [key]: value }
      const routes = state.routes
      return {
        settings,
        routes: routes.length ? enrichRoutes(routes, settings) : routes,
      }
    })
    if (key === 'depth' || key === 'height') {
      get().fetchRoutes()
    }
  },
})
